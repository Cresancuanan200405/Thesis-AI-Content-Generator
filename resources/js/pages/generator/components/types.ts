import {
    Briefcase,
    Building2,
    Car,
    Coffee,
    Cpu,
    Dumbbell,
    GraduationCap,
    HeartPulse,
    Landmark,
    Plane,
    Shirt,
    ShoppingBag,
    ShoppingBasket,
    Sparkles,
    Utensils,
    UtensilsCrossed,
} from 'lucide-react';

/* ==========================================================================
   TYPES & CONSTANTS
========================================================================== */

export type Step = 1 | 2 | 3;
export type TaglineMode = 'manual' | 'ai' | 'none';
export type GenerationState = 'idle' | 'generating' | 'ready' | 'error';
export type ImageQuality = 'low' | 'medium' | 'high';

export interface EventItem {
    id: number | string;
    name: string;
    date?: string | null;
    event_date?: string | null;
    days?: number | string | null;
    type?: string | null;
    category?: string | null;
    description?: string | null;
    is_long_weekend?: boolean;
    long_weekend_details?: string | null;
    proclamation_no?: string | null;
}

export interface ProductItem {
    id: number | string;
    name: string;
    description?: string | null;
    price?: string | number | null;
    image_url?: string | null;
    image_path?: string | null;
    category?: string | null;
}

export interface CustomProductItem {
    id: string;
    name: string;
    price: string;
}

export interface CampaignItem {
    id: number | string;
    name: string;
    status?: string;
    event_id?: number | string | null;
    event_name?: string | null;
    product_id?: number | string | null;
    product_name?: string | null;
    target_audience?: string | null;
    objective?: string | null;
    start_date?: string | null;
    end_date?: string | null;
}

export interface BusinessItem {
    id: number | string;
    name: string;
    industry?: string | null;
    category?: string | null;
    description?: string | null;
    target_audience?: string | null;
    unique_selling_point?: string | null;
    content_style?: string[] | null;
    default_tagline_behavior?: string | null;
}

export type BusinessProfile = BusinessItem;

export interface GeneratedDesign {
    id?: number | string | null;
    image_url: string;
    generated_image_path?: string;
    product_name?: string;
    tagline?: string;
    aspect_ratio?: string;
    image_model?: string;
    generation_meta?: Record<string, any>;
    headline?: string;
    prompt?: string;
    isSaved?: boolean;
    created_at?: string;
}

export interface GeneratedVisual {
    id: string;
    imageUrl: string;
    prompt: string;
    productName: string;
    productId?: number | string;
    price?: string | number;
    tagline?: string;
    renderStyle?: string;
    aspectRatio?: string;
    imageModel?: string;
    imageQuality?: ImageQuality;
    createdAt: Date;
    isSaved?: boolean;
    campaignId?: number | string;
    creativeConcept?: string;
    visualStrategy?: string;
}

export interface ImageModelOption {
    value: string;
    label: string;
    tag: string;
    speed: string;
    quality: string;
    price: string;
    pricePhp: string;
    description: string;
    outcome: string;
    badgeColor: string;
    isRecommended?: boolean;
}

export interface ImageQualityOption {
    value: ImageQuality;
    label: string;
    tag: string;
    multiplier: number;
    description: string;
    costExplanation: string;
    badgeColor: string;
    isStandard?: boolean;
}

export interface AspectRatioOption {
    value: string;
    label: string;
    description: string;
    badge: string;
}

export interface RenderStyleOption {
    value: string;
    label: string;
    tagline: string;
    description: string;
    badge: string;
    badgeColor: string;
}

export const EXACT_MODEL_QUALITY_PRICING: Record<
    string,
    Record<ImageQuality, { usd: number; php: number; totalOn20: number }>
> = {
    'gpt-image-1-mini': {
        low: { usd: 0.005, php: 0.29, totalOn20: 4000 },
        medium: { usd: 0.011, php: 0.63, totalOn20: 1818 },
        high: { usd: 0.036, php: 2.07, totalOn20: 555 },
    },
    'chatgpt-image-latest': {
        low: { usd: 0.009, php: 0.52, totalOn20: 2222 },
        medium: { usd: 0.034, php: 1.96, totalOn20: 588 },
        high: { usd: 0.133, php: 7.65, totalOn20: 150 },
    },
    'gpt-image-1': {
        low: { usd: 0.011, php: 0.63, totalOn20: 1818 },
        medium: { usd: 0.042, php: 2.42, totalOn20: 476 },
        high: { usd: 0.167, php: 9.6, totalOn20: 119 },
    },
    'gpt-image-1.5': {
        low: { usd: 0.02, php: 1.15, totalOn20: 1000 },
        medium: { usd: 0.04, php: 2.3, totalOn20: 500 },
        high: { usd: 0.08, php: 4.6, totalOn20: 250 },
    },
    'gpt-image-2': {
        low: { usd: 0.006, php: 0.35, totalOn20: 3333 },
        medium: { usd: 0.053, php: 3.05, totalOn20: 377 },
        high: { usd: 0.211, php: 12.13, totalOn20: 94 },
    },
};

