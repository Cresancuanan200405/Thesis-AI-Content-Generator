import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Download,
    FolderOpen,
    ImageIcon,
    Layers,
    LayoutGrid,
    List,
    Loader2,
    MoreVertical,
    Pencil,
    Plus,
    Sparkles,
    Tag,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/*
|--------------------------------------------------------------------------
| STATUS STYLES & GLOWS
|--------------------------------------------------------------------------
*/

const statusGlow: Record<string, string> = {
    active:
        'border-emerald-500/40 shadow-[0_0_20px_-3px_rgba(16,185,129,0.15)] hover:border-emerald-500/70 hover:shadow-[0_0_25px_-3px_rgba(16,185,129,0.28)] dark:border-emerald-500/30 dark:shadow-[0_0_20px_-3px_rgba(16,185,129,0.1)] dark:hover:border-emerald-500/60 dark:hover:shadow-[0_0_25px_-3px_rgba(16,185,129,0.25)]',

    scheduled:
        'border-blue-500/40 shadow-[0_0_20px_-3px_rgba(59,130,246,0.15)] hover:border-blue-500/70 hover:shadow-[0_0_25px_-3px_rgba(59,130,246,0.28)] dark:border-blue-500/30 dark:shadow-[0_0_20px_-3px_rgba(59,130,246,0.1)] dark:hover:border-blue-500/60 dark:hover:shadow-[0_0_25px_-3px_rgba(59,130,246,0.25)]',

    completed:
        'border-violet-500/40 shadow-[0_0_20px_-3px_rgba(139,92,246,0.15)] hover:border-violet-500/70 hover:shadow-[0_0_25px_-3px_rgba(139,92,246,0.28)] dark:border-violet-500/30 dark:shadow-[0_0_20px_-3px_rgba(139,92,246,0.1)] dark:hover:border-violet-500/60 dark:hover:shadow-[0_0_25px_-3px_rgba(139,92,246,0.25)]',

    draft:
        'border-amber-500/30 shadow-[0_0_20px_-3px_rgba(245,158,11,0.1)] hover:border-amber-500/60 hover:shadow-[0_0_25px_-3px_rgba(245,158,11,0.22)] dark:border-amber-500/20 dark:shadow-[0_0_20px_-3px_rgba(245,158,11,0.08)] dark:hover:border-amber-500/50 dark:hover:shadow-[0_0_25px_-3px_rgba(245,158,11,0.2)]',
};

const statusIconColor: Record<
    string,
    { bg: string; text: string; dot: string; label: string }
> = {
    active: {
        bg: 'bg-emerald-500/10 dark:bg-emerald-950/50',
        text: 'text-emerald-600 dark:text-emerald-400',
        dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
        label: 'Active',
    },
    scheduled: {
        bg: 'bg-blue-500/10 dark:bg-blue-950/50',
        text: 'text-blue-600 dark:text-blue-400',
        dot: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]',
        label: 'Scheduled',
    },
    completed: {
        bg: 'bg-violet-500/10 dark:bg-violet-950/50',
        text: 'text-violet-600 dark:text-violet-400',
        dot: 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]',
        label: 'Completed',
    },
    draft: {
        bg: 'bg-amber-500/10 dark:bg-amber-950/50',
        text: 'text-amber-600 dark:text-amber-400',
        dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]',
        label: 'Draft',
    },
};

const statusDot: Record<string, string> = {
    draft: 'bg-amber-500',
    scheduled: 'bg-blue-500',
    active: 'bg-emerald-500',
    completed: 'bg-violet-500',
};

const statusOptions = [
    'all',
    'active',
    'scheduled',
    'draft',
    'completed',
];

/*
|--------------------------------------------------------------------------
| DATE HELPERS
|--------------------------------------------------------------------------
*/

