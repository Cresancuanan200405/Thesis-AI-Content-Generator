<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateBrandKitRequest;
use App\Models\BrandKit;
use App\Models\Business;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BrandKitController extends Controller
{
    public function edit(Request $request): Response
    {
        /** @var User|null $user */
        $user = $request->user();
        /** @var Business|null $business */
        $business = $user?->business()->first();

        if (! $business) {
            return Inertia::render('brand-kit/index', [
                'business' => null,
                'brand' => $this->emptyBrandData(),
                'brand_kit' => null,
            ]);
        }

        $brandKit = $business->brandKit()->first();
        $this->authorize('view', $brandKit ?? new BrandKit(['business_id' => $business->id]));

        return Inertia::render('brand-kit/index', [
            'business' => [
                'id' => $business->id,
                'name' => $business->name,
            ],
            'brand' => [
                'logo_path' => $brandKit?->logo_path,
                'logo_url' => $brandKit?->logo_path ? asset('storage/'.$brandKit->logo_path) : null,
                'primary_color' => $brandKit ? ($brandKit->primary_color ?? '#111827') : '#111827',
                'secondary_color' => $brandKit ? ($brandKit->secondary_color ?? '#F59E0B') : '#F59E0B',
                'accent_color' => $brandKit ? ($brandKit->accent_color ?? '#E5E7EB') : '#E5E7EB',
                'brand_tone' => $brandKit ? $this->decodeJsonList($brandKit->brand_tone) : [],
                'typography' => $brandKit ? ($brandKit->typography ?? 'Modern Sans') : 'Modern Sans',
                'brand_guidelines' => $brandKit ? ($brandKit->brand_guidelines ?? '') : '',
                'visual_preferences' => $brandKit ? ($brandKit->visual_preferences ?? '') : '',
            ],
            'brand_kit' => $brandKit ? [
                'id' => $brandKit->id,
            ] : null,
        ]);
    }

    public function update(UpdateBrandKitRequest $request): RedirectResponse
    {
        $user = $request->user();
        /** @var Business $business */
        $business = $user?->business()->firstOrFail();
        $brandKit = $business->brandKit()->first();

        if ($brandKit) {
            $this->authorize('update', $brandKit);
        } else {
            $brandKit = new BrandKit(['business_id' => $business->id]);
            $this->authorize('create', BrandKit::class);
        }

        $data = $request->validated();

        if (isset($data['brand_tone'])) {
            $data['brand_tone'] = json_encode(array_values($data['brand_tone']));
        }

        if (isset($data['visual_preferences']) && is_array($data['visual_preferences'])) {
            $data['visual_preferences'] = json_encode(array_values($data['visual_preferences']));
        }

        if ($request->hasFile('logo')) {
            $newPath = $request->file('logo')->store('brand-logos', 'public');
            $data['logo_path'] = $newPath;

            if ($brandKit->logo_path && $brandKit->logo_path !== $newPath && Storage::disk('public')->exists($brandKit->logo_path)) {
                Storage::disk('public')->delete($brandKit->logo_path);
            }
        }

        if ($request->boolean('remove_logo')) {
            if ($brandKit->logo_path && Storage::disk('public')->exists($brandKit->logo_path)) {
                Storage::disk('public')->delete($brandKit->logo_path);
            }
            $data['logo_path'] = null;
        }

        $brandKit->fill($data);
        $brandKit->business_id = $business->id;
        $brandKit->save();

        return redirect()->route('brand-kit.edit')->with('success', 'Brand Kit saved successfully.');
    }

    /**
     * @return string[]
     */
    protected function decodeJsonList(mixed $value): array
    {
        if (is_array($value)) {
            return array_values($value);
        }

        if (is_string($value) && $value !== '') {
            $decoded = json_decode($value, true);

            if (is_array($decoded)) {
                return array_values($decoded);
            }

            return [$value];
        }

        return [];
    }

    /**
     * @return array<string, mixed>
     */
    protected function emptyBrandData(): array
    {
        return [
            'logo_path' => null,
            'logo_url' => null,
            'primary_color' => '#111827',
            'secondary_color' => '#F59E0B',
            'accent_color' => '#E5E7EB',
            'brand_tone' => [],
            'typography' => 'Modern Sans',
            'brand_guidelines' => '',
            'visual_preferences' => '',
        ];
    }
}
