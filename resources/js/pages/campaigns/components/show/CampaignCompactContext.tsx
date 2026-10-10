import {
    ArrowUpRight,
    Calendar,
    ChevronDown,
    ChevronUp,
    Package,
    Sparkles,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { ViewEventDialog, EventModalData } from '@/components/view-event-dialog';
import { CampaignData } from './types';

interface CampaignCompactContextProps {
    campaign: CampaignData;
}

interface ProductItem {
    name: string;
    price?: string | number | null;
}

const formatPrice = (price?: string | number | null): string | null => {
    if (price === null || price === undefined || price === '') return null;
    const str = String(price).trim();
    if (!str) return null;
    return str.startsWith('₱') ? str : `₱${str}`;
};

export function CampaignCompactContext({
    campaign,
}: CampaignCompactContextProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isViewEventOpen, setIsViewEventOpen] = useState(false);

    const eventModalData: EventModalData | null = useMemo(() => {
        if (campaign.event) {
            return campaign.event;
        }
        if (campaign.event_id || campaign.event_name) {
            return {
                id: campaign.event_id || campaign.id,
                name: campaign.event_name || 'Marketing Event',
                description: null,
                date: campaign.event_date || campaign.start_date || undefined,
                start_date: campaign.event_date || campaign.start_date || undefined,
                end_date: campaign.end_date || campaign.event_date || undefined,
                type: campaign.event_type || 'commercial',
                category: campaign.event_category || undefined,
                is_global: false,
                can_edit: false,
                campaigns_count: 1,
                has_campaign: true,
                latest_campaign_id: campaign.id,
                show_url: campaign.event_show_url || undefined,
            };
        }
        return null;
    }, [campaign]);

    // 1. Gather all unique products with their authoritative prices
    const products = useMemo(() => {
        const map = new Map<string, ProductItem>();

        // Primary campaign product
        if (campaign.product?.name) {
            map.set(campaign.product.name.toLowerCase().trim(), {
                name: campaign.product.name,
                price: campaign.product.price,
            });
        } else if (campaign.product_name) {
            map.set(campaign.product_name.toLowerCase().trim(), {
                name: campaign.product_name,
                price: null,
            });
        }

        // From campaign designs and their generation metadata
        const designs = campaign.designs || [];
        for (const d of designs) {
            if (d.product_name && d.product_name.trim()) {
                const key = d.product_name.toLowerCase().trim();
                const existing = map.get(key);
                if (!existing || (!existing.price && d.price)) {
                    map.set(key, {
                        name: d.product_name,
                        price: d.price ?? existing?.price ?? null,
                    });
                }
            }

            // Catalog products from multi-product metadata
            const catalogProducts = d.generation_metadata?.catalog_products;
            if (Array.isArray(catalogProducts)) {
                for (const cp of catalogProducts) {
                    if (cp?.name) {
                        const key = String(cp.name).toLowerCase().trim();
                        map.set(key, {
                            name: String(cp.name),
                            price: cp.price ?? null,
                        });
                    }
                }
            }

            // Custom products
            const customProducts = d.generation_metadata?.custom_products;
            if (Array.isArray(customProducts)) {
                for (const cp of customProducts) {
                    const cName = typeof cp === 'string' ? cp : cp?.name;
                    const cPrice = typeof cp === 'object' ? cp?.price : null;
                    if (cName) {
                        const key = String(cName).toLowerCase().trim();
                        map.set(key, {
                            name: String(cName),
                            price: cPrice ?? null,
                        });
                    }
                }
            }
        }

        return Array.from(map.values());
    }, [campaign]);

    // 2. Resolve Generation Summary (Method & Count)
    const totalDesignCount = campaign.designs?.length ?? 0;

    const generationLabel = useMemo(() => {
        if (campaign.generation_summary?.label) {
            return campaign.generation_summary.label;
        }

        const designs = campaign.designs || [];
        if (designs.length === 0) {
            return 'No designs yet';
        }

        const hasAuto = designs.some(
            (d) => (d.generation_source || 'Automatic') === 'Automatic',
        );
        const hasManual = designs.some(
            (d) => d.generation_source === 'Manual',
        );

        if (hasAuto && hasManual) {
            return 'Automatic · Manual';
        }
        if (hasAuto) {
            return 'Automatic';
        }
        if (hasManual) {
            return 'Manual';
        }

        return 'Automatic';
    }, [campaign]);

    // Counts for status (draft vs final)
    const draftCount = useMemo(() => {
        if (campaign.creative_counts?.drafts !== undefined) {
            return campaign.creative_counts.drafts;
        }
        return (campaign.designs || []).filter(
            (d) => d.status === 'draft' || Boolean(d.is_draft),
        ).length;
    }, [campaign]);

    const finalCount = useMemo(() => {
        if (campaign.creative_counts?.final !== undefined) {
            return campaign.creative_counts.final;
        }
        return (campaign.designs || []).filter(
            (d) => d.status === 'final' || (!d.is_draft && d.status !== 'draft'),
        ).length;
    }, [campaign]);

    const hasMultiProducts = products.length > 2;

    return (
        <>
            <section className="mb-8 border-y border-border/40 py-4.5 text-xs">
                {/* 3-Column Aligned Horizontal Region: EVENT | PRODUCTS | GENERATION */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-border/40">
                    {/* 1. EVENT */}
                    <div className="flex flex-col justify-between md:pr-6 space-y-1">
                        <div className="flex h-5 items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
                            <span>Event</span>
                        </div>

                        <div className="space-y-1 pt-1.5">
                            {/* Row A: Primary Title */}
                            <p
                                className="text-sm font-semibold text-foreground truncate min-h-[20px] leading-tight"
                                title={campaign.event_name || 'General Campaign'}
                            >
                                {campaign.event_name || 'General Campaign'}
                            </p>

                            {/* Row B: Secondary Meta */}
                            <p className="text-xs text-muted-foreground truncate min-h-[18px]">
                                {campaign.event_date ? campaign.event_date : 'Flexible schedule'}
                                {campaign.event_category
                                    ? ` · ${campaign.event_category.replace(/_/g, ' ')}`
                                    : ''}
                            </p>

                            {/* Row C: Action / Context */}
                            <div className="min-h-[20px] flex items-center pt-0.5">
                                {eventModalData ? (
                                    <button
                                        type="button"
                                        onClick={() => setIsViewEventOpen(true)}
                                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer focus:outline-hidden"
                                    >
                                        <span>View Event Details</span>
                                        <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                                    </button>
                                ) : (
                                    <span className="text-xs text-muted-foreground/60">
                                        No linked event
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 2. PRODUCTS */}
                    <div className="flex flex-col justify-between pt-4 md:pt-0 md:px-6 space-y-1">
                        <div className="flex h-5 items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <Package className="h-3.5 w-3.5 text-muted-foreground/70" />
                                <span>Products {products.length > 0 ? `(${products.length})` : ''}</span>
                            </div>

                            {hasMultiProducts && (
                                <button
                                    type="button"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="inline-flex items-center gap-1 text-[11px] font-medium normal-case text-primary hover:text-primary/80 transition-colors cursor-pointer focus:outline-hidden"
                                    aria-label={isExpanded ? 'Collapse product list' : 'Expand product list'}
                                >
                                    <span>{isExpanded ? 'Show less' : 'View all'}</span>
                                    {isExpanded ? (
                                        <ChevronUp className="h-3 w-3 shrink-0" aria-hidden="true" />
                                    ) : (
                                        <ChevronDown className="h-3 w-3 shrink-0" aria-hidden="true" />
                                    )}
                                </button>
                            )}
                        </div>

                        <div className="space-y-1 pt-1.5">
                            {products.length === 0 ? (
                                <>
                                    <p className="text-sm font-semibold text-foreground truncate min-h-[20px] leading-tight">
                                        No products attached
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate min-h-[18px]">
                                        Flexible campaign scope
                                    </p>
                                    <div className="min-h-[20px] flex items-center pt-0.5">
                                        <span className="text-xs text-muted-foreground/60">
                                            Open visual direction
                                        </span>
                                    </div>
                                </>
                            ) : isExpanded ? (
                                <div className="space-y-1.5 pt-0.5 max-h-48 overflow-y-auto pr-1">
                                    {products.map((p, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between gap-2 text-xs"
                                        >
                                            <span
                                                className="font-medium text-foreground truncate"
                                                title={p.name}
                                            >
                                                {p.name}
                                            </span>
                                            {formatPrice(p.price) && (
                                                <span className="font-mono text-xs text-muted-foreground shrink-0">
                                                    {formatPrice(p.price)}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <>
                                    {/* Row A: Primary Product */}
                                    <div className="flex items-center justify-between gap-2 min-h-[20px]">
                                        <span
                                            className="text-sm font-semibold text-foreground truncate leading-tight"
                                            title={products[0]?.name}
                                        >
                                            {products[0]?.name}
                                        </span>
                                        {formatPrice(products[0]?.price) && (
                                            <span className="font-mono text-xs text-muted-foreground shrink-0 font-medium">
                                                {formatPrice(products[0]?.price)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Row B: Secondary Product or fallback */}
                                    {products.length > 1 ? (
                                        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground min-h-[18px]">
                                            <span className="truncate" title={products[1]?.name}>
                                                {products[1]?.name}
                                            </span>
                                            {formatPrice(products[1]?.price) && (
                                                <span className="font-mono text-[11px] text-muted-foreground/80 shrink-0 font-medium">
                                                    {formatPrice(products[1]?.price)}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground truncate min-h-[18px]">
                                            Single targeted product
                                        </p>
                                    )}

                                    {/* Row C: More count or status */}
                                    <div className="min-h-[20px] flex items-center pt-0.5">
                                        {hasMultiProducts ? (
                                            <span className="text-xs text-muted-foreground/75">
                                                + {products.length - 2} more product{products.length - 2 > 1 ? 's' : ''} in catalog
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground/60">
                                                Active campaign item
                                            </span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* 3. GENERATION */}
                    <div className="flex flex-col justify-between pt-4 md:pt-0 md:pl-6 space-y-1">
                        <div className="flex h-5 items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <Sparkles className="h-3.5 w-3.5 text-muted-foreground/70" />
                            <span>Generation</span>
                        </div>

                        <div className="space-y-1 pt-1.5">
                            {/* Row A: Primary Generation Mode */}
                            <p className="text-sm font-semibold text-foreground truncate min-h-[20px] leading-tight">
                                {generationLabel}
                            </p>

                            {/* Row B: Total Count */}
                            <p className="text-xs text-muted-foreground truncate min-h-[18px]">
                                {totalDesignCount} {totalDesignCount === 1 ? 'creative visual' : 'creative visuals'}
                            </p>

                            {/* Row C: Draft / Final Breakdown */}
                            <div className="min-h-[20px] flex items-center pt-0.5">
                                {totalDesignCount > 0 ? (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
                                        <span>{finalCount} final</span>
                                        <span className="text-muted-foreground/40">•</span>
                                        <span>{draftCount} draft{draftCount === 1 ? '' : 's'}</span>
                                    </div>
                                ) : (
                                    <span className="text-xs text-muted-foreground/60">
                                        Studio synthesis ready
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* System View Event Modal */}
            <ViewEventDialog
                event={eventModalData}
                open={isViewEventOpen}
                onOpenChange={setIsViewEventOpen}
            />
        </>
    );
}
