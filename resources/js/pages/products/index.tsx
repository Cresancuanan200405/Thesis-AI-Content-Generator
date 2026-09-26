import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    Check,
    ChevronDown,
    Download,
    Edit3,
    LayoutGrid,
    List,
    MoreVertical,
    Plus,
    Search,
    Sparkles,
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
                    <div className="flex flex-col gap-3 border-b border-border/60 pb-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Tag className="h-4 w-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                                        My Products
                                    </h1>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Manage, preview, and organize your product
                                    offerings.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            <Button
                                asChild
                                size="sm"
                                className="h-8 gap-1.5 text-xs font-semibold shadow-2xs"
                            >
                                <Link href="/products/create">
                                    <Plus className="h-3.5 w-3.5" />
                                    Add Product
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* =====================================================
                        STICKY FILTER TOOLBAR
                    ====================================================== */}
                    <div className="sticky top-11 z-30 mb-5 rounded-2xl border border-white/25 bg-card/95 p-2.5 shadow-md backdrop-blur-xl transition-all sm:top-12 sm:p-3 dark:border-white/10 dark:bg-card/95">
                        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                            {/* Search */}
                            <div className="relative min-w-0 flex-1">
                                <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={filters.search ?? ''}
                                    onChange={(event) =>
                                        updateSearch(event.target.value)
                                    }
                                    placeholder="Search products by name or price..."
                                    className="h-8.5 border-input bg-background pr-8 pl-8.5 text-xs shadow-none focus-visible:ring-primary/30"
                                />
                                {filters.search && (
                                    <button
                                        type="button"
                                        onClick={() => updateSearch('')}
                                        className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-muted-foreground/60 transition-colors hover:text-foreground"
                                        aria-label="Clear search"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Controls Row */}
                            <div className="flex shrink-0 items-center justify-between gap-2.5 sm:justify-end">
                                <span className="text-xs font-medium text-muted-foreground">
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
                                            className="h-8 w-8 rounded-xl p-0 text-muted-foreground shadow-none hover:text-foreground"
                                            title={`Current view: ${
                                                viewMode === 'grid'
                                                    ? 'Grid'
                                                    : 'List'
                                            }`}
                                            aria-label="Toggle View Mode"
                                        >
                                            {viewMode === 'grid' ? (
                                                <LayoutGrid className="h-4 w-4" />
                                            ) : (
                                                <List className="h-4 w-4" />
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
                        <div className="rounded-3xl border border-dashed border-border bg-card/60 p-12 text-center shadow-xs">
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
                        /* COMPACT GRID VIEW WITH ACTUAL FULL IMAGE */
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
                                        className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-xl border border-border bg-card text-left shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus:ring-2 focus:ring-primary/30 focus:outline-none"
                                    >
                                        {/* Product Image Container (Full Actual Image View) */}
                                        <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden border-b border-border/50 bg-muted/20 p-1.5">
                                            {product.image_url ? (
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-muted/30 text-muted-foreground">
                                                    <Tag className="h-7 w-7 opacity-30" />
                                                </div>
                                            )}

                                            {/* Top Right Options Menu (Visible ONLY on Hover) */}
                                            <div
                                                className="absolute top-1.5 right-1.5 z-20 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
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
                                                            className="flex h-6.5 w-6.5 items-center justify-center rounded-md bg-black/60 text-white/90 shadow-xs backdrop-blur-md transition-all hover:bg-black/80 hover:text-white"
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
                                                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                                                            Generate AI Visuals
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

                                        {/* Product Details Header */}
                                        <div className="flex flex-1 flex-col justify-between p-2.5">
                                            <h3 className="truncate text-xs font-bold text-foreground transition-colors group-hover:text-primary">
                                                {product.name}
                                            </h3>
                                            <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                                                <span className="truncate">
                                                    {product.created_at ||
                                                        'Catalog Item'}
                                                </span>
                                                {product.price && (
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                        ₱
                                                        {Number(
                                                            product.price,
                                                        ).toLocaleString()}
                                                    </span>
                                                )}
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
                                        className="group flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-card p-2.5 shadow-2xs transition-all duration-200 hover:border-primary/40 hover:shadow-xs"
                                    >
                                        <div className="flex min-w-0 items-center gap-2.5">
                                            {/* Thumbnail (Full Image View) */}
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/30 p-0.5">
                                                {product.image_url ? (
                                                    <img
                                                        src={product.image_url}
                                                        alt={product.name}
                                                        className="h-full w-full object-contain"
                                                    />
                                                ) : (
                                                    <Tag className="h-4 w-4 text-muted-foreground/40" />
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="min-w-0 space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="truncate text-xs font-bold text-foreground transition-colors group-hover:text-primary">
                                                        {product.name}
                                                    </h3>
                                                    {product.price && (
                                                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                                            ₱
                                                            {Number(
                                                                product.price,
                                                            ).toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="truncate text-[10px] text-muted-foreground">
                                                    {product.created_at ||
                                                        'Catalog Item'}
                                                </p>
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
                                                    <Sparkles className="mr-1 h-3 w-3 text-primary" />
                                                    Generate
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
                <DialogContent className="rounded-3xl border-border bg-card p-6 shadow-xl sm:max-w-md">
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
