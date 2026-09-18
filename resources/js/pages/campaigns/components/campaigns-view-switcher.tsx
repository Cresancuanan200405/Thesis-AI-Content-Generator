import { Layers, Sparkles } from 'lucide-react';

interface CampaignsViewSwitcherProps {
    activeView: 'opportunities' | 'hub';
    onViewChange: (view: 'opportunities' | 'hub') => void;
    campaignCount?: number;
    upcomingCount?: number;
}

export function CampaignsViewSwitcher({
    activeView,
    onViewChange,
    campaignCount = 0,
    upcomingCount = 0,
}: CampaignsViewSwitcherProps) {
    return (
        <div className="relative flex w-full items-center sm:w-auto">
            {/* Ambient Backlight Glow behind the active switcher */}
            <div
                className={`pointer-events-none absolute -inset-1 rounded-2xl opacity-40 blur-md transition-all duration-500 ${
                    activeView === 'opportunities'
                        ? 'bg-gradient-to-r from-primary/30 via-violet-500/20 to-primary/10'
                        : 'bg-gradient-to-r from-blue-500/20 via-primary/30 to-cyan-500/20'
                }`}
                aria-hidden="true"
            />

            {/* Pill Container */}
            <div className="relative inline-flex w-full items-center rounded-2xl border border-border/80 bg-background/80 p-1 shadow-xs ring-1 ring-black/[0.04] backdrop-blur-md sm:w-auto dark:bg-card/70 dark:ring-white/[0.06]">
                {/* Opportunities Button */}
                <button
                    type="button"
                    onClick={() => onViewChange('opportunities')}
                    className={`group relative flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold tracking-tight transition-all duration-300 sm:flex-initial ${
                        activeView === 'opportunities'
                            ? 'bg-background text-foreground shadow-[0_0_18px_-3px_rgba(139,92,246,0.32),0_2px_8px_-2px_rgba(0,0,0,0.06)] ring-1 ring-primary/30 dark:bg-card dark:shadow-[0_0_20px_-3px_rgba(139,92,246,0.25)] dark:ring-primary/40'
                            : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                    }`}
                >
                    {/* Top edge light reflection on active */}
                    {activeView === 'opportunities' && (
                        <>
                            <span
                                className="pointer-events-none absolute inset-x-2 -top-px h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent"
                                aria-hidden="true"
                            />
                            <span
                                className="pointer-events-none absolute inset-x-3 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                                aria-hidden="true"
                            />
                        </>
                    )}

                    <Sparkles
                        className={`h-3.5 w-3.5 transition-colors duration-200 ${
                            activeView === 'opportunities'
                                ? 'text-primary'
                                : 'text-muted-foreground/70 group-hover:text-primary'
                        }`}
                    />

                    <span>Opportunities</span>

                    {upcomingCount > 0 && (
                        <span
                            className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-[10px] font-bold transition-all duration-200 ${
                                activeView === 'opportunities'
                                    ? 'border border-primary/30 bg-primary/10 text-primary shadow-[0_0_10px_rgba(139,92,246,0.2)]'
                                    : 'bg-muted text-muted-foreground group-hover:bg-muted/80 group-hover:text-foreground'
                            }`}
                        >
                            {upcomingCount}
                        </span>
                    )}
                </button>

                {/* Campaign Hub Button */}
                <button
                    type="button"
                    onClick={() => onViewChange('hub')}
                    className={`group relative flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold tracking-tight transition-all duration-300 sm:flex-initial ${
                        activeView === 'hub'
                            ? 'bg-background text-foreground shadow-[0_0_18px_-3px_rgba(59,130,246,0.32),0_2px_8px_-2px_rgba(0,0,0,0.06)] ring-1 ring-blue-500/30 dark:bg-card dark:shadow-[0_0_20px_-3px_rgba(59,130,246,0.25)] dark:ring-blue-500/40'
                            : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                    }`}
                >
                    {/* Top edge light reflection on active */}
                    {activeView === 'hub' && (
                        <>
                            <span
                                className="pointer-events-none absolute inset-x-2 -top-px h-px bg-gradient-to-r from-transparent via-blue-400/70 to-transparent"
                                aria-hidden="true"
                            />
                            <span
                                className="pointer-events-none absolute inset-x-3 -bottom-px h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"
                                aria-hidden="true"
                            />
                        </>
                    )}

                    <Layers
                        className={`h-3.5 w-3.5 transition-colors duration-200 ${
                            activeView === 'hub'
                                ? 'text-blue-500 dark:text-blue-400'
                                : 'text-muted-foreground/70 group-hover:text-blue-500'
                        }`}
                    />

                    <span>Campaign Hub</span>

                    {campaignCount > 0 && (
                        <span
                            className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-[10px] font-bold transition-all duration-200 ${
                                activeView === 'hub'
                                    ? 'border border-blue-500/30 bg-blue-500/10 text-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.2)] dark:text-blue-400'
                                    : 'bg-muted text-muted-foreground group-hover:bg-muted/80 group-hover:text-foreground'
                            }`}
                        >
                            {campaignCount}
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
}
