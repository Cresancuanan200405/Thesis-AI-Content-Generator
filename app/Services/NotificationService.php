<?php

namespace App\Services;

use App\Models\AppNotification;
use App\Models\User;

class NotificationService
{
    /**
     * Create an in-app notification for a user.
     *
     * @param  array<string, mixed>  $data
     */
    public static function notify(
        User|int $user,
        string $type,
        string $title,
        string $message,
        ?string $actionUrl = null,
        array $data = []
    ): AppNotification {
        $userId = $user instanceof User ? $user->id : $user;

        return AppNotification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'action_url' => $actionUrl,
            'data' => $data,
            'read_at' => null,
        ]);
    }
}
