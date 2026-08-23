import { Head, Link, usePage } from '@inertiajs/react';
import {
    Calendar,
    CalendarDays,
    Check,
    CheckCircle2,
    ChevronDown,
    Clock,
    Layers,
    Megaphone,
    Moon,
    Package,
    Sparkles,
    Sun,
    Menu,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboard, home, login, register } from '@/routes';

/*
|--------------------------------------------------------------------------
| Theme Management
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
| Interactive Hero Demo Data
|--------------------------------------------------------------------------
*/

interface SampleProduct {
    id: string;
    name: string;
    category: string;
    price: string;
    tagline: string;
    tone: string;
    gradient: string;
    bgPattern: string;
}

const sampleProducts: SampleProduct[] = [
    {
        id: 'coffee',
        name: 'Barako Reserve Cold Brew',
        category: 'Beverages & Cafe',
        price: '₱165',
        tagline: 'Bold heritage flavor brewed for 18 hours.',
        tone: 'Artisanal & Energetic',
        gradient: 'from-amber-900 via-amber-800 to-stone-900',
        bgPattern:
            'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-700/30 via-transparent to-transparent',
    },
    {
        id: 'bakery',
        name: 'Ube Halaya Dream Cake',
        category: 'Bakery & Desserts',
        price: '₱480',
        tagline: 'Authentic purple yam sponge with silky velvet cream.',
        tone: 'Indulgent & Celebratory',
        gradient: 'from-purple-950 via-purple-900 to-slate-900',
        bgPattern:
            'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-600/30 via-transparent to-transparent',
    },
    {
        id: 'fashion',
        name: 'Heritage Linen Camp Shirt',
        category: 'Apparel & Fashion',
        price: '₱1,250',
        tagline: 'Breathable tropical weave handcrafted in Laguna.',
        tone: 'Minimalist & Sophisticated',
        gradient: 'from-sky-950 via-slate-900 to-stone-900',
        bgPattern:
            'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-600/25 via-transparent to-transparent',
    },
    {
        id: 'beauty',
        name: 'Kalamansi Glow Botanical Serum',
        category: 'Beauty & Wellness',
        price: '₱690',
        tagline: 'Natural vitamin C antioxidant brightening essence.',
        tone: 'Fresh & Clean Botanical',
        gradient: 'from-emerald-950 via-teal-900 to-slate-900',
        bgPattern:
            'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-600/25 via-transparent to-transparent',
    },
];

interface SampleEvent {
    id: string;
    name: string;
    category: 'regular' | 'special_non_working' | 'islamic' | 'retail_sale';
    badgeLabel: string;
    date: string;
    seasonHook: string;
}

const sampleEvents: SampleEvent[] = [
    {
        id: 'independence',
        name: 'Philippine Independence Day',
        category: 'regular',
        badgeLabel: 'Regular Holiday',
        date: 'June 12',
        seasonHook:
            'Celebrate Pinoy Pride with exclusive commemorative offers and festive visual accents.',
    },
    {
        id: 'pasko',
        name: 'Paskong Pinoy Grand Season',
        category: 'special_non_working',
        badgeLabel: 'Special Non-Working',
        date: 'December 25',
        seasonHook:
            'Warm holiday lanterns, parol illumination, and heartfelt gift-giving visual aesthetics.',
    },
    {
        id: 'payday',
        name: 'Mid-Month 15/30 Payday Sale',
        category: 'retail_sale',
        badgeLabel: 'Commercial Sale',
        date: '15th & 30th Monthly',
        seasonHook:
            'High-urgency promotional badges, bold discount emphasis, and high-conversion layout.',
    },
    {
        id: 'eid',
        name: 'Eid al-Fitr Celebration',
        category: 'islamic',
        badgeLabel: 'Islamic Movable Date',
        date: 'Movable Date (National)',
        seasonHook:
            'Elegant crescent moon motifs, gold filigree accents, and community-centered warmth.',
    },
];

/*
|--------------------------------------------------------------------------
| Welcome Component
|--------------------------------------------------------------------------
*/

