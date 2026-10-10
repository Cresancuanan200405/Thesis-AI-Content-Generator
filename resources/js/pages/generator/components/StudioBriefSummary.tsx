import {
    Camera,
    Compass,
    FileText,
    Package,
    PanelRightClose,
    PanelRightOpen,
    PenTool,
} from 'lucide-react';
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
    includeProductName?: boolean;
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
    tagline,
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
    visualStrategy,
    imageModel = 'GPT-Image-2',
    includeBusinessName = true,
    isAutomaticMode = false,
    includeProductName = true,
    includeTagline = true,
    includePrices = true,
}: StudioBriefSummaryProps) {
    const activeRatio = aspectRatio || '1:1';
    const activeRatioOption = aspectRatioOptions.find((o) => o.value === activeRatio);
    const hasProducts = totalSelectedCount > 0;
    const hasPromptOrConcept = isAutomaticMode
        ? true
        : Boolean(scenePrompt && scenePrompt.trim().length > 0);
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
                className="group sticky top-11 z-30 flex h-[calc(100vh-2.75rem)] w-11 shrink-0 cursor-pointer flex-col items-center justify-between border-l border-border/80 bg-card/60 py-4 backdrop-blur-xl transition-all duration-200 select-none hover:bg-muted/40 sm:top-12 sm:h-[calc(100vh-3rem)] lg:w-12"
                title="Open Brief Summary"
            >
                <div className="flex flex-col items-center gap-5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-primary/10 text-primary shadow-2xs transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                        <PanelRightOpen className="h-4 w-4" />
                    </div>

                    <div className="flex flex-col items-center gap-3 py-2">
                        <span className="rotate-180 text-[10px] font-bold tracking-widest text-muted-foreground uppercase transition-colors [writing-mode:vertical-rl] group-hover:text-foreground">
                            Brief Summary
                        </span>
                        <span
                            className={`h-2 w-2 rounded-full ${
                                isReady ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            title={isReady ? 'Ready to Generate' : 'Required Fields Pending'}
                        />
                    </div>
                </div>

                <div className="flex h-6 w-6 items-center justify-center rounded-[8px] text-muted-foreground transition-colors group-hover:text-foreground">
                    <FileText className="h-3.5 w-3.5" />
                </div>
            </aside>
        );
    }

    return (
        <aside className="sticky top-11 z-30 flex h-[calc(100vh-2.75rem)] w-72 shrink-0 flex-col justify-between overflow-y-auto border-l border-border/80 bg-card/75 p-3.5 backdrop-blur-2xl transition-all duration-300 sm:top-12 sm:h-[calc(100vh-3rem)] sm:w-80 lg:w-[310px] xl:w-[330px] dark:bg-card/85">
            <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-primary/10 text-primary border border-primary/20">
                            <FileText className="h-3.5 w-3.5" />
                        </div>
                        <div>
                            <span className="text-xs font-bold tracking-tight text-foreground block">
                                Studio Brief Summary
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span
                                    className={`h-2 w-2 rounded-full shrink-0 ${
                                        isReady ? 'bg-emerald-500' : 'bg-amber-500'
                                    }`}
                                />
                                <span
                                    className={`text-[11px] font-medium ${
                                        isReady
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-amber-600 dark:text-amber-400'
                                    }`}
                                >
                                    {isReady ? 'Ready to Generate' : 'Required Fields Pending'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onToggleCollapse(true)}
                        className="h-7 w-7 cursor-pointer rounded-[8px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title="Collapse summary sidebar"
                    >
                        <PanelRightClose className="h-4 w-4" />
                    </Button>
                </div>

                {/* 1. CAMPAIGN & EVENT (FIRST) */}
                <div className="rounded-[10px] border border-border/50 bg-background/50 dark:bg-muted/10 backdrop-blur-md p-3.5 space-y-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <Compass className="h-3.5 w-3.5 text-primary" />
                        Campaign & Event
                    </span>

                    <div className="space-y-2 text-[11px]">
                        {activeCampaign ? (
                            <div className="flex flex-col gap-0.5 border-b border-border/30 pb-1.5">
                                <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                                    Campaign
                                </span>
                                <span className="font-semibold text-foreground break-words leading-relaxed">
                                    {activeCampaign.name}
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between gap-2 border-b border-border/30 pb-1.5">
                                <span className="text-muted-foreground">Campaign</span>
                                <span className="text-muted-foreground italic">None linked</span>
                            </div>
                        )}
                        {selectedEvent ? (
                            <>
                                <div className="flex flex-col gap-0.5 border-b border-border/30 pb-1.5">
                                    <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                                        Event / Holiday
                                    </span>
                                    <span className="font-semibold text-foreground break-words leading-relaxed">
                                        {selectedEvent.name}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-2 pt-0.5">
                                    <span className="text-muted-foreground">Event Copy</span>
                                    <span
                                        className={`font-semibold ${
                                            showEventText
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-muted-foreground'
                                        }`}
                                    >
                                        {showEventText ? 'Typography Allowed' : 'Atmosphere Only'}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-between gap-2 pt-0.5">
                                <span className="text-muted-foreground">Event / Holiday</span>
                                <span className="text-muted-foreground italic">None linked</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. SELECTED PRODUCTS (SECOND) */}
                <div className="rounded-[10px] border border-border/50 bg-background/50 dark:bg-muted/10 backdrop-blur-md p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                            <Package className="h-3.5 w-3.5 text-primary" />
                            Selected Products
                        </span>
                        <span className="text-[11px] font-semibold text-muted-foreground">
                            {totalSelectedCount} {totalSelectedCount === 1 ? 'Item' : 'Items'}
                        </span>
                    </div>

                    {hasProducts ? (
                        <div className="space-y-2">
                            {selectedCatalogProducts.map((p) => (
                                <div
                                    key={`catalog-${p.id}`}
                                    className="flex items-start justify-between gap-2 text-[11px] border-b border-border/30 pb-1.5 last:border-0 last:pb-0"
                                >
                                    <span className="font-medium text-foreground break-words leading-relaxed flex-1">
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
                                        className="flex items-start justify-between gap-2 text-[11px] border-b border-border/30 pb-1.5 last:border-0 last:pb-0"
                                    >
                                        <span className="font-medium text-foreground break-words leading-relaxed flex-1">
                                            {p.name}{' '}
                                            <span className="text-[10px] text-muted-foreground">
                                                (Custom)
                                            </span>
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
                        <p className="text-[11px] leading-relaxed text-amber-600 dark:text-amber-400">
                            No products selected yet. Select at least 1 product from catalog or custom items.
                        </p>
                    )}
                </div>

                {/* 3. CREATIVE DIRECTION (THIRD) */}
                <div className="rounded-[10px] border border-border/50 bg-background/50 dark:bg-muted/10 backdrop-blur-md p-3.5 space-y-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <Camera className="h-3.5 w-3.5 text-primary" />
                        Creative Direction
                    </span>

                    <div className="space-y-2 text-[11px]">
                        {/* Render Style */}
                        <div className="flex items-center justify-between gap-2 border-b border-border/30 pb-1.5">
                            <span className="text-muted-foreground">Render Style</span>
                            <span className="font-semibold text-foreground text-right break-words">
                                {isAutomaticMode ? 'Autonomous Dynamic' : renderStyle || 'Studio Product Still'}
                            </span>
                        </div>

                        {/* Canvas Proportions & Engine */}
                        <div className="flex items-center justify-between gap-2 border-b border-border/30 pb-1.5">
                            <span className="text-muted-foreground">Canvas Ratio</span>
                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                                {activeRatio} ({activeRatioOption?.badge || '1024 × 1024'})
                            </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 border-b border-border/30 pb-1.5">
                            <span className="text-muted-foreground">Image Engine</span>
                            <span className="font-mono text-foreground font-medium">
                                {imageModel}
                            </span>
                        </div>

                        {/* Scene Prompt or Visual Strategy - FULL TEXT */}
                        <div className="flex flex-col gap-1 border-b border-border/30 pb-1.5">
                            <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                                {isAutomaticMode ? 'Visual Strategy' : 'Visual Scene Prompt'}
                            </span>
                            <p className="font-normal text-foreground leading-relaxed break-words">
                                {isAutomaticMode
                                    ? creativeConcept || visualStrategy || 'AI Creative Director will autonomously invent composition, backdrop, and staging.'
                                    : scenePrompt && scenePrompt.trim()
                                      ? `"${scenePrompt.trim()}"`
                                      : <span className="text-amber-600 dark:text-amber-400 italic">No visual prompt entered yet.</span>}
                            </p>
                        </div>

                        {designTreatment && (
                            <div className="flex items-center justify-between gap-2 border-b border-border/30 pb-1.5">
                                <span className="text-muted-foreground">Treatment</span>
                                <span className="font-semibold text-foreground text-right break-words">
                                    {designTreatment}
                                </span>
                            </div>
                        )}

                        {copyEmphasis && (
                            <div className="flex items-center justify-between gap-2 border-b border-border/30 pb-1.5">
                                <span className="text-muted-foreground">Emphasis</span>
                                <span className="font-semibold text-foreground text-right break-words">
                                    {copyEmphasis}
                                </span>
                            </div>
                        )}

                        {contentStyle.length > 0 && (
                            <div className="flex flex-col gap-0.5 border-b border-border/30 pb-1.5">
                                <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                                    Themes
                                </span>
                                <span className="font-medium text-foreground break-words leading-relaxed">
                                    {contentStyle.join(', ')}
                                </span>
                            </div>
                        )}

                        {brandTone.length > 0 && (
                            <div className="flex flex-col gap-0.5">
                                <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                                    Brand Tone
                                </span>
                                <span className="font-medium text-foreground break-words leading-relaxed">
                                    {brandTone.join(', ')}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. MARKETING COPY (FOURTH) */}
                <div className="rounded-[10px] border border-border/50 bg-background/50 dark:bg-muted/10 backdrop-blur-md p-3.5 space-y-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <PenTool className="h-3.5 w-3.5 text-primary" />
                        Marketing Copy
                    </span>

                    <div className="space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between gap-2 border-b border-border/30 pb-1.5">
                            <span className="text-muted-foreground">Product Name</span>
                            <span
                                className={`font-semibold ${
                                    includeProductName
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-muted-foreground'
                                }`}
                            >
                                {includeProductName ? 'Included' : 'Excluded'}
                            </span>
                        </div>

                        <div className="flex flex-col gap-0.5 border-b border-border/30 pb-1.5">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-muted-foreground">Tagline Headline</span>
                                <span
                                    className={`font-semibold ${
                                        includeTagline
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-muted-foreground'
                                    }`}
                                >
                                    {includeTagline ? 'Included' : 'Excluded'}
                                </span>
                            </div>
                            {includeTagline && tagline && tagline.trim() && (
                                <p className="text-[10px] text-foreground font-medium leading-relaxed break-words mt-0.5">
                                    "{tagline.trim()}"
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-between gap-2 border-b border-border/30 pb-1.5">
                            <span className="text-muted-foreground">Product Prices</span>
                            <span
                                className={`font-semibold ${
                                    includePrices
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-muted-foreground'
                                }`}
                            >
                                {includePrices ? 'Included' : 'Excluded'}
                            </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">Business Name</span>
                            <span
                                className={`font-semibold ${
                                    includeBusinessName
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-muted-foreground'
                                }`}
                            >
                                {includeBusinessName
                                    ? `Included (${business?.name || 'Registered'})`
                                    : 'Excluded'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
