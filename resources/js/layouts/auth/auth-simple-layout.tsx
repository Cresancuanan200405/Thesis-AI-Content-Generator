import { Link } from '@inertiajs/react';
import { CalendarDays, CheckCircle2, Sparkles, Zap } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-svh items-center justify-center bg-background p-4 text-foreground sm:p-6 lg:p-10">
            {/* Ambient Background Glow */}
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_60%)]"
            />

            <div className="card-elevated mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl overflow-hidden rounded-3xl bg-card shadow-2xl lg:grid-cols-[0.95fr_1.05fr]">

                {/* ============================================================
                    LEFT PANEL — Hero-matched cinematic dark design panel
                ============================================================= */}
                <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border/70 p-8 lg:flex"
                    style={{
                        background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1829 40%, #101828 100%)',
                    }}
                >
                    {/* Layered Background Effects matching hero section */}
                    <div aria-hidden className="pointer-events-none absolute inset-0">
                        {/* Primary blue radial glow */}
                        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-30"
                            style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.55) 0%, transparent 70%)' }} />
                        {/* Secondary accent glow */}
                        <div className="absolute top-1/2 -right-24 h-80 w-80 rounded-full opacity-20"
                            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.5) 0%, transparent 70%)' }} />
                        {/* Bottom warm accent */}
                        <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full opacity-15"
                            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.4) 0%, transparent 70%)' }} />
                        {/* Grid pattern overlay */}
                        <div className="absolute inset-0 opacity-[0.04]"
                            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                    </div>

                    {/* Floating Particle Dots */}
                    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                        {[
                            { top: '15%', left: '20%', size: 3, opacity: 0.6, delay: '0s' },
                            { top: '28%', left: '75%', size: 2, opacity: 0.4, delay: '0.8s' },
                            { top: '55%', left: '12%', size: 4, opacity: 0.5, delay: '1.4s' },
                            { top: '72%', left: '60%', size: 2, opacity: 0.35, delay: '0.4s' },
                            { top: '42%', left: '88%', size: 3, opacity: 0.5, delay: '1.1s' },
                            { top: '85%', left: '30%', size: 2, opacity: 0.4, delay: '0.6s' },
                        ].map((dot, i) => (
                            <div
                                key={i}
                                className="absolute rounded-full bg-blue-400 animate-pulse"
                                style={{
                                    top: dot.top,
                                    left: dot.left,
                                    width: dot.size,
                                    height: dot.size,
                                    opacity: dot.opacity,
                                    animationDelay: dot.delay,
                                    animationDuration: '3s',
                                }}
                            />
                        ))}
                    </div>

                    {/* Top: Logo */}
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white shadow-sm backdrop-blur-sm">
                            <AppLogoIcon className="h-5 w-5 fill-current text-white" />
                        </div>
                        <div>
                            <span className="block text-sm font-bold tracking-[0.2em] text-white uppercase">
                                MarketPilot
                            </span>
                            <span className="block text-[10px] font-semibold tracking-wider text-blue-400 uppercase">
                                AI Studio
                            </span>
                        </div>
                    </div>

                    {/* Middle: Hero Copy */}
                    <div className="relative z-10 space-y-5">
                        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1.5 text-xs font-bold tracking-wider text-blue-300 uppercase backdrop-blur-sm">
                            <Sparkles className="h-3.5 w-3.5" />
                            AI Marketing OS
                        </div>

                        <h1 className="max-w-sm text-3xl font-extrabold tracking-tight text-white sm:text-4xl leading-[1.15]">
                            Automate seasonal retail visuals{' '}
                            <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                                in seconds.
                            </span>
                        </h1>

                        <p className="max-w-md text-sm leading-relaxed text-white/55">
                            Connect your catalog with Philippine national holidays, retail payday cycles, and brand guidelines to generate high-converting promotional graphics.
                        </p>

                        {/* Feature highlights */}
                        <div className="space-y-2.5 pt-1">
                            {[
                                { icon: CalendarDays, text: 'Official PH Holiday Intelligence built-in' },
                                { icon: Zap, text: 'Generate campaign visuals in under 15 seconds' },
                                { icon: CheckCircle2, text: 'PNG, JPEG & SVG — no design skills needed' },
                            ].map(({ icon: Icon, text }) => (
                                <div key={text} className="flex items-center gap-3">
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 border border-blue-400/20">
                                        <Icon className="h-3.5 w-3.5 text-blue-400" />
                                    </div>
                                    <span className="text-xs font-medium text-white/65">{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom: Stats */}
                    <div className="relative z-10 grid grid-cols-3 gap-3 text-sm">
                        {[
                            { stat: '3×', label: 'faster planning' },
                            { stat: '12+', label: 'campaign signals' },
                            { stat: '1', label: 'shared workflow' },
                        ].map(({ stat, label }) => (
                            <div
                                key={label}
                                className="rounded-2xl border border-white/8 bg-white/5 p-3.5 backdrop-blur-sm"
                            >
                                <div className="text-xl font-extrabold text-white">{stat}</div>
                                <div className="mt-0.5 text-[11px] text-white/45">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ============================================================
                    RIGHT PANEL — Form Area
                ============================================================= */}
                <div className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
                    <div className="w-full max-w-md">
                        <div className="mb-8 flex items-center justify-between gap-4">
                            <Link
                                href={home()}
                                className="group inline-flex items-center gap-3 font-medium transition-transform active:scale-95"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground shadow-sm">
                                    <AppLogoIcon className="h-5 w-5 fill-current transition-transform duration-300 group-hover:scale-105" />
                                </div>
                                <span className="text-sm font-semibold tracking-[0.18em] text-foreground uppercase">
                                    MarketPilot
                                </span>
                            </Link>
                        </div>

                        <div className="space-y-2 text-left">
                            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                {title}
                            </h2>
                            {description && (
                                <p className="text-sm text-muted-foreground">
                                    {description}
                                </p>
                            )}
                        </div>

                        <div className="mt-8">{children}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
