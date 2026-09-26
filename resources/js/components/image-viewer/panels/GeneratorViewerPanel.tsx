import React, { useState } from 'react';
import {
    AlertCircle,
    Bookmark,
    Check,
    ChevronDown,
    ChevronUp,
    Cpu,
    Download,
    FileText,
    Palette,
    RefreshCcw,
    SlidersHorizontal,
    Sparkles,
    Type,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GeneratorViewerItem } from '../types';

export interface GeneratorViewerPanelProps {
    item: GeneratorViewerItem;
    mode?: 'automatic' | 'manual';
    productName: string;
    aspectRatio?: string;
    campaignName?: string;
    eventName?: string;
    isSavedToDesigns: boolean;
    isSavingDesign: boolean;
    onSaveToDesigns: () => void | Promise<void>;
    isSavedAsDraft?: boolean;
    isSavingDraft?: boolean;
    onSaveAsDraft?: () => void | Promise<void>;
    onDownload: (format: 'png' | 'jpeg') => void;
    onRegenerate: () => void;
    onEditCreative: () => void;
    saveError?: string | null;

    // Context & Direction
    catalogProducts?: Array<{ id: number | string; name: string; price?: number | string | null }>;
    customProducts?: Array<{ name: string; price?: string; description?: string }>;
    creativeConcept?: string;
    visualStrategy?: string;
    designTreatment?: string;
    copyEmphasis?: string;
    renderStyle?: string;
    visualTheme?: string | string[];
    brandTone?: string | string[];
    composition?: string;
    cameraViewpoint?: string;
    lightingProfile?: string;

    // Marketing Copy & States
    businessName?: string;
    includeBusinessName?: boolean;
    tagline?: string;
    taglineMode?: string;
    includeTagline?: boolean;
    price?: string | number;
    includePrices?: boolean;
    showEventText?: boolean;

    // Generation Details / Technical
    imageModel?: string;
    hasReferenceImage?: boolean;
    creativeFingerprint?: string;
    origin?: string | null;
}

