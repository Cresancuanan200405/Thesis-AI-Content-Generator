import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
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
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppPagination } from '@/components/ui/app-pagination';
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
    const [isZoomed, setIsZoomed] = useState(false);
    const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
    const [productToDelete, setProductToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // View preference saved in localStorage
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('marketpilot_products_view_mode');

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

    // Fullscreen viewer scroll status
    const [isScrolledToDetails, setIsScrolledToDetails] = useState(false);

    const currentPreviewIndex = previewProduct
        ? productList.findIndex((p: any) => p.id === previewProduct.id)
        : -1;
    const hasPrevProduct = currentPreviewIndex > 0;
    const hasNextProduct =
        currentPreviewIndex !== -1 && currentPreviewIndex < productList.length - 1;

    const handlePrevProduct = (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }

        if (hasPrevProduct) {
            setPreviewProduct(productList[currentPreviewIndex - 1]);
            setIsZoomed(false);
            setZoomOrigin({ x: 50, y: 50 });
            setIsScrolledToDetails(false);
        }
    };

    const handleNextProduct = (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }

        if (hasNextProduct) {
            setPreviewProduct(productList[currentPreviewIndex + 1]);
            setIsZoomed(false);
            setZoomOrigin({ x: 50, y: 50 });
            setIsScrolledToDetails(false);
        }
    };

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
        setIsZoomed(false);
        setZoomOrigin({ x: 50, y: 50 });
        setIsScrolledToDetails(false);
    };

    const handleToggleScrollDetails = () => {
        if (!isScrolledToDetails) {
            const el = document.getElementById('product-modal-details');

            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
                setIsScrolledToDetails(true);
            }
        } else {
            const container = document.getElementById(
                'product-modal-container',
            );

            if (container) {
                container.scrollTo({ top: 0, behavior: 'smooth' });
                setIsScrolledToDetails(false);
            }
        }
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

    useEffect(() => {
        if (previewProduct) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [previewProduct]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!previewProduct) {
                return;
            }

            if (e.key === 'Escape') {
                setPreviewProduct(null);
                setIsZoomed(false);
                setIsScrolledToDetails(false);
            } else if (e.key === 'ArrowLeft') {
                if (hasPrevProduct) {
                    setPreviewProduct(productList[currentPreviewIndex - 1]);
                    setIsZoomed(false);
                    setZoomOrigin({ x: 50, y: 50 });
                    setIsScrolledToDetails(false);
                }
            } else if (e.key === 'ArrowRight') {
                if (hasNextProduct) {
                    setPreviewProduct(productList[currentPreviewIndex + 1]);
                    setIsZoomed(false);
                    setZoomOrigin({ x: 50, y: 50 });
                    setIsScrolledToDetails(false);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        previewProduct,
        currentPreviewIndex,
        hasPrevProduct,
        hasNextProduct,
        productList,
    ]);

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
                                            className="h-8 w-8 rounded-xl p-0 shadow-none text-muted-foreground hover:text-foreground"
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
                FULL SCREEN PRODUCT PREVIEW MODAL
            ============================================================= */}
            {previewProduct && (
                <div
                    id="product-modal-container"
                    onScroll={(e) => {
                        const target = e.currentTarget;

                        if (target.scrollTop > 150) {
                            setIsScrolledToDetails(true);
                        } else {
                            setIsScrolledToDetails(false);
                        }
                    }}
                    className="dark fixed inset-0 z-[150] animate-in overflow-x-hidden overflow-y-auto scroll-smooth bg-black/95 text-white backdrop-blur-2xl duration-200 select-none fade-in"
                >
                    {/* Top Floating Control Bar (Sticky) */}
                    <div className="sticky top-0 z-[160] flex w-full items-center justify-between border-b border-white/10 bg-gradient-to-b from-black/95 via-black/85 to-transparent px-5 py-3.5 backdrop-blur-md sm:px-8">
                        <div className="flex items-center gap-3">
                            <h2 className="max-w-[200px] truncate text-sm font-semibold text-white sm:max-w-md sm:text-base">
                                {previewProduct.name}
                            </h2>
                            <Badge
                                variant="outline"
                                className="hidden border-white/20 bg-white/5 text-[10px] text-white/90 sm:inline-flex"
                            >
                                Product {currentPreviewIndex + 1} of{' '}
                                {productList.length}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Zoom Status Hint */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (!isZoomed) {
                                        setZoomOrigin({ x: 50, y: 50 });
                                        setIsZoomed(true);
                                    } else {
                                        setIsZoomed(false);
                                    }
                                }}
                                className="hidden cursor-pointer items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md transition-all hover:bg-white/20 hover:text-white sm:flex"
                                title="Click image or button to zoom"
                            >
                                {isZoomed ? (
                                    <>
                                        <ZoomOut className="h-3.5 w-3.5 text-primary" />
                                        <span>Zoomed (175%)</span>
                                    </>
                                ) : (
                                    <>
                                        <ZoomIn className="h-3.5 w-3.5" />
                                        <span>Click to Zoom</span>
                                    </>
                                )}
                            </button>

                            {/* Download Dropdown */}
                            {previewProduct.image_url && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-white/10 px-3 text-xs font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20"
                                            title="Download Image"
                                        >
                                            <Download className="h-4 w-4" />
                                            Download
                                            <ChevronDown className="h-3 w-3 opacity-70" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="z-[180] w-48 rounded-xl border-white/20 bg-black/90 p-1.5 text-white shadow-xl backdrop-blur-xl"
                                    >
                                        <DropdownMenuItem
                                            onClick={() =>
                                                downloadVisualAsFormat(
                                                    previewProduct.image_url,
                                                    previewProduct.name,
                                                    'png',
                                                )
                                            }
                                            className="cursor-pointer gap-2 text-xs font-medium text-white hover:bg-white/20 focus:bg-white/20 focus:text-white"
                                        >
                                            <Download className="h-3.5 w-3.5 text-primary" />
                                            PNG (High Quality)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() =>
                                                downloadVisualAsFormat(
                                                    previewProduct.image_url,
                                                    previewProduct.name,
                                                    'jpeg',
                                                )
                                            }
                                            className="cursor-pointer gap-2 text-xs font-medium text-white hover:bg-white/20 focus:bg-white/20 focus:text-white"
                                        >
                                            <Download className="h-3.5 w-3.5 text-blue-400" />
                                            JPEG (Web-Optimized)
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    setPreviewProduct(null);
                                    setIsZoomed(false);
                                    setIsScrolledToDetails(false);
                                }}
                                className="ml-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-all hover:bg-white/30"
                                title="Close (Esc)"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Floating Previous Image Button (Left) */}
                    {hasPrevProduct && (
                        <button
                            type="button"
                            onClick={handlePrevProduct}
                            className="fixed top-1/2 left-3 z-[170] flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/85 shadow-2xl backdrop-blur-md transition-all duration-200 hover:scale-110 hover:border-white/40 hover:bg-black/90 hover:text-white active:scale-95 sm:left-6 sm:h-13 sm:w-13"
                            title="Previous product (←)"
                            aria-label="Previous product"
                        >
                            <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" />
                        </button>
                    )}

                    {/* Floating Next Image Button (Right) */}
                    {hasNextProduct && (
                        <button
                            type="button"
                            onClick={handleNextProduct}
                            className="fixed top-1/2 right-3 z-[170] flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/85 shadow-2xl backdrop-blur-md transition-all duration-200 hover:scale-110 hover:border-white/40 hover:bg-black/90 hover:text-white active:scale-95 sm:right-6 sm:h-13 sm:w-13"
                            title="Next product (→)"
                            aria-label="Next product"
                        >
                            <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7" />
                        </button>
                    )}

                    {/* Section 1: Main Full View Image Canvas */}
                    <div
                        id="product-modal-canvas"
                        className="group/canvas relative flex min-h-[calc(100vh-4.5rem)] w-full flex-col items-center justify-center px-4 pt-4 pb-20 sm:px-8 sm:pt-6 sm:pb-24"
                    >
                        {/* Ambient Glow */}
                        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
                            <div className="h-[450px] w-[450px] rounded-full bg-gradient-to-tr from-primary/20 via-blue-500/10 to-transparent opacity-40 blur-3xl" />
                        </div>

                        {/* Subtle Black Gradient Overlay at the Very Bottom of Dark Backdrop */}
                        <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-28 bg-gradient-to-t from-black via-black/80 to-transparent" />

                        {previewProduct.image_url ? (
                            <img
                                src={previewProduct.image_url}
                                alt={previewProduct.name}
                                onClick={(e) => {
                                    e.stopPropagation();

                                    if (!isZoomed) {
                                        const rect =
                                            e.currentTarget.getBoundingClientRect();
                                        const offsetX = e.clientX - rect.left;
                                        const offsetY = e.clientY - rect.top;
                                        const xPercent = Math.max(
                                            0,
                                            Math.min(
                                                100,
                                                (offsetX / rect.width) * 100,
                                            ),
                                        );
                                        const yPercent = Math.max(
                                            0,
                                            Math.min(
                                                100,
                                                (offsetY / rect.height) * 100,
                                            ),
                                        );
                                        setZoomOrigin({
                                            x: xPercent,
                                            y: yPercent,
                                        });
                                        setIsZoomed(true);
                                    } else {
                                        setIsZoomed(false);
                                    }
                                }}
                                style={{
                                    transformOrigin: isZoomed
                                        ? `${zoomOrigin.x}% ${zoomOrigin.y}%`
                                        : 'center center',
                                }}
                                className={`z-20 block max-h-[calc(100vh-12rem)] max-w-[86vw] cursor-pointer rounded-2xl object-contain drop-shadow-2xl transition-transform duration-300 ease-out select-none ${
                                    isZoomed
                                        ? 'scale-[1.75] cursor-zoom-out'
                                        : 'scale-100 cursor-zoom-in'
                                }`}
                            />
                        ) : (
                            <div className="z-20 flex flex-col items-center justify-center text-white/50">
                                <Tag className="h-16 w-16 opacity-40" />
                                <p className="mt-2 text-sm font-medium">
                                    No visual image uploaded for this product
                                </p>
                            </div>
                        )}

                        {/* Static Scroll Indicator Button (Dark circular navigation arrow layered over the black gradient zone, clear of the image) */}
                        <button
                            type="button"
                            onClick={handleToggleScrollDetails}
                            className="group/scroll absolute bottom-4 left-1/2 z-30 flex h-10 w-10 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/80 text-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:border-primary/60 hover:bg-black hover:text-white hover:shadow-[0_0_20px_rgba(var(--primary),0.5)] active:scale-95"
                            title={
                                isScrolledToDetails
                                    ? 'Scroll up to image'
                                    : 'Scroll down for details'
                            }
                            aria-label={
                                isScrolledToDetails
                                    ? 'Scroll up to image'
                                    : 'Scroll down for details'
                            }
                        >
                            {isScrolledToDetails ? (
                                <ChevronUp className="h-5 w-5 transition-transform duration-300 group-hover/scroll:text-primary" />
                            ) : (
                                <ChevronDown className="h-5 w-5 transition-transform duration-300 group-hover/scroll:text-primary" />
                            )}
                        </button>
                    </div>

                    {/* Section 2: Recreated, Classy Details & Functions Section */}
                    <div
                        id="product-modal-details"
                        className="relative z-30 w-full border-t border-border/80 bg-card/98 px-4 pt-8 pb-16 text-foreground backdrop-blur-3xl sm:px-8"
                    >
                        <div className="mx-auto max-w-3xl space-y-6">
                            <div className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <div className="inline-flex items-center gap-2 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold tracking-wider text-primary-foreground uppercase shadow-md shadow-primary/20">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Product Details
                                    </div>
                                    <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                                        {previewProduct.name}
                                    </h3>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        asChild
                                        size="sm"
                                        className="h-9 cursor-pointer gap-2 bg-primary px-4 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:scale-105 hover:bg-primary/90"
                                    >
                                        <Link
                                            href={`/generator?product_id=${previewProduct.id}&product_name=${encodeURIComponent(previewProduct.name)}&price=${encodeURIComponent(previewProduct.price || '')}`}
                                        >
                                            <Sparkles className="h-4 w-4" />
                                            Generate AI Visuals
                                        </Link>
                                    </Button>

                                    <Button
                                        asChild
                                        variant="outline"
                                        size="sm"
                                        className="h-9 cursor-pointer gap-1.5 border-border bg-card px-4 text-xs font-semibold text-foreground transition-all hover:bg-muted"
                                    >
                                        <Link
                                            href={
                                                previewProduct.edit_url ||
                                                `/products/${previewProduct.id}/edit`
                                            }
                                        >
                                            <Edit3 className="h-3.5 w-3.5" />
                                            Edit Product
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="group rounded-2xl border border-border/80 bg-card p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/40 sm:p-5">
                                    <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                        <Tag className="h-3.5 w-3.5 text-primary" />
                                        Retail Price
                                    </div>
                                    <p className="mt-2 text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                                        {previewProduct.price
                                            ? `₱${Number(previewProduct.price).toLocaleString()}`
                                            : 'Price not set'}
                                    </p>
                                </div>

                                <div className="group rounded-2xl border border-border/80 bg-card p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/40 sm:p-5">
                                    <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                        <Calendar className="h-3.5 w-3.5 text-primary" />
                                        Added to Catalog
                                    </div>
                                    <p className="mt-2 truncate text-base font-bold text-foreground">
                                        {previewProduct.created_at ||
                                            'Catalog Product'}
                                    </p>
                                </div>
                            </div>

                            {previewProduct.image_url && (
                                <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
                                    <span className="mr-1 text-xs font-bold text-muted-foreground">
                                        Download:
                                    </span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            downloadVisualAsFormat(
                                                previewProduct.image_url,
                                                previewProduct.name,
                                                'png',
                                            )
                                        }
                                        className="cursor-pointer gap-1.5 border-border bg-card text-xs font-semibold text-foreground shadow-none transition-all hover:bg-muted"
                                    >
                                        <Download className="h-3.5 w-3.5 text-primary" />
                                        PNG
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            downloadVisualAsFormat(
                                                previewProduct.image_url,
                                                previewProduct.name,
                                                'jpeg',
                                            )
                                        }
                                        className="cursor-pointer gap-1.5 border-border bg-card text-xs font-semibold text-foreground shadow-none transition-all hover:bg-muted"
                                    >
                                        <Download className="h-3.5 w-3.5 text-blue-500" />
                                        JPEG
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

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
            title: 'Products',
            href: '/products',
            current: true,
        },
    ],
};
