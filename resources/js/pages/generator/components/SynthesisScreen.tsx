import { createElement } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
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
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10 text-destructive">
                    <AlertCircle className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-foreground sm:text-lg">
                    Unable to complete creative generation
                </h3>
                <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    Please review your parameters and try again.
                </p>
                <Button
                    type="button"
                    onClick={onResetToIdle}
                    className="mt-5 cursor-pointer rounded-lg px-5 text-xs font-semibold shadow-xs"
                >
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="mx-auto flex h-full w-full max-w-md flex-col items-center justify-center p-2 motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in sm:p-4">
            <div className="relative flex w-full flex-col items-center justify-between gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
                {/* 1. Technical Status Indicator */}
                <div className="flex flex-col items-center space-y-2 text-center">
                    <div className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1 font-mono text-xs font-semibold text-foreground">
                        <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        <span>Generating Creative</span>
                    </div>

                    <div className="space-y-1">
                        <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                            Visual Creative in Progress
                        </h2>
                        {productName && (
                            <p className="text-xs text-muted-foreground">
                                Commercial rendering for <span className="font-semibold text-foreground">{productName}</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* 2. Industry Icon Frame (Clean technical container) */}
                <div className="relative flex h-20 w-20 flex-col items-center justify-center rounded-xl border border-border bg-muted/30">
                    {createElement(getIndustryIconComponent(activeIndustry), {
                        className: 'h-8 w-8 text-primary',
                    })}
                </div>

                {/* 3. Progress Bar & Message */}
                <div className="w-full space-y-3">
                    <p className="text-center text-xs font-medium text-foreground">
                        {currentStatusMessage}
                    </p>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                            <span>Progress</span>
                            <span className="font-semibold text-primary">{generationProgress}%</span>
                        </div>
                        <div className="relative h-2 w-full overflow-hidden rounded-md border border-border/80 bg-muted/40">
                            <div
                                className="h-full rounded-sm bg-primary transition-all duration-300 ease-out"
                                style={{ width: `${generationProgress}%` }}
                            />
                        </div>
                    </div>

                    {/* Metadata summary (non-redundant) */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1 font-mono text-[10px] text-muted-foreground">
                        {activeCampaign && (
                            <span className="rounded border border-border/60 bg-muted/30 px-1.5 py-0.5">
                                Campaign: {activeCampaign.name}
                            </span>
                        )}
                        {renderStyle && (
                            <span className="rounded border border-border/60 bg-muted/30 px-1.5 py-0.5">
                                {renderStyle}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
