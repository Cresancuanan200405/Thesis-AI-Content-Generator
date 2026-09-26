import { useState } from 'react';
import {
    BadgePercent,
    Building2,
    CalendarDays,
    Check,
    ChevronDown,
    Download,
    ExternalLink,
    Package,
    Search,
    SlidersHorizontal,
    Sparkles,
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
import { EventItem, GeneratedDesign, ProductItem } from './types';
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
            <DialogContent className="max-h-[85vh] overflow-hidden rounded-3xl p-0 sm:max-w-xl">
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
                                        className={`group relative flex flex-col overflow-hidden rounded-2xl border text-left transition-all ${
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
            <DialogContent className="rounded-3xl sm:max-w-md">
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
    aspectRatio: string;
    onAspectRatioChange: (val: string) => void;
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
}

/**
 * Generation & Canvas Settings Modal for Automatic Mode.
 * Unifies all requirements (canvas proportions, identity, and marketing overlays)
 * into a single clean, easy-to-navigate modal.
 */
export function AutomaticSettingsModal({
    isOpen,
    onOpenChange,
    aspectRatio,
    onAspectRatioChange,
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
}: AutomaticSettingsModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="flex flex-col max-h-[85vh] h-auto w-[94vw] max-w-xl md:max-w-2xl overflow-hidden rounded-2xl p-0 shadow-2xl">
                <DialogHeader className="shrink-0 border-b bg-muted/20 px-4 py-3.5 sm:px-5 sm:py-4">
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal className="h-5 w-5 text-primary" />
                        <DialogTitle className="text-base font-bold text-foreground">
                            Generation & Canvas Settings
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Configure canvas proportions and customize marketing copy typography overlays.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4">
                    {/* Section 1: Canvas Dimensions */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                1. Canvas Proportions & Aspect Ratio
                            </Label>
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

                    {/* Section 2: Marketing Content Toggles */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                2. Marketing Typography & Elements
                            </Label>
                            <span className="text-[10px] text-muted-foreground">
                                Click card to toggle
                            </span>
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
                                            <Sparkles className="h-4 w-4 text-primary" />
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
                </div>

                <DialogFooter className="shrink-0 border-t bg-muted/10 px-4 py-3 sm:px-5 flex items-center justify-between">
                    <span className="hidden sm:inline-flex text-xs text-muted-foreground items-center">
                        All settings are applied instantly
                    </span>
                    <Button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="w-full sm:w-auto text-xs font-bold px-6 rounded-xl cursor-pointer"
                    >
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
