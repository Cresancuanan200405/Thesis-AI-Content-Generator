<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateBusinessProfileRequest;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class UserProfileController extends Controller
{
    /**
     * Display the authenticated user's profile and onboarding business details.
     */
    public function show(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $user->load('business');

        $business = $user->business;

        // Determine social auth provider if any
        $provider = $user->provider_name ? ucfirst($user->provider_name) : 'Email & Password';

        // Calculate setup completeness percentage
        $checks = [
            'name' => ! empty($business?->name) && $business?->name !== 'My Business' && $business?->name !== 'Not specified',
            'industry' => ! empty($business?->industry) && $business?->industry !== 'General',
            'category' => ! empty($business?->category) && $business?->category !== 'General',
            'description' => ! empty($business?->description),
            'logo' => ! empty($business?->logo_path),
        ];
        $completedChecks = count(array_filter($checks));
        $setupCompleteness = (int) round(($completedChecks / count($checks)) * 100);

        return Inertia::render('profile/show', [
            'profile' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'email_verified' => (bool) $user->hasVerifiedEmail(),
                'email_verified_at' => $user->email_verified_at?->format('M j, Y'),
                'provider' => $provider,
                'role' => 'Workspace Admin',
                'account_status' => 'Active',
                'created_at' => $user->created_at?->format('M j, Y'),
                'member_since' => $user->created_at?->format('F Y'),
                'two_factor_enabled' => (bool) $user->two_factor_confirmed_at,
            ],
            'business' => [
                'id' => $business?->id,
                'name' => $business->name ?? 'Not specified',
                'industry' => $business->industry ?? 'General',
                'category' => $business->category ?? 'General',
                'description' => $business?->description,
                'logo_url' => $business?->logo_path ? Storage::url($business->logo_path) : null,
                'created_at' => $business?->created_at?->format('M j, Y'),
                'setup_completeness' => $setupCompleteness,
                'checklist' => $checks,
            ],
            'stats' => [
                'products_count' => $business?->products()->count() ?? 0,
                'campaigns_count' => $user->campaigns()->count(),
                'active_campaigns_count' => $user->campaigns()->where('status', '!=', 'completed')->count(),
                'completed_campaigns_count' => $user->campaigns()->where('status', 'completed')->count(),
                'designs_count' => $user->designs()->count(),
                'latest_design_at' => $user->designs()->latest()->first()?->created_at?->diffForHumans() ?? 'None yet',
                'latest_campaign_at' => $user->campaigns()->latest()->first()?->created_at?->diffForHumans() ?? 'None yet',
            ],
        ]);
    }

    /**
     * Update the authenticated user's business identity and setup configuration.
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
                'industry' => 'General',
                'category' => 'General',
                'description' => '',
            ]
        );

        $validated = $request->validated();

        if ($request->boolean('remove_logo')) {
            if ($business->logo_path && Storage::disk('public')->exists($business->logo_path)) {
                Storage::disk('public')->delete($business->logo_path);
            }
            $business->logo_path = null;
        }

        if ($request->hasFile('logo')) {
            if ($business->logo_path && Storage::disk('public')->exists($business->logo_path)) {
                Storage::disk('public')->delete($business->logo_path);
            }
            $path = $request->file('logo')->store('business-logos', 'public');
            $business->logo_path = $path;
        }

        unset($validated['logo'], $validated['remove_logo']);

        $business->update($validated);

        NotificationService::notify(
            $user,
            'business_updated',
            'Business Profile Updated',
            'Your business identity was successfully updated.',
            route('profile.show')
        );

        return to_route('profile.show')->with('success', 'Business identity updated successfully.');
    }
}
