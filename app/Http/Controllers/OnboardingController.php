<?php

namespace App\Http\Controllers;

use App\Http\Requests\Onboarding\SaveBusinessOnboardingRequest;
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

        $businessData = [
            'id' => $business?->id,
            'name' => $business ? $business->name : '',
            'industry' => $business ? $business->industry : '',
            'category' => $business ? $business->category : '',
            'description' => $business ? $business->description : '',
            'logo_path' => $business?->logo_path,
            'logo_url' => $business && $business->logo_path ? Storage::url($business->logo_path) : null,
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

    public function saveLogo(Request $request): RedirectResponse
    {
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
        ]);

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('business-logos', 'public');
            $business->update(['logo_path' => $path]);
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
