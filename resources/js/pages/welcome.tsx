import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    Check,
    Menu,
    Palette,
    PlayCircle,
    Sparkles,
    Wand2,
    X,
} from 'lucide-react';
import { useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { dashboard, home, login, register } from '@/routes';

const navItems = [
    { label: 'Product', href: '#product' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
];

const features = [
    {
        icon: Wand2,
        title: 'Campaign generator',
        description:
            'Turn a fresh idea into a launch-ready campaign brief, content angles, and creative direction in minutes.',
    },
    {
        icon: Palette,
        title: 'Brand consistency',
        description:
            'Keep your messaging, tones, and visual identity aligned across every channel without reviewing every asset by hand.',
    },
    {
        icon: CalendarDays,
        title: 'Content calendar',
        description:
            'Plan launches, post ideas, and creative requirements in one collaborative system your team can actually follow.',
    },
];

const steps = [
    'Share your brand goals and audience',
    'Generate campaign concepts and creative briefs',
    'Review, schedule, and publish with confidence',
];

const logos = ['Northstar', 'Luma', 'Arc Labs', 'Signal', 'Motive'];

export default function Welcome() {
    const { auth } = usePage().props;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <>
            <Head title="AI Marketing Automation" />

            <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.18),_transparent_30%),linear-gradient(180deg,#050b14_0%,#0a1220_100%)] text-slate-100">
                <header className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
                    <nav className="rounded-full border border-white/10 bg-slate-950/55 px-4 py-3 shadow-[0_20px_80px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:px-6">
                        <div className="flex items-center justify-between gap-4">
                            <Link
                                href={home()}
                                className="flex items-center gap-3"
                            >
                                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-slate-900 text-white shadow-sm">
                                    <AppLogoIcon className="h-5 w-5 fill-current" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold tracking-[0.18em] text-slate-300 uppercase">
                                        MarketPilot
                                    </p>
                                </div>
                            </Link>

                            <div className="hidden items-center gap-8 md:flex">
                                {navItems.map((item) => (
                                    <a
                                        key={item.label}
                                        href={item.href}
                                        className="text-sm font-medium text-slate-300 transition hover:text-white"
                                    >
                                        {item.label}
                                    </a>
                                ))}
                            </div>

                            <div className="hidden items-center gap-3 md:flex">
                                {auth.user ? (
                                    <Button asChild size="sm">
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
                                            className="text-slate-200 hover:text-white"
                                        >
                                            <Link href={login()}>Log in</Link>
                                        </Button>
                                        <Button asChild size="sm">
                                            <Link href={register()}>
                                                Start free
                                            </Link>
                                        </Button>
                                    </>
                                )}
                            </div>

                            <button
                                type="button"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-900 text-slate-200 md:hidden"
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

                        {mobileMenuOpen && (
                            <div className="mt-4 space-y-3 border-t border-white/10 pt-4 md:hidden">
                                {navItems.map((item) => (
                                    <a
                                        key={item.label}
                                        href={item.href}
                                        className="block text-sm font-medium text-slate-300"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {item.label}
                                    </a>
                                ))}
                                <div className="flex gap-3 pt-2">
                                    {auth.user ? (
                                        <Button asChild className="w-full">
                                            <Link href={dashboard()}>
                                                Open dashboard
                                            </Link>
                                        </Button>
                                    ) : (
                                        <>
                                            <Button
                                                asChild
                                                variant="outline"
                                                className="flex-1"
                                            >
                                                <Link href={login()}>
                                                    Log in
                                                </Link>
                                            </Button>
                                            <Button asChild className="flex-1">
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

                <main className="mx-auto max-w-7xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
                    <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
                        <div className="max-w-xl">
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-100">
                                <Sparkles className="h-4 w-4" />
                                Built for modern marketing teams
                            </div>

                            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                                Turn campaign ideas into
                                <span className="block text-blue-400">
                                    steady growth.
                                </span>
                            </h1>

                            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
                                Launch a smarter marketing engine with
                                AI-powered creative guidance, reusable brand
                                direction, and a calendar your team can act on
                                every week.
                            </p>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <Button
                                    asChild
                                    size="lg"
                                    className="rounded-full px-6"
                                >
                                    <Link href={register()}>
                                        Start your free plan
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    variant="outline"
                                    size="lg"
                                    className="rounded-full border-white/10 bg-white/5 px-6 text-white hover:bg-white/10"
                                >
                                    <Link href={login()}>
                                        <PlayCircle className="mr-2 h-4 w-4" />
                                        View dashboard
                                    </Link>
                                </Button>
                            </div>

                            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-slate-300">
                                <div className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-emerald-400" />
                                    No credit card required
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-emerald-400" />
                                    Setup in under 10 minutes
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-blue-500/30 via-indigo-500/20 to-cyan-400/20 blur-3xl" />
                            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 p-4 shadow-[0_30px_80px_rgba(15,23,42,0.55)] sm:p-6">
                                <div className="rounded-[1.5rem] border border-white/10 bg-slate-950 p-4 text-slate-50">
                                    <div className="mb-5 flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs tracking-[0.2em] text-slate-400 uppercase">
                                                Campaign workspace
                                            </p>
                                            <h2 className="mt-2 text-xl font-semibold">
                                                Launch sprint
                                            </h2>
                                        </div>
                                        <div className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300">
                                            12 assets ready
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                                            <div className="flex items-center justify-between text-sm text-slate-300">
                                                <span>Brand kit</span>
                                                <span>92% aligned</span>
                                            </div>
                                            <div className="mt-3 h-2 rounded-full bg-slate-800">
                                                <div className="h-2 w-[92%] rounded-full bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400" />
                                            </div>
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="rounded-2xl bg-slate-900/70 p-4 ring-1 ring-slate-800">
                                                <p className="text-xs tracking-[0.2em] text-slate-400 uppercase">
                                                    Content mix
                                                </p>
                                                <p className="mt-4 text-3xl font-semibold text-white">
                                                    28
                                                </p>
                                                <p className="mt-1 text-sm text-slate-400">
                                                    ideas this week
                                                </p>
                                            </div>
                                            <div className="rounded-2xl bg-blue-500/10 p-4 ring-1 ring-blue-500/30">
                                                <p className="text-xs tracking-[0.2em] text-blue-200 uppercase">
                                                    Next launch
                                                </p>
                                                <p className="mt-4 text-2xl font-semibold text-white">
                                                    June 18
                                                </p>
                                                <p className="mt-1 text-sm text-blue-100">
                                                    Paid social + email
                                                </p>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl bg-slate-900/70 p-4 ring-1 ring-slate-800">
                                            <div className="flex items-center justify-between text-sm text-slate-300">
                                                <span>Weekly output</span>
                                                <span>4 posts</span>
                                            </div>
                                            <div className="mt-4 flex gap-2">
                                                {[48, 66, 88, 100].map(
                                                    (width, index) => (
                                                        <div
                                                            key={width}
                                                            className="flex-1 rounded-t-xl bg-gradient-to-t from-blue-500 via-indigo-500 to-cyan-400"
                                                            style={{
                                                                height: `${width / 2}px`,
                                                                opacity:
                                                                    0.55 +
                                                                    index *
                                                                        0.15,
                                                            }}
                                                        />
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mt-20 border-t border-slate-200/80 pt-8">
                        <div className="flex flex-col gap-4 text-center">
                            <p className="text-sm font-medium tracking-[0.2em] text-slate-500 uppercase">
                                Trusted by teams shipping fast
                            </p>
                            <div className="grid grid-cols-2 gap-4 text-center text-lg font-semibold text-slate-400 sm:grid-cols-3 lg:grid-cols-5">
                                {logos.map((name) => (
                                    <div
                                        key={name}
                                        className="rounded-full border border-slate-200 bg-white/80 px-4 py-3"
                                    >
                                        {name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section id="how-it-works" className="mt-24">
                        <div className="mx-auto max-w-2xl text-center">
                            <p className="text-sm font-semibold tracking-[0.2em] text-blue-600 uppercase">
                                How it works
                            </p>
                            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                                One system for strategy, content, and execution.
                            </h2>
                        </div>

                        <div className="mt-12 grid gap-6 lg:grid-cols-3">
                            {steps.map((step, index) => (
                                <div
                                    key={step}
                                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_35px_rgba(15,23,42,0.05)]"
                                >
                                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                                        0{index + 1}
                                    </div>
                                    <p className="text-lg font-medium text-slate-900">
                                        {step}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section
                        id="product"
                        className="mt-24 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)] sm:p-8 lg:p-10"
                    >
                        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                            <div>
                                <p className="text-sm font-semibold tracking-[0.2em] text-blue-600 uppercase">
                                    Product overview
                                </p>
                                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                                    Keep every campaign aligned with your brand.
                                </h2>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-3">
                                {features.map(
                                    ({ icon: Icon, title, description }) => (
                                        <div
                                            key={title}
                                            className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                                        >
                                            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-slate-900">
                                                {title}
                                            </h3>
                                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                                {description}
                                            </p>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>
                    </section>

                    <section id="features" className="mt-24">
                        <div className="mx-auto max-w-2xl text-center">
                            <p className="text-sm font-semibold tracking-[0.2em] text-blue-600 uppercase">
                                Why teams switch
                            </p>
                            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                                Marketing operations that feel simple to run.
                            </h2>
                        </div>

                        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                            {[
                                'AI-generated campaign briefs',
                                'Reusable brand guidelines',
                                'Approval-ready content planning',
                                'Shared calendar visibility',
                            ].map((item) => (
                                <div
                                    key={item}
                                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                                >
                                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                        <Check className="h-4 w-4" />
                                    </div>
                                    <p className="text-base font-medium text-slate-900">
                                        {item}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section
                        id="pricing"
                        className="mt-24 rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-600 to-indigo-600 p-8 text-white shadow-[0_35px_90px_rgba(59,130,246,0.35)] sm:p-12"
                    >
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-xl">
                                <p className="text-sm font-semibold tracking-[0.2em] text-blue-100 uppercase">
                                    Built to grow with you
                                </p>
                                <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                                    From your first campaign to your next
                                    expansion.
                                </h2>
                            </div>

                            <div className="flex items-baseline gap-2 text-4xl font-semibold">
                                $39
                                <span className="text-base text-blue-100">
                                    / month
                                </span>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Button
                                asChild
                                variant="secondary"
                                className="rounded-full bg-white text-slate-900 hover:bg-slate-100"
                            >
                                <Link href={register()}>Create account</Link>
                            </Button>
                            <Button
                                asChild
                                variant="ghost"
                                className="rounded-full border border-white/40 text-white hover:bg-white/10"
                            >
                                <Link href={login()}>Already using it?</Link>
                            </Button>
                        </div>
                    </section>
                </main>

                <footer className="border-t border-slate-200/80 bg-white/60 backdrop-blur-sm">
                    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-600 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white">
                                <AppLogoIcon className="h-4 w-4 fill-current" />
                            </div>
                            MarketPilot
                        </div>
                        <div className="flex flex-wrap gap-5">
                            <a href="#product">Product</a>
                            <a href="#how-it-works">How it works</a>
                            <a href="#features">Features</a>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