function formatDate(date?: string | null) {
    if (!date) {
        return 'Date not set';
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return date;
    }

    return parsed.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatDateRange(
    startDate?: string | null,
    endDate?: string | null,
) {
    if (!startDate && !endDate) {
        return 'Dates not set';
    }

    if (startDate && !endDate) {
        return formatDate(startDate);
    }

    if (!startDate && endDate) {
        return formatDate(endDate);
    }

    return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

/*
|--------------------------------------------------------------------------
| PAGE COMPONENT
|--------------------------------------------------------------------------
*/

export default function CampaignsPage({
    campaigns = [],
    events = [],
    filters = {},
    pagination = {},
}: any) {
    const statusFilter = filters.status ?? '';

    const currentPage = pagination.current_page ?? 1;
    const lastPage = pagination.last_page ?? 1;

    /*
    |--------------------------------------------------------------------------
    | CREATE DIALOG
    |--------------------------------------------------------------------------
    */

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState({
        name: '',
        event_id: '',
        start_date: '',
        end_date: '',
    });

    /*
    |--------------------------------------------------------------------------
    | EDIT DIALOG
    |--------------------------------------------------------------------------
    */

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<any>(null);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});
    const [editFormData, setEditFormData] = useState({
        name: '',
        status: 'draft',
        event_id: '',
        start_date: '',
        end_date: '',
    });

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const openEditDialog = (campaign: any) => {
        setEditingCampaign(campaign);
        setEditFormData({
            name: campaign.name || '',
            status: campaign.status || 'draft',
            event_id: campaign.event_id ? String(campaign.event_id) : '',
            start_date: campaign.start_date || '',
            end_date: campaign.end_date || '',
        });
        setEditFormErrors({});
        setIsEditOpen(true);
    };

    const handleEditCampaign = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!editingCampaign) return;

        const name = editFormData.name.trim();
        if (!name) {
            setEditFormErrors({ name: 'Campaign name is required.' });
            return;
        }

        setIsSavingEdit(true);
        setEditFormErrors({});

        router.put(
            `/campaigns/${editingCampaign.id}`,
            {
                name,
                status: editFormData.status,
                event_id: editFormData.event_id || null,
                start_date: editFormData.start_date || null,
                end_date: editFormData.end_date || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsEditOpen(false);
                    setEditingCampaign(null);
                    toast.success('Campaign updated successfully!');
                },
                onError: (errors) => {
                    setEditFormErrors(errors as Record<string, string>);
                    toast.error('Failed to update campaign. Please check the inputs.');
                },
                onFinish: () => {
                    setIsSavingEdit(false);
                },
            },
        );
    };

    /*
    |--------------------------------------------------------------------------
    | DELETE DIALOG
    |--------------------------------------------------------------------------
    */

    const [campaignToDelete, setCampaignToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const confirmDeleteCampaign = () => {
        if (!campaignToDelete) return;
        setIsDeleting(true);
        router.delete(`/campaigns/${campaignToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setCampaignToDelete(null);
                toast.success('Campaign deleted successfully.');
            },
            onError: () => {
                toast.error('Failed to delete campaign.');
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    /*
    |--------------------------------------------------------------------------
    | DOWNLOAD ASSETS
    |--------------------------------------------------------------------------
    */

    const handleDownloadCampaign = (campaign: any) => {
        if (!campaign.designs || campaign.designs.length === 0) {
            toast.info(`No design assets in "${campaign.name}" yet. Click "Create Design" to add visuals.`);
            return;
        }

        // Trigger download for each design with an image
        let downloaded = 0;
        campaign.designs.forEach((design: any, index: number) => {
            if (design.image_url) {
                downloaded++;
                const link = document.createElement('a');
                link.href = design.image_url;
                link.download = `${campaign.name}-${design.product_name || 'design'}-${index + 1}.svg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        });

        if (downloaded > 0) {
            toast.success(`Downloading ${downloaded} design asset${downloaded > 1 ? 's' : ''} for ${campaign.name}!`);
        } else {
            toast.info('Design visual files are not available for download.');
        }
    };

    /*
    |--------------------------------------------------------------------------
    | SORT
    |--------------------------------------------------------------------------
    */

    const sortedCampaigns = useMemo(() => {
        return [...campaigns].sort((a: any, b: any) => {
            const aDate = a.start_date
                ? new Date(a.start_date).getTime()
                : Number.MAX_SAFE_INTEGER;

            const bDate = b.start_date
                ? new Date(b.start_date).getTime()
                : Number.MAX_SAFE_INTEGER;

            return aDate - bDate;
        });
    }, [campaigns]);

    /*
    |--------------------------------------------------------------------------
    | STATS
    |--------------------------------------------------------------------------
    */

    const stats = useMemo(() => {
        const active = campaigns.filter(
            (campaign: any) =>
                (campaign.status ?? 'draft') === 'active',
        ).length;

        const scheduled = campaigns.filter(
            (campaign: any) =>
                (campaign.status ?? 'draft') === 'scheduled',
        ).length;

        const designs = campaigns.reduce(
            (total: number, campaign: any) =>
                total + Number(campaign.design_count || 0),
            0,
        );

        return {
            total: campaigns.length,
            active,
            scheduled,
            designs,
        };
    }, [campaigns]);

    /*
    |--------------------------------------------------------------------------
    | FILTER
    |--------------------------------------------------------------------------
    */

    const changeStatusFilter = (value: string) => {
        router.get(
            '/campaigns',
            {
                status: value === 'all' ? '' : value,
                page: 1,
            },
            {
                preserveScroll: true,
                replace: true,
            },
        );
    };

    /*
    |--------------------------------------------------------------------------
    | CREATE HANDLER
    |--------------------------------------------------------------------------
    */

    const handleCreateCampaign = (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        const name = formData.name.trim();

        if (!name) {
            setFormErrors({ name: 'Campaign name is required.' });
            return;
        }

        setIsSubmitting(true);
        setFormErrors({});

        const startDate = formData.start_date || new Date().toISOString().split('T')[0];
        const endDate = formData.end_date || startDate;

        router.post(
            '/campaigns',
            {
                name,
                event_id: formData.event_id || null,
                description: '',
                objective: `Campaign for ${name}`,
                target_audience: '',
                start_date: startDate,
                end_date: endDate,
                status: 'draft',
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsCreateOpen(false);
                    setFormData({
                        name: '',
                        event_id: '',
                        start_date: '',
                        end_date: '',
                    });
                    setFormErrors({});
                    toast.success('Campaign created successfully!');
                },
                onError: (errors) => {
                    setFormErrors(errors as Record<string, string>);
                    toast.error('Failed to create campaign. Please check the inputs.');
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const resetCreateForm = () => {
        setIsCreateOpen(false);
        setFormErrors({});
        setFormData({
            name: '',
            event_id: '',
            start_date: '',
            end_date: '',
        });
    };

    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (
        <>
            <Head title="Campaigns" />

            <div className="min-h-screen bg-background text-foreground">
                <div className="p-4 md:p-6 lg:p-8">

                    {/* =====================================================
                        HEADER
                    ====================================================== */}

                    <section className="mb-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                    </div>

                                    <p className="text-sm font-medium text-muted-foreground">
                                        Marketing Hub
                                    </p>
                                </div>

                                <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
                                    Campaigns
                                </h1>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Organize and manage your marketing campaigns around events, seasons, and launches.
                                </p>
                            </div>

                            <Button
                                type="button"
                                onClick={() => setIsCreateOpen(true)}
                                className="group gap-2 shadow-sm"
                            >
                                <Plus className="h-4 w-4" />
                                Create Campaign
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </div>
                    </section>

                    {/* =====================================================
                        OVERVIEW STATS
                    ====================================================== */}

                    <div className="mb-6 grid gap-3 sm:grid-cols-4">
                        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-border/80">
                            <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                    <Layers className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-xs font-medium text-muted-foreground">
                                    Total Campaigns
                                </span>
                            </div>
                            <p className="mt-2 text-2xl font-semibold">
                                {stats.total}
                            </p>
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

                        <div className="rounded-2xl border border-violet-500/20 bg-card p-4 shadow-sm transition-all hover:border-violet-500/40">
                            <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                    <ImageIcon className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-xs font-medium text-muted-foreground">
                                    Linked Visuals
                                </span>
                            </div>
                            <p className="mt-2 text-2xl font-semibold text-violet-600 dark:text-violet-400">
                                {stats.designs}
                            </p>
                        </div>
                    </div>

                    {/* =====================================================
                        FILTER BAR
                    ====================================================== */}

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex flex-wrap gap-1 rounded-xl border border-border bg-muted/40 p-1">
                            {statusOptions.map((status) => {
                                const active =
                                    statusFilter ===
                                    (status === 'all' ? '' : status);

                                return (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => changeStatusFilter(status)}
                                        className={`
                                            inline-flex
                                            items-center
                                            gap-1.5
                                            rounded-lg
                                            px-3
                                            py-1.5
                                            text-xs
                                            font-medium
                                            capitalize
                                            transition-all
                                            ${active
                                                ? 'bg-card text-foreground shadow-sm font-semibold'
                                                : 'text-muted-foreground hover:bg-card/60 hover:text-foreground'
                                            }
                                        `}
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

                        <div className="flex items-center gap-3">
                            <p className="text-xs font-medium text-muted-foreground">
                                Showing {sortedCampaigns.length}{' '}
                                {sortedCampaigns.length === 1 ? 'campaign' : 'campaigns'}
                            </p>
                            <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('grid')}
                                    className={`flex h-7 w-7 items-center justify-center rounded-md transition-all ${
                                        viewMode === 'grid'
                                            ? 'bg-card text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                    aria-label="Grid view"
                                >
                                    <LayoutGrid className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('list')}
                                    className={`flex h-7 w-7 items-center justify-center rounded-md transition-all ${
                                        viewMode === 'list'
                                            ? 'bg-card text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                    aria-label="List view"
                                >
                                    <List className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* =====================================================
                        CAMPAIGNS GRID
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
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {sortedCampaigns.map((campaign: any) => {
                                const status = campaign.status ?? 'draft';
                                const eventName = campaign.event_name ?? 'No event selected';
                                const designCount = Number(campaign.design_count || (campaign.designs?.length ?? 0));
                                const currentGlow = statusGlow[status] ?? statusGlow.draft;
                                const currentIcon = statusIconColor[status] ?? statusIconColor.draft;

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
                                            if (
                                                e.key === 'Enter' ||
                                                e.key === ' '
                                            ) {
                                                router.visit(
                                                    campaign.show_url ??
                                                    `/campaigns/${campaign.id}`,
                                                );
                                            }
                                        }}
                                        className={`
                                            group
                                            relative
                                            flex
                                            min-h-[210px]
                                            cursor-pointer
                                            flex-col
                                            justify-between
                                            overflow-hidden
                                            rounded-2xl
                                            border
                                            bg-card
                                            text-left
                                            transition-all
                                            duration-300
                                            hover:-translate-y-1
                                            focus:outline-none
                                            focus:ring-2
                                            focus:ring-primary/40
                                            ${currentGlow}
                                        `}
                                    >
                                        {/* CARD TOP HEADER: LOGO BESIDE NAME + DOTTED MENU */}
                                        <div className="border-b border-border/60 p-5">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    {/* ICON LOGO */}
                                                    <div
                                                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${currentIcon.bg} ${currentIcon.text}`}
                                                    >
                                                        <Layers className="h-5 w-5" />
                                                    </div>

                                                    {/* NAME BESIDE ICON LOGO */}
                                                    <div className="min-w-0 flex-1">
                                                        <h2 className="truncate text-base font-semibold text-foreground transition-colors group-hover:text-primary">
                                                            {campaign.name}
                                                        </h2>
                                                        <div className="mt-1 flex items-center gap-2 text-xs">
                                                            <span
                                                                className={`inline-block h-2 w-2 rounded-full ${currentIcon.dot}`}
                                                            />
                                                            <span className="font-medium capitalize text-muted-foreground">
                                                                {currentIcon.label}
                                                            </span>
                                                            {eventName && eventName !== 'No event selected' && (
                                                                <>
                                                                    <span className="text-muted-foreground/40">•</span>
                                                                    <span className="truncate text-muted-foreground">
                                                                        {eventName}
                                                                    </span>
                                                                </>
                                                            )}
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
                                                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                                aria-label="Campaign actions"
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </button>
                                                        </DropdownMenuTrigger>

                                                        <DropdownMenuContent
                                                            align="end"
                                                            className="w-48 rounded-xl border border-border bg-popover p-1.5 shadow-lg z-50"
                                                        >
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    openEditDialog(campaign);
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
                                                                    handleDownloadCampaign(campaign);
                                                                }}
                                                                className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                                                            >
                                                                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                                                                Download Assets
                                                            </DropdownMenuItem>

                                                            <DropdownMenuSeparator className="my-1 border-border/60" />

                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setCampaignToDelete(campaign);
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
                                        <div className="flex flex-1 flex-col p-5">
                                            <div className="space-y-2.5">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                                                    <span className="truncate">
                                                        {formatDateRange(
                                                            campaign.start_date,
                                                            campaign.end_date,
                                                        )}
                                                    </span>
                                                </div>

                                                {campaign.product_name && (
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Tag className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                                                        <span className="truncate">
                                                            {campaign.product_name}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* CARD FOOTER */}
                                            <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-4">
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                                    <ImageIcon className="h-3.5 w-3.5 text-primary/70" />
                                                    <span>
                                                        {designCount}{' '}
                                                        {designCount === 1 ? 'design asset' : 'design assets'}
                                                    </span>
                                                </div>

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
                                const status = campaign.status ?? 'draft';
                                const eventName = campaign.event_name ?? 'No event selected';
                                const designCount = Number(campaign.design_count || (campaign.designs?.length ?? 0));
                                const currentIcon = statusIconColor[status] ?? statusIconColor.draft;

                                return (
                                    <div
                                        key={campaign.id}
                                        onClick={() => router.visit(campaign.show_url ?? `/campaigns/${campaign.id}`)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                router.visit(campaign.show_url ?? `/campaigns/${campaign.id}`);
                                            }
                                        }}
                                        className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-3.5 shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md hover:border-primary/40"
                                    >
                                        {/* Status Icon */}
                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${currentIcon.bg} ${currentIcon.text}`}>
                                            <Layers className="h-4 w-4" />
                                        </div>

                                        {/* Info */}
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                                {campaign.name}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                                <span className={`h-1.5 w-1.5 rounded-full ${currentIcon.dot}`} />
                                                <span className="capitalize font-medium">{currentIcon.label}</span>
                                                {eventName && eventName !== 'No event selected' && (
                                                    <>
                                                        <span className="text-muted-foreground/40">•</span>
                                                        <span className="truncate">{eventName}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Date */}
                                        <span className="shrink-0 text-xs text-muted-foreground hidden md:block">
                                            {formatDateRange(campaign.start_date, campaign.end_date)}
                                        </span>

                                        {/* Design Count */}
                                        <div className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground hidden sm:flex">
                                            <ImageIcon className="h-3 w-3 text-primary/70" />
                                            <span>{designCount}</span>
                                        </div>

                                        {/* Actions */}
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none"
                                                        aria-label="Campaign actions"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 shadow-lg border-border">
                                                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditDialog(campaign); }} className="gap-2 text-xs font-medium cursor-pointer">
                                                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Edit Campaign
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDownloadCampaign(campaign); }} className="gap-2 text-xs font-medium cursor-pointer">
                                                        <Download className="h-3.5 w-3.5 text-muted-foreground" /> Download Assets
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="my-1 border-border/60" />
                                                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCampaignToDelete(campaign); }} className="gap-2 text-xs font-medium text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                                                        <Trash2 className="h-3.5 w-3.5" /> Delete Campaign
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
                        <div className="mt-8 flex items-center justify-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 shadow-none"
                                disabled={currentPage <= 1}
                                onClick={() =>
                                    router.get(
                                        '/campaigns',
                                        {
                                            page: Math.max(
                                                1,
                                                currentPage - 1,
                                            ),
                                            status: statusFilter,
                                        },
                                        {
                                            preserveScroll: true,
                                        },
                                    )
                                }
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>

                            <span className="text-xs font-medium text-muted-foreground">
                                Page {currentPage} of {lastPage}
                            </span>

                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 shadow-none"
                                disabled={currentPage >= lastPage}
                                onClick={() =>
                                    router.get(
                                        '/campaigns',
                                        {
                                            page: Math.min(
                                                lastPage,
                                                currentPage + 1,
                                            ),
                                            status: statusFilter,
                                        },
                                        {
                                            preserveScroll: true,
                                        },
                                    )
                                }
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* =============================================================
                CREATE CAMPAIGN MODAL
            ============================================================= */}

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="rounded-2xl sm:max-w-lg">
                    <form onSubmit={handleCreateCampaign}>
                        <DialogHeader>
                            <DialogTitle className="text-lg">
                                Create Campaign
                            </DialogTitle>

                            <DialogDescription>
                                Create a campaign around an event, holiday, or seasonal promotion.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="campaign-name">
                                    Campaign Name
                                </Label>

                                <Input
                                    id="campaign-name"
                                    value={formData.name}
                                    onChange={(event) =>
                                        setFormData((current) => ({
                                            ...current,
                                            name: event.target.value,
                                        }))
                                    }
                                    placeholder="e.g. Summer Launch 2026"
                                    disabled={isSubmitting}
                                    className={formErrors.name ? 'border-destructive' : ''}
                                />
                                {formErrors.name && (
                                    <p className="text-xs text-destructive">{formErrors.name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="campaign-event"
                                    className="flex items-center gap-1.5"
                                >
                                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                                    Holiday / Event (Optional)
                                </Label>

                                <select
                                    id="campaign-event"
                                    value={formData.event_id}
                                    onChange={(event) => {
                                        const eventId = event.target.value;
                                        const selectedEvt = events.find((e: any) => String(e.id) === String(eventId));
                                        setFormData((current) => ({
                                            ...current,
                                            event_id: eventId,
                                            start_date: current.start_date || selectedEvt?.date || '',
                                            end_date: current.end_date || selectedEvt?.date || '',
                                            name: current.name || (selectedEvt ? `${selectedEvt.name} Campaign` : ''),
                                        }));
                                    }}
                                    disabled={isSubmitting}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30"
                                >
                                    <option value="">
                                        Select an event (optional)...
                                    </option>

                                    {[...events]
                                        .sort((a: any, b: any) => {
                                            const aDate = a.date ? new Date(a.date).getTime() : Number.MAX_SAFE_INTEGER;
                                            const bDate = b.date ? new Date(b.date).getTime() : Number.MAX_SAFE_INTEGER;
                                            return aDate - bDate;
                                        })
                                        .map((event: any) => (
                                            <option key={event.id} value={event.id}>
                                                {event.name} {event.date ? `(${formatDate(event.date)})` : ''}
                                            </option>
                                        ))}
                                </select>
                                {formErrors.event_id && (
                                    <p className="text-xs text-destructive">{formErrors.event_id}</p>
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="campaign-start-date">
                                        Start Date
                                    </Label>

                                    <Input
                                        id="campaign-start-date"
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(event) =>
                                            setFormData((current) => ({
                                                ...current,
                                                start_date: event.target.value,
                                            }))
                                        }
                                        disabled={isSubmitting}
                                        className={formErrors.start_date ? 'border-destructive' : ''}
                                    />
                                    {formErrors.start_date && (
                                        <p className="text-xs text-destructive">{formErrors.start_date}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="campaign-end-date">
                                        End Date
                                    </Label>

                                    <Input
                                        id="campaign-end-date"
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(event) =>
                                            setFormData((current) => ({
                                                ...current,
                                                end_date: event.target.value,
                                            }))
                                        }
                                        disabled={isSubmitting}
                                        className={formErrors.end_date ? 'border-destructive' : ''}
                                    />
                                    {formErrors.end_date && (
                                        <p className="text-xs text-destructive">{formErrors.end_date}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetCreateForm}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>

                            <Button
                                type="submit"
                                disabled={isSubmitting || !formData.name.trim()}
                                className="gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4" />
                                        Create Campaign
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* =============================================================
                EDIT CAMPAIGN MODAL (FROM HAMBURGER MENU)
            ============================================================= */}

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="rounded-2xl sm:max-w-lg">
                    <form onSubmit={handleEditCampaign}>
                        <DialogHeader>
                            <DialogTitle className="text-lg">
                                Edit Campaign
                            </DialogTitle>
                            <DialogDescription>
                                Update your campaign details, timeline schedule, and active status.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-c-name">
                                    Campaign Name
                                </Label>
                                <Input
                                    id="edit-c-name"
                                    value={editFormData.name}
                                    onChange={(e) =>
                                        setEditFormData((cur) => ({
                                            ...cur,
                                            name: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g. Summer Launch 2026"
                                    disabled={isSavingEdit}
                                    className={editFormErrors.name ? 'border-destructive' : ''}
                                />
                                {editFormErrors.name && (
                                    <p className="text-xs text-destructive">{editFormErrors.name}</p>
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-c-status">
                                        Status
                                    </Label>
                                    <select
                                        id="edit-c-status"
                                        value={editFormData.status}
                                        onChange={(e) =>
                                            setEditFormData((cur) => ({
                                                ...cur,
                                                status: e.target.value,
                                            }))
                                        }
                                        disabled={isSavingEdit}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="scheduled">Scheduled</option>
                                        <option value="active">Active</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-c-event">
                                        Linked Event (Optional)
                                    </Label>
                                    <select
                                        id="edit-c-event"
                                        value={editFormData.event_id}
                                        onChange={(e) =>
                                            setEditFormData((cur) => ({
                                                ...cur,
                                                event_id: e.target.value,
                                            }))
                                        }
                                        disabled={isSavingEdit}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30"
                                    >
                                        <option value="">No linked event</option>
                                        {events.map((ev: any) => (
                                            <option key={ev.id} value={ev.id}>
                                                {ev.name} {ev.date ? `(${formatDate(ev.date)})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-c-start">
                                        Start Date
                                    </Label>
                                    <Input
                                        id="edit-c-start"
                                        type="date"
                                        value={editFormData.start_date}
                                        onChange={(e) =>
                                            setEditFormData((cur) => ({
                                                ...cur,
                                                start_date: e.target.value,
                                            }))
                                        }
                                        disabled={isSavingEdit}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-c-end">
                                        End Date
                                    </Label>
                                    <Input
                                        id="edit-c-end"
                                        type="date"
                                        value={editFormData.end_date}
                                        onChange={(e) =>
                                            setEditFormData((cur) => ({
                                                ...cur,
                                                end_date: e.target.value,
                                            }))
                                        }
                                        disabled={isSavingEdit}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditOpen(false)}
                                disabled={isSavingEdit}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSavingEdit || !editFormData.name.trim()}
                                className="gap-2"
                            >
                                {isSavingEdit ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Saving Changes...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* =============================================================
                DELETE CAMPAIGN CONFIRMATION MODAL
            ============================================================= */}

            <Dialog
                open={!!campaignToDelete}
                onOpenChange={(open) => {
                    if (!open && !isDeleting) {
                        setCampaignToDelete(null);
                    }
                }}
            >
                <DialogContent className="rounded-2xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg">
                            Delete Campaign?
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-semibold text-foreground">
                                "{campaignToDelete?.name}"
                            </span>
                            ? This will remove the campaign record. Associated designs will remain safe in My Designs.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="mt-6 gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCampaignToDelete(null)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={confirmDeleteCampaign}
                            disabled={isDeleting}
                            className="gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            {isDeleting ? 'Deleting...' : 'Delete Campaign'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
