import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import {
    Sparkles,
    Check,
    RefreshCw,
    Download,
    Trash2,
    Heart,
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DesignViewerItem } from '../types';

export interface DesignViewerPanelProps {
    design: DesignViewerItem;
    onFinalize?: (design: DesignViewerItem) => void;
    isFinalizing?: boolean;
    onRegenerate?: (design: DesignViewerItem) => void;
    isRegenerating?: boolean;
    onDownload?: (design: DesignViewerItem, format: 'png' | 'jpeg' | 'svg') => void;
    onDelete?: (design: DesignViewerItem) => void;
    onFavoriteToggle?: (design: DesignViewerItem) => void;
    isFavorite?: (design: DesignViewerItem) => boolean;
    getStudioUrl?: (design: DesignViewerItem) => string;
}

export function DesignViewerPanel({
    design,
    onFinalize,
    isFinalizing = false,
    onRegenerate,
    isRegenerating = false,
    onDownload,
    onDelete,
    onFavoriteToggle,
    isFavorite,
    getStudioUrl,
}: DesignViewerPanelProps) {
    const [isTechnicalExpanded, setIsTechnicalExpanded] = useState(false);

    const isDraft = design.status === 'draft' || Boolean(design.is_draft);
    const favoriteActive = isFavorite ? isFavorite(design) : Boolean(design.is_favorite);

    const studioUrl = getStudioUrl
        ? getStudioUrl(design)
        : design.generator_url || `/generator/manual?draft_id=${design.id}&origin=designs`;

    const viewCreativeUrl = design.generator_url
        ? design.generator_url.includes('?')
            ? `${design.generator_url}&open_modal=1`
            : `${design.generator_url}?open_modal=1`
        : `/generator/manual?draft_id=${design.id}&origin=designs&open_modal=1`;

    const modelName =
        design.generation_metadata?.model || design.model || 'gpt-image-2';
    const renderStyle =
        design.render_style || design.generation_metadata?.render_style || 'Studio Product Still';
    const quality = design.generation_metadata?.quality || 'medium';
    const aspectRatio = design.aspect_ratio || design.generation_metadata?.aspect_ratio || '1:1';

    // Parse Visual Themes
    const visualThemes: string[] = (() => {
        const theme =
            design.content_style ||
            design.visual_theme ||
            design.generation_metadata?.visual_theme;
        if (Array.isArray(theme)) return theme;
        if (typeof theme === 'string' && theme.trim()) {
            return theme.split(',').map((s) => s.trim()).filter(Boolean);
        }
        return [];
    })();

    // Parse Brand Tones
    const brandTones: string[] = (() => {
        const tones = design.brand_tone || design.generation_metadata?.brand_tone;
        if (Array.isArray(tones)) return tones;
        if (typeof tones === 'string' && tones.trim()) {
            return tones.split(',').map((s) => s.trim()).filter(Boolean);
        }
        return [];
    })();

    return (
        <div className="flex min-h-full flex-col justify-between">
            <div className="p-4 sm:p-5 space-y-4">
                {/* 1. Header & Title Block */}
                <div>
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge
                                variant="outline"
                                className="font-mono text-[10px] font-bold border-primary/30 bg-primary/10 text-primary"
                            >
                                <Sparkles className="mr-1 h-2.5 w-2.5" />
                                {modelName}
                            </Badge>

                            {isDraft ? (
                                <span className="rounded border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-amber-400">
                                    STATUS: DRAFT
                                </span>
                            ) : (
                                <span className="rounded border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-emerald-400">
                                    STATUS: FINAL
                                </span>
                            )}

                            <Badge
                                variant="outline"
                                className="font-mono text-[10px] font-semibold border-border bg-muted/30 text-foreground"
                            >
                                {aspectRatio}
                            </Badge>
                        </div>

                        {/* Favorite Button */}
                        {onFavoriteToggle && (
                            <button
                                type="button"
                                onClick={() => onFavoriteToggle(design)}
                                className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-all ${
                                    favoriteActive
                                        ? 'border border-rose-500/40 bg-rose-500/20 text-rose-400'
                                        : 'border border-border/80 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                                title={favoriteActive ? 'Favorited' : 'Add to Favorites'}
                                aria-label="Toggle Favorite"
                            >
                                <Heart
                                    className={`h-4 w-4 ${favoriteActive ? 'fill-rose-400' : ''}`}
                                />
                            </button>
                        )}
                    </div>

                    <h1
                        className="mt-2 text-lg font-bold tracking-tight text-foreground sm:text-xl truncate"
                        title={design.product_name || 'Design Visual'}
                    >
                        {design.product_name || 'Design Visual'}
                    </h1>

                    {design.campaign_name && (
                        <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <Layers className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span>Campaign:</span>
                            <span className="font-semibold text-foreground truncate">
                                {design.campaign_name}
                            </span>
                        </div>
                    )}
                </div>

                {/* 2. Primary Action Buttons */}
                <div className="space-y-2">
                    {isDraft ? (
                        <>
                            <div className="grid grid-cols-2 gap-2">
                                {onFinalize && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => onFinalize(design)}
                                        disabled={isFinalizing}
                                        className="h-9 w-full justify-center cursor-pointer gap-1.5 bg-emerald-600 font-semibold text-white shadow-xs transition-all hover:bg-emerald-500"
                                    >
                                        <Check className="h-4 w-4 shrink-0" />
                                        <span className="truncate">{isFinalizing ? 'Finalizing...' : 'Finalize Design'}</span>
                                    </Button>
                                )}

                                <Button
                                    asChild
                                    size="sm"
                                    className="h-9 w-full justify-center cursor-pointer gap-1.5 bg-primary font-semibold text-primary-foreground shadow-xs shadow-primary/20 transition-all hover:bg-primary/90"
                                >
                                    <Link href={studioUrl} className="flex items-center justify-center gap-1.5 w-full">
                                        <Sparkles className="h-4 w-4 shrink-0" />
                                        <span className="truncate">Resume Draft</span>
                                    </Link>
                                </Button>
                            </div>

                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="w-full h-8.5 justify-center gap-1.5 border-primary/30 text-xs font-semibold text-primary hover:bg-primary/10"
                            >
                                <Link href={viewCreativeUrl} className="flex items-center justify-center gap-1.5 w-full">
                                    <Eye className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">View in Generator Studio</span>
                                </Link>
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className={`grid gap-2 ${onRegenerate ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                <Button
                                    asChild
                                    size="sm"
                                    className="h-9 w-full justify-center cursor-pointer gap-1.5 bg-primary font-semibold text-primary-foreground shadow-xs shadow-primary/20 transition-all hover:bg-primary/90"
                                >
                                    <Link href={studioUrl} className="flex items-center justify-center gap-1.5 w-full">
                                        <Sparkles className="h-4 w-4 shrink-0" />
                                        <span className="truncate">Edit in Studio</span>
                                    </Link>
                                </Button>

                                {onRegenerate && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onRegenerate(design)}
                                        disabled={isRegenerating}
                                        className="h-9 w-full justify-center cursor-pointer gap-1.5 border-border font-semibold text-foreground hover:bg-muted"
                                    >
                                        <RefreshCw
                                            className={`h-3.5 w-3.5 shrink-0 ${isRegenerating ? 'animate-spin' : ''}`}
                                        />
                                        <span className="truncate">Regenerate</span>
                                    </Button>
                                )}
                            </div>

                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="w-full h-8.5 justify-center gap-1.5 border-primary/30 text-xs font-semibold text-primary hover:bg-primary/10"
                            >
                                <Link href={viewCreativeUrl} className="flex items-center justify-center gap-1.5 w-full">
                                    <Eye className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">View in Generator Studio</span>
                                </Link>
                            </Button>
                        </>
                    )}
                </div>

                {/* 3. Download Options Bar */}
                <div className="space-y-1.5 border-t border-b border-border/60 py-2.5">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                            <Download className="h-3.5 w-3.5 text-primary shrink-0" />
                            Download visual:
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

                {/* 4. Tagline Card */}
                {design.tagline && (
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-primary uppercase">
                            <Tag className="h-3 w-3" />
                            Catchy Tagline
                        </div>
                        <p className="text-sm font-semibold text-foreground italic leading-snug">
                            "{design.tagline}"
                        </p>
                    </div>
                )}

                {/* 5. Creative Direction Summary */}
                <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 space-y-3">
                    <div className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                        Creative Direction
                    </div>

                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Render Style:</span>
                        <span className="font-semibold text-primary">{renderStyle}</span>
                    </div>

                    {visualThemes.length > 0 && (
                        <div className="space-y-1 text-xs">
                            <span className="text-muted-foreground text-[11px]">Themes:</span>
                            <div className="flex flex-wrap gap-1">
                                {visualThemes.map((item) => (
                                    <span
                                        key={item}
                                        className="rounded border border-primary/20 bg-primary/5 px-1.5 py-0.5 text-[10px] font-medium text-primary"
                                    >
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {brandTones.length > 0 && (
                        <div className="space-y-1 text-xs">
                            <span className="text-muted-foreground text-[11px]">Brand Tone:</span>
                            <div className="flex flex-wrap gap-1">
                                {brandTones.map((item) => (
                                    <span
                                        key={item}
                                        className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-foreground"
                                    >
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                        <span className="flex items-center gap-1 text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5 text-primary" />
                            Created:
                        </span>
                        <span className="font-semibold text-foreground">
                            {design.created_at || 'Recent Design'}
                        </span>
                    </div>
                </div>

                {/* 6. Collapsible Technical Metadata & Prompts */}
                <div className="rounded-xl border border-border/70 bg-muted/10 overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setIsTechnicalExpanded(!isTechnicalExpanded)}
                        className="flex w-full items-center justify-between p-3 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <span className="flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                            <Cpu className="h-3.5 w-3.5 text-primary" />
                            AI Prompt & Technical Specs
                        </span>
                        {isTechnicalExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </button>

                    {isTechnicalExpanded && (
                        <div className="p-3 pt-0 space-y-3 text-xs border-t border-border/50 animate-in fade-in duration-150">
                            {design.prompt && (
                                <div>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                                        Synthesized Prompt:
                                    </span>
                                    <p className="rounded-lg bg-background p-2.5 font-mono text-[11px] text-foreground leading-relaxed border border-border/60">
                                        {design.prompt}
                                    </p>
                                </div>
                            )}

                            {design.negative_prompt && (
                                <div>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                                        Negative Constraints:
                                    </span>
                                    <p className="rounded-lg bg-background p-2.5 font-mono text-[11px] text-muted-foreground leading-relaxed border border-border/60">
                                        {design.negative_prompt}
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                                <div>
                                    <span className="text-muted-foreground block text-[10px]">Quality:</span>
                                    <span className="font-bold text-foreground capitalize">{quality}</span>
                                </div>
                                {design.dimensions && (
                                    <div>
                                        <span className="text-muted-foreground block text-[10px]">Dimensions:</span>
                                        <span className="font-mono text-foreground">{design.dimensions}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 7. Bottom Destructive Action: Delete (Sticky & perfectly fitting on screen) */}
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
                        <span className="truncate">Delete Design Visual</span>
                    </Button>
                </div>
            )}
        </div>
    );
}
