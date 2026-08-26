import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    Building2,
    Calendar,
    CalendarDays,
    Camera,
    Check,
    ChevronDown,
    Clapperboard,
    Clock,
    Compass,
    Download,
    Edit3,
    ExternalLink,
    FolderPlus,
    ImageIcon,
    Laptop,
    Layers,
    Loader2,
    Maximize2,
    Package,
    Palette,
    PanelRightClose,
    PanelRightOpen,
    PenTool,
    Plus,
    RefreshCcw,
    Search,
    Sparkles,
    Tag,
    Trash2,
    Upload,
    Wand2,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { HelpTooltip } from '@/components/help-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { downloadVisualAsFormat } from '@/lib/download';

/* ==========================================================================
   TYPES & CONSTANTS
========================================================================== */

type Step = 1 | 2 | 3;
type TaglineMode = 'manual' | 'ai' | 'none';
type GenerationState = 'idle' | 'generating' | 'ready';
export type ImageQuality = 'low' | 'medium' | 'high';

interface EventItem {
    id: number | string;
    name: string;
    date?: string | null;
    days?: number | string | null;
    type?: string | null;
    category?: string | null;
    is_long_weekend?: boolean;
    long_weekend_details?: string | null;
    proclamation_no?: string | null;
}

interface ProductItem {
    id: number | string;
    name: string;
    description?: string | null;
    price?: string | number | null;
    image_url?: string | null;
}

interface GeneratorForm {
    product_name: string;
    image_prompt: string;
    price: string;
    event_id: string;
    product_id: string;
    content_style: string[];
    brand_tone: string[];
    render_style: string;
    tagline_mode: TaglineMode;
    tagline: string;
    reference_image: File | null;
    include_logo: boolean;
    aspect_ratio: string;
    image_model: string;
    image_quality: ImageQuality;
    campaign_id?: string;
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
        high: { usd: 0.167, php: 9.60, totalOn20: 119 },
    },
    'gpt-image-1.5': {
        low: { usd: 0.020, php: 1.15, totalOn20: 1000 },
        medium: { usd: 0.040, php: 2.30, totalOn20: 500 },
        high: { usd: 0.080, php: 4.60, totalOn20: 250 },
    },
    'gpt-image-2': {
        low: { usd: 0.006, php: 0.35, totalOn20: 3333 },
        medium: { usd: 0.053, php: 3.05, totalOn20: 377 },
        high: { usd: 0.211, php: 12.13, totalOn20: 94 },
    },
};

