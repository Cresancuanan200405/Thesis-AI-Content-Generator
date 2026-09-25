import { router } from '@inertiajs/react';
import {
    Archive,
    ArchiveRestore,
    CalendarDays,
    Check,
    CheckCircle2,
    Download,
    FolderOpen,
    ImageIcon,
    Layers,
    LayoutGrid,
    List,
    MoreVertical,
    Pencil,
    Plus,
    Sparkles,
    Tag,
    Trash2,
} from 'lucide-react';

import { AppPagination } from '@/components/ui/app-pagination';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
    statusGlow: Record<string, string>;
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
    statusOptions,
    statusDot,
    statusGlow,
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
    return (
        <div className="space-y-6">
            {/* =====================================================
                CAMPAIGN OVERVIEW / STATS
            ====================================================== */}
            <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-border/80">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <Layers className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                            Total Campaigns
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-semibold">{stats.total}</p>
                </div>

                <div className="rounded-2xl border border-emerald-500/20 bg-card p-4 shadow-sm transition-all hover:border-emerald-500/40">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Sparkles className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                            Active
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                        {stats.active}
                    </p>
                </div>

                <div className="rounded-2xl border border-blue-500/20 bg-card p-4 shadow-sm transition-all hover:border-blue-500/40">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <CalendarDays className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                            Scheduled
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-blue-600 dark:text-blue-400">
                        {stats.scheduled}
                    </p>
                </div>

                <div className="rounded-2xl border border-purple-500/20 bg-card p-4 shadow-sm transition-all hover:border-purple-500/40">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                            Completed
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-purple-600 dark:text-purple-400">
                        {stats.completed ?? 0}
                    </p>
                </div>
            </div>

            {/* =====================================================
                TOOLBAR CARD (FILTERS, STATS, ARCHIVE & VIEW DROPDOWN)
            ====================================================== */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs sm:p-4">
                <div className="inline-flex flex-wrap gap-1 rounded-xl border border-border/70 bg-muted/30 p-1">
                    {statusOptions.map((status) => {
                        const active =
                            statusFilter === (status === 'all' ? '' : status);

                        return (
                            <button
                                key={status}
                                type="button"
                                onClick={() => changeStatusFilter(status)}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                                    active
                                        ? 'bg-card font-semibold text-foreground shadow-xs'
                                        : 'text-muted-foreground hover:bg-card/60 hover:text-foreground'
                                } `}
                            >
                                {status !== 'all' && (
                                    <span
                                        className={`h-2 w-2 rounded-full ${statusDot[status]}`}
                                    />
                                )}

                                {status === 'all' ? 'All Campaigns' : status}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3">
                    <p className="text-xs font-medium text-muted-foreground">
                        Showing {sortedCampaigns.length}{' '}
                        {sortedCampaigns.length === 1
                            ? 'campaign'
                            : 'campaigns'}
                    </p>

                    {/* ARCHIVE FUNCTION BUTTON ICON (NO TEXT) */}
                    <Button
                        type="button"
                        variant={
                            statusFilter === 'archived' ? 'default' : 'outline'
                        }
                        size="sm"
                        onClick={() =>
                            changeStatusFilter(
                                statusFilter === 'archived'
                                    ? 'all'
                                    : 'archived',
                            )
                        }
                        title={
                            statusFilter === 'archived'
                                ? 'View Active Campaigns'
                                : 'View Archived Campaigns'
                        }
                        aria-label="Toggle Archived Campaigns"
                        className={`relative h-8 w-8 rounded-xl p-0 transition-all ${
                            statusFilter === 'archived'
                                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Archive className="h-4 w-4" />
                        {stats.archived > 0 && (
                            <span
                                className={`absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold ${
                                    statusFilter === 'archived'
                                        ? 'bg-destructive text-destructive-foreground'
                                        : 'bg-primary text-primary-foreground'
                                }`}
                            >
                                {stats.archived}
                            </span>
                        )}
                    </Button>

                    {/* VIEW FUNCTION DROPDOWN (SINGLE ICON - NO TEXT) */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 rounded-xl p-0 text-muted-foreground shadow-none hover:text-foreground"
                                aria-label="Switch view layout"
                                title={`Switch view layout (current: ${viewMode} view)`}
                            >
                                {viewMode === 'grid' ? (
                                    <LayoutGrid className="h-4 w-4" />
                                ) : (
                                    <List className="h-4 w-4" />
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-32 rounded-xl p-1 shadow-md"
                        >
                            <DropdownMenuItem
                                onClick={() => handleSetViewMode('grid')}
                                className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                                    viewMode === 'grid'
                                        ? 'bg-primary/10 font-semibold text-primary'
                                        : 'text-foreground hover:bg-muted'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <LayoutGrid className="h-3.5 w-3.5" />
                                    <span>Grid</span>
                                </div>
                                {viewMode === 'grid' && (
                                    <Check className="h-3.5 w-3.5 text-primary" />
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleSetViewMode('list')}
                                className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                                    viewMode === 'list'
                                        ? 'bg-primary/10 font-semibold text-primary'
                                        : 'text-foreground hover:bg-muted'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <List className="h-3.5 w-3.5" />
                                    <span>List</span>
                                </div>
                                {viewMode === 'list' && (
                                    <Check className="h-3.5 w-3.5 text-primary" />
                                )}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Primary Create Campaign Button */}
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => setIsCreateOpen(true)}
                        className="h-8 gap-1.5 rounded-xl px-3 text-xs font-semibold shadow-2xs"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Create Campaign</span>
                    </Button>
                </div>
            </div>

            {/* =====================================================
                CAMPAIGNS CARDS / LIST
            ====================================================== */}
            {sortedCampaigns.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center shadow-sm">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
                        <FolderOpen className="h-6 w-6" />
                    </div>

                    <h2 className="mt-4 text-base font-semibold">
                        {statusFilter
                            ? `No ${statusFilter} campaigns found`
                            : 'No campaigns created yet'}
                    </h2>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                        {statusFilter
                            ? 'Try switching to another status filter or create a new campaign.'
                            : 'Launch your first marketing campaign to organize and schedule your AI generated visuals.'}
                    </p>

                    <Button
                        className="mt-5 gap-2 shadow-sm"
                        onClick={() => setIsCreateOpen(true)}
                    >
                        <Plus className="h-4 w-4" />
                        Create Campaign
                    </Button>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {sortedCampaigns.map((campaign: any) => {
                        const status = campaign.status ?? 'active';
                        const designCount = Number(
                            campaign.design_count ||
                                (campaign.designs?.length ?? 0),
                        );
                        const currentGlow =
                            statusGlow[status] ?? statusGlow.active;
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
                                className={`group relative flex min-h-[160px] cursor-pointer flex-col justify-between overflow-hidden rounded-xl border bg-card text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:ring-2 focus:ring-primary/40 focus:outline-none ${currentGlow} `}
                            >
                                {/* CARD TOP HEADER */}
                                <div className="border-b border-border/50 p-3.5 sm:p-4">
                                    <div className="flex items-start justify-between gap-2.5">
                                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                            {/* CAMPAIGN ICON */}
                                            <div
                                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105 ${currentIcon.bg} ${currentIcon.text}`}
                                            >
                                                <Layers className="h-4 w-4" />
                                            </div>

                                            {/* NAME BESIDE ICON */}
                                            <div className="min-w-0 flex-1">
                                                <h2 className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                                                    {campaign.name}
                                                </h2>
                                                <div className="mt-0.5 flex items-center gap-1.5 text-[11px]">
                                                    <span
                                                        className={`inline-block h-1.5 w-1.5 rounded-full ${currentIcon.dot}`}
                                                    />
                                                    <span className="font-medium text-muted-foreground capitalize">
                                                        {currentIcon.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* DOTTED HAMBURGER MENU */}
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
                                                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:ring-2 focus:ring-primary/30 focus:outline-none"
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
                                <div className="flex flex-1 flex-col p-3.5 sm:p-4">
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
                                    <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-2.5">
                                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                                            <ImageIcon className="h-3.5 w-3.5 text-primary/70" />
                                            <span>
                                                {designCount}{' '}
                                                {designCount === 1
                                                    ? 'asset'
                                                    : 'assets'}
                                            </span>
                                        </div>
                                        <span className="text-[11px] font-medium text-primary group-hover:underline">
                                            View Details →
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* LIST VIEW */
                <div className="space-y-2">
                    {sortedCampaigns.map((campaign: any) => {
                        const status = campaign.status ?? 'active';
                        const eventName =
                            campaign.event_name ?? 'No event selected';
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
                                className="group flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-2.5 shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-sm sm:p-3"
                            >
                                {/* Status Icon */}
                                <div
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${currentIcon.bg} ${currentIcon.text}`}
                                >
                                    <Layers className="h-4 w-4" />
                                </div>

                                {/* Info */}
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-semibold text-foreground transition-colors group-hover:text-primary sm:text-sm">
                                        {campaign.name}
                                    </p>
                                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full ${currentIcon.dot}`}
                                        />
                                        <span className="font-medium capitalize">
                                            {currentIcon.label}
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
                                        <p className="truncate text-[11px] text-muted-foreground/80">
                                            {campaign.product_name}
                                        </p>
                                    )}
                                </div>

                                {/* Visuals count */}
                                <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-2 py-1 text-[11px] font-medium text-muted-foreground">
                                    <ImageIcon className="h-3 w-3 text-primary/70" />
                                    <span>{designCount}</span>
                                </div>

                                {/* Actions */}
                                <div onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
                                                aria-label="Actions"
                                            >
                                                <MoreVertical className="h-3.5 w-3.5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="end"
                                            className="w-48 rounded-xl border-border p-1.5 shadow-lg"
                                        >
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    openEditDialog(campaign);
                                                }}
                                                className="cursor-pointer gap-2 text-xs font-medium"
                                            >
                                                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />{' '}
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
                                                className="cursor-pointer gap-2 text-xs font-medium"
                                            >
                                                <Download className="h-3.5 w-3.5 text-muted-foreground" />{' '}
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
                                                    className="cursor-pointer gap-2 text-xs font-medium"
                                                >
                                                    <Archive className="h-3.5 w-3.5 text-muted-foreground" />{' '}
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
                                                    className="cursor-pointer gap-2 text-xs font-medium text-primary hover:bg-primary/10"
                                                >
                                                    <ArchiveRestore className="h-3.5 w-3.5 text-primary" />{' '}
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
                                                className="cursor-pointer gap-2 text-xs font-medium text-destructive focus:bg-destructive/10 focus:text-destructive"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />{' '}
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
                <AppPagination
                    currentPage={currentPage}
                    lastPage={lastPage}
                    onPageChange={(page) =>
                        router.get(
                            '/campaigns',
                            {
                                view: 'hub',
                                page,
                                status: statusFilter,
                            },
                            {
                                preserveScroll: true,
                            },
                        )
                    }
                    className="mt-8"
                />
            )}
        </div>
    );
}
