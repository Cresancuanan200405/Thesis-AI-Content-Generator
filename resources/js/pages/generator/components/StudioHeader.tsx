import { Link } from '@inertiajs/react';
import {
    ChevronDown,
    Layers,
    SlidersHorizontal,
    Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    CampaignItem,
    GenerationState,
    imageModelOptions,
} from './types';

interface StudioHeaderProps {
    activeMode: 'automatic' | 'manual';
    activeCampaign: CampaignItem | null;
    campaigns?: CampaignItem[];
    onSelectCampaign?: (campaignId: string) => void;
    imageModel: string;
    onSelectModel: (modelValue: string) => void;
    generationState: GenerationState;
}

export function StudioHeader({
    activeMode,
    activeCampaign,
    campaigns = [],
    onSelectCampaign,
    imageModel,
    onSelectModel,
    generationState,
}: StudioHeaderProps) {
    const campaignParam = activeCampaign ? `?campaign_id=${activeCampaign.id}` : '';

    return (
        <div className="space-y-4">
            {generationState !== 'generating' && (
                <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-border/80 bg-card/90 px-3.5 py-2 shadow-xs backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Sparkles className="h-4 w-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                {activeCampaign && (
                                    <>
                                        <Link
                                            href={`/campaigns/${activeCampaign.id}`}
                                            className="text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
                                        >
                                            {activeCampaign.name}
                                        </Link>
                                        <span className="text-muted-foreground">/</span>
                                    </>
                                )}
                                <h1 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                                    AI Marketing Studio
                                </h1>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {activeCampaign
                                    ? `Generating marketing visuals for "${activeCampaign.name}"`
                                    : 'Create campaign-ready marketing visuals tailored to holidays and product launches.'}
                            </p>
                        </div>
                    </div>

                    {/* Top Right Actions */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        {/* Model Selector Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1.5 text-xs font-semibold shadow-2xs"
                                >
                                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                                    <span className="font-mono text-[11px] font-bold">
                                        {imageModel}
                                    </span>
                                    <Badge
                                        variant="secondary"
                                        className="px-1 py-0 font-mono text-[9px] text-emerald-600 dark:text-emerald-400"
                                    >
                                        {imageModelOptions.find((m) => m.value === imageModel)?.price || '$0.040 / gen'}
                                    </Badge>
                                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="max-h-[380px] w-[340px] space-y-1 overflow-y-auto rounded-2xl border-border bg-popover/98 p-2 shadow-2xl backdrop-blur-xl"
                            >
                                <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                    Switch Generation Model & Pricing
                                </div>
                                {imageModelOptions.map((model) => (
                                    <DropdownMenuItem
                                        key={model.value}
                                        onClick={() => onSelectModel(model.value)}
                                        className={`cursor-pointer rounded-xl p-2 text-xs transition-colors ${
                                            imageModel === model.value
                                                ? 'border border-primary/30 bg-primary/10'
                                                : 'hover:bg-muted/60'
                                        }`}
                                    >
                                        <div className="w-full space-y-1">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono text-xs font-bold text-foreground">
                                                        {model.label}
                                                    </span>
                                                    <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1 font-mono text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                                                        {model.price}
                                                    </span>
                                                </div>
                                                <Badge
                                                    variant="secondary"
                                                    className="font-mono text-[9px]"
                                                >
                                                    {model.speed}
                                                </Badge>
                                            </div>
                                            <p className="line-clamp-1 text-[10px] text-muted-foreground">
                                                {model.description}
                                            </p>
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

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

            {/* Active Campaign Banner (HIDDEN DURING SYNTHESIS) */}
            {generationState !== 'generating' && activeCampaign && (
                <div className="flex animate-in items-center justify-between rounded-2xl border border-primary/30 bg-primary/5 p-4 text-xs duration-200 fade-in">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Layers className="h-4 w-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-foreground">
                                    Campaign: {activeCampaign.name}
                                </p>
                                <Badge
                                    variant="outline"
                                    className="border-primary/20 bg-primary/10 text-[10px] font-semibold text-primary"
                                >
                                    Campaign Context
                                </Badge>
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                All visuals generated in this studio session are automatically linked to this campaign.
                            </p>
                        </div>
                    </div>
                    <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-semibold"
                    >
                        <Link href={`/campaigns/${activeCampaign.id}`}>
                            View Campaign
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
