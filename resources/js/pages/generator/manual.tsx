import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    BadgePercent,
    Building2,
    Camera,
    Check,
    ChevronDown,
    Clapperboard,
    Compass,
    ImageIcon,
    Layers,
    Lightbulb,
    Loader2,
    Package,
    PenTool,
    RotateCcw,
    SlidersHorizontal,
    Type,
    Calendar,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { HelpTooltip } from '@/components/help-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { downloadVisualAsFormat } from '@/lib/download';
import { useSetBreadcrumbs } from '@/context/breadcrumb-context';

import { BusinessNameSection } from './components/BusinessNameSection';
import { CreativeCanvas } from './components/CreativeCanvas';
import { ProductSelector } from './components/ProductSelector';
import { StepWizardNav, WizardStepItem } from './components/StepWizardNav';
import { StudioBriefSummary } from './components/StudioBriefSummary';
import { StudioHeader } from './components/StudioHeader';
import {
    CatalogBrowserModal,
    GeneratedCreativeModal,
} from './components/StudioModals';
import { SynthesisScreen } from './components/SynthesisScreen';
import {
    brandToneDescriptions,
    BusinessProfile,
    CampaignItem,
    contentStyleDescriptions,
    contentStyleOptions,
    CopyEmphasis,
    copyEmphasisOptions,
    CustomProductItem,
    DesignTreatment,
    designTreatmentOptions,
    deterministicShufflePresets,
    EventItem,
    GeneratedDesign,
    GenerationState,
    ImageQuality,
    ProductItem,
    renderStyleOptions,
    normalizeRenderStyle,
    normalizeCopyEmphasis,
    parseList,
    restoreProductsFromDraft,
    Step,
    TaglineMode,
    toneOptions,
    DesignSystemExport,
} from './components/types';

const RENDER_STYLE_ASSETS: Record<string, string> = {
    'Studio Product Still': '/images/render-styles/studioproductstill.jpg',
    'Cinematic Marketing': '/images/render-styles/cinematicmarketing.jpg',
    'Lifestyle Capture': '/images/render-styles/lifestylecapture.jpg',
    'Minimalist Graphic': '/images/render-styles/minimalistgraphic.jpg',
};

const ASPECT_RATIO_CONFIGS = [
    {
        value: '1:1',
        name: 'Square',
        label: '1:1 · Square',
        description: 'Instagram & Facebook Feed',
        dimensions: '1024 × 1024',
        previewClass: 'h-6 w-6',
        modalPreviewClass: 'h-11 w-11',
    },
    {
        value: '16:9',
        name: 'Landscape',
        label: '16:9 · Landscape',
        description: 'Facebook Cover & Banners',
        dimensions: '1792 × 1024',
        previewClass: 'h-3.5 w-7',
        modalPreviewClass: 'h-8 w-14',
    },
    {
        value: '9:16',
        name: 'Story / Reel',
        label: '9:16 · Story / Reel',
        description: 'Stories, Reels & TikTok',
        dimensions: '1024 × 1792',
        previewClass: 'h-7 w-3.5',
        modalPreviewClass: 'h-14 w-8',
    },
    {
        value: '4:5',
        name: 'Portrait',
        label: '4:5 · Portrait',
        description: 'Instagram Feed Portrait',
        dimensions: '1024 × 1792 (4:5)',
        previewClass: 'h-6.5 w-5',
        modalPreviewClass: 'h-13 w-10.5',
    },
    {
        value: '4:3',
        name: 'Standard',
        label: '4:3 · Standard',
        description: 'Display Ads & Editorial',
        dimensions: '1792 × 1024 (4:3)',
        previewClass: 'h-5.5 w-7',
        modalPreviewClass: 'h-10.5 w-14',
    },
];

interface ManualGeneratorProps {
    campaign?: CampaignItem | null;
    campaigns?: CampaignItem[];
    business?: BusinessProfile | null;
    products?: ProductItem[];
    events?: EventItem[];
    selectedEvent?: EventItem | null;
    budgetLimit?: number;
    totalSpent?: number;
    isQuotaExceeded?: boolean;
    initialProduct?: ProductItem | null;
    initialEvent?: EventItem | null;
    design_system?: Partial<DesignSystemExport>;
    recent_fingerprints?: Array<Record<string, any>>;
    initial_draft?: any;
    origin?: string;
}