export function GeneratorViewerPanel({
    item,
    mode = 'automatic',
    productName,
    aspectRatio = '1:1',
    campaignName,
    eventName,
    isSavedToDesigns,
    isSavingDesign,
    onSaveToDesigns,
    isSavedAsDraft = false,
    isSavingDraft = false,
    onSaveAsDraft,
    onDownload,
    onRegenerate,
    onEditCreative,
    saveError,
    catalogProducts = [],
    customProducts = [],
    creativeConcept,
    visualStrategy,
    designTreatment,
    copyEmphasis,
    renderStyle,
    visualTheme,
    brandTone,
    composition,
    cameraViewpoint,
    lightingProfile,
    businessName,
    includeBusinessName = true,
    tagline,
    taglineMode = 'ai',
    includeTagline = true,
    price,
    includePrices = true,
    showEventText,
    imageModel = 'GPT-Image-2',
    hasReferenceImage = false,
    creativeFingerprint,
    origin,
}: GeneratorViewerPanelProps) {
    const [isGenDetailsExpanded, setIsGenDetailsExpanded] = useState(false);

    const meta = item.generation_meta || {};

    const effectiveTheme = Array.isArray(visualTheme)
        ? visualTheme.join(', ')
        : visualTheme;

    const effectiveTone = Array.isArray(brandTone)
        ? brandTone.join(', ')
        : brandTone;

    const effectiveConcept = creativeConcept || (typeof meta.creative_concept === 'string' ? meta.creative_concept : undefined);
    const effectiveStrategy = visualStrategy || (typeof meta.visual_strategy === 'string' ? meta.visual_strategy : undefined);
    const effectiveTreatment = designTreatment || (typeof meta.design_treatment === 'string' ? meta.design_treatment : undefined);
    const effectiveEmphasis = copyEmphasis || (typeof meta.copy_emphasis === 'string' ? meta.copy_emphasis : undefined);
    const effectiveRenderStyle = renderStyle || (typeof meta.render_style === 'string' ? meta.render_style : undefined);
    const effectiveFingerprint = creativeFingerprint || (typeof meta.creative_fingerprint === 'string' ? meta.creative_fingerprint : undefined);
    const effectiveComposition = composition || (typeof meta.composition_type === 'string' ? meta.composition_type : typeof meta.composition === 'string' ? meta.composition : undefined);
    const effectiveCamera = cameraViewpoint || (typeof meta.camera_viewpoint === 'string' ? meta.camera_viewpoint : undefined);
    const effectiveLighting = lightingProfile || (typeof meta.lighting_profile === 'string' ? meta.lighting_profile : undefined);

    const displayTagline = tagline || item.tagline || '';
    const displayPrice = price !== undefined && price !== null && price !== ''
        ? String(price)
        : (catalogProducts[0]?.price !== undefined && catalogProducts[0]?.price !== null ? String(catalogProducts[0].price) : '');

    // Formatted taglines and copy visibility badges
    const taglineStatusBadge = !includeTagline || !displayTagline.trim()
        ? { text: 'Disabled', color: 'border-border/80 bg-muted/40 text-muted-foreground' }
        : taglineMode === 'custom'
            ? { text: 'Custom', color: 'border-border/80 bg-muted/50 text-foreground' }
            : { text: 'AI-generated', color: 'border-primary/30 bg-primary/10 text-primary' };

    const businessNameBadge = includeBusinessName
        ? { text: 'Visible', color: 'border-primary/30 bg-primary/10 text-primary' }
        : { text: 'Hidden', color: 'border-border/80 bg-muted/40 text-muted-foreground' };

    const priceBadge = includePrices && displayPrice.trim()
        ? { text: 'Visible', color: 'border-primary/30 bg-primary/10 text-primary' }
        : { text: 'Hidden', color: 'border-border/80 bg-muted/40 text-muted-foreground' };

    const isFinalStatus = isSavedToDesigns || item.status === 'final' || item.status === 'completed';
    const isDraftStatus = isSavedAsDraft || item.status === 'draft';

    return (
        <div className="flex h-full flex-col justify-between">
            {/* Top Review Sections */}
            <div className="p-4 sm:p-5 space-y-4">
                {/* Header Metadata Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pb-1 border-b border-border/50">
                    <Badge
                        variant="outline"
                        className="font-mono text-[11px] font-semibold border-primary/30 bg-primary/5 text-primary"
                    >
                        {mode === 'automatic' ? 'Automatic Studio' : 'Manual Studio'}
                    </Badge>
                    <Badge
                        variant="outline"
                        className="font-mono text-[11px] font-semibold border-border bg-muted/30 text-foreground"
                    >
                        {aspectRatio}
                    </Badge>
                    {origin === 'designs' ? (
                        <Badge
                            variant="outline"
                            className="max-w-[180px] truncate text-[11px] font-medium border-border/60 bg-muted/20 text-muted-foreground"
                        >
                            My Designs
                        </Badge>
                    ) : campaignName ? (
                        <Badge
                            variant="outline"
                            className="max-w-[180px] truncate text-[11px] font-medium border-border/60 bg-muted/20 text-muted-foreground"
                        >
                            {campaignName}
                        </Badge>
                    ) : null}
                    {(isFinalStatus || isDraftStatus) && (
                        <Badge
                            variant="outline"
                            className={`font-mono text-[11px] font-semibold ${
                                isFinalStatus
                                    ? 'border-primary/40 bg-primary/10 text-primary'
                                    : 'border-border/80 bg-muted/50 text-muted-foreground'
                            }`}
                        >
                            {isFinalStatus ? 'STATUS: FINAL' : 'STATUS: DRAFT'}
                        </Badge>
                    )}
                </div>

                {/* ================================================================= */}
                {/* SECTION 1: Context                                                */}
                {/* ================================================================= */}
                <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3 shadow-xs">
                    <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                        <Palette className="h-4 w-4 text-primary" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Context
                        </h3>
                    </div>

                    <div className="space-y-2 text-xs">
                        <div>
                            <span className="text-muted-foreground block text-[11px] font-medium">
                                Primary Product
                            </span>
                            <span className="font-semibold text-foreground text-sm">
                                {productName || 'Featured Product'}
                            </span>
                        </div>

                        {(catalogProducts.length > 1 || customProducts.length > 0) && (
                            <div>
                                <span className="text-muted-foreground block text-[11px] font-medium mb-1">
                                    Included Products ({catalogProducts.length + customProducts.length})
                                </span>
                                <div className="flex flex-wrap gap-1">
                                    {catalogProducts.map((p) => (
                                        <Badge
                                            key={p.id}
                                            variant="secondary"
                                            className="text-[10px] font-normal"
                                        >
                                            {p.name}
                                        </Badge>
                                    ))}
                                    {customProducts.map((cp, idx) => (
                                        <Badge
                                            key={`cp-${idx}`}
                                            variant="outline"
                                            className="text-[10px] font-normal border-dashed"
                                        >
                                            {cp.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40">
                            <div>
                                <span className="text-muted-foreground block text-[11px] font-medium">
                                    Campaign
                                </span>
                                <span className="font-medium text-foreground truncate block">
                                    {campaignName || 'Standalone Visual'}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-[11px] font-medium">
                                    Event / Holiday
                                </span>
                                <span className="font-medium text-foreground truncate block">
                                    {eventName || 'Standard / None'}
                                </span>
                            </div>
                            {Boolean(eventName && eventName !== 'Standard / None') && (
                                <>
                                    <div>
                                        <span className="text-muted-foreground block text-[11px] font-medium">
                                            Event Visual Influence
                                        </span>
                                        <span className="font-semibold text-foreground block">
                                            Included
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-[11px] font-medium">
                                            Show Event/Holiday Text
                                        </span>
                                        <span className="font-semibold text-foreground block">
                                            {(typeof showEventText === 'boolean'
                                                ? showEventText
                                                : (meta.show_event_text ?? true))
                                                ? 'On'
                                                : 'Off'}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ================================================================= */}
                {/* SECTION 2: Creative Direction                                     */}
                {/* ================================================================= */}
                <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3 shadow-xs">
                    <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Creative Direction
                        </h3>
                    </div>

                    <div className="space-y-2.5 text-xs">
                        {effectiveConcept && (
                            <div>
                                <span className="text-muted-foreground block text-[11px] font-medium">
                                    Creative Concept
                                </span>
                                <p className="mt-0.5 text-foreground leading-relaxed italic bg-muted/20 p-2 rounded-lg border border-border/40">
                                    "{effectiveConcept}"
                                </p>
                            </div>
                        )}

                        {effectiveStrategy && (
                            <div>
                                <span className="text-muted-foreground block text-[11px] font-medium">
                                    Visual Strategy
                                </span>
                                <p className="mt-0.5 text-foreground leading-relaxed bg-muted/20 p-2 rounded-lg border border-border/40">
                                    {effectiveStrategy}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 pt-1">
                            {effectiveTreatment && (
                                <div className="rounded-lg bg-muted/20 border border-border/40 p-2">
                                    <span className="text-muted-foreground block text-[10px] font-medium uppercase">
                                        Design Treatment
                                    </span>
                                    <span className="font-semibold text-foreground truncate block mt-0.5">
                                        {effectiveTreatment}
                                    </span>
                                </div>
                            )}

                            {effectiveEmphasis && (
                                <div className="rounded-lg bg-muted/20 border border-border/40 p-2">
                                    <span className="text-muted-foreground block text-[10px] font-medium uppercase">
                                        Copy Emphasis
                                    </span>
                                    <span className="font-semibold text-foreground truncate block mt-0.5">
                                        {effectiveEmphasis}
                                    </span>
                                </div>
                            )}

                            {effectiveRenderStyle && (
                                <div className="rounded-lg bg-muted/20 border border-border/40 p-2">
                                    <span className="text-muted-foreground block text-[10px] font-medium uppercase">
                                        Render Style
                                    </span>
                                    <span className="font-semibold text-foreground truncate block mt-0.5">
                                        {effectiveRenderStyle}
                                    </span>
                                </div>
                            )}

                            <div className="rounded-lg bg-muted/20 border border-border/40 p-2">
                                <span className="text-muted-foreground block text-[10px] font-medium uppercase">
                                    Aspect Ratio
                                </span>
                                <span className="font-semibold font-mono text-foreground truncate block mt-0.5">
                                    {aspectRatio}
                                </span>
                            </div>

                            {effectiveTheme && (
                                <div className="rounded-lg bg-muted/20 border border-border/40 p-2">
                                    <span className="text-muted-foreground block text-[10px] font-medium uppercase">
                                        Visual Theme
                                    </span>
                                    <span className="font-semibold text-foreground truncate block mt-0.5">
                                        {effectiveTheme}
                                    </span>
                                </div>
                            )}

                            {effectiveTone && (
                                <div className="rounded-lg bg-muted/20 border border-border/40 p-2">
                                    <span className="text-muted-foreground block text-[10px] font-medium uppercase">
                                        Brand Tone
                                    </span>
                                    <span className="font-semibold text-foreground truncate block mt-0.5">
                                        {effectiveTone}
                                    </span>
                                </div>
                            )}

                            {effectiveComposition && (
                                <div className="rounded-lg bg-muted/20 border border-border/40 p-2">
                                    <span className="text-muted-foreground block text-[10px] font-medium uppercase">
                                        Composition
                                    </span>
                                    <span className="font-semibold text-foreground truncate block mt-0.5">
                                        {effectiveComposition}
                                    </span>
                                </div>
                            )}

                            {effectiveCamera && (
                                <div className="rounded-lg bg-muted/20 border border-border/40 p-2">
                                    <span className="text-muted-foreground block text-[10px] font-medium uppercase">
                                        Camera
                                    </span>
                                    <span className="font-semibold text-foreground truncate block mt-0.5">
                                        {effectiveCamera}
                                    </span>
                                </div>
                            )}

                            {effectiveLighting && (
                                <div className="rounded-lg bg-muted/20 border border-border/40 p-2">
                                    <span className="text-muted-foreground block text-[10px] font-medium uppercase">
                                        Lighting
                                    </span>
                                    <span className="font-semibold text-foreground truncate block mt-0.5">
                                        {effectiveLighting}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ================================================================= */}
                {/* SECTION 3: Marketing Copy                                         */}
                {/* ================================================================= */}
                <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3 shadow-xs">
                    <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                        <Type className="h-4 w-4 text-primary" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Marketing Copy
                        </h3>
                    </div>

                    <div className="space-y-2.5 text-xs">
                        {/* Business Name */}
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border/40">
                            <div className="min-w-0 pr-2">
                                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                                    Business Name
                                </span>
                                <span className="font-semibold text-foreground truncate block">
                                    {businessName || 'Business Brand'}
                                </span>
                            </div>
                            <Badge variant="outline" className={`text-[10px] font-semibold ${businessNameBadge.color}`}>
                                {businessNameBadge.text}
                            </Badge>
                        </div>

                        {/* Tagline */}
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border/40">
                            <div className="min-w-0 pr-2">
                                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                                    Tagline
                                </span>
                                <span className="font-semibold text-foreground truncate block italic">
                                    {displayTagline ? `"${displayTagline}"` : 'None'}
                                </span>
                            </div>
                            <Badge variant="outline" className={`text-[10px] font-semibold ${taglineStatusBadge.color}`}>
                                {taglineStatusBadge.text}
                            </Badge>
                        </div>

                        {/* Price */}
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border/40">
                            <div className="min-w-0 pr-2">
                                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                                    Price
                                </span>
                                <span className="font-semibold text-foreground truncate block">
                                    {displayPrice ? `₱${Number(displayPrice.replace(/[^0-9.]/g, '')).toLocaleString()}` : 'None'}
                                </span>
                            </div>
                            <Badge variant="outline" className={`text-[10px] font-semibold ${priceBadge.color}`}>
                                {priceBadge.text}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* ================================================================= */}
                {/* SECTION 4: Generation Details (Collapsed Accordion)               */}
                {/* ================================================================= */}
                <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs">
                    <button
                        type="button"
                        onClick={() => setIsGenDetailsExpanded(!isGenDetailsExpanded)}
                        className="flex w-full items-center justify-between p-3.5 text-xs font-semibold text-foreground hover:bg-muted/30 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Cpu className="h-4 w-4 text-primary" />
                            <span>Generation Details</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <span className="text-[11px]">Audit / Technical</span>
                            {isGenDetailsExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </div>
                    </button>

                    {isGenDetailsExpanded && (
                        <div className="border-t border-border/60 p-3.5 space-y-2 text-xs bg-muted/10">
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div className="rounded-lg border border-border/50 bg-background/50 p-2">
                                    <span className="text-muted-foreground block text-[10px] uppercase font-medium">
                                        Model
                                    </span>
                                    <span className="font-semibold text-foreground font-mono">
                                        {(typeof meta.model === 'string' && meta.model) || imageModel}
                                    </span>
                                </div>
                                <div className="rounded-lg border border-border/50 bg-background/50 p-2">
                                    <span className="text-muted-foreground block text-[10px] uppercase font-medium">
                                        Method
                                    </span>
                                    <span className="font-semibold text-foreground">
                                        {(typeof meta.generation_method === 'string' && meta.generation_method) || (hasReferenceImage ? 'Image-to-Image Edit' : 'Text-to-Image')}
                                    </span>
                                </div>
                                <div className="rounded-lg border border-border/50 bg-background/50 p-2">
                                    <span className="text-muted-foreground block text-[10px] uppercase font-medium">
                                        Reference Images
                                    </span>
                                    <span className="font-semibold text-foreground">
                                        {catalogProducts.length + (hasReferenceImage ? 1 : 0)} source(s)
                                    </span>
                                </div>
                                <div className="rounded-lg border border-border/50 bg-background/50 p-2">
                                    <span className="text-muted-foreground block text-[10px] uppercase font-medium">
                                        Compositor Engine
                                    </span>
                                    <span className="font-semibold text-foreground">
                                        {(typeof meta.compositor_engine === 'string' && meta.compositor_engine) || (typeof meta.engine === 'string' && meta.engine) || 'Deterministic Layer'}
                                    </span>
                                </div>
                                <div className="rounded-lg border border-border/50 bg-background/50 p-2">
                                    <span className="text-muted-foreground block text-[10px] uppercase font-medium">
                                        Fallback State
                                    </span>
                                    <span className="font-semibold text-foreground">
                                        {(typeof meta.fallback_state === 'string' && meta.fallback_state) || 'none'}
                                    </span>
                                </div>
                                {effectiveFingerprint && (
                                    <div className="rounded-lg border border-border/50 bg-background/50 p-2">
                                        <span className="text-muted-foreground block text-[10px] uppercase font-medium">
                                            Fingerprint
                                        </span>
                                        <span className="font-mono text-muted-foreground truncate block">
                                            {effectiveFingerprint}
                                        </span>
                                    </div>
                                )}
                                {Boolean(eventName && eventName !== 'Standard / None') && (
                                    <>
                                        <div className="rounded-lg border border-border/50 bg-background/50 p-2">
                                            <span className="text-muted-foreground block text-[10px] uppercase font-medium">
                                                Event Visual Influence
                                            </span>
                                            <span className="font-semibold text-foreground">
                                                Included
                                            </span>
                                        </div>
                                        <div className="rounded-lg border border-border/50 bg-background/50 p-2">
                                            <span className="text-muted-foreground block text-[10px] uppercase font-medium">
                                                Show Event/Holiday Text
                                            </span>
                                            <span className="font-semibold text-foreground">
                                                {(typeof showEventText === 'boolean'
                                                    ? showEventText
                                                    : (meta.show_event_text ?? true))
                                                    ? 'On'
                                                    : 'Off'}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky Bottom Actions & Error Alert */}
            <div className="sticky bottom-0 z-10 border-t border-border/80 bg-background/95 backdrop-blur-md p-3 sm:p-4 space-y-2.5">
                {/* Save Error Alert */}
                {saveError && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 sm:p-3 text-xs text-destructive space-y-1">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span className="font-medium whitespace-pre-line">{saveError}</span>
                        </div>
                        <span className="block text-[11px] text-destructive/80 font-normal pl-6">
                            Creative image preserved. You can retry Save Design.
                        </span>
                    </div>
                )}

                {/* Footer Buttons - Two balanced responsive tiers that fit all screen sizes */}
                <div className="space-y-2">
                    {/* Tier 1: Primary Save / Finalize / Draft CTAs */}
                    <div className={`grid gap-2 ${onSaveAsDraft && !isSavedToDesigns ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {/* Save as Draft Action */}
                        {onSaveAsDraft && !isSavedToDesigns && (
                            isSavedAsDraft ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled
                                    className="h-9 w-full justify-center gap-1.5 text-xs border-border bg-muted/50 text-foreground font-semibold cursor-default"
                                >
                                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                    <span className="truncate">Draft saved</span>
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={onSaveAsDraft}
                                    disabled={isSavingDraft || isSavingDesign}
                                    className="h-9 w-full justify-center gap-1.5 text-xs font-semibold hover:bg-muted"
                                >
                                    {isSavingDraft ? (
                                        <>
                                            <RefreshCcw className="h-3.5 w-3.5 animate-spin shrink-0" />
                                            <span className="truncate">Saving Draft...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="h-3.5 w-3.5 shrink-0" />
                                            <span className="truncate">Save as Draft</span>
                                        </>
                                    )}
                                </Button>
                            )
                        )}

                        {/* Save Design Button / Saved State */}
                        {isSavedToDesigns ? (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled
                                className="h-9 w-full justify-center gap-1.5 text-xs border-primary/40 bg-primary/10 text-primary font-semibold cursor-default"
                            >
                                <Check className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">Saved to My Designs</span>
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                size="sm"
                                onClick={onSaveToDesigns}
                                disabled={isSavingDesign || isSavingDraft}
                                className="h-9 w-full justify-center gap-1.5 text-xs font-semibold shadow-xs"
                            >
                                {isSavingDesign ? (
                                    <>
                                        <RefreshCcw className="h-3.5 w-3.5 animate-spin shrink-0" />
                                        <span className="truncate">Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Bookmark className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate">{isSavedAsDraft ? 'Finalize Design' : 'Save Design'}</span>
                                    </>
                                )}
                            </Button>
                        )}
                    </div>

                    {/* Tier 2: Utility Actions (Download, Regenerate, Edit Creative) */}
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                        {/* Download Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={!item.image_url}
                                    className="h-8.5 w-full justify-center gap-1 px-1.5 sm:px-2 text-xs font-medium text-foreground hover:bg-muted"
                                >
                                    <Download className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">Download</span>
                                    <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-40">
                                <DropdownMenuItem onClick={() => onDownload('png')} className="text-xs cursor-pointer">
                                    Download PNG
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDownload('jpeg')} className="text-xs cursor-pointer">
                                    Download JPEG
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Regenerate Button */}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onRegenerate}
                            className="h-8.5 w-full justify-center gap-1 px-1.5 sm:px-2 text-xs font-medium text-foreground hover:bg-muted"
                            title="Regenerate creative"
                        >
                            <RefreshCcw className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">Regenerate</span>
                        </Button>

                        {/* Edit Creative Button */}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onEditCreative}
                            className="h-8.5 w-full justify-center gap-1 px-1.5 sm:px-2 text-xs font-medium text-foreground hover:bg-muted"
                            title="Edit creative prompt & settings"
                        >
                            <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">Edit</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
