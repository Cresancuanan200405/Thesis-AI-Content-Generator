import { Link } from '@inertiajs/react';
import {
    Check,
    Edit3,
    Package,
    Plus,
    Search,
    ShoppingBag,
    X,
} from 'lucide-react';
import { HelpTooltip } from '@/components/help-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomProductItem, ProductItem } from './types';

interface ProductSelectorProps {
    products: ProductItem[];
    selectedCatalogProducts: ProductItem[];
    onToggleCatalogProduct: (product: ProductItem) => void;
    customProducts: CustomProductItem[];
    onAddCustomProduct: () => void;
    onUpdateCustomProduct: (
        id: string,
        field: 'name' | 'price',
        value: string,
    ) => void;
    onRemoveCustomProduct: (id: string) => void;
    productTab: 'catalog' | 'custom';
    onSelectTab: (tab: 'catalog' | 'custom') => void;
    inlineProductSearch: string;
    onSearchChange: (search: string) => void;
    onOpenBrowseModal: () => void;
}

export function ProductSelector({
    products,
    selectedCatalogProducts,
    onToggleCatalogProduct,
    customProducts,
    onAddCustomProduct,
    onUpdateCustomProduct,
    onRemoveCustomProduct,
    productTab,
    onSelectTab,
    inlineProductSearch,
    onSearchChange,
    onOpenBrowseModal,
}: ProductSelectorProps) {
    const totalSelectedCount =
        selectedCatalogProducts.length +
        customProducts.filter((p) => p.name.trim() !== '').length;

    const displayedCatalog = products.filter((p: ProductItem) => {
        if (!inlineProductSearch.trim()) return true;
        const q = inlineProductSearch.toLowerCase();
        return (
            p.name.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q))
        );
    });

    return (
        <div className="space-y-6">
            <div className="space-y-4 rounded-3xl border border-border/80 bg-card/80 p-4.5 shadow-sm backdrop-blur-md transition-all sm:p-6">
                {/* Section Header */}
                <div className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 text-primary shadow-2xs">
                            <ShoppingBag className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold tracking-tight text-foreground">
                                    Products & Services
                                </h3>
                                <HelpTooltip text="Choose what you want to feature in this creative. You can select items from your Product Catalog or add custom products/services." />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Select catalog items or define custom offerings to feature in your visual creative.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {totalSelectedCount > 0 ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 shadow-2xs dark:text-emerald-400">
                                <Check className="h-3.5 w-3.5" />
                                {totalSelectedCount}{' '}
                                {totalSelectedCount === 1 ? 'item' : 'items'}{' '}
                                selected
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 shadow-2xs dark:text-amber-400">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                                Required
                            </span>
                        )}
                    </div>
                </div>

                {/* Mode Segmented Tab Switcher (2 Tabs: Catalog & Custom) */}
                <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-border/80 bg-muted/30 p-1 shadow-2xs">
                    <button
                        type="button"
                        onClick={() => onSelectTab('catalog')}
                        className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                            productTab === 'catalog'
                                ? 'border border-border/60 bg-background text-foreground shadow-xs'
                                : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                        }`}
                    >
                        <Package className="h-3.5 w-3.5 text-primary" />
                        <span>Product Catalog</span>
                        <Badge
                            variant="secondary"
                            className={`px-1.5 py-0 font-mono text-[10px] ${
                                selectedCatalogProducts.length > 0
                                    ? 'bg-primary/15 text-primary font-bold'
                                    : ''
                            }`}
                        >
                            {products.length}
                        </Badge>
                    </button>

                    <button
                        type="button"
                        onClick={() => onSelectTab('custom')}
                        className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                            productTab === 'custom'
                                ? 'border border-border/60 bg-background text-foreground shadow-xs'
                                : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                        }`}
                    >
                        <Edit3 className="h-3.5 w-3.5 text-amber-500" />
                        <span>Custom Item</span>
                        {customProducts.length > 0 && (
                            <Badge
                                variant="secondary"
                                className="bg-amber-500/15 px-1.5 py-0 font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400"
                            >
                                {customProducts.length}
                            </Badge>
                        )}
                    </button>
                </div>

                {/* TAB 1: PRODUCT CATALOG */}
                {productTab === 'catalog' && (
                    <div className="space-y-3.5 animate-in duration-200 fade-in">
                        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="relative flex-1">
                                <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={inlineProductSearch}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    placeholder="Search catalog products..."
                                    className="h-8.5 rounded-xl pl-8.5 text-xs"
                                />
                                {inlineProductSearch && (
                                    <button
                                        type="button"
                                        onClick={() => onSearchChange('')}
                                        className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={onOpenBrowseModal}
                                className="h-8.5 gap-1.5 rounded-xl border-primary/30 bg-primary/5 px-3 text-xs font-semibold text-primary hover:border-primary hover:bg-primary/10 transition-colors"
                            >
                                <Package className="h-3.5 w-3.5" />
                                <span>Browse All ({products.length})</span>
                            </Button>
                        </div>

                        {/* Catalog Product Interactive Grid */}
                        {products.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/15 p-6 text-center">
                                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                                    <Package className="h-5 w-5" />
                                </div>
                                <p className="text-sm font-bold text-foreground">
                                    No catalog products added yet
                                </p>
                                <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
                                    Add physical products to your inventory catalog, or use custom items to feature custom offerings.
                                </p>
                                <div className="mt-4 flex items-center justify-center gap-2">
                                    <Link href="/products/create">
                                        <Button
                                            type="button"
                                            size="sm"
                                            className="h-8 gap-1.5 rounded-xl text-xs font-semibold"
                                        >
                                            <Plus className="h-3.5 w-3.5" /> Create Catalog Product
                                        </Button>
                                    </Link>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onSelectTab('custom')}
                                        className="h-8 gap-1.5 rounded-xl text-xs font-semibold"
                                    >
                                        <Edit3 className="h-3.5 w-3.5" /> Add Custom Item
                                    </Button>
                                </div>
                            </div>
                        ) : displayedCatalog.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/10 p-5 text-center text-xs text-muted-foreground">
                                No catalog items match "{inlineProductSearch}".
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4">
                                {displayedCatalog.map((prod: ProductItem) => {
                                    const isSelected = selectedCatalogProducts.some(
                                        (p) => String(p.id) === String(prod.id),
                                    );

                                    return (
                                        <div
                                            key={prod.id}
                                            onClick={() => onToggleCatalogProduct(prod)}
                                            className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border text-left transition-all duration-200 ${
                                                isSelected
                                                    ? 'border-primary bg-primary/[0.04] shadow-md ring-2 ring-primary/40'
                                                    : 'border-border/80 bg-background hover:border-primary/50 hover:bg-muted/20 hover:shadow-xs'
                                            }`}
                                        >
                                            {/* Product Image Thumbnail */}
                                            <div className="relative aspect-square w-full overflow-hidden bg-muted/30">
                                                {prod.image_url ? (
                                                    <img
                                                        src={prod.image_url}
                                                        alt={prod.name}
                                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted/20 to-muted/50 text-muted-foreground/40">
                                                        <Package className="h-8 w-8" />
                                                    </div>
                                                )}

                                                {/* Selection Checkmark Overlay */}
                                                <div
                                                    className={`absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200 ${
                                                        isSelected
                                                            ? 'bg-primary text-primary-foreground shadow-md scale-100'
                                                            : 'border border-border/80 bg-background/80 text-transparent opacity-0 group-hover:opacity-100 group-hover:text-muted-foreground/40'
                                                    }`}
                                                >
                                                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                                                </div>
                                            </div>

                                            {/* Info: Name & Price ONLY */}
                                            <div className="flex flex-1 flex-col justify-between p-2.5">
                                                <p
                                                    className="truncate text-xs font-bold text-foreground transition-colors group-hover:text-primary"
                                                    title={prod.name}
                                                >
                                                    {prod.name}
                                                </p>
                                                <div className="mt-1">
                                                    {prod.price ? (
                                                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                            ₱{Number(prod.price).toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] italic text-muted-foreground">
                                                            Price not set
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: CUSTOM ITEMS */}
                {productTab === 'custom' && (
                    <div className="space-y-3.5 animate-in duration-200 fade-in">
                        <div>
                            <p className="text-xs font-bold text-foreground">
                                Custom Products & Services
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                                Enter custom items, packages, or services to feature in this marketing visual.
                            </p>
                        </div>

                        {/* Custom Items List */}
                        {customProducts.length > 0 ? (
                            <div className="space-y-2.5">
                                {customProducts.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className="space-y-2.5 rounded-2xl border border-border/80 bg-background/90 p-3.5 shadow-2xs transition-all"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                                <Edit3 className="h-2.5 w-2.5" />
                                                Custom Item #{index + 1}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onRemoveCustomProduct(item.id)}
                                                title="Remove custom item"
                                                className="h-7 w-7 rounded-lg p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                                            <div className="space-y-1 sm:col-span-2">
                                                <label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                                    Product / Service Name
                                                </label>
                                                <Input
                                                    value={item.name}
                                                    onChange={(e) =>
                                                        onUpdateCustomProduct(item.id, 'name', e.target.value)
                                                    }
                                                    placeholder="e.g. Specialty Barako Iced Latte, Hydrating Facial"
                                                    className="h-9 rounded-xl text-xs"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                                    Price (PHP)
                                                </label>
                                                <div className="flex items-center rounded-xl border border-input bg-background focus-within:ring-2 focus-within:ring-primary/30">
                                                    <span className="border-r border-input bg-muted/30 px-2.5 py-1.5 text-xs font-bold text-muted-foreground">
                                                        ₱
                                                    </span>
                                                    <Input
                                                        value={item.price}
                                                        onChange={(e) =>
                                                            onUpdateCustomProduct(
                                                                item.id,
                                                                'price',
                                                                e.target.value.replace(/\D/g, ''),
                                                            )
                                                        }
                                                        placeholder="199"
                                                        className="h-8.5 border-0 text-xs shadow-none focus-visible:ring-0"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {customProducts.length < 5 && (
                                    <div className="pt-1">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={onAddCustomProduct}
                                            className="h-8 gap-1.5 rounded-xl border-dashed text-xs font-semibold text-primary border-primary/40 bg-primary/5 hover:bg-primary/10"
                                        >
                                            <Plus className="h-3.5 w-3.5" /> Add Another Custom Item
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/15 p-5 text-center">
                                <Edit3 className="mx-auto mb-1.5 h-6 w-6 text-muted-foreground/50" />
                                <p className="text-xs font-bold text-foreground">
                                    No custom products added yet
                                </p>
                                <p className="mx-auto mt-0.5 max-w-sm text-[11px] text-muted-foreground">
                                    Click below to specify a custom product or service for this visual.
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={onAddCustomProduct}
                                    className="mt-3 h-8 gap-1.5 rounded-xl text-xs font-semibold"
                                >
                                    <Plus className="h-3.5 w-3.5" /> Add Custom Item
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
