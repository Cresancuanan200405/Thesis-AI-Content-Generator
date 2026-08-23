import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    Calendar,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Download,
    Filter,
    FolderOpen,
    ImageIcon,
    Layers,
    LayoutGrid,
    List,
    Loader2,
    MoreVertical,
    Pencil,
    Plus,
    Search,
    Sparkles,
    Tag,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const eventTypeStyles: Record<
    string,
    { bg: string; text: string; border: string; dot: string; label: string }
> = {
    regular: {
        bg: 'bg-rose-500/10 dark:bg-rose-950/40',
        text: 'text-rose-600 dark:text-rose-400',
        border: 'border-rose-500/30',
        dot: 'bg-rose-500',
        label: 'Regular Holiday',
    },
    special_non_working: {
        bg: 'bg-amber-500/10 dark:bg-amber-950/40',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-500/30',
        dot: 'bg-amber-500',
        label: 'Special Non-Working',
    },
    islamic: {
        bg: 'bg-emerald-500/10 dark:bg-emerald-950/40',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-500/30',
        dot: 'bg-emerald-500',
        label: 'Islamic Holiday',
    },
    commercial: {
        bg: 'bg-indigo-500/10 dark:bg-indigo-950/40',
        text: 'text-indigo-600 dark:text-indigo-400',
        border: 'border-indigo-500/30',
        dot: 'bg-indigo-500',
        label: 'Sales & Events',
    },
    holiday: {
        bg: 'bg-rose-500/10 dark:bg-rose-950/40',
        text: 'text-rose-600 dark:text-rose-400',
        border: 'border-rose-500/30',
        dot: 'bg-rose-500',
        label: 'Holiday',
    },
    custom: {
        bg: 'bg-purple-500/10 dark:bg-purple-950/40',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-500/30',
        dot: 'bg-purple-500',
        label: 'Custom Event',
    },
};

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
    | CREATE & EDIT DIALOG STATES
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

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('create') === 'true') {
                const eventId = params.get('event_id') || '';
                const evt = events.find((e: any) => String(e.id) === String(eventId));
                const prodName = params.get('product_name') || '';
                setFormData({
                    name: evt ? `${evt.name} Campaign` : prodName ? `${prodName} Campaign` : '',
                    event_id: eventId,
                    start_date: evt?.date || '',
                    end_date: evt?.date || '',
                });
                setIsCreateOpen(true);
            }
        }
    }, [events]);

    /* Event Picker Modal State (Same as AI Marketing Studio) */
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [eventModalTarget, setEventModalTarget] = useState<'create' | 'edit'>('create');
    const [eventSearchQuery, setEventSearchQuery] = useState('');
    const [eventCategoryFilter, setEventCategoryFilter] = useState('all');
    const currentYear = String(new Date().getFullYear());
    const [selectedYearTab, setSelectedYearTab] = useState(currentYear);

    const availableYears = useMemo(() => {
        const yrs = new Set<string>();
        events.forEach((e: any) => {
            if (e.date) {
                const yr = e.date.substring(0, 4);
                if (yr) yrs.add(yr);
            }
        });
        return Array.from(yrs).sort();
    }, [events]);

    const filteredEvents = useMemo(() => {
        return events.filter((evt: any) => {
            const matchesSearch =
                !eventSearchQuery.trim() ||
                evt.name?.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
                evt.description?.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
                evt.date?.includes(eventSearchQuery);

            const cat = evt.category || evt.type || 'holiday';
            const matchesCategory =
                eventCategoryFilter === 'all' ||
                (eventCategoryFilter === 'regular' && (cat === 'regular' || cat === 'holiday')) ||
                (eventCategoryFilter === 'special_non_working' && cat === 'special_non_working') ||
                (eventCategoryFilter === 'islamic' && cat === 'islamic') ||
                (eventCategoryFilter === 'commercial' && (cat === 'commercial' || cat === 'sale' || cat === 'retail')) ||
                (eventCategoryFilter === 'custom' && cat === 'custom');

            const matchesYear =
                selectedYearTab === 'all' ||
                (evt.date && evt.date.startsWith(selectedYearTab));

            return matchesSearch && matchesCategory && matchesYear;
        });
    }, [events, eventSearchQuery, eventCategoryFilter, selectedYearTab]);

    const handleSelectEvent = (evt: any) => {
        if (eventModalTarget === 'create') {
            setFormData((current) => ({
                ...current,
                event_id: String(evt.id),
                start_date: current.start_date || evt.date || '',
                end_date: current.end_date || evt.date || '',
                name: current.name || `${evt.name} Campaign`,
            }));
        } else {
            setEditFormData((current) => ({
                ...current,
                event_id: String(evt.id),
                start_date: current.start_date || evt.date || '',
                end_date: current.end_date || evt.date || '',
                name: current.name || `${evt.name} Campaign`,
            }));
        }
        setIsEventModalOpen(false);
    };

    const selectedCreateEvent = useMemo(() => {
        if (!formData.event_id) return null;
        return events.find((e: any) => String(e.id) === String(formData.event_id)) || null;
    }, [events, formData.event_id]);

    const selectedEditEvent = useMemo(() => {
        if (!editFormData.event_id) return null;
        return events.find((e: any) => String(e.id) === String(editFormData.event_id)) || null;
    }, [events, editFormData.event_id]);

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
        const campaignDesigns = campaign.designs || [];
        if (campaignDesigns.length === 0) {
            toast.info(`No design assets in "${campaign.name}" yet. Click "Create Design" to add visuals.`);
            return;
        }

        let downloaded = 0;
        toast.info(`Preparing ${campaignDesigns.length} visual asset${campaignDesigns.length > 1 ? 's' : ''} for download...`);

        campaignDesigns.forEach((design: any, index: number) => {
            const downloadUrl = design.download_url || design.image_url;
            if (downloadUrl) {
                downloaded++;
                setTimeout(() => {
                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.download = `${campaign.name}-${design.product_name || 'design'}-${index + 1}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }, index * 250);
            }
        });

        if (downloaded > 0) {
            setTimeout(() => {
                toast.success(`Downloading ${downloaded} design asset${downloaded > 1 ? 's' : ''} for "${campaign.name}"!`);
            }, 300);
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

                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                                <Layers className="h-4 w-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                                        Campaigns
                                    </h1>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Organize and manage your marketing campaigns around events, seasons, and launches.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            <Button
                                type="button"
                                onClick={() => {
                                    setFormData({
                                        name: '',
                                        event_id: '',
                                        start_date: '',
                                        end_date: '',
                                    });
                                    setFormErrors({});
                                    setIsCreateOpen(true);
                                }}
                                size="sm"
                                className="h-8 gap-1.5 font-semibold text-xs shadow-2xs"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Create Campaign
                            </Button>
                        </div>
                    </div>

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
                        TOOLBAR CARD (FILTERS, STATS & VIEW MODE)
                    ====================================================== */}

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 sm:p-4 shadow-xs">
                        <div className="inline-flex flex-wrap gap-1 rounded-xl border border-border/70 bg-muted/30 p-1">
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
                                                ? 'bg-card text-foreground shadow-xs font-semibold'
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
                            <div className="flex items-center rounded-lg border border-border/80 bg-muted/40 p-0.5">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('grid')}
                                    className={`flex h-7 w-7 items-center justify-center rounded-md transition-all ${viewMode === 'grid'
                                        ? 'bg-card text-foreground shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    aria-label="Grid view"
                                >
                                    <LayoutGrid className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('list')}
                                    className={`flex h-7 w-7 items-center justify-center rounded-md transition-all ${viewMode === 'list'
                                        ? 'bg-card text-foreground shadow-xs'
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
                CREATE CAMPAIGN MODAL (IMPROVED & PROFESSIONAL)
            ============================================================= */}

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="rounded-3xl border-border bg-card shadow-2xl sm:max-w-lg p-0 overflow-hidden">
                    <form onSubmit={handleCreateCampaign}>
                        <DialogHeader className="p-6 pb-4 border-b border-border/80 bg-muted/20">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <Plus className="h-4 w-4" />
                                </div>
                                <DialogTitle className="text-lg font-bold text-foreground">
                                    Create Campaign
                                </DialogTitle>
                            </div>

                            <DialogDescription className="text-xs text-muted-foreground mt-1">
                                Launch a new marketing campaign linked to holidays, seasonal sales, or product releases.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="p-6 space-y-5">
                            {/* Campaign Name */}
                            <div className="space-y-1.5">
                                <Label htmlFor="campaign-name" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                    Campaign Name *
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
                                    placeholder="e.g. Summer Mega Sale 2026"
                                    disabled={isSubmitting}
                                    className={`text-xs h-10 rounded-xl ${formErrors.name ? 'border-destructive' : ''}`}
                                />
                                {formErrors.name && (
                                    <p className="text-[11px] text-destructive font-medium">{formErrors.name}</p>
                                )}
                            </div>

                            {/* Linked Holiday or Event (AI Studio-style Picker Trigger) */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-primary" />
                                    Marketing Event or Holiday (Optional)
                                </Label>

                                {selectedCreateEvent ? (
                                    <div className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/5 p-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
                                                <CalendarDays className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-bold text-foreground">
                                                        {selectedCreateEvent.name}
                                                    </p>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[9px] uppercase tracking-wider ${eventTypeStyles[selectedCreateEvent.category || selectedCreateEvent.type || 'holiday']?.bg
                                                            } ${eventTypeStyles[selectedCreateEvent.category || selectedCreateEvent.type || 'holiday']?.text
                                                            } ${eventTypeStyles[selectedCreateEvent.category || selectedCreateEvent.type || 'holiday']?.border
                                                            }`}
                                                    >
                                                        {eventTypeStyles[selectedCreateEvent.category || selectedCreateEvent.type || 'holiday']?.label || 'Event'}
                                                    </Badge>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                                    {formatDate(selectedCreateEvent.date)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setEventModalTarget('create');
                                                    setIsEventModalOpen(true);
                                                }}
                                                className="h-7 text-xs shadow-none px-2.5"
                                            >
                                                Change
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    setFormData((current) => ({
                                                        ...current,
                                                        event_id: '',
                                                    }))
                                                }
                                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEventModalTarget('create');
                                            setIsEventModalOpen(true);
                                        }}
                                        className="flex h-11 w-full items-center justify-between rounded-xl border border-dashed border-border bg-muted/20 px-4 text-xs font-medium text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-foreground transition-all"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-primary" />
                                            Choose a retail event, season, or holiday...
                                        </span>
                                        <span className="font-semibold text-primary">Browse Events →</span>
                                    </button>
                                )}
                            </div>

                            {/* Timeline Dates */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="campaign-start-date" className="text-xs font-semibold text-foreground">
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
                                        className={`text-xs h-10 rounded-xl ${formErrors.start_date ? 'border-destructive' : ''}`}
                                    />
                                    {formErrors.start_date && (
                                        <p className="text-[11px] text-destructive font-medium">{formErrors.start_date}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="campaign-end-date" className="text-xs font-semibold text-foreground">
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
                                        className={`text-xs h-10 rounded-xl ${formErrors.end_date ? 'border-destructive' : ''}`}
                                    />
                                    {formErrors.end_date && (
                                        <p className="text-[11px] text-destructive font-medium">{formErrors.end_date}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="p-6 pt-3 border-t border-border/80 bg-muted/10">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetCreateForm}
                                disabled={isSubmitting}
                                className="text-xs rounded-xl shadow-none"
                            >
                                Cancel
                            </Button>

                            <Button
                                type="submit"
                                disabled={isSubmitting || !formData.name.trim()}
                                className="gap-2 text-xs rounded-xl shadow-sm"
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
                EDIT CAMPAIGN MODAL
            ============================================================= */}

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="rounded-3xl border-border bg-card shadow-2xl sm:max-w-lg p-0 overflow-hidden">
                    <form onSubmit={handleEditCampaign}>
                        <DialogHeader className="p-6 pb-4 border-b border-border/80 bg-muted/20">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <Pencil className="h-4 w-4" />
                                </div>
                                <DialogTitle className="text-lg font-bold text-foreground">
                                    Edit Campaign
                                </DialogTitle>
                            </div>
                            <DialogDescription className="text-xs text-muted-foreground mt-1">
                                Update your campaign details, timeline schedule, and active status.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="p-6 space-y-5">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-c-name" className="text-xs font-semibold text-foreground">
                                    Campaign Name *
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
                                    className={`text-xs h-10 rounded-xl ${editFormErrors.name ? 'border-destructive' : ''}`}
                                />
                                {editFormErrors.name && (
                                    <p className="text-[11px] text-destructive font-medium">{editFormErrors.name}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit-c-status" className="text-xs font-semibold text-foreground">
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
                                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring/30"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="active">Active</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>

                            {/* Linked Holiday or Event */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-primary" />
                                    Marketing Event or Holiday (Optional)
                                </Label>

                                {selectedEditEvent ? (
                                    <div className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/5 p-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
                                                <CalendarDays className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-bold text-foreground">
                                                        {selectedEditEvent.name}
                                                    </p>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[9px] uppercase tracking-wider ${eventTypeStyles[selectedEditEvent.category || selectedEditEvent.type || 'holiday']?.bg
                                                            } ${eventTypeStyles[selectedEditEvent.category || selectedEditEvent.type || 'holiday']?.text
                                                            } ${eventTypeStyles[selectedEditEvent.category || selectedEditEvent.type || 'holiday']?.border
                                                            }`}
                                                    >
                                                        {eventTypeStyles[selectedEditEvent.category || selectedEditEvent.type || 'holiday']?.label || 'Event'}
                                                    </Badge>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                                    {formatDate(selectedEditEvent.date)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setEventModalTarget('edit');
                                                    setIsEventModalOpen(true);
                                                }}
                                                className="h-7 text-xs shadow-none px-2.5"
                                            >
                                                Change
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    setEditFormData((current) => ({
                                                        ...current,
                                                        event_id: '',
                                                    }))
                                                }
                                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEventModalTarget('edit');
                                            setIsEventModalOpen(true);
                                        }}
                                        className="flex h-11 w-full items-center justify-between rounded-xl border border-dashed border-border bg-muted/20 px-4 text-xs font-medium text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-foreground transition-all"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-primary" />
                                            Choose a retail event, season, or holiday...
                                        </span>
                                        <span className="font-semibold text-primary">Browse Events →</span>
                                    </button>
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit-c-start" className="text-xs font-semibold text-foreground">
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
                                        className="text-xs h-10 rounded-xl"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="edit-c-end" className="text-xs font-semibold text-foreground">
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
                                        className="text-xs h-10 rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="p-6 pt-3 border-t border-border/80 bg-muted/10">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditOpen(false)}
                                disabled={isSavingEdit}
                                className="text-xs rounded-xl shadow-none"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSavingEdit || !editFormData.name.trim()}
                                className="gap-2 text-xs rounded-xl shadow-sm"
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
                SELECT MARKETING EVENT OR HOLIDAY MODAL (EXACT MATCH WITH STUDIO)
            ============================================================= */}

            <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
                <DialogContent className="max-h-[85vh] flex flex-col overflow-hidden rounded-3xl p-0 sm:max-w-4xl border-border bg-card shadow-2xl">
                    <DialogHeader className="border-b border-border p-4 sm:p-5 bg-muted/20 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                                <CalendarDays className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg sm:text-xl font-bold text-foreground">
                                    Select Marketing Event or Holiday
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                    Choose an event or holiday to tailor your visual concept, seasonal theme, and promotion.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Filter & Year Toolbar (Responsive Grid with Dropdowns) */}
                    <div className="border-b border-border p-4 bg-muted/10 shrink-0">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                            {/* Search Input */}
                            <div className="relative sm:col-span-6">
                                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={eventSearchQuery}
                                    onChange={(e) => setEventSearchQuery(e.target.value)}
                                    placeholder="Search events, holidays, sales..."
                                    className="h-9.5 pl-9 text-xs bg-card rounded-xl border-border"
                                />
                            </div>

                            {/* Category Filter Dropdown */}
                            <div className="sm:col-span-3">
                                <Select value={eventCategoryFilter} onValueChange={setEventCategoryFilter}>
                                    <SelectTrigger className="h-9.5 w-full rounded-xl text-xs bg-card font-medium border-border shadow-2xs">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-border shadow-lg">
                                        <SelectItem value="all">All Categories</SelectItem>
                                        <SelectItem value="regular">Regular Holidays</SelectItem>
                                        <SelectItem value="special_non_working">Special Non-Working</SelectItem>
                                        <SelectItem value="special_working">Special Working</SelectItem>
                                        <SelectItem value="islamic">Islamic Holidays</SelectItem>
                                        <SelectItem value="long_weekend">Long Weekends</SelectItem>
                                        <SelectItem value="commercial">Retail Sales & Payday</SelectItem>
                                        <SelectItem value="custom">Custom Events</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Year Selector Dropdown */}
                            <div className="sm:col-span-3">
                                <Select value={selectedYearTab} onValueChange={setSelectedYearTab}>
                                    <SelectTrigger className="h-9.5 w-full rounded-xl text-xs bg-card font-medium border-border shadow-2xs">
                                        <SelectValue placeholder="Year" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-border shadow-lg">
                                        <SelectItem value="all">All Years</SelectItem>
                                        {availableYears.map((yr) => (
                                            <SelectItem key={yr} value={yr}>
                                                Year {yr}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Events List Grid */}
                    <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-5">
                        {filteredEvents.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground space-y-2">
                                <CalendarDays className="mx-auto h-8 w-8 opacity-30" />
                                <p className="text-sm font-semibold text-foreground">No events found matching your filter</p>
                                <p className="text-xs text-muted-foreground">Try clearing search keywords or selecting "All" categories.</p>
                            </div>
                        ) : (
                            <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                                {filteredEvents.map((evt: any) => {
                                    const currentTargetId = eventModalTarget === 'create' ? formData.event_id : editFormData.event_id;
                                    const isSelected = String(evt.id) === String(currentTargetId);
                                    const styleKey = evt.category || evt.type || 'holiday';
                                    const style = eventTypeStyles[styleKey] || eventTypeStyles.holiday;

                                    return (
                                        <button
                                            key={evt.id}
                                            type="button"
                                            onClick={() => handleSelectEvent(evt)}
                                            className={`group flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${isSelected
                                                ? 'border-primary bg-primary/10 ring-2 ring-primary/40 shadow-xs'
                                                : 'border-border bg-card hover:border-primary/50 hover:bg-muted/30'
                                                }`}
                                        >
                                            <div className="space-y-1.5">
                                                <div className="flex items-start justify-between gap-1.5">
                                                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                                        {evt.name}
                                                    </span>
                                                    <Badge variant="outline" className={`text-[9px] uppercase tracking-wider shrink-0 font-medium ${style.bg} ${style.text} ${style.border}`}>
                                                        {style.label}
                                                    </Badge>
                                                </div>

                                                {evt.is_long_weekend && (
                                                    <Badge variant="secondary" className="text-[9px] font-medium py-0">
                                                        Long Weekend
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                                                <span className="font-medium text-[11px]">{formatDate(evt.date)}</span>
                                                {isSelected ? (
                                                    <span className="font-bold text-primary text-xs">Selected ✓</span>
                                                ) : (
                                                    <span className="text-[11px] font-medium group-hover:text-foreground transition-colors">Select</span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
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
                <DialogContent className="rounded-3xl border-border bg-card sm:max-w-md shadow-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-foreground">
                            Delete Campaign?
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-1">
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
                            className="text-xs rounded-xl shadow-none"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={confirmDeleteCampaign}
                            disabled={isDeleting}
                            className="gap-2 text-xs rounded-xl shadow-sm"
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
