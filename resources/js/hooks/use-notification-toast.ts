import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

type NotificationItem = {
    id: number;
    type: string;
    title: string;
    message: string;
    action_url?: string | null;
    read_at?: string | null;
    created_at?: string;
};

/**
 * Surfaces popup/toast notifications for genuinely *new* unread notifications
 * that arrive via Inertia shared props.  Duplicate-safe: each notification ID
 * is only displayed once per browser session.
 *
 * Only fires for unread notifications — read notifications are silently ignored.
 */
export function useNotificationToast(): void {
    // Track notification IDs we've already toasted so we never duplicate
    const displayedIdsRef = useRef<Set<number>>(new Set());
    // Track whether this is the initial mount (skip toasting on first page load)
    const isInitialMount = useRef(true);

    const { recent_notifications } =
        usePage<{
            recent_notifications?: NotificationItem[];
        }>().props;

    useEffect(() => {
        const items = recent_notifications || [];

        if (isInitialMount.current) {
            // On initial mount, seed the displayed set with all current notifications
            // so we don't toast old items on the very first page load
            items.forEach((n) => displayedIdsRef.current.add(n.id));
            isInitialMount.current = false;
            return;
        }

        // Find new unread notifications we haven't toasted yet
        const newUnread = items.filter(
            (n) => !n.read_at && !displayedIdsRef.current.has(n.id),
        );

        if (newUnread.length === 0) {
            return;
        }

        // Toast each genuinely new notification (most recent first, capped at 3)
        newUnread.slice(0, 3).forEach((n) => {
            displayedIdsRef.current.add(n.id);

            const toastType = getToastVariant(n.type);

            toast[toastType](n.title, {
                description: n.message,
                duration: 6000,
                action: n.action_url
                    ? {
                          label: 'View',
                          onClick: () => {
                              window.location.href = n.action_url!;
                          },
                      }
                    : undefined,
            });
        });
    }, [recent_notifications]);
}

function getToastVariant(type: string): 'success' | 'error' | 'warning' | 'info' {
    switch (type) {
        case 'security':
            return 'warning';
        case 'ai':
            return 'info';
        case 'usage':
            return 'warning';
        case 'billing':
            return 'info';
        case 'system':
            return 'info';
        default:
            if (type.includes('error') || type.includes('fail')) return 'error';
            if (type.includes('security')) return 'warning';
            return 'info';
    }
}
