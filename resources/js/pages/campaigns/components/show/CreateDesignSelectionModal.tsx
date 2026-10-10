import { router } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { CampaignData } from './types';

interface CreateDesignSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    campaign?: CampaignData | { id: string | number; name?: string } | null;
}

export function CreateDesignSelectionModal({
    isOpen,
    onClose,
    campaign,
}: CreateDesignSelectionModalProps) {
    const handleSelectMode = (mode: 'automatic' | 'manual') => {
        onClose();
        const baseRoute =
            mode === 'automatic' ? '/generator/automatic' : '/generator/manual';
        const params = new URLSearchParams();

        if (campaign?.id) {
            params.set('campaign_id', String(campaign.id));
            params.set('origin', 'campaign');
        }

        const query = params.toString();
        router.visit(query ? `${baseRoute}?${query}` : baseRoute);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                className="w-[95vw] sm:max-w-[760px] md:max-w-[800px] overflow-hidden rounded-[12px] p-6 sm:p-7 shadow-2xl border border-border"
                aria-describedby="create-design-modal-description"
            >
                <DialogHeader className="space-y-1 text-left sm:text-left">
                    <DialogTitle className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                        Create Marketing Design
                    </DialogTitle>
                    <DialogDescription
                        id="create-design-modal-description"
                        className="text-xs text-muted-foreground sm:text-sm"
                    >
                        Choose how you want to create your design.
                    </DialogDescription>
                </DialogHeader>

                {/* Studio Choice Cards Grid */}
                <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2 sm:gap-5">
                    {/* 1. AUTOMATIC STUDIO CARD */}
                    <button
                        type="button"
                        onClick={() => handleSelectMode('automatic')}
                        className="group flex w-full cursor-pointer flex-col overflow-hidden rounded-card border border-border/80 bg-card text-left transition-all duration-200 ease-out hover:border-foreground/30 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none dark:border-white/[0.08] dark:bg-[#161822] dark:hover:border-white/25"
                        aria-label="Automatic Studio. Let MarketPilot prepare the creative direction for you."
                    >
                        {/* Top ~55-60% Image (aspect-16/10) */}
                        <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-border/60 bg-muted/40 dark:border-white/[0.06]">
                            <img
                                src="/images/showcase/barako-ad-16x9.jpg"
                                alt="Automatic Studio marketing creative"
                                className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.025]"
                                loading="lazy"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-foreground/[0.01] transition-colors duration-200 group-hover:bg-foreground/[0.04]" />
                        </div>

                        {/* Card Content */}
                        <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                            <div>
                                <h3 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
                                    Automatic Studio
                                </h3>
                                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
                                    Let MarketPilot prepare the creative
                                    direction for you.
                                </p>
                            </div>

                            <div className="mt-4 flex items-center text-xs font-semibold text-foreground/80 group-hover:text-foreground">
                                <span>Explore</span>
                                <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:translate-x-1" />
                            </div>
                        </div>
                    </button>

                    {/* 2. MANUAL STUDIO CARD */}
                    <button
                        type="button"
                        onClick={() => handleSelectMode('manual')}
                        className="group flex w-full cursor-pointer flex-col overflow-hidden rounded-card border border-border/80 bg-card text-left transition-all duration-200 ease-out hover:border-foreground/30 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none dark:border-white/[0.08] dark:bg-[#161822] dark:hover:border-white/25"
                        aria-label="Manual Studio. Control the creative direction, copy, style, and composition yourself."
                    >
                        {/* Top ~55-60% Image (aspect-16/10) */}
                        <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-border/60 bg-muted/40 dark:border-white/[0.06]">
                            <img
                                src="/images/showcase/linen-ad-16x9.jpg"
                                alt="Manual Studio marketing creative"
                                className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.025]"
                                loading="lazy"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-foreground/[0.01] transition-colors duration-200 group-hover:bg-foreground/[0.04]" />
                        </div>

                        {/* Card Content */}
                        <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                            <div>
                                <h3 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
                                    Manual Studio
                                </h3>
                                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
                                    Control the creative direction, copy, style,
                                    and composition yourself.
                                </p>
                            </div>

                            <div className="mt-4 flex items-center text-xs font-semibold text-foreground/80 group-hover:text-foreground">
                                <span>Explore</span>
                                <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:translate-x-1" />
                            </div>
                        </div>
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
