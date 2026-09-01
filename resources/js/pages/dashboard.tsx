import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    ArrowUpRight,
    BarChart3,
    Briefcase,
    Building2,
    Calendar,
    CalendarDays,
    Car,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Coffee,
    Cpu,
    Download,
    Eye,
    GraduationCap,
    HeartPulse,
    ImageIcon,
    Landmark,
    Megaphone,
    Package,
    PieChart,
    Plane,
    Plus,
    ShieldCheck,
    ShoppingBag,
    ShoppingCart,
    Sparkles,
    Store,
    UtensilsCrossed,
    X,
    Zap,
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
import { cn } from '@/lib/utils';

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

type DashboardDesign = {
    id: number | string;
    image_url?: string;
    product_name?: string;
    campaign_name?: string;
    event_name?: string;
    created_at?: string;
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
    if (!raw) return 'Philippine Holiday';
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

const getIndustryIcon = (industry?: string | null) => {
    switch (industry) {
        case 'Food & Beverage':
            return UtensilsCrossed;
        case 'Retail':
            return ShoppingBag;
        case 'Technology':
            return Cpu;
        case 'Healthcare':
            return HeartPulse;
        case 'Real Estate':
            return Building2;
        case 'Education':
            return GraduationCap;
        case 'Beauty & Wellness':
            return Sparkles;
        case 'Professional Services':
            return Briefcase;
        case 'Travel & Hospitality':
            return Plane;
        case 'Automotive':
            return Car;
        case 'Finance':
            return Landmark;
        case 'E-commerce':
            return ShoppingCart;
        default:
            return Building2;
    }
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
    system_health = {},
    business = {},
}: Props) {
    const user = auth?.user;
    const IndustryIcon = getIndustryIcon(business?.industry);

    /* ----------------------------------------------------------------------
       DATE / GREETING
    ---------------------------------------------------------------------- */

    const now = new Date();
    const hour = now.getHours();

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
    }).format(now);

    /* ----------------------------------------------------------------------
       UI STATE
    ---------------------------------------------------------------------- */

    const [chartTimeframe, setChartTimeframe] = useState<'monthly' | 'weekly'>(
        'monthly',
    );
    const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(
        null,
    );
    const [previewDesign, setPreviewDesign] =
        useState<DashboardDesign | null>(null);
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
       ACTIVITY DATA
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
        if (!hasActivity) return 5;
        const highest = Math.max(
            ...activeActivityData.map((item) =>
                Math.max(item.designs || 0, item.campaigns || 0),
            ),
        );
        return Math.max(highest + 1, 4);
    }, [activeActivityData, hasActivity]);

    const averageOutputText = useMemo(() => {
        if (!hasActivity || activeActivityData.length === 0) {
            return '0 visuals recorded';
        }
        const avg = Math.round(
            totalPeriodDesigns / activeActivityData.length,
        );
        const unit = chartTimeframe === 'monthly' ? 'month' : 'day';
        return `${avg} visual${avg === 1 ? '' : 's'} / ${unit}`;
    }, [hasActivity, totalPeriodDesigns, activeActivityData.length, chartTimeframe]);

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
        totalCampaignsTracked > 0
            ? (count / totalCampaignsTracked) * 100
            : 0;

    /* ----------------------------------------------------------------------
       WORKSPACE PIPELINE STATUS
    ---------------------------------------------------------------------- */

    const systemStatusList = [
        {
            label: 'AI Visual Engine',
            isOperational: system_health?.ai_generation === 'operational',
            status:
                system_health?.ai_generation === 'operational'
                    ? 'Operational'
                    : 'Attention Required',
        },
        {
            label: 'Event Calendar',
            isOperational: system_health?.event_calendar === 'operational',
            status:
                system_health?.event_calendar === 'operational'
                    ? 'Operational'
                    : 'Attention Required',
        },
        {
            label: 'Product Catalog',
            isOperational: system_health?.product_catalog === 'operational',
            status:
                system_health?.product_catalog === 'operational'
                    ? 'Operational'
                    : 'Attention Required',
        },
        {
            label: 'Campaign Engine',
            isOperational: system_health?.campaign_engine === 'operational',
            status:
                system_health?.campaign_engine === 'operational'
                    ? 'Operational'
                    : 'Attention Required',
        },
    ];

    /* ----------------------------------------------------------------------
       MARKETING RECOMMENDATIONS (DETECTION & ACTION-ORIENTED)
    ---------------------------------------------------------------------- */

    const recommendations = useMemo(() => {
        const items: {
            id: string;
            title: string;
            description: string;
            action: string;
            href: string;
            icon: React.ElementType;
            tone: string;
        }[] = [];

        if (system_health?.ai_generation === 'attention_required') {
            items.push({
                id: 'ai-health',
                title: 'Check AI generation setup',
                description:
                    'The AI visual engine needs attention before new creatives can be generated.',
                action: 'Check Generator',
                href: '/generator',
                icon: AlertCircle,
                tone: 'text-amber-500 bg-amber-500/10',
            });
        }

        if (totalProducts === 0) {
            items.push({
                id: 'catalog-empty',
                title: 'Build your product catalog',
                description:
                    'Add products first so the studio can stage marketing creatives around your catalog.',
                action: 'Add First Product',
                href: '/products/create',
                icon: Package,
                tone: 'text-emerald-500 bg-emerald-500/10',
            });
        } else if (productsWithoutVisuals > 0) {
            items.push({
                id: 'missing-visuals',
                title: 'Review catalog visuals',
                description: `${productsWithoutVisuals} ${productsWithoutVisuals === 1 ? 'product does' : 'products do'} not have marketing visuals yet. Review your catalog to decide which products need creatives.`,
                action: 'Review Products',
                href: '/products',
                icon: Package,
                tone: 'text-purple-500 bg-purple-500/10',
            });
        }

        if (upcomingEventsCount > 0 && upcoming_events.length > 0) {
            const firstEvent = upcoming_events[0];
            items.push({
                id: 'upcoming-event',
                title: `Prepare for ${firstEvent.name}`,
                description: `${firstEvent.date || 'Upcoming'} is a marketing opportunity worth planning for.`,
                action: 'Launch Generator',
                href: `/generator?event_id=${firstEvent.id}`,
                icon: CalendarDays,
                tone: 'text-blue-500 bg-blue-500/10',
            });
        }

        if (statusCounts.draft > 0) {
            items.push({
                id: 'draft-campaigns',
                title: 'Review draft campaigns',
                description: `${statusCounts.draft} ${statusCounts.draft === 1 ? 'campaign is' : 'campaigns are'} waiting in draft status.`,
                action: 'Review Campaigns',
                href: '/campaigns',
                icon: Megaphone,
                tone: 'text-amber-500 bg-amber-500/10',
            });
        }

        if (
            totalDesigns === 0 &&
            system_health?.ai_generation !== 'attention_required'
        ) {
            items.push({
                id: 'first-visual',
                title: 'Create an AI visual',
                description:
                    'Start building your marketing creative library by manually generating a visual from your catalog or an event.',
                action: 'Open Generator',
                href: '/generator',
                icon: Sparkles,
                tone: 'text-primary bg-primary/10',
            });
        }

        if (items.length === 0) {
            items.push({
                id: 'healthy-workspace',
                title: 'Your marketing workspace is on track',
                description:
                    'Your catalog, campaigns, visuals, and upcoming opportunities are currently in good shape.',
                action: 'View Campaigns',
                href: '/campaigns',
                icon: CheckCircle2,
                tone: 'text-emerald-500 bg-emerald-500/10',
            });
        }

        return items.slice(0, 3);
    }, [
        system_health,
        totalProducts,
        productsWithoutVisuals,
        upcomingEventsCount,
        upcoming_events,
        statusCounts.draft,
        totalDesigns,
    ]);

    /* ----------------------------------------------------------------------
       SUMMARY METRICS
    ---------------------------------------------------------------------- */

    const summaryMetrics = [
        {
            label: 'AI Visuals Generated',
            value: totalDesigns,
            description:
                totalDesigns === 1
                    ? '1 generated visual'
                    : `${totalDesigns} generated visuals`,
            icon: ImageIcon,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10 dark:bg-purple-500/20',
            borderColor: 'hover:border-purple-500/40',
            href: '/designs',
        },
        {
            label: 'Active Campaigns',
            value: activeCampaigns,
            description: 'Live & scheduled',
            icon: Megaphone,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10 dark:bg-blue-500/20',
            borderColor: 'hover:border-blue-500/40',
            href: '/campaigns',
        },
        {
            label: 'Upcoming Key Dates',
            value: upcomingEventsCount,
            description: 'Next 30 days',
            icon: CalendarDays,
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10 dark:bg-amber-500/20',
            borderColor: 'hover:border-amber-500/40',
            href: '/calendar',
        },
        {
            label: 'Catalog Products',
            value: totalProducts,
            description: `${catalogCoverage}% visual coverage`,
            icon: Package,
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20',
            borderColor: 'hover:border-emerald-500/40',
            href: '/products',
        },
    ];

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

    const handleDownload = (design: DashboardDesign) => {
        if (!design.image_url) {
            toast.info('No image available to download.');
            return;
        }

        const link = document.createElement('a');
        link.href = design.image_url;
        link.download = `${design.product_name || 'marketing-visual'}.png`;
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
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!previewDesign) return;

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
    }, [previewDesign, currentPreviewIndex, hasPrevDesign, hasNextDesign, recent_designs]);

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
                toast.error('Failed to create campaign. Please check the inputs.');
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
            <Head title="Marketing Studio Dashboard" />

            <div className="min-h-screen w-full min-w-0 bg-background pb-24 text-foreground selection:bg-primary selection:text-primary-foreground">
                <div className="w-full min-w-0 space-y-6 sm:space-y-8 p-4 md:p-6 lg:p-8">
                    {/* ======================================================
                        SECTION 1 — HERO & BRAND HIGHLIGHT
                    ====================================================== */}
                    <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/[0.03] p-4 sm:p-6 lg:p-8 shadow-xs w-full min-w-0">
                        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-[90px]" />
                        <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-blue-500/10 blur-[90px]" />

                        <div className="relative z-10 space-y-6 w-full min-w-0">
                            {/* Executive Business Brand Highlight Header */}
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border/70 bg-background/70 p-3.5 sm:p-4 shadow-2xs backdrop-blur-md dark:bg-background/40 w-full min-w-0">
                                <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-3.5 flex-wrap sm:flex-nowrap">
                                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-gradient-to-br from-primary/15 via-primary/10 to-transparent text-primary shadow-xs ring-1 ring-primary/20">
                                        {business?.logo_url ? (
                                            <img
                                                src={business.logo_url}
                                                alt={business.name || 'Brand Logo'}
                                                className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg object-contain"
                                            />
                                        ) : (
                                            <IndustryIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                                            <span className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-foreground break-words">
                                                {business?.name || 'Marketing Studio Workspace'}
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className="border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold text-primary shrink-0"
                                            >
                                                {business?.industry || 'Commercial Profile'}
                                            </Badge>
                                        </div>

                                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground min-w-0">
                                            {business?.category && (
                                                <span className="font-medium text-foreground/80 break-words">
                                                    {business.category}
                                                </span>
                                            )}
                                            {business?.category && business?.tagline && (
                                                <span className="text-border">•</span>
                                            )}
                                            {business?.tagline && (
                                                <span className="italic text-muted-foreground break-words">
                                                    "{business.tagline}"
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-2 text-xs font-medium text-muted-foreground self-start sm:self-auto border-t border-border/40 sm:border-0 pt-2 sm:pt-0 w-full sm:w-auto">
                                    <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                                    <span>{todayFormatted}</span>
                                </div>
                            </div>

                            {/* Hero Greeting & Quick Actions */}
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between w-full min-w-0">
                                <div className="space-y-1.5 sm:space-y-2 min-w-0 flex-1">
                                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground break-words">
                                        {greeting}, {user?.name?.split(' ')[0] || 'Marketer'}!
                                    </h1>

                                    <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
                                        Your AI-driven marketing workspace overview for planning campaigns, generating visuals,
                                        managing catalog readiness, and scheduling opportunities.
                                    </p>
                                </div>

                                <div className="flex shrink-0 flex-wrap gap-2 sm:gap-2.5 w-full lg:w-auto items-center">
                                    <Button
                                        asChild
                                        className="h-10 flex-1 sm:flex-initial min-w-fit gap-2 rounded-xl px-4 text-xs font-bold shadow-xs transition-all hover:scale-[1.02] active:scale-95"
                                    >
                                        <Link href="/generator">
                                            <Sparkles className="h-4 w-4" />
                                            Generate Visual
                                        </Link>
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsCreateCampaignOpen(true)}
                                        className="h-10 flex-1 sm:flex-initial min-w-fit gap-1.5 rounded-xl px-3.5 text-xs font-semibold cursor-pointer"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Create Campaign
                                    </Button>

                                    <Button
                                        asChild
                                        variant="outline"
                                        className="h-10 flex-1 sm:flex-initial min-w-fit gap-1.5 rounded-xl px-3.5 text-xs font-semibold"
                                    >
                                        <Link href="/products/create">
                                            <Package className="h-4 w-4" />
                                            Add Product
                                        </Link>
                                    </Button>

                                    <Button
                                        asChild
                                        variant="outline"
                                        className="h-10 flex-1 sm:flex-initial min-w-fit gap-1.5 rounded-xl px-3.5 text-xs font-semibold"
                                    >
                                        <Link href="/calendar">
                                            <Calendar className="h-4 w-4" />
                                            Calendar
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ======================================================
                        SECTION 2 — KEY MARKETING METRICS (4 CARDS)
                    ====================================================== */}
                    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 w-full min-w-0">
                        {summaryMetrics.map((metric) => {
                            const Icon = metric.icon;

                            return (
                                <Link
                                    key={metric.label}
                                    href={metric.href}
                                    className={cn(
                                        'group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md w-full min-w-0 flex flex-col justify-between',
                                        metric.borderColor,
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-2 min-w-0">
                                        <span className="text-xs font-semibold text-muted-foreground truncate">
                                            {metric.label}
                                        </span>

                                        <div
                                            className={cn(
                                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-xs transition-transform duration-200 group-hover:scale-110',
                                                metric.bgColor,
                                                metric.color,
                                            )}
                                        >
                                            <Icon className="h-4 w-4" />
                                        </div>
                                    </div>

                                    <div className="mt-3 min-w-0">
                                        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                            {metric.value}
                                        </span>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2.5 text-[11px] gap-2 min-w-0">
                                        <span className="text-muted-foreground truncate">
                                            {metric.description}
                                        </span>

                                        <span className="flex items-center gap-0.5 font-bold text-primary shrink-0">
                                            View
                                            <ArrowUpRight className="h-3 w-3" />
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </section>

                    {/* ======================================================
                        SECTION 3 & 4 — ACTIVITY & PIPELINE
                    ====================================================== */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 w-full min-w-0">
                        {/* --------------------------------------------------
                            MARKETING ACTIVITY & OUTPUT
                        -------------------------------------------------- */}
                        <Card className="rounded-3xl border-border/80 bg-card p-4 sm:p-6 shadow-xs lg:col-span-2 w-full min-w-0 overflow-hidden">
                            <div className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between w-full min-w-0">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <BarChart3 className="h-4 w-4" />
                                        </div>

                                        <h2 className="text-base font-bold tracking-tight truncate">
                                            Marketing Activity & Output
                                        </h2>
                                    </div>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Authentic visual generation and campaign
                                        output from your database.
                                    </p>
                                </div>

                                <div className="flex shrink-0 items-center gap-1 rounded-xl border border-border bg-muted/50 p-1 self-start sm:self-auto flex-wrap">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setChartTimeframe('monthly')
                                        }
                                        className={cn(
                                            'rounded-lg px-2.5 sm:px-3 py-1 text-xs font-bold transition-all cursor-pointer',
                                            chartTimeframe === 'monthly'
                                                ? 'bg-card text-foreground shadow-xs'
                                                : 'text-muted-foreground hover:text-foreground',
                                        )}
                                    >
                                        Monthly (6M)
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setChartTimeframe('weekly')
                                        }
                                        className={cn(
                                            'rounded-lg px-2.5 sm:px-3 py-1 text-xs font-bold transition-all cursor-pointer',
                                            chartTimeframe === 'weekly'
                                                ? 'bg-card text-foreground shadow-xs'
                                                : 'text-muted-foreground hover:text-foreground',
                                        )}
                                    >
                                        Weekly (7D)
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs w-full min-w-0">
                                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-3 w-3 shrink-0 rounded-md bg-primary" />
                                        <span className="font-semibold">
                                            AI Visuals
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] font-bold"
                                        >
                                            {totalPeriodDesigns}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <span className="h-3 w-3 shrink-0 rounded-md bg-emerald-500" />
                                        <span className="font-semibold">
                                            Campaigns
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] font-bold"
                                        >
                                            {totalPeriodCampaigns}
                                        </Badge>
                                    </div>
                                </div>

                                {hasActivity && (
                                    <span className="text-[11px] text-muted-foreground">
                                        Hover over bars for exact counts
                                    </span>
                                )}
                            </div>

                            <div className="pt-6 w-full min-w-0 overflow-x-auto">
                                {hasActivity ? (
                                    <div
                                        className="grid h-48 w-full items-end gap-2 border-b border-border/60 px-1 sm:px-2 sm:gap-4 min-w-0"
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
                                                              (designs /
                                                                  maxChartValue) *
                                                                  100,
                                                          ),
                                                      )
                                                    : 4;

                                            const campaignHeight =
                                                campaigns > 0
                                                    ? Math.max(
                                                          8,
                                                          Math.round(
                                                              (campaigns /
                                                                  maxChartValue) *
                                                                  100,
                                                          ),
                                                      )
                                                    : 4;

                                            const hovered =
                                                hoveredPointIndex === index;

                                            return (
                                                <div
                                                    key={`${item.period}-${index}`}
                                                    className="group relative flex h-full cursor-pointer flex-col items-center justify-end min-w-0"
                                                    onMouseEnter={() =>
                                                        setHoveredPointIndex(index)
                                                    }
                                                    onMouseLeave={() =>
                                                        setHoveredPointIndex(null)
                                                    }
                                                >
                                                    {hovered && (
                                                        <div className="absolute -top-12 z-30 rounded-xl border border-border bg-popover px-3 py-1.5 text-[11px] font-semibold text-popover-foreground shadow-lg whitespace-nowrap">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-primary">
                                                                    {designs} visual
                                                                    {designs === 1
                                                                        ? ''
                                                                        : 's'}
                                                                </span>
                                                                <span>•</span>
                                                                <span className="font-bold text-emerald-500">
                                                                    {campaigns}{' '}
                                                                    campaign
                                                                    {campaigns ===
                                                                    1
                                                                        ? ''
                                                                        : 's'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex h-36 w-full max-w-full items-end justify-center gap-1 sm:gap-1.5">
                                                        <div
                                                            style={{
                                                                height: `${designHeight}%`,
                                                            }}
                                                            className={cn(
                                                                'w-1/2 rounded-t-lg transition-all',
                                                                designs > 0
                                                                    ? 'bg-primary/80 group-hover:bg-primary'
                                                                    : 'bg-muted/40',
                                                            )}
                                                        />

                                                        <div
                                                            style={{
                                                                height: `${campaignHeight}%`,
                                                            }}
                                                            className={cn(
                                                                'w-1/2 rounded-t-lg transition-all',
                                                                campaigns > 0
                                                                    ? 'bg-emerald-500/80 group-hover:bg-emerald-500'
                                                                    : 'bg-muted/40',
                                                            )}
                                                        />
                                                    </div>

                                                    <span className="mt-2 text-xs font-bold text-muted-foreground truncate max-w-full text-center">
                                                        {item.period}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 p-6 text-center">
                                        <Activity className="mb-2 h-8 w-8 text-muted-foreground/40" />
                                        <p className="text-sm font-semibold">
                                            No marketing activity recorded for
                                            this period.
                                        </p>
                                        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                                            Generate AI visuals or launch a
                                            promotional campaign to begin
                                            tracking activity.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3 text-xs text-muted-foreground">
                                <span>
                                    Average Output:{' '}
                                    <strong className="text-foreground">
                                        {averageOutputText}
                                    </strong>
                                </span>

                                <Link
                                    href="/generator"
                                    className="font-bold text-primary hover:underline"
                                >
                                    Generate Visual →
                                </Link>
                            </div>
                        </Card>

                        {/* --------------------------------------------------
                            CAMPAIGN PIPELINE
                        -------------------------------------------------- */}
                        <Card className="rounded-3xl border-border/80 bg-card p-4 sm:p-5 shadow-xs min-w-0">
                            <div className="flex items-center justify-between border-b border-border/60 pb-3 gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                                        <PieChart className="h-4 w-4" />
                                    </div>

                                    <h3 className="text-sm font-bold truncate">
                                        Campaign Pipeline
                                    </h3>
                                </div>

                                <Badge
                                    variant="outline"
                                    className="text-[10px] font-bold shrink-0"
                                >
                                    {totalCampaignsTracked} Total
                                </Badge>
                            </div>

                            <div className="mt-4 space-y-3 min-w-0">
                                {/* Pipeline Distribution Bar */}
                                <div className="flex h-3 overflow-hidden rounded-full bg-muted/60 min-w-0">
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

                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    {[
                                        {
                                            label: 'Active',
                                            status: 'active',
                                            color: 'bg-emerald-500',
                                            count: statusCounts.active,
                                        },
                                        {
                                            label: 'Scheduled',
                                            status: 'scheduled',
                                            color: 'bg-blue-500',
                                            count: statusCounts.scheduled,
                                        },
                                        {
                                            label: 'Draft',
                                            status: 'draft',
                                            color: 'bg-amber-500',
                                            count: statusCounts.draft,
                                        },
                                        {
                                            label: 'Completed',
                                            status: 'completed',
                                            color: 'bg-purple-500',
                                            count: statusCounts.completed,
                                        },
                                        {
                                            label: 'Archived',
                                            status: 'archived',
                                            color: 'bg-zinc-500',
                                            count: statusCounts.archived,
                                            fullWidth: true,
                                        },
                                    ].map((item) => (
                                        <Link
                                            key={item.status}
                                            href="/campaigns"
                                            className={cn(
                                                'flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-2.5 transition-colors hover:bg-muted/60 min-w-0',
                                                item.fullWidth && 'sm:col-span-2',
                                            )}
                                        >
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span
                                                    className={cn(
                                                        'h-2 w-2 shrink-0 rounded-full',
                                                        item.color,
                                                    )}
                                                />
                                                <span className="text-xs font-medium text-muted-foreground truncate">
                                                    {item.label}
                                                </span>
                                            </div>

                                            <span className="text-xs font-bold shrink-0 ml-2">
                                                {item.count}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* ======================================================
                        SECTION 5 & 6 — RECENT VISUALS & UPCOMING OPPORTUNITIES
                    ====================================================== */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 w-full min-w-0">
                        {/* --------------------------------------------------
                            RECENT AI VISUALS
                        -------------------------------------------------- */}
                        <div className="space-y-4 lg:col-span-2 w-full min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <h2 className="flex items-center gap-2 text-base font-bold sm:text-lg truncate">
                                    <ImageIcon className="h-4 w-4 text-primary shrink-0" />
                                    <span>Recent AI Visuals</span>
                                </h2>

                                <Button
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs font-bold text-primary shrink-0"
                                >
                                    <Link href="/designs">
                                        View All ({totalDesigns})
                                        <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                                    </Link>
                                </Button>
                            </div>

                            {recent_designs.length === 0 ? (
                                <Card className="rounded-3xl border-border/80 bg-card p-8 text-center shadow-xs w-full min-w-0">
                                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                        <ImageIcon className="h-6 w-6" />
                                    </div>

                                    <h3 className="text-sm font-bold">
                                        No AI visuals generated yet.
                                    </h3>

                                    <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                                        Create commercial posters and social
                                        creatives using your products and
                                        marketing events.
                                    </p>

                                    <Button
                                        asChild
                                        size="sm"
                                        className="mt-4 gap-1.5 rounded-xl text-xs font-bold"
                                    >
                                        <Link href="/generator">
                                            <Sparkles className="h-3.5 w-3.5" />
                                            Open Generator
                                        </Link>
                                    </Button>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 w-full min-w-0">
                                    {recent_designs.map((design) => (
                                        <button
                                            type="button"
                                            key={design.id}
                                            onClick={() =>
                                                setPreviewDesign(design)
                                            }
                                            className="group overflow-hidden rounded-2xl border border-border/80 bg-card text-left shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md w-full min-w-0 flex flex-col cursor-pointer"
                                        >
                                            <div className="relative aspect-4/3 sm:aspect-auto sm:h-44 w-full overflow-hidden bg-muted shrink-0">
                                                {design.image_url ? (
                                                    <img
                                                        src={design.image_url}
                                                        alt={
                                                            design.product_name ||
                                                            'Marketing visual creative'
                                                        }
                                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center text-muted-foreground">
                                                        <ImageIcon className="h-8 w-8 opacity-40" />
                                                    </div>
                                                )}

                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                                                <span className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
                                                    <Eye className="h-3.5 w-3.5" />
                                                </span>
                                            </div>

                                            <div className="space-y-1 p-3 sm:p-3.5 min-w-0 flex-1">
                                                <p className="truncate text-xs font-bold group-hover:text-primary">
                                                    {design.product_name ||
                                                        'Marketing Creative'}
                                                </p>

                                                <p className="truncate text-[11px] text-muted-foreground">
                                                    {design.campaign_name ||
                                                        design.event_name ||
                                                        design.created_at ||
                                                        'Generated visual'}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* --------------------------------------------------
                            UPCOMING MARKETING OPPORTUNITIES
                        -------------------------------------------------- */}
                        <div className="space-y-4 w-full min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <h2 className="flex items-center gap-2 text-base font-bold sm:text-lg truncate">
                                    <Calendar className="h-4 w-4 text-primary shrink-0" />
                                    <span>Upcoming Opportunities</span>
                                </h2>

                                <Button
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs font-bold text-primary shrink-0"
                                >
                                    <Link href="/calendar">
                                        Calendar
                                        <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                                    </Link>
                                </Button>
                            </div>

                            {upcoming_events.length === 0 ? (
                                <Card className="rounded-3xl border-border/80 bg-card p-6 text-center shadow-xs w-full min-w-0">
                                    <CalendarDays className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />

                                    <p className="text-xs text-muted-foreground">
                                        No upcoming marketing opportunities in
                                        the next 30 days.
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
                                <div className="space-y-3 w-full min-w-0">
                                    {upcoming_events.map((event) => (
                                        <div
                                            key={event.id}
                                            className="group rounded-2xl border border-border/80 bg-card p-3.5 sm:p-4 shadow-xs transition-all hover:border-primary/40 hover:shadow-md w-full min-w-0"
                                        >
                                            <div className="flex items-start justify-between gap-3 min-w-0">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-bold group-hover:text-primary truncate">
                                                        {event.name}
                                                    </p>

                                                    <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
                                                        {event.date ||
                                                            'Upcoming'}
                                                    </p>
                                                </div>

                                                {event.days && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="border-primary/20 bg-primary/10 text-[10px] font-bold text-primary shrink-0"
                                                    >
                                                        {event.days}
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 gap-2 min-w-0">
                                                <span className="text-[11px] font-medium text-muted-foreground truncate">
                                                    {formatEventCategory(
                                                        event.category,
                                                        event.type,
                                                    )}
                                                </span>

                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 rounded-lg px-2 text-xs font-bold text-primary shrink-0"
                                                >
                                                    <Link
                                                        href={`/generator?event_id=${event.id}`}
                                                    >
                                                        Launch Generator
                                                        <ArrowUpRight className="ml-1 h-3 w-3" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ======================================================
                        SECTION 7 — CATALOG COVERAGE & RECOMMENDATIONS
                    ====================================================== */}
                    <section className="grid grid-cols-1 gap-6 lg:grid-cols-3 w-full min-w-0">
                        {/* CATALOG READINESS */}
                        <Card className="rounded-3xl border-border/80 bg-card p-4 sm:p-5 shadow-xs lg:col-span-2 w-full min-w-0">
                            <div className="flex items-center justify-between border-b border-border/60 pb-3 gap-2 min-w-0">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                                        <Package className="h-4 w-4" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-sm font-bold truncate">
                                            Catalog Visual Readiness
                                        </h3>

                                        <p className="text-[10px] text-muted-foreground truncate">
                                            Product coverage for AI marketing
                                            creatives
                                        </p>
                                    </div>
                                </div>

                                <span className="text-xs font-bold text-emerald-500 shrink-0">
                                    {catalogCoverage}% Ready
                                </span>
                            </div>

                            <div className="mt-4 space-y-4 w-full min-w-0">
                                <Progress
                                    value={catalogCoverage}
                                    className="h-2"
                                />

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 w-full min-w-0">
                                    <div className="rounded-xl border border-border/60 bg-muted/20 p-3 min-w-0">
                                        <span className="text-[11px] text-muted-foreground truncate block">
                                            With Visuals
                                        </span>

                                        <p className="mt-1 text-xl font-extrabold">
                                            {productsWithVisuals}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-border/60 bg-muted/20 p-3 min-w-0">
                                        <span className="text-[11px] text-muted-foreground truncate block">
                                            Needs Visuals
                                        </span>

                                        <p className="mt-1 text-xl font-extrabold">
                                            {productsWithoutVisuals}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between w-full min-w-0">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold">
                                            {totalProducts === 0
                                                ? 'Your catalog is empty. Add products to organize your marketing assets.'
                                                : catalogCoverage >= 100
                                                  ? 'All catalog products have associated marketing visuals.'
                                                  : `${productsWithoutVisuals} ${productsWithoutVisuals === 1 ? 'product does' : 'products do'} not have marketing visuals yet.`}
                                        </p>

                                        <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                                            {totalProducts === 0
                                                ? 'Add your catalog products to start staging marketing creatives around your catalog.'
                                                : catalogCoverage >= 100
                                                  ? 'Your entire product catalog has visual assets staged in the studio.'
                                                  : 'Review your catalog to decide which products need creatives.'}
                                        </p>
                                    </div>

                                    <Button
                                        asChild
                                        size="sm"
                                        variant="outline"
                                        className="shrink-0 rounded-xl text-xs font-bold self-start sm:self-auto"
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
                                                    <Plus className="mr-1.5 h-3.5 w-3.5 text-primary" />
                                                    Add First Product
                                                </>
                                            ) : productsWithoutVisuals > 0 ? (
                                                <>
                                                    <Package className="mr-1.5 h-3.5 w-3.5 text-primary" />
                                                    Review Products
                                                </>
                                            ) : (
                                                <>
                                                    <Package className="mr-1.5 h-3.5 w-3.5 text-primary" />
                                                    View Products
                                                </>
                                            )}
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        {/* MARKETING RECOMMENDATIONS */}
                        <Card className="rounded-3xl border-border/80 bg-card p-4 sm:p-5 shadow-xs w-full min-w-0">
                            <div className="border-b border-border/60 pb-3 min-w-0">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Zap className="h-4 w-4" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-sm font-bold truncate">
                                            Marketing Recommendations
                                        </h3>

                                        <p className="text-[10px] text-muted-foreground truncate">
                                            Workspace review actions
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 space-y-2.5 w-full min-w-0">
                                {recommendations.map((recommendation) => {
                                    const Icon = recommendation.icon;

                                    return (
                                        <div
                                            key={recommendation.id}
                                            className="rounded-2xl border border-border/60 bg-muted/20 p-3 transition-colors hover:bg-muted/40 w-full min-w-0"
                                        >
                                            <div className="flex gap-3 min-w-0">
                                                <div
                                                    className={cn(
                                                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
                                                        recommendation.tone,
                                                    )}
                                                >
                                                    <Icon className="h-4 w-4" />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-bold truncate">
                                                        {recommendation.title}
                                                    </p>

                                                    <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground line-clamp-2">
                                                        {
                                                            recommendation.description
                                                        }
                                                    </p>

                                                    <Button
                                                        asChild
                                                        variant="link"
                                                        size="sm"
                                                        className="mt-1 h-auto p-0 text-[10px] font-bold text-primary"
                                                    >
                                                        <Link
                                                            href={
                                                                recommendation.href
                                                            }
                                                        >
                                                            {
                                                                recommendation.action
                                                            }
                                                            <ArrowUpRight className="ml-1 h-3 w-3" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    </section>

                    {/* ======================================================
                        SECTION 8 — SYSTEM AUTOMATION & PIPELINE STATUS
                    ====================================================== */}
                    <section className="rounded-3xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs w-full min-w-0">
                        <div className="flex flex-col gap-2 border-b border-border/60 pb-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />

                                <h3 className="text-xs font-bold uppercase tracking-wider truncate">
                                    System Automation & Pipeline Status
                                </h3>
                            </div>

                            <span className="text-[11px] text-muted-foreground">
                                Current workspace pipeline status
                            </span>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 min-w-0">
                            {systemStatusList.map((item) => (
                                <div
                                    key={item.label}
                                    className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/20 p-3 min-w-0"
                                >
                                    <span
                                        className={cn(
                                            'h-2 w-2 shrink-0 rounded-full',
                                            item.isOperational
                                                ? 'bg-emerald-500'
                                                : 'bg-amber-500',
                                        )}
                                    />

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-semibold">
                                            {item.label}
                                        </p>

                                        <p
                                            className={cn(
                                                'truncate text-[10px]',
                                                item.isOperational
                                                    ? 'text-muted-foreground'
                                                    : 'font-medium text-amber-500',
                                            )}
                                        >
                                            {item.status}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
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
                        className="sticky top-0 z-[160] flex items-center justify-between border-b border-white/10 bg-black/80 px-4 py-3 backdrop-blur-md sm:px-8 gap-3"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex min-w-0 items-center gap-3">
                            <h2 className="truncate text-sm font-bold sm:text-base max-w-[180px] sm:max-w-md">
                                {previewDesign.product_name ||
                                    'Marketing Visual'}
                            </h2>

                            {previewDesign.campaign_name && (
                                <Badge
                                    variant="outline"
                                    className="hidden border-white/20 bg-white/5 text-[10px] text-white sm:inline-flex shrink-0"
                                >
                                    {previewDesign.campaign_name}
                                </Badge>
                            )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(previewDesign)}
                                className="h-8 gap-1.5 rounded-xl border border-white/10 bg-white/10 text-xs text-white hover:bg-white/20 hover:text-white cursor-pointer"
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
                                className="h-8 w-8 rounded-full border border-white/10 bg-white/10 text-white hover:bg-white/20 hover:text-white cursor-pointer"
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
                                        className="max-h-[70vh] sm:max-h-[calc(100vh-10rem)] max-w-[90vw] rounded-xl object-contain"
                                    />
                                )}
                            </div>
                        </div>

                        {hasPrevDesign && (
                            <button
                                type="button"
                                aria-label="Previous visual"
                                onClick={handlePrevDesign}
                                className="absolute left-2 sm:left-6 top-1/2 flex h-9 w-9 sm:h-10 sm:w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white shadow-xl backdrop-blur-md transition-all hover:scale-110 hover:bg-black/90 cursor-pointer"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                        )}

                        {hasNextDesign && (
                            <button
                                type="button"
                                aria-label="Next visual"
                                onClick={handleNextDesign}
                                className="absolute right-2 sm:right-6 top-1/2 flex h-9 w-9 sm:h-10 sm:w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white shadow-xl backdrop-blur-md transition-all hover:scale-110 hover:bg-black/90 cursor-pointer"
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
                <DialogContent className="max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)] sm:max-w-md rounded-3xl border-border bg-card p-4 sm:p-6 shadow-2xl">
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