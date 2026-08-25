import { Link, router, usePage } from '@inertiajs/react';
import {
    Bell,
    Calendar,
    Check,
    CheckCheck,
    Coins,
    Info,
    Megaphone,
    Monitor,
    Moon,
    ShoppingBag,
    Sparkles,
    Sun,
} from 'lucide-react';
import * as React from 'react';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { Badge } from '@/components/ui/badge';
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
    if (!dateString) {
        return '';
    }

    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) {
        return 'Just now';
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
        return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
        return `${days}d ago`;
    }

    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    });
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
    const { unread_notifications_count, recent_notifications, ai_usage } =
        usePage<{
            unread_notifications_count?: number;
            recent_notifications?: NotificationItem[];
            ai_usage?: {
                budget_limit: number;
                total_spent: number;
                remaining_budget: number;
                total_generations: number;
                model_counts?: Record<string, number>;
            };
        }>().props;
    const { url } = usePage();
    const unreadCount = Number(unread_notifications_count || 0);
    const notifications = recent_notifications || [];

    const budgetLimit = Number(ai_usage?.budget_limit ?? 20.0);
    const totalSpent = Number(ai_usage?.total_spent ?? 0.0);
    const remainingBudget = Number(ai_usage?.remaining_budget ?? 20.0);
    const totalGenerations = Number(ai_usage?.total_generations ?? 0);
    const percentageUsed = Math.min(
        100,
        Math.max(0, Math.round((totalSpent / budgetLimit) * 100)),
    );

    const handleNotificationClick = (item: NotificationItem) => {
        if (!item.read_at) {
            router.post(
                `/notifications/${item.id}/read`,
                {},
                { preserveScroll: true },
            );
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
            const title =
                seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');

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
        themes.find((theme) => theme.value === appearance) ?? themes[0];

    const CurrentIcon = currentTheme.icon;

    return (
        <header className="sticky top-0 z-30 flex h-11 items-center justify-between gap-3 border-b border-border/60 bg-background/65 px-3 backdrop-blur-xl transition-[width,height] ease-linear sm:h-12 sm:px-5 dark:bg-background/55">
            {/* =============================================================
                LEFT SIDE
            ============================================================= */}
            <div className="flex items-center gap-2.5 sm:gap-3">
                <SidebarTrigger className="-ml-1 h-8 w-8 transition-all hover:scale-105 hover:bg-muted/80" />

                <div
                    aria-hidden
                    className="hidden h-3.5 w-px bg-border/80 sm:block"
                />

                <Breadcrumbs breadcrumbs={resolvedBreadcrumbs} />
            </div>

            {/* =============================================================
                RIGHT ACTIONS
            ============================================================= */}
            <div className="flex items-center gap-1">
                {/* ========================================================
                    AI TOKEN & BILLING USAGE DROPDOWN
                ========================================================= */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            aria-label="AI Token & Quota Usage"
                            title="AI Token & Quota Usage ($20.00 Limit)"
                            className="h-8 gap-1.5 rounded-full px-2.5 text-xs font-semibold text-muted-foreground shadow-2xs transition-all duration-200 hover:scale-105 hover:bg-primary/10 hover:text-primary hover:ring-1 hover:ring-primary/25 active:scale-95 data-[state=open]:scale-105 data-[state=open]:bg-primary/15 data-[state=open]:text-primary data-[state=open]:ring-2 data-[state=open]:ring-primary/40"
                        >
                            <Coins className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="hidden font-mono text-[11px] font-bold sm:inline-block">
                                ${totalSpent.toFixed(2)}
                                <span className="font-normal text-muted-foreground">
                                    /$20
                                </span>
                            </span>
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        align="end"
                        sideOffset={8}
                        collisionPadding={16}
                        avoidCollisions={true}
                        className="w-[calc(100vw-2rem)] max-w-sm sm:max-w-md max-h-[82vh] overflow-y-auto rounded-2xl border border-border bg-popover p-0 shadow-2xl shadow-black/20 duration-200 fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 dark:shadow-black/50"
                    >
                        {/* Usage Header */}
                        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-popover/98 px-4 py-3 backdrop-blur-md">
                            <div>
                                <p className="text-xs font-bold text-foreground">
                                    AI Token & Quota Usage
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                    OpenAI Synthesis Balance Tracker
                                </p>
                            </div>
                            <Badge
                                variant="outline"
                                className="border-emerald-500/30 bg-emerald-500/10 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400"
                            >
                                Limit: $20.00
                            </Badge>
                        </div>

                        <div className="space-y-3.5 p-4">
                            {/* Budget Progress Bar Card */}
                            <div className="space-y-2.5 rounded-xl border border-border/70 bg-muted/20 p-3">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-foreground">
                                        Budget Utilization
                                    </span>
                                    <span className="font-mono text-xs font-bold text-foreground">
                                        ${totalSpent.toFixed(2)}{' '}
                                        <span className="font-normal text-muted-foreground">
                                            / $20.00 ({percentageUsed}%)
                                        </span>
                                    </span>
                                </div>

                                {/* Custom Progress Bar */}
                                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-primary to-blue-500 transition-all duration-500"
                                        style={{
                                            width: `${Math.max(4, percentageUsed)}%`,
                                        }}
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-0.5 text-[11px] text-muted-foreground">
                                    <span>
                                        Remaining:{' '}
                                        <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                                            ${remainingBudget.toFixed(2)}
                                        </strong>
                                    </span>
                                    <span>
                                        Generated:{' '}
                                        <strong className="font-mono text-foreground">
                                            {totalGenerations} Visual
                                            {totalGenerations === 1 ? '' : 's'}
                                        </strong>
                                    </span>
                                </div>
                            </div>

                            {/* Estimated Remaining Visuals */}
                            <div className="space-y-1 rounded-xl border border-border/70 bg-muted/10 p-3 text-xs">
                                <p className="font-semibold text-foreground">
                                    Estimated Visuals Remaining
                                </p>
                                <p className="text-[11px] leading-relaxed text-muted-foreground">
                                    With your remaining{' '}
                                    <strong>
                                        ${remainingBudget.toFixed(2)}
                                    </strong>{' '}
                                    balance, you can generate approximately{' '}
                                    <strong className="font-mono font-bold text-primary">
                                        ~{Math.floor(remainingBudget / 0.042)}
                                    </strong>{' '}
                                    standard commercial marketing images (
                                    <span className="font-mono">
                                        gpt-image-1 Medium
                                    </span>
                                    ) or up to{' '}
                                    <strong className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                        ~{Math.floor(remainingBudget / 0.005)}
                                    </strong>{' '}
                                    drafts (
                                    <span className="font-mono">
                                        gpt-image-1-mini Low
                                    </span>
                                    ).
                                </p>
                            </div>

                            {/* Cost Per Image vs Total Images on $20 Table */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Cost Per Image vs. Total on $20
                                    </p>
                                    <span className="font-mono text-[10px] text-muted-foreground">
                                        5 OpenAI Models
                                    </span>
                                </div>
                                <div className="divide-y divide-border/40 overflow-hidden rounded-xl border border-border/70 bg-card text-xs">
                                    {[
                                        {
                                            model: 'gpt-image-1-mini',
                                            sub: 'Fastest & Cheapest',
                                            low: '$0.005',
                                            med: '$0.011',
                                            high: '$0.036',
                                            totalLow: '4,000',
                                            totalMed: '1,818',
                                            totalHigh: '555',
                                        },
                                        {
                                            model: 'chatgpt-image-latest',
                                            sub: 'Standard ChatGPT View',
                                            low: '$0.009',
                                            med: '$0.034',
                                            high: '$0.133',
                                            totalLow: '2,222',
                                            totalMed: '588',
                                            totalHigh: '150',
                                        },
                                        {
                                            model: 'gpt-image-1',
                                            sub: 'Deprecating Oct 2026',
                                            low: '$0.011',
                                            med: '$0.042',
                                            high: '$0.167',
                                            totalLow: '1,818',
                                            totalMed: '476',
                                            totalHigh: '119',
                                            isRecommended: true,
                                        },
                                        {
                                            model: 'gpt-image-1.5',
                                            sub: 'Previous Flagship',
                                            low: '$0.020',
                                            med: '$0.040',
                                            high: '$0.080',
                                            totalLow: '1,000',
                                            totalMed: '500',
                                            totalHigh: '250',
                                        },
                                        {
                                            model: 'gpt-image-2',
                                            sub: 'Flagship Photorealism',
                                            low: '$0.006',
                                            med: '$0.053',
                                            high: '$0.211',
                                            totalLow: '3,333',
                                            totalMed: '377',
                                            totalHigh: '94',
                                        },
                                    ].map((row) => (
                                        <div
                                            key={row.model}
                                            className={`p-2.5 space-y-1.5 transition-colors ${row.isRecommended ? 'bg-primary/5' : ''}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono text-xs font-bold text-foreground">
                                                        {row.model}
                                                    </span>
                                                    {row.isRecommended && (
                                                        <span className="rounded bg-primary/10 px-1 py-0.2 text-[9px] font-bold text-primary">
                                                            Recommended
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] italic text-muted-foreground">
                                                    ({row.sub})
                                                </span>
                                            </div>

                                            {/* 3-Tier Grid */}
                                            <div className="grid grid-cols-3 gap-1 pt-0.5 text-[10px]">
                                                <div className="rounded-lg bg-muted/40 p-1.5 text-center">
                                                    <span className="block text-[9px] font-semibold text-amber-600 dark:text-amber-400">
                                                        Low
                                                    </span>
                                                    <span className="font-mono font-bold text-foreground">
                                                        {row.low}
                                                    </span>
                                                    <span className="block text-[9px] text-muted-foreground">
                                                        {row.totalLow} imgs
                                                    </span>
                                                </div>
                                                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-1.5 text-center">
                                                    <span className="block text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                                                        Medium (Std)
                                                    </span>
                                                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                                                        {row.med}
                                                    </span>
                                                    <span className="block text-[9px] text-emerald-600/80 dark:text-emerald-400/80">
                                                        {row.totalMed} imgs
                                                    </span>
                                                </div>
                                                <div className="rounded-lg bg-muted/40 p-1.5 text-center">
                                                    <span className="block text-[9px] font-semibold text-purple-600 dark:text-purple-400">
                                                        High (HD)
                                                    </span>
                                                    <span className="font-mono font-bold text-foreground">
                                                        {row.high}
                                                    </span>
                                                    <span className="block text-[9px] text-muted-foreground">
                                                        {row.totalHigh} imgs
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Plan & API Usage Info Footer */}
                            <div className="flex items-start gap-2 rounded-lg bg-muted/40 p-2.5 text-[10px] leading-relaxed text-muted-foreground">
                                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                                <span>
                                    Usage is dynamically tracked against your{' '}
                                    <strong>$20.00 budget limit</strong> using exact
                                    OpenAI generation rates and quality tier capacity.
                                </span>
                            </div>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

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
                            className="h-8 w-8 cursor-pointer rounded-full text-muted-foreground shadow-2xs transition-all duration-200 hover:scale-105 hover:bg-primary/10 hover:text-primary hover:ring-1 hover:ring-primary/25 active:scale-95 data-[state=open]:scale-105 data-[state=open]:bg-primary/15 data-[state=open]:text-primary data-[state=open]:ring-2 data-[state=open]:ring-primary/40"
                        >
                            <CurrentIcon className="h-4 w-4 transition-transform duration-200" />
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        align="end"
                        sideOffset={10}
                        className="relative w-36 animate-in overflow-visible rounded-xl border border-border bg-popover/98 p-1 shadow-xl backdrop-blur-xl fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
                    >
                        {/* Directional Indicator Pointer back to icon */}
                        <div className="pointer-events-none absolute -top-1.5 right-3 h-3 w-3 rotate-45 border-t border-l border-border bg-popover" />

                        {themes.map(({ value, label, icon: Icon }) => {
                            const selected = appearance === value;

                            return (
                                <DropdownMenuItem
                                    key={value}
                                    onClick={() => updateAppearance(value)}
                                    className={`relative z-10 cursor-pointer rounded-lg px-2.5 py-1.5 transition-colors ${selected ? 'bg-primary/10 font-semibold text-primary' : 'hover:bg-muted'}`}
                                >
                                    <Icon className="mr-2 h-4 w-4" />
                                    <span className="text-xs">{label}</span>
                                    {selected && (
                                        <Check className="ml-auto h-3.5 w-3.5" />
                                    )}
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
                            className="relative h-8 w-8 cursor-pointer rounded-full text-muted-foreground shadow-2xs transition-all duration-200 hover:scale-105 hover:bg-primary/10 hover:text-primary hover:ring-1 hover:ring-primary/25 active:scale-95 data-[state=open]:scale-105 data-[state=open]:bg-primary/15 data-[state=open]:text-primary data-[state=open]:ring-2 data-[state=open]:ring-primary/40"
                        >
                            <Bell className="h-4 w-4 transition-transform duration-200" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 animate-in items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground shadow-sm ring-2 ring-background zoom-in-50">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        align="end"
                        sideOffset={10}
                        className="relative w-84 animate-in overflow-visible rounded-2xl border border-border bg-popover p-0 shadow-2xl shadow-black/20 duration-200 fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 sm:w-96 dark:shadow-black/50"
                    >
                        {/* Directional Indicator Pointer back to icon */}
                        <div className="pointer-events-none absolute -top-1.5 right-3 z-30 h-3 w-3 rotate-45 border-t border-l border-border bg-muted" />

                        {/* Notification Header */}
                        <div className="relative z-10 flex items-center justify-between rounded-t-2xl border-b border-border bg-muted/50 px-4 py-2.5">
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
                                        onClick={() =>
                                            handleNotificationClick(item)
                                        }
                                        className={`group relative flex cursor-pointer items-start gap-3 p-3.5 transition-colors hover:bg-muted/50 ${
                                            !item.read_at ? 'bg-muted/20' : ''
                                        }`}
                                    >
                                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted/60">
                                            {getNotificationIcon(item.type)}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p
                                                    className={`truncate text-xs font-semibold ${!item.read_at ? 'font-bold text-foreground' : 'text-foreground/90'}`}
                                                >
                                                    {item.title}
                                                </p>
                                                <span className="shrink-0 text-[10px] text-muted-foreground">
                                                    {formatTimeAgo(
                                                        item.created_at,
                                                    )}
                                                </span>
                                            </div>

                                            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
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
                                    Campaign, design generation, and event
                                    updates will appear here.
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
