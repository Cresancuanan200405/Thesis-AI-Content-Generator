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
    Loader2,
    Package,
    PenTool,
    RotateCcw,
    SlidersHorizontal,
    Sparkles,
    Calendar,
    Wand2,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { HelpTooltip } from '@/components/help-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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

import { AspectRatioSelector } from './components/AspectRatioSelector';
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
    Step,
    TaglineMode,
    toneOptions,
    DesignSystemExport,
} from './components/types';

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
    >(initialProduct ? [initialProduct] : []);
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

    // Step 3 state: Marketing Copy
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
    const imageModel = 'gpt-image-2';
    const [imageQuality, setImageQuality] = useState<ImageQuality>('medium');

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
        if (initial_draft.prompt) setScenePrompt(initial_draft.prompt);
        if (initial_draft.tagline) {
            setTagline(initial_draft.tagline);
            setIncludeTagline(true);
        }
        if (initial_draft.tagline_mode) setTaglineMode(initial_draft.tagline_mode);
        if (meta.render_style) setRenderStyle(meta.render_style);
        if (Array.isArray(meta.content_style)) setContentStyle(meta.content_style);
        if (Array.isArray(meta.brand_tone)) setBrandTone(meta.brand_tone);
        if (meta.design_treatment) setDesignTreatment(meta.design_treatment);
        if (meta.copy_emphasis) setCopyEmphasis(meta.copy_emphasis);
        if (meta.aspect_ratio || initial_draft.aspect_ratio) {
            setAspectRatio(meta.aspect_ratio || initial_draft.aspect_ratio);
        }
        if (typeof meta.show_event_text === 'boolean') {
            setShowEventText(meta.show_event_text);
        }

        if (Array.isArray(meta.custom_products) && meta.custom_products.length > 0) {
            setCustomProducts(meta.custom_products.map((cp: any, idx: number) => ({
                id: `cp_${idx}_${Date.now()}`,
                name: cp.name || '',
                price: cp.price || '',
                description: cp.description || '',
            })));
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

    // Breadcrumbs Navigation (Campaigns / Designs -> Generator -> Image Modal)
    const breadcrumbs = useMemo(() => {
        const generatorHref = campaign?.id
            ? `/generator/manual?campaign_id=${campaign.id}`
            : '/generator/manual';

        const rootCrumb = origin === 'designs'
            ? { title: 'My Designs', href: '/designs' }
            : { title: 'Campaigns', href: '/campaigns' };

        if (generationState === 'ready') {
            return [
                rootCrumb,
                { title: 'Generator', href: generatorHref },
                { title: 'Image Modal', href: '#' },
            ];
        }

        return [
            rootCrumb,
            { title: 'Generator', href: generatorHref },
        ];
    }, [campaign?.id, generationState, origin]);

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
                    include_prices: includePrices,
                    include_tagline: includeTagline,
                    tagline: tagline.trim(),
                    previous_concepts: recentSuggestions,
                }),
            });

            const data = await response.json();
            if (response.ok && data.success && data.visual_prompt) {
                setScenePrompt(data.visual_prompt);
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

    // Stepper navigation structure (Strict 4-Step User Creative Director)
    const steps: WizardStepItem[] = [
        {
            step: 1,
            title: 'Products & Campaign',
            subtitle: 'Catalog & Context',
            icon: Package,
            isCompleted: hasProductSelected,
            isAccessible: true,
        },
        {
            step: 2,
            title: 'Creative Direction',
            subtitle: 'Scene & Styling',
            icon: Sparkles,
            isCompleted: Boolean(stepTwoValid),
            isAccessible: hasProductSelected,
        },
        {
            step: 3,
            title: 'Marketing Copy',
            subtitle: 'Tagline & Identity',
            icon: PenTool,
            isCompleted: Boolean(!includeTagline || tagline.trim().length > 0),
            isAccessible: hasProductSelected && stepTwoValid,
        },
        {
            step: 4,
            title: 'Format & Generate',
            subtitle: 'Canvas & Review',
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
                className={`flex w-full min-w-0 max-w-full overflow-x-clip bg-background text-foreground ${generationState === 'generating'
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
                            <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-sm gap-0 py-0">
                                <CardHeader className="border-b bg-muted/10 px-4 py-2.5 sm:px-5">
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h2 className="text-sm font-bold text-foreground">
                                                {currentStep === 1
                                                    ? 'Products & Campaign'
                                                    : currentStep === 2
                                                        ? 'Creative Direction'
                                                        : currentStep === 3
                                                            ? 'Marketing Copy'
                                                            : 'Format & Generate'}
                                            </h2>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                {currentStep === 1
                                                    ? 'Select catalog products or custom offerings and review campaign context.'
                                                    : currentStep === 2
                                                        ? 'Describe visual scene, choose art direction presets, design treatment, and copy emphasis.'
                                                        : currentStep === 3
                                                            ? 'Configure marketing copy, AI tagline generation, and pricing visibility.'
                                                            : 'Choose canvas aspect ratio, review creative brief summary, and generate final image.'}
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
                                            {/* Visual Scene Prompt Card */}
                                            <div className="space-y-2 rounded-xl border border-border/80 bg-card/60 p-3 shadow-xs">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <Label className="text-xs font-bold text-foreground">
                                                            Visual Scene Prompt
                                                        </Label>
                                                        <HelpTooltip text="Detailed scene prompt describing the visual setting, composition, lighting, and mood. Required for manual generation." />
                                                        {scenePrompt.trim() ? (
                                                            <span className="flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                                <Check className="h-2.5 w-2.5 stroke-[3]" />
                                                                Ready
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 rounded border border-red-500/40 bg-red-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-red-600 dark:text-red-400">
                                                                Required
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={isGeneratingPrompt}
                                                            onClick={handleGenerateVisualPrompt}
                                                            className="relative h-7.5 gap-1.5 rounded-lg border-primary/40 bg-primary/10 px-2.5 text-xs font-bold text-primary shadow-xs ring-1 ring-primary/30 transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground disabled:pointer-events-none disabled:opacity-60 active:scale-95"
                                                        >
                                                            {isGeneratingPrompt ? (
                                                                <>
                                                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                                                                    <span>Generating...</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                                                                    <span>
                                                                        {scenePrompt.trim()
                                                                            ? 'Suggest Different Angle'
                                                                            : 'Suggest Visual Prompt'}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>

                                                <Textarea
                                                    ref={scenePromptTextareaRef}
                                                    value={scenePrompt}
                                                    onChange={(e) => setScenePrompt(e.target.value)}
                                                    placeholder="Describe scene staging, festive props, lighting, or backdrop (or click Suggest Visual Prompt to have AI compose one)..."
                                                    className="w-full resize-y text-xs leading-relaxed transition-all focus-visible:ring-primary/30 rounded-xl border-border/80 bg-background/80 p-2.5 min-h-[72px]"
                                                    style={{
                                                        fieldSizing: 'content',
                                                    }}
                                                />

                                                {scenePrompt.trim() ? (
                                                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                                        <span className="flex items-center gap-1 font-medium text-foreground">
                                                            <Check className="h-3 w-3 text-primary" /> Custom visual prompt is ready to guide image rendering.
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setScenePrompt('')}
                                                            className="text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
                                                        >
                                                            Clear Prompt
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <p className="text-[11px] text-muted-foreground">

                                                    </p>
                                                )}
                                            </div>

                                            {/* Smart Style Suggestions Banner with Deterministic Shuffle */}
                                            <div className="flex flex-col gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                        <Wand2 className="h-3.5 w-3.5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-foreground">
                                                            Creative Direction Presets
                                                        </p>
                                                        <p className="text-[11px] text-muted-foreground">
                                                            Instantly randomize compatible design treatments, copy emphases, and styles locally.
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={handleClearPresets}
                                                        className="relative h-7 gap-1.5 self-start rounded-lg border-border/80 bg-background px-2.5 text-xs font-semibold text-muted-foreground transition-all duration-200 hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive active:scale-95 sm:self-auto cursor-pointer"
                                                        title="Reset all creative direction presets to defaults"
                                                    >
                                                        <RotateCcw className="h-3 w-3" />
                                                        Clear Presets
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={applyDynamicSuggestions}
                                                        className="relative h-7 gap-1.5 self-start rounded-lg border-primary/40 bg-primary/10 px-2.5 text-xs font-bold text-primary shadow-xs ring-1 ring-primary/30 transition-all duration-200 hover:border-primary hover:bg-primary hover:text-primary-foreground active:scale-95 sm:self-auto cursor-pointer"
                                                    >
                                                        <Sparkles className="h-3 w-3 animate-pulse" />
                                                        Shuffle Presets
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* PRESETS ACCORDION: 5 DROPDOWN SECTIONS WITH FULL CARDS */}
                                            <div className="space-y-3">
                                                {/* 1. Design Treatment Section */}
                                                <div className="rounded-xl border border-border/80 bg-card/60 p-3 shadow-xs">
                                                    <button
                                                        type="button"
                                                        onClick={() => togglePresetSection('treatment')}
                                                        className="flex w-full items-center justify-between cursor-pointer select-none text-left"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <SlidersHorizontal className="h-4 w-4 shrink-0 text-primary" />
                                                            <span className="text-xs font-bold text-foreground">
                                                                Design Treatment
                                                            </span>
                                                            <HelpTooltip text="Controls the overall visual and typographic layout structure of the creative." />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                                <Check className="h-2.5 w-2.5 stroke-[3]" />
                                                                {designTreatment}
                                                            </span>
                                                            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${openPresetSections.treatment ? 'rotate-180' : ''}`} />
                                                        </div>
                                                    </button>

                                                    {openPresetSections.treatment && (
                                                        <div className="animate-in fade-in slide-in-from-top-1 duration-200 grid gap-2 sm:grid-cols-3 pt-3">
                                                            {designTreatmentOptions.map((opt) => {
                                                                const isSelected = designTreatment === opt.value;
                                                                return (
                                                                    <button
                                                                        key={opt.value}
                                                                        type="button"
                                                                        onClick={() => setDesignTreatment(opt.value)}
                                                                        className={`group relative flex flex-col justify-between rounded-xl border p-2.5 text-left transition-all cursor-pointer select-none ${
                                                                            isSelected
                                                                                ? 'border-emerald-500 bg-emerald-500/10 shadow-xs ring-1 ring-emerald-500/40'
                                                                                : 'border-border/80 bg-card hover:border-emerald-500/40 hover:bg-muted/30'
                                                                        }`}
                                                                    >
                                                                        <div className="space-y-1">
                                                                            <div className="flex items-center justify-between gap-1.5">
                                                                                <span className={`text-xs font-bold ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground group-hover:text-primary'}`}>
                                                                                    {opt.label}
                                                                                </span>
                                                                                <div className="flex items-center gap-1">
                                                                                    <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold ${opt.badgeColor}`}>
                                                                                        {opt.badge}
                                                                                    </span>
                                                                                    <HelpTooltip text={opt.description} />
                                                                                </div>
                                                                            </div>
                                                                            <p className="line-clamp-2 text-[10px] text-muted-foreground">
                                                                                {opt.description}
                                                                            </p>
                                                                        </div>
                                                                        {isSelected && (
                                                                            <div className="mt-2 flex items-center justify-end">
                                                                                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                                                                            </div>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 2. Copy Emphasis Section */}
                                                <div className="rounded-xl border border-border/80 bg-card/60 p-3 shadow-xs">
                                                    <button
                                                        type="button"
                                                        onClick={() => togglePresetSection('emphasis')}
                                                        className="flex w-full items-center justify-between cursor-pointer select-none text-left"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                                                            <span className="text-xs font-bold text-foreground">
                                                                Copy Emphasis
                                                            </span>
                                                            <HelpTooltip text="Determines dominant focus between product, campaign tagline, or promotional price." />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                                <Check className="h-2.5 w-2.5 stroke-[3]" />
                                                                {copyEmphasis}
                                                            </span>
                                                            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${openPresetSections.emphasis ? 'rotate-180' : ''}`} />
                                                        </div>
                                                    </button>

                                                    {openPresetSections.emphasis && (
                                                        <div className="animate-in fade-in slide-in-from-top-1 duration-200 grid gap-2 grid-cols-2 sm:grid-cols-4 pt-3">
                                                            {copyEmphasisOptions.map((opt) => {
                                                                const isSelected = copyEmphasis === opt.value;
                                                                return (
                                                                    <button
                                                                        key={opt.value}
                                                                        type="button"
                                                                        onClick={() => setCopyEmphasis(opt.value)}
                                                                        className={`rounded-xl border p-2 text-left transition-all cursor-pointer select-none ${
                                                                            isSelected
                                                                                ? 'border-emerald-500 bg-emerald-500/10 font-bold shadow-xs ring-1 ring-emerald-500/40'
                                                                                : 'border-border/80 bg-card hover:border-emerald-500/40 hover:bg-muted/30'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center justify-between gap-1">
                                                                            <span className={`text-xs font-semibold ${isSelected ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-foreground'}`}>{opt.label}</span>
                                                                            <div className="flex items-center gap-1">
                                                                                <HelpTooltip text={opt.description} />
                                                                                {isSelected && <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400 stroke-[3]" />}
                                                                            </div>
                                                                        </div>
                                                                        <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">
                                                                            {opt.description}
                                                                        </p>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 3. Render Style Section */}
                                                <div className="rounded-xl border border-border/80 bg-card/60 p-3 shadow-xs">
                                                    <button
                                                        type="button"
                                                        onClick={() => togglePresetSection('render')}
                                                        className="flex w-full items-center justify-between cursor-pointer select-none text-left"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Camera className="h-4 w-4 shrink-0 text-primary" />
                                                            <span className="text-xs font-bold text-foreground">
                                                                Render Style
                                                            </span>
                                                            <HelpTooltip text="Defines visual rendering mode, studio camera treatment, volumetric lighting, and scene fidelity." />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                                <Check className="h-2.5 w-2.5 stroke-[3]" />
                                                                {renderStyle}
                                                            </span>
                                                            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${openPresetSections.render ? 'rotate-180' : ''}`} />
                                                        </div>
                                                    </button>

                                                    {openPresetSections.render && (
                                                        <div className="animate-in fade-in slide-in-from-top-1 duration-200 grid gap-2 sm:grid-cols-2 pt-3">
                                                            {renderStyleOptions.map((opt) => {
                                                                const isSelected = renderStyle === opt.value;
                                                                const IconComponent =
                                                                    opt.value === 'Studio Product Still'
                                                                        ? Camera
                                                                        : opt.value === 'Cinematic Marketing'
                                                                            ? Clapperboard
                                                                            : opt.value === 'Lifestyle Capture'
                                                                                ? Compass
                                                                                : PenTool;
                                                                return (
                                                                    <button
                                                                        key={opt.value}
                                                                        type="button"
                                                                        onClick={() => setRenderStyle(opt.value)}
                                                                        className={`group relative flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition-all cursor-pointer select-none ${
                                                                            isSelected
                                                                                ? 'border-emerald-500 bg-emerald-500/10 shadow-xs ring-1 ring-emerald-500/40'
                                                                                : 'border-border/80 bg-card hover:border-emerald-500/40 hover:bg-muted/30'
                                                                        }`}
                                                                    >
                                                                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                                                                            isSelected ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'border-border bg-muted/60 text-muted-foreground'
                                                                        }`}>
                                                                            <IconComponent className="h-4 w-4" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center justify-between gap-1">
                                                                                <span className={`text-xs font-bold truncate ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>{opt.label}</span>
                                                                                <div className="flex items-center gap-1">
                                                                                    <span className="rounded border px-1 py-0.2 text-[9px] font-bold text-muted-foreground">{opt.badge}</span>
                                                                                    <HelpTooltip text={opt.tagline || opt.label} />
                                                                                </div>
                                                                            </div>
                                                                            <p className="text-[10px] text-muted-foreground line-clamp-1">{opt.tagline}</p>
                                                                        </div>
                                                                        {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3] shrink-0 mt-0.5" />}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 4. Visual Themes Section */}
                                                <div className="rounded-xl border border-border/80 bg-card/60 p-3 shadow-xs">
                                                    <button
                                                        type="button"
                                                        onClick={() => togglePresetSection('themes')}
                                                        className="flex w-full items-center justify-between cursor-pointer select-none text-left"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Wand2 className="h-4 w-4 shrink-0 text-primary" />
                                                            <span className="text-xs font-bold text-foreground">
                                                                Visual Themes
                                                            </span>
                                                            <HelpTooltip text="Art direction and photography aesthetics (up to 3 presets)." />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                                {contentStyle.length > 0 ? `${contentStyle.length} / 3 Selected` : 'None Selected'}
                                                            </span>
                                                            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${openPresetSections.themes ? 'rotate-180' : ''}`} />
                                                        </div>
                                                    </button>

                                                    {openPresetSections.themes && (
                                                        <div className="animate-in fade-in slide-in-from-top-1 duration-200 flex flex-wrap gap-1.5 pt-3">
                                                            {contentStyleOptions.map((style) => {
                                                                const active = contentStyle.includes(style);
                                                                const disabled = !active && contentStyle.length >= 3;
                                                                const desc = contentStyleDescriptions[style] || style;
                                                                return (
                                                                    <div key={style} className="inline-flex items-center">
                                                                        <button
                                                                            type="button"
                                                                            disabled={disabled}
                                                                            onClick={() => {
                                                                                if (active) {
                                                                                    setContentStyle(contentStyle.filter((s) => s !== style));
                                                                                } else if (contentStyle.length < 3) {
                                                                                    setContentStyle([...contentStyle, style]);
                                                                                }
                                                                            }}
                                                                            className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer select-none inline-flex items-center gap-1.5 ${
                                                                                active
                                                                                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-2xs ring-1 ring-emerald-500/30'
                                                                                    : 'border-border/80 bg-card text-muted-foreground hover:border-emerald-500/40 hover:text-foreground'
                                                                            } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                                                                            title={desc}
                                                                        >
                                                                            <span>{style}</span>
                                                                            {active && <Check className="h-3 w-3 stroke-[3]" />}
                                                                            <HelpTooltip text={desc} />
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 5. Brand Tone Section */}
                                                <div className="rounded-xl border border-border/80 bg-card/60 p-3 shadow-xs">
                                                    <button
                                                        type="button"
                                                        onClick={() => togglePresetSection('tone')}
                                                        className="flex w-full items-center justify-between cursor-pointer select-none text-left"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Package className="h-4 w-4 shrink-0 text-primary" />
                                                            <span className="text-xs font-bold text-foreground">
                                                                Brand Tone
                                                            </span>
                                                            <HelpTooltip text="Brand emotional vibe and atmosphere (up to 3 presets)." />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                                {brandTone.length > 0 ? `${brandTone.length} / 3 Selected` : 'None Selected'}
                                                            </span>
                                                            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${openPresetSections.tone ? 'rotate-180' : ''}`} />
                                                        </div>
                                                    </button>

                                                    {openPresetSections.tone && (
                                                        <div className="animate-in fade-in slide-in-from-top-1 duration-200 flex flex-wrap gap-1.5 pt-3">
                                                            {toneOptions.map((tone) => {
                                                                const active = brandTone.includes(tone);
                                                                const disabled = !active && brandTone.length >= 3;
                                                                const desc = brandToneDescriptions[tone] || tone;
                                                                return (
                                                                    <div key={tone} className="inline-flex items-center">
                                                                        <button
                                                                            type="button"
                                                                            disabled={disabled}
                                                                            onClick={() => {
                                                                                if (active) {
                                                                                    setBrandTone(brandTone.filter((t) => t !== tone));
                                                                                } else if (brandTone.length < 3) {
                                                                                    setBrandTone([...brandTone, tone]);
                                                                                }
                                                                            }}
                                                                            className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer select-none inline-flex items-center gap-1.5 ${
                                                                                active
                                                                                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-2xs ring-1 ring-emerald-500/30'
                                                                                    : 'border-border/80 bg-card text-muted-foreground hover:border-emerald-500/40 hover:text-foreground'
                                                                            } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                                                                            title={desc}
                                                                        >
                                                                            <span>{tone}</span>
                                                                            {active && <Check className="h-3 w-3 stroke-[3]" />}
                                                                            <HelpTooltip text={desc} />
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 3: MARKETING COPY */}
                                    {currentStep === 3 && (
                                        <div className="animate-in space-y-3.5 duration-200 fade-in">
                                            {/* Tagline Card Box */}
                                            <div className="space-y-3 rounded-xl border border-border/80 bg-card/60 p-3.5">
                                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                                                    <div
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={() => {
                                                            const val = !includeTagline;
                                                            setIncludeTagline(val);
                                                            if (!val) setTaglineMode('none');
                                                            else if (tagline.trim()) setTaglineMode('manual');
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === ' ' || e.key === 'Enter') {
                                                                const val = !includeTagline;
                                                                setIncludeTagline(val);
                                                                if (!val) setTaglineMode('none');
                                                                else if (tagline.trim()) setTaglineMode('manual');
                                                            }
                                                        }}
                                                        className="flex items-center gap-2.5 cursor-pointer select-none"
                                                    >
                                                        <Checkbox
                                                            id="manual_include_tagline"
                                                            checked={includeTagline}
                                                            onCheckedChange={(checked) => {
                                                                const val = Boolean(checked);
                                                                setIncludeTagline(val);
                                                                if (!val) setTaglineMode('none');
                                                                else if (tagline.trim()) setTaglineMode('manual');
                                                            }}
                                                            className="h-4 w-4 cursor-pointer rounded-md data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white dark:data-[state=checked]:bg-emerald-600 dark:data-[state=checked]:border-emerald-600"
                                                        />
                                                        <div>
                                                            <Label
                                                                htmlFor="manual_include_tagline"
                                                                className="cursor-pointer text-xs font-bold text-foreground"
                                                            >
                                                                Include Tagline Headline
                                                            </Label>
                                                            <p className="text-[10px] text-muted-foreground">
                                                                Click card to enable or disable headline copy on visual
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {includeTagline && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={isGeneratingTagline}
                                                            onClick={handleSuggestTagline}
                                                            className="relative h-7 gap-1.5 rounded-lg border-primary/40 bg-primary/10 px-2.5 text-xs font-bold text-primary shadow-xs ring-1 ring-primary/30 transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground active:scale-95 disabled:opacity-50"
                                                        >
                                                            <Sparkles
                                                                className={`h-3 w-3 ${isGeneratingTagline
                                                                    ? 'animate-spin'
                                                                    : 'animate-pulse'
                                                                    }`}
                                                            />
                                                            {isGeneratingTagline
                                                                ? 'Suggesting...'
                                                                : 'Suggest Tagline'}
                                                        </Button>
                                                    )}
                                                </div>

                                                {includeTagline ? (
                                                    <div className="space-y-2">
                                                        <div className="relative">
                                                            <Input
                                                                value={tagline}
                                                                onChange={(e) => {
                                                                    setTagline(e.target.value);
                                                                    setTaglineMode('manual');
                                                                }}
                                                                placeholder="Type custom tagline or click Suggest Tagline (or leave blank for auto AI headline)..."
                                                                className="h-9 pr-8 text-xs font-medium text-foreground"
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

                                                        {tagline.trim() && (
                                                            <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-xs">
                                                                <div>
                                                                    <span className="mr-1.5 text-[10px] font-bold tracking-wider text-primary uppercase">
                                                                        Active:
                                                                    </span>
                                                                    <span className="font-medium text-foreground italic">
                                                                        "{tagline}"
                                                                    </span>
                                                                </div>
                                                                <Badge
                                                                    variant="outline"
                                                                    className="border-primary/30 bg-primary/10 text-[10px] font-bold text-primary"
                                                                >
                                                                    {taglineMode === 'ai' ? 'AI Generated' : 'Custom'}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : null}
                                            </div>

                                            {/* Simple Clickable Card Boxes Grid for Toggles */}
                                            <div className="grid gap-3 sm:grid-cols-3">
                                                {/* Include Prices Card Box */}
                                                <div
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => setIncludePrices(!includePrices)}
                                                    onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') setIncludePrices(!includePrices); }}
                                                    className="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card/60 p-3 transition-all cursor-pointer hover:bg-muted/30 select-none"
                                                >
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <BadgePercent className="h-4 w-4 text-primary" />
                                                                <p className="text-xs font-bold text-foreground">Include Prices</p>
                                                            </div>
                                                            <Checkbox
                                                                checked={includePrices}
                                                                onCheckedChange={(c) => setIncludePrices(Boolean(c))}
                                                                className="h-4 w-4 pointer-events-none rounded-md data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white dark:data-[state=checked]:bg-emerald-600 dark:data-[state=checked]:border-emerald-600"
                                                            />
                                                        </div>
                                                        <p className="line-clamp-2 text-[10px] text-muted-foreground">
                                                            Render authoritative catalog and custom product pricing
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Business Name Card Box */}
                                                <div
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => setIncludeBusinessName(!includeBusinessName)}
                                                    onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') setIncludeBusinessName(!includeBusinessName); }}
                                                    className="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card/60 p-3 transition-all cursor-pointer hover:bg-muted/30 select-none"
                                                >
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Building2 className="h-4 w-4 text-primary" />
                                                                <p className="text-xs font-bold text-foreground">Business Name</p>
                                                            </div>
                                                            <Checkbox
                                                                checked={includeBusinessName}
                                                                onCheckedChange={(c) => setIncludeBusinessName(Boolean(c))}
                                                                className="h-4 w-4 pointer-events-none rounded-md data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white dark:data-[state=checked]:bg-emerald-600 dark:data-[state=checked]:border-emerald-600"
                                                            />
                                                        </div>
                                                        <p className="line-clamp-2 text-[10px] text-muted-foreground">
                                                            Feature &ldquo;{business?.name || 'Your Business'}&rdquo; brand identity on creative
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Show Event/Holiday Text Card Box */}
                                                {selectedEvent && (
                                                    <div
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={() => setShowEventText(!showEventText)}
                                                        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') setShowEventText(!showEventText); }}
                                                        className="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card/60 p-3 transition-all cursor-pointer hover:bg-muted/30 select-none"
                                                    >
                                                        <div className="space-y-1">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <Calendar className="h-4 w-4 text-primary" />
                                                                    <p className="text-xs font-bold text-foreground">Event Text</p>
                                                                </div>
                                                                <Checkbox
                                                                    checked={showEventText}
                                                                    onCheckedChange={(c) => setShowEventText(Boolean(c))}
                                                                    className="h-4 w-4 pointer-events-none rounded-md data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white dark:data-[state=checked]:bg-emerald-600 dark:data-[state=checked]:border-emerald-600"
                                                                />
                                                            </div>
                                                            <p className="line-clamp-2 text-[10px] text-muted-foreground">
                                                                Allow &ldquo;{selectedEvent.name}&rdquo; typography on image
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 4: FORMAT & GENERATE */}
                                    {currentStep === 4 && (
                                        <div className="animate-in space-y-4 duration-200 fade-in">
                                            {/* Canvas Aspect Ratio Selector (Clickable Cards) */}
                                            <AspectRatioSelector
                                                value={aspectRatio}
                                                onChange={setAspectRatio}
                                            />
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
                                            className="gap-2 text-xs font-semibold shadow-none"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            Back
                                        </Button>

                                        {currentStep < 4 ? (
                                            <div className="flex items-center gap-2">

                                                <Button
                                                    type="button"
                                                    onClick={() =>
                                                        setCurrentStep((prev) =>
                                                            Math.min(4, prev + 1) as Step,
                                                        )
                                                    }
                                                    disabled={
                                                        currentStep === 1
                                                            ? !hasProductSelected
                                                            : currentStep === 2
                                                                ? !stepTwoValid
                                                                : false
                                                    }
                                                    className="gap-2 text-xs font-semibold shadow-sm"
                                                >
                                                    Continue
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                type="button"
                                                size="lg"
                                                onClick={() => handleGenerateManual()}
                                                disabled={!canGenerateManual || isManualGenerating}
                                                className={`min-w-[240px] gap-2 text-xs font-bold shadow-md ${isQuotaExceeded
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
                                                        <Sparkles className="h-4 w-4" />
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
