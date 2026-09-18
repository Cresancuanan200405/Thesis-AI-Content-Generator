<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\PendingOnboardingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\AbstractProvider;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirectResponse;
use Throwable;

class SocialAuthController extends Controller
{
    /**
     * Supported social providers.
     *
     * @var array<string>
     */
    protected array $supportedProviders = ['google', 'facebook'];

    /**
     * Redirect to the provider's OAuth authentication page.
     */
    public function redirect(string $provider): RedirectResponse|SymfonyRedirectResponse
    {
        if (! in_array($provider, $this->supportedProviders, true)) {
            return redirect()->route('login')->with('error', 'Unsupported authentication provider.');
        }

        $clientId = config("services.{$provider}.client_id");
        $clientSecret = config("services.{$provider}.client_secret");

        if (empty($clientId) || empty($clientSecret)) {
            $providerName = ucfirst($provider);

            return redirect()->route('login')->with('error', "{$providerName} Sign-In is not configured yet. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file.");
        }

        try {
            return Socialite::driver($provider)->redirect();
        } catch (Throwable $e) {
            report($e);

            return redirect()->route('login')->with('error', "Unable to redirect to {$provider}. Please try logging in with your email.");
        }
    }

    /**
     * Handle the provider callback after user authorization.
     */
    public function callback(Request $request, string $provider): RedirectResponse
    {
        $correlationId = (string) Str::uuid();

        if (! in_array($provider, $this->supportedProviders, true)) {
            return redirect()->route('login')->with('error', 'Unsupported authentication provider.');
        }

        try {
            /** @var AbstractProvider $driver */
            $driver = Socialite::driver($provider);
            if (method_exists($driver, 'stateless')) {
                $driver = $driver->stateless();
            }
            $socialUser = $driver->user();
        } catch (Throwable $e) {
            Log::error("Social auth {$provider} callback error: ".$e->getMessage());

            return redirect()->route('login')->with('error', "Authentication with {$provider} failed: ".$e->getMessage());
        }

        try {
            $socialId = $socialUser->getId();
            $email = $socialUser->getEmail();
            $displayName = $socialUser->getName() ?: (explode('@', (string) $email)[0] ?: ucfirst($provider).' User');
            $avatar = $socialUser->getAvatar();

            if (empty($email)) {
                $email = "{$provider}_{$socialId}@social.marketpilot.test";
            }

            $baseUsername = strtolower(preg_replace('/[^A-Za-z0-9._-]+/', '', str_replace(' ', '_', trim((string) $displayName))) ?: preg_replace('/[^A-Za-z0-9._-]+/', '', explode('@', (string) $email)[0] ?? $provider));
            $baseUsername = $baseUsername !== '' ? $baseUsername : $provider.'user';

            // 1. Check if user with matching provider credentials exists
            $user = User::where('provider_name', $provider)
                ->where('provider_id', $socialId)
                ->first();

            if ($user) {
                $user->forceFill([
                    'avatar' => $user->avatar ?: $avatar,
                    'email_verified_at' => $user->email_verified_at ?? now(),
                    'username' => $user->username ?: $this->generateUniqueUsername($baseUsername, $email),
                ])->save();
            }

            // 2. If not found by provider ID, look up by email
            if (! $user) {
                $user = User::where('email', $email)->first();

                if ($user) {
                    $user->forceFill([
                        'provider_name' => $provider,
                        'provider_id' => $socialId,
                        'avatar' => $user->avatar ?: $avatar,
                        'email_verified_at' => $user->email_verified_at ?? now(),
                        'username' => $user->username ?: $this->generateUniqueUsername($baseUsername, $email),
                    ])->save();
                } else {
                    // 3. Brand new social account: do NOT create permanent user before Launch Workspace
                    $pendingService = app(PendingOnboardingService::class);
                    $pendingService->startFromSocial([
                        'provider' => $provider,
                        'socialId' => $socialId,
                        'email' => $email,
                        'displayName' => $displayName,
                        'avatar' => $avatar,
                        'username' => $this->generateUniqueUsername($baseUsername, $email),
                    ], $request);

                    $request->session()->regenerate();

                    return redirect()->route('onboarding.show')->with('success', "Signed in with {$provider}! Let's set up your workspace.");
                }
            }

            Auth::login($user, true);

            $request->session()->regenerate();

            if (! $user->onboarding_completed) {
                return redirect()->route('onboarding.show')->with('success', "Signed in with {$provider}! Let's set up your workspace.");
            }

            if (! $user->hasCompletedPersonalInformation()) {
                return redirect()->route('profile.edit')->with('success', "Signed in with {$provider}! Please complete your personal information.");
            }

            return redirect()->intended(route('dashboard'))->with('success', "Welcome back, {$user->name}!");
        } catch (Throwable $e) {
            Log::error("Social auth {$provider} database/session error", [
                'correlation_id' => $correlationId,
                ...$this->safeExceptionMetadata($e),
            ]);

            return redirect()->route('login')->with('error', "Failed to complete {$provider} sign-in. Please try again or use your email.");
        }
    }

