import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    Check,
    CheckSquare,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Download,
    Edit3,
    Eye,
    ImageIcon,
    LayoutGrid,
    List,
    MoreVertical,
    Plus,
    Search,
    Sparkles,
    Square,
    Tag,
    Trash2,
    X,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { downloadVisualAsFormat } from '@/lib/download';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

export default function ProductsIndexPage({
    products = [],
    filters = {},
    count = 0,
}: any) {
    const [previewProduct, setPreviewProduct] = useState<any>(null);
    const [isZoomed, setIsZoomed] = useState(false);
    const [productToDelete, setProductToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Multi-select state
    const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

    const currentPreviewIndex = previewProduct
        ? products.findIndex((p: any) => p.id === previewProduct.id)
        : -1;
    const hasPrevProduct = currentPreviewIndex > 0;
    const hasNextProduct =
        currentPreviewIndex !== -1 && currentPreviewIndex < products.length - 1;

    const handlePrevProduct = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (hasPrevProduct) {
            setPreviewProduct(products[currentPreviewIndex - 1]);
            setIsZoomed(false);
        }
    };

    const handleNextProduct = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (hasNextProduct) {
            setPreviewProduct(products[currentPreviewIndex + 1]);
            setIsZoomed(false);
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
    };

    // Selection Handlers
    const toggleSelect = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedProductIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const isAllSelected = products.length > 0 && selectedProductIds.size === products.length;

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedProductIds(new Set());
        } else {
            const allIds = new Set<number>(products.map((p: any) => Number(p.id)));
            setSelectedProductIds(allIds);
        }
    };

    const clearSelection = () => {
        setSelectedProductIds(new Set());
    };

    // Bulk Delete
    const handleConfirmBulkDelete = () => {
        if (selectedProductIds.size === 0) return;
        setIsBulkDeleting(true);

        router.post(
            '/products/bulk-delete',
            { ids: Array.from(selectedProductIds) },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedProductIds(new Set());
                    setIsBulkDeleteModalOpen(false);
                    toast.success('Selected products deleted successfully.');
                },
                onError: () => {
                    toast.error('Failed to delete selected products.');
                },
                onFinish: () => {
                    setIsBulkDeleting(false);
                },
            },
        );
    };

    // Bulk Download
    const handleBulkDownload = () => {
        const selectedList = products.filter((p: any) => selectedProductIds.has(Number(p.id)) && p.image_url);
        if (selectedList.length === 0) {
            toast.info('No product images available to download among selected.');
            return;
        }

        selectedList.forEach((prod: any, idx: number) => {
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = prod.image_url;
                link.download = `${prod.name || 'product'}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }, idx * 250);
        });

        toast.success(`Downloading ${selectedList.length} product image${selectedList.length > 1 ? 's' : ''}!`);
    };

    // Single Delete
    const confirmDelete = () => {
        if (!productToDelete) return;
        setIsDeleting(true);

        router.delete(`/products/${productToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                const deletedId = productToDelete.id;
                setProductToDelete(null);
                if (previewProduct?.id === deletedId) {
                    setPreviewProduct(null);
                }
                setSelectedProductIds((prev) => {
                    const next = new Set(prev);
                    next.delete(deletedId);
                    return next;
                });
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
            if (!previewProduct) return;
            if (e.key === 'Escape') {
                setPreviewProduct(null);
                setIsZoomed(false);
            } else if (e.key === 'ArrowLeft') {
                if (hasPrevProduct) {
                    setPreviewProduct(products[currentPreviewIndex - 1]);
                    setIsZoomed(false);
                }
            } else if (e.key === 'ArrowRight') {
                if (hasNextProduct) {
                    setPreviewProduct(products[currentPreviewIndex + 1]);
                    setIsZoomed(false);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [previewProduct, currentPreviewIndex, hasPrevProduct, hasNextProduct, products]);

    return (
        <>
            <Head title="Products" />
            <div className="space-y-6 p-4 md:p-6 lg:p-8 min-h-screen bg-background text-foreground pb-28">
                {/* Header */}
                <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Tag className="h-4 w-4" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">
                                Product Catalog
                            </p>
                        </div>
                        <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight">
                            Offerings & Products
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Click on any product to preview high-res visual assets and manage details.
                        </p>
                    </div>

                    <Button asChild size="lg" className="gap-2 shadow-sm font-semibold text-xs h-10">
                        <Link href="/products/create">
                            <Plus className="h-4 w-4" />
                            Create Product
                        </Link>
                    </Button>
                </div>

                {/* Search & Selection Toolbar */}
                <Card className="rounded-2xl border-border bg-card shadow-sm">
                    <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={filters.search ?? ''}
                                onChange={(event) =>
                                    updateSearch(event.target.value)
                                }
                                placeholder="Search products by name or description..."
                                className="h-10 pl-9 border-input bg-background shadow-none focus-visible:ring-primary/30 text-xs"
                            />
                            {filters.search && (
                                <button
                                    type="button"
                                    onClick={() => updateSearch('')}
                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {products.length > 0 && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={toggleSelectAll}
                                className="h-10 text-xs font-semibold gap-1.5 shrink-0 shadow-none"
                            >
                                {isAllSelected ? (
                                    <>
                                        <CheckSquare className="h-4 w-4 text-primary" />
                                        Deselect All
                                    </>
                                ) : (
                                    <>
                                        <Square className="h-4 w-4 text-muted-foreground" />
                                        Select All
                                    </>
                                )}
                            </Button>
                        )}
                    </CardContent>
                </Card>

                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>{count} {count === 1 ? 'product' : 'products'} available</span>
                    <div className="flex items-center gap-3">
                        {selectedProductIds.size > 0 && (
                            <span className="text-primary font-semibold">
                                {selectedProductIds.size} selected
                            </span>
                        )}
                        <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                className={`flex h-7 w-7 items-center justify-center rounded-md transition-all ${
                                    viewMode === 'grid'
                                        ? 'bg-card text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                                aria-label="Grid view"
                            >
                                <LayoutGrid className="h-3.5 w-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                className={`flex h-7 w-7 items-center justify-center rounded-md transition-all ${
                                    viewMode === 'list'
                                        ? 'bg-card text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                                aria-label="List view"
                            >
                                <List className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                </div>

                {products.length === 0 ? (
                    <Card className="rounded-2xl border-border bg-card shadow-sm">
                        <CardContent className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                                <ImageIcon className="h-7 w-7" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">
                                    No products yet
                                </h2>
                                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                                    Add your first product so it can be used in campaigns and generated AI marketing visuals.
                                </p>
                            </div>
                            <Button asChild className="mt-2 shadow-sm">
                                <Link href="/products/create">
                                    <Plus className="mr-1.5 h-4 w-4" />
                                    Add your first product
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : viewMode === 'grid' ? (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {products.map((product: any) => {
                            const isSelected = selectedProductIds.has(Number(product.id));

                            return (
                                <div
                                    key={product.id}
                                    onClick={() => handleOpenProductPreview(product)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            handleOpenProductPreview(product);
                                        }
                                    }}
                                    className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                                        isSelected
                                            ? 'border-primary ring-2 ring-primary/40 shadow-md'
                                            : 'border-border hover:border-primary/40'
                                    }`}
                                >
                                    {/* Product Image Container */}
                                    <div className="relative h-48 w-full overflow-hidden bg-muted/40 border-b border-border/60">
                                        {product.image_url ? (
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                                                <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                                            </div>
                                        )}

                                        {/* Selection Checkbox (Top Left) */}
                                        <div
                                            className="absolute top-2.5 left-2.5 z-20"
                                            onClick={(e) => toggleSelect(Number(product.id), e)}
                                        >
                                            <button
                                                type="button"
                                                className={`flex h-7 w-7 items-center justify-center rounded-lg backdrop-blur-md transition-all ${
                                                    isSelected
                                                        ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-background'
                                                        : 'bg-black/40 text-white/70 hover:bg-black/60 hover:text-white'
                                                }`}
                                                aria-label="Select product"
                                            >
                                                {isSelected ? (
                                                    <Check className="h-4 w-4 stroke-[3]" />
                                                ) : (
                                                    <Square className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>

                                        {/* Price Badge */}
                                        {product.price && (
                                            <div className="absolute bottom-2.5 right-2.5 rounded-full bg-background/90 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-foreground shadow-sm">
                                                ₱{Number(product.price).toLocaleString()}
                                            </div>
                                        )}

                                        {/* Top Right: Hamburger Dotted Menu */}
                                        <div
                                            className="absolute top-2.5 right-2.5 z-20"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                        }}
                                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/90 backdrop-blur-md transition-all hover:bg-black/70 hover:text-white"
                                                        aria-label="Product options"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </button>
                                                </DropdownMenuTrigger>

                                                <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 shadow-lg border-border">
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleOpenProductPreview(product);
                                                        }}
                                                        className="gap-2 text-xs font-medium cursor-pointer"
                                                    >
                                                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                                        View Details & Image
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            router.visit(product.edit_url || `/products/${product.id}/edit`);
                                                        }}
                                                        className="gap-2 text-xs font-medium cursor-pointer"
                                                    >
                                                        <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                                                        Edit Product
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            router.visit(`/generator?product_name=${encodeURIComponent(product.name)}`);
                                                        }}
                                                        className="gap-2 text-xs font-medium cursor-pointer"
                                                    >
                                                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                                                        Generate Visuals
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator className="my-1 border-border/60" />

                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setProductToDelete(product);
                                                        }}
                                                        className="gap-2 text-xs font-medium text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Delete Product
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <CardContent className="flex flex-1 flex-col justify-between p-4 space-y-2">
                                        <div>
                                            <h2 className="text-base font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors truncate">
                                                {product.name}
                                            </h2>
                                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                Added {product.created_at}
                                            </p>

                                            {product.description && (
                                                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                                                    {product.description}
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* LIST VIEW */
                    <div className="space-y-2">
                        {products.map((product: any) => {
                            const isSelected = selectedProductIds.has(Number(product.id));

                            return (
                                <div
                                    key={product.id}
                                    onClick={() => handleOpenProductPreview(product)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            handleOpenProductPreview(product);
                                        }
                                    }}
                                    className={`group flex items-center gap-4 rounded-2xl border bg-card p-3 shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md hover:border-primary/40 ${
                                        isSelected
                                            ? 'border-primary ring-2 ring-primary/40'
                                            : 'border-border'
                                    }`}
                                >
                                    {/* Select */}
                                    <button
                                        type="button"
                                        onClick={(e) => toggleSelect(Number(product.id), e)}
                                        aria-label={isSelected ? 'Deselect' : 'Select'}
                                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all ${
                                            isSelected
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                        }`}
                                    >
                                        {isSelected ? (
                                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                                        ) : (
                                            <div className="h-3 w-3 rounded border border-muted-foreground/40" />
                                        )}
                                    </button>

                                    {/* Thumbnail */}
                                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                                        {product.image_url ? (
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                                <ImageIcon className="h-5 w-5" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                            {product.name}
                                        </p>
                                        {product.description && (
                                            <p className="truncate text-xs text-muted-foreground mt-0.5">
                                                {product.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Price */}
                                    {product.price && (
                                        <span className="shrink-0 text-xs font-bold text-foreground hidden sm:block">
                                            ₱{Number(product.price).toLocaleString()}
                                        </span>
                                    )}

                                    {/* Date */}
                                    <span className="shrink-0 text-xs text-muted-foreground hidden md:block">
                                        {product.created_at}
                                    </span>

                                    {/* Actions */}
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none"
                                                    aria-label="Product options"
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 shadow-lg border-border">
                                                <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenProductPreview(product); }} className="gap-2 text-xs font-medium cursor-pointer">
                                                    <Eye className="h-3.5 w-3.5 text-muted-foreground" /> View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.visit(product.edit_url || `/products/${product.id}/edit`); }} className="gap-2 text-xs font-medium cursor-pointer">
                                                    <Edit3 className="h-3.5 w-3.5 text-muted-foreground" /> Edit Product
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.visit(`/generator?product_name=${encodeURIComponent(product.name)}`); }} className="gap-2 text-xs font-medium cursor-pointer">
                                                    <Sparkles className="h-3.5 w-3.5 text-primary" /> Generate Visuals
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="my-1 border-border/60" />
                                                <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); setProductToDelete(product); }} className="gap-2 text-xs font-medium text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                                                    <Trash2 className="h-3.5 w-3.5" /> Delete Product
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* =============================================================
                FLOATING BULK ACTIONS BAR
            ============================================================= */}

            {selectedProductIds.size > 0 && (
                <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4 animate-in fade-in slide-in-from-bottom-6 duration-200">
                    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/95 px-5 py-3 shadow-2xl backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10">
                        <div className="flex items-center gap-2 pr-2 border-r border-border">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                                {selectedProductIds.size}
                            </span>
                            <span className="text-xs font-semibold text-foreground hidden sm:inline">
                                selected
                            </span>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleBulkDownload}
                            className="gap-1.5 text-xs font-semibold shadow-none"
                        >
                            <Download className="h-3.5 w-3.5 text-primary" />
                            Download ({selectedProductIds.size})
                        </Button>

                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setIsBulkDeleteModalOpen(true)}
                            className="gap-1.5 text-xs font-semibold shadow-none"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete ({selectedProductIds.size})
                        </Button>

                        <button
                            type="button"
                            onClick={clearSelection}
                            className="text-xs font-medium text-muted-foreground hover:text-foreground pl-1"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}

            {/* =============================================================
                BULK DELETE CONFIRMATION MODAL
            ============================================================= */}

            <Dialog open={isBulkDeleteModalOpen} onOpenChange={setIsBulkDeleteModalOpen}>
                <DialogContent className="rounded-3xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">
                            Delete {selectedProductIds.size} Products?
                        </DialogTitle>
                        <DialogDescription className="text-xs leading-relaxed">
                            Are you sure you want to delete these {selectedProductIds.size} selected products? This action will permanently remove them and their image files from your catalog.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="mt-6 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsBulkDeleteModalOpen(false)}
                            disabled={isBulkDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleConfirmBulkDelete}
                            disabled={isBulkDeleting}
                            className="gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            {isBulkDeleting ? 'Deleting...' : `Delete ${selectedProductIds.size} Products`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =============================================================
                IMMERSIVE FULL SCREEN IMAGE VIEWER WITH IN-MODAL DETAILS
            ============================================================= */}

            {previewProduct && (
                <div
                    className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/95 backdrop-blur-2xl text-white select-none scroll-smooth animate-in fade-in duration-200"
                >
                    {/* Top Floating Control Bar (Sticky) */}
                    <div
                        className="sticky top-0 z-50 flex w-full items-center justify-between bg-gradient-to-b from-black/95 via-black/85 to-transparent px-5 py-3.5 sm:px-8 border-b border-white/10 backdrop-blur-md"
                    >
                        <div className="flex items-center gap-3">
                            <h2 className="max-w-[200px] sm:max-w-md truncate text-sm sm:text-base font-semibold text-white">
                                {previewProduct.name}
                            </h2>
                            {previewProduct.price && (
                                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-extrabold text-emerald-400">
                                    ₱{Number(previewProduct.price).toLocaleString()}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Zoom Toggle */}
                            <button
                                type="button"
                                onClick={() => setIsZoomed(!isZoomed)}
                                className="hidden sm:flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white px-3 py-1.5 text-xs font-medium backdrop-blur-md transition-all cursor-pointer"
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
                                            className="flex h-9 items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white px-3 text-xs font-semibold transition-all backdrop-blur-md cursor-pointer"
                                            title="Download Image"
                                        >
                                            <Download className="h-4 w-4" />
                                            Download
                                            <ChevronDown className="h-3 w-3 opacity-70" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 shadow-xl border-white/20 bg-black/90 text-white backdrop-blur-xl">
                                        <DropdownMenuItem
                                            onClick={() => downloadVisualAsFormat(previewProduct.image_url, previewProduct.name, 'png')}
                                            className="gap-2 text-xs font-medium cursor-pointer text-white hover:bg-white/20 focus:bg-white/20 focus:text-white"
                                        >
                                            <Download className="h-3.5 w-3.5 text-primary" />
                                            PNG (High Quality)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => downloadVisualAsFormat(previewProduct.image_url, previewProduct.name, 'jpeg')}
                                            className="gap-2 text-xs font-medium cursor-pointer text-white hover:bg-white/20 focus:bg-white/20 focus:text-white"
                                        >
                                            <Download className="h-3.5 w-3.5 text-blue-400" />
                                            JPEG (Web-Optimized)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => downloadVisualAsFormat(previewProduct.image_url, previewProduct.name, 'svg')}
                                            className="gap-2 text-xs font-medium cursor-pointer text-white hover:bg-white/20 focus:bg-white/20 focus:text-white"
                                        >
                                            <Download className="h-3.5 w-3.5 text-emerald-400" />
                                            SVG (Vector Embed)
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    setPreviewProduct(null);
                                    setIsZoomed(false);
                                }}
                                className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 hover:bg-white/30 text-white transition-all backdrop-blur-md cursor-pointer"
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
                            className="fixed left-3 sm:left-6 top-1/2 -translate-y-1/2 z-50 flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-full bg-black/60 text-white/85 backdrop-blur-md border border-white/20 hover:bg-black/90 hover:text-white hover:border-white/40 hover:scale-110 active:scale-95 transition-all duration-200 shadow-2xl cursor-pointer"
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
                            className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-50 flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-full bg-black/60 text-white/85 backdrop-blur-md border border-white/20 hover:bg-black/90 hover:text-white hover:border-white/40 hover:scale-110 active:scale-95 transition-all duration-200 shadow-2xl cursor-pointer"
                            title="Next product (→)"
                            aria-label="Next product"
                        >
                            <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7" />
                        </button>
                    )}

                    {/* Section 1: Main Full View Image Canvas */}
                    <div
                        className="group/canvas relative flex min-h-[calc(100vh-4.5rem)] w-full flex-col items-center justify-center p-4 sm:p-8"
                    >
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <div className="h-[450px] w-[450px] rounded-full bg-gradient-to-tr from-primary/20 via-blue-500/10 to-transparent blur-3xl opacity-40" />
                        </div>

                        {previewProduct.image_url ? (
                            <img
                                src={previewProduct.image_url}
                                alt={previewProduct.name}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsZoomed(!isZoomed);
                                }}
                                className={`block max-h-[75vh] max-w-[88vw] object-contain rounded-2xl drop-shadow-2xl transition-transform duration-300 ease-out select-none cursor-pointer z-20 ${
                                    isZoomed
                                        ? 'scale-[1.7] cursor-zoom-out'
                                        : 'scale-100 cursor-zoom-in hover:brightness-105'
                                }`}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-white/50 z-20">
                                <ImageIcon className="h-16 w-16" />
                                <p className="mt-2 text-sm">No visual image uploaded for this product</p>
                            </div>
                        )}

                        {/* Floating Scroll Down Indicator */}
                        <button
                            type="button"
                            onClick={() => {
                                const el = document.getElementById('product-modal-details');
                                if (el) {
                                    el.scrollIntoView({ behavior: 'smooth' });
                                }
                            }}
                            className="group/scroll absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 backdrop-blur-xl border border-white/20 text-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.6)] transition-all duration-300 hover:scale-115 hover:border-primary/60 hover:text-white hover:bg-black/90 hover:shadow-[0_0_20px_rgba(var(--primary),0.5)] active:scale-95 cursor-pointer animate-bounce"
                            title="Scroll down for details"
                            aria-label="Scroll down for details"
                        >
                            <ChevronDown className="h-5 w-5 transition-transform duration-300 group-hover/scroll:translate-y-0.5 group-hover/scroll:text-primary" />
                        </button>
                    </div>

                    {/* Section 2: Recreated, Classy Details & Functions Section */}
                    <div
                        id="product-modal-details"
                        className="relative z-30 w-full bg-slate-950/98 backdrop-blur-3xl px-4 pb-16 pt-8 sm:px-8 border-t border-white/20"
                    >
                        <div className="mx-auto max-w-3xl space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/15 pb-4">
                                <div>
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/25 border border-primary/50 text-primary font-extrabold text-xs shadow-xs tracking-wider uppercase">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Product Catalog Details
                                    </div>
                                    <h3 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
                                        {previewProduct.name}
                                    </h3>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        asChild
                                        size="sm"
                                        className="h-9 px-4 gap-2 text-xs font-bold shadow-lg shadow-primary/30 hover:scale-105 transition-all bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                                    >
                                        <Link
                                            href={`/generator?product_name=${encodeURIComponent(previewProduct.name)}&price=${encodeURIComponent(previewProduct.price || '')}`}
                                        >
                                            <Sparkles className="h-4 w-4" />
                                            Generate AI Visuals
                                        </Link>
                                    </Button>

                                    <Button
                                        asChild
                                        variant="outline"
                                        size="sm"
                                        className="h-9 px-4 gap-1.5 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all cursor-pointer"
                                    >
                                        <Link href={previewProduct.edit_url || `/products/${previewProduct.id}/edit`}>
                                            <Edit3 className="h-3.5 w-3.5" />
                                            Edit Product
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            {previewProduct.description && (
                                <div className="group rounded-2xl border border-white/20 bg-slate-900/90 p-5 backdrop-blur-2xl shadow-lg transition-all duration-300 hover:border-white/30">
                                    <div className="inline-block px-2.5 py-0.5 rounded bg-white/15 text-[11px] font-extrabold uppercase tracking-wider text-white">
                                        Description
                                    </div>
                                    <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-white/95 font-medium">
                                        {previewProduct.description}
                                    </p>
                                </div>
                            )}

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="group rounded-2xl border border-white/20 bg-slate-900/90 p-4 sm:p-5 backdrop-blur-2xl shadow-md transition-all hover:border-white/30 hover:-translate-y-0.5">
                                    <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-white/70">
                                        <Tag className="h-3.5 w-3.5 text-primary" />
                                        Retail Price
                                    </div>
                                    <p className="mt-2 text-lg font-extrabold text-emerald-400">
                                        {previewProduct.price ? `₱${Number(previewProduct.price).toLocaleString()}` : 'Price not set'}
                                    </p>
                                </div>

                                <div className="group rounded-2xl border border-white/20 bg-slate-900/90 p-4 sm:p-5 backdrop-blur-2xl shadow-md transition-all hover:border-white/30 hover:-translate-y-0.5">
                                    <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-white/70">
                                        <ImageIcon className="h-3.5 w-3.5 text-primary" />
                                        Category / Type
                                    </div>
                                    <p className="mt-2 truncate text-base font-bold text-white">
                                        {previewProduct.category || 'Standard Product'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/15">
                                <div className="flex flex-wrap items-center gap-2">
                                    {previewProduct.image_url && (
                                        <>
                                            <span className="text-xs font-bold text-white/80 mr-1">Download:</span>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => downloadVisualAsFormat(previewProduct.image_url, previewProduct.name, 'png')}
                                                className="gap-1.5 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all shadow-none cursor-pointer"
                                            >
                                                <Download className="h-3.5 w-3.5 text-primary" />
                                                PNG
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => downloadVisualAsFormat(previewProduct.image_url, previewProduct.name, 'jpeg')}
                                                className="gap-1.5 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all shadow-none cursor-pointer"
                                            >
                                                <Download className="h-3.5 w-3.5 text-blue-400" />
                                                JPEG
                                            </Button>
                                        </>
                                    )}
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setPreviewProduct(null);
                                        setIsZoomed(false);
                                    }}
                                    className="h-8 px-4 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white transition-all cursor-pointer"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <Dialog
                open={!!productToDelete}
                onOpenChange={(open) => {
                    if (!open && !isDeleting) {
                        setProductToDelete(null);
                    }
                }}
            >
                <DialogContent className="rounded-2xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">
                            Delete Product?
                        </DialogTitle>
                        <DialogDescription className="text-xs leading-relaxed">
                            Are you sure you want to delete{' '}
                            <span className="font-semibold text-foreground">
                                "{productToDelete?.name}"
                            </span>
                            ? This will permanently remove the product and its image from your catalog.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="mt-6 gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setProductToDelete(null)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            className="gap-2"
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
