<?php

namespace App\Http\Controllers;

use App\Http\Requests\Onboarding\SaveBusinessOnboardingRequest;
use App\Http\Requests\Onboarding\SavePersonalOnboardingRequest;
use App\Models\LegalAcceptance;
use App\Models\User;
use App\Services\LegalDocumentService;
use App\Services\PendingOnboardingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function __construct(
        protected PendingOnboardingService $pendingService
    ) {}

    public function show(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        $pending = $this->pendingService->getPendingOnboarding($request);

        if (! $user && ! $pending) {
            return redirect()->route('login');
        }

        if ($user) {
            if (! $user->hasVerifiedEmail()) {
                return redirect()->route('verification.notice');
            }

            if ($user->onboarding_completed) {
                return redirect()->route('dashboard');
            }

            $business = $user->business()->first();

            $personalData = [
                'first_name' => $user->first_name ?? '',
                'middle_name' => $user->middle_name ?? '',
                'last_name' => $user->last_name ?? '',
                'suffix' => $user->suffix ?? '',
                'mobile_number' => $user->mobile_number ?? '',
                'email' => $user->email,
                'is_social' => ! empty($user->provider_name),
                'is_google' => $user->provider_name === 'google',
            ];

            $businessData = [
                'id' => $business?->id,
                'name' => $business ? $business->name : '',
                'industry' => $business ? $business->industry : '',
                'category' => $business ? $business->category : '',
                'description' => $business ? $business->description : '',
                'business_address' => $business?->business_address,
                'barangay' => $business?->barangay,
                'city_municipality' => $business?->city_municipality,
                'province' => $business?->province,
                'region' => $business?->region,
                'registration_type' => $business?->registration_type,
                'registration_number' => $business?->registration_number,
                'business_permit_number' => $business?->business_permit_number,
                'registration_permit_date' => $business?->registration_permit_date?->format('Y-m-d'),
                'business_registration_document_path' => $business?->business_registration_document_path,
            ];

            $acceptedTypes = $user->legalAcceptances()
                ->where('document_version', LegalDocumentService::CURRENT_VERSION)
                ->pluck('document_type')
                ->toArray();
        } else {
            if (! $pending->isEmailVerified()) {
                return redirect()->route('verification.notice');
            }

            $personalData = [
                'first_name' => $pending->first_name ?? '',
                'middle_name' => $pending->middle_name ?? '',
                'last_name' => $pending->last_name ?? '',
                'suffix' => $pending->suffix ?? '',
                'mobile_number' => $pending->mobile_number ?? '',
                'email' => $pending->email,
                'is_social' => ! empty($pending->provider_name),
                'is_google' => $pending->provider_name === 'google',
            ];

            $businessData = [
                'id' => null,
                'name' => $pending->business_name ?? '',
                'industry' => $pending->industry ?? '',
                'category' => $pending->category ?? '',
                'description' => $pending->business_description ?? '',
                'business_address' => $pending->business_address,
                'barangay' => $pending->barangay,
                'city_municipality' => $pending->city_municipality,
                'province' => $pending->province,
                'region' => $pending->region,
                'registration_type' => $pending->registration_type_field,
                'registration_number' => $pending->registration_number,
                'business_permit_number' => $pending->business_permit_number,
                'registration_permit_date' => $pending->registration_permit_date?->format('Y-m-d'),
                'business_registration_document_path' => $pending->business_registration_document_path,
            ];

            $acceptedTypes = $pending->accepted_legal_documents ?? [];
        }

        return Inertia::render('onboarding/index', [
            'step' => (int) ($request->query('step', 1)),
            'personal' => $personalData,
            'business' => $businessData,
            'legalDocuments' => LegalDocumentService::getDocuments(),
            'acceptedLegalDocuments' => $acceptedTypes,
        ]);
    }

    public function savePersonal(SavePersonalOnboardingRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $user = $request->user();
        $pending = $this->pendingService->getPendingOnboarding($request);

        if ($user) {
            if ($user->provider_name === 'google') {
                $validated['first_name'] = $user->first_name;
                $validated['last_name'] = $user->last_name;
                $validated['suffix'] = $user->suffix;
            }

            $fullName = trim("{$validated['first_name']} {$validated['last_name']}");
            $user->forceFill([
                'name' => $fullName !== '' ? $fullName : $user->name,
                'first_name' => $validated['first_name'],
                'middle_name' => $validated['middle_name'] ?? null,
                'last_name' => $validated['last_name'],
                'suffix' => $validated['suffix'] ?? null,
                'mobile_number' => $validated['mobile_number'] ?? null,
            ])->save();
        } elseif ($pending) {
            if ($pending->provider_name === 'google') {
                $validated['first_name'] = $pending->first_name;
                $validated['last_name'] = $pending->last_name;
                $validated['suffix'] = $pending->suffix;
            }

            $pending->forceFill([
                'first_name' => $validated['first_name'],
                'middle_name' => $validated['middle_name'] ?? null,
                'last_name' => $validated['last_name'],
                'suffix' => $validated['suffix'] ?? null,
                'mobile_number' => $validated['mobile_number'] ?? null,
                'current_step' => max($pending->current_step, 2),
            ])->save();
        } else {
            return redirect()->route('login');
        }

        return redirect()->route('onboarding.show', ['step' => 2]);
    }

    public function saveBusiness(SaveBusinessOnboardingRequest $request): RedirectResponse
    {
        $user = $request->user();
        $pending = $this->pendingService->getPendingOnboarding($request);

        if (! $user && ! $pending) {
            return redirect()->route('login');
        }

        $validated = $request->validated();

        $legalFields = [
            'terms_of_service',
            'privacy_notice',
            'content_ip_responsibility',
            'ai_content_responsibility',
        ];

        $legalAcceptanceFlags = [];
        foreach ($legalFields as $field) {
            if (array_key_exists($field, $validated)) {
                $legalAcceptanceFlags[$field] = (bool) $validated[$field];
                unset($validated[$field]);
            }
        }

        // File upload handling
        $documentPath = null;
        if ($request->hasFile('business_registration_document')) {
            $file = $request->file('business_registration_document');
            if ($user) {
                $existingBusiness = $user->business;
                if ($existingBusiness?->business_registration_document_path && Storage::disk('local')->exists($existingBusiness->business_registration_document_path)) {
                    Storage::disk('local')->delete($existingBusiness->business_registration_document_path);
                }
                $documentPath = $file->store('business-documents', 'local');
            } elseif ($pending) {
                if ($pending->business_registration_document_path && Storage::disk('local')->exists($pending->business_registration_document_path)) {
                    Storage::disk('local')->delete($pending->business_registration_document_path);
                }
                $documentPath = $file->store('pending-documents', 'local');
            }
            $validated['business_registration_document_path'] = $documentPath;
        }
        unset($validated['business_registration_document']);

        $subStep = $request->input('sub_step');
        unset($validated['sub_step']);

        if ($user) {
            DB::transaction(function () use ($user, $validated, $legalAcceptanceFlags) {
                $user->business()->updateOrCreate(
                    ['user_id' => $user->id],
                    $validated
                );

                if (! empty($legalAcceptanceFlags)) {
                    $now = now();
                    $requiredTypes = LegalDocumentService::getRequiredDocumentTypes();

                    foreach ($requiredTypes as $type) {
                        if (! empty($legalAcceptanceFlags[$type])) {
                            LegalAcceptance::firstOrCreate(
                                [
                                    'user_id' => $user->id,
                                    'document_type' => $type,
                                    'document_version' => LegalDocumentService::CURRENT_VERSION,
                                ],
                                [
                                    'accepted_at' => $now,
                                ]
                            );
                        }
                    }
                }
            });
        } elseif ($pending) {
            $acceptedTypes = $pending->accepted_legal_documents ?? [];
            foreach ($legalAcceptanceFlags as $type => $isAccepted) {
                if ($isAccepted && ! in_array($type, $acceptedTypes, true)) {
                    $acceptedTypes[] = $type;
                }
            }

            $pending->forceFill([
                'business_name' => $validated['name'] ?? $pending->business_name,
                'industry' => $validated['industry'] ?? $pending->industry,
                'category' => $validated['category'] ?? $pending->category,
                'business_description' => array_key_exists('description', $validated) ? $validated['description'] : $pending->business_description,
                'business_address' => array_key_exists('business_address', $validated) ? $validated['business_address'] : $pending->business_address,
                'barangay' => array_key_exists('barangay', $validated) ? $validated['barangay'] : $pending->barangay,
                'city_municipality' => array_key_exists('city_municipality', $validated) ? $validated['city_municipality'] : $pending->city_municipality,
                'province' => array_key_exists('province', $validated) ? $validated['province'] : $pending->province,
                'region' => array_key_exists('region', $validated) ? $validated['region'] : $pending->region,
                'registration_type_field' => array_key_exists('registration_type', $validated) ? $validated['registration_type'] : $pending->registration_type_field,
                'registration_number' => array_key_exists('registration_number', $validated) ? $validated['registration_number'] : $pending->registration_number,
                'business_permit_number' => array_key_exists('business_permit_number', $validated) ? $validated['business_permit_number'] : $pending->business_permit_number,
                'registration_permit_date' => array_key_exists('registration_permit_date', $validated) ? $validated['registration_permit_date'] : $pending->registration_permit_date,
                'business_registration_document_path' => $validated['business_registration_document_path'] ?? $pending->business_registration_document_path,
                'accepted_legal_documents' => $acceptedTypes,
                'current_step' => max($pending->current_step, $subStep ? 3 : ($request->filled('description') ? 4 : 3)),
            ])->save();
        }

        // If sub-step 1 or 2: stay on step 3.
        // If step 2 (basic business info): next is step 3 (About).
        // If step 3 final submission (with description or address or legal agreements): next is step 4 (Launch).
        if ($subStep) {
            $nextStep = 3;
        } else {
            $isAboutSubmission = $request->filled('description') || $request->filled('business_address') || ! empty($legalAcceptanceFlags);
            $nextStep = $isAboutSubmission ? 4 : 3;
        }

        return redirect()->route('onboarding.show', ['step' => $nextStep]);
    }

    public function complete(Request $request): RedirectResponse
    {
        $user = $request->user();
        $pending = $this->pendingService->getPendingOnboarding($request);

        if (! $user && ! $pending) {
            return redirect()->route('login');
        }

        if ($pending) {
            // Atomic creation of permanent User, Business, LegalAcceptance records
            $newUser = $this->pendingService->launchWorkspace($pending, $request);

            Auth::login($newUser, true);
            $request->session()->regenerate();

            return redirect()->route('dashboard')
                ->with('success', 'Workspace launched successfully.')
                ->with('toast', [
                    'type' => 'success',
                    'message' => 'Workspace launched successfully.',
                ]);
        }

        // Existing permanent user finishing onboarding
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
