import { Link } from '@inertiajs/react';
import {
    FolderPlus,
    ImageIcon,
    Plus,
    Search,
    X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CampaignDesignCard } from './CampaignDesignCard';
import { CampaignData, CampaignDesign } from './types';

interface CampaignDesignsSectionProps {
    campaign: CampaignData;
    hasAvailableDesigns: boolean;
    onCreateDesign?: () => void;
    onOpenAttachExisting: () => void;
    onOpenViewer: (design: CampaignDesign) => void;
    onFinalize: (designId: number) => void;
    onDownload: (design: CampaignDesign, format: 'png' | 'jpeg' | 'svg') => void;
    onDelete: (design: CampaignDesign) => void;
    isFinalizing?: boolean;
}

export function CampaignDesignsSection({
    campaign,
    hasAvailableDesigns,
    onCreateDesign,
    onOpenAttachExisting,
    onOpenViewer,
    onFinalize,
    onDownload,
    onDelete,
    isFinalizing = false,
}: CampaignDesignsSectionProps) {
    const designs = campaign.designs || [];
    const designCount = designs.length;

    // Filter states: Search, Generation Dropdown & Status Dropdown
    const [searchQuery, setSearchQuery] = useState('');
    const [genFilter, setGenFilter] = useState<'all' | 'automatic' | 'manual'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'drafts' | 'final'>('all');

    // Counts for generation sources
    const autoCount = useMemo(() => {
        return designs.filter(
            (d) => (d.generation_source || 'Automatic') === 'Automatic',
        ).length;
    }, [designs]);

    const manualCount = useMemo(() => {
        return designs.filter((d) => d.generation_source === 'Manual').length;
    }, [designs]);

    const hasAutomatic = autoCount > 0;
    const hasManual = manualCount > 0;

    // Counts for status (draft vs final)
    const draftCount = useMemo(() => {
        return designs.filter(
            (d) => d.status === 'draft' || Boolean(d.is_draft),
        ).length;
    }, [designs]);

    const finalCount = useMemo(() => {
        return designs.filter(
            (d) => d.status === 'final' || (!d.is_draft && d.status !== 'draft'),
        ).length;
    }, [designs]);

    // Filtered designs based on active filters
    const filteredDesigns = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return designs.filter((d) => {
            // Search text match
            if (query) {
                const nameMatch = d.product_name?.toLowerCase().includes(query);
                const taglineMatch = d.tagline?.toLowerCase().includes(query);
                const styleMatch = d.render_style?.toLowerCase().includes(query);
                const themeMatch = d.visual_theme?.toLowerCase().includes(query);
                if (!nameMatch && !taglineMatch && !styleMatch && !themeMatch) {
                    return false;
                }
            }

            // Generation source match
            const isAuto = (d.generation_source || 'Automatic') === 'Automatic';
            if (genFilter === 'automatic' && !isAuto) {
                return false;
            }
            if (genFilter === 'manual' && isAuto) {
                return false;
            }

            // Status match
            const isDraft = d.status === 'draft' || Boolean(d.is_draft);
            if (statusFilter === 'drafts' && !isDraft) {
                return false;
            }
            if (statusFilter === 'final' && isDraft) {
                return false;
            }

            return true;
        });
    }, [designs, searchQuery, genFilter, statusFilter]);

    return (
        <section className="mb-12">
            {/* Sticky Filter Control Toolbar: Stays aligned and responsive at any browser zoom level */}
            {designCount > 0 && (
                <div className="sticky top-11 z-30 mb-6 rounded-2xl border border-white/25 bg-card/95 p-2.5 shadow-md backdrop-blur-xl transition-all sm:top-12 sm:p-3 dark:border-white/10 dark:bg-card/95">
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                        {/* Search Input */}
                        <div className="relative min-w-0 flex-1">
                            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search designs by product, style, or tagline..."
                                className="h-9 border-input bg-background pr-8 pl-8.5 text-xs shadow-none focus-visible:ring-primary/30"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-muted-foreground/60 transition-colors hover:text-foreground"
                                    aria-label="Clear search"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Dropdown UI Filters & Attach Action */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Generation Filter Dropdown */}
                            {(hasAutomatic || hasManual) && (
                                <div className="w-36 shrink-0 sm:w-40">
                                    <Select
                                        value={genFilter}
                                        onValueChange={(val) => setGenFilter(val as any)}
                                    >
                                        <SelectTrigger className="h-9 w-full gap-1.5 text-xs shadow-none">
                                            <SelectValue placeholder="All Generations" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Generations ({designCount})
                                            </SelectItem>
                                            {hasAutomatic && (
                                                <SelectItem value="automatic">
                                                    Automatic ({autoCount})
                                                </SelectItem>
                                            )}
                                            {hasManual && (
                                                <SelectItem value="manual">
                                                    Manual ({manualCount})
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Status Filter Dropdown: Only shown when drafts exist */}
                            {draftCount > 0 && (
                                <div className="w-32 shrink-0 sm:w-36">
                                    <Select
                                        value={statusFilter}
                                        onValueChange={(val) => setStatusFilter(val as any)}
                                    >
                                        <SelectTrigger className="h-9 w-full gap-1.5 text-xs shadow-none">
                                            <SelectValue placeholder="All Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Status ({designCount})
                                            </SelectItem>
                                            <SelectItem value="drafts">
                                                Drafts ({draftCount})
                                            </SelectItem>
                                            <SelectItem value="final">
                                                Final ({finalCount})
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Attach Existing Button */}
                            {hasAvailableDesigns && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={onOpenAttachExisting}
                                    className="h-9 gap-1.5 px-3 text-xs shadow-none cursor-pointer"
                                    title="Attach Existing Visuals"
                                >
                                    <FolderPlus className="h-3.5 w-3.5 text-amber-500" />
                                    <span>Attach</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Designs Grid or Empty States */}
            {designCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-border/80 bg-muted/10 mt-6 px-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <ImageIcon className="h-6 w-6 stroke-1.5" />
                    </div>

                    <h3 className="mt-3 text-sm font-semibold text-foreground">
                        No campaign visuals yet
                    </h3>
                    <p className="mt-1 max-w-sm text-xs text-muted-foreground leading-relaxed">
                        Generate on-brand visuals tailored to this campaign or attach existing designs from your catalog.
                    </p>

                    <div className="mt-5 flex items-center gap-2.5">
                        {hasAvailableDesigns && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={onOpenAttachExisting}
                                className="h-8 text-xs cursor-pointer shadow-none"
                            >
                                <FolderPlus className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
                                Attach Existing
                            </Button>
                        )}

                        {onCreateDesign ? (
                            <Button
                                type="button"
                                size="sm"
                                onClick={onCreateDesign}
                                className="h-8 text-xs cursor-pointer shadow-none gap-1.5 font-semibold"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Create Marketing Design
                            </Button>
                        ) : (
                            <Button
                                asChild
                                size="sm"
                                className="h-8 text-xs cursor-pointer shadow-none gap-1.5 font-semibold"
                            >
                                <Link href={campaign.generator_url}>
                                    <Plus className="h-3.5 w-3.5" />
                                    Create Marketing Design
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            ) : filteredDesigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-dashed border-border/60 bg-muted/5 mt-6 px-4">
                    <p className="text-xs text-muted-foreground">
                        No designs matching the selected filter criteria.
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            setSearchQuery('');
                            setGenFilter('all');
                            setStatusFilter('all');
                        }}
                        className="mt-2 text-xs font-medium text-primary hover:underline cursor-pointer"
                    >
                        Reset filters (View all {designCount})
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredDesigns.map((design) => (
                        <CampaignDesignCard
                            key={design.id}
                            design={design}
                            campaignId={campaign.id}
                            campaignEventId={campaign.event_id}
                            onOpenViewer={onOpenViewer}
                            onFinalize={onFinalize}
                            onDownload={onDownload}
                            onDelete={onDelete}
                            isFinalizing={isFinalizing}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
