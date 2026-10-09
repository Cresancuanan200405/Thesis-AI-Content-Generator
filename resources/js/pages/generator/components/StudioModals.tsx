import { useState } from 'react';
import {
    BadgePercent,
    Building2,
    CalendarDays,
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
import { EventItem, GeneratedDesign, ProductItem, renderStyleOptions } from './types';
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
            <DialogContent className="max-h-[85vh] overflow-hidden rounded-card p-0 sm:max-w-xl">
                <DialogHeader className="border-b bg-muted/20 p-5 pb-4">
                    <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                        <Package className="h-5 w-5 text-primary" />
                        Select Catalog Products
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Select one or more catalog products to feature in your marketing design.
                    </DialogDescription>
                </DialogHeader>

                <div className="border-b bg-muted/10 p-4">
                    <div className="relative">
                        <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search products..."
                            className="h-9 pl-9 text-xs"
                        />
                    </div>
                </div>

                <div className="max-h-[380px] min-h-[200px] overflow-y-auto p-4">
                    {filtered.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            <Package className="mx-auto h-8 w-8 opacity-40" />
                            <p className="mt-2 text-xs font-medium">No products found</p>
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {filtered.map((prod: ProductItem) => {
                                const isSelected = selectedProducts.some(
                                    (p) => String(p.id) === String(prod.id),
                                );

                                return (
                                    <button
                                        key={prod.id}
                                        type="button"
                                        onClick={() => onToggleProduct(prod)}
                                        className={`group relative flex flex-col overflow-hidden rounded-card border text-left transition-all ${
                                            isSelected
                                                ? 'border-emerald-500 bg-emerald-500/5 shadow-xs ring-1 ring-emerald-500/30'
                                                : 'border-border bg-card hover:border-emerald-500/40'
                                        }`}
                                    >
                                        <div className="relative flex h-28 w-full items-center justify-center overflow-hidden border-b border-border/40 bg-muted/40">
                                            {prod.image_url ? (
                                                <img
                                                    src={prod.image_url}
                                                    alt={prod.name}
                                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                />
                                            ) : (
                                                <Package className="h-8 w-8 opacity-40" />
                                            )}
                                            {isSelected && (
                                                <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-white shadow-xs">
                                                    <Check className="h-3 w-3 stroke-[2.5]" />
                                                </span>
                                            )}
                                        </div>
                                        <div className="p-3">
                                            <p
                                                className="break-words text-xs font-bold leading-snug text-foreground"
                                                title={prod.name}
                                            >
                                                {prod.name}
                                            </p>
                                            <div className="mt-1.5 flex items-center justify-between">
                                                {prod.price ? (
                                                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                        ₱{Number(prod.price).toLocaleString(undefined, {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] italic text-muted-foreground">
                                                        Price not set
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <DialogFooter className="flex items-center justify-between border-t bg-muted/10 p-3 px-4 sm:justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                        {selectedProducts.length} catalog{' '}
                        {selectedProducts.length === 1 ? 'product' : 'products'} selected
                    </span>
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="h-8 text-xs font-semibold"
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
    const [activeCard, setActiveCard] = useState<'style' | 'quantity' | 'ratio' | 'typography'>('style');

    const isStyleSelected = Boolean(renderStyle && renderStyle.trim().length > 0);
    const isGenerateDisabled = !isStyleSelected || isGenerating || !canGenerate;

    const activeElementsCount = [
        selectedEvent && showEventText,
        includeProductName,
        includePrices,
        includeTagline,
        includeBusinessName,
    ].filter(Boolean).length;

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isGenerateDisabled) {
            onGenerate();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="flex flex-col min-h-[540px] max-h-[88vh] h-[640px] w-[94vw] max-w-xl md:max-w-2xl lg:max-w-3xl overflow-hidden rounded-card p-0 shadow-2xl">
                <DialogHeader className="shrink-0 border-b bg-muted/20 px-4 py-3.5 sm:px-5 sm:py-4">
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal className="h-5 w-5 text-primary" />
                        <DialogTitle className="text-base font-bold text-foreground">
                            Automatic Studio Generation Settings
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Configure creative render style, batch quantity, proportions, and marketing typography.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleFormSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    {/* 4 CARD SELECTOR BAR */}
                    <div className="shrink-0 border-b border-border/70 bg-muted/10 p-3 sm:px-5">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5">
                            {/* Card 1: Render Style */}
                            <button
                                type="button"
                                onClick={() => setActiveCard('style')}
                                className={`group relative flex flex-col justify-between rounded-xl border p-2.5 text-left transition-all cursor-pointer select-none ${
                                    activeCard === 'style'
                                        ? 'border-emerald-500 bg-emerald-500/10 shadow-xs ring-1 ring-emerald-500/40 text-foreground'
                                        : 'border-border/80 bg-card hover:border-emerald-500/40 hover:bg-muted/30 text-muted-foreground'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5">
                                        <Palette className={`h-3.5 w-3.5 ${activeCard === 'style' ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'}`} />
                                        <span className="text-xs font-bold text-foreground">Render Style</span>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold px-1 rounded-sm bg-muted text-muted-foreground">
                                        1
                                    </span>
                                </div>
                                <p className="text-[11px] font-medium truncate text-muted-foreground">
                                    {renderStyle || 'Select style'}
                                </p>
                            </button>

                            {/* Card 2: Generation Quantity */}
                            <button
                                type="button"
                                onClick={() => setActiveCard('quantity')}
                                className={`group relative flex flex-col justify-between rounded-xl border p-2.5 text-left transition-all cursor-pointer select-none ${
                                    activeCard === 'quantity'
                                        ? 'border-emerald-500 bg-emerald-500/10 shadow-xs ring-1 ring-emerald-500/40 text-foreground'
                                        : 'border-border/80 bg-card hover:border-emerald-500/40 hover:bg-muted/30 text-muted-foreground'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <Layers className={`h-3.5 w-3.5 shrink-0 ${activeCard === 'quantity' ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'}`} />
                                        <span className="text-xs font-bold text-foreground truncate">Generation Quantity</span>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold px-1 rounded-sm bg-muted text-muted-foreground shrink-0">
                                        2
                                    </span>
                                </div>
                                <p className="text-[11px] font-medium truncate text-muted-foreground">
                                    {quantity === 1 ? '1 Image' : `${quantity} Images (${styleVariation === 'different' ? 'Varied' : 'Same'})`}
                                </p>
                            </button>

                            {/* Card 3: Canvas Proportions and Aspect Ratio */}
                            <button
                                type="button"
                                onClick={() => setActiveCard('ratio')}
                                className={`group relative flex flex-col justify-between rounded-xl border p-2.5 text-left transition-all cursor-pointer select-none ${
                                    activeCard === 'ratio'
                                        ? 'border-emerald-500 bg-emerald-500/10 shadow-xs ring-1 ring-emerald-500/40 text-foreground'
                                        : 'border-border/80 bg-card hover:border-emerald-500/40 hover:bg-muted/30 text-muted-foreground'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <Maximize2 className={`h-3.5 w-3.5 shrink-0 ${activeCard === 'ratio' ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'}`} />
                                        <span className="text-xs font-bold text-foreground truncate">Canvas Proportions & Ratio</span>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold px-1 rounded-sm bg-muted text-muted-foreground shrink-0">
                                        3
                                    </span>
                                </div>
                                <p className="text-[11px] font-medium truncate text-muted-foreground">
                                    {aspectRatio || '1:1'} Ratio
                                </p>
                            </button>

                            {/* Card 4: Marketing Typography & Elements */}
                            <button
                                type="button"
                                onClick={() => setActiveCard('typography')}
                                className={`group relative flex flex-col justify-between rounded-xl border p-2.5 text-left transition-all cursor-pointer select-none ${
                                    activeCard === 'typography'
                                        ? 'border-emerald-500 bg-emerald-500/10 shadow-xs ring-1 ring-emerald-500/40 text-foreground'
                                        : 'border-border/80 bg-card hover:border-emerald-500/40 hover:bg-muted/30 text-muted-foreground'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <Type className={`h-3.5 w-3.5 shrink-0 ${activeCard === 'typography' ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'}`} />
                                        <span className="text-xs font-bold text-foreground truncate">Typography & Elements</span>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold px-1 rounded-sm bg-muted text-muted-foreground shrink-0">
                                        4
                                    </span>
                                </div>
                                <p className="text-[11px] font-medium truncate text-muted-foreground">
                                    {activeElementsCount} Elements Active
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* ACTIVE CARD OPTIONS CONTENT */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5">
                        {/* OPTION 1: RENDER STYLE */}
                        {activeCard === 'style' && (
                            <div className="space-y-4 animate-in fade-in-50 duration-150">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                            <Palette className="h-3.5 w-3.5 text-primary" />
                                            1. Render Style <span className="text-destructive">*</span>
                                        </Label>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            Choose the visual artistic rendering style for image synthesis.
                                        </p>
                                    </div>
                                    <span className={`text-[11px] font-medium ${isStyleSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400 font-semibold'}`}>
                                        {isStyleSelected
                                            ? (quantity > 1 && styleVariation === 'different' ? 'Starting style' : 'Selected')
                                            : 'Required selection'}
                                    </span>
                                </div>

                                {quantity > 1 && styleVariation === 'different' && (
                                    <p className="text-[11px] text-muted-foreground bg-muted/30 border border-border/70 rounded-lg p-2.5 leading-relaxed">
                                        <strong>Different render styles enabled:</strong> The first output will use this selected style, and remaining outputs will distribute across the other supported canonical styles.
                                    </p>
                                )}

                                <div className="grid gap-2.5 sm:grid-cols-2">
                                    {renderStyleOptions.map((opt) => {
                                        const isSelected = renderStyle === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => onRenderStyleChange(opt.value)}
                                                className={`group relative flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all cursor-pointer select-none ${
                                                    isSelected
                                                        ? 'border-emerald-500 bg-emerald-500/10 shadow-xs ring-1 ring-emerald-500/40'
                                                        : 'border-border/80 bg-card hover:border-emerald-500/40 hover:bg-muted/30'
                                                }`}
                                            >
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-foreground">
                                                            {opt.label}
                                                        </span>
                                                        <span
                                                            className={`flex h-4 w-4 items-center justify-center rounded-full border transition-all ${
                                                                isSelected
                                                                    ? 'border-emerald-600 bg-emerald-600 text-white'
                                                                    : 'border-muted-foreground/30 bg-transparent'
                                                            }`}
                                                        >
                                                            {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                        {opt.tagline || opt.description}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* OPTION 2: GENERATION QUANTITY */}
                        {activeCard === 'quantity' && (
                            <div className="space-y-5 animate-in fade-in-50 duration-150">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                                <Layers className="h-3.5 w-3.5 text-primary" />
                                                2. Generation Quantity
                                            </Label>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                Select how many marketing image variations to synthesize.
                                            </p>
                                        </div>
                                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                            {quantity === 1 ? '1 image generated' : `${quantity} images generated`}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2.5 pt-1">
                                        {[1, 2, 3, 4].map((q) => {
                                            const isSelected = quantity === q;
                                            return (
                                                <button
                                                    key={q}
                                                    type="button"
                                                    onClick={() => onQuantityChange(q)}
                                                    className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                                                        isSelected
                                                            ? 'border-emerald-500 bg-emerald-500/10 shadow-xs ring-1 ring-emerald-500/40 text-foreground font-bold'
                                                            : 'border-border/80 bg-card text-muted-foreground hover:border-border hover:bg-muted/30'
                                                    }`}
                                                >
                                                    <span className="text-base font-bold">{q}</span>
                                                    <span className="text-[10px] mt-0.5">{q === 1 ? 'Image' : 'Images'}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Variation Settings (Shown when quantity > 1) */}
                                {quantity > 1 ? (
                                    <div className="space-y-4 rounded-xl border border-border/80 bg-muted/15 p-4">
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                Multiple Output Variation Settings
                                            </h4>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                Configure how prompts, headlines, and styles vary across the {quantity} outputs.
                                            </p>
                                        </div>

                                        {/* Prompt Variation */}
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-foreground">
                                                Prompt Variation
                                            </Label>
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                <button
                                                    type="button"
                                                    onClick={() => onPromptVariationChange('different')}
                                                    className={`rounded-lg border p-2.5 text-left text-xs transition-all cursor-pointer ${
                                                        promptVariation === 'different'
                                                            ? 'border-emerald-500 bg-emerald-500/10 font-medium'
                                                            : 'border-border/70 bg-card hover:bg-muted/30 text-muted-foreground'
                                                    }`}
                                                >
                                                    <div className="font-semibold text-foreground">Different prompt for each image</div>
                                                    <div className="text-[10px] text-muted-foreground mt-0.5">
                                                        Plans distinct visual directions while preserving shared campaign goals.
                                                    </div>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onPromptVariationChange('same')}
                                                    className={`rounded-lg border p-2.5 text-left text-xs transition-all cursor-pointer ${
                                                        promptVariation === 'same'
                                                            ? 'border-emerald-500 bg-emerald-500/10 font-medium'
                                                            : 'border-border/70 bg-card hover:bg-muted/30 text-muted-foreground'
                                                    }`}
                                                >
                                                    <div className="font-semibold text-foreground">Same core prompt for all images</div>
                                                    <div className="text-[10px] text-muted-foreground mt-0.5">
                                                        Reuses identical creative scene direction across all outputs.
                                                    </div>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Tagline Behavior */}
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-foreground">
                                                Tagline Behavior
                                            </Label>
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                <button
                                                    type="button"
                                                    onClick={() => onTaglineVariationChange('same')}
                                                    className={`rounded-lg border p-2.5 text-left text-xs transition-all cursor-pointer ${
                                                        taglineVariation === 'same'
                                                            ? 'border-emerald-500 bg-emerald-500/10 font-medium'
                                                            : 'border-border/70 bg-card hover:bg-muted/30 text-muted-foreground'
                                                    }`}
                                                >
                                                    <div className="font-semibold text-foreground">Same tagline across all images</div>
                                                    <div className="text-[10px] text-muted-foreground mt-0.5">
                                                        Uses one unified headline for consistent brand messaging.
                                                    </div>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onTaglineVariationChange('different')}
                                                    className={`rounded-lg border p-2.5 text-left text-xs transition-all cursor-pointer ${
                                                        taglineVariation === 'different'
                                                            ? 'border-emerald-500 bg-emerald-500/10 font-medium'
                                                            : 'border-border/70 bg-card hover:bg-muted/30 text-muted-foreground'
                                                    }`}
                                                >
                                                    <div className="font-semibold text-foreground">Different generated tagline for each image</div>
                                                    <div className="text-[10px] text-muted-foreground mt-0.5">
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
                                                Render-Style Behavior
                                            </Label>
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                <button
                                                    type="button"
                                                    onClick={() => onStyleVariationChange('same')}
                                                    className={`rounded-lg border p-2.5 text-left text-xs transition-all cursor-pointer ${
                                                        styleVariation === 'same'
                                                            ? 'border-emerald-500 bg-emerald-500/10 font-medium'
                                                            : 'border-border/70 bg-card hover:bg-muted/30 text-muted-foreground'
                                                    }`}
                                                >
                                                    <div className="font-semibold text-foreground">Same render style for all images</div>
                                                    <div className="text-[10px] text-muted-foreground mt-0.5">
                                                        Applies {renderStyle || 'the selected style'} to every output.
                                                    </div>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onStyleVariationChange('different')}
                                                    className={`rounded-lg border p-2.5 text-left text-xs transition-all cursor-pointer ${
                                                        styleVariation === 'different'
                                                            ? 'border-emerald-500 bg-emerald-500/10 font-medium'
                                                            : 'border-border/70 bg-card hover:bg-muted/30 text-muted-foreground'
                                                    }`}
                                                >
                                                    <div className="font-semibold text-foreground">Different render styles across images</div>
                                                    <div className="text-[10px] text-muted-foreground mt-0.5">
                                                        Distributes supported canonical styles across the requested outputs.
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 text-xs text-muted-foreground">
                                        Single visual generation active. Selecting 2 to 4 images enables prompt, tagline, and render style variation options.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* OPTION 3: CANVAS PROPORTIONS */}
                        {activeCard === 'ratio' && (
                            <div className="space-y-4 animate-in fade-in-50 duration-150">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                            <Maximize2 className="h-3.5 w-3.5 text-primary" />
                                            3. Canvas Proportions & Aspect Ratio
                                        </Label>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            Select standard social or marketing dimensions for your canvas.
                                        </p>
                                    </div>
                                    <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                        {aspectRatio}
                                    </span>
                                </div>
                                <AspectRatioSelector
                                    value={aspectRatio}
                                    onChange={onAspectRatioChange}
                                    defaultOpen={true}
                                />
                            </div>
                        )}

                        {/* OPTION 4: MARKETING TYPOGRAPHY & ELEMENTS */}
                        {activeCard === 'typography' && (
                            <div className="space-y-4 animate-in fade-in-50 duration-150">
                                <div>
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <Type className="h-3.5 w-3.5 text-primary" />
                                        4. Marketing Typography & Elements
                                    </Label>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        Specify which commercial branding and typography layers to render in the artwork.
                                    </p>
                                </div>

                                <div className="grid gap-2.5 sm:grid-cols-2">
                                    {/* Show Event/Holiday Text */}
                                    {selectedEvent && (
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => onToggleEventText(!showEventText)}
                                            onKeyDown={(e) => {
                                                if (e.key === ' ' || e.key === 'Enter') onToggleEventText(!showEventText);
                                            }}
                                            className={`group relative flex flex-col justify-between rounded-xl border p-3 transition-all cursor-pointer select-none sm:col-span-2 ${
                                                showEventText
                                                    ? 'border-emerald-500 bg-emerald-500/[0.04] shadow-2xs'
                                                    : 'border-border/80 bg-background/60 hover:bg-muted/30'
                                            }`}
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarDays className="h-4 w-4 text-primary" />
                                                        <span className="text-xs font-bold text-foreground">
                                                            Show Event/Holiday Text
                                                        </span>
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[10px] font-semibold border-border bg-muted/50 text-foreground"
                                                        >
                                                            {selectedEvent.name}
                                                        </Badge>
                                                    </div>
                                                    <Checkbox
                                                        checked={showEventText}
                                                        onCheckedChange={(c) => onToggleEventText(Boolean(c))}
                                                        className="h-4 w-4 pointer-events-none rounded-md data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white dark:data-[state=checked]:bg-emerald-600 dark:data-[state=checked]:border-emerald-600"
                                                    />
                                                </div>
                                                <p className="line-clamp-2 text-[10px] text-muted-foreground">
                                                    Allow the Event/Holiday name to appear as typography in the final design.
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
                                        className={`group relative flex flex-col justify-between rounded-xl border p-3 transition-all cursor-pointer select-none ${
                                            includeProductName
                                                ? 'border-emerald-500 bg-emerald-500/[0.04] shadow-2xs'
                                                : 'border-border/80 bg-background/60 hover:bg-muted/30'
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
                                                    className="h-4 w-4 pointer-events-none rounded-md data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white dark:data-[state=checked]:bg-emerald-600 dark:data-[state=checked]:border-emerald-600"
                                                />
                                            </div>
                                            <p className="line-clamp-2 text-[10px] text-muted-foreground">
                                                Render product name typography overlay.
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
                                        className={`group relative flex flex-col justify-between rounded-xl border p-3 transition-all cursor-pointer select-none ${
                                            includePrices
                                                ? 'border-emerald-500 bg-emerald-500/[0.04] shadow-2xs'
                                                : 'border-border/80 bg-background/60 hover:bg-muted/30'
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
                                                    className="h-4 w-4 pointer-events-none rounded-md data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white dark:data-[state=checked]:bg-emerald-600 dark:data-[state=checked]:border-emerald-600"
                                                />
                                            </div>
                                            <p className="line-clamp-2 text-[10px] text-muted-foreground">
                                                Render authoritative product pricing badge.
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
                                        className={`group relative flex flex-col justify-between rounded-xl border p-3 transition-all cursor-pointer select-none ${
                                            includeTagline
                                                ? 'border-emerald-500 bg-emerald-500/[0.04] shadow-2xs'
                                                : 'border-border/80 bg-background/60 hover:bg-muted/30'
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
                                                    className="h-4 w-4 pointer-events-none rounded-md data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white dark:data-[state=checked]:bg-emerald-600 dark:data-[state=checked]:border-emerald-600"
                                                />
                                            </div>
                                            <p className="line-clamp-2 text-[10px] text-muted-foreground">
                                                AI generates an original commercial headline tagline.
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
                                        className={`group relative flex flex-col justify-between rounded-xl border p-3 transition-all cursor-pointer select-none ${
                                            includeBusinessName
                                                ? 'border-emerald-500 bg-emerald-500/[0.04] shadow-2xs'
                                                : 'border-border/80 bg-background/60 hover:bg-muted/30'
                                        }`}
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-primary" />
                                                    <p className="text-xs font-bold text-foreground">Include Business Name</p>
                                                    {businessName && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[10px] font-semibold border-border bg-muted/50 text-foreground"
                                                        >
                                                            {businessName}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <Checkbox
                                                    checked={includeBusinessName}
                                                    onCheckedChange={(c) => onToggleBusinessName(Boolean(c))}
                                                    className="h-4 w-4 pointer-events-none rounded-md data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white dark:data-[state=checked]:bg-emerald-600 dark:data-[state=checked]:border-emerald-600"
                                                />
                                            </div>
                                            <p className="line-clamp-2 text-[10px] text-muted-foreground">
                                                Incorporate registered business identity into the creative.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* MODAL FOOTER */}
                    <DialogFooter className="shrink-0 border-t bg-muted/15 px-4 py-3 sm:px-5 flex items-center justify-end">
                        <Button
                            type="submit"
                            disabled={isGenerateDisabled}
                            className="w-full sm:w-auto text-xs font-bold px-6 rounded-xl cursor-pointer h-10 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shadow-md"
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
