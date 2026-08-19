import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowUpRight,
    CalendarClock,
    Check,
    Compass,
    Moon,
    PlayCircle,
    Radar,
    Sun,
    Menu,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { dashboard, home, login, register } from '@/routes';

const navItems = [
    { label: 'Product', href: '#product' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
];

const logos = ['Northstar', 'Luma', 'Arc Labs', 'Signal', 'Motive'];

const bentoItems = [
    {
        size: 'lg' as const,
        icon: Compass,
        title: 'Flight plan generator',
        description:
            'Turn a rough campaign idea into a launch-ready brief, content angles, and creative direction in minutes — not a meeting.',
    },
    {
        size: 'sm' as const,
        icon: Radar,
        title: 'Brand radar',
        description:
            'Every asset gets checked against your voice and visual identity before it ships.',
    },
    {
        size: 'sm' as const,
        icon: CalendarClock,
        title: 'Mission calendar',
        description:
            'Launches and drafts live on one shared calendar your whole team flies by.',
    },
];

const steps = [
    {
        title: "Log your brand's heading",
        description:
            'Set goals, audience, and voice once — it steers every brief after.',
    },
    {
        title: 'Generate the brief',
        description:
            'Get campaign concepts, angles, and creative direction, ready to review.',
    },
    {
        title: 'Review, schedule, publish',
        description:
            'Approve what works, adjust what doesn’t, and stay on course.',
    },
];

const pricingIncludes = [
    'Unlimited campaign briefs',
    'Full brand radar checks',
    'Shared mission calendar',
    'Priority support',
];

/*
|--------------------------------------------------------------------------
| Theme
|--------------------------------------------------------------------------
*/

type Theme = 'light' | 'dark';

const getInitialTheme = (): Theme => {
    if (typeof window === 'undefined') {
        return 'light';
    }

    const savedTheme = window.localStorage.getItem('theme');

    if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
};

/*
|--------------------------------------------------------------------------
| Shared glass styles
|--------------------------------------------------------------------------
*/

const glass =
    'card-elevated rounded-2xl bg-card/85 backdrop-blur-xl border border-border/80';

const glassHover =
    'transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#3B82F6]/40 hover:shadow-[0_25px_60px_-20px_rgba(59,130,246,0.25)] dark:hover:border-[#60A5FA]/40 dark:hover:shadow-[0_25px_60px_-20px_rgba(96,165,250,0.2)]';

/*
|--------------------------------------------------------------------------
| Welcome Page
|--------------------------------------------------------------------------
*/

export default function Welcome() {
    const { auth } = usePage<{ auth?: { user?: any } }>().props;

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    /*
     * The initial theme is determined before the first render.
     *
     * This avoids:
     *
     * setState synchronously within an effect
     *
     * which was causing the React warning/error in the previous version.
     */
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    /*
     * Synchronize the selected theme with:
     *
     * 1. <html class="dark">
     * 2. localStorage
     */
    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');

        window.localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((currentTheme) =>
            currentTheme === 'dark' ? 'light' : 'dark',
        );
    };

    return (
        <>
            <Head title="MarketPilot — Marketing Automation">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Manrope:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap"
                    rel="stylesheet"
                />

                <style>{`
                    html {
                        scroll-behavior: smooth;
                    }
                `}</style>
            </Head>

            <div
                className="
                    min-h-screen
                    bg-background
                    font-[Manrope,sans-serif]
                    text-foreground
                    antialiased
                    transition-colors
                    duration-300
                "
            >
                {/* Ambient background glow */}
                <div
                    aria-hidden
                    className="
                        pointer-events-none
                        fixed
                        inset-x-0
                        top-0
                        -z-10
                        h-[640px]
                        bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_60%)]
                        dark:bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.20),transparent_60%)]
                    "
                />

                {/* ==========================================================
                    NAVIGATION
                =========================================================== */}

                <header className="sticky top-0 z-50 mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
                    <nav
                        className={`
                            rounded-2xl
                            ${glass}
                            px-4
                            py-3
                            shadow-[0_20px_60px_-25px_rgba(15,23,42,0.35)]
                            transition-shadow
                            duration-300
                            sm:px-6
                        `}
                    >
                        <div className="flex items-center justify-between gap-4">
                            {/* Logo */}
                            <Link
                                href={home()}
                                className="group flex items-center gap-3"
                            >
                                <div
                                    className="
                                        flex
                                        h-9
                                        w-9
                                        items-center
                                        justify-center
                                        rounded-full
                                        border
                                        border-[#3B82F6]/40
                                        bg-[#3B82F6]/10
                                        text-[#2563EB]
                                        shadow-[0_0_0_1px_rgba(59,130,246,0.08)]
                                        transition-transform
                                        duration-300
                                        group-hover:scale-105
                                        group-hover:rotate-3
                                        dark:bg-[#0F223D]
                                        dark:text-[#60A5FA]
                                    "
                                >
                                    <AppLogoIcon className="h-5 w-5 fill-current" />
                                </div>

                                <div>
                                    <p
                                        className="
                                            font-['Space_Grotesk',sans-serif]
                                            text-sm
                                            font-semibold
                                            tracking-[0.14em]
                                            uppercase
                                        "
                                    >
                                        MarketPilot
                                    </p>

                                    <p
                                        className="
                                            font-['IBM_Plex_Mono',monospace]
                                            text-[10px]
                                            tracking-[0.2em]
                                            text-[#2563EB]
                                            uppercase
                                            dark:text-[#60A5FA]
                                        "
                                    >
                                        Campaign Ops
                                    </p>
                                </div>
                            </Link>

                            {/* Desktop Navigation */}
                            <div className="hidden items-center gap-8 md:flex">
                                {navItems.map((item) => (
                                    <a
                                        key={item.label}
                                        href={item.href}
                                        className="
                                            group
                                            relative
                                            text-sm
                                            font-medium
                                            text-[#475569]
                                            transition-colors
                                            hover:text-[#0F172A]
                                            focus-visible:outline-none
                                            dark:text-slate-300
                                            dark:hover:text-white
                                        "
                                    >
                                        {item.label}

                                        <span
                                            className="
                                                absolute
                                                -bottom-1
                                                left-0
                                                h-px
                                                w-0
                                                bg-[#3B82F6]
                                                transition-all
                                                duration-300
                                                group-hover:w-full
                                            "
                                        />
                                    </a>
                                ))}
                            </div>

                            {/* Right Side */}
                            <div className="hidden items-center gap-2 md:flex">
                                {/* Theme Toggle */}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleTheme}
                                    aria-label={
                                        theme === 'dark'
                                            ? 'Switch to light mode'
                                            : 'Switch to dark mode'
                                    }
                                    className="
                                        h-9
                                        w-9
                                        rounded-full
                                        text-[#475569]
                                        transition-all
                                        duration-300
                                        hover:bg-[#3B82F6]/10
                                        hover:text-[#2563EB]
                                        dark:text-slate-300
                                        dark:hover:bg-[#60A5FA]/10
                                        dark:hover:text-[#60A5FA]
                                    "
                                >
                                    {theme === 'dark' ? (
                                        <Sun className="h-4 w-4" />
                                    ) : (
                                        <Moon className="h-4 w-4" />
                                    )}
                                </Button>

                                {auth?.user ? (
                                    <Button
                                        asChild
                                        size="sm"
                                        className="
                                            rounded-full
                                            bg-[#2563EB]
                                            text-white
                                            shadow-[0_8px_20px_-8px_rgba(37,99,235,0.6)]
                                            transition-all
                                            duration-300
                                            hover:scale-[1.03]
                                            hover:bg-[#1D4ED8]
                                            hover:shadow-[0_12px_28px_-8px_rgba(37,99,235,0.7)]
                                        "
                                    >
                                        <Link href={dashboard()}>
                                            Open dashboard
                                        </Link>
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            asChild
                                            variant="ghost"
                                            size="sm"
                                            className="
                                                text-[#0F172A]
                                                hover:bg-[#2563EB]/5
                                                hover:text-[#1D4ED8]
                                                dark:text-slate-200
                                                dark:hover:bg-white/5
                                                dark:hover:text-[#60A5FA]
                                            "
                                        >
                                            <Link href={login()}>Log in</Link>
                                        </Button>

                                        <Button
                                            asChild
                                            size="sm"
                                            className="
                                                rounded-full
                                                bg-[#2563EB]
                                                text-white
                                                shadow-[0_8px_20px_-8px_rgba(37,99,235,0.6)]
                                                transition-all
                                                duration-300
                                                hover:scale-[1.03]
                                                hover:bg-[#1D4ED8]
                                                hover:shadow-[0_12px_28px_-8px_rgba(37,99,235,0.7)]
                                            "
                                        >
                                            <Link href={register()}>
                                                Start free
                                            </Link>
                                        </Button>
                                    </>
                                )}
                            </div>

                            {/* Mobile Controls */}
                            <div className="flex items-center gap-2 md:hidden">
                                {/* Mobile Theme Toggle */}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleTheme}
                                    aria-label={
                                        theme === 'dark'
                                            ? 'Switch to light mode'
                                            : 'Switch to dark mode'
                                    }
                                    className="
                                        h-10
                                        w-10
                                        rounded-full
                                        text-[#475569]
                                        hover:bg-[#3B82F6]/10
                                        hover:text-[#2563EB]
                                        dark:text-slate-300
                                        dark:hover:bg-[#60A5FA]/10
                                        dark:hover:text-[#60A5FA]
                                    "
                                >
                                    {theme === 'dark' ? (
                                        <Sun className="h-4 w-4" />
                                    ) : (
                                        <Moon className="h-4 w-4" />
                                    )}
                                </Button>

                                {/* Mobile Menu */}
                                <button
                                    type="button"
                                    className={`
                                        inline-flex
                                        h-10
                                        w-10
                                        items-center
                                        justify-center
                                        rounded-full
                                        ${glass}
                                    `}
                                    onClick={() =>
                                        setMobileMenuOpen((value) => !value)
                                    }
                                    aria-label="Toggle navigation"
                                >
                                    {mobileMenuOpen ? (
                                        <X className="h-4 w-4" />
                                    ) : (
                                        <Menu className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Mobile Menu */}
                        {mobileMenuOpen && (
                            <div
                                className="
                                    mt-4
                                    space-y-3
                                    border-t
                                    border-black/5
                                    pt-4
                                    dark:border-white/10
                                    md:hidden
                                "
                            >
                                {navItems.map((item) => (
                                    <a
                                        key={item.label}
                                        href={item.href}
                                        className="
                                            block
                                            text-sm
                                            font-medium
                                            text-[#475569]
                                            dark:text-slate-300
                                        "
                                        onClick={() =>
                                            setMobileMenuOpen(false)
                                        }
                                    >
                                        {item.label}
                                    </a>
                                ))}

                                <div className="flex gap-3 pt-2">
                                    {auth?.user ? (
                                        <Button
                                            asChild
                                            className="
                                                w-full
                                                rounded-full
                                                bg-[#2563EB]
                                                text-white
                                                hover:bg-[#1D4ED8]
                                            "
                                        >
                                            <Link href={dashboard()}>
                                                Open dashboard
                                            </Link>
                                        </Button>
                                    ) : (
                                        <>
                                            <Button
                                                asChild
                                                variant="outline"
                                                className="
                                                    flex-1
                                                    border-black/10
                                                    dark:border-white/15
                                                "
                                            >
                                                <Link href={login()}>
                                                    Log in
                                                </Link>
                                            </Button>

                                            <Button
                                                asChild
                                                className="
                                                    flex-1
                                                    rounded-full
                                                    bg-[#2563EB]
                                                    text-white
                                                    hover:bg-[#1D4ED8]
                                                "
                                            >
                                                <Link href={register()}>
                                                    Start free
                                                </Link>
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </nav>
                </header>

                {/* ==========================================================
                    MAIN
                =========================================================== */}

                <main className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
                    {/* ======================================================
                        HERO
                    ======================================================= */}

                    <section className="grid items-center gap-10 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pt-24">
                        <div className="max-w-xl">
                            <div
                                className="
                                    mb-6
                                    inline-flex
                                    items-center
                                    gap-2
                                    rounded-full
                                    border
                                    border-[#3B82F6]/30
                                    bg-[#3B82F6]/10
                                    px-3
                                    py-1
                                    font-['IBM_Plex_Mono',monospace]
                                    text-xs
                                    tracking-[0.12em]
                                    text-[#2563EB]
                                    uppercase
                                    dark:text-[#60A5FA]
                                "
                            >
                                <Compass className="h-3.5 w-3.5" />
                                Campaign Operations
                            </div>

                            <h1
                                className="
                                    font-['Space_Grotesk',sans-serif]
                                    text-4xl
                                    leading-[1.05]
                                    font-semibold
                                    tracking-tight
                                    sm:text-5xl
                                    lg:text-6xl
                                "
                            >
                                Chart the campaign.
                                <span className="block text-[#2563EB] dark:text-[#60A5FA]">
                                    Hold the course.
                                </span>
                            </h1>

                            <p
                                className="
                                    mt-6
                                    max-w-lg
                                    text-lg
                                    leading-8
                                    text-[#475569]
                                    dark:text-slate-300
                                "
                            >
                                MarketPilot turns a rough idea into a
                                launch-ready brief, keeps every asset
                                on-brand, and lays the week out on one
                                calendar your team actually flies by.
                            </p>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <Button
                                    asChild
                                    size="lg"
                                    className="
                                        group
                                        rounded-full
                                        bg-[#2563EB]
                                        px-6
                                        text-white
                                        shadow-[0_15px_35px_-10px_rgba(37,99,235,0.55)]
                                        transition-all
                                        duration-300
                                        hover:scale-[1.02]
                                        hover:bg-[#1D4ED8]
                                        hover:shadow-[0_20px_45px_-10px_rgba(37,99,235,0.65)]
                                    "
                                >
                                    <Link href={register()}>
                                        Start your flight plan
                                        <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                    </Link>
                                </Button>

                                <Button
                                    asChild
                                    variant="outline"
                                    size="lg"
                                    className={`
                                        rounded-full
                                        px-6
                                        ${glass}
                                        transition-all
                                        duration-300
                                        hover:-translate-y-0.5
                                        hover:border-[#3B82F6]/40
                                    `}
                                >
                                    <Link href={login()}>
                                        <PlayCircle className="mr-2 h-4 w-4" />
                                        View dashboard
                                    </Link>
                                </Button>
                            </div>

                            <div
                                className="
                                    mt-8
                                    flex
                                    flex-wrap
                                    items-center
                                    gap-6
                                    text-sm
                                    text-[#475569]
                                    dark:text-slate-300
                                "
                            >
                                <div className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-[#0EA5E9]" />
                                    No credit card required
                                </div>

                                <div className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-[#0EA5E9]" />
                                    Set up in under 10 minutes
                                </div>
                            </div>
                        </div>

                        {/* Product Preview */}
                        <div className="group relative">
                            <div
                                className="
                                    absolute
                                    -inset-6
                                    rounded-[2rem]
                                    bg-gradient-to-br
                                    from-[#3B82F6]/25
                                    via-[#06B6D4]/10
                                    to-transparent
                                    opacity-70
                                    blur-3xl
                                    transition-opacity
                                    duration-500
                                    group-hover:opacity-100
                                "
                            />

                            <div
                                className="
                                    card-elevated
                                    relative
                                    overflow-hidden
                                    rounded-3xl
                                    bg-card
                                    p-6
                                    shadow-2xl
                                    backdrop-blur-xl
                                    transition-shadow
                                    duration-500
                                    sm:p-8
                                "
                            >
                                <div className="mb-6 flex items-center justify-between">
                                    <div>
                                        <p
                                            className="
                                                font-['IBM_Plex_Mono',monospace]
                                                text-[10px]
                                                tracking-[0.2em]
                                                text-muted-foreground
                                                uppercase
                                            "
                                        >
                                            Campaign heading
                                        </p>

                                        <h2
                                            className="
                                                mt-1
                                                font-['Space_Grotesk',sans-serif]
                                                text-lg
                                                font-semibold
                                                text-foreground
                                            "
                                        >
                                            Q3 launch sprint
                                        </h2>
                                    </div>

                                    <div
                                        className="
                                            rounded-full
                                            border
                                            border-[#06B6D4]/30
                                            bg-[#06B6D4]/15
                                            px-2.5
                                            py-1
                                            font-['IBM_Plex_Mono',monospace]
                                            text-[10px]
                                            tracking-[0.08em]
                                            text-[#06B6D4]
                                            uppercase
                                            dark:text-[#22D3EE]
                                        "
                                    >
                                        On course
                                    </div>
                                </div>

                                <div className="flex items-center justify-center py-4">
                                    <div
                                        className="
                                            relative
                                            flex
                                            h-48
                                            w-48
                                            items-center
                                            justify-center
                                            rounded-full
                                            transition-transform
                                            duration-500
                                            group-hover:scale-105
                                        "
                                        style={{
                                            background:
                                                'repeating-conic-gradient(from 0deg, rgba(59,130,246,0.55) 0deg 1deg, transparent 1deg 9deg)',
                                        }}
                                    >
                                        <div
                                            className="
                                                card-elevated
                                                flex
                                                h-36
                                                w-36
                                                flex-col
                                                items-center
                                                justify-center
                                                rounded-full
                                                bg-card
                                            "
                                            style={{
                                                boxShadow:
                                                    '0 0 0 1px rgba(59,130,246,0.12), 0 0 40px -6px rgba(59,130,246,0.5), inset 0 2px 10px rgba(0,0,0,0.6)',
                                            }}
                                        >
                                            <span
                                                className="
                                                    font-['Space_Grotesk',sans-serif]
                                                    text-3xl
                                                    font-semibold
                                                    text-[#2563EB]
                                                    dark:text-[#60A5FA]
                                                "
                                            >
                                                247°
                                            </span>

                                            <span
                                                className="
                                                    mt-1
                                                    font-['IBM_Plex_Mono',monospace]
                                                    text-[9px]
                                                    tracking-[0.16em]
                                                    text-muted-foreground
                                                    uppercase
                                                "
                                            >
                                                Reach trending up
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div
                                        className="
                                            card-elevated
                                            rounded-2xl
                                            bg-card/80
                                            p-4
                                            transition-colors
                                            duration-300
                                        "
                                    >
                                        <div
                                            className="
                                                flex
                                                items-center
                                                justify-between
                                                font-['IBM_Plex_Mono',monospace]
                                                text-[10px]
                                                tracking-[0.1em]
                                                text-muted-foreground
                                                uppercase
                                            "
                                        >
                                            <span>Brand alignment</span>
                                            <span className="font-semibold text-[#06B6D4] dark:text-[#22D3EE]">
                                                92%
                                            </span>
                                        </div>

                                        <div className="mt-3 h-1.5 rounded-full bg-muted">
                                            <div
                                                className="
                                                    h-1.5
                                                    w-[92%]
                                                    rounded-full
                                                    bg-[#06B6D4]
                                                    shadow-[0_0_10px_rgba(6,182,212,0.7)]
                                                "
                                            />
                                        </div>
                                    </div>

                                    <div
                                        className="
                                            card-elevated
                                            rounded-2xl
                                            bg-card/80
                                            p-4
                                            transition-colors
                                            duration-300
                                        "
                                    >
                                        <div
                                            className="
                                                flex
                                                items-center
                                                justify-between
                                                font-['IBM_Plex_Mono',monospace]
                                                text-[10px]
                                                tracking-[0.1em]
                                                text-muted-foreground
                                                uppercase
                                            "
                                        >
                                            <span>Assets ready</span>
                                            <span className="font-semibold text-[#2563EB] dark:text-[#60A5FA]">
                                                12
                                            </span>
                                        </div>

                                        <div className="mt-3 flex gap-1.5">
                                            {[40, 60, 85, 100].map((height) => (
                                                <div
                                                    key={height}
                                                    className="
                                                        flex-1
                                                        rounded-t-md
                                                        bg-gradient-to-t
                                                        from-[#2563EB]/40
                                                        to-[#2563EB]
                                                        dark:to-[#60A5FA]
                                                    "
                                                    style={{
                                                        height: `${height / 3.2}px`,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className="
                                        card-elevated
                                        mt-3
                                        flex
                                        items-center
                                        justify-between
                                        rounded-2xl
                                        bg-card/80
                                        px-4
                                        py-3
                                        font-['IBM_Plex_Mono',monospace]
                                        text-[11px]
                                        tracking-[0.08em]
                                        text-muted-foreground
                                        uppercase
                                    "
                                >
                                    <span>Next launch</span>

                                    <span className="font-medium text-foreground">
                                        Jun 18 · Paid social + email
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ======================================================
                        TRUST STRIP
                    ======================================================= */}

                    <section className="mt-20">
                        <p
                            className="
                                text-center
                                font-['IBM_Plex_Mono',monospace]
                                text-xs
                                tracking-[0.2em]
                                text-[#64748B]
                                uppercase
                                dark:text-[#7C8CA6]
                            "
                        >
                            Piloted by teams shipping fast
                        </p>

                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                            {logos.map((name) => (
                                <div
                                    key={name}
                                    className={`
                                        rounded-full
                                        ${glass}
                                        px-4
                                        py-3
                                        text-center
                                        font-['Space_Grotesk',sans-serif]
                                        text-base
                                        font-medium
                                        text-[#475569]
                                        transition-all
                                        duration-300
                                        hover:-translate-y-0.5
                                        hover:text-[#0F172A]
                                        hover:shadow-[0_15px_35px_-20px_rgba(37,99,235,0.3)]
                                        dark:text-slate-300
                                        dark:hover:text-white
                                    `}
                                >
                                    {name}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ======================================================
                        PRODUCT
                    ======================================================= */}

                    <section id="product" className="mt-24">
                        <div className="mx-auto max-w-2xl text-center">
                            <p
                                className="
                                    font-['IBM_Plex_Mono',monospace]
                                    text-xs
                                    font-semibold
                                    tracking-[0.2em]
                                    text-[#2563EB]
                                    uppercase
                                    dark:text-[#60A5FA]
                                "
                            >
                                Product overview
                            </p>

                            <h2
                                className="
                                    mt-4
                                    font-['Space_Grotesk',sans-serif]
                                    text-3xl
                                    font-semibold
                                    tracking-tight
                                    sm:text-4xl
                                "
                            >
                                Keep every campaign aligned with your brand.
                            </h2>
                        </div>

                        <div className="mt-12 grid gap-4 md:grid-cols-3 md:grid-rows-2">
                            <div
                                className={`
                                    group
                                    rounded-[1.75rem]
                                    ${glass}
                                    ${glassHover}
                                    p-8
                                    md:col-span-2
                                    md:row-span-2
                                `}
                            >
                                <div
                                    className="
                                        flex
                                        h-12
                                        w-12
                                        items-center
                                        justify-center
                                        rounded-2xl
                                        bg-[#0F172A]
                                        text-[#60A5FA]
                                        shadow-[0_10px_25px_-8px_rgba(15,23,42,0.5)]
                                        transition-transform
                                        duration-300
                                        group-hover:scale-110
                                        group-hover:rotate-6
                                        dark:bg-[#10213A]
                                    "
                                >
                                    <Compass className="h-6 w-6" />
                                </div>

                                <h3
                                    className="
                                        mt-5
                                        font-['Space_Grotesk',sans-serif]
                                        text-2xl
                                        font-semibold
                                    "
                                >
                                    {bentoItems[0].title}
                                </h3>

                                <p className="mt-3 max-w-md text-[#475569] dark:text-slate-300">
                                    {bentoItems[0].description}
                                </p>

                                <span
                                    className="
                                        mt-6
                                        inline-flex
                                        items-center
                                        gap-1
                                        font-['IBM_Plex_Mono',monospace]
                                        text-xs
                                        tracking-[0.1em]
                                        text-[#2563EB]
                                        uppercase
                                        transition-transform
                                        duration-300
                                        group-hover:translate-x-1
                                        dark:text-[#60A5FA]
                                    "
                                >
                                    See a sample brief
                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                </span>
                            </div>

                            {bentoItems.slice(1).map(
                                ({ icon: Icon, title, description }) => (
                                    <div
                                        key={title}
                                        className={`
                                            group
                                            rounded-[1.75rem]
                                            ${glass}
                                            ${glassHover}
                                            p-6
                                        `}
                                    >
                                        <div
                                            className="
                                                flex
                                                h-10
                                                w-10
                                                items-center
                                                justify-center
                                                rounded-xl
                                                bg-[#0F172A]
                                                text-[#60A5FA]
                                                shadow-[0_8px_18px_-6px_rgba(15,23,42,0.5)]
                                                transition-transform
                                                duration-300
                                                group-hover:scale-110
                                                group-hover:rotate-6
                                                dark:bg-[#10213A]
                                            "
                                        >
                                            <Icon className="h-5 w-5" />
                                        </div>

                                        <h3
                                            className="
                                                mt-4
                                                font-['Space_Grotesk',sans-serif]
                                                text-lg
                                                font-semibold
                                            "
                                        >
                                            {title}
                                        </h3>

                                        <p className="mt-2 text-sm leading-6 text-[#475569] dark:text-slate-300">
                                            {description}
                                        </p>
                                    </div>
                                ),
                            )}

                            <div
                                className={`
                                    group
                                    flex
                                    flex-col
                                    justify-center
                                    rounded-[1.75rem]
                                    ${glass}
                                    ${glassHover}
                                    p-6
                                `}
                            >
                                <span
                                    className="
                                        font-['Space_Grotesk',sans-serif]
                                        text-4xl
                                        font-semibold
                                        text-[#2563EB]
                                        dark:text-[#60A5FA]
                                    "
                                >
                                    40%
                                </span>

                                <p className="mt-2 text-sm leading-6 text-[#475569] dark:text-slate-300">
                                    Faster campaign launches, on average, once
                                    the brief and calendar are shared.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* ======================================================
                        HOW IT WORKS
                    ======================================================= */}

                    <section id="how-it-works" className="mt-24">
                        <div className="mx-auto max-w-2xl text-center">
                            <p
                                className="
                                    font-['IBM_Plex_Mono',monospace]
                                    text-xs
                                    font-semibold
                                    tracking-[0.2em]
                                    text-[#2563EB]
                                    uppercase
                                    dark:text-[#60A5FA]
                                "
                            >
                                How it works
                            </p>

                            <h2
                                className="
                                    mt-4
                                    font-['Space_Grotesk',sans-serif]
                                    text-3xl
                                    font-semibold
                                    tracking-tight
                                    sm:text-4xl
                                "
                            >
                                One system for strategy, content, and
                                execution.
                            </h2>
                        </div>

                        <div className="relative mt-14">
                            <div
                                className="
                                    absolute
                                    top-0
                                    bottom-0
                                    left-6
                                    w-px
                                    bg-gradient-to-b
                                    from-[#3B82F6]/60
                                    via-black/10
                                    to-transparent
                                    dark:via-white/10
                                    lg:left-1/2
                                    lg:-translate-x-1/2
                                "
                            />

                            <div className="space-y-6 lg:space-y-10">
                                {steps.map((step, index) => (
                                    <div
                                        key={step.title}
                                        className={`
                                            relative
                                            flex
                                            items-start
                                            gap-6
                                            lg:w-1/2
                                            ${
                                                index % 2 === 1
                                                    ? 'lg:ml-auto lg:flex-row-reverse lg:text-right'
                                                    : ''
                                            }
                                        `}
                                    >
                                        <div
                                            className="
                                                relative
                                                z-10
                                                flex
                                                h-12
                                                w-12
                                                shrink-0
                                                items-center
                                                justify-center
                                                rounded-full
                                                border
                                                border-[#3B82F6]/40
                                                bg-[#3B82F6]/10
                                                font-['IBM_Plex_Mono',monospace]
                                                text-sm
                                                font-semibold
                                                text-[#2563EB]
                                                shadow-[0_0_0_6px_#F5F9FF]
                                                dark:text-[#60A5FA]
                                                dark:shadow-[0_0_0_6px_#07111F]
                                            "
                                        >
                                            0{index + 1}
                                        </div>

                                        <div
                                            className={`
                                                group
                                                flex-1
                                                rounded-2xl
                                                ${glass}
                                                ${glassHover}
                                                p-5
                                            `}
                                        >
                                            <p
                                                className="
                                                    font-['Space_Grotesk',sans-serif]
                                                    text-lg
                                                    font-semibold
                                                "
                                            >
                                                {step.title}
                                            </p>

                                            <p className="mt-2 text-sm leading-6 text-[#475569] dark:text-slate-300">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ======================================================
                        PRICING
                    ======================================================= */}

                    <section id="pricing" className="mt-24">
                        <div className="mx-auto max-w-md">
                            <div
                                className={`
                                    group
                                    relative
                                    overflow-hidden
                                    rounded-[2rem]
                                    ${glass}
                                    p-8
                                    shadow-[0_30px_80px_-30px_rgba(15,23,42,0.25)]
                                    transition-all
                                    duration-300
                                    hover:shadow-[0_40px_100px_-30px_rgba(37,99,235,0.3)]
                                    dark:shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]
                                `}
                            >
                                <div
                                    className="
                                        absolute
                                        -top-16
                                        -right-16
                                        h-40
                                        w-40
                                        rounded-full
                                        bg-[#3B82F6]/15
                                        blur-3xl
                                        transition-opacity
                                        duration-500
                                        group-hover:opacity-80
                                    "
                                />

                                <p
                                    className="
                                        font-['IBM_Plex_Mono',monospace]
                                        text-xs
                                        font-semibold
                                        tracking-[0.2em]
                                        text-[#2563EB]
                                        uppercase
                                        dark:text-[#60A5FA]
                                    "
                                >
                                    Built to grow with you
                                </p>

                                <div className="mt-4 flex items-baseline gap-2">
                                    <span
                                        className="
                                            font-['Space_Grotesk',sans-serif]
                                            text-4xl
                                            font-semibold
                                            text-[#2563EB]
                                            dark:text-[#60A5FA]
                                        "
                                    >
                                        $39
                                    </span>

                                    <span className="text-base text-[#64748B] dark:text-slate-400">
                                        / month
                                    </span>
                                </div>

                                <p className="mt-2 text-sm text-[#64748B] dark:text-slate-400">
                                    From your first campaign to your next
                                    expansion.
                                </p>

                                <ul className="mt-6 space-y-3">
                                    {pricingIncludes.map((item) => (
                                        <li
                                            key={item}
                                            className="flex items-center gap-3 text-sm"
                                        >
                                            <span
                                                className="
                                                    flex
                                                    h-5
                                                    w-5
                                                    shrink-0
                                                    items-center
                                                    justify-center
                                                    rounded-full
                                                    bg-[#06B6D4]/15
                                                    text-[#0891B2]
                                                    dark:text-[#22D3EE]
                                                "
                                            >
                                                <Check className="h-3 w-3" />
                                            </span>

                                            {item}
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-8 flex flex-col gap-3">
                                    <Button
                                        asChild
                                        className="
                                            w-full
                                            rounded-full
                                            bg-[#2563EB]
                                            text-white
                                            shadow-[0_15px_35px_-10px_rgba(37,99,235,0.55)]
                                            transition-all
                                            duration-300
                                            hover:scale-[1.02]
                                            hover:bg-[#1D4ED8]
                                        "
                                    >
                                        <Link href={register()}>
                                            Create account
                                        </Link>
                                    </Button>

                                    <Button
                                        asChild
                                        variant="ghost"
                                        className="
                                            w-full
                                            rounded-full
                                            border
                                            border-black/10
                                            hover:bg-[#3B82F6]/5
                                            dark:border-white/15
                                            dark:hover:bg-white/10
                                        "
                                    >
                                        <Link href={login()}>Log in</Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ======================================================
                        CTA
                    ======================================================= */}

                    <section className="mt-24">
                        <div
                            className={`
                                flex
                                flex-col
                                items-center
                                gap-6
                                rounded-[2rem]
                                ${glass}
                                p-10
                                text-center
                                shadow-[0_30px_80px_-30px_rgba(15,23,42,0.25)]
                                dark:shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]
                                sm:flex-row
                                sm:justify-between
                                sm:text-left
                            `}
                        >
                            <div>
                                <h2
                                    className="
                                        font-['Space_Grotesk',sans-serif]
                                        text-2xl
                                        font-semibold
                                        sm:text-3xl
                                    "
                                >
                                    Ready to fly a smoother season of
                                    campaigns?
                                </h2>

                                <p className="mt-2 text-[#475569] dark:text-slate-300">
                                    Set your heading in under ten minutes.
                                </p>
                            </div>

                            <Button
                                asChild
                                size="lg"
                                className="
                                    group
                                    shrink-0
                                    rounded-full
                                    bg-[#2563EB]
                                    px-6
                                    text-white
                                    shadow-[0_15px_35px_-10px_rgba(37,99,235,0.55)]
                                    transition-all
                                    duration-300
                                    hover:scale-[1.02]
                                    hover:bg-[#1D4ED8]
                                "
                            >
                                <Link href={register()}>
                                    Start free
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                </Link>
                            </Button>
                        </div>
                    </section>
                </main>

                {/* ==========================================================
                    FOOTER
                =========================================================== */}

                <footer className="border-t border-black/5 dark:border-white/10">
                    <div
                        className="
                            mx-auto
                            flex
                            max-w-7xl
                            flex-col
                            gap-4
                            px-4
                            py-8
                            text-sm
                            text-[#64748B]
                            sm:px-6
                            lg:flex-row
                            lg:items-center
                            lg:justify-between
                            lg:px-8
                            dark:text-slate-400
                        "
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="
                                    flex
                                    h-8
                                    w-8
                                    items-center
                                    justify-center
                                    rounded-full
                                    border
                                    border-[#3B82F6]/30
                                    bg-[#3B82F6]/10
                                    text-[#2563EB]
                                    dark:bg-[#10213A]
                                    dark:text-[#60A5FA]
                                "
                            >
                                <AppLogoIcon className="h-4 w-4 fill-current" />
                            </div>

                            MarketPilot
                        </div>

                        <div className="flex flex-wrap gap-5">
                            <a
                                href="#product"
                                className="
                                    transition-colors
                                    hover:text-[#2563EB]
                                    dark:hover:text-[#60A5FA]
                                "
                            >
                                Product
                            </a>

                            <a
                                href="#how-it-works"
                                className="
                                    transition-colors
                                    hover:text-[#2563EB]
                                    dark:hover:text-[#60A5FA]
                                "
                            >
                                How it works
                            </a>

                            <a
                                href="#pricing"
                                className="
                                    transition-colors
                                    hover:text-[#2563EB]
                                    dark:hover:text-[#60A5FA]
                                "
                            >
                                Pricing
                            </a>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}