import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowUpRight,
    ChevronLeft,
    ChevronRight,
    Download,
    Eye,
    ImageIcon,
    LayoutGrid,
    List,
    Megaphone,
    Package,
    Plus,
    X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { downloadVisualAsFormat } from '@/lib/download';
import { cn } from '@/lib/utils';
import {
    CampaignDesignCard,
    getAspectRatioClass,
} from '@/pages/campaigns/components/show/CampaignDesignCard';
import type { CampaignDesign } from '@/pages/campaigns/components/show/types';

/* ==========================================================================
   TYPES
========================================================================== */

type ActivityPoint = {
    period: string;
    designs: number;
    campaigns: number;
};

type DashboardStats = {
    total_designs?: number;
    active_campaigns?: number;
    total_products?: number;
    upcoming_events?: number;
    products_with_visuals?: number;
    products_without_visuals?: number;
    catalog_coverage?: number;
};

type CampaignStatusBreakdown = {
    active?: number;
    scheduled?: number;
    draft?: number;
    completed?: number;
    archived?: number;
};

type SystemHealthStatus = 'operational' | 'attention_required';

type SystemHealth = {
    ai_generation?: SystemHealthStatus;
    event_calendar?: SystemHealthStatus;
    product_catalog?: SystemHealthStatus;
    campaign_engine?: SystemHealthStatus;
};

type DashboardEvent = {
    id: number | string;
    name: string;
    date?: string;
    days?: string | number;
    category?: string;
    type?: string;
};

type DashboardDesign = CampaignDesign & {
    campaign_id?: number | null;
    campaign_event_id?: number | null;
    campaign_name?: string | null;
    event_name?: string | null;
    url?: string;
};

type DashboardCampaign = {
    id: number | string;
    name?: string;
    status?: string;
    event_name?: string;
    design_count?: number;
};

type Props = {
    auth?: {
        user?: {
            name?: string;
            email?: string;
        };
    };
    campaigns?: DashboardCampaign[];
    events?: DashboardEvent[];
    upcoming_events?: DashboardEvent[];
    recent_designs?: DashboardDesign[];
    stats?: DashboardStats;
    monthly_activity?: ActivityPoint[];
    weekly_activity?: ActivityPoint[];
    campaign_status_breakdown?: CampaignStatusBreakdown;
    system_health?: SystemHealth;
    business?: {
        name?: string;
        industry?: string;
        category?: string;
        tagline?: string;
        logo_url?: string | null;
    };
};

/* ==========================================================================
   HELPERS
========================================================================== */

const formatEventCategory = (category?: string, type?: string): string => {
    const raw = category || type || '';

    if (!raw) {
        return 'Philippine Holiday';
    }

    const lower = raw.toLowerCase();

    if (
        lower.includes('regular') ||
        lower.includes('special') ||
        lower.includes('holiday')
    ) {
        return 'Philippine Holiday';
    }

    if (lower.includes('observance') || lower.includes('islamic')) {
        return 'Observance';
    }

    if (
        lower.includes('commercial') ||
        lower.includes('sale') ||
        lower.includes('promo') ||
        lower.includes('retail')
    ) {
        return 'Promotional Event';
    }

    if (lower.includes('custom')) {
        return 'Custom Event';
    }

    return raw.charAt(0).toUpperCase() + raw.slice(1);
};


/* ==========================================================================
   MAIN DASHBOARD
========================================================================== */

