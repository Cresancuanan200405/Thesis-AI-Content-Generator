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
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
import { cn } from '@/lib/utils';
import { downloadVisualAsFormat } from '@/lib/download';

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
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const todayFormatted = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date());

    // Chart Timeframe Toggle: 'monthly' (6 months) vs 'weekly' (7 days)
    const [chartTimeframe, setChartTimeframe] = useState<'monthly' | 'weekly'>('monthly');
    const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

    // Full-screen image viewer state for recent designs
    const [previewDesign, setPreviewDesign] = useState<any>(null);
    const [isZoomed, setIsZoomed] = useState(false);
    const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
    const [isScrolledToDetails, setIsScrolledToDetails] = useState(false);

    // Create Campaign Modal State
    const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
    const [isSubmittingCampaign, setIsSubmittingCampaign] = useState(false);
    const [campaignFormErrors, setCampaignFormErrors] = useState<Record<string, string>>({});
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
    const catalogCoverage = stats?.catalog_coverage ?? (totalProducts > 0 ? Math.min(100, Math.round((totalDesigns / totalProducts) * 100)) : 0);

    // Active Activity Data source
    const activeActivityData = useMemo(() => {
        const source = chartTimeframe === 'monthly' ? monthly_activity : weekly_activity;
        if (source && source.length > 0) return source;

        // Fallback demo data if empty
        if (chartTimeframe === 'monthly') {
            return [
                { period: 'Mar', designs: 4, campaigns: 1 },
                { period: 'Apr', designs: 8, campaigns: 2 },
                { period: 'May', designs: 14, campaigns: 3 },
                { period: 'Jun', designs: 19, campaigns: 4 },
                { period: 'Jul', designs: 26, campaigns: 5 },
                { period: 'Aug', designs: totalDesigns || 12, campaigns: activeCampaigns || 2 },
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
    }, [chartTimeframe, monthly_activity, weekly_activity, totalDesigns, activeCampaigns]);

    const maxChartValue = useMemo(() => {
        return Math.max(...activeActivityData.map((d) => Math.max(d.designs, d.campaigns, 4))) + 2;
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
        active: campaign_status_breakdown.active ?? campaigns.filter((c) => c.status === 'active').length,
        scheduled: campaign_status_breakdown.scheduled ?? campaigns.filter((c) => c.status === 'scheduled').length,
        draft: campaign_status_breakdown.draft ?? campaigns.filter((c) => c.status === 'draft').length,
        completed: campaign_status_breakdown.completed ?? campaigns.filter((c) => c.status === 'completed').length,
    };
    const totalCampaignsTracked = Object.values(statusCounts).reduce((a, b) => a + b, 0) || 1;

    // Image Modal Nav
    const currentPreviewIndex = previewDesign
        ? recent_designs.findIndex((d: any) => d.id === previewDesign.id)
        : -1;
    const hasPrevDesign = currentPreviewIndex > 0;
    const hasNextDesign =
        currentPreviewIndex !== -1 && currentPreviewIndex < recent_designs.length - 1;

    const handlePrevDesign = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (hasPrevDesign) {
            setPreviewDesign(recent_designs[currentPreviewIndex - 1]);
            setIsZoomed(false);
            setIsScrolledToDetails(false);
        }
    };

    const handleNextDesign = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
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
            if (!previewDesign) return;
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
    }, [previewDesign, currentPreviewIndex, hasPrevDesign, hasNextDesign, recent_designs]);

    return (
        <>
            <Head title="System Dashboard" />

            <div className="min-h-screen bg-background text-foreground pb-20 selection:bg-primary selection:text-primary-foreground">
                <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">

                    {/* =====================================================
                        1. WELCOME & QUICK ACTION HERO (Glassmorphism Banner)
                    ====================================================== */}
                    <section className="relative overflow-hidden rounded-3xl border border-white/25 dark:border-white/10 bg-card/85 dark:bg-slate-900/80 p-6 md:p-8 backdrop-blur-2xl shadow-xl shadow-black/5 dark:shadow-black/40">
                        {/* Ambient Light Orbs */}
                        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/15 blur-[90px]" />
                        <div className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-blue-500/10 blur-[90px]" />

                        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-xs font-bold text-primary backdrop-blur-sm shadow-2xs">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        {business?.name || 'AI Marketing Studio'}
                                    </div>
                                    <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                                        &bull; {todayFormatted}
                                    </span>
                                </div>

                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                                    {greeting}, {user?.name?.split(' ')[0] || 'Marketer'}!
                                </h1>

                                <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
                                    Your automated marketing pipeline is active. Manage your campaigns, generate AI visuals, and track performance in real-time.
                                </p>
                            </div>

                            {/* Quick Action Shortcuts */}
                            <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
                                <Button asChild variant="outline" className="rounded-xl shadow-sm gap-1.5 text-xs font-semibold h-10 px-3.5 hover:border-primary/40 hover:scale-105 active:scale-95 transition-all">
                                    <Link href="/products/create">
                                        <Package className="h-4 w-4" />
                                        Add Product
                                    </Link>
                                </Button>

                                <Button
                                    type="button"
                                    onClick={() => setIsCreateCampaignOpen(true)}
                                    variant="outline"
                                    className="rounded-xl shadow-sm gap-1.5 text-xs font-semibold h-10 px-3.5 hover:border-primary/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                >
                                    <Plus className="h-4 w-4" />
                                    New Campaign
                                </Button>

                                <Button asChild className="rounded-xl gap-2 shadow-lg shadow-primary/25 text-xs font-bold h-10 px-4 hover:scale-105 active:scale-95 transition-all">
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
                                        'group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/25 dark:border-white/10 bg-card/80 dark:bg-slate-900/75 p-5 shadow-lg backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl cursor-pointer block',
                                        metric.borderColor,
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-muted-foreground">
                                            {metric.label}
                                        </span>
                                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${metric.bgColor} ${metric.color} shadow-xs transition-transform duration-200 group-hover:scale-110`}>
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
                                        <span className="font-bold text-primary group-hover:underline transition-colors flex items-center gap-0.5">
                                            View <ArrowUpRight className="h-3 w-3" />
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
                        <Card className="lg:col-span-2 rounded-3xl border-white/25 dark:border-white/10 bg-card/85 dark:bg-slate-900/80 backdrop-blur-2xl shadow-xl p-6 flex flex-col justify-between">
                            <div>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <BarChart3 className="h-4 w-4" />
                                            </div>
                                            <h2 className="text-base font-bold tracking-tight text-foreground">
                                                Marketing Production & Output
                                            </h2>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Comparison of AI visual assets generated versus marketing campaigns launched.
                                        </p>
                                    </div>

                                    {/* Timeframe Toggle Buttons (Monthly / Weekly) */}
                                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/70 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setChartTimeframe('monthly')}
                                            className={cn(
                                                'px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer',
                                                chartTimeframe === 'monthly'
                                                    ? 'bg-card text-foreground shadow-xs'
                                                    : 'text-muted-foreground hover:text-foreground',
                                            )}
                                        >
                                            Monthly
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setChartTimeframe('weekly')}
                                            className={cn(
                                                'px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer',
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
                                            <span className="font-semibold text-foreground">AI Visuals</span>
                                            <Badge variant="outline" className="ml-1 text-[10px] font-bold">
                                                {totalPeriodDesigns} total
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="h-3 w-3 rounded-md bg-emerald-500 shadow-xs" />
                                            <span className="font-semibold text-foreground">Campaigns</span>
                                            <Badge variant="outline" className="ml-1 text-[10px] font-bold">
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
                                    <div className="grid grid-cols-6 sm:grid-cols-7 gap-2 sm:gap-4 h-48 items-end px-2 border-b border-border/40">
                                        {activeActivityData.map((item, idx) => {
                                            const designsHeightPercent = Math.max(12, Math.round((item.designs / maxChartValue) * 100));
                                            const campaignsHeightPercent = Math.max(8, Math.round((item.campaigns / maxChartValue) * 100));
                                            const isHovered = hoveredPointIndex === idx;

                                            return (
                                                <div
                                                    key={item.period + idx}
                                                    className="group flex flex-col items-center h-full justify-end relative cursor-pointer"
                                                    onMouseEnter={() => setHoveredPointIndex(idx)}
                                                    onMouseLeave={() => setHoveredPointIndex(null)}
                                                >
                                                    {/* Hover Tooltip Card */}
                                                    {isHovered && (
                                                        <div className="absolute -top-12 z-30 rounded-xl border border-border/80 bg-popover/95 px-3 py-1.5 text-[11px] font-semibold text-popover-foreground shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-primary font-bold">{item.designs} visuals</span>
                                                                <span>&bull;</span>
                                                                <span className="text-emerald-500 font-bold">{item.campaigns} campaigns</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Dual Bars */}
                                                    <div className="flex items-end gap-1.5 w-full max-w-[48px] justify-center h-36">
                                                        {/* Designs Bar */}
                                                        <div
                                                            style={{ height: `${designsHeightPercent}%` }}
                                                            className="w-1/2 rounded-t-lg bg-primary/80 group-hover:bg-primary group-hover:scale-y-[1.03] origin-bottom transition-all duration-200 shadow-sm"
                                                        />
                                                        {/* Campaigns Bar */}
                                                        <div
                                                            style={{ height: `${campaignsHeightPercent}%` }}
                                                            className="w-1/2 rounded-t-lg bg-emerald-500/80 group-hover:bg-emerald-500 group-hover:scale-y-[1.03] origin-bottom transition-all duration-200 shadow-sm"
                                                        />
                                                    </div>

                                                    {/* Period Label */}
                                                    <span className="mt-2 text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                                                        {item.period}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Chart Footer insight */}
                            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/40">
                                <span>Output Velocity: <strong className="text-foreground">{Math.round(totalPeriodDesigns / (activeActivityData.length || 1))} visuals / {chartTimeframe === 'monthly' ? 'month' : 'day'}</strong></span>
                                <Link href="/generator" className="font-bold text-primary hover:underline">
                                    Generate Visual &rarr;
                                </Link>
                            </div>
                        </Card>

                        {/* CHART 2 & 3: Pipeline Distribution & Catalog Readiness */}
                        <div className="space-y-6">
                            
                            {/* Campaign Pipeline Status Breakdown */}
                            <Card className="rounded-3xl border-white/25 dark:border-white/10 bg-card/85 dark:bg-slate-900/80 backdrop-blur-2xl shadow-xl p-5">
                                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                                            <PieChart className="h-4 w-4" />
                                        </div>
                                        <h3 className="text-sm font-bold tracking-tight text-foreground">
                                            Campaign Pipeline
                                        </h3>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] font-bold">
                                        {campaigns.length} Total
                                    </Badge>
                                </div>

                                {/* Multi-segmented Progress Bar */}
                                <div className="mt-4 space-y-3">
                                    <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted/60 p-0.5 gap-0.5">
                                        <div
                                            style={{ width: `${(statusCounts.active / totalCampaignsTracked) * 100}%` }}
                                            className="bg-emerald-500 rounded-full transition-all duration-500"
                                            title={`Active: ${statusCounts.active}`}
                                        />
                                        <div
                                            style={{ width: `${(statusCounts.scheduled / totalCampaignsTracked) * 100}%` }}
                                            className="bg-blue-500 rounded-full transition-all duration-500"
                                            title={`Scheduled: ${statusCounts.scheduled}`}
                                        />
                                        <div
                                            style={{ width: `${(statusCounts.draft / totalCampaignsTracked) * 100}%` }}
                                            className="bg-amber-500 rounded-full transition-all duration-500"
                                            title={`Draft: ${statusCounts.draft}`}
                                        />
                                        <div
                                            style={{ width: `${(statusCounts.completed / totalCampaignsTracked) * 100}%` }}
                                            className="bg-purple-500 rounded-full transition-all duration-500"
                                            title={`Completed: ${statusCounts.completed}`}
                                        />
                                    </div>

                                    {/* Breakdown Legend Grid */}
                                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                                        <Link href="/campaigns" className="flex items-center justify-between p-2 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 transition-colors">
                                            <div className="flex items-center gap-1.5">
                                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                                <span className="text-muted-foreground font-medium">Active</span>
                                            </div>
                                            <span className="font-bold text-foreground">{statusCounts.active}</span>
                                        </Link>
                                        <Link href="/campaigns" className="flex items-center justify-between p-2 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 transition-colors">
                                            <div className="flex items-center gap-1.5">
                                                <span className="h-2 w-2 rounded-full bg-blue-500" />
                                                <span className="text-muted-foreground font-medium">Scheduled</span>
                                            </div>
                                            <span className="font-bold text-foreground">{statusCounts.scheduled}</span>
                                        </Link>
                                        <Link href="/campaigns" className="flex items-center justify-between p-2 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 transition-colors">
                                            <div className="flex items-center gap-1.5">
                                                <span className="h-2 w-2 rounded-full bg-amber-500" />
                                                <span className="text-muted-foreground font-medium">Drafts</span>
                                            </div>
                                            <span className="font-bold text-foreground">{statusCounts.draft}</span>
                                        </Link>
                                        <Link href="/campaigns" className="flex items-center justify-between p-2 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 transition-colors">
                                            <div className="flex items-center gap-1.5">
                                                <span className="h-2 w-2 rounded-full bg-purple-500" />
                                                <span className="text-muted-foreground font-medium">Completed</span>
                                            </div>
                                            <span className="font-bold text-foreground">{statusCounts.completed}</span>
                                        </Link>
                                    </div>
                                </div>
                            </Card>

                            {/* Catalog Marketing Coverage Gauge */}
                            <Card className="rounded-3xl border-white/25 dark:border-white/10 bg-card/85 dark:bg-slate-900/80 backdrop-blur-2xl shadow-xl p-5">
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
                                    <Progress value={catalogCoverage} className="h-2 bg-muted/60" />
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        {catalogCoverage >= 100
                                            ? 'Great job! All your catalog products have visual marketing creatives.'
                                            : `${totalProducts} products cataloged. Generate AI visuals to boost marketing reach.`}
                                    </p>

                                    <Button asChild size="sm" variant="outline" className="w-full mt-2 h-8 text-xs font-bold rounded-xl gap-1.5">
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
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4 text-primary" />
                                    Recent AI Visuals
                                </h2>
                                <Button asChild variant="ghost" size="sm" className="text-xs text-primary font-bold hover:underline">
                                    <Link href="/designs">
                                        View All ({totalDesigns}) &rarr;
                                    </Link>
                                </Button>
                            </div>

                            {recent_designs.length === 0 ? (
                                <Card className="rounded-3xl border-white/25 dark:border-white/10 bg-card/85 dark:bg-slate-900/80 p-8 text-center shadow-xl backdrop-blur-2xl">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
                                        <ImageIcon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-sm font-bold text-foreground">No visual assets generated yet</h3>
                                    <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
                                        Generate stunning studio-grade promotional posters and social media creatives in seconds.
                                    </p>
                                    <Button asChild size="sm" className="mt-4 gap-1.5 shadow-lg shadow-primary/25 text-xs font-bold rounded-xl">
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
                                            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/25 dark:border-white/10 bg-card/80 dark:bg-slate-900/75 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl cursor-pointer"
                                        >
                                            <div className="relative h-44 w-full overflow-hidden bg-muted">
                                                {design.image_url ? (
                                                    <img
                                                        src={design.image_url}
                                                        alt={design.product_name || 'Design'}
                                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                                                        <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                                                    </div>
                                                )}

                                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                                                
                                                <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md shadow-sm">
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="p-3.5 space-y-1">
                                                <p className="truncate text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                                                    {design.product_name || 'Marketing Creative'}
                                                </p>
                                                <p className="truncate text-[11px] text-muted-foreground">
                                                    {design.campaign_name || design.event_name || design.created_at}
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
                                <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    Upcoming Key Dates
                                </h2>
                                <Button asChild variant="ghost" size="sm" className="text-xs text-primary font-bold hover:underline">
                                    <Link href="/calendar">
                                        Calendar &rarr;
                                    </Link>
                                </Button>
                            </div>

                            {upcoming_events.length === 0 ? (
                                <Card className="rounded-3xl border-white/25 dark:border-white/10 bg-card/85 dark:bg-slate-900/80 p-6 text-center shadow-xl backdrop-blur-2xl">
                                    <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                                    <p className="text-xs text-muted-foreground">No upcoming dates scheduled in next 30 days.</p>
                                    <Button asChild size="sm" variant="outline" className="mt-3 text-xs font-bold rounded-xl">
                                        <Link href="/calendar">Browse Events</Link>
                                    </Button>
                                </Card>
                            ) : (
                                <div className="space-y-3">
                                    {upcoming_events.map((evt: any) => (
                                        <div
                                            key={evt.id}
                                            className="group flex flex-col justify-between gap-2 rounded-2xl border border-white/25 dark:border-white/10 bg-card/80 dark:bg-slate-900/75 p-4 shadow-lg backdrop-blur-xl hover:border-primary/40 hover:shadow-2xl transition-all"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                                                        {evt.name}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                                        {evt.date}
                                                    </p>
                                                </div>

                                                {evt.days && (
                                                    <Badge variant="secondary" className="text-[10px] font-bold bg-primary/10 text-primary border-primary/20">
                                                        {evt.days}
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px]">
                                                <span className="capitalize text-muted-foreground font-medium">
                                                    {evt.category || 'Season'}
                                                </span>
                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs font-bold text-primary hover:bg-primary/10 p-1 px-2.5 rounded-lg"
                                                >
                                                    <Link href={`/generator?event_id=${evt.id}`}>
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
                    className="fixed inset-0 z-[150] overflow-y-auto overflow-x-hidden bg-black/95 backdrop-blur-2xl text-white dark select-none scroll-smooth animate-in fade-in duration-200"
                >
                    {/* Top Floating Control Bar */}
                    <div className="sticky top-0 z-[160] flex w-full items-center justify-between bg-black/80 px-5 py-3 sm:px-8 border-b border-white/10 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <h2 className="max-w-[200px] sm:max-w-md truncate text-sm sm:text-base font-bold text-white">
                                {previewDesign.product_name || 'Marketing Visual'}
                            </h2>
                            {previewDesign.campaign_name && (
                                <Badge variant="outline" className="border-white/20 text-white/90 text-[10px] hidden sm:inline-flex bg-white/5 font-semibold">
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
                                <span className="hidden sm:inline">Download</span>
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
                                    alt={previewDesign.product_name || 'Visual Preview'}
                                    className="max-h-[calc(100vh-12rem)] max-w-[86vw] object-contain rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Prev / Next Nav Buttons */}
                        {hasPrevDesign && (
                            <button
                                type="button"
                                onClick={handlePrevDesign}
                                className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 border border-white/20 text-white backdrop-blur-md shadow-xl hover:scale-110 hover:bg-black/90 transition-all cursor-pointer"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                        )}
                        {hasNextDesign && (
                            <button
                                type="button"
                                onClick={handleNextDesign}
                                className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 border border-white/20 text-white backdrop-blur-md shadow-xl hover:scale-110 hover:bg-black/90 transition-all cursor-pointer"
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
            <Dialog open={isCreateCampaignOpen} onOpenChange={setIsCreateCampaignOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl border-white/25 dark:border-white/10 bg-card/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-2xl p-6">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Megaphone className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold text-foreground">
                                    Create New Campaign
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                    Organize promotional dates, products, and visual creatives in one pipeline.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleCreateCampaign} className="space-y-4 pt-2">
                        {/* Campaign Name */}
                        <div className="space-y-1.5">
                            <Label htmlFor="campaign-name" className="text-xs font-semibold text-foreground">
                                Campaign Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="campaign-name"
                                value={campaignFormData.name}
                                onChange={(e) =>
                                    setCampaignFormData((prev) => ({ ...prev, name: e.target.value }))
                                }
                                placeholder="e.g., Summer Flash Sale 2026"
                                className={cn(
                                    'h-10 text-xs rounded-xl',
                                    campaignFormErrors.name && 'border-destructive',
                                )}
                            />
                            {campaignFormErrors.name && (
                                <p className="text-[11px] text-destructive font-medium">
                                    {campaignFormErrors.name}
                                </p>
                            )}
                        </div>

                        {/* Event Selection */}
                        {upcoming_events.length > 0 && (
                            <div className="space-y-1.5">
                                <Label htmlFor="campaign-event" className="text-xs font-semibold text-foreground">
                                    Target Retail Event / Holiday <span className="text-muted-foreground font-normal">(Optional)</span>
                                </Label>
                                <Select
                                    value={campaignFormData.event_id || 'none'}
                                    onValueChange={(val) => {
                                        const eventId = val === 'none' ? '' : val;
                                        const found = upcoming_events.find((e: any) => String(e.id) === eventId);
                                        setCampaignFormData((prev) => ({
                                            ...prev,
                                            event_id: eventId,
                                            name: prev.name || (found ? `${found.name} Campaign` : prev.name),
                                        }));
                                    }}
                                >
                                    <SelectTrigger id="campaign-event" className="h-10 text-xs rounded-xl bg-background/80">
                                        <SelectValue placeholder="Select an upcoming date..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-white/20 dark:border-white/10 backdrop-blur-xl">
                                        <SelectItem value="none" className="text-xs">No specific event</SelectItem>
                                        {upcoming_events.map((evt: any) => (
                                            <SelectItem key={evt.id} value={String(evt.id)} className="text-xs font-medium">
                                                {evt.name} ({evt.date || 'Upcoming'})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="start-date" className="text-xs font-semibold text-foreground">
                                    Start Date
                                </Label>
                                <Input
                                    id="start-date"
                                    type="date"
                                    value={campaignFormData.start_date}
                                    onChange={(e) =>
                                        setCampaignFormData((prev) => ({ ...prev, start_date: e.target.value }))
                                    }
                                    className="h-10 text-xs rounded-xl"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="end-date" className="text-xs font-semibold text-foreground">
                                    End Date
                                </Label>
                                <Input
                                    id="end-date"
                                    type="date"
                                    value={campaignFormData.end_date}
                                    onChange={(e) =>
                                        setCampaignFormData((prev) => ({ ...prev, end_date: e.target.value }))
                                    }
                                    className="h-10 text-xs rounded-xl"
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-3 gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateCampaignOpen(false)}
                                disabled={isSubmittingCampaign}
                                className="rounded-xl h-10 text-xs font-semibold"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmittingCampaign}
                                className="rounded-xl h-10 text-xs font-bold shadow-md shadow-primary/20"
                            >
                                {isSubmittingCampaign ? 'Creating...' : 'Create Campaign'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}