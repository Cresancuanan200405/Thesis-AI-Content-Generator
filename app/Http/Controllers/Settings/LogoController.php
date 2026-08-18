<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class LogoController extends Controller
{
    public function edit(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        /** @var Business|null $business */
        $business = $user->business()->first();

        return Inertia::render('settings/logo', [
            'business' => $business ? [
                'id' => $business->id,
                'name' => $business->name,
                'logo_path' => $business->logo_path,
                'logo_url' => $business->logo_path ? asset('storage/'.$business->logo_path) : null,
            ] : null,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $request->validate([
            'logo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp,gif,svg', 'max:5120'],
        ]);

        /** @var Business $business */
        $business = $user->business()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'name' => ($user->name ?: 'My').' Business',
                'industry' => 'General',
                'category' => 'General',
                'description' => '',
            ]
        );

        if ($business->logo_path && Storage::disk('public')->exists($business->logo_path)) {
            Storage::disk('public')->delete($business->logo_path);
        }

        $path = $request->file('logo')->store('business-logos', 'public');
        $business->update(['logo_path' => $path]);

        return to_route('logo.edit')->with('success', 'Brand logo updated successfully.');
    }

    public function destroy(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        /** @var Business|null $business */
        $business = $user->business()->first();

        if ($business && $business->logo_path) {
            if (Storage::disk('public')->exists($business->logo_path)) {
                Storage::disk('public')->delete($business->logo_path);
            }
            $business->update(['logo_path' => null]);
        }

        return to_route('logo.edit')->with('success', 'Brand logo removed successfully.');
    }
}
