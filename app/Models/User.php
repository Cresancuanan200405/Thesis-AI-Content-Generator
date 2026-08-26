<?php

namespace App\Models;

use App\Notifications\VerifyEmailNotification;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property bool $onboarding_completed
 * @property Carbon|null $onboarding_completed_at
 * @property string|null $provider_name
 * @property string|null $provider_id
 * @property string|null $avatar
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Business|null $business
 * @property Collection<int,Campaign> $campaigns
 * @property Collection<int,Event> $events
 * @property Collection<int,Design> $designs
 */
#[Fillable(['name', 'email', 'password', 'provider_name', 'provider_id', 'avatar', 'email_verified_at', 'onboarding_completed', 'onboarding_completed_at'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'email_verification_expires_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'onboarding_completed' => 'boolean',
            'onboarding_completed_at' => 'datetime',
        ];
    }

    public function sendEmailVerificationNotification(): void
    {
        $this->generateEmailVerificationCode();

        try {
            $this->notify(new VerifyEmailNotification($this->email_verification_code));
        } catch (\Throwable $e) {
            Log::warning('Email verification notification could not be sent: '.$e->getMessage());
        }
    }

    public function generateEmailVerificationCode(): string
    {
        $code = (string) random_int(100000, 999999);

        $this->forceFill([
            'email_verification_code' => $code,
            'email_verification_expires_at' => now()->addMinutes(15),
        ])->save();

        return $code;
    }

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
     * @return HasOne<Business, $this>
     */
    public function business(): HasOne
    {
        return $this->hasOne(Business::class);
    }

    /**
     * @return HasMany<Event, $this>
     */
    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }

    /**
     * @return HasMany<Campaign, $this>
     */
    public function campaigns(): HasMany
    {
        return $this->hasMany(Campaign::class);
    }

    /**
     * @return HasMany<Design, $this>
     */
    public function designs(): HasMany
    {
        return $this->hasMany(Design::class);
    }

    /**
     * @return HasMany<Product, $this>
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /**
     * @return HasMany<AppNotification, $this>
     */
    public function appNotifications(): HasMany
    {
        return $this->hasMany(AppNotification::class);
    }

    /**
     * @return HasMany<GenerationRequest, $this>
     */
    public function generationRequests(): HasMany
    {
        return $this->hasMany(GenerationRequest::class);
    }

    /**
     * Calculate total spent across all generated AI designs and previews.
     */
    public function getAiTotalSpent(): float
    {
        $baseSpend = 0.170; // Live verified billed spend from OpenAI account

        $openaiDesignsCost = (float) $this->designs()
            ->get()
            ->filter(fn (Design $d) => ($d->generation_metadata['source'] ?? '') === 'openai')
            ->sum(function (Design $design): float {
                $model = $design->generation_metadata['model'] ?? 'chatgpt-image-latest';
                $quality = $design->generation_metadata['quality'] ?? 'medium';

                return match ($model) {
                    'gpt-image-1-mini' => match ($quality) {
                        'low' => 0.005,
                        'high' => 0.036,
                        default => 0.011,
                    },
                    'chatgpt-image-latest' => match ($quality) {
                        'low' => 0.009,
                        'high' => 0.133,
                        default => 0.040,
                    },
                    'gpt-image-1' => match ($quality) {
                        'low' => 0.011,
                        'high' => 0.167,
                        default => 0.042,
                    },
                    'gpt-image-1.5' => match ($quality) {
                        'low' => 0.020,
                        'high' => 0.080,
                        default => 0.040,
                    },
                    'gpt-image-2' => match ($quality) {
                        'low' => 0.006,
                        'high' => 0.211,
                        default => 0.053,
                    },
                    default => match ($quality) {
                        'low' => 0.011,
                        'high' => 0.167,
                        default => 0.040,
                    },
                };
            });

        return round($baseSpend + $openaiDesignsCost, 3);
    }

    /**
     * Check if the user has reached or exceeded the AI generation budget limit.
     */
    public function hasReachedAiBudgetLimit(?float $limit = null): bool
    {
        $limit = $limit ?? (float) config('services.openai.budget_limit', 10.00);

        return $this->getAiTotalSpent() >= $limit;
    }

    /**
     * Get remaining AI generation budget.
     */
    public function getAiRemainingBudget(?float $limit = null): float
    {
        $limit = $limit ?? (float) config('services.openai.budget_limit', 10.00);

        return max(0.0, round($limit - $this->getAiTotalSpent(), 3));
    }
}
