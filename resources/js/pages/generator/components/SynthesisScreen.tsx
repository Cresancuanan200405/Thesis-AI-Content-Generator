import { createElement } from 'react';
import { AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    BusinessProfile,
    CampaignItem,
    EventItem,
    getIndustryIconComponent,
} from './types';

interface SynthesisScreenProps {
    business?: BusinessProfile | null;
    activeIndustry?: string;
    productName?: string;
    renderStyle?: string;
    activeCampaign?: CampaignItem | null;
    selectedEvent?: EventItem | null;
    currentStatusMessage: string;
    generationProgress: number;
    onResetToIdle: () => void;
    isError?: boolean;
}

export function SynthesisScreen({
    business,
    activeIndustry = 'Commercial',
    productName,
    renderStyle,
    activeCampaign,
    selectedEvent,
    currentStatusMessage,
    generationProgress,
    onResetToIdle,
    isError = false,
}: SynthesisScreenProps) {
    if (isError) {
        return (
            <div className="mx-auto flex h-full w-full max-w-md flex-col items-center justify-center p-6 text-center motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shadow-2xs">
                    <AlertCircle className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-foreground sm:text-lg">
                    Unable to finish this creative
                </h3>
                <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    Please check your settings and try again.
                </p>
                <Button
                    type="button"
                    onClick={onResetToIdle}
                    className="mt-5 cursor-pointer rounded-xl px-5 text-xs font-bold shadow-xs"
                >
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="mx-auto flex h-full w-full max-w-lg flex-col items-center justify-center p-2 motion-safe:animate-in motion-safe:duration-500 motion-safe:fade-in sm:p-4">
            <div className="relative flex w-full flex-col items-center justify-between gap-4 overflow-hidden rounded-3xl border border-border/80 bg-card/95 p-6 shadow-2xl backdrop-blur-2xl sm:gap-5 sm:p-8">
                {/* Ambient Background Studio Aura */}
                <div className="pointer-events-none absolute -top-16 left-1/2 h-36 w-36 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl motion-reduce:hidden" />
                <div className="pointer-events-none absolute -bottom-16 left-1/2 h-36 w-36 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl motion-reduce:hidden" />

                {/* 1. LIVE SYNTHESIS BADGE WITH GREEN INDICATOR DOT & TITLE */}
                <div className="relative flex flex-col items-center space-y-2 text-center">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 shadow-2xs dark:text-emerald-400">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-safe:animate-ping motion-reduce:hidden" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        </span>
                        <span>Live Synthesis</span>
                    </div>

                    <div className="flex flex-col items-center space-y-1">
                        <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg md:text-xl">
                            Designing your creative
                        </h2>

                        {business?.name && (
                            <p className="text-xs font-medium text-muted-foreground sm:text-sm">
                                for{' '}
                                <span className="font-semibold text-foreground/90">
                                    {business.name}
                                </span>
                            </p>
                        )}
                    </div>
                </div>

                {/* 2. CENTER PIECE: PROMINENT CHOSEN INDUSTRY LOGO / PICTOGRAM */}
                <div className="relative flex w-full items-center justify-center py-2 sm:py-3">
                    <div className="pointer-events-none absolute h-28 w-28 rounded-full bg-primary/20 blur-2xl motion-safe:animate-pulse motion-reduce:hidden" />

                    <div className="relative flex h-28 w-28 flex-col items-center justify-center rounded-3xl border border-primary/25 bg-gradient-to-b from-primary/15 via-primary/5 to-muted/40 shadow-xl ring-1 shadow-primary/10 ring-primary/20 backdrop-blur-xl transition-all sm:h-32 sm:w-32">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-xs ring-1 ring-primary/25 sm:h-14 sm:w-14">
                            {createElement(getIndustryIconComponent(activeIndustry), {
                                className:
                                    'h-6 w-6 sm:h-7 sm:w-7 text-primary motion-safe:animate-pulse',
                            })}
                        </div>
                        {activeIndustry && (
                            <span className="mt-1.5 max-w-[90px] truncate text-[10px] font-bold tracking-wider text-primary/80 uppercase">
                                {activeIndustry}
                            </span>
                        )}
                    </div>
                </div>

                {/* 3. DYNAMIC STATUS MESSAGE, PROGRESS BAR & CLEAN METADATA */}
                <div className="relative w-full space-y-3">
                    <div className="flex items-center justify-center gap-1.5 text-center">
                        <Sparkles className="h-3.5 w-3.5 text-primary motion-safe:animate-pulse motion-reduce:hidden" />
                        <p className="text-xs font-semibold text-foreground transition-opacity duration-500 sm:text-sm">
                            {currentStatusMessage}
                        </p>
                    </div>

                    <div className="mx-auto w-full max-w-xs space-y-1 sm:max-w-sm">
                        <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                            <span>Synthesizing artwork</span>
                            <span className="font-mono font-semibold text-primary">
                                {generationProgress}%
                            </span>
                        </div>
                        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/80 p-0.5 ring-1 ring-border/50">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-primary via-indigo-500 to-emerald-500 shadow-xs shadow-primary/30 transition-all duration-500 ease-out"
                                style={{
                                    width: `${generationProgress}%`,
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 pt-0.5 text-xs text-muted-foreground">
                        {productName && (
                            <span className="max-w-[140px] truncate font-medium text-foreground/90">
                                {productName}
                            </span>
                        )}
                        {productName && renderStyle && (
                            <span className="text-muted-foreground/40">•</span>
                        )}
                        {renderStyle && (
                            <span className="max-w-[140px] truncate font-medium text-muted-foreground">
                                {renderStyle}
                            </span>
                        )}
                        {(productName || renderStyle) &&
                            (activeCampaign?.name || selectedEvent?.name) && (
                                <span className="text-muted-foreground/40">•</span>
                            )}
                        {(activeCampaign?.name || selectedEvent?.name) && (
                            <span className="max-w-[150px] truncate font-semibold text-primary">
                                {activeCampaign?.name || selectedEvent?.name}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
