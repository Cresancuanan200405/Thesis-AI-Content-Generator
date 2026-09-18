<?php

namespace App\Models;

use App\Notifications\VerifyEmailNotification;
use App\Services\LegalDocumentService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PendingOnboarding extends Model
{
    use HasFactory, Notifiable;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'token',
        'registration_type',
        'email',
        'username',
        'password_hash',
        'provider_name',
        'provider_id',
        'avatar',
        'email_verification_code',
        'email_verification_expires_at',
        'email_verified_at',
        'first_name',
        'middle_name',
        'last_name',
        'suffix',
        'mobile_number',
        'business_name',
        'industry',
        'category',
        'business_description',
        'business_address',
        'barangay',
        'city_municipality',
        'province',
        'region',
        'registration_type_field',
        'registration_number',
        'business_permit_number',
        'registration_permit_date',
        'business_registration_document_path',
        'accepted_legal_documents',
        'current_step',
        'expires_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verification_expires_at' => 'datetime',
            'email_verified_at' => 'datetime',
            'registration_permit_date' => 'date',
            'accepted_legal_documents' => 'array',
            'expires_at' => 'datetime',
        ];
    }

    /**
     * Route notifications for the mail channel.
     */
    public function routeNotificationForMail(): string
    {
        return $this->email;
    }

    /**
     * Generate a new unique token for session binding.
     */
    public static function generateToken(): string
    {
        return Str::random(64);
    }

    /**
     * Generate and save a 6-digit email verification code.
     */
    public function generateEmailVerificationCode(): string
    {
        $code = (string) random_int(100000, 999999);

        $this->forceFill([
            'email_verification_code' => $code,
            'email_verification_expires_at' => now()->addMinutes(15),
        ])->save();

        return $code;
    }

    /**
     * Send email verification notification.
     */
    public function sendEmailVerificationNotification(): void
    {
        $this->generateEmailVerificationCode();

        try {
            $this->notify(new VerifyEmailNotification($this->email_verification_code));
        } catch (\Throwable $e) {
            Log::warning('Pending onboarding email verification could not be sent: '.$e->getMessage());
        }
    }

    /**
     * Verify email verification code.
     */
    public function verifyEmailCode(string $code): bool
    {
        $normalizedCode = preg_replace('/\D+/', '', $code) ?? '';

        if ($this->email_verified_at !== null || $this->email_verification_code === null || $this->email_verification_expires_at === null) {
            return false;
        }

        if (now()->greaterThan($this->email_verification_expires_at)) {
            $this->forceFill([
                'email_verification_code' => null,
                'email_verification_expires_at' => null,
            ])->save();

            return false;
        }

        if (! hash_equals((string) $this->email_verification_code, $normalizedCode)) {
            return false;
        }

        $this->forceFill([
            'email_verified_at' => now(),
            'email_verification_code' => null,
            'email_verification_expires_at' => null,
        ])->save();

        return true;
    }

    /**
     * Check if email has been verified.
     */
    public function isEmailVerified(): bool
    {
        return $this->email_verified_at !== null;
    }

    /**
     * Check if Step 1 (Personal Information) is complete.
     */
    public function hasCompletedPersonalInformation(): bool
    {
        return filled($this->first_name) && filled($this->last_name);
    }

    /**
     * Check if Step 2 (Business) is complete.
     */
    public function hasCompletedBusiness(): bool
    {
        return filled($this->business_name) && filled($this->industry) && filled($this->category);
    }

    /**
     * Check if required legal documents are accepted.
     */
    public function hasCompletedLegal(): bool
    {
        $accepted = $this->accepted_legal_documents ?? [];
        $required = LegalDocumentService::getRequiredDocumentTypes();

        foreach ($required as $docType) {
            if (! in_array($docType, $accepted, true)) {
                return false;
            }
        }

        return true;
    }
}
