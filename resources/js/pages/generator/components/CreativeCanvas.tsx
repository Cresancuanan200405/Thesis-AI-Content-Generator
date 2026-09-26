import { useState } from 'react';
import { Link } from '@inertiajs/react';
import {
    Check,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Cpu,
    Download,
    Edit3,
    Eye,
    FileText,
    Loader2,
    RefreshCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GeneratedDesign, ImageQuality } from './types';

interface CreativeCanvasProps {
    productName: string;
    tagline?: string;
    price?: string;
    imageModel: string;
    imageQuality: ImageQuality;
    aspectRatio: string;
    savedDesign: GeneratedDesign | null;
    isSavedToDesigns: boolean;
    isSavingDesign: boolean;
    onSaveToDesigns: () => void;
    isSavedAsDraft?: boolean;
    isSavingDraft?: boolean;
    onSaveAsDraft?: () => void;
    onDownload: (format: 'png' | 'jpeg') => void;
    onOpenFullscreen: () => void;
    onViewGeneratedCreative?: () => void;
    onEditParameters: () => void;
    onRegenerate: () => void;
    creativeConcept?: string;
    visualStrategy?: string;
    designTreatment?: string;
    copyEmphasis?: string;
    hasReferenceImage?: boolean;
    eventName?: string;
    showEventText?: boolean;
    designId?: string | number | null;
    origin?: string | null;
    campaignId?: string | number | null;
    campaignName?: string | null;
}

