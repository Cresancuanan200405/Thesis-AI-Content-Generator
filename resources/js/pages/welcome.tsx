import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Calendar,
    CalendarDays,
    Check,
    ChevronDown,
    Download,
    FolderKanban,
    ImageIcon,
    Layers,
    Megaphone,
    Menu,
    Package,
    ShieldCheck,
    Sliders,
    Tag,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import SectionReveal from '@/components/section-reveal';
import { Button } from '@/components/ui/button';
import { dashboard, home, login, register } from '@/routes';

/*
|--------------------------------------------------------------------------
| Hero Section Scenic Image Manifest (Verified Local Assets)
|--------------------------------------------------------------------------
*/

const HERO_IMAGES = [
    '/Hero%20Section%20Images/1.png',
    '/Hero%20Section%20Images/2.jpg',
    '/Hero%20Section%20Images/3.jpg',
    '/Hero%20Section%20Images/4.jpg',
];

/*
|--------------------------------------------------------------------------
| Welcome Component
|--------------------------------------------------------------------------
*/

export default function Welcome() {
    const { auth } = usePage<{ auth?: { user?: any } }>().props;

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState<string>('hero-showcase');

    // Hero Section Scenic Image Crossfade State
    const [currentHeroImageIndex, setCurrentHeroImageIndex] = useState(0);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    // Smooth section navigation handler
    const handleNavClick = (
        e: React.MouseEvent<HTMLAnchorElement>,
        sectionId: string,
    ) => {
        e.preventDefault();
        setActiveSection(sectionId);
        if (mobileMenuOpen) {
            setMobileMenuOpen(false);
        }
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({
                behavior: prefersReducedMotion ? 'auto' : 'smooth',
                block: 'start',
            });
        }
        if (typeof window !== 'undefined' && window.history.pushState) {
            window.history.pushState(null, '', `#${sectionId}`);
        }
    };

    // Brand Logo Click Handler (redirects to /dashboard if authenticated, or smooth-scrolls to top hero section if on landing page)
    const handleBrandClick = (e: React.MouseEvent) => {
        if (mobileMenuOpen) {
            setMobileMenuOpen(false);
        }
        if (!auth?.user) {
            e.preventDefault();
            setActiveSection('hero-showcase');
            const hero = document.getElementById('hero-showcase');
            if (hero) {
                hero.scrollIntoView({
                    behavior: prefersReducedMotion ? 'auto' : 'smooth',
                    block: 'start',
                });
            } else {
                window.scrollTo({
                    top: 0,
                    behavior: prefersReducedMotion ? 'auto' : 'smooth',
                });
            }
            if (typeof window !== 'undefined' && window.history.pushState) {
                window.history.pushState(null, '', '/');
            }
        }
    };

    // Interactive Aspect Ratio Tab in Studio Section
    const [activeRatio, setActiveRatio] = useState<
        '1:1' | '4:5' | '9:16' | '16:9' | '4:3'
    >('1:1');

    // Interactive Calendar Showcase State
    const [calendarCategory, setCalendarCategory] = useState<
        'all' | 'regular' | 'special_non_working'
    >('all');

    // Interactive FAQ
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

    const handleImageError = (failedIndex: number) => {
        console.warn(
            `[MarketPilot] Hero background image failed to load: ${HERO_IMAGES[failedIndex]}. Skipping to next asset.`,
        );
        setCurrentHeroImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    };

    // Preload next image in sequence
    useEffect(() => {
        const nextIndex = (currentHeroImageIndex + 1) % HERO_IMAGES.length;
        const nextImg = new Image();
        nextImg.src = HERO_IMAGES[nextIndex];
    }, [currentHeroImageIndex]);

    // Preload all scenic background images and listen to reduced motion
    useEffect(() => {
        HERO_IMAGES.forEach((src) => {
            const img = new Image();
            img.src = src;
        });

        if (typeof window === 'undefined') {
            return;
        }

        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mq.matches);

        const handler = (e: MediaQueryListEvent) => {
            setPrefersReducedMotion(e.matches);
        };

        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    // Automatic scenic slideshow rotation
    useEffect(() => {
        if (prefersReducedMotion) {
            return;
        }

        const interval = setInterval(() => {
            setCurrentHeroImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
        }, 6000);

        return () => clearInterval(interval);
    }, [prefersReducedMotion]);

    // Automatic Operating-System Theme Synchronization
    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const syncTheme = () => {
            const isDark = mq.matches;
            document.documentElement.classList.toggle('dark', isDark);
            document.documentElement.style.colorScheme = isDark
                ? 'dark'
                : 'light';
        };

        syncTheme();
        mq.addEventListener('change', syncTheme);
        return () => mq.removeEventListener('change', syncTheme);
    }, []);

    // Scroll listener for sticky header background intensity
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Mobile menu body scroll lock
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);

    // Active Section Scrollspy using IntersectionObserver
    useEffect(() => {
        const sectionIds = [
            'hero-showcase',
            'how-it-works',
            'catalog-engine',
            'calendar-engine',
            'studio-engine',
            'exports-engine',
            'workspace-plan',
            'faq',
        ];

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            {
                rootMargin: '-20% 0px -55% 0px',
                threshold: 0,
            },
        );

        sectionIds.forEach((id) => {
            const el = document.getElementById(id);
            if (el) {
                observer.observe(el);
            }
        });

        // Handle initial hash in URL if direct link visited
        if (window.location.hash) {
            const targetId = window.location.hash.replace('#', '');
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                setTimeout(() => {
                    targetEl.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                    });
                }, 100);
            }
        }

        return () => observer.disconnect();
    }, []);

    // Verified Philippine Holidays from PhilippineHolidayService
    const officialCalendarDates = [
        {
            name: "New Year's Day",
            date: 'January 1',
            type: 'Regular Holiday',
            marketingNote:
                'New Year promotional kickoffs and retail campaigns.',
        },
        {
            name: 'Araw ng Kagitingan (Day of Valor)',
            date: 'April 9',
            type: 'Regular Holiday',
            marketingNote:
                'National observance and summer travel retail promotions.',
        },
        {
            name: 'Labor Day (Araw ng Manggagawa)',
            date: 'May 1',
            type: 'Regular Holiday',
            marketingNote: 'Mid-year sales and worker appreciation promotions.',
        },
        {
            name: 'Independence Day (Araw ng Kalayaan)',
            date: 'June 12',
            type: 'Regular Holiday',
            marketingNote:
                'Philippine heritage themes and local artisanal showcases.',
        },
        {
            name: 'Ninoy Aquino Day',
            date: 'August 21',
            type: 'Special Non-Working',
            marketingNote:
                'Mid-quarter retail and long-weekend shopping opportunities.',
        },
        {
            name: 'National Heroes Day',
            date: 'Last Monday of August',
            type: 'Regular Holiday',
            marketingNote: 'Annual late-August long-weekend retail sales.',
        },
        {
            name: 'All Saints’ Day (Undas)',
            date: 'November 1',
            type: 'Special Non-Working',
            marketingNote:
                'Homecoming travel, food packages, and seasonal provisions.',
        },
        {
            name: 'Christmas Day (Pasko)',
            date: 'December 25',
            type: 'Regular Holiday',
            marketingNote:
                'Peak holiday gift packages and 13th-month bonus spending.',
        },
        {
            name: 'Rizal Day',
            date: 'December 30',
            type: 'Regular Holiday',
            marketingNote: 'Year-end clearances and countdown promotions.',
        },
    ];

    const filteredDates = officialCalendarDates.filter((item) => {
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

    // The five supported aspect ratios verified in StoreDesignRequest
    const aspectRatios = [
        {
            id: '1:1',
            name: 'Square',
            ratio: '1:1',
            bestFor: 'Instagram Feeds & E-Commerce Grid Cards',
            resolution: '1024 × 1024',
            description:
                'Balanced composition with centered product placement and clear headline hierarchy.',
        },
        {
            id: '4:5',
            name: 'Portrait Social',
            ratio: '4:5',
            bestFor: 'Facebook & Instagram Mobile Feed Placements',
            resolution: '1024 × 1280',
            description:
                'Vertical orientation designed to occupy maximum screen real estate on mobile newsfeeds.',
        },
        {
            id: '9:16',
            name: 'Vertical Story',
            ratio: '9:16',
            bestFor: 'Stories, Reels & TikTok Campaigns',
            resolution: '1024 × 1792',
            description:
                'Full-screen mobile display adhering to platform UI safe-areas at the top and bottom.',
        },
        {
            id: '16:9',
            name: 'Landscape Banner',
            ratio: '16:9',
            bestFor: 'Website Hero Banners, YouTube & Display Ads',
            resolution: '1792 × 1024',
            description:
                'Wide landscape format pairing prominent products with promotional text and call-to-actions.',
        },
        {
            id: '4:3',
            name: 'Standard Display',
            ratio: '4:3',
            bestFor: 'Storefront Listings, Email Newsletters & Print',
            resolution: '1280 × 960',
            description:
                'Versatile commercial proportions suitable for desktop store banners and digital circulars.',
        },
    ] as const;

    const faqs = [
        {
            q: 'How does MarketPilot use my catalog product photos?',
            a: 'MarketPilot uses your uploaded product image as the reference for generation. The system composes a commercial background around your product while preserving its shape, color, and packaging details.',
        },
        {
            q: 'How does the Philippine retail calendar work?',
            a: 'The platform tracks Philippine regular national holidays, special non-working days, and 15/30 payday sales cycles. This allows you to plan marketing campaigns ahead of major retail windows.',
        },
        {
            q: 'Which aspect ratios can I generate?',
            a: 'The platform supports five advertising formats: Square (1:1), Portrait Social (4:5), Vertical Story (9:16), Landscape Banner (16:9), and Standard Display (4:3). Each layout applies safe-area rules to protect copy and product focal points.',
        },
        {
            q: 'What formats can I download, and what is the SVG option?',
            a: 'You can export in PNG, JPEG, and SVG. The SVG option wraps your high-resolution creative in an SVG document container with embedded coordinates. It does not convert pixel artwork into vector outlines.',
        },
        {
            q: 'What is included in the Studio Pro Workspace?',
            a: 'All accounts receive full workspace access: product catalog management, the Philippine holiday calendar, 13 industry visual styles, 5 aspect ratios, campaign and design history management, and multi-format exports.',
        },
        {
            q: 'Who owns the commercial rights to generated creatives?',
            a: 'You retain full commercial ownership of all marketing visuals generated in your workspace. You may use them freely across social ads, e-commerce stores, physical banners, and print collateral.',
        },
    ];

    return (
        <>
            <Head title="MarketPilot — AI Marketing Automation & Creative Engine">
                <style>{`
                    html {
                        scroll-behavior: smooth;
                        scroll-padding-top: 5.5rem;
                        zoom: 0.9;
                    }
                    @media (prefers-reduced-motion: reduce) {
                        html {
                            scroll-behavior: auto;
                        }
                    }
                `}</style>
            </Head>

            <div className="relative min-h-screen overflow-x-clip bg-background text-foreground transition-colors duration-200 selection:bg-primary/20 selection:text-primary">
                {/* Global Ambient Glow (No rounded-full, naturally diffuse) */}
                <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                    <div className="absolute -top-40 left-1/4 h-[550px] w-[550px] bg-primary/10 blur-[160px] dark:bg-primary/15" />
                    <div className="absolute top-1/3 -right-32 h-[500px] w-[500px] bg-blue-500/10 blur-[150px] dark:bg-blue-500/15" />
                    <div className="absolute top-2/3 -left-32 h-[450px] w-[450px] bg-purple-500/10 blur-[150px] dark:bg-purple-500/15" />
                </div>

                {/* ==========================================================
                    TOP FLOATING NAVIGATION (SOLE PILL-SHAPED CONTAINER)
                =========================================================== */}

                <header className="pointer-events-none fixed inset-x-0 top-4 z-50 px-4 sm:top-6 sm:px-6">
                    <div className="pointer-events-auto mx-auto max-w-5xl">
                        {/* ONLY ELEMENT ON PAGE PERMITTED TO BE PILL-SHAPED (rounded-full) */}
                        <div
                            className={`flex items-center justify-between rounded-full border px-4 py-2 shadow-2xl backdrop-blur-xl transition-all duration-300 sm:px-6 sm:py-2.5 ${
                                isScrolled
                                    ? 'border-white/20 bg-black/80 text-white shadow-black/40'
                                    : 'border-white/15 bg-black/50 text-white shadow-black/25'
                            }`}
                        >
                            {/* Brand Logo with Restrained Radius (rounded-md) */}
                            <Link
                                href={auth?.user ? dashboard().url : '/'}
                                onClick={handleBrandClick}
                                className="group flex cursor-pointer items-center gap-2.5 focus:outline-none"
                            >
                                <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-white/10 p-1 shadow-sm ring-1 ring-white/20 transition-transform group-hover:scale-105">
                                    <AppLogoIcon className="size-full rounded-sm object-contain" />
                                </div>
                                <span className="text-sm font-bold tracking-tight text-white sm:text-base">
                                    MarketPilot
                                </span>
                            </Link>

                            {/* Desktop Navigation Links with Restrained Rectangular Highlights (rounded-md) */}
                            <nav className="hidden items-center gap-1 text-xs font-semibold md:flex">
                                <a
                                    href="#how-it-works"
                                    onClick={(e) =>
                                        handleNavClick(e, 'how-it-works')
                                    }
                                    className={`rounded-md px-3 py-1.5 transition-colors ${
                                        activeSection === 'how-it-works'
                                            ? 'bg-white/20 font-bold text-white'
                                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    Workflow
                                </a>
                                <a
                                    href="#catalog-engine"
                                    onClick={(e) =>
                                        handleNavClick(e, 'catalog-engine')
                                    }
                                    className={`rounded-md px-3 py-1.5 transition-colors ${
                                        activeSection === 'catalog-engine'
                                            ? 'bg-white/20 font-bold text-white'
                                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    Catalog
                                </a>
                                <a
                                    href="#calendar-engine"
                                    onClick={(e) =>
                                        handleNavClick(e, 'calendar-engine')
                                    }
                                    className={`rounded-md px-3 py-1.5 transition-colors ${
                                        activeSection === 'calendar-engine'
                                            ? 'bg-white/20 font-bold text-white'
                                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    PH Calendar
                                </a>
                                <a
                                    href="#studio-engine"
                                    onClick={(e) =>
                                        handleNavClick(e, 'studio-engine')
                                    }
                                    className={`rounded-md px-3 py-1.5 transition-colors ${
                                        activeSection === 'studio-engine'
                                            ? 'bg-white/20 font-bold text-white'
                                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    AI Studio
                                </a>
                                <a
                                    href="#exports-engine"
                                    onClick={(e) =>
                                        handleNavClick(e, 'exports-engine')
                                    }
                                    className={`rounded-md px-3 py-1.5 transition-colors ${
                                        activeSection === 'exports-engine'
                                            ? 'bg-white/20 font-bold text-white'
                                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    Exports
                                </a>
                                <a
                                    href="#workspace-plan"
                                    onClick={(e) =>
                                        handleNavClick(e, 'workspace-plan')
                                    }
                                    className={`rounded-md px-3 py-1.5 transition-colors ${
                                        activeSection === 'workspace-plan'
                                            ? 'bg-white/20 font-bold text-white'
                                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    Workspace
                                </a>
                                <a
                                    href="#faq"
                                    onClick={(e) => handleNavClick(e, 'faq')}
                                    className={`rounded-md px-3 py-1.5 transition-colors ${
                                        activeSection === 'faq'
                                            ? 'bg-white/20 font-bold text-white'
                                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    FAQ
                                </a>
                            </nav>

                            {/* Right Controls (Manual toggle removed; purely auth links) */}
                            <div className="flex items-center gap-2">
                                {auth?.user ? (
                                    <Button
                                        asChild
                                        size="sm"
                                        className="h-8 rounded-md bg-white px-3.5 text-xs font-bold text-zinc-950 shadow-sm transition-all hover:bg-white/90 active:scale-95"
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
                                            className="h-8 rounded-md px-3 text-xs font-medium text-white/85 hover:bg-white/10 hover:text-white"
                                        >
                                            <Link href={login()}>Log in</Link>
                                        </Button>
                                        <Button
                                            asChild
                                            size="sm"
                                            className="h-8 rounded-md bg-white px-3.5 text-xs font-bold text-zinc-950 shadow-sm transition-all hover:bg-white/90 active:scale-95"
                                        >
                                            <Link href={register()}>
                                                Get Started Free
                                            </Link>
                                        </Button>
                                    </div>
                                )}

                                {/* Mobile Menu Button */}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        setMobileMenuOpen((prev) => !prev)
                                    }
                                    aria-label="Toggle navigation"
                                    className="h-8 w-8 rounded-md text-white hover:bg-white/10 md:hidden"
                                >
                                    {mobileMenuOpen ? (
                                        <X className="h-4 w-4" />
                                    ) : (
                                        <Menu className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Mobile Navigation Dropdown & Backdrop */}
                        {mobileMenuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
                                    onClick={() => setMobileMenuOpen(false)}
                                    aria-hidden="true"
                                />
                                <div className="relative z-50 mt-2 space-y-3 rounded-xl border border-white/20 bg-zinc-950/95 p-4 text-white shadow-2xl backdrop-blur-2xl md:hidden">
                                    <nav className="flex flex-col space-y-1 text-sm font-semibold">
                                        <a
                                            href="#how-it-works"
                                            onClick={(e) =>
                                                handleNavClick(
                                                    e,
                                                    'how-it-works',
                                                )
                                            }
                                            className="rounded-md px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white"
                                        >
                                            Workflow
                                        </a>
                                        <a
                                            href="#catalog-engine"
                                            onClick={(e) =>
                                                handleNavClick(
                                                    e,
                                                    'catalog-engine',
                                                )
                                            }
                                            className="rounded-md px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white"
                                        >
                                            Catalog
                                        </a>
                                        <a
                                            href="#calendar-engine"
                                            onClick={(e) =>
                                                handleNavClick(
                                                    e,
                                                    'calendar-engine',
                                                )
                                            }
                                            className="rounded-md px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white"
                                        >
                                            Philippine Calendar
                                        </a>
                                        <a
                                            href="#studio-engine"
                                            onClick={(e) =>
                                                handleNavClick(
                                                    e,
                                                    'studio-engine',
                                                )
                                            }
                                            className="rounded-md px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white"
                                        >
                                            AI Creative Studio
                                        </a>
                                        <a
                                            href="#exports-engine"
                                            onClick={(e) =>
                                                handleNavClick(
                                                    e,
                                                    'exports-engine',
                                                )
                                            }
                                            className="rounded-md px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white"
                                        >
                                            Exports
                                        </a>
                                        <a
                                            href="#workspace-plan"
                                            onClick={(e) =>
                                                handleNavClick(
                                                    e,
                                                    'workspace-plan',
                                                )
                                            }
                                            className="rounded-md px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white"
                                        >
                                            Workspace Access
                                        </a>
                                        <a
                                            href="#faq"
                                            onClick={(e) =>
                                                handleNavClick(e, 'faq')
                                            }
                                            className="rounded-md px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white"
                                        >
                                            FAQ
                                        </a>
                                    </nav>

                                    <div className="flex flex-col gap-2 border-t border-white/15 pt-3">
                                        {auth?.user ? (
                                            <Button
                                                asChild
                                                className="w-full rounded-md bg-white font-bold text-zinc-950 hover:bg-white/90"
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
                                                    className="w-full rounded-md border-white/20 bg-white/5 font-semibold text-white hover:bg-white/10"
                                                >
                                                    <Link href={login()}>
                                                        Log in
                                                    </Link>
                                                </Button>
                                                <Button
                                                    asChild
                                                    className="w-full rounded-md bg-white font-bold text-zinc-950 shadow-lg shadow-black/20 hover:bg-white/90"
                                                >
                                                    <Link href={register()}>
                                                        Get Started Free
                                                    </Link>
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </header>

                <main>
                    {/* ==========================================================
                        1. SCENIC HERO SHOWCASE
                    =========================================================== */}
                    <section
                        id="hero-showcase"
                        className="relative isolate flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-zinc-950 px-4 pt-28 pb-16 text-center sm:px-6 lg:px-8"
                    >
                        {/* Scenic Background Images Crossfade Layer */}
                        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-zinc-950">
                            {HERO_IMAGES.map((imgSrc, index) => {
                                const isActive =
                                    currentHeroImageIndex === index;

                                return (
                                    <img
                                        key={imgSrc}
                                        src={imgSrc}
                                        alt=""
                                        aria-hidden="true"
                                        onError={() => handleImageError(index)}
                                        className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ease-in-out ${
                                            isActive
                                                ? 'opacity-100'
                                                : 'pointer-events-none opacity-0'
                                        }`}
                                        loading={index === 0 ? 'eager' : 'lazy'}
                                    />
                                );
                            })}
                        </div>

                        {/* Atmospheric Gradient Overlays */}
                        <div
                            className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/75 via-black/40 to-black/90"
                            aria-hidden="true"
                        />
                        <div
                            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-t from-background via-background/40 to-transparent"
                            aria-hidden="true"
                        />

                        {/* Centered Hero Content */}
                        <div className="relative z-20 mx-auto flex max-w-4xl flex-col items-center">
                            {/* Plain text eyebrow */}
                            <p className="mb-3 text-xs font-bold tracking-widest text-white/75 uppercase sm:mb-4 sm:text-sm">
                                Philippine Retail Marketing Platform
                            </p>

                            {/* Main Headline */}
                            <h1 className="max-w-4xl text-4xl leading-[1.1] font-extrabold tracking-tight text-white drop-shadow-md sm:text-6xl lg:text-7xl">
                                Transform Your Products Into Campaign-Ready
                                Visuals
                            </h1>

                            {/* One Concise Supporting Sentence */}
                            <p className="mt-5 max-w-2xl text-base leading-relaxed font-normal text-white/85 drop-shadow-sm sm:mt-6 sm:text-lg">
                                Generate promotional marketing creatives
                                grounded in your authentic product catalog,
                                brand identity, and Philippine retail event
                                cycles.
                            </p>

                            {/* Primary and Secondary Calls to Action (Restrained rounded-lg) */}
                            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:mt-10">
                                <Button
                                    asChild
                                    size="lg"
                                    className="h-11 cursor-pointer gap-2 rounded-md bg-white px-6 text-sm font-bold text-zinc-950 shadow-xl transition-all duration-200 hover:scale-[1.02] hover:bg-white/90 active:scale-95"
                                >
                                    <Link
                                        href={
                                            auth?.user
                                                ? dashboard()
                                                : register()
                                        }
                                    >
                                        <span>
                                            {auth?.user
                                                ? 'Open Dashboard'
                                                : 'Get Started Free'}
                                        </span>
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>

                                <Button
                                    asChild
                                    variant="outline"
                                    size="lg"
                                    className="h-11 cursor-pointer gap-2 rounded-md border-white/25 bg-white/10 px-6 text-sm font-semibold text-white shadow-sm backdrop-blur-md transition-all duration-200 hover:scale-[1.02] hover:border-white/40 hover:bg-white/20 active:scale-95"
                                >
                                    <a
                                        href="#how-it-works"
                                        onClick={(e) =>
                                            handleNavClick(e, 'how-it-works')
                                        }
                                    >
                                        <Layers className="h-4 w-4 text-white/90" />
                                        <span>See How It Works</span>
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </section>

                    {/* ==========================================================
                        2. HOW MARKETPILOT WORKS — COOL BLUE / INDIGO GLASS
                    =========================================================== */}
                    <section
                        id="how-it-works"
                        className="relative scroll-mt-24 border-b border-blue-500/10 bg-gradient-to-b from-background via-blue-500/[0.03] to-background py-16 md:py-24 dark:border-blue-500/20 dark:via-blue-950/20"
                    >
                        {/* Section-specific ambient glow */}
                        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                            <div className="absolute top-1/2 left-1/2 h-[450px] w-[600px] -translate-x-1/2 -translate-y-1/2 bg-blue-500/10 blur-[150px] dark:bg-blue-600/15" />
                        </div>

                        <SectionReveal
                            prefersReducedMotion={prefersReducedMotion}
                            className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
                        >
                            {({ getStaggerStyle }) => (
                                <>
                                    <div
                                        style={getStaggerStyle(0)}
                                        className="mx-auto mb-12 max-w-2xl space-y-2 text-center"
                                    >
                                        <p className="text-xs font-bold tracking-widest text-blue-600 uppercase dark:text-blue-400">
                                            Product Architecture
                                        </p>
                                        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                                            How MarketPilot Works
                                        </h2>
                                        <p className="text-xs text-muted-foreground sm:text-sm">
                                            A structured workflow connecting
                                            your real inventory to
                                            calendar-driven marketing campaigns.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {[
                                            {
                                                step: '01',
                                                title: 'Onboarding & Business Profile',
                                                desc: 'Configure your industry category, store description, brand tone presets, and optional business logo.',
                                                icon: FolderKanban,
                                                color: 'text-blue-600 dark:text-blue-400',
                                                bg: 'bg-blue-500/10',
                                            },
                                            {
                                                step: '02',
                                                title: 'Product Catalog',
                                                desc: 'Manage your products with titles, retail prices, descriptions, and reference product photos.',
                                                icon: Package,
                                                color: 'text-indigo-600 dark:text-indigo-400',
                                                bg: 'bg-indigo-500/10',
                                            },
                                            {
                                                step: '03',
                                                title: 'Philippine Holiday Calendar',
                                                desc: 'Review upcoming regular holidays, special non-working days, and 15/30 payday retail cycles.',
                                                icon: CalendarDays,
                                                color: 'text-sky-600 dark:text-sky-400',
                                                bg: 'bg-sky-500/10',
                                            },
                                            {
                                                step: '04',
                                                title: 'Campaign Configuration',
                                                desc: 'Pair specific products with holiday dates, set marketing objectives, and define promotional timelines.',
                                                icon: Megaphone,
                                                color: 'text-blue-600 dark:text-blue-400',
                                                bg: 'bg-blue-500/10',
                                            },
                                            {
                                                step: '05',
                                                title: 'AI Marketing Studio',
                                                desc: 'Synthesize commercial scenes across 5 standard aspect ratios with safe-area rules and brand styling.',
                                                icon: ImageIcon,
                                                color: 'text-indigo-600 dark:text-indigo-400',
                                                bg: 'bg-indigo-500/10',
                                            },
                                            {
                                                step: '06',
                                                title: 'My Designs & Export',
                                                desc: 'Review saved designs, regenerate variations, and download files in PNG, JPEG, or SVG-wrapped formats.',
                                                icon: Download,
                                                color: 'text-blue-600 dark:text-blue-400',
                                                bg: 'bg-blue-500/10',
                                            },
                                        ].map((item, idx) => {
                                            const Icon = item.icon;

                                            return (
                                                <div
                                                    key={item.step}
                                                    style={getStaggerStyle(
                                                        idx + 1,
                                                    )}
                                                    className="group flex flex-col justify-between rounded-xl border border-blue-500/15 bg-white/70 p-5 shadow-lg shadow-blue-500/[0.02] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/40 hover:shadow-blue-500/10 dark:border-blue-500/20 dark:bg-zinc-900/65 dark:shadow-black/40"
                                                >
                                                    <div>
                                                        <div className="mb-3 flex items-center justify-between">
                                                            <span className="rounded-md border border-blue-500/20 bg-blue-500/5 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-700 dark:text-blue-300">
                                                                STAGE{' '}
                                                                {item.step}
                                                            </span>
                                                            <div
                                                                className={`flex h-8 w-8 items-center justify-center rounded-md ${item.bg} ${item.color}`}
                                                            >
                                                                <Icon className="h-4 w-4" />
                                                            </div>
                                                        </div>

                                                        <h3 className="text-sm font-bold text-foreground transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                                            {item.title}
                                                        </h3>
                                                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                                                            {item.desc}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </SectionReveal>
                    </section>

                    {/* ==========================================================
                        3. PRODUCT CATALOG — TEAL / EMERALD GLASS
                    =========================================================== */}
                    <section
                        id="catalog-engine"
                        className="relative scroll-mt-24 border-b border-emerald-500/10 bg-gradient-to-b from-background via-emerald-500/[0.03] to-background py-16 md:py-24 dark:border-emerald-500/20 dark:via-emerald-950/20"
                    >
                        {/* Section-specific ambient glow */}
                        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                            <div className="absolute top-1/2 right-1/4 h-[400px] w-[500px] bg-emerald-500/10 blur-[150px] dark:bg-teal-600/15" />
                        </div>

                        <SectionReveal
                            prefersReducedMotion={prefersReducedMotion}
                            className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
                        >
                            {({ getStaggerStyle }) => (
                                <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
                                    <div
                                        style={getStaggerStyle(0)}
                                        className="space-y-4 lg:col-span-6"
                                    >
                                        <p className="text-xs font-bold tracking-widest text-teal-600 uppercase dark:text-teal-400">
                                            Catalog Reference
                                        </p>
                                        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                            Grounding visual generation in your
                                            real products.
                                        </h2>
                                        <p className="text-sm leading-relaxed text-muted-foreground">
                                            MarketPilot uses your catalog
                                            photos, product names, and pricing
                                            to guide creative generation.
                                            Instead of generating arbitrary
                                            objects, the system composes
                                            commercial environments around your
                                            product's authentic visual
                                            reference.
                                        </p>

                                        <div className="space-y-2.5 pt-2 text-xs">
                                            <div className="flex items-start gap-2.5 font-medium text-foreground">
                                                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                                <span>
                                                    Reference images guide the
                                                    AI to preserve key packaging
                                                    and product characteristics.
                                                </span>
                                            </div>
                                            <div className="flex items-start gap-2.5 font-medium text-foreground">
                                                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                                <span>
                                                    Product names and retail
                                                    prices are incorporated
                                                    directly into campaign
                                                    headlines and taglines.
                                                </span>
                                            </div>
                                            <div className="flex items-start gap-2.5 font-medium text-foreground">
                                                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                                <span>
                                                    Safe-area rules ensure
                                                    visual focal points and text
                                                    remain unobstructed.
                                                </span>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <Button
                                                asChild
                                                size="sm"
                                                className="h-10 rounded-lg px-4 text-xs font-bold shadow-md shadow-emerald-500/20"
                                            >
                                                <Link href={register()}>
                                                    Set Up Your Product Catalog
                                                    &rarr;
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>

                                    <div
                                        style={getStaggerStyle(1)}
                                        className="lg:col-span-6"
                                    >
                                        <div className="rounded-xl border border-emerald-500/20 bg-white/75 p-6 shadow-xl shadow-emerald-500/[0.02] backdrop-blur-xl dark:border-emerald-500/20 dark:bg-zinc-900/70 dark:shadow-black/40">
                                            <div className="mb-4 border-b border-emerald-500/20 pb-3">
                                                <div className="flex items-center gap-2">
                                                    <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                                    <h3 className="text-sm font-bold text-foreground">
                                                        Illustration: Catalog
                                                        Grounding Process
                                                    </h3>
                                                </div>
                                            </div>

                                            <div className="space-y-3 text-xs">
                                                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3.5 dark:bg-emerald-500/10">
                                                    <p className="font-semibold text-foreground">
                                                        1. Catalog Input
                                                    </p>
                                                    <p className="mt-1 text-muted-foreground">
                                                        Upload your item with
                                                        product title, retail
                                                        price, and a clear
                                                        product photo.
                                                    </p>
                                                </div>

                                                <div className="rounded-lg border border-teal-500/30 bg-teal-500/10 p-3.5">
                                                    <p className="font-semibold text-teal-800 dark:text-teal-300">
                                                        2. Scene Orchestration
                                                    </p>
                                                    <p className="mt-1 text-muted-foreground">
                                                        The system builds
                                                        contextual commercial
                                                        backdrops around your
                                                        product reference,
                                                        applying chosen
                                                        lighting, theme, and
                                                        copy rules.
                                                    </p>
                                                </div>

                                                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3.5 dark:bg-emerald-500/10">
                                                    <p className="font-semibold text-foreground">
                                                        3. Campaign-Ready Output
                                                    </p>
                                                    <p className="mt-1 text-muted-foreground">
                                                        The result is rendered
                                                        into your selected
                                                        aspect ratio with
                                                        safe-area margins for
                                                        text placement.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </SectionReveal>
                    </section>

                    {/* ==========================================================
                        4. PHILIPPINE RETAIL CALENDAR — WARM AMBER / CORAL GLASS
                    =========================================================== */}
                    <section
                        id="calendar-engine"
                        className="relative scroll-mt-24 border-b border-amber-500/10 bg-gradient-to-b from-background via-amber-500/[0.03] to-background py-16 md:py-24 dark:border-amber-500/20 dark:via-amber-950/20"
                    >
                        {/* Section-specific ambient glow */}
                        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                            <div className="absolute top-1/2 left-1/3 h-[450px] w-[550px] bg-amber-500/10 blur-[150px] dark:bg-amber-600/15" />
                        </div>

                        <SectionReveal
                            prefersReducedMotion={prefersReducedMotion}
                            className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
                        >
                            {({ getStaggerStyle }) => (
                                <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
                                    {/* Left Side: Explanation */}
                                    <div
                                        style={getStaggerStyle(0)}
                                        className="space-y-4 lg:col-span-5"
                                    >
                                        <p className="text-xs font-bold tracking-widest text-amber-600 uppercase dark:text-amber-400">
                                            Philippine Calendar
                                        </p>
                                        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                            Aligned with Philippine holidays and
                                            payday cycles.
                                        </h2>
                                        <p className="text-sm leading-relaxed text-muted-foreground">
                                            Philippine retail consumer spending
                                            clusters around national holidays,
                                            declared non-working dates, and
                                            15/30 payday intervals. MarketPilot
                                            tracks these dates to help
                                            businesses plan creative promotions
                                            ahead of time.
                                        </p>

                                        <div className="space-y-2 pt-2">
                                            <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
                                                <span className="h-2 w-2 rounded-[2px] bg-blue-500" />
                                                <span>
                                                    Regular National Holidays
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
                                                <span className="h-2 w-2 rounded-[2px] bg-amber-500" />
                                                <span>
                                                    Special Non-Working Days
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
                                                <span className="h-2 w-2 rounded-[2px] bg-emerald-500" />
                                                <span>
                                                    Movable Islamic Holidays
                                                    (Subject to Proclamation)
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
                                                <span className="h-2 w-2 rounded-[2px] bg-purple-500" />
                                                <span>
                                                    Mid-Month and End-of-Month
                                                    (15/30) Payday Cycles
                                                </span>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <Button
                                                asChild
                                                size="sm"
                                                className="h-10 rounded-lg px-4 text-xs font-bold shadow-md shadow-amber-500/20"
                                            >
                                                <Link href={register()}>
                                                    Explore Retail Calendar
                                                    &rarr;
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Right Side: Holiday Reference Cards */}
                                    <div
                                        style={getStaggerStyle(1)}
                                        className="lg:col-span-7"
                                    >
                                        <div className="rounded-xl border border-amber-500/20 bg-white/75 p-6 shadow-xl shadow-amber-500/[0.02] backdrop-blur-xl dark:border-amber-500/20 dark:bg-zinc-900/70 dark:shadow-black/40">
                                            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-5 w-5 text-amber-500" />
                                                    <h3 className="text-sm font-bold text-foreground">
                                                        Official Philippine
                                                        Holidays
                                                    </h3>
                                                </div>

                                                {/* Rectangular Filter Tabs (rounded-md, No pill) */}
                                                <div className="flex items-center gap-1 text-[11px] font-semibold">
                                                    {(
                                                        [
                                                            'all',
                                                            'regular',
                                                            'special_non_working',
                                                        ] as const
                                                    ).map((cat) => (
                                                        <button
                                                            key={cat}
                                                            type="button"
                                                            onClick={() =>
                                                                setCalendarCategory(
                                                                    cat,
                                                                )
                                                            }
                                                            className={`cursor-pointer rounded-md px-2.5 py-1 transition-all ${
                                                                calendarCategory ===
                                                                cat
                                                                    ? 'bg-amber-500 text-white shadow-xs'
                                                                    : 'border border-amber-500/20 bg-white/60 text-zinc-600 hover:text-foreground dark:bg-zinc-800/60 dark:text-zinc-300'
                                                            }`}
                                                        >
                                                            {cat === 'all'
                                                                ? 'All Dates'
                                                                : cat ===
                                                                    'regular'
                                                                  ? 'Regular'
                                                                  : 'Special'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid gap-3 sm:grid-cols-2">
                                                {filteredDates.map((evt) => (
                                                    <div
                                                        key={evt.name}
                                                        className="flex flex-col justify-between rounded-lg border border-amber-500/15 bg-white/60 p-3.5 shadow-2xs backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-500/40 dark:border-amber-500/20 dark:bg-zinc-800/60"
                                                    >
                                                        <div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-mono text-xs font-bold text-primary">
                                                                    {evt.date}
                                                                </span>
                                                                {/* 4 & 5. Regular & Special Non-Working Badges - Crisp Rectangular (rounded-md) */}
                                                                <span
                                                                    className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                                                                        evt.type ===
                                                                        'Regular Holiday'
                                                                            ? 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300'
                                                                            : 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300'
                                                                    }`}
                                                                >
                                                                    {evt.type}
                                                                </span>
                                                            </div>
                                                            <p className="mt-1.5 text-xs font-bold text-foreground">
                                                                {evt.name}
                                                            </p>
                                                            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                                                                {
                                                                    evt.marketingNote
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </SectionReveal>
                    </section>

                    {/* ==========================================================
                        5. AI MARKETING STUDIO — VIOLET / ELECTRIC BLUE GLASS
                    =========================================================== */}
                    <section
                        id="studio-engine"
                        className="relative scroll-mt-24 border-b border-violet-500/10 bg-gradient-to-b from-background via-violet-500/[0.03] to-background py-16 md:py-24 dark:border-violet-500/20 dark:via-violet-950/20"
                    >
                        {/* Section-specific ambient glow */}
                        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                            <div className="absolute top-1/2 left-1/2 h-[500px] w-[600px] -translate-x-1/2 -translate-y-1/2 bg-violet-500/10 blur-[160px] dark:bg-violet-600/15" />
                        </div>

                        <SectionReveal
                            prefersReducedMotion={prefersReducedMotion}
                            className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
                        >
                            {({ getStaggerStyle }) => (
                                <>
                                    <div
                                        style={getStaggerStyle(0)}
                                        className="mx-auto max-w-3xl space-y-3 text-center"
                                    >
                                        <p className="text-xs font-bold tracking-widest text-violet-600 uppercase dark:text-violet-400">
                                            Creative Studio
                                        </p>
                                        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                                            Five Supported Aspect Ratios &
                                            Studio Settings
                                        </h2>
                                        <p className="text-sm text-muted-foreground md:text-base">
                                            Configure campaigns with goal
                                            objectives, tagline copy modes, 13
                                            industry visual styles, and
                                            safe-area margins across five
                                            standard ratios.
                                        </p>
                                    </div>

                                    {/* Aspect Ratio Switcher Tabs (Rectangular rounded-md, No pill) */}
                                    <div
                                        style={getStaggerStyle(1)}
                                        className="mt-8 flex flex-wrap items-center justify-center gap-2"
                                    >
                                        {aspectRatios.map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() =>
                                                    setActiveRatio(item.id)
                                                }
                                                className={`cursor-pointer rounded-md px-3.5 py-1.5 text-xs font-bold transition-all ${
                                                    activeRatio === item.id
                                                        ? 'bg-violet-600 text-white shadow-xs'
                                                        : 'border border-violet-500/20 bg-white/70 text-zinc-600 hover:border-violet-500/40 hover:text-foreground dark:bg-zinc-800/60 dark:text-zinc-300'
                                                }`}
                                            >
                                                <span>{item.name}</span>
                                                <span className="ml-1.5 font-mono text-[10px] opacity-75">
                                                    ({item.ratio})
                                                </span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Selected Aspect Ratio Showcase */}
                                    <div
                                        style={getStaggerStyle(2)}
                                        className="mx-auto mt-8 max-w-4xl"
                                    >
                                        {aspectRatios
                                            .filter((r) => r.id === activeRatio)
                                            .map((current) => (
                                                <div
                                                    key={current.id}
                                                    className="grid gap-6 rounded-xl border border-violet-500/20 bg-white/75 p-6 shadow-xl shadow-violet-500/[0.03] backdrop-blur-xl sm:grid-cols-12 sm:items-center dark:border-violet-500/20 dark:bg-zinc-900/70 dark:shadow-black/40"
                                                >
                                                    <div className="space-y-3 sm:col-span-7">
                                                        <div className="flex items-center gap-2">
                                                            <span className="rounded-md bg-violet-500/10 px-2 py-0.5 font-mono text-xs font-bold text-violet-700 dark:text-violet-300">
                                                                {current.ratio}
                                                            </span>
                                                            <span className="font-mono text-xs text-muted-foreground">
                                                                {
                                                                    current.resolution
                                                                }{' '}
                                                                px
                                                            </span>
                                                        </div>
                                                        <h3 className="text-lg font-bold text-foreground">
                                                            {current.name}{' '}
                                                            Layout
                                                        </h3>
                                                        <p className="text-xs leading-relaxed text-muted-foreground">
                                                            {
                                                                current.description
                                                            }
                                                        </p>

                                                        <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3 dark:bg-violet-500/10">
                                                            <p className="text-[11px] font-bold text-foreground">
                                                                Recommended
                                                                Channel
                                                                Placement:
                                                            </p>
                                                            <p className="text-xs font-medium text-violet-700 dark:text-violet-300">
                                                                {
                                                                    current.bestFor
                                                                }
                                                            </p>
                                                        </div>

                                                        <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-muted-foreground">
                                                            <span className="inline-flex items-center gap-1 rounded-md border border-violet-500/20 bg-white/60 px-2 py-1 dark:bg-zinc-800/60">
                                                                <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                                                Safe-Area
                                                                Margins
                                                            </span>
                                                            <span className="inline-flex items-center gap-1 rounded-md border border-violet-500/20 bg-white/60 px-2 py-1 dark:bg-zinc-800/60">
                                                                <Tag className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                                                Tagline
                                                                Compositing
                                                            </span>
                                                            <span className="inline-flex items-center gap-1 rounded-md border border-violet-500/20 bg-white/60 px-2 py-1 dark:bg-zinc-800/60">
                                                                <Sliders className="h-3 w-3 text-violet-600 dark:text-violet-400" />
                                                                Render Styles
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-center sm:col-span-5">
                                                        <div className="relative flex w-full max-w-[240px] items-center justify-center rounded-lg border-2 border-dashed border-violet-500/40 bg-violet-500/5 p-6 text-center dark:bg-violet-500/10">
                                                            <div className="space-y-1">
                                                                <ImageIcon className="mx-auto h-8 w-8 text-violet-600/70 dark:text-violet-400/70" />
                                                                <p className="font-mono text-xs font-bold text-foreground">
                                                                    {
                                                                        current.ratio
                                                                    }
                                                                </p>
                                                                <p className="text-[10px] text-muted-foreground">
                                                                    Aspect Grid
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>

                                    {/* Studio Controls Overview */}
                                    <div
                                        style={getStaggerStyle(3)}
                                        className="mt-10 grid gap-4 sm:grid-cols-3"
                                    >
                                        <div className="rounded-xl border border-violet-500/15 bg-white/70 p-5 shadow-sm backdrop-blur-xl dark:border-violet-500/20 dark:bg-zinc-900/65">
                                            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                                <Sliders className="h-4 w-4" />
                                            </div>
                                            <h4 className="text-xs font-bold text-foreground sm:text-sm">
                                                13 Industry Profiles
                                            </h4>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Pre-configured prompt styles for
                                                retail, food & beverage, beauty,
                                                fashion, tech, and other
                                                commercial categories.
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-violet-500/15 bg-white/70 p-5 shadow-sm backdrop-blur-xl dark:border-violet-500/20 dark:bg-zinc-900/65">
                                            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                                <Tag className="h-4 w-4" />
                                            </div>
                                            <h4 className="text-xs font-bold text-foreground sm:text-sm">
                                                Tagline Modes
                                            </h4>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Choose between AI-suggested
                                                promotional copy, custom
                                                headline text, or clean
                                                background-only generation.
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-violet-500/15 bg-white/70 p-5 shadow-sm backdrop-blur-xl dark:border-violet-500/20 dark:bg-zinc-900/65">
                                            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                <ShieldCheck className="h-4 w-4" />
                                            </div>
                                            <h4 className="text-xs font-bold text-foreground sm:text-sm">
                                                Safe-Area Protection
                                            </h4>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Compositing buffers protect text
                                                and key product areas from being
                                                covered by platform interface
                                                overlays.
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </SectionReveal>
                    </section>

                    {/* ==========================================================
                        6. MY DESIGNS & EXPORT — CYAN / SKY BLUE GLASS
                    =========================================================== */}
                    <section
                        id="exports-engine"
                        className="relative scroll-mt-24 border-b border-cyan-500/10 bg-gradient-to-b from-background via-cyan-500/[0.03] to-background py-16 md:py-24 dark:border-cyan-500/20 dark:via-cyan-950/20"
                    >
                        {/* Section-specific ambient glow */}
                        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                            <div className="absolute top-1/2 left-1/3 h-[450px] w-[550px] bg-cyan-500/10 blur-[150px] dark:bg-cyan-600/15" />
                        </div>

                        <SectionReveal
                            prefersReducedMotion={prefersReducedMotion}
                            className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
                        >
                            {({ getStaggerStyle }) => (
                                <>
                                    <div
                                        style={getStaggerStyle(0)}
                                        className="mx-auto max-w-3xl space-y-3 text-center"
                                    >
                                        <p className="text-xs font-bold tracking-widest text-cyan-600 uppercase dark:text-cyan-400">
                                            Design Management & Downloads
                                        </p>
                                        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                                            My Designs and Export Options
                                        </h2>
                                        <p className="text-sm text-muted-foreground md:text-base">
                                            Review your generated design
                                            history, regenerate variations,
                                            organize campaigns, and export in
                                            three supported formats.
                                        </p>
                                    </div>

                                    <div className="mt-12 grid gap-4 sm:grid-cols-3">
                                        <div
                                            style={getStaggerStyle(1)}
                                            className="rounded-xl border border-cyan-500/20 bg-white/70 p-5 shadow-lg shadow-cyan-500/[0.02] backdrop-blur-xl dark:border-cyan-500/20 dark:bg-zinc-900/65 dark:shadow-black/40"
                                        >
                                            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                                                <Download className="h-4 w-4" />
                                            </div>
                                            <h4 className="text-xs font-bold text-foreground sm:text-sm">
                                                PNG Export
                                            </h4>
                                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                                Lossless image export preserving
                                                full color fidelity and
                                                resolution across all supported
                                                aspect ratios.
                                            </p>
                                        </div>

                                        <div
                                            style={getStaggerStyle(2)}
                                            className="rounded-xl border border-cyan-500/20 bg-white/70 p-5 shadow-lg shadow-cyan-500/[0.02] backdrop-blur-xl dark:border-cyan-500/20 dark:bg-zinc-900/65 dark:shadow-black/40"
                                        >
                                            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                                <Download className="h-4 w-4" />
                                            </div>
                                            <h4 className="text-xs font-bold text-foreground sm:text-sm">
                                                JPEG Export
                                            </h4>
                                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                                Compact file size optimized for
                                                social media uploads, mobile
                                                messaging, and web performance.
                                            </p>
                                        </div>

                                        <div
                                            style={getStaggerStyle(3)}
                                            className="rounded-xl border border-cyan-500/20 bg-white/70 p-5 shadow-lg shadow-cyan-500/[0.02] backdrop-blur-xl dark:border-cyan-500/20 dark:bg-zinc-900/65 dark:shadow-black/40"
                                        >
                                            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400">
                                                <Download className="h-4 w-4" />
                                            </div>
                                            <h4 className="text-xs font-bold text-foreground sm:text-sm">
                                                SVG Container Export
                                            </h4>
                                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                                Embeds the high-resolution
                                                creative in an SVG document
                                                container with embedded
                                                dimensions for layout tools.
                                                Note: this wraps the raster
                                                image and does not vectorize
                                                artwork.
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </SectionReveal>
                    </section>

                    {/* ==========================================================
                        7. WORKSPACE & USAGE — ROSE / MAGENTA GLASS
                    =========================================================== */}
                    <section
                        id="workspace-plan"
                        className="relative scroll-mt-24 border-b border-rose-500/10 bg-gradient-to-b from-background via-rose-500/[0.03] to-background py-16 md:py-24 dark:border-rose-500/20 dark:via-rose-950/20"
                    >
                        {/* Section-specific ambient glow */}
                        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                            <div className="absolute top-1/2 left-1/2 h-[450px] w-[550px] -translate-x-1/2 -translate-y-1/2 bg-rose-500/10 blur-[150px] dark:bg-rose-600/15" />
                        </div>

                        <SectionReveal
                            prefersReducedMotion={prefersReducedMotion}
                            className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
                        >
                            {({ getStaggerStyle }) => (
                                <>
                                    <div
                                        style={getStaggerStyle(0)}
                                        className="mx-auto max-w-2xl space-y-3 text-center"
                                    >
                                        <p className="text-xs font-bold tracking-widest text-rose-600 uppercase dark:text-rose-400">
                                            Workspace Access
                                        </p>
                                        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                                            Studio Pro Workspace
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            Full commercial access to the
                                            platform's creative generation
                                            tools, catalog staging, and
                                            Philippine retail calendar engine.
                                        </p>
                                    </div>

                                    <div
                                        style={getStaggerStyle(1)}
                                        className="mx-auto mt-12 max-w-3xl"
                                    >
                                        <div className="rounded-xl border border-rose-500/20 bg-white/80 p-6 shadow-xl shadow-rose-500/[0.03] backdrop-blur-xl sm:p-8 dark:border-rose-500/25 dark:bg-zinc-900/75 dark:shadow-black/40">
                                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rose-500/20 pb-5">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-xl font-bold text-foreground">
                                                            Studio Pro Workspace
                                                        </h3>
                                                        <span className="text-xs font-bold tracking-wide text-emerald-600 dark:text-emerald-400">
                                                            Included Access
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        Standard workspace
                                                        configuration for
                                                        retailers and e-commerce
                                                        sellers.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Features from SubscriptionController */}
                                            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                                {[
                                                    {
                                                        title: 'AI Marketing Visual Synthesis',
                                                        desc: 'Generate commercial creatives using prompt orchestration.',
                                                    },
                                                    {
                                                        title: 'Product Catalog Staging',
                                                        desc: 'Store inventory items and reference photography.',
                                                    },
                                                    {
                                                        title: 'Philippine Holiday Calendar',
                                                        desc: 'Curated regular, special, and payday retail dates.',
                                                    },
                                                    {
                                                        title: '13 Industry Visual Profiles',
                                                        desc: 'Tailored styles for retail, F&B, beauty, fashion, and tech.',
                                                    },
                                                    {
                                                        title: 'Smart Tagline Normalization',
                                                        desc: 'Automated headline placement and safe-area compositing.',
                                                    },
                                                    {
                                                        title: '5 Advertising Aspect Ratios',
                                                        desc: '1:1 Square, 4:5 Portrait, 9:16 Story, 16:9 Banner, and 4:3 Display.',
                                                    },
                                                    {
                                                        title: 'Campaign & Design History',
                                                        desc: 'Save designs, track favorites, and regenerate variations.',
                                                    },
                                                    {
                                                        title: 'Multi-Format Asset Downloads',
                                                        desc: 'Download creatives in PNG, JPEG, and SVG containers.',
                                                    },
                                                ].map((feat) => (
                                                    <div
                                                        key={feat.title}
                                                        className="flex items-start gap-2.5 rounded-lg border border-rose-500/15 bg-white/60 p-2.5 text-xs backdrop-blur-md dark:border-rose-500/20 dark:bg-zinc-800/60"
                                                    >
                                                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                                        <div>
                                                            <p className="font-bold text-foreground">
                                                                {feat.title}
                                                            </p>
                                                            <p className="mt-0.5 text-muted-foreground">
                                                                {feat.desc}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-rose-500/20 pt-6">
                                                <p className="text-xs text-muted-foreground">
                                                    Create an account to start
                                                    configuring your store
                                                    profile and product catalog.
                                                </p>
                                                <Button
                                                    asChild
                                                    className="h-10 rounded-lg px-6 text-xs font-bold shadow-md shadow-rose-500/20"
                                                >
                                                    <Link href={register()}>
                                                        Create Account &rarr;
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </SectionReveal>
                    </section>

                    {/* ==========================================================
                        8. FREQUENTLY ASKED QUESTIONS — BLUE / VIOLET GLASS
                    =========================================================== */}
                    <section
                        id="faq"
                        className="relative scroll-mt-24 border-b border-indigo-500/10 bg-gradient-to-b from-background via-indigo-500/[0.03] to-background py-16 md:py-24 dark:border-indigo-500/20 dark:via-indigo-950/20"
                    >
                        {/* Section-specific ambient glow */}
                        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                            <div className="absolute top-1/2 left-1/2 h-[450px] w-[550px] -translate-x-1/2 -translate-y-1/2 bg-indigo-500/10 blur-[150px] dark:bg-indigo-600/15" />
                        </div>

                        <SectionReveal
                            prefersReducedMotion={prefersReducedMotion}
                            className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8"
                        >
                            {({ getStaggerStyle }) => (
                                <>
                                    <div
                                        style={getStaggerStyle(0)}
                                        className="mb-10 space-y-2 text-center"
                                    >
                                        <p className="text-xs font-bold tracking-widest text-indigo-600 uppercase dark:text-indigo-400">
                                            Knowledge Base
                                        </p>
                                        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                            Frequently Asked Questions
                                        </h2>
                                    </div>

                                    <div
                                        style={getStaggerStyle(1)}
                                        className="space-y-3"
                                    >
                                        {faqs.map((faq, idx) => (
                                            <div
                                                key={faq.q}
                                                className="overflow-hidden rounded-xl border border-indigo-500/20 bg-white/75 backdrop-blur-xl transition-all hover:border-indigo-500/40 dark:border-indigo-500/20 dark:bg-zinc-900/65"
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
                                                    className="flex w-full items-center justify-between p-4 text-left text-xs font-bold text-foreground transition-colors hover:text-indigo-600 sm:p-5 sm:text-sm dark:hover:text-indigo-400"
                                                >
                                                    <span>{faq.q}</span>
                                                    <ChevronDown
                                                        className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                                                            openFaqIndex === idx
                                                                ? 'rotate-180 text-indigo-600 dark:text-indigo-400'
                                                                : 'text-muted-foreground'
                                                        }`}
                                                    />
                                                </button>

                                                {openFaqIndex === idx && (
                                                    <div className="animate-in border-t border-indigo-500/15 px-4 pt-1 pb-5 text-xs leading-relaxed text-muted-foreground duration-150 fade-in sm:px-5">
                                                        {faq.a}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </SectionReveal>
                    </section>

                    {/* ==========================================================
                        9. FINAL CALL TO ACTION
                    =========================================================== */}
                    <section className="bg-background py-16 md:py-20">
                        <SectionReveal
                            prefersReducedMotion={prefersReducedMotion}
                            className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8"
                        >
                            {({ getStaggerStyle }) => (
                                <div
                                    style={getStaggerStyle(0)}
                                    className="space-y-5 rounded-xl border border-primary/20 bg-white/80 p-8 text-center shadow-xl shadow-primary/[0.03] backdrop-blur-xl md:p-12 dark:border-primary/25 dark:bg-zinc-900/80 dark:shadow-black/40"
                                >
                                    <p className="text-xs font-bold tracking-widest text-primary uppercase">
                                        Get Started
                                    </p>
                                    <h2 className="mx-auto max-w-2xl text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                                        Start generating seasonal marketing
                                        creatives.
                                    </h2>
                                    <p className="mx-auto max-w-lg text-xs text-muted-foreground sm:text-sm">
                                        Ground your campaign visuals in official
                                        Philippine holidays and your authentic
                                        product catalog.
                                    </p>
                                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                                        <Button
                                            asChild
                                            size="lg"
                                            className="h-11 gap-2 rounded-lg px-6 text-xs font-bold shadow-sm"
                                        >
                                            <Link href={register()}>
                                                <span>
                                                    Get Started for Free
                                                </span>
                                                <ArrowRight className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button
                                            asChild
                                            variant="outline"
                                            size="lg"
                                            className="h-11 rounded-lg px-5 text-xs font-semibold shadow-none"
                                        >
                                            <Link href={login()}>
                                                Sign In to Workspace
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </SectionReveal>
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
                                <Link
                                    href={auth?.user ? dashboard().url : '/'}
                                    onClick={handleBrandClick}
                                    className="group inline-flex cursor-pointer items-center gap-2.5 focus:outline-none"
                                >
                                    <div className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-card p-0.5 shadow-xs ring-1 ring-border/80 group-hover:ring-primary/40 dark:bg-zinc-900 dark:ring-white/10">
                                        <AppLogoIcon className="size-full rounded-md object-contain" />
                                    </div>
                                    <span className="text-sm font-bold tracking-tight text-foreground">
                                        MarketPilot
                                    </span>
                                </Link>
                                <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
                                    AI-powered retail marketing automation &
                                    creative visual generator aligned with
                                    official Philippine national holidays and
                                    commercial retail cycles.
                                </p>
                                <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-500">
                                    <span className="h-2 w-2 rounded-[2px] bg-emerald-500" />
                                    <span>
                                        Philippine Holiday Engine Active &
                                        Synced
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
                                            href="#studio-engine"
                                            className="transition-colors hover:text-primary"
                                        >
                                            AI Creative Studio
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#catalog-engine"
                                            className="transition-colors hover:text-primary"
                                        >
                                            Product Catalog
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#calendar-engine"
                                            className="transition-colors hover:text-primary"
                                        >
                                            Philippine Retail Calendar
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#exports-engine"
                                            className="transition-colors hover:text-primary"
                                        >
                                            Exports & Downloads
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#workspace-plan"
                                            className="transition-colors hover:text-primary"
                                        >
                                            Studio Pro Workspace
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
                                            Movable Islamic Dates
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#calendar-engine"
                                            className="transition-colors hover:text-primary"
                                        >
                                            Payday Retail Cycles
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            {/* Column 3: Account & Navigation */}
                            <div className="space-y-3">
                                <p className="text-[11px] font-bold tracking-wider text-foreground uppercase">
                                    Account & Navigation
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
                                        <a
                                            href="#how-it-works"
                                            className="transition-colors hover:text-primary"
                                        >
                                            System Workflow
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Bottom Copyright Bar */}
                        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-[11px] sm:flex-row">
                            <p>
                                &copy; {new Date().getFullYear()} MarketPilot.
                                All rights reserved.
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
