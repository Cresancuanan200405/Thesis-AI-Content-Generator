import {
    Building2,
    CalendarDays,
    Camera,
    Compass,
    Cpu,
    ImageIcon,
    Layers,
    Package,
    PanelRightClose,
    PanelRightOpen,
    ShieldCheck,
    Sparkles,
    Tag,
    Wand2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    aspectRatioOptions,
    BusinessProfile,
    calculateGenerationCost,
    CampaignItem,
    CustomProductItem,
    EventItem,
    ImageQuality,
    imageModelOptions,
    imageQualityOptions,
    ProductItem,
} from './types';

interface StudioBriefSummaryProps {
    isCollapsed: boolean;
    onToggleCollapse: (collapsed: boolean) => void;
    aspectRatio: string;
    totalSelectedCount: number;
    selectedCatalogProducts: ProductItem[];
    customProducts: CustomProductItem[];
    price?: string;
    tagline?: string;
    hasImageReference?: boolean;
    activeCampaign?: CampaignItem | null;
    business?: BusinessProfile | null;
    selectedEvent?: EventItem | null;
    renderStyle?: string;
    contentStyle?: string[];
    brandTone?: string[];
    imageModel: string;
    imageQuality: ImageQuality;
    includeBusinessName: boolean;
    isAutomaticMode?: boolean;
}

