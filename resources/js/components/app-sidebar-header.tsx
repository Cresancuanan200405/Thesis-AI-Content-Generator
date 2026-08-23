import * as React from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    Bell,
    Calendar,
    Check,
    CheckCheck,
    Megaphone,
    Monitor,
    Moon,
    ShoppingBag,
    Sparkles,
    Sun,
} from 'lucide-react';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAppearance } from '@/hooks/use-appearance';
import type { Appearance } from '@/hooks/use-appearance';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

type NotificationItem = {
    id: number;
    type: string;
    title: string;
    message: string;
    action_url?: string | null;
    read_at?: string | null;
    created_at?: string;
};

function formatTimeAgo(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getNotificationIcon(type: string) {
    switch (type) {
        case 'campaign':
            return <Megaphone className="h-4 w-4 text-blue-500" />;
        case 'design':
        case 'generator':
            return <Sparkles className="h-4 w-4 text-purple-500" />;
        case 'product':
            return <ShoppingBag className="h-4 w-4 text-emerald-500" />;
        case 'event':
        case 'calendar':
            return <Calendar className="h-4 w-4 text-amber-500" />;
        default:
            return <Bell className="h-4 w-4 text-blue-500" />;
    }
}

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { appearance, updateAppearance } = useAppearance();
    const { unread_notifications_count, recent_notifications } = usePage<{
        unread_notifications_count?: number;
        recent_notifications?: NotificationItem[];
    }>().props;
    const { url } = usePage();
    const unreadCount = Number(unread_notifications_count || 0);
    const notifications = recent_notifications || [];

    const handleNotificationClick = (item: NotificationItem) => {
        if (!item.read_at) {
            router.post(`/notifications/${item.id}/read`, {}, { preserveScroll: true });
        }
        if (item.action_url) {
            router.visit(item.action_url);
        } else {
            router.visit('/notifications');
        }
    };

    const handleMarkAllRead = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.post('/notifications/read-all', {}, { preserveScroll: true });
    };

    const resolvedBreadcrumbs = React.useMemo(() => {
        if (breadcrumbs && breadcrumbs.length > 0) {
            return breadcrumbs;
        }

        const path = (url || '').split('?')[0].replace(/^\//, '');
        if (!path || path === 'dashboard') {
            return [{ title: 'Dashboard', href: '/dashboard' }];
        }

        const segments = path.split('/');
        return segments.map((seg, i) => {
            const href = '/' + segments.slice(0, i + 1).join('/');
            const title = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
            return { title, href };
        });
    }, [breadcrumbs, url]);

    const themes: {
        value: Appearance;
        label: string;
        icon: typeof Sun;
    }[] = [
        { value: 'light', label: 'Light', icon: Sun },
        { value: 'dark', label: 'Dark', icon: Moon },
        { value: 'system', label: 'System', icon: Monitor },
    ];

    const currentTheme =
        themes.find((theme) => theme.value === appearance) ??
        themes[0];

    const CurrentIcon = currentTheme.icon;

    return (
        <header
            className="
                sticky
                top-0
                z-30
                flex
                h-11
                sm:h-12
                items-center
                justify-between
                gap-3
                border-b
                border-border/60
                bg-background/65
                dark:bg-background/55
                px-3
                backdrop-blur-xl
                transition-[width,height]
                ease-linear
                sm:px-5
            "
        >
            {/* =============================================================
                LEFT SIDE
            ============================================================= */}
            <div className="flex items-center gap-2.5 sm:gap-3">
                <SidebarTrigger className="-ml-1 h-8 w-8 hover:bg-muted/80 hover:scale-105 transition-all" />

                <div
                    aria-hidden
                    className="h-3.5 w-px bg-border/80 hidden sm:block"
                />

                <Breadcrumbs breadcrumbs={resolvedBreadcrumbs} />
            </div>

            {/* =============================================================
                RIGHT ACTIONS
            ============================================================= */}
            <div className="flex items-center gap-1">

                {/* ========================================================
                    THEME DROPDOWN
                ========================================================= */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Choose theme"
                            title="Choose theme"
                            className="h-8 w-8 rounded-full text-muted-foreground transition-all duration-200 hover:scale-105 hover:bg-primary/10 hover:text-primary hover:ring-1 hover:ring-primary/25 active:scale-95 data-[state=open]:bg-primary/15 data-[state=open]:text-primary data-[state=open]:ring-2 data-[state=open]:ring-primary/40 data-[state=open]:scale-105 cursor-pointer shadow-2xs"
                        >
                            <CurrentIcon className="h-4 w-4 transition-transform duration-200" />
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" sideOffset={10} className="relative w-36 rounded-xl border border-border bg-popover/98 p-1 shadow-xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 overflow-visible">
                        {/* Directional Indicator Pointer back to icon */}
                        <div className="pointer-events-none absolute -top-1.5 right-3 h-3 w-3 rotate-45 border-l border-t border-border bg-popover" />

                        {themes.map(({ value, label, icon: Icon }) => {
                            const selected = appearance === value;
                            return (
                                <DropdownMenuItem
                                    key={value}
                                    onClick={() => updateAppearance(value)}
                                    className={`relative z-10 cursor-pointer rounded-lg px-2.5 py-1.5 transition-colors ${selected ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted'}`}
                                >
                                    <Icon className="mr-2 h-4 w-4" />
                                    <span className="text-xs">{label}</span>
                                    {selected && <Check className="ml-auto h-3.5 w-3.5" />}
                                </DropdownMenuItem>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* ========================================================
                    NOTIFICATIONS DROPDOWN
                ========================================================= */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Notifications"
                            title="Notifications"
                            className="relative h-8 w-8 rounded-full text-muted-foreground transition-all duration-200 hover:scale-105 hover:bg-primary/10 hover:text-primary hover:ring-1 hover:ring-primary/25 active:scale-95 data-[state=open]:bg-primary/15 data-[state=open]:text-primary data-[state=open]:ring-2 data-[state=open]:ring-primary/40 data-[state=open]:scale-105 cursor-pointer shadow-2xs"
                        >
                            <Bell className="h-4 w-4 transition-transform duration-200" />
                            {unreadCount > 0 && (
                                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground shadow-sm animate-in zoom-in-50 ring-2 ring-background">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        align="end"
                        sideOffset={10}
                        className="
                            relative
                            w-84
                            sm:w-96
                            rounded-2xl
                            border
                            border-border
                            bg-popover
                            p-0
                            shadow-2xl
                            shadow-black/20
                            duration-200
                            animate-in
                            fade-in-0
                            zoom-in-95
                            data-[side=bottom]:slide-in-from-top-2
                            dark:shadow-black/50
                            overflow-visible
                        "
                    >
                        {/* Directional Indicator Pointer back to icon */}
                        <div className="pointer-events-none absolute -top-1.5 right-3 z-30 h-3 w-3 rotate-45 border-l border-t border-border bg-muted" />

                        {/* Notification Header */}
                        <div className="relative z-10 flex items-center justify-between border-b border-border bg-muted/50 rounded-t-2xl px-4 py-2.5">
                            <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-foreground">
                                    Notifications
                                </p>
                                {unreadCount > 0 && (
                                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1.5 text-[9px] font-bold text-primary-foreground">
                                        {unreadCount} new
                                    </span>
                                )}
                            </div>

                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={handleMarkAllRead}
                                    className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    <CheckCheck className="h-3.5 w-3.5" />
                                    <span>Mark all read</span>
                                </button>
                            )}
                        </div>

                        {/* Dropdown Body: Real Notifications List */}
                        {notifications.length > 0 ? (
                            <div className="max-h-[340px] divide-y divide-border/60 overflow-y-auto">
                                {notifications.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleNotificationClick(item)}
                                        className={`group relative flex cursor-pointer items-start gap-3 p-3.5 transition-colors hover:bg-muted/50 ${
                                            !item.read_at ? 'bg-muted/20' : ''
                                        }`}
                                    >
                                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted/60">
                                            {getNotificationIcon(item.type)}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className={`truncate text-xs font-semibold ${!item.read_at ? 'text-foreground font-bold' : 'text-foreground/90'}`}>
                                                    {item.title}
                                                </p>
                                                <span className="shrink-0 text-[10px] text-muted-foreground">
                                                    {formatTimeAgo(item.created_at)}
                                                </span>
                                            </div>

                                            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                                                {item.message}
                                            </p>
                                        </div>

                                        {!item.read_at && (
                                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center px-5 py-8 text-center">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted/50">
                                    <Bell className="h-4 w-4 text-muted-foreground" />
                                </div>

                                <p className="mt-2.5 text-sm font-medium text-foreground">
                                    You're all caught up
                                </p>

                                <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-muted-foreground">
                                    Campaign, design generation, and event updates will appear here.
                                </p>
                            </div>
                        )}

                        {/* Footer Link */}
                        <div className="border-t border-border bg-muted/30 p-2">
                            <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs font-medium text-muted-foreground hover:text-foreground"
                            >
                                <Link href="/notifications">
                                    View all notifications →
                                </Link>
                            </Button>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}