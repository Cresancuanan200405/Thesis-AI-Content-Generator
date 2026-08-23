import { Head, Link, usePage } from '@inertiajs/react';
import {
    Calendar,
    CalendarDays,
    Check,
    CheckCircle2,
    ChevronDown,
    Clock,
    Download,
    Eye,
    Globe,
    Heart,
    ImageIcon,
    Layers,
    LayoutGrid,
    Megaphone,
    Moon,
    Package,
    Plus,
    RefreshCw,
    Search,
    Shield,
    Sliders,
    Sparkles,
    Sun,
    Tag,
    Zap,
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

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
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
        bgPattern: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-700/30 via-transparent to-transparent',
    },
    {
        id: 'bakery',
        name: 'Ube Halaya Dream Cake',
        category: 'Bakery & Desserts',
        price: '₱480',
        tagline: 'Authentic purple yam sponge with silky velvet cream.',
        tone: 'Indulgent & Celebratory',
        gradient: 'from-purple-950 via-purple-900 to-slate-900',
        bgPattern: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-600/30 via-transparent to-transparent',
    },
    {
        id: 'fashion',
        name: 'Heritage Linen Camp Shirt',
        category: 'Apparel & Fashion',
        price: '₱1,250',
        tagline: 'Breathable tropical weave handcrafted in Laguna.',
        tone: 'Minimalist & Sophisticated',
        gradient: 'from-sky-950 via-slate-900 to-stone-900',
        bgPattern: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-600/25 via-transparent to-transparent',
    },
    {
        id: 'beauty',
        name: 'Kalamansi Glow Botanical Serum',
        category: 'Beauty & Wellness',
        price: '₱690',
        tagline: 'Natural vitamin C antioxidant brightening essence.',
        tone: 'Fresh & Clean Botanical',
        gradient: 'from-emerald-950 via-teal-900 to-slate-900',
        bgPattern: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-600/25 via-transparent to-transparent',
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
        seasonHook: 'Celebrate Pinoy Pride with exclusive commemorative offers and festive visual accents.',
    },
    {
        id: 'pasko',
        name: 'Paskong Pinoy Grand Season',
        category: 'special_non_working',
        badgeLabel: 'Special Non-Working',
        date: 'December 25',
        seasonHook: 'Warm holiday lanterns, parol illumination, and heartfelt gift-giving visual aesthetics.',
    },
    {
        id: 'payday',
        name: 'Mid-Month 15/30 Payday Sale',
        category: 'retail_sale',
        badgeLabel: 'Commercial Sale',
        date: '15th & 30th Monthly',
        seasonHook: 'High-urgency promotional badges, bold discount emphasis, and high-conversion layout.',
    },
    {
        id: 'eid',
        name: 'Eid al-Fitr Celebration',
        category: 'islamic',
        badgeLabel: 'Islamic Movable Date',
        date: 'Movable Date (National)',
        seasonHook: 'Elegant crescent moon motifs, gold filigree accents, and community-centered warmth.',
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
    const [selectedProduct, setSelectedProduct] = useState<SampleProduct>(sampleProducts[0]);
    const [selectedEvent, setSelectedEvent] = useState<SampleEvent>(sampleEvents[0]);
    const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:5' | '16:9'>('1:1');
    const [includeLogo, setIncludeLogo] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState<'preview' | 'prompt' | 'export'>('preview');

    // Interactive Calendar Showcase State
    const [calendarCategory, setCalendarCategory] = useState<'all' | 'regular' | 'special_non_working' | 'islamic'>('all');

    // Interactive Pricing Toggle
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

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
        { name: 'Araw ng Kagitingan', date: 'April 9', type: 'Regular Holiday', days: 'In 50 days', longWeekend: true },
        { name: 'Labor Day (Araw ng Manggagawa)', date: 'May 1', type: 'Regular Holiday', days: 'In 72 days', longWeekend: false },
        { name: 'Independence Day (Araw ng Kalayaan)', date: 'June 12', type: 'Regular Holiday', days: 'In 114 days', longWeekend: true },
        { name: 'Ninoy Aquino Day', date: 'August 21', type: 'Special Non-Working', days: 'Upcoming', longWeekend: false },
        { name: 'National Heroes Day', date: 'August 25', type: 'Regular Holiday', days: 'Upcoming', longWeekend: true },
        { name: 'All Saints’ Day (Undas)', date: 'November 1', type: 'Special Non-Working', days: 'Upcoming', longWeekend: true },
        { name: 'Christmas Day (Pasko)', date: 'December 25', type: 'Regular Holiday', days: 'Upcoming', longWeekend: true },
        { name: 'Rizal Day', date: 'December 30', type: 'Regular Holiday', days: 'Upcoming', longWeekend: false },
    ];

    const filteredDates = upcomingCalendarDates.filter((item) => {
        if (calendarCategory === 'all') return true;
        if (calendarCategory === 'regular') return item.type === 'Regular Holiday';
        if (calendarCategory === 'special_non_working') return item.type === 'Special Non-Working';
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

            <div className="min-h-screen bg-background text-foreground transition-colors duration-200 selection:bg-primary/20 selection:text-primary relative overflow-x-hidden">

                {/* Ambient Fixed Background Glow Orbs for Landing Page */}
                <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                    <div className="absolute -top-40 left-1/4 h-[550px] w-[550px] rounded-full bg-primary/12 blur-[140px] dark:bg-primary/15" />
                    <div className="absolute top-1/3 -right-32 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[130px] dark:bg-blue-500/15" />
                    <div className="absolute top-2/3 -left-32 h-[450px] w-[450px] rounded-full bg-purple-500/10 blur-[130px] dark:bg-purple-500/15" />
                </div>

                {/* ==========================================================
                    TOP STICKY NAVIGATION HEADER (GLASSMORPHISM)
                =========================================================== */}

                <header className="sticky top-0 z-50 w-full border-b border-white/20 dark:border-white/10 bg-background/80 dark:bg-slate-950/75 backdrop-blur-2xl shadow-lg shadow-black/5">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

                        {/* Brand Logo with Glow */}
                        <Link href={home()} className="group flex items-center gap-3 focus:outline-none">
                            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25 transition-transform duration-200 group-hover:scale-105">
                                <AppLogoIcon className="h-5 w-5 fill-current" />
                                <div className="absolute inset-0 rounded-xl bg-primary/30 blur-sm -z-10 group-hover:blur-md transition-all" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-base font-extrabold tracking-tight text-foreground">MarketPilot</span>
                                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/25 shadow-2xs">
                                    <Sparkles className="h-2.5 w-2.5" />
                                    AI Studio
                                </span>
                            </div>
                        </Link>

                        {/* Desktop Navigation Links */}
                        <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-full border border-white/20 dark:border-white/10 bg-card/60 dark:bg-slate-900/60 backdrop-blur-md shadow-xs text-xs font-semibold text-muted-foreground">
                            <a href="#hero-studio" className="px-3.5 py-1.5 rounded-full transition-all hover:text-foreground hover:bg-muted/80">
                                Live Studio
                            </a>
                            <a href="#system-flow" className="px-3.5 py-1.5 rounded-full transition-all hover:text-foreground hover:bg-muted/80">
                                System Workflow
                            </a>
                            <a href="#features" className="px-3.5 py-1.5 rounded-full transition-all hover:text-foreground hover:bg-muted/80">
                                Core Capabilities
                            </a>
                            <a href="#calendar-engine" className="px-3.5 py-1.5 rounded-full transition-all hover:text-foreground hover:bg-muted/80">
                                PH Calendar
                            </a>
                            <a href="#pricing" className="px-3.5 py-1.5 rounded-full transition-all hover:text-foreground hover:bg-muted/80">
                                Pricing
                            </a>
                            <a href="#faq" className="px-3.5 py-1.5 rounded-full transition-all hover:text-foreground hover:bg-muted/80">
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
                                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all cursor-pointer"
                            >
                                {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
                            </Button>

                            {auth?.user ? (
                                <Button asChild size="sm" className="rounded-xl shadow-lg shadow-primary/25 text-xs font-bold px-4 h-9 hover:scale-105 active:scale-95 transition-all">
                                    <Link href={dashboard()}>
                                        Dashboard &rarr;
                                    </Link>
                                </Button>
                            ) : (
                                <div className="hidden sm:flex items-center gap-2">
                                    <Button asChild variant="ghost" size="sm" className="rounded-xl text-xs font-semibold px-3.5 h-9 hover:bg-muted/80">
                                        <Link href={login()}>
                                            Log in
                                        </Link>
                                    </Button>
                                    <Button asChild size="sm" className="rounded-xl shadow-lg shadow-primary/25 text-xs font-bold px-4 h-9 hover:scale-105 active:scale-95 transition-all">
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
                                onClick={() => setMobileMenuOpen((prev) => !prev)}
                                aria-label="Toggle navigation"
                                className="h-9 w-9 rounded-xl md:hidden text-muted-foreground hover:text-foreground"
                            >
                                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </Button>
                        </div>
                    </div>

                    {/* Mobile Navigation Drawer */}
                    {mobileMenuOpen && (
                        <div className="border-t border-border/80 bg-card/95 backdrop-blur-2xl px-4 py-5 md:hidden space-y-4 animate-in slide-in-from-top-2 duration-150">
                            <nav className="flex flex-col space-y-2 text-sm font-semibold">
                                <a
                                    href="#hero-studio"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                                >
                                    Live Studio Demo
                                </a>
                                <a
                                    href="#system-flow"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                                >
                                    System Workflow
                                </a>
                                <a
                                    href="#features"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                                >
                                    Core Capabilities
                                </a>
                                <a
                                    href="#calendar-engine"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                                >
                                    Philippine Calendar
                                </a>
                                <a
                                    href="#pricing"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                                >
                                    Pricing
                                </a>
                                <a
                                    href="#faq"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                                >
                                    FAQ
                                </a>
                            </nav>

                            <div className="pt-2 border-t border-border/80 flex flex-col gap-2">
                                {auth?.user ? (
                                    <Button asChild className="rounded-xl w-full text-xs font-semibold">
                                        <Link href={dashboard()}>Open Dashboard</Link>
                                    </Button>
                                ) : (
                                    <>
                                        <Button asChild variant="outline" className="rounded-xl w-full text-xs font-semibold">
                                            <Link href={login()}>Log in</Link>
                                        </Button>
                                        <Button asChild className="rounded-xl w-full text-xs font-semibold shadow-lg shadow-primary/25">
                                            <Link href={register()}>Get Started Free</Link>
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

                    <section id="hero-studio" className="relative pt-8 pb-16 md:pt-14 md:pb-24 lg:pt-16 lg:pb-28 overflow-hidden">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">

                            {/* Top Hero Grid (Left Value Prop + Right Interactive AI Sandbox) */}
                            <div className="grid gap-8 lg:grid-cols-12 lg:items-center">

                                {/* Left Column: Clear Value Proposition, System Overview & CTAs */}
                                <div className="space-y-6 lg:col-span-6 xl:col-span-5">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary backdrop-blur-md shadow-xs">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Retail Marketing Engine & Philippine Holiday Intelligence
                                    </div>

                                    <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-foreground leading-[1.12]">
                                        Automate seasonal retail visuals and marketing campaigns in seconds.
                                    </h1>

                                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                                        Connect your product catalog directly with official Philippine national holidays, retail payday cycles, and custom brand guidelines to generate high-converting promotional graphics with one click.
                                    </p>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap items-center gap-3 pt-1">
                                        <Button asChild size="lg" className="rounded-xl shadow-lg shadow-primary/25 text-xs font-bold px-6 h-11 gap-2 hover:scale-105 active:scale-95 transition-all">
                                            <Link href={register()}>
                                                <Sparkles className="h-4 w-4" />
                                                Start Creating Free
                                            </Link>
                                        </Button>

                                        <Button asChild variant="outline" size="lg" className="rounded-xl shadow-xs text-xs font-semibold px-5 h-11 gap-2 hover:border-primary/40 hover:scale-105 active:scale-95 transition-all">
                                            <a href="#system-flow">
                                                <Layers className="h-4 w-4 text-primary" />
                                                How the System Works
                                            </a>
                                        </Button>
                                    </div>

                                    {/* System Pillars Badges */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-border/60 text-xs text-muted-foreground font-medium">
                                        <div className="flex items-center gap-2 p-2 rounded-xl bg-card/60 border border-border/50">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                            <span className="font-semibold text-foreground text-[11px]">Official PH Holidays</span>
                                        </div>
                                        <div className="flex items-center gap-2 p-2 rounded-xl bg-card/60 border border-border/50">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                            <span className="font-semibold text-foreground text-[11px]">PNG, JPEG & SVG</span>
                                        </div>
                                        <div className="flex items-center gap-2 p-2 rounded-xl bg-card/60 border border-border/50">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                            <span className="font-semibold text-foreground text-[11px]">Instant Campaign Link</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Interactive Live AI Studio Sandbox (Glassmorphic) */}
                                <div className="lg:col-span-6 xl:col-span-7">
                                    <div className="rounded-3xl border border-white/25 dark:border-white/10 bg-card/85 dark:bg-slate-900/80 backdrop-blur-2xl shadow-2xl overflow-hidden transition-all duration-300">

                                        {/* Sandbox Top Window Bar */}
                                        <div className="flex items-center justify-between border-b border-border/80 bg-muted/40 px-5 py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                                                <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                                                <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                                                <span className="ml-2 text-xs font-bold text-foreground flex items-center gap-1.5">
                                                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                                                    Interactive AI Studio Sandbox
                                                </span>
                                            </div>

                                            {/* Preview mode tabs */}
                                            <div className="flex items-center rounded-xl border border-border/70 bg-card p-0.5 text-[11px] font-semibold shadow-xs">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('preview')}
                                                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${activeTab === 'preview' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                                                >
                                                    Visual
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('prompt')}
                                                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${activeTab === 'prompt' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                                                >
                                                    Prompt Logic
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('export')}
                                                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${activeTab === 'export' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                                                >
                                                    Export
                                                </button>
                                            </div>
                                        </div>

                                        {/* Sandbox Controls Toolbar */}
                                        <div className="p-4 sm:p-5 border-b border-border/80 bg-card/60 space-y-3.5">
                                            {/* 1. Pick Product */}
                                            <div>
                                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                                                    1. Select Catalog Offering
                                                </label>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                    {sampleProducts.map((prod) => (
                                                        <button
                                                            key={prod.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedProduct(prod);
                                                                handleSimulateGenerate();
                                                            }}
                                                            className={`text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${selectedProduct.id === prod.id ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs scale-[1.02]' : 'border-border/80 bg-muted/20 text-muted-foreground hover:border-primary/40'}`}
                                                        >
                                                            <p className="truncate font-bold text-foreground">{prod.name.split(' ')[0]}</p>
                                                            <p className="text-[10px] text-muted-foreground mt-0.5">{prod.price}</p>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* 2. Pick Holiday / Event Context */}
                                            <div>
                                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                                                    2. Philippine Event / Campaign Target
                                                </label>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                    {sampleEvents.map((evt) => (
                                                        <button
                                                            key={evt.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedEvent(evt);
                                                                handleSimulateGenerate();
                                                            }}
                                                            className={`text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${selectedEvent.id === evt.id ? 'border-primary bg-primary/10 text-foreground font-bold shadow-xs scale-[1.02]' : 'border-border/80 bg-muted/20 text-muted-foreground hover:border-primary/40'}`}
                                                        >
                                                            <div className="min-w-0 pr-1">
                                                                <p className="truncate font-bold">{evt.name}</p>
                                                                <p className="text-[10px] text-muted-foreground">{evt.date}</p>
                                                            </div>
                                                            <Badge variant="outline" className="text-[9px] font-bold shrink-0">
                                                                {evt.badgeLabel.split(' ')[0]}
                                                            </Badge>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* 3. Settings: Aspect Ratio & Logo Switch */}
                                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] font-semibold text-muted-foreground">Ratio:</span>
                                                    {(['1:1', '4:5', '16:9'] as const).map((ratio) => (
                                                        <button
                                                            key={ratio}
                                                            type="button"
                                                            onClick={() => setAspectRatio(ratio)}
                                                            className={`px-2.5 py-0.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${aspectRatio === ratio ? 'border-primary bg-primary text-primary-foreground shadow-2xs' : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground'}`}
                                                        >
                                                            {ratio}
                                                        </button>
                                                    ))}
                                                </div>

                                                <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-semibold text-foreground">
                                                    <input
                                                        type="checkbox"
                                                        checked={includeLogo}
                                                        onChange={(e) => setIncludeLogo(e.target.checked)}
                                                        className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                                                    />
                                                    <span>Include Brand Logo Overlay</span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Sandbox Interactive Display Body */}
                                        <div className="p-4 sm:p-5 bg-muted/10">
                                            {activeTab === 'preview' && (
                                                <div className="relative rounded-2xl border border-white/20 dark:border-white/10 overflow-hidden bg-card/80 shadow-lg p-5 transition-all">
                                                    {/* Simulated AI Render Canvas */}
                                                    <div className={`relative w-full rounded-2xl bg-gradient-to-br ${selectedProduct.gradient} p-6 text-white min-h-[240px] flex flex-col justify-between overflow-hidden shadow-xl transition-all duration-300 ${isGenerating ? 'opacity-50 scale-[0.99]' : 'opacity-100 scale-100'}`}>

                                                        {/* Atmospheric Pattern */}
                                                        <div className={`absolute inset-0 pointer-events-none ${selectedProduct.bgPattern}`} />

                                                        {/* Top Event & Logo Bar */}
                                                        <div className="relative z-10 flex items-start justify-between gap-2">
                                                            <Badge className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border-white/20 text-[10px] font-bold shadow-xs">
                                                                {selectedEvent.name}
                                                            </Badge>

                                                            {includeLogo && (
                                                                <div className="flex items-center gap-1.5 rounded-lg bg-black/40 backdrop-blur-md px-2.5 py-1 border border-white/10 text-[10px] font-bold text-white shadow-xs">
                                                                    <AppLogoIcon className="h-3.5 w-3.5 fill-white" />
                                                                    <span>YOUR BRAND</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Center Product & Offer Highlight */}
                                                        <div className="relative z-10 my-4 space-y-1.5">
                                                            <span className="text-[10px] uppercase tracking-widest font-extrabold text-amber-300">
                                                                Special Holiday Release
                                                            </span>
                                                            <h3 className="text-xl sm:text-2xl font-black tracking-tight drop-shadow-sm text-white">
                                                                {selectedProduct.name}
                                                            </h3>
                                                            <p className="text-xs text-white/80 max-w-sm drop-shadow-xs italic">
                                                                "{selectedProduct.tagline}"
                                                            </p>
                                                        </div>

                                                        {/* Bottom Price & Call To Action */}
                                                        <div className="relative z-10 flex items-center justify-between pt-3 border-t border-white/20">
                                                            <div className="flex items-baseline gap-1.5">
                                                                <span className="text-lg font-black text-white">{selectedProduct.price}</span>
                                                                <span className="text-[10px] text-white/60 line-through">₱{(parseInt(selectedProduct.price.replace(/\D/g, '')) * 1.3).toFixed(0)}</span>
                                                            </div>

                                                            <span className="rounded-xl bg-primary px-3.5 py-1 text-[11px] font-extrabold text-primary-foreground shadow-md shadow-primary/30">
                                                                Order Now
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Quick Actions Under Canvas */}
                                                    <div className="mt-3.5 flex items-center justify-between text-xs text-muted-foreground">
                                                        <span className="font-semibold text-foreground text-[11px]">
                                                            Tone: <span className="text-primary font-bold">{selectedProduct.tone}</span>
                                                        </span>
                                                        <div className="flex items-center gap-1.5">
                                                            <Badge variant="outline" className="text-[10px] font-mono">PNG</Badge>
                                                            <Badge variant="outline" className="text-[10px] font-mono">JPEG</Badge>
                                                            <Badge variant="outline" className="text-[10px] font-mono">SVG</Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {activeTab === 'prompt' && (
                                                <div className="rounded-2xl border border-white/20 dark:border-white/10 bg-card/80 p-5 space-y-3.5 shadow-lg">
                                                    <div>
                                                        <p className="text-xs font-bold text-foreground">Generated Gemini Prompt Directive:</p>
                                                        <p className="text-xs font-mono text-muted-foreground mt-1.5 bg-muted/50 p-3.5 rounded-xl border border-border/80 leading-relaxed">
                                                            {generatedPrompt}
                                                        </p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                                        <div className="p-3 rounded-xl border border-border/60 bg-muted/20">
                                                            <span className="font-bold text-foreground">Holiday Season Hook:</span>
                                                            <p className="text-muted-foreground text-[11px] mt-1">{selectedEvent.seasonHook}</p>
                                                        </div>
                                                        <div className="p-3 rounded-xl border border-border/60 bg-muted/20">
                                                            <span className="font-bold text-foreground">Output Format Constraint:</span>
                                                            <p className="text-muted-foreground text-[11px] mt-1">{aspectRatio} High-Resolution Export with Auto-Contrast</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {activeTab === 'export' && (
                                                <div className="rounded-2xl border border-white/20 dark:border-white/10 bg-card/80 p-6 space-y-4 text-center shadow-lg">
                                                    <h4 className="text-sm font-bold text-foreground">Multi-Format Commercial Export</h4>
                                                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                                        Export ready-to-publish assets optimized for Facebook, Instagram, TikTok, Shopee, Lazada, and physical POS collateral.
                                                    </p>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div className="rounded-2xl border border-border/60 bg-muted/30 p-3.5 text-center">
                                                            <p className="text-xs font-bold text-primary">PNG Format</p>
                                                            <p className="text-[10px] text-muted-foreground mt-0.5">Lossless Transparent</p>
                                                        </div>
                                                        <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 text-center">
                                                            <p className="text-xs font-bold text-blue-500">JPEG Format</p>
                                                            <p className="text-[10px] text-muted-foreground mt-0.5">Fast Social Media Web</p>
                                                        </div>
                                                        <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 text-center">
                                                            <p className="text-xs font-bold text-emerald-500">SVG Format</p>
                                                            <p className="text-[10px] text-muted-foreground mt-0.5">Vector Scale Clean</p>
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
                            <div id="system-flow" className="pt-8 border-t border-border/60">
                                <div className="text-center max-w-2xl mx-auto space-y-2 mb-8">
                                    <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-xs font-bold text-primary">
                                        <Layers className="h-3.5 w-3.5" />
                                        End-to-End System Engine
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                                        How All System Capabilities Connect
                                    </h2>
                                    <p className="text-xs sm:text-sm text-muted-foreground">
                                        From raw catalog inventory to calendar-synchronized campaign launches.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                                className="group relative flex flex-col justify-between rounded-3xl border border-white/25 dark:border-white/10 bg-card/85 dark:bg-slate-900/80 p-5 shadow-lg backdrop-blur-2xl transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl"
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-[11px] font-mono font-extrabold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                                                            {item.step}
                                                        </span>
                                                        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${item.bg} ${item.color} shadow-xs`}>
                                                            <Icon className="h-4 w-4" />
                                                        </div>
                                                    </div>

                                                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                                        {item.title}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                                        {item.desc}
                                                    </p>
                                                </div>

                                                <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-between text-[11px]">
                                                    <span className="font-semibold text-primary">Connected Feature</span>
                                                    <span className="text-muted-foreground group-hover:translate-x-1 transition-transform">&rarr;</span>
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

                    <section id="features" className="py-16 md:py-24 border-b border-border/70 bg-background">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="text-center max-w-3xl mx-auto space-y-3">
                                <Badge variant="outline" className="text-xs font-bold text-primary border-primary/20 bg-primary/10">
                                    System Architecture
                                </Badge>
                                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                                    Engineered for Philippine retail & digital commerce.
                                </h2>
                                <p className="text-sm md:text-base text-muted-foreground">
                                    Eliminate creative bottlenecks. MarketPilot ties your inventory and promotions directly into national holiday cycles.
                                </p>
                            </div>

                            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                {/* Pillar 1 */}
                                <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-base font-bold text-foreground">AI Creative Visual Studio</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Generate commercial-grade product photography, seasonal promotional banners, and ad mockups tailored to your exact brand tone.
                                    </p>
                                </div>

                                {/* Pillar 2 */}
                                <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                                        <CalendarDays className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-base font-bold text-foreground">Philippine Holiday Engine</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Track official regular holidays, special non-working days, Islamic movable dates, and long-weekend opportunities with automatic 60-day forecasts.
                                    </p>
                                </div>

                                {/* Pillar 3 */}
                                <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                                        <Package className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-base font-bold text-foreground">Product Catalog Sync</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Organize offerings with pricing, category tags, and reference photos. Select any item to instantly populate campaign creatives.
                                    </p>
                                </div>

                                {/* Pillar 4 */}
                                <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                                        <Layers className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-base font-bold text-foreground">Multi-Channel Campaigns</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Group visual assets into scheduled campaigns, track active marketing pipelines, and export in PNG, JPEG, or SVG format anytime.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ==========================================================
                        INTERACTIVE PHILIPPINE MARKETING CALENDAR SHOWCASE
                    =========================================================== */}

                    <section id="calendar-engine" className="py-16 md:py-24 border-b border-border/70 bg-card/40">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="grid gap-10 lg:grid-cols-12 lg:items-center">

                                {/* Left Side: Explanation */}
                                <div className="space-y-4 lg:col-span-5">
                                    <Badge variant="outline" className="text-xs font-bold text-amber-500 border-amber-500/20 bg-amber-500/10">
                                        Official National Data
                                    </Badge>
                                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                                        Never miss a holiday revenue window.
                                    </h2>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Filipino consumers shop actively around long weekends, national holidays, and payday intervals. MarketPilot gives you a proactive 60-day visual launch radar.
                                    </p>

                                    <div className="space-y-2 pt-2">
                                        <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
                                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                                            <span>Regular National Holidays (Full Proclamation Sync)</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
                                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                                            <span>Special Non-Working Days & Shifted Dates</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
                                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                            <span>Islamic Movable Holidays (Eid al-Fitr, Eid al-Adha)</span>
                                        </div>
                                    </div>

                                    <div className="pt-3">
                                        <Button asChild size="sm" className="rounded-xl shadow-xs text-xs font-semibold px-4 h-10 gap-2">
                                            <Link href={register()}>
                                                <Calendar className="h-4 w-4" />
                                                Connect Marketing Calendar
                                            </Link>
                                        </Button>
                                    </div>
                                </div>

                                {/* Right Side: Interactive Holiday Calendar Widget */}
                                <div className="lg:col-span-7">
                                    <div className="rounded-2xl border border-border bg-card shadow-md p-5 sm:p-6 space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
                                            <div>
                                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-primary" />
                                                    Philippine Key Retail Dates (2026/2027)
                                                </h3>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    Synced with official proclamations & long weekend metadata
                                                </p>
                                            </div>

                                            {/* Category Filter Chips */}
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setCalendarCategory('all')}
                                                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all ${calendarCategory === 'all' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted/30 text-muted-foreground'}`}
                                                >
                                                    All Dates
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setCalendarCategory('regular')}
                                                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all ${calendarCategory === 'regular' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted/30 text-muted-foreground'}`}
                                                >
                                                    Regular
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setCalendarCategory('special_non_working')}
                                                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all ${calendarCategory === 'special_non_working' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted/30 text-muted-foreground'}`}
                                                >
                                                    Special
                                                </button>
                                            </div>
                                        </div>

                                        {/* Event Cards Grid */}
                                        <div className="grid gap-2 sm:grid-cols-2 max-h-[320px] overflow-y-auto pr-1">
                                            {filteredDates.map((evt) => (
                                                <div
                                                    key={evt.name}
                                                    className="rounded-xl border border-border/80 bg-muted/20 p-3 flex flex-col justify-between hover:border-primary/50 transition-all space-y-2"
                                                >
                                                    <div className="flex items-start justify-between gap-1">
                                                        <div>
                                                            <p className="text-xs font-bold text-foreground truncate max-w-[170px]">{evt.name}</p>
                                                            <p className="text-[11px] text-muted-foreground">{evt.date}</p>
                                                        </div>
                                                        <Badge variant="outline" className={`text-[9px] font-bold ${evt.type === 'Regular Holiday' ? 'border-blue-500/30 text-blue-500 bg-blue-500/10' : 'border-amber-500/30 text-amber-500 bg-amber-500/10'}`}>
                                                            {evt.type.split(' ')[0]}
                                                        </Badge>
                                                    </div>

                                                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-border/40">
                                                        <span className="text-muted-foreground">{evt.days}</span>
                                                        {evt.longWeekend && (
                                                            <span className="font-semibold text-emerald-500">Long Weekend</span>
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

                    <section id="pricing" className="py-16 md:py-24 border-b border-border/70 bg-background">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="text-center max-w-2xl mx-auto space-y-3">
                                <Badge variant="outline" className="text-xs font-bold text-primary border-primary/20 bg-primary/10">
                                    Simple Pricing
                                </Badge>
                                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                                    Predictable plans for growing retail brands.
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Create studio-grade visual assets and manage Philippine marketing campaigns without expensive agency retainers.
                                </p>

                                {/* Billing toggle */}
                                <div className="pt-2 flex items-center justify-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setBillingCycle('monthly')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${billingCycle === 'monthly' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Monthly Billing
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setBillingCycle('annual')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${billingCycle === 'annual' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        <span>Annual Billing</span>
                                        <Badge className="bg-emerald-500 text-white text-[10px] font-extrabold px-1.5 py-0">Save 20%</Badge>
                                    </button>
                                </div>
                            </div>

                            <div className="mt-12 grid gap-6 lg:grid-cols-3 max-w-5xl mx-auto">
                                {/* Free Starter Plan */}
                                <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <h3 className="text-base font-bold text-foreground">Starter Tier</h3>
                                            <p className="text-xs text-muted-foreground">Ideal for exploring the studio and tracking key dates.</p>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-extrabold text-foreground">₱0</span>
                                            <span className="text-xs text-muted-foreground">/ free forever</span>
                                        </div>
                                        <ul className="space-y-2.5 text-xs text-muted-foreground pt-2">
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                                                <span>15 AI visual generations per month</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                                                <span>Official Philippine Holiday Calendar</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                                                <span>Up to 10 catalog products</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                                                <span>High-res PNG download</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <Button asChild variant="outline" className="rounded-xl w-full text-xs font-bold h-10 shadow-none">
                                        <Link href={register()}>Get Started Free</Link>
                                    </Button>
                                </div>

                                {/* Pro Growth Plan (Highlighted) */}
                                <div className="rounded-2xl border-2 border-primary bg-card p-6 shadow-md flex flex-col justify-between space-y-6 relative">
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-md bg-primary px-3 py-0.5 text-[10px] font-extrabold text-primary-foreground uppercase tracking-wider">
                                        Most Popular
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <h3 className="text-base font-bold text-foreground">Growth Professional</h3>
                                            <p className="text-xs text-muted-foreground">For active online sellers & retail MSMEs.</p>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-extrabold text-foreground">
                                                {billingCycle === 'monthly' ? '₱990' : '₱790'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">/ month</span>
                                        </div>
                                        <ul className="space-y-2.5 text-xs text-muted-foreground pt-2">
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                                                <span className="font-semibold text-foreground">Unlimited AI Visual Generations</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                                                <span>Full Philippine Calendar + Custom Events</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                                                <span>Unlimited Catalog Products</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                                                <span>PNG, JPEG & SVG Vector Exports</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                                                <span>Custom Logo & Brand Tone Presets</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <Button asChild className="rounded-xl w-full text-xs font-bold h-10 shadow-sm">
                                        <Link href={register()}>Start 14-Day Free Trial</Link>
                                    </Button>
                                </div>

                                {/* Enterprise / Business Plan */}
                                <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <h3 className="text-base font-bold text-foreground">Scale & Agency</h3>
                                            <p className="text-xs text-muted-foreground">For multi-brand retailers & marketing agencies.</p>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-extrabold text-foreground">
                                                {billingCycle === 'monthly' ? '₱2,490' : '₱1,990'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">/ month</span>
                                        </div>
                                        <ul className="space-y-2.5 text-xs text-muted-foreground pt-2">
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                                                <span className="font-semibold text-foreground">Multi-Brand Workspace Management</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                                                <span>Bulk Asset Export & Campaign Packaging</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                                                <span>Priority Rendering Pipeline</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                                                <span>Dedicated Account Manager & Training</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <Button asChild variant="outline" className="rounded-xl w-full text-xs font-bold h-10 shadow-none">
                                        <Link href={register()}>Contact Sales</Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ==========================================================
                        FREQUENTLY ASKED QUESTIONS
                    =========================================================== */}

                    <section id="faq" className="py-16 md:py-24 border-b border-border/70 bg-card/40">
                        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                            <div className="text-center space-y-3 mb-10">
                                <Badge variant="outline" className="text-xs font-bold text-primary border-primary/20 bg-primary/10">
                                    Knowledge Base
                                </Badge>
                                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                                    Frequently Asked Questions
                                </h2>
                            </div>

                            <div className="space-y-3">
                                {faqs.map((faq, idx) => (
                                    <div
                                        key={faq.q}
                                        className="rounded-2xl border border-border bg-card overflow-hidden transition-all"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                                            className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors"
                                        >
                                            <span>{faq.q}</span>
                                            <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${openFaqIndex === idx ? 'rotate-180 text-primary' : 'text-muted-foreground'}`} />
                                        </button>

                                        {openFaqIndex === idx && (
                                            <div className="px-4 sm:px-5 pb-5 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/50 animate-in fade-in duration-150">
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

                    <section className="py-16 md:py-20 bg-background">
                        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                            <div className="rounded-3xl border border-primary/30 bg-primary/5 p-8 md:p-12 text-center space-y-5">
                                <Badge variant="outline" className="text-xs font-bold text-primary border-primary/20 bg-primary/10">
                                    Ready to automate your marketing?
                                </Badge>
                                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground max-w-2xl mx-auto">
                                    Start generating seasonal marketing creatives in seconds.
                                </h2>
                                <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
                                    Join retail businesses across the Philippines who use MarketPilot to turn national holidays and product launches into revenue.
                                </p>
                                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                                    <Button asChild size="lg" className="rounded-xl shadow-sm text-xs font-bold px-6 h-11 gap-2">
                                        <Link href={register()}>
                                            <Sparkles className="h-4 w-4" />
                                            Get Started for Free
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="lg" className="rounded-xl shadow-none text-xs font-semibold px-5 h-11">
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
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                        <div className="grid gap-8 grid-cols-2 md:grid-cols-5">

                            {/* Brand Summary Column */}
                            <div className="col-span-2 space-y-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                                        <AppLogoIcon className="h-4 w-4 fill-current" />
                                    </div>
                                    <span className="text-sm font-bold tracking-tight text-foreground">MarketPilot</span>
                                </div>
                                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                                    AI-powered retail marketing automation & creative visual generator aligned with official Philippine national holidays and commercial retail cycles.
                                </p>
                                <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-500">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Philippine Holiday API Active & Synced</span>
                                </div>
                            </div>

                            {/* Column 1: Core Platform */}
                            <div className="space-y-3">
                                <p className="font-bold text-foreground uppercase tracking-wider text-[11px]">Platform</p>
                                <ul className="space-y-2">
                                    <li><a href="#hero-studio" className="hover:text-primary transition-colors">AI Creative Studio</a></li>
                                    <li><a href="#calendar-engine" className="hover:text-primary transition-colors">Philippine Marketing Calendar</a></li>
                                    <li><Link href={login()} className="hover:text-primary transition-colors">Product Offerings Catalog</Link></li>
                                    <li><Link href={login()} className="hover:text-primary transition-colors">Campaign Management Hub</Link></li>
                                    <li><a href="#hero-studio" className="hover:text-primary transition-colors">PNG, JPEG & SVG Exports</a></li>
                                </ul>
                            </div>

                            {/* Column 2: Holiday Intelligence */}
                            <div className="space-y-3">
                                <p className="font-bold text-foreground uppercase tracking-wider text-[11px]">PH Holidays</p>
                                <ul className="space-y-2">
                                    <li><a href="#calendar-engine" className="hover:text-primary transition-colors">Regular National Holidays</a></li>
                                    <li><a href="#calendar-engine" className="hover:text-primary transition-colors">Special Non-Working Days</a></li>
                                    <li><a href="#calendar-engine" className="hover:text-primary transition-colors">Islamic Movable Dates</a></li>
                                    <li><a href="#calendar-engine" className="hover:text-primary transition-colors">Long Weekend Metadata</a></li>
                                    <li><a href="#calendar-engine" className="hover:text-primary transition-colors">Proclamation Sync Engine</a></li>
                                </ul>
                            </div>

                            {/* Column 3: Company & Legal */}
                            <div className="space-y-3">
                                <p className="font-bold text-foreground uppercase tracking-wider text-[11px]">Account & Legal</p>
                                <ul className="space-y-2">
                                    <li><Link href={login()} className="hover:text-primary transition-colors">Sign In</Link></li>
                                    <li><Link href={register()} className="hover:text-primary transition-colors">Register Account</Link></li>
                                    <li><a href="#faq" className="hover:text-primary transition-colors">FAQ & Support</a></li>
                                    <li><span className="text-muted-foreground/60">Privacy Policy</span></li>
                                    <li><span className="text-muted-foreground/60">Terms of Service</span></li>
                                </ul>
                            </div>
                        </div>

                        {/* Bottom Copyright Bar */}
                        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
                            <p>© {new Date().getFullYear()} MarketPilot. All rights reserved.</p>
                            <p className="text-muted-foreground">Built for Philippine Retailers, Online Sellers & Modern MSMEs.</p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}