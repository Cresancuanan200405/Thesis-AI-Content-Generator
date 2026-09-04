import { Head, Link, router } from '@inertiajs/react';
import {
    Bell,
    Check,
    CheckCheck,
    Clock,
    ExternalLink,
    Filter,
    Loader2,
    MoreVertical,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import * as React from 'react';

import { resolveNotificationConfig } from '@/components/notification-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type NotificationItem = {
    id: number;
    type: string;
    title: string;
    message: string;
    action_url: string | null;
    data: Record<string, unknown> | null;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
    time_ago: string;
};

export type NotificationsPageProps = {
    notifications?: NotificationItem[];
    unread_count?: number;
    total_count?: number;
    category_counts?: {
        all?: number;
        unread?: number;
        ai?: number;
        campaigns?: number;
        usage?: number;
        security?: number;
        billing?: number;
        system?: number;
    };
    current_filter?: string;
    search_query?: string;
};

const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'ai', label: 'AI Studio' },
    { key: 'campaigns', label: 'Campaigns' },
    { key: 'usage', label: 'Usage & Quota' },
    { key: 'security', label: 'Security' },
    { key: 'system', label: 'System' },
];

export default function NotificationsIndex({
    notifications = [],
    unread_count = 0,
    total_count = 0,
    category_counts = {},
    current_filter = 'all',
    search_query = '',
}: NotificationsPageProps) {
    const [search, setSearch] = React.useState(search_query || '');
    const [activeFilter, setActiveFilter] = React.useState(
        current_filter || 'all',
    );
    const [processingId, setProcessingId] = React.useState<number | null>(null);
    const [isMarkingAll, setIsMarkingAll] = React.useState(false);
    const [isClearingAll, setIsClearingAll] = React.useState(false);

    // Sync state when props change
    React.useEffect(() => {
        setActiveFilter(current_filter || 'all');
    }, [current_filter]);

    React.useEffect(() => {
        setSearch(search_query || '');
    }, [search_query]);

    const handleFilterChange = (tabKey: string) => {
        setActiveFilter(tabKey);
        router.get(
            '/notifications',
            {
                filter: tabKey,
                search: search.trim() || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/notifications',
            {
                filter: activeFilter,
                search: search.trim() || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleClearSearch = () => {
        setSearch('');
        router.get(
            '/notifications',
            {
                filter: activeFilter,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleMarkAsRead = (notification: NotificationItem) => {
        setProcessingId(notification.id);
        router.post(
            `/notifications/${notification.id}/read`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessingId(null),
            },
        );
    };

    const handleMarkAsUnread = (notification: NotificationItem) => {
        setProcessingId(notification.id);
        router.post(
            `/notifications/${notification.id}/unread`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessingId(null),
            },
        );
    };

    const handleDelete = (notification: NotificationItem) => {
        setProcessingId(notification.id);
        router.delete(`/notifications/${notification.id}`, {
            preserveScroll: true,
            onFinish: () => setProcessingId(null),
        });
    };

    const handleMarkAllRead = () => {
        setIsMarkingAll(true);
        router.post(
            '/notifications/read-all',
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsMarkingAll(false),
            },
        );
    };

    const handleClearAll = () => {
        if (
            window.confirm(
                'Are you sure you want to clear all notifications? This action cannot be undone.',
            )
        ) {
            setIsClearingAll(true);
            router.delete('/notifications', {
                preserveScroll: true,
                onFinish: () => setIsClearingAll(false),
            });
        }
    };

    const getTabCount = (tabKey: string): number => {
        if (tabKey === 'all') {
            return total_count;
        }

        if (tabKey === 'unread') {
            return unread_count;
        }

        return category_counts[tabKey as keyof typeof category_counts] ?? 0;
    };

    return (
        <>
            <Head title="Notifications" />

            <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                {/* PAGE HEADER */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                                <Bell className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                                        Notifications Center
                                    </h1>
                                    {unread_count > 0 && (
                                        <Badge className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                                            {unread_count} new
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground sm:text-sm">
                                    Track AI synthesis results, marketing
                                    campaigns, quota warnings, and system
                                    alerts.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {unread_count > 0 && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleMarkAllRead}
                                disabled={isMarkingAll}
                                className="h-8 gap-1.5 rounded-xl text-xs font-semibold"
                            >
                                {isMarkingAll ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <CheckCheck className="h-3.5 w-3.5 text-primary" />
                                )}
                                Mark all as read
                            </Button>
                        )}

                        {total_count > 0 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleClearAll}
                                disabled={isClearingAll}
                                className="h-8 gap-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            >
                                {isClearingAll ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                )}
                                Clear all
                            </Button>
                        )}
                    </div>
                </div>

                {/* SEARCH & FILTERS BAR */}
                <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/75 p-3.5 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
                    {/* TABS */}
                    <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                        {filterTabs.map((tab) => {
                            const isSelected = activeFilter === tab.key;
                            const count = getTabCount(tab.key);

                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => handleFilterChange(tab.key)}
                                    className={cn(
                                        'inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200',
                                        isSelected
                                            ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                    )}
                                >
                                    <span>{tab.label}</span>
                                    {count > 0 && (
                                        <span
                                            className={cn(
                                                'flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold',
                                                isSelected
                                                    ? 'bg-primary-foreground/20 text-primary-foreground'
                                                    : 'bg-muted-foreground/15 text-muted-foreground',
                                            )}
                                        >
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* SEARCH INPUT */}
                    <form
                        onSubmit={handleSearchSubmit}
                        className="relative sm:w-64"
                    >
                        <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search notifications..."
                            className="h-8.5 rounded-xl bg-background/80 pr-8 pl-9 text-xs backdrop-blur-md"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </form>
                </div>

                {/* NOTIFICATIONS LIST */}
                {notifications.length > 0 ? (
                    <div className="space-y-3">
                        {notifications.map((notification) => {
                            const isProcessing =
                                processingId === notification.id;
                            const config = resolveNotificationConfig(
                                notification.type,
                                notification.title,
                            );
                            const Icon = config.icon;

                            return (
                                <Card
                                    key={notification.id}
                                    className={cn(
                                        'group overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
                                        !notification.is_read
                                            ? 'border-primary/30 bg-primary/5 shadow-xs dark:bg-primary/10'
                                            : 'border-border/60 bg-card/60 shadow-none hover:bg-card/90',
                                    )}
                                >
                                    <CardContent className="p-4 sm:p-5">
                                        <div className="flex items-start gap-3.5 sm:gap-4">
                                            {/* SEMANTIC CATEGORY ICON */}
                                            <div
                                                className={cn(
                                                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1',
                                                    config.iconBg,
                                                    'ring-black/5 dark:ring-white/10',
                                                )}
                                            >
                                                <Icon
                                                    className={cn(
                                                        'h-5 w-5',
                                                        config.iconColor,
                                                    )}
                                                />
                                            </div>

                                            {/* CONTENT */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            'h-5 px-1.5 text-[10px] font-semibold',
                                                            config.iconColor,
                                                            'border-current/30',
                                                        )}
                                                    >
                                                        {config.badgeLabel}
                                                    </Badge>

                                                    <h3
                                                        className={cn(
                                                            'text-sm font-semibold',
                                                            !notification.is_read
                                                                ? 'text-foreground'
                                                                : 'text-foreground/80',
                                                        )}
                                                    >
                                                        {notification.title}
                                                    </h3>

                                                    {!notification.is_read && (
                                                        <span
                                                            className="flex h-2 w-2 rounded-full bg-primary"
                                                            title="Unread notification"
                                                        />
                                                    )}

                                                    <span
                                                        className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground"
                                                        title={
                                                            notification.created_at
                                                        }
                                                    >
                                                        <Clock className="h-3 w-3" />
                                                        {notification.time_ago}
                                                    </span>
                                                </div>

                                                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                                                    {notification.message}
                                                </p>

                                                {/* ACTION ROW */}
                                                <div className="mt-3.5 flex flex-wrap items-center gap-2">
                                                    {notification.action_url && (
                                                        <Button
                                                            asChild
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7.5 gap-1.5 rounded-lg text-xs font-semibold hover:bg-primary/10 hover:text-primary"
                                                            onClick={() => {
                                                                if (
                                                                    !notification.is_read
                                                                ) {
                                                                    handleMarkAsRead(
                                                                        notification,
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            <Link
                                                                href={
                                                                    notification.action_url
                                                                }
                                                            >
                                                                <span>
                                                                    View details
                                                                </span>
                                                                <ExternalLink className="h-3 w-3" />
                                                            </Link>
                                                        </Button>
                                                    )}

                                                    {!notification.is_read ? (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleMarkAsRead(
                                                                    notification,
                                                                )
                                                            }
                                                            disabled={
                                                                isProcessing
                                                            }
                                                            className="h-7.5 gap-1 rounded-lg text-xs text-muted-foreground hover:text-foreground"
                                                        >
                                                            {isProcessing ? (
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                            ) : (
                                                                <Check className="h-3 w-3" />
                                                            )}
                                                            Mark as read
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleMarkAsUnread(
                                                                    notification,
                                                                )
                                                            }
                                                            disabled={
                                                                isProcessing
                                                            }
                                                            className="h-7.5 gap-1 rounded-lg text-xs text-muted-foreground hover:text-foreground"
                                                        >
                                                            {isProcessing ? (
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                            ) : (
                                                                <Clock className="h-3 w-3" />
                                                            )}
                                                            Mark as unread
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* ITEM OPTIONS DROPDOWN */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label="Notification actions"
                                                        className="h-8 w-8 text-muted-foreground opacity-70 group-hover:opacity-100 hover:opacity-100"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="w-40 rounded-xl"
                                                >
                                                    {!notification.is_read ? (
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                handleMarkAsRead(
                                                                    notification,
                                                                )
                                                            }
                                                            className="cursor-pointer text-xs"
                                                        >
                                                            <Check className="mr-2 h-3.5 w-3.5" />
                                                            Mark as read
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                handleMarkAsUnread(
                                                                    notification,
                                                                )
                                                            }
                                                            className="cursor-pointer text-xs"
                                                        >
                                                            <Clock className="mr-2 h-3.5 w-3.5" />
                                                            Mark as unread
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            handleDelete(
                                                                notification,
                                                            )
                                                        }
                                                        className="cursor-pointer text-xs text-destructive hover:bg-destructive/10"
                                                    >
                                                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    /* EMPTY STATE */
                    <Card className="rounded-2xl border-dashed border-border/80 p-12 text-center shadow-none">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted/40 text-muted-foreground">
                            {search ? (
                                <Filter className="h-6 w-6" />
                            ) : (
                                <Bell className="h-6 w-6" />
                            )}
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-foreground">
                            {search
                                ? 'No notifications match your search'
                                : activeFilter === 'unread'
                                  ? "You're all caught up!"
                                  : 'No notifications in this category'}
                        </h3>
                        <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
                            {search
                                ? `No results found for "${search}". Try checking for spelling errors or clearing your query.`
                                : activeFilter === 'unread'
                                  ? 'You have zero unread notifications. New alerts will appear here as they occur.'
                                  : 'When marketing actions, AI generations, quota warnings, or system events occur, they will appear here.'}
                        </p>
                        {search && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleClearSearch}
                                className="mt-4 rounded-xl text-xs font-semibold"
                            >
                                Clear search query
                            </Button>
                        )}
                    </Card>
                )}
            </div>
        </>
    );
}

NotificationsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Notifications',
            href: '/notifications',
        },
    ],
};
