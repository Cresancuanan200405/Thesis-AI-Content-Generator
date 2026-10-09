import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    Check,
    ChevronDown,
    Download,
    Edit3,
    ImageIcon,
    LayoutGrid,
    List,
    MoreVertical,
    Plus,
    Search,
    Tag,
    Trash2,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AppPagination } from '@/components/ui/app-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { downloadVisualAsFormat } from '@/lib/download';
import { UnifiedImageViewer } from '@/components/image-viewer';

export default function ProductsIndexPage({
    products = [],
    filters = {},
    count = 0,
    pagination = {},
}: any) {
    const productList = Array.isArray(products)
        ? products
        : (products?.data ?? []);
    const currentPage = pagination?.current_page ?? 1;
    const lastPage = pagination?.last_page ?? 1;

    const buildProductPageUrl = (pageNumber: number) => {
        const params = new URLSearchParams();

        if (filters?.search) {
            params.set('search', filters.search);
        }

        params.set('page', String(pageNumber));

        return `/products?${params.toString()}`;
    };

    const [previewProduct, setPreviewProduct] = useState<any>(null);
    const [productToDelete, setProductToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // View preference saved in localStorage
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(
                'marketpilot_products_view_mode',
            );

            if (saved === 'grid' || saved === 'list') {
                return saved;
            }
        }

        return 'grid';
    });

    const handleSetViewMode = (mode: 'grid' | 'list') => {
        setViewMode(mode);

        if (typeof window !== 'undefined') {
            localStorage.setItem('marketpilot_products_view_mode', mode);
        }
    };

    const currentPreviewIndex = previewProduct
        ? productList.findIndex((p: any) => p.id === previewProduct.id)
        : -1;

    const updateSearch = (value: string) => {
        router.get(
            '/products',
            { search: value },
            {
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handleOpenProductPreview = (product: any) => {
        setPreviewProduct(product);
    };

    // Single Delete
    const confirmDelete = () => {
        if (!productToDelete) {
            return;
        }

        setIsDeleting(true);

        router.delete(`/products/${productToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                const deletedId = productToDelete.id;
                setProductToDelete(null);

                if (previewProduct?.id === deletedId) {
                    setPreviewProduct(null);
                }

                toast.success('Product deleted successfully.');
            },
            onError: () => {
                toast.error('Failed to delete product.');
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    const handleDownload = (product: any) => {
        if (!product.image_url) {
            toast.info('No image available to download.');

            return;
        }

        const link = document.createElement('a');
        link.href = product.image_url;
        link.download = `${product.name || 'product'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Downloading visual for ${product.name}!`);
    };

    return (
        <>
            <Head title="My Products" />

            <div className="min-h-screen bg-background pb-24 text-foreground">
                <div className="space-y-5 p-4 md:p-6 lg:p-8">
                    {/* =====================================================
                        PAGE HEADER & CREATE ACTION
                    ====================================================== */}
                    <div className="flex flex-col gap-3 border-b border-border/60 pb-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                Product Catalog
                            </span>
                            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                Products
                            </h1>
                            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                                Maintain your products, inventory pricing, and image assets for marketing creative campaigns.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            <Button
                                asChild
                                size="sm"
                                className="h-9 gap-1.5 rounded-md bg-foreground px-4 text-xs font-semibold text-background shadow-xs transition-all hover:opacity-95"
                            >
                                <Link href="/products/create">
                                    <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                                    <span>Add Product</span>
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* =====================================================
                        STICKY FILTER TOOLBAR (MATCHING SYSTEM TOOLBAR HEIGHT)
                    ====================================================== */}
                    <div className="sticky top-11 z-30 mb-5 rounded-card border border-border/70 bg-card/95 px-3 py-2 shadow-sm backdrop-blur-xl transition-all sm:top-12 dark:bg-card/90">
                        <div className="flex items-center justify-between gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2.5">
                            {/* Search */}
                            <div className="relative min-w-0 flex-1">
                                <Search className="absolute top-1/2 left-2.5 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={filters.search ?? ''}
                                    onChange={(event) =>
                                        updateSearch(event.target.value)
                                    }
                                    placeholder="Search products by name or price..."
                                    className="h-7 border-border bg-background pr-7 pl-8 text-xs shadow-2xs focus-visible:ring-primary/30"
                                />
                                {filters.search && (
                                    <button
                                        type="button"
                                        onClick={() => updateSearch('')}
                                        className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-muted-foreground/60 transition-colors hover:text-foreground"
                                        aria-label="Clear search"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>

                            {/* Controls Row */}
                            <div className="flex shrink-0 items-center gap-2">
                                <span className="hidden items-center justify-center rounded-md bg-muted/60 px-2 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground sm:inline-flex">
                                    {count}{' '}
                                    {count === 1 ? 'product' : 'products'}
                                </span>

                                {/* VIEW MODE DROPDOWN (ICON-ONLY BUTTON) */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-7 w-7 rounded-lg border-border bg-background p-0 text-muted-foreground shadow-2xs hover:bg-muted/40 hover:text-foreground shrink-0"
                                            title={`Current view: ${
                                                viewMode === 'grid'
                                                    ? 'Grid'
                                                    : 'List'
                                            }`}
                                            aria-label="Toggle View Mode"
                                        >
                                            {viewMode === 'grid' ? (
                                                <LayoutGrid className="h-3.5 w-3.5" />
                                            ) : (
                                                <List className="h-3.5 w-3.5" />
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="w-32 rounded-xl p-1 shadow-md"
                                    >
                                        <DropdownMenuItem
                                            onClick={() =>
                                                handleSetViewMode('grid')
                                            }
                                            className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                                                viewMode === 'grid'
                                                    ? 'bg-primary/10 font-semibold text-primary'
                                                    : 'text-foreground hover:bg-muted'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <LayoutGrid className="h-3.5 w-3.5" />
                                                <span>Grid</span>
                                            </div>
                                            {viewMode === 'grid' && (
                                                <Check className="h-3.5 w-3.5 text-primary" />
                                            )}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() =>
                                                handleSetViewMode('list')
                                            }
                                            className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                                                viewMode === 'list'
                                                    ? 'bg-primary/10 font-semibold text-primary'
                                                    : 'text-foreground hover:bg-muted'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <List className="h-3.5 w-3.5" />
                                                <span>List</span>
                                            </div>
                                            {viewMode === 'list' && (
                                                <Check className="h-3.5 w-3.5 text-primary" />
                                            )}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>

                    {/* =====================================================
                        PRODUCTS CONTENT (GRID OR LIST)
                    ====================================================== */}
                    {productList.length === 0 ? (
                        <div className="rounded-card border border-dashed border-border bg-card/60 p-12 text-center shadow-xs">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                                <Tag className="h-7 w-7 opacity-60" />
                            </div>
                            <h2 className="mt-4 text-base font-bold text-foreground">
                                {filters.search
                                    ? 'No products matching your search'
                                    : 'No products in your catalog yet'}
                            </h2>
                            <p className="mx-auto mt-1.5 max-w-sm text-xs text-muted-foreground">
                                {filters.search
                                    ? 'Try adjusting your search terms to find what you are looking for.'
                                    : 'Add your product offerings to link them directly with AI-generated marketing visual assets and campaigns.'}
                            </p>
                            <Button
                                asChild
                                size="sm"
                                className="mt-5 gap-1.5 rounded-xl shadow-xs"
                            >
                                <Link href="/products/create">
                                    <Plus className="h-3.5 w-3.5" />
                                    Add Your First Product
                                </Link>
                            </Button>
                        </div>
                    ) : viewMode === 'grid' ? (
                        /* GRID VIEW MATCHING CAMPAIGN & DESIGNS CARD DESIGN */
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 sm:gap-5">
                            {productList.map((product: any) => {
                                return (
                                    <div
                                        key={product.id}
                                        className="group flex flex-col"
                                    >
                                        {/* Product Image Stage (Full Image View, No Cropping) */}
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            onClick={() =>
                                                handleOpenProductPreview(product)
                                            }
                                            onKeyDown={(e) => {
                                                if (
                                                    e.key === 'Enter' ||
                                                    e.key === ' '
                                                ) {
                                                    handleOpenProductPreview(
                                                        product,
                                                    );
                                                }
                                            }}
                                            className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-muted/20 cursor-pointer shadow-2xs transition-all duration-200 hover:border-primary/50 hover:shadow-md focus:outline-hidden"
                                            title="Click to view product details"
                                        >
                                            {product.image_url ? (
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.01]"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-muted/30 text-muted-foreground/40">
                                                    <Tag className="h-9 w-9 opacity-30" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Details Header & Action Menu */}
                                        <div className="mt-2.5 flex items-start justify-between gap-2 px-0.5">
                                            <div className="min-w-0 flex-1">
                                                {/* Product Name */}
                                                <h3
                                                    className="truncate text-sm font-semibold text-foreground leading-tight"
                                                    title={product.name}
                                                >
                                                    {product.name}
                                                </h3>

                                                {/* Price */}
                                                {product.price !== null &&
                                                    product.price !== undefined &&
                                                    product.price !== '' && (
                                                        <p className="mt-1 text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                                                            ₱
                                                            {Number(
                                                                product.price,
                                                            ).toLocaleString()}
                                                        </p>
                                                    )}
                                            </div>

                                            {/* Options Menu */}
                                            <div
                                                className="shrink-0"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                            }}
                                                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/50 bg-background/80 text-muted-foreground shadow-2xs backdrop-blur-xs transition-colors hover:border-border hover:bg-muted hover:text-foreground"
                                                            aria-label="Product options"
                                                        >
                                                            <MoreVertical className="h-3.5 w-3.5" />
                                                        </button>
                                                    </DropdownMenuTrigger>

                                                    <DropdownMenuContent
                                                        align="end"
                                                        className="w-44 rounded-xl border-border p-1.5 shadow-lg"
                                                    >
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                router.visit(
                                                                    `/generator?product_id=${product.id}&product_name=${encodeURIComponent(product.name)}&price=${encodeURIComponent(product.price || '')}`,
                                                                );
                                                            }}
                                                            className="cursor-pointer gap-2 text-xs font-medium"
                                                        >
                                                            <ImageIcon className="h-3.5 w-3.5" />
                                                            Create Design
                                                        </DropdownMenuItem>

                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                router.visit(
                                                                    product.edit_url ||
                                                                        `/products/${product.id}/edit`,
                                                                );
                                                            }}
                                                            className="cursor-pointer gap-2 text-xs font-medium"
                                                        >
                                                            <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                                                            Edit Product
                                                        </DropdownMenuItem>

                                                        {product.image_url && (
                                                            <DropdownMenuItem
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    handleDownload(
                                                                        product,
                                                                    );
                                                                }}
                                                                className="cursor-pointer gap-2 text-xs font-medium"
                                                            >
                                                                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                                                                Download Image
                                                            </DropdownMenuItem>
                                                        )}

                                                        <DropdownMenuSeparator />

                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setProductToDelete(
                                                                    product,
                                                                );
                                                            }}
                                                            className="cursor-pointer gap-2 text-xs font-medium text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                            Delete Product
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* LIST VIEW */
                        <div className="space-y-1.5">
                            {productList.map((product: any) => {
                                return (
                                    <div
                                        key={product.id}
                                        onClick={() =>
                                            handleOpenProductPreview(product)
                                        }
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === 'Enter' ||
                                                e.key === ' '
                                            ) {
                                                handleOpenProductPreview(
                                                    product,
                                                );
                                            }
                                        }}
                                        className="group flex cursor-pointer items-center justify-between gap-3 rounded-card border border-border bg-card p-2.5 shadow-2xs transition-all duration-200 hover:border-primary/40 hover:shadow-xs dark:border-white/[0.08] dark:bg-[#161820]"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            {/* Thumbnail (Full Image View) */}
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-muted/20 p-1">
                                                {product.image_url ? (
                                                    <img
                                                        src={product.image_url}
                                                        alt={product.name}
                                                        className="h-full w-full object-contain"
                                                    />
                                                ) : (
                                                    <Tag className="h-5 w-5 text-muted-foreground/40" />
                                                )}
                                            </div>

                                            {/* Info: Show ONLY product name and price */}
                                            <div className="min-w-0 space-y-0.5">
                                                <h3 className="truncate text-xs font-bold text-foreground transition-colors group-hover:text-primary">
                                                    {product.name}
                                                </h3>
                                                {product.price !== null &&
                                                    product.price !== undefined &&
                                                    product.price !== '' && (
                                                        <p className="text-[11px] font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                                                            ₱
                                                            {Number(
                                                                product.price,
                                                            ).toLocaleString()}
                                                        </p>
                                                    )}
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-2">
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="outline"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                                className="hidden h-7 rounded-lg text-[11px] font-semibold shadow-none sm:inline-flex"
                                            >
                                                <Link
                                                    href={`/generator?product_id=${product.id}&product_name=${encodeURIComponent(product.name)}&price=${encodeURIComponent(product.price || '')}`}
                                                >
                                                    <ImageIcon className="mr-1.5 h-3 w-3" />
                                                    Create Design
                                                </Link>
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                        }}
                                                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-all hover:bg-muted/60 hover:text-foreground"
                                                        aria-label="Product options"
                                                    >
                                                        <MoreVertical className="h-3.5 w-3.5" />
                                                    </button>
                                                </DropdownMenuTrigger>

                                                <DropdownMenuContent
                                                    align="end"
                                                    className="w-44 rounded-xl border-border p-1.5 shadow-lg"
                                                >
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            router.visit(
                                                                product.edit_url ||
                                                                    `/products/${product.id}/edit`,
                                                            );
                                                        }}
                                                        className="cursor-pointer gap-2 text-xs font-medium"
                                                    >
                                                        <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                                                        Edit
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator />

                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setProductToDelete(
                                                                product,
                                                            );
                                                        }}
                                                        className="cursor-pointer gap-2 text-xs font-medium text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* =====================================================
                        PAGINATION
                    ====================================================== */}
                    {lastPage > 1 && (
                        <AppPagination
                            currentPage={currentPage}
                            lastPage={lastPage}
                            buildHref={(page) => buildProductPageUrl(page)}
                            className="mt-8"
                        />
                    )}
                </div>
            </div>

            {/* =============================================================
                UNIFIED PRODUCT IMAGE VIEWER
            ============================================================= */}
            <UnifiedImageViewer
                isOpen={!!previewProduct}
                onClose={() => setPreviewProduct(null)}
                items={productList}
                currentIndex={currentPreviewIndex}
                onNavigate={(newIndex) => {
                    if (newIndex >= 0 && newIndex < productList.length) {
                        setPreviewProduct(productList[newIndex]);
                    }
                }}
                context="product"
                onDownload={(product, format) => {
                    if (product.image_url) {
                        downloadVisualAsFormat(
                            product.image_url,
                            product.name,
                            format,
                        );
                    }
                }}
                onDelete={(product) => {
                    setProductToDelete(product);
                }}
            />

            {/* =============================================================
                DELETE PRODUCT CONFIRMATION MODAL
            ============================================================= */}
            <Dialog
                open={!!productToDelete}
                onOpenChange={(open) => {
                    if (!open && !isDeleting) {
                        setProductToDelete(null);
                    }
                }}
            >
                <DialogContent className="rounded-card border-border bg-card p-6 shadow-xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-foreground">
                            Delete Product?
                        </DialogTitle>
                        <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
                            Are you sure you want to delete{' '}
                            <span className="font-semibold text-foreground">
                                "{productToDelete?.name}"
                            </span>
                            ? This will permanently remove the product and its
                            image from your catalog.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="mt-6 gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setProductToDelete(null)}
                            disabled={isDeleting}
                            className="rounded-xl text-xs shadow-none"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            className="gap-2 rounded-xl text-xs"
                        >
                            <Trash2 className="h-4 w-4" />
                            {isDeleting ? 'Deleting...' : 'Delete Product'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

ProductsIndexPage.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Products',
            href: '/products',
        },
    ],
};
