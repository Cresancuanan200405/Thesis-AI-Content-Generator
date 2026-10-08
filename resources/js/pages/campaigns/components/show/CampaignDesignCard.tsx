import { Link } from '@inertiajs/react';
import {
    Check,
    Download,
    Edit3,
    ImageIcon,
    MoreVertical,
    Trash2,
} from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { CampaignDesign } from './types';

export interface CampaignDesignCardProps {
    design: CampaignDesign;
    campaignId?: number | null;
    campaignEventId?: number | null;
    onOpenViewer: (design: CampaignDesign) => void;
    onFinalize?: (designId: number) => void;
    onDownload: (design: CampaignDesign, format: 'png' | 'jpeg' | 'svg') => void;
    onDelete?: (design: CampaignDesign) => void;
    isFinalizing?: boolean;
}

export function getAspectRatioClass(aspectRatio?: string | null): string {
    switch (aspectRatio) {
        case '9:16':
            return 'aspect-[9/16]';
        case '16:9':
            return 'aspect-[16/9]';
        case '4:5':
            return 'aspect-[4/5]';
        case '4:3':
            return 'aspect-[4/3]';
        case '1:1':
        default:
            return 'aspect-square';
    }
}

export function CampaignDesignCard({
    design,
    campaignId,
    campaignEventId,
    onOpenViewer,
    onFinalize,
    onDownload,
    onDelete,
    isFinalizing = false,
}: CampaignDesignCardProps) {
    const isDraft = design.status === 'draft' || Boolean(design.is_draft);
    const aspectClass = getAspectRatioClass(design.aspect_ratio);

    // Generation source & Design-level creative details (strictly belonging to THIS design)
    const isAutomatic = (design.generation_source || 'Automatic') === 'Automatic';
    const renderStyle = design.render_style || design.generation_metadata?.render_style || null;
    const aspectRatio = design.aspect_ratio || design.generation_metadata?.aspect_ratio || null;
    const hasDesignCreativeDetails = Boolean(renderStyle || aspectRatio);

    // Direct studio URLs
    const effectiveCampaignId = campaignId ?? (design as any).campaign_id ?? null;
    const resumeDraftUrl =
        design.generator_url ||
        (effectiveCampaignId
            ? `/campaigns/${effectiveCampaignId}/generator?draft_id=${design.id}&origin=campaign`
            : `/generator?draft_id=${design.id}`);

    const editInStudioUrl =
        design.generator_url ||
        (effectiveCampaignId
            ? `/campaigns/${effectiveCampaignId}/generator?product_name=${encodeURIComponent(
                design.product_name || '',
            )}${campaignEventId ? `&event_id=${campaignEventId}` : ''}&price=${encodeURIComponent(String(design.price || ''))}&tagline=${encodeURIComponent(design.tagline || '')}&prompt=${encodeURIComponent(design.prompt || '')}&aspect_ratio=${encodeURIComponent(design.aspect_ratio || '1:1')}`
            : `/generator?product_name=${encodeURIComponent(
                design.product_name || '',
            )}&price=${encodeURIComponent(String(design.price || ''))}&tagline=${encodeURIComponent(design.tagline || '')}&prompt=${encodeURIComponent(design.prompt || '')}&aspect_ratio=${encodeURIComponent(design.aspect_ratio || '1:1')}`);

    return (
        <div className="group flex flex-col">
            {/* Visual Creative Stage: Preserves true aspect ratio, avoids forced cropping */}
            <div
                role="button"
                tabIndex={0}
                onClick={() => onOpenViewer(design)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        onOpenViewer(design);
                    }
                }}
                className={`relative w-full ${aspectClass} overflow-hidden rounded-2xl border border-border/70 bg-muted/20 cursor-pointer shadow-2xs transition-all duration-200 hover:border-primary/50 hover:shadow-md focus:outline-hidden flex items-center justify-center`}
                title="Click to open image viewer"
            >
                {design.image_url ? (
                    <img
                        src={design.image_url}
                        alt={design.product_name || 'Campaign Design'}
                        className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.01]"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                        <ImageIcon className="h-10 w-10 stroke-1" />
                    </div>
                )}
            </div>

            {/* Design Metadata & Action Menu */}
            <div className="mt-2.5 flex items-start justify-between gap-2 px-0.5">
                <div className="min-w-0 flex-1">
                    <p
                        className="truncate text-sm font-semibold text-foreground leading-tight"
                        title={design.product_name || 'Campaign Creative'}
                    >
                        {design.product_name || 'Campaign Creative'}
                    </p>

                    {/* Restrained metadata line: e.g. "Draft · ₱398.00" or "Final Design · ₱398.00" */}
                    <p className="mt-1 text-xs text-muted-foreground font-medium truncate">
                        <span>{isDraft ? 'Draft' : 'Final Design'}</span>
                        {design.price !== null && design.price !== undefined && design.price !== '' && (
                            <span> · ₱{design.price}</span>
                        )}
                        {(design as any).campaign_name && (design as any).campaign_name !== design.product_name && (
                            <span className="opacity-90"> · {(design as any).campaign_name}</span>
                        )}
                        {design.created_at && (
                            <span className="opacity-75"> · {design.created_at}</span>
                        )}
                    </p>

                    {/* Generation Source & Design-Level Configuration: e.g. "Automatic · Studio Product Still · 9:16" */}
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
                        <span
                            className="font-medium text-foreground/80 shrink-0"
                            title={`Generated via ${isAutomatic ? 'Automatic' : 'Manual'} Studio`}
                        >
                            {isAutomatic ? 'Automatic' : 'Manual'}
                        </span>

                        {hasDesignCreativeDetails && (
                            <>
                                <span className="text-muted-foreground/40">·</span>
                                <span
                                    className="truncate"
                                    title={`${renderStyle || ''} ${aspectRatio ? `(${aspectRatio})` : ''}`.trim()}
                                >
                                    {renderStyle && <span>{renderStyle}</span>}
                                    {renderStyle && aspectRatio && <span> · </span>}
                                    {aspectRatio && <span className="font-mono">{aspectRatio}</span>}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Accessible Overflow Menu [⋮] (Clicking image opens viewer, so no duplicate 'Open in Viewer') */}
                <TooltipProvider>
                    <DropdownMenu>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                                        aria-label={`Options for ${design.product_name || 'creative'}`}
                                    >
                                        <MoreVertical className="h-3.5 w-3.5" />
                                    </Button>
                                </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent>Creative options</TooltipContent>
                        </Tooltip>

                        <DropdownMenuContent align="end" className="w-48">
                            {isDraft ? (
                                <>
                                    <DropdownMenuItem asChild className="cursor-pointer gap-2 text-xs">
                                        <Link href={resumeDraftUrl}>
                                            <Edit3 className="h-3.5 w-3.5 text-foreground" />
                                            Resume Draft
                                        </Link>
                                    </DropdownMenuItem>

                                    {onFinalize && (
                                        <DropdownMenuItem
                                            onClick={() => onFinalize(design.id)}
                                            disabled={isFinalizing}
                                            className="cursor-pointer gap-2 text-xs text-emerald-600 dark:text-emerald-400 focus:text-emerald-600"
                                        >
                                            <Check className="h-3.5 w-3.5" />
                                            Finalize Design
                                        </DropdownMenuItem>
                                    )}
                                </>
                            ) : (
                                <DropdownMenuItem asChild className="cursor-pointer gap-2 text-xs">
                                    <Link href={editInStudioUrl}>
                                        <Edit3 className="h-3.5 w-3.5 text-foreground" />
                                        Edit in Studio
                                    </Link>
                                </DropdownMenuItem>
                            )}

                            {/* Download submenu */}
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="cursor-pointer gap-2 text-xs">
                                    <Download className="h-3.5 w-3.5 text-muted-foreground" />
                                    Download Image
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="w-32">
                                    <DropdownMenuItem
                                        onClick={() => onDownload(design, 'png')}
                                        className="cursor-pointer text-xs"
                                    >
                                        PNG Image
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => onDownload(design, 'jpeg')}
                                        className="cursor-pointer text-xs"
                                    >
                                        JPEG Image
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => onDownload(design, 'svg')}
                                        className="cursor-pointer text-xs"
                                    >
                                        SVG Vector
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>

                            {onDelete && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => onDelete(design)}
                                        className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Delete Visual
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TooltipProvider>
            </div>
        </div>
    );
}
