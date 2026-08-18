import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarClock,
    ChevronRight,
    ImageIcon,
    LayoutDashboard,
    Sparkles,
    Target,
    TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

const blueGlow =
    'transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#2563EB]/30 hover:shadow-[0_20px_50px_-20px_rgba(37,99,235,0.25)] dark:hover:border-[#3B82F6]/30 dark:hover:shadow-[0_20px_50px_-20px_rgba(37,99,235,0.22)]';

const softCard =
    'border-border/70 bg-card/80 backdrop-blur-xl';

export default function Dashboard() {
    const {
        auth,
        campaigns = [],
        upcoming_events = [],
        recent_designs = [],
    } = usePage().props as any;

    const hour = new Date().getHours();

    const greeting =
        hour < 12
            ? 'Good morning'
            : hour < 18
              ? 'Good afternoon'
              : 'Good evening';

    const totalCampaigns = campaigns.length ?? 0;

    const activeCampaigns = campaigns.filter(
        (campaign: any) => campaign.status === 'active',
    ).length;

    const upcomingEvents = upcoming_events.length ?? 0;

    const generatedDesigns = campaigns.reduce(
        (total: number, campaign: any) =>
            total + Number(campaign.design_count || 0),
        0,
    );

    const summaryCards = [
        {
            label: 'Total Campaigns',
            value: String(totalCampaigns),
            description: 'Campaigns in your workspace',
            icon: Target,
        },
        {
            label: 'Active Campaigns',
            value: String(activeCampaigns),
            description: 'Currently driving work',
            icon: TrendingUp,
        },
        {
            label: 'Upcoming Events',
            value: String(upcomingEvents),
            description: 'Marketing opportunities',
            icon: CalendarClock,
        },
        {
            label: 'Generated Designs',
            value: String(generatedDesigns),
            description: 'Creative output',
            icon: Sparkles,
        },
    ];

    return (
        <>
            <Head title="Dashboard" />

            <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
                {/* =========================================================
                    AMBIENT BACKGROUND
                ========================================================== */}

                <div
                    aria-hidden
                    className="
                        pointer-events-none
                        absolute
                        inset-x-0
                        top-0
                        -z-10
                        h-[520px]
                        bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.10),transparent_62%)]
                        dark:bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_62%)]
                    "
                />

                <div
                    aria-hidden
                    className="
                        pointer-events-none
                        absolute
                        top-40
                        right-[-160px]
                        -z-10
                        h-[320px]
                        w-[320px]
                        rounded-full
                        bg-[#2563EB]/5
                        blur-3xl
                        dark:bg-[#3B82F6]/5
                    "
                />

                <div className="space-y-8 p-4 md:p-6 lg:p-8">

                    {/* =====================================================
                        HEADER
                    ====================================================== */}

                    <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/75 p-6 shadow-[0_15px_50px_-30px_rgba(0,0,0,0.25)] backdrop-blur-xl md:p-8">

                        {/* Header glow */}

                        <div
                            aria-hidden
                            className="
                                pointer-events-none
                                absolute
                                -right-24
                                -top-24
                                h-56
                                w-56
                                rounded-full
                                bg-[#2563EB]/10
                                blur-3xl
                                dark:bg-[#3B82F6]/10
                            "
                        />

                        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

                            <div className="max-w-2xl">

                                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#2563EB]/20 bg-[#2563EB]/5 px-3 py-1.5 text-xs font-medium text-[#2563EB] dark:border-[#3B82F6]/20 dark:bg-[#3B82F6]/10 dark:text-[#60A5FA]">
                                    <LayoutDashboard className="h-3.5 w-3.5" />
                                    Marketing workspace
                                </div>

                                <p className="text-sm font-medium text-muted-foreground">
                                    {greeting},{' '}
                                    {auth.user?.name || 'there'}
                                </p>

                                <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
                                    Your campaign command center.
                                </h1>

                                <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
                                    Manage campaigns, discover upcoming
                                    opportunities, and keep your creative work
                                    moving from one place.
                                </p>
                            </div>

                            <div className="relative shrink-0">
                                <Button
                                    asChild
                                    size="lg"
                                    className="
                                        group
                                        w-full
                                        rounded-full
                                        bg-[#2563EB]
                                        text-white
                                        shadow-[0_15px_35px_-12px_rgba(37,99,235,0.55)]
                                        transition-all
                                        duration-300
                                        hover:scale-[1.02]
                                        hover:bg-[#3B82F6]
                                        hover:shadow-[0_20px_45px_-12px_rgba(37,99,235,0.65)]
                                        md:w-auto
                                    "
                                >
                                    <Link href="/generator">
                                        Create New Design

                                        <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </section>

                    {/* =====================================================
                        SUMMARY METRICS
                    ====================================================== */}

                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                        {summaryCards.map((card, index) => {
                            const Icon = card.icon;

                            return (
                                <Card
                                    key={card.label}
                                    className={`
                                        group
                                        relative
                                        overflow-hidden
                                        rounded-2xl
                                        ${softCard}
                                        ${blueGlow}
                                        shadow-[0_8px_30px_-20px_rgba(0,0,0,0.35)]
                                    `}
                                >
                                    {/* Blue ambient glow */}

                                    <div
                                        aria-hidden
                                        className="
                                            pointer-events-none
                                            absolute
                                            -right-8
                                            -top-8
                                            h-24
                                            w-24
                                            rounded-full
                                            bg-[#2563EB]/5
                                            blur-2xl
                                            transition-opacity
                                            duration-300
                                            group-hover:opacity-100
                                            dark:bg-[#3B82F6]/8
                                        "
                                    />

                                    <CardHeader className="relative pb-2">

                                        <div className="flex items-center justify-between">

                                            <div className="
                                                flex
                                                h-10
                                                w-10
                                                items-center
                                                justify-center
                                                rounded-xl
                                                border
                                                border-[#2563EB]/15
                                                bg-[#2563EB]/5
                                                text-[#2563EB]
                                                transition-transform
                                                duration-300
                                                group-hover:scale-110
                                                dark:border-[#3B82F6]/20
                                                dark:bg-[#3B82F6]/10
                                                dark:text-[#60A5FA]
                                            ">
                                                <Icon className="h-5 w-5" />
                                            </div>

                                            <span className="text-xs font-medium text-muted-foreground">
                                                0{index + 1}
                                            </span>
                                        </div>

                                        <p className="pt-2 text-sm font-medium text-muted-foreground">
                                            {card.label}
                                        </p>
                                    </CardHeader>

                                    <CardContent className="relative">

                                        <div className="text-3xl font-semibold tracking-tight">
                                            {card.value}
                                        </div>

                                        <p className="mt-2 text-xs text-muted-foreground">
                                            {card.description}
                                        </p>

                                        <div className="mt-4 h-px bg-border/70" />

                                        <div className="mt-3 flex items-center gap-1 text-xs font-medium text-[#2563EB] dark:text-[#60A5FA]">
                                            View activity

                                            <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </section>

                    {/* =====================================================
                        MAIN CONTENT
                    ====================================================== */}

                    <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">

                        {/* =================================================
                            UPCOMING EVENTS
                        ================================================== */}

                        <Card
                            className={`
                                rounded-2xl
                                ${softCard}
                                shadow-[0_8px_30px_-20px_rgba(0,0,0,0.35)]
                            `}
                        >
                            <CardHeader className="border-b border-border/70 pb-5">

                                <div className="flex items-start justify-between gap-4">

                                    <div>

                                        <div className="flex items-center gap-3">

                                            <div className="
                                                flex
                                                h-10
                                                w-10
                                                items-center
                                                justify-center
                                                rounded-xl
                                                border
                                                border-[#2563EB]/15
                                                bg-[#2563EB]/5
                                                text-[#2563EB]
                                                dark:border-[#3B82F6]/20
                                                dark:bg-[#3B82F6]/10
                                                dark:text-[#60A5FA]
                                            ">
                                                <CalendarClock className="h-5 w-5" />
                                            </div>

                                            <div>
                                                <CardTitle className="text-lg">
                                                    Upcoming Opportunities
                                                </CardTitle>

                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    Events you can turn into
                                                    marketing content.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {upcoming_events.length > 0 && (
                                        <Badge
                                            variant="secondary"
                                            className="shrink-0"
                                        >
                                            {upcoming_events.length} upcoming
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="pt-5">

                                {upcoming_events.length === 0 ? (
                                    <div
                                        className="
                                            rounded-2xl
                                            border
                                            border-dashed
                                            border-border
                                            bg-muted/30
                                            px-6
                                            py-12
                                            text-center
                                        "
                                    >
                                        <div className="
                                            mx-auto
                                            flex
                                            h-12
                                            w-12
                                            items-center
                                            justify-center
                                            rounded-full
                                            bg-muted
                                            text-muted-foreground
                                        ">
                                            <CalendarClock className="h-6 w-6" />
                                        </div>

                                        <p className="mt-4 text-sm font-semibold">
                                            No upcoming events
                                        </p>

                                        <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                                            New marketing opportunities will
                                            appear here when they become
                                            available.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">

                                        {upcoming_events.map(
                                            (event: any) => (
                                                <div
                                                    key={event.name}
                                                    className="
                                                        group
                                                        rounded-2xl
                                                        border
                                                        border-border/70
                                                        bg-background/70
                                                        p-4
                                                        transition-all
                                                        duration-300
                                                        hover:-translate-y-0.5
                                                        hover:border-[#2563EB]/25
                                                        hover:bg-muted/30
                                                        hover:shadow-[0_12px_30px_-20px_rgba(37,99,235,0.35)]
                                                    "
                                                >
                                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                                                        <div className="min-w-0">

                                                            <div className="flex items-center gap-2">

                                                                <span className="
                                                                    h-2
                                                                    w-2
                                                                    shrink-0
                                                                    rounded-full
                                                                    bg-[#2563EB]
                                                                    shadow-[0_0_10px_rgba(37,99,235,0.5)]
                                                                    dark:bg-[#3B82F6]
                                                                " />

                                                                <p className="truncate font-medium">
                                                                    {event.name}
                                                                </p>
                                                            </div>

                                                            <p className="mt-1 pl-4 text-sm text-muted-foreground">
                                                                {event.date}
                                                            </p>

                                                            <div className="mt-2 flex flex-wrap items-center gap-2 pl-4 text-xs text-muted-foreground">

                                                                <span>
                                                                    {event.category}
                                                                </span>

                                                                <span>
                                                                    •
                                                                </span>

                                                                <span>
                                                                    {event.days}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            asChild
                                                            className="
                                                                shrink-0
                                                                rounded-full
                                                                border-border
                                                                shadow-none
                                                                transition-all
                                                                duration-300
                                                                hover:border-[#2563EB]/40
                                                                hover:bg-[#2563EB]/5
                                                                hover:text-[#2563EB]
                                                                dark:hover:bg-[#3B82F6]/10
                                                                dark:hover:text-[#60A5FA]
                                                            "
                                                        >
                                                            <Link href="/generator">
                                                                Create Image
                                                                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* =================================================
                            RECENT DESIGNS
                        ================================================== */}

                        <Card
                            className={`
                                rounded-2xl
                                ${softCard}
                                shadow-[0_8px_30px_-20px_rgba(0,0,0,0.35)]
                            `}
                        >
                            <CardHeader className="border-b border-border/70 pb-5">

                                <div className="flex items-start gap-3">

                                    <div className="
                                        flex
                                        h-10
                                        w-10
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-xl
                                        border
                                        border-[#2563EB]/15
                                        bg-[#2563EB]/5
                                        text-[#2563EB]
                                        dark:border-[#3B82F6]/20
                                        dark:bg-[#3B82F6]/10
                                        dark:text-[#60A5FA]
                                    ">
                                        <Sparkles className="h-5 w-5" />
                                    </div>

                                    <div>
                                        <CardTitle className="text-lg">
                                            Recent Designs
                                        </CardTitle>

                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Your latest generated marketing
                                            creatives.
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="pt-5">

                                {recent_designs.length === 0 ? (
                                    <div
                                        className="
                                            rounded-2xl
                                            border
                                            border-dashed
                                            border-border
                                            bg-muted/30
                                            px-6
                                            py-12
                                            text-center
                                        "
                                    >
                                        <div className="
                                            mx-auto
                                            flex
                                            h-12
                                            w-12
                                            items-center
                                            justify-center
                                            rounded-full
                                            bg-muted
                                            text-muted-foreground
                                        ">
                                            <ImageIcon className="h-6 w-6" />
                                        </div>

                                        <p className="mt-4 text-sm font-semibold">
                                            No designs yet
                                        </p>

                                        <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                                            Your generated marketing designs
                                            will appear here.
                                        </p>

                                        <Button
                                            asChild
                                            size="sm"
                                            className="
                                                mt-5
                                                rounded-full
                                                bg-[#2563EB]
                                                text-white
                                                shadow-[0_10px_25px_-10px_rgba(37,99,235,0.55)]
                                                hover:bg-[#3B82F6]
                                            "
                                        >
                                            <Link href="/generator">
                                                Create your first design
                                                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                            </Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">

                                        {recent_designs.map(
                                            (design: any) => (
                                                <Link
                                                    key={design.id}
                                                    href={
                                                        design.url ||
                                                        `/designs/${design.id}`
                                                    }
                                                    className="group block"
                                                >
                                                    <div
                                                        className="
                                                            flex
                                                            items-center
                                                            gap-3
                                                            rounded-2xl
                                                            border
                                                            border-border/70
                                                            bg-background/70
                                                            p-3
                                                            transition-all
                                                            duration-300
                                                            group-hover:-translate-y-0.5
                                                            group-hover:border-[#2563EB]/25
                                                            group-hover:bg-muted/30
                                                            group-hover:shadow-[0_12px_30px_-20px_rgba(37,99,235,0.35)]
                                                        "
                                                    >

                                                        {/* Thumbnail */}

                                                        <div
                                                            className="
                                                                flex
                                                                h-16
                                                                w-16
                                                                shrink-0
                                                                items-center
                                                                justify-center
                                                                overflow-hidden
                                                                rounded-xl
                                                                border
                                                                border-border
                                                                bg-muted
                                                                text-muted-foreground
                                                            "
                                                        >
                                                            {design.image_url ? (
                                                                <img
                                                                    src={
                                                                        design.image_url
                                                                    }
                                                                    alt={
                                                                        design.product_name ||
                                                                        'Design'
                                                                    }
                                                                    className="
                                                                        h-full
                                                                        w-full
                                                                        object-cover
                                                                        transition-transform
                                                                        duration-500
                                                                        group-hover:scale-105
                                                                    "
                                                                />
                                                            ) : (
                                                                <ImageIcon className="h-6 w-6" />
                                                            )}
                                                        </div>

                                                        {/* Design details */}

                                                        <div className="min-w-0 flex-1">

                                                            <div className="flex items-center justify-between gap-2">

                                                                <p className="truncate text-sm font-semibold">
                                                                    {design.product_name ||
                                                                        'Untitled design'}
                                                                </p>

                                                                {design.status && (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="
                                                                            shrink-0
                                                                            rounded-full
                                                                            text-[10px]
                                                                            font-medium
                                                                        "
                                                                    >
                                                                        {
                                                                            design.status
                                                                        }
                                                                    </Badge>
                                                                )}
                                                            </div>

                                                            <p className="mt-1 truncate text-sm text-muted-foreground">
                                                                {design.campaign_name ||
                                                                    design.event_name ||
                                                                    'General creative'}
                                                            </p>

                                                            <p className="mt-1 text-xs text-muted-foreground">
                                                                {design.created_at ||
                                                                    'Recently created'}
                                                            </p>
                                                        </div>

                                                        <div className="
                                                            hidden
                                                            h-8
                                                            w-8
                                                            shrink-0
                                                            items-center
                                                            justify-center
                                                            rounded-full
                                                            bg-muted
                                                            text-muted-foreground
                                                            transition-all
                                                            duration-300
                                                            group-hover:bg-[#2563EB]/10
                                                            group-hover:text-[#2563EB]
                                                            sm:flex
                                                            dark:group-hover:bg-[#3B82F6]/10
                                                            dark:group-hover:text-[#60A5FA]
                                                        ">
                                                            <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                                                        </div>
                                                    </div>
                                                </Link>
                                            ),
                                        )}
                                    </div>
                                )}

                                {recent_designs.length > 0 && (
                                    <div className="mt-5">
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="
                                                w-full
                                                rounded-full
                                                border-border
                                                shadow-none
                                                transition-all
                                                duration-300
                                                hover:border-[#2563EB]/30
                                                hover:bg-[#2563EB]/5
                                                hover:text-[#2563EB]
                                                dark:hover:bg-[#3B82F6]/10
                                                dark:hover:text-[#60A5FA]
                                            "
                                        >
                                            <Link href="/designs">
                                                View All Designs
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </section>

                    {/* =====================================================
                        BOTTOM QUICK ACTION
                    ====================================================== */}

                    <section>
                        <div
                            className="
                                group
                                relative
                                overflow-hidden
                                rounded-3xl
                                border
                                border-[#2563EB]/15
                                bg-[#2563EB]/5
                                p-6
                                transition-all
                                duration-300
                                hover:border-[#2563EB]/25
                                hover:shadow-[0_20px_50px_-25px_rgba(37,99,235,0.35)]
                                dark:border-[#3B82F6]/20
                                dark:bg-[#3B82F6]/5
                            "
                        >
                            <div
                                aria-hidden
                                className="
                                    pointer-events-none
                                    absolute
                                    -right-20
                                    -top-24
                                    h-52
                                    w-52
                                    rounded-full
                                    bg-[#2563EB]/10
                                    blur-3xl
                                    transition-transform
                                    duration-500
                                    group-hover:scale-125
                                    dark:bg-[#3B82F6]/10
                                "
                            />

                            <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                                <div className="flex items-start gap-4">

                                    <div className="
                                        flex
                                        h-11
                                        w-11
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-xl
                                        bg-[#2563EB]
                                        text-white
                                        shadow-[0_10px_25px_-10px_rgba(37,99,235,0.6)]
                                        dark:bg-[#3B82F6]
                                    ">
                                        <Sparkles className="h-5 w-5" />
                                    </div>

                                    <div>
                                        <h2 className="font-semibold tracking-tight">
                                            Ready to create your next campaign?
                                        </h2>

                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Start with a new design and turn
                                            your next marketing opportunity
                                            into content.
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    asChild
                                    className="
                                        group
                                        shrink-0
                                        rounded-full
                                        bg-[#2563EB]
                                        text-white
                                        shadow-[0_12px_30px_-10px_rgba(37,99,235,0.55)]
                                        transition-all
                                        duration-300
                                        hover:scale-[1.02]
                                        hover:bg-[#3B82F6]
                                    "
                                >
                                    <Link href="/generator">
                                        Start Creating

                                        <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
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