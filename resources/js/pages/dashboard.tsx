import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowUpRight,
    Calendar,
    CalendarDays,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
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
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { downloadVisualAsFormat } from '@/lib/download';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
    const [isZoomed, setIsZoomed] = useState(false);
    const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);

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
        }
    };

    const handleNextDesign = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (hasNextDesign) {
            setPreviewDesign(recent_designs[currentPreviewIndex + 1]);
            setIsZoomed(false);
        }
    };

    const closePreview = () => {
        setPreviewDesign(null);
        setIsZoomed(false);
    };

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
            } else if (e.key === 'ArrowLeft') {
                if (hasPrevDesign) {
                    setPreviewDesign(recent_designs[currentPreviewIndex - 1]);
                    setIsZoomed(false);
                }
            } else if (e.key === 'ArrowRight') {
                if (hasNextDesign) {
                    setPreviewDesign(recent_designs[currentPreviewIndex + 1]);
                    setIsZoomed(false);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [previewDesign, currentPreviewIndex, hasPrevDesign, hasNextDesign, recent_designs]);

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
                                                setIsZoomed(false);
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
                    className="fixed inset-0 z-[150] overflow-y-auto overflow-x-hidden bg-black/95 backdrop-blur-2xl text-white dark select-none scroll-smooth animate-in fade-in duration-200"
                >
                    {/* Top Floating Control Bar (Sticky) */}
                    <div
                        className="sticky top-0 z-[160] flex w-full items-center justify-between bg-gradient-to-b from-black/95 via-black/85 to-transparent px-5 py-3.5 sm:px-8 border-b border-white/10 backdrop-blur-md"
                    >
                        <div className="flex items-center gap-3">
                            <h2 className="max-w-[200px] sm:max-w-md truncate text-sm sm:text-base font-semibold text-white">
                                {previewDesign.product_name || 'Marketing Visual'}
                            </h2>
                            {previewDesign.campaign_name && (
                                <Badge variant="outline" className="border-white/20 text-white/90 text-[10px] hidden sm:inline-flex bg-white/5">
                                    {previewDesign.campaign_name}
                                </Badge>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Zoom Toggle */}
                            <button
                                type="button"
                                onClick={() => setIsZoomed(!isZoomed)}
                                className="hidden sm:flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white px-3 py-1.5 text-xs font-medium backdrop-blur-md transition-all cursor-pointer"
                                title="Click image or button to zoom"
                            >
                                {isZoomed ? (
                                    <>
                                        <ZoomOut className="h-3.5 w-3.5 text-primary" />
                                        <span>Zoomed (175%)</span>
                                    </>
                                ) : (
                                    <>
                                        <ZoomIn className="h-3.5 w-3.5" />
                                        <span>Click to Zoom</span>
                                    </>
                                )}
                            </button>

                            {/* Download Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="flex h-9 items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white px-3 text-xs font-semibold transition-all backdrop-blur-md cursor-pointer"
                                        title="Download Visual"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download
                                        <ChevronDown className="h-3 w-3 opacity-70" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 shadow-xl border-white/20 bg-black/90 text-white backdrop-blur-xl z-[180]">
                                    <DropdownMenuItem
                                        onClick={() => downloadVisualAsFormat(previewDesign.image_url, previewDesign.product_name || 'visual', 'png')}
                                        className="gap-2 text-xs font-medium cursor-pointer text-white hover:bg-white/20 focus:bg-white/20 focus:text-white"
                                    >
                                        <Download className="h-3.5 w-3.5 text-primary" />
                                        PNG (High Quality)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => downloadVisualAsFormat(previewDesign.image_url, previewDesign.product_name || 'visual', 'jpeg')}
                                        className="gap-2 text-xs font-medium cursor-pointer text-white hover:bg-white/20 focus:bg-white/20 focus:text-white"
                                    >
                                        <Download className="h-3.5 w-3.5 text-blue-400" />
                                        JPEG (Web-Optimized)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => downloadVisualAsFormat(previewDesign.image_url, previewDesign.product_name || 'visual', 'svg')}
                                        className="gap-2 text-xs font-medium cursor-pointer text-white hover:bg-white/20 focus:bg-white/20 focus:text-white"
                                    >
                                        <Download className="h-3.5 w-3.5 text-emerald-400" />
                                        SVG (Vector Embed)
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <button
                                type="button"
                                onClick={closePreview}
                                className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 hover:bg-white/30 text-white transition-all backdrop-blur-md cursor-pointer"
                                title="Close (Esc)"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Floating Previous Image Button (Left) */}
                    {hasPrevDesign && (
                        <button
                            type="button"
                            onClick={handlePrevDesign}
                            className="fixed left-3 sm:left-6 top-1/2 -translate-y-1/2 z-50 flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-full bg-black/60 text-white/85 backdrop-blur-md border border-white/20 hover:bg-black/90 hover:text-white hover:border-white/40 hover:scale-110 active:scale-95 transition-all duration-200 shadow-2xl cursor-pointer"
                            title="Previous visual (←)"
                            aria-label="Previous image"
                        >
                            <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" />
                        </button>
                    )}

                    {/* Floating Next Image Button (Right) */}
                    {hasNextDesign && (
                        <button
                            type="button"
                            onClick={handleNextDesign}
                            className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-50 flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-full bg-black/60 text-white/85 backdrop-blur-md border border-white/20 hover:bg-black/90 hover:text-white hover:border-white/40 hover:scale-110 active:scale-95 transition-all duration-200 shadow-2xl cursor-pointer"
                            title="Next visual (→)"
                            aria-label="Next image"
                        >
                            <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7" />
                        </button>
                    )}

                    {/* Section 1: Main Full View Image Canvas */}
                    <div
                        className="group/canvas relative flex min-h-[calc(100vh-4.5rem)] w-full flex-col items-center justify-center p-4 sm:p-8"
                    >
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <div className="h-[450px] w-[450px] rounded-full bg-gradient-to-tr from-primary/20 via-blue-500/10 to-transparent blur-3xl opacity-40" />
                        </div>

                        {previewDesign.image_url ? (
                            <img
                                src={previewDesign.image_url}
                                alt={previewDesign.product_name || 'Marketing visual'}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsZoomed(!isZoomed);
                                }}
                                className={`block max-h-[75vh] max-w-[88vw] object-contain rounded-2xl drop-shadow-2xl transition-transform duration-300 ease-out select-none cursor-pointer z-20 ${
                                    isZoomed
                                        ? 'scale-[1.7] cursor-zoom-out'
                                        : 'scale-100 cursor-zoom-in hover:brightness-105'
                                }`}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-white/50 z-20">
                                <ImageIcon className="h-16 w-16" />
                                <p className="mt-2 text-sm">No visual available</p>
                            </div>
                        )}

                        {/* Floating Scroll Down Indicator */}
                        <button
                            type="button"
                            onClick={() => {
                                const el = document.getElementById('dashboard-modal-details');
                                if (el) {
                                    el.scrollIntoView({ behavior: 'smooth' });
                                }
                            }}
                            className="group/scroll absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 backdrop-blur-xl border border-white/20 text-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.6)] transition-all duration-300 hover:scale-115 hover:border-primary/60 hover:text-white hover:bg-black/90 hover:shadow-[0_0_20px_rgba(var(--primary),0.5)] active:scale-95 cursor-pointer animate-bounce"
                            title="Scroll down for details"
                            aria-label="Scroll down for details"
                        >
                            <ChevronDown className="h-5 w-5 transition-transform duration-300 group-hover/scroll:translate-y-0.5 group-hover/scroll:text-primary" />
                        </button>
                    </div>

                    {/* Section 2: Recreated, Classy Details & Functions Section */}
                    <div
                        id="dashboard-modal-details"
                        className="relative z-30 w-full bg-slate-950/98 backdrop-blur-3xl px-4 pb-16 pt-8 sm:px-8 border-t border-white/20"
                    >
                        <div className="mx-auto max-w-3xl space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/15 pb-4">
                                <div>
                                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary text-primary-foreground font-black text-xs shadow-lg shadow-primary/30 tracking-wider uppercase">
                                        <Sparkles className="h-4 w-4" />
                                        Visual Creative Details
                                    </div>
                                    <h3 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
                                        {previewDesign.product_name || 'Marketing Visual'}
                                    </h3>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        asChild
                                        size="sm"
                                        className="h-9 px-4 gap-2 text-xs font-bold shadow-lg shadow-primary/30 hover:scale-105 transition-all bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                                    >
                                        <Link
                                            href={`/generator?product_name=${encodeURIComponent(previewDesign.product_name || '')}&price=${encodeURIComponent(previewDesign.price || '')}&campaign_id=${encodeURIComponent(previewDesign.campaign_id || '')}&event_id=${encodeURIComponent(previewDesign.event_id || '')}&tagline=${encodeURIComponent(previewDesign.tagline || '')}&prompt=${encodeURIComponent(previewDesign.prompt || '')}&aspect_ratio=${encodeURIComponent(previewDesign.aspect_ratio || '1:1')}`}
                                        >
                                            <Sparkles className="h-4 w-4" />
                                            Edit in AI Studio
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            {previewDesign.tagline && (
                                <div className="group relative overflow-hidden rounded-2xl border-2 border-primary/50 bg-gradient-to-r from-primary/30 via-slate-900/95 to-primary/20 p-5 sm:p-6 backdrop-blur-2xl shadow-xl shadow-primary/10 transition-all hover:border-primary">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary text-primary-foreground font-extrabold text-[11px] uppercase tracking-wider shadow-sm">
                                        <Tag className="h-3.5 w-3.5" />
                                        Catchy Tagline & Hook
                                    </div>
                                    <p className="mt-3 text-lg sm:text-xl font-bold italic text-white leading-snug drop-shadow-md">
                                        "{previewDesign.tagline}"
                                    </p>
                                </div>
                            )}

                            <div className="group rounded-2xl border border-white/20 bg-slate-900/90 p-5 backdrop-blur-2xl shadow-lg transition-all duration-300 hover:border-white/30">
                                <div className="inline-block px-2.5 py-0.5 rounded bg-white/15 text-[11px] font-extrabold uppercase tracking-wider text-white">
                                    AI Prompt & Concept
                                </div>
                                <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-white/95 font-medium">
                                    {previewDesign.prompt || 'AI-generated visual creative designed for maximum customer impact.'}
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="group rounded-2xl border border-white/20 bg-slate-900/90 p-4 sm:p-5 backdrop-blur-2xl shadow-md transition-all hover:border-white/30 hover:-translate-y-0.5">
                                    <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-white/70">
                                        <Tag className="h-3.5 w-3.5 text-primary" />
                                        Product
                                    </div>
                                    <p className="mt-2 truncate text-base font-bold text-white">
                                        {previewDesign.product_name || 'Standard Offering'}
                                    </p>
                                    {previewDesign.price && (
                                        <p className="mt-0.5 text-xs font-extrabold text-emerald-400">
                                            ₱{previewDesign.price}
                                        </p>
                                    )}
                                </div>

                                <div className="group rounded-2xl border border-white/20 bg-slate-900/90 p-4 sm:p-5 backdrop-blur-2xl shadow-md transition-all hover:border-white/30 hover:-translate-y-0.5">
                                    <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-white/70">
                                        <Layers className="h-3.5 w-3.5 text-primary" />
                                        Campaign
                                    </div>
                                    <p className="mt-2 truncate text-base font-bold text-white">
                                        {previewDesign.campaign_name || 'Direct Creative'}
                                    </p>
                                </div>

                                <div className="group rounded-2xl border border-white/20 bg-slate-900/90 p-4 sm:p-5 backdrop-blur-2xl shadow-md transition-all hover:border-white/30 hover:-translate-y-0.5">
                                    <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-white/70">
                                        <CalendarDays className="h-3.5 w-3.5 text-primary" />
                                        Created
                                    </div>
                                    <p className="mt-2 truncate text-base font-bold text-white">
                                        {previewDesign.created_at || 'Recent Creative'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/15">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-bold text-white/80 mr-1">Download as:</span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => downloadVisualAsFormat(previewDesign.image_url, previewDesign.product_name || 'visual', 'png')}
                                        className="gap-1.5 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all shadow-none cursor-pointer"
                                    >
                                        <Download className="h-3.5 w-3.5 text-primary" />
                                        PNG
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => downloadVisualAsFormat(previewDesign.image_url, previewDesign.product_name || 'visual', 'jpeg')}
                                        className="gap-1.5 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all shadow-none cursor-pointer"
                                    >
                                        <Download className="h-3.5 w-3.5 text-blue-400" />
                                        JPEG
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => downloadVisualAsFormat(previewDesign.image_url, previewDesign.product_name || 'visual', 'svg')}
                                        className="gap-1.5 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all shadow-none cursor-pointer"
                                    >
                                        <Download className="h-3.5 w-3.5 text-emerald-400" />
                                        SVG
                                    </Button>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setPreviewDesign(null);
                                        setIsZoomed(false);
                                    }}
                                    className="h-8 px-4 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white transition-all cursor-pointer"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}