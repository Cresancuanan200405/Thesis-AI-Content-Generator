import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowUpRight,
    BarChart3,
    Calendar,
    CalendarDays,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Clock,
    Download,
    Eye,
    FolderPlus,
    Heart,
    ImageIcon,
    Layers,
    LayoutDashboard,
    Megaphone,
    Package,
    PieChart,
    Plus,
    Radio,
    Sparkles,
    Tag,
    TrendingUp,
    X,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

/* ==========================================================================
   TYPES
========================================================================== */

type ActivityPoint = {
    period: string;
    designs: number;
    campaigns: number;
};

type Props = {
    auth?: any;
    campaigns?: any[];
    upcoming_events?: any[];
    recent_designs?: any[];
    stats?: {
        total_designs?: number;
        active_campaigns?: number;
        total_products?: number;
        upcoming_events?: number;
        catalog_coverage?: number;
    };
    monthly_activity?: ActivityPoint[];
    weekly_activity?: ActivityPoint[];
    campaign_status_breakdown?: {
        active?: number;
        scheduled?: number;
        draft?: number;
        completed?: number;
    };
    business?: {
        name?: string;
        industry?: string;
    };
};

/* ==========================================================================
   COMPONENT
========================================================================== */

export default function Dashboard({
    auth,
    campaigns = [],
    upcoming_events = [],
    recent_designs = [],
    stats = {},
    monthly_activity = [],
    weekly_activity = [],
    campaign_status_breakdown = {},
    business = {},
}: Props) {
    const user = auth?.user;
    const hour = new Date().getHours();
    const greeting =
        hour < 12
            ? 'Good morning'
            : hour < 18
              ? 'Good afternoon'
              : 'Good evening';
    const todayFormatted = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date());

    // Chart Timeframe Toggle: 'monthly' (6 months) vs 'weekly' (7 days)
    const [chartTimeframe, setChartTimeframe] = useState<'monthly' | 'weekly'>(
        'monthly',
    );
    const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(
        null,
    );

    // Full-screen image viewer state for recent designs
    const [previewDesign, setPreviewDesign] = useState<any>(null);
    const [isZoomed, setIsZoomed] = useState(false);
    const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
    const [isScrolledToDetails, setIsScrolledToDetails] = useState(false);

    // Create Campaign Modal State
    const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
    const [isSubmittingCampaign, setIsSubmittingCampaign] = useState(false);
    const [campaignFormErrors, setCampaignFormErrors] = useState<
        Record<string, string>
    >({});
    const [campaignFormData, setCampaignFormData] = useState({
        name: '',
        event_id: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
    });

    const handleCreateCampaign = (e: React.FormEvent) => {
        e.preventDefault();
        setCampaignFormErrors({});

        if (!campaignFormData.name.trim()) {
            setCampaignFormErrors({ name: 'Campaign name is required' });

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
                });
                toast.success('Campaign created successfully!');
            },
            onError: (errors) => {
                setCampaignFormErrors(errors as Record<string, string>);
                toast.error('Failed to create campaign. Please check inputs.');
            },
            onFinish: () => setIsSubmittingCampaign(false),
        });
    };

    const totalDesigns = stats?.total_designs ?? 0;
    const activeCampaigns = stats?.active_campaigns ?? 0;
    const totalProducts = stats?.total_products ?? 0;
    const upcomingEventsCount = stats?.upcoming_events ?? 0;
    const catalogCoverage =
        stats?.catalog_coverage ??
        (totalProducts > 0
            ? Math.min(100, Math.round((totalDesigns / totalProducts) * 100))
            : 0);

    // Active Activity Data source
    const activeActivityData = useMemo(() => {
        const source =
            chartTimeframe === 'monthly' ? monthly_activity : weekly_activity;

        if (source && source.length > 0) {
            return source;
        }

        // Fallback demo data if empty
        if (chartTimeframe === 'monthly') {
            return [
                { period: 'Mar', designs: 4, campaigns: 1 },
                { period: 'Apr', designs: 8, campaigns: 2 },
                { period: 'May', designs: 14, campaigns: 3 },
                { period: 'Jun', designs: 19, campaigns: 4 },
                { period: 'Jul', designs: 26, campaigns: 5 },
                {
                    period: 'Aug',
                    designs: totalDesigns || 12,
                    campaigns: activeCampaigns || 2,
                },
            ];
        }

        return [
            { period: 'Mon', designs: 2, campaigns: 0 },
            { period: 'Tue', designs: 5, campaigns: 1 },
            { period: 'Wed', designs: 3, campaigns: 0 },
            { period: 'Thu', designs: 8, campaigns: 2 },
            { period: 'Fri', designs: 6, campaigns: 1 },
            { period: 'Sat', designs: 4, campaigns: 0 },
            { period: 'Sun', designs: 7, campaigns: 1 },
        ];
    }, [
        chartTimeframe,
        monthly_activity,
        weekly_activity,
        totalDesigns,
        activeCampaigns,
    ]);

    const maxChartValue = useMemo(() => {
        return (
            Math.max(
                ...activeActivityData.map((d) =>
                    Math.max(d.designs, d.campaigns, 4),
                ),
            ) + 2
        );
    }, [activeActivityData]);

    const totalPeriodDesigns = useMemo(() => {
        return activeActivityData.reduce((acc, d) => acc + d.designs, 0);
    }, [activeActivityData]);

    const totalPeriodCampaigns = useMemo(() => {
        return activeActivityData.reduce((acc, d) => acc + d.campaigns, 0);
    }, [activeActivityData]);

    // Summary Top Metric Cards
    const summaryMetrics = [
        {
            label: 'Total AI Visuals',
            value: totalDesigns,
            trend: `${totalDesigns} Generated`,
            icon: ImageIcon,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10 dark:bg-purple-500/20',
            borderColor: 'group-hover:border-purple-500/40',
            href: '/designs',
        },
        {
            label: 'Active Campaigns',
            value: activeCampaigns,
            trend: 'Live & Scheduled',
            icon: Megaphone,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10 dark:bg-blue-500/20',
            borderColor: 'group-hover:border-blue-500/40',
            href: '/campaigns',
        },
        {
            label: 'Upcoming Key Dates',
            value: upcomingEventsCount,
            trend: 'Next 30 Days',
            icon: CalendarDays,
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10 dark:bg-amber-500/20',
            borderColor: 'group-hover:border-amber-500/40',
            href: '/calendar',
        },
        {
            label: 'Catalog Products',
            value: totalProducts,
            trend: `${catalogCoverage}% Visual Coverage`,
            icon: Package,
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20',
            borderColor: 'group-hover:border-emerald-500/40',
            href: '/products',
        },
    ];

    // Pipeline status counts
    const statusCounts = {
        active:
            campaign_status_breakdown.active ??
            campaigns.filter((c) => c.status === 'active').length,
        scheduled:
            campaign_status_breakdown.scheduled ??
            campaigns.filter((c) => c.status === 'scheduled').length,
        draft:
            campaign_status_breakdown.draft ??
            campaigns.filter((c) => c.status === 'draft').length,
        completed:
            campaign_status_breakdown.completed ??
            campaigns.filter((c) => c.status === 'completed').length,
    };
    const totalCampaignsTracked =
        Object.values(statusCounts).reduce((a, b) => a + b, 0) || 1;

    // Image Modal Nav
    const currentPreviewIndex = previewDesign
        ? recent_designs.findIndex((d: any) => d.id === previewDesign.id)
        : -1;
    const hasPrevDesign = currentPreviewIndex > 0;
    const hasNextDesign =
        currentPreviewIndex !== -1 &&
        currentPreviewIndex < recent_designs.length - 1;

    const handlePrevDesign = (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }

        if (hasPrevDesign) {
            setPreviewDesign(recent_designs[currentPreviewIndex - 1]);
            setIsZoomed(false);
            setIsScrolledToDetails(false);
        }
    };

    const handleNextDesign = (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }

        if (hasNextDesign) {
            setPreviewDesign(recent_designs[currentPreviewIndex + 1]);
            setIsZoomed(false);
            setIsScrolledToDetails(false);
        }
    };

    const handleDownload = (design: any) => {
        if (!design.image_url) {
            toast.info('No image available to download.');

            return;
        }

        const link = document.createElement('a');
        link.href = design.image_url;
        link.download = `${design.product_name || 'design'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Downloading visual!');
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
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!previewDesign) {
                return;
            }

            if (e.key === 'Escape') {
                setPreviewDesign(null);
                setIsZoomed(false);
            } else if (e.key === 'ArrowLeft' && hasPrevDesign) {
                setPreviewDesign(recent_designs[currentPreviewIndex - 1]);
                setIsZoomed(false);
            } else if (e.key === 'ArrowRight' && hasNextDesign) {
                setPreviewDesign(recent_designs[currentPreviewIndex + 1]);
                setIsZoomed(false);
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

    return (
        <>
            <Head title="System Dashboard" />

            <div className="min-h-screen bg-background pb-20 text-foreground selection:bg-primary selection:text-primary-foreground">
                <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
                    {/* =====================================================
                        1. WELCOME & QUICK ACTION HERO (Glassmorphism Banner)
                    ====================================================== */}
                    <section className="relative overflow-hidden rounded-3xl border border-white/25 bg-card/85 p-6 shadow-xl shadow-black/5 backdrop-blur-2xl md:p-8 dark:border-white/10 dark:bg-card/85 dark:shadow-black/40">
                        {/* Ambient Light Orbs */}
                        <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-primary/15 blur-[90px]" />
                        <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-blue-500/10 blur-[90px]" />

                        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-xs font-bold text-primary shadow-2xs backdrop-blur-sm">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        {business?.name ||
                                            'AI Marketing Studio'}
                                    </div>
                                    <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
                                        &bull; {todayFormatted}
                                    </span>
                                </div>

                                <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                                    {greeting},{' '}
                                    {user?.name?.split(' ')[0] || 'Marketer'}!
                                </h1>

                                <p className="max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
                                    Your automated marketing pipeline is active.
                                    Manage your campaigns, generate AI visuals,
                                    and track performance in real-time.
                                </p>
                            </div>

                            {/* Quick Action Shortcuts */}
                            <div className="relative z-10 flex shrink-0 flex-wrap items-center gap-2.5">
                                <Button
                                    asChild
                                    variant="outline"
                                    className="h-10 gap-1.5 rounded-xl px-3.5 text-xs font-semibold shadow-sm transition-all hover:scale-105 hover:border-primary/40 active:scale-95"
                                >
                                    <Link href="/products/create">
                                        <Package className="h-4 w-4" />
                                        Add Product
                                    </Link>
                                </Button>

                                <Button
                                    type="button"
                                    onClick={() =>
                                        setIsCreateCampaignOpen(true)
                                    }
                                    variant="outline"
                                    className="h-10 cursor-pointer gap-1.5 rounded-xl px-3.5 text-xs font-semibold shadow-sm transition-all hover:scale-105 hover:border-primary/40 active:scale-95"
                                >
                                    <Plus className="h-4 w-4" />
                                    New Campaign
                                </Button>

                                <Button
                                    asChild
                                    className="h-10 gap-2 rounded-xl px-4 text-xs font-bold shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95"
                                >
                                    <Link href="/generator">
                                        <Sparkles className="h-4 w-4" />
                                        AI Studio
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </section>

                    {/* =====================================================
                        2. 4 CORE METRIC CARDS
                    ====================================================== */}
                    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {summaryMetrics.map((metric) => {
                            const IconComponent = metric.icon;

                            return (
                                <Link
                                    key={metric.label}
                                    href={metric.href}
                                    className={cn(
                                        'group relative block flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-white/25 bg-card/80 p-5 shadow-lg backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl dark:border-white/10 dark:bg-card/80',
                                        metric.borderColor,
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-muted-foreground">
                                            {metric.label}
                                        </span>
                                        <div
                                            className={`flex h-9 w-9 items-center justify-center rounded-xl ${metric.bgColor} ${metric.color} shadow-xs transition-transform duration-200 group-hover:scale-110`}
                                        >
                                            <IconComponent className="h-4 w-4" />
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-baseline gap-2">
                                        <span className="text-3xl font-extrabold tracking-tight text-foreground">
                                            {metric.value}
                                        </span>
                                    </div>

                                    <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
                                        <span>{metric.trend}</span>
                                        <span className="flex items-center gap-0.5 font-bold text-primary transition-colors group-hover:underline">
                                            View{' '}
                                            <ArrowUpRight className="h-3 w-3" />
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </section>

                    {/* =====================================================
                        3. EASILY UNDERSTOOD CHARTS & PIPELINE ANALYTICS
                    ====================================================== */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* CHART 1: Creative & Campaign Output Activity (Dual Bar / Trend Visualizer) */}
                        <Card className="flex flex-col justify-between rounded-3xl border-white/25 bg-card/85 p-6 shadow-xl backdrop-blur-2xl lg:col-span-2 dark:border-white/10 dark:bg-card/85">
                            <div>
                                <div className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <BarChart3 className="h-4 w-4" />
                                            </div>
                                            <h2 className="text-base font-bold tracking-tight text-foreground">
                                                Marketing Production & Output
                                            </h2>
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Comparison of AI visual assets
                                            generated versus marketing campaigns
                                            launched.
                                        </p>
                                    </div>

                                    {/* Timeframe Toggle Buttons (Monthly / Weekly) */}
                                    <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border/70 bg-muted/60 p-1">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setChartTimeframe('monthly')
                                            }
                                            className={cn(
                                                'cursor-pointer rounded-lg px-3 py-1 text-xs font-bold transition-all',
                                                chartTimeframe === 'monthly'
                                                    ? 'bg-card text-foreground shadow-xs'
                                                    : 'text-muted-foreground hover:text-foreground',
                                            )}
                                        >
                                            Monthly
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setChartTimeframe('weekly')
                                            }
                                            className={cn(
                                                'cursor-pointer rounded-lg px-3 py-1 text-xs font-bold transition-all',
                                                chartTimeframe === 'weekly'
                                                    ? 'bg-card text-foreground shadow-xs'
                                                    : 'text-muted-foreground hover:text-foreground',
                                            )}
                                        >
                                            Last 7 Days
                                        </button>
                                    </div>
                                </div>

                                {/* Chart Legend & Summary Totals */}
                                <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5">
                                            <span className="h-3 w-3 rounded-md bg-primary shadow-xs" />
                                            <span className="font-semibold text-foreground">
                                                AI Visuals
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className="ml-1 text-[10px] font-bold"
                                            >
                                                {totalPeriodDesigns} total
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="h-3 w-3 rounded-md bg-emerald-500 shadow-xs" />
                                            <span className="font-semibold text-foreground">
                                                Campaigns
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className="ml-1 text-[10px] font-bold"
                                            >
                                                {totalPeriodCampaigns} total
                                            </Badge>
                                        </div>
                                    </div>

                                    <span className="text-[11px] text-muted-foreground">
                                        Hover any column for details
                                    </span>
                                </div>

                                {/* Interactive Bar Graph Canvas */}
                                <div className="pt-6 pb-2">
                                    <div className="grid h-48 grid-cols-6 items-end gap-2 border-b border-border/40 px-2 sm:grid-cols-7 sm:gap-4">
                                        {activeActivityData.map((item, idx) => {
                                            const designsHeightPercent =
                                                Math.max(
                                                    12,
                                                    Math.round(
                                                        (item.designs /
                                                            maxChartValue) *
                                                            100,
                                                    ),
                                                );
                                            const campaignsHeightPercent =
                                                Math.max(
                                                    8,
                                                    Math.round(
                                                        (item.campaigns /
                                                            maxChartValue) *
                                                            100,
                                                    ),
                                                );
                                            const isHovered =
                                                hoveredPointIndex === idx;

                                            return (
                                                <div
                                                    key={item.period + idx}
                                                    className="group relative flex h-full cursor-pointer flex-col items-center justify-end"
                                                    onMouseEnter={() =>
                                                        setHoveredPointIndex(
                                                            idx,
                                                        )
                                                    }
                                                    onMouseLeave={() =>
                                                        setHoveredPointIndex(
                                                            null,
                                                        )
                                                    }
                                                >
                                                    {/* Hover Tooltip Card */}
                                                    {isHovered && (
                                                        <div className="absolute -top-12 z-30 animate-in rounded-xl border border-border/80 bg-popover/95 px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap text-popover-foreground shadow-2xl backdrop-blur-md duration-150 zoom-in-95 fade-in">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-primary">
                                                                    {
                                                                        item.designs
                                                                    }{' '}
                                                                    visuals
                                                                </span>
                                                                <span>
                                                                    &bull;
                                                                </span>
                                                                <span className="font-bold text-emerald-500">
                                                                    {
                                                                        item.campaigns
                                                                    }{' '}
                                                                    campaigns
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Dual Bars */}
                                                    <div className="flex h-36 w-full max-w-[48px] items-end justify-center gap-1.5">
                                                        {/* Designs Bar */}
                                                        <div
                                                            style={{
                                                                height: `${designsHeightPercent}%`,
                                                            }}
                                                            className="w-1/2 origin-bottom rounded-t-lg bg-primary/80 shadow-sm transition-all duration-200 group-hover:scale-y-[1.03] group-hover:bg-primary"
                                                        />
                                                        {/* Campaigns Bar */}
                                                        <div
                                                            style={{
                                                                height: `${campaignsHeightPercent}%`,
                                                            }}
                                                            className="w-1/2 origin-bottom rounded-t-lg bg-emerald-500/80 shadow-sm transition-all duration-200 group-hover:scale-y-[1.03] group-hover:bg-emerald-500"
                                                        />
                                                    </div>

                                                    {/* Period Label */}
                                                    <span className="mt-2 text-xs font-bold text-muted-foreground transition-colors group-hover:text-foreground">
                                                        {item.period}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Chart Footer insight */}
                            <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-xs text-muted-foreground">
                                <span>
                                    Output Velocity:{' '}
                                    <strong className="text-foreground">
                                        {Math.round(
                                            totalPeriodDesigns /
                                                (activeActivityData.length ||
                                                    1),
                                        )}{' '}
                                        visuals /{' '}
                                        {chartTimeframe === 'monthly'
                                            ? 'month'
                                            : 'day'}
                                    </strong>
                                </span>
                                <Link
                                    href="/generator"
                                    className="font-bold text-primary hover:underline"
                                >
                                    Generate Visual &rarr;
                                </Link>
                            </div>
                        </Card>

                        {/* CHART 2 & 3: Pipeline Distribution & Catalog Readiness */}
                        <div className="space-y-6">
                            {/* Campaign Pipeline Status Breakdown */}
                            <Card className="rounded-3xl border-white/25 bg-card/85 p-5 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-card/85">
                                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                                            <PieChart className="h-4 w-4" />
                                        </div>
                                        <h3 className="text-sm font-bold tracking-tight text-foreground">
                                            Campaign Pipeline
                                        </h3>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className="text-[10px] font-bold"
                                    >
                                        {campaigns.length} Total
                                    </Badge>
                                </div>

                                {/* Multi-segmented Progress Bar */}
                                <div className="mt-4 space-y-3">
                                    <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-muted/60 p-0.5">
                                        <div
                                            style={{
                                                width: `${(statusCounts.active / totalCampaignsTracked) * 100}%`,
                                            }}
                                            className="rounded-full bg-emerald-500 transition-all duration-500"
                                            title={`Active: ${statusCounts.active}`}
                                        />
                                        <div
                                            style={{
                                                width: `${(statusCounts.scheduled / totalCampaignsTracked) * 100}%`,
                                            }}
                                            className="rounded-full bg-blue-500 transition-all duration-500"
                                            title={`Scheduled: ${statusCounts.scheduled}`}
                                        />
                                        <div
                                            style={{
                                                width: `${(statusCounts.draft / totalCampaignsTracked) * 100}%`,
                                            }}
                                            className="rounded-full bg-amber-500 transition-all duration-500"
                                            title={`Draft: ${statusCounts.draft}`}
                                        />
                                        <div
                                            style={{
                                                width: `${(statusCounts.completed / totalCampaignsTracked) * 100}%`,
                                            }}
                                            className="rounded-full bg-purple-500 transition-all duration-500"
                                            title={`Completed: ${statusCounts.completed}`}
                                        />
                                    </div>

                                    {/* Breakdown Legend Grid */}
                                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                                        <Link
                                            href="/campaigns"
                                            className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-2 transition-colors hover:bg-muted/60"
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                                <span className="font-medium text-muted-foreground">
                                                    Active
                                                </span>
                                            </div>
                                            <span className="font-bold text-foreground">
                                                {statusCounts.active}
                                            </span>
                                        </Link>
                                        <Link
                                            href="/campaigns"
                                            className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-2 transition-colors hover:bg-muted/60"
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <span className="h-2 w-2 rounded-full bg-blue-500" />
                                                <span className="font-medium text-muted-foreground">
                                                    Scheduled
                                                </span>
                                            </div>
                                            <span className="font-bold text-foreground">
                                                {statusCounts.scheduled}
                                            </span>
                                        </Link>
                                        <Link
                                            href="/campaigns"
                                            className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-2 transition-colors hover:bg-muted/60"
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <span className="h-2 w-2 rounded-full bg-amber-500" />
                                                <span className="font-medium text-muted-foreground">
                                                    Drafts
                                                </span>
                                            </div>
                                            <span className="font-bold text-foreground">
                                                {statusCounts.draft}
                                            </span>
                                        </Link>
                                        <Link
                                            href="/campaigns"
                                            className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-2 transition-colors hover:bg-muted/60"
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <span className="h-2 w-2 rounded-full bg-purple-500" />
                                                <span className="font-medium text-muted-foreground">
                                                    Completed
                                                </span>
                                            </div>
                                            <span className="font-bold text-foreground">
                                                {statusCounts.completed}
                                            </span>
                                        </Link>
                                    </div>
                                </div>
                            </Card>

                            {/* Catalog Marketing Coverage Gauge */}
                            <Card className="rounded-3xl border-white/25 bg-card/85 p-5 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-card/85">
                                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                                            <Package className="h-4 w-4" />
                                        </div>
                                        <h3 className="text-sm font-bold tracking-tight text-foreground">
                                            Catalog Visual Readiness
                                        </h3>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-500">
                                        {catalogCoverage}% Ready
                                    </span>
                                </div>

                                <div className="mt-3 space-y-2">
                                    <Progress
                                        value={catalogCoverage}
                                        className="h-2 bg-muted/60"
                                    />
                                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                                        {catalogCoverage >= 100
                                            ? 'Great job! All your catalog products have visual marketing creatives.'
                                            : `${totalProducts} products cataloged. Generate AI visuals to boost marketing reach.`}
                                    </p>

                                    <Button
                                        asChild
                                        size="sm"
                                        variant="outline"
                                        className="mt-2 h-8 w-full gap-1.5 rounded-xl text-xs font-bold"
                                    >
                                        <Link href="/generator">
                                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                                            Generate for Products
                                        </Link>
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* =====================================================
                        4. RECENT VISUALS & UPCOMING OPPORTUNITIES PANELS
                    ====================================================== */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* LEFT 2 COLUMNS: RECENT AI DESIGNS GALLERY */}
                        <div className="space-y-4 lg:col-span-2">
                            <div className="flex items-center justify-between">
                                <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-foreground sm:text-lg">
                                    <ImageIcon className="h-4 w-4 text-primary" />
                                    Recent AI Visuals
                                </h2>
                                <Button
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs font-bold text-primary hover:underline"
                                >
                                    <Link href="/designs">
                                        View All ({totalDesigns}) &rarr;
                                    </Link>
                                </Button>
                            </div>

                            {recent_designs.length === 0 ? (
                                <Card className="rounded-3xl border-white/25 bg-card/85 p-8 text-center shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-card/85">
                                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                        <ImageIcon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-sm font-bold text-foreground">
                                        No visual assets generated yet
                                    </h3>
                                    <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                                        Generate stunning studio-grade
                                        promotional posters and social media
                                        creatives in seconds.
                                    </p>
                                    <Button
                                        asChild
                                        size="sm"
                                        className="mt-4 gap-1.5 rounded-xl text-xs font-bold shadow-lg shadow-primary/25"
                                    >
                                        <Link href="/generator">
                                            <Sparkles className="h-3.5 w-3.5" />
                                            Launch AI Studio
                                        </Link>
                                    </Button>
                                </Card>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {recent_designs.map((design: any) => (
                                        <div
                                            key={design.id}
                                            onClick={() => {
                                                setPreviewDesign(design);
                                                setIsZoomed(false);
                                            }}
                                            className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-white/25 bg-card/80 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl dark:border-white/10 dark:bg-card/80"
                                        >
                                            <div className="relative h-44 w-full overflow-hidden bg-muted">
                                                {design.image_url ? (
                                                    <img
                                                        src={design.image_url}
                                                        alt={
                                                            design.product_name ||
                                                            'Design'
                                                        }
                                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                                                        <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                                                    </div>
                                                )}

                                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                                                <div className="absolute top-2.5 right-2.5 opacity-0 transition-opacity group-hover:opacity-100">
                                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white shadow-sm backdrop-blur-md">
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-1 p-3.5">
                                                <p className="truncate text-xs font-bold text-foreground transition-colors group-hover:text-primary">
                                                    {design.product_name ||
                                                        'Marketing Creative'}
                                                </p>
                                                <p className="truncate text-[11px] text-muted-foreground">
                                                    {design.campaign_name ||
                                                        design.event_name ||
                                                        design.created_at}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* RIGHT 1 COLUMN: UPCOMING KEY MARKETING DATES */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-foreground sm:text-lg">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    Upcoming Key Dates
                                </h2>
                                <Button
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs font-bold text-primary hover:underline"
                                >
                                    <Link href="/calendar">
                                        Calendar &rarr;
                                    </Link>
                                </Button>
                            </div>

                            {upcoming_events.length === 0 ? (
                                <Card className="rounded-3xl border-white/25 bg-card/85 p-6 text-center shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-card/85">
                                    <CalendarDays className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                                    <p className="text-xs text-muted-foreground">
                                        No upcoming dates scheduled in next 30
                                        days.
                                    </p>
                                    <Button
                                        asChild
                                        size="sm"
                                        variant="outline"
                                        className="mt-3 rounded-xl text-xs font-bold"
                                    >
                                        <Link href="/calendar">
                                            Browse Events
                                        </Link>
                                    </Button>
                                </Card>
                            ) : (
                                <div className="space-y-3">
                                    {upcoming_events.map((evt: any) => (
                                        <div
                                            key={evt.id}
                                            className="group flex flex-col justify-between gap-2 rounded-2xl border border-white/25 bg-card/80 p-4 shadow-lg backdrop-blur-xl transition-all hover:border-primary/40 hover:shadow-2xl dark:border-white/10 dark:bg-card/80"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="text-xs font-bold text-foreground transition-colors group-hover:text-primary">
                                                        {evt.name}
                                                    </p>
                                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                        {evt.date}
                                                    </p>
                                                </div>

                                                {evt.days && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="border-primary/20 bg-primary/10 text-[10px] font-bold text-primary"
                                                    >
                                                        {evt.days}
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between border-t border-border/40 pt-2 text-[11px]">
                                                <span className="font-medium text-muted-foreground capitalize">
                                                    {evt.category || 'Season'}
                                                </span>
                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 rounded-lg p-1 px-2.5 text-xs font-bold text-primary hover:bg-primary/10"
                                                >
                                                    <Link
                                                        href={`/generator?event_id=${evt.id}`}
                                                    >
                                                        Launch Brief &rarr;
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* =============================================================
                5. FULL-SCREEN IMAGE VIEWER MODAL
            ============================================================= */}
            {previewDesign && (
                <div
                    id="dashboard-modal-container"
                    onScroll={(e) => {
                        const target = e.currentTarget;
                        setIsScrolledToDetails(target.scrollTop > 150);
                    }}
                    className="dark fixed inset-0 z-[150] animate-in overflow-x-hidden overflow-y-auto scroll-smooth bg-black/95 text-white backdrop-blur-2xl duration-200 select-none fade-in"
                >
                    {/* Top Floating Control Bar */}
                    <div className="sticky top-0 z-[160] flex w-full items-center justify-between border-b border-white/10 bg-black/80 px-5 py-3 backdrop-blur-md sm:px-8">
                        <div className="flex items-center gap-3">
                            <h2 className="max-w-[200px] truncate text-sm font-bold text-white sm:max-w-md sm:text-base">
                                {previewDesign.product_name ||
                                    'Marketing Visual'}
                            </h2>
                            {previewDesign.campaign_name && (
                                <Badge
                                    variant="outline"
                                    className="hidden border-white/20 bg-white/5 text-[10px] font-semibold text-white/90 sm:inline-flex"
                                >
                                    {previewDesign.campaign_name}
                                </Badge>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(previewDesign)}
                                className="h-8 gap-1.5 rounded-xl border border-white/10 bg-white/10 text-xs font-semibold text-white hover:bg-white/20"
                            >
                                <Download className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">
                                    Download
                                </span>
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setPreviewDesign(null)}
                                className="h-8 w-8 rounded-full border border-white/10 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Image View Canvas */}
                    <div className="relative flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-4 pt-4 pb-20 sm:px-8 sm:pt-6 sm:pb-24">
                        <div className="relative flex items-center justify-center">
                            <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-black/40 shadow-2xl">
                                <img
                                    src={previewDesign.image_url}
                                    alt={
                                        previewDesign.product_name ||
                                        'Visual Preview'
                                    }
                                    className="max-h-[calc(100vh-12rem)] max-w-[86vw] rounded-xl object-contain"
                                />
                            </div>
                        </div>

                        {/* Prev / Next Nav Buttons */}
                        {hasPrevDesign && (
                            <button
                                type="button"
                                onClick={handlePrevDesign}
                                className="absolute top-1/2 left-4 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/60 text-white shadow-xl backdrop-blur-md transition-all hover:scale-110 hover:bg-black/90 sm:left-8"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                        )}
                        {hasNextDesign && (
                            <button
                                type="button"
                                onClick={handleNextDesign}
                                className="absolute top-1/2 right-4 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/60 text-white shadow-xl backdrop-blur-md transition-all hover:scale-110 hover:bg-black/90 sm:right-8"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* =============================================================
                6. CREATE CAMPAIGN MODAL DIALOG
            ============================================================= */}
            <Dialog
                open={isCreateCampaignOpen}
                onOpenChange={setIsCreateCampaignOpen}
            >
                <DialogContent className="rounded-3xl border-white/25 bg-card/95 p-6 shadow-2xl backdrop-blur-2xl sm:max-w-md dark:border-white/10 dark:bg-card/95">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Megaphone className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold text-foreground">
                                    Create New Campaign
                                </DialogTitle>
                                <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                                    Organize promotional dates, products, and
                                    visual creatives in one pipeline.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form
                        onSubmit={handleCreateCampaign}
                        className="space-y-4 pt-2"
                    >
                        {/* Campaign Name */}
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="campaign-name"
                                className="text-xs font-semibold text-foreground"
                            >
                                Campaign Name{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="campaign-name"
                                value={campaignFormData.name}
                                onChange={(e) =>
                                    setCampaignFormData((prev) => ({
                                        ...prev,
                                        name: e.target.value,
                                    }))
                                }
                                placeholder="e.g., Summer Flash Sale 2026"
                                className={cn(
                                    'h-10 rounded-xl text-xs',
                                    campaignFormErrors.name &&
                                        'border-destructive',
                                )}
                            />
                            {campaignFormErrors.name && (
                                <p className="text-[11px] font-medium text-destructive">
                                    {campaignFormErrors.name}
                                </p>
                            )}
                        </div>

                        {/* Event Selection */}
                        {upcoming_events.length > 0 && (
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="campaign-event"
                                    className="text-xs font-semibold text-foreground"
                                >
                                    Target Retail Event / Holiday{' '}
                                    <span className="font-normal text-muted-foreground">
                                        (Optional)
                                    </span>
                                </Label>
                                <Select
                                    value={campaignFormData.event_id || 'none'}
                                    onValueChange={(val) => {
                                        const eventId =
                                            val === 'none' ? '' : val;
                                        const found = upcoming_events.find(
                                            (e: any) =>
                                                String(e.id) === eventId,
                                        );
                                        setCampaignFormData((prev) => ({
                                            ...prev,
                                            event_id: eventId,
                                            name:
                                                prev.name ||
                                                (found
                                                    ? `${found.name} Campaign`
                                                    : prev.name),
                                        }));
                                    }}
                                >
                                    <SelectTrigger
                                        id="campaign-event"
                                        className="h-10 rounded-xl bg-background/80 text-xs"
                                    >
                                        <SelectValue placeholder="Select an upcoming date..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-white/20 backdrop-blur-xl dark:border-white/10">
                                        <SelectItem
                                            value="none"
                                            className="text-xs"
                                        >
                                            No specific event
                                        </SelectItem>
                                        {upcoming_events.map((evt: any) => (
                                            <SelectItem
                                                key={evt.id}
                                                value={String(evt.id)}
                                                className="text-xs font-medium"
                                            >
                                                {evt.name} (
                                                {evt.date || 'Upcoming'})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="start-date"
                                    className="text-xs font-semibold text-foreground"
                                >
                                    Start Date
                                </Label>
                                <Input
                                    id="start-date"
                                    type="date"
                                    value={campaignFormData.start_date}
                                    onChange={(e) =>
                                        setCampaignFormData((prev) => ({
                                            ...prev,
                                            start_date: e.target.value,
                                        }))
                                    }
                                    className="h-10 rounded-xl text-xs"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="end-date"
                                    className="text-xs font-semibold text-foreground"
                                >
                                    End Date
                                </Label>
                                <Input
                                    id="end-date"
                                    type="date"
                                    value={campaignFormData.end_date}
                                    onChange={(e) =>
                                        setCampaignFormData((prev) => ({
                                            ...prev,
                                            end_date: e.target.value,
                                        }))
                                    }
                                    className="h-10 rounded-xl text-xs"
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-2 pt-3 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateCampaignOpen(false)}
                                disabled={isSubmittingCampaign}
                                className="h-10 rounded-xl text-xs font-semibold"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmittingCampaign}
                                className="h-10 rounded-xl text-xs font-bold shadow-md shadow-primary/20"
                            >
                                {isSubmittingCampaign
                                    ? 'Creating...'
                                    : 'Create Campaign'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
