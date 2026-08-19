import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    Calendar,
    CalendarDays,
    Check,
    CheckSquare,
    ChevronDown,
    Download,
    Eye,
    Filter,
    Heart,
    ImageIcon,
    LayoutGrid,
    Layers,
    List,
    MoreVertical,
    Plus,
    Search,
    Sparkles,
    Square,
    Tag,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { downloadVisualAsFormat } from '@/lib/download';
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
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectSeparator,
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
    | MULTI-SELECT STATE & HANDLERS
    |--------------------------------------------------------------------------
    */

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const isAllSelected =
        designList.length > 0 && selectedIds.length === designList.length;

    const toggleSelectDesign = (id: number, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id],
        );
    };

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(designList.map((d: any) => d.id));
        }
    };

    const handleBulkDownload = () => {
        const selectedDesigns = designList.filter((d: any) => selectedIds.includes(d.id));

        if (selectedDesigns.length === 0) {
            toast.info('No designs selected.');
            return;
        }

        toast.info(`Starting download of ${selectedDesigns.length} visual${selectedDesigns.length > 1 ? 's' : ''}...`);

        selectedDesigns.forEach((design: any, index: number) => {
            if (!design.image_url) return;

            setTimeout(() => {
                const link = document.createElement('a');
                link.href = design.download_url || design.image_url;
                link.download = `${design.product_name || 'design'}-${design.id}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }, index * 250);
        });
    };

    const confirmBulkDelete = () => {
        if (selectedIds.length === 0) return;
        setIsBulkDeleting(true);

        router.post('/designs/bulk-delete', { ids: selectedIds }, {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedIds([]);
                setShowBulkDeleteModal(false);
                toast.success('Selected designs deleted successfully.');
            },
            onError: () => {
                toast.error('Failed to delete selected designs.');
            },
            onFinish: () => {
                setIsBulkDeleting(false);
            },
        });
    };

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
            setFavoriteStates((prev) => ({
                ...prev,
                [designId]: current,
            }));
            toast.error('Unable to update favorite status.');
        }
    };

    /*
    |--------------------------------------------------------------------------
    | FULL-SCREEN IMAGE PREVIEW STATE & ESCAPE KEY LISTENER
    |--------------------------------------------------------------------------
    */

    const [previewDesign, setPreviewDesign] = useState<any>(null);
    const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

    const openPreview = (design: any) => {
        setPreviewDesign(design);
        setIsDetailsExpanded(false);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && previewDesign) {
                setPreviewDesign(null);
                setIsDetailsExpanded(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [previewDesign]);

    /*
    |--------------------------------------------------------------------------
    | SINGLE DELETE STATE
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
                setSelectedIds((prev) => prev.filter((id) => id !== deletedId));
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
    | DOWNLOAD HANDLER (PNG, JPEG, SVG)
    |--------------------------------------------------------------------------
    */

    const handleDownload = (design: any, format: 'png' | 'jpeg' | 'svg' = 'png') => {
        if (!design.image_url && !design.download_url) {
            toast.info('No image file available to download.');
            return;
        }

        downloadVisualAsFormat(
            design.download_url || design.image_url,
            `${design.product_name || 'design'}-${design.id}`,
            format,
        );
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

    const handleCategoryChange = (val: string) => {
        if (val === 'all' || !val) {
            updateFilters({
                category: '',
                product_id: '',
                campaign_id: '',
                event_id: '',
            });
        } else {
            updateFilters({
                category: val,
                product_id: '',
                campaign_id: '',
                event_id: '',
            });
        }
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

    const currentCategoryValue =
        filters.category ||
        (filters.product_id ? `product:${filters.product_id}` :
        (filters.campaign_id ? `campaign:${filters.campaign_id}` :
        (filters.event_id ? `event:${filters.event_id}` : 'all')));

    const hasFilters = Boolean(
        filters.search ||
            filters.category ||
            filters.product_id ||
            filters.campaign_id ||
            filters.event_id ||
            (filters.period && filters.period !== 'all') ||
            filters.favorites,
    );

    const buildPageUrl = (page: number) => {
        const queryParams = new URLSearchParams();

        if (filters.search) queryParams.set('search', filters.search);
        if (filters.category) queryParams.set('category', filters.category);
        if (filters.product_id) queryParams.set('product_id', filters.product_id);
        if (filters.campaign_id) queryParams.set('campaign_id', filters.campaign_id);
        if (filters.event_id) queryParams.set('event_id', filters.event_id);
        if (filters.period && filters.period !== 'all') queryParams.set('period', filters.period);
        if (filters.sort) queryParams.set('sort', filters.sort);
        if (filters.favorites) queryParams.set('favorites', '1');

        queryParams.set('page', String(page));

        return `/designs?${queryParams.toString()}`;
    };

    return (
        <>
            <Head title="My Designs" />

            <div className="min-h-screen bg-background text-foreground pb-24">
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
                                Browse, preview in full view, and multi-select to download or delete your marketing visuals.
                            </p>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <Button asChild className="group gap-2 shadow-sm">
                                <Link href="/generator">
                                    <Plus className="h-4 w-4" />
                                    Create Design
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </Button>
                        </div>
                    </section>

                    {/* =====================================================
                        FILTER TOOLBAR (WITH CATEGORIZED DROPDOWN & SELECT ALL)
                    ====================================================== */}

                    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
                        {/* TOP ROW: SEARCH BAR + TIME PERIOD + FAVORITES + SORT + CLEAR */}
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

                            <div className="flex flex-wrap items-center gap-2">
                                {/* Time Period Filter (Days / Week / Month) */}
                                <div className="w-36 shrink-0">
                                    <Select
                                        value={filters.period || 'all'}
                                        onValueChange={(value) =>
                                            updateFilters({
                                                period: value === 'all' ? '' : value,
                                            })
                                        }
                                    >
                                        <SelectTrigger className="h-10 text-xs shadow-none gap-1.5">
                                            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <SelectValue placeholder="All Time" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value="all">All Time</SelectItem>
                                            <SelectItem value="today">Today</SelectItem>
                                            <SelectItem value="week">This Week (7d)</SelectItem>
                                            <SelectItem value="month">This Month</SelectItem>
                                            <SelectItem value="30days">Last 30 Days</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

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

                        {/* BOTTOM ROW: CATEGORIZED DROPDOWN + SELECT ALL RIGHT BESIDE FILTERS */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-border/50">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <span className="text-xs font-medium text-muted-foreground hidden sm:inline mr-0.5">
                                    Source:
                                </span>

                                {/* Categorized Combined Dropdown: Products, Campaigns, and Events */}
                                <div className="w-full sm:w-64">
                                    <Select
                                        value={currentCategoryValue}
                                        onValueChange={handleCategoryChange}
                                    >
                                        <SelectTrigger className="h-9 text-xs shadow-none">
                                            <SelectValue placeholder="All Categories & Sources" />
                                        </SelectTrigger>

                                        <SelectContent className="max-h-72">
                                            <SelectItem value="all">
                                                All Categories (Everything)
                                            </SelectItem>

                                            {products.length > 0 && (
                                                <SelectGroup>
                                                    <SelectLabel className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-primary">
                                                        <Tag className="h-3 w-3" /> Products
                                                    </SelectLabel>
                                                    {products.map((product: any) => (
                                                        <SelectItem
                                                            key={`prod-${product.id}`}
                                                            value={`product:${product.id}`}
                                                        >
                                                            {product.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            )}

                                            {campaigns.length > 0 && (
                                                <>
                                                    <SelectSeparator />
                                                    <SelectGroup>
                                                        <SelectLabel className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-primary">
                                                            <Layers className="h-3 w-3" /> Campaigns
                                                        </SelectLabel>
                                                        {campaigns.map((campaign: any) => (
                                                            <SelectItem
                                                                key={`camp-${campaign.id}`}
                                                                value={`campaign:${campaign.id}`}
                                                            >
                                                                {campaign.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                </>
                                            )}

                                            {events.length > 0 && (
                                                <>
                                                    <SelectSeparator />
                                                    <SelectGroup>
                                                        <SelectLabel className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-primary">
                                                            <CalendarDays className="h-3 w-3" /> Events
                                                        </SelectLabel>
                                                        {events.map((event: any) => (
                                                            <SelectItem
                                                                key={`evt-${event.id}`}
                                                                value={`event:${event.id}`}
                                                            >
                                                                {event.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* SELECT ALL BUTTON BESIDE FILTERS */}
                                {designList.length > 0 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={toggleSelectAll}
                                        className="h-9 gap-1.5 shadow-none text-xs font-medium"
                                    >
                                        {isAllSelected ? (
                                            <>
                                                <CheckSquare className="h-3.5 w-3.5 text-primary" />
                                                Deselect All
                                            </>
                                        ) : (
                                            <>
                                                <Square className="h-3.5 w-3.5 text-muted-foreground" />
                                                Select All ({designList.length})
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="text-xs font-medium text-muted-foreground">
                                    {designList.length}{' '}
                                    {designList.length === 1 ? 'visual' : 'visuals'}
                                </div>

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
                                DESIGN GRID / LIST VIEW
                            ================================================== */}

                            {viewMode === 'grid' ? (
                            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {designList.map((design: any) => {
                                    const isSelected = selectedIds.includes(design.id);

                                    return (
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
                                            className={`
                                                group
                                                relative
                                                flex
                                                flex-col
                                                justify-between
                                                overflow-hidden
                                                rounded-2xl
                                                border
                                                bg-card
                                                shadow-sm
                                                transition-all
                                                duration-300
                                                hover:-translate-y-1
                                                hover:shadow-md
                                                cursor-pointer
                                                text-left
                                                focus:outline-none
                                                ${
                                                    isSelected
                                                        ? 'border-primary ring-2 ring-primary/40'
                                                        : 'border-border hover:border-primary/40'
                                                }
                                            `}
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

                                                {/* Image Overlay */}
                                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                                                {/* TOP LEFT: SELECT CHECKBOX */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => toggleSelectDesign(design.id, e)}
                                                    aria-label={isSelected ? 'Deselect design' : 'Select design'}
                                                    className={`
                                                        absolute
                                                        top-2.5
                                                        left-2.5
                                                        z-20
                                                        flex
                                                        h-8
                                                        w-8
                                                        items-center
                                                        justify-center
                                                        rounded-full
                                                        backdrop-blur-md
                                                        transition-all
                                                        duration-200
                                                        ${
                                                            isSelected
                                                                ? 'bg-primary text-primary-foreground shadow-md scale-105'
                                                                : 'bg-black/40 text-white/70 hover:bg-black/70 hover:text-white opacity-0 group-hover:opacity-100'
                                                        }
                                                        ${selectedIds.length > 0 ? 'opacity-100' : ''}
                                                    `}
                                                >
                                                    {isSelected ? (
                                                        <Check className="h-4 w-4 stroke-[3]" />
                                                    ) : (
                                                        <div className="h-3.5 w-3.5 rounded-full border-2 border-white/80" />
                                                    )}
                                                </button>

                                                {/* TOP RIGHT: HEART FAVORITE */}
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
                                                    className={`absolute top-2.5 right-2.5 z-20 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md shadow-sm transition-transform duration-200 hover:scale-110 ${
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

                                            {/* Card Content */}
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

                                                 {/* Card Footer */}
                                                <div className="flex items-center justify-between border-t border-border/60 pt-3">
                                                    <span className="text-xs text-muted-foreground">
                                                        {design.created_at}
                                                    </span>

                                                    <div
                                                        className="flex items-center gap-1"
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
                                                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none"
                                                                    aria-label="Design options"
                                                                >
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </button>
                                                            </DropdownMenuTrigger>

                                                            <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5 shadow-lg border-border">
                                                                <DropdownMenuItem
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        openPreview(design);
                                                                    }}
                                                                    className="gap-2 text-xs font-medium cursor-pointer"
                                                                >
                                                                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                                                    View Full Screen
                                                                </DropdownMenuItem>

                                                                <DropdownMenuSeparator className="my-1 border-border/60" />

                                                                <DropdownMenuItem
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        handleDownload(design, 'png');
                                                                    }}
                                                                    className="gap-2 text-xs font-medium cursor-pointer"
                                                                >
                                                                    <Download className="h-3.5 w-3.5 text-primary" />
                                                                    Download as PNG
                                                                </DropdownMenuItem>

                                                                <DropdownMenuItem
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        handleDownload(design, 'jpeg');
                                                                    }}
                                                                    className="gap-2 text-xs font-medium cursor-pointer"
                                                                >
                                                                    <Download className="h-3.5 w-3.5 text-blue-500" />
                                                                    Download as JPEG
                                                                </DropdownMenuItem>

                                                                <DropdownMenuItem
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        handleDownload(design, 'svg');
                                                                    }}
                                                                    className="gap-2 text-xs font-medium cursor-pointer"
                                                                >
                                                                    <Download className="h-3.5 w-3.5 text-emerald-500" />
                                                                    Download as SVG
                                                                </DropdownMenuItem>

                                                                <DropdownMenuSeparator className="my-1 border-border/60" />

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
                                    );
                                })}
                            </div>
                            ) : (
                            /* LIST VIEW */
                            <div className="space-y-2">
                                {designList.map((design: any) => {
                                    const isSelected = selectedIds.includes(design.id);

                                    return (
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
                                            className={`group flex items-center gap-4 rounded-2xl border bg-card p-3 shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md hover:border-primary/40 ${
                                                isSelected
                                                    ? 'border-primary ring-2 ring-primary/40'
                                                    : 'border-border'
                                            }`}
                                        >
                                            {/* Select */}
                                            <button
                                                type="button"
                                                onClick={(e) => toggleSelectDesign(design.id, e)}
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
                                                {design.image_url ? (
                                                    <img
                                                        src={design.image_url}
                                                        alt={design.product_name || 'Design'}
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
                                                    {design.product_name || 'Untitled design'}
                                                </p>
                                                <p className="truncate text-xs text-muted-foreground mt-0.5">
                                                    {design.event_name || design.campaign_name || 'General marketing'}
                                                </p>
                                            </div>

                                            {/* Status */}
                                            <Badge
                                                variant={design.status === 'completed' ? 'default' : 'secondary'}
                                                className="shrink-0 text-[10px] capitalize hidden sm:inline-flex"
                                            >
                                                {design.status ?? 'ready'}
                                            </Badge>

                                            {/* Date */}
                                            <span className="shrink-0 text-xs text-muted-foreground hidden md:block">
                                                {design.created_at}
                                            </span>

                                            {/* Favorite */}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    toggleFavorite(design.id);
                                                }}
                                                className="shrink-0"
                                                aria-label="Toggle favorite"
                                            >
                                                <Heart
                                                    className={`h-4 w-4 transition-colors ${
                                                        isDesignFavorite(design)
                                                            ? 'fill-rose-500 text-rose-500'
                                                            : 'text-muted-foreground hover:text-rose-400'
                                                    }`}
                                                />
                                            </button>

                                            {/* Actions */}
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none"
                                                            aria-label="Design options"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5 shadow-lg border-border">
                                                        <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); openPreview(design); }} className="gap-2 text-xs font-medium cursor-pointer">
                                                            <Eye className="h-3.5 w-3.5 text-muted-foreground" /> View Full Screen
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="my-1 border-border/60" />
                                                        <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDownload(design, 'png'); }} className="gap-2 text-xs font-medium cursor-pointer">
                                                            <Download className="h-3.5 w-3.5 text-primary" /> Download as PNG
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDownload(design, 'jpeg'); }} className="gap-2 text-xs font-medium cursor-pointer">
                                                            <Download className="h-3.5 w-3.5 text-blue-500" /> Download as JPEG
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDownload(design, 'svg'); }} className="gap-2 text-xs font-medium cursor-pointer">
                                                            <Download className="h-3.5 w-3.5 text-emerald-500" /> Download as SVG
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="my-1 border-border/60" />
                                                        <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.visit(`/generator?product_name=${encodeURIComponent(design.product_name || '')}`); }} className="gap-2 text-xs font-medium cursor-pointer">
                                                            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" /> Edit in AI Studio
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="my-1 border-border/60" />
                                                        <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDesignToDelete(design); }} className="gap-2 text-xs font-medium text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                                                            <Trash2 className="h-3.5 w-3.5" /> Delete Design
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            )}

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
                FLOATING MULTI-SELECT ACTION BAR
            ============================================================= */}

            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-5 duration-300">
                    <div className="card-elevated flex items-center gap-3 rounded-2xl border border-border/80 bg-card/95 px-4 py-2.5 shadow-2xl backdrop-blur-xl">
                        <div className="flex items-center gap-2 border-r border-border/80 pr-3">
                            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground shadow-sm">
                                {selectedIds.length}
                            </span>
                            <span className="text-xs font-medium text-foreground">
                                Selected
                            </span>
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={toggleSelectAll}
                            className="h-8 text-xs font-medium"
                        >
                            {isAllSelected ? 'Deselect all' : 'Select all'}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleBulkDownload}
                            className="h-8 gap-1.5 text-xs font-medium shadow-none"
                        >
                            <Download className="h-3.5 w-3.5 text-primary" />
                            Download ({selectedIds.length})
                        </Button>

                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setShowBulkDeleteModal(true)}
                            className="h-8 gap-1.5 text-xs font-medium"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete ({selectedIds.length})
                        </Button>

                        <button
                            type="button"
                            onClick={() => setSelectedIds([])}
                            className="ml-1 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label="Clear selection"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* =============================================================
                IMMERSIVE FULL SCREEN IMAGE VIEWER (NO MODAL BOX)
            ============================================================= */}

            {previewDesign && (
                <div
                    className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/95 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-hidden"
                    onClick={() => {
                        setPreviewDesign(null);
                        setIsDetailsExpanded(false);
                    }}
                >
                    {/* Top Floating Control Bar */}
                    <div
                        className="relative z-50 flex w-full items-center justify-between bg-gradient-to-b from-black/90 via-black/50 to-transparent px-5 py-4 sm:px-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3">
                            <h2 className="max-w-[240px] sm:max-w-md truncate text-sm sm:text-base font-semibold text-white">
                                {previewDesign.product_name || 'Design Visual'}
                            </h2>

                            {previewDesign.campaign_name && (
                                <Badge variant="outline" className="border-white/20 text-white/90 text-[10px] hidden sm:inline-flex bg-white/5">
                                    {previewDesign.campaign_name}
                                </Badge>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Favorite Button */}
                            <button
                                type="button"
                                onClick={() => toggleFavorite(previewDesign.id)}
                                className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all ${
                                    isDesignFavorite(previewDesign)
                                        ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                                        : 'bg-white/10 hover:bg-white/20 text-white'
                                }`}
                                title="Toggle Favorite"
                            >
                                <Heart
                                    className={`h-4 w-4 ${
                                        isDesignFavorite(previewDesign)
                                            ? 'fill-rose-400 text-rose-400'
                                            : ''
                                    }`}
                                />
                            </button>

                            {/* Download Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="flex h-9 items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white px-3 text-xs font-semibold transition-all backdrop-blur-md"
                                        title="Download Visual"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download
                                        <ChevronDown className="h-3 w-3 opacity-70" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 shadow-xl border-white/20 bg-black/90 text-white backdrop-blur-xl">
                                    <DropdownMenuItem
                                        onClick={() => handleDownload(previewDesign, 'png')}
                                        className="gap-2 text-xs font-medium cursor-pointer text-white hover:bg-white/20 focus:bg-white/20 focus:text-white"
                                    >
                                        <Download className="h-3.5 w-3.5 text-primary" />
                                        PNG (High Quality)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => handleDownload(previewDesign, 'jpeg')}
                                        className="gap-2 text-xs font-medium cursor-pointer text-white hover:bg-white/20 focus:bg-white/20 focus:text-white"
                                    >
                                        <Download className="h-3.5 w-3.5 text-blue-400" />
                                        JPEG (Web-Optimized)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => handleDownload(previewDesign, 'svg')}
                                        className="gap-2 text-xs font-medium cursor-pointer text-white hover:bg-white/20 focus:bg-white/20 focus:text-white"
                                    >
                                        <Download className="h-3.5 w-3.5 text-emerald-400" />
                                        SVG (Vector Embed)
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Close Full Screen Button */}
                            <button
                                type="button"
                                onClick={() => {
                                    setPreviewDesign(null);
                                    setIsDetailsExpanded(false);
                                }}
                                className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 hover:bg-white/30 text-white transition-all backdrop-blur-md"
                                title="Close (Esc)"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Main Full View Image Canvas */}
                    <div
                        className="relative flex h-full w-full flex-1 items-center justify-center p-4 sm:p-8 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {previewDesign.image_url ? (
                            <img
                                src={previewDesign.image_url}
                                alt={previewDesign.product_name || 'Design visual'}
                                className={`max-h-[82vh] max-w-[92vw] object-contain drop-shadow-2xl transition-all duration-300 ${
                                    isDetailsExpanded ? 'scale-90 -translate-y-8' : 'scale-100'
                                }`}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-white/50">
                                <ImageIcon className="h-16 w-16" />
                                <p className="mt-2 text-sm">No visual available</p>
                            </div>
                        )}
                    </div>

                    {/* Bottom Fade-out Section with Toggle & Expandable Details */}
                    <div
                        className="relative z-50 flex w-full flex-col items-center justify-end bg-gradient-to-t from-black/95 via-black/75 to-transparent pt-12 pb-5 px-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Fade-Out Toggle Button */}
                        <button
                            type="button"
                            onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                            className="group flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-5 py-2 text-xs font-medium text-white/90 backdrop-blur-xl shadow-2xl transition-all hover:bg-black/80 hover:border-white/40 hover:text-white active:scale-95"
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
                                        : 'text-white/70 animate-bounce'
                                }`}
                            />
                        </button>

                        {/* Slide-up Details Panel */}
                        {isDetailsExpanded && (
                            <div className="mt-4 w-full max-w-2xl max-h-[36vh] overflow-y-auto space-y-4 rounded-2xl border border-white/15 bg-black/80 p-5 backdrop-blur-2xl shadow-2xl text-white animate-in fade-in slide-in-from-bottom-4 duration-300">
                                {/* Tagline */}
                                {previewDesign.tagline && (
                                    <div className="rounded-xl border border-primary/30 bg-primary/10 p-3.5">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                                            Tagline
                                        </p>
                                        <p className="mt-1 text-sm font-medium italic text-white/90">
                                            "{previewDesign.tagline}"
                                        </p>
                                    </div>
                                )}

                                {/* Prompt & Visual Concept */}
                                <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                                        Prompt & Visual Concept
                                    </p>
                                    <p className="mt-1.5 text-xs leading-relaxed text-white/80">
                                        {previewDesign.prompt ||
                                            'AI marketing creative designed for high engagement, curated around custom brand style and tone.'}
                                    </p>
                                </div>

                                {/* Metadata Grid */}
                                <div className="grid gap-2.5 sm:grid-cols-3">
                                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/60">
                                            <Tag className="h-3 w-3" />
                                            Product
                                        </div>
                                        <p className="mt-1 truncate text-xs font-semibold text-white">
                                            {previewDesign.product_name || 'Standard Offering'}
                                        </p>
                                        {previewDesign.price && (
                                            <p className="mt-0.5 text-[11px] text-white/60">
                                                ₱{previewDesign.price}
                                            </p>
                                        )}
                                    </div>

                                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/60">
                                            <Layers className="h-3 w-3" />
                                            Campaign
                                        </div>
                                        <p className="mt-1 truncate text-xs font-semibold text-white">
                                            {previewDesign.campaign_name || 'Direct Design'}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/60">
                                            <CalendarDays className="h-3 w-3" />
                                            Created
                                        </div>
                                        <p className="mt-1 truncate text-xs font-semibold text-white">
                                            {previewDesign.event_name || previewDesign.created_at}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-white/10">
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
                                            className="gap-1.5 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 shadow-none"
                                        >
                                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                                            Edit in AI Studio
                                        </Button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-1.5 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 shadow-none font-semibold"
                                                >
                                                    <Download className="h-3.5 w-3.5" />
                                                    Download Visual
                                                    <ChevronDown className="h-3 w-3 opacity-70" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="w-48 rounded-xl p-1.5 shadow-xl border-white/20 bg-black/90 text-white backdrop-blur-xl">
                                                <DropdownMenuItem
                                                    onClick={() => handleDownload(previewDesign, 'png')}
                                                    className="gap-2 text-xs font-medium cursor-pointer text-white hover:bg-white/20 focus:bg-white/20 focus:text-white"
                                                >
                                                    <Download className="h-3.5 w-3.5 text-primary" />
                                                    PNG (High Quality)
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDownload(previewDesign, 'jpeg')}
                                                    className="gap-2 text-xs font-medium cursor-pointer text-white hover:bg-white/20 focus:bg-white/20 focus:text-white"
                                                >
                                                    <Download className="h-3.5 w-3.5 text-blue-400" />
                                                    JPEG (Web-Optimized)
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDownload(previewDesign, 'svg')}
                                                    className="gap-2 text-xs font-medium cursor-pointer text-white hover:bg-white/20 focus:bg-white/20 focus:text-white"
                                                >
                                                    <Download className="h-3.5 w-3.5 text-emerald-400" />
                                                    SVG (Vector Embed)
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
                </div>
            )}

            {/* =============================================================
                BULK DELETE CONFIRMATION MODAL
            ============================================================= */}

            <Dialog
                open={showBulkDeleteModal}
                onOpenChange={(open) => {
                    if (!open && !isBulkDeleting) {
                        setShowBulkDeleteModal(false);
                    }
                }}
            >
                <DialogContent className="rounded-2xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg">
                            Delete {selectedIds.length} Selected Designs?
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-semibold text-foreground">
                                {selectedIds.length} design visual{selectedIds.length > 1 ? 's' : ''}
                            </span>
                            ? This action will remove the files from your storage and cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="mt-6 gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowBulkDeleteModal(false)}
                            disabled={isBulkDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={confirmBulkDelete}
                            disabled={isBulkDeleting}
                            className="gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            {isBulkDeleting ? 'Deleting...' : `Delete ${selectedIds.length} Designs`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =============================================================
                SINGLE DELETE CONFIRMATION MODAL
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
