import { Head, router } from '@inertiajs/react';
import {
    Calendar,
    CalendarDays,
    Layers,
    Loader2,
    Pencil,
    Plus,
    Search,
    Sparkles,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CampaignHubView } from './components/campaign-hub-view';
import { CampaignsViewSwitcher } from './components/campaigns-view-switcher';
import { OpportunitiesView } from './components/opportunities-view';

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
    active: 'border-emerald-500/40 shadow-[0_0_20px_-3px_rgba(16,185,129,0.15)] hover:border-emerald-500/70 hover:shadow-[0_0_25px_-3px_rgba(16,185,129,0.28)] dark:border-emerald-500/30 dark:shadow-[0_0_20px_-3px_rgba(16,185,129,0.1)] dark:hover:border-emerald-500/60 dark:hover:shadow-[0_0_25px_-3px_rgba(16,185,129,0.25)]',

    scheduled:
        'border-blue-500/40 shadow-[0_0_20px_-3px_rgba(59,130,246,0.15)] hover:border-blue-500/70 hover:shadow-[0_0_25px_-3px_rgba(59,130,246,0.28)] dark:border-blue-500/30 dark:shadow-[0_0_20px_-3px_rgba(59,130,246,0.1)] dark:hover:border-blue-500/60 dark:hover:shadow-[0_0_25px_-3px_rgba(59,130,246,0.25)]',

    completed:
        'border-violet-500/40 shadow-[0_0_20px_-3px_rgba(139,92,246,0.15)] hover:border-violet-500/70 hover:shadow-[0_0_25px_-3px_rgba(139,92,246,0.28)] dark:border-violet-500/30 dark:shadow-[0_0_20px_-3px_rgba(139,92,246,0.1)] dark:hover:border-violet-500/60 dark:hover:shadow-[0_0_25px_-3px_rgba(139,92,246,0.25)]',

    archived:
        'border-border/70 shadow-none hover:border-border dark:border-border/60 dark:hover:border-border opacity-85',

    draft: 'border-amber-500/30 shadow-[0_0_20px_-3px_rgba(245,158,11,0.1)] hover:border-amber-500/60 hover:shadow-[0_0_25px_-3px_rgba(245,158,11,0.22)] dark:border-amber-500/20 dark:shadow-[0_0_20px_-3px_rgba(245,158,11,0.08)] dark:hover:border-amber-500/50 dark:hover:shadow-[0_0_25px_-3px_rgba(245,158,11,0.2)]',
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
    archived: {
        bg: 'bg-zinc-500/10 dark:bg-zinc-800/50',
        text: 'text-zinc-600 dark:text-zinc-400',
        dot: 'bg-zinc-500 shadow-[0_0_8px_rgba(113,113,122,0.8)]',
        label: 'Archived',
    },
    draft: {
        bg: 'bg-amber-500/10 dark:bg-amber-950/50',
        text: 'text-amber-600 dark:text-amber-400',
        dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]',
        label: 'Draft',
    },
};

const statusDot: Record<string, string> = {
    scheduled: 'bg-blue-500',
    active: 'bg-emerald-500',
    completed: 'bg-violet-500',
    archived: 'bg-zinc-500',
    draft: 'bg-amber-500',
};

const statusOptions = ['all', 'active', 'scheduled', 'completed'];

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

