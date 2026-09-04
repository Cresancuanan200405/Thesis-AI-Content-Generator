import { Head, Link, router } from '@inertiajs/react';
import {
    Archive,
    ArchiveRestore,
    ArrowRight,
    CalendarDays,
    CalendarRange,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Download,
    Edit3,
    Eye,
    FolderPlus,
    ImageIcon,
    Layers,
    Loader2,
    MoreVertical,
    Package,
    Plus,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { downloadVisualAsFormat } from '@/lib/download';

const statusLabels: Record<string, string> = {
    draft: 'Draft',
    active: 'Active',
    scheduled: 'Scheduled',
    completed: 'Completed',
    archived: 'Archived',
};

const statusDot: Record<string, string> = {
    draft: 'bg-amber-500',
    active: 'bg-emerald-500',
    scheduled: 'bg-blue-500',
    completed: 'bg-purple-500',
    archived: 'bg-slate-400',
};

const statusGlow: Record<string, string> = {
    draft: 'border-amber-500/30 hover:border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.06)]',
    active: 'border-emerald-500/30 hover:border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.08)]',
    scheduled:
        'border-blue-500/30 hover:border-blue-500/60 shadow-[0_0_20px_rgba(59,130,246,0.08)]',
    completed:
        'border-purple-500/30 hover:border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.08)]',
    archived: 'border-border/60 hover:border-border',
};

export default function CampaignShowPage({
    campaign,
    events = [],
    available_designs = [],
}: any) {
    const designs: any[] = campaign?.designs ?? [];
    const status = campaign?.status ?? 'draft';

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    /* Gallery Modal State */
    const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);

    /* Add Existing Visual State */
    const [isAddExistingOpen, setIsAddExistingOpen] = useState(false);
    const [existingDesignIds, setExistingDesignIds] = useState<number[]>([]);
    const [isAttachingExisting, setIsAttachingExisting] = useState(false);

    const toggleExistingDesign = (id: number) => {
        setExistingDesignIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    };

    const confirmAttachExisting = () => {
        if (existingDesignIds.length === 0) {
            return;
        }

        setIsAttachingExisting(true);

        router.post(
            `/campaigns/${campaign.id}/attach-designs`,
            { design_ids: existingDesignIds },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsAddExistingOpen(false);
                    setExistingDesignIds([]);
                    toast.success(
                        `${existingDesignIds.length} visual(s) added to campaign.`,
                    );
                },
                onError: () => {
                    toast.error('Failed to add visuals to campaign.');
                },
                onFinish: () => {
                    setIsAttachingExisting(false);
                },
            },
        );
    };

    /* Preview Modal State */
    const [previewDesign, setPreviewDesign] = useState<any>(null);
    const [isZoomed, setIsZoomed] = useState(false);
    const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
    const [isScrolledToDetails, setIsScrolledToDetails] = useState(false);

    const openPreview = (design: any) => {
        setPreviewDesign(design);
        setIsZoomed(false);
        setZoomOrigin({ x: 50, y: 50 });
        setIsScrolledToDetails(false);
    };

    const closePreview = (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }

        setPreviewDesign(null);
        setIsZoomed(false);
        setZoomOrigin({ x: 50, y: 50 });
        setIsScrolledToDetails(false);
    };

    const currentPreviewIndex = designs.findIndex(
        (d) => d.id === previewDesign?.id,
    );
    const hasPrevDesign = currentPreviewIndex > 0;
    const hasNextDesign =
        currentPreviewIndex !== -1 && currentPreviewIndex < designs.length - 1;

    const handlePrevDesign = (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }

        if (hasPrevDesign) {
            setPreviewDesign(designs[currentPreviewIndex - 1]);
            setIsZoomed(false);
            setZoomOrigin({ x: 50, y: 50 });
            setIsScrolledToDetails(false);
        }
    };

    const handleNextDesign = (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }

        if (hasNextDesign) {
            setPreviewDesign(designs[currentPreviewIndex + 1]);
            setIsZoomed(false);
            setZoomOrigin({ x: 50, y: 50 });
            setIsScrolledToDetails(false);
        }
    };

    const handleToggleScrollDetails = () => {
        if (!isScrolledToDetails) {
            const el = document.getElementById('campaign-modal-details');

            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
                setIsScrolledToDetails(true);
            }
        } else {
            const container = document.getElementById(
                'campaign-modal-container',
            );

            if (container) {
                container.scrollTo({ top: 0, behavior: 'smooth' });
                setIsScrolledToDetails(false);
            }
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!previewDesign) {
                return;
            }

            if (e.key === 'Escape') {
                closePreview();
            } else if (e.key === 'ArrowLeft') {
                if (hasPrevDesign) {
                    setPreviewDesign(designs[currentPreviewIndex - 1]);
                    setIsZoomed(false);
                }
            } else if (e.key === 'ArrowRight') {
                if (hasNextDesign) {
                    setPreviewDesign(designs[currentPreviewIndex + 1]);
                    setIsZoomed(false);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        previewDesign,
        currentPreviewIndex,
        hasPrevDesign,
        hasNextDesign,
        designs,
    ]);

    const [editForm, setEditForm] = useState({
        name: campaign?.name || '',
        status: campaign?.status || 'active',
        start_date: campaign?.start_date || '',
        end_date: campaign?.end_date || '',
        event_id: campaign?.event_id ? String(campaign.event_id) : '',
    });
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});

    const openEditModal = () => {
        setEditForm({
            name: campaign?.name || '',
            status: campaign?.status || 'active',
            start_date: campaign?.start_date || '',
            end_date: campaign?.end_date || '',
            event_id: campaign?.event_id ? String(campaign.event_id) : '',
        });
        setEditErrors({});
        setIsEditOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isSaving) {
            return;
        }

        if (!editForm.name.trim()) {
            setEditErrors({ name: 'Campaign name is required.' });

            return;
        }

        setIsSaving(true);
        setEditErrors({});

        router.put(
            `/campaigns/${campaign.id}`,
            {
                name: editForm.name.trim(),
                status: editForm.status,
                start_date: editForm.start_date || null,
                end_date: editForm.end_date || null,
                event_id: editForm.event_id ? Number(editForm.event_id) : null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsEditOpen(false);
                    toast.success('Campaign updated successfully!');
                },
                onError: (errs) => {
                    setEditErrors(errs);
                    toast.error(
                        'Failed to update campaign. Please check inputs.',
                    );
                },
                onFinish: () => {
                    setIsSaving(false);
                },
            },
        );
    };

    const handleDeleteCampaign = () => {
        setIsDeleting(true);
        router.delete(`/campaigns/${campaign.id}`, {
            onSuccess: () => {
                toast.success('Campaign deleted successfully.');
            },
            onError: () => {
                toast.error('Failed to delete campaign.');
            },
            onFinish: () => {
                setIsDeleting(false);
                setIsDeleteOpen(false);
            },
        });
    };

    const handleDownloadAll = () => {
        if (designs.length === 0) {
            toast.info('No visual assets to download.');

            return;
        }

        designs.forEach((design, index) => {
            if (design.image_url) {
                setTimeout(() => {
                    const link = document.createElement('a');
                    link.href = design.download_url || design.image_url;
                    link.download = `${campaign.name}-${design.product_name || 'design'}-${index + 1}.svg`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }, index * 250);
            }
        });

        toast.success(`Downloading ${designs.length} assets...`);
    };

    return (
        <>
            <Head title={campaign?.name ?? 'Campaign Details'} />

            <div className="min-h-screen bg-background text-foreground">
                <div className="p-4 md:p-6 lg:p-8">
                    {/* =====================================================
                        HEADER
                    ====================================================== */}

                    <section className="mb-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Sparkles className="h-4 w-4" />
                                    </div>

                                    <p className="text-sm font-medium text-muted-foreground">
                                        Marketing Campaign
                                    </p>
                                </div>

                                <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight md:text-3xl">
                                    {campaign?.name ?? 'Campaign'}
                                </h1>
                            </div>

                            {/* HEADER ACTIONS: CREATE DESIGN + DOTTED HAMBURGER MENU */}
                            <div className="flex items-center gap-2.5">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                asChild
                                                className="group gap-2 shadow-sm"
                                            >
                                                <Link
                                                    href={
                                                        campaign?.generator_url ??
                                                        `/generator?event_id=${campaign?.event_id || ''}&campaign_id=${campaign?.id}`
                                                    }
                                                >
                                                    <Sparkles className="h-4 w-4" />
                                                    Create Design
                                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                                </Link>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>
                                                Generate new marketing visuals
                                                in AI Studio for this campaign
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-10 w-10 rounded-xl shadow-none"
                                            aria-label="Campaign options"
                                        >
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent
                                        align="end"
                                        className="w-52 rounded-xl border border-border bg-popover p-1.5 shadow-lg"
                                    >
                                        <DropdownMenuItem
                                            onClick={openEditModal}
                                            className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                                        >
                                            <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                                            Edit Campaign
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                            onClick={handleDownloadAll}
                                            disabled={designs.length === 0}
                                            className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                                        >
                                            <Download className="h-3.5 w-3.5 text-muted-foreground" />
                                            Download Assets ({designs.length})
                                        </DropdownMenuItem>

                                        {campaign.status !== 'archived' ? (
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    router.post(
                                                        `/campaigns/${campaign.id}/archive`,
                                                        {},
                                                        {
                                                            preserveScroll: true,
                                                            onSuccess: () => {
                                                                toast.success(
                                                                    `"${campaign.name}" moved to archive.`,
                                                                );
                                                            },
                                                            onError: () => {
                                                                toast.error(
                                                                    'Failed to archive campaign.',
                                                                );
                                                            },
                                                        },
                                                    );
                                                }}
                                                className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                                            >
                                                <Archive className="h-3.5 w-3.5 text-muted-foreground" />
                                                Archive Campaign
                                            </DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    router.post(
                                                        `/campaigns/${campaign.id}/unarchive`,
                                                        {},
                                                        {
                                                            preserveScroll: true,
                                                            onSuccess: () => {
                                                                toast.success(
                                                                    `"${campaign.name}" restored to active.`,
                                                                );
                                                            },
                                                            onError: () => {
                                                                toast.error(
                                                                    'Failed to restore campaign.',
                                                                );
                                                            },
                                                        },
                                                    );
                                                }}
                                                className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                                            >
                                                <ArchiveRestore className="h-3.5 w-3.5 text-primary" />
                                                Restore to Active
                                            </DropdownMenuItem>
                                        )}

                                        <DropdownMenuSeparator className="my-1 border-border/60" />

                                        <DropdownMenuItem
                                            onClick={() =>
                                                setIsDeleteOpen(true)
                                            }
                                            className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Delete Campaign
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </section>

                    {/* =====================================================
                        QUICK STATS CARDS
                    ====================================================== */}

                    <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-border/80">
                            <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                    <Tag className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-xs font-medium text-muted-foreground">
                                    Linked Event
                                </span>
                            </div>
                            <p className="mt-2 truncate text-base font-semibold">
                                {campaign?.event_name ?? 'No event selected'}
                            </p>
                        </div>

                        <div
                            className={`rounded-2xl border bg-card p-4 shadow-sm transition-all ${statusGlow[status] ?? statusGlow.draft}`}
                        >
                            <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Layers className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-xs font-medium text-muted-foreground">
                                    Status
                                </span>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <span
                                    className={`h-2 w-2 rounded-full ${statusDot[status]}`}
                                />
                                <p className="text-base font-semibold capitalize">
                                    {statusLabels[status] ?? status}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-border/80">
                            <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                    <ImageIcon className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-xs font-medium text-muted-foreground">
                                    Total Designs
                                </span>
                            </div>
                            <p className="mt-2 text-base font-semibold">
                                {designs.length}{' '}
                                {designs.length === 1 ? 'asset' : 'assets'}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-border/80">
                            <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                    <CalendarRange className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-xs font-medium text-muted-foreground">
                                    Timeline
                                </span>
                            </div>
                            <p className="mt-2 truncate text-base font-semibold">
                                {campaign?.start_date
                                    ? campaign?.end_date &&
                                      campaign.end_date !== campaign.start_date
                                        ? `${campaign.start_date} – ${campaign.end_date}`
                                        : campaign.start_date
                                    : 'Dates not set'}
                            </p>
                        </div>
                    </div>

                    {/* =====================================================
                        MAIN CONTENT GRID (RESTRUCTURED & COMPACT)
                    ====================================================== */}

                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                        {/* LEFT COLUMN: VISUAL ASSETS & STRATEGY */}
                        <div className="space-y-5">
                            {/* COMPACT & PROFESSIONAL CAMPAIGN VISUALS CARD */}
                            <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-xs">
                                <CardHeader className="border-b border-border/60 bg-muted/10 p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <ImageIcon className="h-4 w-4" />
                                            </div>
                                            <CardTitle className="text-sm font-bold">
                                                Campaign Visuals
                                            </CardTitle>
                                            <Badge
                                                variant="secondary"
                                                className="h-5 rounded-full px-2 text-[10px] font-bold"
                                            >
                                                {designs.length}{' '}
                                                {designs.length === 1
                                                    ? 'Asset'
                                                    : 'Assets'}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            {available_designs.length > 0 && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setIsAddExistingOpen(
                                                            true,
                                                        )
                                                    }
                                                    className="h-7 gap-1 px-2.5 text-xs shadow-none"
                                                >
                                                    <FolderPlus className="h-3.5 w-3.5 text-amber-500" />
                                                    <span className="hidden sm:inline">
                                                        Add Existing
                                                    </span>
                                                </Button>
                                            )}

                                            <Button
                                                asChild
                                                size="sm"
                                                className="h-7 gap-1 px-2.5 text-xs shadow-xs"
                                            >
                                                <Link
                                                    href={`/generator?campaign_id=${campaign.id}${campaign.event_id ? `&event_id=${campaign.event_id}` : ''}${campaign.product_name ? `&product_name=${encodeURIComponent(campaign.product_name)}` : ''}`}
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                    Generate
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-4">
                                    {designs.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-center">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
                                                <ImageIcon className="h-6 w-6" />
                                            </div>
                                            <p className="mt-3 text-xs font-semibold text-foreground">
                                                No Visual Assets Added
                                            </p>
                                            <p className="mt-1 max-w-xs text-[11px] text-muted-foreground">
                                                Generate AI marketing visuals or
                                                attach existing designs from
                                                your catalog.
                                            </p>
                                            <div className="mt-4 flex items-center gap-2">
                                                {available_designs.length >
                                                    0 && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            setIsAddExistingOpen(
                                                                true,
                                                            )
                                                        }
                                                        className="h-7 text-xs"
                                                    >
                                                        Add Existing
                                                    </Button>
                                                )}
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                >
                                                    <Link
                                                        href={`/generator?campaign_id=${campaign.id}${campaign.event_id ? `&event_id=${campaign.event_id}` : ''}${campaign.product_name ? `&product_name=${encodeURIComponent(campaign.product_name)}` : ''}`}
                                                    >
                                                        <Sparkles className="mr-1 h-3 w-3" />
                                                        Create Visual
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                                            {designs.map(
                                                (
                                                    design: any,
                                                    index: number,
                                                ) => (
                                                    <div
                                                        key={design.id || index}
                                                        onClick={() =>
                                                            openPreview(design)
                                                        }
                                                        role="button"
                                                        tabIndex={0}
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key ===
                                                                    'Enter' ||
                                                                e.key === ' '
                                                            ) {
                                                                openPreview(
                                                                    design,
                                                                );
                                                            }
                                                        }}
                                                        className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-border/80 bg-muted/20 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md focus:outline-none"
                                                    >
                                                        {design.image_url ? (
                                                            <img
                                                                src={
                                                                    design.image_url
                                                                }
                                                                alt={
                                                                    design.product_name ||
                                                                    `Campaign visual #${index + 1}`
                                                                }
                                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
                                                                <ImageIcon className="h-8 w-8" />
                                                            </div>
                                                        )}

                                                        {/* Quick overlay info on hover */}
                                                        <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                                            <div className="flex justify-end">
                                                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-xs">
                                                                    <Eye className="h-3 w-3" />
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <p className="truncate text-xs font-semibold text-white">
                                                                    {design.product_name ||
                                                                        `Visual #${index + 1}`}
                                                                </p>
                                                                {design.price && (
                                                                    <p className="text-[10px] font-bold text-emerald-400">
                                                                        ₱
                                                                        {
                                                                            design.price
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Campaign Product & Quick Actions Card */}
                            <Card className="rounded-2xl border-border bg-card shadow-xs">
                                <CardHeader className="border-b border-border/60 bg-muted/10 p-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2 text-sm font-bold">
                                            <Package className="h-4 w-4 text-primary" />
                                            Featured Product & Assets
                                        </CardTitle>
                                        {campaign?.product_name && (
                                            <Badge
                                                variant="outline"
                                                className="text-[10px] font-semibold"
                                            >
                                                Active Offering
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3 p-4">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                                            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                                Product Name
                                            </span>
                                            <p className="mt-0.5 text-xs font-semibold text-foreground">
                                                {campaign?.product_name ||
                                                    'No specific product assigned'}
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                                            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                                Visual Assets Attached
                                            </span>
                                            <p className="mt-0.5 text-xs font-semibold text-foreground">
                                                {designs.length}{' '}
                                                {designs.length === 1
                                                    ? 'asset generated'
                                                    : 'assets generated'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-2">
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                            className="h-7 gap-1.5 text-xs shadow-none"
                                        >
                                            <Link
                                                href={`/generator?campaign_id=${campaign.id}${campaign.event_id ? `&event_id=${campaign.event_id}` : ''}${campaign.product_name ? `&product_name=${encodeURIComponent(campaign.product_name)}` : ''}`}
                                            >
                                                <Sparkles className="h-3 w-3 text-primary" />
                                                Generate Visual in AI Studio
                                            </Link>
                                        </Button>
                                        {designs.length > 0 && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={handleDownloadAll}
                                                className="h-7 gap-1.5 text-xs shadow-none"
                                            >
                                                <Download className="h-3 w-3" />
                                                Download All Visuals
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT COLUMN: SIDEBAR (TIMELINE & EVENT) */}
                        <div className="space-y-5">
                            {/* Schedule & Timing */}
                            <Card className="rounded-2xl border-border bg-card shadow-xs">
                                <CardHeader className="border-b border-border/60 bg-muted/10 p-4">
                                    <CardTitle className="flex items-center gap-2 text-sm font-bold">
                                        <CalendarDays className="h-4 w-4 text-primary" />
                                        Timeline Schedule
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 p-4">
                                    <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                                        <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                            Start Date
                                        </span>
                                        <p className="mt-0.5 text-xs font-semibold text-foreground">
                                            {campaign?.start_date || 'Not set'}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                                        <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                            End Date
                                        </span>
                                        <p className="mt-0.5 text-xs font-semibold text-foreground">
                                            {campaign?.end_date || 'Not set'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Associated Event */}
                            <Card className="rounded-2xl border-border bg-card shadow-xs">
                                <CardHeader className="border-b border-border/60 bg-muted/10 p-4">
                                    <CardTitle className="flex items-center gap-2 text-sm font-bold">
                                        <Tag className="h-4 w-4 text-primary" />
                                        Linked Retail Event
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                                        <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                            Event / Holiday
                                        </p>
                                        <p className="mt-0.5 text-xs font-semibold text-foreground">
                                            {campaign?.event_name ??
                                                'No event linked'}
                                        </p>
                                        {campaign?.event_date && (
                                            <p className="mt-1 text-[11px] text-muted-foreground">
                                                Event date:{' '}
                                                {campaign.event_date}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            {/* =============================================================
                IMMERSIVE FULL SCREEN CAMPAIGN VISUAL VIEWER (NO MODAL BOX)
            ============================================================= */}

            {/* Unified Fullscreen Visual Preview Modal */}
            {previewDesign && (
                <div
                    id="campaign-modal-container"
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
                                {previewDesign.product_name ||
                                    'Campaign Visual'}
                            </h2>
                            <Badge
                                variant="outline"
                                className="hidden border-white/20 bg-white/5 text-[10px] text-white/90 sm:inline-flex"
                            >
                                {campaign.name}{' '}
                                {designs.length > 1 &&
                                    `(${currentPreviewIndex + 1}/${designs.length})`}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Zoom Toggle Button */}
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
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-white/10 px-3 text-xs font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20"
                                        title="Download Visual"
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
                                                previewDesign.image_url,
                                                `${campaign.name}-${previewDesign.product_name || 'visual'}`,
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
                                                previewDesign.image_url,
                                                `${campaign.name}-${previewDesign.product_name || 'visual'}`,
                                                'jpeg',
                                            )
                                        }
                                        className="cursor-pointer gap-2 text-xs font-medium text-white hover:bg-white/20 focus:bg-white/20 focus:text-white"
                                    >
                                        <Download className="h-3.5 w-3.5 text-blue-400" />
                                        JPEG (Web-Optimized)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            downloadVisualAsFormat(
                                                previewDesign.image_url,
                                                `${campaign.name}-${previewDesign.product_name || 'visual'}`,
                                                'svg',
                                            )
                                        }
                                        className="cursor-pointer gap-2 text-xs font-medium text-white hover:bg-white/20 focus:bg-white/20 focus:text-white"
                                    >
                                        <Download className="h-3.5 w-3.5 text-emerald-400" />
                                        SVG (Vector Embed)
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <button
                                type="button"
                                onClick={closePreview}
                                className="ml-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-all hover:bg-white/30"
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
                            onClick={handlePrevDesign}
                            className="fixed top-1/2 left-3 z-[170] flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/85 shadow-2xl backdrop-blur-md transition-all duration-200 hover:scale-110 hover:border-white/40 hover:bg-black/90 hover:text-white active:scale-95 sm:left-6 sm:h-13 sm:w-13"
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
                            onClick={handleNextDesign}
                            className="fixed top-1/2 right-3 z-[170] flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/85 shadow-2xl backdrop-blur-md transition-all duration-200 hover:scale-110 hover:border-white/40 hover:bg-black/90 hover:text-white active:scale-95 sm:right-6 sm:h-13 sm:w-13"
                            title="Next visual (→)"
                            aria-label="Next image"
                        >
                            <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7" />
                        </button>
                    )}

                    {/* Section 1: Full-view Image Canvas */}
                    <div className="group/canvas relative flex min-h-[calc(100vh-4.5rem)] w-full flex-col items-center justify-center px-4 pt-4 pb-20 sm:px-8 sm:pt-6 sm:pb-24">
                        {/* Ambient Glow */}
                        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
                            <div className="h-[450px] w-[450px] rounded-full bg-gradient-to-tr from-primary/20 via-blue-500/10 to-transparent opacity-40 blur-3xl" />
                        </div>

                        {/* Subtle Black Gradient Overlay at the Very Bottom of Dark Backdrop */}
                        <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-28 bg-gradient-to-t from-black via-black/80 to-transparent" />

                        {previewDesign.image_url ? (
                            <img
                                src={previewDesign.image_url}
                                alt={
                                    previewDesign.product_name ||
                                    'Campaign visual'
                                }
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
                                <ImageIcon className="h-16 w-16" />
                                <p className="mt-2 text-sm">
                                    No visual available
                                </p>
                            </div>
                        )}

                        {/* Static Scroll Indicator Button (Dark circular navigation arrow layered over the black gradient zone) */}
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
                        id="campaign-modal-details"
                        className="relative z-30 w-full border-t border-border/80 bg-card/98 px-4 pt-8 pb-16 text-foreground backdrop-blur-3xl sm:px-8"
                    >
                        <div className="mx-auto max-w-3xl space-y-6">
                            <div className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold tracking-wider text-primary-foreground uppercase shadow-md shadow-primary/20">
                                        <Sparkles className="h-4 w-4" />
                                        Visual Creative Details
                                    </div>
                                    <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                                        {previewDesign.product_name ||
                                            'Campaign Visual'}
                                    </h3>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        asChild
                                        size="sm"
                                        className="h-9 cursor-pointer gap-2 bg-primary px-4 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:scale-105 hover:bg-primary/90"
                                    >
                                        <Link
                                            href={`/generator?event_id=${campaign?.event_id || ''}&campaign_id=${campaign.id}&product_name=${encodeURIComponent(
                                                previewDesign.product_name ||
                                                    '',
                                            )}&price=${encodeURIComponent(previewDesign.price || '')}&tagline=${encodeURIComponent(previewDesign.tagline || '')}&prompt=${encodeURIComponent(previewDesign.prompt || '')}&aspect_ratio=${encodeURIComponent(previewDesign.aspect_ratio || '1:1')}`}
                                        >
                                            <Sparkles className="h-4 w-4" />
                                            Edit in AI Studio
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            {previewDesign.tagline && (
                                <div className="group relative overflow-hidden rounded-2xl border border-primary/30 bg-primary/5 p-5 shadow-xs transition-all hover:border-primary/50 sm:p-6">
                                    <div className="inline-flex items-center gap-1.5 rounded-md bg-primary/15 px-2.5 py-1 text-[11px] font-bold tracking-wider text-primary uppercase">
                                        <Tag className="h-3.5 w-3.5" />
                                        Catchy Tagline & Hook
                                    </div>
                                    <p className="mt-3 text-lg leading-snug font-bold text-foreground italic sm:text-xl">
                                        "{previewDesign.tagline}"
                                    </p>
                                </div>
                            )}

                            <div className="group rounded-2xl border border-border/80 bg-muted/30 p-5 shadow-xs transition-all duration-300 hover:border-border">
                                <div className="inline-block rounded-md bg-muted px-2.5 py-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                    AI Prompt & Concept
                                </div>
                                <p className="mt-2.5 text-sm leading-relaxed font-medium text-foreground sm:text-base">
                                    {previewDesign.prompt ||
                                        `${campaign.name} visual creative tailored for high engagement.`}
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="group rounded-2xl border border-border/80 bg-card p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/40 sm:p-5">
                                    <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                        <Tag className="h-3.5 w-3.5 text-primary" />
                                        Product
                                    </div>
                                    <p className="mt-2 truncate text-base font-bold text-foreground">
                                        {previewDesign.product_name ||
                                            'Standard Offering'}
                                    </p>
                                    {previewDesign.price && (
                                        <p className="mt-0.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                                            ₱{previewDesign.price}
                                        </p>
                                    )}
                                </div>

                                <div className="group rounded-2xl border border-border/80 bg-card p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/40 sm:p-5">
                                    <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                        <Layers className="h-3.5 w-3.5 text-primary" />
                                        Campaign
                                    </div>
                                    <p className="mt-2 truncate text-base font-bold text-foreground">
                                        {campaign.name}
                                    </p>
                                </div>

                                <div className="group rounded-2xl border border-border/80 bg-card p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/40 sm:p-5">
                                    <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                        <CalendarDays className="h-3.5 w-3.5 text-primary" />
                                        Created
                                    </div>
                                    <p className="mt-2 truncate text-base font-bold text-foreground">
                                        {previewDesign.created_at ||
                                            'Saved Visual'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="mr-1 text-xs font-bold text-muted-foreground">
                                        Download as:
                                    </span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            downloadVisualAsFormat(
                                                previewDesign.image_url,
                                                `${campaign.name}-${previewDesign.product_name || 'visual'}`,
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
                                                previewDesign.image_url,
                                                `${campaign.name}-${previewDesign.product_name || 'visual'}`,
                                                'jpeg',
                                            )
                                        }
                                        className="cursor-pointer gap-1.5 border-border bg-card text-xs font-semibold text-foreground shadow-none transition-all hover:bg-muted"
                                    >
                                        <Download className="h-3.5 w-3.5 text-blue-500" />
                                        JPEG
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            downloadVisualAsFormat(
                                                previewDesign.image_url,
                                                `${campaign.name}-${previewDesign.product_name || 'visual'}`,
                                                'svg',
                                            )
                                        }
                                        className="cursor-pointer gap-1.5 border-border bg-card text-xs font-semibold text-foreground shadow-none transition-all hover:bg-muted"
                                    >
                                        <Download className="h-3.5 w-3.5 text-emerald-500" />
                                        SVG
                                    </Button>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={closePreview}
                                    className="h-8 cursor-pointer border-border bg-card px-4 text-xs font-semibold text-foreground transition-all hover:bg-muted"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* =============================================================
                EDIT CAMPAIGN MODAL
            ============================================================= */}

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="rounded-2xl sm:max-w-lg">
                    <form onSubmit={handleEditSubmit}>
                        <DialogHeader>
                            <DialogTitle className="text-lg">
                                Edit Campaign
                            </DialogTitle>
                            <DialogDescription>
                                Update campaign name, status, and scheduled
                                timeline.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-camp-name">
                                    Campaign Name
                                </Label>
                                <Input
                                    id="edit-camp-name"
                                    value={editForm.name}
                                    onChange={(e) =>
                                        setEditForm((cur) => ({
                                            ...cur,
                                            name: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g. Summer Launch 2026"
                                    disabled={isSaving}
                                    className={
                                        editErrors.name
                                            ? 'border-destructive'
                                            : ''
                                    }
                                />
                                {editErrors.name && (
                                    <p className="text-xs text-destructive">
                                        {editErrors.name}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-camp-status">
                                        Status
                                    </Label>
                                    <select
                                        id="edit-camp-status"
                                        value={editForm.status}
                                        onChange={(e) =>
                                            setEditForm((cur) => ({
                                                ...cur,
                                                status: e.target.value,
                                            }))
                                        }
                                        disabled={isSaving}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30"
                                    >
                                        <option value="active">Active</option>
                                        <option value="scheduled">
                                            Scheduled
                                        </option>
                                        <option value="completed">
                                            Completed
                                        </option>
                                        <option value="archived">
                                            Archived
                                        </option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-camp-event">
                                        Linked Event (Optional)
                                    </Label>
                                    <select
                                        id="edit-camp-event"
                                        value={editForm.event_id}
                                        onChange={(e) =>
                                            setEditForm((cur) => ({
                                                ...cur,
                                                event_id: e.target.value,
                                            }))
                                        }
                                        disabled={isSaving}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30"
                                    >
                                        <option value="">
                                            No linked event
                                        </option>
                                        {events.map((ev: any) => (
                                            <option key={ev.id} value={ev.id}>
                                                {ev.name} ({ev.date})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-camp-start">
                                        Start Date
                                    </Label>
                                    <Input
                                        id="edit-camp-start"
                                        type="date"
                                        value={editForm.start_date}
                                        onChange={(e) =>
                                            setEditForm((cur) => ({
                                                ...cur,
                                                start_date: e.target.value,
                                            }))
                                        }
                                        disabled={isSaving}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-camp-end">
                                        End Date
                                    </Label>
                                    <Input
                                        id="edit-camp-end"
                                        type="date"
                                        value={editForm.end_date}
                                        onChange={(e) =>
                                            setEditForm((cur) => ({
                                                ...cur,
                                                end_date: e.target.value,
                                            }))
                                        }
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditOpen(false)}
                                disabled={isSaving}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSaving || !editForm.name.trim()}
                                className="gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Saving Changes...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* =============================================================
                DELETE CAMPAIGN CONFIRMATION MODAL
            ============================================================= */}

            <Dialog
                open={isDeleteOpen}
                onOpenChange={(open) => {
                    if (!open && !isDeleting) {
                        setIsDeleteOpen(false);
                    }
                }}
            >
                <DialogContent className="rounded-2xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg">
                            Delete Campaign?
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-semibold text-foreground">
                                "{campaign?.name}"
                            </span>
                            ? This will remove the campaign record. Associated
                            designs will remain safe in My Designs.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="mt-6 gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDeleteOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDeleteCampaign}
                            disabled={isDeleting}
                            className="gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            {isDeleting ? 'Deleting...' : 'Delete Campaign'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =============================================================
                CAMPAIGN VISUALS GALLERY MODAL
            ============================================================= */}

            <Dialog
                open={isGalleryModalOpen}
                onOpenChange={(open) => {
                    if (!open && previewDesign) {
                        return;
                    }

                    setIsGalleryModalOpen(open);
                }}
            >
                <DialogContent
                    onPointerDownOutside={(e) => {
                        if (previewDesign) {
                            e.preventDefault();
                        }
                    }}
                    onInteractOutside={(e) => {
                        if (previewDesign) {
                            e.preventDefault();
                        }
                    }}
                    onEscapeKeyDown={(e) => {
                        if (previewDesign) {
                            e.preventDefault();
                            closePreview();
                        }
                    }}
                    className="flex max-h-[85vh] flex-col overflow-hidden rounded-3xl border-border bg-card p-0 shadow-2xl sm:max-w-3xl"
                >
                    <DialogHeader className="shrink-0 border-b border-border bg-muted/20 p-4 sm:p-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <ImageIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-lg font-bold text-foreground sm:text-xl">
                                        Campaign Visuals
                                    </DialogTitle>
                                    <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                                        {campaign.name} &bull; {designs.length}{' '}
                                        {designs.length === 1
                                            ? 'creative asset'
                                            : 'creative assets'}
                                    </DialogDescription>
                                </div>
                            </div>

                            {designs.length > 0 &&
                                available_designs.length > 0 && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                            setIsAddExistingOpen(true)
                                        }
                                        className="mr-2 h-8 gap-1.5 rounded-xl text-xs shadow-none"
                                    >
                                        <FolderPlus className="h-3.5 w-3.5" />
                                        Add Existing
                                    </Button>
                                )}

                            {designs.length > 0 && (
                                <Button
                                    asChild
                                    size="sm"
                                    className="mr-6 h-8 gap-1.5 rounded-xl text-xs shadow-none"
                                >
                                    <Link
                                        href={`/generator?campaign_id=${campaign.id}${campaign.event_id ? `&event_id=${campaign.event_id}` : ''}${campaign.product_name ? `&product_name=${encodeURIComponent(campaign.product_name)}` : ''}`}
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        Generate Visual
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </DialogHeader>

                    <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
                        {designs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <ImageIcon className="h-8 w-8" />
                                </div>
                                <div className="max-w-sm space-y-1">
                                    <h3 className="text-base font-bold text-foreground">
                                        No Campaign Visuals Yet
                                    </h3>
                                    <p className="text-xs leading-relaxed text-muted-foreground">
                                        There are currently no visual assets
                                        generated or linked to this campaign.
                                        Generate AI marketing creatives tailored
                                        to this campaign.
                                    </p>
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    {available_designs.length > 0 && (
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                setIsAddExistingOpen(true)
                                            }
                                            className="gap-2 rounded-xl text-xs shadow-sm"
                                        >
                                            <FolderPlus className="h-4 w-4" />
                                            Add Existing Visual
                                        </Button>
                                    )}
                                    <Button
                                        asChild
                                        className="gap-2 rounded-xl text-xs shadow-sm"
                                    >
                                        <Link
                                            href={`/generator?campaign_id=${campaign.id}${campaign.event_id ? `&event_id=${campaign.event_id}` : ''}${campaign.product_name ? `&product_name=${encodeURIComponent(campaign.product_name)}` : ''}`}
                                        >
                                            <Sparkles className="h-4 w-4" />
                                            Generate Visuals in AI Studio
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {designs.map((design: any, index: number) => (
                                    <div
                                        key={design.id || index}
                                        onClick={() => openPreview(design)}
                                        className="group relative aspect-square w-full cursor-pointer overflow-hidden rounded-xl border border-border bg-muted/20 shadow-xs transition-all duration-200 hover:border-primary/50 hover:shadow-md"
                                    >
                                        {design.image_url ? (
                                            <img
                                                src={design.image_url}
                                                alt={
                                                    design.product_name ||
                                                    `Visual #${index + 1}`
                                                }
                                                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                                <ImageIcon className="h-10 w-10 opacity-40" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* =============================================================
                ADD EXISTING VISUAL DIALOG
            ============================================================= */}

            <Dialog
                open={isAddExistingOpen}
                onOpenChange={(open) => {
                    if (!open && !isAttachingExisting) {
                        setIsAddExistingOpen(false);
                        setExistingDesignIds([]);
                    }
                }}
            >
                <DialogContent className="flex max-h-[85vh] flex-col rounded-2xl sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <FolderPlus className="h-5 w-5 text-amber-500" />
                            Add Existing Visuals
                        </DialogTitle>
                        <DialogDescription>
                            {campaign.event_name ? (
                                <span>
                                    Select visuals created specifically for{' '}
                                    <span className="font-semibold text-amber-500">
                                        {campaign.event_name}
                                    </span>{' '}
                                    to link to{' '}
                                    <span className="font-semibold text-foreground">
                                        "{campaign.name}"
                                    </span>
                                    .
                                </span>
                            ) : (
                                <span>
                                    This campaign does not have an assigned
                                    event/holiday.
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
                        {!campaign.event_id ? (
                            <div className="space-y-2 py-8 text-center">
                                <p className="text-sm font-medium text-foreground">
                                    No Event Associated
                                </p>
                                <p className="mx-auto max-w-sm text-xs text-muted-foreground">
                                    Visuals can only be attached to campaigns
                                    created for a specific holiday or event.
                                    Edit this campaign to assign an event.
                                </p>
                            </div>
                        ) : available_designs.length === 0 ? (
                            <div className="space-y-3 py-8 text-center">
                                <p className="text-sm font-medium text-foreground">
                                    No Visuals Found for {campaign.event_name}
                                </p>
                                <p className="mx-auto max-w-sm text-xs text-muted-foreground">
                                    You don't have any existing visuals created
                                    for this event. Generate a new visual
                                    tailored to this campaign in AI Studio.
                                </p>
                                <Button
                                    asChild
                                    size="sm"
                                    className="gap-2 rounded-xl text-xs shadow-xs"
                                >
                                    <Link
                                        href={`/generator?campaign_id=${campaign.id}${campaign.event_id ? `&event_id=${campaign.event_id}` : ''}${campaign.product_name ? `&product_name=${encodeURIComponent(campaign.product_name)}` : ''}`}
                                    >
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Generate Visual in AI Studio
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                                {available_designs.map((d: any) => {
                                    const isChosen = existingDesignIds.includes(
                                        d.id,
                                    );

                                    return (
                                        <button
                                            key={d.id}
                                            type="button"
                                            onClick={() =>
                                                toggleExistingDesign(d.id)
                                            }
                                            className={`group relative aspect-square cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                                                isChosen
                                                    ? 'border-primary shadow-lg ring-2 ring-primary/40'
                                                    : 'border-amber-400/50 hover:border-amber-400'
                                            }`}
                                        >
                                            {d.image_url ? (
                                                <img
                                                    src={d.image_url}
                                                    alt={
                                                        d.product_name ||
                                                        'Visual'
                                                    }
                                                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                                                    <ImageIcon className="h-6 w-6 opacity-40" />
                                                </div>
                                            )}

                                            {isChosen && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                                                        <Check className="h-4 w-4 stroke-[3]" />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
                                                <p className="truncate text-[10px] font-medium text-white">
                                                    {d.product_name ||
                                                        'Untitled'}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="mt-4 gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsAddExistingOpen(false);
                                setExistingDesignIds([]);
                            }}
                            disabled={isAttachingExisting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={confirmAttachExisting}
                            disabled={
                                isAttachingExisting ||
                                existingDesignIds.length === 0
                            }
                            className="gap-2"
                        >
                            <FolderPlus className="h-4 w-4" />
                            {isAttachingExisting
                                ? 'Adding...'
                                : `Add ${existingDesignIds.length || ''} Visual${existingDesignIds.length !== 1 ? 's' : ''}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

/*
|--------------------------------------------------------------------------
| LAYOUT
|--------------------------------------------------------------------------
*/

CampaignShowPage.layout = {
    breadcrumbs: [
        {
            title: 'Campaigns',
            href: '/campaigns',
        },
        {
            title: 'Campaign Details',
            href: '#',
            current: true,
        },
    ],
};
