<?php

namespace App\Http\Controllers;

use App\Models\AppNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    /**
     * Display a listing of user notifications.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_if(! $user, 401);

        $filter = $request->string('filter', 'all')->toString();
        $search = $request->string('search', '')->toString();

        $query = $user->appNotifications()->latest();

        if ($filter === 'unread') {
            $query->unread();
        } elseif ($filter === 'campaigns') {
            $query->where('type', 'like', '%campaign%');
        } elseif ($filter === 'designs') {
            $query->where('type', 'like', '%design%');
        } elseif ($filter === 'products') {
            $query->where('type', 'like', '%product%');
        } elseif ($filter === 'system') {
            $query->where(function ($q) {
                $q->where('type', 'like', '%logo%')
                    ->orWhere('type', 'like', '%profile%')
                    ->orWhere('type', 'like', '%security%')
                    ->orWhere('type', 'like', '%event%')
                    ->orWhere('type', 'system');
            });
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('message', 'like', "%{$search}%");
            });
        }

        $notifications = $query->limit(100)->get()->map(function (AppNotification $n) {
            return [
                'id' => $n->id,
                'type' => $n->type,
                'title' => $n->title,
                'message' => $n->message,
                'action_url' => $n->action_url,
                'data' => $n->data,
                'is_read' => $n->read_at !== null,
                'read_at' => $n->read_at?->toIso8601String(),
                'created_at' => $n->created_at?->format('M j, Y g:i A'),
                'time_ago' => $n->created_at?->diffForHumans(),
            ];
        });

        $unreadCount = $user->appNotifications()->unread()->count();
        $totalCount = $user->appNotifications()->count();

        return Inertia::render('notifications/index', [
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
            'total_count' => $totalCount,
            'current_filter' => $filter,
            'search_query' => $search,
        ]);
    }

    /**
     * Mark a single notification as read.
     */
    public function markAsRead(Request $request, AppNotification $notification): RedirectResponse
    {
        $user = $request->user();
        abort_if(! $user || $notification->user_id !== $user->id, 403);

        $notification->markAsRead();

        return back()->with('success', 'Notification marked as read.');
    }

    /**
     * Mark a single notification as unread.
     */
    public function markAsUnread(Request $request, AppNotification $notification): RedirectResponse
    {
        $user = $request->user();
        abort_if(! $user || $notification->user_id !== $user->id, 403);

        $notification->markAsUnread();

        return back()->with('success', 'Notification marked as unread.');
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_if(! $user, 401);

        $user->appNotifications()->unread()->update(['read_at' => now()]);

        return back()->with('success', 'All notifications marked as read.');
    }

    /**
     * Remove the specified notification.
     */
    public function destroy(Request $request, AppNotification $notification): RedirectResponse
    {
        $user = $request->user();
        abort_if(! $user || $notification->user_id !== $user->id, 403);

        $notification->delete();

        return back()->with('success', 'Notification deleted.');
    }

    /**
     * Clear all notifications for the authenticated user.
     */
    public function clearAll(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_if(! $user, 401);

        $user->appNotifications()->delete();

        return back()->with('success', 'All notifications cleared.');
    }
}
