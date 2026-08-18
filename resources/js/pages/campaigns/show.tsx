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
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
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
}: any) {
    const designs: any[] = campaign?.designs ?? [];
    const status = campaign?.status ?? 'draft';

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    /* Preview Modal State */
    const [previewDesign, setPreviewDesign] = useState<any>(null);
    const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

    const openPreview = (design: any) => {
        setPreviewDesign(design);
        setIsDetailsExpanded(false);
    };

    const currentPreviewIndex = designs.findIndex((d) => d.id === previewDesign?.id);

    const handlePrevDesign = () => {
        if (currentPreviewIndex > 0) {
            setPreviewDesign(designs[currentPreviewIndex - 1]);
        }
    };

    const handleNextDesign = () => {
        if (currentPreviewIndex < designs.length - 1) {
            setPreviewDesign(designs[currentPreviewIndex + 1]);
        }
    };

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
                                <Button asChild className="group gap-2 shadow-sm">
                                    <Link href={campaign?.generator_url ?? '/generator'}>
                                        <Sparkles className="h-4 w-4" />
                                        Create Design
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </Button>

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

                            {/* Campaign Designs Gallery */}
                            <Card className="overflow-hidden rounded-2xl border-border shadow-sm">
                                <CardHeader className="border-b p-5 md:p-6">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                <ImageIcon className="h-4 w-4 text-primary" />
                                                Campaign Visuals
                                            </CardTitle>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Creative visual assets created and scheduled for this campaign.
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {designs.length > 0 && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openPreview(designs[0])}
                                                    className="gap-1.5 text-xs shadow-none"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    See Generated Images
                                                </Button>
                                            )}

                                            <Badge variant="secondary" className="rounded-full px-2.5 text-xs">
                                                {designs.length}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-5 md:p-6">
                                    {designs.length === 0 ? (
                                        <div className="rounded-2xl border border-dashed border-border bg-muted/10 px-6 py-12 text-center">
                                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                                <ImageIcon className="h-6 w-6" />
                                            </div>

                                            <p className="mt-4 text-sm font-semibold">
                                                No visual assets linked yet
                                            </p>

                                            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                                                Use AI Marketing Studio to generate promotional designs specifically for this campaign.
                                            </p>

                                            <Button asChild size="sm" className="mt-4 gap-2 shadow-sm">
                                                <Link href={campaign?.generator_url ?? '/generator'}>
                                                    <Plus className="h-3.5 w-3.5" />
                                                    Create First Design
                                                </Link>
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {designs.map((design: any) => (
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
                                                    className="group relative flex items-center gap-3.5 overflow-hidden rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/40 hover:shadow-sm cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-primary/40"
                                                >
                                                    {design.image_url ? (
                                                        <img
                                                            src={design.image_url}
                                                            alt={design.product_name ?? 'Campaign design'}
                                                            className="h-16 w-16 shrink-0 rounded-lg object-cover border border-border/50 transition-transform group-hover:scale-105"
                                                        />
                                                    ) : (
                                                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                                            <ImageIcon className="h-5 w-5" />
                                                        </div>
                                                    )}

                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                                            {design.product_name ?? 'Design'}
                                                        </p>

                                                        {design.tagline && (
                                                            <p className="truncate text-xs text-muted-foreground italic">
                                                                "{design.tagline}"
                                                            </p>
                                                        )}

                                                        <div className="mt-1 flex items-center gap-2">
                                                            <Badge
                                                                variant="outline"
                                                                className="text-[10px] capitalize text-muted-foreground"
                                                            >
                                                                {design.status ?? 'saved'}
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openPreview(design);
                                                        }}
                                                        className="text-xs font-medium text-primary hover:text-primary/80 transition-colors px-2 py-1"
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
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
                VISUAL PREVIEW MODAL WITH FADED ARROW DOWN EXPANDER
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
                                            {previewDesign.product_name || 'Campaign Visual'}
                                        </DialogTitle>
                                        <DialogDescription className="text-xs text-muted-foreground">
                                            Campaign: {campaign.name} {designs.length > 1 && `(${currentPreviewIndex + 1} of ${designs.length})`}
                                        </DialogDescription>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {designs.length > 1 && (
                                            <div className="flex items-center gap-1 mr-1">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={handlePrevDesign}
                                                    disabled={currentPreviewIndex <= 0}
                                                    className="h-8 w-8 rounded-lg shadow-none"
                                                    aria-label="Previous image"
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={handleNextDesign}
                                                    disabled={currentPreviewIndex >= designs.length - 1}
                                                    className="h-8 w-8 rounded-lg shadow-none"
                                                    aria-label="Next image"
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}

                                        {previewDesign.image_url && (
                                            <a
                                                href={previewDesign.download_url || previewDesign.image_url}
                                                download={`${campaign.name}-${previewDesign.product_name || 'design'}.svg`}
                                                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                                Download
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </DialogHeader>

                            {/* Main Image Display */}
                            <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/40 flex items-center justify-center min-h-[300px] max-h-[460px]">
                                {previewDesign.image_url ? (
                                    <img
                                        src={previewDesign.image_url}
                                        alt={previewDesign.product_name || 'Campaign visual'}
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
                                            : 'View description & details'}
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
                                                'AI marketing creative tailored for this campaign, generated for maximum brand consistency and visual impact.'}
                                        </p>
                                    </div>

                                    {/* Metadata Grid */}
                                    <div className="grid gap-2.5 sm:grid-cols-2">
                                        <div className="rounded-xl border border-border bg-card p-3">
                                            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                <Layers className="h-3 w-3" />
                                                Campaign
                                            </div>
                                            <p className="mt-1 truncate text-xs font-semibold text-foreground">
                                                {campaign.name}
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-border bg-card p-3">
                                            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                <Tag className="h-3 w-3" />
                                                Event
                                            </div>
                                            <p className="mt-1 truncate text-xs font-semibold text-foreground">
                                                {campaign?.event_name || 'General marketing'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Buttons Strip */}
                                    <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-border/50">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                router.visit(
                                                    `/generator?product_name=${encodeURIComponent(
                                                        previewDesign.product_name || '',
                                                    )}&campaign=${campaign.id}`,
                                                );
                                            }}
                                            className="gap-1.5 text-xs shadow-none"
                                        >
                                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                                            Edit in AI Studio
                                        </Button>

                                        {previewDesign.image_url && (
                                            <a
                                                href={previewDesign.download_url || previewDesign.image_url}
                                                download={`${campaign.name}-${previewDesign.product_name || 'design'}.svg`}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                                Download Visual
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
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