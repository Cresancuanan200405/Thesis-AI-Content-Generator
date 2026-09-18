<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EmailChangeVerificationNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $code,
        public string $newEmail,
        public ?User $user = null
    ) {
        // intentionally blank
    }

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
     * Build the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Verify your new email address — MarketPilot')
            ->view('emails.change-email-verification', [
                'code' => $this->code,
                'newEmail' => $this->newEmail,
                'user' => $this->user ?? $notifiable,
            ]);
    }
}
