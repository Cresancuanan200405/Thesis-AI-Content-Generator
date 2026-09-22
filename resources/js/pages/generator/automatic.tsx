import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    Check,
    Loader2,
    Package,
    SlidersHorizontal,
    Sparkles,
    Wand2,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { HelpTooltip } from '@/components/help-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { downloadVisualAsFormat } from '@/lib/download';

import { AspectRatioSelector } from './components/AspectRatioSelector';
import { BusinessNameSection } from './components/BusinessNameSection';
import { CreativeCanvas } from './components/CreativeCanvas';
import { ProductSelector } from './components/ProductSelector';
import { StepWizardNav, WizardStepItem } from './components/StepWizardNav';
import { StudioBriefSummary } from './components/StudioBriefSummary';
import { StudioHeader } from './components/StudioHeader';
import {
    CatalogBrowserModal,
    FullscreenViewerModal,
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
    Step,
    TaglineMode,
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
}: AutomaticGeneratorProps) {
    // -------------------------------------------------------------------------
    // INDEPENDENT AUTOMATIC STATE
    // -------------------------------------------------------------------------
    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [selectedCatalogProducts, setSelectedCatalogProducts] = useState<
        ProductItem[]
    >(initialProduct ? [initialProduct] : []);
    const [customProducts, setCustomProducts] = useState<CustomProductItem[]>([]);
    const [productTab, setProductTab] = useState<'catalog' | 'custom'>('catalog');
    const [inlineProductSearch, setInlineProductSearch] = useState('');
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);

    // Step 2 state
    const [tagline, setTagline] = useState('');
    const [taglineMode, setTaglineMode] = useState<TaglineMode>('none');
    const [imagePrompt, setImagePrompt] = useState('');
    const [isGeneratingTagline, setIsGeneratingTagline] = useState(false);
    const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
    const [creativeConcept, setCreativeConcept] = useState('');
    const [visualStrategy, setVisualStrategy] = useState('');
    const [previousConcepts, setPreviousConcepts] = useState<string[]>([]);

    // Step 3 & AI Engine settings
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [imageModel, setImageModel] = useState('chatgpt-image-latest');
    const [imageQuality, setImageQuality] = useState<ImageQuality>('medium');
    const [includeBusinessName, setIncludeBusinessName] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('ai_studio_include_business_name');
            return saved !== null ? saved === 'true' : true;
        }
        return true;
    });

    // Generation Execution state
    const [generationState, setGenerationState] =
        useState<GenerationState>('idle');
    const [isAutoGenerating, setIsAutoGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [generationStage, setGenerationStage] = useState(0);
    const [savedDesign, setSavedDesign] = useState<GeneratedDesign | null>(null);
    const [isSavedToDesigns, setIsSavedToDesigns] = useState(false);
    const [isSavingDesign, setIsSavingDesign] = useState(false);

    // UI Viewports & Modals
    const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(false);
    const [isPreviewFullViewOpen, setIsPreviewFullViewOpen] = useState(false);

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
    const stepTwoValid = imagePrompt.trim().length > 0;
    const canGenerateAutomatic =
        hasProductSelected &&
        stepTwoValid &&
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

    // -------------------------------------------------------------------------
    // AI TAGLINE & PROMPT HANDLERS
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
                    generation_mode: 'automatic',
                    require_tagline: true,
                    target: 'tagline',
                    previous_concepts: previousConcepts,
                    catalog_product_ids: catalogIds,
                    custom_products: customItems,
                    user_instruction: imagePrompt.trim(),
                    aspect_ratio: aspectRatio,
                    include_business_name: includeBusinessName,
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
                    generation_mode: 'automatic',
                    target: 'prompt',
                    previous_concepts: previousConcepts,
                    catalog_product_ids: catalogIds,
                    custom_products: customItems,
                    user_instruction: imagePrompt.trim(),
                    aspect_ratio: aspectRatio,
                    include_business_name: includeBusinessName,
                }),
            });

            const data = await response.json();
            if (response.ok && data.success && data.visual_prompt) {
                setImagePrompt(data.visual_prompt);
                if (data.tagline && !tagline.trim()) {
                    setTagline(data.tagline);
                    setTaglineMode('ai');
                }
                if (data.creative_concept) {
                    setCreativeConcept(data.creative_concept);
                    setPreviousConcepts((prev) => [...prev, data.creative_concept]);
                }
                if (data.visual_strategy) {
                    setVisualStrategy(data.visual_strategy);
                }
                toast.success('Visual prompt composed by AI Creative Director!');
            } else {
                toast.error(data.message || 'Failed to compose visual prompt.');
            }
        } catch {
            toast.error('Network error composing visual prompt.');
        } finally {
            setIsGeneratingPrompt(false);
        }
    };

    // -------------------------------------------------------------------------
    // GENERATION EXECUTION (POST /generator/automatic)
    // -------------------------------------------------------------------------
    const handleGenerateAutomatic = async () => {
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
        if (!imagePrompt.trim()) {
            toast.error('Please generate or provide a visual prompt in Step 2.');
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
                    product_id: uniqueSelectedCatalogProducts[0]?.id
                        ? String(uniqueSelectedCatalogProducts[0].id)
                        : undefined,
                    tagline: tagline.trim() || undefined,
                    user_instruction: imagePrompt.trim(),
                    image_prompt: imagePrompt.trim(),
                    aspect_ratio: aspectRatio || '1:1',
                    image_model: imageModel || 'chatgpt-image-latest',
                    image_quality: imageQuality || 'medium',
                    include_business_name: includeBusinessName,
                    catalog_product_ids: catalogIds,
                    custom_products: customItems,
                    previous_concepts: previousConcepts,
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

            // Success
            if (data.creative_concept) {
                setCreativeConcept(data.creative_concept);
                setPreviousConcepts((prev) => [...prev, data.creative_concept]);
            }
            if (data.visual_strategy) {
                setVisualStrategy(data.visual_strategy);
            }
            if (data.tagline) {
                setTagline(data.tagline);
                setTaglineMode('ai');
            }

            const preview = data.preview;
            setSavedDesign({
                id: null,
                image_url: preview.image_url,
                generated_image_path: preview.generated_image_path,
                product_name: preview.product_name || effectiveProductName,
                tagline: preview.tagline || tagline,
                aspect_ratio: preview.aspect_ratio || aspectRatio,
                image_model: preview.image_model || imageModel,
                generation_meta: preview.generation_meta,
            });

            setIsSavedToDesigns(false);
            setGenerationState('ready');
            toast.success('Automatic Marketing Visual Generated!');
        } catch {
            window.clearInterval(progressTimer);
            setGenerationState('error');
            toast.error('Network error during visual generation.');
        } finally {
            setIsAutoGenerating(false);
        }
    };

    // -------------------------------------------------------------------------
    // SAVE DESIGN & DOWNLOAD
    // -------------------------------------------------------------------------
    const handleSaveToDesigns = async () => {
        if (isSavedToDesigns && savedDesign?.id) {
            toast.info('Design is already saved in My Designs.');
            return;
        }

        setIsSavingDesign(true);
        try {
            const formData = new FormData();
            formData.append('product_name', effectiveProductName);
            formData.append('image_prompt', imagePrompt);
            formData.append('prompt', imagePrompt);

            if (savedDesign?.generated_image_path) {
                formData.append(
                    'generated_image_path',
                    savedDesign.generated_image_path,
                );
            }
            if (effectivePrice) {
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
            if (campaign?.id) {
                formData.append('campaign_id', String(campaign.id));
            }
            formData.append('aspect_ratio', aspectRatio);
            formData.append('image_model', imageModel);
            formData.append('image_quality', imageQuality);
            formData.append('tagline_mode', taglineMode);
            if (tagline.trim()) {
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
            formData.append('generation_mode', 'automatic');

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
                if (data.design) {
                    setSavedDesign((prev) => ({ ...prev, id: data.design.id }));
                }
                toast.success('Saved to My Designs!');
            } else {
                toast.error(data.message || 'Failed to save design.');
            }
        } catch {
            toast.error('Network error saving design.');
        } finally {
            setIsSavingDesign(false);
        }
    };

    const handleDownload = (format: 'png' | 'jpeg' | 'svg' = 'png') => {
        if (!savedDesign?.image_url) return;
        downloadVisualAsFormat(
            savedDesign.image_url,
            effectiveProductName || 'marketing-visual',
            format,
        );
    };

    // Stepper navigation structure
    const steps: WizardStepItem[] = [
        {
            step: 1,
            title: 'Product & Services',
            subtitle: 'Catalog & Custom',
            icon: Package,
            isCompleted: hasProductSelected && currentStep > 1,
            isAccessible: true,
        },
        {
            step: 2,
            title: 'Tagline & Prompt',
            subtitle: 'AI Copy & Scene',
            icon: Sparkles,
            isCompleted: stepTwoValid && currentStep > 2,
            isAccessible: hasProductSelected,
        },
        {
            step: 3,
            title: 'Business & Ratio',
            subtitle: 'Brand & Dimensions',
            icon: SlidersHorizontal,
            isCompleted: false,
            isAccessible: hasProductSelected && stepTwoValid,
        },
    ];

    const currentStatusMessage = [
        'Analyzing Campaign Objective & Market Strategy...',
        'Synthesizing Brand Elements & Visual Scene...',
        'Rendering High-Fidelity Marketing Canvas...',
        'Finalizing Lighting, Text Placement & Color Grading...',
    ][generationStage] || 'Generating your creative...';

    return (
        <>
            <Head title="Automatic Generation — AI Marketing Studio" />

            <div
                className={`flex w-full bg-background text-foreground ${
                    generationState === 'generating'
                        ? 'h-[calc(100vh-2.75rem)] overflow-hidden sm:h-[calc(100vh-3rem)]'
                        : 'min-h-[calc(100vh-2.75rem)] sm:min-h-[calc(100vh-3rem)]'
                }`}
            >
                {/* MAIN STUDIO WORKSPACE */}
                <div
                    className={`min-w-0 flex-1 ${
                        generationState === 'generating'
                            ? 'flex h-full max-h-full flex-col items-center justify-center overflow-hidden p-2 sm:p-4'
                            : 'space-y-5 p-4 sm:p-6 lg:p-8'
                    }`}
                >
                    {/* Header */}
                    <StudioHeader
                        activeMode="automatic"
                        activeCampaign={campaign}
                        campaigns={campaigns}
                        imageModel={imageModel}
                        onSelectModel={setImageModel}
                        generationState={generationState}
                    />

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
                            tagline={tagline}
                            price={effectivePrice}
                            imageModel={imageModel}
                            imageQuality={imageQuality}
                            aspectRatio={aspectRatio}
                            savedDesign={savedDesign}
                            isSavedToDesigns={isSavedToDesigns}
                            isSavingDesign={isSavingDesign}
                            onSaveToDesigns={handleSaveToDesigns}
                            onDownload={handleDownload}
                            onOpenFullscreen={() => setIsPreviewFullViewOpen(true)}
                            onEditParameters={() => setGenerationState('idle')}
                            onRegenerate={handleGenerateAutomatic}
                            creativeConcept={creativeConcept}
                            visualStrategy={visualStrategy}
                            hasReferenceImage={uniqueSelectedCatalogProducts.length > 0}
                        />
                    ) : (
                        /* STEPPED CREATION FORM */
                        <div className="space-y-4">
                            <StepWizardNav
                                currentStep={currentStep}
                                steps={steps}
                                onSelectStep={setCurrentStep}
                            />

                            {/* Quota Banner */}
                            {isQuotaExceeded && (
                                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive shadow-xs">
                                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-bold text-destructive">
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
                            <Card className="overflow-hidden rounded-3xl border-border bg-card shadow-sm">
                                <CardHeader className="border-b bg-muted/10 px-4 py-3 sm:px-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <h2 className="text-sm font-bold text-foreground sm:text-base">
                                            {currentStep === 1
                                                ? 'Products & Services'
                                                : currentStep === 2
                                                  ? 'Tagline & Prompt'
                                                  : 'Canvas & Settings'}
                                        </h2>
                                        <Badge
                                            variant="outline"
                                            className="border-primary/30 bg-primary/10 text-[10px] font-bold text-primary"
                                        >
                                            <Sparkles className="mr-1 h-3 w-3" />
                                            Automatic Mode
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-4 sm:p-6">
                                    {/* STEP 1: PRODUCTS & SERVICES */}
                                    {currentStep === 1 && (
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
                                        />
                                    )}

                                    {/* STEP 2: TAGLINE & VISUAL PROMPT */}
                                    {currentStep === 2 && (
                                        <div className="animate-in space-y-5 duration-200 fade-in">
                                            {/* Tagline Card */}
                                            <div className="space-y-2.5 rounded-2xl border border-border/80 bg-card/60 p-4 shadow-xs">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <Label className="text-xs font-bold text-foreground">
                                                            Tagline
                                                        </Label>
                                                        <HelpTooltip text="Commercial tagline for your marketing visual. You can type your own, click Suggest Tagline, or leave blank for AI to generate automatically." />
                                                        {tagline.trim() ? (
                                                            taglineMode === 'ai' ? (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="border-primary/30 bg-primary/10 text-[10px] font-bold text-primary"
                                                                >
                                                                    <Sparkles className="mr-1 h-2.5 w-2.5" />
                                                                    AI Generated
                                                                </Badge>
                                                            ) : (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="border-emerald-500/30 bg-emerald-500/10 text-[10px] font-bold text-emerald-600 dark:text-emerald-400"
                                                                >
                                                                    <Check className="mr-1 h-2.5 w-2.5" />
                                                                    Custom Tagline
                                                                </Badge>
                                                            )
                                                        ) : (
                                                            <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                                                Optional (AI Auto)
                                                            </span>
                                                        )}
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={isGeneratingTagline}
                                                        onClick={handleSuggestTagline}
                                                        className="relative h-7.5 gap-1.5 rounded-lg border-primary/40 bg-primary/10 px-3 text-xs font-bold text-primary shadow-xs ring-1 ring-primary/30 transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground active:scale-95 disabled:opacity-50"
                                                    >
                                                        <Sparkles
                                                            className={`h-3.5 w-3.5 ${
                                                                isGeneratingTagline
                                                                    ? 'animate-spin'
                                                                    : 'animate-pulse'
                                                            }`}
                                                        />
                                                        {isGeneratingTagline
                                                            ? 'Suggesting...'
                                                            : 'Suggest Tagline'}
                                                    </Button>
                                                </div>

                                                <div className="relative">
                                                    <Input
                                                        value={tagline}
                                                        onChange={(e) => {
                                                            setTagline(e.target.value);
                                                            setTaglineMode('manual');
                                                        }}
                                                        placeholder="Type custom tagline or click Suggest Tagline (leave blank for AI generation)..."
                                                        className="h-10 pr-8 text-xs font-medium text-foreground"
                                                    />
                                                    {tagline && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setTagline('');
                                                                setTaglineMode('none');
                                                            }}
                                                            className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                            title="Clear tagline"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                </div>

                                                {tagline.trim() ? (
                                                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-2.5 text-xs">
                                                        <span className="mr-1.5 text-[10px] font-bold tracking-wider text-primary uppercase">
                                                            Active Tagline:
                                                        </span>
                                                        <span className="font-medium text-foreground italic">
                                                            "{tagline}"
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Leave blank for AI auto-generation.
                                                    </p>
                                                )}
                                            </div>

                                            {/* Visual Prompt Card */}
                                            <div className="space-y-2.5 rounded-2xl border border-border/80 bg-card/60 p-4 shadow-xs">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <Label className="text-xs font-bold text-foreground">
                                                            Visual Prompt & Scene Concept
                                                        </Label>
                                                        <HelpTooltip text="Production visual prompt describing scene styling, staging, and lighting. You can write your own, generate with AI, or leave blank for automatic generation on render." />
                                                        {imagePrompt.trim() ? (
                                                            <Badge
                                                                variant="outline"
                                                                className="border-emerald-500/30 bg-emerald-500/10 text-[10px] font-bold text-emerald-600 dark:text-emerald-400"
                                                            >
                                                                <Check className="mr-1 h-2.5 w-2.5" />
                                                                Ready
                                                            </Badge>
                                                        ) : (
                                                            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                                                Required
                                                            </span>
                                                        )}
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={isGeneratingPrompt}
                                                        onClick={handleGenerateVisualPrompt}
                                                        className={`relative h-8 gap-1.5 rounded-xl px-3 text-xs font-bold shadow-xs transition-all disabled:pointer-events-none disabled:opacity-60 active:scale-95 ${
                                                            imagePrompt.trim()
                                                                ? 'border-primary/40 bg-primary/10 text-primary ring-1 ring-primary/30 hover:border-primary hover:bg-primary hover:text-primary-foreground'
                                                                : 'border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                                                        }`}
                                                    >
                                                        {isGeneratingPrompt ? (
                                                            <>
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                <span>Generating...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Sparkles className="h-3.5 w-3.5" />
                                                                <span>
                                                                    {imagePrompt.trim()
                                                                        ? 'Suggest Different Angle'
                                                                        : 'Generate with AI'}
                                                                </span>
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>

                                                <Textarea
                                                    value={imagePrompt}
                                                    onChange={(e) => setImagePrompt(e.target.value)}
                                                    placeholder="Click Generate with AI to compose a prompt, or write your own scene staging, lighting, and composition..."
                                                    rows={3}
                                                    className="resize-none text-xs leading-relaxed"
                                                />

                                                {imagePrompt.trim() ? (
                                                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                                        <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                                                            <Check className="h-3 w-3" /> Visual prompt generated & ready.
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setImagePrompt('')}
                                                            className="text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
                                                        >
                                                            Clear prompt
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <p className="flex items-center gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                                                        <Sparkles className="h-3 w-3 shrink-0" />
                                                        Click "Generate with AI" above to generate your scene prompt before continuing.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 3: BUSINESS NAME & ASPECT RATIO */}
                                    {currentStep === 3 && (
                                        <div className="animate-in space-y-5 duration-200 fade-in">
                                            <BusinessNameSection
                                                includeBusinessName={includeBusinessName}
                                                onToggleIncludeBusinessName={setIncludeBusinessName}
                                                businessName={business?.name}
                                            />

                                            <AspectRatioSelector
                                                value={aspectRatio}
                                                onChange={setAspectRatio}
                                            />
                                        </div>
                                    )}

                                    {/* FOOTER CONTROLS */}
                                    <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
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

                                        {currentStep < 3 ? (
                                            <div className="flex items-center gap-2">
                                                {currentStep === 2 && !stepTwoValid && (
                                                    <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                                                        <Sparkles className="h-3.5 w-3.5" />
                                                        Generate prompt to continue
                                                    </span>
                                                )}
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
                                                onClick={handleGenerateAutomatic}
                                                disabled={!canGenerateAutomatic || isAutoGenerating}
                                                className={`min-w-[240px] gap-2 text-xs font-bold shadow-md ${
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
                        tagline={tagline}
                        hasImageReference={uniqueSelectedCatalogProducts.length > 0}
                        activeCampaign={campaign}
                        business={business}
                        selectedEvent={selectedEvent}
                        imageModel={imageModel}
                        imageQuality={imageQuality}
                        includeBusinessName={includeBusinessName}
                        isAutomaticMode={true}
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

            <FullscreenViewerModal
                isOpen={isPreviewFullViewOpen}
                onClose={() => setIsPreviewFullViewOpen(false)}
                productName={effectiveProductName}
                aspectRatio={aspectRatio}
                savedDesign={savedDesign}
                onDownload={handleDownload}
            />
        </>
    );
}