export function StudioBriefSummary({
    isCollapsed,
    onToggleCollapse,
    aspectRatio,
    totalSelectedCount,
    selectedCatalogProducts,
    customProducts,
    price,
    tagline,
    hasImageReference,
    activeCampaign,
    business,
    selectedEvent,
    renderStyle,
    contentStyle = [],
    brandTone = [],
    imageModel,
    imageQuality,
    includeBusinessName,
    isAutomaticMode = false,
}: StudioBriefSummaryProps) {
    const activeRatio = aspectRatio || '1:1';
    const activeRatioOption = aspectRatioOptions.find((o) => o.value === activeRatio);

    if (isCollapsed) {
        return (
            <aside
                onClick={() => onToggleCollapse(false)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        onToggleCollapse(false);
                    }
                }}
                className="group sticky top-11 z-20 flex h-[calc(100vh-2.75rem)] w-11 shrink-0 cursor-pointer flex-col items-center justify-between border-l border-border/80 bg-card/60 py-4 backdrop-blur-xl transition-all duration-200 select-none hover:bg-muted/40 sm:top-12 sm:h-[calc(100vh-3rem)] lg:w-12"
                title="Open Brief Summary"
            >
                <div className="flex flex-col items-center gap-5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-2xs transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                        <PanelRightOpen className="h-4 w-4" />
                    </div>

                    <div className="flex flex-col items-center gap-4 py-2">
                        <span className="rotate-180 text-[10px] font-bold tracking-widest text-muted-foreground uppercase transition-colors [writing-mode:vertical-rl] group-hover:text-foreground">
                            Brief Summary
                        </span>
                        <span className="rotate-180 rounded border border-primary/30 bg-primary/5 px-1 py-0.5 font-mono text-[9px] font-bold text-primary [writing-mode:vertical-rl]">
                            {activeRatio}
                        </span>
                    </div>
                </div>

                <div className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors group-hover:text-foreground">
                    <Sparkles className="h-3.5 w-3.5" />
                </div>
            </aside>
        );
    }

    return (
        <aside className="sticky top-11 z-20 flex h-[calc(100vh-2.75rem)] w-80 shrink-0 flex-col justify-between overflow-y-auto border-l border-border/80 bg-card/80 p-4 backdrop-blur-2xl transition-all duration-300 sm:top-12 sm:h-[calc(100vh-3rem)] lg:w-[330px] dark:bg-card/90">
            <div className="space-y-3.5">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-2xs ring-1 ring-primary/20">
                            <Sparkles className="h-3.5 w-3.5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold tracking-tight text-foreground">
                                    Brief Summary
                                </span>
                                <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                                    <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-500" />
                                    Live
                                </span>
                            </div>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onToggleCollapse(true)}
                        className="h-7 w-7 cursor-pointer rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title="Collapse summary sidebar"
                    >
                        <PanelRightClose className="h-4 w-4" />
                    </Button>
                </div>

                {/* Section 1: Canvas & Aspect Ratio Preview */}
                <div className="group relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-primary/5 via-card/60 to-background/80 p-3 shadow-2xs transition-all hover:border-primary/30">
                    <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-foreground uppercase">
                            <Layers className="h-3.5 w-3.5 text-primary" />
                            Canvas & Ratio
                        </span>
                        <Badge
                            variant="outline"
                            className="border-primary/30 bg-primary/10 font-mono text-[10px] font-bold text-primary shadow-2xs"
                        >
                            {activeRatio}
                        </Badge>
                    </div>

                    {/* Dynamic Proportional Aspect Preview */}
                    <div className="flex min-h-[130px] items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-background/70 p-2.5 shadow-inner">
                        <div
                            className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/60 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent shadow-sm transition-all duration-300 ${
                                activeRatio === '9:16'
                                    ? 'h-[125px] w-[70px]'
                                    : activeRatio === '16:9'
                                      ? 'h-[75px] w-[134px]'
                                      : activeRatio === '4:5'
                                        ? 'h-[115px] w-[92px]'
                                        : activeRatio === '4:3'
                                          ? 'h-[90px] w-[120px]'
                                          : 'h-[100px] w-[100px]'
                            }`}
                        >
                            <div className="flex flex-col items-center justify-center gap-0.5 p-1 text-center">
                                <span className="font-mono text-xs font-black tracking-tight text-primary">
                                    {activeRatio}
                                </span>
                                <span className="font-mono text-[9px] font-semibold text-muted-foreground">
                                    {activeRatioOption?.badge || '1024 × 1024'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-2 text-[11px]">
                        <span className="max-w-[170px] truncate font-medium text-foreground">
                            {activeRatioOption?.label || activeRatio}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck className="h-3 w-3" />
                            Safe Area
                        </span>
                    </div>
                </div>

                {/* Section 2: Hero Product & Copy */}
                <div className="space-y-2.5 rounded-2xl border border-border/70 bg-card/60 p-3 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px] font-bold tracking-wide text-foreground uppercase">
                        <span className="flex items-center gap-1.5">
                            <Package className="h-3.5 w-3.5 text-primary" />
                            Hero Product & Copy
                        </span>
                        {price && (
                            <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                ₱{Number(price).toLocaleString()}
                            </span>
                        )}
                    </div>

                    <div className="space-y-1.5 text-xs">
                        <div className="rounded-xl border border-border/50 bg-background/60 p-2.5">
                            <div className="mb-1 flex items-center justify-between">
                                <span className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Featured Products & Services
                                </span>
                                {totalSelectedCount > 0 && (
                                    <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                                        ({totalSelectedCount})
                                    </span>
                                )}
                            </div>
                            <div className="text-xs font-semibold text-foreground">
                                {totalSelectedCount > 0 ? (
                                    <div className="space-y-1">
                                        {selectedCatalogProducts.map((p) => (
                                            <div
                                                key={`catalog-featured-${p.id}`}
                                                className="flex items-center justify-between text-[11px]"
                                            >
                                                <span className="truncate">{p.name}</span>
                                                {p.price && (
                                                    <span className="font-bold text-emerald-500">
                                                        ₱{Number(p.price).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                        {customProducts
                                            .filter((p) => p.name.trim())
                                            .map((p) => (
                                                <div
                                                    key={p.id}
                                                    className="flex items-center justify-between text-[11px]"
                                                >
                                                    <span className="truncate">
                                                        {p.name} (Custom)
                                                    </span>
                                                    {p.price && (
                                                        <span className="font-bold text-emerald-500">
                                                            ₱{Number(p.price).toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground italic">
                                        No products or services specified
                                    </span>
                                )}
                            </div>
                        </div>

                        {tagline && (
                            <div className="rounded-xl border border-primary/20 bg-primary/5 p-2.5">
                                <div className="mb-0.5 text-[9px] font-bold tracking-wider text-primary uppercase">
                                    Active Tagline
                                </div>
                                <div className="text-xs leading-snug font-medium text-foreground italic">
                                    "{tagline}"
                                </div>
                            </div>
                        )}

                        {hasImageReference && (
                            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2 text-xs text-emerald-700 dark:text-emerald-400">
                                <ImageIcon className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate text-[11px] font-medium">
                                    Product Image Reference Active
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Section 3: Art Direction & Staging */}
                <div className="space-y-2 rounded-2xl border border-border/70 bg-card/60 p-3 shadow-2xs">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-foreground uppercase">
                        <Camera className="h-3.5 w-3.5 text-primary" />
                        Art Direction & Staging
                    </span>

                    <div className="space-y-1.5 text-xs">
                        {/* Campaign */}
                        {activeCampaign?.name && (
                            <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1.5">
                                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <Compass className="h-3 w-3" />
                                    Campaign
                                </span>
                                <span
                                    className="max-w-[150px] truncate text-right text-[11px] font-medium text-foreground"
                                    title={activeCampaign.name}
                                >
                                    {activeCampaign.name}
                                </span>
                            </div>
                        )}

                        {/* Industry */}
                        <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1.5">
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Building2 className="h-3 w-3" />
                                Industry
                            </span>
                            <span className="max-w-[150px] truncate text-right text-[11px] font-medium text-foreground">
                                {business?.industry || 'Commercial'}
                            </span>
                        </div>

                        {/* Category / Subcategory */}
                        {(business?.category || (business as any)?.subcategory) && (
                            <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1.5">
                                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <Tag className="h-3 w-3" />
                                    Category
                                </span>
                                <span className="max-w-[150px] truncate text-right text-[11px] font-medium text-foreground">
                                    {business?.category || (business as any)?.subcategory}
                                </span>
                            </div>
                        )}

                        {/* Event / Holiday */}
                        <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1.5">
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <CalendarDays className="h-3 w-3" />
                                Holiday / Event
                            </span>
                            <div className="text-right">
                                <div className="max-w-[150px] truncate text-[11px] font-medium text-foreground">
                                    {selectedEvent?.name || 'Standard Season'}
                                </div>
                                {(selectedEvent?.date || selectedEvent?.event_date) && (
                                    <div className="text-[9px] text-muted-foreground">
                                        {selectedEvent.date || selectedEvent.event_date}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Render Style */}
                        <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1.5">
                            <span className="text-[11px] text-muted-foreground">
                                Render Style
                            </span>
                            <Badge
                                variant="outline"
                                className="border-primary/30 bg-primary/10 text-[10px] font-bold text-primary"
                            >
                                {isAutomaticMode
                                    ? 'Automatic (AI Creative Director)'
                                    : renderStyle || 'Studio Product Still'}
                            </Badge>
                        </div>

                        {/* Themes & Tones (Manual mode only) */}
                        {!isAutomaticMode && (contentStyle.length > 0 || brandTone.length > 0) && (
                            <div className="space-y-1 pt-1">
                                {contentStyle.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {contentStyle.map((style) => (
                                            <span
                                                key={style}
                                                className="rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary"
                                            >
                                                {style}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {brandTone.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {brandTone.map((tone) => (
                                            <span
                                                key={tone}
                                                className="rounded-md border border-border/70 bg-muted/40 px-1.5 py-0.5 text-[9px] font-medium text-foreground"
                                            >
                                                {tone}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Section 4: AI Engine & Identity */}
                <div className="space-y-2 rounded-2xl border border-border/70 bg-card/60 p-3 shadow-2xs">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-foreground uppercase">
                        <Cpu className="h-3.5 w-3.5 text-primary" />
                        AI Engine & Identity
                    </span>

                    <div className="space-y-1.5 text-xs">
                        {/* Model */}
                        <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1.5">
                            <span className="text-[11px] text-muted-foreground">Model Tier</span>
                            {(() => {
                                const activeModel =
                                    imageModelOptions.find((m) => m.value === imageModel) ||
                                    imageModelOptions[1];

                                return (
                                    <div className="flex items-center gap-1 text-right">
                                        <span className="font-mono text-[11px] font-bold text-foreground">
                                            {activeModel.label}
                                        </span>
                                        {activeModel.isRecommended && (
                                            <span className="rounded bg-primary/10 px-1 text-[8px] font-bold text-primary">
                                                ★
                                            </span>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Quality & Cost */}
                        <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1.5">
                            <span className="text-[11px] text-muted-foreground">Quality / Est.</span>
                            {(() => {
                                const activeQuality =
                                    imageQualityOptions.find((q) => q.value === imageQuality) ||
                                    imageQualityOptions[1];
                                const cost = calculateGenerationCost(imageModel, imageQuality);

                                return (
                                    <div className="flex items-center gap-1.5 text-right">
                                        <span className="text-[11px] font-semibold text-foreground">
                                            {activeQuality.label}
                                        </span>
                                        <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 font-mono text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                                            {cost.usd}
                                        </span>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Business Branding */}
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-muted-foreground">Branding</span>
                            <Badge
                                variant={includeBusinessName ? 'default' : 'outline'}
                                className={`text-[9px] font-semibold ${
                                    includeBusinessName
                                        ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                        : ''
                                }`}
                            >
                                {includeBusinessName
                                    ? business?.name || 'Included'
                                    : 'Disabled'}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky footer info */}
            <div className="border-t border-border/50 pt-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <Wand2 className="h-3 w-3 text-primary" />
                    <span>MarketPilot Creative Engine</span>
                </div>
            </div>
        </aside>
    );
}
