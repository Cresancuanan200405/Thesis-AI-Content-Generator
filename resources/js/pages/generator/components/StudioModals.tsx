import { useState } from 'react';
import {
    BadgePercent,
    Building2,
    CalendarDays,
    Camera,
    Check,
    ChevronDown,
    ChevronUp,
    Download,
    ExternalLink,
    Layers,
    Loader2,
    Maximize2,
    Package,
    Palette,
    Search,
    SlidersHorizontal,
    Sparkles,
    Type,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AspectRatioSelector } from './AspectRatioSelector';
import { StepWizardNav, WizardStepItem } from './StepWizardNav';
import {
    ASPECT_RATIO_CONFIGS,
    EventItem,
    GeneratedDesign,
    ProductItem,
    renderStyleOptions,
    RENDER_STYLE_ASSETS,
    Step,
} from './types';
export { GeneratedCreativeModal } from './GeneratedCreativeModal';
export type { GeneratedCreativeModalProps } from './GeneratedCreativeModal';

interface CatalogBrowserModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    products: ProductItem[];
    selectedProducts: ProductItem[];
    onToggleProduct: (product: ProductItem) => void;
}

export function CatalogBrowserModal({
    isOpen,
    onOpenChange,
    products,
    selectedProducts,
    onToggleProduct,
}: CatalogBrowserModalProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filtered = products.filter((p) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            p.name.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q))
        );
    });

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="flex flex-col min-h-[460px] max-h-[80vh] h-[540px] w-[92vw] sm:max-w-[660px] md:max-w-[700px] overflow-hidden rounded-[12px] p-0 shadow-2xl border border-border">
                {/* MODAL HEADER */}
                <DialogHeader className="shrink-0 border-b border-border/80 bg-muted/20 px-4 sm:px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-primary/10 text-primary border border-primary/20">
                            <Package className="h-3.5 w-3.5" />
                        </div>
                        <div>
                            <DialogTitle className="text-sm font-bold text-foreground tracking-tight sm:text-base">
                                Select Catalog Products
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                Select one or more catalog products to feature in your marketing design.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* SEARCH & FILTER BAR */}
                <div className="shrink-0 border-b border-border/60 bg-muted/10 px-4 sm:px-5 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search products by name or description..."
                                className="h-9 pl-9 pr-8 text-xs rounded-[8px] bg-background border-border/80"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0 font-medium">
                            {filtered.length} {filtered.length === 1 ? 'product' : 'products'} available
                        </span>
                    </div>
                </div>

                {/* PRODUCT CARD GRID (MATCHING MY PRODUCTS PAGE DESIGN) */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
                    {filtered.length === 0 ? (
                        <div className="py-20 text-center text-muted-foreground">
                            <Package className="mx-auto h-10 w-10 opacity-30" />
                            <p className="mt-3 text-sm font-semibold text-foreground">No products found</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {searchQuery
                                    ? `No catalog items matched "${searchQuery}"`
                                    : 'No products in your catalog yet'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
                            {filtered.map((prod: ProductItem) => {
                                const isSelected = selectedProducts.some(
                                    (p) => String(p.id) === String(prod.id),
                                );

                                return (
                                    <div
                                        key={prod.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => onToggleProduct(prod)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                onToggleProduct(prod);
                                            }
                                        }}
                                        className="group flex flex-col text-left cursor-pointer select-none focus:outline-hidden"
                                    >
                                        {/* Product Image Stage (Full Image View, No Cropping - object-contain) */}
                                        <div
                                            className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[10px] sm:rounded-[12px] border transition-all duration-200 shadow-2xs ${
                                                isSelected
                                                    ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-500/[0.04] ring-2 ring-emerald-500/40 shadow-sm'
                                                    : 'border-border/70 bg-muted/20 hover:border-primary/50 hover:bg-muted/30 hover:shadow-xs'
                                            }`}
                                        >
                                            {prod.image_url ? (
                                                <img
                                                    src={prod.image_url}
                                                    alt={prod.name}
                                                    className="h-full w-full object-contain p-2.5 transition-transform duration-200 group-hover:scale-[1.02]"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-muted/30 text-muted-foreground/40">
                                                    <Package className="h-9 w-9 opacity-30" />
                                                </div>
                                            )}

                                            {/* Selection Check Badge */}
                                            {isSelected && (
                                                <div className="absolute top-2.5 right-2.5 flex h-6 w-6 items-center justify-center rounded-[6px] bg-emerald-600 text-white shadow-md ring-2 ring-background">
                                                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Details Header (Matching My Products Page) */}
                                        <div className="mt-2.5 flex items-start justify-between gap-1.5 px-0.5">
                                            <div className="min-w-0 flex-1">
                                                <h3
                                                    className={`truncate text-xs sm:text-sm font-semibold leading-tight transition-colors ${
                                                        isSelected ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-foreground'
                                                    }`}
                                                    title={prod.name}
                                                >
                                                    {prod.name}
                                                </h3>
                                                {prod.price !== null && prod.price !== undefined && prod.price !== '' ? (
                                                    <p className="mt-1 text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 font-mono">
                                                        ₱{Number(prod.price).toLocaleString(undefined, {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                    </p>
                                                ) : (
                                                    <p className="mt-1 text-[11px] text-muted-foreground italic">
                                                        Price not set
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* MODAL FOOTER */}
                <DialogFooter className="shrink-0 border-t border-border/80 bg-muted/20 px-4 sm:px-5 py-3 flex items-center justify-between sm:justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                        {selectedProducts.length} catalog{' '}
                        {selectedProducts.length === 1 ? 'product' : 'products'} selected
                    </span>
                    <Button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="h-8 px-5 rounded-[8px] text-xs font-bold cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    >
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface FullscreenViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    productName: string;
    aspectRatio: string;
    savedDesign: GeneratedDesign | null;
    onDownload: (format: 'png' | 'jpeg') => void;
}

export function FullscreenViewerModal({
    isOpen,
    onClose,
    productName,
    aspectRatio,
    savedDesign,
    onDownload,
}: FullscreenViewerModalProps) {
    const [isZoomed, setIsZoomed] = useState(false);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex animate-in flex-col items-center justify-between overflow-hidden bg-black/95 backdrop-blur-md duration-200 select-none fade-in"
            onClick={onClose}
        >
            {/* Top Floating Control Bar */}
            <div
                className="relative z-50 flex w-full items-center justify-between bg-gradient-to-b from-black/90 via-black/60 to-transparent px-4 py-3 sm:px-8 sm:py-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3">
                    <h2 className="max-w-[200px] truncate text-sm font-semibold text-white sm:max-w-md sm:text-base">
                        {productName || 'Marketing Visual'}
                    </h2>
                    <span className="rounded-md border border-white/20 bg-white/10 px-2.5 py-0.5 font-mono text-xs text-white">
                        {aspectRatio || '1:1'}
                    </span>
                    {savedDesign?.image_url && (
                        <span className="hidden rounded-md border border-white/20 bg-white/10 px-2 py-0.5 font-mono text-[11px] text-white/90 sm:inline">
                            Full Resolution
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {savedDesign?.image_url && (
                        <>
                            <button
                                type="button"
                                onClick={() => setIsZoomed(!isZoomed)}
                                className="flex h-8 items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20"
                                title={isZoomed ? 'Fit to Screen' : 'Zoom 100% Full Size'}
                            >
                                {isZoomed ? (
                                    <>
                                        <ZoomOut className="h-3.5 w-3.5" />
                                        <span className="hidden sm:inline">Fit Screen</span>
                                    </>
                                ) : (
                                    <>
                                        <ZoomIn className="h-3.5 w-3.5" />
                                        <span className="hidden sm:inline">Zoom 100%</span>
                                    </>
                                )}
                            </button>

                            <a
                                href={savedDesign.image_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hidden h-8 items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20 sm:flex"
                                title="Open image in new tab"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span>Open Tab</span>
                            </a>
                        </>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="flex h-8 items-center gap-1.5 rounded-md bg-white/15 px-3 text-xs font-semibold text-white backdrop-blur-md transition-all hover:bg-white/25"
                                title="Download Image"
                            >
                                <Download className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Download</span>
                                <ChevronDown className="h-3 w-3 opacity-70" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-48 rounded-xl border-white/20 bg-black/90 p-1.5 text-white shadow-xl backdrop-blur-xl"
                        >
                            <DropdownMenuItem
                                onClick={() => onDownload('png')}
                                className="cursor-pointer gap-2 text-xs font-medium text-white hover:bg-white/20 focus:bg-white/20 focus:text-white"
                            >
                                <Download className="h-3.5 w-3.5 text-primary" />
                                PNG (High Quality)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onDownload('jpeg')}
                                className="cursor-pointer gap-2 text-xs font-medium text-white hover:bg-white/20 focus:bg-white/20 focus:text-white"
                            >
                                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                                JPEG (Web-Optimized)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <button
                        type="button"
                        onClick={onClose}
                        className="ml-1 flex h-8 w-8 items-center justify-center rounded-md bg-white/15 text-white backdrop-blur-md transition-all hover:bg-white/30"
                        title="Close (Esc)"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Middle Main Image Canvas Area */}
            <div
                className="relative flex flex-1 w-full items-center justify-center overflow-auto p-4"
                onClick={(e) => e.stopPropagation()}
            >
                {savedDesign?.image_url ? (
                    <img
                        src={savedDesign.image_url}
                        alt={productName}
                        className={`transition-all duration-300 ${
                            isZoomed
                                ? 'max-w-none cursor-zoom-out'
                                : 'max-h-[85vh] max-w-[90vw] object-contain cursor-zoom-in'
                        }`}
                        onClick={() => setIsZoomed(!isZoomed)}
                    />
                ) : null}
            </div>
        </div>
    );
}

interface ConfirmationModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
}

export function ConfirmationModal({
    isOpen,
    onOpenChange,
    title,
    description,
    confirmLabel,
    onConfirm,
}: ConfirmationModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-card sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="rounded-xl"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={() => {
                            onConfirm();
                            onOpenChange(false);
                        }}
                        className="rounded-xl"
                    >
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export interface AutomaticSettingsModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    // Render style (Required)
    renderStyle: string;
    onRenderStyleChange: (style: string) => void;
    // Generation quantity (1-4)
    quantity: number;
    onQuantityChange: (qty: number) => void;
    // Variation settings
    promptVariation: 'different' | 'same';
    onPromptVariationChange: (val: 'different' | 'same') => void;
    taglineVariation: 'same' | 'different';
    onTaglineVariationChange: (val: 'same' | 'different') => void;
    styleVariation: 'same' | 'different';
    onStyleVariationChange: (val: 'same' | 'different') => void;
    // Canvas & Copy toggles
    aspectRatio: string;
    onAspectRatioChange: (val: string) => void;
    includeProductName?: boolean;
    onToggleProductName?: (val: boolean) => void;
    includeBusinessName: boolean;
    onToggleBusinessName: (val: boolean) => void;
    businessName?: string;
    includeTagline: boolean;
    onToggleTagline: (val: boolean) => void;
    includePrices: boolean;
    onTogglePrices: (val: boolean) => void;
    selectedEvent?: EventItem | null;
    showEventText: boolean;
    onToggleEventText: (val: boolean) => void;
    // Generation Action & Controls
    onGenerate: () => void;
    isGenerating?: boolean;
    canGenerate?: boolean;
}

/**
 * Generation & Canvas Settings Modal for Automatic Studio.
 * Enhances workflow with required canonical render-style selection,
 * selectable image quantity (1-4), configurable variation settings,
 * and direct generation trigger with generation summary.
 */
export function AutomaticSettingsModal({
    isOpen,
    onOpenChange,
    renderStyle,
    onRenderStyleChange,
    quantity,
    onQuantityChange,
    promptVariation,
    onPromptVariationChange,
    taglineVariation,
    onTaglineVariationChange,
    styleVariation,
    onStyleVariationChange,
    aspectRatio,
    onAspectRatioChange,
    includeProductName = true,
    onToggleProductName,
    includeBusinessName,
    onToggleBusinessName,
    businessName,
    includeTagline,
    onToggleTagline,
    includePrices,
    onTogglePrices,
    selectedEvent,
    showEventText,
    onToggleEventText,
    onGenerate,
    isGenerating = false,
    canGenerate = true,
}: AutomaticSettingsModalProps) {
    const [currentStep, setCurrentStep] = useState<Step>(1);

    const isStyleSelected = Boolean(renderStyle && renderStyle.trim().length > 0);
    const isGenerateDisabled = !isStyleSelected || isGenerating || !canGenerate;

    const activeElementsCount = [
        selectedEvent && showEventText,
        includeProductName,
        includePrices,
        includeTagline,
        includeBusinessName,
    ].filter(Boolean).length;

    const currentRatioConfig =
        ASPECT_RATIO_CONFIGS.find((c) => c.value === aspectRatio) ||
        ASPECT_RATIO_CONFIGS[0];

    const modalSteps: WizardStepItem[] = [
        {
            step: 1,
            title: 'Render Style',
            subtitle: renderStyle || 'Artistic Style',
            icon: Palette,
            isCompleted: isStyleSelected,
            isAccessible: true,
        },
        {
            step: 2,
            title: 'Quantity',
            subtitle: quantity === 1 ? '1 Image' : `${quantity} Images`,
            icon: Layers,
            isCompleted: true,
            isAccessible: true,
        },
        {
            step: 3,
            title: 'Canvas Ratio',
            subtitle: `${aspectRatio} (${currentRatioConfig.name})`,
            icon: Maximize2,
            isCompleted: Boolean(aspectRatio),
            isAccessible: true,
        },
        {
            step: 4,
            title: 'Typography',
            subtitle: `${activeElementsCount} Active Layers`,
            icon: Type,
            isCompleted: activeElementsCount > 0,
            isAccessible: true,
        },
    ];

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isGenerateDisabled) {
            onGenerate();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="flex flex-col min-h-[520px] max-h-[85vh] w-[95vw] sm:max-w-[760px] md:max-w-[800px] overflow-hidden rounded-[12px] p-0 shadow-2xl border border-border">
                {/* MODAL HEADER */}
                <DialogHeader className="shrink-0 border-b border-border/80 bg-muted/20 px-5 py-4">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-primary/10 text-primary border border-primary/20">
                            <SlidersHorizontal className="h-4 w-4" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-foreground tracking-tight">
                                Automatic Generation Settings
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                Configure creative render style, batch quantity, canvas proportions, and marketing typography.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleFormSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    {/* CHEVRON STEPPER BAR */}
                    <div className="shrink-0 border-b border-border/60 bg-muted/10 px-4 sm:px-6 py-2.5">
                        <StepWizardNav
                            currentStep={currentStep}
                            steps={modalSteps}
                            onSelectStep={setCurrentStep}
                        />
                    </div>

                    {/* TAB CONTENT AREA */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
                        {/* TAB 1: RENDER STYLE */}
                        {currentStep === 1 && (
                            <div className="space-y-4 animate-in fade-in-50 duration-150">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                            <Palette className="h-3.5 w-3.5 text-primary" />
                                            Render Style <span className="text-destructive">*</span>
                                        </Label>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            Choose the visual artistic rendering style for image synthesis.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <a
                                            href="/generator/inspiration"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors focus:outline-hidden"
                                            title="Analyze an advertising reference image to extract visual inspiration and recommended settings in a new tab"
                                        >
                                            <Sparkles className="h-3 w-3" />
                                            <span>Explore Design Inspiration</span>
                                            <ExternalLink className="h-2.5 w-2.5" />
                                        </a>
                                        <span className={`text-[11px] font-medium ${isStyleSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400 font-semibold'}`}>
                                            {isStyleSelected
                                                ? (quantity > 1 && styleVariation === 'different' ? 'Starting style' : 'Selected')
                                                : 'Selection required'}
                                        </span>
                                    </div>
                                </div>

                                {quantity > 1 && styleVariation === 'different' && (
                                    <p className="text-[11px] text-muted-foreground bg-muted/30 border border-border/70 rounded-[8px] p-3 leading-relaxed">
                                        <strong>Vary render styles enabled:</strong> The first output will use this selected style, and remaining outputs will distribute across the other supported canonical styles.
                                    </p>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                                    {renderStyleOptions.map((opt) => {
                                        const isSelected = renderStyle === opt.value;
                                        const imageUrl = RENDER_STYLE_ASSETS[opt.value];
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => onRenderStyleChange(opt.value)}
                                                className={`group relative flex flex-col rounded-[10px] border text-left transition-all duration-200 cursor-pointer select-none overflow-hidden ${
                                                    isSelected
                                                        ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.06] shadow-xs ring-1 ring-emerald-500/30'
                                                        : 'border-border/80 bg-card hover:border-border hover:bg-muted/30 hover:shadow-xs'
                                                }`}
                                            >
                                                <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/40 border-b border-border/50">
                                                    {imageUrl ? (
                                                        <img
                                                            src={imageUrl}
                                                            alt={opt.label}
                                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center">
                                                            <Camera className="h-6 w-6 text-muted-foreground/40" />
                                                        </div>
                                                    )}
                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-[6px] bg-emerald-600 text-white shadow-xs">
                                                            <Check className="h-3 w-3 stroke-[3]" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col flex-1 p-3">
                                                    <span
                                                        className={`text-xs font-semibold tracking-tight ${
                                                            isSelected
                                                                ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                                                                : 'text-foreground'
                                                        }`}
                                                    >
                                                        {opt.label}
                                                    </span>
                                                    <p className="mt-1 text-[10px] text-muted-foreground leading-relaxed">
                                                        {opt.description}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* TAB 2: QUANTITY & VARIATIONS */}
                        {currentStep === 2 && (
                            <div className="space-y-5 animate-in fade-in-50 duration-150">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                                <Layers className="h-3.5 w-3.5 text-primary" />
                                                Generation Quantity
                                            </Label>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                Select how many marketing image variations to synthesize.
                                            </p>
                                        </div>
                                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                            {quantity === 1 ? '1 image generated' : `${quantity} images generated`}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-4 gap-3 pt-1">
                                        {[1, 2, 3, 4].map((q) => {
                                            const isSelected = quantity === q;
                                            return (
                                                <button
                                                    key={q}
                                                    type="button"
                                                    onClick={() => onQuantityChange(q)}
                                                    className={`flex flex-col items-center justify-center py-3.5 px-3 rounded-[10px] border text-center transition-all cursor-pointer ${
                                                        isSelected
                                                            ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-500/[0.04] shadow-xs ring-1 ring-emerald-500/30 text-foreground font-bold'
                                                            : 'border-border/80 bg-card text-muted-foreground hover:border-border hover:bg-muted/30'
                                                    }`}
                                                >
                                                    <span className="text-lg font-bold">{q}</span>
                                                    <span className="text-[11px] text-muted-foreground mt-0.5">{q === 1 ? 'Image' : 'Images'}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Variation Settings (Shown when quantity > 1) */}
                                {quantity > 1 ? (
                                    <div className="space-y-4 rounded-[10px] border border-border/80 bg-muted/15 p-4 sm:p-5">
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                Multi-Output Variation Settings
                                            </h4>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                Configure how creative scene direction, taglines, and styles vary across the {quantity} outputs.
                                            </p>
                                        </div>

                                        {/* Prompt Direction Variation */}
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-foreground">
                                                Creative Scene Direction
                                            </Label>
                                            <div className="grid gap-2.5 sm:grid-cols-2">
                                                <button
                                                    type="button"
                                                    onClick={() => onPromptVariationChange('different')}
                                                    className={`rounded-[8px] border p-3 text-left text-xs transition-all cursor-pointer ${
                                                        promptVariation === 'different'
                                                            ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-500/[0.04] ring-1 ring-emerald-500/30 font-medium'
                                                            : 'border-border/70 bg-card hover:bg-muted/30 text-muted-foreground'
                                                    }`}
                                                >
                                                    <div className="font-semibold text-foreground">Distinct direction for each image</div>
                                                    <div className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                                                        Plans different visual scene compositions while preserving core campaign goals.
                                                    </div>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onPromptVariationChange('same')}
                                                    className={`rounded-[8px] border p-3 text-left text-xs transition-all cursor-pointer ${
                                                        promptVariation === 'same'
                                                            ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-500/[0.04] ring-1 ring-emerald-500/30 font-medium'
                                                            : 'border-border/70 bg-card hover:bg-muted/30 text-muted-foreground'
                                                    }`}
                                                >
                                                    <div className="font-semibold text-foreground">Unified direction for all images</div>
                                                    <div className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                                                        Applies identical creative scene composition across all outputs.
                                                    </div>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Tagline Behavior */}
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-foreground">
                                                Tagline Behavior
                                            </Label>
                                            <div className="grid gap-2.5 sm:grid-cols-2">
                                                <button
                                                    type="button"
                                                    onClick={() => onTaglineVariationChange('same')}
                                                    className={`rounded-[8px] border p-3 text-left text-xs transition-all cursor-pointer ${
                                                        taglineVariation === 'same'
                                                            ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-500/[0.04] ring-1 ring-emerald-500/30 font-medium'
                                                            : 'border-border/70 bg-card hover:bg-muted/30 text-muted-foreground'
                                                    }`}
                                                >
                                                    <div className="font-semibold text-foreground">Consistent tagline across all images</div>
                                                    <div className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                                                        Maintains a unified headline for cohesive campaign messaging.
                                                    </div>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onTaglineVariationChange('different')}
                                                    className={`rounded-[8px] border p-3 text-left text-xs transition-all cursor-pointer ${
                                                        taglineVariation === 'different'
                                                            ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-500/[0.04] ring-1 ring-emerald-500/30 font-medium'
                                                            : 'border-border/70 bg-card hover:bg-muted/30 text-muted-foreground'
                                                    }`}
                                                >
                                                    <div className="font-semibold text-foreground">Unique tagline for each image</div>
                                                    <div className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                                                        Generates fresh alternative copy angles for each output.
                                                    </div>
                                                </button>
                                            </div>
                                            {!includeTagline && (
                                                <p className="text-[10px] text-muted-foreground italic">
                                                    Note: Taglines are currently disabled in Typography settings.
                                                </p>
                                            )}
                                        </div>

                                        {/* Render-Style Behavior */}
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-foreground">
                                                Render Style Variation
                                            </Label>
                                            <div className="grid gap-2.5 sm:grid-cols-2">
                                                <button
                                                    type="button"
                                                    onClick={() => onStyleVariationChange('same')}
                                                    className={`rounded-[8px] border p-3 text-left text-xs transition-all cursor-pointer ${
                                                        styleVariation === 'same'
                                                            ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-500/[0.04] ring-1 ring-emerald-500/30 font-medium'
                                                            : 'border-border/70 bg-card hover:bg-muted/30 text-muted-foreground'
                                                    }`}
                                                >
                                                    <div className="font-semibold text-foreground">Same render style for all images</div>
                                                    <div className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                                                        Applies {renderStyle || 'the selected style'} to every output.
                                                    </div>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onStyleVariationChange('different')}
                                                    className={`rounded-[8px] border p-3 text-left text-xs transition-all cursor-pointer ${
                                                        styleVariation === 'different'
                                                            ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-500/[0.04] ring-1 ring-emerald-500/30 font-medium'
                                                            : 'border-border/70 bg-card hover:bg-muted/30 text-muted-foreground'
                                                    }`}
                                                >
                                                    <div className="font-semibold text-foreground">Vary render styles across images</div>
                                                    <div className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                                                        Distributes supported canonical styles across the requested outputs.
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-[8px] border border-border/70 bg-muted/20 p-3.5 text-xs text-muted-foreground leading-relaxed">
                                        Single visual generation active. Selecting 2 to 4 images unlocks multi-output variation options.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 3: CANVAS PROPORTIONS */}
                        {currentStep === 3 && (
                            <div className="space-y-4 animate-in fade-in-50 duration-150">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                            <Maximize2 className="h-3.5 w-3.5 text-primary" />
                                            Canvas Aspect Ratio
                                        </Label>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            Select standard social or marketing dimensions for your canvas.
                                        </p>
                                    </div>
                                    <span className="rounded-[6px] font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 border border-emerald-500/20">
                                        {aspectRatio} · {currentRatioConfig.name}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
                                    {ASPECT_RATIO_CONFIGS.map((opt) => {
                                        const isSelected = aspectRatio === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => onAspectRatioChange(opt.value)}
                                                className={`group relative flex flex-col rounded-[10px] border text-left transition-all duration-200 cursor-pointer select-none overflow-hidden ${
                                                    isSelected
                                                        ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.06] shadow-xs ring-1 ring-emerald-500/30'
                                                        : 'border-border/80 bg-card hover:border-border hover:bg-muted/30 hover:shadow-xs'
                                                }`}
                                            >
                                                {/* Proportional Canvas Shape Preview */}
                                                <div className="relative h-24 w-full overflow-hidden bg-muted/30 dark:bg-muted/10 p-2 flex items-center justify-center border-b border-border/50 select-none">
                                                    <div
                                                        className={`rounded-[4px] border-2 transition-all ${
                                                            isSelected
                                                                ? 'border-emerald-600 bg-emerald-500/20 shadow-xs dark:border-emerald-400'
                                                                : 'border-muted-foreground/40 bg-muted/40 group-hover:border-foreground/40'
                                                        } ${opt.modalPreviewClass}`}
                                                    />
                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-[6px] bg-emerald-600 text-white shadow-xs">
                                                            <Check className="h-3 w-3 stroke-[3]" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Option Details */}
                                                <div className="flex flex-col flex-1 p-3">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <span
                                                            className={`font-mono text-xs font-bold tracking-tight ${
                                                                isSelected
                                                                    ? 'text-emerald-700 dark:text-emerald-400'
                                                                    : 'text-foreground'
                                                            }`}
                                                        >
                                                            {opt.value}
                                                        </span>
                                                        <span className="text-[10px] font-semibold text-muted-foreground">
                                                            {opt.name}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-[10px] text-muted-foreground line-clamp-1 leading-relaxed">
                                                        {opt.description}
                                                    </p>
                                                    <span className="mt-1.5 font-mono text-[9px] text-muted-foreground/80">
                                                        {opt.dimensions}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* TAB 4: MARKETING TYPOGRAPHY & ELEMENTS */}
                        {currentStep === 4 && (
                            <div className="space-y-4 animate-in fade-in-50 duration-150">
                                <div>
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <Type className="h-3.5 w-3.5 text-primary" />
                                        Marketing Typography & Branding Layers
                                    </Label>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        Specify which commercial branding and copy layers to render in the creative.
                                    </p>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    {/* Show Event/Holiday Text */}
                                    {selectedEvent && (
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => onToggleEventText(!showEventText)}
                                            onKeyDown={(e) => {
                                                if (e.key === ' ' || e.key === 'Enter') onToggleEventText(!showEventText);
                                            }}
                                            className={`group relative flex flex-col justify-between rounded-[10px] border p-3.5 transition-all cursor-pointer select-none sm:col-span-2 ${
                                                showEventText
                                                    ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-500/[0.04] ring-1 ring-emerald-500/30'
                                                    : 'border-border/80 bg-card hover:bg-muted/30'
                                            }`}
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarDays className="h-4 w-4 text-primary" />
                                                        <span className="text-xs font-bold text-foreground">
                                                            Event / Holiday Copy
                                                        </span>
                                                        <span className="inline-flex items-center rounded-[6px] border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-foreground">
                                                            {selectedEvent.name}
                                                        </span>
                                                    </div>
                                                    <Checkbox
                                                        checked={showEventText}
                                                        onCheckedChange={(c) => onToggleEventText(Boolean(c))}
                                                        className="h-4 w-4 pointer-events-none rounded-[4px] data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white dark:data-[state=checked]:bg-emerald-600 dark:data-[state=checked]:border-emerald-600"
                                                    />
                                                </div>
                                                <p className="text-[11px] text-muted-foreground mt-1">
                                                    Display promotional event or holiday title as supporting copy.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Include Product Name */}
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => onToggleProductName && onToggleProductName(!includeProductName)}
                                        onKeyDown={(e) => {
                                            if (e.key === ' ' || e.key === 'Enter') onToggleProductName && onToggleProductName(!includeProductName);
                                        }}
                                        className={`group relative flex flex-col justify-between rounded-[10px] border p-3.5 transition-all cursor-pointer select-none ${
                                            includeProductName
                                                ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-500/[0.04] ring-1 ring-emerald-500/30'
                                                : 'border-border/80 bg-card hover:bg-muted/30'
                                        }`}
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Package className="h-4 w-4 text-primary" />
                                                    <p className="text-xs font-bold text-foreground">Include Product Name</p>
                                                </div>
                                                <Checkbox
                                                    checked={includeProductName}
                                                    onCheckedChange={(c) => onToggleProductName && onToggleProductName(Boolean(c))}
                                                    className="h-4 w-4 pointer-events-none rounded-[4px] data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white dark:data-[state=checked]:bg-emerald-600 dark:data-[state=checked]:border-emerald-600"
                                                />
                                            </div>
                                            <p className="text-[11px] text-muted-foreground mt-1">
                                                Render primary product name as dominant advertising headline.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Include Prices */}
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => onTogglePrices(!includePrices)}
                                        onKeyDown={(e) => {
                                            if (e.key === ' ' || e.key === 'Enter') onTogglePrices(!includePrices);
                                        }}
                                        className={`group relative flex flex-col justify-between rounded-[10px] border p-3.5 transition-all cursor-pointer select-none ${
                                            includePrices
                                                ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-500/[0.04] ring-1 ring-emerald-500/30'
                                                : 'border-border/80 bg-card hover:bg-muted/30'
                                        }`}
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <BadgePercent className="h-4 w-4 text-primary" />
                                                    <p className="text-xs font-bold text-foreground">Include Prices</p>
                                                </div>
                                                <Checkbox
                                                    checked={includePrices}
                                                    onCheckedChange={(c) => onTogglePrices(Boolean(c))}
                                                    className="h-4 w-4 pointer-events-none rounded-[4px] data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white dark:data-[state=checked]:bg-emerald-600 dark:data-[state=checked]:border-emerald-600"
                                                />
                                            </div>
                                            <p className="text-[11px] text-muted-foreground mt-1">
                                                Render authoritative product pricing tag on the creative.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Include Tagline */}
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => onToggleTagline(!includeTagline)}
                                        onKeyDown={(e) => {
                                            if (e.key === ' ' || e.key === 'Enter') onToggleTagline(!includeTagline);
                                        }}
                                        className={`group relative flex flex-col justify-between rounded-[10px] border p-3.5 transition-all cursor-pointer select-none ${
                                            includeTagline
                                                ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-500/[0.04] ring-1 ring-emerald-500/30'
                                                : 'border-border/80 bg-card hover:bg-muted/30'
                                        }`}
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Type className="h-4 w-4 text-primary" />
                                                    <p className="text-xs font-bold text-foreground">Include Tagline</p>
                                                </div>
                                                <Checkbox
                                                    checked={includeTagline}
                                                    onCheckedChange={(c) => onToggleTagline(Boolean(c))}
                                                    className="h-4 w-4 pointer-events-none rounded-[4px] data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white dark:data-[state=checked]:bg-emerald-600 dark:data-[state=checked]:border-emerald-600"
                                                />
                                            </div>
                                            <p className="text-[11px] text-muted-foreground mt-1">
                                                Render promotional headline and tagline copy on the creative.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Include Business Name */}
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => onToggleBusinessName(!includeBusinessName)}
                                        onKeyDown={(e) => {
                                            if (e.key === ' ' || e.key === 'Enter') onToggleBusinessName(!includeBusinessName);
                                        }}
                                        className={`group relative flex flex-col justify-between rounded-[10px] border p-3.5 transition-all cursor-pointer select-none ${
                                            includeBusinessName
                                                ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-500/[0.04] ring-1 ring-emerald-500/30'
                                                : 'border-border/80 bg-card hover:bg-muted/30'
                                        }`}
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-primary" />
                                                    <p className="text-xs font-bold text-foreground">Include Business Name</p>
                                                    {businessName && (
                                                        <span className="inline-flex items-center rounded-[6px] border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-foreground">
                                                            {businessName}
                                                        </span>
                                                    )}
                                                </div>
                                                <Checkbox
                                                    checked={includeBusinessName}
                                                    onCheckedChange={(c) => onToggleBusinessName(Boolean(c))}
                                                    className="h-4 w-4 pointer-events-none rounded-[4px] data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white dark:data-[state=checked]:bg-emerald-600 dark:data-[state=checked]:border-emerald-600"
                                                />
                                            </div>
                                            <p className="text-[11px] text-muted-foreground mt-1">
                                                Incorporate registered business identity into the creative layout.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* MODAL FOOTER */}
                    <DialogFooter className="shrink-0 border-t border-border/80 bg-muted/20 px-4 sm:px-6 py-3.5 flex items-center justify-end">
                        <Button
                            type="submit"
                            disabled={isGenerateDisabled}
                            className="w-full sm:w-auto text-xs font-bold px-6 rounded-[8px] cursor-pointer h-9 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shadow-sm"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                    Generating...
                                </>
                            ) : quantity === 1 ? (
                                'Generate Image'
                            ) : (
                                `Generate ${quantity} Images`
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
