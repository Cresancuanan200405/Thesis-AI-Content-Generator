import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import {
    Sparkles,
    Check,
    Download,
    Trash2,
    Tag,
    Layers,
    CalendarDays,
    ChevronDown,
    ChevronUp,
    Eye,
    Palette,
    Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CampaignViewerItem } from '../types';

export interface CampaignViewerPanelProps {
    design: CampaignViewerItem;
    campaign: {
        id: number;
        name: string;
        event_id?: number | null;
        product_name?: string | null;
    };
    onFinalize?: (designId: number) => void;
    isFinalizing?: boolean;
    onDownload?: (design: CampaignViewerItem, format: 'png' | 'jpeg' | 'svg') => void;
    onDelete?: (design: CampaignViewerItem) => void;
    onClose?: () => void;
}

export function CampaignViewerPanel({
    design,
    campaign,
    onFinalize,
    isFinalizing = false,
    onDownload,
    onDelete,
    onClose,
}: CampaignViewerPanelProps) {
    const [isTechnicalExpanded, setIsTechnicalExpanded] = useState(false);

    const isDraft = design.status === 'draft' || Boolean(design.is_draft);

    const viewCreativeUrl = design.generator_url
        ? design.generator_url.includes('?')
            ? `${design.generator_url}&open_modal=1`
            : `${design.generator_url}?open_modal=1`
        : `/campaigns/${campaign.id}/generator?draft_id=${design.id}&origin=campaign&open_modal=1`;

    const resumeDraftUrl =
        design.generator_url ||
        `/campaigns/${campaign.id}/generator?draft_id=${design.id}&origin=campaign`;

    const editInStudioUrl =
        design.generator_url ||
        `/campaigns/${campaign.id}/generator?product_name=${encodeURIComponent(
            design.product_name || '',
        )}${campaign?.event_id ? `&event_id=${campaign.event_id}` : ''}&price=${encodeURIComponent(design.price || '')}&tagline=${encodeURIComponent(design.tagline || '')}&prompt=${encodeURIComponent(design.prompt || '')}&aspect_ratio=${encodeURIComponent(design.aspect_ratio || '1:1')}`;

    const modelName =
        design.generation_metadata?.model || design.model || 'gpt-image-2';
    const renderStyle =
        design.render_style || design.generation_metadata?.render_style || 'Studio Product Still';
    const quality = design.generation_metadata?.quality || 'medium';
    const aspectRatio = design.aspect_ratio || design.generation_metadata?.aspect_ratio || '1:1';

    return (
        <div className="flex min-h-full flex-col justify-between">
            {/* Top Container: Details, Actions & Metadata */}
            <div className="p-4 sm:p-5 space-y-4">
                {/* Header & Badges */}
                <div>
                    <div className="flex items-center justify-between gap-2">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                            <Layers className="h-3.5 w-3.5" />
                            <span>Campaign Visual</span>
                        </div>
                    </div>

                    <h1
                        className="mt-2 text-lg font-bold tracking-tight text-foreground sm:text-xl truncate"
                        title={design.product_name || 'Campaign Visual'}
                    >
                        {design.product_name || 'Campaign Visual'}
                    </h1>

                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Badge
                            variant="outline"
                            className="border-primary/30 bg-primary/10 font-mono text-[10px] font-semibold text-primary"
                        >
                            <Sparkles className="mr-1 inline h-2.5 w-2.5" />
                            {modelName}
                        </Badge>
                        <Badge
                            variant="outline"
                            className="border-border bg-muted/40 font-mono text-[10px] font-semibold text-foreground/80"
                        >
                            {aspectRatio}
                        </Badge>
                        {design.price && (
                            <span className="ml-1 text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                                ₱{design.price}
                            </span>
                        )}
                    </div>
                </div>

                {/* Primary Action Buttons Based on Status */}
                <div className="space-y-2">
                    {isDraft ? (
                        <>
                            {onFinalize && (
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => onFinalize(design.id)}
                                    disabled={isFinalizing}
                                    className="w-full h-9 gap-1.5 bg-emerald-600 font-bold text-white shadow-xs transition-all hover:bg-emerald-500 active:scale-[0.99]"
                                >
                                    <Check className="h-4 w-4" />
                                    {isFinalizing ? 'Finalizing...' : 'Finalize Design'}
                                </Button>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    asChild
                                    size="sm"
                                    className="h-8.5 gap-1.5 bg-primary font-bold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 active:scale-[0.99]"
                                >
                                    <Link href={resumeDraftUrl} className="flex items-center justify-center gap-1.5 w-full">
                                        <Sparkles className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate">Resume Draft</span>
                                    </Link>
                                </Button>

                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="h-8.5 gap-1.5 border-border bg-card font-medium text-foreground hover:bg-muted"
                                >
                                    <Link href={viewCreativeUrl} className="flex items-center justify-center gap-1.5 w-full">
                                        <Eye className="h-3.5 w-3.5 text-primary shrink-0" />
                                        <span className="truncate">View Creative</span>
                                    </Link>
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Button
                                asChild
                                size="sm"
                                className="w-full h-9 gap-2 bg-primary font-bold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 active:scale-[0.99]"
                            >
                                <Link href={editInStudioUrl} className="flex items-center justify-center gap-1.5 w-full">
                                    <Sparkles className="h-4 w-4 shrink-0" />
                                    <span className="truncate">Edit in AI Studio</span>
                                </Link>
                            </Button>

                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="w-full h-8.5 gap-1.5 border-border bg-card font-medium text-foreground hover:bg-muted"
                            >
                                <Link href={viewCreativeUrl} className="flex items-center justify-center gap-1.5 w-full">
                                    <Eye className="h-3.5 w-3.5 text-primary shrink-0" />
                                    <span className="truncate">View Generated Creative</span>
                                </Link>
                            </Button>
                        </>
                    )}
                </div>

                {/* Secondary Actions: Downloads */}
                <div className="space-y-1.5 border-t border-b border-border/60 py-2.5">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                            <Download className="h-3.5 w-3.5 text-primary shrink-0" />
                            Download image:
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onDownload?.(design, 'png')}
                            className="h-8 w-full justify-center gap-1 border-border bg-card px-2 text-xs font-medium hover:bg-muted"
                        >
                            <Download className="h-3 w-3 text-primary shrink-0" />
                            <span className="truncate">PNG</span>
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onDownload?.(design, 'jpeg')}
                            className="h-8 w-full justify-center gap-1 border-border bg-card px-2 text-xs font-medium hover:bg-muted"
                        >
                            <Download className="h-3 w-3 text-blue-500 shrink-0" />
                            <span className="truncate">JPEG</span>
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onDownload?.(design, 'svg')}
                            className="h-8 w-full justify-center gap-1 border-border bg-card px-2 text-xs font-medium hover:bg-muted"
                        >
                            <Download className="h-3 w-3 text-emerald-500 shrink-0" />
                            <span className="truncate">SVG</span>
                        </Button>
                    </div>
                </div>

                {/* Tagline Card (if available) */}
                {design.tagline && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5">
                        <div className="flex items-center gap-1 text-[11px] font-bold tracking-wider text-primary uppercase">
                            <Tag className="h-3 w-3" />
                            <span>Catchy Tagline & Hook</span>
                        </div>
                        <p className="mt-1 text-sm font-semibold italic text-foreground leading-snug">
                            "{design.tagline}"
                        </p>
                    </div>
                )}

                {/* Campaign & Creation Details */}
                <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-2.5">
                    <div className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                        Campaign Context
                    </div>

                    <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Layers className="h-3.5 w-3.5 text-primary" />
                            Campaign
                        </span>
                        <span className="font-semibold text-foreground truncate max-w-[180px]">
                            {campaign.name}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5 text-primary" />
                            Created
                        </span>
                        <span className="font-medium text-foreground">
                            {design.created_at || 'Saved Visual'}
                        </span>
                    </div>

                    {design.product_name && (
                        <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                                <Tag className="h-3.5 w-3.5 text-primary" />
                                Product
                            </span>
                            <span className="font-semibold text-foreground truncate max-w-[180px]">
                                {design.product_name}
                            </span>
                        </div>
                    )}
                </div>

                {/* Collapsible Technical Metadata */}
                {(design.prompt || design.generation_metadata) && (
                    <div className="rounded-xl border border-border/70 bg-card p-3">
                        <button
                            type="button"
                            onClick={() => setIsTechnicalExpanded(!isTechnicalExpanded)}
                            className="flex w-full items-center justify-between text-left text-xs font-semibold text-muted-foreground hover:text-foreground"
                        >
                            <span className="flex items-center gap-1.5">
                                <Cpu className="h-3.5 w-3.5 text-primary" />
                                AI Concept & Parameters
                            </span>
                            {isTechnicalExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                            )}
                        </button>

                        {isTechnicalExpanded && (
                            <div className="mt-3 space-y-3 border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
                                {design.prompt && (
                                    <div>
                                        <span className="font-semibold text-foreground">
                                            Concept / Prompt:
                                        </span>
                                        <p className="mt-1 line-clamp-4 rounded bg-muted/50 p-2 font-mono text-[11px] text-foreground/90">
                                            {design.prompt}
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                    <div>
                                        <span className="text-muted-foreground">Render Style:</span>
                                        <p className="font-medium text-foreground">{renderStyle}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Quality:</span>
                                        <p className="font-medium text-foreground uppercase">{quality}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Destructive Action: Delete Visual (Sticky & perfectly fitting on screen) */}
            {onDelete && (
                <div className="sticky bottom-0 z-10 border-t border-border/80 bg-background/95 backdrop-blur-md p-3 sm:p-3.5">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(design)}
                        className="h-9 w-full justify-center gap-2 text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive active:scale-[0.99] border border-destructive/20 bg-destructive/5"
                    >
                        <Trash2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">Delete Visual</span>
                    </Button>
                </div>
            )}
        </div>
    );
}
