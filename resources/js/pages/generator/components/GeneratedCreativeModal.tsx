import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    AlertCircle,
    Bookmark,
    Check,
    ChevronDown,
    ChevronUp,
    Cpu,
    Download,
    ExternalLink,
    Maximize2,
    Minimize2,
    Palette,
    RefreshCcw,
    SlidersHorizontal,
    Sparkles,
    Type,
    X,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GeneratedDesign } from './types';

export interface GeneratedCreativeModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'automatic' | 'manual';
    productName: string;
    aspectRatio: string;
    campaignName?: string;
    eventName?: string;
    savedDesign: GeneratedDesign | null;
    isSavedToDesigns: boolean;
    isSavingDesign: boolean;
    onSaveToDesigns: () => void | Promise<void>;
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

    // Generation Details / Technical
    imageModel?: string;
    hasReferenceImage?: boolean;
    creativeFingerprint?: string;
}

export function GeneratedCreativeModal({
    isOpen,
    onClose,
    mode,
    productName,
    aspectRatio,
    campaignName,
    eventName,
    savedDesign,
    isSavedToDesigns,
    isSavingDesign,
    onSaveToDesigns,
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
    imageModel = 'GPT-Image-2',
    hasReferenceImage = false,
    creativeFingerprint,
}: GeneratedCreativeModalProps) {
    const [zoomLevel, setZoomLevel] = useState<number | 'fit'>('fit');
    const [isGenDetailsExpanded, setIsGenDetailsExpanded] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent background scrolling and lock body completely when modal is open
    useEffect(() => {
        if (!isOpen) return;

        const originalBodyOverflow = document.body.style.overflow;
        const originalBodyPosition = document.body.style.position;
        const originalBodyTop = document.body.style.top;
        const originalBodyWidth = document.body.style.width;
        const originalHtmlOverflow = document.documentElement.style.overflow;
        const originalHtmlScrollBehavior = document.documentElement.style.scrollBehavior;

        const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

        // Completely freeze HTML document & body at current scroll position
        document.documentElement.style.overflow = 'hidden';
        document.documentElement.style.scrollBehavior = 'auto';
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';

        if (scrollbarWidth > 0) {
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.documentElement.style.overflow = originalHtmlOverflow;
            document.documentElement.style.scrollBehavior = originalHtmlScrollBehavior;
            document.body.style.overflow = originalBodyOverflow;
            document.body.style.position = originalBodyPosition;
            document.body.style.top = originalBodyTop;
            document.body.style.width = originalBodyWidth;
            document.body.style.paddingRight = '';
            window.removeEventListener('keydown', handleKeyDown);

            // Restore exact scroll position without scrolling animation
            window.scrollTo(0, scrollY);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !mounted) return null;

    const handleZoomIn = () => {
        setZoomLevel((prev) => (prev === 'fit' ? 1.25 : Math.min(prev + 0.25, 2.5)));
    };

    const handleZoomOut = () => {
        setZoomLevel((prev) => (prev === 'fit' ? 0.75 : Math.max(prev - 0.25, 0.5)));
    };

    const handleReset100 = () => {
        setZoomLevel(1);
    };

    const handleFit = () => {
        setZoomLevel('fit');
    };

    const meta = savedDesign?.generation_meta || {};

    const effectiveTheme = Array.isArray(visualTheme)
        ? visualTheme.join(', ')
        : visualTheme;

    const effectiveTone = Array.isArray(brandTone)
        ? brandTone.join(', ')
        : brandTone;

    const effectiveConcept = creativeConcept || meta.creative_concept;
    const effectiveStrategy = visualStrategy || meta.visual_strategy;
    const effectiveTreatment = designTreatment || meta.design_treatment;
    const effectiveEmphasis = copyEmphasis || meta.copy_emphasis;
    const effectiveRenderStyle = renderStyle || meta.render_style;
    const effectiveFingerprint = creativeFingerprint || meta.creative_fingerprint;
    const effectiveComposition = composition || meta.composition_type || meta.composition;
    const effectiveCamera = cameraViewpoint || meta.camera_viewpoint;
    const effectiveLighting = lightingProfile || meta.lighting_profile;

    const displayTagline = tagline || savedDesign?.tagline || '';
    const displayPrice = price !== undefined && price !== null && price !== ''
        ? String(price)
        : (catalogProducts[0]?.price !== undefined && catalogProducts[0]?.price !== null ? String(catalogProducts[0].price) : '');

    // Formatted taglines and copy visibility badges
    const taglineStatusBadge = !includeTagline || !displayTagline.trim()
        ? { text: 'Disabled', color: 'border-muted-foreground/30 bg-muted/40 text-muted-foreground' }
        : taglineMode === 'custom'
            ? { text: 'Custom', color: 'border-amber-500/30 bg-amber-500/10 text-amber-500' }
            : { text: 'AI-generated', color: 'border-purple-500/30 bg-purple-500/10 text-purple-400' };

    const businessNameBadge = includeBusinessName
        ? { text: 'Visible', color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' }
        : { text: 'Hidden', color: 'border-muted-foreground/30 bg-muted/40 text-muted-foreground' };

    const priceBadge = includePrices && displayPrice.trim()
        ? { text: 'Visible', color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' }
        : { text: 'Hidden', color: 'border-muted-foreground/30 bg-muted/40 text-muted-foreground' };

    const modalContent = (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 md:p-6 select-none overscroll-contain animate-in fade-in duration-200"
            onClick={onClose}
            onWheel={(e) => {
                if (e.target === e.currentTarget) {
                    e.preventDefault();
                }
            }}
            onTouchMove={(e) => {
                if (e.target === e.currentTarget) {
                    e.preventDefault();
                }
            }}
        >
            <div
                className="relative flex flex-col w-full max-w-7xl h-[94vh] max-h-[950px] bg-background border border-border/80 rounded-2xl shadow-2xl overflow-hidden overscroll-contain"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ========================================================================= */}
                {/* HEADER (B2)                                                               */}
                {/* ========================================================================= */}
                <div className="flex items-center justify-between border-b border-border/70 px-5 py-3.5 bg-muted/20">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Sparkles className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
                                Generated Marketing Creative
                            </h2>
                        </div>

                        {/* Compact Metadata Badges */}
                        <div className="hidden sm:flex items-center gap-1.5 ml-2">
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
                                {aspectRatio || '1:1'}
                            </Badge>
                            {campaignName && (
                                <Badge
                                    variant="outline"
                                    className="max-w-[200px] truncate text-[11px] font-medium border-border/60 bg-muted/20 text-muted-foreground"
                                >
                                    {campaignName}
                                </Badge>
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                        title="Close modal"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* ========================================================================= */}
                {/* MAIN CONTENT AREA (B1: Left Image + Right Panels)                         */}
                {/* ========================================================================= */}
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
                    {/* --------------------------------------------------------------------- */}
                    {/* LEFT: Dominant Image Area with Lightweight Viewing Controls (B3)       */}
                    {/* --------------------------------------------------------------------- */}
                    <div className="flex-1 lg:w-[62%] xl:w-[65%] flex flex-col bg-zinc-950/80 border-b lg:border-b-0 lg:border-r border-border/60 relative overflow-hidden min-h-[320px]">
                        {/* Viewing Controls Bar */}
                        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/40 backdrop-blur-sm z-10">
                            <div className="flex items-center gap-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleZoomOut}
                                    className="h-8 px-2.5 text-xs text-zinc-300 hover:text-white hover:bg-white/10"
                                    title="Zoom Out"
                                >
                                    <ZoomOut className="h-3.5 w-3.5 mr-1" />
                                    <span className="hidden sm:inline">Zoom Out</span>
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleFit}
                                    className={`h-8 px-2.5 text-xs text-zinc-300 hover:text-white hover:bg-white/10 ${
                                        zoomLevel === 'fit' ? 'bg-white/15 text-white font-semibold' : ''
                                    }`}
                                    title="Fit to Screen"
                                >
                                    <Minimize2 className="h-3.5 w-3.5 mr-1" />
                                    Fit
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleReset100}
                                    className={`h-8 px-2.5 text-xs text-zinc-300 hover:text-white hover:bg-white/10 ${
                                        zoomLevel === 1 ? 'bg-white/15 text-white font-semibold' : ''
                                    }`}
                                    title="100% Size"
                                >
                                    <Maximize2 className="h-3.5 w-3.5 mr-1" />
                                    100%
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleZoomIn}
                                    className="h-8 px-2.5 text-xs text-zinc-300 hover:text-white hover:bg-white/10"
                                    title="Zoom In"
                                >
                                    <ZoomIn className="h-3.5 w-3.5 mr-1" />
                                    <span className="hidden sm:inline">Zoom In</span>
                                </Button>
                            </div>

                            {savedDesign?.image_url && (
                                <a
                                    href={savedDesign.image_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-2 py-1 rounded transition-colors"
                                    title="Open raw image in new tab"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Fullscreen</span>
                                </a>
                            )}
                        </div>

                        {/* Image Viewport */}
                        <div className="flex-1 flex items-center justify-center p-4 overflow-auto overscroll-contain min-h-0">
                            {savedDesign?.image_url ? (
                                <div
                                    className="relative flex items-center justify-center transition-all duration-200"
                                    style={{
                                        width: zoomLevel === 'fit' ? '100%' : `${zoomLevel * 100}%`,
                                        height: zoomLevel === 'fit' ? '100%' : 'auto',
                                    }}
                                >
                                    <img
                                        src={savedDesign.image_url}
                                        alt={productName || 'Generated Marketing Creative'}
                                        className={`rounded-xl shadow-2xl transition-transform ${
                                            zoomLevel === 'fit'
                                                ? 'max-h-full max-w-full object-contain'
                                                : 'w-full h-auto object-contain'
                                        }`}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center p-8 text-zinc-400 space-y-2">
                                    <Sparkles className="h-10 w-10 text-primary/60" />
                                    <p className="text-sm font-medium">No generated image to display.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* --------------------------------------------------------------------- */}
                    {/* RIGHT: Review Panels (Context, Direction, Marketing Copy, Details)   */}
                    {/* --------------------------------------------------------------------- */}
                    <div className="lg:w-[38%] xl:w-[35%] flex flex-col overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4 bg-card/60 min-h-0">
                        {/* ================================================================= */}
                        {/* SECTION 1: Context (B4)                                           */}
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
                                </div>
                            </div>
                        </div>

                        {/* ================================================================= */}
                        {/* SECTION 2: Creative Direction (B4)                                */}
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
                                            {aspectRatio || '1:1'}
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
                        {/* SECTION 3: Marketing Copy (Authoritative State) (B5)                */}
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
                        {/* SECTION 4: Generation Details (Collapsed Accordion) (B6)          */}
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
                                                {meta.model || imageModel}
                                            </span>
                                        </div>
                                        <div className="rounded-lg border border-border/50 bg-background/50 p-2">
                                            <span className="text-muted-foreground block text-[10px] uppercase font-medium">
                                                Method
                                            </span>
                                            <span className="font-semibold text-foreground">
                                                {meta.generation_method || (hasReferenceImage ? 'Image-to-Image Edit' : 'Text-to-Image')}
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
                                                {meta.compositor_engine || meta.engine || 'Deterministic Layer'}
                                            </span>
                                        </div>
                                        <div className="rounded-lg border border-border/50 bg-background/50 p-2">
                                            <span className="text-muted-foreground block text-[10px] uppercase font-medium">
                                                Fallback State
                                            </span>
                                            <span className="font-semibold text-emerald-500">
                                                {meta.fallback_state || 'none'}
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
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* ERROR ALERT (PART D: Show actual validation errors if save fails)         */}
                {/* ========================================================================= */}
                {saveError && (
                    <div className="border-t border-destructive/30 bg-destructive/10 px-5 py-2.5 flex items-center justify-between text-xs text-destructive">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span className="font-medium whitespace-pre-line">{saveError}</span>
                        </div>
                        <span className="text-[11px] text-destructive/80 font-normal">
                            Creative image preserved. You can retry Save Design.
                        </span>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* FOOTER ACTIONS (B1, B7: Action Button Hierarchy)                          */}
                {/* ========================================================================= */}
                <div className="flex flex-wrap items-center justify-between border-t border-border/70 px-5 py-3.5 bg-muted/20 gap-3">
                    {/* Secondary Actions (B7: Regenerate & Edit Creative) */}
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onRegenerate}
                            className="gap-1.5 text-xs text-foreground hover:bg-muted"
                        >
                            <RefreshCcw className="h-3.5 w-3.5" />
                            <span>Regenerate</span>
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onEditCreative}
                            className="gap-1.5 text-xs text-foreground hover:bg-muted"
                        >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            <span>Edit Creative</span>
                        </Button>
                    </div>

                    {/* Primary Actions (B7: Save Design & Download) */}
                    <div className="flex items-center gap-2">
                        {/* Download Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant={isSavedToDesigns ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!savedDesign?.image_url}
                                    className="gap-1.5 text-xs"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    <span>Download</span>
                                    <ChevronDown className="h-3 w-3 opacity-60" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={() => onDownload('png')} className="text-xs cursor-pointer">
                                    Download PNG
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDownload('jpeg')} className="text-xs cursor-pointer">
                                    Download JPEG
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Save Design Button / Saved State */}
                        {isSavedToDesigns ? (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled
                                className="gap-1.5 text-xs border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold cursor-default"
                            >
                                <Check className="h-3.5 w-3.5" />
                                <span>Saved to My Designs</span>
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                size="sm"
                                onClick={onSaveToDesigns}
                                disabled={isSavingDesign}
                                className="gap-1.5 text-xs font-semibold shadow-sm"
                            >
                                {isSavingDesign ? (
                                    <>
                                        <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Bookmark className="h-3.5 w-3.5" />
                                        <span>Save Design</span>
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
