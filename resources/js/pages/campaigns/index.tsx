import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    FolderOpen,
    ImageIcon,
    Layers,
    Plus,
    Sparkles,
    Tag,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';

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

/*
|--------------------------------------------------------------------------
| STATUS
|--------------------------------------------------------------------------
*/

const statusStyles: Record<string, string> = {
    draft:
        'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300',

    scheduled:
        'border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300',

    active:
        'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',

    completed:
        'border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300',
};

const statusDot: Record<string, string> = {
    draft: 'bg-slate-400',
    scheduled: 'bg-blue-500',
    active: 'bg-emerald-500',
    completed: 'bg-violet-500',
};

const statusOptions = [
    'all',
    'draft',
    'scheduled',
    'active',
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
| PAGE
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

    const [formData, setFormData] = useState({
        name: '',
        event_id: '',
        start_date: '',
        end_date: '',
    });

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
    | CREATE
    |--------------------------------------------------------------------------
    */

    const handleCreateCampaign = (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        const name = formData.name.trim();

        if (!name || !formData.start_date) {
            return;
        }

        setIsSubmitting(true);

        router.post(
            '/campaigns',
            {
                name,
                event_id: formData.event_id || null,
                description: '',
                objective: `Campaign for ${name}`,
                target_audience: '',
                start_date: formData.start_date,
                end_date:
                    formData.end_date || formData.start_date,
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

                    router.reload({
                        only: ['campaigns', 'pagination'],
                    });
                },

                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    /*
    |--------------------------------------------------------------------------
    | RESET
    |--------------------------------------------------------------------------
    */

    const resetCreateForm = () => {
        setIsCreateOpen(false);

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
                                        Marketing
                                    </p>
                                </div>

                                <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
                                    Campaigns
                                </h1>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Organize your marketing around events,
                                    seasons, and promotions.
                                </p>
                            </div>

                            <Button
                                type="button"
                                onClick={() =>
                                    setIsCreateOpen(true)
                                }
                                className="group gap-2"
                            >
                                <Plus className="h-4 w-4" />

                                Create Campaign

                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </div>
                    </section>

                    {/* =====================================================
                        OVERVIEW
                    ====================================================== */}

                    <div className="mb-6 grid gap-3 sm:grid-cols-4">
                        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                            <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4 text-muted-foreground" />

                                <span className="text-xs font-medium text-muted-foreground">
                                    Campaigns
                                </span>
                            </div>

                            <p className="mt-2 text-2xl font-semibold">
                                {stats.total}
                            </p>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />

                                <span className="text-xs font-medium text-muted-foreground">
                                    Active
                                </span>
                            </div>

                            <p className="mt-2 text-2xl font-semibold">
                                {stats.active}
                            </p>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                            <div className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400" />

                                <span className="text-xs font-medium text-muted-foreground">
                                    Scheduled
                                </span>
                            </div>

                            <p className="mt-2 text-2xl font-semibold">
                                {stats.scheduled}
                            </p>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                            <div className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4 text-violet-600 dark:text-violet-400" />

                                <span className="text-xs font-medium text-muted-foreground">
                                    Designs
                                </span>
                            </div>

                            <p className="mt-2 text-2xl font-semibold">
                                {stats.designs}
                            </p>
                        </div>
                    </div>

                    {/* =====================================================
                        FILTER
                    ====================================================== */}

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex flex-wrap gap-1 rounded-xl border border-border bg-muted/40 p-1">
                            {statusOptions.map((status) => {
                                const active =
                                    statusFilter ===
                                    (status === 'all'
                                        ? ''
                                        : status);

                                return (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() =>
                                            changeStatusFilter(
                                                status,
                                            )
                                        }
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
                                            transition-colors
                                            ${
                                                active
                                                    ? 'bg-card text-foreground shadow-sm'
                                                    : 'text-muted-foreground hover:bg-card/60 hover:text-foreground'
                                            }
                                        `}
                                    >
                                        {status !== 'all' && (
                                            <span
                                                className={`h-1.5 w-1.5 rounded-full ${statusDot[status]}`}
                                            />
                                        )}

                                        {status === 'all'
                                            ? 'All'
                                            : status}
                                    </button>
                                );
                            })}
                        </div>

                        <p className="text-xs text-muted-foreground">
                            {sortedCampaigns.length}{' '}
                            {sortedCampaigns.length === 1
                                ? 'campaign'
                                : 'campaigns'}
                        </p>
                    </div>

                    {/* =====================================================
                        CAMPAIGNS
                    ====================================================== */}

                    {sortedCampaigns.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center shadow-sm">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                                <FolderOpen className="h-5 w-5 text-muted-foreground" />
                            </div>

                            <h2 className="mt-4 text-base font-semibold">
                                {statusFilter
                                    ? `No ${statusFilter} campaigns`
                                    : 'No campaigns yet'}
                            </h2>

                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                                {statusFilter
                                    ? 'Try another filter or create a new campaign.'
                                    : 'Create your first campaign to organize your marketing designs.'}
                            </p>

                            <Button
                                className="mt-5 gap-2"
                                onClick={() =>
                                    setIsCreateOpen(true)
                                }
                            >
                                <Plus className="h-4 w-4" />
                                Create Campaign
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {sortedCampaigns.map(
                                (campaign: any) => {
                                    const status =
                                        campaign.status ??
                                        'draft';

                                    const eventName =
                                        campaign.event_name ??
                                        'No event selected';

                                    const designCount =
                                        Number(
                                            campaign.design_count ||
                                                0,
                                        );

                                    return (
                                        <Link
                                            key={campaign.id}
                                            href={
                                                campaign.show_url ??
                                                `/campaigns/${campaign.id}`
                                            }
                                            className="
                                                group
                                                flex
                                                min-h-[235px]
                                                flex-col
                                                overflow-hidden
                                                rounded-2xl
                                                border
                                                border-border
                                                bg-card
                                                shadow-sm
                                                transition-all
                                                duration-200
                                                hover:-translate-y-0.5
                                                hover:border-primary/30
                                                hover:shadow-md
                                            "
                                        >
                                            {/* TOP */}

                                            <div className="border-b border-border p-5">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                                        <Layers className="h-5 w-5 text-primary" />
                                                    </div>

                                                    <Badge
                                                        variant="outline"
                                                        className={`
                                                            rounded-full
                                                            px-2.5
                                                            py-0.5
                                                            text-[11px]
                                                            font-medium
                                                            capitalize
                                                            ${
                                                                statusStyles[
                                                                    status
                                                                ] ??
                                                                statusStyles.draft
                                                            }
                                                        `}
                                                    >
                                                        {status}
                                                    </Badge>
                                                </div>

                                                <h2 className="mt-4 truncate text-base font-semibold">
                                                    {campaign.name}
                                                </h2>

                                                <p className="mt-1 truncate text-sm text-muted-foreground">
                                                    {campaign.objective ||
                                                        'Marketing campaign'}
                                                </p>
                                            </div>

                                            {/* DETAILS */}

                                            <div className="flex flex-1 flex-col p-5">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Tag className="h-3.5 w-3.5 text-muted-foreground" />

                                                        <span className="truncate text-muted-foreground">
                                                            {eventName}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-sm">
                                                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />

                                                        <span className="text-muted-foreground">
                                                            {formatDateRange(
                                                                campaign.start_date,
                                                                campaign.end_date,
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <ImageIcon className="h-3.5 w-3.5" />

                                                        {designCount}{' '}
                                                        {designCount ===
                                                        1
                                                            ? 'design'
                                                            : 'designs'}
                                                    </div>

                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                                                        View campaign

                                                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                },
                            )}
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
                                className="gap-1"
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

                            <span className="text-xs text-muted-foreground">
                                Page {currentPage} of {lastPage}
                            </span>

                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                disabled={
                                    currentPage >= lastPage
                                }
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
                CREATE CAMPAIGN
            ============================================================= */}

            <Dialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
            >
                <DialogContent className="rounded-2xl sm:max-w-lg">
                    <form onSubmit={handleCreateCampaign}>
                        <DialogHeader>
                            <DialogTitle className="text-lg">
                                Create campaign
                            </DialogTitle>

                            <DialogDescription>
                                Create a campaign around an event,
                                holiday, or seasonal promotion.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-6 space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="campaign-name">
                                    Campaign name
                                </Label>

                                <Input
                                    id="campaign-name"
                                    value={formData.name}
                                    onChange={(event) =>
                                        setFormData(
                                            (current) => ({
                                                ...current,
                                                name: event.target
                                                    .value,
                                            }),
                                        )
                                    }
                                    placeholder="e.g. Christmas 2026"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="campaign-event"
                                    className="flex items-center gap-1.5"
                                >
                                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                                    Holiday / Event
                                </Label>

                                <select
                                    id="campaign-event"
                                    value={formData.event_id}
                                    onChange={(event) =>
                                        setFormData(
                                            (current) => ({
                                                ...current,
                                                event_id:
                                                    event.target
                                                        .value,
                                            }),
                                        )
                                    }
                                    disabled={isSubmitting}
                                    className="
                                        flex
                                        h-10
                                        w-full
                                        rounded-md
                                        border
                                        border-input
                                        bg-background
                                        px-3
                                        py-2
                                        text-sm
                                        text-foreground
                                        outline-none
                                        focus:ring-2
                                        focus:ring-ring/30
                                    "
                                >
                                    <option value="">
                                        Select an event...
                                    </option>

                                    {[...events]
                                        .sort(
                                            (
                                                a: any,
                                                b: any,
                                            ) => {
                                                const aDate =
                                                    a.date
                                                        ? new Date(
                                                              a.date,
                                                          ).getTime()
                                                        : Number.MAX_SAFE_INTEGER;

                                                const bDate =
                                                    b.date
                                                        ? new Date(
                                                              b.date,
                                                          ).getTime()
                                                        : Number.MAX_SAFE_INTEGER;

                                                return (
                                                    aDate - bDate
                                                );
                                            },
                                        )
                                        .map((event: any) => (
                                            <option
                                                key={event.id}
                                                value={event.id}
                                            >
                                                {event.name}
                                                {event.date
                                                    ? ` (${formatDate(event.date)})`
                                                    : ''}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="campaign-start-date">
                                        Start date
                                    </Label>

                                    <Input
                                        id="campaign-start-date"
                                        type="date"
                                        value={
                                            formData.start_date
                                        }
                                        onChange={(event) =>
                                            setFormData(
                                                (current) => ({
                                                    ...current,
                                                    start_date:
                                                        event.target
                                                            .value,
                                                }),
                                            )
                                        }
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="campaign-end-date">
                                        End date
                                    </Label>

                                    <Input
                                        id="campaign-end-date"
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(event) =>
                                            setFormData(
                                                (current) => ({
                                                    ...current,
                                                    end_date:
                                                        event.target
                                                            .value,
                                                }),
                                            )
                                        }
                                        disabled={isSubmitting}
                                    />
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
                                disabled={
                                    isSubmitting ||
                                    !formData.name.trim() ||
                                    !formData.start_date
                                }
                                className="gap-2"
                            >
                                {isSubmitting
                                    ? 'Creating...'
                                    : 'Create Campaign'}

                                {!isSubmitting && (
                                    <ArrowRight className="h-4 w-4" />
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

/*
|--------------------------------------------------------------------------
| LAYOUT
|--------------------------------------------------------------------------
*/

CampaignsPage.layout = {
    breadcrumbs: [
        {
            title: 'Campaigns',
            href: '/campaigns',
        },
    ],
};