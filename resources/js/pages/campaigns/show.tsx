import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    CalendarRange,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Download,
    Edit3,
    FolderPlus,
    Eye,
    Heart,
    ImageIcon,
    Layers,
    Loader2,
    MoreVertical,
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
import { downloadVisualAsFormat } from '@/lib/download';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
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

const statusStyles: Record<string, string> = {
    draft:
        'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300',
    active:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300',
    scheduled:
        'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300',
    completed:
        'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-300',
    archived:
        'border-border bg-muted text-muted-foreground',
};

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
    scheduled: 'border-blue-500/30 hover:border-blue-500/60 shadow-[0_0_20px_rgba(59,130,246,0.08)]',
    completed: 'border-purple-500/30 hover:border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.08)]',
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
        if (existingDesignIds.length === 0) return;
        setIsAttachingExisting(true);

        router.post(
            `/campaigns/${campaign.id}/attach-designs`,
            { design_ids: existingDesignIds },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsAddExistingOpen(false);
                    setExistingDesignIds([]);
                    toast.success(`${existingDesignIds.length} visual(s) added to campaign.`);
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

    /* Selected Visual in Layered Photo View */
    const [selectedVisualIndex, setSelectedVisualIndex] = useState(0);
    const activeDesign = designs[selectedVisualIndex] || designs[0] || null;

    /* Preview Modal State */
    const [previewDesign, setPreviewDesign] = useState<any>(null);
    const [isZoomed, setIsZoomed] = useState(false);

    const openPreview = (design: any) => {
        setPreviewDesign(design);
        setIsZoomed(false);
    };

    const closePreview = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setPreviewDesign(null);
        setIsZoomed(false);
        setIsGalleryModalOpen(true);
    };

    const currentPreviewIndex = designs.findIndex((d) => d.id === previewDesign?.id);
    const hasPrevDesign = currentPreviewIndex > 0;
    const hasNextDesign =
        currentPreviewIndex !== -1 && currentPreviewIndex < designs.length - 1;

    const handlePrevDesign = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (hasPrevDesign) {
            setPreviewDesign(designs[currentPreviewIndex - 1]);
            setIsZoomed(false);
        }
    };

    const handleNextDesign = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (hasNextDesign) {
            setPreviewDesign(designs[currentPreviewIndex + 1]);
            setIsZoomed(false);
        }
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
    }, [previewDesign, currentPreviewIndex, hasPrevDesign, hasNextDesign, designs]);

    const [editForm, setEditForm] = useState({
        name: campaign?.name || '',
        status: campaign?.status || 'draft',
        start_date: campaign?.start_date || '',
        end_date: campaign?.end_date || '',
        event_id: campaign?.event_id ? String(campaign.event_id) : '',
    });
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});

    const openEditModal = () => {
        setEditForm({
            name: campaign?.name || '',
            status: campaign?.status || 'draft',
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
                                            <Button asChild className="group gap-2 shadow-sm">
                                                <Link href={campaign?.generator_url ?? `/generator?event_id=${campaign?.event_id || ''}&campaign_id=${campaign?.id}`}>
                                                    <Sparkles className="h-4 w-4" />
                                                    Create Design
                                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                                </Link>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Generate new marketing visuals in AI Studio for this campaign</p>
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

                                    <DropdownMenuContent align="end" className="w-52 rounded-xl border border-border bg-popover p-1.5 shadow-lg">
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

                                        <DropdownMenuSeparator className="my-1 border-border/60" />

                                        <DropdownMenuItem
                                            onClick={() => setIsDeleteOpen(true)}
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

                        <div className={`rounded-2xl border bg-card p-4 shadow-sm transition-all ${statusGlow[status] ?? statusGlow.draft}`}>
                            <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Layers className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-xs font-medium text-muted-foreground">
                                    Status
                                </span>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${statusDot[status]}`} />
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
                                {designs.length} {designs.length === 1 ? 'asset' : 'assets'}
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
                                    ? campaign?.end_date && campaign.end_date !== campaign.start_date
                                        ? `${campaign.start_date} – ${campaign.end_date}`
                                        : campaign.start_date
                                    : 'Dates not set'}
                            </p>
                        </div>
                    </div>

                    {/* =====================================================
                        MAIN CONTENT GRID
                    ====================================================== */}

                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">

                        {/* LEFT COLUMN: DESIGNS & SCHEDULE */}
                        <div className="space-y-6">

                            {/* Campaign Designs Gallery - 1-Icon Photo Stack Component */}
                            <Card className="overflow-hidden rounded-3xl border-border bg-card shadow-sm isolate">
                                <CardHeader className="border-b p-4 sm:p-5 bg-muted/10">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2 text-base font-bold">
                                            <ImageIcon className="h-4 w-4 text-primary" />
                                            Campaign Visuals
                                        </CardTitle>
                                        <Badge variant="secondary" className="rounded-full px-2.5 text-xs font-semibold">
                                            {designs.length} {designs.length === 1 ? 'Asset' : 'Assets'}
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-8 sm:p-12 flex flex-col items-center justify-center min-h-[380px] isolate">
                                    {/* The 3-Photo Layered Stack (Sleek System Theme Design with Local Isolation) */}
                                    <div
                                        onClick={() => setIsGalleryModalOpen(true)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                setIsGalleryModalOpen(true);
                                            }
                                        }}
                                        className="group relative isolate cursor-pointer select-none transition-all duration-300 hover:scale-105 focus:outline-none"
                                        title="Click to view campaign visuals"
                                    >
                                        <div className="relative isolate w-56 h-64 sm:w-64 sm:h-72 flex items-center justify-center">
                                            {/* Back Photo (Layer 3) */}
                                            <div
                                                className="absolute inset-0 rounded-2xl bg-card border-2 border-border/70 shadow-md transition-transform duration-300 group-hover:rotate-[18deg] group-hover:translate-x-5 p-2.5 sm:p-3 flex flex-col ring-1 ring-border/40"
                                                style={{
                                                    transform: 'rotate(14deg) translate(14px, 10px)',
                                                    zIndex: 1,
                                                }}
                                            >
                                                <div className="flex-1 rounded-xl overflow-hidden bg-muted/40 border border-border/50 flex items-center justify-center">
                                                    {(designs[2] || designs[0])?.image_url ? (
                                                        <img
                                                            src={(designs[2] || designs[0]).image_url}
                                                            alt="Visual layer 3"
                                                            className="h-full w-full object-cover rounded-lg"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
                                                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                                                                <div className="h-8 w-8 rounded-full bg-muted-foreground/30" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="h-4 sm:h-5" />
                                            </div>

                                            {/* Middle Photo (Layer 2) */}
                                            <div
                                                className="absolute inset-0 rounded-2xl bg-card border-2 border-border/80 shadow-lg transition-transform duration-300 group-hover:rotate-[9deg] group-hover:translate-x-2.5 p-2.5 sm:p-3 flex flex-col ring-1 ring-border/50"
                                                style={{
                                                    transform: 'rotate(7deg) translate(7px, 5px)',
                                                    zIndex: 2,
                                                }}
                                            >
                                                <div className="flex-1 rounded-xl overflow-hidden bg-muted/50 border border-border/60 flex items-center justify-center">
                                                    {(designs[1] || designs[0])?.image_url ? (
                                                        <img
                                                            src={(designs[1] || designs[0]).image_url}
                                                            alt="Visual layer 2"
                                                            className="h-full w-full object-cover rounded-lg"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
                                                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                                                                <div className="h-8 w-8 rounded-full bg-muted-foreground/30" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="h-4 sm:h-5" />
                                            </div>

                                            {/* Front Photo (Layer 1) */}
                                            <div
                                                className="absolute inset-0 rounded-2xl bg-card border-2 border-border shadow-xl transition-transform duration-300 group-hover:-rotate-2 p-2.5 sm:p-3 flex flex-col ring-1 ring-primary/20"
                                                style={{
                                                    transform: 'rotate(0deg)',
                                                    zIndex: 3,
                                                }}
                                            >
                                                <div className="flex-1 rounded-xl overflow-hidden bg-muted/60 border border-border/70 flex items-center justify-center">
                                                    {designs[0]?.image_url ? (
                                                        <img
                                                            src={designs[0].image_url}
                                                            alt="Campaign visual front"
                                                            className="h-full w-full object-cover rounded-lg"
                                                        />
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                                                                <div className="h-9 w-9 rounded-full bg-muted-foreground/40" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="h-4 sm:h-5" />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Schedule & Timing */}
                            <Card className="rounded-2xl border-border shadow-sm">
                                <CardHeader className="border-b p-5 md:p-6">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <CalendarDays className="h-4 w-4 text-primary" />
                                        Campaign Timeline
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="p-5 md:p-6">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-xl border border-border bg-muted/20 p-4">
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-xs font-medium text-muted-foreground">
                                                    Start Date
                                                </span>
                                            </div>
                                            <p className="mt-2 text-sm font-semibold">
                                                {campaign?.start_date || 'Not set'}
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-border bg-muted/20 p-4">
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-xs font-medium text-muted-foreground">
                                                    End Date
                                                </span>
                                            </div>
                                            <p className="mt-2 text-sm font-semibold">
                                                {campaign?.end_date || 'Not set'}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT COLUMN: SIDEBAR */}
                        <div className="space-y-6">

                            {/* Event Details */}
                            <Card className="rounded-2xl border-border shadow-sm">
                                <CardHeader className="border-b p-5">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Tag className="h-4 w-4 text-primary" />
                                        Associated Event
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="p-5">
                                    <div className="rounded-xl border border-border bg-muted/20 p-4">
                                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                            Holiday / Event
                                        </p>
                                        <p className="mt-1 text-sm font-semibold">
                                            {campaign?.event_name ?? 'No event linked'}
                                        </p>
                                        {campaign?.event_date && (
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Event date: {campaign.event_date}
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
                    className="fixed inset-0 z-[150] overflow-y-auto overflow-x-hidden bg-black/95 backdrop-blur-2xl text-white dark select-none scroll-smooth animate-in fade-in duration-200"
                >
                    {/* Top Floating Control Bar (Sticky) */}
                    <div
                        className="sticky top-0 z-[160] flex w-full items-center justify-between bg-gradient-to-b from-black/95 via-black/85 to-transparent px-5 py-3.5 sm:px-8 border-b border-white/10 backdrop-blur-md"
                    >
                        <div className="flex items-center gap-3">
                            <h2 className="max-w-[200px] sm:max-w-md truncate text-sm sm:text-base font-semibold text-white">
                                {previewDesign.product_name || 'Campaign Visual'}
                            </h2>
                            <Badge variant="outline" className="border-white/20 text-white/90 text-[10px] hidden sm:inline-flex bg-white/5">
                                {campaign.name} {designs.length > 1 && `(${currentPreviewIndex + 1}/${designs.length})`}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Zoom Toggle Button */}
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
                                        onClick={() => downloadVisualAsFormat(previewDesign.image_url, `${campaign.name}-${previewDesign.product_name || 'visual'}`, 'png')}
                                        className="gap-2 text-xs font-medium cursor-pointer text-white hover:bg-white/20 focus:bg-white/20 focus:text-white"
                                    >
                                        <Download className="h-3.5 w-3.5 text-primary" />
                                        PNG (High Quality)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => downloadVisualAsFormat(previewDesign.image_url, `${campaign.name}-${previewDesign.product_name || 'visual'}`, 'jpeg')}
                                        className="gap-2 text-xs font-medium cursor-pointer text-white hover:bg-white/20 focus:bg-white/20 focus:text-white"
                                    >
                                        <Download className="h-3.5 w-3.5 text-blue-400" />
                                        JPEG (Web-Optimized)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => downloadVisualAsFormat(previewDesign.image_url, `${campaign.name}-${previewDesign.product_name || 'visual'}`, 'svg')}
                                        className="gap-2 text-xs font-medium cursor-pointer text-white hover:bg-white/20 focus:bg-white/20 focus:text-white"
                                    >
                                        <Download className="h-3.5 w-3.5 text-emerald-400" />
                                        SVG (Vector Embed)
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <button
                                type="button"
                                onClick={closePreview}
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
                            onClick={handlePrevDesign}
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
                            onClick={handleNextDesign}
                            className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-[170] flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-full bg-black/60 text-white/85 backdrop-blur-md border border-white/20 hover:bg-black/90 hover:text-white hover:border-white/40 hover:scale-110 active:scale-95 transition-all duration-200 shadow-2xl cursor-pointer"
                            title="Next visual (→)"
                            aria-label="Next image"
                        >
                            <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7" />
                        </button>
                    )}

                    {/* Section 1: Full-view Image Canvas */}
                    <div
                        className="group/canvas relative flex min-h-[calc(100vh-4.5rem)] w-full flex-col items-center justify-center p-4 sm:p-8"
                    >
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <div className="h-[450px] w-[450px] rounded-full bg-gradient-to-tr from-primary/20 via-blue-500/10 to-transparent blur-3xl opacity-40" />
                        </div>

                        {previewDesign.image_url ? (
                            <img
                                src={previewDesign.image_url}
                                alt={previewDesign.product_name || 'Campaign visual'}
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

                        {/* Floating Scroll Down Indicator */}
                        <button
                            type="button"
                            onClick={() => {
                                const el = document.getElementById('campaign-modal-details');
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
                        id="campaign-modal-details"
                        className="relative z-30 w-full bg-slate-950/98 backdrop-blur-3xl px-4 pb-16 pt-8 sm:px-8 border-t border-white/20"
                    >
                        <div className="mx-auto max-w-3xl space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/15 pb-4">
                                <div>
                                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary text-primary-foreground font-black text-xs shadow-lg shadow-primary/30 tracking-wider uppercase">
                                        <Sparkles className="h-4 w-4" />
                                        Visual Creative Details
                                    </div>
                                    <h3 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
                                        {previewDesign.product_name || 'Campaign Visual'}
                                    </h3>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        asChild
                                        size="sm"
                                        className="h-9 px-4 gap-2 text-xs font-bold shadow-lg shadow-primary/30 hover:scale-105 transition-all bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                                    >
                                        <Link
                                            href={`/generator?event_id=${campaign?.event_id || ''}&campaign_id=${campaign.id}&product_name=${encodeURIComponent(
                                                previewDesign.product_name || '',
                                            )}&price=${encodeURIComponent(previewDesign.price || '')}&tagline=${encodeURIComponent(previewDesign.tagline || '')}&prompt=${encodeURIComponent(previewDesign.prompt || '')}&aspect_ratio=${encodeURIComponent(previewDesign.aspect_ratio || '1:1')}`}
                                        >
                                            <Sparkles className="h-4 w-4" />
                                            Edit in AI Studio
                                        </Link>
                                    </Button>
                                </div>
                            </div>

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

                            <div className="group rounded-2xl border border-white/20 bg-slate-900/90 p-5 backdrop-blur-2xl shadow-lg transition-all duration-300 hover:border-white/30">
                                <div className="inline-block px-2.5 py-0.5 rounded bg-white/15 text-[11px] font-extrabold uppercase tracking-wider text-white">
                                    AI Prompt & Concept
                                </div>
                                <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-white/95 font-medium">
                                    {previewDesign.prompt || `${campaign.name} visual creative tailored for high engagement.`}
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="group rounded-2xl border border-white/20 bg-slate-900/90 p-4 sm:p-5 backdrop-blur-2xl shadow-md transition-all hover:border-white/30 hover:-translate-y-0.5">
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

                                <div className="group rounded-2xl border border-white/20 bg-slate-900/90 p-4 sm:p-5 backdrop-blur-2xl shadow-md transition-all hover:border-white/30 hover:-translate-y-0.5">
                                    <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-white/70">
                                        <Layers className="h-3.5 w-3.5 text-primary" />
                                        Campaign
                                    </div>
                                    <p className="mt-2 truncate text-base font-bold text-white">
                                        {campaign.name}
                                    </p>
                                </div>

                                <div className="group rounded-2xl border border-white/20 bg-slate-900/90 p-4 sm:p-5 backdrop-blur-2xl shadow-md transition-all hover:border-white/30 hover:-translate-y-0.5">
                                    <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-white/70">
                                        <CalendarDays className="h-3.5 w-3.5 text-primary" />
                                        Created
                                    </div>
                                    <p className="mt-2 truncate text-base font-bold text-white">
                                        {previewDesign.created_at || 'Saved Visual'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/15">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-bold text-white/80 mr-1">Download as:</span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => downloadVisualAsFormat(previewDesign.image_url, `${campaign.name}-${previewDesign.product_name || 'visual'}`, 'png')}
                                        className="gap-1.5 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all shadow-none cursor-pointer"
                                    >
                                        <Download className="h-3.5 w-3.5 text-primary" />
                                        PNG
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => downloadVisualAsFormat(previewDesign.image_url, `${campaign.name}-${previewDesign.product_name || 'visual'}`, 'jpeg')}
                                        className="gap-1.5 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all shadow-none cursor-pointer"
                                    >
                                        <Download className="h-3.5 w-3.5 text-blue-400" />
                                        JPEG
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => downloadVisualAsFormat(previewDesign.image_url, `${campaign.name}-${previewDesign.product_name || 'visual'}`, 'svg')}
                                        className="gap-1.5 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all shadow-none cursor-pointer"
                                    >
                                        <Download className="h-3.5 w-3.5 text-emerald-400" />
                                        SVG
                                    </Button>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={closePreview}
                                    className="h-8 px-4 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white transition-all cursor-pointer"
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
                                Update campaign name, status, and scheduled timeline.
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
                                    className={editErrors.name ? 'border-destructive' : ''}
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
                                        <option value="draft">Draft</option>
                                        <option value="scheduled">Scheduled</option>
                                        <option value="active">Active</option>
                                        <option value="completed">Completed</option>
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
                                        <option value="">No linked event</option>
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
                            ? This will remove the campaign record. Associated designs will remain safe in My Designs.
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
                    className="max-h-[85vh] flex flex-col overflow-hidden rounded-3xl p-0 sm:max-w-3xl border-border bg-card shadow-2xl"
                >
                    <DialogHeader className="border-b border-border p-4 sm:p-5 bg-muted/20 shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                                    <ImageIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-lg sm:text-xl font-bold text-foreground">
                                        Campaign Visuals
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                        {campaign.name} &bull; {designs.length} {designs.length === 1 ? 'creative asset' : 'creative assets'}
                                    </DialogDescription>
                                </div>
                            </div>

                            {designs.length > 0 && available_designs.length > 0 && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setIsAddExistingOpen(true)}
                                    className="h-8 gap-1.5 text-xs rounded-xl shadow-none mr-2"
                                >
                                    <FolderPlus className="h-3.5 w-3.5" />
                                    Add Existing
                                </Button>
                            )}

                            {designs.length > 0 && (
                                <Button asChild size="sm" className="h-8 gap-1.5 text-xs rounded-xl shadow-none mr-6">
                                    <Link href={`/generator?campaign_id=${campaign.id}${campaign.event_id ? `&event_id=${campaign.event_id}` : ''}${campaign.product_name ? `&product_name=${encodeURIComponent(campaign.product_name)}` : ''}`}>
                                        <Plus className="h-3.5 w-3.5" />
                                        Generate Visual
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-6">
                        {designs.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <ImageIcon className="h-8 w-8" />
                                </div>
                                <div className="space-y-1 max-w-sm">
                                    <h3 className="text-base font-bold text-foreground">No Campaign Visuals Yet</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        There are currently no visual assets generated or linked to this campaign. Generate AI marketing creatives tailored to this campaign.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    {available_designs.length > 0 && (
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsAddExistingOpen(true)}
                                            className="gap-2 text-xs rounded-xl shadow-sm"
                                        >
                                            <FolderPlus className="h-4 w-4" />
                                            Add Existing Visual
                                        </Button>
                                    )}
                                    <Button asChild className="gap-2 text-xs rounded-xl shadow-sm">
                                        <Link href={`/generator?campaign_id=${campaign.id}${campaign.event_id ? `&event_id=${campaign.event_id}` : ''}${campaign.product_name ? `&product_name=${encodeURIComponent(campaign.product_name)}` : ''}`}>
                                            <Sparkles className="h-4 w-4" />
                                            Generate Visuals in AI Studio
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                                {designs.map((design: any, index: number) => (
                                    <div
                                        key={design.id || index}
                                        onClick={() => openPreview(design)}
                                        className="group relative aspect-square w-full rounded-2xl overflow-hidden bg-muted/20 border border-border cursor-pointer shadow-xs hover:shadow-xl hover:border-primary/50 transition-all duration-300"
                                    >
                                        {design.image_url ? (
                                            <img
                                                src={design.image_url}
                                                alt={design.product_name || `Visual #${index + 1}`}
                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
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
                <DialogContent className="rounded-2xl sm:max-w-2xl max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-lg flex items-center gap-2">
                            <FolderPlus className="h-5 w-5 text-amber-500" />
                            Add Existing Visuals
                        </DialogTitle>
                        <DialogDescription>
                            {campaign.event_name ? (
                                <span>
                                    Select visuals created specifically for <span className="font-semibold text-amber-500">{campaign.event_name}</span> to link to <span className="font-semibold text-foreground">"{campaign.name}"</span>.
                                </span>
                            ) : (
                                <span>
                                    This campaign does not have an assigned event/holiday.
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto min-h-0 mt-2">
                        {!campaign.event_id ? (
                            <div className="py-8 text-center space-y-2">
                                <p className="text-sm font-medium text-foreground">No Event Associated</p>
                                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                    Visuals can only be attached to campaigns created for a specific holiday or event. Edit this campaign to assign an event.
                                </p>
                            </div>
                        ) : available_designs.length === 0 ? (
                            <div className="py-8 text-center space-y-3">
                                <p className="text-sm font-medium text-foreground">
                                    No Visuals Found for {campaign.event_name}
                                </p>
                                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                    You don't have any existing visuals created for this event. Generate a new visual tailored to this campaign in AI Studio.
                                </p>
                                <Button asChild size="sm" className="gap-2 text-xs rounded-xl shadow-xs">
                                    <Link href={`/generator?campaign_id=${campaign.id}${campaign.event_id ? `&event_id=${campaign.event_id}` : ''}${campaign.product_name ? `&product_name=${encodeURIComponent(campaign.product_name)}` : ''}`}>
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Generate Visual in AI Studio
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {available_designs.map((d: any) => {
                                    const isChosen = existingDesignIds.includes(d.id);
                                    return (
                                        <button
                                            key={d.id}
                                            type="button"
                                            onClick={() => toggleExistingDesign(d.id)}
                                            className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer group ${
                                                isChosen
                                                    ? 'border-primary ring-2 ring-primary/40 shadow-lg'
                                                    : 'border-amber-400/50 hover:border-amber-400'
                                            }`}
                                        >
                                            {d.image_url ? (
                                                <img
                                                    src={d.image_url}
                                                    alt={d.product_name || 'Visual'}
                                                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                                                    <ImageIcon className="h-6 w-6 opacity-40" />
                                                </div>
                                            )}

                                            {isChosen && (
                                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                                                        <Check className="h-4 w-4 stroke-[3]" />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
                                                <p className="text-[10px] font-medium text-white truncate">
                                                    {d.product_name || 'Untitled'}
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
                            disabled={isAttachingExisting || existingDesignIds.length === 0}
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
| LIFECYCLE COMPONENT
|--------------------------------------------------------------------------
*/

function CampaignLifecycle({ status }: { status: string }) {
    const statuses = [
        { key: 'draft', label: 'Draft' },
        { key: 'scheduled', label: 'Scheduled' },
        { key: 'active', label: 'Active' },
        { key: 'completed', label: 'Completed' },
    ];

    const currentIndex = statuses.findIndex((item) => item.key === status);

    return (
        <div className="space-y-3">
            {statuses.map((item, index) => {
                const isCurrent = index === currentIndex;
                const isComplete = currentIndex >= 0 && index < currentIndex;

                return (
                    <div key={item.key} className="flex items-center gap-3">
                        <div
                            className={`
                                flex
                                h-7
                                w-7
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                text-[10px]
                                font-semibold
                                ${isCurrent
                                    ? 'bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20'
                                    : isComplete
                                        ? 'bg-primary/10 text-primary'
                                        : 'bg-muted text-muted-foreground'
                                }
                            `}
                        >
                            {isComplete ? <Check className="h-3.5 w-3.5" /> : index + 1}
                        </div>

                        <span
                            className={`
                                text-sm
                                ${isCurrent
                                    ? 'font-semibold text-foreground'
                                    : 'text-muted-foreground'
                                }
                            `}
                        >
                            {item.label}
                        </span>
                    </div>
                );
            })}
        </div>
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