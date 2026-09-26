import React from 'react';
import { Link } from '@inertiajs/react';
import {
    Sparkles,
    Edit3,
    Trash2,
    Download,
    Tag,
    Calendar,
    ChevronDown,
    Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProductViewerItem } from '../types';

interface ProductViewerPanelProps {
    product: ProductViewerItem;
    onDownload?: (item: ProductViewerItem, format: 'png' | 'jpeg') => void;
    onDelete?: (item: ProductViewerItem) => void;
}

export function ProductViewerPanel({
    product,
    onDownload,
    onDelete,
}: ProductViewerPanelProps) {
    const formattedPrice =
        product.price !== undefined &&
        product.price !== null &&
        product.price !== ''
            ? `₱${Number(product.price).toLocaleString()}`
            : 'Price not set';

    const editUrl = product.edit_url || `/products/${product.id}/edit`;
    const generateUrl = `/generator?product_id=${product.id}&product_name=${encodeURIComponent(
        product.name
    )}&price=${encodeURIComponent(product.price || '')}`;

    return (
        <div className="flex h-full flex-col justify-between p-5 sm:p-6">
            {/* Upper Content: Titles, Primary Actions & Metadata */}
            <div className="space-y-6">
                {/* Context Label & Title */}
                <div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        <Package className="h-3.5 w-3.5" />
                        <span>Product Catalog</span>
                    </div>

                    <h1
                        className="mt-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl"
                        title={product.name}
                    >
                        {product.name}
                    </h1>

                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                            {formattedPrice}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground uppercase">
                            Retail
                        </span>
                    </div>
                </div>

                {/* Primary Action: Generate AI Visuals */}
                <div className="space-y-2">
                    <Button
                        asChild
                        size="lg"
                        className="w-full gap-2 bg-primary font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-lg active:scale-[0.99]"
                    >
                        <Link href={generateUrl}>
                            <Sparkles className="h-4 w-4" />
                            Generate AI Visuals
                        </Link>
                    </Button>
                    <p className="text-center text-[11px] text-muted-foreground">
                        Create AI marketing designs featuring this product
                    </p>
                </div>

                {/* Secondary Actions: Edit & Download */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-9 gap-1.5 border-border bg-card font-medium text-foreground hover:bg-muted"
                    >
                        <Link href={editUrl}>
                            <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                            Edit Product
                        </Link>
                    </Button>

                    {product.image_url ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 gap-1.5 border-border bg-card font-medium text-foreground hover:bg-muted"
                                >
                                    <Download className="h-3.5 w-3.5 text-muted-foreground" />
                                    Download
                                    <ChevronDown className="h-3 w-3 opacity-60 ml-auto" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-44 border-border bg-popover shadow-lg"
                            >
                                <DropdownMenuItem
                                    onClick={() =>
                                        onDownload?.(product, 'png')
                                    }
                                    className="cursor-pointer gap-2 text-xs"
                                >
                                    <Download className="h-3.5 w-3.5 text-primary" />
                                    PNG (High Quality)
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        onDownload?.(product, 'jpeg')
                                    }
                                    className="cursor-pointer gap-2 text-xs"
                                >
                                    <Download className="h-3.5 w-3.5 text-blue-500" />
                                    JPEG (Web Optimized)
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="h-9 gap-1.5 border-border opacity-50"
                        >
                            <Download className="h-3.5 w-3.5" />
                            No Visual
                        </Button>
                    )}
                </div>

                {/* Product Metadata Card */}
                <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-2.5">
                    <div className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                        Product Details
                    </div>

                    <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            Added to Catalog
                        </span>
                        <span className="font-semibold text-foreground">
                            {product.created_at || 'Catalog Product'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Tag className="h-3.5 w-3.5 text-primary" />
                            Product ID
                        </span>
                        <span className="font-mono text-muted-foreground">
                            #{product.id}
                        </span>
                    </div>
                </div>
            </div>

            {/* Bottom Destructive Action: Delete Product */}
            {onDelete && (
                <div className="border-t border-border/70 pt-4 mt-6">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(product)}
                        className="w-full justify-center gap-2 text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive active:scale-[0.99]"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete Product from Catalog
                    </Button>
                </div>
            )}
        </div>
    );
}