function formatDateRange(startDate?: string | null, endDate?: string | null) {
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
    events_and_holidays = [],
    filters = {},
    pagination = {},
    upcoming_opportunities = [],
    campaign_year,
    account_year,
    view = 'opportunities',
    serverStats: _serverStats = {},
}: any) {
    const rawEvents =
        events_and_holidays.length > 0 ? events_and_holidays : events;
    const currentCampaignYear =
        campaign_year || account_year || new Date().getFullYear();
    const statusFilter = filters.status ?? '';

    const currentPage = pagination.current_page ?? 1;
    const lastPage = pagination.last_page ?? 1;

    /*
    |--------------------------------------------------------------------------
    | VIEW STATE (OPPORTUNITIES vs CAMPAIGN HUB)
    |--------------------------------------------------------------------------
    */
    const initialView = useMemo<'opportunities' | 'hub'>(() => {
        const queryView =
            typeof window !== 'undefined'
                ? new URLSearchParams(window.location.search).get('view')
                : null;

        if (queryView === 'hub' || queryView === 'opportunities') {
            return queryView;
        }

        if (filters.view === 'hub' || filters.view === 'opportunities') {
            return filters.view;
        }

        if (view === 'hub' || view === 'opportunities') {
            return view;
        }

        return 'opportunities';
    }, [filters.view, view]);

    const [activeView, setActiveView] = useState<'opportunities' | 'hub'>(
        initialView,
    );

    useEffect(() => {
        if (filters.view === 'hub' || filters.view === 'opportunities') {
            setActiveView(filters.view);
        } else if (view === 'hub' || view === 'opportunities') {
            setActiveView(view);
        }
    }, [filters.view, view]);

    const handleViewChange = (newView: 'opportunities' | 'hub') => {
        setActiveView(newView);
        router.get(
            '/campaigns',
            {
                ...filters,
                view: newView,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const upcomingList = useMemo(() => {
        if (upcoming_opportunities && upcoming_opportunities.length > 0) {
            return upcoming_opportunities;
        }

        return rawEvents
            .filter((e: any) => e.is_upcoming)
            .sort(
                (a: any, b: any) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime(),
            );
    }, [upcoming_opportunities, rawEvents]);

    /*
    |--------------------------------------------------------------------------
    | CREATE & EDIT DIALOG STATES
    |--------------------------------------------------------------------------
    */

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEventLocked, setIsEventLocked] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [createSource, setCreateSource] = useState<
        'holiday' | 'marketing' | 'custom'
    >('holiday');

    const [formData, setFormData] = useState({
        name: '',
        event_id: '',
        start_date: '',
        end_date: '',
        status: 'active',
    });

    const hasCustomEvents = useMemo(() => {
        return events.some(
            (e: any) => e.category === 'custom' || e.type === 'custom',
        );
    }, [events]);

    const handleCreateFromEvent = (evt: any) => {
        if (evt.has_campaign && evt.campaign_id) {
            toast.info(
                `Opening existing campaign "${evt.campaign_name || evt.name}" for this event...`,
            );
            router.visit(`/campaigns/${evt.campaign_id}`);
            return;
        }

        const isCommercial =
            evt.category === 'commercial' ||
            evt.type === 'commercial' ||
            evt.type === 'sale';
        const isCustom = evt.category === 'custom' || evt.type === 'custom';
        const source = isCustom
            ? 'custom'
            : isCommercial
              ? 'marketing'
              : 'holiday';

        setCreateSource(source);
        setFormData({
            name: `${evt.name} Campaign`,
            event_id: String(evt.id),
            start_date: evt.start_date || evt.date || '',
            end_date: evt.end_date || evt.date || '',
            status: 'active',
        });
        setFormErrors({});
        setIsEventLocked(true);
        setIsCreateOpen(true);
    };

    const handleOpenGeneralCreate = (
        open: boolean,
        initialSource: 'holiday' | 'marketing' | 'custom' = 'holiday',
    ) => {
        if (open) {
            setCreateSource(initialSource);
            setFormData({
                name: '',
                event_id: '',
                start_date: '',
                end_date: '',
                status: 'active',
            });
            setFormErrors({});
            setIsEventLocked(false);
        }

        setIsCreateOpen(open);
    };

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<any>(null);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [editFormErrors, setEditFormErrors] = useState<
        Record<string, string>
    >({});
    const [editFormData, setEditFormData] = useState({
        name: '',
        status: 'active',
        start_date: '',
        end_date: '',
    });

    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(
                'marketpilot_campaigns_view_mode',
            );

            if (saved === 'grid' || saved === 'list') {
                return saved;
            }
        }

        return 'grid';
    });

    const handleSetViewMode = (mode: 'grid' | 'list') => {
        setViewMode(mode);

        if (typeof window !== 'undefined') {
            localStorage.setItem('marketpilot_campaigns_view_mode', mode);
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);

            if (params.get('create') === 'true') {
                const eventId = params.get('event_id') || '';
                const evt = events.find(
                    (e: any) => String(e.id) === String(eventId),
                );

                if (evt && evt.has_campaign && evt.campaign_id) {
                    toast.info(
                        `Opening existing campaign "${evt.campaign_name || evt.name}" for this event...`,
                    );
                    router.visit(`/campaigns/${evt.campaign_id}`);
                    return;
                }

                const prodName = params.get('product_name') || '';
                const isCommercial =
                    evt?.category === 'commercial' ||
                    evt?.type === 'commercial' ||
                    evt?.type === 'sale';
                const isCustom =
                    evt?.category === 'custom' || evt?.type === 'custom';
                const source = isCustom
                    ? 'custom'
                    : isCommercial
                      ? 'marketing'
                      : 'holiday';

                setCreateSource(source);
                setFormData({
                    name: evt
                        ? `${evt.name} Campaign`
                        : prodName
                          ? `${prodName} Campaign`
                          : '',
                    event_id: eventId,
                    start_date: evt?.start_date || evt?.date || '',
                    end_date: evt?.end_date || evt?.date || '',
                    status: 'active',
                });
                setIsEventLocked(Boolean(eventId));
                setIsCreateOpen(true);
            }
        }
    }, [events]);

    /* Event Picker Modal State (Same as AI Marketing Studio) */
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [eventModalTarget, setEventModalTarget] = useState<'create' | 'edit'>(
        'create',
    );
    const [eventSearchQuery, setEventSearchQuery] = useState('');
    const [eventCategoryFilter, setEventCategoryFilter] = useState('all');
    const currentYear = String(new Date().getFullYear());
    const [selectedYearTab, setSelectedYearTab] = useState(currentYear);

    const availableYears = useMemo(() => {
        const yrs = new Set<string>();
        events.forEach((e: any) => {
            if (e.date) {
                const yr = e.date.substring(0, 4);

                if (yr) {
                    yrs.add(yr);
                }
            }
        });

        return Array.from(yrs).sort();
    }, [events]);

    const filteredEvents = useMemo(() => {
        return events.filter((evt: any) => {
            const matchesSearch =
                !eventSearchQuery.trim() ||
                evt.name
                    ?.toLowerCase()
                    .includes(eventSearchQuery.toLowerCase()) ||
                evt.description
                    ?.toLowerCase()
                    .includes(eventSearchQuery.toLowerCase()) ||
                evt.date?.includes(eventSearchQuery);

            const cat = evt.category || evt.type || 'holiday';
            const matchesCategory =
                eventCategoryFilter === 'all' ||
                (eventCategoryFilter === 'holiday' &&
                    (cat === 'regular' ||
                        cat === 'holiday' ||
                        cat === 'special_non_working' ||
                        cat === 'special_working' ||
                        cat === 'islamic')) ||
                (eventCategoryFilter === 'regular' &&
                    (cat === 'regular' || cat === 'holiday')) ||
                (eventCategoryFilter === 'special_non_working' &&
                    cat === 'special_non_working') ||
                (eventCategoryFilter === 'islamic' && cat === 'islamic') ||
                (eventCategoryFilter === 'commercial' &&
                    (cat === 'commercial' ||
                        cat === 'sale' ||
                        cat === 'retail')) ||
                (eventCategoryFilter === 'custom' && cat === 'custom');

            const matchesYear =
                selectedYearTab === 'all' ||
                (evt.date && evt.date.startsWith(selectedYearTab));

            return matchesSearch && matchesCategory && matchesYear;
        });
    }, [events, eventSearchQuery, eventCategoryFilter, selectedYearTab]);

    const handleSelectEvent = (evt: any) => {
        if (evt.has_campaign && evt.campaign_id) {
            toast.info(
                `Opening existing campaign "${evt.campaign_name || evt.name}" for this event.`,
            );
            setIsEventModalOpen(false);
            setIsCreateOpen(false);
            router.visit(`/campaigns/${evt.campaign_id}`);
            return;
        }

        setFormData((current) => ({
            ...current,
            event_id: String(evt.id),
            start_date: evt.start_date || evt.date || current.start_date || '',
            end_date: evt.end_date || evt.date || current.end_date || '',
            name: `${evt.name} Campaign`,
        }));

        setIsEventModalOpen(false);
    };

    const selectedCreateEvent = useMemo(() => {
        if (!formData.event_id) {
            return null;
        }

        return (
            events.find(
                (e: any) => String(e.id) === String(formData.event_id),
            ) || null
        );
    }, [events, formData.event_id]);

    const openEditDialog = (campaign: any) => {
        setEditingCampaign(campaign);
        setEditFormData({
            name: campaign.name || '',
            status: campaign.status || 'active',
            start_date: campaign.start_date || '',
            end_date: campaign.end_date || '',
        });
        setEditFormErrors({});
        setIsEditOpen(true);
    };

    const handleEditCampaign = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!editingCampaign) {
            return;
        }

        const name = editFormData.name.trim();
        const errors: Record<string, string> = {};

        if (!name) {
            errors.name = 'Campaign name is required.';
        }

        if (
            editFormData.start_date &&
            editFormData.end_date &&
            editFormData.start_date > editFormData.end_date
        ) {
            errors.end_date = 'Start date must not be after end date.';
        }

        if (Object.keys(errors).length > 0) {
            setEditFormErrors(errors);

            return;
        }

        setIsSavingEdit(true);
        setEditFormErrors({});

        router.put(
            `/campaigns/${editingCampaign.id}`,
            {
                name,
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
                    toast.error(
                        'Failed to update campaign. Please check the inputs.',
                    );
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
        if (!campaignToDelete) {
            return;
        }

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
    | ARCHIVE & UNARCHIVE HANDLERS
    |--------------------------------------------------------------------------
    */

    const handleArchiveCampaign = (campaign: any) => {
        router.post(
            `/campaigns/${campaign.id}/archive`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`"${campaign.name}" moved to archive.`);
                },
                onError: () => {
                    toast.error('Failed to archive campaign.');
                },
            },
        );
    };

    const handleUnarchiveCampaign = (campaign: any) => {
        router.post(
            `/campaigns/${campaign.id}/unarchive`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        `"${campaign.name}" restored to active campaigns.`,
                    );
                },
                onError: () => {
                    toast.error('Failed to restore campaign.');
                },
            },
        );
    };

    /*
    |--------------------------------------------------------------------------
    | DOWNLOAD ASSETS
    |--------------------------------------------------------------------------
    */

    const handleDownloadCampaign = (campaign: any) => {
        const campaignDesigns = campaign.designs || [];

        if (campaignDesigns.length === 0) {
            toast.info(
                `No design assets in "${campaign.name}" yet. Click "Create Design" to add visuals.`,
            );

            return;
        }

        let downloaded = 0;
        toast.info(
            `Preparing ${campaignDesigns.length} visual asset${campaignDesigns.length > 1 ? 's' : ''} for download...`,
        );

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
                toast.success(
                    `Downloading ${downloaded} design asset${downloaded > 1 ? 's' : ''} for "${campaign.name}"!`,
                );
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
            (campaign: any) => (campaign.status ?? 'active') === 'active',
        ).length;

        const scheduled = campaigns.filter(
            (campaign: any) => (campaign.status ?? 'active') === 'scheduled',
        ).length;

        const completed = campaigns.filter(
            (campaign: any) => (campaign.status ?? 'active') === 'completed',
        ).length;

        const archived = campaigns.filter(
            (campaign: any) => (campaign.status ?? 'active') === 'archived',
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
            completed,
            archived,
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
                ...filters,
                view: 'hub',
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

    const handleCreateCampaign = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // Prevent duplicate campaign creation if selected event already has a campaign (Phase 6)
        if (
            selectedCreateEvent?.has_campaign &&
            selectedCreateEvent?.campaign_id
        ) {
            toast.info(
                `Opening existing campaign "${selectedCreateEvent.campaign_name || selectedCreateEvent.name}"...`,
            );
            setIsCreateOpen(false);
            router.visit(`/campaigns/${selectedCreateEvent.campaign_id}`);
            return;
        }

        const errors: Record<string, string> = {};
        const campaignName = formData.name.trim();

        if (!campaignName) {
            errors.name = 'Campaign name is required.';
        }

        if (!formData.event_id) {
            errors.event_id =
                createSource === 'holiday'
                    ? 'Please select an existing Philippine holiday.'
                    : createSource === 'marketing'
                      ? 'Please select an existing marketing event.'
                      : 'Please select an existing custom event.';
        }

        if (!formData.start_date) {
            errors.start_date = 'Start date is required.';
        }

        if (!formData.end_date) {
            errors.end_date = 'End date is required.';
        }

        if (
            formData.start_date &&
            formData.end_date &&
            formData.start_date > formData.end_date
        ) {
            errors.end_date = 'End date cannot be earlier than start date.';
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            toast.error('Please select an event and fill in all required fields.');
            return;
        }

        setIsSubmitting(true);
        setFormErrors({});

        router.post(
            '/campaigns',
            {
                name: campaignName,
                event_id: formData.event_id,
                description: '',
                objective: `Campaign for ${campaignName}`,
                target_audience: '',
                start_date: formData.start_date,
                end_date: formData.end_date,
                status: formData.status || 'active',
                redirect_to: 'setup',
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    resetCreateForm();
                    toast.success('Campaign created successfully!');
                },
                onError: (errors) => {
                    setFormErrors(errors as Record<string, string>);
                    toast.error(
                        'Failed to create campaign. Please check the inputs.',
                    );
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const resetCreateForm = () => {
        setIsCreateOpen(false);
        setIsEventLocked(false);
        setCreateSource('holiday');
        setFormErrors({});
        setFormData({
            name: '',
            event_id: '',
            start_date: '',
            end_date: '',
            status: 'active',
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

            <div className="min-h-screen bg-background pb-28 text-foreground">
                <div className="p-4 md:p-6 lg:p-8">
                    {/* =====================================================
                        HEADER
                    ====================================================== */}

                    {/* =====================================================
                        HEADER & PROMINENT VIEW SWITCHER
                    ====================================================== */}
                    <div className="mb-6 flex flex-col gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-0.5 shadow-xs ring-1 ring-primary/20">
                                <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-background/80 dark:bg-card">
                                    <Layers className="h-4.5 w-4.5 text-primary" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                                    Campaigns
                                </h1>
                                <p className="text-xs text-muted-foreground">
                                    {activeView === 'opportunities'
                                        ? 'Discover upcoming promotional opportunities, seasonal holidays, and marketing windows.'
                                        : 'Organize and manage your active, scheduled, and completed marketing campaigns.'}
                                </p>
                            </div>
                        </div>

                        {/* Header Actions: Prominent View Switcher & Primary Create Campaign Button */}
                        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
                            <CampaignsViewSwitcher
                                activeView={activeView}
                                onViewChange={handleViewChange}
                                campaignCount={stats.total}
                                upcomingCount={upcomingList.length}
                            />

                            <Button
                                type="button"
                                onClick={() => handleOpenGeneralCreate(true, 'holiday')}
                                className="gap-2 rounded-xl text-xs font-semibold shadow-xs"
                            >
                                <Plus className="h-4 w-4" />
                                Create Campaign
                            </Button>
                        </div>
                    </div>

                    {/* =====================================================
                        VIEW CONTENT
                    ====================================================== */}
                    {activeView === 'opportunities' ? (
                        <OpportunitiesView
                            upcomingList={upcomingList}
                            rawEvents={rawEvents}
                            currentCampaignYear={currentCampaignYear}
                            eventTypeStyles={eventTypeStyles}
                            onCreateCampaign={handleCreateFromEvent}
                        />
                    ) : (
                        <CampaignHubView
                            stats={stats}
                            sortedCampaigns={sortedCampaigns}
                            statusFilter={statusFilter}
                            changeStatusFilter={changeStatusFilter}
                            viewMode={viewMode}
                            handleSetViewMode={handleSetViewMode}
                            statusOptions={statusOptions}
                            statusDot={statusDot}
                            statusGlow={statusGlow}
                            statusIconColor={statusIconColor}
                            formatDateRange={formatDateRange}
                            openEditDialog={openEditDialog}
                            handleDownloadCampaign={handleDownloadCampaign}
                            handleArchiveCampaign={handleArchiveCampaign}
                            handleUnarchiveCampaign={handleUnarchiveCampaign}
                            setCampaignToDelete={setCampaignToDelete}
                            setIsCreateOpen={handleOpenGeneralCreate}
                            currentPage={currentPage}
                            lastPage={lastPage}
                        />
                    )}
                </div>
            </div>

            {/* =============================================================
                CREATE CAMPAIGN MODAL (IMPROVED & PROFESSIONAL)
            ============================================================= */}

            {/* =============================================================
                CREATE CAMPAIGN MODAL (MULTI-SOURCE: HOLIDAY / EVENT / CUSTOM / GENERAL)
            ============================================================= */}

            <Dialog
                open={isCreateOpen}
                onOpenChange={(open) => {
                    setIsCreateOpen(open);
                    if (!open) {
                        setIsEventLocked(false);
                    }
                }}
            >
                <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden rounded-3xl border-border bg-card p-0 shadow-2xl sm:max-w-lg">
                    <form onSubmit={handleCreateCampaign} className="flex min-h-0 flex-1 flex-col">
                        <DialogHeader className="shrink-0 border-b border-border/80 bg-muted/20 p-5 sm:p-6 pb-4">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <Plus className="h-4 w-4" />
                                </div>
                                <DialogTitle className="text-lg font-bold text-foreground">
                                    Create Campaign
                                </DialogTitle>
                            </div>

                            <DialogDescription className="mt-1 text-xs text-muted-foreground">
                                Select an existing Philippine holiday, marketing
                                event, or custom business event to launch your
                                campaign.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Creation Source Tabs */}
                        <div className="shrink-0 border-b border-border/70 bg-muted/10 p-3">
                            <div className="grid grid-cols-3 gap-1 rounded-2xl border border-border/80 bg-muted/30 p-1 text-xs">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!isEventLocked) {
                                            setCreateSource('holiday');
                                            setFormErrors({});
                                        }
                                    }}
                                    disabled={
                                        isEventLocked &&
                                        createSource !== 'holiday'
                                    }
                                    className={`flex items-center justify-center gap-1.5 rounded-xl px-1 py-1.5 font-semibold transition-all ${
                                        createSource === 'holiday'
                                            ? 'bg-card text-foreground shadow-2xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <CalendarDays className="h-3.5 w-3.5 text-rose-500" />
                                    <span className="truncate">Philippine Holiday</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!isEventLocked) {
                                            setCreateSource('marketing');
                                            setFormErrors({});
                                        }
                                    }}
                                    disabled={
                                        isEventLocked &&
                                        createSource !== 'marketing'
                                    }
                                    className={`flex items-center justify-center gap-1.5 rounded-xl px-1 py-1.5 font-semibold transition-all ${
                                        createSource === 'marketing'
                                            ? 'bg-card text-foreground shadow-2xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <Calendar className="h-3.5 w-3.5 text-blue-500" />
                                    <span className="truncate">Marketing Event</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!isEventLocked) {
                                            setCreateSource('custom');
                                            setFormErrors({});
                                        }
                                    }}
                                    disabled={
                                        isEventLocked &&
                                        createSource !== 'custom'
                                    }
                                    className={`flex items-center justify-center gap-1.5 rounded-xl px-1 py-1.5 font-semibold transition-all ${
                                        createSource === 'custom'
                                            ? 'bg-card text-foreground shadow-2xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                                    <span className="truncate">Custom Event</span>
                                </button>
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto space-y-4 p-5 sm:p-6">
                            {/* Source-specific context picker or inputs */}
                            {createSource === 'holiday' ? (
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                        <CalendarDays className="h-3.5 w-3.5 text-rose-500" />
                                        Official Philippine Holiday *
                                    </Label>

                                    {selectedCreateEvent ? (
                                        <div className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/5 p-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                                                    <CalendarDays className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-xs font-bold text-foreground">
                                                            {
                                                                selectedCreateEvent.name
                                                            }
                                                        </p>
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[9px] uppercase tracking-wider ${
                                                                eventTypeStyles[
                                                                    selectedCreateEvent.category ||
                                                                        selectedCreateEvent.type ||
                                                                        'holiday'
                                                                ]?.bg
                                                            } ${
                                                                eventTypeStyles[
                                                                    selectedCreateEvent.category ||
                                                                        selectedCreateEvent.type ||
                                                                        'holiday'
                                                                ]?.text
                                                            } ${
                                                                eventTypeStyles[
                                                                    selectedCreateEvent.category ||
                                                                        selectedCreateEvent.type ||
                                                                        'holiday'
                                                                ]?.border
                                                            }`}
                                                        >
                                                            {eventTypeStyles[
                                                                selectedCreateEvent.category ||
                                                                    selectedCreateEvent.type ||
                                                                    'holiday'
                                                            ]?.label ||
                                                                'Holiday'}
                                                        </Badge>
                                                    </div>
                                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                        {formatDate(
                                                            selectedCreateEvent.date,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            {!isEventLocked && (
                                                <div className="flex items-center gap-1.5">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setEventModalTarget(
                                                                'create',
                                                            );
                                                            setEventCategoryFilter(
                                                                'regular',
                                                            );
                                                            setIsEventModalOpen(
                                                                true,
                                                            );
                                                        }}
                                                        className="h-7 px-2.5 text-xs shadow-none"
                                                    >
                                                        Change
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            setFormData(
                                                                (current) => ({
                                                                    ...current,
                                                                    event_id:
                                                                        '',
                                                                }),
                                                            )
                                                        }
                                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEventModalTarget('create');
                                                setEventCategoryFilter(
                                                    'regular',
                                                );
                                                setIsEventModalOpen(true);
                                            }}
                                            className="flex h-11 w-full items-center justify-between rounded-xl border border-dashed border-border bg-muted/20 px-4 text-xs font-medium text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
                                        >
                                            <span className="flex items-center gap-2">
                                                <CalendarDays className="h-4 w-4 text-rose-500" />
                                                Choose official Philippine
                                                holiday...
                                            </span>
                                            <span className="font-semibold text-primary">
                                                Select Holiday →
                                            </span>
                                        </button>
                                    )}

                                    {formErrors.event_id && (
                                        <p className="text-[11px] font-medium text-destructive">
                                            {formErrors.event_id}
                                        </p>
                                    )}
                                </div>
                            ) : createSource === 'marketing' ? (
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                        <Calendar className="h-3.5 w-3.5 text-blue-500" />
                                        Commercial / Marketing Event *
                                    </Label>

                                    {selectedCreateEvent ? (
                                        <div className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/5 p-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                                                    <Calendar className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-xs font-bold text-foreground">
                                                            {
                                                                selectedCreateEvent.name
                                                            }
                                                        </p>
                                                        <Badge
                                                            variant="outline"
                                                            className="border-blue-500/30 bg-blue-500/10 text-[9px] uppercase tracking-wider text-blue-600 dark:text-blue-400"
                                                        >
                                                            Commercial Event
                                                        </Badge>
                                                    </div>
                                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                        {formatDate(
                                                            selectedCreateEvent.date,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            {!isEventLocked && (
                                                <div className="flex items-center gap-1.5">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setEventModalTarget(
                                                                'create',
                                                            );
                                                            setEventCategoryFilter(
                                                                'commercial',
                                                            );
                                                            setIsEventModalOpen(
                                                                true,
                                                            );
                                                        }}
                                                        className="h-7 px-2.5 text-xs shadow-none"
                                                    >
                                                        Change
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            setFormData(
                                                                (current) => ({
                                                                    ...current,
                                                                    event_id:
                                                                        '',
                                                                }),
                                                            )
                                                        }
                                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEventModalTarget('create');
                                                setEventCategoryFilter(
                                                    'commercial',
                                                );
                                                setIsEventModalOpen(true);
                                            }}
                                            className="flex h-11 w-full items-center justify-between rounded-xl border border-dashed border-border bg-muted/20 px-4 text-xs font-medium text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
                                        >
                                            <span className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-blue-500" />
                                                Choose retail sale, payday flash
                                                sale, double-digit event...
                                            </span>
                                            <span className="font-semibold text-primary">
                                                Select Event →
                                            </span>
                                        </button>
                                    )}

                                    {formErrors.event_id && (
                                        <p className="text-[11px] font-medium text-destructive">
                                            {formErrors.event_id}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                        <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                                        Custom Business Event *
                                    </Label>

                                    {selectedCreateEvent ? (
                                        <div className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/5 p-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-xs font-bold text-purple-600 dark:text-purple-400">
                                                    <Sparkles className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-xs font-bold text-foreground">
                                                            {selectedCreateEvent.name}
                                                        </p>
                                                        <Badge
                                                            variant="outline"
                                                            className="border-purple-500/30 bg-purple-500/10 text-[9px] uppercase tracking-wider text-purple-600 dark:text-purple-400"
                                                        >
                                                            Custom Event
                                                        </Badge>
                                                    </div>
                                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                        {formatDate(selectedCreateEvent.date)}
                                                    </p>
                                                </div>
                                            </div>

                                            {!isEventLocked && (
                                                <div className="flex items-center gap-1.5">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setEventModalTarget('create');
                                                            setEventCategoryFilter('custom');
                                                            setIsEventModalOpen(true);
                                                        }}
                                                        className="h-7 px-2.5 text-xs shadow-none"
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
                                            )}
                                        </div>
                                    ) : hasCustomEvents ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEventModalTarget('create');
                                                setEventCategoryFilter('custom');
                                                setIsEventModalOpen(true);
                                            }}
                                            className="flex h-11 w-full items-center justify-between rounded-xl border border-dashed border-border bg-muted/20 px-4 text-xs font-medium text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
                                        >
                                            <span className="flex items-center gap-2">
                                                <Sparkles className="h-4 w-4 text-purple-500" />
                                                Choose from existing custom business events...
                                            </span>
                                            <span className="font-semibold text-primary">
                                                Select Event →
                                            </span>
                                        </button>
                                    ) : (
                                        <div className="space-y-3 rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 text-center">
                                            <Sparkles className="mx-auto h-6 w-6 text-purple-500 opacity-80" />
                                            <div>
                                                <p className="text-xs font-bold text-foreground">
                                                    No Custom Events Found
                                                </p>
                                                <p className="mt-1 text-[11px] text-muted-foreground">
                                                    Custom events must first be created in Event Management before launching a campaign for them.
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={() => {
                                                    setIsCreateOpen(false);
                                                    router.visit('/events');
                                                }}
                                                className="gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold"
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                                Create in Event Management
                                            </Button>
                                        </div>
                                    )}

                                    {formErrors.event_id && (
                                        <p className="text-[11px] font-medium text-destructive">
                                            {formErrors.event_id}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Existing Campaign Warning Banner (Phase 6 Deduplication) */}
                            {selectedCreateEvent?.has_campaign &&
                                selectedCreateEvent?.campaign_id && (
                                    <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
                                        <div className="flex items-center justify-between gap-2">
                                            <div>
                                                <p className="font-bold">
                                                    Campaign already exists!
                                                </p>
                                                <p className="text-[11px] opacity-90">
                                                    An existing campaign "
                                                    {selectedCreateEvent.campaign_name ||
                                                        selectedCreateEvent.name}
                                                    " is already active for this
                                                    event.
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={() => {
                                                    setIsCreateOpen(false);
                                                    router.visit(
                                                        `/campaigns/${selectedCreateEvent.campaign_id}`,
                                                    );
                                                }}
                                                className="shrink-0 text-xs font-semibold shadow-xs"
                                            >
                                                Open Campaign
                                            </Button>
                                        </div>
                                    </div>
                                )}

                            {/* Campaign Name */}
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="campaign-name"
                                    className="flex items-center gap-1.5 text-xs font-semibold text-foreground"
                                >
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
                                    className={`h-10 rounded-xl text-xs ${formErrors.name ? 'border-destructive' : ''}`}
                                />
                                {formErrors.name && (
                                    <p className="text-[11px] font-medium text-destructive">
                                        {formErrors.name}
                                    </p>
                                )}
                            </div>

                            {/* Timeline Dates */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="campaign-start-date"
                                        className="text-xs font-semibold text-foreground"
                                    >
                                        Start Date *
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
                                        className={`h-10 rounded-xl text-xs ${formErrors.start_date ? 'border-destructive' : ''}`}
                                    />
                                    {formErrors.start_date && (
                                        <p className="text-[11px] font-medium text-destructive">
                                            {formErrors.start_date}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="campaign-end-date"
                                        className="text-xs font-semibold text-foreground"
                                    >
                                        End Date *
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
                                        className={`h-10 rounded-xl text-xs ${formErrors.end_date ? 'border-destructive' : ''}`}
                                    />
                                    {formErrors.end_date && (
                                        <p className="text-[11px] font-medium text-destructive">
                                            {formErrors.end_date}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="shrink-0 border-t border-border/80 bg-muted/10 p-4 sm:p-6 pt-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetCreateForm}
                                disabled={isSubmitting}
                                className="rounded-xl text-xs shadow-none"
                            >
                                Cancel
                            </Button>

                            {selectedCreateEvent?.has_campaign &&
                            selectedCreateEvent?.campaign_id ? (
                                <Button
                                    type="button"
                                    onClick={() => {
                                        setIsCreateOpen(false);
                                        router.visit(
                                            `/campaigns/${selectedCreateEvent.campaign_id}`,
                                        );
                                    }}
                                    className="gap-2 rounded-xl text-xs shadow-sm"
                                >
                                    Open Existing Campaign
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    disabled={
                                        isSubmitting ||
                                        !formData.name.trim() ||
                                        !formData.event_id
                                    }
                                    className="gap-2 rounded-xl text-xs shadow-sm"
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
                            )}
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* =============================================================
                EDIT CAMPAIGN MODAL
            ============================================================= */}

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="overflow-hidden rounded-3xl border-border bg-card p-0 shadow-2xl sm:max-w-lg">
                    <form onSubmit={handleEditCampaign}>
                        <DialogHeader className="border-b border-border/80 bg-muted/20 p-6 pb-4">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <Pencil className="h-4 w-4" />
                                </div>
                                <DialogTitle className="text-lg font-bold text-foreground">
                                    Edit Campaign
                                </DialogTitle>
                            </div>
                            <DialogDescription className="mt-1 text-xs text-muted-foreground">
                                Update your campaign details, timeline schedule,
                                and active status.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-5 p-6">
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="edit-c-name"
                                    className="text-xs font-semibold text-foreground"
                                >
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
                                    className={`h-10 rounded-xl text-xs ${editFormErrors.name ? 'border-destructive' : ''}`}
                                />
                                {editFormErrors.name && (
                                    <p className="text-[11px] font-medium text-destructive">
                                        {editFormErrors.name}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="edit-c-start"
                                        className="text-xs font-semibold text-foreground"
                                    >
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
                                        className="h-10 rounded-xl text-xs"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="edit-c-end"
                                        className="text-xs font-semibold text-foreground"
                                    >
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
                                        className={`h-10 rounded-xl text-xs ${editFormErrors.end_date ? 'border-destructive' : ''}`}
                                    />
                                    {editFormErrors.end_date && (
                                        <p className="text-[11px] font-medium text-destructive">
                                            {editFormErrors.end_date}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5 rounded-xl border border-border/70 bg-muted/30 p-3.5">
                                <Label className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                    Campaign Status
                                </Label>
                                <div className="flex items-center gap-2 pt-0.5">
                                    <Badge
                                        variant="outline"
                                        className="text-xs font-semibold capitalize"
                                    >
                                        {editFormData.status || 'Active'}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        Managed automatically based on the campaign lifecycle.
                                    </span>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="border-t border-border/80 bg-muted/10 p-6 pt-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditOpen(false)}
                                disabled={isSavingEdit}
                                className="rounded-xl text-xs shadow-none"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    isSavingEdit || !editFormData.name.trim()
                                }
                                className="gap-2 rounded-xl text-xs shadow-sm"
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
                <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden rounded-3xl border-border bg-card p-0 shadow-2xl sm:max-w-4xl">
                    <DialogHeader className="shrink-0 border-b border-border bg-muted/20 p-4 sm:p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <CalendarDays className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold text-foreground sm:text-xl">
                                    Select Marketing Event or Holiday
                                </DialogTitle>
                                <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                                    Choose an event or holiday to tailor your
                                    visual concept, seasonal theme, and
                                    promotion.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Filter & Year Toolbar (Responsive Grid with Dropdowns) */}
                    <div className="shrink-0 border-b border-border bg-muted/10 p-4">
                        <div className="grid grid-cols-1 items-center gap-2.5 sm:grid-cols-12">
                            {/* Search Input */}
                            <div className="relative sm:col-span-6">
                                <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={eventSearchQuery}
                                    onChange={(e) =>
                                        setEventSearchQuery(e.target.value)
                                    }
                                    placeholder="Search events, holidays, sales..."
                                    className="h-9.5 rounded-xl border-border bg-card pl-9 text-xs"
                                />
                            </div>

                            {/* Category Filter Dropdown */}
                            <div className="sm:col-span-3">
                                <Select
                                    value={eventCategoryFilter}
                                    onValueChange={setEventCategoryFilter}
                                >
                                    <SelectTrigger className="h-9.5 w-full rounded-xl border-border bg-card text-xs font-medium shadow-2xs">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-border shadow-lg">
                                        <SelectItem value="all">
                                            All Categories
                                        </SelectItem>
                                        <SelectItem value="regular">
                                            Regular Holidays
                                        </SelectItem>
                                        <SelectItem value="special_non_working">
                                            Special Non-Working
                                        </SelectItem>
                                        <SelectItem value="special_working">
                                            Special Working
                                        </SelectItem>
                                        <SelectItem value="islamic">
                                            Islamic Holidays
                                        </SelectItem>
                                        <SelectItem value="long_weekend">
                                            Long Weekends
                                        </SelectItem>
                                        <SelectItem value="commercial">
                                            Retail Sales & Payday
                                        </SelectItem>
                                        <SelectItem value="custom">
                                            Custom Events
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Year Selector Dropdown */}
                            <div className="sm:col-span-3">
                                <Select
                                    value={selectedYearTab}
                                    onValueChange={setSelectedYearTab}
                                >
                                    <SelectTrigger className="h-9.5 w-full rounded-xl border-border bg-card text-xs font-medium shadow-2xs">
                                        <SelectValue placeholder="Year" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-border shadow-lg">
                                        <SelectItem value="all">
                                            All Years
                                        </SelectItem>
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
                    <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                        {filteredEvents.length === 0 ? (
                            <div className="space-y-2 py-12 text-center text-muted-foreground">
                                <CalendarDays className="mx-auto h-8 w-8 opacity-30" />
                                <p className="text-sm font-semibold text-foreground">
                                    No events found matching your filter
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Try clearing search keywords or selecting
                                    "All" categories.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                                {filteredEvents.map((evt: any) => {
                                    const currentTargetId = formData.event_id;
                                    const isSelected =
                                        String(evt.id) ===
                                        String(currentTargetId);
                                    const styleKey =
                                        evt.category || evt.type || 'holiday';
                                    const style =
                                        eventTypeStyles[styleKey] ||
                                        eventTypeStyles.holiday;

                                    return (
                                        <button
                                            key={evt.id}
                                            type="button"
                                            onClick={() =>
                                                handleSelectEvent(evt)
                                            }
                                            className={`group flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                                                isSelected
                                                    ? 'border-primary bg-primary/10 shadow-xs ring-2 ring-primary/40'
                                                    : 'border-border bg-card hover:border-primary/50 hover:bg-muted/30'
                                            }`}
                                        >
                                            <div className="space-y-1.5">
                                                <div className="flex items-start justify-between gap-1.5">
                                                    <span className="line-clamp-2 text-xs font-bold text-foreground transition-colors group-hover:text-primary">
                                                        {evt.name}
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className={`shrink-0 text-[9px] font-medium tracking-wider uppercase ${style.bg} ${style.text} ${style.border}`}
                                                    >
                                                        {style.label}
                                                    </Badge>
                                                </div>

                                                {evt.is_long_weekend && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="py-0 text-[9px] font-medium"
                                                    >
                                                        Long Weekend
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2 text-xs text-muted-foreground">
                                                <span className="text-[11px] font-medium">
                                                    {formatDate(evt.date)}
                                                </span>
                                                {isSelected ? (
                                                    <span className="text-xs font-bold text-primary">
                                                        Selected ✓
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] font-medium transition-colors group-hover:text-foreground">
                                                        Select
                                                    </span>
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
                <DialogContent className="rounded-3xl border-border bg-card p-6 shadow-2xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-foreground">
                            Delete Campaign?
                        </DialogTitle>
                        <DialogDescription className="mt-1 text-xs text-muted-foreground">
                            Are you sure you want to delete{' '}
                            <span className="font-semibold text-foreground">
                                "{campaignToDelete?.name}"
                            </span>
                            ? This will remove the campaign record. Associated
                            designs will remain safe in My Designs.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="mt-6 gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCampaignToDelete(null)}
                            disabled={isDeleting}
                            className="rounded-xl text-xs shadow-none"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={confirmDeleteCampaign}
                            disabled={isDeleting}
                            className="gap-2 rounded-xl text-xs shadow-sm"
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