export default function ManualGenerator({
    campaign = null,
    campaigns = [],
    business = null,
    products = [],
    selectedEvent = null,
    budgetLimit = 10,
    totalSpent = 0,
    isQuotaExceeded = false,
    initialProduct = null,
    design_system = undefined,
    recent_fingerprints = [],
    initial_draft = null,
    origin = undefined,
}: ManualGeneratorProps) {
    // -------------------------------------------------------------------------
    // INDEPENDENT MANUAL STATE
    // -------------------------------------------------------------------------
    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [selectedCatalogProducts, setSelectedCatalogProducts] = useState<
        ProductItem[]
    >(() => {
        if (initial_draft) {
            return restoreProductsFromDraft(initial_draft, products);
        }
        return initialProduct ? [initialProduct] : [];
    });
    const [customProducts, setCustomProducts] = useState<CustomProductItem[]>([]);
    const [productTab, setProductTab] = useState<'catalog' | 'custom'>('catalog');
    const [inlineProductSearch, setInlineProductSearch] = useState('');
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);

    // Step 2 state: Creative Direction & Styles
    const [scenePrompt, setScenePrompt] = useState('');
    const [renderStyle, setRenderStyle] = useState('Studio Product Still');
    const [contentStyle, setContentStyle] = useState<string[]>(['Commercial', 'Studio Lighting']);
    const [brandTone, setBrandTone] = useState<string[]>(['Professional', 'Bold']);
    const [designTreatment, setDesignTreatment] = useState<DesignTreatment>('Auto');
    const [copyEmphasis, setCopyEmphasis] = useState<CopyEmphasis>('Balanced');
    const [isCopyEmphasisModalOpen, setIsCopyEmphasisModalOpen] = useState(false);
    const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);
    const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
    const [recentSuggestions, setRecentSuggestions] = useState<string[]>([]);
    const [openPresetSections, setOpenPresetSections] = useState<Record<string, boolean>>({
        treatment: true,
        emphasis: true,
        render: false,
        themes: false,
        tone: false,
    });
    const togglePresetSection = (key: string) => {
        setOpenPresetSections((prev) => ({ ...prev, [key]: !prev[key] }));
    };
    const scenePromptTextareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustScenePromptHeight = useCallback(() => {
        const el = scenePromptTextareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.max(el.scrollHeight + 4, 110)}px`;
    }, []);

    useEffect(() => {
        adjustScenePromptHeight();
    }, [scenePrompt, adjustScenePromptHeight]);

    // Content & Copy Visibility state
    const [includeProductName, setIncludeProductName] = useState<boolean>(true);
    const [includeTagline, setIncludeTagline] = useState<boolean>(true);
    const [tagline, setTagline] = useState('');
    const [taglineMode, setTaglineMode] = useState<TaglineMode>('none');
    const [isGeneratingTagline, setIsGeneratingTagline] = useState(false);
    const [includePrices, setIncludePrices] = useState<boolean>(true);
    const [showEventText, setShowEventText] = useState<boolean>(() => Boolean(selectedEvent));

    useEffect(() => {
        if (selectedEvent) {
            setShowEventText(true);
        }
    }, [selectedEvent]);

    const [includeBusinessName, setIncludeBusinessName] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('ai_studio_include_business_name');
            return saved !== null ? saved === 'true' : true;
        }
        return true;
    });

    // Step 4 state: Format & Canvas
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [isAspectRatioModalOpen, setIsAspectRatioModalOpen] = useState(false);
    const imageModel = 'gpt-image-2';
    const [imageQuality, setImageQuality] = useState<ImageQuality>('medium');

    const currentRatioConfig = useMemo(
        () =>
            ASPECT_RATIO_CONFIGS.find((c) => c.value === aspectRatio) ||
            ASPECT_RATIO_CONFIGS[0],
        [aspectRatio],
    );

    // Generation Execution state
    const [generationState, setGenerationState] =
        useState<GenerationState>('idle');
    const [isManualGenerating, setIsManualGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [generationStage, setGenerationStage] = useState(0);
    const [savedDesign, setSavedDesign] = useState<GeneratedDesign | null>(null);
    const [isSavedToDesigns, setIsSavedToDesigns] = useState(false);
    const [isSavingDesign, setIsSavingDesign] = useState(false);
    const [isSavedAsDraft, setIsSavedAsDraft] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);

    // UI Viewports & Modals (Collapsed by default to eliminate duplication with active wizard)
    const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(true);
    const [isPreviewFullViewOpen, setIsPreviewFullViewOpen] = useState(false);
    const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

    // Restore draft state when opened
    useEffect(() => {
        if (!initial_draft) return;

        const meta = initial_draft.generation_metadata || {};
        const restoredProducts = restoreProductsFromDraft(initial_draft, products);
        setSelectedCatalogProducts(restoredProducts);

        const restoredPrompt =
            meta.scene_prompt ||
            meta.user_prompt ||
            (initial_draft.prompt?.startsWith('FINAL MARKETING DESIGN TASK')
                ? (initial_draft.prompt.match(/• PRIMARY USER SCENE DIRECTION:\s*(.+)$/m)?.[1]?.trim() || initial_draft.prompt)
                : initial_draft.prompt);
        if (restoredPrompt) setScenePrompt(restoredPrompt);

        if (typeof meta.include_tagline === 'boolean') {
            setIncludeTagline(meta.include_tagline);
        } else if (initial_draft.tagline) {
            setIncludeTagline(true);
        }
        if (initial_draft.tagline) {
            setTagline(initial_draft.tagline);
        }
        if (initial_draft.tagline_mode || meta.tagline_mode) {
            setTaglineMode(initial_draft.tagline_mode || meta.tagline_mode);
        }
        if (meta.render_style || initial_draft.render_style) {
            setRenderStyle(normalizeRenderStyle(meta.render_style || initial_draft.render_style));
        }

        const restoredThemes = parseList(
            meta.content_style || meta.visual_theme || initial_draft.visual_theme || initial_draft.content_style
        );
        if (restoredThemes.length > 0) {
            setContentStyle(restoredThemes);
        }

        const restoredTones = parseList(
            meta.brand_tone || initial_draft.brand_tone
        );
        if (restoredTones.length > 0) {
            setBrandTone(restoredTones);
        }

        if (meta.design_treatment) setDesignTreatment(meta.design_treatment);
        if (meta.copy_emphasis) setCopyEmphasis(normalizeCopyEmphasis(meta.copy_emphasis));
        if (meta.aspect_ratio || initial_draft.aspect_ratio) {
            setAspectRatio(meta.aspect_ratio || initial_draft.aspect_ratio);
        }
        if (typeof meta.include_product_name === 'boolean') {
            setIncludeProductName(meta.include_product_name);
        }
        if (typeof meta.show_event_text === 'boolean') {
            setShowEventText(meta.show_event_text);
        }
        if (typeof meta.include_prices === 'boolean') {
            setIncludePrices(meta.include_prices);
        }
        if (typeof meta.include_business_name === 'boolean') {
            setIncludeBusinessName(meta.include_business_name);
        }
        if (meta.quality || meta.image_quality) {
            setImageQuality(meta.quality || meta.image_quality);
        }

        if (Array.isArray(meta.custom_products) && meta.custom_products.length > 0) {
            setCustomProducts(meta.custom_products.map((cp: any, idx: number) => ({
                id: `cp_${idx}_${Date.now()}`,
                name: cp.name || '',
                price: cp.price || '',
                description: cp.description || '',
            })));
            if (restoredProducts.length === 0) {
                setProductTab('custom');
            }
        }

        const draftIsDraft = initial_draft.status === 'draft';
        setIsSavedAsDraft(draftIsDraft);
        setIsSavedToDesigns(!draftIsDraft);

        setSavedDesign({
            id: initial_draft.id,
            image_url: initial_draft.image_url,
            generated_image_path: initial_draft.generated_image_path,
            product_name: initial_draft.product_name,
            tagline: initial_draft.tagline || '',
            aspect_ratio: meta.aspect_ratio || initial_draft.aspect_ratio || '1:1',
            image_model: meta.model || 'gpt-image-2',
            prompt: initial_draft.prompt,
            generation_meta: meta,
            status: initial_draft.status,
        });

        setGenerationState('ready');

        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('open_modal') === '1' || params.get('view_creative') === '1' || params.get('view_modal') === '1') {
                setIsPreviewFullViewOpen(true);
            }
        }
    }, [initial_draft]);

    // Breadcrumbs Navigation (Campaigns -> {Campaign Name} -> Generator)
    const breadcrumbs = useMemo(() => {
        const generatorHref = campaign?.id
            ? `/generator/manual?campaign_id=${campaign.id}`
            : '/generator/manual';

        if (origin === 'designs') {
            return [
                { title: 'My Designs', href: '/designs' },
                ...(campaign?.id
                    ? [{ title: campaign.name || 'Campaign', href: `/campaigns/${campaign.id}` }]
                    : []),
                { title: 'Generator', href: generatorHref },
            ];
        }

        if (campaign?.id) {
            return [
                { title: 'Campaigns', href: '/campaigns' },
                { title: campaign.name || 'Campaign', href: `/campaigns/${campaign.id}` },
                { title: 'Generator', href: generatorHref },
            ];
        }

        return [
            { title: 'Campaigns', href: '/campaigns' },
            { title: 'Generator', href: generatorHref },
        ];
    }, [campaign?.id, campaign?.name, origin]);

    useSetBreadcrumbs(breadcrumbs);

    // -------------------------------------------------------------------------
    // DERIVED VALIDATIONS
    // -------------------------------------------------------------------------
    const uniqueSelectedCatalogProducts = useMemo(() => {
        const seen = new Set<string>();
        return selectedCatalogProducts.filter((p) => {
            const id = String(p.id);
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
        });
    }, [selectedCatalogProducts]);

    const totalSelectedCount =
        uniqueSelectedCatalogProducts.length +
        customProducts.filter((p) => p.name.trim().length > 0).length;

    const hasProductSelected = totalSelectedCount > 0;
    const stepOneValid = hasProductSelected && Boolean(campaign?.id);
    const stepTwoValid = scenePrompt.trim().length > 0;
    const canGenerateManual =
        stepOneValid &&
        stepTwoValid &&
        !isQuotaExceeded &&
        generationState !== 'generating';

    const effectiveProductName = useMemo(() => {
        if (uniqueSelectedCatalogProducts.length > 0) {
            return uniqueSelectedCatalogProducts[0].name;
        }
        const activeCustom = customProducts.find((p) => p.name.trim().length > 0);
        if (activeCustom) {
            return activeCustom.name;
        }
        return 'Marketing Visual';
    }, [uniqueSelectedCatalogProducts, customProducts]);

    const effectivePrice = useMemo(() => {
        if (uniqueSelectedCatalogProducts.length > 0) {
            return uniqueSelectedCatalogProducts[0].price
                ? String(uniqueSelectedCatalogProducts[0].price)
                : '';
        }
        const activeCustom = customProducts.find((p) => p.name.trim().length > 0);
        return activeCustom?.price || '';
    }, [uniqueSelectedCatalogProducts, customProducts]);

    // -------------------------------------------------------------------------
    // PRODUCT HANDLERS
    // -------------------------------------------------------------------------
    const handleToggleCatalogProduct = (product: ProductItem) => {
        setSelectedCatalogProducts((prev) => {
            const exists = prev.some((p) => String(p.id) === String(product.id));
            if (exists) {
                return prev.filter((p) => String(p.id) !== String(product.id));
            }
            return [...prev, product];
        });
    };

    const handleAddCustomProduct = () => {
        if (customProducts.length >= 5) {
            toast.error('Maximum of 5 custom items allowed.');
            return;
        }
        setCustomProducts((prev) => [
            ...prev,
            { id: `custom_${Date.now()}`, name: '', price: '' },
        ]);
        setProductTab('custom');
    };

    const handleUpdateCustomProduct = (
        id: string,
        field: 'name' | 'price',
        value: string,
    ) => {
        setCustomProducts((prev) =>
            prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
        );
    };

    const handleRemoveCustomProduct = (id: string) => {
        setCustomProducts((prev) => prev.filter((item) => item.id !== id));
    };

    const handleClearAllProducts = () => {
        setSelectedCatalogProducts([]);
        setCustomProducts([]);
    };

    // -------------------------------------------------------------------------
    // STYLE & PROMPT HANDLERS
    // -------------------------------------------------------------------------
    const handleSuggestTagline = async () => {
        if (isGeneratingTagline) return;
        if (!campaign?.id) {
            toast.error('A Campaign is required before generating an AI tagline.');
            return;
        }

        setIsGeneratingTagline(true);
        try {
            const catalogIds = uniqueSelectedCatalogProducts.map((p) => p.id);
            const customItems = customProducts
                .filter((p) => p.name.trim())
                .map((p) => ({ name: p.name, price: p.price || null }));

            const response = await fetch('/generator/manual/suggest-tagline', {
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
                    campaign_id: campaign.id,
                    catalog_product_ids: catalogIds,
                    custom_products: customItems,
                    product_name: effectiveProductName,
                    render_style: renderStyle,
                    visual_theme: contentStyle,
                    brand_tone: brandTone,
                    user_instruction: scenePrompt.trim() ? scenePrompt.trim().slice(0, 500) : undefined,
                }),
            });

            const data = await response.json();
            if (response.ok && data.success && data.tagline) {
                setTagline(data.tagline);
                setTaglineMode('ai');
                toast.success('AI Tagline generated!');
            } else {
                toast.error(data.message || 'Failed to suggest tagline.');
            }
        } catch {
            toast.error('Network error suggesting tagline.');
        } finally {
            setIsGeneratingTagline(false);
        }
    };

    const handleGenerateVisualPrompt = async () => {
        if (isGeneratingPrompt) return;
        if (!campaign?.id) {
            toast.error('A Campaign is required before generating a visual prompt.');
            return;
        }

        setIsGeneratingPrompt(true);
        try {
            const catalogIds = uniqueSelectedCatalogProducts.map((p) => p.id);
            const customItems = customProducts
                .filter((p) => p.name.trim())
                .map((p) => ({ name: p.name, price: p.price || null }));

            const response = await fetch('/generator/prompt', {
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
                    campaign_id: campaign.id,
                    generation_mode: 'manual',
                    target: 'prompt',
                    catalog_product_ids: catalogIds,
                    custom_products: customItems,
                    event_id: selectedEvent?.id,
                    show_event_text: showEventText,
                    user_instruction: scenePrompt.trim(),
                    render_style: renderStyle,
                    design_treatment: designTreatment,
                    copy_emphasis: copyEmphasis,
                    visual_theme: contentStyle,
                    brand_tone: brandTone,
                    aspect_ratio: aspectRatio,
                    include_business_name: includeBusinessName,
                    include_product_name: includeProductName,
                    include_prices: includePrices,
                    include_tagline: includeTagline,
                    tagline: tagline.trim(),
                    previous_concepts: recentSuggestions,
                }),
            });

            const data = await response.json();
            if (response.ok && data.success && data.visual_prompt) {
                setScenePrompt(data.visual_prompt);
                if (data.render_style) {
                    setRenderStyle(normalizeRenderStyle(data.render_style));
                }
                setRecentSuggestions((prev) => [
                    data.visual_prompt,
                    ...prev.filter((p) => p !== data.visual_prompt).slice(0, 4),
                ]);
                if (data.tagline && !tagline.trim()) {
                    setTagline(data.tagline);
                    setTaglineMode('ai');
                }
                toast.success('Visual scene prompt composed!');
            } else {
                toast.error(data.message || 'Failed to compose visual prompt.');
            }
        } catch {
            toast.error('Network error composing visual prompt.');
        } finally {
            setIsGeneratingPrompt(false);
        }
    };

    const applyDynamicSuggestions = () => {
        const shuffled = deterministicShufflePresets(
            {
                renderStyle,
                designTreatment,
                copyEmphasis,
                aspectRatio,
                brandTone,
                contentStyle,
            },
            design_system,
            recent_fingerprints
        );

        setRenderStyle(shuffled.renderStyle);
        setDesignTreatment(shuffled.designTreatment);
        setCopyEmphasis(shuffled.copyEmphasis);
        setAspectRatio(shuffled.aspectRatio);
        setBrandTone(shuffled.brandTone);
        setContentStyle(shuffled.contentStyle);

        toast.success('Applied creative direction presets!');
    };

    const handleClearPresets = () => {
        setDesignTreatment('Auto');
        setCopyEmphasis('Balanced');
        setRenderStyle('Studio Product Still');
        setContentStyle([]);
        setBrandTone([]);
        toast.success('Creative direction presets cleared.');
    };

    // -------------------------------------------------------------------------
    // GENERATION EXECUTION (POST /generator/manual)
    // -------------------------------------------------------------------------
    const handleGenerateManual = async (options?: { is_variation?: boolean }) => {
        if (isManualGenerating || generationState === 'generating') return;
        if (isQuotaExceeded) {
            toast.error('You have reached your AI budget quota limit.');
            return;
        }
        if (!campaign?.id) {
            toast.error('A Campaign is required before generating a manual marketing visual.');
            return;
        }
        if (!hasProductSelected) {
            toast.error('Please select or add at least one product or service.');
            return;
        }
        if (!scenePrompt.trim()) {
            toast.error('Please describe or generate a visual scene prompt in Step 2.');
            return;
        }

        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }

        setIsManualGenerating(true);
        setGenerationState('generating');
        setGenerationProgress(15);
        setGenerationStage(0);

        const progressTimer = window.setInterval(() => {
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
            formData.append('product_name', effectiveProductName);
            formData.append('image_prompt', scenePrompt);
            formData.append('prompt', scenePrompt);
            formData.append('scene_prompt', scenePrompt);

            formData.append('include_product_name', includeProductName ? '1' : '0');
            formData.append('include_prices', includePrices ? '1' : '0');

            if (includePrices && effectivePrice) {
                formData.append('price', effectivePrice.replace(/[^0-9.]/g, ''));
            }
            if (selectedEvent?.id) {
                formData.append('event_id', String(selectedEvent.id));
            }
            formData.append('show_event_text', showEventText ? '1' : '0');
            uniqueSelectedCatalogProducts.forEach((p) => {
                formData.append('catalog_product_ids[]', String(p.id));
            });
            customProducts
                .filter((p) => p.name.trim())
                .forEach((p, idx) => {
                    formData.append(`custom_products[${idx}][name]`, p.name);
                    if (p.price) {
                        formData.append(`custom_products[${idx}][price]`, p.price);
                    }
                });
            if (uniqueSelectedCatalogProducts[0]?.id) {
                formData.append(
                    'product_id',
                    String(uniqueSelectedCatalogProducts[0].id),
                );
            }
            if (campaign?.id) {
                formData.append('campaign_id', String(campaign.id));
            }
            formData.append('aspect_ratio', aspectRatio || '1:1');
            formData.append('image_model', 'gpt-image-2');
            formData.append('image_quality', imageQuality || 'medium');
            formData.append('design_treatment', designTreatment);
            formData.append('copy_emphasis', copyEmphasis);

            if (options?.is_variation) {
                formData.append('is_variation', '1');
                if (savedDesign?.id) {
                    formData.append('source_design_id', String(savedDesign.id));
                }
            }

            const effectiveTagline = options?.is_variation
                ? (savedDesign?.tagline || tagline).trim()
                : tagline.trim();
            const effectiveTaglineMode = includeTagline
                ? (effectiveTagline ? (taglineMode !== 'none' ? taglineMode : 'manual') : 'ai')
                : 'none';

            formData.append('include_tagline', includeTagline ? '1' : '0');
            formData.append('tagline_mode', effectiveTaglineMode);
            if (includeTagline && effectiveTagline) {
                formData.append('tagline', effectiveTagline);
            }
            formData.append('include_business_name', includeBusinessName ? '1' : '0');
            if (includeBusinessName && business?.name) {
                formData.append('business_name', business.name);
            }
            formData.append('render_style', renderStyle || 'Studio Product Still');
            contentStyle.forEach((style) =>
                formData.append('content_style[]', style),
            );
            brandTone.forEach((tone) => formData.append('brand_tone[]', tone));

            const response = await fetch('/generator/manual', {
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
                setGenerationState('error');
                toast.error(errorMsg);
                return;
            }

            const preview = data.preview;
            const productionPrompt = preview.prompt || preview.visual_prompt || data.prompt || data.visual_prompt || '';
            const returnedTagline = includeTagline ? (preview.tagline || data.tagline || effectiveTagline || '') : '';
            if (includeTagline && returnedTagline) {
                setTagline(returnedTagline);
            }
            setSavedDesign({
                id: null,
                image_url: preview.image_url,
                generated_image_path: preview.generated_image_path,
                product_name: preview.product_name || effectiveProductName,
                tagline: returnedTagline,
                aspect_ratio: preview.aspect_ratio || aspectRatio,
                image_model: preview.image_model || 'gpt-image-2',
                prompt: productionPrompt,
                generation_meta: preview.generation_meta,
            });

            setIsSavedToDesigns(false);
            setSaveErrorMessage(null);
            setGenerationState('ready');
            setIsPreviewFullViewOpen(true);
            toast.success(options?.is_variation ? 'Variation Generated!' : 'Visual Creative Generated!');
        } catch {
            window.clearInterval(progressTimer);
            setGenerationState('error');
            toast.error('Network error during visual generation.');
        } finally {
            setIsManualGenerating(false);
        }
    };

    // -------------------------------------------------------------------------
    // SAVE AS DRAFT, FINALIZE DESIGN & DOWNLOAD
    // -------------------------------------------------------------------------
    const handleSaveAsDraft = async () => {
        if (isSavedAsDraft && savedDesign?.id) {
            toast.info('Creative is already saved as a draft.');
            return;
        }

        setIsSavingDraft(true);
        setSaveErrorMessage(null);
        try {
            const formData = new FormData();
            formData.append('status', 'draft');
            if (savedDesign?.id) {
                formData.append('design_id', String(savedDesign.id));
            }
            formData.append('product_name', effectiveProductName);
            const exactPrompt = savedDesign?.prompt || savedDesign?.generation_meta?.prompt || scenePrompt;
            formData.append('prompt', exactPrompt);
            formData.append('image_prompt', exactPrompt);
            formData.append('scene_prompt', scenePrompt);

            if (savedDesign?.generated_image_path) {
                formData.append(
                    'generated_image_path',
                    savedDesign.generated_image_path,
                );
            }
            if (effectivePrice && includePrices) {
                formData.append('price', effectivePrice.replace(/[^0-9.]/g, ''));
            }
            if (selectedEvent?.id) {
                formData.append('event_id', String(selectedEvent.id));
            }
            formData.append('show_event_text', showEventText ? '1' : '0');
            if (uniqueSelectedCatalogProducts[0]?.id) {
                formData.append(
                    'product_id',
                    String(uniqueSelectedCatalogProducts[0].id),
                );
            }
            uniqueSelectedCatalogProducts.forEach((p) => {
                formData.append('catalog_product_ids[]', String(p.id));
            });
            customProducts.forEach((cp, idx) => {
                formData.append(`custom_products[${idx}][name]`, cp.name);
                if (cp.price) formData.append(`custom_products[${idx}][price]`, cp.price);
                if (cp.description) formData.append(`custom_products[${idx}][description]`, cp.description);
            });
            formData.append('include_product_name', includeProductName ? '1' : '0');
            formData.append('include_prices', includePrices ? '1' : '0');
            if (campaign?.id) {
                formData.append('campaign_id', String(campaign.id));
            }
            formData.append('aspect_ratio', aspectRatio);
            formData.append('image_model', 'gpt-image-2');
            formData.append('image_quality', imageQuality);
            formData.append('design_treatment', designTreatment);
            formData.append('copy_emphasis', copyEmphasis);
            formData.append('include_tagline', includeTagline ? '1' : '0');
            formData.append('tagline_mode', includeTagline ? (tagline.trim() ? taglineMode : 'ai') : 'none');
            if (includeTagline && tagline.trim()) {
                formData.append('tagline', tagline.trim());
            }
            formData.append('include_business_name', includeBusinessName ? '1' : '0');
            if (includeBusinessName && business?.name) {
                formData.append('business_name', business.name);
            }
            formData.append('render_style', renderStyle);
            contentStyle.forEach((style) =>
                formData.append('content_style[]', style),
            );
            brandTone.forEach((tone) => formData.append('brand_tone[]', tone));
            formData.append('generation_mode', 'manual');
            if (savedDesign?.generation_meta) {
                formData.append('generation_metadata', JSON.stringify(savedDesign.generation_meta));
            }

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

            const data = await response.json();
            if (response.ok && data.success) {
                setIsSavedAsDraft(true);
                setIsSavedToDesigns(false);
                setSaveErrorMessage(null);
                if (data.design) {
                    setSavedDesign((prev) => (prev ? { ...prev, id: data.design.id, status: 'draft' } : prev));
                    if (typeof window !== 'undefined' && data.design.id) {
                        const url = new URL(window.location.href);
                        url.searchParams.set('draft_id', String(data.design.id));
                        window.history.replaceState({}, '', url.toString());
                    }
                }
                toast.success(data.message || 'Draft saved');
            } else {
                const errorMsg = data.errors
                    ? Object.values(data.errors).flat().join('\n')
                    : (data.message || 'Failed to save draft.');
                setSaveErrorMessage(errorMsg);
                toast.error(errorMsg);
            }
        } catch {
            const netErr = 'Network error saving draft. Please check your connection and try again.';
            setSaveErrorMessage(netErr);
            toast.error(netErr);
        } finally {
            setIsSavingDraft(false);
        }
    };

    const handleSaveToDesigns = async () => {
        if (isSavedToDesigns && savedDesign?.id && savedDesign?.status !== 'draft') {
            toast.info('Design is already saved in My Designs.');
            return;
        }

        setIsSavingDesign(true);
        setSaveErrorMessage(null);
        try {
            const formData = new FormData();
            formData.append('status', 'final');
            if (savedDesign?.id) {
                formData.append('design_id', String(savedDesign.id));
            }
            formData.append('product_name', effectiveProductName);
            const exactPrompt = savedDesign?.prompt || savedDesign?.generation_meta?.prompt || scenePrompt;
            formData.append('prompt', exactPrompt);
            formData.append('image_prompt', exactPrompt);
            formData.append('scene_prompt', scenePrompt);

            if (savedDesign?.generated_image_path) {
                formData.append(
                    'generated_image_path',
                    savedDesign.generated_image_path,
                );
            }
            if (effectivePrice && includePrices) {
                formData.append('price', effectivePrice.replace(/[^0-9.]/g, ''));
            }
            if (selectedEvent?.id) {
                formData.append('event_id', String(selectedEvent.id));
            }
            formData.append('show_event_text', showEventText ? '1' : '0');
            if (uniqueSelectedCatalogProducts[0]?.id) {
                formData.append(
                    'product_id',
                    String(uniqueSelectedCatalogProducts[0].id),
                );
            }
            uniqueSelectedCatalogProducts.forEach((p) => {
                formData.append('catalog_product_ids[]', String(p.id));
            });
            customProducts.forEach((cp, idx) => {
                formData.append(`custom_products[${idx}][name]`, cp.name);
                if (cp.price) formData.append(`custom_products[${idx}][price]`, cp.price);
                if (cp.description) formData.append(`custom_products[${idx}][description]`, cp.description);
            });
            formData.append('include_prices', includePrices ? '1' : '0');
            if (campaign?.id) {
                formData.append('campaign_id', String(campaign.id));
            }
            formData.append('aspect_ratio', aspectRatio);
            formData.append('image_model', 'gpt-image-2');
            formData.append('image_quality', imageQuality);
            formData.append('design_treatment', designTreatment);
            formData.append('copy_emphasis', copyEmphasis);
            formData.append('include_tagline', includeTagline ? '1' : '0');
            formData.append('tagline_mode', includeTagline ? (tagline.trim() ? taglineMode : 'ai') : 'none');
            if (includeTagline && tagline.trim()) {
                formData.append('tagline', tagline.trim());
            }
            formData.append('include_business_name', includeBusinessName ? '1' : '0');
            if (includeBusinessName && business?.name) {
                formData.append('business_name', business.name);
            }
            formData.append('render_style', renderStyle);
            contentStyle.forEach((style) =>
                formData.append('content_style[]', style),
            );
            brandTone.forEach((tone) => formData.append('brand_tone[]', tone));
            formData.append('generation_mode', 'manual');
            if (savedDesign?.generation_meta) {
                formData.append('generation_metadata', JSON.stringify(savedDesign.generation_meta));
            }

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

            const data = await response.json();
            if (response.ok && data.success) {
                setIsSavedToDesigns(true);
                setIsSavedAsDraft(false);
                setSaveErrorMessage(null);
                if (data.design) {
                    setSavedDesign((prev) => (prev ? { ...prev, id: data.design.id, status: 'final' } : prev));
                    if (typeof window !== 'undefined' && data.design.id) {
                        const url = new URL(window.location.href);
                        url.searchParams.set('draft_id', String(data.design.id));
                        window.history.replaceState({}, '', url.toString());
                    }
                }
                toast.success(data.message || 'Saved to My Designs!');
            } else {
                const errorMsg = data.errors
                    ? Object.values(data.errors).flat().join('\n')
                    : (data.message || 'Failed to save design.');
                setSaveErrorMessage(errorMsg);
                toast.error(errorMsg);
            }
        } catch {
            const netErr = 'Network error saving design. Please check your connection and try again.';
            setSaveErrorMessage(netErr);
            toast.error(netErr);
        } finally {
            setIsSavingDesign(false);
        }
    };

    const handleDownload = (format: 'png' | 'jpeg' = 'png') => {
        if (!savedDesign?.image_url) return;
        const nameToUse = savedDesign.product_name || effectiveProductName || 'marketing-visual';
        downloadVisualAsFormat(
            savedDesign.image_url,
            nameToUse,
            format,
        );
    };

    // Stepper navigation structure (Streamlined 3-Step Studio)
    const steps: WizardStepItem[] = [
        {
            step: 1,
            title: 'Products',
            subtitle: 'Catalog & Offerings',
            icon: Package,
            isCompleted: hasProductSelected,
            isAccessible: true,
        },
        {
            step: 2,
            title: 'Creative Direction',
            subtitle: 'Scene & Style',
            icon: Compass,
            isCompleted: Boolean(stepTwoValid),
            isAccessible: hasProductSelected,
        },
        {
            step: 3,
            title: 'Format & Canvas',
            subtitle: 'Aspect Ratio & Review',
            icon: SlidersHorizontal,
            isCompleted: Boolean(aspectRatio && canGenerateManual),
            isAccessible: hasProductSelected && stepTwoValid,
        },
    ];

    const currentStatusMessage = [
        'Setting up Studio Camera & Lighting Staging...',
        'Synthesizing Selected Render Styles & Tone...',
        'Rendering Photorealistic Visual Composition...',
        'Polishing Highlights, Contrast & Detail Resolution...',
    ][generationStage] || 'Rendering your creative...';

    return (
        <>
            <Head title="Manual Generation — AI Marketing Studio" />

            <div
                className={`flex w-full min-w-0 max-w-full bg-background text-foreground ${generationState === 'generating'
                    ? 'h-[calc(100vh-2.75rem)] overflow-hidden sm:h-[calc(100vh-3rem)]'
                    : 'min-h-[calc(100vh-2.75rem)] sm:min-h-[calc(100vh-3rem)]'
                    }`}
            >
                {/* MAIN STUDIO WORKSPACE */}
                <div
                    className={`min-w-0 flex-1 ${generationState === 'generating'
                        ? 'flex h-full max-h-full flex-col items-center justify-center overflow-hidden p-2 sm:p-4'
                        : 'space-y-3.5 p-3 sm:p-4 lg:p-5'
                        }`}
                >
                    {/* Header */}
                    {generationState !== 'ready' && (
                        <StudioHeader
                            activeMode="manual"
                            activeCampaign={campaign}
                            campaigns={campaigns}
                            generationState={generationState}
                        />
                    )}

                    {/* GENERATION STATE SWITCHING */}
                    {generationState === 'generating' ? (
                        <SynthesisScreen
                            business={business}
                            activeIndustry={business?.industry || 'Commercial'}
                            productName={effectiveProductName}
                            renderStyle={renderStyle}
                            activeCampaign={campaign}
                            selectedEvent={selectedEvent}
                            currentStatusMessage={currentStatusMessage}
                            generationProgress={generationProgress}
                            onResetToIdle={() => setGenerationState('idle')}
                        />
                    ) : generationState === 'error' ? (
                        <SynthesisScreen
                            isError
                            currentStatusMessage="Failed to complete visual generation"
                            generationProgress={0}
                            onResetToIdle={() => setGenerationState('idle')}
                        />
                    ) : generationState === 'ready' ? (
                        <CreativeCanvas
                            productName={effectiveProductName}
                            tagline={includeTagline ? tagline : ''}
                            price={includePrices ? effectivePrice : ''}
                            imageModel={imageModel}
                            imageQuality={imageQuality}
                            aspectRatio={aspectRatio}
                            savedDesign={savedDesign}
                            isSavedToDesigns={isSavedToDesigns}
                            isSavingDesign={isSavingDesign}
                            onSaveToDesigns={handleSaveToDesigns}
                            isSavedAsDraft={isSavedAsDraft}
                            isSavingDraft={isSavingDraft}
                            onSaveAsDraft={handleSaveAsDraft}
                            onDownload={handleDownload}
                            onOpenFullscreen={() => setIsPreviewFullViewOpen(true)}
                            onViewGeneratedCreative={() => setIsPreviewFullViewOpen(true)}
                            designId={savedDesign?.id}
                            origin={origin}
                            campaignId={campaign?.id}
                            campaignName={campaign?.name}
                            onEditParameters={() => setGenerationState('idle')}
                            onRegenerate={() => handleGenerateManual({ is_variation: true })}
                            designTreatment={designTreatment}
                            copyEmphasis={copyEmphasis}
                            hasReferenceImage={uniqueSelectedCatalogProducts.length > 0}
                            mode="manual"
                            eventName={selectedEvent?.name}
                            showEventText={showEventText}
                            catalogProducts={uniqueSelectedCatalogProducts}
                            customProducts={customProducts}
                            scenePrompt={scenePrompt}
                            renderStyle={renderStyle}
                            visualTheme={savedDesign?.generation_meta?.visual_theme}
                            brandTone={brandTone}
                            includeProductName={includeProductName}
                            includePrices={includePrices}
                            includeBusinessName={includeBusinessName}
                            businessName={business?.name}
                            includeTagline={includeTagline}
                        />
                    ) : (
                        /* STEPPED CREATION FORM */
                        <div className="space-y-3">
                            <StepWizardNav
                                currentStep={currentStep}
                                steps={steps}
                                onSelectStep={setCurrentStep}
                            />

                            {/* Quota Banner */}
                            {isQuotaExceeded && (
                                <div className="mb-3 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive shadow-xs">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-xs font-bold text-destructive">
                                                AI Budget Quota Limit Reached (${budgetLimit.toFixed(2)} Limit)
                                            </p>
                                            <Badge
                                                variant="outline"
                                                className="border-destructive/40 bg-destructive/20 font-mono text-[10px] font-bold text-destructive"
                                            >
                                                ${totalSpent.toFixed(2)} / ${budgetLimit.toFixed(2)}
                                            </Badge>
                                        </div>
                                        <p className="text-[11px] leading-relaxed text-destructive/90">
                                            You have hit your <strong>${budgetLimit.toFixed(2)} total quota limit</strong>.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Main Card */}
                            <Card className="overflow-hidden rounded-card border-border bg-card shadow-sm gap-0 py-0">
                                <CardHeader className="border-b bg-muted/10 px-4 py-2.5 sm:px-5">
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h2 className="text-sm font-bold text-foreground">
                                                {currentStep === 1
                                                    ? 'Products'
                                                    : currentStep === 2
                                                        ? 'Creative Direction'
                                                        : 'Format & Canvas'}
                                            </h2>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                {currentStep === 1
                                                    ? 'Select catalog products or custom offerings for your marketing visual.'
                                                    : currentStep === 2
                                                        ? 'Describe your desired scene, choose a canonical render style, and set copy emphasis.'
                                                        : 'Choose canvas aspect ratio, customize headline if desired, and generate final image.'}
                                            </p>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-3 sm:p-4">
                                    {/* STEP 1: PRODUCTS & CAMPAIGN */}
                                    {currentStep === 1 && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between pb-1">
                                                <div className="flex items-center gap-1.5">
                                                    <Package className="h-4 w-4 text-primary" />
                                                    <Label className="text-xs font-bold text-foreground">Featured Products & Offerings</Label>
                                                </div>
                                            </div>

                                            <ProductSelector
                                                products={products}
                                                selectedCatalogProducts={uniqueSelectedCatalogProducts}
                                                onToggleCatalogProduct={handleToggleCatalogProduct}
                                                customProducts={customProducts}
                                                onAddCustomProduct={handleAddCustomProduct}
                                                onUpdateCustomProduct={handleUpdateCustomProduct}
                                                onRemoveCustomProduct={handleRemoveCustomProduct}
                                                productTab={productTab}
                                                onSelectTab={setProductTab}
                                                inlineProductSearch={inlineProductSearch}
                                                onSearchChange={setInlineProductSearch}
                                                onOpenBrowseModal={() => setIsProductModalOpen(true)}
                                                onClearAllSelections={handleClearAllProducts}
                                            />
                                        </div>
                                    )}

                                    {/* STEP 2: CREATIVE DIRECTION */}
                                    {currentStep === 2 && (
                                        <div className="animate-in space-y-4 duration-200 fade-in">
                                            {/* Creative Direction Scene Prompt */}
                                            <div className="space-y-2 rounded-xl border border-border/80 bg-card/60 p-3.5 shadow-xs">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <Compass className="h-4 w-4 text-primary" />
                                                        <div>
                                                            <Label
                                                                htmlFor="manual_creative_direction"
                                                                className="text-xs font-bold text-foreground"
                                                            >
                                                                Creative Direction
                                                            </Label>
                                                            <p className="text-[10px] text-muted-foreground">
                                                                Describe the visual scene, lighting, environment, and atmosphere.
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={isGeneratingPrompt}
                                                        onClick={handleGenerateVisualPrompt}
                                                        className="relative h-7.5 gap-1.5 rounded-lg border-primary/40 bg-primary/10 px-2.5 text-xs font-bold text-primary shadow-xs ring-1 ring-primary/30 transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground active:scale-95 disabled:opacity-50 cursor-pointer"
                                                    >
                                                        <Lightbulb
                                                            className={`h-3.5 w-3.5 ${
                                                                isGeneratingPrompt
                                                                    ? 'animate-spin'
                                                                    : ''
                                                            }`}
                                                        />
                                                        {isGeneratingPrompt
                                                            ? 'Suggesting...'
                                                            : 'Suggest Visual Prompt'}
                                                    </Button>
                                                </div>

                                                <Textarea
                                                    id="manual_creative_direction"
                                                    ref={scenePromptTextareaRef}
                                                    value={scenePrompt}
                                                    onChange={(e) => setScenePrompt(e.target.value)}
                                                    placeholder="Describe what you want in your visual scene (e.g. Premium coffee advertisement with warm morning sunlight and an elegant café atmosphere)..."
                                                    rows={3}
                                                    className="w-full resize-y text-xs leading-relaxed transition-all focus-visible:ring-primary/30 rounded-xl border-border/80 bg-background/80 p-2.5 min-h-[72px]"
                                                />

                                                {scenePrompt.trim() && (
                                                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                                                        <span className="flex items-center gap-1 font-medium text-foreground">
                                                            <Check className="h-3 w-3 text-emerald-500" /> Visual scene direction is ready.
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setScenePrompt('')}
                                                            className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-destructive cursor-pointer"
                                                        >
                                                            Clear
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* 1. Render Style — Visual Image Grid (Directly visible on main page) */}
                                            <div className="space-y-3 rounded-xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Camera className="h-4 w-4 text-primary" />
                                                        <div>
                                                            <h3 className="text-xs font-bold text-foreground">
                                                                Render Style
                                                            </h3>
                                                            <p className="text-[10px] text-muted-foreground">
                                                                High-level commercial production aesthetic for your visual.
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="font-mono text-[10px] font-medium text-muted-foreground">
                                                        {renderStyle}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                                                    {renderStyleOptions.map((opt) => {
                                                        const isSelected = renderStyle === opt.value;
                                                        const imageUrl = RENDER_STYLE_ASSETS[opt.value];
                                                        return (
                                                            <button
                                                                key={opt.value}
                                                                type="button"
                                                                onClick={() => setRenderStyle(opt.value)}
                                                                className={`group relative flex flex-col rounded-xl border text-left transition-all duration-200 cursor-pointer select-none overflow-hidden ${
                                                                    isSelected
                                                                        ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.06] shadow-xs ring-1 ring-emerald-500/30'
                                                                        : 'border-border/80 bg-card hover:border-border hover:bg-muted/30 hover:shadow-xs'
                                                                }`}
                                                            >
                                                                <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/40 border-b border-border/50">
                                                                    {imageUrl ? (
                                                                        <img
                                                                            src={imageUrl}
                                                                            alt={opt.label}
                                                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                                            loading="lazy"
                                                                        />
                                                                    ) : (
                                                                        <div className="flex h-full w-full items-center justify-center">
                                                                            <Camera className="h-6 w-6 text-muted-foreground/40" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col flex-1 p-3">
                                                                    <span
                                                                        className={`text-xs font-semibold tracking-tight ${
                                                                            isSelected
                                                                                ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                                                                                : 'text-foreground'
                                                                        }`}
                                                                    >
                                                                        {opt.label}
                                                                    </span>
                                                                    <p className="mt-1 text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                                                                        {opt.description}
                                                                    </p>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* 2 & 3. Compact Creative Configuration Entry Cards */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                                {/* Compact Copy Emphasis Entry Card */}
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCopyEmphasisModalOpen(true)}
                                                    className="group relative flex items-center justify-between gap-3.5 rounded-xl border border-border/80 bg-card/60 p-3.5 text-left transition-all duration-200 hover:border-border hover:bg-muted/30 hover:shadow-xs cursor-pointer select-none"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/30 dark:bg-muted/10">
                                                            <Type className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                                Copy Emphasis
                                                            </div>
                                                            <div className="mt-0.5 text-xs font-bold text-foreground truncate">
                                                                {copyEmphasis === 'Balanced'
                                                                    ? 'Balanced Harmony'
                                                                    : copyEmphasis === 'Product'
                                                                      ? 'Product-focused'
                                                                      : copyEmphasis === 'Price'
                                                                        ? 'Price-focused'
                                                                        : 'Tagline-focused'}
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground truncate">
                                                                {copyEmphasis === 'Balanced'
                                                                    ? 'Equal visual harmony'
                                                                    : copyEmphasis === 'Product'
                                                                      ? 'Product form commanding focus'
                                                                      : copyEmphasis === 'Price'
                                                                        ? 'Catalog price prominence'
                                                                        : 'Campaign tagline hierarchy'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-center h-8 w-8 rounded-lg border border-border/60 bg-background/60 text-muted-foreground transition-all duration-200 group-hover:border-foreground/30 group-hover:text-foreground shrink-0">
                                                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                                                    </div>
                                                </button>

                                                {/* Compact Copy & Event Visibility Entry Card */}
                                                <button
                                                    type="button"
                                                    onClick={() => setIsVisibilityModalOpen(true)}
                                                    className="group relative flex items-center justify-between gap-3.5 rounded-xl border border-border/80 bg-card/60 p-3.5 text-left transition-all duration-200 hover:border-border hover:bg-muted/30 hover:shadow-xs cursor-pointer select-none"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/30 dark:bg-muted/10">
                                                            <SlidersHorizontal className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                                Copy & Event Visibility
                                                            </div>
                                                            <div className="mt-0.5 text-xs font-bold text-foreground truncate">
                                                                {[
                                                                    includeProductName,
                                                                    includePrices,
                                                                    includeTagline,
                                                                    includeBusinessName,
                                                                    showEventText,
                                                                ].filter(Boolean).length}{' '}
                                                                elements selected
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground truncate">
                                                                Configure catalog text & event visibility
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-center h-8 w-8 rounded-lg border border-border/60 bg-background/60 text-muted-foreground transition-all duration-200 group-hover:border-foreground/30 group-hover:text-foreground shrink-0">
                                                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                                                    </div>
                                                </button>
                                            </div>

                                            {/* Dedicated Copy Emphasis Selection Modal */}
                                            <Dialog
                                                open={isCopyEmphasisModalOpen}
                                                onOpenChange={setIsCopyEmphasisModalOpen}
                                            >
                                                <DialogContent className="max-h-[90vh] overflow-y-auto rounded-card sm:max-w-3xl p-0">
                                                    <DialogHeader className="border-b bg-muted/20 p-5 pb-4">
                                                        <div className="flex items-center gap-2">
                                                            <Type className="h-4 w-4 text-primary" />
                                                            <DialogTitle className="text-base font-bold text-foreground">
                                                                Copy Emphasis
                                                            </DialogTitle>
                                                        </div>
                                                        <DialogDescription className="text-xs text-muted-foreground">
                                                            Choose how the marketing copy should be emphasized in your visual composition.
                                                        </DialogDescription>
                                                    </DialogHeader>

                                                    <div className="p-5">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                                                            {copyEmphasisOptions.map((opt) => {
                                                                const isSelected = copyEmphasis === opt.value;
                                                                return (
                                                                    <button
                                                                        key={opt.value}
                                                                        type="button"
                                                                        onClick={() => setCopyEmphasis(opt.value)}
                                                                        className={`group relative flex flex-col rounded-xl border text-left transition-all duration-200 cursor-pointer select-none overflow-hidden ${
                                                                            isSelected
                                                                                ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.06] shadow-xs ring-1 ring-emerald-500/30'
                                                                                : 'border-border/80 bg-card hover:border-border hover:bg-muted/30 hover:shadow-xs'
                                                                        }`}
                                                                    >
                                                                        {/* Typographic Preview Container */}
                                                                        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/30 dark:bg-muted/10 p-2.5 flex flex-col justify-between border-b border-border/50 select-none">
                                                                            {opt.value === 'Balanced' && (
                                                                                <>
                                                                                    <div className="flex items-center justify-between text-[8px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
                                                                                        <span>Headline</span>
                                                                                        <span className="font-mono">$49.00</span>
                                                                                    </div>
                                                                                    <div className="my-auto py-1">
                                                                                        <div className="h-1.5 w-16 rounded bg-foreground/60 mb-1" />
                                                                                        <div className="h-1 w-24 rounded bg-muted-foreground/30" />
                                                                                    </div>
                                                                                    <div className="flex items-center gap-1.5 pt-1 border-t border-border/30">
                                                                                        <div className="h-3 w-6 rounded bg-muted-foreground/20 shrink-0" />
                                                                                        <div className="h-1 w-12 rounded bg-muted-foreground/25" />
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                            {opt.value === 'Product' && (
                                                                                <>
                                                                                    <div className="text-[8px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
                                                                                        Product Hero
                                                                                    </div>
                                                                                    <div className="my-auto flex items-center justify-center py-0.5">
                                                                                        <div className="flex h-10 w-16 items-center justify-center rounded-lg border border-border/70 bg-background/80 shadow-xs">
                                                                                            <Package className="h-5 w-5 text-foreground/70" />
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex justify-center">
                                                                                        <div className="h-1 w-12 rounded bg-muted-foreground/30" />
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                            {opt.value === 'Price' && (
                                                                                <>
                                                                                    <div className="text-[8px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
                                                                                        Price Prominence
                                                                                    </div>
                                                                                    <div className="my-auto py-0.5">
                                                                                        <div className="font-mono text-base font-bold tracking-tight text-foreground leading-none">
                                                                                            $129.00
                                                                                        </div>
                                                                                        <span className="mt-1 inline-block text-[8px] font-semibold text-muted-foreground">
                                                                                            Special Offer
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="h-1 w-16 rounded bg-muted-foreground/25" />
                                                                                </>
                                                                            )}
                                                                            {opt.value === 'Tagline' && (
                                                                                <>
                                                                                    <div className="text-[8px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
                                                                                        Tagline Hierarchy
                                                                                    </div>
                                                                                    <div className="my-auto py-0.5">
                                                                                        <div className="text-[11px] font-extrabold uppercase leading-tight tracking-tight text-foreground line-clamp-2">
                                                                                            Bold Vision.
                                                                                        </div>
                                                                                        <div className="mt-0.5 text-[9px] text-muted-foreground line-clamp-1">
                                                                                            Campaign Voice
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="h-1 w-10 rounded bg-muted-foreground/25" />
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex flex-col flex-1 p-3">
                                                                            <span
                                                                                className={`text-xs font-semibold tracking-tight ${
                                                                                    isSelected
                                                                                        ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                                                                                        : 'text-foreground'
                                                                                }`}
                                                                            >
                                                                                {opt.label}
                                                                            </span>
                                                                            <p className="mt-1 text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                                                                                {opt.description}
                                                                            </p>
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    <DialogFooter className="flex items-center justify-between border-t bg-muted/10 p-3 px-5 sm:justify-between">
                                                        <span className="font-mono text-[11px] text-muted-foreground">
                                                            Active: <strong className="text-foreground">{copyEmphasis}</strong>
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={() => setIsCopyEmphasisModalOpen(false)}
                                                            className="h-8 rounded-lg px-4 text-xs font-semibold cursor-pointer"
                                                        >
                                                            Done
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>

                                            {/* Dedicated Copy & Event Visibility Selection Modal */}
                                            <Dialog
                                                open={isVisibilityModalOpen}
                                                onOpenChange={setIsVisibilityModalOpen}
                                            >
                                                <DialogContent className="max-h-[90vh] overflow-y-auto rounded-card sm:max-w-2xl p-0">
                                                    <DialogHeader className="border-b bg-muted/20 p-5 pb-4">
                                                        <div className="flex items-center gap-2">
                                                            <SlidersHorizontal className="h-4 w-4 text-primary" />
                                                            <DialogTitle className="text-base font-bold text-foreground">
                                                                Copy & Event Visibility
                                                            </DialogTitle>
                                                        </div>
                                                        <DialogDescription className="text-xs text-muted-foreground">
                                                            Choose which elements can appear in the creative.
                                                        </DialogDescription>
                                                    </DialogHeader>

                                                    <div className="p-5">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                                                            {[
                                                                {
                                                                    id: 'product_name',
                                                                    label: 'Product Name',
                                                                    description: 'Render product name typography.',
                                                                    active: includeProductName,
                                                                    toggle: () => setIncludeProductName(!includeProductName),
                                                                    icon: Package,
                                                                    previewText: 'Product Hero',
                                                                },
                                                                {
                                                                    id: 'price',
                                                                    label: 'Price',
                                                                    description: 'Render exact catalog pricing.',
                                                                    active: includePrices,
                                                                    toggle: () => setIncludePrices(!includePrices),
                                                                    icon: BadgePercent,
                                                                    previewText: '$99.00',
                                                                },
                                                                {
                                                                    id: 'tagline',
                                                                    label: 'Tagline',
                                                                    description: 'Render headline / campaign tagline.',
                                                                    active: includeTagline,
                                                                    toggle: () => setIncludeTagline(!includeTagline),
                                                                    icon: PenTool,
                                                                    previewText: 'Tagline',
                                                                },
                                                                {
                                                                    id: 'business_name',
                                                                    label: 'Business Name',
                                                                    description: 'Render registered brand/shop name.',
                                                                    active: includeBusinessName,
                                                                    toggle: () => {
                                                                        const nextVal = !includeBusinessName;
                                                                        setIncludeBusinessName(nextVal);
                                                                        if (typeof window !== 'undefined') {
                                                                            localStorage.setItem(
                                                                                'ai_studio_include_business_name',
                                                                                String(nextVal),
                                                                            );
                                                                        }
                                                                    },
                                                                    icon: Building2,
                                                                    previewText: 'Brand Name',
                                                                },
                                                                {
                                                                    id: 'event_text',
                                                                    label: 'Event Text',
                                                                    description: 'Render holiday / event name text.',
                                                                    active: showEventText,
                                                                    toggle: () => setShowEventText(!showEventText),
                                                                    icon: Calendar,
                                                                    previewText: 'Event Text',
                                                                },
                                                            ].map((item) => {
                                                                const IconComponent = item.icon;
                                                                return (
                                                                    <button
                                                                        key={item.id}
                                                                        type="button"
                                                                        role="switch"
                                                                        aria-checked={item.active}
                                                                        onClick={item.toggle}
                                                                        className={`group relative flex flex-col rounded-xl border text-left transition-all duration-200 cursor-pointer select-none overflow-hidden ${
                                                                            item.active
                                                                                ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.06] shadow-xs ring-1 ring-emerald-500/30'
                                                                                : 'border-border/80 bg-card hover:border-border hover:bg-muted/30 hover:shadow-xs opacity-75 hover:opacity-100'
                                                                        }`}
                                                                    >
                                                                        {/* Visual Preview Bar */}
                                                                        <div className="relative h-14 w-full overflow-hidden bg-muted/30 dark:bg-muted/10 p-2 flex items-center justify-center border-b border-border/50 select-none">
                                                                            <div
                                                                                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-medium transition-colors ${
                                                                                    item.active
                                                                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                                                                        : 'border-border/60 bg-background/80 text-muted-foreground'
                                                                                }`}
                                                                            >
                                                                                <IconComponent className="h-3.5 w-3.5 shrink-0" />
                                                                                <span className="truncate">{item.previewText}</span>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex flex-col flex-1 p-3">
                                                                            <div className="flex items-center justify-between gap-1">
                                                                                <span
                                                                                    className={`text-xs font-semibold tracking-tight truncate ${
                                                                                        item.active
                                                                                            ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                                                                                            : 'text-foreground'
                                                                                    }`}
                                                                                >
                                                                                    {item.label}
                                                                                </span>
                                                                                <span
                                                                                    className={`text-[9px] font-mono shrink-0 ${
                                                                                        item.active
                                                                                            ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                                                                            : 'text-muted-foreground'
                                                                                    }`}
                                                                                >
                                                                                    {item.active ? 'Visible' : 'Off'}
                                                                                </span>
                                                                            </div>
                                                                            <p className="mt-1 text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                                                                                {item.description}
                                                                            </p>
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    <DialogFooter className="flex items-center justify-between border-t bg-muted/10 p-3 px-5 sm:justify-between">
                                                        <span className="font-mono text-[11px] text-muted-foreground">
                                                            {[
                                                                includeProductName,
                                                                includePrices,
                                                                includeTagline,
                                                                includeBusinessName,
                                                                showEventText,
                                                            ].filter(Boolean).length}{' '}
                                                            elements active
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={() => setIsVisibilityModalOpen(false)}
                                                            className="h-8 rounded-lg px-4 text-xs font-semibold cursor-pointer"
                                                        >
                                                            Done
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    )}

                                    {/* STEP 3: FORMAT & CANVAS */}
                                    {currentStep === 3 && (
                                        <div className="animate-in space-y-4 duration-200 fade-in">
                                            {/* Compact Canvas & Aspect Ratio Entry Card */}
                                            <button
                                                type="button"
                                                onClick={() => setIsAspectRatioModalOpen(true)}
                                                className="group relative flex w-full items-center justify-between gap-3.5 rounded-xl border border-border/80 bg-card/60 p-3.5 text-left transition-all duration-200 hover:border-border hover:bg-muted/30 hover:shadow-xs cursor-pointer select-none"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/30 dark:bg-muted/10">
                                                        <div
                                                            className={`rounded-xs border border-primary/70 bg-primary/20 transition-all ${currentRatioConfig.previewClass}`}
                                                        />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                            Canvas & Aspect Ratio
                                                        </div>
                                                        <div className="mt-0.5 text-xs font-bold text-foreground truncate">
                                                            {currentRatioConfig.label}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground truncate">
                                                            {currentRatioConfig.description} · {currentRatioConfig.dimensions}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-center h-8 w-8 rounded-lg border border-border/60 bg-background/60 text-muted-foreground transition-all duration-200 group-hover:border-foreground/30 group-hover:text-foreground shrink-0">
                                                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                                                </div>
                                            </button>

                                            {/* Dedicated Canvas & Aspect Ratio Selection Modal */}
                                            <Dialog
                                                open={isAspectRatioModalOpen}
                                                onOpenChange={setIsAspectRatioModalOpen}
                                            >
                                                <DialogContent className="max-h-[90vh] overflow-y-auto rounded-card sm:max-w-3xl p-0">
                                                    <DialogHeader className="border-b bg-muted/20 p-5 pb-4">
                                                        <div className="flex items-center gap-2">
                                                            <Layers className="h-4 w-4 text-primary" />
                                                            <DialogTitle className="text-base font-bold text-foreground">
                                                                Canvas & Aspect Ratio
                                                            </DialogTitle>
                                                        </div>
                                                        <DialogDescription className="text-xs text-muted-foreground">
                                                            Choose the canvas shape for your marketing creative.
                                                        </DialogDescription>
                                                    </DialogHeader>

                                                    <div className="p-5">
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                                                            {ASPECT_RATIO_CONFIGS.map((opt) => {
                                                                const isSelected = aspectRatio === opt.value;
                                                                return (
                                                                    <button
                                                                        key={opt.value}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setAspectRatio(opt.value);
                                                                            setIsAspectRatioModalOpen(false);
                                                                        }}
                                                                        className={`group relative flex flex-col rounded-xl border text-left transition-all duration-200 cursor-pointer select-none overflow-hidden ${
                                                                            isSelected
                                                                                ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.06] shadow-xs ring-1 ring-emerald-500/30'
                                                                                : 'border-border/80 bg-card hover:border-border hover:bg-muted/30 hover:shadow-xs'
                                                                        }`}
                                                                    >
                                                                        {/* Proportional Canvas Shape Preview */}
                                                                        <div className="relative h-24 w-full overflow-hidden bg-muted/30 dark:bg-muted/10 p-2 flex items-center justify-center border-b border-border/50 select-none">
                                                                            <div
                                                                                className={`rounded-sm border-2 transition-all ${
                                                                                    isSelected
                                                                                        ? 'border-emerald-600 bg-emerald-500/20 shadow-xs dark:border-emerald-400'
                                                                                        : 'border-muted-foreground/40 bg-muted/40 group-hover:border-foreground/40'
                                                                                } ${opt.modalPreviewClass}`}
                                                                            />
                                                                        </div>

                                                                        {/* Option Details */}
                                                                        <div className="flex flex-col flex-1 p-3">
                                                                            <div className="flex items-center justify-between gap-1">
                                                                                <span
                                                                                    className={`font-mono text-xs font-bold tracking-tight ${
                                                                                        isSelected
                                                                                            ? 'text-emerald-700 dark:text-emerald-400'
                                                                                            : 'text-foreground'
                                                                                    }`}
                                                                                >
                                                                                    {opt.value}
                                                                                </span>
                                                                                <span className="text-[10px] font-semibold text-muted-foreground">
                                                                                    {opt.name}
                                                                                </span>
                                                                            </div>
                                                                            <p className="mt-1 text-[10px] text-muted-foreground line-clamp-1 leading-relaxed">
                                                                                {opt.description}
                                                                            </p>
                                                                            <span className="mt-1.5 font-mono text-[9px] text-muted-foreground/80">
                                                                                {opt.dimensions}
                                                                            </span>
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    <DialogFooter className="flex items-center justify-between border-t bg-muted/10 p-3 px-5 sm:justify-between">
                                                        <span className="font-mono text-[11px] text-muted-foreground">
                                                            Active:{' '}
                                                            <strong className="text-foreground">
                                                                {currentRatioConfig.label} ({currentRatioConfig.dimensions})
                                                            </strong>
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={() => setIsAspectRatioModalOpen(false)}
                                                            className="h-8 rounded-lg px-4 text-xs font-semibold cursor-pointer"
                                                        >
                                                            Done
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>

                                            {/* Optional Tagline / Headline */}
                                            <div className="space-y-2.5 rounded-xl border border-border/80 bg-card/60 p-3.5 shadow-xs">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <PenTool className="h-4 w-4 text-primary" />
                                                        <div>
                                                            <Label htmlFor="manual_tagline" className="text-xs font-bold text-foreground">
                                                                Marketing Headline / Tagline (Optional)
                                                            </Label>
                                                            <p className="text-[10px] text-muted-foreground">
                                                                Specify custom headline copy or leave empty for automatic contextual hook.
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={isGeneratingTagline || !includeTagline}
                                                        onClick={handleSuggestTagline}
                                                        className="relative h-7 gap-1.5 rounded-lg border-primary/40 bg-primary/10 px-2.5 text-xs font-bold text-primary shadow-xs ring-1 ring-primary/30 transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground active:scale-95 disabled:opacity-50 cursor-pointer"
                                                    >
                                                        <Lightbulb
                                                            className={`h-3 w-3 ${
                                                                isGeneratingTagline ? 'animate-spin' : ''
                                                            }`}
                                                        />
                                                        {isGeneratingTagline ? 'Suggesting...' : 'Suggest Tagline'}
                                                    </Button>
                                                </div>

                                                <div className="relative">
                                                    <Input
                                                        id="manual_tagline"
                                                        value={tagline}
                                                        disabled={!includeTagline}
                                                        onChange={(e) => {
                                                            setTagline(e.target.value);
                                                            setTaglineMode('manual');
                                                        }}
                                                        placeholder={includeTagline ? 'Enter custom tagline or click Suggest Tagline...' : 'Tagline is disabled in Copy & Event Visibility'}
                                                        className="h-9 pr-8 text-xs font-medium text-foreground disabled:opacity-50"
                                                    />
                                                    {tagline && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setTagline('');
                                                                setTaglineMode('none');
                                                            }}
                                                            className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                                                            title="Clear tagline"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Linked Campaign / Event Note if applicable */}
                                            {selectedEvent && (
                                                <div className="flex items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-foreground">
                                                    <Calendar className="h-4 w-4 text-primary shrink-0" />
                                                    <div className="flex-1">
                                                        <p className="font-bold text-[11px]">
                                                            Linked Event: {selectedEvent.name}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            Atmospheric event lighting and seasonal styling will be naturally integrated into the background.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* FOOTER CONTROLS */}
                                    <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setCurrentStep((prev) =>
                                                    Math.max(1, prev - 1) as Step,
                                                )
                                            }
                                            disabled={currentStep === 1}
                                            className="gap-2 text-xs font-semibold shadow-none cursor-pointer"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            Back
                                        </Button>

                                        {currentStep < 3 ? (
                                            <Button
                                                type="button"
                                                onClick={() =>
                                                    setCurrentStep((prev) =>
                                                        Math.min(3, prev + 1) as Step,
                                                    )
                                                }
                                                disabled={
                                                    currentStep === 1
                                                        ? !hasProductSelected
                                                        : !stepTwoValid
                                                }
                                                className="gap-2 text-xs font-semibold shadow-sm cursor-pointer"
                                            >
                                                Continue
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <Button
                                                type="button"
                                                size="lg"
                                                onClick={() => handleGenerateManual()}
                                                disabled={!canGenerateManual || isManualGenerating}
                                                className={`min-w-[240px] gap-2 text-xs font-bold shadow-md cursor-pointer ${
                                                    isQuotaExceeded
                                                        ? 'border border-destructive/30 bg-destructive/15 text-destructive hover:bg-destructive/20'
                                                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                                                }`}
                                            >
                                                {isQuotaExceeded ? (
                                                    <>
                                                        <AlertTriangle className="h-4 w-4" />
                                                        Quota Limit Reached (${budgetLimit.toFixed(2)})
                                                    </>
                                                ) : isManualGenerating ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Rendering Visual Creative...
                                                    </>
                                                ) : (
                                                    <>
                                                        <ImageIcon className="h-4 w-4" />
                                                        Generate Marketing Image
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

                {/* DOCKED RIGHT SIDEBAR: BRIEF SUMMARY */}
                {generationState === 'idle' && (
                    <StudioBriefSummary
                        isCollapsed={isSummaryCollapsed}
                        onToggleCollapse={setIsSummaryCollapsed}
                        aspectRatio={aspectRatio}
                        totalSelectedCount={totalSelectedCount}
                        selectedCatalogProducts={uniqueSelectedCatalogProducts}
                        customProducts={customProducts}
                        price={effectivePrice}
                        tagline={includeTagline ? tagline : undefined}
                        hasImageReference={uniqueSelectedCatalogProducts.length > 0}
                        activeCampaign={campaign}
                        business={business}
                        selectedEvent={selectedEvent}
                        renderStyle={renderStyle}
                        contentStyle={contentStyle}
                        brandTone={brandTone}
                        designTreatment={designTreatment}
                        copyEmphasis={copyEmphasis}
                        scenePrompt={scenePrompt}
                        imageModel={imageModel}
                        imageQuality={imageQuality}
                        includeBusinessName={includeBusinessName}
                        isAutomaticMode={false}
                        includePrices={includePrices}
                        includeProductName={includeProductName}
                        includeTagline={includeTagline}
                        showEventText={showEventText}
                    />
                )}
            </div>

            {/* MODALS */}
            <CatalogBrowserModal
                isOpen={isProductModalOpen}
                onOpenChange={setIsProductModalOpen}
                products={products}
                selectedProducts={uniqueSelectedCatalogProducts}
                onToggleProduct={handleToggleCatalogProduct}
            />

            <GeneratedCreativeModal
                isOpen={isPreviewFullViewOpen}
                onClose={() => setIsPreviewFullViewOpen(false)}
                mode="manual"
                productName={effectiveProductName}
                aspectRatio={aspectRatio}
                campaignName={campaign?.name}
                eventName={selectedEvent?.name}
                savedDesign={savedDesign}
                isSavedToDesigns={isSavedToDesigns}
                isSavingDesign={isSavingDesign}
                onSaveToDesigns={handleSaveToDesigns}
                isSavedAsDraft={isSavedAsDraft}
                isSavingDraft={isSavingDraft}
                onSaveAsDraft={handleSaveAsDraft}
                onDownload={handleDownload}
                onRegenerate={() => {
                    setIsPreviewFullViewOpen(false);
                    handleGenerateManual({ is_variation: true });
                }}
                onEditCreative={() => {
                    setIsPreviewFullViewOpen(false);
                    setGenerationState('idle');
                }}
                saveError={saveErrorMessage}
                catalogProducts={uniqueSelectedCatalogProducts}
                customProducts={customProducts}
                creativeConcept={savedDesign?.generation_meta?.creative_concept}
                visualStrategy={savedDesign?.generation_meta?.visual_strategy}
                designTreatment={designTreatment}
                copyEmphasis={copyEmphasis}
                renderStyle={renderStyle}
                visualTheme={contentStyle}
                brandTone={brandTone}
                composition={savedDesign?.generation_meta?.composition_type}
                cameraViewpoint={savedDesign?.generation_meta?.camera_viewpoint}
                lightingProfile={savedDesign?.generation_meta?.lighting_profile}
                businessName={business?.name}
                includeBusinessName={includeBusinessName}
                tagline={tagline}
                taglineMode={taglineMode}
                includeTagline={includeTagline}
                price={effectivePrice}
                includePrices={includePrices}
                imageModel={imageModel}
                hasReferenceImage={uniqueSelectedCatalogProducts.length > 0}
                creativeFingerprint={savedDesign?.generation_meta?.creative_fingerprint}
                origin={origin}
            />
        </>
    );
}
