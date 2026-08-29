<?php

namespace App\Services;

use App\Models\AppNotification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

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

    /**
     * Record a security-related notification.
     *
     * @param  array<string, mixed>  $data
     */
    public static function notifySecurity(
        User|int $user,
        string $title,
        string $message,
        ?string $actionUrl = '/settings/security',
        array $data = []
    ): AppNotification {
        return self::notify($user, 'security', $title, $message, $actionUrl, $data);
    }

    /**
     * Record an AI-related event notification (e.g. failure, quota exceeded).
     *
     * @param  array<string, mixed>  $data
     */
    public static function notifyAi(
        User|int $user,
        string $title,
        string $message,
        ?string $actionUrl = '/generator',
        array $data = []
    ): AppNotification {
        return self::notify($user, 'ai', $title, $message, $actionUrl, $data);
    }

    /**
     * Record a usage/budget notification.
     *
     * @param  array<string, mixed>  $data
     */
    public static function notifyUsage(
        User|int $user,
        string $title,
        string $message,
        ?string $actionUrl = '/subscriptions',
        array $data = []
    ): AppNotification {
        return self::notify($user, 'usage', $title, $message, $actionUrl, $data);
    }

    /**
     * Record a billing/subscription notification.
     *
     * @param  array<string, mixed>  $data
     */
    public static function notifyBilling(
        User|int $user,
        string $title,
        string $message,
        ?string $actionUrl = '/subscriptions',
        array $data = []
    ): AppNotification {
        return self::notify($user, 'billing', $title, $message, $actionUrl, $data);
    }

    /**
     * Record a system announcement/maintenance notification.
     *
     * @param  array<string, mixed>  $data
     */
    public static function notifySystem(
        User|int $user,
        string $title,
        string $message,
        ?string $actionUrl = null,
        array $data = []
    ): AppNotification {
        return self::notify($user, 'system', $title, $message, $actionUrl, $data);
    }

    /**
     * Record a login security notification with duplicate prevention.
     */
    public static function recordLogin(User $user, ?Request $request = null): ?AppNotification
    {
        // Prevent duplicate login notifications generated within 10 seconds
        $recent = AppNotification::where('user_id', $user->id)
            ->where('type', 'security')
            ->where('title', 'New Login Detected')
            ->where('created_at', '>=', Carbon::now()->subSeconds(10))
            ->first();

        if ($recent) {
            return $recent;
        }

        $ip = $request?->ip() ?: 'Unknown IP';
        $userAgent = $request?->userAgent() ?: 'Standard Browser';

        // Extract simplified device info from user agent
        $device = 'Web Session';
        if (str_contains($userAgent, 'Windows')) {
            $device = 'Windows PC';
        } elseif (str_contains($userAgent, 'Macintosh')) {
            $device = 'Mac';
        } elseif (str_contains($userAgent, 'iPhone') || str_contains($userAgent, 'iPad')) {
            $device = 'iOS Device';
        } elseif (str_contains($userAgent, 'Android')) {
            $device = 'Android Device';
        } elseif (str_contains($userAgent, 'Linux')) {
            $device = 'Linux';
        }

        return self::notify(
            user: $user,
            type: 'security',
            title: 'New Login Detected',
            message: "Your account was successfully signed in from {$device}.",
            actionUrl: '/settings/security',
            data: [
                'ip' => $ip,
                'device' => $device,
                'timestamp' => Carbon::now()->toIso8601String(),
            ]
        );
    }

    /**
     * Record a logout security notification with duplicate prevention.
     */
    public static function recordLogout(User $user, ?Request $request = null): ?AppNotification
    {
        // Prevent duplicate logout notifications within 10 seconds
        $recent = AppNotification::where('user_id', $user->id)
            ->where('type', 'security')
            ->where('title', 'Logged Out')
            ->where('created_at', '>=', Carbon::now()->subSeconds(10))
            ->first();

        if ($recent) {
            return $recent;
        }

        return self::notify(
            user: $user,
            type: 'security',
            title: 'Logged Out',
            message: 'Your account was signed out successfully.',
            actionUrl: '/settings/security',
            data: [
                'timestamp' => Carbon::now()->toIso8601String(),
            ]
        );
    }

    /**
     * Check organization application limit thresholds (80%, 90%, 100%) and create notifications if needed.
     */
    public static function checkUsageThresholds(User $user, float $totalSpent, float $budgetLimit): void
    {
        if ($budgetLimit <= 0) {
            return;
        }

        $percentage = ($totalSpent / $budgetLimit) * 100;
        $currentMonth = Carbon::now()->format('Y-m');

        if ($percentage >= 100) {
            $exists = AppNotification::where('user_id', $user->id)
                ->where('type', 'usage')
                ->where('title', 'Application Limit Reached (100%)')
                ->where('data->period', $currentMonth)
                ->exists();

            if (! $exists) {
                self::notifyUsage(
                    user: $user,
                    title: 'Application Limit Reached (100%)',
                    message: 'Your workspace has reached 100% of its Application Configured Limit ($'.number_format($totalSpent, 2).' of $'.number_format($budgetLimit, 2).'). AI visual generations are temporarily paused until the next billing period or limit adjustment.',
                    actionUrl: '/subscriptions',
                    data: ['period' => $currentMonth, 'threshold' => 100]
                );
            }
        } elseif ($percentage >= 80) {
            $exists = AppNotification::where('user_id', $user->id)
                ->where('type', 'usage')
                ->where('title', 'Application Limit Warning (80%)')
                ->where('data->period', $currentMonth)
                ->exists();

            if (! $exists) {
                self::notifyUsage(
                    user: $user,
                    title: 'Application Limit Warning (80%)',
                    message: 'Your workspace has reached 80% of its Application Configured Limit ($'.number_format($totalSpent, 2).' of $'.number_format($budgetLimit, 2).'). Check your subscription dashboard for details.',
                    actionUrl: '/subscriptions',
                    data: ['period' => $currentMonth, 'threshold' => 80]
                );
            }
        }
    }
}
