export interface BaseImageViewerItem {
    id: number | string;
    imageUrl?: string | null;
    title?: string;
}

export interface ProductViewerItem {
    id: number;
    name: string;
    price?: number | string | null;
    image_url?: string | null;
    created_at?: string;
    edit_url?: string;
}

export interface DesignViewerItem {
    id: number;
    product_name?: string | null;
    image_url: string;
    download_url?: string | null;
    status?: string | null;
    is_draft?: boolean;
    model?: string | null;
    campaign_name?: string | null;
    campaign_id?: number | null;
    event_name?: string | null;
    event_id?: number | null;
    aspect_ratio?: string | null;
    price?: string | number | null;
    tagline?: string | null;
    prompt?: string | null;
    negative_prompt?: string | null;
    render_style?: string | null;
    content_style?: string | string[] | null;
    visual_theme?: string | string[] | null;
    brand_tone?: string | string[] | null;
    dimensions?: string | null;
    generation_metadata?: Record<string, any>;
    generator_url?: string | null;
    created_at?: string;
    is_favorite?: boolean;
}

export interface CampaignViewerItem {
    id: number;
    product_name?: string | null;
    image_url: string;
    download_url?: string | null;
    status?: string | null;
    is_draft?: boolean;
    aspect_ratio?: string | null;
    price?: string | number | null;
    tagline?: string | null;
    prompt?: string | null;
    negative_prompt?: string | null;
    render_style?: string | null;
    content_style?: string | string[] | null;
    visual_theme?: string | string[] | null;
    brand_tone?: string | string[] | null;
    dimensions?: string | null;
    generation_metadata?: Record<string, any>;
    generator_url?: string | null;
    created_at?: string;
    model?: string | null;
}

export interface GeneratorGenerationMeta {
    model?: string;
    generation_method?: string;
    compositor_engine?: string;
    engine?: string;
    fallback_state?: string;
    creative_fingerprint?: string;
    creative_concept?: string;
    visual_strategy?: string;
    design_treatment?: string;
    copyEmphasis?: string;
    copy_emphasis?: string;
    render_style?: string;
    composition?: string;
    composition_type?: string;
    camera_viewpoint?: string;
    lighting_profile?: string;
    show_event_text?: boolean;
    duration_seconds?: number | string;
    event_name?: string;
    prompt?: string;
    [key: string]: unknown;
}

export interface GeneratorViewerItem {
    id?: number | string | null;
    image_url: string;
    generated_image_path?: string;
    product_name?: string;
    tagline?: string;
    aspect_ratio?: string;
    image_model?: string;
    generation_meta?: GeneratorGenerationMeta;
    headline?: string;
    prompt?: string;
    isSaved?: boolean;
    created_at?: string;
    status?: string;
    is_draft?: boolean;
    generator_url?: string;
}

export type ZoomLevel = number | 'fit';

export interface PanCoordinates {
    x: number;
    y: number;
}

export type BackgroundSurface = 'cinema' | 'neutral' | 'checkerboard';

export type ViewerContextType = 'product' | 'design' | 'campaign' | 'generator';

export interface UnifiedImageViewerProps<T = any> {
    isOpen: boolean;
    onClose: () => void;
    items: T[];
    currentIndex: number;
    onNavigate: (newIndex: number) => void;
    context: ViewerContextType;

    // Actions & Handlers
    onDownload?: (item: T, format: 'png' | 'jpeg' | 'svg') => void;
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => void;
    onGenerateAi?: (item: T) => void;

    // Design & Campaign Specific Handlers
    onFinalize?: (item: T) => void;
    isFinalizing?: boolean;
    onRegenerate?: (item: T) => void;
    isRegenerating?: boolean;
    onFavoriteToggle?: (item: T) => void;
    isFavorite?: (item: T) => boolean;
    getStudioUrl?: (item: T) => string;

    // Optional custom panel renderer or fallback
    renderCustomPanel?: (item: T) => React.ReactNode;
}

