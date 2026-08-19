import { Link } from '@inertiajs/react';
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
                {/* Left Panel */}
                <div className="relative hidden flex-col justify-between border-r border-border/70 bg-muted/20 p-8 text-foreground lg:flex">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.18),transparent_50%)]"
                    />

                    <div className="relative z-10 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground shadow-sm">
                            <AppLogoIcon className="h-5 w-5 fill-current" />
                        </div>
                        <span className="text-sm font-semibold tracking-[0.22em] text-foreground uppercase">
                            MarketPilot
                        </span>
                    </div>

                    <div className="relative z-10 space-y-5">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#2563EB]/25 bg-[#2563EB]/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-[#2563EB] uppercase dark:border-[#3B82F6]/30 dark:bg-[#3B82F6]/10 dark:text-[#60A5FA]">
                            AI marketing OS
                        </div>
                        <h1 className="max-w-sm text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                            Grow smarter with every campaign.
                        </h1>
                        <p className="max-w-md text-base leading-relaxed text-muted-foreground">
                            Keep your content, visual mockups, campaigns, and brand identity synchronized in one place.
                        </p>
                    </div>

                    <div className="relative z-10 grid gap-3 text-sm sm:grid-cols-3">
                        <div className="card-elevated rounded-2xl bg-card/80 p-3.5">
                            <div className="text-xl font-bold text-foreground">
                                3x
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground">faster planning</div>
                        </div>
                        <div className="card-elevated rounded-2xl bg-card/80 p-3.5">
                            <div className="text-xl font-bold text-foreground">
                                12+
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground">campaign signals</div>
                        </div>
                        <div className="card-elevated rounded-2xl bg-card/80 p-3.5">
                            <div className="text-xl font-bold text-foreground">
                                1
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground">shared workflow</div>
                        </div>
                    </div>
                </div>

                {/* Right Form Area */}
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
