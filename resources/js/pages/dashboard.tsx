import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowUpRight,
    Calendar,
    CalendarDays,
    ChevronDown,
    Download,
    Eye,
    Heart,
    ImageIcon,
    Layers,
    Package,
    Plus,
    Sparkles,
    Tag,
    TrendingUp,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

export default function Dashboard({
    auth,
    campaigns = [],
    upcoming_events = [],
    recent_designs = [],
    stats = {},
    monthly_activity = [],
    business = {},
}: any) {
    const user = auth?.user;
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    // Full-screen image viewer state for recent designs
    const [previewDesign, setPreviewDesign] = useState<any>(null);
    const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
    const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);

    const totalDesigns = stats.total_designs ?? recent_designs.length ?? 0;
    const activeCampaigns = stats.active_campaigns ?? campaigns.filter((c: any) => c.status === 'active').length ?? 0;
    const totalProducts = stats.total_products ?? 0;
    const upcomingEventsCount = stats.upcoming_events ?? upcoming_events.length ?? 0;

    const summaryMetrics = [
        {
            label: 'AI Visuals Generated',
            value: totalDesigns,
            trend: '+14% output',
            icon: ImageIcon,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
            href: '/designs',
        },
        {
            label: 'Active Campaigns',
            value: activeCampaigns,
            trend: 'Live & Scheduled',
            icon: Layers,
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10',
            href: '/campaigns',
        },
        {
            label: 'Upcoming Key Dates',
            value: upcomingEventsCount,
            trend: 'Next 30 Days',
            icon: CalendarDays,
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10',
            href: '/calendar',
        },
        {
            label: 'Catalog Products',
            value: totalProducts,
            trend: 'Marketing Ready',
            icon: Package,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
            href: '/products',
        },
    ];

    // Chart calculations
    const chartData = monthly_activity.length > 0
        ? monthly_activity
        : [
            { month: 'Mar', designs: 4, campaigns: 1 },
            { month: 'Apr', designs: 8, campaigns: 2 },
            { month: 'May', designs: 14, campaigns: 3 },
            { month: 'Jun', designs: 19, campaigns: 4 },
            { month: 'Jul', designs: 26, campaigns: 5 },
            { month: 'Aug', designs: totalDesigns || 12, campaigns: activeCampaigns || 2 },
        ];

    const maxChartValue = Math.max(...chartData.map((d: any) => Math.max(d.designs, d.campaigns, 5))) + 2;

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
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && previewDesign) {
                setPreviewDesign(null);
                setIsDetailsExpanded(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [previewDesign]);

    return (
        <>
            <Head title="Dashboard" />

            <div className="min-h-screen bg-background text-foreground pb-20">
                <div className="space-y-6 p-4 md:p-6 lg:p-8">

                    {/* =====================================================
                        WELCOME & QUICK ACTION HERO
                    ====================================================== */}

                    <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 md:p-8 shadow-sm">
                        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-1.5">
                                <div className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    {business?.name || 'AI Marketing Studio'}
                                </div>

                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                                    {greeting}, {user?.name?.split(' ')[0] || 'Marketer'}!
                                </h1>

                                <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                                    Here is your campaign pulse and automated marketing pipeline for today.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                                <Button asChild variant="outline" className="rounded-xl shadow-none gap-1.5 text-xs font-semibold h-10 px-4">
                                    <Link href="/campaigns/create">
                                        <Plus className="h-4 w-4" />
                                        New Campaign
                                    </Link>
                                </Button>

                                <Button asChild className="rounded-xl gap-2 shadow-sm text-xs font-semibold h-10 px-4">
                                    <Link href="/generator">
                                        <Sparkles className="h-4 w-4" />
                                        Generate AI Design
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </section>

                    {/* =====================================================
                        4 KEY METRIC CARDS
                    ====================================================== */}

                    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {summaryMetrics.map((metric) => {
                            const IconComponent = metric.icon;

                            return (
                                <Link
                                    key={metric.label}
                                    href={metric.href}
                                    className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md cursor-pointer block"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-muted-foreground">
                                            {metric.label}
                                        </span>
                                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${metric.bgColor} ${metric.color}`}>
                                            <IconComponent className="h-4 w-4" />
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-baseline gap-2">
                                        <span className="text-3xl font-bold tracking-tight text-foreground">
                                            {metric.value}
                                        </span>
                                    </div>

                                    <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
                                        <span>{metric.trend}</span>
                                        <span className="font-semibold text-primary group-hover:underline transition-colors">
                                            View Details
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </section>

                    {/* =====================================================
                        MARKETING ACTIVITY & GENERATION PERFORMANCE CHART
                    ====================================================== */}

                    <Card className="rounded-2xl border-border bg-card shadow-sm p-6">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
                            <div>
                                <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    Creative Output & Campaign Activity
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Monthly volume of AI designs generated vs marketing campaigns launched.
                                </p>
                            </div>

                            <div className="flex items-center gap-4 text-xs font-medium">
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                                    <span className="text-muted-foreground">AI Designs</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                    <span className="text-muted-foreground">Campaigns</span>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Bar/Trend Chart Canvas */}
                        <div className="pt-6">
                            <div className="grid grid-cols-6 gap-2 sm:gap-6 h-48 items-end px-2">
                                {chartData.map((item: any, idx: number) => {
                                    const designsHeightPercent = Math.max(12, Math.round((item.designs / maxChartValue) * 100));
                                    const campaignsHeightPercent = Math.max(8, Math.round((item.campaigns / maxChartValue) * 100));
                                    const isHovered = hoveredMonthIndex === idx;

                                    return (
                                        <div
                                            key={item.month}
                                            className="group flex flex-col items-center h-full justify-end relative cursor-pointer"
                                            onMouseEnter={() => setHoveredMonthIndex(idx)}
                                            onMouseLeave={() => setHoveredMonthIndex(null)}
                                        >
                                            {/* Tooltip Hover Bubble */}
                                            {isHovered && (
                                                <div className="absolute -top-12 z-20 rounded-xl border border-border bg-popover px-3 py-1.5 text-[11px] font-semibold text-popover-foreground shadow-xl animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap">
                                                    <span className="text-primary font-bold">{item.designs} designs</span>
                                                    {' • '}
                                                    <span className="text-emerald-500 font-bold">{item.campaigns} campaigns</span>
                                                </div>
                                            )}

                                            {/* Bars Container */}
                                            <div className="flex items-end gap-1.5 w-full max-w-[48px] justify-center h-36">
                                                {/* Designs Bar */}
                                                <div
                                                    style={{ height: `${designsHeightPercent}%` }}
                                                    className="w-1/2 rounded-t-lg bg-primary/80 group-hover:bg-primary transition-all duration-300 shadow-sm"
                                                />
                                                {/* Campaigns Bar */}
                                                <div
                                                    style={{ height: `${campaignsHeightPercent}%` }}
                                                    className="w-1/2 rounded-t-lg bg-emerald-500/80 group-hover:bg-emerald-500 transition-all duration-300 shadow-sm"
                                                />
                                            </div>

                                            {/* Month Label */}
                                            <span className="mt-2 text-xs font-medium text-muted-foreground group-hover:text-foreground group-hover:font-semibold transition-colors">
                                                {item.month}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </Card>

                    {/* =====================================================
                        CORE PANELS: RECENT DESIGNS & UPCOMING DATES
                    ====================================================== */}

                    <div className="grid gap-6 lg:grid-cols-3">

                        {/* LEFT 2 COLUMNS: RECENT AI DESIGNS */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4 text-primary" />
                                    Recent AI Visuals
                                </h2>
                                <Button asChild variant="ghost" size="sm" className="text-xs text-primary font-semibold hover:underline">
                                    <Link href="/designs">
                                        View Library ({totalDesigns})
                                    </Link>
                                </Button>
                            </div>

                            {recent_designs.length === 0 ? (
                                <Card className="rounded-2xl border-border bg-card p-10 text-center shadow-sm">
                                    <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground/40" />
                                    <h3 className="mt-2 text-sm font-semibold">No visuals generated yet</h3>
                                    <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
                                        Generate your first social media post or product ad creative in seconds.
                                    </p>
                                    <Button asChild size="sm" className="mt-4 gap-1.5 shadow-sm text-xs">
                                        <Link href="/generator">
                                            <Sparkles className="h-3.5 w-3.5" />
                                            Generate First Design
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
                                                setIsDetailsExpanded(false);
                                            }}
                                            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md cursor-pointer"
                                        >
                                            <div className="relative h-40 w-full overflow-hidden bg-muted">
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

                                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                                            </div>

                                            <div className="p-3.5 space-y-1">
                                                <p className="truncate text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                                                    {design.product_name || 'Marketing Visual'}
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

                        {/* RIGHT 1 COLUMN: UPCOMING MARKETING OPPORTUNITIES */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    Key Retail Dates
                                </h2>
                                <Button asChild variant="ghost" size="sm" className="text-xs text-primary font-semibold hover:underline">
                                    <Link href="/calendar">
                                        View Calendar
                                    </Link>
                                </Button>
                            </div>

                            {upcoming_events.length === 0 ? (
                                <Card className="rounded-2xl border-border bg-card p-6 text-center shadow-sm">
                                    <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground/40" />
                                    <p className="mt-2 text-xs text-muted-foreground">No upcoming dates scheduled in next 30 days.</p>
                                </Card>
                            ) : (
                                <div className="space-y-3">
                                    {upcoming_events.map((evt: any) => (
                                        <div
                                            key={evt.id}
                                            className="group flex flex-col justify-between gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-primary/40 hover:shadow-md transition-all"
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
                                                    <Badge variant="secondary" className="text-[10px] font-semibold">
                                                        {evt.days}
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
                                                <span className="capitalize text-muted-foreground">
                                                    {evt.category || 'Season'}
                                                </span>
                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs font-semibold text-primary hover:bg-primary/10 p-1 px-2.5"
                                                >
                                                    <Link href={`/generator?event_id=${evt.id}`}>
                                                        Launch Brief
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
                FULL-SCREEN IMAGE VIEWER FOR RECENT DESIGNS
            ============================================================= */}

            {previewDesign && (
                <div
                    className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/95 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-hidden"
                    onClick={() => {
                        setPreviewDesign(null);
                        setIsDetailsExpanded(false);
                    }}
                >
                    {/* Top Floating Control Bar */}
                    <div
                        className="relative z-50 flex w-full items-center justify-between bg-gradient-to-b from-black/90 via-black/50 to-transparent px-5 py-4 sm:px-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3">
                            <h2 className="max-w-[240px] sm:max-w-md truncate text-sm sm:text-base font-semibold text-white">
                                {previewDesign.product_name || 'Marketing Visual'}
                            </h2>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleDownload(previewDesign)}
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md"
                                title="Download"
                            >
                                <Download className="h-4 w-4" />
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setPreviewDesign(null);
                                    setIsDetailsExpanded(false);
                                }}
                                className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 hover:bg-white/30 text-white transition-all backdrop-blur-md"
                                title="Close (Esc)"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Main Full View Image Canvas */}
                    <div
                        className="relative flex h-full w-full flex-1 items-center justify-center p-4 sm:p-8 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {previewDesign.image_url ? (
                            <img
                                src={previewDesign.image_url}
                                alt={previewDesign.product_name || 'Design'}
                                className={`max-h-[82vh] max-w-[92vw] object-contain drop-shadow-2xl transition-all duration-300 ${isDetailsExpanded ? 'scale-90 -translate-y-8' : 'scale-100'
                                    }`}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-white/50">
                                <ImageIcon className="h-16 w-16" />
                                <p className="mt-2 text-sm">No visual available</p>
                            </div>
                        )}
                    </div>

                    {/* Bottom Fade-out Section with Toggle & Expandable Details */}
                    <div
                        className="relative z-50 flex w-full flex-col items-center justify-end bg-gradient-to-t from-black/95 via-black/75 to-transparent pt-12 pb-5 px-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                            className="group flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-5 py-2 text-xs font-medium text-white/90 backdrop-blur-xl shadow-2xl transition-all hover:bg-black/80 hover:border-white/40 hover:text-white active:scale-95"
                            aria-expanded={isDetailsExpanded}
                        >
                            <span>
                                {isDetailsExpanded
                                    ? 'Hide details'
                                    : 'View description & actions'}
                            </span>
                            <ChevronDown
                                className={`h-4 w-4 transition-transform duration-300 ${isDetailsExpanded
                                        ? 'rotate-180 text-primary'
                                        : 'text-white/70 animate-bounce'
                                    }`}
                            />
                        </button>

                        {/* Slide-up Details Panel */}
                        {isDetailsExpanded && (
                            <div className="mt-4 w-full max-w-xl max-h-[36vh] overflow-y-auto space-y-4 rounded-2xl border border-white/15 bg-black/80 p-5 backdrop-blur-2xl shadow-2xl text-white animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div>
                                    <h3 className="text-sm font-bold text-white">
                                        {previewDesign.product_name || 'AI Visual Creative'}
                                    </h3>
                                    <p className="mt-1 text-xs text-white/70">
                                        {previewDesign.campaign_name ? `Campaign: ${previewDesign.campaign_name}` : 'Marketing Workspace Creative'}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-white/10">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            router.visit(
                                                `/generator?product_name=${encodeURIComponent(
                                                    previewDesign.product_name || '',
                                                )}`,
                                            );
                                        }}
                                        className="gap-1.5 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 shadow-none"
                                    >
                                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                                        Edit in AI Studio
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDownload(previewDesign)}
                                        className="gap-1.5 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 shadow-none"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        Download Visual
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}