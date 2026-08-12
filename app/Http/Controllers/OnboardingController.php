<?php

namespace App\Http\Controllers;

use App\Http\Requests\Onboarding\SaveBrandOnboardingRequest;
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
        $brandKit = $business?->brandKit()->first();

        $contentStyle = $business?->content_style;
        if (is_string($contentStyle) && $contentStyle !== '') {
            $decodedContentStyle = json_decode($contentStyle, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decodedContentStyle)) {
                $contentStyle = $decodedContentStyle;
            }
        }

        $brandTone = $brandKit?->brand_tone;
        if (is_string($brandTone) && $brandTone !== '') {
            $decodedBrandTone = json_decode($brandTone, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decodedBrandTone)) {
                $brandTone = $decodedBrandTone;
            }
        }

        $businessData = [
            'id' => $business?->id,
            'name' => $business ? $business->name : '',
            'industry' => $business ? $business->industry : '',
            'category' => $business ? $business->category : '',
            'description' => $business ? $business->description : '',
            'target_audience' => $business ? $business->target_audience : '',
            'unique_selling_point' => $business ? $business->unique_selling_point : '',
            'content_style' => $contentStyle ?? [],
            'default_tagline_behavior' => $business ? $business->default_tagline_behavior : '',
        ];

        $brandData = [
            'logo_path' => $brandKit?->logo_path,
            'primary_color' => $brandKit ? $brandKit->primary_color : '#111827',
            'secondary_color' => $brandKit ? $brandKit->secondary_color : '#F59E0B',
            'accent_color' => $brandKit ? $brandKit->accent_color : '#E5E7EB',
            'brand_tone' => $brandTone ?? [],
            'typography' => $brandKit ? $brandKit->typography : '',
            'brand_guidelines' => $brandKit ? $brandKit->brand_guidelines : '',
            'visual_preferences' => $brandKit ? $brandKit->visual_preferences : '',
        ];

        return Inertia::render('onboarding/index', [
            'step' => (int) ($request->query('step', 1)),
            'business' => $businessData,
            'brand' => $brandData,
        ]);
    }

    public function saveBusiness(SaveBusinessOnboardingRequest $request): RedirectResponse
    {
        $user = $request->user();

        $user->business()->updateOrCreate(
            ['user_id' => $user->id],
            $request->validated()
        );

        return redirect()->route('onboarding.show', ['step' => 'brand']);
    }

    public function saveBrand(SaveBrandOnboardingRequest $request): RedirectResponse
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

        $brandData = $request->validated();

        if (isset($brandData['brand_tone'])) {
            $brandData['brand_tone'] = json_encode(array_values($brandData['brand_tone']));
        }

        if (isset($brandData['visual_preferences']) && is_string($brandData['visual_preferences'])) {
            $visualPreferences = $brandData['visual_preferences'];
            $brandData['visual_preferences'] = trim($visualPreferences);
        }

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('brand-logos', 'public');
            $brandData['logo_path'] = $path;
        }

        if ($request->input('remove_logo') === '1') {
            if ($business->brandKit && $business->brandKit->logo_path) {
                Storage::disk('public')->delete($business->brandKit->logo_path);
            }
            $brandData['logo_path'] = null;
        }

        $business->brandKit()->updateOrCreate(
            ['business_id' => $business->id],
            $brandData
        );

        return redirect()->route('onboarding.show', ['step' => 'preferences']);
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

        $business->update($payload);

        return redirect()->route('onboarding.show', ['step' => 'complete']);
    }

    public function complete(Request $request): RedirectResponse
    {
        $user = $request->user();

        $user->forceFill([
            'onboarding_completed' => true,
            'onboarding_completed_at' => now(),
        ])->save();

        return redirect()->route('dashboard');
    }
}