export default function Dashboard({
    auth,
    campaigns: _campaigns = [],
    events = [],
    upcoming_events = [],
    recent_designs = [],
    stats = {},
    monthly_activity = [],
    weekly_activity = [],
    campaign_status_breakdown = {},
    system_health: _system_health = {},
    business = {},
}: Props) {
    const user = auth?.user;

    /* ----------------------------------------------------------------------
       DATE / GREETING
    ---------------------------------------------------------------------- */

    const now = new Date();
    const todayFormatted = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(now);

    /* ----------------------------------------------------------------------
       UI STATE
    ---------------------------------------------------------------------- */

    const [chartTimeframe, setChartTimeframe] = useState<'monthly' | 'weekly'>(
        'monthly',
    );
    const [recentViewMode, setRecentViewMode] = useState<'grid' | 'capsule'>('grid');
    const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(
        null,
    );
    const [previewDesign, setPreviewDesign] = useState<DashboardDesign | null>(
        null,
    );
    const [isFinalizingId, setIsFinalizingId] = useState<number | null>(null);
    const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
    const [isSubmittingCampaign, setIsSubmittingCampaign] = useState(false);
    const [campaignFormErrors, setCampaignFormErrors] = useState<
        Record<string, string>
    >({});
    const [campaignFormData, setCampaignFormData] = useState({
        name: '',
        event_id: '',
        start_date: now.toISOString().split('T')[0],
        end_date: now.toISOString().split('T')[0],
        status: 'active',
    });

    /* ----------------------------------------------------------------------
       AUTHENTIC DATABASE METRICS
    ---------------------------------------------------------------------- */

    const totalDesigns = stats?.total_designs ?? 0;
    const activeCampaigns = stats?.active_campaigns ?? 0;
    const totalProducts = stats?.total_products ?? 0;
    const upcomingEventsCount = stats?.upcoming_events ?? 0;

    const productsWithVisuals = stats?.products_with_visuals ?? 0;
    const productsWithoutVisuals =
        stats?.products_without_visuals ??
        Math.max(0, totalProducts - productsWithVisuals);

    const catalogCoverage =
        totalProducts > 0
            ? Math.min(
                  100,
                  Math.max(
                      0,
                      stats?.catalog_coverage ??
                          Math.round(
                              (productsWithVisuals / totalProducts) * 100,
                          ),
                  ),
              )
            : 0;

    /* ----------------------------------------------------------------------
       FEATURED CREATIVE (Visual Focal Point)
    ---------------------------------------------------------------------- */

    const featuredDesign = recent_designs.length > 0 ? recent_designs[0] : null;

    /* ----------------------------------------------------------------------
       ACTIVITY DATA (Authentic DB records)
    ---------------------------------------------------------------------- */

    const activeActivityData = useMemo(
        () =>
            chartTimeframe === 'monthly' ? monthly_activity : weekly_activity,
        [chartTimeframe, monthly_activity, weekly_activity],
    );

    const totalPeriodDesigns = useMemo(
        () =>
            activeActivityData.reduce(
                (total, item) => total + (item.designs || 0),
                0,
            ),
        [activeActivityData],
    );

    const totalPeriodCampaigns = useMemo(
        () =>
            activeActivityData.reduce(
                (total, item) => total + (item.campaigns || 0),
                0,
            ),
        [activeActivityData],
    );

    const hasActivity = totalPeriodDesigns > 0 || totalPeriodCampaigns > 0;

    const maxChartValue = useMemo(() => {
        if (!hasActivity) {
            return 5;
        }

        const highest = Math.max(
            ...activeActivityData.map((item) =>
                Math.max(item.designs || 0, item.campaigns || 0),
            ),
        );

        return Math.max(highest + 1, 4);
    }, [activeActivityData, hasActivity]);

    /* ----------------------------------------------------------------------
       CAMPAIGN PIPELINE
    ---------------------------------------------------------------------- */

    const statusCounts = useMemo(
        () => ({
            active: campaign_status_breakdown?.active ?? 0,
            scheduled: campaign_status_breakdown?.scheduled ?? 0,
            draft: campaign_status_breakdown?.draft ?? 0,
            completed: campaign_status_breakdown?.completed ?? 0,
            archived: campaign_status_breakdown?.archived ?? 0,
        }),
        [campaign_status_breakdown],
    );

    const totalCampaignsTracked =
        statusCounts.active +
        statusCounts.scheduled +
        statusCounts.draft +
        statusCounts.completed +
        statusCounts.archived;

    const getStatusPercentage = (count: number) =>
        totalCampaignsTracked > 0 ? (count / totalCampaignsTracked) * 100 : 0;

    /* ----------------------------------------------------------------------
       IMAGE PREVIEW NAVIGATION & KEYBOARD HANDLING
    ---------------------------------------------------------------------- */

    const currentPreviewIndex = previewDesign
        ? recent_designs.findIndex((design) => design.id === previewDesign.id)
        : -1;

    const hasPrevDesign = currentPreviewIndex > 0;
    const hasNextDesign =
        currentPreviewIndex !== -1 &&
        currentPreviewIndex < recent_designs.length - 1;

    const handlePrevDesign = (event?: React.MouseEvent) => {
        event?.stopPropagation();

        if (hasPrevDesign) {
            setPreviewDesign(recent_designs[currentPreviewIndex - 1]);
        }
    };

    const handleNextDesign = (event?: React.MouseEvent) => {
        event?.stopPropagation();

        if (hasNextDesign) {
            setPreviewDesign(recent_designs[currentPreviewIndex + 1]);
        }
    };

    const handleDownload = (
        design: DashboardDesign,
        format: 'png' | 'jpeg' | 'svg' = 'png',
    ) => {
        const url = design.download_url || design.image_url;
        if (!url) {
            toast.info('No image available to download.');

            return;
        }

        downloadVisualAsFormat(
            url,
            `${design.campaign_name || 'creative'}-${design.product_name || 'visual'}`,
            format,
        );
    };

    const handleFinalize = (designId: number) => {
        setIsFinalizingId(designId);
        router.post(
            `/designs/${designId}/finalize`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Design finalized successfully.');
                },
                onError: () => {
                    toast.error('Failed to finalize design.');
                },
                onFinish: () => {
                    setIsFinalizingId(null);
                },
            },
        );
    };

    const handleDeleteDesign = (design: CampaignDesign) => {
        if (
            confirm(
                `Are you sure you want to delete "${design.product_name || 'this visual'}"?`,
            )
        ) {
            router.delete(`/designs/${design.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Visual deleted successfully.');
                    if (previewDesign?.id === design.id) {
                        setPreviewDesign(null);
                    }
                },
                onError: () => {
                    toast.error('Failed to delete visual.');
                },
            });
        }
    };

    useEffect(() => {
        if (previewDesign) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [previewDesign]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!previewDesign) {
                return;
            }

            if (event.key === 'Escape') {
                setPreviewDesign(null);
            }

            if (event.key === 'ArrowLeft' && hasPrevDesign) {
                setPreviewDesign(recent_designs[currentPreviewIndex - 1]);
            }

            if (event.key === 'ArrowRight' && hasNextDesign) {
                setPreviewDesign(recent_designs[currentPreviewIndex + 1]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        previewDesign,
        currentPreviewIndex,
        hasPrevDesign,
        hasNextDesign,
        recent_designs,
    ]);

    /* ----------------------------------------------------------------------
       CREATE CAMPAIGN ACTION
    ---------------------------------------------------------------------- */

    const handleCreateCampaign = (event: React.FormEvent) => {
        event.preventDefault();

        const errors: Record<string, string> = {};

        if (!campaignFormData.name.trim()) {
            errors.name = 'Campaign name is required';
        }

        if (!campaignFormData.event_id) {
            errors.event_id = 'Marketing event or holiday is required';
        }

        if (!campaignFormData.start_date) {
            errors.start_date = 'Start date is required';
        }

        if (!campaignFormData.end_date) {
            errors.end_date = 'End date is required';
        }

        if (
            campaignFormData.start_date &&
            campaignFormData.end_date &&
            campaignFormData.start_date > campaignFormData.end_date
        ) {
            errors.end_date = 'End date cannot be earlier than start date';
        }

        if (Object.keys(errors).length > 0) {
            setCampaignFormErrors(errors);
            toast.error('Please fill in all required campaign fields.');

            return;
        }

        setIsSubmittingCampaign(true);

        router.post('/campaigns', campaignFormData, {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateCampaignOpen(false);
                setCampaignFormData({
                    name: '',
                    event_id: '',
                    start_date: new Date().toISOString().split('T')[0],
                    end_date: new Date().toISOString().split('T')[0],
                    status: 'active',
                });
                setCampaignFormErrors({});
                toast.success('Campaign created successfully!');
            },
            onError: (errors) => {
                setCampaignFormErrors(errors as Record<string, string>);
                toast.error(
                    'Failed to create campaign. Please check the inputs.',
                );
            },
            onFinish: () => {
                setIsSubmittingCampaign(false);
            },
        });
    };

    /* ======================================================================
       RENDER
    ====================================================================== */

    return (
        <>
            <Head title="Marketing Dashboard" />

            <div className="min-h-screen w-full min-w-0 bg-background pb-20 text-foreground selection:bg-primary selection:text-primary-foreground">
                <div className="w-full min-w-0 space-y-8 p-4 sm:space-y-10 md:p-6 lg:p-8">
                    {/* ======================================================
                        1. HERO (EDITORIAL INTRODUCTION + SINGLE CTA + METRICS)
                        2. FEATURED CREATIVE (VISUAL FOCAL POINT)
                    ====================================================== */}
                    <div className="grid w-full min-w-0 grid-cols-1 gap-6 lg:grid-cols-12">
                        {/* LEFT: EDITORIAL HERO & ESSENTIAL METRICS */}
                        <section className="flex flex-col justify-between overflow-hidden rounded-card border border-border/80 bg-card p-6 shadow-xs sm:p-8 lg:col-span-7 xl:col-span-8 dark:border-white/[0.08] dark:bg-[#15171f]">
                            <div className="w-full min-w-0 space-y-4">
                                {/* Context / Date Header */}
                                <div className="flex w-full min-w-0 items-center justify-between gap-3 text-xs text-muted-foreground">
                                    <span className="truncate font-medium">
                                        {business?.name
                                            ? `${business.name} • Marketing Platform`
                                            : 'MarketPilot Platform'}
                                    </span>
                                    <span className="shrink-0 font-medium">
                                        {todayFormatted}
                                    </span>
                                </div>

                                {/* Editorial Headline & Natural Supporting Copy */}
                                <div className="max-w-xl space-y-2 pt-1">
                                    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                                        Create your next marketing campaign
                                    </h1>
                                    <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                                        Turn your products into polished marketing creatives for your next campaign.
                                    </p>
                                </div>

                                {/* One Primary CTA (No competing hero buttons) */}
                                <div className="pt-2">
                                    <Button
                                        asChild
                                        className="h-10 rounded-md bg-foreground px-5 text-xs font-semibold text-background shadow-xs transition-opacity hover:opacity-90"
                                    >
                                        <Link href="/generator">
                                            Create Marketing Design
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            {/* Essential Business Metrics (KPIs) - Typographic Hierarchy */}
                            <div className="mt-8 border-t border-border/60 pt-6">
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
                                    <Link
                                        href="/designs"
                                        className="group transition-opacity hover:opacity-85"
                                    >
                                        <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-3xl transition-colors group-hover:text-primary">
                                            {totalDesigns}
                                        </p>
                                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                                            Designs
                                        </p>
                                    </Link>

                                    <Link
                                        href="/campaigns"
                                        className="group transition-opacity hover:opacity-85"
                                    >
                                        <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-3xl transition-colors group-hover:text-primary">
                                            {activeCampaigns}
                                        </p>
                                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                                            Campaigns
                                        </p>
                                    </Link>

                                    <Link
                                        href="/products"
                                        className="group transition-opacity hover:opacity-85"
                                    >
                                        <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-3xl transition-colors group-hover:text-primary">
                                            {totalProducts}
                                        </p>
                                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                                            Products
                                        </p>
                                    </Link>

                                    <Link
                                        href="/calendar"
                                        className="group transition-opacity hover:opacity-85"
                                    >
                                        <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-3xl transition-colors group-hover:text-primary">
                                            {upcomingEventsCount}
                                        </p>
                                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                                            Key Dates
                                        </p>
                                    </Link>
                                </div>
                            </div>
                        </section>

                        {/* RIGHT: FEATURED CREATIVE (VISUAL FOCAL POINT) */}
                        <section className="flex flex-col justify-between overflow-hidden rounded-card border border-border/80 bg-card p-5 shadow-xs sm:p-6 lg:col-span-5 xl:col-span-4 dark:border-white/[0.08] dark:bg-[#15171f]">
                            <div className="flex items-center justify-between pb-3">
                                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Featured Creative
                                </h2>
                                {featuredDesign?.created_at && (
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {featuredDesign.created_at}
                                    </span>
                                )}
                            </div>

                            {featuredDesign ? (
                                <div className="flex flex-1 flex-col justify-between">
                                    <div
                                        onClick={() => setPreviewDesign(featuredDesign)}
                                        className={`group relative ${getAspectRatioClass(featuredDesign.aspect_ratio)} w-full max-h-[320px] cursor-pointer overflow-hidden rounded-2xl border border-border/70 bg-muted/20 flex items-center justify-center shadow-2xs transition-all duration-200 hover:border-primary/50 hover:shadow-md`}
                                    >
                                        {featuredDesign.image_url ? (
                                            <img
                                                src={featuredDesign.image_url}
                                                alt={
                                                    featuredDesign.product_name ||
                                                    'Featured creative'
                                                }
                                                className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.01]"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                                                <ImageIcon className="h-8 w-8" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 flex items-end justify-between gap-3 pt-1">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-bold text-foreground">
                                                {featuredDesign.campaign_name ||
                                                    featuredDesign.product_name ||
                                                    'Marketing Creative'}
                                            </p>
                                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                {featuredDesign.event_name
                                                    ? `${featuredDesign.event_name}${featuredDesign.product_name ? ` • ${featuredDesign.product_name}` : ''}`
                                                    : featuredDesign.product_name ||
                                                      'Campaign asset'}
                                            </p>
                                        </div>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPreviewDesign(featuredDesign)}
                                            className="h-8 shrink-0 rounded-md text-xs font-medium hover:bg-muted"
                                        >
                                            View Design
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 p-8 text-center">
                                    <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground/40" />
                                    <p className="text-sm font-semibold text-foreground">
                                        No designs generated yet
                                    </p>
                                    <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                                        Generate your first marketing creative to feature it here.
                                    </p>
                                    <Button
                                        asChild
                                        variant="outline"
                                        size="sm"
                                        className="mt-4 rounded-md text-xs font-medium"
                                    >
                                        <Link href="/generator">Create Design</Link>
                                    </Button>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* ======================================================
                        3. RECENT DESIGNS (IMAGE-LED MARKETING OUTPUT)
                    ====================================================== */}
                    <section className="w-full min-w-0 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                                    Recent Designs
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Marketing creatives ready for review and publishing
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                {recent_designs.length > 0 && (
                                    <div className="hidden sm:flex items-center rounded-md border border-border/70 bg-muted/40 p-0.5 text-xs">
                                        <button
                                            type="button"
                                            onClick={() => setRecentViewMode('grid')}
                                            className={cn(
                                                'flex items-center gap-1 rounded px-2 py-0.5 font-medium transition-colors',
                                                recentViewMode === 'grid'
                                                    ? 'bg-card text-foreground shadow-2xs font-semibold'
                                                    : 'text-muted-foreground hover:text-foreground',
                                            )}
                                            title="Grid View"
                                        >
                                            <LayoutGrid className="h-3 w-3" />
                                            <span>Grid</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRecentViewMode('capsule')}
                                            className={cn(
                                                'flex items-center gap-1 rounded px-2 py-0.5 font-medium transition-colors',
                                                recentViewMode === 'capsule'
                                                    ? 'bg-card text-foreground shadow-2xs font-semibold'
                                                    : 'text-muted-foreground hover:text-foreground',
                                            )}
                                            title="List View"
                                        >
                                            <List className="h-3 w-3" />
                                            <span>List</span>
                                        </button>
                                    </div>
                                )}

                                <Button
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                                >
                                    <Link href="/designs">
                                        View all ({totalDesigns})
                                        <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {recent_designs.length === 0 ? (
                            <Card className="w-full rounded-card border-border/80 bg-card p-8 text-center shadow-xs">
                                <ImageIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                                <h3 className="text-sm font-semibold text-foreground">
                                    No designs created yet
                                </h3>
                                <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                                    Start by generating creatives from your catalog or upcoming marketing events.
                                </p>
                                <Button
                                    asChild
                                    size="sm"
                                    className="mt-4 rounded-md text-xs font-medium"
                                >
                                    <Link href="/generator">Create Design</Link>
                                </Button>
                            </Card>
                        ) : recentViewMode === 'grid' ? (
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {recent_designs.map((design) => (
                                    <CampaignDesignCard
                                        key={design.id}
                                        design={design as any}
                                        campaignId={design.campaign_id ?? null}
                                        campaignEventId={design.campaign_event_id}
                                        onOpenViewer={(d) => setPreviewDesign(d as any)}
                                        onFinalize={handleFinalize}
                                        onDownload={handleDownload}
                                        onDelete={handleDeleteDesign}
                                        isFinalizing={isFinalizingId === design.id}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {recent_designs.map((design) => (
                                    <div
                                        key={design.id}
                                        onClick={() => setPreviewDesign(design)}
                                        className="group flex cursor-pointer items-center justify-between gap-4 rounded-card border border-border/80 bg-card p-3 shadow-xs transition-all hover:border-border hover:shadow-sm dark:border-white/[0.08] dark:bg-[#161820]"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md border border-border/40 bg-muted/20 flex items-center justify-center">
                                                {design.image_url ? (
                                                    <img
                                                        src={design.image_url}
                                                        alt={
                                                            design.product_name ||
                                                            'Design'
                                                        }
                                                        className="h-full w-full object-contain transition-transform group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <ImageIcon className="m-auto h-4 w-4 text-muted-foreground opacity-30" />
                                                )}
                                            </div>
                                            <div className="min-w-0 space-y-0.5">
                                                <p className="truncate text-xs font-semibold text-foreground transition-colors group-hover:text-primary">
                                                    {design.campaign_name ||
                                                        design.product_name ||
                                                        'Marketing Creative'}
                                                </p>
                                                <p className="truncate text-[11px] text-muted-foreground">
                                                    {design.event_name
                                                        ? `${design.event_name} • ${design.product_name || 'Catalog Item'}`
                                                        : design.product_name ||
                                                          'Marketing asset'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-3">
                                            <span className="hidden text-xs text-muted-foreground sm:inline">
                                                {design.created_at}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 rounded-md px-2 text-xs text-muted-foreground hover:text-foreground"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPreviewDesign(design);
                                                }}
                                            >
                                                View
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* ======================================================
                        4. CAMPAIGN PIPELINE, CATALOG READINESS & KEY DATES
                    ====================================================== */}
                    <div className="grid w-full min-w-0 grid-cols-1 gap-6 lg:grid-cols-12">
                        {/* CAMPAIGN PIPELINE (lg:col-span-4) */}
                        <Card className="min-w-0 rounded-card border-border/80 bg-card p-5 shadow-xs lg:col-span-4 dark:border-white/[0.08] dark:bg-[#161820]">
                            <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                                <h3 className="truncate text-sm font-bold text-foreground">
                                    Campaign Pipeline
                                </h3>
                                <Link
                                    href="/campaigns"
                                    className="shrink-0 text-xs font-medium text-muted-foreground hover:text-foreground"
                                >
                                    View all ({totalCampaignsTracked}) →
                                </Link>
                            </div>

                            <div className="mt-4 min-w-0 space-y-4">
                                {/* Segmented Distribution Bar */}
                                <div className="flex h-2.5 min-w-0 overflow-hidden rounded-full bg-muted/60">
                                    {[
                                        {
                                            status: 'active',
                                            count: statusCounts.active,
                                            color: 'bg-emerald-500',
                                        },
                                        {
                                            status: 'scheduled',
                                            count: statusCounts.scheduled,
                                            color: 'bg-blue-500',
                                        },
                                        {
                                            status: 'draft',
                                            count: statusCounts.draft,
                                            color: 'bg-amber-500',
                                        },
                                        {
                                            status: 'completed',
                                            count: statusCounts.completed,
                                            color: 'bg-purple-500',
                                        },
                                        {
                                            status: 'archived',
                                            count: statusCounts.archived,
                                            color: 'bg-zinc-500',
                                        },
                                    ].map((item) => (
                                        <div
                                            key={item.status}
                                            style={{
                                                width: `${getStatusPercentage(item.count)}%`,
                                            }}
                                            className={cn(
                                                'transition-all',
                                                item.color,
                                            )}
                                        />
                                    ))}
                                </div>

                                {/* Status Rows */}
                                <div className="space-y-1.5">
                                    {[
                                        {
                                            label: 'Active',
                                            status: 'active',
                                            count: statusCounts.active,
                                            badgeVariant: 'outline' as const,
                                            badgeClass:
                                                'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
                                        },
                                        {
                                            label: 'Scheduled',
                                            status: 'scheduled',
                                            count: statusCounts.scheduled,
                                            badgeVariant: 'outline' as const,
                                            badgeClass:
                                                'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10',
                                        },
                                        {
                                            label: 'Draft',
                                            status: 'draft',
                                            count: statusCounts.draft,
                                            badgeVariant: 'outline' as const,
                                            badgeClass:
                                                'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10',
                                        },
                                        {
                                            label: 'Completed',
                                            status: 'completed',
                                            count: statusCounts.completed,
                                            badgeVariant: 'outline' as const,
                                            badgeClass:
                                                'border-zinc-500/30 text-muted-foreground bg-muted/40',
                                        },
                                    ].map((item) => (
                                        <Link
                                            key={item.status}
                                            href="/campaigns"
                                            className="flex items-center justify-between rounded-lg p-2 text-xs transition-colors hover:bg-muted/50"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant={item.badgeVariant}
                                                    className={cn(
                                                        'rounded-md px-1.5 py-0 text-[10px] font-semibold',
                                                        item.badgeClass,
                                                    )}
                                                >
                                                    {item.label}
                                                </Badge>
                                            </div>
                                            <span className="text-xs font-bold tabular-nums text-foreground">
                                                {item.count}
                                            </span>
                                        </Link>
                                    ))}
                                </div>

                                <div className="border-t border-border/40 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsCreateCampaignOpen(true)}
                                        className="w-full rounded-md text-xs font-medium"
                                    >
                                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                                        New Campaign
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        {/* CATALOG READINESS (lg:col-span-4) */}
                        <Card className="min-w-0 rounded-card border-border/80 bg-card p-5 shadow-xs lg:col-span-4 dark:border-white/[0.08] dark:bg-[#161820]">
                            <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                                <h3 className="truncate text-sm font-bold text-foreground">
                                    Catalog Readiness
                                </h3>
                                <Link
                                    href="/products"
                                    className="shrink-0 text-xs font-medium text-muted-foreground hover:text-foreground"
                                >
                                    Manage catalog →
                                </Link>
                            </div>

                            <div className="mt-4 min-w-0 space-y-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
                                            {totalProducts}{' '}
                                            <span className="text-xs font-normal text-muted-foreground">
                                                products
                                            </span>
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {productsWithVisuals} with visuals ({catalogCoverage}%)
                                        </p>
                                        {productsWithoutVisuals > 0 && (
                                            <p className="text-[11px] text-muted-foreground">
                                                {productsWithoutVisuals} waiting for creatives
                                            </p>
                                        )}
                                    </div>

                                    {/* Actual product image thumbnail if available */}
                                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted/20 flex items-center justify-center">
                                        {recent_designs[0]?.image_url ? (
                                            <img
                                                src={recent_designs[0].image_url}
                                                alt="Catalog item"
                                                className="h-full w-full object-contain"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
                                                <Package className="h-6 w-6" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>Coverage</span>
                                        <span className="font-bold tabular-nums text-foreground">
                                            {catalogCoverage}%
                                        </span>
                                    </div>
                                    <Progress value={catalogCoverage} className="h-2" />
                                </div>

                                <div className="border-t border-border/40 pt-2">
                                    <Button
                                        asChild
                                        variant="outline"
                                        size="sm"
                                        className="w-full rounded-md text-xs font-medium"
                                    >
                                        <Link
                                            href={
                                                totalProducts === 0
                                                    ? '/products/create'
                                                    : '/products'
                                            }
                                        >
                                            {totalProducts === 0 ? (
                                                <>
                                                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                                                    Add First Product
                                                </>
                                            ) : (
                                                'Review Products'
                                            )}
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        {/* UPCOMING KEY DATES (lg:col-span-4) */}
                        <Card className="min-w-0 rounded-card border-border/80 bg-card p-5 shadow-xs lg:col-span-4 dark:border-white/[0.08] dark:bg-[#161820]">
                            <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                                <h3 className="truncate text-sm font-bold text-foreground">
                                    Upcoming Key Dates
                                </h3>
                                <Link
                                    href="/calendar"
                                    className="shrink-0 text-xs font-medium text-muted-foreground hover:text-foreground"
                                >
                                    Calendar →
                                </Link>
                            </div>

                            <div className="mt-3 min-w-0">
                                {upcoming_events.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-muted-foreground">
                                        No upcoming events in the next 30 days.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {upcoming_events.slice(0, 4).map((event) => (
                                            <div
                                                key={event.id}
                                                className="group flex items-center justify-between gap-2 rounded-lg p-2 transition-colors hover:bg-muted/50"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                                                        {event.name}
                                                    </p>
                                                    <p className="truncate text-[11px] text-muted-foreground">
                                                        {event.date || 'Upcoming'} • {formatEventCategory(event.category, event.type)}
                                                    </p>
                                                </div>

                                                <div className="flex shrink-0 items-center gap-1.5">
                                                    {event.days && (
                                                        <span className="text-[11px] font-medium text-muted-foreground">
                                                            {event.days}
                                                        </span>
                                                    )}
                                                    <Button
                                                        asChild
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 px-2 text-[11px] font-medium text-primary hover:bg-primary/10"
                                                    >
                                                        <Link
                                                            href={`/generator?event_id=${event.id}`}
                                                            title={`Create design for ${event.name}`}
                                                        >
                                                            Create
                                                            <ArrowUpRight className="ml-1 h-3 w-3" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* ======================================================
                        5. OUTPUT HISTORY (AUTHENTIC DATABASE ACTIVITY)
                    ====================================================== */}
                    {hasActivity && (
                        <Card className="w-full min-w-0 overflow-hidden rounded-card border-border/80 bg-card p-5 shadow-xs sm:p-6 dark:border-white/[0.08] dark:bg-[#161820]">
                            <div className="flex w-full min-w-0 flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0 flex-1">
                                    <h3 className="truncate text-sm font-bold tracking-tight text-foreground">
                                        Output History
                                    </h3>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        Database record of generated designs and campaign production
                                    </p>
                                </div>

                                <div className="flex shrink-0 items-center gap-1 rounded-md border border-border/70 bg-muted/40 p-0.5 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setChartTimeframe('monthly')}
                                        className={cn(
                                            'rounded px-2.5 py-1 font-medium transition-colors',
                                            chartTimeframe === 'monthly'
                                                ? 'bg-card text-foreground shadow-2xs font-semibold'
                                                : 'text-muted-foreground hover:text-foreground',
                                        )}
                                    >
                                        Monthly
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setChartTimeframe('weekly')}
                                        className={cn(
                                            'rounded px-2.5 py-1 font-medium transition-colors',
                                            chartTimeframe === 'weekly'
                                                ? 'bg-card text-foreground shadow-2xs font-semibold'
                                                : 'text-muted-foreground hover:text-foreground',
                                        )}
                                    >
                                        Weekly
                                    </button>
                                </div>
                            </div>

                            <div className="w-full min-w-0 overflow-x-auto pt-6">
                                <div
                                    className="grid h-40 w-full min-w-0 items-end gap-2 border-b border-border/60 px-1 sm:gap-4 sm:px-2"
                                    style={{
                                        gridTemplateColumns: `repeat(${activeActivityData.length || 6}, minmax(0, 1fr))`,
                                    }}
                                >
                                    {activeActivityData.map((item, index) => {
                                        const designs = item.designs || 0;
                                        const campaigns = item.campaigns || 0;

                                        const designHeight =
                                            designs > 0
                                                ? Math.max(
                                                      12,
                                                      Math.round(
                                                          (designs / maxChartValue) * 100,
                                                      ),
                                                  )
                                                : 4;

                                        const campaignHeight =
                                            campaigns > 0
                                                ? Math.max(
                                                      8,
                                                      Math.round(
                                                          (campaigns / maxChartValue) * 100,
                                                      ),
                                                  )
                                                : 4;

                                        const hovered = hoveredPointIndex === index;

                                        return (
                                            <div
                                                key={`${item.period}-${index}`}
                                                className="group relative flex h-full min-w-0 cursor-pointer flex-col items-center justify-end"
                                                onMouseEnter={() =>
                                                    setHoveredPointIndex(index)
                                                }
                                                onMouseLeave={() =>
                                                    setHoveredPointIndex(null)
                                                }
                                            >
                                                {hovered && (
                                                    <div className="absolute -top-12 z-30 whitespace-nowrap rounded-md border border-border bg-popover px-2.5 py-1 text-[11px] font-semibold text-popover-foreground shadow-md">
                                                        <span>
                                                            {designs} design{designs === 1 ? '' : 's'} • {campaigns} campaign{campaigns === 1 ? '' : 's'}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex h-28 w-full max-w-full items-end justify-center gap-1 sm:gap-1.5">
                                                    <div
                                                        style={{
                                                            height: `${designHeight}%`,
                                                        }}
                                                        className={cn(
                                                            'w-1/2 rounded-t-sm transition-all',
                                                            designs > 0
                                                                ? 'bg-foreground/80 group-hover:bg-foreground'
                                                                : 'bg-muted/40',
                                                        )}
                                                    />
                                                    <div
                                                        style={{
                                                            height: `${campaignHeight}%`,
                                                        }}
                                                        className={cn(
                                                            'w-1/2 rounded-t-sm transition-all',
                                                            campaigns > 0
                                                                ? 'bg-muted-foreground/60 group-hover:bg-muted-foreground'
                                                                : 'bg-muted/40',
                                                        )}
                                                    />
                                                </div>

                                                <span className="mt-2 max-w-full truncate text-center text-xs font-medium text-muted-foreground">
                                                    {item.period}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            {/* ==============================================================
                IMAGE VIEWER (FULL-SCREEN PREVIEW)
            ============================================================== */}
            {previewDesign && (
                <div
                    className="dark fixed inset-0 z-[150] overflow-y-auto bg-black/95 text-white backdrop-blur-2xl"
                    onClick={() => setPreviewDesign(null)}
                >
                    <div
                        className="sticky top-0 z-[160] flex items-center justify-between gap-3 border-b border-white/10 bg-black/80 px-4 py-3 backdrop-blur-md sm:px-8"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex min-w-0 items-center gap-3">
                            <h2 className="max-w-[180px] truncate text-sm font-bold sm:max-w-md sm:text-base">
                                {previewDesign.product_name ||
                                    'Marketing Visual'}
                            </h2>

                            {previewDesign.campaign_name && (
                                <Badge
                                    variant="outline"
                                    className="hidden shrink-0 border-white/20 bg-white/5 text-[10px] text-white sm:inline-flex"
                                >
                                    {previewDesign.campaign_name}
                                </Badge>
                            )}
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(previewDesign)}
                                className="h-8 cursor-pointer gap-1.5 rounded-xl border border-white/10 bg-white/10 text-xs text-white hover:bg-white/20 hover:text-white"
                            >
                                <Download className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">
                                    Download
                                </span>
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Close image preview"
                                onClick={() => setPreviewDesign(null)}
                                className="h-8 w-8 cursor-pointer rounded-full border border-white/10 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="relative flex min-h-[calc(100vh-64px)] items-center justify-center p-4 sm:p-8">
                        <div
                            className="relative max-w-full"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="overflow-hidden rounded-2xl border border-white/15 bg-black/40 shadow-2xl">
                                {previewDesign.image_url && (
                                    <img
                                        src={previewDesign.image_url}
                                        alt={
                                            previewDesign.product_name ||
                                            'Visual Preview'
                                        }
                                        className="max-h-[70vh] max-w-[90vw] rounded-xl object-contain sm:max-h-[calc(100vh-10rem)]"
                                    />
                                )}
                            </div>
                        </div>

                        {hasPrevDesign && (
                            <button
                                type="button"
                                aria-label="Previous visual"
                                onClick={handlePrevDesign}
                                className="absolute top-1/2 left-2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/60 text-white shadow-xl backdrop-blur-md transition-all hover:scale-110 hover:bg-black/90 sm:left-6 sm:h-10 sm:w-10"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                        )}

                        {hasNextDesign && (
                            <button
                                type="button"
                                aria-label="Next visual"
                                onClick={handleNextDesign}
                                className="absolute top-1/2 right-2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/60 text-white shadow-xl backdrop-blur-md transition-all hover:scale-110 hover:bg-black/90 sm:right-6 sm:h-10 sm:w-10"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ==============================================================
                CREATE CAMPAIGN MODAL
            ============================================================== */}
            <Dialog
                open={isCreateCampaignOpen}
                onOpenChange={setIsCreateCampaignOpen}
            >
                <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto rounded-card border-border bg-card p-4 shadow-2xl sm:max-w-md sm:p-6">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Megaphone className="h-5 w-5" />
                            </div>

                            <div>
                                <DialogTitle className="text-lg font-bold">
                                    Create New Campaign
                                </DialogTitle>

                                <DialogDescription className="mt-0.5 text-xs">
                                    Organize a promotional event, product, and
                                    creative campaign in one pipeline.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form
                        onSubmit={handleCreateCampaign}
                        className="space-y-4 pt-2"
                    >
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="campaign-name"
                                className="text-xs font-semibold"
                            >
                                Campaign Name{' '}
                                <span className="text-destructive">*</span>
                            </Label>

                            <Input
                                id="campaign-name"
                                value={campaignFormData.name}
                                onChange={(event) =>
                                    setCampaignFormData({
                                        ...campaignFormData,
                                        name: event.target.value,
                                    })
                                }
                                placeholder="e.g. Summer Mega Sale 2026"
                                className="h-9 rounded-xl text-xs"
                            />

                            {campaignFormErrors.name && (
                                <p className="text-[11px] text-destructive">
                                    {campaignFormErrors.name}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label
                                htmlFor="campaign-event"
                                className="text-xs font-semibold"
                            >
                                Target Holiday or Event{' '}
                                <span className="text-destructive">*</span>
                            </Label>

                            <Select
                                value={campaignFormData.event_id}
                                onValueChange={(value) =>
                                    setCampaignFormData({
                                        ...campaignFormData,
                                        event_id: value,
                                    })
                                }
                            >
                                <SelectTrigger
                                    id="campaign-event"
                                    className="h-9 rounded-xl text-xs"
                                >
                                    <SelectValue placeholder="Select calendar event..." />
                                </SelectTrigger>

                                <SelectContent className="max-h-56 rounded-xl">
                                    {events.map((event) => (
                                        <SelectItem
                                            key={event.id}
                                            value={String(event.id)}
                                            className="text-xs"
                                        >
                                            {event.name} (
                                            {event.date || 'Year-round'})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {campaignFormErrors.event_id && (
                                <p className="text-[11px] text-destructive">
                                    {campaignFormErrors.event_id}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="campaign-start-date"
                                    className="text-xs font-semibold"
                                >
                                    Start Date{' '}
                                    <span className="text-destructive">*</span>
                                </Label>

                                <Input
                                    id="campaign-start-date"
                                    type="date"
                                    value={campaignFormData.start_date}
                                    onChange={(event) =>
                                        setCampaignFormData({
                                            ...campaignFormData,
                                            start_date: event.target.value,
                                        })
                                    }
                                    className="h-9 rounded-xl text-xs"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="campaign-end-date"
                                    className="text-xs font-semibold"
                                >
                                    End Date{' '}
                                    <span className="text-destructive">*</span>
                                </Label>

                                <Input
                                    id="campaign-end-date"
                                    type="date"
                                    value={campaignFormData.end_date}
                                    onChange={(event) =>
                                        setCampaignFormData({
                                            ...campaignFormData,
                                            end_date: event.target.value,
                                        })
                                    }
                                    className="h-9 rounded-xl text-xs"
                                />
                            </div>
                        </div>

                        {campaignFormErrors.end_date && (
                            <p className="text-[11px] text-destructive">
                                {campaignFormErrors.end_date}
                            </p>
                        )}

                        <DialogFooter className="pt-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateCampaignOpen(false)}
                                className="h-9 rounded-xl text-xs"
                            >
                                Cancel
                            </Button>

                            <Button
                                type="submit"
                                disabled={isSubmittingCampaign}
                                className="h-9 gap-1.5 rounded-xl text-xs font-bold"
                            >
                                {isSubmittingCampaign ? (
                                    'Creating...'
                                ) : (
                                    <>
                                        <Plus className="h-3.5 w-3.5" />
                                        Create Campaign
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
    ],
};
