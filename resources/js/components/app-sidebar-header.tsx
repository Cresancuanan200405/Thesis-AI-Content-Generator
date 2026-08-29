import { Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowUpRight,
    Bell,
    Calendar,
    Check,
    CheckCheck,
    CheckCircle2,
    Coins,
    Cpu,
    Gauge,
    Hash,
    Info,
    Megaphone,
    Monitor,
    Moon,
    ShoppingBag,
    Sparkles,
    Sun,
} from 'lucide-react';
import * as React from 'react';

import { resolveNotificationConfig } from '@/components/notification-toast';
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
import { useNavigationOriginBreadcrumbs } from '@/hooks/use-navigation-origin';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem as BreadcrumbItemType, OpenAIUsageTelemetry } from '@/types';

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
    const config = resolveNotificationConfig(type);
    const Icon = config.icon;
    return <Icon className={cn('h-4 w-4', config.iconColor)} />;
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
            ai_usage?: OpenAIUsageTelemetry | null;
        }>().props;
    const { url } = usePage();
    const unreadCount = Number(unread_notifications_count || 0);
    const notifications = recent_notifications || [];

    const budgetLimit = Number(
        ai_usage?.budget_limit ??
        ai_usage?.application_configured_limit ??
        20.0
    );
    const totalSpent = Number(ai_usage?.total_spent ?? 0.0);
    const remainingBudget = Number(
        ai_usage?.remaining_budget ??
        ai_usage?.remaining_configured_limit ??
        Math.max(0, budgetLimit - totalSpent)
    );
    const totalGenerations = Number(
        ai_usage?.total_images ??
        ai_usage?.total_generations ??
        0
    );
    const totalRequests = Number(ai_usage?.total_requests ?? 0);
    const tokensUsedFormatted =
        ai_usage?.input_tokens_formatted ||
        ai_usage?.total_tokens_formatted ||
        (ai_usage?.input_tokens !== undefined && ai_usage?.input_tokens !== null
            ? Number(ai_usage.input_tokens).toLocaleString()
            : (ai_usage?.total_tokens !== undefined && ai_usage?.total_tokens !== null
                ? Number(ai_usage.total_tokens).toLocaleString()
                : '0'));
    const percentageUsed = Math.min(
        100,
        Math.max(
            0,
            ai_usage?.percentage_used !== undefined && ai_usage?.percentage_used !== null
                ? Number(ai_usage.percentage_used)
                : (budgetLimit > 0 ? Math.round((totalSpent / budgetLimit) * 100) : 0)
        )
    );
    const isLimitReached =
        Boolean(ai_usage?.is_limit_reached) ||
        percentageUsed >= 100 ||
        (budgetLimit > 0 && totalSpent >= budgetLimit);
    const isApproachingLimit = !isLimitReached && percentageUsed >= 80;
    const isUnavailable = ai_usage?.status === 'unavailable';
    const activeModel = ai_usage?.active_model || {
        id: 'gpt-image-2',
        display_name: 'GPT-Image-2',
        tag: 'Flagship Photorealism',
        badge: 'Recommended',
    };

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

    const resolvedBreadcrumbs = useNavigationOriginBreadcrumbs(breadcrumbs);

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
                            data-telemetry-trigger="true"
                            aria-label="AI Token & Quota Usage"
                            title={`OpenAI Synthesis Balance ($${budgetLimit.toFixed(2)} Limit)`}
                            className="h-8 gap-1.5 rounded-full px-2.5 text-xs font-semibold text-muted-foreground shadow-2xs transition-all duration-200 hover:scale-105 hover:bg-primary/10 hover:text-primary hover:ring-1 hover:ring-primary/25 active:scale-95 data-[state=open]:scale-105 data-[state=open]:bg-primary/15 data-[state=open]:text-primary data-[state=open]:ring-2 data-[state=open]:ring-primary/40"
                        >
                            <Coins className={`h-4 w-4 ${isLimitReached ? 'text-rose-500' : isApproachingLimit ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`} />
                            <span className="hidden font-mono text-[11px] font-bold sm:inline-block">
                                ${totalSpent.toFixed(2)}
                                <span className="font-normal text-muted-foreground">
                                    /${budgetLimit.toFixed(0)}
                                </span>
                            </span>
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        align="end"
                        sideOffset={8}
                        collisionPadding={16}
                        avoidCollisions={true}
                        className="w-[calc(100vw-2rem)] max-w-sm sm:max-w-md max-h-[86vh] overflow-y-auto rounded-2xl border border-border/80 bg-popover/98 p-0 shadow-2xl shadow-black/20 backdrop-blur-xl duration-200 fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 dark:shadow-black/50"
                    >
                        {/* 1. HEADER */}
                        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border/80 bg-popover/98 px-4 py-3 backdrop-blur-md">
                            <div className="flex items-center gap-2.5">
                                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1 ${
                                    isLimitReached
                                        ? 'bg-rose-500/10 text-rose-600 ring-rose-500/20'
                                        : isApproachingLimit
                                        ? 'bg-amber-500/10 text-amber-600 ring-amber-500/20'
                                        : 'bg-primary/10 text-primary ring-primary/20'
                                }`}>
                                    <Cpu className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-foreground">
                                        OpenAI Synthesis Balance
                                    </h3>
                                    <p className="text-[10px] text-muted-foreground">
                                        Current AI generation usage and available budget
                                    </p>
                                </div>
                            </div>
                            <Badge
                                variant="outline"
                                className="border-border bg-muted/40 font-mono text-[10px] font-bold text-foreground"
                            >
                                Limit: ${budgetLimit.toFixed(2)}
                            </Badge>
                        </div>

                        <div className="space-y-3.5 p-4">
                            {/* 2. PRIMARY BALANCE SECTION (4 Cards) */}
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                <div className="rounded-xl border border-border/70 bg-muted/20 p-2.5 text-center sm:text-left">
                                    <span className="text-[10px] font-medium text-muted-foreground">
                                        Used
                                    </span>
                                    <p className="mt-0.5 font-mono text-xs font-bold text-foreground">
                                        ${totalSpent.toFixed(2)}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-border/70 bg-muted/20 p-2.5 text-center sm:text-left">
                                    <span className="text-[10px] font-medium text-muted-foreground">
                                        Remaining
                                    </span>
                                    <p className={`mt-0.5 font-mono text-xs font-bold ${
                                        isLimitReached
                                            ? 'text-rose-600 dark:text-rose-400'
                                            : isApproachingLimit
                                            ? 'text-amber-600 dark:text-amber-400'
                                            : 'text-emerald-600 dark:text-emerald-400'
                                    }`}>
                                        ${remainingBudget.toFixed(2)}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-border/70 bg-muted/20 p-2.5 text-center sm:text-left">
                                    <span className="text-[10px] font-medium text-muted-foreground">
                                        Monthly Limit
                                    </span>
                                    <p className="mt-0.5 font-mono text-xs font-bold text-foreground">
                                        ${budgetLimit.toFixed(2)}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-border/70 bg-muted/20 p-2.5 text-center sm:text-left">
                                    <span className="text-[10px] font-medium text-muted-foreground">
                                        Usage
                                    </span>
                                    <p className="mt-0.5 font-mono text-xs font-bold text-foreground">
                                        {percentageUsed}%
                                    </p>
                                </div>
                            </div>

                            {/* 3. USAGE PROGRESS BAR */}
                            <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-foreground">
                                        AI Budget Usage
                                    </span>
                                    <span className="font-mono text-xs font-bold text-foreground">
                                        {percentageUsed}% used
                                    </span>
                                </div>

                                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                            isLimitReached
                                                ? 'bg-rose-500'
                                                : isApproachingLimit
                                                ? 'bg-amber-500'
                                                : 'bg-gradient-to-r from-emerald-500 via-primary to-blue-500'
                                        }`}
                                        style={{
                                            width: `${Math.min(100, Math.max(0, percentageUsed))}%`,
                                        }}
                                    />
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                    <span>${totalSpent.toFixed(2)} billed</span>
                                    <span>${remainingBudget.toFixed(2)} remaining</span>
                                </div>
                            </div>

                            {/* 4. AI ACTIVITY (3 Compact Metrics) */}
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    AI Activity
                                </span>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="rounded-xl border border-border/70 bg-muted/20 p-2.5 text-center">
                                        <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                                            <Sparkles className="h-3 w-3 text-primary" />
                                            <span>AI Images</span>
                                        </div>
                                        <p className="mt-1 font-mono text-xs font-bold text-foreground">
                                            {totalGenerations}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-border/70 bg-muted/20 p-2.5 text-center">
                                        <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                                            <Activity className="h-3 w-3 text-sky-500" />
                                            <span>AI Requests</span>
                                        </div>
                                        <p className="mt-1 font-mono text-xs font-bold text-foreground">
                                            {totalRequests}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-border/70 bg-muted/20 p-2.5 text-center">
                                        <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                                            <Hash className="h-3 w-3 text-purple-500" />
                                            <span>Tokens Used</span>
                                        </div>
                                        <p className="mt-1 font-mono text-xs font-bold text-foreground">
                                            {tokensUsedFormatted}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 5. QUOTA STATUS */}
                            <div className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs leading-relaxed ${
                                isUnavailable
                                    ? 'border-border/70 bg-muted/30 text-muted-foreground'
                                    : isLimitReached
                                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                                    : isApproachingLimit
                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            }`}>
                                {isUnavailable ? (
                                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                ) : isLimitReached ? (
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                                ) : isApproachingLimit ? (
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                ) : (
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                )}
                                <div className="space-y-0.5">
                                    <p className="font-bold">
                                        {isUnavailable
                                            ? 'Telemetry Unavailable'
                                            : isLimitReached
                                            ? 'Quota Reached'
                                            : isApproachingLimit
                                            ? 'Approaching Limit'
                                            : 'Available'}
                                    </p>
                                    <p className="text-[11px] opacity-90">
                                        {isUnavailable
                                            ? 'Usage data temporarily unavailable.'
                                            : isLimitReached
                                            ? 'New AI generations are temporarily unavailable.'
                                            : isApproachingLimit
                                            ? 'Your remaining AI budget is low (80%+ consumed).'
                                            : 'AI generation is available.'}
                                    </p>
                                </div>
                            </div>

                            {/* 6. CURRENT MODEL */}
                            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 p-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Sparkles className="h-3.5 w-3.5" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-semibold text-muted-foreground">
                                            Current Model
                                        </span>
                                        <p className="font-mono text-xs font-bold text-foreground">
                                            {activeModel.display_name || activeModel.id}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge
                                        variant="outline"
                                        className="border-primary/30 bg-primary/10 text-[9px] font-semibold text-primary"
                                    >
                                        {activeModel.tag || 'Flagship Photorealism'}
                                    </Badge>
                                </div>
                            </div>

                            {/* 7. FOOTER / ACTION */}
                            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-2.5 text-[10px] text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <Info className="h-3.5 w-3.5 shrink-0 text-primary" />
                                    <span>Authoritative OpenAI Telemetry</span>
                                </div>
                                <Button
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 gap-1 px-2 text-[10px] font-semibold text-primary hover:text-primary hover:bg-primary/10"
                                >
                                    <Link href="/subscriptions">
                                        <span>View detailed usage</span>
                                        <ArrowUpRight className="h-3 w-3" />
                                    </Link>
                                </Button>
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
