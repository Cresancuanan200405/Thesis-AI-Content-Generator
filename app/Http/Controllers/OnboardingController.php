<?php

namespace App\Http\Controllers;

use App\Http\Requests\Onboarding\SaveBusinessOnboardingRequest;
use App\Http\Requests\Onboarding\SaveMarketingPreferencesRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        if (! $user->hasVerifiedEmail()) {
            return redirect()->route('verification.notice');
        }

        if ($user->onboarding_completed) {
            return redirect()->route('dashboard');
        }

        $business = $user->business()->first();

        $contentStyle = $business?->content_style;
        if (is_string($contentStyle) && $contentStyle !== '') {
            $decodedContentStyle = json_decode($contentStyle, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decodedContentStyle)) {
                $contentStyle = $decodedContentStyle;
            }
        }

        $businessData = [
            'id' => $business?->id,
            'name' => $business ? $business->name : '',
            'industry' => $business ? $business->industry : '',
            'category' => $business ? $business->category : '',
            'description' => $business ? $business->description : '',
            'logo_path' => $business?->logo_path,
            'logo_url' => $business && $business->logo_path ? Storage::url($business->logo_path) : null,
            'target_audience' => $business ? $business->target_audience : '',
            'unique_selling_point' => $business ? $business->unique_selling_point : '',
            'content_style' => $contentStyle ?? [],
            'default_tagline_behavior' => $business ? $business->default_tagline_behavior : '',
        ];

        return Inertia::render('onboarding/index', [
            'step' => (int) ($request->query('step', 1)),
            'business' => $businessData,
        ]);
    }

    public function saveBusiness(SaveBusinessOnboardingRequest $request): RedirectResponse
    {
        $user = $request->user();

        $user->business()->updateOrCreate(
            ['user_id' => $user->id],
            $request->validated()
        );

        return redirect()->route('onboarding.show', ['step' => 2]);
    }

    public function savePreferences(SaveMarketingPreferencesRequest $request): RedirectResponse
    {
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

        $payload = $request->validated();

        if (isset($payload['content_style'])) {
            $payload['content_style'] = json_encode(array_values($payload['content_style']));
        }

        if (isset($payload['marketing_preferences'])) {
            $payload['marketing_preferences'] = json_encode(array_values($payload['marketing_preferences']));
        }

        $business->update($payload);

        return redirect()->route('onboarding.show', ['step' => 4]);
    }

    public function saveLogo(Request $request): RedirectResponse
    {
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

        $request->validate([
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,gif,svg', 'max:2048'],
            'marketing_preferences' => ['nullable'],
        ]);

        $payload = [];

        if ($request->has('marketing_preferences')) {
            $marketingPreferences = $request->input('marketing_preferences');

            if (is_string($marketingPreferences)) {
                $marketingPreferences = json_decode($marketingPreferences, true) ?? [];
            }

            $payload['marketing_preferences'] = json_encode(array_values((array) $marketingPreferences));
        }

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('business-logos', 'public');
            $payload['logo_path'] = $path;
        }

        if ($payload !== []) {
            $business->update($payload);
        }

        return $this->complete($request);
    }

    public function complete(Request $request): RedirectResponse
    {
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

        $request->validate([
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,gif,svg', 'max:2048'],
            'marketing_preferences' => ['nullable'],
        ]);

        $payload = [];

        if ($request->has('marketing_preferences')) {
            $marketingPreferences = $request->input('marketing_preferences');

            if (is_string($marketingPreferences)) {
                $marketingPreferences = json_decode($marketingPreferences, true) ?? [];
            }

            $payload['marketing_preferences'] = json_encode(array_values((array) $marketingPreferences));
        }

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('business-logos', 'public');
            $payload['logo_path'] = $path;
        }

        if ($payload !== []) {
            $business->update($payload);
        }

        $user->forceFill([
            'onboarding_completed' => true,
            'onboarding_completed_at' => now(),
        ])->save();

        return redirect()->route('dashboard')
            ->with('success', 'Setup completed successfully.')
            ->with('toast', [
                'type' => 'success',
                'message' => 'Setup completed successfully.',
            ]);
    }
}
