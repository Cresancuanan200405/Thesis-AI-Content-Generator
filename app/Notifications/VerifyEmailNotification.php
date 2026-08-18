<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;

class VerifyEmailNotification extends VerifyEmail
{
    public function __construct(public string $code)
    {
        // intentionally blank
    }

    /**
     * Build the mail representation of the notification.
     */
    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Verify your MarketPilot email')
            ->greeting('Welcome to MarketPilot!')
            ->line('Use the 6-digit code below to verify your email address and finish setting up your workspace.')
            ->line('Your verification code: '.$this->code)
            ->line('This code expires in 15 minutes.')
            ->line('If you did not create this account, no further action is required.');
    }
}
