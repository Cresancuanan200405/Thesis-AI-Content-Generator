<?php

namespace App\Providers;

use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\Product;
use App\Policies\CampaignPolicy;
use App\Policies\DesignPolicy;
use App\Policies\EventPolicy;
use App\Policies\ProductPolicy;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        VerifyEmail::toMailUsing(function ($notifiable, string $url): MailMessage {
            return (new MailMessage)
                ->subject('Verify your MarketPilot email')
                ->greeting('Welcome to MarketPilot!')
                ->line('Thanks for joining. Please verify your email address to finish setting up your workspace.')
                ->action('Verify Email Address', $url)
                ->line('If you did not create this account, no further action is required.');
        });

        Gate::policy(Design::class, DesignPolicy::class);
        Gate::policy(Event::class, EventPolicy::class);
        Gate::policy(Campaign::class, CampaignPolicy::class);
        Gate::policy(Product::class, ProductPolicy::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
