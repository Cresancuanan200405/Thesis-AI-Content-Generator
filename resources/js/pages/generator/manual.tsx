import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    Camera,
    Check,
    Clapperboard,
    Compass,
    Loader2,
    Package,
    PenTool,
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
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
    brandToneDescriptions,
    BusinessProfile,
    CampaignItem,
    contentStyleDescriptions,
    contentStyleOptions,
    CustomProductItem,
    EventItem,
    GeneratedDesign,
    GenerationState,
    ImageQuality,
    ProductItem,
    renderStyleOptions,
    Step,
    TaglineMode,
    toneOptions,
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
    const [tagline, setTagline] = useState('');
    const [taglineMode, setTaglineMode] = useState<TaglineMode>('none');
    const [isGeneratingTagline, setIsGeneratingTagline] = useState(false);
    const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
    const [renderStyle, setRenderStyle] = useState('Studio Product Still');
    const [contentStyle, setContentStyle] = useState<string[]>(['Commercial', 'Studio Lighting']);
    const [brandTone, setBrandTone] = useState<string[]>(['Professional', 'Bold']);

    // Step 3 state: Canvas Dimensions & Identity
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
    const [isManualGenerating, setIsManualGenerating] = useState(false);
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
                    require_tagline: true,
                    target: 'tagline',
                    catalog_product_ids: catalogIds,
                    custom_products: customItems,
                    user_instruction: scenePrompt.trim(),
                    render_style: renderStyle,
                    visual_theme: contentStyle,
                    brand_tone: brandTone,
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
                    generation_mode: 'manual',
                    target: 'prompt',
                    catalog_product_ids: catalogIds,
                    custom_products: customItems,
                    user_instruction: scenePrompt.trim(),
                    render_style: renderStyle,
                    visual_theme: contentStyle,
                    brand_tone: brandTone,
                    aspect_ratio: aspectRatio,
                    include_business_name: includeBusinessName,
                }),
            });

            const data = await response.json();
            if (response.ok && data.success && data.visual_prompt) {
                setScenePrompt(data.visual_prompt);
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
        const randomStyle =
            renderStyleOptions[Math.floor(Math.random() * renderStyleOptions.length)]
                .value;
        setRenderStyle(randomStyle);

        // Shuffle up to 2 random themes
        const shuffledThemes = [...contentStyleOptions]
            .sort(() => 0.5 - Math.random())
            .slice(0, 2);
        setContentStyle(shuffledThemes);

        // Shuffle up to 2 random tones
        const shuffledTones = [...toneOptions]
            .sort(() => 0.5 - Math.random())
            .slice(0, 2);
        setBrandTone(shuffledTones);

        toast.success('Applied creative style presets!');
    };

    // -------------------------------------------------------------------------
    // GENERATION EXECUTION (POST /generator/manual)
    // -------------------------------------------------------------------------
    const handleGenerateManual = async () => {
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
            formData.append('aspect_ratio', aspectRatio || '1:1');
            formData.append('image_model', imageModel || 'chatgpt-image-latest');
            formData.append('image_quality', imageQuality || 'medium');
            formData.append('tagline_mode', taglineMode || 'ai');
            if (tagline.trim()) {
                formData.append('tagline', tagline.trim());
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
            toast.success('Visual Creative Generated!');
        } catch {
            window.clearInterval(progressTimer);
            setGenerationState('error');
            toast.error('Network error during visual generation.');
        } finally {
            setIsManualGenerating(false);
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
            formData.append('image_prompt', scenePrompt);
            formData.append('prompt', scenePrompt);

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
            formData.append('render_style', renderStyle);
            contentStyle.forEach((style) =>
                formData.append('content_style[]', style),
            );
            brandTone.forEach((tone) => formData.append('brand_tone[]', tone));
            formData.append('generation_mode', 'manual');

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
            title: 'Product & Brief',
            subtitle: 'Details & Event',
            icon: Package,
            isCompleted: stepOneValid && currentStep > 1,
            isAccessible: true,
        },
        {
            step: 2,
            title: 'Prompt & Tagline',
            subtitle: 'Scene & Headline',
            icon: Sparkles,
            isCompleted: stepTwoValid && currentStep > 2,
            isAccessible: stepOneValid,
        },
        {
            step: 3,
            title: 'Style & Canvas',
            subtitle: 'Theme & Ratio',
            icon: SlidersHorizontal,
            isCompleted: false,
            isAccessible: stepOneValid && stepTwoValid,
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
                        activeMode="manual"
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
                            onRegenerate={handleGenerateManual}
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
                                                ? 'Product & Brief'
                                                : currentStep === 2
                                                  ? 'Prompt & Tagline'
                                                  : 'Style & Canvas'}
                                        </h2>
                                        <Badge
                                            variant="outline"
                                            className="border-primary/30 bg-primary/10 text-[10px] font-bold text-primary"
                                        >
                                            <SlidersHorizontal className="mr-1 h-3 w-3" />
                                            Manual Mode
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-4 sm:p-6">
                                    {/* STEP 1: PRODUCT & BRIEF */}
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

                                    {/* STEP 2: PROMPT & TAGLINE */}
                                    {currentStep === 2 && (
                                        <div className="animate-in space-y-5 duration-200 fade-in">
                                            {/* Tagline Card */}
                                            <div className="space-y-2.5 rounded-2xl border border-border/80 bg-card/60 p-4 shadow-xs">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <Label className="text-xs font-bold text-foreground">
                                                            Campaign Tagline
                                                        </Label>
                                                        <HelpTooltip text="Commercial tagline for your marketing visual. You can type your own, click Suggest Tagline, or leave blank if you do not want headline copy." />
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
                                                                Optional
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
                                                        placeholder="Type custom tagline or click Suggest Tagline (leave blank if not needed)..."
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
                                                        Enter a tagline or use AI to suggest one.
                                                    </p>
                                                )}
                                            </div>

                                            {/* Visual Scene Prompt Card */}
                                            <div className="space-y-2.5 rounded-2xl border border-border/80 bg-card/60 p-4 shadow-xs">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <Label className="text-xs font-bold text-foreground">
                                                            Visual Scene Prompt
                                                        </Label>
                                                        <HelpTooltip text="Detailed scene prompt describing the visual setting, composition, lighting, and mood. Required for manual generation." />
                                                        {scenePrompt.trim() ? (
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
                                                        className="relative h-7.5 gap-1.5 rounded-lg border-primary/40 bg-primary/10 px-3 text-xs font-bold text-primary shadow-xs ring-1 ring-primary/30 transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground disabled:pointer-events-none disabled:opacity-60 active:scale-95"
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
                                                                        : 'Generate Visual Prompt'}
                                                                </span>
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>

                                                <Textarea
                                                    value={scenePrompt}
                                                    onChange={(e) => setScenePrompt(e.target.value)}
                                                    placeholder="Describe scene staging, festive props, lighting, or backdrop (or click Generate Visual Prompt to have AI compose one)..."
                                                    rows={4}
                                                    className="resize-none text-xs leading-relaxed"
                                                />

                                                {scenePrompt.trim() ? (
                                                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                                        <span>Custom visual prompt is ready to guide image rendering.</span>
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
                                                        Describe the scene or click <strong>Generate Visual Prompt</strong> to auto-create one.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 3: STYLE, BRAND & CANVAS */}
                                    {currentStep === 3 && (
                                        <div className="animate-in space-y-5 duration-200 fade-in">
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
                                                    className="relative h-8 gap-1.5 self-start rounded-lg border-primary/40 bg-primary/10 px-3 text-xs font-bold text-primary shadow-md ring-1 shadow-primary/20 ring-primary/30 transition-all duration-300 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-lg hover:shadow-primary/30 active:scale-95 sm:self-auto"
                                                >
                                                    <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                                                    {contentStyle.length > 0 || brandTone.length > 0
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
                                                    <span className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
                                                        <Check className="h-3 w-3" /> 1 / 1 Selected
                                                    </span>
                                                </div>

                                                <div className="grid gap-2.5 sm:grid-cols-2">
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
                                                            <TooltipProvider key={opt.value} delayDuration={150}>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setRenderStyle(opt.value)}
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
                                                                                        className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-bold ${opt.badgeColor}`}
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

                                            {/* Section 2: Visual Themes (Content Style) */}
                                            <div className="space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <Label className="text-xs font-semibold text-foreground">
                                                            Visual Themes
                                                        </Label>
                                                        <HelpTooltip text="Art direction and photography aesthetics (e.g. Lifestyle, Minimal, Storytelling, Editorial)." />
                                                    </div>
                                                    <span className="rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
                                                        Optional • {contentStyle.length} / 3 Selected
                                                    </span>
                                                </div>

                                                <TooltipProvider delayDuration={150}>
                                                    <div className="flex flex-wrap gap-2">
                                                        {contentStyleOptions.map((style) => {
                                                            const active = contentStyle.includes(style);
                                                            const disabled = !active && contentStyle.length >= 3;
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
                                                                                    setContentStyle(
                                                                                        contentStyle.filter((s) => s !== style),
                                                                                    );
                                                                                } else if (contentStyle.length < 3) {
                                                                                    setContentStyle([...contentStyle, style]);
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

                                            {/* Section 3: Brand Tone */}
                                            <div className="space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <Label className="text-xs font-semibold text-foreground">
                                                            Brand Tone
                                                        </Label>
                                                        <HelpTooltip text="Brand emotional vibe and atmosphere (e.g. Luxury, Warm, Bold, Modern) to guide lighting and tone." />
                                                    </div>
                                                    <span className="rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
                                                        Optional • {brandTone.length} / 3 Selected
                                                    </span>
                                                </div>

                                                <TooltipProvider delayDuration={150}>
                                                    <div className="flex flex-wrap gap-2">
                                                        {toneOptions.map((tone) => {
                                                            const active = brandTone.includes(tone);
                                                            const disabled = !active && brandTone.length >= 3;
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
                                                                                    setBrandTone(
                                                                                        brandTone.filter((t) => t !== tone),
                                                                                    );
                                                                                } else if (brandTone.length < 3) {
                                                                                    setBrandTone([...brandTone, tone]);
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

                                            {/* Business Name Toggle */}
                                            <BusinessNameSection
                                                includeBusinessName={includeBusinessName}
                                                onToggleIncludeBusinessName={setIncludeBusinessName}
                                                businessName={business?.name}
                                            />

                                            {/* Canvas Aspect Ratio Selector */}
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
                                                        Enter scene prompt to continue
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
                                                onClick={handleGenerateManual}
                                                disabled={!canGenerateManual || isManualGenerating}
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
                                                ) : isManualGenerating ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Rendering Visual Creative...
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
                        renderStyle={renderStyle}
                        contentStyle={contentStyle}
                        brandTone={brandTone}
                        imageModel={imageModel}
                        imageQuality={imageQuality}
                        includeBusinessName={includeBusinessName}
                        isAutomaticMode={false}
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
