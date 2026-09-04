import { router } from '@inertiajs/react';
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    Info,
    Megaphone,
    Sparkles,
    X,
} from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type SemanticNotificationCategory =
    'success' | 'info' | 'event' | 'attention' | 'error' | 'ai' | 'campaign';

export type NotificationItem = {
    id?: number | string;
    type: string;
    title: string;
    message: string;
    action_url?: string | null;
    read_at?: string | null;
    created_at?: string;
};

type TypeConfig = {
    category: SemanticNotificationCategory;
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
    borderColor: string;
    badgeLabel: string;
};

// Global recent toast deduplicator (stores text hash and timestamp to prevent simultaneous duplicate popups)
const recentToastHashes = new Map<string, number>();

function isDuplicateToast(key: string, cooldownMs: number = 4000): boolean {
    const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, ' ');
    const now = Date.now();
    const lastTime = recentToastHashes.get(normalizedKey);

    if (lastTime && now - lastTime < cooldownMs) {
        return true;
    }

    recentToastHashes.set(normalizedKey, now);

    // Clean up old entries periodically
    if (recentToastHashes.size > 50) {
        for (const [k, time] of recentToastHashes.entries()) {
            if (now - time > 15000) {
                recentToastHashes.delete(k);
            }
        }
    }

    return false;
}

/**
 * Resolves semantic category, icon, and colors for any notification type or title.
 */
export function resolveNotificationConfig(
    type: string,
    title?: string,
): TypeConfig {
    const raw = `${type || ''} ${title || ''}`.toLowerCase();

    // 1. ERROR
    if (
        raw.includes('fail') ||
        raw.includes('error') ||
        raw.includes('rejected') ||
        raw.includes('unauthorized') ||
        raw.includes('forbidden') ||
        raw.includes('paused') ||
        raw.includes('disabled')
    ) {
        return {
            category: 'error',
            icon: AlertCircle,
            iconColor: 'text-rose-500',
            iconBg: 'bg-rose-500/10 dark:bg-rose-500/20',
            borderColor: 'border-l-rose-500',
            badgeLabel: 'Error',
        };
    }

    // 2. SUCCESS (Including logins, logouts, saves, verified, completed)
    if (
        raw.includes('success') ||
        raw.includes('signed in') ||
        raw.includes('signed out') ||
        raw.includes('logged in') ||
        raw.includes('logged out') ||
        raw.includes('login detected') ||
        raw.includes('complete') ||
        raw.includes('published') ||
        raw.includes('connected') ||
        raw.includes('saved') ||
        raw.includes('verified') ||
        raw.includes('restored') ||
        raw.includes('updated') ||
        raw.includes('created') ||
        raw.includes('deleted')
    ) {
        return {
            category: 'success',
            icon: CheckCircle2,
            iconColor: 'text-emerald-500',
            iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
            borderColor: 'border-l-emerald-500',
            badgeLabel: 'Success',
        };
    }

    // 3. ATTENTION / MISSED OPPORTUNITY / WARNING / SECURITY / USAGE
    if (
        raw.includes('attention') ||
        raw.includes('warning') ||
        raw.includes('security') ||
        raw.includes('usage') ||
        raw.includes('missed') ||
        raw.includes('limit') ||
        raw.includes('budget') ||
        raw.includes('missing')
    ) {
        return {
            category: 'attention',
            icon: AlertCircle,
            iconColor: 'text-amber-500',
            iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
            borderColor: 'border-l-amber-500',
            badgeLabel: 'Attention',
        };
    }

    // 4. UPCOMING EVENT / HOLIDAY / CALENDAR
    if (
        raw.includes('event') ||
        raw.includes('holiday') ||
        raw.includes('calendar') ||
        raw.includes('date') ||
        raw.includes('opportunity')
    ) {
        return {
            category: 'event',
            icon: Calendar,
            iconColor: 'text-amber-500',
            iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
            borderColor: 'border-l-amber-500',
            badgeLabel: 'Calendar',
        };
    }

    // 5. AI GENERATION / DESIGN
    if (
        raw.includes('ai') ||
        raw.includes('generation') ||
        raw.includes('generator') ||
        raw.includes('design') ||
        raw.includes('creative')
    ) {
        return {
            category: 'ai',
            icon: Sparkles,
            iconColor: 'text-purple-500',
            iconBg: 'bg-purple-500/10 dark:bg-purple-500/20',
            borderColor: 'border-l-purple-500',
            badgeLabel: 'AI Studio',
        };
    }

    // 6. CAMPAIGN
    if (raw.includes('campaign') || raw.includes('pipeline')) {
        return {
            category: 'campaign',
            icon: Megaphone,
            iconColor: 'text-blue-500',
            iconBg: 'bg-blue-500/10 dark:bg-blue-500/20',
            borderColor: 'border-l-blue-500',
            badgeLabel: 'Campaign',
        };
    }

    // 7. INFO / DEFAULT FALLBACK
    return {
        category: 'info',
        icon: Info,
        iconColor: 'text-sky-500',
        iconBg: 'bg-sky-500/10 dark:bg-sky-500/20',
        borderColor: 'border-l-sky-500',
        badgeLabel: 'Information',
    };
}

