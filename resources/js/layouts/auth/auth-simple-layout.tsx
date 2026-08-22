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
        <div className="relative flex min-h-screen h-screen items-center justify-center bg-background p-2 sm:p-4 lg:p-6 text-foreground overflow-hidden">
            {/* Ambient Background Glow */}
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_60%)]"
            />

            <div className="card-elevated mx-auto grid w-full max-w-5xl max-h-[94vh] overflow-hidden rounded-3xl bg-card shadow-2xl lg:grid-cols-[0.85fr_1.15fr] border border-border/60">

                {/* ============================================================
                    LEFT PANEL — Hero-matched cinematic dark design panel
                ============================================================= */}
                <div
                    className="relative hidden flex-col justify-between overflow-hidden border-r border-border/70 p-6 lg:flex"
                    style={{
                        background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1829 40%, #101828 100%)',
                    }}
                >
                    {/* Layered Background Effects */}
                    <div aria-hidden className="pointer-events-none absolute inset-0">
                        <div
                            className="absolute -top-32 -left-32 h-80 w-80 rounded-full opacity-30"
                            style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.55) 0%, transparent 70%)' }}
                        />
                        <div
                            className="absolute top-1/2 -right-24 h-72 w-72 rounded-full opacity-20"
                            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.5) 0%, transparent 70%)' }}
                        />
                        <div
                            className="absolute inset-0 opacity-[0.04]"
                            style={{
                                backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                                backgroundSize: '36px 36px',
                            }}
                        />
                    </div>

                    {/* Floating Particle Dots */}
                    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                        {[
                            { top: '15%', left: '20%', size: 3, opacity: 0.6, delay: '0s' },
                            { top: '30%', left: '75%', size: 2, opacity: 0.4, delay: '0.8s' },
                            { top: '55%', left: '12%', size: 3, opacity: 0.5, delay: '1.4s' },
                            { top: '75%', left: '60%', size: 2, opacity: 0.35, delay: '0.4s' },
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
                    <div className="relative z-10 flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white shadow-sm backdrop-blur-sm">
                            <AppLogoIcon className="h-4 w-4 fill-current text-white" />
                        </div>
                        <div>
                            <span className="block text-xs font-bold tracking-[0.2em] text-white uppercase">
                                MarketPilot
                            </span>
                            <span className="block text-[9px] font-semibold tracking-wider text-blue-400 uppercase">
                                AI Studio
                            </span>
                        </div>
                    </div>

                    {/* Middle: Hero Copy */}
                    <div className="relative z-10 space-y-3.5 my-auto py-2">
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] font-bold tracking-wider text-blue-300 uppercase backdrop-blur-sm">
                            <Sparkles className="h-3 w-3" />
                            AI Marketing OS
                        </div>

                        <h1 className="max-w-xs text-2xl font-extrabold tracking-tight text-white leading-[1.18]">
                            Automate seasonal visuals{' '}
                            <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                                in seconds.
                            </span>
                        </h1>

                        <p className="max-w-xs text-xs leading-relaxed text-white/60">
                            Connect your catalog with Philippine national holidays, retail payday cycles, and brand guidelines to generate high-converting promotional graphics.
                        </p>

                        {/* Feature highlights */}
                        <div className="space-y-2 pt-1">
                            {[
                                { icon: CalendarDays, text: 'Official PH Holiday Intelligence' },
                                { icon: Zap, text: 'Generate campaign visuals in < 15s' },
                                { icon: CheckCircle2, text: 'PNG, JPEG & SVG — no design skills needed' },
                            ].map(({ icon: Icon, text }) => (
                                <div key={text} className="flex items-center gap-2.5">
                                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-500/15 border border-blue-400/20">
                                        <Icon className="h-3 w-3 text-blue-400" />
                                    </div>
                                    <span className="text-[11px] font-medium text-white/70">{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom: Stats */}
                    <div className="relative z-10 grid grid-cols-3 gap-2 text-xs">
                        {[
                            { stat: '3×', label: 'faster planning' },
                            { stat: '12+', label: 'campaign signals' },
                            { stat: '1', label: 'shared workflow' },
                        ].map(({ stat, label }) => (
                            <div
                                key={label}
                                className="rounded-xl border border-white/8 bg-white/5 p-2.5 backdrop-blur-sm text-center"
                            >
                                <div className="text-base font-extrabold text-white">{stat}</div>
                                <div className="mt-0.5 text-[10px] text-white/45">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ============================================================
                    RIGHT PANEL — Form Area (No scroll, compact & responsive)
                ============================================================= */}
                <div className="flex flex-col justify-center p-5 sm:p-7 lg:p-9 overflow-y-auto max-h-[94vh]">
                    <div className="w-full max-w-md mx-auto">
                        <div className="mb-3.5 flex items-center justify-between gap-3">
                            <Link
                                href={home()}
                                className="group inline-flex items-center gap-2.5 font-medium transition-transform active:scale-95"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-sm">
                                    <AppLogoIcon className="h-4 w-4 fill-current transition-transform duration-300 group-hover:scale-105" />
                                </div>
                                <span className="text-xs font-semibold tracking-[0.18em] text-foreground uppercase">
                                    MarketPilot
                                </span>
                            </Link>
                        </div>

                        <div className="space-y-1 text-left">
                            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                                {title}
                            </h2>
                            {description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                    {description}
                                </p>
                            )}
                        </div>

                        <div className="mt-4">{children}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
