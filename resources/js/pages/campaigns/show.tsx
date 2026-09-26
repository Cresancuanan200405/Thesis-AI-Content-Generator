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
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
    UnifiedImageViewer,
    CampaignViewerPanel,
    CampaignViewerItem,
} from '@/components/image-viewer';
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

    /* Creatives Sub-tabs & Finalizing State */
    const [creativeTab, setCreativeTab] = useState<'all' | 'drafts' | 'final'>('all');
    const [isFinalizing, setIsFinalizing] = useState(false);

    const creativeCounts = useMemo(() => {
        if (campaign?.creative_counts) {
            return campaign.creative_counts;
        }
        return {
            drafts: designs.filter((d: any) => d.status === 'draft' || d.is_draft).length,
            final: designs.filter((d: any) => d.status !== 'draft' && !d.is_draft).length,
            total: designs.length,
        };
    }, [campaign?.creative_counts, designs]);

    const drafts = useMemo(() => {
        if (Array.isArray(campaign?.drafts) && campaign.drafts.length > 0) {
            return campaign.drafts;
        }
        return designs.filter((d: any) => d.status === 'draft' || d.is_draft);
    }, [campaign?.drafts, designs]);

    const finalDesigns = useMemo(() => {
        if (Array.isArray(campaign?.final_designs) && campaign.final_designs.length > 0) {
            return campaign.final_designs;
        }
        return designs.filter((d: any) => d.status !== 'draft' && !d.is_draft);
    }, [campaign?.final_designs, designs]);

    const displayedDesigns = useMemo(() => {
        if (creativeTab === 'drafts') {
            return drafts;
        }
        if (creativeTab === 'final') {
            return finalDesigns;
        }
        return designs;
    }, [creativeTab, drafts, finalDesigns, designs]);

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

    /* Image Preview State (Unified Image Viewer) */
    const [previewDesign, setPreviewDesign] = useState<any>(null);
    const [designToDelete, setDesignToDelete] = useState<any>(null);
    const [isDeletingDesign, setIsDeletingDesign] = useState(false);

    const currentPreviewList = useMemo(() => {
        if (displayedDesigns.some((d: any) => d.id === previewDesign?.id)) {
            return displayedDesigns;
        }
        return designs;
    }, [displayedDesigns, designs, previewDesign]);

    const currentPreviewIndex = previewDesign
        ? currentPreviewList.findIndex((d: any) => d.id === previewDesign.id)
        : -1;

    const openPreview = (design: any) => {
        setPreviewDesign(design);
    };

    const closePreview = () => {
        setPreviewDesign(null);
    };

    const [editForm, setEditForm] = useState({
        name: campaign?.name || '',
        start_date: campaign?.start_date || '',
        end_date: campaign?.end_date || '',
    });
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});

    const openEditModal = () => {
        setEditForm({
            name: campaign?.name || '',
            start_date: campaign?.start_date || '',
            end_date: campaign?.end_date || '',
        });
        setEditErrors({});
        setIsEditOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isSaving) {
            return;
        }

        const errors: Record<string, string> = {};

        if (!editForm.name.trim()) {
            errors.name = 'Campaign name is required.';
        }

        if (
            editForm.start_date &&
            editForm.end_date &&
            editForm.start_date > editForm.end_date
        ) {
            errors.end_date = 'Start date must not be after end date.';
        }

        if (Object.keys(errors).length > 0) {
            setEditErrors(errors);

            return;
        }

        setIsSaving(true);
        setEditErrors({});

        router.put(
            `/campaigns/${campaign.id}`,
            {
                name: editForm.name.trim(),
                start_date: editForm.start_date || null,
                end_date: editForm.end_date || null,
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

    const confirmDeleteDesign = () => {
        if (!designToDelete) {
            return;
        }

        setIsDeletingDesign(true);

        router.delete(`/designs/${designToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                const deletedId = designToDelete.id;
                setDesignToDelete(null);

                if (previewDesign?.id === deletedId) {
                    closePreview();
                }

                toast.success('Visual deleted successfully.');
            },
            onError: () => {
                toast.error('Failed to delete visual.');
            },
            onFinish: () => {
                setIsDeletingDesign(false);
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
                                                        `/campaigns/${campaign?.id}/generator`
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
                                    Creatives
                                </span>
                            </div>
                            <p className="mt-2 text-base font-semibold">
                                {creativeCounts.total}{' '}
                                {creativeCounts.total === 1 ? 'creative' : 'creatives'}
                            </p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                                Drafts: <span className="font-semibold text-amber-500">{creativeCounts.drafts}</span> • Final: <span className="font-semibold text-emerald-500">{creativeCounts.final}</span>
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
                            {/* COMPACT & PROFESSIONAL CAMPAIGN CREATIVES CARD */}
                            <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-xs">
                                <CardHeader className="border-b border-border/60 bg-muted/10 p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                    <ImageIcon className="h-4 w-4" />
                                                </div>
                                                <CardTitle className="text-sm font-bold">
                                                    Creatives
                                                </CardTitle>
                                            </div>

                                            {/* Sub-tabs: All / Drafts / Final Designs */}
                                            <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/40 p-0.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setCreativeTab('all')}
                                                    className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                                                        creativeTab === 'all'
                                                            ? 'bg-background text-foreground shadow-xs'
                                                            : 'text-muted-foreground hover:text-foreground'
                                                    }`}
                                                >
                                                    All ({creativeCounts.total})
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setCreativeTab('drafts')}
                                                    className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                                                        creativeTab === 'drafts'
                                                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 shadow-xs'
                                                            : 'text-muted-foreground hover:text-foreground'
                                                    }`}
                                                >
                                                    Drafts ({creativeCounts.drafts})
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setCreativeTab('final')}
                                                    className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                                                        creativeTab === 'final'
                                                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 shadow-xs'
                                                            : 'text-muted-foreground hover:text-foreground'
                                                    }`}
                                                >
                                                    Final Designs ({creativeCounts.final})
                                                </button>
                                            </div>
                                        </div>

                                        {available_designs.length > 0 && (
                                            <div className="flex items-center gap-1.5">
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
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>

                                <CardContent className="p-4">
                                    {displayedDesigns.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-center">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
                                                <ImageIcon className="h-6 w-6" />
                                            </div>
                                            <p className="mt-3 text-xs font-semibold text-foreground">
                                                {creativeTab === 'drafts'
                                                    ? 'No Draft Creatives'
                                                    : creativeTab === 'final'
                                                      ? 'No Final Designs'
                                                      : 'No Creatives Added'}
                                            </p>
                                            <p className="mt-1 max-w-xs text-[11px] text-muted-foreground">
                                                {creativeTab === 'drafts'
                                                    ? 'Save generated creatives as drafts to continue editing them later.'
                                                    : 'Generate AI marketing visuals or attach existing designs from your catalog.'}
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
                                                        href={`/campaigns/${campaign.id}/generator${campaign.event_id ? `?event_id=${campaign.event_id}` : ''}${campaign.product_name ? `${campaign.event_id ? '&' : '?'}product_name=${encodeURIComponent(campaign.product_name)}` : ''}`}
                                                    >
                                                        <Sparkles className="mr-1 h-3 w-3" />
                                                        Create Visual
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                                            {displayedDesigns.map(
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
                                                        <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/85 via-black/25 to-transparent p-2.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
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
                                                                    <div className="mt-0.5">
                                                                        <p className="text-[10px] font-bold text-emerald-400">
                                                                            ₱{design.price}
                                                                        </p>
                                                                    </div>
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
                                    {designs.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-2">
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
                                        </div>
                                    )}
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
                UNIFIED CAMPAIGN IMAGE VIEWER
            ============================================================= */}
            <UnifiedImageViewer
                isOpen={Boolean(previewDesign)}
                onClose={closePreview}
                items={currentPreviewList}
                currentIndex={currentPreviewIndex}
                onNavigate={(newIndex) => {
                    if (newIndex >= 0 && newIndex < currentPreviewList.length) {
                        setPreviewDesign(currentPreviewList[newIndex]);
                    }
                }}
                context="campaign"
                onDownload={(item, format) => {
                    const url = (item as any)?.download_url || (item as any)?.image_url;
                    downloadVisualAsFormat(
                        url,
                        `${campaign.name}-${(item as any)?.product_name || 'visual'}`,
                        format,
                    );
                }}
                renderCustomPanel={(design) => (
                    <CampaignViewerPanel
                        design={design as CampaignViewerItem}
                        campaign={campaign}
                        onFinalize={handleFinalize}
                        isFinalizing={isFinalizing}
                        onDownload={(item, format) => {
                            const url = (item as any)?.download_url || item?.image_url;
                            downloadVisualAsFormat(
                                url,
                                `${campaign.name}-${item?.product_name || 'visual'}`,
                                format,
                            );
                        }}
                        onDelete={(item) => setDesignToDelete(item)}
                    />
                )}
            />

            {/* =============================================================
                DELETE DESIGN VISUAL CONFIRMATION MODAL
            ============================================================= */}
            <Dialog
                open={Boolean(designToDelete)}
                onOpenChange={(open) => {
                    if (!open && !isDeletingDesign) {
                        setDesignToDelete(null);
                    }
                }}
            >
                <DialogContent
                    className="z-[160] rounded-2xl sm:max-w-md"
                    overlayClassName="z-[160]"
                >
                    <DialogHeader>
                        <DialogTitle className="text-lg">
                            Delete Visual?
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-semibold text-foreground">
                                "{designToDelete?.product_name || 'this visual'}"
                            </span>
                            ? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="mt-6 gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDesignToDelete(null)}
                            disabled={isDeletingDesign}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={confirmDeleteDesign}
                            disabled={isDeletingDesign}
                            className="gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            {isDeletingDesign ? 'Deleting...' : 'Delete Visual'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                                Update campaign name and timeline schedule.
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
                                        className={
                                            editErrors.end_date
                                                ? 'border-destructive'
                                                : ''
                                        }
                                    />
                                    {editErrors.end_date && (
                                        <p className="text-xs text-destructive">
                                            {editErrors.end_date}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5 rounded-xl border border-border/70 bg-muted/30 p-3.5">
                                <Label className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                    Campaign Status
                                </Label>
                                <div className="flex items-center gap-2 pt-0.5">
                                    <span
                                        className={`h-2.5 w-2.5 rounded-full ${statusDot[status] ?? 'bg-emerald-500'}`}
                                    />
                                    <span className="text-sm font-semibold capitalize text-foreground">
                                        {statusLabels[status] ?? status}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Managed automatically based on the campaign lifecycle.
                                </p>
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
