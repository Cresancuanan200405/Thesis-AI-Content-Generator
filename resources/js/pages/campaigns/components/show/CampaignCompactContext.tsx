import { ArrowUpRight, ChevronDown, ChevronUp } from 'lucide-react';
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

    const hasMultiProducts = products.length > 2;

    return (
        <>
            <section className="mb-8 rounded-2xl border border-border/70 bg-muted/15 p-3.5 sm:p-4 text-xs">
            {/* 3-Column Compact Horizontal Region on Desktop: EVENT | PRODUCTS | GENERATION */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 divide-y md:divide-y-0 md:divide-x divide-border/60">
                {/* 1. EVENT */}
                <div className="pt-2 md:pt-0">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground block mb-1">
                        Event
                    </span>

                    {campaign.event_name ? (
                        <div className="space-y-0.5">
                            <p className="font-semibold text-foreground truncate" title={campaign.event_name}>
                                {campaign.event_name}
                            </p>

                            <p className="text-[11px] text-muted-foreground truncate">
                                {campaign.event_date ? `${campaign.event_date}` : ''}
                                {campaign.event_category
                                    ? ` · ${campaign.event_category.replace(/_/g, ' ')}`
                                    : ''}
                            </p>

                            {eventModalData && (
                                <button
                                    type="button"
                                    onClick={() => setIsViewEventOpen(true)}
                                    className="inline-flex items-center gap-0.5 text-[11px] font-medium text-primary hover:underline pt-0.5 cursor-pointer focus:outline-hidden"
                                >
                                    <span>View Event</span>
                                    <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                                </button>
                            )}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-[11px]">
                            General Campaign · No linked event
                        </p>
                    )}
                </div>

                {/* 2. PRODUCTS (Preserves multi-product names & authoritative prices) */}
                <div className="pt-3 md:pt-0 md:pl-6">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground block">
                            Products {products.length > 1 ? `(${products.length})` : ''}
                        </span>

                        {hasMultiProducts && (
                            <button
                                type="button"
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer focus:outline-hidden"
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

                    {products.length === 0 ? (
                        <p className="text-muted-foreground text-[11px]">
                            No specific catalog products attached
                        </p>
                    ) : (
                        <div className="space-y-1">
                            {(isExpanded ? products : products.slice(0, 2)).map((p, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-baseline justify-between gap-2 text-[11px]"
                                >
                                    <span
                                        className="font-medium text-foreground truncate"
                                        title={p.name}
                                    >
                                        {p.name}
                                    </span>
                                    {p.price !== null && p.price !== undefined && p.price !== '' && (
                                        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                                            ₱{p.price}
                                        </span>
                                    )}
                                </div>
                            ))}

                            {!isExpanded && hasMultiProducts && (
                                <p className="text-[10px] text-muted-foreground pt-0.5">
                                    + {products.length - 2} more product{products.length - 2 > 1 ? 's' : ''}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* 3. GENERATION (Summarizes generation workflows represented in the campaign) */}
                <div className="pt-3 md:pt-0 md:pl-6">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground block mb-1">
                        Generation
                    </span>

                    <div className="space-y-0.5">
                        <p className="font-semibold text-foreground truncate">
                            {generationLabel}
                        </p>

                        <p className="text-[11px] text-muted-foreground truncate">
                            {totalDesignCount} {totalDesignCount === 1 ? 'design' : 'designs'}
                        </p>
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
