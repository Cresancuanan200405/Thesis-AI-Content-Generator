import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    Loader2,
    SlidersHorizontal,
    Wand2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { downloadVisualAsFormat } from '@/lib/download';
import { useSetBreadcrumbs } from '@/context/breadcrumb-context';

import { CreativeCanvas } from './components/CreativeCanvas';
import { ProductSelector } from './components/ProductSelector';
import { StudioBriefSummary } from './components/StudioBriefSummary';
import { StudioHeader } from './components/StudioHeader';
import {
    AutomaticSettingsModal,
    CatalogBrowserModal,
    GeneratedCreativeModal,
} from './components/StudioModals';
import { SynthesisScreen } from './components/SynthesisScreen';
import {
    BusinessProfile,
    CampaignItem,
    CustomProductItem,
    EventItem,
    GeneratedDesign,
    GenerationState,
    ImageQuality,
    ProductItem,
    DesignSystemExport,
} from './components/types';

interface AutomaticGeneratorProps {
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

export default function AutomaticGenerator({
    campaign = null,
    campaigns = [],
    business = null,
    products = [],
    selectedEvent = null,
    budgetLimit = 10,
    totalSpent = 0,
    isQuotaExceeded = false,
    initialProduct = null,
    initial_draft = null,
    origin = undefined,
}: AutomaticGeneratorProps) {
    // -------------------------------------------------------------------------
    // AUTONOMOUS AUTOMATIC STATE (User controls WHAT to promote, MarketPilot controls HOW)
    // -------------------------------------------------------------------------
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [selectedCatalogProducts, setSelectedCatalogProducts] = useState<
        ProductItem[]
    >(initialProduct ? [initialProduct] : []);
    const [customProducts, setCustomProducts] = useState<CustomProductItem[]>([]);
    const [productTab, setProductTab] = useState<'catalog' | 'custom'>('catalog');
    const [inlineProductSearch, setInlineProductSearch] = useState('');
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);

    // Marketing Copy Toggles (Part 5 & Part 6)
    const [includeTagline, setIncludeTagline] = useState<boolean>(true);
    const [includePrices, setIncludePrices] = useState<boolean>(true);
    const [showEventText, setShowEventText] = useState<boolean>(
        Boolean(selectedEvent?.id || selectedEvent?.name),
    );

    useEffect(() => {
        setShowEventText(Boolean(selectedEvent?.id || selectedEvent?.name));
    }, [selectedEvent?.id, selectedEvent?.name]);

