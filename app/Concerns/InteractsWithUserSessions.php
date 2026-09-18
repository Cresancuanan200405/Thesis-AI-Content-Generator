<?php

namespace App\Concerns;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

trait InteractsWithUserSessions
{
    /**
     * Get active browser sessions for the user.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function getSessions(Request $request): array
    {
        if (config('session.driver') !== 'database') {
            return [];
        }

        $sessions = DB::table('sessions')
            ->where('user_id', $request->user()->getAuthIdentifier())
            ->orderBy('last_activity', 'desc')
            ->get();

        return $sessions->map(function ($session) use ($request) {
            $agent = $this->createAgent($session->user_agent);

            return [
                'id' => $session->id,
                'ip_address' => $session->ip_address,
                'is_current_device' => $session->id === $request->session()->getId(),
                'platform' => $agent['platform'],
                'browser' => $agent['browser'],
                'is_desktop' => $agent['is_desktop'],
                'last_active' => Carbon::createFromTimestamp($session->last_activity)->diffForHumans(),
            ];
        })->toArray();
    }

    /**
     * Parse simple user agent metadata.
     *
     * @return array{platform: string, browser: string, is_desktop: bool}
     */
    protected function createAgent(?string $userAgent): array
    {
        if (empty($userAgent)) {
            return [
                'platform' => 'Unknown Platform',
                'browser' => 'Unknown Browser',
                'is_desktop' => true,
            ];
        }

        $platform = 'Unknown Platform';
        if (str_contains($userAgent, 'Windows')) {
            $platform = 'Windows';
        } elseif (str_contains($userAgent, 'Macintosh') || str_contains($userAgent, 'Mac OS X')) {
            $platform = 'macOS';
        } elseif (str_contains($userAgent, 'Linux')) {
            $platform = 'Linux';
        } elseif (str_contains($userAgent, 'Android')) {
            $platform = 'Android';
        } elseif (str_contains($userAgent, 'iPhone') || str_contains($userAgent, 'iPad')) {
            $platform = 'iOS';
        }

        $browser = 'Unknown Browser';
        if (str_contains($userAgent, 'Chrome') && ! str_contains($userAgent, 'Edg')) {
            $browser = 'Chrome';
        } elseif (str_contains($userAgent, 'Safari') && ! str_contains($userAgent, 'Chrome')) {
            $browser = 'Safari';
        } elseif (str_contains($userAgent, 'Firefox')) {
            $browser = 'Firefox';
        } elseif (str_contains($userAgent, 'Edg')) {
            $browser = 'Edge';
        }

        $isDesktop = ! (str_contains($userAgent, 'Mobile') || str_contains($userAgent, 'Android') || str_contains($userAgent, 'iPhone'));

        return [
            'platform' => $platform,
            'browser' => $browser,
            'is_desktop' => $isDesktop,
        ];
    }
}