export function CreativeCanvas({
    productName,
    tagline,
    price,
    imageModel,
    imageQuality,
    aspectRatio,
    savedDesign,
    isSavedToDesigns,
    isSavingDesign,
    onSaveToDesigns,
    isSavedAsDraft = false,
    isSavingDraft = false,
    onSaveAsDraft,
    onDownload,
    onOpenFullscreen,
    onViewGeneratedCreative,
    onEditParameters,
    onRegenerate,
    creativeConcept,
    visualStrategy,
    designTreatment,
    copyEmphasis,
    hasReferenceImage = false,
    eventName,
    showEventText,
    designId,
    origin,
    campaignId,
    campaignName,
}: CreativeCanvasProps) {
    const [isTechDetailsExpanded, setIsTechDetailsExpanded] = useState(false);
    const [showContext, setShowContext] = useState(false);

    const handleViewCreative = onViewGeneratedCreative || onOpenFullscreen;

    const hasContextContent = Boolean(
        tagline || creativeConcept || visualStrategy || designTreatment || copyEmphasis,
    );

    const isFinalStatus = isSavedToDesigns || savedDesign?.status === 'final' || savedDesign?.status === 'completed';
    const isDraftStatus = isSavedAsDraft || savedDesign?.status === 'draft';

    return (
        <Card className="mx-auto max-w-3xl overflow-hidden rounded-2xl border-border bg-card shadow-sm">
            <CardHeader className="border-b p-5 md:p-6">
                {/* Breadcrumb Navigation */}
                <nav
                    aria-label="Breadcrumb"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                    {origin === 'designs' ? (
                        <Link
                            href="/designs"
                            className="hover:text-foreground transition-colors"
                        >
                            My Designs
                        </Link>
                    ) : (
                        <Link
                            href={campaignId ? `/campaigns/${campaignId}` : '/campaigns'}
                            className="hover:text-foreground transition-colors"
                        >
                            {campaignName || 'Campaigns'}
                        </Link>
                    )}
                    <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
                    <button
                        type="button"
                        onClick={onEditParameters}
                        className="hover:text-foreground transition-colors cursor-pointer"
                    >
                        Generator
                    </button>
                    <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
                    <span className="font-semibold text-foreground">
                        Creative Canvas
                    </span>
                </nav>

                {/* Header Title & Context Toggle Button */}
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold tracking-tight text-foreground">
                                Visual Creative Ready
                            </h2>
                            {(isFinalStatus || isDraftStatus) && (
                                <span className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${
                                    isFinalStatus
                                        ? 'border-primary/40 bg-primary/10 text-primary'
                                        : 'border-border/80 bg-muted/50 text-muted-foreground'
                                }`}>
                                    Status: {isFinalStatus ? 'FINAL' : 'DRAFT'}
                                </span>
                            )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            High-resolution commercial creative generated for {productName}
                        </p>
                    </div>

                    {hasContextContent && (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowContext(!showContext)}
                                className="text-xs font-semibold text-primary hover:underline transition-colors cursor-pointer"
                            >
                                {showContext ? 'Hide Context' : 'Show Context'}
                            </button>
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-6 p-5 md:p-6">
                <div className="animate-in space-y-6 duration-300 fade-in">
                    {/* Expandable Creative Context Section */}
                    {showContext && hasContextContent && (
                        <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4 transition-all">
                            <div className="flex items-center justify-between border-b border-border/60 pb-2">
                                <span className="text-xs font-semibold text-foreground">
                                    Creative Context & Direction
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setShowContext(false)}
                                    className="text-[11px] text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
                                >
                                    Hide Context
                                </button>
                            </div>

                            {(designTreatment || copyEmphasis) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                    {designTreatment && (
                                        <div className="rounded-md border border-border/70 bg-card p-2">
                                            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                                Treatment
                                            </span>
                                            <p className="mt-0.5 font-medium text-foreground">
                                                {designTreatment}
                                            </p>
                                        </div>
                                    )}
                                    {copyEmphasis && (
                                        <div className="rounded-md border border-border/70 bg-card p-2">
                                            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                                Copy Emphasis
                                            </span>
                                            <p className="mt-0.5 font-medium text-foreground">
                                                {copyEmphasis}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {tagline && (
                                <div className="rounded-md border border-border/70 bg-card p-2.5 text-xs">
                                    <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                        Headline Tagline
                                    </span>
                                    <p className="mt-0.5 text-sm font-semibold italic text-foreground">
                                        "{tagline}"
                                    </p>
                                </div>
                            )}

                            {creativeConcept && (
                                <div className="space-y-1.5 rounded-md border border-border/70 bg-card p-2.5 text-xs">
                                    <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                        Creative Concept
                                    </span>
                                    <p className="text-xs leading-relaxed text-foreground">
                                        {creativeConcept}
                                    </p>
                                    {visualStrategy && (
                                        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground border-t border-border/50 pt-1.5">
                                            <strong className="text-foreground/90 font-medium">Visual Strategy:</strong>{' '}
                                            {visualStrategy}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* CLICKABLE GENERATED VISUAL */}
                    <div
                        onClick={handleViewCreative}
                        className="group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:border-primary/50"
                    >
                        {/* Clean Structured Meta Bar (No capsule pills, No AI snaps) */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-2.5 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">{productName}</span>
                                {hasReferenceImage && (
                                    <span className="rounded-md border border-border/80 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
                                        Product Reference
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="rounded-md border border-border bg-background px-2 py-0.5 font-mono text-[10px] font-medium text-foreground">
                                    {imageModel || 'GPT-Image-2'}
                                </span>
                                <span className="rounded-md border border-border bg-background px-2 py-0.5 font-mono text-[10px] font-medium uppercase text-foreground">
                                    {imageQuality || 'medium'}
                                </span>
                                <span className="rounded-md border border-border bg-background px-2 py-0.5 font-mono text-[10px] font-medium text-foreground">
                                    {aspectRatio || '1:1'}
                                </span>
                                {isSavedToDesigns && (
                                    <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary">
                                        Saved
                                    </span>
                                )}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewCreative();
                                    }}
                                    className="h-6 gap-1 px-2 text-[11px] font-semibold text-primary hover:text-primary hover:bg-primary/10 cursor-pointer"
                                >
                                    <Eye className="h-3 w-3" />
                                    View
                                </Button>
                            </div>
                        </div>

                        {/* Generated Visual Canvas */}
                        <div className="flex min-h-[360px] items-center justify-center overflow-hidden rounded-b-xl bg-muted/15 p-3 sm:p-5">
                            {savedDesign?.image_url ? (
                                <div className="relative flex max-h-[520px] w-full items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-background/50 shadow-md">
                                    <img
                                        src={savedDesign.image_url}
                                        alt={productName}
                                        className="max-h-[500px] w-auto max-w-full rounded-md object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                                    />
                                    <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/60 via-transparent to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                                        <span className="flex items-center gap-1.5 rounded-md bg-black/80 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur-md">
                                            <Eye className="h-3.5 w-3.5 text-primary" />
                                            Click to View Generated Creative
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full max-w-md space-y-3 rounded-lg border border-border bg-card p-6 text-center text-card-foreground">
                                    <h3 className="text-xl font-bold">{productName}</h3>
                                    {tagline && (
                                        <p className="text-xs font-medium text-muted-foreground">
                                            "{tagline}"
                                        </p>
                                    )}
                                    {price && (
                                        <p className="text-base font-bold text-primary">
                                            ₱{Number(price).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status Alert */}
                    <div
                        className={`rounded-lg border p-3.5 ${
                            isSavedToDesigns
                                ? 'border-primary/30 bg-primary/10'
                                : 'border-border bg-muted/20'
                        }`}
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <Check
                                    className={`h-4 w-4 ${
                                        isSavedToDesigns
                                            ? 'text-primary'
                                            : 'text-foreground'
                                    }`}
                                />
                                <p className="text-xs font-semibold">
                                    {isSavedToDesigns
                                        ? 'Visual successfully saved to My Designs'
                                        : 'Visual ready — save to keep in your library'}
                                </p>
                            </div>
                            {isSavedToDesigns && (
                                <Button
                                    asChild
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs text-primary hover:text-primary/80"
                                >
                                    <Link href="/designs">Open Designs →</Link>
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="space-y-3">
                        <div className={`grid gap-2.5 ${onSaveAsDraft && !isSavedToDesigns ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'}`}>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleViewCreative}
                                className="h-10 rounded-lg gap-2 text-xs font-semibold shadow-xs hover:bg-accent border-border cursor-pointer"
                            >
                                <Eye className="h-4 w-4 text-primary" />
                                View Generated Creative
                            </Button>

                            {onSaveAsDraft && !isSavedToDesigns && (
                                <Button
                                    type="button"
                                    onClick={onSaveAsDraft}
                                    disabled={isSavingDraft || isSavingDesign}
                                    variant="outline"
                                    className={`h-10 rounded-lg text-xs font-semibold shadow-xs ${
                                        isDraftStatus
                                            ? 'border-border bg-muted/40 text-foreground'
                                            : ''
                                    }`}
                                >
                                    {isSavingDraft ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <FileText className="mr-2 h-4 w-4" />
                                    )}
                                    {isDraftStatus ? 'Draft saved' : 'Save as Draft'}
                                </Button>
                            )}

                            <Button
                                type="button"
                                onClick={onSaveToDesigns}
                                disabled={isSavingDesign || isSavingDraft}
                                variant={isSavedToDesigns ? 'outline' : 'default'}
                                className={`h-10 rounded-lg text-xs font-semibold shadow-xs ${
                                    isSavedToDesigns
                                        ? 'border-primary/40 bg-primary/10 text-primary'
                                        : ''
                                }`}
                            >
                                {isSavingDesign ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Check className="mr-2 h-4 w-4" />
                                )}
                                {isSavedToDesigns
                                    ? 'Saved in Designs'
                                    : isDraftStatus
                                      ? 'Finalize Design'
                                      : 'Save to Designs'}
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-10 rounded-lg gap-1.5 text-xs font-semibold shadow-none"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download Visual
                                        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="center"
                                    className="w-52 rounded-lg border-border p-1.5 shadow-lg"
                                >
                                    <DropdownMenuItem
                                        onClick={() => onDownload('png')}
                                        className="cursor-pointer gap-2 text-xs font-medium"
                                    >
                                        <Download className="h-3.5 w-3.5 text-primary" />
                                        PNG (High Quality)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => onDownload('jpeg')}
                                        className="cursor-pointer gap-2 text-xs font-medium"
                                    >
                                        <Download className="h-3.5 w-3.5 text-blue-500" />
                                        JPEG (Web-Optimized)
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Sub actions */}
                        <div className="flex items-center justify-between border-t border-border/60 pt-2.5">
                            <button
                                type="button"
                                onClick={onEditParameters}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            >
                                <Edit3 className="h-3.5 w-3.5" />
                                Edit Parameters
                            </button>

                            <button
                                type="button"
                                onClick={handleViewCreative}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
                            >
                                <Eye className="h-3.5 w-3.5 text-primary" />
                                View Generated Creative
                            </button>

                            <button
                                type="button"
                                onClick={onRegenerate}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline transition-colors cursor-pointer"
                            >
                                <RefreshCcw className="h-3.5 w-3.5" />
                                Regenerate Variation
                            </button>
                        </div>

                        {/* Technical Generation Details Accordion */}
                        <div className="overflow-hidden rounded-lg border border-border/80 bg-card">
                            <button
                                type="button"
                                onClick={() =>
                                    setIsTechDetailsExpanded(!isTechDetailsExpanded)
                                }
                                className="flex w-full items-center justify-between p-3.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/30 cursor-pointer"
                            >
                                <div className="flex items-center gap-2">
                                    <Cpu className="h-4 w-4 text-muted-foreground" />
                                    <span>Generation Details</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <span className="text-[11px]">
                                        Technical Summary
                                    </span>
                                    {isTechDetailsExpanded ? (
                                        <ChevronUp className="h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4" />
                                    )}
                                </div>
                            </button>
                            {isTechDetailsExpanded && (
                                <div className="space-y-2.5 border-t border-border/60 p-3.5">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                        <div className="rounded-md border border-border/60 bg-muted/20 p-2.5">
                                            <p className="font-mono text-[10px] font-semibold text-muted-foreground uppercase">
                                                Model
                                            </p>
                                            <p className="mt-0.5 font-semibold text-foreground">
                                                {imageModel || 'GPT-Image-2'}
                                            </p>
                                        </div>
                                        <div className="rounded-md border border-border/60 bg-muted/20 p-2.5">
                                            <p className="font-mono text-[10px] font-semibold text-muted-foreground uppercase">
                                                Method
                                            </p>
                                            <p className="mt-0.5 font-semibold text-foreground">
                                                {hasReferenceImage
                                                    ? 'Image-to-Image Edit'
                                                    : 'Text-to-Image'}
                                            </p>
                                        </div>
                                        <div className="rounded-md border border-border/60 bg-muted/20 p-2.5">
                                            <p className="font-mono text-[10px] font-semibold text-muted-foreground uppercase">
                                                Aspect Ratio
                                            </p>
                                            <p className="mt-0.5 font-semibold text-foreground">
                                                {aspectRatio || '1:1'}
                                            </p>
                                        </div>
                                        <div className="rounded-md border border-border/60 bg-muted/20 p-2.5">
                                            <p className="font-mono text-[10px] font-semibold text-muted-foreground uppercase">
                                                Safe Margin
                                            </p>
                                            <p className="mt-0.5 font-semibold text-foreground">
                                                20% Safe Zone
                                            </p>
                                        </div>
                                        <div className="rounded-md border border-border/60 bg-muted/20 p-2.5">
                                            <p className="font-mono text-[10px] font-semibold text-muted-foreground uppercase">
                                                Status
                                            </p>
                                            <p className={`mt-0.5 font-semibold ${
                                                isFinalStatus
                                                    ? 'text-primary'
                                                    : 'text-muted-foreground'
                                            }`}>
                                                {isFinalStatus ? 'FINAL' : isDraftStatus ? 'DRAFT' : 'READY'}
                                            </p>
                                        </div>
                                        {savedDesign?.generation_meta?.duration_seconds && (
                                            <div className="rounded-md border border-border/60 bg-muted/20 p-2.5">
                                                <p className="font-mono text-[10px] font-semibold text-muted-foreground uppercase">
                                                    Duration
                                                </p>
                                                <p className="mt-0.5 font-semibold text-foreground">
                                                    {savedDesign.generation_meta.duration_seconds}s
                                                </p>
                                            </div>
                                        )}
                                        {Boolean(eventName || savedDesign?.generation_meta?.event_name) && (
                                            <>
                                                <div className="rounded-md border border-border/60 bg-muted/20 p-2.5">
                                                    <p className="font-mono text-[10px] font-semibold text-muted-foreground uppercase">
                                                        Event / Holiday
                                                    </p>
                                                    <p className="mt-0.5 font-semibold text-foreground">
                                                        {eventName || savedDesign?.generation_meta?.event_name}
                                                    </p>
                                                </div>
                                                <div className="rounded-md border border-border/60 bg-muted/20 p-2.5">
                                                    <p className="font-mono text-[10px] font-semibold text-muted-foreground uppercase">
                                                        Event Visual Influence
                                                    </p>
                                                    <p className="mt-0.5 font-semibold text-foreground">
                                                        Included
                                                    </p>
                                                </div>
                                                <div className="rounded-md border border-border/60 bg-muted/20 p-2.5">
                                                    <p className="font-mono text-[10px] font-semibold text-muted-foreground uppercase">
                                                        Show Event/Holiday Text
                                                    </p>
                                                    <p className="mt-0.5 font-semibold text-foreground">
                                                        {(typeof showEventText === 'boolean'
                                                            ? showEventText
                                                            : (savedDesign?.generation_meta?.show_event_text ?? true))
                                                            ? 'On'
                                                            : 'Off'}
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
