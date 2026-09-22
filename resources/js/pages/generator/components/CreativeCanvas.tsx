import { useState } from 'react';
import { Link } from '@inertiajs/react';
import {
    Check,
    ChevronDown,
    ChevronUp,
    Cpu,
    Download,
    Edit3,
    Loader2,
    RefreshCcw,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
    onDownload: (format: 'png' | 'jpeg' | 'svg') => void;
    onOpenFullscreen: () => void;
    onEditParameters: () => void;
    onRegenerate: () => void;
    creativeConcept?: string;
    visualStrategy?: string;
    hasReferenceImage?: boolean;
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
    onDownload,
    onOpenFullscreen,
    onEditParameters,
    onRegenerate,
    creativeConcept,
    visualStrategy,
    hasReferenceImage = false,
}: CreativeCanvasProps) {
    const [isTechDetailsExpanded, setIsTechDetailsExpanded] = useState(false);

    return (
        <Card className="mx-auto max-w-3xl overflow-hidden rounded-3xl border-border bg-card shadow-sm">
            <CardHeader className="border-b p-5 md:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Creative Generation
                        </p>
                        <h2 className="mt-1 text-lg font-bold">
                            Visual Creative Ready
                        </h2>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Sparkles className="h-4 w-4" />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6 p-5 md:p-7">
                <div className="animate-in space-y-6 duration-300 fade-in">
                    {/* CLICKABLE GENERATED VISUAL */}
                    <div
                        onClick={onOpenFullscreen}
                        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:border-primary/50"
                    >
                        <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2.5 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                <span className="font-semibold">{productName}</span>
                                {hasReferenceImage && (
                                    <Badge
                                        variant="outline"
                                        className="border-emerald-500/30 bg-emerald-500/10 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
                                    >
                                        <ShieldCheck className="mr-1 inline h-3 w-3" />
                                        Product-First Generation
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className="border-primary/30 bg-primary/10 font-mono text-[10px] font-bold text-primary"
                                >
                                    <Sparkles className="mr-1 inline h-2.5 w-2.5" />
                                    {imageModel || 'gpt-image-1'}
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className={`font-mono text-[10px] font-bold uppercase ${
                                        imageQuality === 'high'
                                            ? 'border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                            : imageQuality === 'low'
                                              ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    }`}
                                >
                                    {imageQuality || 'medium'}
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className="font-mono text-[10px]"
                                >
                                    {aspectRatio || '1:1'}
                                </Badge>
                                {isSavedToDesigns && (
                                    <Badge
                                        variant="secondary"
                                        className="text-[10px]"
                                    >
                                        Saved
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Generated Visual Canvas */}
                        <div className="flex min-h-[360px] items-center justify-center overflow-hidden rounded-2xl bg-muted/20 p-3 sm:p-4">
                            {savedDesign?.image_url ? (
                                <div className="relative flex max-h-[520px] w-full items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-background/50 shadow-lg">
                                    <img
                                        src={savedDesign.image_url}
                                        alt={productName}
                                        className="max-h-[500px] w-auto max-w-full rounded-xl object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                                    />
                                    <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/60 via-transparent to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                                        <span className="rounded-xl bg-black/70 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur-md">
                                            Click to view full size
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full max-w-md space-y-3 rounded-2xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-6 text-center text-white">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary shadow-md">
                                        <Sparkles className="h-6 w-6 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold">{productName}</h3>
                                    {tagline && (
                                        <p className="text-xs font-medium text-slate-300">
                                            "{tagline}"
                                        </p>
                                    )}
                                    {price && (
                                        <p className="text-base font-bold text-sky-400">
                                            ₱{Number(price).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status Alert */}
                    <div
                        className={`rounded-2xl border p-4 ${
                            isSavedToDesigns
                                ? 'border-emerald-500/30 bg-emerald-500/10'
                                : 'border-primary/20 bg-primary/5'
                        }`}
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <Check
                                    className={`h-4 w-4 ${
                                        isSavedToDesigns
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-primary'
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
                                    className="h-7 text-xs text-emerald-600 dark:text-emerald-400"
                                >
                                    <Link href="/designs">Open Designs →</Link>
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Generated Creative Concept & Tagline in Ready View */}
                    {(tagline || creativeConcept) && (
                        <div className="space-y-2.5 rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-2xs">
                            {tagline && (
                                <div>
                                    <span className="text-[10px] font-bold tracking-wider text-primary uppercase">
                                        Tagline
                                    </span>
                                    <p className="mt-0.5 text-sm font-bold text-foreground italic">
                                        "{tagline}"
                                    </p>
                                </div>
                            )}
                            {creativeConcept && (
                                <div className={tagline ? 'border-t border-primary/15 pt-2' : ''}>
                                    <span className="text-[10px] font-bold tracking-wider text-primary uppercase">
                                        Creative Concept
                                    </span>
                                    <p className="mt-0.5 text-xs font-semibold text-foreground">
                                        {creativeConcept}
                                    </p>
                                    {visualStrategy && (
                                        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                                            <strong className="text-foreground/90">
                                                Visual Strategy:
                                            </strong>{' '}
                                            {visualStrategy}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Bar */}
                    <div className="space-y-3">
                        <div className="grid gap-2.5 sm:grid-cols-2">
                            <Button
                                type="button"
                                onClick={onSaveToDesigns}
                                disabled={isSavingDesign}
                                variant={isSavedToDesigns ? 'outline' : 'default'}
                                className="h-10 text-xs font-semibold shadow-sm"
                            >
                                {isSavingDesign ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Check className="mr-2 h-4 w-4" />
                                )}
                                {isSavedToDesigns
                                    ? 'Saved in Designs'
                                    : 'Save to Designs'}
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-10 gap-1.5 text-xs font-semibold shadow-none"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download Visual
                                        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="center"
                                    className="w-52 rounded-2xl border-border p-1.5 shadow-lg"
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
                                    <DropdownMenuItem
                                        onClick={() => onDownload('svg')}
                                        className="cursor-pointer gap-2 text-xs font-medium"
                                    >
                                        <Download className="h-3.5 w-3.5 text-emerald-500" />
                                        SVG (Vector Embed)
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Sub actions */}
                        <div className="flex items-center justify-between border-t border-border/50 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={onEditParameters}
                                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                            >
                                <Edit3 className="h-3.5 w-3.5" />
                                Edit Parameters
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={onRegenerate}
                                className="gap-1.5 text-xs text-primary hover:bg-primary/10"
                            >
                                <RefreshCcw className="h-3.5 w-3.5" />
                                Regenerate Variation
                            </Button>
                        </div>

                        {/* Technical Generation Details Accordion */}
                        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/60">
                            <button
                                type="button"
                                onClick={() =>
                                    setIsTechDetailsExpanded(!isTechDetailsExpanded)
                                }
                                className="flex w-full items-center justify-between p-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted/30"
                            >
                                <div className="flex items-center gap-2">
                                    <Cpu className="h-4 w-4 text-primary" />
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
                                <div className="space-y-2.5 border-t border-border/60 p-3 pt-1">
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5">
                                            <p className="font-mono text-[10px] font-semibold text-muted-foreground uppercase">
                                                Model
                                            </p>
                                            <p className="mt-0.5 font-semibold text-foreground">
                                                {imageModel || 'GPT-Image'}
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5">
                                            <p className="font-mono text-[10px] font-semibold text-muted-foreground uppercase">
                                                Method
                                            </p>
                                            <p className="mt-0.5 font-semibold text-foreground">
                                                {hasReferenceImage
                                                    ? 'Image-to-Image Edit'
                                                    : 'Text-to-Image'}
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5">
                                            <p className="font-mono text-[10px] font-semibold text-muted-foreground uppercase">
                                                Aspect Ratio
                                            </p>
                                            <p className="mt-0.5 font-semibold text-foreground">
                                                {aspectRatio || '1:1'}
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5">
                                            <p className="font-mono text-[10px] font-semibold text-muted-foreground uppercase">
                                                Safe Margin
                                            </p>
                                            <p className="mt-0.5 font-semibold text-foreground">
                                                20% Safe Zone Enforced
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5">
                                            <p className="font-mono text-[10px] font-semibold text-muted-foreground uppercase">
                                                Status
                                            </p>
                                            <p className="mt-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                                                Completed
                                            </p>
                                        </div>
                                        {savedDesign?.generation_meta?.duration_seconds && (
                                            <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5">
                                                <p className="font-mono text-[10px] font-semibold text-muted-foreground uppercase">
                                                    Duration
                                                </p>
                                                <p className="mt-0.5 font-semibold text-foreground">
                                                    {savedDesign.generation_meta.duration_seconds}s
                                                </p>
                                            </div>
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
