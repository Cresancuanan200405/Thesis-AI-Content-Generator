import { router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

import {
    type NotificationItem,
    showNotificationToast,
} from '@/components/notification-toast';

/**
 * Surfaces popup/toast notifications for genuinely *new* unread notifications
 * that arrive via Inertia shared props. Duplicate-safe: each notification ID
 * is only displayed once per browser session.
 *
 * Uses Inertia router event listeners rather than usePage() so that it can safely
 * run inside <Toaster /> mounted alongside <App /> without throwing React context errors.
 */
export function useNotificationToast(): void {
    // Track notification IDs we've already toasted so we never duplicate
    const displayedIdsRef = useRef<Set<number>>(new Set());
    // Track whether this is the initial mount (skip toasting on first page load)
    const isInitialMount = useRef(true);

    useEffect(() => {
        // Seed initial notifications from initial page payload on mount
        try {
            const dataPage =
                document.querySelector('script[data-page]')?.textContent ||
                document.getElementById('app')?.getAttribute('data-page');

            if (dataPage) {
                const parsed = JSON.parse(dataPage);
                const initial = (parsed?.props?.recent_notifications || []) as NotificationItem[];
                initial.forEach((n) => {
                    if (n.id !== undefined) {
                        displayedIdsRef.current.add(Number(n.id));
                    }
                });
                isInitialMount.current = false;
            }
        } catch {
            // Ignore parse errors
        }

        const handleNotifications = (
            recentNotifications?: NotificationItem[] | null,
        ) => {
            const items = recentNotifications || [];

            if (items.length === 0) {
                return;
            }

            if (isInitialMount.current) {
                // On initial mount, seed the displayed set with all current notifications
                // so we don't toast old items on the very first page load
                items.forEach((n) => {
                    if (n.id !== undefined) {
                        displayedIdsRef.current.add(Number(n.id));
                    }
                });
                isInitialMount.current = false;

                return;
            }

            // Find new unread notifications we haven't toasted yet
            const newUnread = items.filter(
                (n) => !n.read_at && n.id !== undefined && !displayedIdsRef.current.has(Number(n.id)),
            );

            if (newUnread.length === 0) {
                return;
            }

            // Toast only the single most recent genuinely new notification
            const topNotification = newUnread[0];
            if (topNotification && topNotification.id !== undefined) {
                displayedIdsRef.current.add(Number(topNotification.id));
                showNotificationToast(topNotification);
            }
        };

        const unregisterNavigate = router.on('navigate', (event: any) => {
            const notifications = event?.detail?.page?.props
                ?.recent_notifications as NotificationItem[] | undefined;
            handleNotifications(notifications);
        });

        return () => {
            unregisterNavigate();
        };
    }, []);
}
