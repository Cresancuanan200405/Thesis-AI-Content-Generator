import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Building2,
    Calendar,
    CalendarDays,
    Check,
    ChevronDown,
    Clock,
    Download,
    Edit3,
    ExternalLink,
    FolderPlus,
    ImageIcon,
    Laptop,
    Layers,
    Loader2,
    Package,
    Plus,
    RefreshCcw,
    Search,
    Sparkles,
    Tag,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { HelpTooltip } from '@/components/help-tooltip';
import { downloadVisualAsFormat } from '@/lib/download';

/* ==========================================================================
   TYPES & CONSTANTS
========================================================================== */

type Step = 1 | 2 | 3;
type TaglineMode = 'manual' | 'ai' | 'none';
type GenerationState = 'idle' | 'generating' | 'ready';

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
    tagline_mode: TaglineMode;
    tagline: string;
    reference_image: File | null;
    include_logo: boolean;
    aspect_ratio: string;
    campaign_id?: string;
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
        badge: '1080 × 1920',
    },
    {
        value: '16:9',
        label: '16:9 Landscape',
        description: 'Facebook Cover & Banners',
        badge: '1920 × 1080',
    },
    {
        value: '4:5',
        label: '4:5 Portrait',
        description: 'Instagram Feed Portrait',
        badge: '1080 × 1350',
    },
    {
        value: '4:3',
        label: '4:3 Standard',
        description: 'Display Ads & Content',
        badge: '1200 × 900',
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

const eventTypeStyles: Record<string, { bg: string; text: string; border: string; label: string }> = {
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
        `High-end commercial product photography of ${prod}, placed gracefully on a sleek pedestal with vibrant ${evt} decorative accents, subtle golden rim lighting, soft depth of field, 8k advertising aesthetic.`,
    (prod: string, evt: string) =>
        `Vibrant editorial lifestyle visual featuring ${prod} in the heart of a celebratory ${evt} setting, natural soft sunlight, festive warm atmosphere, authentic social media hero composition.`,
    (prod: string, evt: string) =>
        `Minimalist modern advertisement for ${prod} with stylized ${evt} motifs, clean architectural surfaces, dramatic soft shadows, ultra-clean premium retail billboard presentation.`,
    (prod: string, evt: string) =>
        `Dynamic promotional visual of ${prod} for ${evt} flash sale, subtle floating motion, ambient neon particle glow, punchy vibrant contrast, crisp commercial detail.`,
    (prod: string, evt: string) =>
        `Cozy and emotive ${evt} brand story scene with ${prod} taking center stage, surrounded by seasonal textures, rich celebratory ambiance, cinematic depth.`,
    (prod: string, evt: string) =>
        `Luxury dark-mode promotional mockup of ${prod}, illuminated by sleek metallic ribbons and modern studio spotlights themed for ${evt}, opulent reflections, magazine quality.`,
    (prod: string, evt: string) =>
        `Bright, airy flat-lay product composition of ${prod} with tasteful ${evt} seasonal elements, soft pastel palette, clean overhead perspective, high-end catalog quality.`,
];

const eventStyleBanks: Record<string, Array<{ styles: string[]; tones: string[] }>> = {
    holiday: [
        { styles: ['Seasonal', 'Lifestyle', 'Premium'], tones: ['Warm', 'Friendly', 'Elegant'] },
        { styles: ['Social Media', 'Storytelling', 'Seasonal'], tones: ['Playful', 'Warm', 'Inspiring'] },
        { styles: ['Premium', 'Editorial', 'Minimal'], tones: ['Luxury', 'Elegant', 'Modern'] },
        { styles: ['Promotional', 'Seasonal', 'Product-focused'], tones: ['Bold', 'Warm', 'Friendly'] },
    ],
    commercial: [
        { styles: ['Promotional', 'Product-focused', 'Social Media'], tones: ['Bold', 'Modern', 'Professional'] },
        { styles: ['Minimal', 'Product-focused', 'Editorial'], tones: ['Modern', 'Bold', 'Luxury'] },
        { styles: ['Social Media', 'Promotional', 'Lifestyle'], tones: ['Playful', 'Bold', 'Friendly'] },
    ],
    seasonal: [
        { styles: ['Seasonal', 'Lifestyle', 'Storytelling'], tones: ['Friendly', 'Warm', 'Inspiring'] },
        { styles: ['Editorial', 'Lifestyle', 'Premium'], tones: ['Elegant', 'Modern', 'Warm'] },
        { styles: ['Product-focused', 'Seasonal', 'Minimal'], tones: ['Modern', 'Friendly', 'Professional'] },
    ],
    custom: [
        { styles: ['Product-focused', 'Lifestyle', 'Premium'], tones: ['Professional', 'Modern', 'Warm'] },
        { styles: ['Storytelling', 'Social Media', 'Promotional'], tones: ['Inspiring', 'Bold', 'Friendly'] },
        { styles: ['Minimal', 'Editorial', 'Product-focused'], tones: ['Luxury', 'Professional', 'Modern'] },
    ],
};

function formatEventDateLabel(value?: string | null): string {
    if (!value) return 'No date';
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return value;
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
}

export default function GeneratorPage() {
    const pageProps = usePage().props as any;
    const { business, campaign: initialCampaign, initial_campaign_id, initial_event_id, initial_product_name, products = [], events = [], campaigns = [] } = pageProps;

    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [generationState, setGenerationState] = useState<GenerationState>('idle');
    const [generationProgress, setGenerationProgress] = useState(0);

    // Form State
    const [form, setForm] = useState<GeneratorForm>({
        product_name: initial_product_name || initialCampaign?.product_name || '',
        image_prompt: '',
        price: '',
        event_id: initial_event_id ? String(initial_event_id) : initialCampaign?.event_id ? String(initialCampaign.event_id) : '',
        product_id: initialCampaign?.product_id ? String(initialCampaign.product_id) : '',
        campaign_id: initial_campaign_id ? String(initial_campaign_id) : initialCampaign?.id ? String(initialCampaign.id) : '',
        content_style: [],
        brand_tone: [],
        tagline_mode: 'ai',
        tagline: '',
        reference_image: null,
        include_logo: Boolean(business?.logo_url),
        aspect_ratio: '1:1',
    });

    // Reference image preview state
    const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
    const [referenceImageSource, setReferenceImageSource] = useState<'none' | 'desktop' | 'product'>('none');
    const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
    const desktopFileInputRef = useRef<HTMLInputElement>(null);

    // Dynamic prompt tracking
    const [lastPromptIndex, setLastPromptIndex] = useState<number>(-1);
    const [lastStyleSuggestionIndex, setLastStyleSuggestionIndex] = useState<number>(-1);

    // Modal states
    const [eventModalOpen, setEventModalOpen] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [eventSearchQuery, setEventSearchQuery] = useState('');
    const [eventCategoryFilter, setEventCategoryFilter] = useState('all');
    const [selectedYearTab, setSelectedYearTab] = useState(String(new Date().getFullYear()));
    const [productSearchQuery, setProductSearchQuery] = useState('');

    // Save & Campaign Link states
    const [isSavedToDesigns, setIsSavedToDesigns] = useState(false);
    const [isSavingDesign, setIsSavingDesign] = useState(false);
    const [savedDesign, setSavedDesign] = useState<any>(null);
    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
    const [campaignModalTab, setCampaignModalTab] = useState<'existing' | 'new'>('existing');
    const [selectedExistingCampaignId, setSelectedExistingCampaignId] = useState<string>('');
    const [isAttachingCampaign, setIsAttachingCampaign] = useState(false);
    const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
    const [isCampaignCreated, setIsCampaignCreated] = useState(false);
    const [campaignFormData, setCampaignFormData] = useState({ name: '', event_id: '', start_date: '', end_date: '' });
    const [campaignFormErrors, setCampaignFormErrors] = useState<Record<string, string>>({});

    // Full-screen viewer for generated visual
    const [isPreviewFullViewOpen, setIsPreviewFullViewOpen] = useState(false);
    const [isFullViewDetailsExpanded, setIsFullViewDetailsExpanded] = useState(false);

    // Unsaved navigation warning modal
    const [isUnsavedExitModalOpen, setIsUnsavedExitModalOpen] = useState(false);
    const [pendingNavigationUrl, setPendingNavigationUrl] = useState<string | null>(null);
    const [navigatingConfirmed, setNavigatingConfirmed] = useState(false);

    // Edit and Regenerate confirmation modals
    const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
    const [isRegenerateConfirmOpen, setIsRegenerateConfirmOpen] = useState(false);

    // Selected event object
    const selectedEvent = useMemo(
        () => events.find((e: EventItem) => String(e.id) === String(form.event_id)) || null,
        [events, form.event_id],
    );

    // Active target campaign object
    const activeCampaign = useMemo(() => {
        if (!form.campaign_id) return initialCampaign || null;
        return campaigns.find((c: any) => String(c.id) === String(form.campaign_id)) || initialCampaign || null;
    }, [campaigns, form.campaign_id, initialCampaign]);

    // Set URL query params on load
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const campaignIdParam = params.get('campaign_id') || params.get('campaign');
            const eventIdParam = params.get('event_id') || params.get('event');
            const productParam = params.get('product_name') || params.get('product');

            if (campaignIdParam && !form.campaign_id) {
                setForm((prev) => ({ ...prev, campaign_id: campaignIdParam }));
            }
            if (eventIdParam && !form.event_id) {
                setForm((prev) => ({ ...prev, event_id: eventIdParam }));
            }
            if (productParam && !form.product_name) {
                setForm((prev) => ({ ...prev, product_name: productParam }));
            }
        }
    }, []);

    // Unsaved navigation blocker
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (generationState === 'ready' && !isSavedToDesigns) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [generationState, isSavedToDesigns]);

    useEffect(() => {
        const removeListener = router.on('before', (event: any) => {
            if (generationState === 'ready' && !isSavedToDesigns && !navigatingConfirmed) {
                event.preventDefault();
                setPendingNavigationUrl(event.detail.visit.url);
                setIsUnsavedExitModalOpen(true);
            }
        });
        return () => removeListener();
    }, [generationState, isSavedToDesigns, navigatingConfirmed]);

    // Generate dynamic non-repeating image prompt
    const generateNewPrompt = (targetEvent = selectedEvent, targetProductName = form.product_name) => {
        if (!targetEvent && !form.event_id) {
            toast.info('Please select a holiday or marketing event first to generate a tailored visual prompt.');
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
        toast.success('Generated creative prompt concept!');
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
        const eventType = (selectedEvent?.type || 'holiday').toLowerCase();
        const bank = eventStyleBanks[eventType] || eventStyleBanks.holiday;

        let nextIdx = (lastStyleSuggestionIndex + 1) % bank.length;
        setLastStyleSuggestionIndex(nextIdx);

        const chosen = bank[nextIdx];
        setForm((prev) => ({
            ...prev,
            content_style: chosen.styles,
            brand_tone: chosen.tones,
        }));

        toast.success(
            selectedEvent
                ? `Applied style combination #${nextIdx + 1} for ${selectedEvent.name}!`
                : 'Applied recommended styles & tones!',
        );
    };

    // Tagline generator
    const generateTagline = () => {
        const eventWord = selectedEvent?.name?.replace(/\s+\(.*?\)/g, '') || 'Special Moment';
        const templates = [
            `${eventWord} made memorable.`,
            `Celebrate ${eventWord} with style.`,
            `${eventWord} deserves the spotlight.`,
            `Turn ${eventWord} into a story worth sharing.`,
            `Make ${eventWord} truly unforgettable.`,
            `Elevate your ${eventWord} experience.`,
        ];
        const random = templates[Math.floor(Math.random() * templates.length)];
        setForm((prev) => ({ ...prev, tagline_mode: 'ai', tagline: random }));
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
            product_name: prev.product_name.trim() === '' ? prod.name : prev.product_name,
            price: prod.price ? String(prod.price).replace(/[^0-9.]/g, '').replace(/\.0+$/, '').replace(/(\.[0-9]*[1-9])0+$/, '$1') : prev.price,
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

    // Generation Flow - Real Gemini Generator
    const generateMarketingImage = async () => {
        if (!form.product_name.trim() || !form.image_prompt.trim()) {
            toast.error('Please provide a product name and image prompt.');
            return;
        }

        setGenerationState('generating');
        setGenerationProgress(20);

        const progressTimer = window.setInterval(() => {
            setGenerationProgress((prev) => (prev < 90 ? prev + 15 : prev));
        }, 800);

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
            if (form.event_id) formData.append('event_id', String(form.event_id));
            if (form.product_id) formData.append('product_id', String(form.product_id));
            if (form.campaign_id) formData.append('campaign_id', String(form.campaign_id));
            if (form.aspect_ratio) formData.append('aspect_ratio', form.aspect_ratio);
            formData.append('tagline_mode', form.tagline_mode || 'ai');
            if (form.tagline_mode !== 'none' && form.tagline) {
                formData.append('tagline', form.tagline);
            }
            if (form.include_logo) formData.append('include_logo', '1');
            if (form.reference_image) {
                formData.append('reference_image', form.reference_image);
            }
            form.content_style.forEach((style) => formData.append('content_style[]', style));
            form.brand_tone.forEach((tone) => formData.append('brand_tone[]', tone));

            const response = await fetch('/designs', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
                },
                body: formData,
            });

            const data = await response.json().catch(() => null);

            window.clearInterval(progressTimer);
            setGenerationProgress(100);

            if (!response.ok) {
                const errorMsg = data?.message || (data?.errors ? Object.values(data.errors).flat().join(', ') : 'Failed to generate visual');
                throw new Error(errorMsg);
            }

            setSavedDesign(data.design);
            setIsSavedToDesigns(true);
            window.setTimeout(() => {
                setGenerationState('ready');
            }, 300);
            toast.success('Generated marketing visual with Gemini AI!');
        } catch (err: any) {
            window.clearInterval(progressTimer);
            setGenerationState('idle');
            console.error(err);
            toast.error(err.message || 'Generation failed. Please try again.');
        }
    };

    // Save to designs backend
    const saveToDesigns = async (targetCampaignId?: string) => {
        if (isSavingDesign) return;
        if (isSavedToDesigns && savedDesign) {
            toast.info('Design is already saved in My Designs.');
            return savedDesign;
        }

        setIsSavingDesign(true);
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
            if (form.event_id) formData.append('event_id', String(form.event_id));
            if (form.product_id) formData.append('product_id', String(form.product_id));
            if (targetCampaignId) formData.append('campaign_id', String(targetCampaignId));
            if (form.aspect_ratio) formData.append('aspect_ratio', form.aspect_ratio);
            formData.append('tagline_mode', form.tagline_mode || 'ai');
            if (form.tagline_mode !== 'none' && form.tagline) {
                formData.append('tagline', form.tagline);
            }
            if (form.include_logo) formData.append('include_logo', '1');
            if (form.reference_image) {
                formData.append('reference_image', form.reference_image);
            }
            form.content_style.forEach((style) => formData.append('content_style[]', style));
            form.brand_tone.forEach((tone) => formData.append('brand_tone[]', tone));

            const response = await fetch('/designs', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
                },
                body: formData,
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                const errorMsg = data?.message || (data?.errors ? Object.values(data.errors).flat().join(', ') : 'Failed to save design');
                throw new Error(errorMsg);
            }

            setSavedDesign(data.design);
            setIsSavedToDesigns(true);
            toast.success('Design saved to My Designs!');
            return data.design;
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Unable to save design. Please try again.');
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
            const targetCampaign = campaigns.find((c: any) => String(c.id) === String(selectedExistingCampaignId));
            setForm((prev) => ({ ...prev, campaign_id: String(selectedExistingCampaignId) }));

            if (isSavedToDesigns && savedDesign?.id) {
                const res = await fetch(`/designs/${savedDesign.id}/attach-campaign`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
                    },
                    body: JSON.stringify({ campaign_id: selectedExistingCampaignId }),
                });

                if (!res.ok) {
                    const data = await res.json().catch(() => null);
                    throw new Error(data?.message || 'Failed to attach to campaign');
                }
            } else if (generationState === 'ready') {
                await saveToDesigns(selectedExistingCampaignId);
            }

            setIsCampaignModalOpen(false);
            toast.success(`Linked to campaign "${targetCampaign?.name || 'Campaign'}"!`);
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
                start_date: campaignFormData.start_date || new Date().toISOString().split('T')[0],
                end_date: campaignFormData.end_date || campaignFormData.start_date || new Date().toISOString().split('T')[0],
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
                    'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                const errorMsg = data?.message || (data?.errors ? Object.values(data.errors).flat().join(', ') : 'Failed to create campaign');
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
        downloadVisualAsFormat(targetUrl, form.product_name || 'marketing-visual', format);
    };

    // Step Validation
    const stepOneValid = form.product_name.trim().length > 0 && form.image_prompt.trim().length > 0;
    const canGenerate = stepOneValid;

    // Filter events in event modal
    const availableYears = useMemo(() => {
        const years = new Set<string>();
        const curYr = new Date().getFullYear();
        years.add(String(curYr));
        years.add(String(curYr + 1));
        events.forEach((ev: EventItem) => {
            if (ev.date) years.add(ev.date.slice(0, 4));
        });
        return Array.from(years).sort();
    }, [events]);

    const filteredEvents = useMemo(() => {
        return events.filter((ev: EventItem) => {
            if (selectedYearTab !== 'all' && ev.date) {
                if (ev.date.slice(0, 4) !== selectedYearTab) return false;
            }
            if (eventCategoryFilter !== 'all') {
                if (eventCategoryFilter === 'long_weekend') {
                    if (!ev.is_long_weekend) return false;
                } else if (eventCategoryFilter === 'regular') {
                    if (ev.category !== 'regular' && ev.type !== 'holiday') return false;
                } else if (eventCategoryFilter === 'special_non_working') {
                    if (ev.category !== 'special_non_working') return false;
                } else if (eventCategoryFilter === 'special_working') {
                    if (ev.category !== 'special_working') return false;
                } else if (eventCategoryFilter === 'islamic') {
                    if (ev.category !== 'islamic') return false;
                } else if (eventCategoryFilter === 'commercial') {
                    if (ev.type !== 'commercial' && ev.category !== 'commercial') return false;
                } else if (eventCategoryFilter === 'custom') {
                    if (ev.type !== 'custom' && ev.category !== 'custom') return false;
                } else if (ev.type !== eventCategoryFilter && ev.category !== eventCategoryFilter) {
                    return false;
                }
            }
            if (eventSearchQuery.trim()) {
                const query = eventSearchQuery.toLowerCase();
                return (
                    ev.name.toLowerCase().includes(query) ||
                    (ev.type && ev.type.toLowerCase().includes(query)) ||
                    (ev.category && ev.category.toLowerCase().includes(query)) ||
                    (ev.proclamation_no && ev.proclamation_no.toLowerCase().includes(query))
                );
            }
            return true;
        });
    }, [events, selectedYearTab, eventCategoryFilter, eventSearchQuery]);

    const filteredProducts = useMemo(() => {
        if (!productSearchQuery.trim()) return products;
        const q = productSearchQuery.toLowerCase();
        return products.filter((p: ProductItem) => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)));
    }, [products, productSearchQuery]);

    return (
        <>
            <Head title="AI Marketing Studio" />

            <div className="min-h-screen bg-background text-foreground pb-20">
                <div className="space-y-6 p-4 md:p-6 lg:p-8">

                    {/* =====================================================
                        PAGE HEADER
                    ====================================================== */}

                    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Sparkles className="h-4 w-4" />
                                </div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Creative Marketing Engine
                                </p>
                            </div>

                            <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight">
                                AI Marketing Studio
                            </h1>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Generate campaign-ready visuals tailored to holidays, promotions, and product launches.
                            </p>
                        </div>
                    </section>

                    {/* Active Campaign Banner */}
                    {activeCampaign && (
                        <div className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/5 p-4 text-xs animate-in fade-in duration-200">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <Layers className="h-4 w-4" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-foreground">
                                            Campaign: {activeCampaign.name}
                                        </p>
                                        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 font-semibold">
                                            Auto-Linked
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Visual creative will be automatically organized under this marketing campaign.
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setForm((prev) => ({ ...prev, campaign_id: '' }))}
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
                                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            Creative Generation
                                        </p>
                                        <h2 className="mt-1 text-lg font-bold">
                                            {generationState === 'generating' ? 'Synthesizing Visual Creative...' : 'Visual Creative Ready'}
                                        </h2>
                                    </div>
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <Sparkles className="h-4 w-4" />
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-5 md:p-7 space-y-6">
                                {generationState === 'generating' ? (
                                    <div className="space-y-6 py-12 text-center">
                                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5">
                                            <Sparkles className="h-8 w-8 animate-pulse text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">Composing your marketing visual</p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Applying {form.aspect_ratio || '1:1'} canvas, lighting balance, and seasonal elements.
                                            </p>
                                        </div>
                                        <div className="mx-auto max-w-md">
                                            <div className="mb-2 flex justify-between text-xs text-muted-foreground font-medium">
                                                <span>Rendering</span>
                                                <span>{generationProgress}%</span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className="h-full rounded-full bg-primary transition-all duration-300"
                                                    style={{ width: `${generationProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        {/* CLICKABLE GENERATED VISUAL */}
                                        <div
                                            onClick={() => {
                                                setIsPreviewFullViewOpen(true);
                                                setIsFullViewDetailsExpanded(false);
                                            }}
                                            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:border-primary/50 transition-all"
                                        >
                                            <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2.5 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                                    <span className="font-semibold">{form.product_name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-[10px] font-mono">
                                                        {form.aspect_ratio || '1:1'}
                                                    </Badge>
                                                    {isSavedToDesigns && (
                                                        <Badge variant="secondary" className="text-[10px]">
                                                            Saved
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Generated Visual Canvas - Real Gemini Image */}
                                            <div className="flex items-center justify-center p-3 sm:p-4 bg-muted/20 min-h-[360px] overflow-hidden rounded-2xl">
                                                {savedDesign?.image_url ? (
                                                    <div className="relative flex items-center justify-center max-h-[520px] w-full overflow-hidden rounded-2xl shadow-lg border border-border/50 bg-background/50">
                                                        <img
                                                            src={savedDesign.image_url}
                                                            alt={form.product_name}
                                                            className="max-h-[500px] w-auto max-w-full object-contain rounded-xl transition-transform duration-300 group-hover:scale-[1.01]"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
                                                            <span className="text-xs font-semibold text-white bg-black/70 px-3.5 py-1.5 rounded-xl backdrop-blur-md shadow-md">
                                                                Click to view full size
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center space-y-3 max-w-md p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-2xl w-full">
                                                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary shadow-md">
                                                            <Sparkles className="h-6 w-6 text-primary" />
                                                        </div>
                                                        <h3 className="text-xl font-bold">{form.product_name}</h3>
                                                        {form.tagline && form.tagline_mode !== 'none' && (
                                                            <p className="text-xs text-slate-300 font-medium">"{form.tagline}"</p>
                                                        )}
                                                        {form.price && (
                                                            <p className="text-base font-bold text-sky-400">
                                                                ₱{Number(form.price).toLocaleString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status Alert */}
                                        <div className={`rounded-2xl border p-4 ${isSavedToDesigns ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-primary/20 bg-primary/5'}`}>
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2.5">
                                                    <Check className={`h-4 w-4 ${isSavedToDesigns ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'}`} />
                                                    <p className="text-xs font-semibold">
                                                        {isSavedToDesigns ? 'Visual successfully saved to My Designs' : 'Visual ready — save to keep in your library'}
                                                    </p>
                                                </div>
                                                {isSavedToDesigns && (
                                                    <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-emerald-600 dark:text-emerald-400">
                                                        <Link href="/designs">Open Designs →</Link>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Bar */}
                                        <div className="space-y-3">
                                            <div className="grid gap-2.5 sm:grid-cols-3">
                                                <Button
                                                    type="button"
                                                    onClick={() => saveToDesigns()}
                                                    disabled={isSavingDesign}
                                                    variant={isSavedToDesigns ? 'outline' : 'default'}
                                                    className="font-semibold text-xs h-10 shadow-sm"
                                                >
                                                    {isSavingDesign ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Check className="mr-2 h-4 w-4" />
                                                    )}
                                                    {isSavedToDesigns ? 'Saved in Designs' : 'Save to Designs'}
                                                </Button>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="text-xs h-10 shadow-none font-semibold gap-1.5"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                            Download Visual
                                                            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="center" className="w-52 rounded-2xl p-1.5 shadow-lg border-border">
                                                        <DropdownMenuItem
                                                            onClick={() => downloadImage('png')}
                                                            className="gap-2 text-xs font-medium cursor-pointer"
                                                        >
                                                            <Download className="h-3.5 w-3.5 text-primary" />
                                                            PNG (High Quality)
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => downloadImage('jpeg')}
                                                            className="gap-2 text-xs font-medium cursor-pointer"
                                                        >
                                                            <Download className="h-3.5 w-3.5 text-blue-500" />
                                                            JPEG (Web-Optimized)
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => downloadImage('svg')}
                                                            className="gap-2 text-xs font-medium cursor-pointer"
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
                                                        const defaultName = selectedEvent ? `${selectedEvent.name} Campaign` : `${form.product_name} Campaign`;
                                                        setCampaignFormData({
                                                            name: defaultName,
                                                            event_id: form.event_id || '',
                                                            start_date: selectedEvent?.date || new Date().toISOString().split('T')[0],
                                                            end_date: selectedEvent?.date || new Date().toISOString().split('T')[0],
                                                        });
                                                        setIsCampaignModalOpen(true);
                                                    }}
                                                    className="text-xs h-10 shadow-none font-semibold gap-1.5"
                                                >
                                                    <Layers className="h-4 w-4" />
                                                    Link to Campaign
                                                </Button>
                                            </div>

                                            {/* Sub actions */}
                                            <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setIsEditConfirmOpen(true)}
                                                    className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                                                >
                                                    <Edit3 className="h-3.5 w-3.5" />
                                                    Edit Parameters
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setIsRegenerateConfirmOpen(true)}
                                                    className="text-xs gap-1.5 text-primary hover:bg-primary/10"
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
                        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                            <Card className="overflow-hidden rounded-3xl border-border bg-card shadow-sm">
                                {/* STEP HEADER */}
                                <CardHeader className="border-b p-5 md:p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                Step {currentStep} of 3
                                            </p>
                                            <h2 className="mt-1 text-lg font-bold">
                                                {currentStep === 1
                                                    ? 'Product & Campaign Brief'
                                                    : currentStep === 2
                                                      ? 'Content Style & Brand Tone'
                                                      : 'Dimensions & Tagline'}
                                            </h2>
                                        </div>

                                        {/* Step indicator dots */}
                                        <div className="flex items-center gap-1.5">
                                            {[1, 2, 3].map((st) => (
                                                <button
                                                    key={st}
                                                    type="button"
                                                    onClick={() => {
                                                        if (st < currentStep || (st === 2 && stepOneValid) || (st === 3 && stepOneValid)) {
                                                            setCurrentStep(st as Step);
                                                        }
                                                    }}
                                                    className={`h-2 rounded-full transition-all ${
                                                        st === currentStep ? 'w-8 bg-primary' : st < currentStep ? 'w-3 bg-primary/40' : 'w-3 bg-muted'
                                                    }`}
                                                    aria-label={`Step ${st}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-5 md:p-7">
                                    {/* =====================================
                                        STEP 1: PRODUCT, EVENT & PROMPT
                                    ====================================== */}
                                    {currentStep === 1 && (
                                        <div className="space-y-5 animate-in fade-in duration-200">
                                            {/* Product Name */}
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-1">
                                                    <Label htmlFor="product_name" className="text-xs font-semibold">
                                                        Product / Service Name *
                                                    </Label>
                                                    <HelpTooltip text="Enter the name of the product, service, or offering to be showcased in your marketing visual." />
                                                </div>
                                                <Input
                                                    id="product_name"
                                                    value={form.product_name}
                                                    onChange={(e) => setForm({ ...form, product_name: e.target.value })}
                                                    placeholder="e.g. Artisanal Espresso Beans, Summer Silk Dress"
                                                    className="h-10 text-xs"
                                                    required
                                                />
                                            </div>

                                            {/* Event Selector Display */}
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-1">
                                                    <Label className="text-xs font-semibold">
                                                        Selected Holiday or Marketing Event (Optional)
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
                                                                        {selectedEvent.name}
                                                                    </p>
                                                                    <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${eventTypeStyles[selectedEvent.type || 'holiday']?.bg} ${eventTypeStyles[selectedEvent.type || 'holiday']?.text} ${eventTypeStyles[selectedEvent.type || 'holiday']?.border}`}>
                                                                        {eventTypeStyles[selectedEvent.type || 'holiday']?.label || 'Event'}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                                    {formatEventDateLabel(selectedEvent.date)}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1.5">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setEventModalOpen(true)}
                                                                className="h-8 text-xs shadow-none"
                                                            >
                                                                Change
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => setForm({ ...form, event_id: '' })}
                                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => setEventModalOpen(true)}
                                                        className="flex h-11 w-full items-center justify-between rounded-xl border border-dashed border-border bg-muted/20 px-4 text-xs font-medium text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-foreground transition-all"
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-primary" />
                                                            Choose a retail event, season, or holiday...
                                                        </span>
                                                        <span className="font-semibold text-primary">Browse Events →</span>
                                                    </button>
                                                )}
                                            </div>

                                            {/* Automatic Visual Prompt Generator */}
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1">
                                                        <Label htmlFor="image_prompt" className="text-xs font-semibold">
                                                            Visual Prompt & Scene Concept *
                                                        </Label>
                                                        <HelpTooltip text="Detailed creative prompt describing product staging, backdrop, festive accents, lighting, and textures." />
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => generateNewPrompt()}
                                                        className="h-7 gap-1 text-[11px] font-semibold text-primary hover:bg-primary/10"
                                                    >
                                                        <Sparkles className="h-3 w-3" />
                                                        {form.image_prompt.trim() ? 'Suggest Different Angle' : 'Generate Visual Prompt'}
                                                    </Button>
                                                </div>

                                                <Textarea
                                                    id="image_prompt"
                                                    value={form.image_prompt}
                                                    onChange={(e) => setForm({ ...form, image_prompt: e.target.value })}
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
                                                        <Label htmlFor="price" className="text-xs font-semibold">
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
                                                            onChange={(e) => setForm({ ...form, price: e.target.value.replace(/\D/g, '') })}
                                                            placeholder="999"
                                                            className="border-0 shadow-none focus-visible:ring-0 text-xs"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-1">
                                                        <Label className="text-xs font-semibold">
                                                            Reference Product Photo (Optional)
                                                        </Label>
                                                        <HelpTooltip text="Upload an existing photo from your device or select an item from your catalog for visual reference." />
                                                    </div>
                                                    {referenceImagePreview ? (
                                                        <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-2 px-3">
                                                            <div className="flex items-center gap-2">
                                                                <img src={referenceImagePreview} alt="Ref" className="h-7 w-7 rounded-lg object-cover" />
                                                                <span className="truncate text-xs font-medium">{selectedProduct?.name || 'Photo Ready'}</span>
                                                            </div>
                                                            <button type="button" onClick={handleClearReferenceImage} className="text-xs text-muted-foreground hover:text-destructive">
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-2">
                                                            <input ref={desktopFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleDesktopFile} />
                                                            <Button type="button" variant="outline" size="sm" onClick={() => desktopFileInputRef.current?.click()} className="flex-1 text-xs shadow-none">
                                                                <Upload className="mr-1 h-3.5 w-3.5" /> Upload File
                                                            </Button>
                                                            <Button type="button" variant="outline" size="sm" onClick={() => setIsProductModalOpen(true)} className="flex-1 text-xs shadow-none">
                                                                <Package className="mr-1 h-3.5 w-3.5" /> From Catalog
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* =====================================
                                        STEP 2: CONTENT STYLE & BRAND TONE
                                    ====================================== */}
                                    {currentStep === 2 && (
                                        <div className="space-y-6 animate-in fade-in duration-200">
                                            {/* Dynamic Style Suggestions Toolbar */}
                                            <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 p-4">
                                                <div>
                                                    <p className="text-xs font-semibold text-primary">
                                                        Smart Style Tailoring
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {selectedEvent ? `Curated presets tailored for ${selectedEvent.name}` : 'Recommended creative combinations'}
                                                    </p>
                                                </div>

                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={applyDynamicSuggestions}
                                                    className="gap-1.5 text-xs shadow-none font-semibold"
                                                >
                                                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                                                    {form.content_style.length > 0 ? 'Shuffle Suggestions' : 'Use Suggestions'}
                                                </Button>
                                            </div>

                                            {/* Visual Theme Pills */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1">
                                                        <Label className="text-xs font-semibold">Visual Theme (Pick up to 3)</Label>
                                                        <HelpTooltip text="Art direction and photography aesthetics (e.g. Lifestyle, Minimal, Storytelling, Editorial)." />
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">{form.content_style.length} / 3</span>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {contentStyleOptions.map((style) => {
                                                        const active = form.content_style.includes(style);
                                                        const disabled = !active && form.content_style.length >= 3;

                                                        return (
                                                            <button
                                                                key={style}
                                                                type="button"
                                                                disabled={disabled}
                                                                onClick={() => {
                                                                    if (active) {
                                                                        setForm({ ...form, content_style: form.content_style.filter((s) => s !== style) });
                                                                    } else if (form.content_style.length < 3) {
                                                                        setForm({ ...form, content_style: [...form.content_style, style] });
                                                                    }
                                                                }}
                                                                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                                                                    active
                                                                        ? 'border-primary bg-primary text-primary-foreground font-semibold shadow-xs'
                                                                        : disabled
                                                                          ? 'opacity-40 cursor-not-allowed border-border bg-muted/20'
                                                                          : 'border-border bg-background hover:border-primary/40 hover:bg-muted/40'
                                                                }`}
                                                            >
                                                                {active && <Check className="mr-1 inline h-3 w-3" />}
                                                                {style}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Brand Tone Pills */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1">
                                                        <Label className="text-xs font-semibold">Brand Tone (Pick up to 3)</Label>
                                                        <HelpTooltip text="Brand emotional vibe and atmosphere (e.g. Luxury, Warm, Bold, Modern) to guide lighting and tone." />
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">{form.brand_tone.length} / 3</span>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {toneOptions.map((tone) => {
                                                        const active = form.brand_tone.includes(tone);
                                                        const disabled = !active && form.brand_tone.length >= 3;

                                                        return (
                                                            <button
                                                                key={tone}
                                                                type="button"
                                                                disabled={disabled}
                                                                onClick={() => {
                                                                    if (active) {
                                                                        setForm({ ...form, brand_tone: form.brand_tone.filter((t) => t !== tone) });
                                                                    } else if (form.brand_tone.length < 3) {
                                                                        setForm({ ...form, brand_tone: [...form.brand_tone, tone] });
                                                                    }
                                                                }}
                                                                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                                                                    active
                                                                        ? 'border-primary bg-primary text-primary-foreground font-semibold shadow-xs'
                                                                        : disabled
                                                                          ? 'opacity-40 cursor-not-allowed border-border bg-muted/20'
                                                                          : 'border-border bg-background hover:border-primary/40 hover:bg-muted/40'
                                                                }`}
                                                            >
                                                                {active && <Check className="mr-1 inline h-3 w-3" />}
                                                                {tone}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* =====================================
                                        STEP 3: DIMENSIONS & TAGLINE
                                    ====================================== */}
                                    {currentStep === 3 && (
                                        <div className="space-y-6 animate-in fade-in duration-200">
                                            {/* Aspect Ratio Selector */}
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-1">
                                                    <Label className="text-xs font-semibold">Aspect Ratio & Canvas Dimensions</Label>
                                                    <HelpTooltip text="Proportions tailored for Instagram feed posts (1:1), Stories/Reels (9:16), or Facebook covers (16:9)." />
                                                </div>
                                                <div className="grid gap-2.5 sm:grid-cols-3">
                                                    {aspectRatioOptions.map((opt) => {
                                                        const active = form.aspect_ratio === opt.value;
                                                        return (
                                                            <button
                                                                key={opt.value}
                                                                type="button"
                                                                onClick={() => setForm({ ...form, aspect_ratio: opt.value })}
                                                                className={`flex flex-col items-start justify-between rounded-2xl border p-3 text-left transition-all ${
                                                                    active
                                                                        ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40'
                                                                        : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
                                                                }`}
                                                            >
                                                                <div className="flex w-full items-center justify-between">
                                                                    <span className="text-xs font-bold text-foreground">{opt.label}</span>
                                                                    <span className="text-[10px] font-mono text-muted-foreground">{opt.badge}</span>
                                                                </div>
                                                                <p className="mt-1 text-[11px] text-muted-foreground">{opt.description}</p>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Tagline Generator */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1">
                                                        <Label className="text-xs font-semibold">Marketing Tagline</Label>
                                                        <HelpTooltip text="An optional campaign slogan or promotional catchphrase placed on or tailored for the visual." />
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={generateTagline}
                                                        className="h-7 text-[11px] gap-1 text-primary hover:bg-primary/10"
                                                    >
                                                        <Sparkles className="h-3 w-3" />
                                                        Generate Tagline
                                                    </Button>
                                                </div>

                                                <Input
                                                    value={form.tagline}
                                                    onChange={(e) => setForm({ ...form, tagline: e.target.value, tagline_mode: 'manual' })}
                                                    placeholder="e.g. Elevate Your Every Day with Pure Flavor"
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
                                            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1) as Step)}
                                            disabled={currentStep === 1}
                                            className="gap-2 text-xs font-semibold shadow-none"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            Back
                                        </Button>

                                        {currentStep < 3 ? (
                                            <Button
                                                type="button"
                                                onClick={() => setCurrentStep((prev) => Math.min(3, prev + 1) as Step)}
                                                disabled={currentStep === 1 && !stepOneValid}
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
                                                className="gap-2 text-xs font-semibold shadow-sm"
                                            >
                                                <Sparkles className="h-4 w-4" />
                                                Generate Visual Creative
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* RIGHT COLUMN SUMMARY CARD */}
                            <Card className="rounded-3xl border-border bg-card p-5 shadow-sm space-y-4 lg:sticky lg:top-24 lg:self-start">
                                <CardHeader className="p-0 pb-3 border-b border-border/60">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                        Brief Summary
                                    </CardTitle>
                                </CardHeader>

                                <div className="space-y-3 text-xs">
                                    <div className="flex justify-between gap-2">
                                        <span className="text-muted-foreground">Product</span>
                                        <span className="font-semibold text-right truncate max-w-[170px]">{form.product_name || '—'}</span>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <span className="text-muted-foreground">Event</span>
                                        <span className="font-semibold text-right truncate max-w-[170px]">{selectedEvent?.name || 'None'}</span>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <span className="text-muted-foreground">Price</span>
                                        <span className="font-semibold text-right">{form.price ? `₱${Number(form.price).toLocaleString()}` : '—'}</span>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <span className="text-muted-foreground">Themes</span>
                                        <span className="font-semibold text-right truncate max-w-[170px]">{form.content_style.join(', ') || 'Default'}</span>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <span className="text-muted-foreground">Tones</span>
                                        <span className="font-semibold text-right truncate max-w-[170px]">{form.brand_tone.join(', ') || 'Default'}</span>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <span className="text-muted-foreground">Dimensions</span>
                                        <span className="font-semibold text-right">{form.aspect_ratio || '1:1 Square'}</span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>

            {/* =============================================================
                REDESIGNED & RESTRUCTURED EVENT SELECTION MODAL
            ============================================================= */}

            {/* =============================================================
                REDESIGNED & RESTRUCTURED EVENT SELECTION MODAL (LARGER & CLEAN)
            ============================================================= */}

            <Dialog open={eventModalOpen} onOpenChange={setEventModalOpen}>
                <DialogContent className="max-h-[85vh] flex flex-col overflow-hidden rounded-3xl p-0 sm:max-w-4xl border-border bg-card shadow-2xl">
                    <DialogHeader className="border-b border-border p-4 sm:p-5 bg-muted/20 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                                <CalendarDays className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg sm:text-xl font-bold text-foreground">
                                    Select Marketing Event or Holiday
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                    Choose an event or holiday to tailor your visual concept, seasonal theme, and promotion.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Filter & Year Toolbar */}
                    <div className="border-b border-border p-4 space-y-3 bg-muted/10 shrink-0">
                        {/* Year Pills & Global Selector */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                            <span className="text-xs font-semibold text-muted-foreground mr-1 shrink-0">Year:</span>
                            {availableYears.map((yr) => (
                                <button
                                    key={yr}
                                    type="button"
                                    onClick={() => setSelectedYearTab(yr)}
                                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all shrink-0 ${
                                        selectedYearTab === yr ? 'bg-primary text-primary-foreground shadow-xs font-semibold' : 'bg-card text-muted-foreground hover:text-foreground border border-border/70'
                                    }`}
                                >
                                    {yr}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => setSelectedYearTab('all')}
                                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all shrink-0 ${
                                    selectedYearTab === 'all' ? 'bg-primary text-primary-foreground shadow-xs font-semibold' : 'bg-card text-muted-foreground hover:text-foreground border border-border/70'
                                }`}
                            >
                                All Years
                            </button>
                        </div>

                        {/* Search & Category Tabs */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={eventSearchQuery}
                                    onChange={(e) => setEventSearchQuery(e.target.value)}
                                    placeholder="Search events, holidays, sale dates, proclamations..."
                                    className="h-9 pl-9 text-xs bg-card"
                                />
                            </div>

                            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                                {[
                                    { id: 'all', label: 'All' },
                                    { id: 'regular', label: 'Regular' },
                                    { id: 'special_non_working', label: 'Non-Working' },
                                    { id: 'special_working', label: 'Working' },
                                    { id: 'islamic', label: 'Islamic' },
                                    { id: 'long_weekend', label: 'Long Weekends' },
                                    { id: 'commercial', label: 'Sales' },
                                    { id: 'custom', label: 'Custom' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setEventCategoryFilter(tab.id)}
                                        className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all shrink-0 ${
                                            eventCategoryFilter === tab.id
                                                ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                                                : 'bg-card text-muted-foreground hover:text-foreground border border-border/60'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Events List Grid */}
                    <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-5">
                        {filteredEvents.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground space-y-2">
                                <CalendarDays className="mx-auto h-8 w-8 opacity-30" />
                                <p className="text-sm font-semibold text-foreground">No events found matching your filter</p>
                                <p className="text-xs text-muted-foreground">Try clearing search keywords or selecting "All" categories.</p>
                            </div>
                        ) : (
                            <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                                {filteredEvents.map((evt: EventItem) => {
                                    const isSelected = String(evt.id) === String(form.event_id);
                                    const styleKey = evt.category || evt.type || 'holiday';
                                    const style = eventTypeStyles[styleKey] || eventTypeStyles.holiday;

                                    return (
                                        <button
                                            key={evt.id}
                                            type="button"
                                            onClick={() => handleSelectEvent(evt)}
                                            className={`group flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                                                isSelected
                                                    ? 'border-primary bg-primary/10 ring-2 ring-primary/40 shadow-xs'
                                                    : 'border-border bg-card hover:border-primary/50 hover:bg-muted/30'
                                            }`}
                                        >
                                            <div className="space-y-1.5">
                                                <div className="flex items-start justify-between gap-1.5">
                                                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                                        {evt.name}
                                                    </span>
                                                    <Badge variant="outline" className={`text-[9px] uppercase tracking-wider shrink-0 font-medium ${style.bg} ${style.text} ${style.border}`}>
                                                        {style.label}
                                                    </Badge>
                                                </div>

                                                {evt.is_long_weekend && (
                                                    <Badge variant="secondary" className="text-[9px] font-medium py-0">
                                                        Long Weekend
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                                                <span className="font-medium text-[11px]">{formatEventDateLabel(evt.date)}</span>
                                                {isSelected ? (
                                                    <span className="font-bold text-primary text-xs">Selected ✓</span>
                                                ) : (
                                                    <span className="text-[11px] font-medium group-hover:text-foreground transition-colors">Select</span>
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

            <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
                <DialogContent className="max-h-[85vh] overflow-hidden rounded-3xl p-0 sm:max-w-xl">
                    <DialogHeader className="border-b p-5 pb-4 bg-muted/20">
                        <DialogTitle className="text-lg font-bold flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            Select Catalog Product
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Use this product photo and pricing for your marketing design.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="border-b p-4 bg-muted/10">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={productSearchQuery}
                                onChange={(e) => setProductSearchQuery(e.target.value)}
                                placeholder="Search products..."
                                className="h-9 pl-9 text-xs"
                            />
                        </div>
                    </div>

                    <div className="max-h-[380px] min-h-[200px] overflow-y-auto p-4">
                        {filteredProducts.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">
                                <Package className="mx-auto h-8 w-8 opacity-40" />
                                <p className="mt-2 text-xs font-medium">No products found</p>
                            </div>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {filteredProducts.map((prod: ProductItem) => (
                                    <button
                                        key={prod.id}
                                        type="button"
                                        onClick={() => handleSelectProduct(prod)}
                                        className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-left hover:border-primary/40 transition-all"
                                    >
                                        <div className="h-28 w-full bg-muted/40 flex items-center justify-center overflow-hidden border-b border-border/40">
                                            {prod.image_url ? (
                                                <img src={prod.image_url} alt={prod.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                            ) : (
                                                <Package className="h-8 w-8 opacity-40" />
                                            )}
                                        </div>
                                        <div className="p-3">
                                            <p className="text-xs font-bold text-foreground truncate">{prod.name}</p>
                                            {prod.price && <p className="text-[11px] font-bold text-emerald-500 mt-0.5">₱{Number(prod.price).toLocaleString()}</p>}
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
                    className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/95 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-hidden"
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
                            <h2 className="max-w-[240px] sm:max-w-md truncate text-sm sm:text-base font-semibold text-white">
                                {form.product_name || 'Marketing Visual'}
                            </h2>
                            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-mono text-white">
                                {form.aspect_ratio || '1:1'}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="flex h-9 items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white px-3 text-xs font-semibold transition-all backdrop-blur-md"
                                        title="Download Image"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download
                                        <ChevronDown className="h-3 w-3 opacity-70" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 shadow-xl border-white/20 bg-black/90 text-white backdrop-blur-xl">
                                    <DropdownMenuItem
                                        onClick={() => downloadImage('png')}
                                        className="gap-2 text-xs font-medium cursor-pointer text-white hover:bg-white/20 focus:bg-white/20 focus:text-white"
                                    >
                                        <Download className="h-3.5 w-3.5 text-primary" />
                                        PNG (High Quality)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => downloadImage('jpeg')}
                                        className="gap-2 text-xs font-medium cursor-pointer text-white hover:bg-white/20 focus:bg-white/20 focus:text-white"
                                    >
                                        <Download className="h-3.5 w-3.5 text-blue-400" />
                                        JPEG (Web-Optimized)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => downloadImage('svg')}
                                        className="gap-2 text-xs font-medium cursor-pointer text-white hover:bg-white/20 focus:bg-white/20 focus:text-white"
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
                                className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 hover:bg-white/30 text-white transition-all backdrop-blur-md"
                                title="Close (Esc)"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Main Full View Canvas - Real Image */}
                    <div
                        className="relative flex h-full w-full flex-1 items-center justify-center p-4 sm:p-8 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {savedDesign?.image_url ? (
                            <img
                                src={savedDesign.image_url}
                                alt={form.product_name}
                                className={`max-h-[82vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl drop-shadow-2xl transition-all duration-300 ${
                                    isFullViewDetailsExpanded ? 'scale-90 -translate-y-6' : 'scale-100'
                                }`}
                            />
                        ) : (
                            <div
                                className={`flex flex-col items-center justify-center rounded-3xl border border-white/20 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-8 text-center text-white drop-shadow-2xl transition-all duration-300 ${
                                    isFullViewDetailsExpanded ? 'scale-90 -translate-y-8' : 'scale-100'
                                } ${
                                    form.aspect_ratio === '9:16'
                                        ? 'w-[320px] h-[570px]'
                                        : form.aspect_ratio === '16:9'
                                          ? 'w-[680px] h-[380px]'
                                          : form.aspect_ratio === '4:5'
                                            ? 'w-[400px] h-[500px]'
                                            : 'w-[480px] h-[480px]'
                                }`}
                            >
                                <Sparkles className="h-10 w-10 text-primary mb-3" />
                                <h3 className="text-2xl font-bold">{form.product_name}</h3>
                                {form.tagline && <p className="text-sm text-slate-300 mt-2">"{form.tagline}"</p>}
                                {form.price && <p className="text-xl font-bold text-sky-400 mt-3">₱{Number(form.price).toLocaleString()}</p>}
                            </div>
                        )}
                    </div>

                    {/* Bottom Fade-out Section with Toggle & Expandable Details */}
                    <div
                        className="relative z-50 flex w-full flex-col items-center justify-end bg-gradient-to-t from-black/95 via-black/75 to-transparent pt-12 pb-5 px-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setIsFullViewDetailsExpanded(!isFullViewDetailsExpanded)}
                            className="group flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-5 py-2 text-xs font-medium text-white/90 backdrop-blur-xl shadow-2xl transition-all hover:bg-black/80 hover:border-white/40 hover:text-white active:scale-95"
                            aria-expanded={isFullViewDetailsExpanded}
                        >
                            <span>{isFullViewDetailsExpanded ? 'Hide details' : 'View prompt & creative details'}</span>
                            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isFullViewDetailsExpanded ? 'rotate-180 text-primary' : 'text-white/70 animate-bounce'}`} />
                        </button>

                        {isFullViewDetailsExpanded && (
                            <div className="mt-4 w-full max-w-xl max-h-[38vh] overflow-y-auto space-y-4 rounded-2xl border border-white/15 bg-black/80 p-5 backdrop-blur-2xl shadow-2xl text-white animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-white/60">Creative Prompt</h4>
                                    <p className="mt-1 text-xs leading-relaxed text-white/90">{form.image_prompt}</p>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-white/10">
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => saveToDesigns()}
                                        disabled={isSavedToDesigns}
                                        className="gap-1.5 text-xs shadow-none"
                                    >
                                        <Check className="h-3.5 w-3.5" />
                                        {isSavedToDesigns ? 'Saved to Library' : 'Save to Library'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => downloadImage()}
                                        className="gap-1.5 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 shadow-none"
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

            <Dialog open={isUnsavedExitModalOpen} onOpenChange={setIsUnsavedExitModalOpen}>
                <DialogContent className="rounded-3xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-foreground">
                            Leave Without Saving?
                        </DialogTitle>
                        <DialogDescription className="text-xs leading-relaxed">
                            Your freshly generated visual asset is currently unsaved. If you navigate to another page now, this generated mockup will be lost.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="mt-6 flex-col sm:flex-row gap-2">
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

            <Dialog open={isEditConfirmOpen} onOpenChange={setIsEditConfirmOpen}>
                <DialogContent className="rounded-3xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">
                            Edit Creative Parameters?
                        </DialogTitle>
                        <DialogDescription className="text-xs leading-relaxed">
                            Returning to the design brief allows you to change prompts, events, and styling. Make sure you have saved your visual if you wish to keep it.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="mt-6 gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsEditConfirmOpen(false)}>
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

            <Dialog open={isRegenerateConfirmOpen} onOpenChange={setIsRegenerateConfirmOpen}>
                <DialogContent className="rounded-3xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">
                            Regenerate Visual Creative?
                        </DialogTitle>
                        <DialogDescription className="text-xs leading-relaxed">
                            This will create a brand new creative variation based on your current prompt.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="mt-6 gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsRegenerateConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
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

            <Dialog open={isCampaignModalOpen} onOpenChange={setIsCampaignModalOpen}>
                <DialogContent className="rounded-3xl sm:max-w-md border-border bg-card shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-5 pb-4 bg-muted/20 border-b border-border">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Layers className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-foreground">
                                    Link Design to Campaign
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                    Attach this creative visual to an active or scheduled campaign.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Tabs: Existing Campaign vs New Campaign */}
                    <div className="p-5 space-y-4">
                        <div className="flex items-center rounded-xl border border-border bg-muted/40 p-1 text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => setCampaignModalTab('existing')}
                                className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                                    campaignModalTab === 'existing'
                                        ? 'bg-card text-foreground shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Existing Campaign
                            </button>
                            <button
                                type="button"
                                onClick={() => setCampaignModalTab('new')}
                                className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
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
                                {campaigns.length === 0 ? (
                                    <div className="p-6 text-center text-muted-foreground rounded-2xl border border-dashed border-border bg-muted/20 space-y-2">
                                        <Layers className="mx-auto h-8 w-8 opacity-40" />
                                        <p className="text-xs font-semibold text-foreground">No campaigns created yet</p>
                                        <p className="text-[11px] text-muted-foreground">Switch to "Create New Campaign" to start one.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                                        {campaigns.map((c: any) => {
                                            const isSelected = String(c.id) === String(selectedExistingCampaignId);
                                            return (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    onClick={() => setSelectedExistingCampaignId(String(c.id))}
                                                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                                                        isSelected
                                                            ? 'border-primary bg-primary/10 ring-2 ring-primary/40 font-semibold'
                                                            : 'border-border bg-card hover:border-primary/40 hover:bg-muted/20'
                                                    }`}
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-bold text-foreground truncate">{c.name}</p>
                                                        <p className="text-[10px] text-muted-foreground capitalize mt-0.5">Status: {c.status || 'draft'}</p>
                                                    </div>
                                                    {isSelected && <Check className="h-4 w-4 text-primary shrink-0 ml-2" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                <DialogFooter className="pt-2 border-t border-border gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => setIsCampaignModalOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={!selectedExistingCampaignId || isAttachingCampaign || campaigns.length === 0}
                                        onClick={handleAttachExistingCampaign}
                                        className="gap-1.5"
                                    >
                                        {isAttachingCampaign ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                        Link to Selected Campaign
                                    </Button>
                                </DialogFooter>
                            </div>
                        ) : (
                            <form onSubmit={handleCreateAndLinkCampaign} className="space-y-3.5">
                                <div className="space-y-1">
                                    <Label htmlFor="campaign_name" className="text-xs font-semibold">Campaign Name *</Label>
                                    <Input
                                        id="campaign_name"
                                        value={campaignFormData.name}
                                        onChange={(e) => setCampaignFormData({ ...campaignFormData, name: e.target.value })}
                                        placeholder="e.g. Mid-Year Mega Sale Campaign"
                                        className="h-9 text-xs"
                                        required
                                    />
                                    {campaignFormErrors.name && (
                                        <p className="text-[11px] text-destructive font-medium">{campaignFormErrors.name}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="start_date" className="text-[11px] font-semibold">Start Date</Label>
                                        <Input
                                            id="start_date"
                                            type="date"
                                            value={campaignFormData.start_date}
                                            onChange={(e) => setCampaignFormData({ ...campaignFormData, start_date: e.target.value })}
                                            className="h-9 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="end_date" className="text-[11px] font-semibold">End Date</Label>
                                        <Input
                                            id="end_date"
                                            type="date"
                                            value={campaignFormData.end_date}
                                            onChange={(e) => setCampaignFormData({ ...campaignFormData, end_date: e.target.value })}
                                            className="h-9 text-xs"
                                        />
                                    </div>
                                </div>

                                <DialogFooter className="pt-3 border-t border-border gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => setIsCampaignModalOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={isCreatingCampaign || !campaignFormData.name.trim()}
                                        className="gap-1.5"
                                    >
                                        {isCreatingCampaign ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                                        Create & Link Campaign
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