/**
 * Custom Semantic Notification Popup Toast Component.
 */
export function NotificationToastCard({
    notification,
    toastId,
}: {
    notification: NotificationItem;
    toastId: string | number;
}) {
    const config = resolveNotificationConfig(
        notification.type,
        notification.title,
    );
    const Icon = config.icon;

    const handleAction = (e: React.MouseEvent) => {
        e.stopPropagation();
        toast.dismiss(toastId);

        if (notification.action_url) {
            router.visit(notification.action_url);
        }
    };

    return (
        <div
            role="alert"
            aria-live="polite"
            className={cn(
                'relative flex w-full max-w-md items-start gap-3.5 rounded-2xl border border-border/80 bg-card/95 p-4 shadow-xl backdrop-blur-md transition-all sm:max-w-lg',
                'border-l-4',
                config.borderColor,
            )}
        >
            {/* Semantic Icon Container */}
            <div
                className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                    config.iconBg,
                    config.iconColor,
                )}
            >
                <Icon className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center gap-2">
                    <h4 className="truncate text-xs font-bold text-foreground sm:text-sm">
                        {notification.title}
                    </h4>
                </div>

                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {notification.message}
                </p>

                {notification.action_url && (
                    <div className="mt-2.5 flex items-center gap-2">
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleAction}
                            className="h-7 rounded-lg px-2.5 text-xs font-bold shadow-xs"
                        >
                            Review Action
                        </Button>
                    </div>
                )}
            </div>

            {/* Close Button */}
            <button
                type="button"
                aria-label="Close notification"
                onClick={() => toast.dismiss(toastId)}
                className="shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

/**
 * Triggers a custom styled semantic notification popup toast with duplicate suppression.
 */
export function showNotificationToast(notification: NotificationItem): void {
    const key = `${notification.type}:${notification.title}:${notification.message}`;

    if (isDuplicateToast(key)) {
        return;
    }

    toast.dismiss();

    toast.custom(
        (t) => (
            <NotificationToastCard notification={notification} toastId={t} />
        ),
        {
            duration: 5000,
        },
    );
}

export type SemanticToastOptions = {
    type?: string;
    title?: string;
    message: string;
    action_url?: string | null;
    duration?: number;
};

/**
 * Helper to display any semantic toast with full custom styling, icons, and colors.
 */
export function showSemanticToast({
    type = 'info',
    title,
    message,
    action_url,
    duration = 5000,
}: SemanticToastOptions): void {
    // Determine friendly title if none provided
    const resolvedTitle =
        title ||
        (type === 'success'
            ? 'Success'
            : type === 'error'
              ? 'Error'
              : type === 'warning'
                ? 'Attention'
                : 'Notification');

    const key = `${type}:${resolvedTitle}:${message}`;

    if (isDuplicateToast(key)) {
        return;
    }

    toast.dismiss();

    toast.custom(
        (t) => (
            <NotificationToastCard
                notification={{
                    type,
                    title: resolvedTitle,
                    message,
                    action_url,
                }}
                toastId={t}
            />
        ),
        {
            duration,
        },
    );
}
