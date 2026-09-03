import { Link } from '@inertiajs/react';
import {
    CalendarDays,
    CheckCircle2,
    Layers,
    Megaphone,
    Moon,
    Package,
    Sparkles,
    Sun,
    Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = window.localStorage.getItem('theme');
            const isDark =
                saved === 'dark' ||
                (!saved &&
                    window.matchMedia('(prefers-color-scheme: dark)').matches);
            setTheme(isDark ? 'dark' : 'light');

            if (isDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }, []);

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);

        if (typeof window !== 'undefined') {
            window.localStorage.setItem('theme', next);

            if (next === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-3 text-foreground selection:bg-primary/20 selection:text-primary sm:p-5 lg:p-8">
            {/* Ambient Fixed Background Glow Orbs */}
            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-32 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[140px] dark:bg-primary/20" />
                <div className="absolute top-1/3 -right-32 h-[450px] w-[450px] rounded-full bg-blue-500/12 blur-[130px] dark:bg-blue-500/15" />
                <div className="absolute -bottom-32 -left-32 h-[450px] w-[450px] rounded-full bg-purple-500/12 blur-[130px] dark:bg-purple-500/15" />
            </div>

            <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/25 bg-card/85 shadow-2xl backdrop-blur-2xl lg:grid-cols-[0.95fr_1.05fr] dark:border-white/10 dark:bg-card/85">
                {/* ============================================================
                    LEFT PANEL — Hero-matched Glassmorphic Overview Panel
                ============================================================= */}
                <div
                    className="relative hidden flex-col justify-between overflow-hidden border-r border-white/15 p-7 lg:flex dark:border-white/10"
                    style={{
                        background:
                            'linear-gradient(145deg, rgba(24, 24, 27, 0.95) 0%, rgba(18, 18, 20, 0.98) 60%, rgba(9, 9, 11, 1) 100%)',
                    }}
                >
                    {/* Inner Ambient Glows */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0"
                    >
                        <div
                            className="absolute -top-24 -left-24 h-72 w-72 rounded-full opacity-35"
                            style={{
                                background:
                                    'radial-gradient(circle, rgba(37,99,235,0.6) 0%, transparent 70%)',
                            }}
                        />
                        <div
                            className="absolute -right-20 bottom-1/4 h-64 w-64 rounded-full opacity-25"
                            style={{
                                background:
                                    'radial-gradient(circle, rgba(147,51,234,0.5) 0%, transparent 70%)',
                            }}
                        />
                        <div
                            className="absolute inset-0 opacity-[0.03]"
                            style={{
                                backgroundImage:
                                    'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                                backgroundSize: '32px 32px',
                            }}
                        />
                    </div>

                    {/* Top: Logo with Hero Studio Badge */}
                    <div className="relative z-10 flex items-center justify-between">
                        <Link
                            href={home()}
                            className="group flex items-center gap-2.5"
                        >
                            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-card p-1 shadow-md ring-1 ring-border/80 transition-transform duration-200 group-hover:scale-105 dark:bg-zinc-900/90 dark:ring-white/15">
                                <AppLogoIcon className="size-full rounded-lg object-contain" />
                                <div className="absolute inset-0 -z-10 rounded-xl bg-primary/25 blur-sm opacity-70 transition-all group-hover:opacity-100 group-hover:blur-md" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-extrabold tracking-tight text-white">
                                    MarketPilot
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full border border-blue-400/30 bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                                    <Sparkles className="h-2.5 w-2.5 text-blue-400" />
                                    AI Studio
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Middle: Hero Typography & System Pillars */}
                    <div className="relative z-10 my-auto space-y-4 py-4">
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-[10px] font-bold tracking-wider text-blue-300 uppercase backdrop-blur-md">
                            <Sparkles className="h-3 w-3 text-blue-400" />
                            Retail Intelligence Engine
                        </div>

                        <h1 className="text-2xl leading-snug font-extrabold tracking-tight text-white">
                            Automate seasonal visuals and marketing campaigns{' '}
                            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
                                in seconds.
                            </span>
                        </h1>

                        <p className="text-xs leading-relaxed text-zinc-300/80">
                            Connect your product catalog with official
                            Philippine national holidays, retail payday cycles,
                            and custom brand guidelines.
                        </p>

                        {/* Connected 4-Step System Workflow Mini-Grid */}
                        <div className="grid grid-cols-2 gap-2 pt-2">
                            {[
                                {
                                    step: '01',
                                    title: 'Product Catalog',
                                    icon: Package,
                                    color: 'text-purple-400',
                                    bg: 'bg-purple-500/15 border-purple-400/20',
                                },
                                {
                                    step: '02',
                                    title: 'PH Holiday Intel',
                                    icon: CalendarDays,
                                    color: 'text-amber-400',
                                    bg: 'bg-amber-500/15 border-amber-400/20',
                                },
                                {
                                    step: '03',
                                    title: 'OpenAI Studio',
                                    icon: Sparkles,
                                    color: 'text-blue-400',
                                    bg: 'bg-blue-500/15 border-blue-400/20',
                                },
                                {
                                    step: '04',
                                    title: 'Campaign Pipeline',
                                    icon: Megaphone,
                                    color: 'text-emerald-400',
                                    bg: 'bg-emerald-500/15 border-emerald-400/20',
                                },
                            ].map((item) => {
                                const Icon = item.icon;

                                return (
                                    <div
                                        key={item.step}
                                        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2 shadow-xs backdrop-blur-sm"
                                    >
                                        <div
                                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${item.bg}`}
                                        >
                                            <Icon
                                                className={`h-3 w-3 ${item.color}`}
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-[11px] font-bold text-white">
                                                {item.title}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom: Trust & Feature Badges */}
                    <div className="relative z-10 grid grid-cols-3 gap-2 border-t border-white/10 pt-2 text-center text-[11px]">
                        <div className="rounded-xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm">
                            <div className="text-xs font-extrabold text-white">
                                Official
                            </div>
                            <div className="mt-0.5 text-[9px] text-zinc-400">
                                PH Holidays
                            </div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm">
                            <div className="text-xs font-extrabold text-white">
                                &lt; 15s
                            </div>
                            <div className="mt-0.5 text-[9px] text-zinc-400">
                                Generation
                            </div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm">
                            <div className="text-xs font-extrabold text-white">
                                PNG & SVG
                            </div>
                            <div className="mt-0.5 text-[9px] text-zinc-400">
                                Vector Scale
                            </div>
                        </div>
                    </div>
                </div>

                {/* ============================================================
                    RIGHT PANEL — Form Area (Glassmorphic)
                ============================================================= */}
                <div className="relative flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                    {/* Top Right Theme Toggle */}
                    <div className="absolute top-5 right-5 flex items-center gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={toggleTheme}
                            aria-label="Toggle theme"
                            className="h-8 w-8 cursor-pointer rounded-xl text-muted-foreground transition-all hover:bg-muted/80 hover:text-foreground"
                        >
                            {theme === 'dark' ? (
                                <Sun className="h-4 w-4 text-amber-400" />
                            ) : (
                                <Moon className="h-4 w-4" />
                            )}
                        </Button>
                    </div>

                    <div className="mx-auto w-full max-w-md">
                        <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
                            <Link
                                href={home()}
                                className="group inline-flex items-center gap-2 font-medium transition-transform active:scale-95"
                            >
                                <div className="relative flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-card p-0.5 shadow-xs ring-1 ring-border/80 dark:bg-zinc-900 dark:ring-white/10">
                                    <AppLogoIcon className="size-full rounded-lg object-contain" />
                                </div>
                                <span className="text-xs font-bold tracking-tight text-foreground uppercase">
                                    MarketPilot
                                </span>
                            </Link>
                        </div>

                        <div className="space-y-1 text-left">
                            <h2 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                                {title}
                            </h2>
                            {description && (
                                <p className="text-xs leading-relaxed text-muted-foreground">
                                    {description}
                                </p>
                            )}
                        </div>

                        <div className="mt-5">{children}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
