import { ArrowLeftRight, ImageIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { CreateDesignSelectionModal } from '@/pages/campaigns/components/show/CreateDesignSelectionModal';
import type { CampaignItem, GenerationState } from './types';

interface StudioHeaderProps {
    activeMode: 'automatic' | 'manual';
    activeCampaign: CampaignItem | null;
    campaigns?: CampaignItem[];
    onSelectCampaign?: (campaignId: string) => void;
    generationState: GenerationState;
}

export function StudioHeader({
    activeCampaign,
    generationState,
}: StudioHeaderProps) {
    const [isModeModalOpen, setIsModeModalOpen] = useState(false);

    if (generationState === 'generating' || generationState === 'ready') {
        return null;
    }

    return (
        <>
            <div className="sticky top-11 z-30 flex flex-wrap items-center justify-between gap-2 rounded-card border border-border/80 bg-card/95 p-2 px-3 shadow-xs backdrop-blur-md transition-all sm:top-12 sm:gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <ImageIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <h1 className="shrink-0 text-sm font-bold tracking-tight text-foreground sm:text-base">
                                Marketing Studio
                            </h1>
                        </div>
                        <p className="text-xs break-words whitespace-normal text-muted-foreground">
                            {activeCampaign
                                ? `Generating marketing visuals for "${activeCampaign.name}"`
                                : 'Create campaign-ready marketing visuals tailored to holidays and product launches.'}
                        </p>
                    </div>
                </div>

                {/* Top Right Actions */}
                <div className="flex shrink-0 items-center gap-2">
                    <TooltipProvider delayDuration={200}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setIsModeModalOpen(true)}
                                    className="h-8.5 w-8.5 rounded-xl border-primary/30 bg-primary/5 text-primary transition-all duration-200 hover:border-primary hover:bg-primary/15 hover:text-primary active:scale-95 group cursor-pointer"
                                    aria-label="Switch generation mode"
                                >
                                    <ArrowLeftRight className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" align="end">
                                Switch generation mode
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            <CreateDesignSelectionModal
                isOpen={isModeModalOpen}
                onClose={() => setIsModeModalOpen(false)}
                campaign={activeCampaign}
            />
        </>
    );
}
