import { router } from '@inertiajs/react';
import {
    Archive,
    ArchiveRestore,
    CalendarDays,
    CheckCircle2,
    Download,
    ImageIcon,
    Layers,
    LayoutGrid,
    List,
    MoreVertical,
    Pencil,
    Plus,
    Search,
    Tag,
    Trash2,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { AppPagination } from '@/components/ui/app-pagination';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface CampaignHubViewProps {
    stats: {
        total: number;
        active: number;
        scheduled: number;
        completed: number;
        archived: number;
        designs?: number;
    };
    sortedCampaigns: any[];
    statusFilter: string;
    changeStatusFilter: (status: string) => void;
    viewMode: 'grid' | 'list';
    handleSetViewMode: (mode: 'grid' | 'list') => void;
    statusOptions: string[];
    statusDot: Record<string, string>;
    statusGlow?: Record<string, string>;
    statusIconColor: Record<
        string,
        { bg: string; text: string; dot: string; label: string }
    >;
    formatDateRange: (start?: string | null, end?: string | null) => string;
    openEditDialog: (campaign: any) => void;
    handleDownloadCampaign: (campaign: any) => void;
    handleArchiveCampaign: (campaign: any) => void;
    handleUnarchiveCampaign: (campaign: any) => void;
    setCampaignToDelete: (campaign: any) => void;
    setIsCreateOpen: (open: boolean) => void;
    currentPage: number;
    lastPage: number;
}

export function CampaignHubView({
    stats,
    sortedCampaigns,
    statusFilter,
    changeStatusFilter,
    viewMode,
    handleSetViewMode,
    statusDot,
    statusIconColor,
    formatDateRange,
    openEditDialog,
    handleDownloadCampaign,
    handleArchiveCampaign,
    handleUnarchiveCampaign,
    setCampaignToDelete,
    setIsCreateOpen,
    currentPage,
    lastPage,
}: CampaignHubViewProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const displayedCampaigns = useMemo(() => {
        let list = sortedCampaigns;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter((c: any) => {
                const matchesName = c.name?.toLowerCase().includes(q);
                const matchesProduct = c.product_name?.toLowerCase().includes(q);
                const matchesEvent = c.event_name?.toLowerCase().includes(q);
                const matchesObjective = c.objective?.toLowerCase().includes(q);
                return (
                    matchesName ||
                    matchesProduct ||
                    matchesEvent ||
                    matchesObjective
                );
            });
        }
        return list;
    }, [sortedCampaigns, searchQuery]);

    return (
        <div className="space-y-6">
            {/* =====================================================
                CAMPAIGN OVERVIEW / STATS
            ====================================================== */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-card border border-border/70 bg-card p-4 shadow-2xs transition-all hover:border-border">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <Layers className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                            Total Campaigns
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                        {stats.total}
                    </p>
                </div>

                <div className="rounded-card border border-border/70 bg-card p-4 shadow-2xs transition-all hover:border-border">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                            Active
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                        {stats.active}
                    </p>
                </div>

                <div className="rounded-card border border-border/70 bg-card p-4 shadow-2xs transition-all hover:border-border">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <CalendarDays className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                            Scheduled
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                        {stats.scheduled}
                    </p>
                </div>

                <div className="rounded-card border border-border/70 bg-card p-4 shadow-2xs transition-all hover:border-border">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                            Completed
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-violet-600 dark:text-violet-400">
                        {stats.completed ?? 0}
                    </p>
                </div>
            </div>

            {/* =====================================================
                FILTER TOOLBAR (SYSTEM DESIGN COMPATIBLE)
                Responsive across all zoom levels
            ====================================================== */}
            <div className="relative z-20 mb-5 rounded-card border border-white/25 bg-card/95 p-2.5 shadow-md backdrop-blur-xl transition-all sm:p-3 dark:border-white/10 dark:bg-card/95">
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                    {/* Search Input */}
                    <div className="relative min-w-0 flex-1">
                        <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search campaigns by name, objective, or product..."
                            className="h-8.5 border-input bg-background pr-8 pl-8.5 text-xs shadow-none focus-visible:ring-primary/30"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-muted-foreground/60 transition-colors hover:text-foreground"
                                aria-label="Clear search"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Filter & View Controls */}
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {/* Status Select Dropdown (Clean, replaces capsule pill buttons) */}
                        <div className="w-36 shrink-0 sm:w-40">
                            <Select
                                value={statusFilter || 'all'}
                                onValueChange={(val) => changeStatusFilter(val)}
                            >
                                <SelectTrigger className="h-8.5 w-full rounded-xl bg-background text-xs font-medium">
                                    <SelectValue placeholder="All Campaigns" />
                                </SelectTrigger>
                                <SelectContent align="end" className="rounded-xl border-border bg-popover">
                                    <SelectItem value="all" className="text-xs">
                                        All Campaigns ({stats.total})
                                    </SelectItem>
                                    <SelectItem value="active" className="text-xs">
                                        <span className="flex items-center gap-2">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                            Active ({stats.active})
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="scheduled" className="text-xs">
                                        <span className="flex items-center gap-2">
                                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                            Scheduled ({stats.scheduled})
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="completed" className="text-xs">
                                        <span className="flex items-center gap-2">
                                            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                                            Completed ({stats.completed})
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="archived" className="text-xs">
                                        <span className="flex items-center gap-2">
                                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                                            Archived ({stats.archived})
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* View Mode Toggle (Grid / List) */}
                        <div className="flex items-center rounded-xl border border-border/70 bg-muted/30 p-0.5">
                            <button
                                type="button"
                                onClick={() => handleSetViewMode('grid')}
                                title="Grid view"
                                className={`flex h-7.5 w-7.5 items-center justify-center rounded-lg transition-all ${
                                    viewMode === 'grid'
                                        ? 'bg-card text-foreground shadow-2xs font-semibold'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <LayoutGrid className="h-3.5 w-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSetViewMode('list')}
                                title="List view"
                                className={`flex h-7.5 w-7.5 items-center justify-center rounded-lg transition-all ${
                                    viewMode === 'list'
                                        ? 'bg-card text-foreground shadow-2xs font-semibold'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <List className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        {/* Campaign Count */}
                        <span className="hidden text-xs font-medium text-muted-foreground sm:inline-block pl-1">
                            {displayedCampaigns.length}{' '}
                            {displayedCampaigns.length === 1
                                ? 'campaign'
                                : 'campaigns'}
                        </span>

                        {/* Primary Create Campaign Button */}
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => setIsCreateOpen(true)}
                            className="h-8.5 gap-1.5 rounded-xl px-3 text-xs font-semibold shadow-2xs"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Create Campaign</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* =====================================================
                CAMPAIGNS CARDS / LIST
            ====================================================== */}
            {displayedCampaigns.length === 0 ? (
                <div className="rounded-card border border-dashed border-border bg-card px-6 py-16 text-center shadow-2xs">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                        <Layers className="h-6 w-6" />
                    </div>

                    <h3 className="mt-4 text-sm font-bold text-foreground">
                        {searchQuery
                            ? 'No Matching Campaigns Found'
                            : statusFilter === 'archived'
                              ? 'No Archived Campaigns'
                              : 'No Campaigns Found'}
                    </h3>

                    <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                        {searchQuery
                            ? `No campaigns match "${searchQuery}". Try clearing your search.`
                            : statusFilter === 'archived'
                              ? 'Archived campaigns will appear here when you archive past campaigns.'
                              : 'Create your first marketing campaign to generate AI assets, schedule events, and track creative performance.'}
                    </p>

                    <div className="mt-6 flex justify-center gap-3">
                        {searchQuery ? (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setSearchQuery('')}
                                className="h-8.5 rounded-xl text-xs font-semibold"
                            >
                                Clear Search
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => setIsCreateOpen(true)}
                                className="h-8.5 gap-1.5 rounded-xl text-xs font-semibold shadow-2xs"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Create Campaign
                            </Button>
                        )}
                    </div>
                </div>
            ) : viewMode === 'grid' ? (
                /* GRID VIEW — Modern, clean, NO capsule tags, NO neon glow */
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {displayedCampaigns.map((campaign: any) => {
                        const status = campaign.status ?? 'active';
                        const designCount = Number(
                            campaign.design_count ||
                                (campaign.designs?.length ?? 0),
                        );
                        const currentIcon =
                            statusIconColor[status] ?? statusIconColor.active;

                        return (
                            <div
                                key={campaign.id}
                                onClick={() =>
                                    router.visit(
                                        campaign.show_url ??
                                            `/campaigns/${campaign.id}`,
                                    )
                                }
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        router.visit(
                                            campaign.show_url ??
                                                `/campaigns/${campaign.id}`,
                                        );
                                    }
                                }}
                                className="group relative flex min-h-[168px] cursor-pointer flex-col justify-between overflow-hidden rounded-card border border-border/70 bg-card text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus:ring-2 focus:ring-primary/30 focus:outline-none"
                            >
                                {/* CARD TOP HEADER */}
                                <div className="border-b border-border/50 p-4">
                                    <div className="flex items-start justify-between gap-2.5">
                                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                            {/* CAMPAIGN ICON */}
                                            <div
                                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-foreground transition-transform duration-200 group-hover:scale-105`}
                                            >
                                                <Layers className="h-4 w-4 text-primary" />
                                            </div>

                                            {/* NAME BESIDE ICON */}
                                            <div className="min-w-0 flex-1">
                                                <h2 className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                                                    {campaign.name}
                                                </h2>
                                                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <span
                                                        className={`h-1.5 w-1.5 rounded-full ${statusDot[status] || 'bg-muted-foreground'}`}
                                                    />
                                                    <span className="capitalize font-medium">
                                                        {status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ACTIONS MENU */}
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                            }}
                                        >
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                        }}
                                                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:ring-2 focus:ring-primary/30 focus:outline-none"
                                                        aria-label="Campaign actions"
                                                    >
                                                        <MoreVertical className="h-3.5 w-3.5" />
                                                    </button>
                                                </DropdownMenuTrigger>

                                                <DropdownMenuContent
                                                    align="end"
                                                    className="z-50 w-48 rounded-xl border border-border bg-popover p-1.5 shadow-lg"
                                                >
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            openEditDialog(
                                                                campaign,
                                                            );
                                                        }}
                                                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                                        Edit Campaign
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleDownloadCampaign(
                                                                campaign,
                                                            );
                                                        }}
                                                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                                                    >
                                                        <Download className="h-3.5 w-3.5 text-muted-foreground" />
                                                        Download Assets
                                                    </DropdownMenuItem>

                                                    {campaign.status !==
                                                    'archived' ? (
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleArchiveCampaign(
                                                                    campaign,
                                                                );
                                                            }}
                                                            className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                                                        >
                                                            <Archive className="h-3.5 w-3.5 text-muted-foreground" />
                                                            Archive Campaign
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleUnarchiveCampaign(
                                                                    campaign,
                                                                );
                                                            }}
                                                            className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                                                        >
                                                            <ArchiveRestore className="h-3.5 w-3.5 text-primary" />
                                                            Restore to Active
                                                        </DropdownMenuItem>
                                                    )}

                                                    <DropdownMenuSeparator className="my-1 border-border/60" />

                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setCampaignToDelete(
                                                                campaign,
                                                            );
                                                        }}
                                                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Delete Campaign
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </div>

                                {/* CARD BODY DETAILS */}
                                <div className="flex flex-1 flex-col p-4">
                                    <div className="space-y-1.5 text-xs">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                                            <span className="truncate">
                                                {formatDateRange(
                                                    campaign.start_date,
                                                    campaign.end_date,
                                                )}
                                            </span>
                                        </div>

                                        {campaign.product_name && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Tag className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                                                <span className="truncate">
                                                    {campaign.product_name}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* CARD FOOTER */}
                                    <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                            <ImageIcon className="h-3.5 w-3.5 text-primary/70" />
                                            <span>
                                                {designCount}{' '}
                                                {designCount === 1
                                                    ? 'asset'
                                                    : 'assets'}
                                            </span>
                                        </div>
                                        <span className="text-xs font-semibold text-primary transition-colors group-hover:underline">
                                            View Campaign →
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* LIST VIEW — Modern editorial row layout */
                <div className="space-y-2">
                    {displayedCampaigns.map((campaign: any) => {
                        const status = campaign.status ?? 'active';
                        const eventName =
                            campaign.event_name ?? 'No event selected';
                        const designCount = Number(
                            campaign.design_count ||
                                (campaign.designs?.length ?? 0),
                        );

                        return (
                            <div
                                key={campaign.id}
                                onClick={() =>
                                    router.visit(
                                        campaign.show_url ??
                                            `/campaigns/${campaign.id}`,
                                    )
                                }
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        router.visit(
                                            campaign.show_url ??
                                                `/campaigns/${campaign.id}`,
                                        );
                                    }
                                }}
                                className="group flex cursor-pointer items-center gap-3 rounded-card border border-border/70 bg-card p-3 shadow-2xs transition-all duration-200 hover:border-primary/40 hover:shadow-sm"
                            >
                                {/* Status Icon */}
                                <div
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-foreground"
                                >
                                    <Layers className="h-4 w-4 text-primary" />
                                </div>

                                {/* Info */}
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-semibold text-foreground transition-colors group-hover:text-primary sm:text-sm">
                                        {campaign.name}
                                    </p>
                                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full ${statusDot[status] || 'bg-muted-foreground'}`}
                                        />
                                        <span className="font-medium capitalize">
                                            {status}
                                        </span>
                                        {eventName &&
                                            eventName !==
                                                'No event selected' && (
                                                <>
                                                    <span className="text-muted-foreground/40">
                                                        •
                                                    </span>
                                                    <span className="truncate">
                                                        {eventName}
                                                    </span>
                                                </>
                                            )}
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="hidden text-right text-xs text-muted-foreground md:block">
                                    <p className="font-medium">
                                        {formatDateRange(
                                            campaign.start_date,
                                            campaign.end_date,
                                        )}
                                    </p>
                                    {campaign.product_name && (
                                        <p className="truncate text-xs text-muted-foreground/80">
                                            {campaign.product_name}
                                        </p>
                                    )}
                                </div>

                                {/* Visuals count */}
                                <div className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-muted/20 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                    <ImageIcon className="h-3.5 w-3.5 text-primary/70" />
                                    <span>{designCount}</span>
                                </div>

                                {/* Actions */}
                                <div onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                                                aria-label="Actions"
                                            >
                                                <MoreVertical className="h-3.5 w-3.5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="end"
                                            className="w-48 rounded-xl border border-border p-1.5 shadow-lg"
                                        >
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    openEditDialog(campaign);
                                                }}
                                                className="cursor-pointer gap-2 rounded-lg text-xs font-medium"
                                            >
                                                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                                Edit Campaign
                                            </DropdownMenuItem>

                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleDownloadCampaign(
                                                        campaign,
                                                    );
                                                }}
                                                className="cursor-pointer gap-2 rounded-lg text-xs font-medium"
                                            >
                                                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                                                Download Assets
                                            </DropdownMenuItem>

                                            {campaign.status !== 'archived' ? (
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleArchiveCampaign(
                                                            campaign,
                                                        );
                                                    }}
                                                    className="cursor-pointer gap-2 rounded-lg text-xs font-medium"
                                                >
                                                    <Archive className="h-3.5 w-3.5 text-muted-foreground" />
                                                    Archive Campaign
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleUnarchiveCampaign(
                                                            campaign,
                                                        );
                                                    }}
                                                    className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-primary hover:bg-primary/10"
                                                >
                                                    <ArchiveRestore className="h-3.5 w-3.5 text-primary" />
                                                    Restore to Active
                                                </DropdownMenuItem>
                                            )}

                                            <DropdownMenuSeparator className="my-1 border-border/60" />

                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setCampaignToDelete(
                                                        campaign,
                                                    );
                                                }}
                                                className="cursor-pointer gap-2 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Delete Campaign
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* =====================================================
                PAGINATION
            ====================================================== */}
            {lastPage > 1 && (
                <div className="pt-2">
                    <AppPagination
                        currentPage={currentPage}
                        lastPage={lastPage}
                        onPageChange={(page) => {
                            router.get(
                                '/campaigns',
                                {
                                    status:
                                        statusFilter === 'all'
                                            ? ''
                                            : statusFilter,
                                    view: 'hub',
                                    page,
                                },
                                {
                                    preserveScroll: true,
                                    replace: true,
                                },
                            );
                        }}
                    />
                </div>
            )}
        </div>
    );
}