    /**
     * Capture non-sensitive metadata from the connection used by User models.
     *
     * @return array<string, mixed>
     */
    protected function databaseDiagnostic(string $correlationId): array
    {
        $userModel = new User;
        $connection = $userModel->getConnection();
        $driver = $connection->getDriverName();

        $diagnostic = [
            'correlation_id' => $correlationId,
            'connection_name' => $connection->getName(),
            'connection_driver' => $driver,
            'connection_class' => $connection::class,
            'database_host' => $this->redactHost($connection->getConfig('host')),
            'database_port' => $connection->getConfig('port'),
            'database_name' => $connection->getConfig('database'),
            'in_transaction' => $connection->transactionLevel() > 0,
            'expected_role_detected' => false,
        ];

        if ($driver !== 'pgsql') {
            return $diagnostic;
        }

        try {
            $identity = $connection->selectOne('select current_user, session_user, current_database()');
            $databaseUser = $identity->current_user ?? null;

            return [
                ...$diagnostic,
                'database_user' => $databaseUser,
                'session_user' => $identity->session_user ?? null,
                'database_name' => $identity->current_database ?? $diagnostic['database_name'],
                'expected_role_detected' => $databaseUser === 'marketpilot_app',
            ];
        } catch (Throwable $e) {
            return [
                ...$diagnostic,
                ...$this->safeExceptionMetadata($e, 'diagnostic_query'),
            ];
        }
    }

    protected function redactHost(mixed $host): ?string
    {
        if (! is_string($host) || trim($host) === '') {
            return null;
        }

        $parsedHost = parse_url($host, PHP_URL_HOST);

        return is_string($parsedHost) ? $parsedHost : preg_replace('/^[^@]+@/', '', $host);
    }

    /**
     * @return array<string, mixed>
     */
    protected function safeExceptionMetadata(Throwable $exception, string $stage = 'user_create_or_session'): array
    {
        $message = $exception->getPrevious()?->getMessage() ?: $exception->getMessage();
        $message = preg_replace('/\s+\(SQL:.*$/s', '', $message) ?? $message;

        return [
            'stage' => $stage,
            'exception_class' => $exception::class,
            'sqlstate' => (string) $exception->getCode(),
            'error_message' => $message,
        ];
    }

    protected function generateUniqueUsername(string $baseUsername, string $email): string
    {
        $candidate = $baseUsername;

        if (empty($candidate)) {
            $candidate = preg_replace('/[^A-Za-z0-9._-]+/', '', explode('@', $email)[0] ?? 'user') ?: 'user';
        }

        $candidate = strtolower(trim((string) $candidate));

        if ($candidate === '') {
            $candidate = 'user';
        }

        $finalCandidate = $candidate;
        $suffix = 1;

        while (User::where('username', $finalCandidate)->exists()) {
            $finalCandidate = $candidate.'_'.$suffix;
            $suffix++;
        }

        return $finalCandidate;
    }
}
