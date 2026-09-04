<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateBusinessProfileRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserProfileController extends Controller
{
    /**
     * Display the authenticated user's personal profile and account overview ("My Profile").
     */
    public function show(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $user->load('business');

        $provider = $user->provider_name ? ucfirst($user->provider_name) : 'Email & Password';

        return Inertia::render('profile/my-profile', [
            'profile' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'email_verified' => (bool) $user->hasVerifiedEmail(),
                'email_verified_at' => $user->email_verified_at?->format('M j, Y'),
                'provider' => $provider,
                'role' => 'Workspace Owner',
                'account_status' => 'Active',
                'created_at' => $user->created_at?->format('M j, Y'),
                'member_since' => $user->created_at?->format('F Y'),
                'two_factor_enabled' => (bool) $user->two_factor_confirmed_at,
            ],
            'business' => [
                'id' => $user->business?->id,
                'name' => $user->business->name ?? 'Not configured',
                'industry' => $user->business->industry ?? 'General',
                'category' => $user->business->category ?? 'General',
                'description' => $user->business?->description,
            ],
            'stats' => [
                'products_count' => $user->business?->products()->count() ?? 0,
                'campaigns_count' => $user->campaigns()->count(),
                'designs_count' => $user->designs()->count(),
            ],
        ]);
    }

    /**
     * Display the persistent Business Profile ("Business Profile") used for image generation.
     */
    public function showBusiness(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $user->load('business');

        $business = $user->business;

        return Inertia::render('profile/business', [
            'profile' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'email_verified' => (bool) $user->hasVerifiedEmail(),
                'member_since' => $user->created_at?->format('F Y'),
            ],
            'business' => [
                'id' => $business?->id,
                'name' => $business->name ?? 'Not specified',
                'industry' => $business->industry ?? 'Food & Beverage',
                'category' => $business->category ?? 'Restaurant',
                'description' => $business?->description,
                'created_at' => $business?->created_at?->format('M j, Y'),
            ],
        ]);
    }

    /**
     * Update the authenticated user's persistent business identity.
     */
    public function updateBusiness(UpdateBusinessProfileRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $business = $user->business()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'user_id' => $user->id,
                'name' => $user->name ?: 'My Business',
                'industry' => 'Food & Beverage',
                'category' => 'Restaurant',
                'description' => '',
            ]
        );

        $validated = $request->validated();
        $business->update($validated);

        return back()->with('success', 'Business profile updated successfully.');
    }
}
