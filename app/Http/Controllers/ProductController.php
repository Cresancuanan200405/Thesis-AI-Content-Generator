<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use App\Services\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $query = $request->user()->business()->firstOrFail()->products()->latest('updated_at');

        $search = (string) $request->string('search')->trim();

        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('price', 'like', "%{$search}%");
            });
        }

        $products = $query->get();

        return Inertia::render('products/index', [
            'products' => $products->map(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $product->description,
                'price' => $product->price,
                'image_path' => $product->image_path,
                'image_url' => $product->image_path ? asset('storage/'.$product->image_path) : null,
                'created_at' => $product->created_at?->format('M j, Y'),
                'edit_url' => route('products.edit', $product),
                'show_url' => route('products.show', $product),
            ])->values()->all(),
            'filters' => [
                'search' => $search,
            ],
            'count' => $products->count(),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', Product::class);

        return Inertia::render('products/create', [
            'product' => null,
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        $user = $request->user();
        $business = $user->business()->firstOrFail();

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('products/images', 'public');
        }

        $name = trim((string) $request->input('name'));
        if ($name === '') {
            $name = 'Untitled Product';
        }

        $product = $business->products()->create([
            'name' => $name,
            'description' => $request->input('description'),
            'price' => $request->input('price') !== null && $request->input('price') !== '' ? $request->input('price') : null,
            'image_path' => $imagePath,
        ]);

        NotificationService::notify(
            $user,
            'product_created',
            "Product Created: {$product->name}",
            "New product \"{$product->name}\" was successfully added to your catalog.",
            route('products.show', $product)
        );

        return redirect()->route('products.index')->with('success', 'Product created successfully.');
    }

    public function show(Product $product): Response
    {
        $this->authorize('view', $product);

        $product->load(['business', 'designs']);

        return Inertia::render('products/show', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $product->description,
                'price' => $product->price,
                'image_path' => $product->image_path,
                'image_url' => $product->image_path ? asset('storage/'.$product->image_path) : null,
                'business_name' => $product->business?->name,
                'created_at' => $product->created_at?->format('M j, Y'),
                'designs' => $product->designs->map(fn ($design) => [
                    'id' => $design->id,
                    'product_name' => $design->product_name,
                    'status' => $design->status,
                    'image_url' => $design->generated_image_path ? asset('storage/'.$design->generated_image_path) : null,
                ])->values()->all(),
            ],
        ]);
    }

    public function edit(Product $product): Response
    {
        $this->authorize('update', $product);

        return Inertia::render('products/edit', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $product->description,
                'price' => $product->price,
                'image_path' => $product->image_path,
                'image_url' => $product->image_path ? asset('storage/'.$product->image_path) : null,
            ],
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $this->authorize('update', $product);

        $imagePath = $product->image_path;

        if ($request->hasFile('image')) {
            if ($product->image_path && Storage::disk('public')->exists($product->image_path)) {
                Storage::disk('public')->delete($product->image_path);
            }
            $imagePath = $request->file('image')->store('products/images', 'public');
        } elseif ($request->boolean('remove_image')) {
            if ($product->image_path && Storage::disk('public')->exists($product->image_path)) {
                Storage::disk('public')->delete($product->image_path);
            }
            $imagePath = null;
        }

        $name = $product->name;
        if ($request->has('name')) {
            $trimmed = trim((string) $request->input('name'));
            $name = $trimmed !== '' ? $trimmed : 'Untitled Product';
        }

        $product->update([
            'name' => $name,
            'description' => $request->input('description', $product->description),
            'price' => $request->has('price') ? ($request->input('price') !== '' ? $request->input('price') : null) : $product->price,
            'image_path' => $imagePath,
        ]);

        if ($user = $request->user()) {
            NotificationService::notify(
                $user,
                'product_updated',
                "Product Updated: {$product->name}",
                "Product details for \"{$product->name}\" were updated.",
                route('products.show', $product)
            );
        }

        return redirect()->route('products.index')->with('success', 'Product updated successfully.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $this->authorize('delete', $product);

        $user = auth()->user();
        $productName = $product->name;

        if ($product->image_path && Storage::disk('public')->exists($product->image_path)) {
            Storage::disk('public')->delete($product->image_path);
        }

        $product->delete();

        if ($user) {
            NotificationService::notify(
                $user,
                'product_deleted',
                "Product Deleted: {$productName}",
                "Product \"{$productName}\" was removed from your catalog.",
                route('products.index')
            );
        }

        return redirect()->route('products.index')->with('success', 'Product deleted successfully.');
    }

    public function bulkDestroy(Request $request): RedirectResponse
    {
        $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $user = $request->user();
        $business = $user->business()->firstOrFail();
        $products = $business->products()->whereIn('id', $request->input('ids'))->get();
        $count = $products->count();

        if ($count === 0) {
            return redirect()->route('products.index')->with('info', 'No products were selected for deletion.');
        }

        foreach ($products as $product) {
            if ($product->image_path && Storage::disk('public')->exists($product->image_path)) {
                Storage::disk('public')->delete($product->image_path);
            }
            $product->delete();
        }

        NotificationService::notify(
            $user,
            'product_deleted',
            "Bulk Delete: {$count} Products",
            "Successfully removed {$count} products from your catalog.",
            route('products.index')
        );

        return redirect()->route('products.index')->with('success', "{$count} products deleted successfully.");
    }
}
