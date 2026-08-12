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
        <div className="min-h-svh bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.18),_transparent_30%),linear-gradient(180deg,#050b14_0%,#09111b_100%)] p-4 sm:p-6 lg:p-10">
            <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_30px_90px_rgba(15,23,42,0.75)] backdrop-blur-xl lg:grid-cols-[0.95fr_1.05fr]">
                <div className="relative hidden overflow-hidden bg-slate-950/80 p-8 text-white lg:flex lg:flex-col lg:justify-between">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.38),_transparent_42%)]" />
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5">
                            <AppLogoIcon className="h-5 w-5 fill-current text-white" />
                        </div>
                        <span className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-200">
                            MarketPilot
                        </span>
                    </div>

                    <div className="relative z-10 space-y-6">
                        <div className="inline-flex items-center rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-blue-100">
                            AI marketing OS
                        </div>
                        <h1 className="max-w-sm text-4xl font-semibold leading-tight text-white">
                            Grow smarter with every campaign.
                        </h1>
                        <p className="max-w-md text-base text-slate-300">
                            Keep your content, campaigns, and brand direction connected in one place.
                        </p>
                    </div>

                    <div className="relative z-10 grid gap-3 text-sm text-slate-200 sm:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                            <div className="text-xl font-semibold text-white">3x</div>
                            <div>faster planning</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                            <div className="text-xl font-semibold text-white">12+</div>
                            <div>campaign signals</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                            <div className="text-xl font-semibold text-white">1</div>
                            <div>shared workflow</div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center bg-slate-950/35 p-5 sm:p-8 lg:p-12">
                    <div className="w-full max-w-md rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.5)] backdrop-blur-xl sm:p-7">
                        <div className="mb-8 flex items-center justify-between gap-4">
                            <Link href={home()} className="inline-flex items-center gap-3 font-medium">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-900 text-white">
                                    <AppLogoIcon className="h-5 w-5 fill-current" />
                                </div>
                                <span className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
                                    MarketPilot
                                </span>
                            </Link>
                        </div>

                        <div className="space-y-2 text-center lg:text-left">
                            <h2 className="text-3xl font-semibold tracking-tight text-white">{title}</h2>
                            <p className="text-sm text-slate-300">{description}</p>
                        </div>

                        <div className="mt-8">{children}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
