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
        <div
            className="min-h-svh p-4 sm:p-6 lg:p-10"
            style={{
                background: 'var(--page-glow), var(--page-surface)',
            }}
        >
            <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60 dark:shadow-[0_30px_90px_rgba(2,6,23,0.55)] lg:grid-cols-[0.95fr_1.05fr]">
                <div className="relative hidden overflow-hidden bg-slate-100 p-8 text-slate-900 lg:flex lg:flex-col lg:justify-between dark:bg-slate-950 dark:text-slate-100">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_42%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.28),_transparent_42%)]" />
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-900 dark:border-white/10 dark:bg-slate-900/70 dark:text-white">
                            <AppLogoIcon className="h-5 w-5 fill-current" />
                        </div>
                        <span className="text-sm font-semibold tracking-[0.28em] text-slate-700 uppercase dark:text-slate-200">
                            MarketPilot
                        </span>
                    </div>

                    <div className="relative z-10 space-y-6">
                        <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium tracking-[0.2em] text-blue-700 uppercase dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-100">
                            AI marketing OS
                        </div>
                        <h1 className="max-w-sm text-4xl leading-tight font-semibold text-slate-900 dark:text-white">
                            Grow smarter with every campaign.
                        </h1>
                        <p className="max-w-md text-base text-slate-600 dark:text-slate-300">
                            Keep your content, campaigns, and brand direction
                            connected in one place.
                        </p>
                    </div>

                    <div className="relative z-10 grid gap-3 text-sm text-slate-600 sm:grid-cols-3 dark:text-slate-200">
                        <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 dark:border-white/10 dark:bg-slate-900/40">
                            <div className="text-xl font-semibold text-slate-900 dark:text-white">
                                3x
                            </div>
                            <div>faster planning</div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 dark:border-white/10 dark:bg-slate-900/40">
                            <div className="text-xl font-semibold text-slate-900 dark:text-white">
                                12+
                            </div>
                            <div>campaign signals</div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 dark:border-white/10 dark:bg-slate-900/40">
                            <div className="text-xl font-semibold text-slate-900 dark:text-white">
                                1
                            </div>
                            <div>shared workflow</div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center bg-slate-50/80 p-5 sm:p-8 lg:p-12 dark:bg-slate-950/40">
                    <div className="w-full max-w-md rounded-[1.5rem] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80 dark:shadow-[0_18px_60px_rgba(15,23,42,0.4)] sm:p-7">
                        <div className="mb-8 flex items-center justify-between gap-4">
                            <Link
                                href={home()}
                                className="inline-flex items-center gap-3 font-medium"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-900 dark:border-white/10 dark:bg-slate-950 dark:text-white">
                                    <AppLogoIcon className="h-5 w-5 fill-current" />
                                </div>
                                <span className="text-sm font-semibold tracking-[0.18em] text-slate-600 uppercase dark:text-slate-300">
                                    MarketPilot
                                </span>
                            </Link>
                        </div>

                        <div className="space-y-2 text-center lg:text-left">
                            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                                {title}
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                {description}
                            </p>
                        </div>

                        <div className="mt-8">{children}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
