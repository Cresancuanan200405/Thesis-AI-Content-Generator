import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    BadgePercent,
    Loader2,
    Sparkles,
    Tag,
    Wand2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { HelpTooltip } from '@/components/help-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { downloadVisualAsFormat } from '@/lib/download';

import { AspectRatioSelector } from './components/AspectRatioSelector';
import { BusinessNameSection } from './components/BusinessNameSection';
import { CreativeCanvas } from './components/CreativeCanvas';
import { ProductSelector } from './components/ProductSelector';
import { StudioBriefSummary } from './components/StudioBriefSummary';
import { StudioHeader } from './components/StudioHeader';
import {
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
    // AUTONOMOUS AUTOMATIC STATE (User controls WHAT to promote, MarketPilot controls HOW)
    // -------------------------------------------------------------------------
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

    // UI Viewports & Modals
    const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(false);
    const [isPreviewFullViewOpen, setIsPreviewFullViewOpen] = useState(false);
    const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

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
    // SAVE DESIGN & DOWNLOAD
    // -------------------------------------------------------------------------
    const handleSaveToDesigns = async () => {
        if (isSavedToDesigns && savedDesign?.id) {
            toast.info('Design is already saved in My Designs.');
            return;
        }

        setIsSavingDesign(true);
        setSaveErrorMessage(null);
        try {
            const formData = new FormData();
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
                setSaveErrorMessage(null);
                if (data.design) {
                    setSavedDesign((prev) => (prev ? { ...prev, id: data.design.id } : prev));
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
                    <StudioHeader
                        activeMode="automatic"
                        activeCampaign={campaign}
                        campaigns={campaigns}
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
                            tagline={includeTagline ? tagline : ''}
                            price={includePrices ? effectivePrice : ''}
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
                            onRegenerate={() => handleGenerateAutomatic({ is_variation: true })}
                            creativeConcept={creativeConcept}
                            visualStrategy={visualStrategy}
                            designTreatment={designTreatment}
                            copyEmphasis={copyEmphasis}
                            hasReferenceImage={uniqueSelectedCatalogProducts.length > 0}
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
                            )}

                            {/* Main Autonomous Studio Card */}
                            <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-sm gap-0 py-0">
                                <CardHeader className="border-b bg-muted/10 px-4 py-3 sm:px-5">
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h2 className="text-sm font-bold tracking-tight text-foreground uppercase">
                                                Automatic Mode — AI Creative Director
                                            </h2>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                You choose what to promote; MarketPilot autonomously decides how to promote it.
                                            </p>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className="self-start sm:self-auto border-primary/30 bg-primary/10 text-[10px] font-bold text-primary"
                                        >
                                            <Sparkles className="mr-1 h-3 w-3" />
                                            Autonomous Workflow
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4 p-3 sm:p-4">
                                    {/* STEP 1: WHAT TO PROMOTE */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-1.5 px-0.5">
                                            <Label className="text-xs font-bold text-foreground uppercase tracking-wider">
                                                Step 1: What to Promote
                                            </Label>
                                            <HelpTooltip text="Select catalog products or add custom offerings to feature. Multiple items are supported." />
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
                                        />
                                    </div>

                                    {/* STEP 2: MARKETING CONTENT CONTROLS */}
                                    <div className="space-y-2 rounded-xl border border-border/80 bg-card/60 p-3 shadow-xs">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <Tag className="h-4 w-4 text-primary" />
                                                <Label className="text-xs font-bold text-foreground">
                                                    Step 2: Marketing Content (Toggles Only)
                                                </Label>
                                                <HelpTooltip text="AI Creative Director autonomously crafts the visual concept, design treatment, typography layout, and original headline tagline. No manual copy entry needed." />
                                            </div>
                                        </div>

                                        <div className="grid gap-2.5 sm:grid-cols-2 pt-1">
                                            {/* Include Tagline Toggle */}
                                            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background/60 px-3.5 py-2.5 shadow-2xs transition-colors hover:border-border">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                        <Sparkles className="h-3.5 w-3.5" />
                                                    </div>
                                                    <div>
                                                        <Label
                                                            htmlFor="auto_include_tagline"
                                                            className="cursor-pointer text-xs font-semibold text-foreground"
                                                        >
                                                            Include Tagline
                                                        </Label>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            AI generates an event-aware headline
                                                        </p>
                                                    </div>
                                                </div>
                                                <Checkbox
                                                    id="auto_include_tagline"
                                                    checked={includeTagline}
                                                    onCheckedChange={(checked) => setIncludeTagline(Boolean(checked))}
                                                    className="h-5 w-5 cursor-pointer rounded-md"
                                                />
                                            </div>

                                            {/* Include Prices Toggle */}
                                            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background/60 px-3.5 py-2.5 shadow-2xs transition-colors hover:border-border">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                        <BadgePercent className="h-3.5 w-3.5" />
                                                    </div>
                                                    <div>
                                                        <Label
                                                            htmlFor="auto_include_prices"
                                                            className="cursor-pointer text-xs font-semibold text-foreground"
                                                        >
                                                            Include Prices
                                                        </Label>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            Render authoritative product pricing
                                                        </p>
                                                    </div>
                                                </div>
                                                <Checkbox
                                                    id="auto_include_prices"
                                                    checked={includePrices}
                                                    onCheckedChange={(checked) => setIncludePrices(Boolean(checked))}
                                                    className="h-5 w-5 cursor-pointer rounded-md"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* STEP 3: FORMAT & GENERATE */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-1.5 px-0.5">
                                            <Label className="text-xs font-bold text-foreground uppercase tracking-wider">
                                                Step 3: Format & Generate
                                            </Label>
                                        </div>
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

                                    {/* GENERATE ACTION BAR */}
                                    <div className="mt-4 flex flex-col items-center justify-end gap-3 border-t border-border/70 pt-3 sm:flex-row">
                                        <Button
                                            type="button"
                                            size="lg"
                                            onClick={() => handleGenerateAutomatic()}
                                            disabled={!canGenerateAutomatic || isAutoGenerating}
                                            className={`w-full sm:w-auto min-w-[240px] gap-2 text-xs font-bold shadow-md ${isQuotaExceeded
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
                mode="automatic"
                productName={effectiveProductName}
                aspectRatio={aspectRatio}
                campaignName={campaign?.name}
                eventName={selectedEvent?.name}
                savedDesign={savedDesign}
                isSavedToDesigns={isSavedToDesigns}
                isSavingDesign={isSavingDesign}
                onSaveToDesigns={handleSaveToDesigns}
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
            />
        </>
    );
}