    // Canvas Dimensions & Identity
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const imageModel = 'gpt-image-2';
    const [imageQuality, setImageQuality] = useState<ImageQuality>('medium');
    const [includeBusinessName, setIncludeBusinessName] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('ai_studio_include_business_name');
            return saved !== null ? saved === 'true' : true;
        }
        return true;
    });

    // Autonomous Creative Outputs (Discovered from backend execution)
    const [tagline, setTagline] = useState('');
    const [creativeConcept, setCreativeConcept] = useState('');
    const [visualStrategy, setVisualStrategy] = useState('');
    const [designTreatment, setDesignTreatment] = useState<string>('');
    const [copyEmphasis, setCopyEmphasis] = useState<string>('');
    const [previousConcepts, setPreviousConcepts] = useState<string[]>([]);
    const [generatedPromptText, setGeneratedPromptText] = useState('');

    // Generation Execution state
    const [generationState, setGenerationState] =
        useState<GenerationState>('idle');
    const [isAutoGenerating, setIsAutoGenerating] = useState(false);
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
        if (initial_draft.tagline) {
            setTagline(initial_draft.tagline);
            setIncludeTagline(true);
        }
        if (meta.creative_concept) setCreativeConcept(meta.creative_concept);
        if (meta.visual_strategy) setVisualStrategy(meta.visual_strategy);
        if (meta.design_treatment) setDesignTreatment(meta.design_treatment);
        if (meta.copy_emphasis) setCopyEmphasis(meta.copy_emphasis);
        if (initial_draft.prompt) setGeneratedPromptText(initial_draft.prompt);
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
            ? `/generator/automatic?campaign_id=${campaign.id}`
            : '/generator/automatic';

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
    // DERIVED VALIDATIONS & PRODUCT DEDUPLICATION
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
    const canGenerateAutomatic =
        hasProductSelected &&
        Boolean(campaign?.id) &&
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
        return 'Commercial Visual';
    }, [uniqueSelectedCatalogProducts, customProducts]);

    const effectivePrice = useMemo(() => {
        if (!includePrices) return '';
        if (uniqueSelectedCatalogProducts.length > 0) {
            return uniqueSelectedCatalogProducts[0].price
                ? String(uniqueSelectedCatalogProducts[0].price)
                : '';
        }
        const activeCustom = customProducts.find((p) => p.name.trim().length > 0);
        return activeCustom?.price || '';
    }, [uniqueSelectedCatalogProducts, customProducts, includePrices]);

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
    // TRUE AUTONOMOUS GENERATION (POST /generator/automatic)
    // -------------------------------------------------------------------------
    const handleGenerateAutomatic = async (options?: { is_variation?: boolean }) => {
        if (isAutoGenerating || generationState === 'generating') return;
        if (isQuotaExceeded) {
            toast.error('You have reached your AI budget quota limit.');
            return;
        }
        if (!campaign?.id) {
            toast.error('A Campaign is required before generating an automatic marketing visual.');
            return;
        }
        if (!hasProductSelected) {
            toast.error('Please select or add at least one product or service.');
            return;
        }

        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }

        setIsAutoGenerating(true);
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
            const catalogIds = uniqueSelectedCatalogProducts.map((p) => p.id);
            const customItems = customProducts
                .filter((p) => p.name.trim())
                .map((p) => ({ name: p.name, price: p.price || null }));

            const response = await fetch('/generator/automatic', {
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
                    include_tagline: includeTagline,
                    include_prices: includePrices,
                    show_event_text: selectedEvent ? showEventText : false,
                    aspect_ratio: aspectRatio || '1:1',
                    image_model: 'gpt-image-2',
                    image_quality: imageQuality || 'medium',
                    include_business_name: includeBusinessName,
                    previous_concepts: previousConcepts,
                    is_variation: options?.is_variation ?? false,
                    source_design_id: options?.is_variation ? (savedDesign?.id || null) : null,
                    tagline: options?.is_variation ? (savedDesign?.tagline || tagline) : (includeTagline && tagline ? tagline : undefined),
                    design_treatment: options?.is_variation ? (savedDesign?.generation_meta?.design_treatment || designTreatment) : undefined,
                    copy_emphasis: options?.is_variation ? (savedDesign?.generation_meta?.copy_emphasis || copyEmphasis) : undefined,
                    render_style: options?.is_variation ? (savedDesign?.generation_meta?.render_style || undefined) : undefined,
                    creative_concept: options?.is_variation ? (savedDesign?.generation_meta?.creative_concept || creativeConcept) : undefined,
                    visual_strategy: options?.is_variation ? (savedDesign?.generation_meta?.visual_strategy || visualStrategy) : undefined,
                }),
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
                        : 'Failed to generate automatic marketing visual');
                setGenerationState('error');
                toast.error(errorMsg);
                return;
            }

            // Populate autonomous creative outputs from AI Creative Director
            if (data.creative_concept) {
                setCreativeConcept(data.creative_concept);
                setPreviousConcepts((prev) => [...prev, data.creative_concept]);
            }
            if (data.visual_strategy) {
                setVisualStrategy(data.visual_strategy);
            }
            if (data.design_treatment || data.preview?.design_treatment) {
                setDesignTreatment(data.design_treatment || data.preview?.design_treatment);
            }
            if (data.copy_emphasis || data.preview?.copy_emphasis) {
                setCopyEmphasis(data.copy_emphasis || data.preview?.copy_emphasis);
            }
            if (data.visual_prompt || data.prompt) {
                setGeneratedPromptText(data.visual_prompt || data.prompt);
            }
            if (includeTagline && data.tagline) {
                setTagline(data.tagline);
            } else {
                setTagline('');
            }

            const preview = data.preview || data;
            const productionPrompt = data.visual_prompt || data.prompt || preview.prompt || preview.visual_prompt || '';
            setGeneratedPromptText(productionPrompt);
            setSavedDesign({
                id: null,
                image_url: preview.image_url,
                generated_image_path: preview.generated_image_path,
                product_name: preview.product_name || effectiveProductName,
                tagline: includeTagline ? (preview.tagline || data.tagline || (options?.is_variation ? savedDesign?.tagline : '') || '') : '',
                aspect_ratio: preview.aspect_ratio || aspectRatio,
                image_model: preview.image_model || 'gpt-image-2',
                prompt: productionPrompt,
                generation_meta: preview.generation_meta || {
                    prompt: productionPrompt,
                    creative_concept: data.creative_concept,
                    visual_strategy: data.visual_strategy,
                    show_event_text: selectedEvent ? showEventText : false,
                },
            });

            setIsSavedToDesigns(false);
            setSaveErrorMessage(null);
            setGenerationState('ready');
            setIsPreviewFullViewOpen(true);
            toast.success(options?.is_variation ? 'Variation Generated!' : 'Automatic Marketing Visual Generated!');
        } catch {
            window.clearInterval(progressTimer);
            setGenerationState('error');
            toast.error('Network error during visual generation.');
        } finally {
            setIsAutoGenerating(false);
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
            const exactPrompt = savedDesign?.prompt || savedDesign?.generation_meta?.prompt || generatedPromptText || visualStrategy || '';
            formData.append('image_prompt', exactPrompt);
            formData.append('prompt', exactPrompt);

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
            formData.append('include_tagline', includeTagline ? '1' : '0');
            if (campaign?.id) {
                formData.append('campaign_id', String(campaign.id));
            }
            formData.append('aspect_ratio', aspectRatio);
            formData.append('image_model', 'gpt-image-2');
            formData.append('image_quality', imageQuality);
            formData.append('tagline_mode', includeTagline ? 'ai' : 'none');
            if (includeTagline && tagline.trim()) {
                formData.append('tagline', tagline.trim());
            }
            formData.append('include_business_name', includeBusinessName ? '1' : '0');
            if (includeBusinessName && business?.name) {
                formData.append('business_name', business.name);
            }
            if (creativeConcept) {
                formData.append('creative_concept', creativeConcept);
            }
            if (visualStrategy) {
                formData.append('visual_strategy', visualStrategy);
            }
            if (designTreatment) {
                formData.append('design_treatment', designTreatment);
            }
            if (copyEmphasis) {
                formData.append('copy_emphasis', copyEmphasis);
            }
            formData.append('generation_mode', 'automatic');
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
            const exactPrompt = savedDesign?.prompt || savedDesign?.generation_meta?.prompt || generatedPromptText || visualStrategy || '';
            formData.append('image_prompt', exactPrompt);
            formData.append('prompt', exactPrompt);

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
            formData.append('include_tagline', includeTagline ? '1' : '0');
            if (campaign?.id) {
                formData.append('campaign_id', String(campaign.id));
            }
            formData.append('aspect_ratio', aspectRatio);
            formData.append('image_model', 'gpt-image-2');
            formData.append('image_quality', imageQuality);
            formData.append('tagline_mode', includeTagline ? 'ai' : 'none');
            if (includeTagline && tagline.trim()) {
                formData.append('tagline', tagline.trim());
            }
            formData.append('include_business_name', includeBusinessName ? '1' : '0');
            if (includeBusinessName && business?.name) {
                formData.append('business_name', business.name);
            }
            if (creativeConcept) {
                formData.append('creative_concept', creativeConcept);
            }
            if (visualStrategy) {
                formData.append('visual_strategy', visualStrategy);
            }
            if (designTreatment) {
                formData.append('design_treatment', designTreatment);
            }
            if (copyEmphasis) {
                formData.append('copy_emphasis', copyEmphasis);
            }
            formData.append('generation_mode', 'automatic');
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

    const currentStatusMessage = [
        'Analyzing Campaign Context & Marketing Angle...',
        'Synthesizing AI Creative Concept & Scene Direction...',
        'Orchestrating Commercial Typography & Brand Staging...',
        'Rendering High-Fidelity Marketing Canvas...',
    ][generationStage] || 'Generating your creative...';

    return (
        <>
            <Head title="Automatic Generation — AI Marketing Studio" />

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
                            activeMode="automatic"
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
                            renderStyle="Automatic (AI Creative Director)"
                            activeCampaign={campaign}
                            selectedEvent={selectedEvent}
                            currentStatusMessage={currentStatusMessage}
                            generationProgress={generationProgress}
                            onResetToIdle={() => setGenerationState('idle')}
                        />
                    ) : generationState === 'error' ? (
                        <SynthesisScreen
                            isError
                            currentStatusMessage="Failed to complete automatic generation"
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
                            onRegenerate={() => handleGenerateAutomatic({ is_variation: true })}
                            creativeConcept={creativeConcept}
                            visualStrategy={visualStrategy}
                            designTreatment={designTreatment}
                            copyEmphasis={copyEmphasis}
                            hasReferenceImage={uniqueSelectedCatalogProducts.length > 0}
                            eventName={selectedEvent?.name}
                            showEventText={showEventText}
                        />
                    ) : (
                        /* AUTONOMOUS CREATIVE STUDIO FORM */
                        <div className="space-y-3">
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
                            )}                            {/* Main Autonomous Studio Card */}
                            <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-sm gap-0 py-0">
                                <CardHeader className="border-b bg-muted/10 px-4 py-3 sm:px-5">
                                    <div>
                                        <h2 className="text-sm font-bold tracking-tight text-foreground">
                                            Autonomous Creative Studio
                                        </h2>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            Select what to promote and let AI autonomously direct the visual concept, typography, and styling.
                                        </p>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4 p-3 sm:p-4">
                                    {/* Product Selection Section */}
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

                                    {/* Quick Settings Indicator Bar without Pill Badges */}
                                    <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-border/70 bg-muted/20 p-2.5 sm:px-3.5">
                                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                                            <span className="font-semibold text-muted-foreground">
                                                Studio Settings:
                                            </span>
                                            <span className="text-muted-foreground">
                                                Aspect: <span className="font-semibold text-foreground">{aspectRatio}</span>
                                            </span>
                                            <span className="text-border">•</span>
                                            <span className="text-muted-foreground">
                                                Tagline: <span className={includeTagline ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>{includeTagline ? 'On' : 'Off'}</span>
                                            </span>
                                            <span className="text-border">•</span>
                                            <span className="text-muted-foreground">
                                                Price: <span className={includePrices ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>{includePrices ? 'On' : 'Off'}</span>
                                            </span>
                                            <span className="text-border">•</span>
                                            <span className="text-muted-foreground">
                                                Brand: <span className={includeBusinessName ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>{includeBusinessName ? 'On' : 'Off'}</span>
                                            </span>
                                            {selectedEvent && (
                                                <>
                                                    <span className="text-border">•</span>
                                                    <span className="text-muted-foreground">
                                                        Event Text: <span className={showEventText ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>{showEventText ? 'On' : 'Off'}</span>
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Bar */}
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 border-t border-border/70 pt-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="lg"
                                            onClick={() => setIsSettingsModalOpen(true)}
                                            className="gap-2 text-xs font-semibold cursor-pointer h-10 px-4 rounded-xl border-border bg-background shadow-xs hover:bg-muted/60"
                                        >
                                            <SlidersHorizontal className="h-4 w-4 text-primary" />
                                            <span>Studio Settings</span>
                                        </Button>

                                        <Button
                                            type="button"
                                            size="lg"
                                            onClick={() => handleGenerateAutomatic()}
                                            disabled={!canGenerateAutomatic || isAutoGenerating}
                                            className={`min-w-[220px] gap-2 text-xs font-bold shadow-md cursor-pointer rounded-xl h-10 ${
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
                                            ) : isAutoGenerating ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Generating Marketing Image...
                                                </>
                                            ) : (
                                                <>
                                                    <Wand2 className="h-4 w-4" />
                                                    Generate Marketing Image
                                                </>
                                            )}
                                        </Button>
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
                        imageModel={imageModel}
                        imageQuality={imageQuality}
                        includeBusinessName={includeBusinessName}
                        isAutomaticMode={true}
                        includeTagline={includeTagline}
                        includePrices={includePrices}
                        showEventText={showEventText}
                        creativeConcept={creativeConcept}
                        visualStrategy={visualStrategy}
                        designTreatment={designTreatment}
                        copyEmphasis={copyEmphasis}
                    />
                )}
            </div>

            {/* MODALS */}
            <AutomaticSettingsModal
                isOpen={isSettingsModalOpen}
                onOpenChange={setIsSettingsModalOpen}
                aspectRatio={aspectRatio}
                onAspectRatioChange={setAspectRatio}
                selectedEvent={selectedEvent}
                showEventText={showEventText}
                onToggleEventText={setShowEventText}
                includeTagline={includeTagline}
                onToggleTagline={setIncludeTagline}
                includePrices={includePrices}
                onTogglePrices={setIncludePrices}
                includeBusinessName={includeBusinessName}
                onToggleBusinessName={(val) => {
                    setIncludeBusinessName(val);
                    localStorage.setItem('ai_studio_include_business_name', String(val));
                }}
                businessName={business?.name}
            />

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
                mode="automatic"
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
                    handleGenerateAutomatic({ is_variation: true });
                }}
                onEditCreative={() => {
                    setIsPreviewFullViewOpen(false);
                    setGenerationState('idle');
                }}
                saveError={saveErrorMessage}
                catalogProducts={uniqueSelectedCatalogProducts}
                customProducts={customProducts}
                creativeConcept={creativeConcept}
                visualStrategy={visualStrategy}
                designTreatment={designTreatment}
                copyEmphasis={copyEmphasis}
                renderStyle={savedDesign?.generation_meta?.render_style || 'Studio Product Still'}
                businessName={business?.name}
                includeBusinessName={includeBusinessName}
                tagline={tagline}
                taglineMode={includeTagline ? 'ai' : 'none'}
                includeTagline={includeTagline}
                price={effectivePrice}
                includePrices={includePrices}
                imageModel={imageModel}
                hasReferenceImage={uniqueSelectedCatalogProducts.length > 0}
                creativeFingerprint={savedDesign?.generation_meta?.creative_fingerprint}
                showEventText={showEventText}
                origin={origin}
            />
        </>
    );
}