export const imageModelOptions: ImageModelOption[] = [
    {
        value: 'gpt-image-2',
        label: 'GPT-Image-2',
        tag: 'Recommended',
        speed: 'Typical (~6-9s)',
        quality: 'Photorealistic Pro',
        price: '$0.053 / gen',
        pricePhp: '~₱3.05',
        description:
            'OpenAI flagship engine for photorealistic campaigns, billboard visuals, and luxury lookbooks with direct image input support.',
        outcome:
            'Flawless commercial realism, fine typography synthesis, ray-traced shadows, and studio finish.',
        badgeColor:
            'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        isRecommended: true,
    },
    {
        value: 'gpt-image-1.5',
        label: 'GPT-Image-1.5',
        tag: 'Previous',
        speed: 'Typical (~5-7s)',
        quality: 'High Detail',
        price: '$0.040 / gen',
        pricePhp: '~₱2.30',
        description:
            'Previous generation rendering for intricate textures, micro-details, and elegant depth.',
        outcome:
            'Studio reflections (glass, metal, fabric) and fine textured depth-of-field.',
        badgeColor:
            'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    {
        value: 'gpt-image-1',
        label: 'GPT-Image-1',
        tag: 'Previous',
        speed: 'Typical (~4-6s)',
        quality: 'Commercial Standard',
        price: '$0.042 / gen',
        pricePhp: '~₱2.42',
        description:
            'Previous commercial benchmark for product showcases, seasonal sales, and branded ads.',
        outcome:
            'Sharp product focal points, balanced commercial lighting, and brand colors.',
        badgeColor:
            'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    },
    {
        value: 'gpt-image-1-mini',
        label: 'GPT-Image-1 Mini',
        tag: 'Previous / Fast',
        speed: 'Fast (~2-4s)',
        quality: 'Standard Crisp',
        price: '$0.011 / gen',
        pricePhp: '~₱0.63',
        description:
            'Fastest turnarounds and maximum budget efficiency (up to 4,000 images on $20).',
        outcome:
            'Lightweight, high-contrast promotional visuals with fast turnaround.',
        badgeColor:
            'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
        value: 'chatgpt-image-latest',
        label: 'ChatGPT Image Latest',
        tag: 'Previous',
        speed: 'Adaptive (~4-7s)',
        quality: 'Creative Fidelity',
        price: '$0.034 / gen',
        pricePhp: '~₱1.96',
        description:
            'Adaptive checkpoint tuned for narrative context, lifestyle backdrops, and creative storytelling.',
        outcome:
            'Contextual scene lighting, natural lifestyle framing, and creative compositions.',
        badgeColor:
            'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    },
];

export const imageQualityOptions: ImageQualityOption[] = [
    {
        value: 'low',
        label: 'Low (Draft)',
        tag: 'Draft Mode',
        multiplier: 0.5,
        description:
            'Fastest generation & maximum token savings (up to 4,000 imgs on $20).',
        costExplanation:
            'Reduced render passes for rapid brainstorming and low-cost concept drafts.',
        badgeColor:
            'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    {
        value: 'medium',
        label: 'Medium (Standard)',
        tag: 'Commercial Standard',
        multiplier: 1.0,
        description:
            'Recommended standard for commercial social posts, ads, and web banners.',
        costExplanation:
            'Optimal balance of commercial polish, detail clarity, and cost.',
        badgeColor:
            'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        isStandard: true,
    },
    {
        value: 'high',
        label: 'High (HD Studio)',
        tag: 'HD Studio Fidelity',
        multiplier: 2.0,
        description:
            'Max resolution, studio lighting, crisp micro-details, and high-DPI finish.',
        costExplanation:
            'Enhanced multi-pass synthesis for flagship campaigns and print assets.',
        badgeColor:
            'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    },
];

export const renderStyleOptions: RenderStyleOption[] = [
    {
        value: 'Studio Product Still',
        label: 'Studio Product Still',
        tagline: 'Clean studio focus & balanced light',
        description:
            'Forces sharp product focus, clean solid or textured backdrops, and balanced high-end commercial studio lighting.',
        badge: 'Studio Focus',
        badgeColor:
            'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
        value: 'Cinematic Marketing',
        label: 'Cinematic Marketing',
        tagline: 'Volumetric depth & editorial drama',
        description:
            'Adds dynamic volumetric lighting, shallow depth of field, rich shadows, and a premium editorial look.',
        badge: 'Volumetric Depth',
        badgeColor:
            'border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
    {
        value: 'Lifestyle Capture',
        label: 'Lifestyle Capture',
        tagline: 'Authentic contextual scene',
        description:
            'Simulates realistic environmental context and natural lighting as if captured on location by a professional photographer.',
        badge: 'Natural Context',
        badgeColor:
            'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
        value: 'Minimalist Graphic Vec',
        label: 'Minimalist Graphic Vec',
        tagline: 'Sharp vector geometry & flat style',
        description:
            'Simplifies elements into modern flat illustrations, stark high-contrast layouts, and clean vector geometries.',
        badge: 'Flat Vector',
        badgeColor:
            'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
];

export function calculateGenerationCost(
    modelValue: string,
    qualityValue: ImageQuality = 'medium',
) {
    const modelKey = EXACT_MODEL_QUALITY_PRICING[modelValue]
        ? modelValue
        : 'gpt-image-1';
    const entry =
        EXACT_MODEL_QUALITY_PRICING[modelKey][qualityValue] ||
        EXACT_MODEL_QUALITY_PRICING[modelKey].medium;

    return {
        usdValue: entry.usd,
        usd: `$${entry.usd.toFixed(3)} / gen`,
        usdShort: `$${entry.usd.toFixed(3)}`,
        php: `~₱${entry.php.toFixed(2)}`,
        totalOn20: entry.totalOn20,
    };
}

export const aspectRatioOptions: AspectRatioOption[] = [
    {
        value: '1:1',
        label: '1:1 Square',
        description: 'Instagram & Facebook Feed',
        badge: '1024 × 1024',
    },
    {
        value: '9:16',
        label: '9:16 Story / Reel',
        description: 'Stories, Reels & TikTok',
        badge: '1024 × 1792',
    },
    {
        value: '16:9',
        label: '16:9 Landscape',
        description: 'Facebook Cover & Banners',
        badge: '1792 × 1024',
    },
    {
        value: '4:5',
        label: '4:5 Portrait',
        description: 'Instagram Feed Portrait (Framed)',
        badge: '1024 × 1024 (4:5)',
    },
    {
        value: '4:3',
        label: '4:3 Standard',
        description: 'Display Ads & Content (Framed)',
        badge: '1792 × 1024 (4:3)',
    },
];

export const contentStyleOptions: string[] = [
    'Product-focused',
    'Lifestyle',
    'Promotional',
    'Educational',
    'Social Media',
    'Seasonal',
    'Minimal',
    'Storytelling',
    'Premium',
    'Editorial',
];

export const contentStyleDescriptions: Record<string, string> = {
    'Product-focused':
        'Sharp focal emphasis highlighting product craft, materials, and form.',
    Lifestyle: 'Real-life context showing the product organically in use.',
    Promotional:
        'High-conversion commercial energy tailored for sales, offers, and discounts.',
    Educational:
        'Clear visual hierarchy highlighting features and key value propositions.',
    'Social Media':
        'Vibrant, scroll-stopping aesthetic optimized for mobile feeds and stories.',
    Seasonal:
        'Thematic holiday accents, festive color palettes, and seasonal mood.',
    Minimal:
        'Clean negative space, subtle textures, and uncluttered modern composition.',
    Storytelling:
        'Evocative visual narrative that connects emotionally with viewers.',
    Premium: 'Luxury textures, refined lighting, and prestigious brand finish.',
    Editorial:
        'Magazine-style art direction with sophisticated artistic framing.',
};

export const toneOptions: string[] = [
    'Professional',
    'Friendly',
    'Luxury',
    'Playful',
    'Minimal',
    'Bold',
    'Elegant',
    'Warm',
    'Modern',
    'Inspiring',
];

export const brandToneDescriptions: Record<string, string> = {
    Professional: 'Trustworthy, polished, and corporate-ready tone.',
    Friendly: 'Approachable, warm, and inviting everyday feel.',
    Luxury: 'Opulent, sophisticated, and exclusive prestige.',
    Playful: 'Fun, energetic, and spirited personality.',
    Minimal: 'Restrained, understated, and elegantly simple.',
    Bold: 'Audacious, high-contrast, and commanding presence.',
    Elegant: 'Graceful, refined, and timeless aesthetic.',
    Warm: 'Cozy, welcoming, and golden-hour atmosphere.',
    Modern: 'Contemporary, sleek, and trend-forward look.',
    Inspiring: 'Uplifting, ambitious, and motivating energy.',
};

export const renderingStatusPhrases = [
    'Understanding your creative...',
    'Building the scene...',
    'Balancing visual space...',
    'Designing the typography...',
    'Refining product details...',
    'Applying campaign direction...',
    'Finalizing the composition...',
];

export const automaticStatusPhrases = [
    'Creating campaign tagline…',
    'Creating creative concept…',
    'Preparing visual prompt…',
    'Generating final image…',
];

export function formatEventDateLabel(value?: string | null): string {
    if (!value) {
        return 'No date';
    }

    const [year, month, day] = value.split('-').map(Number);

    if (!year || !month || !day) {
        return value;
    }

    const date = new Date(year, month - 1, day);

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
}

export const resolveIndustryIcon = (
    industry?: string | null,
    category?: string | null,
) => {
    const raw = `${industry || ''} ${category || ''}`.toLowerCase().trim();

    if (!raw) {
        return Sparkles;
    }

    if (
        raw.includes('coffee') ||
        raw.includes('cafe') ||
        raw.includes('café') ||
        raw.includes('tea') ||
        raw.includes('beverage')
    ) {
        return Coffee;
    }

    if (
        raw.includes('food') ||
        raw.includes('restaurant') ||
        raw.includes('dining') ||
        raw.includes('eatery')
    ) {
        return UtensilsCrossed;
    }

    if (
        raw.includes('bakery') ||
        raw.includes('pastry') ||
        raw.includes('bread') ||
        raw.includes('dessert') ||
        raw.includes('cake')
    ) {
        return Utensils;
    }

    if (
        raw.includes('fashion') ||
        raw.includes('apparel') ||
        raw.includes('clothing') ||
        raw.includes('wear') ||
        raw.includes('garment')
    ) {
        return Shirt;
    }

    if (
        raw.includes('beauty') ||
        raw.includes('wellness') ||
        raw.includes('cosmetic') ||
        raw.includes('skincare') ||
        raw.includes('salon')
    ) {
        return Sparkles;
    }

    if (
        raw.includes('fitness') ||
        raw.includes('gym') ||
        raw.includes('sport') ||
        raw.includes('workout')
    ) {
        return Dumbbell;
    }

    if (
        raw.includes('grocery') ||
        raw.includes('market') ||
        raw.includes('supermarket') ||
        raw.includes('produce')
    ) {
        return ShoppingBasket;
    }

    if (
        raw.includes('retail') ||
        raw.includes('e-commerce') ||
        raw.includes('shop') ||
        raw.includes('store')
    ) {
        return ShoppingBag;
    }

    if (
        raw.includes('tech') ||
        raw.includes('software') ||
        raw.includes('app') ||
        raw.includes('digital') ||
        raw.includes('it')
    ) {
        return Cpu;
    }

    if (
        raw.includes('health') ||
        raw.includes('medical') ||
        raw.includes('clinic') ||
        raw.includes('care')
    ) {
        return HeartPulse;
    }

    if (
        raw.includes('real estate') ||
        raw.includes('property') ||
        raw.includes('realty') ||
        raw.includes('housing')
    ) {
        return Building2;
    }

    if (
        raw.includes('education') ||
        raw.includes('school') ||
        raw.includes('academy') ||
        raw.includes('learning')
    ) {
        return GraduationCap;
    }

    if (
        raw.includes('professional') ||
        raw.includes('consulting') ||
        raw.includes('agency') ||
        raw.includes('service') ||
        raw.includes('legal')
    ) {
        return Briefcase;
    }

    if (
        raw.includes('travel') ||
        raw.includes('hospitality') ||
        raw.includes('hotel') ||
        raw.includes('tourism') ||
        raw.includes('flight')
    ) {
        return Plane;
    }

    if (
        raw.includes('auto') ||
        raw.includes('vehicle') ||
        raw.includes('car') ||
        raw.includes('motor')
    ) {
        return Car;
    }

    if (
        raw.includes('finance') ||
        raw.includes('banking') ||
        raw.includes('investment') ||
        raw.includes('accounting')
    ) {
        return Landmark;
    }

    return Sparkles;
};

export const getIndustryIconComponent = resolveIndustryIcon;
