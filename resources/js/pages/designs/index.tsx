import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    CalendarDays,
    Check,
    CheckSquare,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Download,
    Eye,
    FolderPlus,
    Heart,
    ImageIcon,
    LayoutGrid,
    Layers,
    List,
    MoreVertical,
    Plus,
    RefreshCw,
    Search,
    Sparkles,
    Square,
    Tag,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { UnifiedImageViewer } from '@/components/image-viewer';
import { AppPagination } from '@/components/ui/app-pagination';
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
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useSidebar } from '@/components/ui/sidebar';
import { downloadVisualAsFormat } from '@/lib/download';

const regenerationStatusPhrases = [
    'Analyzing creative parameters & scene...',
    'Composing lighting, shadows & atmosphere...',
    'Synthesizing fresh visual variation...',
    'Applying commercial typography hierarchy...',
    'Finalizing high-fidelity rendering...',
];

export default function DesignsPage({
    designs = [],
    events = [],
    products = [],
    campaigns = [],
    status_counts = {},
    filters = {},
    pagination = {},
}: any) {
    const { state: sidebarState } = useSidebar();
    const designList = useMemo(
        () => (Array.isArray(designs) ? designs : (designs.data ?? [])),
        [designs],
    );

    const currentPage = pagination.current_page ?? 1;

    const lastPage = pagination.last_page ?? 1;

    /*
    |--------------------------------------------------------------------------
    | DRAFT FINALIZATION & STATUS FILTER
    |--------------------------------------------------------------------------
    */
    const [isFinalizing, setIsFinalizing] = useState(false);

    const handleFinalize = (designId: number) => {
        setIsFinalizing(true);
        router.post(
            `/designs/${designId}/finalize`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Design finalized successfully.');
                    setPreviewDesign((prev: any) =>
                        prev && prev.id === designId
                            ? { ...prev, status: 'final', is_draft: false }
                            : prev,
                    );
                },
                onError: () => {
                    toast.error('Failed to finalize design.');
                },
                onFinish: () => {
                    setIsFinalizing(false);
                },
            },
        );
    };

    const handleStatusFilterChange = (status: 'all' | 'draft' | 'final') => {
        updateFilters({ status: status === 'all' ? '' : status });
    };

    /*
    |--------------------------------------------------------------------------
    | MULTI-SELECT STATE & HANDLERS
    |--------------------------------------------------------------------------
    */

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [designToRegenerate, setDesignToRegenerate] = useState<any | null>(
        null,
    );
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [regeneratingDesign, setRegeneratingDesign] = useState<any | null>(
        null,
    );
    const [generationProgress, setGenerationProgress] = useState(15);
    const [rotatingPhraseIndex, setRotatingPhraseIndex] = useState(0);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('marketpilot_designs_view_mode');

            if (saved === 'grid' || saved === 'list') {
                return saved;
            }
        }

        return 'grid';
    });

    const handleSetViewMode = (mode: 'grid' | 'list') => {
        setViewMode(mode);

        if (typeof window !== 'undefined') {
            localStorage.setItem('marketpilot_designs_view_mode', mode);
        }
    };

    const getEditStudioUrl = (design: any) => {
        if (!design) {
            return '/generator';
        }

        if (design.generator_url) {
            return design.generator_url;
        }

        const meta = design.generation_metadata || {};
        const contentStyle = Array.isArray(design.content_style)
            ? design.content_style.join(',')
            : design.content_style ||
              design.visual_theme ||
              meta.visual_theme ||
              '';
        const brandTone = Array.isArray(design.brand_tone)
            ? design.brand_tone.join(',')
            : design.brand_tone || meta.brand_tone || '';
        const renderStyle =
            design.render_style || meta.render_style || 'Studio Product Still';
        const imageModel =
            meta.model || meta.image_model || design.model || 'gpt-image-2';
        const quality = meta.quality || meta.image_quality || 'medium';
        const aspectRatio = design.aspect_ratio || meta.aspect_ratio || '1:1';
        const includeBusiness =
            meta.include_business_name !== false ? '1' : '0';

        const params = new URLSearchParams();

        if (design.product_name) {
            params.set('product_name', design.product_name);
        }

        if (design.product_id) {
            params.set('product_id', String(design.product_id));
        }

        if (design.price) {
            params.set('price', String(design.price));
        }

        if (design.campaign_id) {
            params.set('campaign_id', String(design.campaign_id));
        }

        if (design.event_id) {
            params.set('event_id', String(design.event_id));
        }

        if (design.tagline) {
            params.set('tagline', design.tagline);
        }

        if (design.prompt) {
            params.set('prompt', design.prompt);
        }

        params.set('aspect_ratio', aspectRatio);

        if (contentStyle) {
            params.set('content_style', contentStyle);
        }

        if (brandTone) {
            params.set('brand_tone', brandTone);
        }

        params.set('render_style', renderStyle);
        params.set('image_model', 'gpt-image-2');
        params.set('image_quality', quality);
        params.set('include_business_name', includeBusiness);

        return `/generator?${params.toString()}`;
    };

    const handleRegenerate = (design: any) => {
        setDesignToRegenerate(null);
        setRegeneratingDesign(design);
        setIsRegenerating(true);
        router.post(
            `/designs/${design.id}/regenerate`,
            {},
            {
                onFinish: () => {
                    setIsRegenerating(false);
                    setRegeneratingDesign(null);
                },
                onError: () => {
                    toast.error(
                        'Unable to regenerate design. Please try again.',
                    );
                },
            },
        );
    };

    useEffect(() => {
        if (!isRegenerating) {
            setGenerationProgress(15);
            setRotatingPhraseIndex(0);

            return;
        }

        const progressInterval = window.setInterval(() => {
            setGenerationProgress((previous) => {
                if (previous < 35) {
                    return previous + 6;
                }

                if (previous < 65) {
                    return previous + 4;
                }

                if (previous < 85) {
                    return previous + 2;
                }

                if (previous < 95) {
                    return previous + 1;
                }

                return previous;
            });
        }, 500);

        const phraseInterval = window.setInterval(() => {
            setRotatingPhraseIndex(
                (previous) => (previous + 1) % regenerationStatusPhrases.length,
            );
        }, 2200);

        return () => {
            window.clearInterval(progressInterval);
            window.clearInterval(phraseInterval);
        };
    }, [isRegenerating]);

    useEffect(() => {
        if (!isRegenerating) {
            return;
        }

        const originalBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = originalBodyOverflow;
        };
    }, [isRegenerating]);

    const isAllSelected =
        designList.length > 0 && selectedIds.length === designList.length;

    const toggleSelectDesign = (id: number, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }

        setSelectedIds((prev) =>
            prev.includes(id)
                ? prev.filter((itemId) => itemId !== id)
                : [...prev, id],
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
        const selectedDesigns = designList.filter((d: any) =>
            selectedIds.includes(d.id),
        );

        if (selectedDesigns.length === 0) {
            toast.info('No designs selected.');

            return;
        }

        toast.info(
            `Starting download of ${selectedDesigns.length} visual${selectedDesigns.length > 1 ? 's' : ''}...`,
        );

        selectedDesigns.forEach((design: any, index: number) => {
            if (!design.image_url) {
                return;
            }

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
        if (selectedIds.length === 0) {
            return;
        }

        setIsBulkDeleting(true);

        router.post(
            '/designs/bulk-delete',
            { ids: selectedIds },
            {
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
            },
        );
    };

    /*
    |--------------------------------------------------------------------------
    | FAVORITES STATE
    |--------------------------------------------------------------------------
    */

    const [favoriteStates, setFavoriteStates] = useState<
        Record<number, boolean>
    >({});

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
    | IMAGE PREVIEW STATE (UNIFIED IMAGE VIEWER)
    |--------------------------------------------------------------------------
    */

    const [previewDesign, setPreviewDesign] = useState<any>(null);

    const currentPreviewIndex = previewDesign
        ? designList.findIndex((d: any) => d.id === previewDesign.id)
        : -1;

    const openPreview = (design: any) => {
        setPreviewDesign(design);
    };

    /*
    |--------------------------------------------------------------------------
    | SINGLE DELETE STATE
    |--------------------------------------------------------------------------
    */

    const [designToDelete, setDesignToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const confirmDeleteDesign = () => {
        if (!designToDelete) {
            return;
        }

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

    const [designToAttachCampaign, setDesignToAttachCampaign] =
        useState<any>(null);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
    const [isAttachingCampaign, setIsAttachingCampaign] = useState(false);

    const confirmAttachCampaign = () => {
        if (!designToAttachCampaign || !selectedCampaignId) {
            return;
        }

        setIsAttachingCampaign(true);

        router.post(
            `/designs/${designToAttachCampaign.id}/attach-campaign`,
            { campaign_id: selectedCampaignId },
            {
                preserveScroll: true,
                onSuccess: () => {
                    const linkedCampName =
                        campaigns.find(
                            (c: any) =>
                                String(c.id) === String(selectedCampaignId),
                        )?.name || 'Campaign';
                    setDesignToAttachCampaign(null);
                    setSelectedCampaignId('');
                    toast.success(
                        `Visual linked to campaign "${linkedCampName}".`,
                    );
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

    const handleDownload = (
        design: any,
        format: 'png' | 'jpeg' | 'svg' = 'png',
    ) => {
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
        if (Array.isArray(filters.categories)) {
            return filters.categories;
        }

        if (filters.category) {
            return String(filters.category)
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
        }

        const list: string[] = [];

        if (filters.campaign_id) {
            list.push(`campaign:${filters.campaign_id}`);
        }

        if (filters.event_id) {
            list.push(`event:${filters.event_id}`);
        }

        if (filters.product_id) {
            list.push(`product:${filters.product_id}`);
        }

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
        filters.favorites ||
        (filters.status && filters.status !== 'all'),
    );

    const buildPageUrl = (page: number) => {
        const queryParams = new URLSearchParams();

        if (filters.search) {
            queryParams.set('search', filters.search);
        }

        if (filters.category) {
            queryParams.set('category', filters.category);
        }

        if (filters.status && filters.status !== 'all') {
            queryParams.set('status', filters.status);
        }

        if (filters.product_id) {
            queryParams.set('product_id', filters.product_id);
        }

        if (filters.campaign_id) {
            queryParams.set('campaign_id', filters.campaign_id);
        }

        if (filters.event_id) {
            queryParams.set('event_id', filters.event_id);
        }

        if (filters.period && filters.period !== 'all') {
            queryParams.set('period', filters.period);
        }

        if (filters.sort) {
            queryParams.set('sort', filters.sort);
        }

        if (filters.favorites) {
            queryParams.set('favorites', '1');
        }

        queryParams.set('page', String(page));

        return `/designs?${queryParams.toString()}`;
    };

    return (
        <>
            <Head title="My Designs" />

            <div className="min-h-screen bg-background pb-24 text-foreground">
                <div className="space-y-6 p-4 md:p-6 lg:p-8">
                    {/* =====================================================
                        PAGE HEADER & CREATE ACTION
                    ====================================================== */}

                    <div
                        className={`flex flex-col gap-3 border-b border-border/60 pb-3 sm:flex-row sm:items-center sm:justify-between ${isRegenerating ? 'hidden' : ''}`}
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <ImageIcon className="h-4 w-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                                        My Designs
                                    </h1>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Manage, preview, and download your marketing
                                    visuals.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            <Button
                                asChild
                                size="sm"
                                className="h-8 gap-1.5 text-xs font-semibold shadow-2xs"
                            >
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

                    <div
                        className={`sticky top-11 z-30 mb-6 rounded-2xl border border-white/25 bg-card/95 p-3 shadow-md backdrop-blur-xl transition-all sm:top-12 dark:border-white/10 dark:bg-card/95 ${isRegenerating ? 'hidden' : ''}`}
                    >
                        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
                            {/* Search */}
                            <div className="relative min-w-0 flex-1">
                                <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={filters.search ?? ''}
                                    onChange={(event) =>
                                        updateFilters({
                                            search: event.target.value,
                                        })
                                    }
                                    placeholder="Search by product, tagline, or event..."
                                    className="h-9 border-input bg-background pr-8 pl-8.5 text-xs shadow-none focus-visible:ring-primary/30"
                                />
                                {filters.search && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            updateFilters({ search: '' })
                                        }
                                        className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-muted-foreground/60 transition-colors hover:text-foreground"
                                        aria-label="Clear search"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Filter Controls Row */}
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Status Filter Dropdown (All / Drafts / Final) */}
                                <div className="w-32 shrink-0 sm:w-36">
                                    <Select
                                        value={
                                            filters.status === 'draft' || filters.status === 'drafts'
                                                ? 'draft'
                                                : filters.status === 'final' || filters.status === 'finals'
                                                  ? 'final'
                                                  : 'all'
                                        }
                                        onValueChange={(val) =>
                                            handleStatusFilterChange(val as 'all' | 'draft' | 'final')
                                        }
                                    >
                                        <SelectTrigger
                                            className={`h-9 w-full gap-1.5 text-xs shadow-none ${
                                                filters.status === 'draft' || filters.status === 'drafts'
                                                    ? 'border-amber-500/50 bg-amber-500/10 font-semibold text-amber-700 dark:text-amber-400'
                                                    : filters.status === 'final' || filters.status === 'finals'
                                                      ? 'border-emerald-500/50 bg-emerald-500/10 font-semibold text-emerald-700 dark:text-emerald-400'
                                                      : ''
                                            }`}
                                        >
                                            <SelectValue placeholder="All Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All ({status_counts?.all ?? designList.length})
                                            </SelectItem>
                                            <SelectItem value="draft">
                                                Drafts ({status_counts?.drafts ?? 0})
                                            </SelectItem>
                                            <SelectItem value="final">
                                                Final ({status_counts?.final ?? 0})
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Time Period */}
                                <div className="w-36 shrink-0 sm:w-40">
                                    <Select
                                        value={filters.period || 'all'}
                                        onValueChange={(value) =>
                                            updateFilters({
                                                period:
                                                    value === 'all'
                                                        ? ''
                                                        : value,
                                            })
                                        }
                                    >
                                        <SelectTrigger
                                            className={`h-9 w-full min-w-0 gap-1.5 text-xs shadow-none ${
                                                filters.period && filters.period !== 'all'
                                                    ? 'border-primary/50 bg-primary/10 font-semibold text-primary'
                                                    : ''
                                            }`}
                                        >
                                            <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                            <SelectValue placeholder="All Time" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Time
                                            </SelectItem>
                                            <SelectItem value="today">
                                                Today
                                            </SelectItem>
                                            <SelectItem value="week">
                                                This Week
                                            </SelectItem>
                                            <SelectItem value="month">
                                                This Month
                                            </SelectItem>
                                            <SelectItem value="30days">
                                                Last 30 Days
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Favorites Toggle */}
                                <Button
                                    type="button"
                                    variant={
                                        filters.favorites
                                            ? 'default'
                                            : 'outline'
                                    }
                                    size="sm"
                                    onClick={() =>
                                        updateFilters({
                                            favorites: filters.favorites
                                                ? ''
                                                : '1',
                                        })
                                    }
                                    title={
                                        filters.favorites
                                            ? 'Show all designs'
                                            : 'Show favorites'
                                    }
                                    aria-label="Filter by favorites"
                                    className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl p-0 shadow-none transition-all ${
                                        filters.favorites
                                            ? 'border-rose-500 bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.3)] hover:bg-rose-600'
                                            : 'text-muted-foreground hover:border-rose-300 hover:text-foreground dark:hover:border-rose-800'
                                    }`}
                                >
                                    <Heart
                                        className={`h-4 w-4 shrink-0 ${
                                            filters.favorites
                                                ? 'fill-white text-white'
                                                : 'text-rose-500'
                                        }`}
                                    />
                                </Button>

                                {/* Sort */}
                                <div className="w-28 shrink-0 sm:w-32">
                                    <Select
                                        value={filters.sort || 'newest'}
                                        onValueChange={(value) =>
                                            updateFilters({ sort: value })
                                        }
                                    >
                                        <SelectTrigger className="h-9 w-full text-xs shadow-none">
                                            <SelectValue placeholder="Sort" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="newest">
                                                Newest
                                            </SelectItem>
                                            <SelectItem value="oldest">
                                                Oldest
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Clear All (Fixed slot so toolbar never shifts when toggling filters) */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    disabled={!hasFilters}
                                    className={`h-9 shrink-0 px-2.5 text-xs transition-opacity ${
                                        hasFilters
                                            ? 'cursor-pointer text-muted-foreground opacity-100 hover:text-destructive'
                                            : 'pointer-events-none opacity-0'
                                    }`}
                                >
                                    Clear
                                </Button>

                                {/* Visual Count */}
                                <div className="hidden items-center px-1 text-xs font-medium text-muted-foreground sm:inline-flex">
                                    {designList.length}{' '}
                                    {designList.length === 1
                                        ? 'visual'
                                        : 'visuals'}
                                </div>

                                {/* VIEW MODE DROPDOWN (ICON-ONLY BUTTON) */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="ml-auto h-8 w-8 rounded-xl p-0 text-muted-foreground shadow-none hover:text-foreground"
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
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                                    {designList.map((design: any) => {
                                        const isSelected = selectedIds.includes(
                                            design.id,
                                        );

                                        return (
                                            <div
                                                key={design.id}
                                                onClick={() => {
                                                    if (
                                                        selectedIds.length > 0
                                                    ) {
                                                        toggleSelectDesign(
                                                            design.id,
                                                        );
                                                    } else {
                                                        openPreview(design);
                                                    }
                                                }}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (
                                                        e.key === 'Enter' ||
                                                        e.key === ' '
                                                    ) {
                                                        if (
                                                            selectedIds.length >
                                                            0
                                                        ) {
                                                            toggleSelectDesign(
                                                                design.id,
                                                            );
                                                        } else {
                                                            openPreview(design);
                                                        }
                                                    }
                                                }}
                                                className={`group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-xl border bg-card text-left shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:ring-2 focus:ring-primary/30 focus:outline-none ${
                                                    isSelected
                                                        ? 'border-primary ring-2 ring-primary/40'
                                                        : 'border-border hover:border-primary/40'
                                                }`}
                                            >
                                                {/* Image Container */}
                                                <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden border-b border-border/50 bg-muted/20 p-1.5">
                                                    {design.image_url ? (
                                                        <img
                                                            src={
                                                                design.image_url
                                                            }
                                                            alt={
                                                                design.product_name ||
                                                                'Marketing design'
                                                            }
                                                            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center bg-muted/30 text-muted-foreground">
                                                            <ImageIcon className="h-7 w-7 opacity-30" />
                                                        </div>
                                                    )}

                                                    {/* SELECTED CHECKMARK BADGE (SHOWN ONLY WHEN SELECTED) */}
                                                    {isSelected && (
                                                        <div className="absolute top-1.5 left-1.5 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                                                            <Check className="h-3 w-3 stroke-[3]" />
                                                        </div>
                                                    )}

                                                    {/* TOP RIGHT: HEART FAVORITE (ONLY ON HOVER) */}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            toggleFavorite(
                                                                design.id,
                                                            );
                                                        }}
                                                        aria-label={
                                                            isDesignFavorite(
                                                                design,
                                                            )
                                                                ? 'Remove from favorites'
                                                                : 'Add to favorites'
                                                        }
                                                        className={`absolute top-1.5 right-1.5 z-20 flex h-6.5 w-6.5 cursor-pointer items-center justify-center rounded-md opacity-0 shadow-xs backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100 hover:scale-110 ${
                                                            isDesignFavorite(
                                                                design,
                                                            )
                                                                ? 'bg-white/90 text-rose-500 hover:bg-white dark:bg-card/90'
                                                                : 'bg-black/40 text-white/90 hover:bg-black/60 hover:text-rose-400'
                                                        }`}
                                                    >
                                                        <Heart
                                                            className={`h-3.5 w-3.5 transition-colors ${
                                                                isDesignFavorite(
                                                                    design,
                                                                )
                                                                    ? 'fill-rose-500 text-rose-500'
                                                                    : 'text-white'
                                                            }`}
                                                        />
                                                    </button>
                                                </div>

                                                {/* Card Content */}
                                                <div className="flex flex-1 flex-col justify-between space-y-1.5 p-2.5">
                                                    <div>
                                                        <p className="truncate text-xs font-bold text-foreground transition-colors group-hover:text-primary">
                                                            {design.product_name ||
                                                                'Untitled design'}
                                                        </p>
                                                    </div>

                                                    {/* Card Footer */}
                                                    <div className="flex items-center justify-between border-t border-border/50 pt-1.5 text-[10px]">
                                                        <span className="truncate text-muted-foreground">
                                                            {design.created_at}
                                                        </span>

                                                        <div
                                                            className="flex shrink-0 items-center gap-1"
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
                                                                        onClick={(
                                                                            e,
                                                                        ) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                        }}
                                                                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none"
                                                                        aria-label="Design options"
                                                                    >
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </button>
                                                                </DropdownMenuTrigger>

                                                                <DropdownMenuContent
                                                                    align="end"
                                                                    className="w-52 rounded-xl border-border p-1.5 shadow-lg"
                                                                >
                                                                    {/* SELECT / DESELECT OPTION */}
                                                                    <DropdownMenuItem
                                                                        onClick={(
                                                                            e,
                                                                        ) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            toggleSelectDesign(
                                                                                design.id,
                                                                                e,
                                                                            );
                                                                        }}
                                                                        className="cursor-pointer gap-2 text-xs font-medium"
                                                                    >
                                                                        {isSelected ? (
                                                                            <>
                                                                                <CheckSquare className="h-3.5 w-3.5 text-primary" />
                                                                                Deselect
                                                                                Item
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Square className="h-3.5 w-3.5 text-muted-foreground" />
                                                                                Select
                                                                                Item
                                                                            </>
                                                                        )}
                                                                    </DropdownMenuItem>

                                                                    <DropdownMenuSeparator className="my-1 border-border/60" />

                                                                    <DropdownMenuItem
                                                                        onClick={(
                                                                            e,
                                                                        ) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            handleDownload(
                                                                                design,
                                                                                'png',
                                                                            );
                                                                        }}
                                                                        className="cursor-pointer gap-2 text-xs font-medium"
                                                                    >
                                                                        <Download className="h-3.5 w-3.5 text-primary" />
                                                                        Download
                                                                        as PNG
                                                                    </DropdownMenuItem>

                                                                    <DropdownMenuItem
                                                                        onClick={(
                                                                            e,
                                                                        ) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            handleDownload(
                                                                                design,
                                                                                'jpeg',
                                                                            );
                                                                        }}
                                                                        className="cursor-pointer gap-2 text-xs font-medium"
                                                                    >
                                                                        <Download className="h-3.5 w-3.5 text-blue-500" />
                                                                        Download
                                                                        as JPEG
                                                                    </DropdownMenuItem>

                                                                    <DropdownMenuItem
                                                                        onClick={(
                                                                            e,
                                                                        ) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            handleDownload(
                                                                                design,
                                                                                'svg',
                                                                            );
                                                                        }}
                                                                        className="cursor-pointer gap-2 text-xs font-medium"
                                                                    >
                                                                        <Download className="h-3.5 w-3.5 text-emerald-500" />
                                                                        Download
                                                                        as SVG
                                                                    </DropdownMenuItem>

                                                                    <DropdownMenuSeparator className="my-1 border-border/60" />

                                                                    {design.status === 'draft' || design.is_draft ? (
                                                                        <>
                                                                            <DropdownMenuItem
                                                                                onClick={(
                                                                                    e,
                                                                                ) => {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    router.visit(
                                                                                        design.generator_url ||
                                                                                            getEditStudioUrl(
                                                                                                design,
                                                                                            ),
                                                                                    );
                                                                                }}
                                                                                className="cursor-pointer gap-2 text-xs font-medium text-amber-600 dark:text-amber-400"
                                                                            >
                                                                                <Sparkles className="h-3.5 w-3.5" />
                                                                                Resume Draft
                                                                            </DropdownMenuItem>

                                                                            <DropdownMenuItem
                                                                                onClick={(
                                                                                    e,
                                                                                ) => {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    handleFinalize(
                                                                                        design.id,
                                                                                    );
                                                                                }}
                                                                                className="cursor-pointer gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                                                                            >
                                                                                <Check className="h-3.5 w-3.5" />
                                                                                Finalize Design
                                                                            </DropdownMenuItem>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <DropdownMenuItem
                                                                                onClick={(
                                                                                    e,
                                                                                ) => {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    setDesignToRegenerate(
                                                                                        design,
                                                                                    );
                                                                                }}
                                                                                className="cursor-pointer gap-2 text-xs font-medium text-primary hover:text-primary"
                                                                            >
                                                                                <RefreshCw className="h-3.5 w-3.5" />
                                                                                Regenerate
                                                                                Design
                                                                            </DropdownMenuItem>

                                                                            <DropdownMenuItem
                                                                                onClick={(
                                                                                    e,
                                                                                ) => {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    router.visit(
                                                                                        getEditStudioUrl(
                                                                                            design,
                                                                                        ),
                                                                                    );
                                                                                }}
                                                                                className="cursor-pointer gap-2 text-xs font-medium"
                                                                            >
                                                                                <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                                                                                Edit in
                                                                                AI
                                                                                Studio
                                                                            </DropdownMenuItem>
                                                                        </>
                                                                    )}

                                                                    {!design.campaign_id &&
                                                                        design.event_id && (
                                                                            <>
                                                                                <DropdownMenuSeparator className="my-1 border-border/60" />
                                                                                <DropdownMenuItem
                                                                                    onClick={(
                                                                                        e,
                                                                                    ) => {
                                                                                        e.preventDefault();
                                                                                        e.stopPropagation();
                                                                                        setDesignToAttachCampaign(
                                                                                            design,
                                                                                        );
                                                                                    }}
                                                                                    className="cursor-pointer gap-2 text-xs font-medium"
                                                                                >
                                                                                    <FolderPlus className="h-3.5 w-3.5 text-amber-500" />
                                                                                    Add
                                                                                    to
                                                                                    Campaign
                                                                                </DropdownMenuItem>
                                                                            </>
                                                                        )}

                                                                    <DropdownMenuSeparator className="my-1 border-border/60" />

                                                                    <DropdownMenuItem
                                                                        onClick={(
                                                                            e,
                                                                        ) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            setDesignToDelete(
                                                                                design,
                                                                            );
                                                                        }}
                                                                        className="cursor-pointer gap-2 text-xs font-medium text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                        Delete
                                                                        Design
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
                                        const isSelected = selectedIds.includes(
                                            design.id,
                                        );

                                        return (
                                            <div
                                                key={design.id}
                                                onClick={() => {
                                                    if (
                                                        selectedIds.length > 0
                                                    ) {
                                                        toggleSelectDesign(
                                                            design.id,
                                                        );
                                                    } else {
                                                        openPreview(design);
                                                    }
                                                }}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (
                                                        e.key === 'Enter' ||
                                                        e.key === ' '
                                                    ) {
                                                        if (
                                                            selectedIds.length >
                                                            0
                                                        ) {
                                                            toggleSelectDesign(
                                                                design.id,
                                                            );
                                                        } else {
                                                            openPreview(design);
                                                        }
                                                    }
                                                }}
                                                className={`group flex cursor-pointer items-center gap-4 rounded-2xl border bg-card p-3 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md ${
                                                    isSelected
                                                        ? 'border-primary ring-2 ring-primary/40'
                                                        : 'border-border'
                                                }`}
                                            >
                                                {/* Thumbnail with selection check */}
                                                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                                                    {design.image_url ? (
                                                        <img
                                                            src={
                                                                design.image_url
                                                            }
                                                            alt={
                                                                design.product_name ||
                                                                'Design'
                                                            }
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                                            <ImageIcon className="h-5 w-5" />
                                                        </div>
                                                    )}

                                                    {isSelected && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                                                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                                                                <Check className="h-3 w-3 stroke-[3]" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                                                            {design.product_name ||
                                                                'Untitled design'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Date */}
                                                <span className="hidden shrink-0 text-xs text-muted-foreground md:block">
                                                    {design.created_at}
                                                </span>

                                                {/* Favorite */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        toggleFavorite(
                                                            design.id,
                                                        );
                                                    }}
                                                    className="shrink-0 cursor-pointer"
                                                    aria-label="Toggle favorite"
                                                >
                                                    <Heart
                                                        className={`h-4 w-4 transition-colors ${
                                                            isDesignFavorite(
                                                                design,
                                                            )
                                                                ? 'fill-rose-500 text-rose-500'
                                                                : 'text-muted-foreground hover:text-rose-400'
                                                        }`}
                                                    />
                                                </button>

                                                {/* Actions */}
                                                <div
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
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                }}
                                                                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none"
                                                                aria-label="Design options"
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent
                                                            align="end"
                                                            className="w-52 rounded-xl border-border p-1.5 shadow-lg"
                                                        >
                                                            {/* SELECT / DESELECT OPTION */}
                                                            <DropdownMenuItem
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    toggleSelectDesign(
                                                                        design.id,
                                                                        e,
                                                                    );
                                                                }}
                                                                className="cursor-pointer gap-2 text-xs font-medium"
                                                            >
                                                                {isSelected ? (
                                                                    <>
                                                                        <CheckSquare className="h-3.5 w-3.5 text-primary" />
                                                                        Deselect
                                                                        Item
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Square className="h-3.5 w-3.5 text-muted-foreground" />
                                                                        Select
                                                                        Item
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>

                                                            <DropdownMenuSeparator className="my-1 border-border/60" />

                                                            <DropdownMenuItem
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    handleDownload(
                                                                        design,
                                                                        'png',
                                                                    );
                                                                }}
                                                                className="cursor-pointer gap-2 text-xs font-medium"
                                                            >
                                                                <Download className="h-3.5 w-3.5 text-primary" />{' '}
                                                                Download as PNG
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    handleDownload(
                                                                        design,
                                                                        'jpeg',
                                                                    );
                                                                }}
                                                                className="cursor-pointer gap-2 text-xs font-medium"
                                                            >
                                                                <Download className="h-3.5 w-3.5 text-blue-500" />{' '}
                                                                Download as JPEG
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    handleDownload(
                                                                        design,
                                                                        'svg',
                                                                    );
                                                                }}
                                                                className="cursor-pointer gap-2 text-xs font-medium"
                                                            >
                                                                <Download className="h-3.5 w-3.5 text-emerald-500" />{' '}
                                                                Download as SVG
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="my-1 border-border/60" />
                                                            {design.status === 'draft' || design.is_draft ? (
                                                                <>
                                                                    <DropdownMenuItem
                                                                        onClick={(
                                                                            e,
                                                                        ) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            router.visit(
                                                                                design.generator_url ||
                                                                                    getEditStudioUrl(
                                                                                        design,
                                                                                    ),
                                                                            );
                                                                        }}
                                                                        className="cursor-pointer gap-2 text-xs font-medium text-amber-600 dark:text-amber-400"
                                                                    >
                                                                        <Sparkles className="h-3.5 w-3.5" />{' '}
                                                                        Resume Draft
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={(
                                                                            e,
                                                                        ) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            handleFinalize(
                                                                                design.id,
                                                                            );
                                                                        }}
                                                                        className="cursor-pointer gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                                                                    >
                                                                        <Check className="h-3.5 w-3.5" />{' '}
                                                                        Finalize Design
                                                                    </DropdownMenuItem>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <DropdownMenuItem
                                                                        onClick={(
                                                                            e,
                                                                        ) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            setDesignToRegenerate(
                                                                                design,
                                                                            );
                                                                        }}
                                                                        className="cursor-pointer gap-2 text-xs font-medium text-primary hover:text-primary"
                                                                    >
                                                                        <RefreshCw className="h-3.5 w-3.5" />{' '}
                                                                        Regenerate
                                                                        Design
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={(
                                                                            e,
                                                                        ) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            router.visit(
                                                                                getEditStudioUrl(
                                                                                    design,
                                                                                ),
                                                                            );
                                                                        }}
                                                                        className="cursor-pointer gap-2 text-xs font-medium"
                                                                    >
                                                                        <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />{' '}
                                                                        Edit in AI
                                                                        Studio
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                            {!design.campaign_id &&
                                                                design.event_id && (
                                                                    <>
                                                                        <DropdownMenuSeparator className="my-1 border-border/60" />
                                                                        <DropdownMenuItem
                                                                            onClick={(
                                                                                e,
                                                                            ) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                setDesignToAttachCampaign(
                                                                                    design,
                                                                                );
                                                                            }}
                                                                            className="cursor-pointer gap-2 text-xs font-medium"
                                                                        >
                                                                            <FolderPlus className="h-3.5 w-3.5 text-amber-500" />{' '}
                                                                            Add
                                                                            to
                                                                            Campaign
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                )}
                                                            <DropdownMenuSeparator className="my-1 border-border/60" />
                                                            <DropdownMenuItem
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setDesignToDelete(
                                                                        design,
                                                                    );
                                                                }}
                                                                className="cursor-pointer gap-2 text-xs font-medium text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />{' '}
                                                                Delete Design
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

                            {!isRegenerating && lastPage > 1 && (
                                <AppPagination
                                    currentPage={currentPage}
                                    lastPage={lastPage}
                                    buildHref={(page) => buildPageUrl(page)}
                                    className="mt-8"
                                />
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* =============================================================
                FLOATING MULTI-SELECT ACTION BAR
            ============================================================= */}

            {selectedIds.length > 0 && !isRegenerating && (
                <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 animate-in duration-300 slide-in-from-bottom-5 fade-in">
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
                UNIFIED IMAGE VIEWER
            ============================================================= */}
            <UnifiedImageViewer
                isOpen={Boolean(previewDesign)}
                onClose={() => setPreviewDesign(null)}
                items={designList}
                currentIndex={currentPreviewIndex}
                onNavigate={(newIndex) => setPreviewDesign(designList[newIndex])}
                context="design"
                onDownload={(design, format) => handleDownload(design, format)}
                onDelete={(design) => setDesignToDelete(design)}
                onFinalize={(design) => handleFinalize(design.id)}
                isFinalizing={isFinalizing}
                onRegenerate={(design) => setDesignToRegenerate(design)}
                isRegenerating={isRegenerating}
                onFavoriteToggle={(design) => toggleFavorite(design.id)}
                isFavorite={(design) => isDesignFavorite(design)}
                getStudioUrl={(design) => getEditStudioUrl(design)}
            />

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
                                {selectedIds.length} design visual
                                {selectedIds.length > 1 ? 's' : ''}
                            </span>
                            ? This action will remove the files from your
                            storage and cannot be undone.
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
                            {isBulkDeleting
                                ? 'Deleting...'
                                : `Delete ${selectedIds.length} Designs`}
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
                                "{designToDelete?.product_name || 'this design'}
                                "
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
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <FolderPlus className="h-5 w-5 text-amber-500" />
                            Add to Campaign
                        </DialogTitle>
                        <DialogDescription>
                            Link{' '}
                            <span className="font-semibold text-foreground">
                                "
                                {designToAttachCampaign?.product_name ||
                                    'this visual'}
                                "
                            </span>{' '}
                            to one of your campaigns.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-2 space-y-3">
                        {(() => {
                            if (!designToAttachCampaign?.event_id) {
                                return (
                                    <div className="space-y-1.5 rounded-xl border border-dashed border-border p-4 text-center">
                                        <p className="text-xs font-medium text-foreground">
                                            No Event Associated
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">
                                            Designs can only be added to a
                                            campaign created specifically for
                                            the same event or holiday.
                                        </p>
                                    </div>
                                );
                            }

                            const matchingCampaigns = campaigns.filter(
                                (c: any) =>
                                    c.event_id &&
                                    String(c.event_id) ===
                                        String(designToAttachCampaign.event_id),
                            );

                            if (matchingCampaigns.length === 0) {
                                return (
                                    <div className="space-y-3 rounded-xl border border-dashed border-amber-500/30 bg-amber-50/50 p-4 text-center dark:bg-amber-950/20">
                                        <p className="text-xs font-medium text-foreground">
                                            No Campaign Found for{' '}
                                            <span className="font-bold text-amber-600 dark:text-amber-400">
                                                {designToAttachCampaign.event_name ||
                                                    'this event'}
                                            </span>
                                        </p>
                                        <p className="mx-auto max-w-xs text-[11px] leading-relaxed text-muted-foreground">
                                            You can only link this visual to a
                                            campaign created specifically for
                                            this holiday/event.
                                        </p>
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                            className="h-8 gap-1.5 rounded-xl text-xs shadow-xs"
                                        >
                                            <Link
                                                href={`/campaigns?create=true&event_id=${designToAttachCampaign.event_id}&product_name=${encodeURIComponent(designToAttachCampaign.product_name || '')}`}
                                            >
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
                                        Campaigns for{' '}
                                        {designToAttachCampaign.event_name}
                                    </Label>
                                    <Select
                                        value={selectedCampaignId}
                                        onValueChange={setSelectedCampaignId}
                                    >
                                        <SelectTrigger className="w-full rounded-xl">
                                            <SelectValue placeholder="Choose matching campaign..." />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60">
                                            <p className="px-2 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                                                Matching Event:{' '}
                                                {
                                                    designToAttachCampaign.event_name
                                                }
                                            </p>
                                            {matchingCampaigns.map((c: any) => (
                                                <SelectItem
                                                    key={c.id}
                                                    value={String(c.id)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                                                        {c.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
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
                            disabled={
                                isAttachingCampaign || !selectedCampaignId
                            }
                            className="gap-2"
                        >
                            <FolderPlus className="h-4 w-4" />
                            {isAttachingCampaign
                                ? 'Linking...'
                                : 'Add to Campaign'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =============================================================
                REGENERATE DESIGN CONFIRMATION MODAL
            ============================================================= */}
            <Dialog
                open={Boolean(designToRegenerate)}
                onOpenChange={(open) => {
                    if (!open) {
                        setDesignToRegenerate(null);
                    }
                }}
            >
                <DialogContent className="rounded-3xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">
                            Regenerate Design?
                        </DialogTitle>
                        <DialogDescription className="text-xs leading-relaxed">
                            This will create a new creative variation of "
                            {designToRegenerate?.product_name || 'this design'}"
                            restoring your exact product, scene prompt, brand
                            styling, pricing, and campaign settings.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="mt-6 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDesignToRegenerate(null)}
                            disabled={isRegenerating}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                if (designToRegenerate) {
                                    handleRegenerate(designToRegenerate);
                                }
                            }}
                            disabled={isRegenerating}
                            className="gap-2"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`}
                            />
                            {isRegenerating
                                ? 'Regenerating...'
                                : 'Yes, Regenerate'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {isRegenerating && regeneratingDesign && (
                <div
                    className={`fixed top-11 right-0 bottom-0 left-0 z-20 flex items-center justify-center overflow-hidden bg-background/80 p-4 backdrop-blur-2xl motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in sm:top-12 sm:p-6 ${sidebarState === 'collapsed' ? 'md:left-[var(--sidebar-width-icon)]' : 'md:left-[var(--sidebar-width)]'}`}
                    role="status"
                    aria-live="polite"
                    aria-label="Regenerating visual creative"
                >
                    <div className="relative flex max-h-full w-full max-w-lg flex-col items-center gap-5 overflow-hidden rounded-3xl border border-border/80 bg-card/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
                        <div className="pointer-events-none absolute -top-16 left-1/2 h-36 w-36 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl motion-reduce:hidden" />
                        <div className="pointer-events-none absolute -bottom-16 left-1/2 h-36 w-36 -translate-x-1/2 rounded-full bg-emerald-500/15 blur-3xl motion-reduce:hidden" />

                        <div className="relative flex flex-col items-center space-y-2 text-center">
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 shadow-2xs dark:text-emerald-400">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-safe:animate-ping motion-reduce:hidden" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                </span>
                                Live Regeneration
                            </div>

                            <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg md:text-xl">
                                Regenerating visual creative
                            </h2>
                            <p className="max-w-sm truncate text-xs font-medium text-muted-foreground sm:text-sm">
                                for{' '}
                                <span className="font-semibold text-foreground/90">
                                    {regeneratingDesign.product_name ||
                                        'your design'}
                                </span>
                            </p>
                        </div>

                        <div className="relative flex w-full items-center justify-center py-2 sm:py-3">
                            <div className="pointer-events-none absolute h-28 w-28 rounded-full bg-primary/20 blur-2xl motion-safe:animate-pulse motion-reduce:hidden" />
                            <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl border border-primary/25 bg-gradient-to-b from-primary/15 via-primary/5 to-muted/40 shadow-xl ring-1 shadow-primary/10 ring-primary/20 backdrop-blur-xl sm:h-32 sm:w-32">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-xs ring-1 ring-primary/25">
                                    <Sparkles className="h-7 w-7 text-primary motion-safe:animate-pulse" />
                                </div>
                            </div>
                        </div>

                        <div className="relative w-full space-y-3">
                            <div className="flex items-center justify-center gap-1.5 text-center">
                                <Sparkles className="h-3.5 w-3.5 text-primary motion-safe:animate-pulse motion-reduce:hidden" />
                                <p className="text-xs font-semibold text-foreground transition-opacity duration-500 sm:text-sm">
                                    {
                                        regenerationStatusPhrases[
                                            rotatingPhraseIndex
                                        ]
                                    }
                                </p>
                            </div>

                            <div className="mx-auto w-full max-w-xs space-y-1 sm:max-w-sm">
                                <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                                    <span>Synthesizing variation</span>
                                    <span className="font-mono font-semibold text-primary">
                                        {generationProgress}%
                                    </span>
                                </div>
                                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/80 p-0.5 ring-1 ring-border/50">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-primary via-indigo-500 to-emerald-500 shadow-xs shadow-primary/30 transition-all duration-500 ease-out"
                                        style={{
                                            width: `${generationProgress}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 pt-0.5 text-xs text-muted-foreground">
                                {regeneratingDesign.campaign_name && (
                                    <span className="font-semibold text-primary">
                                        {regeneratingDesign.campaign_name}
                                    </span>
                                )}
                                {regeneratingDesign.event_name && (
                                    <>
                                        {regeneratingDesign.campaign_name && (
                                            <span className="text-muted-foreground/40">
                                                •
                                            </span>
                                        )}
                                        <span className="font-medium text-muted-foreground">
                                            {regeneratingDesign.event_name}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

DesignsPage.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'My Designs',
            href: '/designs',
        },
    ],
};
