import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    ChevronDown,
    Download,
    Eye,
    Heart,
    ImageIcon,
    Layers,
    Loader2,
    MoreVertical,
    Plus,
    Search,
    SlidersHorizontal,
    Sparkles,
    Tag,
    Trash2,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
} from '@/components/ui/card';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function DesignsPage({
    designs = [],
    events = [],
    products = [],
    campaigns = [],
    filters = {},
    pagination = {},
}: any) {
    const designList = Array.isArray(designs)
        ? designs
        : (designs.data ?? []);

    const currentPage =
        pagination.current_page ?? 1;

    const lastPage =
        pagination.last_page ?? 1;

    /*
    |--------------------------------------------------------------------------
    | FAVORITES STATE
    |--------------------------------------------------------------------------
    */

    const [favoriteStates, setFavoriteStates] = useState<Record<number, boolean>>({});

    const isDesignFavorite = (design: any) => {
        if (favoriteStates[design.id] !== undefined) {
            return favoriteStates[design.id];
        }
        return Boolean(design.is_favorite);
    };

    const toggleFavorite = async (designId: number) => {
        const current = isDesignFavorite(
            designList.find((d: any) => d.id === designId) || { id: designId },
        );
        const nextVal = !current;

        setFavoriteStates((prev) => ({
            ...prev,
            [designId]: nextVal,
        }));

        try {
            const res = await fetch(`/designs/${designId}/favorite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN':
                        document.querySelector<HTMLMetaElement>(
                            'meta[name="csrf-token"]',
                        )?.content || '',
                },
            });

            if (!res.ok) {
                throw new Error('Failed to update favorite');
            }

            const data = await res.json();
            setFavoriteStates((prev) => ({
                ...prev,
                [designId]: data.is_favorite,
            }));
            toast.success(
                data.message ||
                    (data.is_favorite
                        ? 'Added to favorites'
                        : 'Removed from favorites'),
            );
        } catch {
            // Rollback
            setFavoriteStates((prev) => ({
                ...prev,
                [designId]: current,
            }));
            toast.error('Unable to update favorite status.');
        }
    };

    /*
    |--------------------------------------------------------------------------
    | PREVIEW MODAL STATE
    |--------------------------------------------------------------------------
    */

    const [previewDesign, setPreviewDesign] = useState<any>(null);
    const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

    const openPreview = (design: any) => {
        setPreviewDesign(design);
        setIsDetailsExpanded(false);
    };

    /*
    |--------------------------------------------------------------------------
    | DELETE STATE
    |--------------------------------------------------------------------------
    */

    const [designToDelete, setDesignToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const confirmDeleteDesign = () => {
        if (!designToDelete) return;
        setIsDeleting(true);

        router.delete(`/designs/${designToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                const deletedId = designToDelete.id;
                setDesignToDelete(null);
                if (previewDesign?.id === deletedId) {
                    setPreviewDesign(null);
                }
                toast.success('Design deleted successfully.');
            },
            onError: () => {
                toast.error('Failed to delete design.');
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    /*
    |--------------------------------------------------------------------------
    | DOWNLOAD HANDLER
    |--------------------------------------------------------------------------
    */

    const handleDownload = (design: any) => {
        if (!design.image_url) {
            toast.info('No image file available to download.');
            return;
        }

        const link = document.createElement('a');
        link.href = design.download_url || design.image_url;
        link.download = `${design.product_name || 'design'}-${design.id}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Downloading ${design.product_name || 'design visual'}!`);
    };

    /*
    |--------------------------------------------------------------------------
    | FILTERS
    |--------------------------------------------------------------------------
    */

    const updateFilters = (next: Record<string, any>) => {
        const merged = {
            ...filters,
            ...next,
            page: 1,
        };

        const cleaned: Record<string, any> = {};

        Object.entries(merged).forEach(([key, value]) => {
            if (
                value !== '' &&
                value !== null &&
                value !== undefined &&
                value !== 'all'
            ) {
                cleaned[key] = value;
            }
        });

        router.get('/designs', cleaned, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        router.get(
            '/designs',
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const hasFilters = Boolean(
        filters.search ||
            filters.product_id ||
            filters.campaign_id ||
            filters.event_id ||
            filters.favorites,
    );

    const buildPageUrl = (page: number) => {
        const queryParams = new URLSearchParams();

        if (filters.search) queryParams.set('search', filters.search);
        if (filters.product_id) queryParams.set('product_id', filters.product_id);
        if (filters.campaign_id) queryParams.set('campaign_id', filters.campaign_id);
        if (filters.event_id) queryParams.set('event_id', filters.event_id);
        if (filters.sort) queryParams.set('sort', filters.sort);
        if (filters.favorites) queryParams.set('favorites', '1');

        queryParams.set('page', String(page));

        return `/designs?${queryParams.toString()}`;
    };

    return (
        <>
            <Head title="My Designs" />

            <div className="min-h-screen bg-background text-foreground">
                <div className="space-y-6 p-4 md:p-6 lg:p-8">

                    {/* =====================================================
                        HEADER
                    ====================================================== */}

                    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <ImageIcon className="h-4 w-4" />
                                </div>

                                <p className="text-sm font-medium text-muted-foreground">
                                    Creative Library
                                </p>
                            </div>

                            <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
                                My Designs
                            </h1>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Browse, preview, and download your AI-generated visuals and campaign creative assets.
                            </p>
                        </div>

                        <Button asChild className="group gap-2 shadow-sm">
                            <Link href="/generator">
                                <Plus className="h-4 w-4" />
                                Create Design
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </Button>
                    </section>

                    {/* =====================================================
                        FILTER TOOLBAR
                    ====================================================== */}

                    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
                        {/* TOP ROW: SEARCH BAR + FAVORITES + SORT + CLEAR */}
                        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                            {/* Search */}
                            <div className="relative flex-1">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={filters.search ?? ''}
                                    onChange={(event) =>
                                        updateFilters({
                                            search: event.target.value,
                                        })
                                    }
                                    placeholder="Search by product, tagline, or visual ideas..."
                                    className="h-10 border-input bg-background pl-9 pr-8 shadow-none focus-visible:ring-primary/30"
                                />
                                {filters.search && (
                                    <button
                                        type="button"
                                        onClick={() => updateFilters({ search: '' })}
                                        className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground/60 transition-colors hover:text-foreground"
                                        aria-label="Clear search"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Favorites Toggle Button */}
                                <Button
                                    type="button"
                                    variant={filters.favorites ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() =>
                                        updateFilters({
                                            favorites: filters.favorites ? '' : '1',
                                        })
                                    }
                                    className={`h-10 gap-1.5 px-3.5 text-xs font-medium transition-all shadow-none ${
                                        filters.favorites
                                            ? 'border-rose-500 bg-rose-500 text-white hover:bg-rose-600 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <Heart
                                        className={`h-3.5 w-3.5 ${
                                            filters.favorites
                                                ? 'fill-white text-white'
                                                : 'text-rose-500'
                                        }`}
                                    />
                                    Favorites
                                </Button>

                                {/* Sort Selector */}
                                <div className="w-36 shrink-0">
                                    <Select
                                        value={filters.sort || 'newest'}
                                        onValueChange={(value) =>
                                            updateFilters({
                                                sort: value,
                                            })
                                        }
                                    >
                                        <SelectTrigger className="h-10 text-xs shadow-none">
                                            <SelectValue placeholder="Sort" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value="newest">
                                                Newest First
                                            </SelectItem>
                                            <SelectItem value="oldest">
                                                Oldest First
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Clear Filters */}
                                {hasFilters && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearFilters}
                                        className="h-10 px-3 text-xs text-muted-foreground hover:text-destructive transition-colors shadow-none"
                                    >
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* BOTTOM ROW: TIGHTLY ALIGNED SELECT MENUS */}
                        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-border/50">
                            <span className="text-xs font-medium text-muted-foreground hidden sm:inline mr-0.5">
                                Filter by:
                            </span>

                            {/* Product */}
                            <div className="w-full sm:w-44">
                                <Select
                                    value={filters.product_id || 'all'}
                                    onValueChange={(value) =>
                                        updateFilters({
                                            product_id:
                                                value === 'all' ? '' : value,
                                        })
                                    }
                                >
                                    <SelectTrigger className="h-9 text-xs shadow-none">
                                        <SelectValue placeholder="All products" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectItem value="all">
                                            All products
                                        </SelectItem>

                                        {products.map((product: any) => (
                                            <SelectItem
                                                key={product.id}
                                                value={String(product.id)}
                                            >
                                                {product.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Campaign */}
                            <div className="w-full sm:w-44">
                                <Select
                                    value={filters.campaign_id || 'all'}
                                    onValueChange={(value) =>
                                        updateFilters({
                                            campaign_id:
                                                value === 'all' ? '' : value,
                                        })
                                    }
                                >
                                    <SelectTrigger className="h-9 text-xs shadow-none">
                                        <SelectValue placeholder="All campaigns" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectItem value="all">
                                            All campaigns
                                        </SelectItem>

                                        {campaigns.map((campaign: any) => (
                                            <SelectItem
                                                key={campaign.id}
                                                value={String(campaign.id)}
                                            >
                                                {campaign.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Event */}
                            <div className="w-full sm:w-44">
                                <Select
                                    value={filters.event_id || 'all'}
                                    onValueChange={(value) =>
                                        updateFilters({
                                            event_id:
                                                value === 'all' ? '' : value,
                                        })
                                    }
                                >
                                    <SelectTrigger className="h-9 text-xs shadow-none">
                                        <SelectValue placeholder="All events" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectItem value="all">
                                            All events
                                        </SelectItem>

                                        {events.map((event: any) => (
                                            <SelectItem
                                                key={event.id}
                                                value={String(event.id)}
                                            >
                                                {event.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="ml-auto text-xs font-medium text-muted-foreground">
                                {designList.length}{' '}
                                {designList.length === 1 ? 'visual' : 'visuals'}
                            </div>
                        </div>
                    </div>

                    {/* =====================================================
                        EMPTY STATE
                    ====================================================== */}

                    {designList.length === 0 ? (
                        <Card className="rounded-2xl border-border bg-card shadow-sm">
                            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                                    <ImageIcon className="h-6 w-6" />
                                </div>

                                <div className="mt-4 max-w-sm space-y-1">
                                    <p className="text-base font-semibold">
                                        {hasFilters
                                            ? 'No matching designs'
                                            : 'No designs created yet'}
                                    </p>

                                    <p className="text-sm text-muted-foreground">
                                        {hasFilters
                                            ? 'Try clearing or changing your filter selections.'
                                            : 'Use the AI Marketing Studio to generate promotional visuals for your products.'}
                                    </p>
                                </div>

                                <Button asChild className="mt-5 shadow-sm">
                                    <Link href="/generator">
                                        <Plus className="mr-1.5 h-4 w-4" />
                                        Create First Design
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* =================================================
                                DESIGN GRID
                            ================================================== */}

                            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {designList.map((design: any) => (
                                    <div
                                        key={design.id}
                                        onClick={() => openPreview(design)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                openPreview(design);
                                            }
                                        }}
                                        className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-primary/40"
                                    >
                                        {/* Image Container */}
                                        <div className="relative h-56 w-full overflow-hidden bg-muted">
                                            {design.image_url ? (
                                                <img
                                                    src={design.image_url}
                                                    alt={design.product_name || 'Marketing design'}
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                                                    <ImageIcon className="h-10 w-10" />
                                                </div>
                                            )}

                                            {/* Subtle image overlay */}
                                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                                            {/* Top Overlay Actions: Heart Favorite */}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    toggleFavorite(design.id);
                                                }}
                                                aria-label={
                                                    isDesignFavorite(design)
                                                        ? 'Remove from favorites'
                                                        : 'Add to favorites'
                                                }
                                                className={`absolute top-2.5 right-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md shadow-sm transition-transform duration-200 hover:scale-110 ${
                                                    isDesignFavorite(design)
                                                        ? 'bg-white/90 text-rose-500 hover:bg-white dark:bg-slate-900/90'
                                                        : 'bg-black/40 text-white/90 hover:bg-black/60 hover:text-rose-400'
                                                }`}
                                            >
                                                <Heart
                                                    className={`h-4 w-4 transition-colors ${
                                                        isDesignFavorite(design)
                                                            ? 'fill-rose-500 text-rose-500'
                                                            : 'text-white'
                                                    }`}
                                                />
                                            </button>
                                        </div>

                                        {/* Card content */}
                                        <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
                                            <div>
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="truncate text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                                                        {design.product_name || 'Untitled design'}
                                                    </p>

                                                    <Badge
                                                        variant={
                                                            design.status === 'completed'
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                        className="shrink-0 text-[10px] capitalize"
                                                    >
                                                        {design.status ?? 'ready'}
                                                    </Badge>
                                                </div>

                                                <p className="mt-1 truncate text-xs text-muted-foreground">
                                                    {design.event_name || design.campaign_name || 'General marketing'}
                                                </p>

                                                {design.tagline && (
                                                    <p className="mt-2 line-clamp-2 text-xs italic text-muted-foreground">
                                                        "{design.tagline}"
                                                    </p>
                                                )}
                                            </div>

                                            {/* Card Footer: Date + Hamburger Menu */}
                                            <div className="flex items-center justify-between border-t border-border/60 pt-3">
                                                <span className="text-xs text-muted-foreground">
                                                    {design.created_at}
                                                </span>

                                                <div
                                                    className="flex items-center gap-1"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openPreview(design);
                                                        }}
                                                        className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors mr-1"
                                                    >
                                                        View
                                                    </button>

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                }}
                                                                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none"
                                                                aria-label="Design options"
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </button>
                                                        </DropdownMenuTrigger>

                                                        <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 shadow-lg border-border">
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    openPreview(design);
                                                                }}
                                                                className="gap-2 text-xs font-medium cursor-pointer"
                                                            >
                                                                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                                                View Details
                                                            </DropdownMenuItem>

                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    handleDownload(design);
                                                                }}
                                                                className="gap-2 text-xs font-medium cursor-pointer"
                                                            >
                                                                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                                                                Download Image
                                                            </DropdownMenuItem>

                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    router.visit(
                                                                        `/generator?product_name=${encodeURIComponent(
                                                                            design.product_name || '',
                                                                        )}`,
                                                                    );
                                                                }}
                                                                className="gap-2 text-xs font-medium cursor-pointer"
                                                            >
                                                                <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                                                                Edit in AI Studio
                                                            </DropdownMenuItem>

                                                            <DropdownMenuSeparator className="my-1 border-border/60" />

                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setDesignToDelete(design);
                                                                }}
                                                                className="gap-2 text-xs font-medium text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                Delete Design
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* =================================================
                                PAGINATION
                            ================================================== */}

                            {lastPage > 1 && (
                                <div className="mt-8 flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-sm">
                                    <Button
                                        variant="outline"
                                        asChild={currentPage > 1}
                                        disabled={currentPage <= 1}
                                        className="shadow-none"
                                    >
                                        {currentPage > 1 ? (
                                            <Link href={buildPageUrl(Math.max(currentPage - 1, 1))}>
                                                Previous
                                            </Link>
                                        ) : (
                                            <span>Previous</span>
                                        )}
                                    </Button>

                                    <p className="text-xs font-medium text-muted-foreground">
                                        Page <span className="text-foreground font-semibold">{currentPage}</span> of{' '}
                                        <span className="text-foreground font-semibold">{lastPage}</span>
                                    </p>

                                    <Button
                                        variant="outline"
                                        asChild={currentPage < lastPage}
                                        disabled={currentPage >= lastPage}
                                        className="shadow-none"
                                    >
                                        {currentPage < lastPage ? (
                                            <Link href={buildPageUrl(Math.min(currentPage + 1, lastPage))}>
                                                Next
                                            </Link>
                                        ) : (
                                            <span>Next</span>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* =============================================================
                POP-UP PREVIEW MODAL WITH FADED ARROW DOWN EXPANDER
            ============================================================= */}

            <Dialog
                open={!!previewDesign}
                onOpenChange={(open) => {
                    if (!open) {
                        setPreviewDesign(null);
                        setIsDetailsExpanded(false);
                    }
                }}
            >
                <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl sm:max-w-2xl border-border bg-card p-5 md:p-6 shadow-2xl">
                    {previewDesign && (
                        <div className="space-y-4">
                            {/* Modal Header */}
                            <DialogHeader className="space-y-1">
                                <div className="flex items-center justify-between gap-3 pr-6">
                                    <div>
                                        <DialogTitle className="text-xl font-semibold text-foreground">
                                            {previewDesign.product_name || 'Design Visual'}
                                        </DialogTitle>
                                        <DialogDescription className="text-xs text-muted-foreground">
                                            {previewDesign.event_name
                                                ? `Event: ${previewDesign.event_name}`
                                                : previewDesign.campaign_name
                                                  ? `Campaign: ${previewDesign.campaign_name}`
                                                  : 'AI Marketing Studio Asset'}
                                        </DialogDescription>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => toggleFavorite(previewDesign.id)}
                                            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
                                                isDesignFavorite(previewDesign)
                                                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-500'
                                                    : 'border-border bg-background text-muted-foreground hover:text-foreground'
                                            }`}
                                            aria-label="Toggle favorite"
                                        >
                                            <Heart
                                                className={`h-4 w-4 ${
                                                    isDesignFavorite(previewDesign)
                                                        ? 'fill-rose-500 text-rose-500'
                                                        : ''
                                                }`}
                                            />
                                        </button>

                                        <Button
                                            size="sm"
                                            onClick={() => handleDownload(previewDesign)}
                                            className="gap-1.5 shadow-sm text-xs h-9"
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                            Download
                                        </Button>
                                    </div>
                                </div>
                            </DialogHeader>

                            {/* Main Image Display */}
                            <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/40 flex items-center justify-center min-h-[300px] max-h-[460px]">
                                {previewDesign.image_url ? (
                                    <img
                                        src={previewDesign.image_url}
                                        alt={previewDesign.product_name || 'Design visual'}
                                        className="h-full w-full object-contain max-h-[460px]"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                        <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                                        <p className="mt-2 text-xs">No visual preview available</p>
                                    </div>
                                )}
                            </div>

                            {/* SLIGHT FADED ARROW DOWN TOGGLE */}
                            <div className="flex justify-center pt-1">
                                <button
                                    type="button"
                                    onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                                    className="group flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-4 py-1.5 text-xs font-medium text-muted-foreground/80 transition-all hover:bg-muted hover:text-foreground hover:border-border shadow-sm"
                                    aria-expanded={isDetailsExpanded}
                                >
                                    <span>
                                        {isDetailsExpanded
                                            ? 'Hide details'
                                            : 'View description & more functions'}
                                    </span>
                                    <ChevronDown
                                        className={`h-4 w-4 transition-transform duration-300 ${
                                            isDetailsExpanded
                                                ? 'rotate-180 text-primary'
                                                : 'text-muted-foreground/60 animate-bounce'
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* EXPANDED DETAILS & FUNCTIONS */}
                            {isDetailsExpanded && (
                                <div className="space-y-4 pt-3 border-t border-border/70 transition-all duration-300 animate-in fade-in-50 slide-in-from-top-2">
                                    {/* Tagline */}
                                    {previewDesign.tagline && (
                                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5">
                                            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                                                Tagline
                                            </p>
                                            <p className="mt-1 text-sm font-medium text-foreground italic">
                                                "{previewDesign.tagline}"
                                            </p>
                                        </div>
                                    )}

                                    {/* Description / Prompt */}
                                    <div className="rounded-xl border border-border bg-muted/20 p-3.5">
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            Prompt & Visual Concept
                                        </p>
                                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                                            {previewDesign.prompt ||
                                                'AI marketing creative designed for high engagement, curated around custom brand style and tone.'}
                                        </p>
                                    </div>

                                    {/* Metadata Grid */}
                                    <div className="grid gap-2.5 sm:grid-cols-3">
                                        <div className="rounded-xl border border-border bg-card p-3">
                                            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                <Tag className="h-3 w-3" />
                                                Product
                                            </div>
                                            <p className="mt-1 truncate text-xs font-semibold text-foreground">
                                                {previewDesign.product_name || 'Standard Offering'}
                                            </p>
                                            {previewDesign.price && (
                                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                    ₱{previewDesign.price}
                                                </p>
                                            )}
                                        </div>

                                        <div className="rounded-xl border border-border bg-card p-3">
                                            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                <Layers className="h-3 w-3" />
                                                Campaign
                                            </div>
                                            <p className="mt-1 truncate text-xs font-semibold text-foreground">
                                                {previewDesign.campaign_name || 'Direct Design'}
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-border bg-card p-3">
                                            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                <CalendarDays className="h-3 w-3" />
                                                Event / Created
                                            </div>
                                            <p className="mt-1 truncate text-xs font-semibold text-foreground">
                                                {previewDesign.event_name || previewDesign.created_at}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Buttons Strip */}
                                    <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-border/50">
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    router.visit(
                                                        `/generator?product_name=${encodeURIComponent(
                                                            previewDesign.product_name || '',
                                                        )}`,
                                                    );
                                                }}
                                                className="gap-1.5 text-xs shadow-none"
                                            >
                                                <Sparkles className="h-3.5 w-3.5 text-primary" />
                                                Edit in AI Studio
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDownload(previewDesign)}
                                                className="gap-1.5 text-xs shadow-none"
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                                Download Visual
                                            </Button>
                                        </div>

                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => setDesignToDelete(previewDesign)}
                                            className="gap-1.5 text-xs shadow-none"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* =============================================================
                DELETE CONFIRMATION MODAL
            ============================================================= */}

            <Dialog
                open={!!designToDelete}
                onOpenChange={(open) => {
                    if (!open && !isDeleting) {
                        setDesignToDelete(null);
                    }
                }}
            >
                <DialogContent className="rounded-2xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg">
                            Delete Design Visual?
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-semibold text-foreground">
                                "{designToDelete?.product_name || 'this design'}"
                            </span>
                            ? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="mt-6 gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDesignToDelete(null)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={confirmDeleteDesign}
                            disabled={isDeleting}
                            className="gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            {isDeleting ? 'Deleting...' : 'Delete Design'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

DesignsPage.layout = {
    breadcrumbs: [
        {
            title: 'My Designs',
            href: '/designs',
        },
    ],
};