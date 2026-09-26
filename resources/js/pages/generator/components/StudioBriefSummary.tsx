import {
    Building2,
    CalendarDays,
    Camera,
    Check,
    Compass,
    Cpu,
    ImageIcon,
    Layers,
    Package,
    PanelRightClose,
    PanelRightOpen,
    PenTool,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    aspectRatioOptions,
    BusinessProfile,
    CampaignItem,
    CustomProductItem,
    EventItem,
    ImageQuality,
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
    designTreatment?: string;
    copyEmphasis?: string;
    scenePrompt?: string;
    creativeConcept?: string;
    visualStrategy?: string;
    imageModel?: string;
    imageQuality?: ImageQuality;
    includeBusinessName?: boolean;
    isAutomaticMode?: boolean;
    includeTagline?: boolean;
    includePrices?: boolean;
    showEventText?: boolean;
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
    showEventText,
    renderStyle,
    contentStyle = [],
    brandTone = [],
    designTreatment,
    copyEmphasis,
    scenePrompt,
    creativeConcept,
    imageModel = 'GPT-Image-2',
    imageQuality = 'medium',
    includeBusinessName = true,
    isAutomaticMode = false,
    includeTagline = true,
    includePrices = true,
}: StudioBriefSummaryProps) {
    const activeRatio = aspectRatio || '1:1';
    const activeRatioOption = aspectRatioOptions.find((o) => o.value === activeRatio);
    const hasProducts = totalSelectedCount > 0;
    const hasPromptOrConcept = isAutomaticMode ? true : Boolean(scenePrompt && scenePrompt.trim().length > 0);
    const isReady = hasProducts && hasPromptOrConcept;

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
                        <span
                            className={`rotate-180 rounded border px-1 py-0.5 font-mono text-[9px] font-bold [writing-mode:vertical-rl] ${
                                isReady
                                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400'
                            }`}
                        >
                            {isReady ? 'READY' : 'INCOMPLETE'}
                        </span>
                    </div>
                </div>

                <div className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors group-hover:text-foreground">
                    <Sparkles className="h-3.5 w-3.5" />
                </div>
            </aside>
        );
    }

    return (
        <aside className="sticky top-11 z-20 flex h-[calc(100vh-2.75rem)] w-72 shrink-0 flex-col justify-between overflow-y-auto border-l border-border/80 bg-card/80 p-3.5 backdrop-blur-2xl transition-all duration-300 sm:top-12 sm:h-[calc(100vh-3rem)] sm:w-80 lg:w-[300px] xl:w-[320px] dark:bg-card/90">
            <div className="space-y-3.5">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-2xs border border-primary/20">
                            <Sparkles className="h-3.5 w-3.5" />
                        </div>
                        <div>
                            <span className="text-xs font-bold tracking-tight text-foreground block">
                                Studio Brief Summary
                            </span>
                            <span
                                className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.2 font-mono text-[9px] font-semibold ${
                                    isReady
                                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                        : 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400'
                                }`}
                            >
                                {isReady ? (
                                    <>
                                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                                        Ready to Generate
                                    </>
                                ) : (
                                    'Incomplete Required Fields'
                                )}
                            </span>
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

                {/* Section 1: Canvas Proportions & Engine */}
                <div className="space-y-2 rounded-2xl border border-border/70 bg-card/60 p-3 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px] font-bold tracking-wide text-foreground uppercase">
                        <span className="flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5 text-primary" />
                            Canvas & Engine
                        </span>
                        <span className="flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.2 font-mono text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                            {activeRatio}
                        </span>
                    </div>

                    {/* Proportional visual box preview */}
                    <div className="flex min-h-[90px] items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-background/70 p-2 shadow-inner">
                        <div
                            className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/60 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent transition-all ${
                                activeRatio === '9:16'
                                    ? 'h-[80px] w-[45px]'
                                    : activeRatio === '16:9'
                                      ? 'h-[45px] w-[80px]'
                                      : activeRatio === '4:5'
                                        ? 'h-[75px] w-[60px]'
                                        : 'h-[65px] w-[65px]'
                            }`}
                        >
                            <span className="font-mono text-[10px] font-bold text-primary">{activeRatio}</span>
                        </div>
                    </div>

                    <div className="space-y-1 pt-1 text-[11px]">
                        <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1">
                            <span className="text-muted-foreground">Dimensions:</span>
                            <span className="font-mono text-foreground">{activeRatioOption?.badge || '1024 × 1024'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="text-muted-foreground">Image Engine:</span>
                            <span className="font-mono font-semibold text-foreground">{imageModel}</span>
                        </div>
                    </div>
                </div>

                {/* Section 2: Promoting Offering */}
                <div className="space-y-2 rounded-2xl border border-border/70 bg-card/60 p-3 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px] font-bold tracking-wide text-foreground uppercase">
                        <span className="flex items-center gap-1.5">
                            <Package className="h-3.5 w-3.5 text-primary" />
                            Promoting Offering
                        </span>
                        <span
                            className={`flex items-center gap-1 rounded border px-1.5 py-0.2 font-mono text-[9px] font-bold ${
                                hasProducts
                                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400'
                            }`}
                        >
                            {hasProducts ? (
                                <>
                                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                                    {totalSelectedCount} Selected
                                </>
                            ) : (
                                'Required'
                            )}
                        </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                        {hasProducts ? (
                            <div className="space-y-1 rounded-xl border border-border/50 bg-background/60 p-2.5">
                                {selectedCatalogProducts.map((p) => (
                                    <div
                                        key={`catalog-${p.id}`}
                                        className="flex items-start justify-between gap-2 text-[11px]"
                                    >
                                        <span className="font-medium text-foreground break-words leading-tight">
                                            {p.name}
                                        </span>
                                        {p.price && (
                                            <span className="shrink-0 font-semibold text-foreground">
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
                                            className="flex items-start justify-between gap-2 text-[11px]"
                                        >
                                            <span className="font-medium text-foreground break-words leading-tight">
                                                {p.name} (Custom)
                                            </span>
                                            {p.price && (
                                                <span className="shrink-0 font-semibold text-foreground">
                                                    ₱{Number(p.price).toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-2.5 text-[11px] text-red-600 dark:text-red-400">
                                No products selected. Please select or add at least 1 product.
                            </div>
                        )}

                        {hasImageReference && (
                            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 p-2 text-[10px] text-muted-foreground">
                                <ImageIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span>Authoritative Catalog Product Imagery Referenced</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Section 3: Campaign & Event Context */}
                {(activeCampaign || selectedEvent) && (
                    <div className="space-y-2 rounded-2xl border border-border/70 bg-card/60 p-3 shadow-2xs">
                        <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-foreground uppercase">
                            <Compass className="h-3.5 w-3.5 text-primary" />
                            Campaign & Event
                        </span>

                        <div className="space-y-1 text-xs">
                            {activeCampaign && (
                                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1 text-[11px]">
                                    <span className="text-muted-foreground">Campaign:</span>
                                    <span className="font-semibold text-foreground text-right truncate max-w-[170px]" title={activeCampaign.name}>
                                        {activeCampaign.name}
                                    </span>
                                </div>
                            )}
                            {selectedEvent && (
                                <>
                                    <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1 text-[11px]">
                                        <span className="text-muted-foreground">Event / Holiday:</span>
                                        <span className="font-semibold text-foreground text-right truncate max-w-[170px]" title={selectedEvent.name}>
                                            {selectedEvent.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 text-[11px]">
                                        <span className="text-muted-foreground">Event Text:</span>
                                        <span
                                            className={`font-semibold ${
                                                showEventText
                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                    : 'text-muted-foreground'
                                            }`}
                                        >
                                            {showEventText ? 'Typography Allowed' : 'Visual Atmosphere Only'}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Section 4: Creative Direction & Presets */}
                <div className="space-y-2 rounded-2xl border border-border/70 bg-card/60 p-3 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px] font-bold tracking-wide text-foreground uppercase">
                        <span className="flex items-center gap-1.5">
                            <Camera className="h-3.5 w-3.5 text-primary" />
                            Creative Direction
                        </span>
                        <span
                            className={`flex items-center gap-1 rounded border px-1.5 py-0.2 font-mono text-[9px] font-bold ${
                                hasPromptOrConcept
                                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400'
                            }`}
                        >
                            {hasPromptOrConcept ? (
                                <>
                                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                                    Configured
                                </>
                            ) : (
                                'Prompt Required'
                            )}
                        </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                        {/* Scene Prompt or Concept */}
                        <div className="rounded-xl border border-border/50 bg-background/60 p-2.5 space-y-1">
                            <span className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase">
                                {isAutomaticMode ? 'Autonomous Visual Strategy' : 'Visual Scene Prompt'}
                            </span>
                            <p className="text-[11px] leading-relaxed text-foreground">
                                {isAutomaticMode
                                    ? creativeConcept || 'AI Creative Director will autonomously invent composition, backdrop, and staging.'
                                    : scenePrompt && scenePrompt.trim()
                                      ? `"${scenePrompt.trim()}"`
                                      : <span className="text-red-500 italic">No visual prompt entered yet.</span>}
                            </p>
                        </div>

                        {/* Presets Table */}
                        <div className="space-y-1 pt-1 text-[11px]">
                            {designTreatment && (
                                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1">
                                    <span className="text-muted-foreground">Treatment:</span>
                                    <span className="font-semibold text-foreground text-right">{designTreatment}</span>
                                </div>
                            )}
                            {copyEmphasis && (
                                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1">
                                    <span className="text-muted-foreground">Emphasis:</span>
                                    <span className="font-semibold text-foreground text-right">{copyEmphasis}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1">
                                <span className="text-muted-foreground">Render Style:</span>
                                <span className="font-semibold text-foreground text-right">
                                    {isAutomaticMode ? 'Autonomous Dynamic' : renderStyle || 'Studio Product Still'}
                                </span>
                            </div>
                            {contentStyle.length > 0 && (
                                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1">
                                    <span className="text-muted-foreground">Themes:</span>
                                    <span className="font-medium text-foreground text-right truncate max-w-[170px]" title={contentStyle.join(', ')}>
                                        {contentStyle.join(', ')}
                                    </span>
                                </div>
                            )}
                            {brandTone.length > 0 && (
                                <div className="flex items-center justify-between gap-2 text-[11px]">
                                    <span className="text-muted-foreground">Brand Tone:</span>
                                    <span className="font-medium text-foreground text-right truncate max-w-[170px]" title={brandTone.join(', ')}>
                                        {brandTone.join(', ')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Section 5: Marketing Copy Settings */}
                <div className="space-y-2 rounded-2xl border border-border/70 bg-card/60 p-3 shadow-2xs">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-foreground uppercase">
                        <PenTool className="h-3.5 w-3.5 text-primary" />
                        Marketing Copy
                    </span>

                    <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1 text-[11px]">
                            <span className="text-muted-foreground">Tagline Headline:</span>
                            <span
                                className={`font-semibold text-right truncate max-w-[170px] ${
                                    includeTagline ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                                }`}
                            >
                                {includeTagline ? (tagline && tagline.trim() ? `"${tagline.trim()}"` : 'AI Auto Generated') : 'OFF (Excluded)'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1 text-[11px]">
                            <span className="text-muted-foreground">Product Prices:</span>
                            <span className={`font-semibold ${includePrices ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                                {includePrices ? 'ON (Included)' : 'OFF (Excluded)'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="text-muted-foreground">Business Name:</span>
                            <span className={`font-semibold ${includeBusinessName ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                                {includeBusinessName ? `ON (${business?.name || 'Included'})` : 'OFF (Excluded)'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
