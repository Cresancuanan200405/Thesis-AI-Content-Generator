import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    Calendar,
    CalendarDays,
    Check,
    CheckSquare,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Download,
    FolderPlus,
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
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    const [isZoomed, setIsZoomed] = useState(false);

    const currentPreviewIndex = previewDesign
        ? designList.findIndex((d: any) => d.id === previewDesign.id)
        : -1;
    const hasPrevDesign = currentPreviewIndex > 0;
    const hasNextDesign =
        currentPreviewIndex !== -1 && currentPreviewIndex < designList.length - 1;

    const goToPrevDesign = (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        if (hasPrevDesign) {
            setPreviewDesign(designList[currentPreviewIndex - 1]);
            setIsZoomed(false);
        }
    };

    const goToNextDesign = (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        if (hasNextDesign) {
            setPreviewDesign(designList[currentPreviewIndex + 1]);
            setIsZoomed(false);
        }
    };

    const openPreview = (design: any) => {
        setPreviewDesign(design);
        setIsZoomed(false);
    };

    useEffect(() => {
        if (previewDesign) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [previewDesign]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!previewDesign) return;

            if (e.key === 'Escape') {
                setPreviewDesign(null);
                setIsZoomed(false);
            } else if (e.key === 'ArrowLeft') {
                const idx = designList.findIndex((d: any) => d.id === previewDesign.id);
                if (idx > 0) {
                    setPreviewDesign(designList[idx - 1]);
                    setIsZoomed(false);
                }
            } else if (e.key === 'ArrowRight') {
                const idx = designList.findIndex((d: any) => d.id === previewDesign.id);
                if (idx !== -1 && idx < designList.length - 1) {
                    setPreviewDesign(designList[idx + 1]);
                    setIsZoomed(false);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [previewDesign, designList]);

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
    | ATTACH TO CAMPAIGN STATE & HANDLER
    |--------------------------------------------------------------------------
    */

    const [designToAttachCampaign, setDesignToAttachCampaign] = useState<any>(null);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
    const [isAttachingCampaign, setIsAttachingCampaign] = useState(false);

    const confirmAttachCampaign = () => {
        if (!designToAttachCampaign || !selectedCampaignId) return;
        setIsAttachingCampaign(true);

        router.post(
            `/designs/${designToAttachCampaign.id}/attach-campaign`,
            { campaign_id: selectedCampaignId },
            {
                preserveScroll: true,
                onSuccess: () => {
                    const linkedCampName = campaigns.find((c: any) => String(c.id) === String(selectedCampaignId))?.name || 'Campaign';
                    setDesignToAttachCampaign(null);
                    setSelectedCampaignId('');
                    toast.success(`Visual linked to campaign "${linkedCampName}".`);
                },
                onError: () => {
                    toast.error('Failed to attach visual to campaign.');
                },
                onFinish: () => {
                    setIsAttachingCampaign(false);
                },
            },
        );
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

    const selectedCategoryList: string[] = useMemo(() => {
        if (Array.isArray(filters.categories)) return filters.categories;
        if (filters.category) return String(filters.category).split(',').map((s) => s.trim()).filter(Boolean);
        const list: string[] = [];
        if (filters.campaign_id) list.push(`campaign:${filters.campaign_id}`);
        if (filters.event_id) list.push(`event:${filters.event_id}`);
        if (filters.product_id) list.push(`product:${filters.product_id}`);
        return list;
    }, [filters]);

    const toggleCategoryFilter = (val: string) => {
        let next: string[];
        if (selectedCategoryList.includes(val)) {
            next = selectedCategoryList.filter((item) => item !== val);
        } else {
            next = [...selectedCategoryList, val];
        }
        updateFilters({
            category: next.join(','),
            categories: next,
            product_id: '',
            campaign_id: '',
            event_id: '',
        });
    };

    const clearCategoryFilters = () => {
        updateFilters({
            category: '',
            categories: [],
            product_id: '',
            campaign_id: '',
            event_id: '',
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
            selectedCategoryList.length > 0 ||
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
                        PAGE HEADER & CREATE ACTION
                    ====================================================== */}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                                <ImageIcon className="h-4 w-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                                        My Designs
                                    </h1>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Manage, preview, and download your marketing visuals.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            <Button asChild size="sm" className="h-8 gap-1.5 font-semibold text-xs shadow-2xs">
                                <Link href="/generator">
                                    <Plus className="h-3.5 w-3.5" />
                                    Create Design
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* =====================================================
                        STICKY FILTER TOOLBAR (SYSTEM DESIGN COMPATIBLE)
                    ====================================================== */}

                    <div className="sticky top-14 z-30 bg-card/95 backdrop-blur-xl border border-border/80 rounded-2xl p-3 shadow-sm mb-6 transition-all">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
                            {/* Search */}
                            <div className="relative flex-1 min-w-0">
                                <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={filters.search ?? ''}
                                    onChange={(event) =>
                                        updateFilters({
                                            search: event.target.value,
                                        })
                                    }
                                    placeholder="Search by product, tagline, or event..."
                                    className="h-9 border-input bg-background pl-8.5 pr-8 text-xs shadow-none focus-visible:ring-primary/30"
                                />
                                {filters.search && (
                                    <button
                                        type="button"
                                        onClick={() => updateFilters({ search: '' })}
                                        className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground/60 transition-colors hover:text-foreground cursor-pointer"
                                        aria-label="Clear search"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Filter Controls Row */}
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Classification Filter Dropdown */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={`h-9 min-w-36 justify-between text-xs shadow-none gap-2 ${
                                                selectedCategoryList.length > 0
                                                    ? 'border-primary/50 bg-primary/10 text-primary font-semibold'
                                                    : 'text-muted-foreground'
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5 truncate">
                                                <Filter className="h-3.5 w-3.5 shrink-0" />
                                                <span className="truncate">
                                                    {selectedCategoryList.length === 0
                                                        ? 'Filter'
                                                        : selectedCategoryList.length === 1
                                                        ? (selectedCategoryList[0] === 'has_campaign'
                                                            ? 'Campaign Visuals'
                                                            : selectedCategoryList[0] === 'no_campaign'
                                                            ? 'Standalone'
                                                            : selectedCategoryList[0] === 'events_only'
                                                            ? 'Event Visuals'
                                                            : (campaigns.find((c: any) => `campaign:${c.id}` === selectedCategoryList[0])?.name ||
                                                               events.find((e: any) => `event:${e.id}` === selectedCategoryList[0])?.name ||
                                                               products.find((p: any) => `product:${p.id}` === selectedCategoryList[0])?.name ||
                                                               '1 Filter'))
                                                        : `${selectedCategoryList.length} Filters`}
                                                </span>
                                            </div>
                                            {selectedCategoryList.length > 0 ? (
                                                <Badge variant="default" className="h-4.5 px-1.5 text-[10px] font-bold rounded-full shrink-0">
                                                    {selectedCategoryList.length}
                                                </Badge>
                                            ) : (
                                                <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-64 max-h-80 overflow-y-auto p-1.5 rounded-2xl shadow-xl">
                                        <DropdownMenuLabel className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground px-2 py-1">
                                            Quick Filters
                                        </DropdownMenuLabel>
                                        <DropdownMenuCheckboxItem
                                            checked={selectedCategoryList.includes('has_campaign')}
                                            onCheckedChange={() => toggleCategoryFilter('has_campaign')}
                                            className="text-xs py-1.5 cursor-pointer rounded-xl font-medium"
                                        >
                                            <Layers className="h-3.5 w-3.5 mr-1.5 text-primary" />
                                            Campaign Visuals
                                        </DropdownMenuCheckboxItem>
                                        <DropdownMenuCheckboxItem
                                            checked={selectedCategoryList.includes('events_only')}
                                            onCheckedChange={() => toggleCategoryFilter('events_only')}
                                            className="text-xs py-1.5 cursor-pointer rounded-xl font-medium"
                                        >
                                            <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                                            Event & Holiday Visuals
                                        </DropdownMenuCheckboxItem>
                                        <DropdownMenuCheckboxItem
                                            checked={selectedCategoryList.includes('no_campaign')}
                                            onCheckedChange={() => toggleCategoryFilter('no_campaign')}
                                            className="text-xs py-1.5 cursor-pointer rounded-xl font-medium"
                                        >
                                            <Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                                            Standalone Visuals
                                        </DropdownMenuCheckboxItem>

                                        {campaigns.length > 0 && (
                                            <>
                                                <DropdownMenuSeparator className="my-1" />
                                                <DropdownMenuLabel className="text-[10px] font-extrabold uppercase tracking-wider text-primary px-2 py-1 flex items-center gap-1.5">
                                                    <Layers className="h-3 w-3" /> By Campaign
                                                </DropdownMenuLabel>
                                                {campaigns.map((campaign: any) => (
                                                    <DropdownMenuCheckboxItem
                                                        key={`camp-${campaign.id}`}
                                                        checked={selectedCategoryList.includes(`campaign:${campaign.id}`)}
                                                        onCheckedChange={() => toggleCategoryFilter(`campaign:${campaign.id}`)}
                                                        className="text-xs py-1.5 cursor-pointer rounded-xl"
                                                    >
                                                        <span className="truncate">{campaign.name}</span>
                                                    </DropdownMenuCheckboxItem>
                                                ))}
                                            </>
                                        )}

                                        {events.length > 0 && (
                                            <>
                                                <DropdownMenuSeparator className="my-1" />
                                                <DropdownMenuLabel className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-500 px-2 py-1 flex items-center gap-1.5">
                                                    <CalendarDays className="h-3 w-3" /> By Event
                                                </DropdownMenuLabel>
                                                {events.map((event: any) => (
                                                    <DropdownMenuCheckboxItem
                                                        key={`evt-${event.id}`}
                                                        checked={selectedCategoryList.includes(`event:${event.id}`)}
                                                        onCheckedChange={() => toggleCategoryFilter(`event:${event.id}`)}
                                                        className="text-xs py-1.5 cursor-pointer rounded-xl"
                                                    >
                                                        <span className="truncate">{event.name}</span>
                                                    </DropdownMenuCheckboxItem>
                                                ))}
                                            </>
                                        )}

                                        {products.length > 0 && (
                                            <>
                                                <DropdownMenuSeparator className="my-1" />
                                                <DropdownMenuLabel className="text-[10px] font-extrabold uppercase tracking-wider text-blue-500 px-2 py-1 flex items-center gap-1.5">
                                                    <Tag className="h-3 w-3" /> By Product
                                                </DropdownMenuLabel>
                                                {products.map((prod: any) => (
                                                    <DropdownMenuCheckboxItem
                                                        key={`prod-${prod.id}`}
                                                        checked={selectedCategoryList.includes(`product:${prod.id}`)}
                                                        onCheckedChange={() => toggleCategoryFilter(`product:${prod.id}`)}
                                                        className="text-xs py-1.5 cursor-pointer rounded-xl"
                                                    >
                                                        <span className="truncate">{prod.name}</span>
                                                    </DropdownMenuCheckboxItem>
                                                ))}
                                            </>
                                        )}

                                        {selectedCategoryList.length > 0 && (
                                            <>
                                                <DropdownMenuSeparator className="my-1" />
                                                <DropdownMenuItem
                                                    onClick={clearCategoryFilters}
                                                    className="text-xs text-destructive hover:bg-destructive/10 font-semibold justify-center py-1.5 rounded-xl cursor-pointer"
                                                >
                                                    Clear All Filters
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Time Period */}
                                <div className="w-28 shrink-0">
                                    <Select
                                        value={filters.period || 'all'}
                                        onValueChange={(value) =>
                                            updateFilters({
                                                period: value === 'all' ? '' : value,
                                            })
                                        }
                                    >
                                        <SelectTrigger className="h-9 text-xs shadow-none gap-1.5">
                                            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <SelectValue placeholder="All Time" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Time</SelectItem>
                                            <SelectItem value="today">Today</SelectItem>
                                            <SelectItem value="week">This Week</SelectItem>
                                            <SelectItem value="month">This Month</SelectItem>
                                            <SelectItem value="30days">Last 30 Days</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Favorites Toggle */}
                                <Button
                                    type="button"
                                    variant={filters.favorites ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() =>
                                        updateFilters({
                                            favorites: filters.favorites ? '' : '1',
                                        })
                                    }
                                    title={filters.favorites ? 'Show all designs' : 'Show favorites'}
                                    aria-label="Filter by favorites"
                                    className={`h-9 w-9 p-0 flex items-center justify-center rounded-xl transition-all shadow-none cursor-pointer ${
                                        filters.favorites
                                            ? 'border-rose-500 bg-rose-500 text-white hover:bg-rose-600 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                                            : 'text-muted-foreground hover:text-foreground hover:border-rose-300 dark:hover:border-rose-800'
                                    }`}
                                >
                                    <Heart
                                        className={`h-4 w-4 ${
                                            filters.favorites
                                                ? 'fill-white text-white'
                                                : 'text-rose-500'
                                        }`}
                                    />
                                </Button>

                                {/* Sort */}
                                <div className="w-28 shrink-0">
                                    <Select
                                        value={filters.sort || 'newest'}
                                        onValueChange={(value) =>
                                            updateFilters({ sort: value })
                                        }
                                    >
                                        <SelectTrigger className="h-9 text-xs shadow-none">
                                            <SelectValue placeholder="Sort" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="newest">Newest</SelectItem>
                                            <SelectItem value="oldest">Oldest</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Clear All */}
                                {hasFilters && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearFilters}
                                        className="h-9 px-2.5 text-xs text-muted-foreground hover:text-destructive transition-colors shadow-none cursor-pointer"
                                    >
                                        Clear
                                    </Button>
                                )}

                                {/* Visual Count */}
                                <div className="text-xs font-medium text-muted-foreground hidden sm:inline-flex items-center px-1">
                                    {designList.length} {designList.length === 1 ? 'visual' : 'visuals'}
                                </div>

                                {/* View Switcher */}
                                <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 ml-auto">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('grid')}
                                        className={`flex h-7 w-7 items-center justify-center rounded-md transition-all cursor-pointer ${
                                            viewMode === 'grid'
                                                ? 'bg-card text-foreground shadow-xs font-medium'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                        aria-label="Grid view"
                                    >
                                        <LayoutGrid className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('list')}
                                        className={`flex h-7 w-7 items-center justify-center rounded-md transition-all cursor-pointer ${
                                            viewMode === 'list'
                                                ? 'bg-card text-foreground shadow-xs font-medium'
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
                                            onClick={() => {
                                                if (selectedIds.length > 0) {
                                                    toggleSelectDesign(design.id);
                                                } else {
                                                    openPreview(design);
                                                }
                                            }}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    if (selectedIds.length > 0) {
                                                        toggleSelectDesign(design.id);
                                                    } else {
                                                        openPreview(design);
                                                    }
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

                                                {/* SELECTED CHECKMARK BADGE (SHOWN ONLY WHEN SELECTED) */}
                                                {isSelected && (
                                                    <div className="absolute top-2.5 left-2.5 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                                                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                                                    </div>
                                                )}

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
                                                    className={`absolute top-2.5 right-2.5 z-20 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md shadow-sm transition-transform duration-200 hover:scale-110 cursor-pointer ${
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
                                            <div className="flex flex-1 flex-col justify-between p-4 space-y-2">
                                                <div>
                                                    <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                                        {design.product_name || 'Untitled design'}
                                                    </p>

                                                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                        {design.event_name || design.campaign_name || 'General marketing'}
                                                    </p>
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
                                                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none cursor-pointer"
                                                                    aria-label="Design options"
                                                                >
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </button>
                                                            </DropdownMenuTrigger>

                                                            <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5 shadow-lg border-border">
                                                                {/* SELECT / DESELECT OPTION */}
                                                                <DropdownMenuItem
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        toggleSelectDesign(design.id, e);
                                                                    }}
                                                                    className="gap-2 text-xs font-medium cursor-pointer"
                                                                >
                                                                    {isSelected ? (
                                                                        <>
                                                                            <CheckSquare className="h-3.5 w-3.5 text-primary" />
                                                                            Deselect Item
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Square className="h-3.5 w-3.5 text-muted-foreground" />
                                                                            Select Item
                                                                        </>
                                                                    )}
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

                                                                {!design.campaign_id && design.event_id && (
                                                                    <>
                                                                        <DropdownMenuSeparator className="my-1 border-border/60" />
                                                                        <DropdownMenuItem
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                setDesignToAttachCampaign(design);
                                                                            }}
                                                                            className="gap-2 text-xs font-medium cursor-pointer"
                                                                        >
                                                                            <FolderPlus className="h-3.5 w-3.5 text-amber-500" />
                                                                            Add to Campaign
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                )}

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
                                            onClick={() => {
                                                if (selectedIds.length > 0) {
                                                    toggleSelectDesign(design.id);
                                                } else {
                                                    openPreview(design);
                                                }
                                            }}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    if (selectedIds.length > 0) {
                                                        toggleSelectDesign(design.id);
                                                    } else {
                                                        openPreview(design);
                                                    }
                                                }
                                            }}
                                            className={`group flex items-center gap-4 rounded-2xl border bg-card p-3 shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md hover:border-primary/40 ${
                                                isSelected
                                                    ? 'border-primary ring-2 ring-primary/40'
                                                    : 'border-border'
                                            }`}
                                        >
                                            {/* Thumbnail with selection check */}
                                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
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

                                                {isSelected && (
                                                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                                                            <Check className="h-3 w-3 stroke-[3]" />
                                                        </div>
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
                                                className="shrink-0 cursor-pointer"
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
                                                            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none cursor-pointer"
                                                            aria-label="Design options"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5 shadow-lg border-border">
                                                        {/* SELECT / DESELECT OPTION */}
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                toggleSelectDesign(design.id, e);
                                                            }}
                                                            className="gap-2 text-xs font-medium cursor-pointer"
                                                        >
                                                            {isSelected ? (
                                                                <>
                                                                    <CheckSquare className="h-3.5 w-3.5 text-primary" />
                                                                    Deselect Item
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Square className="h-3.5 w-3.5 text-muted-foreground" />
                                                                    Select Item
                                                                </>
                                                            )}
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
                                                        {!design.campaign_id && design.event_id && (
                                                            <>
                                                                <DropdownMenuSeparator className="my-1 border-border/60" />
                                                                <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDesignToAttachCampaign(design); }} className="gap-2 text-xs font-medium cursor-pointer">
                                                                    <FolderPlus className="h-3.5 w-3.5 text-amber-500" /> Add to Campaign
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
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
                IMMERSIVE FULL SCREEN IMAGE VIEWER WITH SCROLL DETAILS & ZOOM
            ============================================================= */}

            {previewDesign && (
                <div
                    className="fixed inset-0 z-[150] overflow-y-auto overflow-x-hidden bg-black/95 backdrop-blur-2xl text-white dark select-none scroll-smooth animate-in fade-in duration-200"
                >
                    {/* Top Floating Control Bar (Sticky) */}
                    <div
                        className="sticky top-0 z-[160] flex w-full items-center justify-between bg-gradient-to-b from-black/95 via-black/85 to-transparent px-5 py-3.5 sm:px-8 border-b border-white/10 backdrop-blur-md"
                    >
                        <div className="flex items-center gap-3">
                            <h2 className="max-w-[200px] sm:max-w-md truncate text-sm sm:text-base font-semibold text-white">
                                {previewDesign.product_name || 'Design Visual'}
                            </h2>

                            {previewDesign.campaign_name && (
                                <Badge variant="outline" className="border-white/20 text-white/90 text-[10px] hidden sm:inline-flex bg-white/5">
                                    {previewDesign.campaign_name}
                                </Badge>
                            )}

                            <span className="text-[11px] font-medium text-white/50 hidden md:inline">
                                {currentPreviewIndex + 1} of {designList.length}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Zoom Status Hint */}
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

                            {/* Favorite Button */}
                            <button
                                type="button"
                                onClick={() => toggleFavorite(previewDesign.id)}
                                className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer ${
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
                                        className="flex h-9 items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white px-3 text-xs font-semibold transition-all backdrop-blur-md cursor-pointer"
                                        title="Download Visual"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download
                                        <ChevronDown className="h-3 w-3 opacity-70" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 shadow-xl border-white/20 bg-black/90 text-white backdrop-blur-xl z-[180]">
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
                    {hasPrevDesign && (
                        <button
                            type="button"
                            onClick={goToPrevDesign}
                            className="fixed left-3 sm:left-6 top-1/2 -translate-y-1/2 z-[170] flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-full bg-black/60 text-white/85 backdrop-blur-md border border-white/20 hover:bg-black/90 hover:text-white hover:border-white/40 hover:scale-110 active:scale-95 transition-all duration-200 shadow-2xl cursor-pointer"
                            title="Previous visual (←)"
                            aria-label="Previous image"
                        >
                            <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" />
                        </button>
                    )}

                    {/* Floating Next Image Button (Right) */}
                    {hasNextDesign && (
                        <button
                            type="button"
                            onClick={goToNextDesign}
                            className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-[170] flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-full bg-black/60 text-white/85 backdrop-blur-md border border-white/20 hover:bg-black/90 hover:text-white hover:border-white/40 hover:scale-110 active:scale-95 transition-all duration-200 shadow-2xl cursor-pointer"
                            title="Next visual (→)"
                            aria-label="Next image"
                        >
                            <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7" />
                        </button>
                    )}

                    {/* Section 1: Full-view Image Canvas (Fits viewport, click to zoom) */}
                    <div
                        className="group/canvas relative flex min-h-[calc(100vh-4.5rem)] w-full flex-col items-center justify-center p-4 sm:p-8"
                    >
                        {/* Ambient Glow */}
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <div className="h-[450px] w-[450px] rounded-full bg-gradient-to-tr from-primary/20 via-blue-500/10 to-transparent blur-3xl opacity-40" />
                        </div>

                        {previewDesign.image_url ? (
                            <img
                                src={previewDesign.image_url}
                                alt={previewDesign.product_name || 'Design visual'}
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
                                <p className="mt-2 text-sm">No visual available</p>
                            </div>
                        )}

                        {/* Floating Scroll Down Indicator (No text, sleek modern glassmorphism & hover glow) */}
                        <button
                            type="button"
                            onClick={() => {
                                const el = document.getElementById('design-modal-details');
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

                    {/* Section 2: Recreated, Classy Details & Functions Section (Scroll down) */}
                    <div
                        id="design-modal-details"
                        className="relative z-30 w-full bg-slate-950/98 backdrop-blur-3xl px-4 pb-16 pt-8 sm:px-8 border-t border-white/20"
                    >
                        <div className="mx-auto max-w-3xl space-y-6">
                            {/* Header / Title block */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/15 pb-4">
                                <div>
                                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary text-primary-foreground font-black text-xs shadow-lg shadow-primary/30 tracking-wider uppercase">
                                        <Sparkles className="h-4 w-4" />
                                        Visual Creative Details
                                    </div>
                                    <h3 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
                                        {previewDesign.product_name || 'Design Visual'}
                                    </h3>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        asChild
                                        size="sm"
                                        className="h-9 px-4 gap-2 text-xs font-bold shadow-lg shadow-primary/30 hover:scale-105 transition-all bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                                    >
                                        <Link
                                            href={`/generator?product_name=${encodeURIComponent(previewDesign.product_name || '')}&price=${encodeURIComponent(previewDesign.price || '')}&campaign_id=${encodeURIComponent(previewDesign.campaign_id || '')}&event_id=${encodeURIComponent(previewDesign.event_id || '')}&tagline=${encodeURIComponent(previewDesign.tagline || '')}&prompt=${encodeURIComponent(previewDesign.prompt || '')}&aspect_ratio=${encodeURIComponent(previewDesign.aspect_ratio || '1:1')}`}
                                        >
                                            <Sparkles className="h-4 w-4" />
                                            Edit in AI Studio
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            {/* Tagline Card (Ultra-visible, high-contrast primary card) */}
                            {previewDesign.tagline && (
                                <div className="group relative overflow-hidden rounded-2xl border-2 border-primary/50 bg-gradient-to-r from-primary/30 via-slate-900/95 to-primary/20 p-5 sm:p-6 backdrop-blur-2xl shadow-xl shadow-primary/10 transition-all hover:border-primary">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary text-primary-foreground font-extrabold text-[11px] uppercase tracking-wider shadow-sm">
                                        <Tag className="h-3.5 w-3.5" />
                                        Catchy Tagline & Hook
                                    </div>
                                    <p className="mt-3 text-lg sm:text-xl font-bold italic text-white leading-snug drop-shadow-md">
                                        "{previewDesign.tagline}"
                                    </p>
                                </div>
                            )}

                            {/* Prompt & Visual Concept (with hover effect) */}
                            <div className="group rounded-2xl border border-white/20 bg-slate-900/90 p-5 backdrop-blur-2xl shadow-lg transition-all duration-300 hover:border-white/30">
                                <div className="inline-block px-2.5 py-0.5 rounded bg-white/15 text-[11px] font-extrabold uppercase tracking-wider text-white">
                                    AI Prompt & Concept
                                </div>
                                <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-white/95 font-medium">
                                    {previewDesign.prompt ||
                                        'AI marketing creative tailored for maximum visual impact, tuned to your brand theme and offering.'}
                                </p>
                            </div>

                            {/* Metadata Grid (3 columns with hover cards) */}
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="group rounded-2xl border border-white/20 bg-slate-900/90 p-4 sm:p-5 backdrop-blur-2xl shadow-md transition-all duration-300 hover:border-white/30 hover:-translate-y-0.5">
                                    <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-white/70">
                                        <Tag className="h-3.5 w-3.5 text-primary" />
                                        Product
                                    </div>
                                    <p className="mt-2 truncate text-base font-bold text-white">
                                        {previewDesign.product_name || 'Standard Offering'}
                                    </p>
                                    {previewDesign.price && (
                                        <p className="mt-0.5 text-xs font-extrabold text-emerald-400">
                                            ₱{previewDesign.price}
                                        </p>
                                    )}
                                </div>

                                <div className="group rounded-2xl border border-white/20 bg-slate-900/90 p-4 sm:p-5 backdrop-blur-2xl shadow-md transition-all duration-300 hover:border-white/30 hover:-translate-y-0.5">
                                    <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-white/70">
                                        <Layers className="h-3.5 w-3.5 text-primary" />
                                        Campaign
                                    </div>
                                    <p className="mt-2 truncate text-base font-bold text-white">
                                        {previewDesign.campaign_name || 'Direct Creative'}
                                    </p>
                                </div>

                                <div className="group rounded-2xl border border-white/20 bg-slate-900/90 p-4 sm:p-5 backdrop-blur-2xl shadow-md transition-all duration-300 hover:border-white/30 hover:-translate-y-0.5">
                                    <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-white/70">
                                        <CalendarDays className="h-3.5 w-3.5 text-primary" />
                                        Created / Event
                                    </div>
                                    <p className="mt-2 truncate text-base font-bold text-white">
                                        {previewDesign.event_name || previewDesign.created_at}
                                    </p>
                                </div>
                            </div>

                            {/* Actions Bar (Download formats + Delete) */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/15">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-bold text-white/80 mr-1">Download as:</span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDownload(previewDesign, 'png')}
                                        className="gap-1.5 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all shadow-none cursor-pointer"
                                    >
                                        <Download className="h-3.5 w-3.5 text-primary" />
                                        PNG
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDownload(previewDesign, 'jpeg')}
                                        className="gap-1.5 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all shadow-none cursor-pointer"
                                    >
                                        <Download className="h-3.5 w-3.5 text-blue-400" />
                                        JPEG
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDownload(previewDesign, 'svg')}
                                        className="gap-1.5 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all shadow-none cursor-pointer"
                                    >
                                        <Download className="h-3.5 w-3.5 text-emerald-400" />
                                        SVG
                                    </Button>
                                </div>

                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setDesignToDelete(previewDesign)}
                                    className="gap-1.5 text-xs shadow-none cursor-pointer hover:scale-105 transition-all"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete Visual
                                </Button>
                            </div>
                        </div>
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

            {/* =============================================================
                ADD TO CAMPAIGN MODAL
            ============================================================= */}

            <Dialog
                open={!!designToAttachCampaign}
                onOpenChange={(open) => {
                    if (!open && !isAttachingCampaign) {
                        setDesignToAttachCampaign(null);
                        setSelectedCampaignId('');
                    }
                }}
            >
                <DialogContent className="rounded-2xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg flex items-center gap-2">
                            <FolderPlus className="h-5 w-5 text-amber-500" />
                            Add to Campaign
                        </DialogTitle>
                        <DialogDescription>
                            Link{' '}
                            <span className="font-semibold text-foreground">
                                "{designToAttachCampaign?.product_name || 'this visual'}"
                            </span>{' '}
                            to one of your campaigns.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-2 space-y-3">
                        {(() => {
                            if (!designToAttachCampaign?.event_id) {
                                return (
                                    <div className="rounded-xl border border-dashed border-border p-4 text-center space-y-1.5">
                                        <p className="text-xs font-medium text-foreground">
                                            No Event Associated
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">
                                            Designs can only be added to a campaign created specifically for the same event or holiday.
                                        </p>
                                    </div>
                                );
                            }

                            const matchingCampaigns = campaigns.filter(
                                (c: any) =>
                                    c.event_id &&
                                    String(c.event_id) === String(designToAttachCampaign.event_id),
                            );

                            if (matchingCampaigns.length === 0) {
                                return (
                                    <div className="rounded-xl border border-dashed border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 p-4 text-center space-y-3">
                                        <p className="text-xs font-medium text-foreground">
                                            No Campaign Found for <span className="font-bold text-amber-600 dark:text-amber-400">{designToAttachCampaign.event_name || 'this event'}</span>
                                        </p>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed max-w-xs mx-auto">
                                            You can only link this visual to a campaign created specifically for this holiday/event.
                                        </p>
                                        <Button asChild size="sm" variant="outline" className="text-xs h-8 gap-1.5 rounded-xl shadow-xs">
                                            <Link href={`/campaigns?create=true&event_id=${designToAttachCampaign.event_id}&product_name=${encodeURIComponent(designToAttachCampaign.product_name || '')}`}>
                                                <Plus className="h-3.5 w-3.5" />
                                                Create Campaign for this Event
                                            </Link>
                                        </Button>
                                    </div>
                                );
                            }

                            return (
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Campaigns for {designToAttachCampaign.event_name}
                                    </Label>
                                    <Select
                                        value={selectedCampaignId}
                                        onValueChange={setSelectedCampaignId}
                                    >
                                        <SelectTrigger className="w-full rounded-xl">
                                            <SelectValue placeholder="Choose matching campaign..." />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60">
                                            <SelectGroup>
                                                <SelectLabel className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                                    Matching Event: {designToAttachCampaign.event_name}
                                                </SelectLabel>
                                                {matchingCampaigns.map((c: any) => (
                                                    <SelectItem key={c.id} value={String(c.id)}>
                                                        <div className="flex items-center gap-2">
                                                            <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                                                            {c.name}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                            );
                        })()}
                    </div>

                    <DialogFooter className="mt-6 gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setDesignToAttachCampaign(null);
                                setSelectedCampaignId('');
                            }}
                            disabled={isAttachingCampaign}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={confirmAttachCampaign}
                            disabled={isAttachingCampaign || !selectedCampaignId}
                            className="gap-2"
                        >
                            <FolderPlus className="h-4 w-4" />
                            {isAttachingCampaign ? 'Linking...' : 'Add to Campaign'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
