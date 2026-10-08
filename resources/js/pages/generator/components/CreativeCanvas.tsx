import { useState, useMemo } from 'react';
import { Link } from '@inertiajs/react';
import {
    Check,
    ChevronDown,
    ChevronUp,
    Cpu,
    Download,
    Edit3,
    Eye,
    FileText,
    Loader2,
    RefreshCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GeneratedDesign, ImageQuality } from './types';

export interface CreativeCanvasProps {
    productName: string;
    tagline?: string;
    price?: string;
    imageModel: string;
    imageQuality: ImageQuality;
    aspectRatio: string;
    savedDesign: GeneratedDesign | null;
    isSavedToDesigns: boolean;
    isSavingDesign: boolean;
    onSaveToDesigns: () => void;
    isSavedAsDraft?: boolean;
    isSavingDraft?: boolean;
    onSaveAsDraft?: () => void;
    onDownload: (format: 'png' | 'jpeg') => void;
    onOpenFullscreen: () => void;
    onViewGeneratedCreative?: () => void;
    onEditParameters: () => void;
    onRegenerate: () => void;
    designId?: string | number | null;
    origin?: string | null;
    campaignId?: string | number | null;
    campaignName?: string | null;

    // Creative & Context Inputs
    mode?: 'manual' | 'automatic';
    eventName?: string;
    showEventText?: boolean;
    catalogProducts?: Array<{ id: number | string; name: string; price?: number | string | null }>;
    customProducts?: Array<{ name: string; price?: string; description?: string }>;
    scenePrompt?: string;
    creativeConcept?: string;
    visualStrategy?: string;
    designTreatment?: string;
    copyEmphasis?: string;
    renderStyle?: string;
    visualTheme?: string | string[];
    brandTone?: string | string[];
    hasReferenceImage?: boolean;

    // Marketing Copy & Visibility States
    includeProductName?: boolean;
    includePrices?: boolean;
    includeBusinessName?: boolean;
    businessName?: string;
    includeTagline?: boolean;
}

