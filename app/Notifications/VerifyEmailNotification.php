<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;

class VerifyEmailNotification extends VerifyEmail
{
    /**
     * Build the mail representation of the notification.
     */
    public function toMail($notifiable): MailMessage
    {
        $verificationUrl = $this->verificationUrl($notifiable);

        return (new MailMessage)
            ->subject('Verify your MarketPilot email')
            ->greeting('Welcome to MarketPilot!')
            ->line('Thanks for joining. Please verify your email address to finish setting up your workspace.')
            ->action('Verify Email Address', $verificationUrl)
            ->line('If you did not create this account, no further action is required.');
    }
}
