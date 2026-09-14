<?php

namespace App\Http\Controllers;

use App\Http\Requests\Onboarding\SaveBusinessOnboardingRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

        $businessData = [
            'id' => $business?->id,
            'name' => $business ? $business->name : '',
            'industry' => $business ? $business->industry : '',
            'category' => $business ? $business->category : '',
            'description' => $business ? $business->description : '',
            'main_business_activity' => $business?->main_business_activity,
            'business_address' => $business?->business_address,
            'barangay' => $business?->barangay,
            'city_municipality' => $business?->city_municipality,
            'province' => $business?->province,
            'region' => $business?->region,
            'business_contact_number' => $business?->business_contact_number,
            'business_email' => $business?->business_email,
            'website_social_page' => $business?->website_social_page,
            'registration_type' => $business?->registration_type,
            'registration_number' => $business?->registration_number,
            'business_permit_number' => $business?->business_permit_number,
            'registration_permit_date' => $business?->registration_permit_date?->format('Y-m-d'),
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

        $nextStep = $request->filled('description') ? 3 : 2;

        return redirect()->route('onboarding.show', ['step' => $nextStep]);
    }

    public function complete(Request $request): RedirectResponse
    {
        $user = $request->user();

        $user->business()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'user_id' => $user->id,
                'name' => $user->name ?: 'My Business',
                'industry' => 'General',
                'category' => 'General',
                'description' => '',
            ]
        );

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
