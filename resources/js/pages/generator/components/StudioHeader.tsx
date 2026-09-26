import { Link } from '@inertiajs/react';
import {
    Layers,
    SlidersHorizontal,
    Sparkles,
} from 'lucide-react';
import {
    CampaignItem,
    GenerationState,
} from './types';

interface StudioHeaderProps {
    activeMode: 'automatic' | 'manual';
    activeCampaign: CampaignItem | null;
    campaigns?: CampaignItem[];
    onSelectCampaign?: (campaignId: string) => void;
    generationState: GenerationState;
}

export function StudioHeader({
    activeMode,
    activeCampaign,
    generationState,
}: StudioHeaderProps) {
    const campaignParam = activeCampaign ? `?campaign_id=${activeCampaign.id}` : '';

    return (
        <>
            {generationState !== 'generating' && generationState !== 'ready' && (
                <div className="sticky top-11 z-20 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/80 bg-card/95 p-2 px-3 shadow-xs backdrop-blur-md transition-all sm:top-12 sm:gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Sparkles className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <h1 className="text-sm font-bold tracking-tight text-foreground sm:text-base shrink-0">
                                    AI Marketing Studio
                                </h1>
                                {activeCampaign && (
                                    <Link
                                        href={`/campaigns/${activeCampaign.id}`}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary transition-colors hover:border-primary/40 hover:bg-primary/15 whitespace-normal break-words"
                                        title={`Active Campaign: ${activeCampaign.name}`}
                                    >
                                        <Layers className="h-3.5 w-3.5 shrink-0 text-primary" />
                                        <span>{activeCampaign.name}</span>
                                    </Link>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground whitespace-normal break-words">
                                {activeCampaign
                                    ? `Generating marketing visuals for "${activeCampaign.name}"`
                                    : 'Create campaign-ready marketing visuals tailored to holidays and product launches.'}
                            </p>
                        </div>
                    </div>

                    {/* Top Right Actions */}
                    <div className="flex shrink-0 items-center gap-2">
                        {/* Generation Mode Links (Auto vs Manual Routes) */}
                        <div className="inline-flex shrink-0 items-center rounded-xl border border-border/80 bg-muted/40 p-0.5 shadow-2xs">
                            <Link
                                href={`/generator/automatic${campaignParam}`}
                                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                                    activeMode === 'automatic'
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                                title="Automatic Mode"
                            >
                                <Sparkles className="h-3 w-3" />
                                <span>Auto</span>
                            </Link>
                            <Link
                                href={`/generator/manual${campaignParam}`}
                                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                                    activeMode === 'manual'
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                                title="Manual Mode"
                            >
                                <SlidersHorizontal className="h-3 w-3" />
                                <span>Manual</span>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
