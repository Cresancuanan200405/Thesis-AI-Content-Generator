<?php

namespace App\Services;

use App\Models\LegalAcceptance;
use App\Models\PendingOnboarding;
use App\Models\User;
use App\Notifications\WelcomeEmailNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use InvalidArgumentException;

class PendingOnboardingService
{
    public const SESSION_KEY = 'pending_onboarding_token';

    /**
     * Get the active pending onboarding instance from the request session.
     */
    public function getPendingOnboarding(Request $request): ?PendingOnboarding
    {
        $token = $request->session()->get(self::SESSION_KEY);

        if (! $token || ! is_string($token)) {
            return null;
        }

        $pending = PendingOnboarding::where('token', $token)->first();

        if (! $pending) {
            $request->session()->forget(self::SESSION_KEY);

            return null;
        }

        if ($pending->expires_at && now()->greaterThan($pending->expires_at)) {
            $pending->delete();
            $request->session()->forget(self::SESSION_KEY);

            return null;
        }

        return $pending;
    }

    /**
     * Start or update a pending onboarding process from a Google/social callback.
     *
     * @param  array{
     *     provider: string,
     *     socialId: string,
     *     email: string,
     *     displayName: string,
     *     avatar: ?string,
     *     username: string
     * }  $data
     */
    public function startFromSocial(array $data, Request $request): PendingOnboarding
    {
        $nameParts = $this->splitName($data['displayName']);

        $pending = PendingOnboarding::where('email', $data['email'])
            ->orWhere('token', $request->session()->get(self::SESSION_KEY))
            ->first();

        if (! $pending) {
            $pending = new PendingOnboarding([
                'token' => PendingOnboarding::generateToken(),
            ]);
        }

        $pending->fill([
            'registration_type' => $data['provider'],
            'provider_name' => $data['provider'],
            'provider_id' => $data['socialId'],
            'email' => $data['email'],
            'username' => $pending->username ?: $data['username'],
            'avatar' => $data['avatar'],
            'email_verified_at' => now(),
            'first_name' => $pending->first_name ?: ($nameParts['first_name'] ?? null),
            'last_name' => $pending->last_name ?: ($nameParts['last_name'] ?? null),
            'current_step' => 1,
            'expires_at' => now()->addDays(2),
        ]);

        $pending->save();

        $request->session()->put(self::SESSION_KEY, $pending->token);

        return $pending;
    }

    /**
     * Start a pending onboarding process from normal username/email + password registration.
     *
     * @param  array{
     *     username: string,
     *     email: string,
     *     password: string
     * }  $data
     */
    public function startFromRegistration(array $data, Request $request): PendingOnboarding
    {
        $normalizedEmail = strtolower(trim($data['email']));
        $normalizedUsername = strtolower(trim($data['username']));

        // Clean up any stale pending registration with this email
        PendingOnboarding::where('email', $normalizedEmail)->delete();

        $pending = new PendingOnboarding([
            'token' => PendingOnboarding::generateToken(),
            'registration_type' => 'normal',
            'email' => $normalizedEmail,
            'username' => $normalizedUsername,
            'password_hash' => Hash::make($data['password']),
            'current_step' => 1,
            'expires_at' => now()->addDays(2),
        ]);

        $pending->save();
        $pending->sendEmailVerificationNotification();

        $request->session()->put(self::SESSION_KEY, $pending->token);

        return $pending;
    }

    /**
     * Launch workspace: perform final validation and atomic database transaction.
     */
    public function launchWorkspace(PendingOnboarding $pending, Request $request): User
    {
        // 1. Server-side validation of full payload
        if (! $pending->isEmailVerified()) {
            throw new InvalidArgumentException('Email address must be verified before launching workspace.');
        }

        if (! $pending->hasCompletedPersonalInformation()) {
            throw new InvalidArgumentException('Personal information (first and last name) must be completed before launching workspace.');
        }

        if (! $pending->hasCompletedBusiness()) {
            throw new InvalidArgumentException('Business profile (name, industry, category) must be completed before launching workspace.');
        }

        if (! $pending->hasCompletedLegal()) {
            throw new InvalidArgumentException('All required legal, privacy, and content responsibility acknowledgments must be accepted.');
        }

        // Check if user already exists with this email or username
        if (User::where('email', $pending->email)->exists()) {
            throw new InvalidArgumentException('An account with this email address already exists.');
        }

        if ($pending->username && User::where('username', $pending->username)->exists()) {
            throw new InvalidArgumentException('An account with this username already exists.');
        }

        return DB::transaction(function () use ($pending, $request) {
            // 1. Create permanent users record
            $fullName = trim("{$pending->first_name} {$pending->last_name}");
            $user = User::create([
                'name' => $fullName !== '' ? $fullName : ($pending->username ?: 'MarketPilot User'),
                'username' => $pending->username ?: Str::slug($pending->first_name.'-'.Str::random(5)),
                'email' => $pending->email,
                'password' => $pending->password_hash ?? Hash::make(Str::random(32)),
                'first_name' => $pending->first_name,
                'middle_name' => $pending->middle_name,
                'last_name' => $pending->last_name,
                'suffix' => $pending->suffix,
                'mobile_number' => $pending->mobile_number,
                'provider_name' => $pending->provider_name,
                'provider_id' => $pending->provider_id,
                'avatar' => $pending->avatar,
                'email_verified_at' => $pending->email_verified_at ?? now(),
                'onboarding_completed' => true,
                'onboarding_completed_at' => now(),
            ]);

            // 2. Create permanent businesses record
            $user->business()->create([
                'name' => $pending->business_name,
                'industry' => $pending->industry,
                'category' => $pending->category,
                'description' => $pending->business_description ?? '',
                'business_address' => $pending->business_address,
                'barangay' => $pending->barangay,
                'city_municipality' => $pending->city_municipality,
                'province' => $pending->province,
                'region' => $pending->region,
                'registration_type' => $pending->registration_type_field,
                'registration_number' => $pending->registration_number,
                'business_permit_number' => $pending->business_permit_number,
                'registration_permit_date' => $pending->registration_permit_date,
                'business_registration_document_path' => $pending->business_registration_document_path,
            ]);

            // 3. Persist legal acceptance records
            $now = now();
            $acceptedTypes = $pending->accepted_legal_documents ?? [];
            foreach ($acceptedTypes as $type) {
                LegalAcceptance::create([
                    'user_id' => $user->id,
                    'document_type' => $type,
                    'document_version' => LegalDocumentService::CURRENT_VERSION,
                    'accepted_at' => $now,
                ]);
            }

            // 4. Clean up pending onboarding
            $pending->delete();
            $request->session()->forget(self::SESSION_KEY);

            // 5. Send welcome email notification
            try {
                $user->notify(new WelcomeEmailNotification);
            } catch (\Throwable $e) {
                Log::warning('Welcome email could not be sent after workspace launch: '.$e->getMessage());
            }

            return $user;
        });
    }

    /**
     * Split a full display name into first name and last name.
     *
     * @return array{first_name: ?string, last_name: ?string}
     */
    protected function splitName(string $name): array
    {
        $trimmed = trim($name);
        if ($trimmed === '') {
            return ['first_name' => null, 'last_name' => null];
        }

        $parts = explode(' ', $trimmed, 2);

        return [
            'first_name' => $parts[0] ?? null,
            'last_name' => $parts[1] ?? null,
        ];
    }
}