const imageModelOptions: ImageModelOption[] = [
    {
        value: 'gpt-image-1-mini',
        label: 'gpt-image-1-mini',
        tag: 'Fastest & Cheapest',
        speed: 'Ultra Fast (~3s)',
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
        value: 'gpt-image-1',
        label: 'gpt-image-1',
        tag: 'Deprecating Oct 2026',
        speed: 'Balanced (~5s)',
        quality: 'Commercial Standard',
        price: '$0.042 / gen',
        pricePhp: '~₱2.42',
        description:
            'Commercial benchmark for product showcases, seasonal sales, and branded ads.',
        outcome:
            'Sharp product focal points, balanced commercial lighting, and brand colors.',
        badgeColor:
            'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        isRecommended: true,
    },
    {
        value: 'chatgpt-image-latest',
        label: 'chatgpt-image-latest',
        tag: 'Standard ChatGPT View',
        speed: 'Adaptive (~6s)',
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
    {
        value: 'gpt-image-1.5',
        label: 'gpt-image-1.5',
        tag: 'Previous Flagship',
        speed: 'Enhanced (~7s)',
        quality: 'High Detail',
        price: '$0.040 / gen',
        pricePhp: '~₱2.30',
        description:
            'Next-generation rendering for intricate textures, micro-details, and elegant depth.',
        outcome:
            'Studio reflections (glass, metal, fabric) and fine textured depth-of-field.',
        badgeColor:
            'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    {
        value: 'gpt-image-2',
        label: 'gpt-image-2',
        tag: 'Flagship Photorealism',
        speed: 'Deep Studio (~9s)',
        quality: 'Photorealistic Pro',
        price: '$0.053 / gen',
        pricePhp: '~₱3.05',
        description:
            'OpenAI flagship engine for photorealistic campaigns, billboard visuals, and luxury lookbooks.',
        outcome:
            'Flawless commercial realism, fine typography synthesis, ray-traced shadows, and studio finish.',
        badgeColor:
            'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    },
];

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

export interface RenderStyleOption {
    value: string;
    label: string;
    tagline: string;
    description: string;
    badge: string;
    badgeColor: string;
}

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

const aspectRatioOptions = [
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

const contentStyleOptions: string[] = [
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

const contentStyleDescriptions: Record<string, string> = {
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
    Premium:
        'Luxury textures, refined lighting, and prestigious brand finish.',
    Editorial:
        'Magazine-style art direction with sophisticated artistic framing.',
};

const toneOptions: string[] = [
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

const brandToneDescriptions: Record<string, string> = {
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

const eventTypeStyles: Record<
    string,
    { bg: string; text: string; border: string; label: string }
> = {
    regular: {
        bg: 'bg-rose-500/10 dark:bg-rose-500/20',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-500/30',
        label: 'Regular Holiday',
    },
    special_non_working: {
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-500/30',
        label: 'Special Non-Working',
    },
    special_working: {
        bg: 'bg-orange-500/10 dark:bg-orange-500/20',
        text: 'text-orange-700 dark:text-orange-300',
        border: 'border-orange-500/30',
        label: 'Special Working',
    },
    islamic: {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-500/30',
        label: 'Islamic Holiday',
    },
    holiday: {
        bg: 'bg-rose-500/10 dark:bg-rose-500/20',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-500/30',
        label: 'Regular Holiday',
    },
    seasonal: {
        bg: 'bg-teal-500/10 dark:bg-teal-500/20',
        text: 'text-teal-700 dark:text-teal-300',
        border: 'border-teal-500/30',
        label: 'Seasonal Theme',
    },
    commercial: {
        bg: 'bg-blue-500/10 dark:bg-blue-500/20',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-500/30',
        label: 'Commercial',
    },
    custom: {
        bg: 'bg-purple-500/10 dark:bg-purple-500/20',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-500/30',
        label: 'Custom',
    },
};

/* ==========================================================================
   DYNAMIC PROMPT & STYLE SUGGESTION ENGINE
========================================================================== */

const promptArchetypes = [
    (prod: string, evt: string) =>
        `Hero isometric 45-degree angle commercial product photography of ${prod}, placed gracefully on a sleek modern pedestal with tasteful ${evt} decorative accents, warm golden rim lighting, soft depth of field, pristine advertising presentation.`,
    (prod: string, evt: string) =>
        `Eye-level vibrant editorial lifestyle visual featuring ${prod} in the heart of an authentic ${evt} setting, natural soft window sunlight, celebratory atmosphere, authentic social media hero composition.`,
    (prod: string, evt: string) =>
        `Macro craftsmanship close-up focusing on the fine textures and premium details of ${prod}, with dreamy ${evt} holiday bokeh in the background, razor-sharp focus, luxury magazine quality.`,
    (prod: string, evt: string) =>
        `Monumental low-angle hero perspective of ${prod} against a stylish architectural ${evt} backdrop, bold studio rim lights, commanding commercial presence, 8k crisp details.`,
    (prod: string, evt: string) =>
        `Dynamic levitating product composition of ${prod}, suspended in mid-air with gentle floating festive particles and celebration ribbons for ${evt}, high-speed strobe clarity, punchy contrast.`,
    (prod: string, evt: string) =>
        `Minimalist Japanese & Scandinavian flat-lay overhead view of ${prod}, arranged with geometric negative space and organic seasonal ${evt} botanicals, matte ceramics, clean catalog aesthetic.`,
    (prod: string, evt: string) =>
        `Opulent dark-mode studio showcase of ${prod} on a polished obsidian surface, illuminated by sleek metallic ribbons and modern spotlights themed for ${evt}, radiant specular reflections.`,
    (prod: string, evt: string) =>
        `Warm and cozy fireside storytelling scene featuring ${prod} on a rustic textured table, surrounded by gentle candle glow and celebratory ${evt} warmth, cinematic depth.`,
    (prod: string, evt: string) =>
        `Sun-drenched outdoor lifestyle terrace scene featuring ${prod}, with natural organic wood surfaces, gentle sunny lens flare, and breezy aspirational ${evt} vibes.`,
    (prod: string, evt: string) =>
        `Dual-tone split colorblock studio advertisement for ${prod}, with sharp graphic shadow cuts and modern pop-art ${evt} motifs, vibrant and eye-catching retail presentation.`,
    (prod: string, evt: string) =>
        `Crystal-clear mirror and water caustics staging of ${prod}, delicate ripple reflections, clean glass accents, luxury perfume & beverage grade ${evt} commercial look.`,
    (prod: string, evt: string) =>
        `Festive unboxing and gift reveal scene with ${prod} emerging from premium satin-lined packaging, curling celebratory ribbons, ambient ${evt} sparkle, high anticipation visual.`,
    (prod: string, evt: string) =>
        `Modern architectural glassmorphism visual of ${prod}, framed by translucent frosted acrylic panels and soft glowing neon gradients tailored for ${evt}, sleek tech-forward marketing aesthetic.`,
    (prod: string, evt: string) =>
        `Monochromatic tonal studio elegance with ${prod} harmonizing with a curated single-color background and refined ${evt} props, accentuated with edge lighting and rich textures.`,
    (prod: string, evt: string) =>
        `High-energy celebratory street festival backdrop for ${prod}, with swirling colorful confetti, energetic ambient bokeh, and festive ${evt} illumination for maximum social engagement.`,
    (prod: string, evt: string) =>
        `Editorial marble vanity countertop presentation of ${prod}, soft morning side-light, tasteful lifestyle props, understated luxury ${evt} campaign visual.`,
    (prod: string, evt: string) =>
        `Dynamic splash and particle burst action shot of ${prod}, featuring crisp celebratory elements flying outward with precision, high-energy ${evt} promotional visual.`,
    (prod: string, evt: string) =>
        `Futuristic dark stage featuring ${prod} with subtle glowing holographic lines and iridescent color rim highlights themed for ${evt}, premium cutting-edge advertisement.`,
];

const eventStyleBanks: Record<
    string,
    Array<{ styles: string[]; tones: string[]; renderStyle: string }>
> = {
    holiday: [
        {
            renderStyle: 'Studio Product Still',
            styles: ['Product-focused', 'Premium', 'Minimal'],
            tones: ['Luxury', 'Modern', 'Professional'],
        },
        {
            renderStyle: 'Cinematic Marketing',
            styles: ['Seasonal', 'Editorial', 'Premium'],
            tones: ['Luxury', 'Elegant', 'Bold'],
        },
        {
            renderStyle: 'Lifestyle Capture',
            styles: ['Lifestyle', 'Storytelling', 'Seasonal'],
            tones: ['Warm', 'Friendly', 'Inspiring'],
        },
        {
            renderStyle: 'Minimalist Graphic Vec',
            styles: ['Promotional', 'Minimal', 'Product-focused'],
            tones: ['Bold', 'Modern', 'Playful'],
        },
    ],
    commercial: [
        {
            renderStyle: 'Minimalist Graphic Vec',
            styles: ['Promotional', 'Product-focused', 'Minimal'],
            tones: ['Bold', 'Modern', 'Professional'],
        },
        {
            renderStyle: 'Studio Product Still',
            styles: ['Minimal', 'Product-focused', 'Editorial'],
            tones: ['Modern', 'Bold', 'Luxury'],
        },
        {
            renderStyle: 'Cinematic Marketing',
            styles: ['Social Media', 'Promotional', 'Premium'],
            tones: ['Luxury', 'Bold', 'Modern'],
        },
        {
            renderStyle: 'Lifestyle Capture',
            styles: ['Lifestyle', 'Social Media', 'Promotional'],
            tones: ['Playful', 'Friendly', 'Warm'],
        },
    ],
    seasonal: [
        {
            renderStyle: 'Lifestyle Capture',
            styles: ['Seasonal', 'Lifestyle', 'Storytelling'],
            tones: ['Friendly', 'Warm', 'Inspiring'],
        },
        {
            renderStyle: 'Cinematic Marketing',
            styles: ['Editorial', 'Lifestyle', 'Premium'],
            tones: ['Elegant', 'Modern', 'Warm'],
        },
        {
            renderStyle: 'Studio Product Still',
            styles: ['Product-focused', 'Seasonal', 'Minimal'],
            tones: ['Modern', 'Friendly', 'Professional'],
        },
        {
            renderStyle: 'Minimalist Graphic Vec',
            styles: ['Social Media', 'Seasonal', 'Promotional'],
            tones: ['Playful', 'Bold', 'Modern'],
        },
    ],
    custom: [
        {
            renderStyle: 'Studio Product Still',
            styles: ['Product-focused', 'Lifestyle', 'Premium'],
            tones: ['Professional', 'Modern', 'Warm'],
        },
        {
            renderStyle: 'Cinematic Marketing',
            styles: ['Storytelling', 'Social Media', 'Promotional'],
            tones: ['Inspiring', 'Bold', 'Luxury'],
        },
        {
            renderStyle: 'Lifestyle Capture',
            styles: ['Lifestyle', 'Editorial', 'Social Media'],
            tones: ['Warm', 'Friendly', 'Modern'],
        },
        {
            renderStyle: 'Minimalist Graphic Vec',
            styles: ['Minimal', 'Editorial', 'Product-focused'],
            tones: ['Modern', 'Bold', 'Playful'],
        },
    ],
};

function formatEventDateLabel(value?: string | null): string {
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

export default function GeneratorPage() {
    const pageProps = usePage().props as any;
    const {
        business,
        campaign: initialCampaign,
        initial_campaign_id,
        initial_event_id,
        initial_product_name,
        products = [],
        events = [],
        campaigns = [],
    } = pageProps;

    const ai_usage = pageProps.ai_usage;
    const isQuotaExceeded =
        Boolean(ai_usage?.is_limit_reached) ||
        Number(ai_usage?.total_spent ?? 0) >=
            Number(ai_usage?.budget_limit ?? 20.0);

    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [generationState, setGenerationState] =
        useState<GenerationState>('idle');
    const [generationProgress, setGenerationProgress] = useState(0);

    // Form State
    const [form, setForm] = useState<GeneratorForm>(() => {
        let urlParams: URLSearchParams | null = null;
        if (typeof window !== 'undefined') {
            urlParams = new URLSearchParams(window.location.search);
        }

        const parseList = (val?: string | null): string[] => {
            if (!val) {
                return [];
            }

            return val
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
        };

        const initialContentStyle =
            parseList(urlParams?.get('content_style')) || [];
        const initialBrandTone = parseList(urlParams?.get('brand_tone')) || [];
        const initialRenderStyle =
            urlParams?.get('render_style') || 'Studio Product Still';
        const initialModel = urlParams?.get('image_model') || 'gpt-image-1';
        const initialQuality =
            (urlParams?.get('image_quality') as ImageQuality) || 'medium';
        const initialPrompt =
            urlParams?.get('prompt') || urlParams?.get('image_prompt') || '';
        const initialTagline = urlParams?.get('tagline') || '';
        const initialPrice = urlParams?.get('price') || '';
        const initialAspectRatio = urlParams?.get('aspect_ratio') || '1:1';
        const initialProductName =
            urlParams?.get('product_name') ||
            initial_product_name ||
            initialCampaign?.product_name ||
            '';
        const initialEventId =
            urlParams?.get('event_id') ||
            (initial_event_id
                ? String(initial_event_id)
                : initialCampaign?.event_id
                  ? String(initialCampaign.event_id)
                  : '');
        const initialCampaignId =
            urlParams?.get('campaign_id') ||
            (initial_campaign_id
                ? String(initial_campaign_id)
                : initialCampaign?.id
                  ? String(initialCampaign.id)
                  : '');
        const initialProductId =
            urlParams?.get('product_id') ||
            (initialCampaign?.product_id
                ? String(initialCampaign.product_id)
                : '');

        let initialIncludeLogo = Boolean(business?.logo_url);
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('ai_studio_include_logo');

            if (saved !== null) {
                initialIncludeLogo = saved === 'true';
            }
        }

        return {
            product_name: initialProductName,
            image_prompt: initialPrompt,
            price: initialPrice,
            event_id: initialEventId,
            product_id: initialProductId,
            campaign_id: initialCampaignId,
            content_style: initialContentStyle,
            brand_tone: initialBrandTone,
            render_style: initialRenderStyle,
            tagline_mode: initialTagline ? 'manual' : 'ai',
            tagline: initialTagline,
            reference_image: null,
            include_logo: initialIncludeLogo,
            aspect_ratio: initialAspectRatio,
            image_model: initialModel,
            image_quality: initialQuality,
        };
    });

    // Synchronize query params on client navigation
    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const params = new URLSearchParams(window.location.search);

        if (!params.toString()) {
            return;
        }

        const parseList = (val?: string | null): string[] => {
            if (!val) {
                return [];
            }

            return val
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
        };

        const cs = parseList(params.get('content_style'));
        const bt = parseList(params.get('brand_tone'));
        const rs = params.get('render_style');
        const model = params.get('image_model');
        const quality = params.get('image_quality') as ImageQuality | null;
        const prompt = params.get('prompt') || params.get('image_prompt');
        const tagline = params.get('tagline');
        const price = params.get('price');
        const ar = params.get('aspect_ratio');
        const prod = params.get('product_name');
        const evt = params.get('event_id');
        const camp = params.get('campaign_id');
        const pid = params.get('product_id');

        setForm((prev) => ({
            ...prev,
            product_name: prod !== null ? prod : prev.product_name,
            image_prompt: prompt !== null ? prompt : prev.image_prompt,
            price: price !== null ? price : prev.price,
            event_id: evt !== null ? evt : prev.event_id,
            campaign_id: camp !== null ? camp : prev.campaign_id,
            product_id: pid !== null ? pid : prev.product_id,
            content_style: cs.length > 0 ? cs : prev.content_style,
            brand_tone: bt.length > 0 ? bt : prev.brand_tone,
            render_style: rs || prev.render_style,
            image_model: model || prev.image_model,
            image_quality: quality || prev.image_quality,
            tagline: tagline !== null ? tagline : prev.tagline,
            tagline_mode: tagline ? 'manual' : prev.tagline_mode,
            aspect_ratio: ar || prev.aspect_ratio,
        }));
    }, []);

    // Reference image preview state
    const [referenceImagePreview, setReferenceImagePreview] = useState<
        string | null
    >(null);
    const [referenceImageSource, setReferenceImageSource] = useState<
        'none' | 'desktop' | 'product'
    >('none');
    const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(
        null,
    );
    const desktopFileInputRef = useRef<HTMLInputElement>(null);

    // Dynamic prompt tracking
    const [lastPromptIndex, setLastPromptIndex] = useState<number>(-1);
    const [lastTaglineIndex, setLastTaglineIndex] = useState<number>(-1);
    const [lastStyleSuggestionIndex, setLastStyleSuggestionIndex] =
        useState<number>(-1);

    // Modal states
    const [eventModalOpen, setEventModalOpen] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [eventSearchQuery, setEventSearchQuery] = useState('');
    const [eventCategoryFilter, setEventCategoryFilter] = useState('all');
    const [selectedYearTab, setSelectedYearTab] = useState(
        String(new Date().getFullYear()),
    );
    const [productSearchQuery, setProductSearchQuery] = useState('');
    const [isSummaryCollapsed, setIsSummaryCollapsed] = useState<boolean>(
        () => {
            if (typeof window !== 'undefined') {
                const saved = localStorage.getItem(
                    'generator_summary_collapsed',
                );

                if (saved !== null) {
                    return saved === 'true';
                }
            }

            return false;
        },
    );

    const handleSetSummaryCollapsed = (collapsed: boolean) => {
        setIsSummaryCollapsed(collapsed);

        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(
                    'generator_summary_collapsed',
                    String(collapsed),
                );
            } catch {
                // Ignore storage error
            }
        }
    };

    // Interactive Generation Progress states
    const [generationStage, setGenerationStage] = useState(0);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // Save & Campaign Link states
    const [isSavedToDesigns, setIsSavedToDesigns] = useState(false);
    const [isSavingDesign, setIsSavingDesign] = useState(false);
    const [savedDesign, setSavedDesign] = useState<any>(null);
    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
    const [campaignModalTab, setCampaignModalTab] = useState<
        'existing' | 'new'
    >('existing');
    const [selectedExistingCampaignId, setSelectedExistingCampaignId] =
        useState<string>('');
    const [isAttachingCampaign, setIsAttachingCampaign] = useState(false);
    const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
    const [isCampaignCreated, setIsCampaignCreated] = useState(false);
    const [campaignFormData, setCampaignFormData] = useState({
        name: '',
        event_id: '',
        start_date: '',
        end_date: '',
    });
    const [campaignFormErrors, setCampaignFormErrors] = useState<
        Record<string, string>
    >({});

    // Filter campaigns strictly by the holiday/event of the generated visual
    const eligibleCampaigns = useMemo(() => {
        if (!campaigns || !Array.isArray(campaigns)) {
            return [];
        }

        if (form.event_id) {
            return campaigns.filter(
                (c: any) => String(c.event_id) === String(form.event_id),
            );
        }

        return campaigns.filter((c: any) => !c.event_id);
    }, [campaigns, form.event_id]);

    // Full-screen viewer for generated visual
    const [isPreviewFullViewOpen, setIsPreviewFullViewOpen] = useState(false);
    const [isFullViewDetailsExpanded, setIsFullViewDetailsExpanded] =
        useState(false);

    // Unsaved navigation warning modal
    const [isUnsavedExitModalOpen, setIsUnsavedExitModalOpen] = useState(false);
    const [pendingNavigationUrl, setPendingNavigationUrl] = useState<
        string | null
    >(null);
    const [navigatingConfirmed, setNavigatingConfirmed] = useState(false);

    // Edit and Regenerate confirmation modals
    const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
    const [isRegenerateConfirmOpen, setIsRegenerateConfirmOpen] =
        useState(false);

    // Quality selection confirmation & warning modal
    const [pendingQuality, setPendingQuality] = useState<ImageQuality | null>(
        null,
    );
    const [isQualityWarningOpen, setIsQualityWarningOpen] = useState(false);
    const [dontShowQualityWarningAgain, setDontShowQualityWarningAgain] =
        useState(false);

    const handleQualitySelect = (newQuality: ImageQuality) => {
        if (newQuality === form.image_quality) {
            return;
        }

        // Medium is standard — no warning needed to return to standard
        if (newQuality === 'medium') {
            setForm((prev) => ({ ...prev, image_quality: 'medium' }));
            return;
        }

        // Check if user previously dismissed warnings
        const isDismissed =
            typeof window !== 'undefined' &&
            localStorage.getItem('marketpilot_dismiss_quality_warning') ===
                'true';

        if (isDismissed) {
            setForm((prev) => ({ ...prev, image_quality: newQuality }));
            return;
        }

        // Show warning confirmation modal
        setPendingQuality(newQuality);
        setIsQualityWarningOpen(true);
    };

    const handleConfirmQualityChange = () => {
        if (pendingQuality) {
            setForm((prev) => ({ ...prev, image_quality: pendingQuality }));

            if (dontShowQualityWarningAgain && typeof window !== 'undefined') {
                try {
                    localStorage.setItem(
                        'marketpilot_dismiss_quality_warning',
                        'true',
                    );
                } catch {
                    // Ignore storage error
                }
            }
        }

        setIsQualityWarningOpen(false);
        setPendingQuality(null);
    };

    // Selected event object
    const selectedEvent = useMemo(
        () =>
            events.find(
                (e: EventItem) => String(e.id) === String(form.event_id),
            ) || null,
        [events, form.event_id],
    );

    // Active target campaign object
    const activeCampaign = useMemo(() => {
        if (!form.campaign_id) {
            return initialCampaign || null;
        }

        return (
            campaigns.find(
                (c: any) => String(c.id) === String(form.campaign_id),
            ) ||
            initialCampaign ||
            null
        );
    }, [campaigns, form.campaign_id, initialCampaign]);

    // Set URL query params on load (e.g. from My Designs "Edit in AI Studio" or Campaign Visuals)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const campaignIdParam =
                params.get('campaign_id') || params.get('campaign');
            const eventIdParam = params.get('event_id') || params.get('event');
            const productParam =
                params.get('product_name') || params.get('product');
            const priceParam = params.get('price');
            const taglineParam = params.get('tagline');
            const promptParam =
                params.get('prompt') || params.get('image_prompt');
            const aspectRatioParam = params.get('aspect_ratio');
            const imageModelParam =
                params.get('image_model') || params.get('model');
            const includeLogoParam = params.get('include_logo');

            let matchedEventId = eventIdParam
                ? String(eventIdParam)
                : undefined;
            let matchedProductName = productParam
                ? String(productParam)
                : undefined;

            if (campaignIdParam) {
                const foundCamp =
                    campaigns.find(
                        (c: any) => String(c.id) === String(campaignIdParam),
                    ) || initialCampaign;

                if (foundCamp) {
                    if (!matchedEventId && foundCamp.event_id) {
                        matchedEventId = String(foundCamp.event_id);
                    }

                    if (!matchedProductName && foundCamp.product_name) {
                        matchedProductName = String(foundCamp.product_name);
                    }
                }
            }

            setForm((prev) => ({
                ...prev,
                ...(campaignIdParam
                    ? { campaign_id: String(campaignIdParam) }
                    : {}),
                ...(matchedEventId ? { event_id: matchedEventId } : {}),
                ...(matchedProductName
                    ? { product_name: matchedProductName }
                    : {}),
                ...(priceParam ? { price: String(priceParam) } : {}),
                ...(taglineParam
                    ? {
                          tagline: String(taglineParam),
                          tagline_mode: 'manual' as TaglineMode,
                      }
                    : {}),
                ...(promptParam ? { image_prompt: String(promptParam) } : {}),
                ...(aspectRatioParam
                    ? { aspect_ratio: String(aspectRatioParam) }
                    : {}),
                ...(imageModelParam
                    ? { image_model: String(imageModelParam) }
                    : {}),
                ...(includeLogoParam !== null && includeLogoParam !== undefined
                    ? {
                          include_logo:
                              includeLogoParam === '1' ||
                              includeLogoParam === 'true',
                      }
                    : {}),
            }));
        }
    }, [campaigns, initialCampaign]);

    // Unsaved navigation blocker
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (generationState === 'ready' && !isSavedToDesigns) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () =>
            window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [generationState, isSavedToDesigns]);

    useEffect(() => {
        const removeListener = router.on('before', (event: any) => {
            if (
                generationState === 'ready' &&
                !isSavedToDesigns &&
                !navigatingConfirmed
            ) {
                event.preventDefault();
                setPendingNavigationUrl(event.detail.visit.url);
                setIsUnsavedExitModalOpen(true);
            }
        });

        return () => removeListener();
    }, [generationState, isSavedToDesigns, navigatingConfirmed]);

    // Generate dynamic non-repeating image prompt
    const generateNewPrompt = (
        targetEvent = selectedEvent,
        targetProductName = form.product_name,
    ) => {
        if (!targetEvent && !form.event_id) {
            toast.info(
                'Please select a holiday or marketing event first to generate a tailored visual prompt.',
            );
            setEventModalOpen(true);

            return;
        }

        const prod = targetProductName.trim() || 'featured product';
        const evt = targetEvent?.name || 'seasonal promotion';

        let nextIdx = Math.floor(Math.random() * promptArchetypes.length);

        if (nextIdx === lastPromptIndex && promptArchetypes.length > 1) {
            nextIdx = (nextIdx + 1) % promptArchetypes.length;
        }

        const generated = promptArchetypes[nextIdx](prod, evt);
        setLastPromptIndex(nextIdx);
        setForm((prev) => ({ ...prev, image_prompt: generated }));
        toast.success('Generated creative visual concept!');
    };

    // Auto-generate prompt when event or product is picked if prompt is empty
    const handleSelectEvent = (eventItem: EventItem) => {
        setForm((prev) => ({ ...prev, event_id: String(eventItem.id) }));
        setEventModalOpen(false);

        if (!form.image_prompt.trim()) {
            generateNewPrompt(eventItem, form.product_name);
        }

        toast.success(`Selected "${eventItem.name}"`);
    };

    // Smart cycle suggestions for Step 2
    const applyDynamicSuggestions = () => {
        const eventType = (
            selectedEvent?.type ||
            selectedEvent?.category ||
            'holiday'
        ).toLowerCase();
        const bank = eventStyleBanks[eventType] || eventStyleBanks.holiday;

        const nextIdx = (lastStyleSuggestionIndex + 1) % bank.length;
        setLastStyleSuggestionIndex(nextIdx);

        const chosen = bank[nextIdx];

        setForm((prev) => ({
            ...prev,
            content_style: chosen.styles,
            brand_tone: chosen.tones,
            render_style: chosen.renderStyle,
        }));

        toast.success(
            selectedEvent
                ? `Applied ${chosen.renderStyle} & themes for ${selectedEvent.name}!`
                : `Applied ${chosen.renderStyle} & recommended themes!`,
        );
    };

    // Smart multi-tone tagline generator with 32 dynamic angles
    const generateTagline = () => {
        const rawEvent = selectedEvent?.name || 'Special Occasion';
        const cleanEvent = rawEvent.replace(/\s*\(.*?\)\s*/g, '').trim();
        const eventWord = cleanEvent.length > 22
            ? cleanEvent.split(/\s+/).slice(0, 3).join(' ')
            : (cleanEvent || 'Special Occasion');
        const prodWord = form.product_name?.trim() || 'Signature Creation';

        const templates = [
            `${eventWord} made memorable with ${prodWord}.`,
            `Celebrate ${eventWord} in unmatched style.`,
            `Your ${eventWord} essential: ${prodWord}.`,
            `Crafted for ${eventWord}, loved every day.`,
            `Elevate your ${eventWord} experience.`,
            `Turn ${eventWord} into a story worth sharing.`,
            `Make ${eventWord} truly unforgettable.`,
            `The perfect companion for ${eventWord}.`,
            `Redefining ${eventWord}, one ${prodWord} at a time.`,
            `Unwrap joy this ${eventWord}.`,
            `Experience ${prodWord} like never before this ${eventWord}.`,
            `Distinctive style for a memorable ${eventWord}.`,
            `Brighten your ${eventWord} with ${prodWord}.`,
            `Pure quality, perfected for ${eventWord}.`,
            `Transform your ${eventWord} moments.`,
            `Made for celebrating. Made for you.`,
            `This ${eventWord}, choose extraordinary with ${prodWord}.`,
            `The gift of perfection this ${eventWord}.`,
            `Celebrate bigger. Live better with ${prodWord}.`,
            `Spark something special this ${eventWord}.`,
            `Where tradition meets modern taste this ${eventWord}.`,
            `Uncompromising quality for your ${eventWord}.`,
            `Simple pleasures, unforgettable ${eventWord}.`,
            `${prodWord}: Your secret to a remarkable ${eventWord}.`,
            `Step into ${eventWord} with confidence and ${prodWord}.`,
            `Curated for taste. Created for ${eventWord}.`,
            `Give the gift of ${prodWord} this ${eventWord}.`,
            `Limited ${eventWord} release — experience it today.`,
            `Nothing compares this ${eventWord}.`,
            `A modern touch for classic ${eventWord} celebrations.`,
            `${prodWord} — the highlight of your ${eventWord}.`,
            `Moments matter. Celebrate ${eventWord} with ${prodWord}.`,
        ];

        let nextIdx = Math.floor(Math.random() * templates.length);
        if (nextIdx === lastTaglineIndex && templates.length > 1) {
            nextIdx = (nextIdx + 1) % templates.length;
        }

        setLastTaglineIndex(nextIdx);
        const random = templates[nextIdx];
        setForm((prev) => ({ ...prev, tagline_mode: 'ai', tagline: random }));
        toast.success('Generated catchy marketing tagline!');
    };

    // Desktop file reference
    const handleDesktopFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            setForm((prev) => ({
                ...prev,
                reference_image: file,
                product_id: '',
            }));
            setSelectedProduct(null);
            setReferenceImageSource('desktop');
            const reader = new FileReader();
            reader.onload = () => {
                setReferenceImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            toast.success(`Loaded desktop reference: "${file.name}"`);
        }
    };

    // Select catalog product
    const handleSelectProduct = (prod: ProductItem) => {
        setSelectedProduct(prod);
        setForm((prev) => ({
            ...prev,
            product_id: String(prod.id),
            product_name:
                prev.product_name.trim() === '' ? prod.name : prev.product_name,
            price: prod.price
                ? String(prod.price)
                      .replace(/[^0-9.]/g, '')
                      .replace(/\.0+$/, '')
                      .replace(/(\.[0-9]*[1-9])0+$/, '$1')
                : prev.price,
            reference_image: null,
        }));
        setReferenceImageSource('product');
        setReferenceImagePreview(prod.image_url ?? null);
        setIsProductModalOpen(false);

        if (!form.image_prompt.trim() && (selectedEvent || form.event_id)) {
            generateNewPrompt(selectedEvent, prod.name);
        }

        toast.success(`Linked product "${prod.name}"`);
    };

    const handleClearReferenceImage = () => {
        setForm((prev) => ({ ...prev, reference_image: null, product_id: '' }));
        setReferenceImagePreview(null);
        setReferenceImageSource('none');
        setSelectedProduct(null);

        if (desktopFileInputRef.current) {
            desktopFileInputRef.current.value = '';
        }
    };

    // Generation Flow - Real OpenAI Generator Preview
    const generateMarketingImage = async () => {
        if (isQuotaExceeded) {
            toast.error(
                'You have reached your $10.00 AI generation limit quota. Visual generation is disabled.',
            );

            return;
        }

        if (!form.product_name.trim() || !form.image_prompt.trim()) {
            toast.error('Please provide a product name and image prompt.');

            return;
        }

        setGenerationState('generating');
        setGenerationProgress(15);
        setGenerationStage(0);
        setElapsedSeconds(0);

        const startTime = Date.now();
        const progressTimer = window.setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            setElapsedSeconds(elapsed);

            setGenerationProgress((prev) => {
                if (prev < 30) {
                    setGenerationStage(0);

                    return prev + 5;
                } else if (prev < 60) {
                    setGenerationStage(1);

                    return prev + 3;
                } else if (prev < 85) {
                    setGenerationStage(2);

                    return prev + 2;
                } else if (prev < 95) {
                    setGenerationStage(3);

                    return prev + 1;
                }

                return prev;
            });
        }, 500);

        try {
            const formData = new FormData();
            formData.append('product_name', form.product_name);
            formData.append('image_prompt', form.image_prompt);
            formData.append('prompt', form.image_prompt);

            if (form.price) {
                const cleanPrice = String(form.price).replace(/[^0-9.]/g, '');

                if (cleanPrice) {
                    formData.append('price', cleanPrice);
                }
            }

            if (form.event_id) {
                formData.append('event_id', String(form.event_id));
            }

            if (form.product_id) {
                formData.append('product_id', String(form.product_id));
            }

            if (form.campaign_id) {
                formData.append('campaign_id', String(form.campaign_id));
            }

            if (form.aspect_ratio) {
                formData.append('aspect_ratio', form.aspect_ratio);
            }

            if (form.image_model) {
                formData.append('image_model', form.image_model);
            }

            if (form.image_quality) {
                formData.append('image_quality', form.image_quality);
            }

            formData.append('tagline_mode', form.tagline_mode || 'ai');

            if (form.tagline_mode !== 'none' && form.tagline) {
                formData.append('tagline', form.tagline);
            }

            if (form.include_logo) {
                formData.append('include_logo', '1');
            }

            if (form.reference_image) {
                formData.append('reference_image', form.reference_image);
            }

            form.content_style.forEach((style) =>
                formData.append('content_style[]', style),
            );
            form.brand_tone.forEach((tone) =>
                formData.append('brand_tone[]', tone),
            );
            formData.append(
                'render_style',
                form.render_style || 'Studio Product Still',
            );

            const response = await fetch('/generator/preview', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN':
                        document.querySelector<HTMLMetaElement>(
                            'meta[name="csrf-token"]',
                        )?.content || '',
                },
                body: formData,
            });

            const data = await response.json().catch(() => null);

            window.clearInterval(progressTimer);
            setGenerationProgress(100);
            setGenerationStage(3);

            if (!response.ok || !data?.success) {
                const errorMsg =
                    data?.message ||
                    (data?.errors
                        ? Object.values(data.errors).flat().join(', ')
                        : 'Failed to generate visual');

                throw new Error(errorMsg);
            }

            setSavedDesign({
                id: null,
                image_url: data.image_url,
                generated_image_path: data.generated_image_path,
                product_name: data.product_name,
                tagline: data.tagline,
                price: data.price,
                aspect_ratio: data.aspect_ratio,
            });
            setIsSavedToDesigns(false);
            window.setTimeout(() => {
                setGenerationState('ready');
            }, 300);
            toast.success('Generated visual creative with OpenAI Studio!');
        } catch (err: any) {
            window.clearInterval(progressTimer);
            setGenerationState('idle');
            console.error(err);
            toast.error(err.message || 'Generation failed. Please try again.');
        }
    };

    // Save to designs backend
    const saveToDesigns = async (targetCampaignId?: string) => {
        if (isSavingDesign) {
            return;
        }

        if (isSavedToDesigns && savedDesign?.id) {
            toast.info('Design is already saved in My Designs.');

            return savedDesign;
        }

        setIsSavingDesign(true);

        try {
            const formData = new FormData();
            formData.append('product_name', form.product_name);
            formData.append('image_prompt', form.image_prompt);
            formData.append('prompt', form.image_prompt);

            if (savedDesign?.generated_image_path) {
                formData.append(
                    'generated_image_path',
                    savedDesign.generated_image_path,
                );
            }

            if (form.price) {
                const cleanPrice = String(form.price).replace(/[^0-9.]/g, '');

                if (cleanPrice) {
                    formData.append('price', cleanPrice);
                }
            }

            if (form.event_id) {
                formData.append('event_id', String(form.event_id));
            }

            if (form.product_id) {
                formData.append('product_id', String(form.product_id));
            }

            if (targetCampaignId) {
                formData.append('campaign_id', String(targetCampaignId));
            }

            if (form.aspect_ratio) {
                formData.append('aspect_ratio', form.aspect_ratio);
            }

            if (form.image_model) {
                formData.append('image_model', form.image_model);
            }

            if (form.image_quality) {
                formData.append('image_quality', form.image_quality);
            }

            formData.append('tagline_mode', form.tagline_mode || 'ai');

            if (form.tagline_mode !== 'none' && form.tagline) {
                formData.append('tagline', form.tagline);
            }

            if (form.include_logo) {
                formData.append('include_logo', '1');
            }

            if (form.reference_image) {
                formData.append('reference_image', form.reference_image);
            }

            form.content_style.forEach((style) =>
                formData.append('content_style[]', style),
            );
            form.brand_tone.forEach((tone) =>
                formData.append('brand_tone[]', tone),
            );
            formData.append(
                'render_style',
                form.render_style || 'Studio Product Still',
            );

            const response = await fetch('/designs', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN':
                        document.querySelector<HTMLMetaElement>(
                            'meta[name="csrf-token"]',
                        )?.content || '',
                },
                body: formData,
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                const errorMsg =
                    data?.message ||
                    (data?.errors
                        ? Object.values(data.errors).flat().join(', ')
                        : 'Failed to save design');

                throw new Error(errorMsg);
            }

            setSavedDesign(data.design);
            setIsSavedToDesigns(true);
            toast.success('Design saved to My Designs!');

            return data.design;
        } catch (err: any) {
            console.error(err);
            toast.error(
                err.message || 'Unable to save design. Please try again.',
            );
        } finally {
            setIsSavingDesign(false);
        }
    };

    // Attach to existing campaign
    const handleAttachExistingCampaign = async () => {
        if (!selectedExistingCampaignId) {
            toast.error('Please select a campaign.');

            return;
        }

        setIsAttachingCampaign(true);

        try {
            const targetCampaign = campaigns.find(
                (c: any) => String(c.id) === String(selectedExistingCampaignId),
            );
            setForm((prev) => ({
                ...prev,
                campaign_id: String(selectedExistingCampaignId),
            }));

            if (isSavedToDesigns && savedDesign?.id) {
                const res = await fetch(
                    `/designs/${savedDesign.id}/attach-campaign`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                            'X-CSRF-TOKEN':
                                document.querySelector<HTMLMetaElement>(
                                    'meta[name="csrf-token"]',
                                )?.content || '',
                        },
                        body: JSON.stringify({
                            campaign_id: selectedExistingCampaignId,
                        }),
                    },
                );

                if (!res.ok) {
                    const data = await res.json().catch(() => null);

                    throw new Error(
                        data?.message || 'Failed to attach to campaign',
                    );
                }
            } else if (generationState === 'ready') {
                await saveToDesigns(selectedExistingCampaignId);
            }

            setIsCampaignModalOpen(false);
            toast.success(
                `Linked to campaign "${targetCampaign?.name || 'Campaign'}"!`,
            );
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Failed to link to campaign.');
        } finally {
            setIsAttachingCampaign(false);
        }
    };

    // Create new campaign & link visual
    const handleCreateAndLinkCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        const name = campaignFormData.name.trim();

        if (!name) {
            setCampaignFormErrors({ name: 'Campaign name is required.' });

            return;
        }

        setIsCreatingCampaign(true);
        setCampaignFormErrors({});

        try {
            const payload: any = {
                name,
                event_id: campaignFormData.event_id || form.event_id || null,
                start_date:
                    campaignFormData.start_date ||
                    new Date().toISOString().split('T')[0],
                end_date:
                    campaignFormData.end_date ||
                    campaignFormData.start_date ||
                    new Date().toISOString().split('T')[0],
                status: 'draft',
                objective: `Campaign for ${name}`,
            };

            if (isSavedToDesigns && savedDesign?.id) {
                payload.design_id = savedDesign.id;
            }

            const response = await fetch('/campaigns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN':
                        document.querySelector<HTMLMetaElement>(
                            'meta[name="csrf-token"]',
                        )?.content || '',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                const errorMsg =
                    data?.message ||
                    (data?.errors
                        ? Object.values(data.errors).flat().join(', ')
                        : 'Failed to create campaign');

                throw new Error(errorMsg);
            }

            const newCampaignId = String(data.campaign.id);
            setForm((prev) => ({ ...prev, campaign_id: newCampaignId }));

            if (!isSavedToDesigns && generationState === 'ready') {
                await saveToDesigns(newCampaignId);
            }

            setIsCampaignModalOpen(false);
            toast.success(`Created and linked to campaign "${name}"!`);
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Failed to create campaign.');
        } finally {
            setIsCreatingCampaign(false);
        }
    };

    // Download visual with format selection (PNG, JPEG, SVG)
    const downloadImage = (format: 'png' | 'jpeg' | 'svg' = 'png') => {
        const targetUrl =
            savedDesign?.image_url ||
            'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22800%22 height=%22600%22%3E%3Crect fill=%22%23111827%22 width=%22800%22 height=%22600%22/%3E%3C/svg%3E';
        downloadVisualAsFormat(
            targetUrl,
            form.product_name || 'marketing-visual',
            format,
        );
    };

    // Step Validation
    const stepOneValid =
        form.product_name.trim().length > 0 &&
        form.image_prompt.trim().length > 0;
    const canGenerate = stepOneValid && !isQuotaExceeded;

    // Filter events in event modal
    const availableYears = useMemo(() => {
        const years = new Set<string>();
        const curYr = new Date().getFullYear();
        years.add(String(curYr));
        years.add(String(curYr + 1));
        events.forEach((ev: EventItem) => {
            if (ev.date) {
                years.add(ev.date.slice(0, 4));
            }
        });

        return Array.from(years).sort();
    }, [events]);

    const filteredEvents = useMemo(() => {
        return events.filter((ev: EventItem) => {
            if (selectedYearTab !== 'all' && ev.date) {
                if (ev.date.slice(0, 4) !== selectedYearTab) {
                    return false;
                }
            }

            if (eventCategoryFilter !== 'all') {
                if (eventCategoryFilter === 'long_weekend') {
                    if (!ev.is_long_weekend) {
                        return false;
                    }
                } else if (eventCategoryFilter === 'regular') {
                    if (ev.category !== 'regular' && ev.type !== 'holiday') {
                        return false;
                    }
                } else if (eventCategoryFilter === 'special_non_working') {
                    if (ev.category !== 'special_non_working') {
                        return false;
                    }
                } else if (eventCategoryFilter === 'special_working') {
                    if (ev.category !== 'special_working') {
                        return false;
                    }
                } else if (eventCategoryFilter === 'islamic') {
                    if (ev.category !== 'islamic') {
                        return false;
                    }
                } else if (eventCategoryFilter === 'commercial') {
                    if (
                        ev.type !== 'commercial' &&
                        ev.category !== 'commercial'
                    ) {
                        return false;
                    }
                } else if (eventCategoryFilter === 'custom') {
                    if (ev.type !== 'custom' && ev.category !== 'custom') {
                        return false;
                    }
                } else if (
                    ev.type !== eventCategoryFilter &&
                    ev.category !== eventCategoryFilter
                ) {
                    return false;
                }
            }

            if (eventSearchQuery.trim()) {
                const query = eventSearchQuery.toLowerCase();

                return (
                    ev.name.toLowerCase().includes(query) ||
                    (ev.type && ev.type.toLowerCase().includes(query)) ||
                    (ev.category &&
                        ev.category.toLowerCase().includes(query)) ||
                    (ev.proclamation_no &&
                        ev.proclamation_no.toLowerCase().includes(query))
                );
            }

            return true;
        });
    }, [events, selectedYearTab, eventCategoryFilter, eventSearchQuery]);

    const filteredProducts = useMemo(() => {
        if (!productSearchQuery.trim()) {
            return products;
        }

        const q = productSearchQuery.toLowerCase();

        return products.filter(
            (p: ProductItem) =>
                p.name.toLowerCase().includes(q) ||
                (p.description && p.description.toLowerCase().includes(q)),
        );
    }, [products, productSearchQuery]);

    return (
        <>
            <Head title="AI Marketing Studio" />

            <div className="flex min-h-[calc(100vh-2.75rem)] w-full bg-background text-foreground sm:min-h-[calc(100vh-3rem)]">
                {/* =====================================================
                    MAIN STUDIO WORKSPACE (LEFT/CENTER)
                ====================================================== */}
                <div className="min-w-0 flex-1 space-y-5 p-4 sm:p-6 lg:p-8">
                    {/* COMPACT & PROFESSIONAL STICKY STUDIO HEADER */}
                    <div className="sticky top-11 z-20 -mx-4 -mt-4 flex flex-col gap-3 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur-xl transition-all sm:top-12 sm:-mx-6 sm:-mt-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:-mx-8 lg:-mt-8 lg:px-8 dark:bg-background/90">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                                        AI Marketing Studio
                                    </h1>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Create campaign-ready marketing visuals
                                    tailored to holidays and product launches.
                                </p>
                            </div>
                        </div>

                        {/* Top Right Actions */}
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 gap-1.5 text-xs font-semibold shadow-2xs"
                                    >
                                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                                        <span className="font-mono text-[11px] font-bold">
                                            {form.image_model}
                                        </span>
                                        <Badge
                                            variant="secondary"
                                            className="px-1 py-0 font-mono text-[9px] text-emerald-600 dark:text-emerald-400"
                                        >
                                            {imageModelOptions.find(
                                                (m) =>
                                                    m.value ===
                                                    form.image_model,
                                            )?.price || '$0.040 / gen'}
                                        </Badge>
                                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="max-h-[380px] w-[340px] space-y-1 overflow-y-auto rounded-2xl border-border bg-popover/98 p-2 shadow-2xl backdrop-blur-xl"
                                >
                                    <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        Switch Generation Model & Pricing
                                    </div>
                                    {imageModelOptions.map((model) => (
                                        <DropdownMenuItem
                                            key={model.value}
                                            onClick={() =>
                                                setForm({
                                                    ...form,
                                                    image_model: model.value,
                                                })
                                            }
                                            className={`cursor-pointer rounded-xl p-2 text-xs transition-colors ${
                                                form.image_model === model.value
                                                    ? 'border border-primary/30 bg-primary/10'
                                                    : 'hover:bg-muted/60'
                                            }`}
                                        >
                                            <div className="w-full space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-mono text-xs font-bold text-foreground">
                                                            {model.label}
                                                        </span>
                                                        <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1 py-0.2 font-mono text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                                                            {model.price}
                                                        </span>
                                                    </div>
                                                    <Badge
                                                        variant="secondary"
                                                        className="font-mono text-[9px]"
                                                    >
                                                        {model.speed}
                                                    </Badge>
                                                </div>
                                                <p className="line-clamp-1 text-[10px] text-muted-foreground">
                                                    {model.description}
                                                </p>
                                            </div>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 text-xs font-semibold shadow-2xs"
                            >
                                <Link href="/designs">
                                    <ImageIcon className="h-3.5 w-3.5 text-primary" />
                                    Saved Designs
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Active Campaign Banner */}
                    {activeCampaign && (
                        <div className="flex animate-in items-center justify-between rounded-2xl border border-primary/30 bg-primary/5 p-4 text-xs duration-200 fade-in">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <Layers className="h-4 w-4" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-foreground">
                                            Campaign: {activeCampaign.name}
                                        </p>
                                        <Badge
                                            variant="outline"
                                            className="border-primary/20 bg-primary/10 text-[10px] font-semibold text-primary"
                                        >
                                            Auto-Linked
                                        </Badge>
                                    </div>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        Visual creative will be automatically
                                        organized under this marketing campaign.
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                    setForm((prev) => ({
                                        ...prev,
                                        campaign_id: '',
                                    }))
                                }
                                className="h-8 text-xs text-muted-foreground hover:text-destructive"
                            >
                                Unlink
                            </Button>
                        </div>
                    )}

                    {/* =====================================================
                        GENERATION STATE: IDLE VS GENERATING VS READY
                    ====================================================== */}

                    {generationState !== 'idle' ? (
                        /* READY / GENERATING RESULT VIEW */
                        <Card className="mx-auto max-w-3xl overflow-hidden rounded-3xl border-border bg-card shadow-sm">
                            <CardHeader className="border-b p-5 md:p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            Creative Generation
                                        </p>
                                        <h2 className="mt-1 text-lg font-bold">
                                            {generationState === 'generating'
                                                ? 'Synthesizing Visual Creative...'
                                                : 'Visual Creative Ready'}
                                        </h2>
                                    </div>
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <Sparkles className="h-4 w-4" />
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-6 p-5 md:p-7">
                                {generationState === 'generating' ? (
                                    <div className="animate-in space-y-7 py-6 duration-300 fade-in sm:py-8">
                                        {/* Status Header with Timer & Active State */}
                                        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                                            <div className="flex items-center gap-2">
                                                <span className="relative flex h-2.5 w-2.5">
                                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                                                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                                                </span>
                                                <span className="text-xs font-bold text-foreground">
                                                    Synthesizing Visual Asset
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className="border-primary/20 bg-primary/10 font-mono text-[10px] text-primary"
                                                >
                                                    OpenAI Studio Core
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant="secondary"
                                                    className="gap-1 px-2.5 py-1 font-mono text-[11px] font-medium"
                                                >
                                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                                    {String(
                                                        Math.floor(
                                                            elapsedSeconds / 60,
                                                        ),
                                                    ).padStart(2, '0')}
                                                    :
                                                    {String(
                                                        elapsedSeconds % 60,
                                                    ).padStart(2, '0')}
                                                    s
                                                </Badge>
                                                <Badge
                                                    variant="outline"
                                                    className="font-mono text-[11px] font-bold text-primary"
                                                >
                                                    {generationProgress}%
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Glowing Central Synthesis Visualizer */}
                                        <div className="relative mx-auto flex h-36 w-36 items-center justify-center overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-b from-primary/10 via-background to-muted/40 shadow-inner sm:h-44 sm:w-44">
                                            {/* Concentric pulsing rings */}
                                            <div className="absolute inset-2 animate-ping rounded-2xl border border-primary/20 opacity-25" />
                                            <div className="absolute inset-6 animate-pulse rounded-2xl border border-primary/30" />

                                            {/* Center icon & glow */}
                                            <div className="relative flex h-16 w-16 animate-bounce items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                                                <Sparkles className="h-8 w-8" />
                                            </div>

                                            {/* Canvas specs tag */}
                                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                                                <span className="rounded-full border border-border/60 bg-background/90 px-2 py-0.5 font-mono text-[10px] font-bold text-muted-foreground">
                                                    {form.aspect_ratio || '1:1'}{' '}
                                                    Canvas
                                                </span>
                                            </div>
                                        </div>

                                        {/* Dynamic Stage Tracker (4 Milestones) */}
                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
                                            {[
                                                {
                                                    label: 'Prompt Analysis',
                                                    desc: 'Campaign context',
                                                    stageIdx: 0,
                                                },
                                                {
                                                    label: 'Layout & Hierarchy',
                                                    desc: 'Typography & vibe',
                                                    stageIdx: 1,
                                                },
                                                {
                                                    label: 'Asset Synthesis',
                                                    desc: 'AI visual generation',
                                                    stageIdx: 2,
                                                },
                                                {
                                                    label: 'Canvas Render',
                                                    desc: 'High-res polish',
                                                    stageIdx: 3,
                                                },
                                            ].map(
                                                ({ label, desc, stageIdx }) => {
                                                    const isDone =
                                                        generationProgress >
                                                        (stageIdx + 1) * 24;
                                                    const isCurrent =
                                                        generationStage ===
                                                            stageIdx && !isDone;

                                                    return (
                                                        <div
                                                            key={label}
                                                            className={`rounded-2xl border p-3 text-left transition-all duration-300 ${
                                                                isDone
                                                                    ? 'border-emerald-500/30 bg-emerald-500/5'
                                                                    : isCurrent
                                                                      ? 'border-primary/50 bg-primary/10 shadow-xs ring-1 ring-primary/30'
                                                                      : 'border-border/60 bg-muted/20 opacity-50'
                                                            }`}
                                                        >
                                                            <div className="mb-1.5 flex items-center justify-between">
                                                                <span className="font-mono text-[10px] font-bold text-muted-foreground">
                                                                    0
                                                                    {stageIdx +
                                                                        1}
                                                                </span>
                                                                {isDone ? (
                                                                    <Check className="h-3.5 w-3.5 font-bold text-emerald-500" />
                                                                ) : isCurrent ? (
                                                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                                                                ) : (
                                                                    <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                                                                )}
                                                            </div>
                                                            <p
                                                                className={`truncate text-xs font-bold ${isCurrent ? 'text-primary' : 'text-foreground'}`}
                                                            >
                                                                {label}
                                                            </p>
                                                            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                                                                {desc}
                                                            </p>
                                                        </div>
                                                    );
                                                },
                                            )}
                                        </div>

                                        {/* High-Accuracy Animated Progress Bar */}
                                        <div className="mx-auto max-w-xl space-y-2">
                                            <div className="flex justify-between px-0.5 text-xs font-medium text-muted-foreground">
                                                <span className="flex items-center gap-1.5 font-semibold text-foreground">
                                                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                                                    {generationStage === 0
                                                        ? 'Analyzing product & campaign objectives...'
                                                        : generationStage === 1
                                                          ? 'Composing typography, brand tone & layout...'
                                                          : generationStage ===
                                                              2
                                                            ? 'Synthesizing visual assets with OpenAI Studio...'
                                                            : 'Rendering high-resolution marketing visual...'}
                                                </span>
                                                <span className="font-mono font-bold text-foreground">
                                                    {generationProgress}%
                                                </span>
                                            </div>
                                            <div className="h-2.5 w-full overflow-hidden rounded-full border border-border/50 bg-muted p-0.5">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-primary/80 via-primary to-primary/90 shadow-sm transition-all duration-300"
                                                    style={{
                                                        width: `${generationProgress}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="animate-in space-y-6 duration-300 fade-in">
                                        {/* CLICKABLE GENERATED VISUAL */}
                                        <div
                                            onClick={() => {
                                                setIsPreviewFullViewOpen(true);
                                                setIsFullViewDetailsExpanded(
                                                    false,
                                                );
                                            }}
                                            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:border-primary/50"
                                        >
                                            <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2.5 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                                    <span className="font-semibold">
                                                        {form.product_name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className="border-primary/30 bg-primary/10 font-mono text-[10px] font-bold text-primary"
                                                    >
                                                        <Sparkles className="mr-1 inline h-2.5 w-2.5" />
                                                        {form.image_model ||
                                                            'gpt-image-1'}
                                                    </Badge>
                                                    <Badge
                                                        variant="outline"
                                                        className={`font-mono text-[10px] font-bold uppercase ${
                                                            form.image_quality === 'high'
                                                                ? 'border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                                                : form.image_quality === 'low'
                                                                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                        }`}
                                                    >
                                                        {form.image_quality || 'medium'}
                                                    </Badge>
                                                    <Badge
                                                        variant="outline"
                                                        className="font-mono text-[10px]"
                                                    >
                                                        {form.aspect_ratio ||
                                                            '1:1'}
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

                                            {/* Generated Visual Canvas - Real OpenAI Image */}
                                            <div className="flex min-h-[360px] items-center justify-center overflow-hidden rounded-2xl bg-muted/20 p-3 sm:p-4">
                                                {savedDesign?.image_url ? (
                                                    <div className="relative flex max-h-[520px] w-full items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-background/50 shadow-lg">
                                                        <img
                                                            src={
                                                                savedDesign.image_url
                                                            }
                                                            alt={
                                                                form.product_name
                                                            }
                                                            className="max-h-[500px] w-auto max-w-full rounded-xl object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                                                        />
                                                        <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/60 via-transparent to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                                                            <span className="rounded-xl bg-black/70 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur-md">
                                                                Click to view
                                                                full size
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="w-full max-w-md space-y-3 rounded-2xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-6 text-center text-white">
                                                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary shadow-md">
                                                            <Sparkles className="h-6 w-6 text-primary" />
                                                        </div>
                                                        <h3 className="text-xl font-bold">
                                                            {form.product_name}
                                                        </h3>
                                                        {form.tagline &&
                                                            form.tagline_mode !==
                                                                'none' && (
                                                                <p className="text-xs font-medium text-slate-300">
                                                                    "
                                                                    {
                                                                        form.tagline
                                                                    }
                                                                    "
                                                                </p>
                                                            )}
                                                        {form.price && (
                                                            <p className="text-base font-bold text-sky-400">
                                                                ₱
                                                                {Number(
                                                                    form.price,
                                                                ).toLocaleString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status Alert */}
                                        <div
                                            className={`rounded-2xl border p-4 ${isSavedToDesigns ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-primary/20 bg-primary/5'}`}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2.5">
                                                    <Check
                                                        className={`h-4 w-4 ${isSavedToDesigns ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'}`}
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
                                                        <Link href="/designs">
                                                            Open Designs →
                                                        </Link>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Bar */}
                                        <div className="space-y-3">
                                            <div className="grid gap-2.5 sm:grid-cols-3">
                                                <Button
                                                    type="button"
                                                    onClick={() =>
                                                        saveToDesigns()
                                                    }
                                                    disabled={isSavingDesign}
                                                    variant={
                                                        isSavedToDesigns
                                                            ? 'outline'
                                                            : 'default'
                                                    }
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
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
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
                                                            onClick={() =>
                                                                downloadImage(
                                                                    'png',
                                                                )
                                                            }
                                                            className="cursor-pointer gap-2 text-xs font-medium"
                                                        >
                                                            <Download className="h-3.5 w-3.5 text-primary" />
                                                            PNG (High Quality)
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                downloadImage(
                                                                    'jpeg',
                                                                )
                                                            }
                                                            className="cursor-pointer gap-2 text-xs font-medium"
                                                        >
                                                            <Download className="h-3.5 w-3.5 text-blue-500" />
                                                            JPEG (Web-Optimized)
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                downloadImage(
                                                                    'svg',
                                                                )
                                                            }
                                                            className="cursor-pointer gap-2 text-xs font-medium"
                                                        >
                                                            <Download className="h-3.5 w-3.5 text-emerald-500" />
                                                            SVG (Vector Embed)
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>

                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => {
                                                        const defaultName =
                                                            selectedEvent
                                                                ? `${selectedEvent.name} Campaign`
                                                                : `${form.product_name} Campaign`;
                                                        setCampaignFormData({
                                                            name: defaultName,
                                                            event_id:
                                                                form.event_id ||
                                                                '',
                                                            start_date:
                                                                selectedEvent?.date ||
                                                                new Date()
                                                                    .toISOString()
                                                                    .split(
                                                                        'T',
                                                                    )[0],
                                                            end_date:
                                                                selectedEvent?.date ||
                                                                new Date()
                                                                    .toISOString()
                                                                    .split(
                                                                        'T',
                                                                    )[0],
                                                        });
                                                        if (
                                                            eligibleCampaigns.length >
                                                            0
                                                        ) {
                                                            setSelectedExistingCampaignId(
                                                                String(
                                                                    eligibleCampaigns[0]
                                                                        .id,
                                                                ),
                                                            );
                                                        } else {
                                                            setSelectedExistingCampaignId(
                                                                '',
                                                            );
                                                        }
                                                        setIsCampaignModalOpen(
                                                            true,
                                                        );
                                                    }}
                                                    className="h-10 gap-1.5 text-xs font-semibold shadow-none"
                                                >
                                                    <Layers className="h-4 w-4" />
                                                    Link to Campaign
                                                </Button>
                                            </div>

                                            {/* Sub actions */}
                                            <div className="flex items-center justify-between border-t border-border/50 pt-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setIsEditConfirmOpen(
                                                            true,
                                                        )
                                                    }
                                                    className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                                                >
                                                    <Edit3 className="h-3.5 w-3.5" />
                                                    Edit Parameters
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setIsRegenerateConfirmOpen(
                                                            true,
                                                        )
                                                    }
                                                    className="gap-1.5 text-xs text-primary hover:bg-primary/10"
                                                >
                                                    <RefreshCcw className="h-3.5 w-3.5" />
                                                    Regenerate Variation
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        /* STEPPED DESIGN CREATION WORKFLOW */
                        <div className="space-y-4">
                            {/* REDESIGNED INTERACTIVE STEP WIZARD NAVIGATION */}
                            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border/80 bg-card/80 p-1.5 shadow-2xs backdrop-blur-sm sm:gap-3 sm:p-2">
                                {[
                                    {
                                        step: 1 as Step,
                                        title: 'Product & Brief',
                                        subtitle: 'Details & Event',
                                        icon: Package,
                                        isCompleted:
                                            stepOneValid && currentStep > 1,
                                        isAccessible: true,
                                    },
                                    {
                                        step: 2 as Step,
                                        title: 'Style & Tone',
                                        subtitle: 'Theme & Vibes',
                                        icon: Palette,
                                        isCompleted: currentStep > 2,
                                        isAccessible: stepOneValid,
                                    },
                                    {
                                        step: 3 as Step,
                                        title: 'Canvas & Copy',
                                        subtitle: 'Ratio & Tagline',
                                        icon: Maximize2,
                                        isCompleted: false,
                                        isAccessible: stepOneValid,
                                    },
                                ].map(
                                    ({
                                        step,
                                        title,
                                        subtitle,
                                        isCompleted,
                                        isAccessible,
                                    }) => {
                                        const isActive = currentStep === step;

                                        return (
                                            <button
                                                key={step}
                                                type="button"
                                                disabled={!isAccessible}
                                                onClick={() => {
                                                    if (isAccessible) {
                                                        setCurrentStep(step);
                                                    }
                                                }}
                                                className={`relative flex items-center gap-2.5 rounded-xl p-2.5 text-left transition-all duration-200 sm:gap-3 sm:p-3 ${
                                                    isActive
                                                        ? 'border border-primary/40 bg-primary/10 shadow-xs ring-1 ring-primary/30'
                                                        : isCompleted
                                                          ? 'cursor-pointer border border-emerald-500/20 bg-emerald-500/5 hover:bg-muted/40'
                                                          : isAccessible
                                                            ? 'cursor-pointer border border-transparent hover:bg-muted/30'
                                                            : 'cursor-not-allowed border border-transparent opacity-40'
                                                }`}
                                            >
                                                {/* Step Icon / Number Badge */}
                                                <div
                                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all sm:h-8 sm:w-8 ${
                                                        isActive
                                                            ? 'bg-primary text-primary-foreground shadow-xs'
                                                            : isCompleted
                                                              ? 'bg-emerald-500 text-white shadow-xs'
                                                              : 'bg-muted text-muted-foreground'
                                                    }`}
                                                >
                                                    {isCompleted ? (
                                                        <Check className="h-3.5 w-3.5" />
                                                    ) : (
                                                        step
                                                    )}
                                                </div>

                                                {/* Step Text */}
                                                <div className="min-w-0 flex-1">
                                                    <p
                                                        className={`truncate text-xs font-bold ${isActive ? 'text-primary' : 'text-foreground'}`}
                                                    >
                                                        {title}
                                                    </p>
                                                    <p className="hidden truncate text-[10px] text-muted-foreground sm:block">
                                                        {subtitle}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    },
                                )}
                            </div>

                            {/* QUOTA LIMIT WARNING BANNER */}
                            {isQuotaExceeded && (
                                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive shadow-xs">
                                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-bold text-destructive">
                                                AI Budget Quota Limit Reached ($10.00 Limit)
                                            </p>
                                            <Badge
                                                variant="outline"
                                                className="border-destructive/40 bg-destructive/20 font-mono text-[10px] font-bold text-destructive"
                                            >
                                                ${Number(ai_usage?.total_spent ?? 10).toFixed(2)} / $10.00
                                            </Badge>
                                        </div>
                                        <p className="text-[11px] leading-relaxed text-destructive/90">
                                            You have hit your <strong>$10.00 total generation quota limit</strong>. Image generation has been halted to prevent unexpected overages.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* STEPPED CREATION FORM CARD */}
                            <Card className="overflow-hidden rounded-3xl border-border bg-card shadow-sm">
                                <CardHeader className="border-b bg-muted/10 p-4 sm:p-5">
                                    <div>
                                        <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                            Step {currentStep} of 3
                                        </p>
                                        <h2 className="mt-0.5 text-base font-bold text-foreground sm:text-lg">
                                            {currentStep === 1
                                                ? 'Product & Campaign Brief'
                                                : currentStep === 2
                                                  ? 'Content Style & Brand Tone'
                                                  : 'Dimensions & Tagline'}
                                        </h2>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-5 md:p-7">
                                    {/* =====================================
                                        STEP 1: PRODUCT, EVENT & PROMPT
                                    ====================================== */}
                                    {currentStep === 1 && (
                                        <div className="animate-in space-y-5 duration-200 fade-in">
                                            {/* Product Name */}
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-1">
                                                    <Label
                                                        htmlFor="product_name"
                                                        className="text-xs font-semibold"
                                                    >
                                                        Product / Service Name *
                                                    </Label>
                                                    <HelpTooltip text="Enter the name of the product, service, or offering to be showcased in your marketing visual." />
                                                </div>
                                                <Input
                                                    id="product_name"
                                                    value={form.product_name}
                                                    onChange={(e) =>
                                                        setForm({
                                                            ...form,
                                                            product_name:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="e.g. Artisanal Espresso Beans, Summer Silk Dress"
                                                    className="h-10 text-xs"
                                                    required
                                                />
                                            </div>

                                            {/* Event Selector Display */}
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-1">
                                                    <Label className="text-xs font-semibold">
                                                        Selected Holiday or
                                                        Marketing Event
                                                        (Optional)
                                                    </Label>
                                                    <HelpTooltip text="Choose an official Philippine holiday or commercial sale date to tailor seasonal themes and promotions." />
                                                </div>
                                                {selectedEvent ? (
                                                    <div className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/5 p-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                                <CalendarDays className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-bold text-foreground">
                                                                        {
                                                                            selectedEvent.name
                                                                        }
                                                                    </p>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={`text-[10px] tracking-wider uppercase ${eventTypeStyles[selectedEvent.type || 'holiday']?.bg} ${eventTypeStyles[selectedEvent.type || 'holiday']?.text} ${eventTypeStyles[selectedEvent.type || 'holiday']?.border}`}
                                                                    >
                                                                        {eventTypeStyles[
                                                                            selectedEvent.type ||
                                                                                'holiday'
                                                                        ]
                                                                            ?.label ||
                                                                            'Event'}
                                                                    </Badge>
                                                                </div>
                                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                                    {formatEventDateLabel(
                                                                        selectedEvent.date,
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1.5">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    setEventModalOpen(
                                                                        true,
                                                                    )
                                                                }
                                                                className="h-8 text-xs shadow-none"
                                                            >
                                                                Change
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() =>
                                                                    setForm({
                                                                        ...form,
                                                                        event_id:
                                                                            '',
                                                                    })
                                                                }
                                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setEventModalOpen(
                                                                true,
                                                            )
                                                        }
                                                        className="flex h-11 w-full items-center justify-between rounded-xl border border-dashed border-border bg-muted/20 px-4 text-xs font-medium text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-primary" />
                                                            Choose a retail
                                                            event, season, or
                                                            holiday...
                                                        </span>
                                                        <span className="font-semibold text-primary">
                                                            Browse Events →
                                                        </span>
                                                    </button>
                                                )}
                                            </div>

                                            {/* Automatic Visual Prompt Generator */}
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1">
                                                        <Label
                                                            htmlFor="image_prompt"
                                                            className="text-xs font-semibold"
                                                        >
                                                            Visual Prompt &
                                                            Scene Concept *
                                                        </Label>
                                                        <HelpTooltip text="Detailed creative prompt describing product staging, backdrop, festive accents, lighting, and textures." />
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            generateNewPrompt()
                                                        }
                                                        className="h-7 gap-1 text-[11px] font-semibold text-primary hover:bg-primary/10"
                                                    >
                                                        <Sparkles className="h-3 w-3" />
                                                        {form.image_prompt.trim()
                                                            ? 'Suggest Different Angle'
                                                            : 'Generate Visual Prompt'}
                                                    </Button>
                                                </div>

                                                <Textarea
                                                    id="image_prompt"
                                                    value={form.image_prompt}
                                                    onChange={(e) =>
                                                        setForm({
                                                            ...form,
                                                            image_prompt:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="Describe the product staging, scene lighting, composition, or festive props..."
                                                    rows={4}
                                                    className="resize-none text-xs leading-relaxed"
                                                    required
                                                />
                                            </div>

                                            {/* Price & Reference Box */}
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-1">
                                                        <Label
                                                            htmlFor="price"
                                                            className="text-xs font-semibold"
                                                        >
                                                            Price (Optional)
                                                        </Label>
                                                        <HelpTooltip text="Optional retail price or discount tag (e.g. 499) to highlight promotional pricing on the visual." />
                                                    </div>
                                                    <div className="flex items-center rounded-xl border border-input bg-background focus-within:ring-2 focus-within:ring-primary/30">
                                                        <span className="border-r border-input bg-muted/30 px-3 py-2 text-xs font-bold text-muted-foreground">
                                                            ₱
                                                        </span>
                                                        <Input
                                                            id="price"
                                                            value={form.price}
                                                            onChange={(e) =>
                                                                setForm({
                                                                    ...form,
                                                                    price: e.target.value.replace(
                                                                        /\D/g,
                                                                        '',
                                                                    ),
                                                                })
                                                            }
                                                            placeholder="999"
                                                            className="border-0 text-xs shadow-none focus-visible:ring-0"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-1">
                                                        <Label className="text-xs font-semibold">
                                                            Reference Product
                                                            Photo (Optional)
                                                        </Label>
                                                        <HelpTooltip text="Upload an existing photo from your device or select an item from your catalog for visual reference." />
                                                    </div>
                                                    {referenceImagePreview ? (
                                                        <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-2 px-3">
                                                            <div className="flex items-center gap-2">
                                                                <img
                                                                    src={
                                                                        referenceImagePreview
                                                                    }
                                                                    alt="Ref"
                                                                    className="h-7 w-7 rounded-lg object-cover"
                                                                />
                                                                <span className="truncate text-xs font-medium">
                                                                    {selectedProduct?.name ||
                                                                        'Photo Ready'}
                                                                </span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={
                                                                    handleClearReferenceImage
                                                                }
                                                                className="text-xs text-muted-foreground hover:text-destructive"
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-2">
                                                            <input
                                                                ref={
                                                                    desktopFileInputRef
                                                                }
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={
                                                                    handleDesktopFile
                                                                }
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    desktopFileInputRef.current?.click()
                                                                }
                                                                className="flex-1 text-xs shadow-none"
                                                            >
                                                                <Upload className="mr-1 h-3.5 w-3.5" />{' '}
                                                                Upload File
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    setIsProductModalOpen(
                                                                        true,
                                                                    )
                                                                }
                                                                className="flex-1 text-xs shadow-none"
                                                            >
                                                                <Package className="mr-1 h-3.5 w-3.5" />{' '}
                                                                From Catalog
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Include Brand Logo Option Card */}
                                            <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-card/60 p-3.5 shadow-xs backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-card sm:p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                                                        {business?.logo_url ? (
                                                            <img
                                                                src={
                                                                    business.logo_url
                                                                }
                                                                alt="Logo"
                                                                className="h-7 w-7 rounded-lg object-contain"
                                                            />
                                                        ) : (
                                                            <Building2 className="h-5 w-5 text-primary" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Label
                                                                htmlFor="include_logo_toggle"
                                                                className="cursor-pointer text-xs font-bold text-foreground"
                                                            >
                                                                Include Brand
                                                                Logo in Visual
                                                            </Label>
                                                            <HelpTooltip text="When enabled, your business logo will be embedded and composed seamlessly into the generated visual." />
                                                        </div>
                                                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                            {business?.logo_url
                                                                ? `Branded with "${business.name || 'Your Business'}" logo`
                                                                : 'Seamlessly embeds your official brand logo on the creative corner'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Checkbox
                                                    id="include_logo_toggle"
                                                    checked={form.include_logo}
                                                    onCheckedChange={(
                                                        checked,
                                                    ) => {
                                                        const val =
                                                            Boolean(checked);
                                                        setForm({
                                                            ...form,
                                                            include_logo: val,
                                                        });
                                                        localStorage.setItem(
                                                            'ai_studio_include_logo',
                                                            String(val),
                                                        );
                                                    }}
                                                    className="h-5 w-5 cursor-pointer rounded-md"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* =====================================
                                        STEP 2: CONTENT STYLE & BRAND TONE
                                    ====================================== */}
                                    {currentStep === 2 && (
                                        <div className="animate-in space-y-6 duration-200 fade-in">
                                            {/* Dynamic Style Suggestions Banner */}
                                            <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                        <Wand2 className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-foreground">
                                                            Smart Style Suggestions
                                                        </p>
                                                        <p className="text-[11px] text-muted-foreground">
                                                            {selectedEvent
                                                                ? `Tailored presets for ${selectedEvent.name}`
                                                                : 'AI-recommended combinations for your product'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={applyDynamicSuggestions}
                                                    className="h-8 gap-1.5 self-start text-xs font-semibold shadow-none sm:self-auto"
                                                >
                                                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                                                    {form.content_style.length > 0 || form.brand_tone.length > 0
                                                        ? 'Shuffle Preset'
                                                        : 'Auto-Suggest Style'}
                                                </Button>
                                            </div>

                                            {/* Section 1: Render Style (Pick 1) */}
                                            <div className="space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <Label className="text-xs font-semibold text-foreground">
                                                            Render Style
                                                        </Label>
                                                        <HelpTooltip text="Defines visual rendering mode, studio camera treatment, volumetric lighting, and scene fidelity." />
                                                    </div>
                                                    <span className="font-mono text-xs text-muted-foreground">
                                                        {form.render_style
                                                            ? '1 / 1'
                                                            : '0 / 1'}
                                                    </span>
                                                </div>

                                                <div className="grid gap-2.5 sm:grid-cols-2">
                                                    {renderStyleOptions.map((opt) => {
                                                        const isSelected = form.render_style === opt.value;
                                                        const IconComponent =
                                                            opt.value === 'Studio Product Still'
                                                                ? Camera
                                                                : opt.value === 'Cinematic Marketing'
                                                                  ? Clapperboard
                                                                  : opt.value === 'Lifestyle Capture'
                                                                    ? Compass
                                                                    : PenTool;

                                                        return (
                                                            <TooltipProvider key={opt.value} delayDuration={150}>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setForm({
                                                                                    ...form,
                                                                                    render_style: opt.value,
                                                                                })
                                                                            }
                                                                            className={`group relative flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all ${
                                                                                isSelected
                                                                                    ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40'
                                                                                    : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
                                                                            }`}
                                                                        >
                                                                            <div
                                                                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors ${
                                                                                    isSelected
                                                                                        ? 'bg-primary text-primary-foreground'
                                                                                        : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                                                                                }`}
                                                                            >
                                                                                <IconComponent className="h-4 w-4" />
                                                                            </div>

                                                                            <div className="min-w-0 flex-1 space-y-1">
                                                                                <div className="flex items-center justify-between gap-1.5">
                                                                                    <span className="truncate text-xs font-bold text-foreground transition-colors group-hover:text-primary">
                                                                                        {opt.label}
                                                                                    </span>
                                                                                    <span
                                                                                        className={`shrink-0 rounded-md border px-1.5 py-0.2 text-[9px] font-bold ${opt.badgeColor}`}
                                                                                    >
                                                                                        {opt.badge}
                                                                                    </span>
                                                                                </div>
                                                                                <p className="line-clamp-1 text-[11px] text-muted-foreground">
                                                                                    {opt.tagline}
                                                                                </p>
                                                                            </div>

                                                                            <div
                                                                                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all ${
                                                                                    isSelected
                                                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                                                        : 'border-muted-foreground/30 opacity-40 group-hover:border-primary/60 group-hover:opacity-100'
                                                                                }`}
                                                                            >
                                                                                {isSelected && (
                                                                                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                                                                                )}
                                                                            </div>
                                                                        </button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent
                                                                        side="top"
                                                                        className="max-w-xs rounded-xl p-2.5 text-xs leading-relaxed"
                                                                    >
                                                                        {opt.description}
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Section 2: Visual Themes (Pick up to 3) */}
                                            <div className="space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <Label className="text-xs font-semibold text-foreground">
                                                            Visual Themes
                                                        </Label>
                                                        <HelpTooltip text="Art direction and photography aesthetics (e.g. Lifestyle, Minimal, Storytelling, Editorial)." />
                                                    </div>
                                                    <span className="font-mono text-xs text-muted-foreground">
                                                        {form.content_style.length} / 3
                                                    </span>
                                                </div>

                                                <TooltipProvider delayDuration={150}>
                                                    <div className="flex flex-wrap gap-2">
                                                        {contentStyleOptions.map((style) => {
                                                            const active = form.content_style.includes(style);
                                                            const disabled = !active && form.content_style.length >= 3;
                                                            const desc =
                                                                contentStyleDescriptions[style] ||
                                                                'Art direction visual theme preset.';

                                                            return (
                                                                <Tooltip key={style}>
                                                                    <TooltipTrigger asChild>
                                                                        <button
                                                                            type="button"
                                                                            disabled={disabled}
                                                                            onClick={() => {
                                                                                if (active) {
                                                                                    setForm({
                                                                                        ...form,
                                                                                        content_style:
                                                                                            form.content_style.filter(
                                                                                                (s) => s !== style,
                                                                                            ),
                                                                                    });
                                                                                } else if (
                                                                                    form.content_style.length < 3
                                                                                ) {
                                                                                    setForm({
                                                                                        ...form,
                                                                                        content_style: [
                                                                                            ...form.content_style,
                                                                                            style,
                                                                                        ],
                                                                                    });
                                                                                }
                                                                            }}
                                                                            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                                                                                active
                                                                                    ? 'border-primary bg-primary font-semibold text-primary-foreground shadow-xs'
                                                                                    : disabled
                                                                                      ? 'cursor-not-allowed border-border bg-muted/20 opacity-40'
                                                                                      : 'border-border bg-background hover:border-primary/40 hover:bg-muted/40'
                                                                            }`}
                                                                        >
                                                                            {active && (
                                                                                <Check className="mr-1.5 inline h-3 w-3 stroke-[3]" />
                                                                            )}
                                                                            {style}
                                                                        </button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent
                                                                        side="top"
                                                                        className="max-w-xs rounded-xl p-2.5 text-xs leading-relaxed"
                                                                    >
                                                                        {desc}
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            );
                                                        })}
                                                    </div>
                                                </TooltipProvider>
                                            </div>

                                            {/* Section 3: Brand Tone (Pick up to 3) */}
                                            <div className="space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <Label className="text-xs font-semibold text-foreground">
                                                            Brand Tone
                                                        </Label>
                                                        <HelpTooltip text="Brand emotional vibe and atmosphere (e.g. Luxury, Warm, Bold, Modern) to guide lighting and tone." />
                                                    </div>
                                                    <span className="font-mono text-xs text-muted-foreground">
                                                        {form.brand_tone.length} / 3
                                                    </span>
                                                </div>

                                                <TooltipProvider delayDuration={150}>
                                                    <div className="flex flex-wrap gap-2">
                                                        {toneOptions.map((tone) => {
                                                            const active = form.brand_tone.includes(tone);
                                                            const disabled = !active && form.brand_tone.length >= 3;
                                                            const desc =
                                                                brandToneDescriptions[tone] ||
                                                                'Brand tone and emotional atmosphere preset.';

                                                            return (
                                                                <Tooltip key={tone}>
                                                                    <TooltipTrigger asChild>
                                                                        <button
                                                                            type="button"
                                                                            disabled={disabled}
                                                                            onClick={() => {
                                                                                if (active) {
                                                                                    setForm({
                                                                                        ...form,
                                                                                        brand_tone:
                                                                                            form.brand_tone.filter(
                                                                                                (t) => t !== tone,
                                                                                            ),
                                                                                    });
                                                                                } else if (
                                                                                    form.brand_tone.length < 3
                                                                                ) {
                                                                                    setForm({
                                                                                        ...form,
                                                                                        brand_tone: [
                                                                                            ...form.brand_tone,
                                                                                            tone,
                                                                                        ],
                                                                                    });
                                                                                }
                                                                            }}
                                                                            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                                                                                active
                                                                                    ? 'border-primary bg-primary font-semibold text-primary-foreground shadow-xs'
                                                                                    : disabled
                                                                                      ? 'cursor-not-allowed border-border bg-muted/20 opacity-40'
                                                                                      : 'border-border bg-background hover:border-primary/40 hover:bg-muted/40'
                                                                            }`}
                                                                        >
                                                                            {active && (
                                                                                <Check className="mr-1.5 inline h-3 w-3 stroke-[3]" />
                                                                            )}
                                                                            {tone}
                                                                        </button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent
                                                                        side="top"
                                                                        className="max-w-xs rounded-xl p-2.5 text-xs leading-relaxed"
                                                                    >
                                                                        {desc}
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            );
                                                        })}
                                                    </div>
                                                </TooltipProvider>
                                            </div>
                                        </div>
                                    )}

                                    {/* =====================================
                                        STEP 3: AI MODEL, DIMENSIONS & TAGLINE
                                    ====================================== */}
                                    {currentStep === 3 && (
                                        <div className="animate-in space-y-6 duration-200 fade-in">
                                            {/* AI Image Generation Model Selector */}
                                            <div className="space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <Label className="text-xs font-semibold">
                                                            AI Generation Engine
                                                        </Label>
                                                        <HelpTooltip text="Select the OpenAI image synthesis engine tailored for turn speed, creative context, or photorealistic commercial campaigns." />
                                                    </div>
                                                    {(() => {
                                                        const activeModel =
                                                            imageModelOptions.find(
                                                                (m) =>
                                                                    m.value ===
                                                                    form.image_model,
                                                            ) ||
                                                            imageModelOptions[1];

                                                        return (
                                                            <div className="flex items-center gap-1.5">
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`font-mono text-[10px] font-bold ${activeModel.badgeColor}`}
                                                                >
                                                                    {activeModel.speed}
                                                                </Badge>
                                                                <span className="font-mono text-[10px] text-muted-foreground">
                                                                    {activeModel.price}
                                                                </span>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="h-auto min-h-12 w-full justify-between rounded-2xl border-border bg-card p-3 text-left shadow-xs hover:border-primary/50"
                                                        >
                                                            {(() => {
                                                                const activeModel =
                                                                    imageModelOptions.find(
                                                                        (m) =>
                                                                            m.value ===
                                                                            form.image_model,
                                                                    ) ||
                                                                    imageModelOptions[1];

                                                                return (
                                                                    <div className="flex w-full items-center justify-between gap-3">
                                                                        <div className="flex min-w-0 items-center gap-2.5">
                                                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                                                <Sparkles className="h-4 w-4" />
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <div className="flex flex-wrap items-center gap-2">
                                                                                    <span className="font-mono text-xs font-bold text-foreground">
                                                                                        {
                                                                                            activeModel.label
                                                                                        }
                                                                                    </span>
                                                                                    {activeModel.isRecommended && (
                                                                                        <span className="rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.2 text-[9px] font-bold text-primary">
                                                                                            ★
                                                                                            Recommended
                                                                                        </span>
                                                                                    )}
                                                                                    <span
                                                                                        className={`rounded-md border px-1.5 py-0.2 text-[9px] font-semibold ${activeModel.badgeColor}`}
                                                                                    >
                                                                                        {
                                                                                            activeModel.tag
                                                                                        }
                                                                                    </span>
                                                                                </div>
                                                                                <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                                                                                    {
                                                                                        activeModel.description
                                                                                    }
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                                    </div>
                                                                );
                                                            })()}
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent
                                                        align="start"
                                                        side="bottom"
                                                        sideOffset={6}
                                                        collisionPadding={24}
                                                        avoidCollisions={true}
                                                        className="max-h-[min(320px,50vh)] w-[var(--radix-dropdown-menu-trigger-width)] min-w-[280px] max-w-full space-y-1 overflow-y-auto rounded-2xl border-border bg-popover/98 p-2 shadow-2xl backdrop-blur-xl"
                                                    >
                                                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                            OpenAI Generation Engines
                                                        </div>
                                                        {imageModelOptions.map(
                                                            (model) => {
                                                                const isSelected =
                                                                    form.image_model ===
                                                                    model.value;

                                                                return (
                                                                    <DropdownMenuItem
                                                                        key={
                                                                            model.value
                                                                        }
                                                                        onClick={() =>
                                                                            setForm(
                                                                                {
                                                                                    ...form,
                                                                                    image_model:
                                                                                        model.value,
                                                                                },
                                                                            )
                                                                        }
                                                                        className={`cursor-pointer rounded-xl p-2.5 transition-colors ${
                                                                            isSelected
                                                                                ? 'border border-primary/30 bg-primary/10'
                                                                                : 'hover:bg-muted/60'
                                                                        }`}
                                                                    >
                                                                        <div className="w-full space-y-1">
                                                                            <div className="flex items-center justify-between gap-2">
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <span className="font-mono text-xs font-bold text-foreground">
                                                                                        {
                                                                                            model.label
                                                                                        }
                                                                                    </span>
                                                                                    {model.isRecommended && (
                                                                                        <span className="rounded bg-primary/10 px-1 py-0.2 text-[9px] font-bold text-primary">
                                                                                            ★
                                                                                        </span>
                                                                                    )}
                                                                                    <span className="text-[10px] text-muted-foreground">
                                                                                        ({model.tag})
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                                                                        {
                                                                                            model.price
                                                                                        }
                                                                                    </span>
                                                                                    {isSelected && (
                                                                                        <Check className="h-3.5 w-3.5 text-primary" />
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            <p className="line-clamp-1 text-[10px] text-muted-foreground">
                                                                                {
                                                                                    model.description
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    </DropdownMenuItem>
                                                                );
                                                            },
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>

                                                {/* Active Model Snapshot Pill */}
                                                {(() => {
                                                    const activeModel =
                                                        imageModelOptions.find(
                                                            (m) =>
                                                                m.value ===
                                                                form.image_model,
                                                        ) ||
                                                        imageModelOptions[1];

                                                    return (
                                                        <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 px-3 py-2 text-xs">
                                                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                                                <span className="font-semibold text-foreground">
                                                                    {activeModel.tag}
                                                                </span>
                                                                <span>•</span>
                                                                <span>{activeModel.outcome}</span>
                                                            </div>
                                                            <Badge
                                                                variant="outline"
                                                                className="shrink-0 font-mono text-[10px]"
                                                            >
                                                                {activeModel.speed}
                                                            </Badge>
                                                        </div>
                                                    );
                                                })()}
                                            </div>

                                            {/* Image Quality & Detail Fidelity Tier Selector */}
                                            <div className="space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <Label className="text-xs font-semibold">
                                                            Detail Quality & Quota Tier
                                                        </Label>
                                                        <HelpTooltip text="Controls rendering passes, sharpness, and pricing multiplier. Medium is standard commercial default." />
                                                    </div>
                                                    {(() => {
                                                        const currentCost =
                                                            calculateGenerationCost(
                                                                form.image_model,
                                                                form.image_quality,
                                                            );

                                                        return (
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                                                    {currentCost.usd}{' '}
                                                                    <span className="text-[10px] font-normal text-muted-foreground">
                                                                        ({currentCost.php})
                                                                    </span>
                                                                </span>
                                                                <Badge
                                                                    variant="outline"
                                                                    className="border-primary/20 bg-primary/10 font-mono text-[10px] font-bold text-primary"
                                                                >
                                                                    {form.image_quality === 'medium'
                                                                        ? 'Standard'
                                                                        : form.image_quality === 'low'
                                                                          ? 'Draft'
                                                                          : 'HD Studio'}
                                                                </Badge>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>

                                                {/* 3-Tier Interactive Quality Cards */}
                                                <div className="grid gap-2.5 sm:grid-cols-3">
                                                    {imageQualityOptions.map((q) => {
                                                        const isSelected =
                                                            form.image_quality === q.value;
                                                        const cost =
                                                            calculateGenerationCost(
                                                                form.image_model,
                                                                q.value,
                                                            );

                                                        return (
                                                            <button
                                                                key={q.value}
                                                                type="button"
                                                                onClick={() =>
                                                                    handleQualitySelect(q.value)
                                                                }
                                                                className={`group relative flex flex-col justify-between rounded-2xl border p-3 text-left transition-all ${
                                                                    isSelected
                                                                        ? 'border-primary bg-primary/10 shadow-xs ring-2 ring-primary/40'
                                                                        : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
                                                                }`}
                                                            >
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center justify-between gap-1.5">
                                                                        <span className="text-xs font-bold text-foreground transition-colors group-hover:text-primary">
                                                                            {q.label}
                                                                        </span>
                                                                        {q.isStandard ? (
                                                                            <Badge
                                                                                variant="outline"
                                                                                className="border-emerald-500/30 bg-emerald-500/10 px-1 py-0 text-[9px] font-bold text-emerald-600 dark:text-emerald-400"
                                                                            >
                                                                                Standard
                                                                            </Badge>
                                                                        ) : isSelected ? (
                                                                            <Check className="h-3.5 w-3.5 text-primary" />
                                                                        ) : null}
                                                                    </div>

                                                                    <div className="flex items-baseline gap-1.5">
                                                                        <span className="font-mono text-xs font-extrabold text-foreground">
                                                                            {cost.usd}
                                                                        </span>
                                                                        <span className="font-mono text-[10px] text-muted-foreground">
                                                                            {cost.php}
                                                                        </span>
                                                                    </div>

                                                                    <p className="line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">
                                                                        {q.description}
                                                                    </p>
                                                                </div>

                                                                <div className="mt-2.5 flex items-center justify-between border-t border-border/50 pt-1.5 text-[9px]">
                                                                    <span className="font-mono text-muted-foreground">
                                                                        {cost.totalOn20.toLocaleString()} on $20
                                                                    </span>
                                                                    {isSelected ? (
                                                                        <span className="font-bold text-primary">
                                                                            Active ✓
                                                                        </span>
                                                                    ) : (
                                                                        <span className="font-medium text-muted-foreground group-hover:text-foreground">
                                                                            Select
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Aspect Ratio & Canvas Dimensions */}
                                            <div className="space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <Label className="text-xs font-semibold">
                                                            Aspect Ratio & Dimensions
                                                        </Label>
                                                        <HelpTooltip text="Target proportions optimized for social feeds, mobile Stories/Reels, or wide display banners." />
                                                    </div>
                                                    <Badge
                                                        variant="outline"
                                                        className="border-primary/20 bg-primary/10 font-mono text-[10px] font-bold text-primary"
                                                    >
                                                        {form.aspect_ratio}
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                                                    {aspectRatioOptions.map((opt) => {
                                                        const isSelected = form.aspect_ratio === opt.value;

                                                        return (
                                                            <button
                                                                key={opt.value}
                                                                type="button"
                                                                onClick={() =>
                                                                    setForm({
                                                                        ...form,
                                                                        aspect_ratio: opt.value,
                                                                    })
                                                                }
                                                                className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-all ${
                                                                    isSelected
                                                                        ? 'border-primary bg-primary/10 font-bold text-primary shadow-xs ring-1 ring-primary/40'
                                                                        : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted/30 hover:text-foreground'
                                                                }`}
                                                            >
                                                                <span className="font-mono text-xs font-bold">
                                                                    {opt.value}
                                                                </span>
                                                                <span className="text-[10px]">
                                                                    {opt.label.split(' ')[1] || opt.label}
                                                                </span>
                                                                <span className="mt-0.5 font-mono text-[9px] text-muted-foreground">
                                                                    {opt.badge}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Marketing Tagline & Slogan */}
                                            <div className="space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <Label className="text-xs font-semibold">
                                                            Campaign Tagline (Optional)
                                                        </Label>
                                                        <HelpTooltip text="An optional campaign slogan or promotional hook placed on or styled into the visual." />
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={generateTagline}
                                                        className="h-7 gap-1 text-[11px] font-semibold text-primary hover:bg-primary/10"
                                                    >
                                                        <Sparkles className="h-3 w-3" />
                                                        Auto-Generate
                                                    </Button>
                                                </div>

                                                <Input
                                                    value={form.tagline}
                                                    onChange={(e) =>
                                                        setForm({
                                                            ...form,
                                                            tagline: e.target.value,
                                                            tagline_mode: 'manual',
                                                        })
                                                    }
                                                    placeholder="e.g. Elevate Your Everyday with Fresh Artisan Roasts"
                                                    className="h-10 text-xs"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* FOOTER CONTROLS */}
                                    <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setCurrentStep(
                                                    (prev) =>
                                                        Math.max(
                                                            1,
                                                            prev - 1,
                                                        ) as Step,
                                                )
                                            }
                                            disabled={currentStep === 1}
                                            className="gap-2 text-xs font-semibold shadow-none"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            Back
                                        </Button>

                                        {currentStep < 3 ? (
                                            <Button
                                                type="button"
                                                onClick={() =>
                                                    setCurrentStep(
                                                        (prev) =>
                                                            Math.min(
                                                                3,
                                                                prev + 1,
                                                            ) as Step,
                                                    )
                                                }
                                                disabled={
                                                    currentStep === 1 &&
                                                    !stepOneValid
                                                }
                                                className="gap-2 text-xs font-semibold shadow-sm"
                                            >
                                                Continue
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <Button
                                                type="button"
                                                onClick={generateMarketingImage}
                                                disabled={!canGenerate}
                                                className={`gap-2 text-xs font-semibold shadow-sm ${
                                                    isQuotaExceeded
                                                        ? 'border border-destructive/30 bg-destructive/15 text-destructive hover:bg-destructive/20'
                                                        : ''
                                                }`}
                                            >
                                                {isQuotaExceeded ? (
                                                    <>
                                                        <AlertTriangle className="h-4 w-4" />
                                                        Quota Limit Reached ($10.00)
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="h-4 w-4" />
                                                        Generate Visual Creative
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>

                {/* =====================================================
                    DOCKED RIGHT SIDEBAR: BRIEF SUMMARY (ONLY IN FORM EDIT MODE)
                ====================================================== */}
                {generationState === 'idle' && (
                    isSummaryCollapsed ? (
                    /* COLLAPSED VERTICAL RAIL BOX (LIKE LEFT SIDEBAR RAIL) */
                    <aside
                        onClick={() => handleSetSummaryCollapsed(false)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                handleSetSummaryCollapsed(false);
                            }
                        }}
                        className="group sticky top-11 z-20 flex h-[calc(100vh-2.75rem)] w-11 shrink-0 cursor-pointer flex-col items-center justify-between border-l border-border/80 bg-card/60 py-4 backdrop-blur-xl transition-all duration-200 select-none hover:bg-muted/40 sm:top-12 sm:h-[calc(100vh-3rem)] lg:w-12"
                        title="Open Brief Summary"
                    >
                        <div className="flex flex-col items-center gap-5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-2xs transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                                <PanelRightOpen className="h-4 w-4" />
                            </div>

                            <div className="flex flex-col items-center gap-4 py-2">
                                <span className="rotate-180 text-[10px] font-bold tracking-widest text-muted-foreground uppercase transition-colors [writing-mode:vertical-rl] group-hover:text-foreground">
                                    Brief Summary
                                </span>
                                <span className="rotate-180 rounded border border-primary/30 bg-primary/5 px-1 py-0.5 font-mono text-[9px] font-bold text-primary [writing-mode:vertical-rl]">
                                    {form.aspect_ratio}
                                </span>
                            </div>
                        </div>

                        <div className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors group-hover:text-foreground">
                            <Sparkles className="h-3.5 w-3.5" />
                        </div>
                    </aside>
                ) : (
                    /* EXPANDED FULL RIGHT SIDEBAR */
                    <aside className="sticky top-11 z-20 flex h-[calc(100vh-2.75rem)] w-80 shrink-0 flex-col justify-between overflow-y-auto border-l border-border/80 bg-card/75 p-5 backdrop-blur-2xl transition-all duration-300 sm:top-12 sm:h-[calc(100vh-3rem)] lg:w-[320px] dark:bg-card/85">
                        <div className="space-y-5">
                            {/* Sidebar Header */}
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    Brief Summary
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        handleSetSummaryCollapsed(true)
                                    }
                                    className="h-7 w-7 cursor-pointer rounded-lg text-muted-foreground hover:text-foreground"
                                    title="Collapse summary sidebar"
                                >
                                    <PanelRightClose className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Aspect Ratio Dimension Visualizer (Clean Wireframe Only) */}
                            <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/20 p-3.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-foreground">
                                        Canvas Ratio
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className="border-primary/20 bg-primary/10 font-mono text-[10px] font-bold text-primary"
                                    >
                                        {form.aspect_ratio}
                                    </Badge>
                                </div>

                                {/* Proportional Wireframe Box - Pure Dimensions */}
                                <div className="flex min-h-[170px] items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-background/80 p-3">
                                    <div
                                        className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/60 bg-primary/5 transition-all duration-300 ${
                                            form.aspect_ratio === '9:16'
                                                ? 'h-[160px] w-[90px]'
                                                : form.aspect_ratio === '16:9'
                                                  ? 'h-[101px] w-[180px]'
                                                  : form.aspect_ratio === '4:5'
                                                    ? 'h-[145px] w-[116px]'
                                                    : form.aspect_ratio ===
                                                        '4:3'
                                                      ? 'h-[114px] w-[152px]'
                                                      : 'h-[125px] w-[125px]' // 1:1 square
                                        }`}
                                    >
                                        {/* Centered Ratio & Resolution Tags */}
                                        <div className="flex flex-col items-center justify-center gap-1 p-1 text-center">
                                            <span className="font-mono text-xs font-extrabold text-primary">
                                                {form.aspect_ratio}
                                            </span>
                                            <span className="font-mono text-[10px] font-semibold text-muted-foreground">
                                                {aspectRatioOptions.find(
                                                    (o) =>
                                                        o.value ===
                                                        form.aspect_ratio,
                                                )?.badge || '1024 × 1024'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-border/40 pt-1 text-[11px] text-muted-foreground">
                                    <span className="max-w-[170px] truncate font-medium text-foreground">
                                        {aspectRatioOptions.find(
                                            (o) =>
                                                o.value === form.aspect_ratio,
                                        )?.label || form.aspect_ratio}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {aspectRatioOptions.find(
                                            (o) =>
                                                o.value === form.aspect_ratio,
                                        )?.badge || '1024 × 1024'}
                                    </span>
                                </div>
                            </div>

                            {/* Parameter Details Rows */}
                            <div className="space-y-2.5 text-xs">
                                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1.5">
                                    <span className="text-muted-foreground">
                                        Product
                                    </span>
                                    <span className="max-w-[160px] truncate text-right font-semibold text-foreground">
                                        {form.product_name || '—'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1.5">
                                    <span className="text-muted-foreground">
                                        Event
                                    </span>
                                    <span className="max-w-[160px] truncate text-right font-semibold text-foreground">
                                        {selectedEvent?.name || 'None'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1.5">
                                    <span className="text-muted-foreground">
                                        Price
                                    </span>
                                    <span className="text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                        {form.price
                                            ? `₱${Number(form.price).toLocaleString()}`
                                            : '—'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1.5">
                                    <span className="text-muted-foreground">
                                        AI Model
                                    </span>
                                    {(() => {
                                        const activeModel =
                                            imageModelOptions.find(
                                                (m) =>
                                                    m.value ===
                                                    form.image_model,
                                            ) || imageModelOptions[1];

                                        return (
                                            <div className="flex items-center gap-1.5 text-right">
                                                <span className="font-mono font-bold text-foreground">
                                                    {activeModel.label}
                                                </span>
                                                {activeModel.isRecommended && (
                                                    <span className="rounded bg-primary/10 px-1 py-0.2 text-[9px] font-bold text-primary">
                                                        ★
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1.5">
                                    <span className="text-muted-foreground">
                                        Quality Tier
                                    </span>
                                    {(() => {
                                        const activeQuality =
                                            imageQualityOptions.find(
                                                (q) =>
                                                    q.value ===
                                                    form.image_quality,
                                            ) || imageQualityOptions[1];
                                        const cost = calculateGenerationCost(
                                            form.image_model,
                                            form.image_quality,
                                        );

                                        return (
                                            <div className="flex items-center gap-1.5 text-right">
                                                <span className="text-xs font-semibold text-foreground">
                                                    {activeQuality.label}
                                                </span>
                                                <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.2 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                                    {cost.usd}
                                                </span>
                                            </div>
                                        );
                                    })()}
                                </div>
                                <div className="flex flex-col gap-1.5 border-b border-border/40 pb-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">
                                            Themes
                                        </span>
                                        <span className="font-mono text-[10px] text-muted-foreground">
                                            {form.content_style.length > 0
                                                ? `${form.content_style.length} selected`
                                                : 'Default'}
                                        </span>
                                    </div>
                                    {form.content_style.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {form.content_style.map((style) => (
                                                <span
                                                    key={style}
                                                    className="rounded-md border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary"
                                                >
                                                    {style}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-[11px] font-medium text-muted-foreground">
                                            Product-focused (Auto)
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1.5 border-b border-border/40 pb-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">
                                            Tones
                                        </span>
                                        <span className="font-mono text-[10px] text-muted-foreground">
                                            {form.brand_tone.length > 0
                                                ? `${form.brand_tone.length} selected`
                                                : 'Default'}
                                        </span>
                                    </div>
                                    {form.brand_tone.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {form.brand_tone.map((tone) => (
                                                <span
                                                    key={tone}
                                                    className="rounded-md border border-border/80 bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-foreground"
                                                >
                                                    {tone}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-[11px] font-medium text-muted-foreground">
                                            Professional (Auto)
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1.5">
                                    <span className="text-muted-foreground">
                                        Render Style
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className="border-primary/30 bg-primary/10 text-[10px] font-bold text-primary"
                                    >
                                        {form.render_style ||
                                            'Studio Product Still'}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1.5">
                                    <span className="text-muted-foreground">
                                        Dimensions
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className="font-mono text-[10px] font-semibold"
                                    >
                                        {form.aspect_ratio} (
                                        {aspectRatioOptions.find(
                                            (o) =>
                                                o.value === form.aspect_ratio,
                                        )?.badge || '1024 × 1024'}
                                        )
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-muted-foreground">
                                        Brand Logo
                                    </span>
                                    <Badge
                                        variant={
                                            form.include_logo
                                                ? 'default'
                                                : 'outline'
                                        }
                                        className={`text-[10px] font-semibold ${form.include_logo ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : ''}`}
                                    >
                                        {form.include_logo ? 'Included' : 'Off'}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Sticky footer info */}
                        <div className="border-t border-border/50 pt-4 text-center text-[11px] text-muted-foreground">
                            <span>MarketPilot AI Creative Engine</span>
                        </div>
                    </aside>
                ))}
            </div>

            {/* =============================================================
                REDESIGNED & RESTRUCTURED EVENT SELECTION MODAL
            ============================================================= */}

            {/* =============================================================
                REDESIGNED & RESTRUCTURED EVENT SELECTION MODAL (LARGER & CLEAN)
            ============================================================= */}

            <Dialog open={eventModalOpen} onOpenChange={setEventModalOpen}>
                <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden rounded-3xl border-border bg-card p-0 shadow-2xl sm:max-w-4xl">
                    <DialogHeader className="shrink-0 border-b border-border bg-muted/20 p-4 sm:p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <CalendarDays className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold text-foreground sm:text-xl">
                                    Select Marketing Event or Holiday
                                </DialogTitle>
                                <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                                    Choose an event or holiday to tailor your
                                    visual concept, seasonal theme, and
                                    promotion.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Filter & Year Toolbar (Responsive Grid with Dropdowns) */}
                    <div className="shrink-0 border-b border-border bg-muted/10 p-4">
                        <div className="grid grid-cols-1 items-center gap-2.5 sm:grid-cols-12">
                            {/* Search Input */}
                            <div className="relative sm:col-span-6">
                                <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={eventSearchQuery}
                                    onChange={(e) =>
                                        setEventSearchQuery(e.target.value)
                                    }
                                    placeholder="Search events, holidays, sales..."
                                    className="h-9.5 rounded-xl border-border bg-card pl-9 text-xs"
                                />
                            </div>

                            {/* Category Filter Dropdown */}
                            <div className="sm:col-span-3">
                                <Select
                                    value={eventCategoryFilter}
                                    onValueChange={setEventCategoryFilter}
                                >
                                    <SelectTrigger className="h-9.5 w-full rounded-xl border-border bg-card text-xs font-medium shadow-2xs">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-border shadow-lg">
                                        <SelectItem value="all">
                                            All Categories
                                        </SelectItem>
                                        <SelectItem value="regular">
                                            Regular Holidays
                                        </SelectItem>
                                        <SelectItem value="special_non_working">
                                            Special Non-Working
                                        </SelectItem>
                                        <SelectItem value="special_working">
                                            Special Working
                                        </SelectItem>
                                        <SelectItem value="islamic">
                                            Islamic Holidays
                                        </SelectItem>
                                        <SelectItem value="long_weekend">
                                            Long Weekends
                                        </SelectItem>
                                        <SelectItem value="commercial">
                                            Retail Sales & Payday
                                        </SelectItem>
                                        <SelectItem value="custom">
                                            Custom Events
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Year Selector Dropdown */}
                            <div className="sm:col-span-3">
                                <Select
                                    value={selectedYearTab}
                                    onValueChange={setSelectedYearTab}
                                >
                                    <SelectTrigger className="h-9.5 w-full rounded-xl border-border bg-card text-xs font-medium shadow-2xs">
                                        <SelectValue placeholder="Year" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-border shadow-lg">
                                        <SelectItem value="all">
                                            All Years
                                        </SelectItem>
                                        {availableYears.map((yr) => (
                                            <SelectItem key={yr} value={yr}>
                                                Year {yr}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Events List Grid */}
                    <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                        {filteredEvents.length === 0 ? (
                            <div className="space-y-2 py-12 text-center text-muted-foreground">
                                <CalendarDays className="mx-auto h-8 w-8 opacity-30" />
                                <p className="text-sm font-semibold text-foreground">
                                    No events found matching your filter
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Try clearing search keywords or selecting
                                    "All" categories.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                                {filteredEvents.map((evt: EventItem) => {
                                    const isSelected =
                                        String(evt.id) ===
                                        String(form.event_id);
                                    const styleKey =
                                        evt.category || evt.type || 'holiday';
                                    const style =
                                        eventTypeStyles[styleKey] ||
                                        eventTypeStyles.holiday;

                                    return (
                                        <button
                                            key={evt.id}
                                            type="button"
                                            onClick={() =>
                                                handleSelectEvent(evt)
                                            }
                                            className={`group flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                                                isSelected
                                                    ? 'border-primary bg-primary/10 shadow-xs ring-2 ring-primary/40'
                                                    : 'border-border bg-card hover:border-primary/50 hover:bg-muted/30'
                                            }`}
                                        >
                                            <div className="space-y-1.5">
                                                <div className="flex items-start justify-between gap-1.5">
                                                    <span className="line-clamp-2 text-xs font-bold text-foreground transition-colors group-hover:text-primary">
                                                        {evt.name}
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className={`shrink-0 text-[9px] font-medium tracking-wider uppercase ${style.bg} ${style.text} ${style.border}`}
                                                    >
                                                        {style.label}
                                                    </Badge>
                                                </div>

                                                {evt.is_long_weekend && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="py-0 text-[9px] font-medium"
                                                    >
                                                        Long Weekend
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2 text-xs text-muted-foreground">
                                                <span className="text-[11px] font-medium">
                                                    {formatEventDateLabel(
                                                        evt.date,
                                                    )}
                                                </span>
                                                {isSelected ? (
                                                    <span className="text-xs font-bold text-primary">
                                                        Selected ✓
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] font-medium transition-colors group-hover:text-foreground">
                                                        Select
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* =============================================================
                PRODUCT CATALOG SELECTOR MODAL
            ============================================================= */}

            <Dialog
                open={isProductModalOpen}
                onOpenChange={setIsProductModalOpen}
            >
                <DialogContent className="max-h-[85vh] overflow-hidden rounded-3xl p-0 sm:max-w-xl">
                    <DialogHeader className="border-b bg-muted/20 p-5 pb-4">
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                            <Package className="h-5 w-5 text-primary" />
                            Select Catalog Product
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Use this product photo and pricing for your
                            marketing design.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="border-b bg-muted/10 p-4">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={productSearchQuery}
                                onChange={(e) =>
                                    setProductSearchQuery(e.target.value)
                                }
                                placeholder="Search products..."
                                className="h-9 pl-9 text-xs"
                            />
                        </div>
                    </div>

                    <div className="max-h-[380px] min-h-[200px] overflow-y-auto p-4">
                        {filteredProducts.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">
                                <Package className="mx-auto h-8 w-8 opacity-40" />
                                <p className="mt-2 text-xs font-medium">
                                    No products found
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {filteredProducts.map((prod: ProductItem) => (
                                    <button
                                        key={prod.id}
                                        type="button"
                                        onClick={() =>
                                            handleSelectProduct(prod)
                                        }
                                        className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-left transition-all hover:border-primary/40"
                                    >
                                        <div className="flex h-28 w-full items-center justify-center overflow-hidden border-b border-border/40 bg-muted/40">
                                            {prod.image_url ? (
                                                <img
                                                    src={prod.image_url}
                                                    alt={prod.name}
                                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                />
                                            ) : (
                                                <Package className="h-8 w-8 opacity-40" />
                                            )}
                                        </div>
                                        <div className="p-3">
                                            <p className="truncate text-xs font-bold text-foreground">
                                                {prod.name}
                                            </p>
                                            {prod.price && (
                                                <p className="mt-0.5 text-[11px] font-bold text-emerald-500">
                                                    ₱
                                                    {Number(
                                                        prod.price,
                                                    ).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* =============================================================
                PURE FULL SCREEN IMAGE VIEWER FOR GENERATED VISUAL
            ============================================================= */}

            {isPreviewFullViewOpen && (
                <div
                    className="fixed inset-0 z-50 flex animate-in flex-col items-center justify-between overflow-hidden bg-black/95 backdrop-blur-md duration-200 select-none fade-in"
                    onClick={() => {
                        setIsPreviewFullViewOpen(false);
                        setIsFullViewDetailsExpanded(false);
                    }}
                >
                    {/* Top Floating Control Bar */}
                    <div
                        className="relative z-50 flex w-full items-center justify-between bg-gradient-to-b from-black/90 via-black/50 to-transparent px-5 py-4 sm:px-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3">
                            <h2 className="max-w-[240px] truncate text-sm font-semibold text-white sm:max-w-md sm:text-base">
                                {form.product_name || 'Marketing Visual'}
                            </h2>
                            <span className="rounded-full bg-white/10 px-2.5 py-1 font-mono text-xs text-white">
                                {form.aspect_ratio || '1:1'}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 text-xs font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20"
                                        title="Download Image"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download
                                        <ChevronDown className="h-3 w-3 opacity-70" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-48 rounded-xl border-white/20 bg-black/90 p-1.5 text-white shadow-xl backdrop-blur-xl"
                                >
                                    <DropdownMenuItem
                                        onClick={() => downloadImage('png')}
                                        className="cursor-pointer gap-2 text-xs font-medium text-white hover:bg-white/20 focus:bg-white/20 focus:text-white"
                                    >
                                        <Download className="h-3.5 w-3.5 text-primary" />
                                        PNG (High Quality)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => downloadImage('jpeg')}
                                        className="cursor-pointer gap-2 text-xs font-medium text-white hover:bg-white/20 focus:bg-white/20 focus:text-white"
                                    >
                                        <Download className="h-3.5 w-3.5 text-blue-400" />
                                        JPEG (Web-Optimized)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => downloadImage('svg')}
                                        className="cursor-pointer gap-2 text-xs font-medium text-white hover:bg-white/20 focus:bg-white/20 focus:text-white"
                                    >
                                        <Download className="h-3.5 w-3.5 text-emerald-400" />
                                        SVG (Vector Embed)
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <button
                                type="button"
                                onClick={() => {
                                    setIsPreviewFullViewOpen(false);
                                    setIsFullViewDetailsExpanded(false);
                                }}
                                className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-all hover:bg-white/30"
                                title="Close (Esc)"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Main Full View Canvas - Real Image */}
                    <div
                        className="relative flex h-full w-full flex-1 items-center justify-center overflow-hidden p-4 sm:p-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {savedDesign?.image_url ? (
                            <img
                                src={savedDesign.image_url}
                                alt={form.product_name}
                                className={`max-h-[82vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl drop-shadow-2xl transition-all duration-300 ${
                                    isFullViewDetailsExpanded
                                        ? '-translate-y-6 scale-90'
                                        : 'scale-100'
                                }`}
                            />
                        ) : (
                            <div
                                className={`flex flex-col items-center justify-center rounded-3xl border border-white/20 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-8 text-center text-white drop-shadow-2xl transition-all duration-300 ${
                                    isFullViewDetailsExpanded
                                        ? '-translate-y-8 scale-90'
                                        : 'scale-100'
                                } ${
                                    form.aspect_ratio === '9:16'
                                        ? 'h-[570px] w-[320px]'
                                        : form.aspect_ratio === '16:9'
                                          ? 'h-[380px] w-[680px]'
                                          : form.aspect_ratio === '4:5'
                                            ? 'h-[500px] w-[400px]'
                                            : 'h-[480px] w-[480px]'
                                }`}
                            >
                                <Sparkles className="mb-3 h-10 w-10 text-primary" />
                                <h3 className="text-2xl font-bold">
                                    {form.product_name}
                                </h3>
                                {form.tagline && (
                                    <p className="mt-2 text-sm text-slate-300">
                                        "{form.tagline}"
                                    </p>
                                )}
                                {form.price && (
                                    <p className="mt-3 text-xl font-bold text-sky-400">
                                        ₱{Number(form.price).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Bottom Fade-out Section with Toggle & Expandable Details */}
                    <div
                        className="relative z-50 flex w-full flex-col items-center justify-end bg-gradient-to-t from-black/95 via-black/75 to-transparent px-4 pt-12 pb-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() =>
                                setIsFullViewDetailsExpanded(
                                    !isFullViewDetailsExpanded,
                                )
                            }
                            className="group flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-5 py-2 text-xs font-medium text-white/90 shadow-2xl backdrop-blur-xl transition-all hover:border-white/40 hover:bg-black/80 hover:text-white active:scale-95"
                            aria-expanded={isFullViewDetailsExpanded}
                        >
                            <span>
                                {isFullViewDetailsExpanded
                                    ? 'Hide details'
                                    : 'View prompt & creative details'}
                            </span>
                            <ChevronDown
                                className={`h-4 w-4 transition-transform duration-300 ${isFullViewDetailsExpanded ? 'rotate-180 text-primary' : 'animate-bounce text-white/70'}`}
                            />
                        </button>

                        {isFullViewDetailsExpanded && (
                            <div className="mt-4 max-h-[38vh] w-full max-w-xl animate-in space-y-4 overflow-y-auto rounded-2xl border border-white/15 bg-black/80 p-5 text-white shadow-2xl backdrop-blur-2xl duration-300 fade-in slide-in-from-bottom-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold tracking-wider text-white/60 uppercase">
                                            Creative Prompt & Setup
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="rounded-md border border-primary/40 bg-primary/20 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
                                                {form.render_style ||
                                                    'Studio Product Still'}
                                            </span>
                                            <span className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                                                {form.image_model ||
                                                    'gpt-image-1'}
                                            </span>
                                            <span
                                                className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                                                    form.image_quality ===
                                                    'high'
                                                        ? 'border-purple-400/40 bg-purple-500/20 text-purple-300'
                                                        : form.image_quality ===
                                                            'low'
                                                          ? 'border-amber-400/40 bg-amber-500/20 text-amber-300'
                                                          : 'border-emerald-400/40 bg-emerald-500/20 text-emerald-300'
                                                }`}
                                            >
                                                Quality:{' '}
                                                {form.image_quality || 'medium'}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs leading-relaxed text-white/90">
                                        {form.image_prompt}
                                    </p>
                                    {(form.content_style.length > 0 ||
                                        form.brand_tone.length > 0) && (
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {form.content_style.map((style) => (
                                                <span
                                                    key={style}
                                                    className="rounded border border-primary/40 bg-primary/10 px-1.5 py-0.2 font-mono text-[9px] text-primary"
                                                >
                                                    {style}
                                                </span>
                                            ))}
                                            {form.brand_tone.map((tone) => (
                                                <span
                                                    key={tone}
                                                    className="rounded border border-white/20 bg-white/5 px-1.5 py-0.2 font-mono text-[9px] text-slate-300"
                                                >
                                                    {tone}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-white/10 pt-3">
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => saveToDesigns()}
                                        disabled={isSavedToDesigns}
                                        className="gap-1.5 text-xs shadow-none"
                                    >
                                        <Check className="h-3.5 w-3.5" />
                                        {isSavedToDesigns
                                            ? 'Saved to Library'
                                            : 'Save to Library'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => downloadImage()}
                                        className="gap-1.5 border-white/20 bg-white/10 text-xs text-white shadow-none hover:bg-white/20"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        Download Visual
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* =============================================================
                UNSAVED NAVIGATION WARNING MODAL
            ============================================================= */}

            <Dialog
                open={isUnsavedExitModalOpen}
                onOpenChange={setIsUnsavedExitModalOpen}
            >
                <DialogContent className="rounded-3xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-foreground">
                            Leave Without Saving?
                        </DialogTitle>
                        <DialogDescription className="text-xs leading-relaxed">
                            Your freshly generated visual asset is currently
                            unsaved. If you navigate to another page now, this
                            generated mockup will be lost.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="mt-6 flex-col gap-2 sm:flex-row">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsUnsavedExitModalOpen(false)}
                            className="w-full sm:w-auto"
                        >
                            Stay Here
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => {
                                setNavigatingConfirmed(true);
                                setIsUnsavedExitModalOpen(false);

                                if (pendingNavigationUrl) {
                                    router.visit(pendingNavigationUrl);
                                }
                            }}
                            className="w-full sm:w-auto"
                        >
                            Discard & Leave
                        </Button>
                        <Button
                            type="button"
                            onClick={async () => {
                                await saveToDesigns();
                                setNavigatingConfirmed(true);
                                setIsUnsavedExitModalOpen(false);

                                if (pendingNavigationUrl) {
                                    router.visit(pendingNavigationUrl);
                                }
                            }}
                            className="w-full sm:w-auto"
                        >
                            Save & Leave
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =============================================================
                EDIT CONFIRMATION MODAL
            ============================================================= */}

            <Dialog
                open={isEditConfirmOpen}
                onOpenChange={setIsEditConfirmOpen}
            >
                <DialogContent className="rounded-3xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">
                            Edit Creative Parameters?
                        </DialogTitle>
                        <DialogDescription className="text-xs leading-relaxed">
                            Returning to the design brief allows you to change
                            prompts, events, and styling. Make sure you have
                            saved your visual if you wish to keep it.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="mt-6 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsEditConfirmOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                setIsEditConfirmOpen(false);
                                setGenerationState('idle');
                                setCurrentStep(1);
                            }}
                        >
                            Continue Editing
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =============================================================
                REGENERATE CONFIRMATION MODAL
            ============================================================= */}

            <Dialog
                open={isRegenerateConfirmOpen}
                onOpenChange={setIsRegenerateConfirmOpen}
            >
                <DialogContent className="rounded-3xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">
                            Regenerate Visual Creative?
                        </DialogTitle>
                        <DialogDescription className="text-xs leading-relaxed">
                            This will create a brand new creative variation
                            based on your current prompt.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="mt-6 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsRegenerateConfirmOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                if (isQuotaExceeded) {
                                    toast.error(
                                        'You have reached your $10.00 AI generation limit quota. Visual generation is disabled.',
                                    );
                                    setIsRegenerateConfirmOpen(false);

                                    return;
                                }
                                setIsRegenerateConfirmOpen(false);
                                setIsSavedToDesigns(false);
                                setSavedDesign(null);
                                generateMarketingImage();
                            }}
                        >
                            Yes, Regenerate
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* =============================================================
                LINK TO CAMPAIGN MODAL
            ============================================================= */}

            <Dialog
                open={isCampaignModalOpen}
                onOpenChange={setIsCampaignModalOpen}
            >
                <DialogContent className="overflow-hidden rounded-3xl border-border bg-card p-0 shadow-2xl sm:max-w-md">
                    <DialogHeader className="border-b border-border bg-muted/20 p-5 pb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Layers className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-foreground">
                                    Link Design to Campaign
                                </DialogTitle>
                                <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                                    {selectedEvent
                                        ? `Attach this creative visual to a campaign for ${selectedEvent.name}.`
                                        : 'Attach this creative visual to an active or scheduled campaign.'}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Tabs: Existing Campaign vs New Campaign */}
                    <div className="space-y-4 p-5">
                        <div className="flex items-center rounded-xl border border-border bg-muted/40 p-1 text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => setCampaignModalTab('existing')}
                                className={`flex-1 rounded-lg py-1.5 text-center transition-all ${
                                    campaignModalTab === 'existing'
                                        ? 'bg-card text-foreground shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Existing Campaign{' '}
                                {eligibleCampaigns.length > 0
                                    ? `(${eligibleCampaigns.length})`
                                    : ''}
                            </button>
                            <button
                                type="button"
                                onClick={() => setCampaignModalTab('new')}
                                className={`flex-1 rounded-lg py-1.5 text-center transition-all ${
                                    campaignModalTab === 'new'
                                        ? 'bg-card text-foreground shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                + Create New Campaign
                            </button>
                        </div>

                        {campaignModalTab === 'existing' ? (
                            <div className="space-y-4">
                                {eligibleCampaigns.length === 0 ? (
                                    <div className="space-y-3 rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center text-muted-foreground">
                                        <Layers className="mx-auto h-8 w-8 opacity-40" />
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-foreground">
                                                {selectedEvent
                                                    ? `No existing campaigns for ${selectedEvent.name}`
                                                    : 'No existing general campaigns'}
                                            </p>
                                            <p className="text-[11px] leading-relaxed text-muted-foreground">
                                                {selectedEvent
                                                    ? `There are no existing campaigns linked to "${selectedEvent.name}". Switch to create a new campaign for this event.`
                                                    : 'There are no existing general marketing campaigns. Switch to create a new campaign.'}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                setCampaignModalTab('new')
                                            }
                                            className="gap-1.5 text-xs font-semibold"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            + Create New Campaign
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
                                            {eligibleCampaigns.map((c: any) => {
                                                const isSelected =
                                                    String(c.id) ===
                                                    String(
                                                        selectedExistingCampaignId,
                                                    );

                                                return (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedExistingCampaignId(
                                                                String(c.id),
                                                            )
                                                        }
                                                        className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                                                            isSelected
                                                                ? 'border-primary bg-primary/10 font-semibold ring-2 ring-primary/40'
                                                                : 'border-border bg-card hover:border-primary/40 hover:bg-muted/20'
                                                        }`}
                                                    >
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-xs font-bold text-foreground">
                                                                {c.name}
                                                            </p>
                                                            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                                                                <span className="capitalize">
                                                                    Status:{' '}
                                                                    {c.status ||
                                                                        'draft'}
                                                                </span>
                                                                {c.event_name && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span className="truncate text-primary">
                                                                            {c.event_name}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {isSelected && (
                                                            <Check className="ml-2 h-4 w-4 shrink-0 text-primary" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Direct create new campaign shortcut even when existing ones exist */}
                                        <div className="flex items-center justify-between rounded-xl border border-dashed border-border bg-muted/20 px-3 py-2 text-xs">
                                            <span className="text-[11px] text-muted-foreground">
                                                Want to start a new campaign instead?
                                            </span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setCampaignModalTab('new')}
                                                className="h-7 gap-1 px-2.5 text-xs font-semibold text-primary hover:bg-primary/10 hover:text-primary"
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                                + Create New
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <DialogFooter className="gap-2 border-t border-border pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setIsCampaignModalOpen(false)
                                        }
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={
                                            !selectedExistingCampaignId ||
                                            isAttachingCampaign ||
                                            eligibleCampaigns.length === 0
                                        }
                                        onClick={handleAttachExistingCampaign}
                                        className="gap-1.5"
                                    >
                                        {isAttachingCampaign ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Check className="h-3.5 w-3.5" />
                                        )}
                                        Link to Selected Campaign
                                    </Button>
                                </DialogFooter>
                            </div>
                        ) : (
                            <form
                                onSubmit={handleCreateAndLinkCampaign}
                                className="space-y-3.5"
                            >
                                <div className="flex items-center justify-between">
                                    {eligibleCampaigns.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setCampaignModalTab('existing')}
                                            className="text-[11px] font-semibold text-primary hover:underline"
                                        >
                                            ← Select from existing ({eligibleCampaigns.length})
                                        </button>
                                    )}
                                </div>
                                {selectedEvent && (
                                    <div className="flex items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-2.5 text-xs">
                                        <Calendar className="h-4 w-4 shrink-0 text-primary" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-semibold text-foreground">
                                                {selectedEvent.name}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
                                                Campaign will automatically be linked to this event.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <Label
                                        htmlFor="campaign_name"
                                        className="text-xs font-semibold"
                                    >
                                        Campaign Name *
                                    </Label>
                                    <Input
                                        id="campaign_name"
                                        value={campaignFormData.name}
                                        onChange={(e) =>
                                            setCampaignFormData({
                                                ...campaignFormData,
                                                name: e.target.value,
                                            })
                                        }
                                        placeholder="e.g. Mid-Year Mega Sale Campaign"
                                        className="h-9 text-xs"
                                        required
                                    />
                                    {campaignFormErrors.name && (
                                        <p className="text-[11px] font-medium text-destructive">
                                            {campaignFormErrors.name}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label
                                            htmlFor="start_date"
                                            className="text-[11px] font-semibold"
                                        >
                                            Start Date
                                        </Label>
                                        <Input
                                            id="start_date"
                                            type="date"
                                            value={campaignFormData.start_date}
                                            onChange={(e) =>
                                                setCampaignFormData({
                                                    ...campaignFormData,
                                                    start_date: e.target.value,
                                                })
                                            }
                                            className="h-9 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label
                                            htmlFor="end_date"
                                            className="text-[11px] font-semibold"
                                        >
                                            End Date
                                        </Label>
                                        <Input
                                            id="end_date"
                                            type="date"
                                            value={campaignFormData.end_date}
                                            onChange={(e) =>
                                                setCampaignFormData({
                                                    ...campaignFormData,
                                                    end_date: e.target.value,
                                                })
                                            }
                                            className="h-9 text-xs"
                                        />
                                    </div>
                                </div>

                                <DialogFooter className="gap-2 border-t border-border pt-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setIsCampaignModalOpen(false)
                                        }
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={
                                            isCreatingCampaign ||
                                            !campaignFormData.name.trim()
                                        }
                                        className="gap-1.5"
                                    >
                                        {isCreatingCampaign ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Plus className="h-3.5 w-3.5" />
                                        )}
                                        Create & Link Campaign
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* =============================================================
                IMAGE QUALITY CHANGE WARNING & CONFIRMATION MODAL
            ============================================================= */}
            <Dialog
                open={isQualityWarningOpen}
                onOpenChange={setIsQualityWarningOpen}
            >
                <DialogContent className="rounded-3xl sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                                    pendingQuality === 'high'
                                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                }`}
                            >
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-foreground">
                                    {pendingQuality === 'high'
                                        ? 'Switch to High Quality (HD Studio)?'
                                        : 'Switch to Low Quality (Draft Mode)?'}
                                </DialogTitle>
                                <DialogDescription className="text-xs">
                                    Adjusting image detail tier alters generation speed and token quota pricing.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-3 py-2 text-xs">
                        {pendingQuality === 'high' ? (
                            <div className="space-y-2 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-3.5 text-purple-950 dark:text-purple-100">
                                <div className="flex items-center justify-between font-bold">
                                    <span className="flex items-center gap-1.5 text-purple-900 dark:text-purple-200">
                                        HD Studio Quality (2.0× Token Multiplier)
                                    </span>
                                    <span className="font-mono text-purple-700 dark:text-purple-300">
                                        {
                                            calculateGenerationCost(
                                                form.image_model,
                                                'high',
                                            ).usd
                                        }{' '}
                                        (
                                        {
                                            calculateGenerationCost(
                                                form.image_model,
                                                'high',
                                            ).php
                                        }
                                        )
                                    </span>
                                </div>
                                <p className="text-[11px] leading-relaxed text-purple-900/80 dark:text-purple-200/90">
                                    High Quality mode activates enhanced rendering passes, high-DPI texture sharpness, and studio lighting synthesis. This utilizes <strong>2× standard quota</strong> against your $10.00 custom budget limit.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-amber-950 dark:text-amber-100">
                                <div className="flex items-center justify-between font-bold">
                                    <span className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
                                        Low Quality Draft (0.5× Token Multiplier)
                                    </span>
                                    <span className="font-mono text-amber-700 dark:text-amber-300">
                                        {
                                            calculateGenerationCost(
                                                form.image_model,
                                                'low',
                                            ).usd
                                        }{' '}
                                        (
                                        {
                                            calculateGenerationCost(
                                                form.image_model,
                                                'low',
                                            ).php
                                        }
                                        )
                                    </span>
                                </div>
                                <p className="text-[11px] leading-relaxed text-amber-900/80 dark:text-amber-200/90">
                                    Low Quality mode reduces render passes to minimize token cost (50% cheaper) and accelerate generation. Suitable for rapid concept drafts, though fine typography and intricate textures will be simplified.
                                </p>
                            </div>
                        )}

                        {/* Do not show again checkbox */}
                        <div className="flex items-start space-x-2.5 rounded-xl border border-border/80 bg-muted/30 p-3">
                            <Checkbox
                                id="dismiss-quality-warning"
                                checked={dontShowQualityWarningAgain}
                                onCheckedChange={(checked) =>
                                    setDontShowQualityWarningAgain(
                                        Boolean(checked),
                                    )
                                }
                                className="mt-0.5"
                            />
                            <label
                                htmlFor="dismiss-quality-warning"
                                className="cursor-pointer text-[11px] leading-snug font-medium text-muted-foreground select-none"
                            >
                                Don't show this quality confirmation again (remember my preference)
                            </label>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsQualityWarningOpen(false);
                                setPendingQuality(null);
                            }}
                            className="h-9 text-xs"
                        >
                            Keep Medium (Standard)
                        </Button>
                        <Button
                            type="button"
                            onClick={handleConfirmQualityChange}
                            className="h-9 gap-1.5 text-xs font-semibold"
                        >
                            Confirm & Switch Quality
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
