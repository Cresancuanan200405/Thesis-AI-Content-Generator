<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WelcomeEmailNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     *
     * @param  User  $notifiable
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Welcome to MarketPilot')
            ->greeting('Hi '.$notifiable->name.'!')
            ->line('Your workspace is ready and your marketing engine is set to go.')
            ->line('Use your dashboard to generate campaigns, schedule campaigns, and plan launches.')
            ->action('Open Dashboard', url('/dashboard'))
            ->line('We are excited to help you grow your next campaign.');
    }
}