export function CreativeCanvas({
    productName,
    tagline,
    price,
    imageModel,
    imageQuality,
    aspectRatio,
    savedDesign,
    isSavedToDesigns,
    isSavingDesign,
    onSaveToDesigns,
    isSavedAsDraft = false,
    isSavingDraft = false,
    onSaveAsDraft,
    onDownload,
    onOpenFullscreen,
    onViewGeneratedCreative,
    onEditParameters,
    onRegenerate,
    campaignId,
    campaignName,
    mode = 'manual',
    eventName,
    showEventText,
    catalogProducts,
    customProducts,
    scenePrompt,
    creativeConcept,
    visualStrategy,
    designTreatment,
    copyEmphasis,
    renderStyle,
    visualTheme,
    brandTone,
    hasReferenceImage = false,
    includeProductName = true,
    includePrices = true,
    includeBusinessName = true,
    businessName,
    includeTagline = true,
}: CreativeCanvasProps) {
    const [isTechDetailsExpanded, setIsTechDetailsExpanded] = useState(false);

    const handleViewCreative = onViewGeneratedCreative || onOpenFullscreen;
    const isDraftStatus = isSavedAsDraft || savedDesign?.status === 'draft';

    // Format currency price
    const formatPrice = (p?: string | number | null) => {
        if (p === null || p === undefined || p === '') return null;
        const str = String(p).trim();
        const num = Number(str.replace(/[^0-9.]/g, ''));
        if (isNaN(num)) return str;
        return `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Combine all selected products for clear itemized presentation
    const allDisplayProducts = useMemo(() => {
        const items: Array<{ name: string; price?: string | number | null }> = [];
        if (catalogProducts && catalogProducts.length > 0) {
            catalogProducts.forEach((p) => {
                items.push({ name: p.name, price: p.price });
            });
        }
        if (customProducts && customProducts.length > 0) {
            customProducts.forEach((cp) => {
                if (cp.name) items.push({ name: cp.name, price: cp.price });
            });
        }
        if (items.length === 0 && productName) {
            items.push({ name: productName, price });
        }
        return items;
    }, [catalogProducts, customProducts, productName, price]);

    // Format canvas dimensions from aspect ratio
    const resolvedResolution = useMemo(() => {
        switch (aspectRatio) {
            case '16:9':
            case '4:3':
                return '1792 × 1024';
            case '9:16':
            case '4:5':
                return '1024 × 1792';
            default:
                return '1024 × 1024';
        }
    }, [aspectRatio]);

    const refCount = savedDesign?.generation_meta?.actual_reference_count ??
        (hasReferenceImage ? (catalogProducts?.length || 1) : 0);

    const generationMethod = savedDesign?.generation_meta?.generation_method
        ? String(savedDesign.generation_meta.generation_method).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : hasReferenceImage
          ? 'Image-to-Image Edit'
          : 'Text-to-Image';

    const durationSeconds = savedDesign?.generation_meta?.duration_seconds;
    const effectiveEventName = eventName || savedDesign?.generation_meta?.event_name;
    const isEventTextVisible = typeof showEventText === 'boolean'
        ? showEventText
        : (savedDesign?.generation_meta?.show_event_text ?? true);

    const formattedTheme = Array.isArray(visualTheme) ? visualTheme.join(', ') : visualTheme;
    const formattedTone = Array.isArray(brandTone) ? brandTone.join(', ') : brandTone;

    return (
        <Card className="mx-auto max-w-3xl overflow-hidden rounded-card border-border bg-card shadow-sm">
            <CardHeader className="border-b p-5 md:p-6 pb-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                        Visual Creative Ready
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        High-resolution commercial creative generated for {productName}
                    </p>
                </div>
            </CardHeader>

            <CardContent className="space-y-5 p-5 md:p-6">
                <div className="animate-in space-y-5 duration-300 fade-in">
                    {/* PRIMARY GENERATED VISUAL (CLICKABLE IMAGE-LED HERO) */}
                    <div
                        onClick={handleViewCreative}
                        className="group relative cursor-zoom-in overflow-hidden rounded-card border border-border bg-muted/15 p-3 sm:p-5 transition-all hover:border-primary/50 hover:shadow-md"
                        title="Click to view full image canvas in pure viewer"
                    >
                        {savedDesign?.image_url ? (
                            <div className="relative flex max-h-[540px] w-full items-center justify-center overflow-hidden rounded-lg bg-background/50">
                                <img
                                    src={savedDesign.image_url}
                                    alt={productName}
                                    className="max-h-[520px] w-auto max-w-full rounded-md object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                                />
                                <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/50 via-transparent to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                                    <span className="flex items-center gap-1.5 rounded-md bg-black/80 px-3 py-1.5 text-xs font-medium text-white shadow-md backdrop-blur-md">
                                        <Eye className="h-3.5 w-3.5 text-primary" />
                                        Click to zoom & pan canvas
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full max-w-md space-y-3 rounded-lg border border-border bg-card p-6 text-center text-card-foreground">
                                <h3 className="text-xl font-bold">{productName}</h3>
                                {tagline && (
                                    <p className="text-xs font-medium text-muted-foreground">
                                        "{tagline}"
                                    </p>
                                )}
                                {price && (
                                    <p className="text-base font-bold text-primary">
                                        {formatPrice(price)}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* STATUS ALERT (IF SAVED) */}
                    {isSavedToDesigns && (
                        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 p-3 px-4 text-xs">
                            <div className="flex items-center gap-2 text-primary font-medium">
                                <Check className="h-4 w-4" />
                                <span>Visual saved to My Designs</span>
                            </div>
                            <Button
                                asChild
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-primary hover:text-primary/80 px-2"
                            >
                                <Link href={campaignId ? `/campaigns/${campaignId}` : '/campaigns'}>
                                    Open Campaign →
                                </Link>
                            </Button>
                        </div>
                    )}

                    {/* AUTHORITATIVE ACTION BAR */}
                    <div className="space-y-3">
                        <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                            {onSaveAsDraft && !isSavedToDesigns && (
                                <Button
                                    type="button"
                                    onClick={onSaveAsDraft}
                                    disabled={isSavingDraft || isSavingDesign}
                                    variant="outline"
                                    className={`h-10 rounded-lg text-xs font-semibold shadow-xs ${
                                        isDraftStatus
                                            ? 'border-border bg-muted/40 text-foreground'
                                            : ''
                                    }`}
                                >
                                    {isSavingDraft ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <FileText className="mr-2 h-4 w-4" />
                                    )}
                                    {isDraftStatus ? 'Draft saved' : 'Save as Draft'}
                                </Button>
                            )}

                            <Button
                                type="button"
                                onClick={onSaveToDesigns}
                                disabled={isSavingDesign || isSavingDraft}
                                variant={isSavedToDesigns ? 'outline' : 'default'}
                                className={`h-10 rounded-lg text-xs font-semibold shadow-xs ${
                                    isSavedToDesigns
                                        ? 'border-primary/40 bg-primary/10 text-primary'
                                        : ''
                                }`}
                            >
                                {isSavingDesign ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Check className="mr-2 h-4 w-4" />
                                )}
                                {isSavedToDesigns
                                    ? 'Saved in Designs'
                                    : isDraftStatus
                                      ? 'Finalize Design'
                                      : 'Save to Designs'}
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-10 rounded-lg gap-1.5 text-xs font-semibold shadow-none"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download Visual
                                        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-52 rounded-lg border-border p-1.5 shadow-lg"
                                >
                                    <DropdownMenuItem
                                        onClick={() => onDownload('png')}
                                        className="cursor-pointer gap-2 text-xs font-medium"
                                    >
                                        <Download className="h-3.5 w-3.5 text-primary" />
                                        PNG (High Quality)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => onDownload('jpeg')}
                                        className="cursor-pointer gap-2 text-xs font-medium"
                                    >
                                        <Download className="h-3.5 w-3.5 text-blue-500" />
                                        JPEG (Web-Optimized)
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* SUB ACTIONS (EDIT & REGENERATE) */}
                        <div className="flex items-center justify-between border-t border-border/60 pt-2.5">
                            <button
                                type="button"
                                onClick={onEditParameters}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            >
                                <Edit3 className="h-3.5 w-3.5" />
                                Edit Parameters
                            </button>

                            <button
                                type="button"
                                onClick={onRegenerate}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline transition-colors cursor-pointer"
                            >
                                <RefreshCcw className="h-3.5 w-3.5" />
                                Regenerate Variation
                            </button>
                        </div>
                    </div>

                    {/* RESTRUCTURED UNIFIED GENERATION DETAILS SECTION */}
                    <div className="overflow-hidden rounded-card border border-border/80 bg-card shadow-xs">
                        <div className="border-b border-border/60 bg-muted/20 px-4 py-3 sm:px-5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Generation Details
                            </h3>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                                Inputs and creative parameters used to generate this marketing visual
                            </p>
                        </div>

                        <div className="p-4 sm:p-5 space-y-4">
                            {/* TOP GRID: CAMPAIGN, EVENT, CREATIVE DIRECTION */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {/* CAMPAIGN */}
                                <div className="rounded-lg border border-border/60 bg-muted/10 p-3 space-y-1">
                                    <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Campaign
                                    </span>
                                    <p className="text-xs font-semibold text-foreground">
                                        {campaignName || 'Standard / None'}
                                    </p>
                                </div>

                                {/* EVENT */}
                                <div className="rounded-lg border border-border/60 bg-muted/10 p-3 space-y-1">
                                    <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Event / Holiday
                                    </span>
                                    <p className="text-xs font-semibold text-foreground">
                                        {effectiveEventName || 'Standard / None'}
                                    </p>
                                    {effectiveEventName && (
                                        <p className="text-[10px] text-muted-foreground">
                                            Text: {isEventTextVisible ? 'Visible in copy' : 'Visual theme only (text hidden)'}
                                        </p>
                                    )}
                                </div>

                                {/* CREATIVE DIRECTION */}
                                <div className="rounded-lg border border-border/60 bg-muted/10 p-3 space-y-1">
                                    <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Creative Direction
                                    </span>
                                    <p className="text-xs font-semibold text-foreground">
                                        {mode === 'automatic' ? 'Autonomous AI Studio' : 'Manual Creative Studio'}
                                    </p>
                                    {(scenePrompt || creativeConcept || visualStrategy) && (
                                        <p className="text-[10px] text-muted-foreground line-clamp-2" title={scenePrompt || creativeConcept || visualStrategy}>
                                            {scenePrompt || creativeConcept || visualStrategy}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* PRODUCTS SECTION */}
                            <div className="rounded-lg border border-border/60 bg-muted/10 p-3 space-y-1.5">
                                <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Selected Products ({allDisplayProducts.length})
                                </span>
                                <div className="space-y-1 pt-0.5">
                                    {allDisplayProducts.map((p, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between text-xs py-1 border-b border-border/40 last:border-0"
                                        >
                                            <span className="font-medium text-foreground">
                                                {idx + 1}. {p.name}
                                            </span>
                                            {p.price && (
                                                <span className="font-mono text-[11px] font-semibold text-primary">
                                                    {formatPrice(p.price)}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* COPY & VISUAL GRID */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* COPY SETTINGS */}
                                <div className="rounded-lg border border-border/60 bg-muted/10 p-3 space-y-2">
                                    <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Copy & Typography
                                    </span>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex justify-between py-0.5">
                                            <span className="text-muted-foreground">Copy Emphasis</span>
                                            <span className="font-medium text-foreground">{copyEmphasis || 'Balanced'}</span>
                                        </div>
                                        <div className="flex justify-between py-0.5">
                                            <span className="text-muted-foreground">Product Name</span>
                                            <span className="font-medium text-foreground">{includeProductName !== false ? 'Visible' : 'Hidden'}</span>
                                        </div>
                                        <div className="flex justify-between py-0.5">
                                            <span className="text-muted-foreground">Price</span>
                                            <span className="font-medium text-foreground">{includePrices !== false ? 'Visible' : 'Hidden'}</span>
                                        </div>
                                        <div className="flex justify-between py-0.5">
                                            <span className="text-muted-foreground">Business Name</span>
                                            <span className="font-medium text-foreground">
                                                {includeBusinessName !== false ? (businessName || 'Visible') : 'Hidden'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-0.5">
                                            <span className="text-muted-foreground">Tagline</span>
                                            <span className="font-medium text-foreground truncate max-w-[180px]">
                                                {includeTagline !== false && tagline ? `"${tagline}"` : 'Hidden'}
                                            </span>
                                        </div>
                                        {effectiveEventName && (
                                            <div className="flex justify-between py-0.5">
                                                <span className="text-muted-foreground">Event Text</span>
                                                <span className="font-medium text-foreground">{isEventTextVisible ? 'Visible' : 'Hidden'}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* VISUAL STYLING */}
                                <div className="rounded-lg border border-border/60 bg-muted/10 p-3 space-y-2">
                                    <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Visual Styling
                                    </span>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex justify-between py-0.5">
                                            <span className="text-muted-foreground">Render Style</span>
                                            <span className="font-medium text-foreground">{renderStyle || 'Studio Product Still'}</span>
                                        </div>
                                        <div className="flex justify-between py-0.5">
                                            <span className="text-muted-foreground">Canvas Ratio</span>
                                            <span className="font-mono font-medium text-foreground">{aspectRatio || '1:1'}</span>
                                        </div>
                                        {formattedTheme && (
                                            <div className="flex justify-between py-0.5">
                                                <span className="text-muted-foreground">Visual Theme</span>
                                                <span className="font-medium text-foreground truncate max-w-[180px]">{formattedTheme}</span>
                                            </div>
                                        )}
                                        {formattedTone && (
                                            <div className="flex justify-between py-0.5">
                                                <span className="text-muted-foreground">Brand Tone</span>
                                                <span className="font-medium text-foreground truncate max-w-[180px]">{formattedTone}</span>
                                            </div>
                                        )}
                                        {designTreatment && (
                                            <div className="flex justify-between py-0.5">
                                                <span className="text-muted-foreground">Treatment</span>
                                                <span className="font-medium text-foreground">{designTreatment}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* TECHNICAL DETAILS (COLLAPSIBLE) */}
                            <div className="rounded-lg border border-border/60 bg-muted/10 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setIsTechDetailsExpanded(!isTechDetailsExpanded)}
                                    className="flex w-full items-center justify-between p-3 text-xs font-semibold text-foreground hover:bg-muted/30 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-2">
                                        <Cpu className="h-4 w-4 text-muted-foreground" />
                                        <span>Technical Details</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <span className="text-[11px]">
                                            {isTechDetailsExpanded ? 'Hide' : 'Show'}
                                        </span>
                                        {isTechDetailsExpanded ? (
                                            <ChevronUp className="h-4 w-4" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4" />
                                        )}
                                    </div>
                                </button>
                                {isTechDetailsExpanded && (
                                    <div className="border-t border-border/50 p-3 pt-2 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                                        <div>
                                            <span className="text-[10px] text-muted-foreground uppercase font-mono">Model</span>
                                            <p className="font-semibold text-foreground">{imageModel || 'GPT-Image-2'}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-muted-foreground uppercase font-mono">Method</span>
                                            <p className="font-semibold text-foreground">{generationMethod}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-muted-foreground uppercase font-mono">Reference Images</span>
                                            <p className="font-semibold text-foreground">{refCount}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-muted-foreground uppercase font-mono">Canvas Resolution</span>
                                            <p className="font-semibold text-foreground">{resolvedResolution}</p>
                                        </div>
                                        {durationSeconds && (
                                            <div>
                                                <span className="text-[10px] text-muted-foreground uppercase font-mono">Duration</span>
                                                <p className="font-semibold text-foreground">{durationSeconds}s</p>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-[10px] text-muted-foreground uppercase font-mono">Safe Margin</span>
                                            <p className="font-semibold text-foreground">20% Internal Safe Zone</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