export default function Welcome() {
    const { auth } = usePage<{ auth?: { user?: any } }>().props;

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    // Interactive Hero State
    const [selectedProduct, setSelectedProduct] = useState<SampleProduct>(
        sampleProducts[0],
    );
    const [selectedEvent, setSelectedEvent] = useState<SampleEvent>(
        sampleEvents[0],
    );
    const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:5' | '16:9'>(
        '1:1',
    );
    const [includeLogo, setIncludeLogo] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState<'preview' | 'prompt' | 'export'>(
        'preview',
    );

    // Interactive Calendar Showcase State
    const [calendarCategory, setCalendarCategory] = useState<
        'all' | 'regular' | 'special_non_working' | 'islamic'
    >('all');

    // Interactive Pricing Toggle
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(
        'monthly',
    );

    // Interactive FAQ
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        window.localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    const handleSimulateGenerate = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
        }, 600);
    };

    // Generated prompt representation
    const generatedPrompt = useMemo(() => {
        return `Studio commercial product photography of "${selectedProduct.name}", premium ${selectedProduct.category.toLowerCase()} presentation themed for ${selectedEvent.name}. Warm atmospheric lighting, subtle ${selectedEvent.id === 'pasko' ? 'parol lanterns and festive bokeh' : 'commercial retail styling'}, high resolution, hyper-detailed texture, sharp focus, 8k quality. Brand tone: ${selectedProduct.tone}.`;
    }, [selectedProduct, selectedEvent]);

    const upcomingCalendarDates = [
        {
            name: 'Araw ng Kagitingan',
            date: 'April 9',
            type: 'Regular Holiday',
            days: 'In 50 days',
            longWeekend: true,
        },
        {
            name: 'Labor Day (Araw ng Manggagawa)',
            date: 'May 1',
            type: 'Regular Holiday',
            days: 'In 72 days',
            longWeekend: false,
        },
        {
            name: 'Independence Day (Araw ng Kalayaan)',
            date: 'June 12',
            type: 'Regular Holiday',
            days: 'In 114 days',
            longWeekend: true,
        },
        {
            name: 'Ninoy Aquino Day',
            date: 'August 21',
            type: 'Special Non-Working',
            days: 'Upcoming',
            longWeekend: false,
        },
        {
            name: 'National Heroes Day',
            date: 'August 25',
            type: 'Regular Holiday',
            days: 'Upcoming',
            longWeekend: true,
        },
        {
            name: 'All Saints’ Day (Undas)',
            date: 'November 1',
            type: 'Special Non-Working',
            days: 'Upcoming',
            longWeekend: true,
        },
        {
            name: 'Christmas Day (Pasko)',
            date: 'December 25',
            type: 'Regular Holiday',
            days: 'Upcoming',
            longWeekend: true,
        },
        {
            name: 'Rizal Day',
            date: 'December 30',
            type: 'Regular Holiday',
            days: 'Upcoming',
            longWeekend: false,
        },
    ];

    const filteredDates = upcomingCalendarDates.filter((item) => {
        if (calendarCategory === 'all') {
            return true;
        }

        if (calendarCategory === 'regular') {
            return item.type === 'Regular Holiday';
        }

        if (calendarCategory === 'special_non_working') {
            return item.type === 'Special Non-Working';
        }

        return true;
    });

    const faqs = [
        {
            q: 'How does the Philippine Marketing Calendar automate holiday visuals?',
            a: 'MarketPilot continuously synchronizes with official Philippine proclamations, including movable Islamic dates and nationwide special non-working declarations. It calculates long-weekend metadata so you can launch promotional campaigns 2 to 3 weeks ahead of every major retail opportunity.',
        },
        {
            q: 'Can I use my existing product catalog and brand assets?',
            a: 'Yes. You can upload products, prices, product descriptions, reference photos, and your business logo. The AI generator automatically factors your brand voice (friendly, luxurious, professional) and places your logo onto finished visuals.',
        },
        {
            q: 'What download formats are supported for marketing campaigns?',
            a: 'Every generated visual can be exported in PNG (lossless with transparent overlay options), JPEG (web and social-optimized), and vector-wrapped SVG formats. All visual resolutions are scaled for Instagram (1:1), Facebook Feed/Stories (4:5), and Website Banners (16:9).',
        },
        {
            q: 'Do I own full commercial rights to generated creatives?',
            a: 'Absolutely. All marketing visuals generated through MarketPilot belong 100% to your business for commercial distribution across social ads, e-commerce stores, billboards, and print materials.',
        },
        {
            q: 'How fast is the visual generation process?',
            a: 'Visual prompts and design concepts are generated instantly. High-fidelity rendering with custom lighting and brand integration typically completes in under 15 seconds.',
        },
    ];

    return (
        <>
            <Head title="MarketPilot — AI Marketing Automation & Creative Engine" />

            <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground transition-colors duration-200 selection:bg-primary/20 selection:text-primary">
                {/* Ambient Fixed Background Glow Orbs for Landing Page */}
                <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                    <div className="absolute -top-40 left-1/4 h-[550px] w-[550px] rounded-full bg-primary/12 blur-[140px] dark:bg-primary/15" />
                    <div className="absolute top-1/3 -right-32 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[130px] dark:bg-blue-500/15" />
                    <div className="absolute top-2/3 -left-32 h-[450px] w-[450px] rounded-full bg-purple-500/10 blur-[130px] dark:bg-purple-500/15" />
                </div>

                {/* ==========================================================
                    TOP STICKY NAVIGATION HEADER (GLASSMORPHISM)
                =========================================================== */}

                <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-background/80 shadow-lg shadow-black/5 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/75">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                        {/* Brand Logo with Glow */}
                        <Link
                            href={home()}
                            className="group flex items-center gap-3 focus:outline-none"
                        >
                            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25 transition-transform duration-200 group-hover:scale-105">
                                <AppLogoIcon className="h-5 w-5 fill-current" />
                                <div className="absolute inset-0 -z-10 rounded-xl bg-primary/30 blur-sm transition-all group-hover:blur-md" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-base font-extrabold tracking-tight text-foreground">
                                    MarketPilot
                                </span>
                                <span className="hidden items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary shadow-2xs sm:inline-flex">
                                    <Sparkles className="h-2.5 w-2.5" />
                                    AI Studio
                                </span>
                            </div>
                        </Link>

                        {/* Desktop Navigation Links */}
                        <nav className="hidden items-center gap-1.5 rounded-full border border-white/20 bg-card/60 p-1 text-xs font-semibold text-muted-foreground shadow-xs backdrop-blur-md md:flex dark:border-white/10 dark:bg-slate-900/60">
                            <a
                                href="#hero-studio"
                                className="rounded-full px-3.5 py-1.5 transition-all hover:bg-muted/80 hover:text-foreground"
                            >
                                Live Studio
                            </a>
                            <a
                                href="#system-flow"
                                className="rounded-full px-3.5 py-1.5 transition-all hover:bg-muted/80 hover:text-foreground"
                            >
                                System Workflow
                            </a>
                            <a
                                href="#features"
                                className="rounded-full px-3.5 py-1.5 transition-all hover:bg-muted/80 hover:text-foreground"
                            >
                                Core Capabilities
                            </a>
                            <a
                                href="#calendar-engine"
                                className="rounded-full px-3.5 py-1.5 transition-all hover:bg-muted/80 hover:text-foreground"
                            >
                                PH Calendar
                            </a>
                            <a
                                href="#pricing"
                                className="rounded-full px-3.5 py-1.5 transition-all hover:bg-muted/80 hover:text-foreground"
                            >
                                Pricing
                            </a>
                            <a
                                href="#faq"
                                className="rounded-full px-3.5 py-1.5 transition-all hover:bg-muted/80 hover:text-foreground"
                            >
                                FAQ
                            </a>
                        </nav>

                        {/* Right Actions & Theme Switcher */}
                        <div className="flex items-center gap-2.5">
                            {/* Theme Switcher */}
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={toggleTheme}
                                aria-label="Toggle theme"
                                className="h-9 w-9 cursor-pointer rounded-xl text-muted-foreground transition-all hover:bg-muted/80 hover:text-foreground"
                            >
                                {theme === 'dark' ? (
                                    <Sun className="h-4 w-4 text-amber-400" />
                                ) : (
                                    <Moon className="h-4 w-4" />
                                )}
                            </Button>

                            {auth?.user ? (
                                <Button
                                    asChild
                                    size="sm"
                                    className="h-9 rounded-xl px-4 text-xs font-bold shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95"
                                >
                                    <Link href={dashboard()}>
                                        Dashboard &rarr;
                                    </Link>
                                </Button>
                            ) : (
                                <div className="hidden items-center gap-2 sm:flex">
                                    <Button
                                        asChild
                                        variant="ghost"
                                        size="sm"
                                        className="h-9 rounded-xl px-3.5 text-xs font-semibold hover:bg-muted/80"
                                    >
                                        <Link href={login()}>Log in</Link>
                                    </Button>
                                    <Button
                                        asChild
                                        size="sm"
                                        className="h-9 rounded-xl px-4 text-xs font-bold shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95"
                                    >
                                        <Link href={register()}>
                                            Get Started Free
                                        </Link>
                                    </Button>
                                </div>
                            )}

                            {/* Mobile Hamburger Button */}
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                    setMobileMenuOpen((prev) => !prev)
                                }
                                aria-label="Toggle navigation"
                                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground md:hidden"
                            >
                                {mobileMenuOpen ? (
                                    <X className="h-5 w-5" />
                                ) : (
                                    <Menu className="h-5 w-5" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Mobile Navigation Drawer */}
                    {mobileMenuOpen && (
                        <div className="animate-in space-y-4 border-t border-border/80 bg-card/95 px-4 py-5 backdrop-blur-2xl duration-150 slide-in-from-top-2 md:hidden">
                            <nav className="flex flex-col space-y-2 text-sm font-semibold">
                                <a
                                    href="#hero-studio"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                    Live Studio Demo
                                </a>
                                <a
                                    href="#system-flow"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                    System Workflow
                                </a>
                                <a
                                    href="#features"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                    Core Capabilities
                                </a>
                                <a
                                    href="#calendar-engine"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                    Philippine Calendar
                                </a>
                                <a
                                    href="#pricing"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                    Pricing
                                </a>
                                <a
                                    href="#faq"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                    FAQ
                                </a>
                            </nav>

                            <div className="flex flex-col gap-2 border-t border-border/80 pt-2">
                                {auth?.user ? (
                                    <Button
                                        asChild
                                        className="w-full rounded-xl text-xs font-semibold"
                                    >
                                        <Link href={dashboard()}>
                                            Open Dashboard
                                        </Link>
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="w-full rounded-xl text-xs font-semibold"
                                        >
                                            <Link href={login()}>Log in</Link>
                                        </Button>
                                        <Button
                                            asChild
                                            className="w-full rounded-xl text-xs font-semibold shadow-lg shadow-primary/25"
                                        >
                                            <Link href={register()}>
                                                Get Started Free
                                            </Link>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </header>

                <main>
                    {/* ==========================================================
                        REDESIGNED HERO SECTION WITH SYSTEM-CONNECTED WORKFLOW
                    =========================================================== */}

                    <section
                        id="hero-studio"
                        className="relative overflow-hidden pt-8 pb-16 md:pt-14 md:pb-24 lg:pt-16 lg:pb-28"
                    >
                        <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
                            {/* Top Hero Grid (Left Value Prop + Right Interactive AI Sandbox) */}
                            <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
                                {/* Left Column: Clear Value Proposition, System Overview & CTAs */}
                                <div className="space-y-6 lg:col-span-6 xl:col-span-5">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary shadow-xs backdrop-blur-md">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Retail Marketing Engine & Philippine
                                        Holiday Intelligence
                                    </div>

                                    <h1 className="text-3xl leading-[1.12] font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                                        Automate seasonal retail visuals and
                                        marketing campaigns in seconds.
                                    </h1>

                                    <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                                        Connect your product catalog directly
                                        with official Philippine national
                                        holidays, retail payday cycles, and
                                        custom brand guidelines to generate
                                        high-converting promotional graphics
                                        with one click.
                                    </p>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap items-center gap-3 pt-1">
                                        <Button
                                            asChild
                                            size="lg"
                                            className="h-11 gap-2 rounded-xl px-6 text-xs font-bold shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95"
                                        >
                                            <Link href={register()}>
                                                <Sparkles className="h-4 w-4" />
                                                Start Creating Free
                                            </Link>
                                        </Button>

                                        <Button
                                            asChild
                                            variant="outline"
                                            size="lg"
                                            className="h-11 gap-2 rounded-xl px-5 text-xs font-semibold shadow-xs transition-all hover:scale-105 hover:border-primary/40 active:scale-95"
                                        >
                                            <a href="#system-flow">
                                                <Layers className="h-4 w-4 text-primary" />
                                                How the System Works
                                            </a>
                                        </Button>
                                    </div>

                                    {/* System Pillars Badges */}
                                    <div className="grid grid-cols-1 gap-3 border-t border-border/60 pt-4 text-xs font-medium text-muted-foreground sm:grid-cols-3">
                                        <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/60 p-2">
                                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                                            <span className="text-[11px] font-semibold text-foreground">
                                                Official PH Holidays
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/60 p-2">
                                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                                            <span className="text-[11px] font-semibold text-foreground">
                                                PNG, JPEG & SVG
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/60 p-2">
                                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                                            <span className="text-[11px] font-semibold text-foreground">
                                                Instant Campaign Link
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Interactive Live AI Studio Sandbox (Glassmorphic) */}
                                <div className="lg:col-span-6 xl:col-span-7">
                                    <div className="overflow-hidden rounded-3xl border border-white/25 bg-card/85 shadow-2xl backdrop-blur-2xl transition-all duration-300 dark:border-white/10 dark:bg-slate-900/80">
                                        {/* Sandbox Top Window Bar */}
                                        <div className="flex items-center justify-between border-b border-border/80 bg-muted/40 px-5 py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                                                <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                                                <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                                                <span className="ml-2 flex items-center gap-1.5 text-xs font-bold text-foreground">
                                                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                                                    Interactive AI Studio
                                                    Sandbox
                                                </span>
                                            </div>

                                            {/* Preview mode tabs */}
                                            <div className="flex items-center rounded-xl border border-border/70 bg-card p-0.5 text-[11px] font-semibold shadow-xs">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setActiveTab('preview')
                                                    }
                                                    className={`cursor-pointer rounded-lg px-3 py-1 transition-all ${activeTab === 'preview' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                                                >
                                                    Visual
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setActiveTab('prompt')
                                                    }
                                                    className={`cursor-pointer rounded-lg px-3 py-1 transition-all ${activeTab === 'prompt' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                                                >
                                                    Prompt Logic
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setActiveTab('export')
                                                    }
                                                    className={`cursor-pointer rounded-lg px-3 py-1 transition-all ${activeTab === 'export' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                                                >
                                                    Export
                                                </button>
                                            </div>
                                        </div>

                                        {/* Sandbox Controls Toolbar */}
                                        <div className="space-y-3.5 border-b border-border/80 bg-card/60 p-4 sm:p-5">
                                            {/* 1. Pick Product */}
                                            <div>
                                                <label className="mb-1.5 block text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                                    1. Select Catalog Offering
                                                </label>
                                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                                    {sampleProducts.map(
                                                        (prod) => (
                                                            <button
                                                                key={prod.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedProduct(
                                                                        prod,
                                                                    );
                                                                    handleSimulateGenerate();
                                                                }}
                                                                className={`cursor-pointer rounded-xl border p-2.5 text-left text-xs transition-all ${selectedProduct.id === prod.id ? 'scale-[1.02] border-primary bg-primary/10 font-bold text-primary shadow-xs' : 'border-border/80 bg-muted/20 text-muted-foreground hover:border-primary/40'}`}
                                                            >
                                                                <p className="truncate font-bold text-foreground">
                                                                    {
                                                                        prod.name.split(
                                                                            ' ',
                                                                        )[0]
                                                                    }
                                                                </p>
                                                                <p className="mt-0.5 text-[10px] text-muted-foreground">
                                                                    {prod.price}
                                                                </p>
                                                            </button>
                                                        ),
                                                    )}
                                                </div>
                                            </div>

                                            {/* 2. Pick Holiday / Event Context */}
                                            <div>
                                                <label className="mb-1.5 block text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                                    2. Philippine Event /
                                                    Campaign Target
                                                </label>
                                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                                    {sampleEvents.map((evt) => (
                                                        <button
                                                            key={evt.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedEvent(
                                                                    evt,
                                                                );
                                                                handleSimulateGenerate();
                                                            }}
                                                            className={`flex cursor-pointer items-center justify-between rounded-xl border p-2.5 text-left text-xs transition-all ${selectedEvent.id === evt.id ? 'scale-[1.02] border-primary bg-primary/10 font-bold text-foreground shadow-xs' : 'border-border/80 bg-muted/20 text-muted-foreground hover:border-primary/40'}`}
                                                        >
                                                            <div className="min-w-0 pr-1">
                                                                <p className="truncate font-bold">
                                                                    {evt.name}
                                                                </p>
                                                                <p className="text-[10px] text-muted-foreground">
                                                                    {evt.date}
                                                                </p>
                                                            </div>
                                                            <Badge
                                                                variant="outline"
                                                                className="shrink-0 text-[9px] font-bold"
                                                            >
                                                                {
                                                                    evt.badgeLabel.split(
                                                                        ' ',
                                                                    )[0]
                                                                }
                                                            </Badge>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* 3. Settings: Aspect Ratio & Logo Switch */}
                                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-2 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] font-semibold text-muted-foreground">
                                                        Ratio:
                                                    </span>
                                                    {(
                                                        [
                                                            '1:1',
                                                            '4:5',
                                                            '16:9',
                                                        ] as const
                                                    ).map((ratio) => (
                                                        <button
                                                            key={ratio}
                                                            type="button"
                                                            onClick={() =>
                                                                setAspectRatio(
                                                                    ratio,
                                                                )
                                                            }
                                                            className={`cursor-pointer rounded-lg border px-2.5 py-0.5 text-[11px] font-bold transition-all ${aspectRatio === ratio ? 'border-primary bg-primary text-primary-foreground shadow-2xs' : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground'}`}
                                                        >
                                                            {ratio}
                                                        </button>
                                                    ))}
                                                </div>

                                                <label className="flex cursor-pointer items-center gap-2 text-[11px] font-semibold text-foreground select-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={includeLogo}
                                                        onChange={(e) =>
                                                            setIncludeLogo(
                                                                e.target
                                                                    .checked,
                                                            )
                                                        }
                                                        className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
                                                    />
                                                    <span>
                                                        Include Brand Logo
                                                        Overlay
                                                    </span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Sandbox Interactive Display Body */}
                                        <div className="bg-muted/10 p-4 sm:p-5">
                                            {activeTab === 'preview' && (
                                                <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-card/80 p-5 shadow-lg transition-all dark:border-white/10">
                                                    {/* Simulated AI Render Canvas */}
                                                    <div
                                                        className={`relative w-full rounded-2xl bg-gradient-to-br ${selectedProduct.gradient} flex min-h-[240px] flex-col justify-between overflow-hidden p-6 text-white shadow-xl transition-all duration-300 ${isGenerating ? 'scale-[0.99] opacity-50' : 'scale-100 opacity-100'}`}
                                                    >
                                                        {/* Atmospheric Pattern */}
                                                        <div
                                                            className={`pointer-events-none absolute inset-0 ${selectedProduct.bgPattern}`}
                                                        />

                                                        {/* Top Event & Logo Bar */}
                                                        <div className="relative z-10 flex items-start justify-between gap-2">
                                                            <Badge className="border-white/20 bg-white/20 text-[10px] font-bold text-white shadow-xs backdrop-blur-md hover:bg-white/30">
                                                                {
                                                                    selectedEvent.name
                                                                }
                                                            </Badge>

                                                            {includeLogo && (
                                                                <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] font-bold text-white shadow-xs backdrop-blur-md">
                                                                    <AppLogoIcon className="h-3.5 w-3.5 fill-white" />
                                                                    <span>
                                                                        YOUR
                                                                        BRAND
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Center Product & Offer Highlight */}
                                                        <div className="relative z-10 my-4 space-y-1.5">
                                                            <span className="text-[10px] font-extrabold tracking-widest text-amber-300 uppercase">
                                                                Special Holiday
                                                                Release
                                                            </span>
                                                            <h3 className="text-xl font-black tracking-tight text-white drop-shadow-sm sm:text-2xl">
                                                                {
                                                                    selectedProduct.name
                                                                }
                                                            </h3>
                                                            <p className="max-w-sm text-xs text-white/80 italic drop-shadow-xs">
                                                                "
                                                                {
                                                                    selectedProduct.tagline
                                                                }
                                                                "
                                                            </p>
                                                        </div>

                                                        {/* Bottom Price & Call To Action */}
                                                        <div className="relative z-10 flex items-center justify-between border-t border-white/20 pt-3">
                                                            <div className="flex items-baseline gap-1.5">
                                                                <span className="text-lg font-black text-white">
                                                                    {
                                                                        selectedProduct.price
                                                                    }
                                                                </span>
                                                                <span className="text-[10px] text-white/60 line-through">
                                                                    ₱
                                                                    {(
                                                                        parseInt(
                                                                            selectedProduct.price.replace(
                                                                                /\D/g,
                                                                                '',
                                                                            ),
                                                                        ) * 1.3
                                                                    ).toFixed(
                                                                        0,
                                                                    )}
                                                                </span>
                                                            </div>

                                                            <span className="rounded-xl bg-primary px-3.5 py-1 text-[11px] font-extrabold text-primary-foreground shadow-md shadow-primary/30">
                                                                Order Now
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Quick Actions Under Canvas */}
                                                    <div className="mt-3.5 flex items-center justify-between text-xs text-muted-foreground">
                                                        <span className="text-[11px] font-semibold text-foreground">
                                                            Tone:{' '}
                                                            <span className="font-bold text-primary">
                                                                {
                                                                    selectedProduct.tone
                                                                }
                                                            </span>
                                                        </span>
                                                        <div className="flex items-center gap-1.5">
                                                            <Badge
                                                                variant="outline"
                                                                className="font-mono text-[10px]"
                                                            >
                                                                PNG
                                                            </Badge>
                                                            <Badge
                                                                variant="outline"
                                                                className="font-mono text-[10px]"
                                                            >
                                                                JPEG
                                                            </Badge>
                                                            <Badge
                                                                variant="outline"
                                                                className="font-mono text-[10px]"
                                                            >
                                                                SVG
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {activeTab === 'prompt' && (
                                                <div className="space-y-3.5 rounded-2xl border border-white/20 bg-card/80 p-5 shadow-lg dark:border-white/10">
                                                    <div>
                                                        <p className="text-xs font-bold text-foreground">
                                                            Generated Gemini
                                                            Prompt Directive:
                                                        </p>
                                                        <p className="mt-1.5 rounded-xl border border-border/80 bg-muted/50 p-3.5 font-mono text-xs leading-relaxed text-muted-foreground">
                                                            {generatedPrompt}
                                                        </p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                                        <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                                                            <span className="font-bold text-foreground">
                                                                Holiday Season
                                                                Hook:
                                                            </span>
                                                            <p className="mt-1 text-[11px] text-muted-foreground">
                                                                {
                                                                    selectedEvent.seasonHook
                                                                }
                                                            </p>
                                                        </div>
                                                        <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                                                            <span className="font-bold text-foreground">
                                                                Output Format
                                                                Constraint:
                                                            </span>
                                                            <p className="mt-1 text-[11px] text-muted-foreground">
                                                                {aspectRatio}{' '}
                                                                High-Resolution
                                                                Export with
                                                                Auto-Contrast
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {activeTab === 'export' && (
                                                <div className="space-y-4 rounded-2xl border border-white/20 bg-card/80 p-6 text-center shadow-lg dark:border-white/10">
                                                    <h4 className="text-sm font-bold text-foreground">
                                                        Multi-Format Commercial
                                                        Export
                                                    </h4>
                                                    <p className="mx-auto max-w-sm text-xs text-muted-foreground">
                                                        Export ready-to-publish
                                                        assets optimized for
                                                        Facebook, Instagram,
                                                        TikTok, Shopee, Lazada,
                                                        and physical POS
                                                        collateral.
                                                    </p>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div className="rounded-2xl border border-border/60 bg-muted/30 p-3.5 text-center">
                                                            <p className="text-xs font-bold text-primary">
                                                                PNG Format
                                                            </p>
                                                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                                                                Lossless
                                                                Transparent
                                                            </p>
                                                        </div>
                                                        <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 text-center">
                                                            <p className="text-xs font-bold text-blue-500">
                                                                JPEG Format
                                                            </p>
                                                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                                                                Fast Social
                                                                Media Web
                                                            </p>
                                                        </div>
                                                        <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 text-center">
                                                            <p className="text-xs font-bold text-emerald-500">
                                                                SVG Format
                                                            </p>
                                                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                                                                Vector Scale
                                                                Clean
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ==========================================================
                                INTERCONNECTED SYSTEM ARCHITECTURE FLOW
                            =========================================================== */}
                            <div
                                id="system-flow"
                                className="border-t border-border/60 pt-8"
                            >
                                <div className="mx-auto mb-8 max-w-2xl space-y-2 text-center">
                                    <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-xs font-bold text-primary">
                                        <Layers className="h-3.5 w-3.5" />
                                        End-to-End System Engine
                                    </div>
                                    <h2 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                                        How All System Capabilities Connect
                                    </h2>
                                    <p className="text-xs text-muted-foreground sm:text-sm">
                                        From raw catalog inventory to
                                        calendar-synchronized campaign launches.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    {[
                                        {
                                            step: '01',
                                            title: 'Product Catalog',
                                            desc: 'Manage your retail products, custom descriptions, pricing, and product imagery.',
                                            icon: Package,
                                            color: 'text-purple-500',
                                            bg: 'bg-purple-500/10',
                                            route: '/products',
                                        },
                                        {
                                            step: '02',
                                            title: 'Philippine Calendar',
                                            desc: 'Official Proclamation regular holidays, special dates, and 15/30 payday retail cycles.',
                                            icon: CalendarDays,
                                            color: 'text-amber-500',
                                            bg: 'bg-amber-500/10',
                                            route: '/calendar',
                                        },
                                        {
                                            step: '03',
                                            title: 'Gemini AI Studio',
                                            desc: 'Synthesize tailored promotional creatives with customizable vibes, styles, and dimensions.',
                                            icon: Sparkles,
                                            color: 'text-primary',
                                            bg: 'bg-primary/10',
                                            route: '/generator',
                                        },
                                        {
                                            step: '04',
                                            title: 'Campaign Pipeline',
                                            desc: 'Organize generated visuals into scheduled marketing campaigns and multi-channel exports.',
                                            icon: Megaphone,
                                            color: 'text-emerald-500',
                                            bg: 'bg-emerald-500/10',
                                            route: '/campaigns',
                                        },
                                    ].map((item) => {
                                        const Icon = item.icon;

                                        return (
                                            <div
                                                key={item.step}
                                                className="group relative flex flex-col justify-between rounded-3xl border border-white/25 bg-card/85 p-5 shadow-lg backdrop-blur-2xl transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl dark:border-white/10 dark:bg-slate-900/80"
                                            >
                                                <div>
                                                    <div className="mb-3 flex items-center justify-between">
                                                        <span className="rounded-md bg-muted/60 px-2 py-0.5 font-mono text-[11px] font-extrabold text-muted-foreground">
                                                            {item.step}
                                                        </span>
                                                        <div
                                                            className={`flex h-8 w-8 items-center justify-center rounded-xl ${item.bg} ${item.color} shadow-xs`}
                                                        >
                                                            <Icon className="h-4 w-4" />
                                                        </div>
                                                    </div>

                                                    <h3 className="text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                                                        {item.title}
                                                    </h3>
                                                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                                        {item.desc}
                                                    </p>
                                                </div>

                                                <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3 text-[11px]">
                                                    <span className="font-semibold text-primary">
                                                        Connected Feature
                                                    </span>
                                                    <span className="text-muted-foreground transition-transform group-hover:translate-x-1">
                                                        &rarr;
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ==========================================================
                        CORE VALUE PILLARS / CAPABILITIES
                    =========================================================== */}

                    <section
                        id="features"
                        className="border-b border-border/70 bg-background py-16 md:py-24"
                    >
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="mx-auto max-w-3xl space-y-3 text-center">
                                <Badge
                                    variant="outline"
                                    className="border-primary/20 bg-primary/10 text-xs font-bold text-primary"
                                >
                                    System Architecture
                                </Badge>
                                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                                    Engineered for Philippine retail & digital
                                    commerce.
                                </h2>
                                <p className="text-sm text-muted-foreground md:text-base">
                                    Eliminate creative bottlenecks. MarketPilot
                                    ties your inventory and promotions directly
                                    into national holiday cycles.
                                </p>
                            </div>

                            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                {/* Pillar 1 */}
                                <div className="space-y-3 rounded-2xl border border-border bg-card p-6 shadow-xs">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-base font-bold text-foreground">
                                        AI Creative Visual Studio
                                    </h3>
                                    <p className="text-xs leading-relaxed text-muted-foreground">
                                        Generate commercial-grade product
                                        photography, seasonal promotional
                                        banners, and ad mockups tailored to your
                                        exact brand tone.
                                    </p>
                                </div>

                                {/* Pillar 2 */}
                                <div className="space-y-3 rounded-2xl border border-border bg-card p-6 shadow-xs">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                                        <CalendarDays className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-base font-bold text-foreground">
                                        Philippine Holiday Engine
                                    </h3>
                                    <p className="text-xs leading-relaxed text-muted-foreground">
                                        Track official regular holidays, special
                                        non-working days, Islamic movable dates,
                                        and long-weekend opportunities with
                                        automatic 60-day forecasts.
                                    </p>
                                </div>

                                {/* Pillar 3 */}
                                <div className="space-y-3 rounded-2xl border border-border bg-card p-6 shadow-xs">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                                        <Package className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-base font-bold text-foreground">
                                        Product Catalog Sync
                                    </h3>
                                    <p className="text-xs leading-relaxed text-muted-foreground">
                                        Organize offerings with pricing,
                                        category tags, and reference photos.
                                        Select any item to instantly populate
                                        campaign creatives.
                                    </p>
                                </div>

                                {/* Pillar 4 */}
                                <div className="space-y-3 rounded-2xl border border-border bg-card p-6 shadow-xs">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                                        <Layers className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-base font-bold text-foreground">
                                        Multi-Channel Campaigns
                                    </h3>
                                    <p className="text-xs leading-relaxed text-muted-foreground">
                                        Group visual assets into scheduled
                                        campaigns, track active marketing
                                        pipelines, and export in PNG, JPEG, or
                                        SVG format anytime.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ==========================================================
                        INTERACTIVE PHILIPPINE MARKETING CALENDAR SHOWCASE
                    =========================================================== */}

                    <section
                        id="calendar-engine"
                        className="border-b border-border/70 bg-card/40 py-16 md:py-24"
                    >
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
                                {/* Left Side: Explanation */}
                                <div className="space-y-4 lg:col-span-5">
                                    <Badge
                                        variant="outline"
                                        className="border-amber-500/20 bg-amber-500/10 text-xs font-bold text-amber-500"
                                    >
                                        Official National Data
                                    </Badge>
                                    <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                        Never miss a holiday revenue window.
                                    </h2>
                                    <p className="text-sm leading-relaxed text-muted-foreground">
                                        Filipino consumers shop actively around
                                        long weekends, national holidays, and
                                        payday intervals. MarketPilot gives you
                                        a proactive 60-day visual launch radar.
                                    </p>

                                    <div className="space-y-2 pt-2">
                                        <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
                                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                                            <span>
                                                Regular National Holidays (Full
                                                Proclamation Sync)
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
                                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                                            <span>
                                                Special Non-Working Days &
                                                Shifted Dates
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
                                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                            <span>
                                                Islamic Movable Holidays (Eid
                                                al-Fitr, Eid al-Adha)
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-3">
                                        <Button
                                            asChild
                                            size="sm"
                                            className="h-10 gap-2 rounded-xl px-4 text-xs font-semibold shadow-xs"
                                        >
                                            <Link href={register()}>
                                                <Calendar className="h-4 w-4" />
                                                Connect Marketing Calendar
                                            </Link>
                                        </Button>
                                    </div>
                                </div>

                                {/* Right Side: Interactive Holiday Calendar Widget */}
                                <div className="lg:col-span-7">
                                    <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-md sm:p-6">
                                        <div className="flex flex-col justify-between gap-3 border-b border-border/80 pb-4 sm:flex-row sm:items-center">
                                            <div>
                                                <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                                                    <Clock className="h-4 w-4 text-primary" />
                                                    Philippine Key Retail Dates
                                                    (2026/2027)
                                                </h3>
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    Synced with official
                                                    proclamations & long weekend
                                                    metadata
                                                </p>
                                            </div>

                                            {/* Category Filter Chips */}
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setCalendarCategory(
                                                            'all',
                                                        )
                                                    }
                                                    className={`rounded-lg border px-2 py-1 text-[11px] font-semibold transition-all ${calendarCategory === 'all' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted/30 text-muted-foreground'}`}
                                                >
                                                    All Dates
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setCalendarCategory(
                                                            'regular',
                                                        )
                                                    }
                                                    className={`rounded-lg border px-2 py-1 text-[11px] font-semibold transition-all ${calendarCategory === 'regular' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted/30 text-muted-foreground'}`}
                                                >
                                                    Regular
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setCalendarCategory(
                                                            'special_non_working',
                                                        )
                                                    }
                                                    className={`rounded-lg border px-2 py-1 text-[11px] font-semibold transition-all ${calendarCategory === 'special_non_working' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted/30 text-muted-foreground'}`}
                                                >
                                                    Special
                                                </button>
                                            </div>
                                        </div>

                                        {/* Event Cards Grid */}
                                        <div className="grid max-h-[320px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                                            {filteredDates.map((evt) => (
                                                <div
                                                    key={evt.name}
                                                    className="flex flex-col justify-between space-y-2 rounded-xl border border-border/80 bg-muted/20 p-3 transition-all hover:border-primary/50"
                                                >
                                                    <div className="flex items-start justify-between gap-1">
                                                        <div>
                                                            <p className="max-w-[170px] truncate text-xs font-bold text-foreground">
                                                                {evt.name}
                                                            </p>
                                                            <p className="text-[11px] text-muted-foreground">
                                                                {evt.date}
                                                            </p>
                                                        </div>
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[9px] font-bold ${evt.type === 'Regular Holiday' ? 'border-blue-500/30 bg-blue-500/10 text-blue-500' : 'border-amber-500/30 bg-amber-500/10 text-amber-500'}`}
                                                        >
                                                            {
                                                                evt.type.split(
                                                                    ' ',
                                                                )[0]
                                                            }
                                                        </Badge>
                                                    </div>

                                                    <div className="flex items-center justify-between border-t border-border/40 pt-1.5 text-[11px]">
                                                        <span className="text-muted-foreground">
                                                            {evt.days}
                                                        </span>
                                                        {evt.longWeekend && (
                                                            <span className="font-semibold text-emerald-500">
                                                                Long Weekend
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ==========================================================
                        TRANSPARENT PRICING
                    =========================================================== */}

                    <section
                        id="pricing"
                        className="border-b border-border/70 bg-background py-16 md:py-24"
                    >
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="mx-auto max-w-2xl space-y-3 text-center">
                                <Badge
                                    variant="outline"
                                    className="border-primary/20 bg-primary/10 text-xs font-bold text-primary"
                                >
                                    Simple Pricing
                                </Badge>
                                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                                    Predictable plans for growing retail brands.
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Create studio-grade visual assets and manage
                                    Philippine marketing campaigns without
                                    expensive agency retainers.
                                </p>

                                {/* Billing toggle */}
                                <div className="flex items-center justify-center gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setBillingCycle('monthly')
                                        }
                                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${billingCycle === 'monthly' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Monthly Billing
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setBillingCycle('annual')
                                        }
                                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${billingCycle === 'annual' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        <span>Annual Billing</span>
                                        <Badge className="bg-emerald-500 px-1.5 py-0 text-[10px] font-extrabold text-white">
                                            Save 20%
                                        </Badge>
                                    </button>
                                </div>
                            </div>

                            <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-3">
                                {/* Free Starter Plan */}
                                <div className="flex flex-col justify-between space-y-6 rounded-2xl border border-border bg-card p-6 shadow-xs">
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <h3 className="text-base font-bold text-foreground">
                                                Starter Tier
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                Ideal for exploring the studio
                                                and tracking key dates.
                                            </p>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-extrabold text-foreground">
                                                ₱0
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                / free forever
                                            </span>
                                        </div>
                                        <ul className="space-y-2.5 pt-2 text-xs text-muted-foreground">
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                                                <span>
                                                    15 AI visual generations per
                                                    month
                                                </span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                                                <span>
                                                    Official Philippine Holiday
                                                    Calendar
                                                </span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                                                <span>
                                                    Up to 10 catalog products
                                                </span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                                                <span>
                                                    High-res PNG download
                                                </span>
                                            </li>
                                        </ul>
                                    </div>

                                    <Button
                                        asChild
                                        variant="outline"
                                        className="h-10 w-full rounded-xl text-xs font-bold shadow-none"
                                    >
                                        <Link href={register()}>
                                            Get Started Free
                                        </Link>
                                    </Button>
                                </div>

                                {/* Pro Growth Plan (Highlighted) */}
                                <div className="relative flex flex-col justify-between space-y-6 rounded-2xl border-2 border-primary bg-card p-6 shadow-md">
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-md bg-primary px-3 py-0.5 text-[10px] font-extrabold tracking-wider text-primary-foreground uppercase">
                                        Most Popular
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <h3 className="text-base font-bold text-foreground">
                                                Growth Professional
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                For active online sellers &
                                                retail MSMEs.
                                            </p>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-extrabold text-foreground">
                                                {billingCycle === 'monthly'
                                                    ? '₱990'
                                                    : '₱790'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                / month
                                            </span>
                                        </div>
                                        <ul className="space-y-2.5 pt-2 text-xs text-muted-foreground">
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                                                <span className="font-semibold text-foreground">
                                                    Unlimited AI Visual
                                                    Generations
                                                </span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                                                <span>
                                                    Full Philippine Calendar +
                                                    Custom Events
                                                </span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                                                <span>
                                                    Unlimited Catalog Products
                                                </span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                                                <span>
                                                    PNG, JPEG & SVG Vector
                                                    Exports
                                                </span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                                                <span>
                                                    Custom Logo & Brand Tone
                                                    Presets
                                                </span>
                                            </li>
                                        </ul>
                                    </div>

                                    <Button
                                        asChild
                                        className="h-10 w-full rounded-xl text-xs font-bold shadow-sm"
                                    >
                                        <Link href={register()}>
                                            Start 14-Day Free Trial
                                        </Link>
                                    </Button>
                                </div>

                                {/* Enterprise / Business Plan */}
                                <div className="flex flex-col justify-between space-y-6 rounded-2xl border border-border bg-card p-6 shadow-xs">
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <h3 className="text-base font-bold text-foreground">
                                                Scale & Agency
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                For multi-brand retailers &
                                                marketing agencies.
                                            </p>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-extrabold text-foreground">
                                                {billingCycle === 'monthly'
                                                    ? '₱2,490'
                                                    : '₱1,990'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                / month
                                            </span>
                                        </div>
                                        <ul className="space-y-2.5 pt-2 text-xs text-muted-foreground">
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                                                <span className="font-semibold text-foreground">
                                                    Multi-Brand Workspace
                                                    Management
                                                </span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                                                <span>
                                                    Bulk Asset Export & Campaign
                                                    Packaging
                                                </span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                                                <span>
                                                    Priority Rendering Pipeline
                                                </span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                                                <span>
                                                    Dedicated Account Manager &
                                                    Training
                                                </span>
                                            </li>
                                        </ul>
                                    </div>

                                    <Button
                                        asChild
                                        variant="outline"
                                        className="h-10 w-full rounded-xl text-xs font-bold shadow-none"
                                    >
                                        <Link href={register()}>
                                            Contact Sales
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ==========================================================
                        FREQUENTLY ASKED QUESTIONS
                    =========================================================== */}

                    <section
                        id="faq"
                        className="border-b border-border/70 bg-card/40 py-16 md:py-24"
                    >
                        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                            <div className="mb-10 space-y-3 text-center">
                                <Badge
                                    variant="outline"
                                    className="border-primary/20 bg-primary/10 text-xs font-bold text-primary"
                                >
                                    Knowledge Base
                                </Badge>
                                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                    Frequently Asked Questions
                                </h2>
                            </div>

                            <div className="space-y-3">
                                {faqs.map((faq, idx) => (
                                    <div
                                        key={faq.q}
                                        className="overflow-hidden rounded-2xl border border-border bg-card transition-all"
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setOpenFaqIndex(
                                                    openFaqIndex === idx
                                                        ? null
                                                        : idx,
                                                )
                                            }
                                            className="flex w-full items-center justify-between p-4 text-left text-xs font-bold text-foreground transition-colors hover:text-primary sm:p-5 sm:text-sm"
                                        >
                                            <span>{faq.q}</span>
                                            <ChevronDown
                                                className={`h-4 w-4 shrink-0 transition-transform duration-200 ${openFaqIndex === idx ? 'rotate-180 text-primary' : 'text-muted-foreground'}`}
                                            />
                                        </button>

                                        {openFaqIndex === idx && (
                                            <div className="animate-in border-t border-border/50 px-4 pt-1 pb-5 text-xs leading-relaxed text-muted-foreground duration-150 fade-in sm:px-5">
                                                {faq.a}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ==========================================================
                        CALL TO ACTION BANNER
                    =========================================================== */}

                    <section className="bg-background py-16 md:py-20">
                        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                            <div className="space-y-5 rounded-3xl border border-primary/30 bg-primary/5 p-8 text-center md:p-12">
                                <Badge
                                    variant="outline"
                                    className="border-primary/20 bg-primary/10 text-xs font-bold text-primary"
                                >
                                    Ready to automate your marketing?
                                </Badge>
                                <h2 className="mx-auto max-w-2xl text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                                    Start generating seasonal marketing
                                    creatives in seconds.
                                </h2>
                                <p className="mx-auto max-w-lg text-xs text-muted-foreground sm:text-sm">
                                    Join retail businesses across the
                                    Philippines who use MarketPilot to turn
                                    national holidays and product launches into
                                    revenue.
                                </p>
                                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="h-11 gap-2 rounded-xl px-6 text-xs font-bold shadow-sm"
                                    >
                                        <Link href={register()}>
                                            <Sparkles className="h-4 w-4" />
                                            Get Started for Free
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        variant="outline"
                                        size="lg"
                                        className="h-11 rounded-xl px-5 text-xs font-semibold shadow-none"
                                    >
                                        <Link href={login()}>
                                            Sign In to Workspace
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                {/* ==========================================================
                    COMPREHENSIVE PROFESSIONAL FOOTER
                =========================================================== */}

                <footer className="border-t border-border bg-card/80 text-xs text-muted-foreground">
                    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
                        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
                            {/* Brand Summary Column */}
                            <div className="col-span-2 space-y-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                                        <AppLogoIcon className="h-4 w-4 fill-current" />
                                    </div>
                                    <span className="text-sm font-bold tracking-tight text-foreground">
                                        MarketPilot
                                    </span>
                                </div>
                                <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
                                    AI-powered retail marketing automation &
                                    creative visual generator aligned with
                                    official Philippine national holidays and
                                    commercial retail cycles.
                                </p>
                                <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-500">
                                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                                    <span>
                                        Philippine Holiday API Active & Synced
                                    </span>
                                </div>
                            </div>

                            {/* Column 1: Core Platform */}
                            <div className="space-y-3">
                                <p className="text-[11px] font-bold tracking-wider text-foreground uppercase">
                                    Platform
                                </p>
                                <ul className="space-y-2">
                                    <li>
                                        <a
                                            href="#hero-studio"
                                            className="transition-colors hover:text-primary"
                                        >
                                            AI Creative Studio
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#calendar-engine"
                                            className="transition-colors hover:text-primary"
                                        >
                                            Philippine Marketing Calendar
                                        </a>
                                    </li>
                                    <li>
                                        <Link
                                            href={login()}
                                            className="transition-colors hover:text-primary"
                                        >
                                            Product Offerings Catalog
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={login()}
                                            className="transition-colors hover:text-primary"
                                        >
                                            Campaign Management Hub
                                        </Link>
                                    </li>
                                    <li>
                                        <a
                                            href="#hero-studio"
                                            className="transition-colors hover:text-primary"
                                        >
                                            PNG, JPEG & SVG Exports
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            {/* Column 2: Holiday Intelligence */}
                            <div className="space-y-3">
                                <p className="text-[11px] font-bold tracking-wider text-foreground uppercase">
                                    PH Holidays
                                </p>
                                <ul className="space-y-2">
                                    <li>
                                        <a
                                            href="#calendar-engine"
                                            className="transition-colors hover:text-primary"
                                        >
                                            Regular National Holidays
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#calendar-engine"
                                            className="transition-colors hover:text-primary"
                                        >
                                            Special Non-Working Days
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#calendar-engine"
                                            className="transition-colors hover:text-primary"
                                        >
                                            Islamic Movable Dates
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#calendar-engine"
                                            className="transition-colors hover:text-primary"
                                        >
                                            Long Weekend Metadata
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#calendar-engine"
                                            className="transition-colors hover:text-primary"
                                        >
                                            Proclamation Sync Engine
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            {/* Column 3: Company & Legal */}
                            <div className="space-y-3">
                                <p className="text-[11px] font-bold tracking-wider text-foreground uppercase">
                                    Account & Legal
                                </p>
                                <ul className="space-y-2">
                                    <li>
                                        <Link
                                            href={login()}
                                            className="transition-colors hover:text-primary"
                                        >
                                            Sign In
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={register()}
                                            className="transition-colors hover:text-primary"
                                        >
                                            Register Account
                                        </Link>
                                    </li>
                                    <li>
                                        <a
                                            href="#faq"
                                            className="transition-colors hover:text-primary"
                                        >
                                            FAQ & Support
                                        </a>
                                    </li>
                                    <li>
                                        <span className="text-muted-foreground/60">
                                            Privacy Policy
                                        </span>
                                    </li>
                                    <li>
                                        <span className="text-muted-foreground/60">
                                            Terms of Service
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Bottom Copyright Bar */}
                        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-[11px] sm:flex-row">
                            <p>
                                © {new Date().getFullYear()} MarketPilot. All
                                rights reserved.
                            </p>
                            <p className="text-muted-foreground">
                                Built for Philippine Retailers, Online Sellers &
                                Modern MSMEs.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
