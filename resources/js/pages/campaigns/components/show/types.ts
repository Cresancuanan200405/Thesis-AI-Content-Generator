export interface CampaignDesign {
    id: number;
    product_name?: string | null;
    tagline?: string | null;
    prompt?: string | null;
    price?: string | number | null;
    content_style?: string | null;
    brand_tone?: string | null;
    visual_theme?: string | null;
    render_style?: string | null;
    aspect_ratio?: string | null;
    generation_source?: 'Automatic' | 'Manual';
    status: string;
    is_draft: boolean;
    is_favorite?: boolean;
    created_at?: string;
    image_url: string | null;
    download_url?: string;
    generator_url?: string;
    generation_metadata?: Record<string, any>;
}

export interface CampaignProduct {
    id: number;
    name: string;
    price?: string | number | null;
}

export interface CampaignGenerationSummary {
    has_automatic: boolean;
    has_manual: boolean;
    automatic_count: number;
    manual_count: number;
    total_count: number;
    label: string;
}

export interface CampaignData {
    id: number;
    name: string;
    description?: string | null;
    status: string;
    objective?: string | null;
    target_audience?: string | null;
    product_id?: number | null;
    event_id?: number | null;
    product_name?: string | null;
    event_name?: string | null;
    event_date?: string | null;
    event_type?: string | null;
    event_category?: string | null;
    event_show_url?: string | null;
    event?: any | null;
    start_date: string | null;
    end_date: string | null;
    designs: CampaignDesign[];
    drafts: CampaignDesign[];
    final_designs: CampaignDesign[];
    creative_counts: {
        drafts: number;
        final: number;
        total: number;
    };
    generation_summary?: CampaignGenerationSummary;
    generator_url: string;
    product?: CampaignProduct | null;
}

export interface AvailableDesign {
    id: number;
    product_name?: string | null;
    event_id?: number | null;
    event_name?: string | null;
    is_matching_event?: boolean;
    image_url: string | null;
    created_at: string;
}
