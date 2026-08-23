import { Head, Link, router } from '@inertiajs/react';
import {
    Bell,
    Building2,
    Calendar,
    Check,
    CheckCheck,
    Clock,
    ExternalLink,
    Loader2,
    Megaphone,
    MoreVertical,
    Package,
    Search,
    Shield,
    Sparkles,
    Trash2,
    X,
} from 'lucide-react';
import { useState } from 'react';
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

type NotificationItem = {
    id: number;
    type: string;
    title: string;
    message: string;
    action_url: string | null;
    data: Record<string, any> | null;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
    time_ago: string;
};

type Props = {
    notifications: NotificationItem[];
    unread_count: number;
    total_count: number;
    current_filter: string;
    search_query: string;
};

const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'campaigns', label: 'Campaigns' },
    { key: 'designs', label: 'Designs' },
    { key: 'products', label: 'Products' },
    { key: 'system', label: 'System' },
];

export default function NotificationsIndex({
    notifications = [],
    unread_count = 0,
    total_count = 0,
    current_filter = 'all',
    search_query = '',
}: Partial<Props>) {
    const [search, setSearch] = useState(search_query || '');
    const [activeFilter, setActiveFilter] = useState(current_filter || 'all');
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [isMarkingAll, setIsMarkingAll] = useState(false);
    const [isClearingAll, setIsClearingAll] = useState(false);

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

    const getNotificationIcon = (type: string) => {
        if (type.includes('campaign')) {
            return (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10 text-sky-500">
                    <Megaphone className="h-5 w-5" />
                </div>
            );
        }

        if (type.includes('design')) {
            return (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-500">
                    <Sparkles className="h-5 w-5" />
                </div>
            );
        }

        if (type.includes('product')) {
            return (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
                    <Package className="h-5 w-5" />
                </div>
            );
        }

        if (type.includes('event')) {
            return (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-pink-500/20 bg-pink-500/10 text-pink-500">
                    <Calendar className="h-5 w-5" />
                </div>
            );
        }

        if (type.includes('logo')) {
            return (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-500">
                    <Building2 className="h-5 w-5" />
                </div>
            );
        }

        if (type.includes('security') || type.includes('profile')) {
            return (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-500">
                    <Shield className="h-5 w-5" />
                </div>
            );
        }

        return (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <Bell className="h-5 w-5" />
            </div>
        );
    };

    return (
        <>
            <Head title="Notifications Center" />

            <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                {/* PAGE HEADER */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Bell className="h-5 w-5" />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                Notifications
                            </h1>
                            {unread_count > 0 && (
                                <Badge className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                                    {unread_count} new
                                </Badge>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Stay up to date with design generations, campaign
                            actions, and marketing updates.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {unread_count > 0 && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleMarkAllRead}
                                disabled={isMarkingAll}
                                className="h-9 gap-1.5 text-xs"
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
                                className="h-9 gap-1.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
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
                <div className="flex flex-col gap-3 rounded-2xl border border-white/25 bg-card/85 p-4 shadow-lg backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-slate-900/80">
                    {/* TABS */}
                    <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
                        {filterTabs.map((tab) => {
                            const isSelected = activeFilter === tab.key;

                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => handleFilterChange(tab.key)}
                                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                                        isSelected
                                            ? 'scale-[1.02] bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                                            : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                                    }`}
                                >
                                    {tab.label}
                                    {tab.key === 'unread' &&
                                        unread_count > 0 && (
                                            <span
                                                className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold ${
                                                    isSelected
                                                        ? 'bg-background text-foreground'
                                                        : 'bg-primary text-primary-foreground'
                                                }`}
                                            >
                                                {unread_count}
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
                            placeholder="Search alerts..."
                            className="h-9 rounded-xl bg-background/80 pr-8 pl-9 text-xs backdrop-blur-md dark:bg-slate-950/60"
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

                            return (
                                <Card
                                    key={notification.id}
                                    className={`group overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${
                                        !notification.is_read
                                            ? 'border-primary/40 bg-primary/10 shadow-md backdrop-blur-xl dark:bg-primary/15'
                                            : 'border-white/20 bg-card/80 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/75'
                                    }`}
                                >
                                    <CardContent className="p-4 sm:p-5">
                                        <div className="flex items-start gap-4">
                                            {/* CATEGORY ICON */}
                                            {getNotificationIcon(
                                                notification.type,
                                            )}

                                            {/* CONTENT */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3
                                                        className={`text-sm font-semibold ${
                                                            !notification.is_read
                                                                ? 'text-foreground'
                                                                : 'text-foreground/90'
                                                        }`}
                                                    >
                                                        {notification.title}
                                                    </h3>

                                                    {!notification.is_read && (
                                                        <span className="flex h-2 w-2 rounded-full bg-primary" />
                                                    )}

                                                    <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                                        <Clock className="h-3 w-3" />
                                                        {notification.time_ago}
                                                    </span>
                                                </div>

                                                <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                                                    {notification.message}
                                                </p>

                                                {/* ACTION ROW */}
                                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                                    {notification.action_url && (
                                                        <Button
                                                            asChild
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 gap-1 rounded-lg text-xs"
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
                                                                View details
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
                                                            className="h-7 gap-1 rounded-lg text-xs text-muted-foreground hover:text-foreground"
                                                        >
                                                            <Check className="h-3 w-3" />
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
                                                            className="h-7 gap-1 rounded-lg text-xs text-muted-foreground hover:text-foreground"
                                                        >
                                                            Mark as unread
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* ITEM OPTIONS */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground opacity-60 group-hover:opacity-100 hover:opacity-100"
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
                    <Card className="rounded-2xl border-dashed border-border p-12 text-center shadow-none">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted/30 text-muted-foreground">
                            <Bell className="h-6 w-6" />
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-foreground">
                            No notifications found
                        </h3>
                        <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                            {search
                                ? `No notifications matched "${search}". Try clearing your search query.`
                                : activeFilter === 'unread'
                                  ? "You don't have any unread notifications. You're all caught up!"
                                  : 'When campaigns, designs, products, or marketing updates occur, they will be logged here.'}
                        </p>
                        {search && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleClearSearch}
                                className="mt-4 text-xs"
                            >
                                Clear search
                            </Button>
                        )}
                    </Card>
                )}
            </div>
        </>
    );
}
