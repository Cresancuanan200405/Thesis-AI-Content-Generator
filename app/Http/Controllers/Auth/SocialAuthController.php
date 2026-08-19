<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
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
    public function redirect(string $provider): RedirectResponse
    {
        if (! in_array($provider, $this->supportedProviders, true)) {
            return redirect()->route('login')->with('error', 'Unsupported authentication provider.');
        }

        $clientId = config("services.{$provider}.client_id");
        $clientSecret = config("services.{$provider}.client_secret");

        // If credentials are not set in .env (common in development / demo environments)
        if (empty($clientId) || empty($clientSecret)) {
            return $this->handleDevSimulation($provider);
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
        if (! in_array($provider, $this->supportedProviders, true)) {
            return redirect()->route('login')->with('error', 'Unsupported authentication provider.');
        }

        try {
            $socialUser = Socialite::driver($provider)->user();
        } catch (Throwable $e) {
            report($e);

            return redirect()->route('login')->with('error', "Authentication with {$provider} failed or was cancelled.");
        }

        $socialId = $socialUser->getId();
        $email = $socialUser->getEmail();
        $name = $socialUser->getName() ?: (explode('@', (string) $email)[0] ?: ucfirst($provider).' User');
        $avatar = $socialUser->getAvatar();

        if (empty($email)) {
            $email = "{$provider}_{$socialId}@social.marketpilot.test";
        }

        // 1. Check if user with matching provider credentials exists
        $user = User::where('provider_name', $provider)
            ->where('provider_id', $socialId)
            ->first();

        // 2. If not found by provider ID, look up by email
        if (! $user) {
            $user = User::where('email', $email)->first();

            if ($user) {
                $user->forceFill([
                    'provider_name' => $provider,
                    'provider_id' => $socialId,
                    'avatar' => $user->avatar ?: $avatar,
                    'email_verified_at' => $user->email_verified_at ?? now(),
                ])->save();
            } else {
                // 3. Create a brand new user
                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => Hash::make(Str::random(32)),
                    'provider_name' => $provider,
                    'provider_id' => $socialId,
                    'avatar' => $avatar,
                    'email_verified_at' => now(),
                    'onboarding_completed' => false,
                ]);
            }
        }

        Auth::login($user, true);

        $request->session()->regenerate();

        if (! $user->onboarding_completed) {
            return redirect()->route('onboarding.show')->with('success', "Signed in with {$provider}! Let's set up your workspace.");
        }

        return redirect()->intended(route('dashboard'))->with('success', "Welcome back, {$user->name}!");
    }

    /**
     * Development mode simulation for local testing when OAuth client credentials are not yet configured.
     */
    protected function handleDevSimulation(string $provider): RedirectResponse
    {
        $providerName = ucfirst($provider);
        $email = "developer.{$provider}@example.com";
        $name = "{$providerName} Demo User";

        $user = User::where('email', $email)->first();

        if (! $user) {
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make('password123'),
                'provider_name' => $provider,
                'provider_id' => "demo_{$provider}_".Str::random(8),
                'avatar' => null,
                'email_verified_at' => now(),
                'onboarding_completed' => true,
            ]);
        }

        Auth::login($user, true);

        request()->session()->regenerate();

        return redirect()->intended(route('dashboard'))->with('success', "Signed in as {$name} (Local {$providerName} simulation mode).");
    }
}
