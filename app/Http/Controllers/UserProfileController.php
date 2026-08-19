<?php

namespace App\Http\Controllers;

use App\Models\User;
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

        $contentStyle = $business?->content_style;
        if (is_string($contentStyle) && $contentStyle !== '') {
            $decoded = json_decode($contentStyle, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $contentStyle = $decoded;
            }
        }

        $marketingPreferences = $business?->marketing_preferences;
        if (is_string($marketingPreferences) && $marketingPreferences !== '') {
            $decoded = json_decode($marketingPreferences, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $marketingPreferences = $decoded;
            }
        }

        // Determine social auth provider if any
        $provider = $user->provider_name ? ucfirst($user->provider_name) : 'Email & Password';

        return Inertia::render('profile/show', [
            'profile' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'email_verified' => (bool) $user->hasVerifiedEmail(),
                'email_verified_at' => $user->email_verified_at?->format('M j, Y'),
                'provider' => $provider,
                'created_at' => $user->created_at?->format('M j, Y'),
                'member_since' => $user->created_at?->format('F Y'),
                'two_factor_enabled' => (bool) $user->two_factor_confirmed_at,
            ],
            'business' => [
                'id' => $business?->id,
                'name' => $business?->name ?? 'Not specified',
                'industry' => $business?->industry ?? 'General',
                'category' => $business?->category ?? 'General',
                'description' => $business?->description,
                'target_audience' => $business?->target_audience,
                'unique_selling_point' => $business?->unique_selling_point,
                'content_style' => is_array($contentStyle) ? $contentStyle : [],
                'default_tagline_behavior' => $business?->default_tagline_behavior ?? 'ai',
                'marketing_preferences' => is_array($marketingPreferences) ? $marketingPreferences : [],
                'logo_url' => $business?->logo_path ? Storage::url($business->logo_path) : null,
                'created_at' => $business?->created_at?->format('M j, Y'),
            ],
            'stats' => [
                'products_count' => $business?->products()->count() ?? 0,
                'campaigns_count' => $user->campaigns()->count(),
                'designs_count' => $user->designs()->count(),
            ],
        ]);
    }
}
