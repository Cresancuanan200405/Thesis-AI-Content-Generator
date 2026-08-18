import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    CalendarRange,
    Download,
    ImageIcon,
    Layers,
    Sparkles,
    Tag,
    Target,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

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

const statusLabels: Record<string, string> = {
    draft: 'Draft',
    scheduled: 'Scheduled',
    active: 'Active',
    completed: 'Completed',
};

export default function CampaignShowPage({
    campaign,
}: any) {
    const status = campaign?.status ?? 'draft';

    const designs = campaign?.designs ?? [];

    return (
        <>
            <Head
                title={
                    campaign?.name ?? 'Campaign'
                }
            />

            <div className="min-h-screen bg-background text-foreground">
                <div className="p-4 md:p-6 lg:p-8">

                    {/* =====================================================
                        HEADER
                    ====================================================== */}

                    <section className="mb-6">
                        <Link
                            href="/campaigns"
                            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />

                            Back to campaigns
                        </Link>

                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                    </div>

                                    <p className="text-sm font-medium text-muted-foreground">
                                        Marketing Campaign
                                    </p>

                                    <Badge
                                        variant="outline"
                                        className={`
                                            rounded-full
                                            text-[11px]
                                            ${
                                                statusStyles[
                                                    status
                                                ] ??
                                                'border-border bg-muted text-muted-foreground'
                                            }
                                        `}
                                    >
                                        {statusLabels[
                                            status
                                        ] ?? status}
                                    </Badge>
                                </div>

                                <h1 className="mt-3 truncate text-2xl font-semibold tracking-tight md:text-3xl">
                                    {campaign?.name ??
                                        'Campaign'}
                                </h1>

                                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                                    {campaign?.objective ||
                                        'Manage your campaign, timeline, event, and creative assets.'}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button
                                    asChild
                                    variant="outline"
                                    className="gap-2"
                                >
                                    <Link href="/campaigns">
                                        <ArrowLeft className="h-4 w-4" />
                                        Campaigns
                                    </Link>
                                </Button>

                                <Button
                                    asChild
                                    className="group gap-2"
                                >
                                    <Link
                                        href={
                                            campaign?.generator_url ??
                                            '/generator'
                                        }
                                    >
                                        Create Design

                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </section>

                    {/* =====================================================
                        QUICK INFO
                    ====================================================== */}

                    <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <InfoCard
                            icon={Tag}
                            label="Event"
                            value={
                                campaign?.event_name ??
                                'No event selected'
                            }
                        />

                        <InfoCard
                            icon={Target}
                            label="Audience"
                            value={
                                campaign?.target_audience ||
                                'General audience'
                            }
                        />

                        <InfoCard
                            icon={ImageIcon}
                            label="Designs"
                            value={String(designs.length)}
                        />

                        <InfoCard
                            icon={CalendarRange}
                            label="Launch"
                            value={
                                campaign?.start_date ??
                                'TBD'
                            }
                        />
                    </div>

                    {/* =====================================================
                        MAIN CONTENT
                    ====================================================== */}

                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">

                        {/* =================================================
                            MAIN
                        ================================================== */}

                        <div className="space-y-6">

                            {/* Campaign details */}

                            <Card className="rounded-2xl border-border shadow-sm">
                                <CardHeader className="border-b p-5 md:p-6">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Layers className="h-4 w-4 text-primary" />

                                        Campaign details
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="space-y-6 p-5 md:p-6">
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                            Description
                                        </p>

                                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                                            {campaign?.description ||
                                                'No campaign description provided.'}
                                        </p>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-xl border border-border bg-muted/20 p-4">
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="h-4 w-4 text-muted-foreground" />

                                                <span className="text-xs font-medium text-muted-foreground">
                                                    Start date
                                                </span>
                                            </div>

                                            <p className="mt-2 text-sm font-semibold">
                                                {campaign?.start_date ??
                                                    'TBD'}
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-border bg-muted/20 p-4">
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="h-4 w-4 text-muted-foreground" />

                                                <span className="text-xs font-medium text-muted-foreground">
                                                    End date
                                                </span>
                                            </div>

                                            <p className="mt-2 text-sm font-semibold">
                                                {campaign?.end_date ??
                                                    'TBD'}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Designs */}

                            <Card className="rounded-2xl border-border shadow-sm">
                                <CardHeader className="border-b p-5 md:p-6">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                <ImageIcon className="h-4 w-4 text-primary" />

                                                Campaign designs
                                            </CardTitle>

                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Creative assets generated for
                                                this campaign.
                                            </p>
                                        </div>

                                        <Badge variant="secondary">
                                            {designs.length}
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-5 md:p-6">
                                    {designs.length === 0 ? (
                                        <div className="rounded-xl border border-dashed border-border bg-muted/10 px-6 py-12 text-center">
                                            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                <ImageIcon className="h-5 w-5" />
                                            </div>

                                            <p className="mt-4 text-sm font-semibold">
                                                No designs yet
                                            </p>

                                            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                                                Generate your first marketing
                                                asset for this campaign.
                                            </p>

                                            <Button
                                                asChild
                                                size="sm"
                                                className="mt-4 gap-2"
                                            >
                                                <Link
                                                    href={
                                                        campaign?.generator_url ??
                                                        '/generator'
                                                    }
                                                >
                                                    Create Design

                                                    <ArrowRight className="h-3.5 w-3.5" />
                                                </Link>
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {designs.map(
                                                (
                                                    design: any,
                                                ) => (
                                                    <div
                                                        key={
                                                            design.id
                                                        }
                                                        className="flex items-center gap-4 rounded-xl border border-border p-3 transition-colors hover:bg-muted/20"
                                                    >
                                                        {design.image_url ? (
                                                            <img
                                                                src={
                                                                    design.image_url
                                                                }
                                                                alt={
                                                                    design.product_name ??
                                                                    'Campaign design'
                                                                }
                                                                className="h-16 w-16 shrink-0 rounded-lg object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                                                <ImageIcon className="h-5 w-5" />
                                                            </div>
                                                        )}

                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-semibold">
                                                                {design.product_name ??
                                                                    'Design'}
                                                            </p>

                                                            <p className="mt-1 text-xs capitalize text-muted-foreground">
                                                                {design.status ??
                                                                    'pending'}
                                                            </p>
                                                        </div>

                                                        <Badge
                                                            variant="outline"
                                                            className="hidden capitalize sm:inline-flex"
                                                        >
                                                            {design.status ??
                                                                'pending'}
                                                        </Badge>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* =================================================
                            SIDEBAR
                        ================================================== */}

                        <div className="space-y-6">

                            {/* Event */}

                            <Card className="rounded-2xl border-border shadow-sm">
                                <CardHeader className="border-b p-5">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <CalendarDays className="h-4 w-4 text-primary" />

                                        Campaign event
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="p-5">
                                    <div className="rounded-xl border border-border bg-muted/20 p-4">
                                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                            Event
                                        </p>

                                        <p className="mt-2 text-sm font-semibold">
                                            {campaign?.event_name ??
                                                'No event selected'}
                                        </p>

                                        {campaign?.event_date && (
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {campaign.event_date}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Product */}

                            <Card className="rounded-2xl border-border shadow-sm">
                                <CardHeader className="border-b p-5">
                                    <CardTitle className="text-base">
                                        Product
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="p-5">
                                    <p className="text-sm font-medium">
                                        {campaign?.product_name ??
                                            'No product selected'}
                                    </p>

                                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                        The product or offering associated
                                        with this campaign.
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Actions */}

                            <Card className="rounded-2xl border-border shadow-sm">
                                <CardHeader className="border-b p-5">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Sparkles className="h-4 w-4 text-primary" />

                                        Actions
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="space-y-2 p-5">
                                    <Button
                                        asChild
                                        className="w-full gap-2"
                                    >
                                        <Link
                                            href={
                                                campaign?.generator_url ??
                                                '/generator'
                                            }
                                        >
                                            Create Design

                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="w-full gap-2"
                                        disabled={
                                            designs.length === 0
                                        }
                                    >
                                        <Download className="h-4 w-4" />

                                        Download all
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Lifecycle */}

                            <Card className="rounded-2xl border-border shadow-sm">
                                <CardHeader className="border-b p-5">
                                    <CardTitle className="text-base">
                                        Campaign status
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="p-5">
                                    <CampaignLifecycle
                                        status={status}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

/*
|--------------------------------------------------------------------------
| INFO CARD
|--------------------------------------------------------------------------
*/

function InfoCard({
    icon: Icon,
    label,
    value,
}: {
    icon: any;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />

                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {label}
                </span>
            </div>

            <p className="mt-2 truncate text-sm font-semibold">
                {value}
            </p>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| LIFECYCLE
|--------------------------------------------------------------------------
*/

function CampaignLifecycle({
    status,
}: {
    status: string;
}) {
    const statuses = [
        {
            key: 'draft',
            label: 'Draft',
        },
        {
            key: 'scheduled',
            label: 'Scheduled',
        },
        {
            key: 'active',
            label: 'Active',
        },
        {
            key: 'completed',
            label: 'Completed',
        },
    ];

    const currentIndex = statuses.findIndex(
        (item) => item.key === status,
    );

    return (
        <div className="space-y-3">
            {statuses.map((item, index) => {
                const isCurrent =
                    index === currentIndex;

                const isComplete =
                    currentIndex >= 0 &&
                    index < currentIndex;

                return (
                    <div
                        key={item.key}
                        className="flex items-center gap-3"
                    >
                        <div
                            className={`
                                flex
                                h-7
                                w-7
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                text-[10px]
                                font-semibold
                                ${
                                    isCurrent
                                        ? 'bg-primary text-primary-foreground'
                                        : isComplete
                                          ? 'bg-primary/10 text-primary'
                                          : 'bg-muted text-muted-foreground'
                                }
                            `}
                        >
                            {index + 1}
                        </div>

                        <span
                            className={`
                                text-sm
                                ${
                                    isCurrent
                                        ? 'font-semibold text-foreground'
                                        : 'text-muted-foreground'
                                }
                            `}
                        >
                            {item.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| LAYOUT
|--------------------------------------------------------------------------
*/

CampaignShowPage.layout = {
    breadcrumbs: [
        {
            title: 'Campaigns',
            href: '/campaigns',
        },
        {
            title: 'Campaign details',
            href: '#',
            current: true,
        },
    ],
};