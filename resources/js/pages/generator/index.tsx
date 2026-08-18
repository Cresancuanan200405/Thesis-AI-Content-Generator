import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    BookmarkCheck,
    BookmarkPlus,
    Building2,
    Calendar,
    CalendarDays,
    Check,
    ExternalLink,
    FolderPlus,
    ImagePlus,
    Link as LinkIcon,
    Loader2,
    Plus,
    RefreshCcw,
    Search,
    Sparkles,
    Tag,
    Upload,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

/* ==========================================================================
   TYPES
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
}

interface GeneratorForm {
    product_name: string;
    image_prompt: string;
    price: string;
    event_id: string;

    content_style: string[];
    brand_tone: string[];

    tagline_mode: TaglineMode;
    tagline: string;

    reference_image: File | null;
    include_logo: boolean;
}

/* ==========================================================================
   OPTIONS
========================================================================== */

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
    'Premium',
];

const taglineOptions: {
    value: TaglineMode;
    label: string;
    description: string;
}[] = [
        {
            value: 'manual',
            label: 'Write my own',
            description: 'Use your exact text.',
        },
        {
            value: 'ai',
            label: 'Generate with AI',
            description: 'AI creates the tagline.',
        },
        {
            value: 'none',
            label: 'No tagline',
            description: 'No text overlay.',
        },
    ];

/* ==========================================================================
   HOLIDAY / EVENT SUGGESTIONS
========================================================================== */

interface EventSuggestion {
    styles: string[];
    tones: string[];
}

const eventSuggestions: Record<string, EventSuggestion> = {
    christmas: {
        styles: ['Seasonal', 'Lifestyle', 'Premium'],
        tones: ['Warm', 'Friendly', 'Elegant'],
    },

    'christmas day': {
        styles: ['Seasonal', 'Lifestyle', 'Premium'],
        tones: ['Warm', 'Friendly', 'Elegant'],
    },

    'valentine': {
        styles: ['Lifestyle', 'Premium', 'Storytelling'],
        tones: ['Warm', 'Elegant', 'Playful'],
    },

    'valentine day': {
        styles: ['Lifestyle', 'Premium', 'Storytelling'],
        tones: ['Warm', 'Elegant', 'Playful'],
    },

    'new year': {
        styles: ['Promotional', 'Premium', 'Editorial'],
        tones: ['Bold', 'Elegant', 'Modern'],
    },

    halloween: {
        styles: ['Seasonal', 'Storytelling', 'Social Media'],
        tones: ['Bold', 'Playful', 'Modern'],
    },

    'mother day': {
        styles: ['Lifestyle', 'Storytelling', 'Premium'],
        tones: ['Warm', 'Elegant', 'Friendly'],
    },

    'father day': {
        styles: ['Lifestyle', 'Promotional', 'Product-focused'],
        tones: ['Bold', 'Warm', 'Professional'],
    },

    'black friday': {
        styles: ['Promotional', 'Product-focused', 'Social Media'],
        tones: ['Bold', 'Modern', 'Professional'],
    },

    'labor day': {
        styles: ['Promotional', 'Lifestyle', 'Social Media'],
        tones: ['Bold', 'Friendly', 'Professional'],
    },

    easter: {
        styles: ['Seasonal', 'Lifestyle', 'Storytelling'],
        tones: ['Friendly', 'Warm', 'Playful'],
    },
};

/* ==========================================================================
   HELPERS
========================================================================== */

function normalizeEventName(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function findEventSuggestion(
    eventName: string,
): EventSuggestion | null {
    const normalized = normalizeEventName(eventName);

    if (!normalized) {
        return null;
    }

    for (const [keyword, suggestion] of Object.entries(
        eventSuggestions,
    )) {
        const normalizedKeyword =
            normalizeEventName(keyword);

        if (
            normalized.includes(normalizedKeyword) ||
            normalizedKeyword.includes(normalized)
        ) {
            return suggestion;
        }
    }

    return null;
}

function pickRandomItems<T>(
    items: T[],
    count: number,
): T[] {
    if (items.length === 0) {
        return [];
    }

    const shuffled = [...items].sort(
        () => Math.random() - 0.5,
    );

    return shuffled.slice(
        0,
        Math.min(count, items.length),
    );
}

function toggleValue(
    values: string[],
    value: string,
    max: number,
): string[] {
    if (values.includes(value)) {
        return values.filter(
            (item) => item !== value,
        );
    }

    if (values.length >= max) {
        return values;
    }

    return [...values, value];
}

function formatEventDateLabel(
    value?: string | null,
): string {
    if (!value) {
        return 'No date';
    }

    const [year, month, day] = value
        .split('-')
        .map(Number);

    if (
        !year ||
        !month ||
        !day ||
        Number.isNaN(year) ||
        Number.isNaN(month) ||
        Number.isNaN(day)
    ) {
        return value;
    }

    const date = new Date(
        year,
        month - 1,
        day,
    );

    return new Intl.DateTimeFormat(
        'en-US',
        {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        },
    ).format(date);
}

/* ==========================================================================
   COMPONENT
========================================================================== */

export default function GeneratorPage() {
    const pageProps = usePage().props as {
        business?: {
            id?: number;
            name?: string;
            logo_path?: string | null;
            logo_url?: string | null;
        } | null;
        initial_event_id?: number | string | null;
        initial_product_name?: string | null;
        campaigns?: Array<{
            id: number;
            name: string;
            status?: string;
            start_date?: string | null;
            end_date?: string | null;
        }>;
        events?: EventItem[];
        campaign?: {
            id?: number | string;
            product_name?: string;
            image_prompt?: string;
            price?: string | number;
            event_id?: number | string;
        } | null;
        errors?: Record<string, string>;
    };

    const campaign = pageProps.campaign ?? null;
    const errors = pageProps.errors ?? {};

    /* ----------------------------------------------------------------------
       EVENTS & YEARS
    ---------------------------------------------------------------------- */

    const events = useMemo(
        () => pageProps.events ?? [],
        [pageProps.events],
    );

    const currentYearStr = String(new Date().getFullYear());
    const [selectedYearTab, setSelectedYearTab] = useState<string>(currentYearStr);
    const [eventSearchQuery, setEventSearchQuery] = useState<string>('');
    const [eventCategoryFilter, setEventCategoryFilter] = useState<string>('all');

    const availableYears = useMemo(() => {
        const years = new Set<string>();
        const currentYear = new Date().getFullYear();
        years.add(String(currentYear));
        years.add(String(currentYear + 1));
        events.forEach((ev) => {
            if (ev.date) {
                const yr = ev.date.slice(0, 4);
                if (yr && yr.length === 4) {
                    years.add(yr);
                }
            }
        });
        return Array.from(years).sort();
    }, [events]);

    const filteredModalEvents = useMemo(() => {
        return events.filter((ev) => {
            // Year filter
            if (selectedYearTab !== 'all') {
                const yr = ev.date?.slice(0, 4);
                if (yr !== selectedYearTab) {
                    return false;
                }
            }

            // Category filter
            if (eventCategoryFilter === 'holidays' && ev.type !== 'holiday' && ev.type !== 'seasonal') {
                return false;
            }
            if (eventCategoryFilter === 'commercial' && ev.type !== 'commercial') {
                return false;
            }
            if (eventCategoryFilter === 'custom' && ev.type !== 'custom') {
                return false;
            }

            // Search query
            if (eventSearchQuery.trim() !== '') {
                const q = eventSearchQuery.toLowerCase();
                return ev.name.toLowerCase().includes(q) || (ev.type && ev.type.toLowerCase().includes(q));
            }

            return true;
        }).sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));
    }, [events, selectedYearTab, eventCategoryFilter, eventSearchQuery]);

    /* ----------------------------------------------------------------------
       STATE
    ---------------------------------------------------------------------- */

    const [currentStep, setCurrentStep] =
        useState<Step>(1);

    const [generationState, setGenerationState] =
        useState<GenerationState>('idle');

    const [generationProgress, setGenerationProgress] =
        useState(0);

    const [eventModalOpen, setEventModalOpen] =
        useState(false);

    const [form, setForm] =
        useState<GeneratorForm>({
            product_name:
                pageProps.initial_product_name ??
                campaign?.product_name ??
                '',

            image_prompt:
                campaign?.image_prompt ?? '',

            price:
                campaign?.price !== undefined
                    ? String(campaign.price)
                    : '',

            event_id:
                pageProps.initial_event_id !== undefined && pageProps.initial_event_id !== null
                    ? String(pageProps.initial_event_id)
                    : campaign?.event_id !== undefined
                      ? String(campaign.event_id)
                      : '',

            content_style: [],

            brand_tone: [],

            tagline_mode: 'ai',

            tagline: '',

            reference_image: null,

            include_logo: Boolean(pageProps.business?.logo_url),
        });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const eventIdParam = params.get('event_id') || params.get('event');
            const eventNameParam = params.get('event_name');
            const productParam = params.get('product_name') || params.get('product');

            if (eventIdParam && !form.event_id) {
                setForm((prev) => ({ ...prev, event_id: eventIdParam }));
            } else if (eventNameParam && !form.event_id && events.length > 0) {
                const matched = events.find(
                    (e) => e.name.toLowerCase() === eventNameParam.toLowerCase(),
                );
                if (matched) {
                    setForm((prev) => ({ ...prev, event_id: String(matched.id) }));
                }
            }

            if (productParam && !form.product_name) {
                setForm((prev) => ({ ...prev, product_name: productParam }));
            }
        }
    }, [events]);

    const [isSavedToDesigns, setIsSavedToDesigns] = useState(false);
    const [isSavingDesign, setIsSavingDesign] = useState(false);
    const [savedDesign, setSavedDesign] = useState<{
        id: number;
        product_name: string;
        tagline?: string | null;
        image_url?: string | null;
        show_url?: string;
    } | null>(null);

    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
    const [campaignModalTab, setCampaignModalTab] = useState<'existing' | 'new'>('existing');
    const [selectedExistingCampaignId, setSelectedExistingCampaignId] = useState<string>('');
    const [isAttachingCampaign, setIsAttachingCampaign] = useState<boolean>(false);
    const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
    const [isCampaignCreated, setIsCampaignCreated] = useState(false);
    const [createdCampaign, setCreatedCampaign] = useState<{
        id: number;
        name: string;
        show_url?: string;
    } | null>(null);

    const [campaignFormData, setCampaignFormData] = useState({
        name: '',
        event_id: '',
        start_date: '',
        end_date: '',
    });
    const [campaignFormErrors, setCampaignFormErrors] = useState<Record<string, string>>({});

    /* ----------------------------------------------------------------------
       SELECTED EVENT
    ---------------------------------------------------------------------- */

    const selectedEvent = useMemo(
        () =>
            events.find(
                (event) =>
                    String(event.id) ===
                    String(form.event_id),
            ) ?? null,
        [events, form.event_id],
    );

    /* ----------------------------------------------------------------------
       EVENT SUGGESTION
    ---------------------------------------------------------------------- */

    const eventSuggestion = useMemo(
        () =>
            selectedEvent
                ? findEventSuggestion(
                    selectedEvent.name,
                )
                : null,
        [selectedEvent],
    );

    /* ----------------------------------------------------------------------
       FORM UPDATE
    ---------------------------------------------------------------------- */

    const updateField = <
        K extends keyof GeneratorForm,
    >(
        field: K,
        value: GeneratorForm[K],
    ) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    /* ----------------------------------------------------------------------
       PRICE HANDLER
       Numbers only. Allows decimal values.
    ---------------------------------------------------------------------- */

    const handlePriceChange = (
        value: string,
    ) => {
        const cleanedValue =
            value.replace(/\D/g, '');

        updateField(
            'price',
            cleanedValue,
        );
    };

    const applySelectedEvent = (
        eventId: string,
    ) => {
        setForm((previous) => ({
            ...previous,
            event_id: eventId,
        }));

        setEventModalOpen(false);
    };

    const generateTagline = () => {
        const eventName =
            selectedEvent?.name ||
            'your campaign';

        const eventWord =
            eventName
                .replace(/\s+\(.*?\)/g, '')
                .trim() || 'campaign';

        const templates = [
            `${eventWord} made memorable.`,
            `Celebrate ${eventWord} with a standout moment.`,
            `${eventWord} deserves the spotlight.`,
            `Turn ${eventWord} into a story worth sharing.`,
            `Because ${eventWord} deserves more attention.`,
            `Make ${eventWord} feel unforgettable.`,
        ];

        const randomTagline =
            templates[
            Math.floor(
                Math.random() *
                templates.length,
            )
            ];

        setForm((previous) => ({
            ...previous,
            tagline_mode: 'ai',
            tagline: randomTagline,
        }));
    };

    /* ----------------------------------------------------------------------
       VALIDATION
       
       Style and tone are OPTIONAL.
       Maximum = 3.
    ---------------------------------------------------------------------- */

    const stepOneValid =
        form.product_name.trim().length > 0 &&
        form.image_prompt.trim().length > 0;

    const stepTwoValid = true;

    const stepThreeValid =
        form.tagline_mode !== 'manual' ||
        form.tagline.trim().length > 0;

    const canGenerate =
        stepOneValid &&
        stepTwoValid &&
        stepThreeValid;

    /* ----------------------------------------------------------------------
       EVENT AUTO-SUGGESTION
       
       Each click applies random suggestions from the event's pool,
       ensuring variety and not static/predictable results.
    ---------------------------------------------------------------------- */

    const applyEventSuggestions = () => {
        let suggestedStyles: string[] = [];
        let suggestedTones: string[] = [];

        if (eventSuggestion) {
            suggestedStyles = pickRandomItems(eventSuggestion.styles, 3);
            suggestedTones = pickRandomItems(eventSuggestion.tones, 3);
        } else if (selectedEvent) {
            const type = (selectedEvent.type || 'holiday').toLowerCase();
            if (type.includes('holiday') || type.includes('season')) {
                suggestedStyles = ['Seasonal', 'Lifestyle', 'Premium'];
                suggestedTones = ['Warm', 'Friendly', 'Elegant'];
            } else if (type.includes('commercial') || type.includes('sale')) {
                suggestedStyles = ['Promotional', 'Product-focused', 'Social Media'];
                suggestedTones = ['Bold', 'Modern', 'Professional'];
            } else {
                suggestedStyles = ['Storytelling', 'Lifestyle', 'Premium'];
                suggestedTones = ['Warm', 'Playful', 'Modern'];
            }
        } else {
            suggestedStyles = ['Lifestyle', 'Promotional', 'Social Media'];
            suggestedTones = ['Modern', 'Friendly', 'Bold'];
        }

        if (suggestedStyles.length > 0 || suggestedTones.length > 0) {
            updateField('content_style', suggestedStyles.slice(0, 3));
            updateField('brand_tone', suggestedTones.slice(0, 3));
            toast.success(
                selectedEvent
                    ? `Applied smart suggestions for ${selectedEvent.name}!`
                    : 'Applied recommended styles & brand tones!',
            );
        }
    };

    /* ----------------------------------------------------------------------
       NAVIGATION
    ---------------------------------------------------------------------- */

    const nextStep = () => {
        if (
            currentStep === 1 &&
            !stepOneValid
        ) {
            return;
        }

        if (currentStep < 3) {
            setCurrentStep(
                (previous) =>
                    (previous + 1) as Step,
            );
        }
    };

    const previousStep = () => {
        if (currentStep > 1) {
            setCurrentStep(
                (previous) =>
                    (previous - 1) as Step,
            );
        }
    };

    /* ----------------------------------------------------------------------
       FILE
    ---------------------------------------------------------------------- */

    const handleReferenceImage = (
        file: File | null,
    ) => {
        updateField(
            'reference_image',
            file,
        );
    };

    /* ----------------------------------------------------------------------
       MOCK GENERATION
       
       This intentionally does NOT call an AI API.
       It gives the user a realistic generation UI
       until an API key is available.
    ---------------------------------------------------------------------- */

    const generateMarketingImage = () => {
        if (
            generationState === 'generating' ||
            !canGenerate
        ) {
            return;
        }

        setGenerationState(
            'generating',
        );

        setGenerationProgress(0);

        let progress = 0;

        const interval =
            window.setInterval(() => {
                progress += 20;

                setGenerationProgress(
                    Math.min(progress, 100),
                );

                if (progress >= 100) {
                    window.clearInterval(
                        interval,
                    );

                    window.setTimeout(() => {
                        setGenerationState(
                            'ready',
                        );
                    }, 500);
                }
            }, 500);
    };

    /* ----------------------------------------------------------------------
       RESET GENERATION
    ---------------------------------------------------------------------- */

    const createAnother = () => {
        setGenerationState('idle');
        setGenerationProgress(0);
        setCurrentStep(1);
        setIsSavedToDesigns(false);
        setSavedDesign(null);
        setIsCampaignCreated(false);
        setCreatedCampaign(null);
    };

    const handleEdit = () => {
        setGenerationState('idle');
        setGenerationProgress(0);
        setCurrentStep(1);
    };

    const handleRegenerate = () => {
        setGenerationState('idle');
        setGenerationProgress(0);
        setIsSavedToDesigns(false);
        setSavedDesign(null);
        generateMarketingImage();
    };

    const downloadImage = () => {
        if (savedDesign?.image_url) {
            const link = document.createElement('a');
            link.href = savedDesign.image_url;
            link.download = `${form.product_name || 'marketing-design'}.svg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }

        const link = document.createElement('a');
        link.href =
            'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22800%22 height=%22600%22%3E%3Crect fill=%22%23111827%22 width=%22800%22 height=%22600%22/%3E%3C/svg%3E';
        link.download = `marketing-image-${Date.now()}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const saveToDesigns = async () => {
        if (isSavingDesign) {
            return;
        }

        if (isSavedToDesigns && savedDesign) {
            toast.info('Design is already saved in My Designs.');
            return savedDesign;
        }

        setIsSavingDesign(true);

        try {
            const payload = {
                product_name: form.product_name,
                image_prompt: form.image_prompt,
                prompt: form.image_prompt,
                price: form.price ? Number(form.price) : null,
                event_id: form.event_id || null,
                brand_tone: form.brand_tone,
                visual_theme: form.content_style,
                content_style: form.content_style,
                tagline: form.tagline_mode === 'none' ? null : form.tagline,
                tagline_mode: form.tagline_mode,
                include_logo: form.include_logo,
            };

            const response = await fetch('/designs', {
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

            if (!response.ok) {
                throw new Error('Failed to save design');
            }

            const data = await response.json();
            setSavedDesign(data.design);
            setIsSavedToDesigns(true);
            toast.success('Design saved to My Designs!');
            return data.design;
        } catch (err) {
            console.error(err);
            toast.error('Unable to save design. Please try again.');
        } finally {
            setIsSavingDesign(false);
        }
    };

    const handleAttachToExistingCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isAttachingCampaign) {
            return;
        }

        if (!selectedExistingCampaignId) {
            toast.error('Please select an existing campaign.');
            return;
        }

        setIsAttachingCampaign(true);

        try {
            let currentDesign = savedDesign;

            // If design has not been saved yet, auto-save it first
            if (!currentDesign?.id) {
                currentDesign = await saveToDesigns();
                if (!currentDesign?.id) {
                    throw new Error(
                        'Failed to save design before linking campaign.',
                    );
                }
            }

            const res = await fetch(
                `/designs/${currentDesign.id}/attach-campaign`,
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
                        campaign_id: Number(selectedExistingCampaignId),
                    }),
                },
            );

            if (!res.ok) {
                throw new Error('Failed to attach design to campaign');
            }

            const data = await res.json();
            setCreatedCampaign(data.campaign);
            setIsCampaignCreated(true);
            setIsCampaignModalOpen(false);
            toast.success(
                `Design linked to ${data.campaign?.name || 'campaign'}!`,
            );
        } catch (err) {
            console.error(err);
            toast.error('Unable to link design to selected campaign.');
        } finally {
            setIsAttachingCampaign(false);
        }
    };

    const openCampaignModal = () => {
        const defaultName = selectedEvent
            ? `${selectedEvent.name} Campaign`
            : form.product_name
                ? `${form.product_name} Campaign`
                : 'New Campaign';

        const today = new Date().toISOString().split('T')[0];
        const eventDate = selectedEvent?.date || today;

        setCampaignFormData({
            name: defaultName,
            event_id: form.event_id || '',
            start_date: eventDate,
            end_date: eventDate,
        });
        setCampaignFormErrors({});
        // Default to 'existing' tab if user already has campaigns, else 'new'
        if (pageProps.campaigns && pageProps.campaigns.length > 0) {
            setCampaignModalTab('existing');
            if (!selectedExistingCampaignId) {
                setSelectedExistingCampaignId(String(pageProps.campaigns[0].id));
            }
        } else {
            setCampaignModalTab('new');
        }
        setIsCampaignModalOpen(true);
    };

    const createCampaign = () => {
        openCampaignModal();
    };

    const handleCreateCampaignSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isCreatingCampaign) {
            return;
        }

        const campaignName = campaignFormData.name.trim();
        if (!campaignName) {
            setCampaignFormErrors({
                name: 'Campaign name is required.',
            });
            return;
        }

        setIsCreatingCampaign(true);
        setCampaignFormErrors({});

        try {
            let currentDesignId = savedDesign?.id;

            // If design has not been saved yet, auto-save it to persist and link it
            if (!currentDesignId) {
                const designPayload = {
                    product_name: form.product_name,
                    image_prompt: form.image_prompt,
                    prompt: form.image_prompt,
                    price: form.price ? Number(form.price) : null,
                    event_id: form.event_id || null,
                    brand_tone: form.brand_tone,
                    visual_theme: form.content_style,
                    content_style: form.content_style,
                    tagline:
                        form.tagline_mode === 'none'
                            ? null
                            : form.tagline,
                    tagline_mode: form.tagline_mode,
                };

                const designRes = await fetch('/designs', {
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
                    body: JSON.stringify(designPayload),
                });

                if (designRes.ok) {
                    const designData = await designRes.json();
                    setSavedDesign(designData.design);
                    setIsSavedToDesigns(true);
                    currentDesignId = designData.design?.id;
                }
            }

            const campaignPayload = {
                name: campaignName,
                event_id: campaignFormData.event_id || null,
                start_date:
                    campaignFormData.start_date ||
                    new Date().toISOString().split('T')[0],
                end_date:
                    campaignFormData.end_date ||
                    campaignFormData.start_date ||
                    new Date().toISOString().split('T')[0],
                description: '',
                objective: `Campaign for ${campaignName}`,
                target_audience: '',
                design_id: currentDesignId || null,
                status: 'draft',
            };

            const res = await fetch('/campaigns', {
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
                body: JSON.stringify(campaignPayload),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                if (errorData.errors) {
                    setCampaignFormErrors(errorData.errors);
                }
                throw new Error('Failed to create campaign');
            }

            const data = await res.json();
            setCreatedCampaign(data.campaign);
            setIsCampaignCreated(true);
            setIsCampaignModalOpen(false);
            toast.success(
                'Campaign created and connected with this design!',
            );
        } catch (err) {
            console.error(err);
            toast.error(
                'Failed to create campaign. Please check the inputs.',
            );
        } finally {
            setIsCreatingCampaign(false);
        }
    };

    /* ==========================================================================
       STEP 1
    ========================================================================== */

    const renderStepOne = () => (
        <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="grid gap-5 md:grid-cols-2">
                {/* PRODUCT */}
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="product_name">
                        Product / Service Name
                    </Label>

                    <Input
                        id="product_name"
                        value={
                            form.product_name
                        }
                        onChange={(event) =>
                            updateField(
                                'product_name',
                                event.target.value,
                            )
                        }
                        placeholder="e.g. Luxury Gift Box"
                    />

                    {errors.product_name && (
                        <p className="text-xs text-destructive">
                            {
                                errors.product_name
                            }
                        </p>
                    )}
                </div>

                {/* IMAGE PROMPT */}
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="image_prompt">
                        Image Prompt
                    </Label>

                    <Textarea
                        id="image_prompt"
                        value={
                            form.image_prompt
                        }
                        onChange={(event) =>
                            updateField(
                                'image_prompt',
                                event.target.value,
                            )
                        }
                        placeholder="Describe the product, scene, composition, environment, or visual idea."
                        className="min-h-28 resize-none"
                    />

                    {errors.image_prompt && (
                        <p className="text-xs text-destructive">
                            {
                                errors.image_prompt
                            }
                        </p>
                    )}
                </div>

                {/* PRICE */}
                <div className="space-y-2">
                    <Label htmlFor="price">
                        Price
                    </Label>

                    <div className="flex items-center overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-primary/30">
                        <span className="flex h-10 items-center justify-center border-r border-input bg-muted/30 px-3 text-sm font-semibold text-foreground">
                            ₱
                        </span>

                        <Input
                            id="price"
                            inputMode="numeric"
                            value={form.price}
                            onChange={(event) =>
                                handlePriceChange(
                                    event.target.value,
                                )
                            }
                            placeholder="999"
                            className="h-10 border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
                        />
                    </div>
                </div>

                {/* EVENT */}
                <div className="space-y-2">
                    <Label>
                        Holiday / Event
                    </Label>

                    <button
                        type="button"
                        onClick={() =>
                            setEventModalOpen(true)
                        }
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-left text-sm text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5"
                    >
                        <span className="truncate">
                            {selectedEvent
                                ? selectedEvent.name
                                : 'Choose a holiday or event'}
                        </span>

                        <span className="text-xs text-muted-foreground">
                            Select
                        </span>
                    </button>
                </div>

            </div>

            {/* BRAND LOGO INCLUSION */}
            <div className="mt-5 rounded-xl border border-border bg-card p-4 transition-all hover:border-border/80 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40 p-1">
                            {pageProps.business?.logo_url ? (
                                <img
                                    src={pageProps.business.logo_url}
                                    alt="Brand Logo"
                                    className="max-h-full max-w-full object-contain"
                                />
                            ) : (
                                <Building2 className="h-5 w-5 text-muted-foreground/60" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-foreground">
                                    Include Business Logo
                                </p>
                                {pageProps.business?.logo_url ? (
                                    <Badge
                                        variant="outline"
                                        className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400"
                                    >
                                        Logo Ready
                                    </Badge>
                                ) : (
                                    <Badge
                                        variant="outline"
                                        className="text-[10px] text-muted-foreground"
                                    >
                                        No Logo Set
                                    </Badge>
                                )}
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {pageProps.business?.logo_url
                                    ? `Embed the official ${pageProps.business?.name || 'brand'} logo watermark onto this generated marketing asset.`
                                    : 'Upload your brand logo in Brand Logo settings to include it in generated visuals.'}
                            </p>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        {pageProps.business?.logo_url ? (
                            <button
                                type="button"
                                onClick={() =>
                                    setForm((prev) => ({
                                        ...prev,
                                        include_logo: !prev.include_logo,
                                    }))
                                }
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/40 ${form.include_logo
                                        ? 'bg-primary'
                                        : 'bg-muted'
                                    }`}
                                role="switch"
                                aria-checked={form.include_logo}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${form.include_logo
                                            ? 'translate-x-5'
                                            : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        ) : (
                            <Button
                                asChild
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1 text-xs"
                            >
                                <Link href="/settings/logo">
                                    Upload Logo
                                    <ExternalLink className="h-3 w-3" />
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    /* ==========================================================================
       STEP 2
    ========================================================================== */

    const renderStepTwo = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
            {/* EVENT RECOMMENDATION */}
            {selectedEvent && (
                <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <div>
                        <p className="text-xs font-medium text-primary">
                            Event selected
                        </p>

                        <p className="text-sm font-semibold">
                            {
                                selectedEvent?.name
                            }
                        </p>
                    </div>

                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={
                            applyEventSuggestions
                        }
                        className="shrink-0"
                    >
                        <Sparkles className="mr-2 h-3.5 w-3.5" />
                        Use suggestions
                    </Button>
                </div>
            )}

            {/* VISUAL THEME */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <Label>
                            Visual Theme
                        </Label>
                    </div>

                    <span className="text-xs font-medium text-muted-foreground">
                        {
                            form.content_style
                                .length
                        }{' '}
                        / 3
                    </span>
                </div>

                <div className="flex flex-wrap gap-2">
                    {contentStyleOptions.map(
                        (style) => {
                            const active =
                                form.content_style.includes(
                                    style,
                                );

                            const disabled =
                                !active &&
                                form
                                    .content_style
                                    .length >=
                                3;

                            return (
                                <button
                                    key={
                                        style
                                    }
                                    type="button"
                                    disabled={
                                        disabled
                                    }
                                    onClick={() =>
                                        updateField(
                                            'content_style',
                                            toggleValue(
                                                form.content_style,
                                                style,
                                                3,
                                            ),
                                        )
                                    }
                                    className={`
                                        rounded-full
                                        border
                                        px-3
                                        py-2
                                        text-xs
                                        font-medium
                                        transition-all

                                        ${active
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : disabled
                                                ? 'cursor-not-allowed border-border bg-muted/30 text-muted-foreground/40'
                                                : 'border-border bg-background hover:border-primary/40 hover:bg-muted/50'
                                        }
                                    `}
                                >
                                    {active && (
                                        <Check className="mr-1 inline h-3 w-3" />
                                    )}

                                    {style}
                                </button>
                            );
                        },
                    )}
                </div>
            </div>

            {/* BRAND TONE */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>
                        Brand Tone
                    </Label>

                    <span className="text-xs font-medium text-muted-foreground">
                        {
                            form.brand_tone
                                .length
                        }{' '}
                        / 3
                    </span>
                </div>

                <div className="flex flex-wrap gap-2">
                    {toneOptions.map(
                        (tone) => {
                            const active =
                                form.brand_tone.includes(
                                    tone,
                                );

                            const disabled =
                                !active &&
                                form
                                    .brand_tone
                                    .length >=
                                3;

                            return (
                                <button
                                    key={
                                        tone
                                    }
                                    type="button"
                                    disabled={
                                        disabled
                                    }
                                    onClick={() =>
                                        updateField(
                                            'brand_tone',
                                            toggleValue(
                                                form.brand_tone,
                                                tone,
                                                3,
                                            ),
                                        )
                                    }
                                    className={`
                                        rounded-full
                                        border
                                        px-3
                                        py-2
                                        text-xs
                                        font-medium
                                        transition-all

                                        ${active
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : disabled
                                                ? 'cursor-not-allowed border-border bg-muted/30 text-muted-foreground/40'
                                                : 'border-border bg-background hover:border-primary/40 hover:bg-muted/50'
                                        }
                                    `}
                                >
                                    {active && (
                                        <Check className="mr-1 inline h-3 w-3" />
                                    )}

                                    {tone}
                                </button>
                            );
                        },
                    )}
                </div>
            </div>

            {/* EMPTY SELECTION STATE */}
            {form.content_style.length ===
                0 &&
                form.brand_tone.length ===
                0 && (
                    <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-center text-xs text-muted-foreground">
                        You can skip these or
                        choose up to 3 each.
                    </div>
                )}
        </div>
    );

    /* ==========================================================================
       STEP 3
    ========================================================================== */

    const renderStepThree = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
            {/* TAGLINE */}
            <div className="space-y-3">
                <div>
                    <Label>
                        Tagline
                    </Label>

                    <p className="mt-1 text-xs text-muted-foreground">
                        Choose how text is handled.
                    </p>
                </div>

                <div className="grid gap-2 md:grid-cols-3">
                    {taglineOptions.map(
                        (option) => {
                            const active =
                                form.tagline_mode ===
                                option.value;

                            return (
                                <button
                                    key={
                                        option.value
                                    }
                                    type="button"
                                    onClick={() =>
                                        updateField(
                                            'tagline_mode',
                                            option.value,
                                        )
                                    }
                                    className={`
                                        rounded-xl
                                        border
                                        p-3
                                        text-left
                                        transition-all

                                        ${active
                                            ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                            : 'border-border hover:bg-muted/50'
                                        }
                                    `}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">
                                            {
                                                option.label
                                            }
                                        </span>

                                        {active && (
                                            <Check className="h-4 w-4 text-primary" />
                                        )}
                                    </div>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {
                                            option.description
                                        }
                                    </p>
                                </button>
                            );
                        },
                    )}
                </div>
            </div>

            {/* MANUAL */}
            {form.tagline_mode ===
                'manual' && (
                    <div className="space-y-2">
                        <Label htmlFor="tagline">
                            Your tagline
                        </Label>

                        <Input
                            id="tagline"
                            value={
                                form.tagline
                            }
                            onChange={(event) =>
                                updateField(
                                    'tagline',
                                    event.target.value,
                                )
                            }
                            placeholder="Make every moment special."
                        />

                        {!form.tagline.trim() && (
                            <p className="text-xs text-destructive">
                                Enter your tagline
                                to continue.
                            </p>
                        )}
                    </div>
                )}

            {/* AI */}
            {form.tagline_mode ===
                'ai' && (
                    <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                </div>

                                <div>
                                    <p className="text-sm font-medium">
                                        AI tagline
                                    </p>

                                    <p className="text-xs text-muted-foreground">
                                        Uses your product,
                                        event, style, and
                                        tone.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={generateTagline}
                                className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-background px-2.5 py-1.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/5"
                            >
                                <RefreshCcw className="h-3.5 w-3.5" />
                                Refresh
                            </button>
                        </div>

                        {form.tagline ? (
                            <div className="rounded-lg border border-primary/20 bg-background/80 p-3 text-sm font-medium text-foreground">
                                “{form.tagline}”
                            </div>
                        ) : (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={generateTagline}
                                className="w-full"
                            >
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate with AI
                            </Button>
                        )}
                    </div>
                )}

            {/* NONE */}
            {form.tagline_mode ===
                'none' && (
                    <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                        The image will have no text
                        overlay.
                    </div>
                )}

            {/* REFERENCE IMAGE */}
            <div className="space-y-3">
                <div>
                    <Label>
                        Reference Image
                        <span className="ml-1 font-normal text-muted-foreground">
                            optional
                        </span>
                    </Label>

                    <p className="mt-1 text-xs text-muted-foreground">
                        Add an image for visual
                        guidance.
                    </p>
                </div>

                {!form.reference_image ? (
                    <label
                        htmlFor="reference_image"
                        className="
                            flex
                            cursor-pointer
                            items-center
                            gap-3
                            rounded-xl
                            border
                            border-dashed
                            border-border
                            bg-muted/20
                            p-4
                            hover:border-primary/40
                            hover:bg-muted/40
                        "
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background">
                            <Upload className="h-4 w-4 text-muted-foreground" />
                        </div>

                        <div>
                            <p className="text-sm font-medium">
                                Upload reference
                            </p>

                            <p className="text-xs text-muted-foreground">
                                PNG, JPG, WEBP
                            </p>
                        </div>

                        <Input
                            id="reference_image"
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={(
                                event,
                            ) =>
                                handleReferenceImage(
                                    event.target.files?.[0] ??
                                    null,
                                )
                            }
                        />
                    </label>
                ) : (
                    <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background">
                            <ImagePlus className="h-4 w-4 text-primary" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                                {
                                    form
                                        .reference_image
                                        .name
                                }
                            </p>

                            <p className="text-xs text-muted-foreground">
                                Reference selected
                            </p>
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                                handleReferenceImage(
                                    null,
                                )
                            }
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );

    /* ==========================================================================
       SUMMARY
       
       IMPORTANT:
       No Generate button here.
       There is only ONE Generate button in the main form footer.
    ========================================================================== */

    const summary = (
        <Card className="rounded-2xl border-border shadow-sm lg:sticky lg:top-24 lg:self-start">
            <CardHeader className="border-b p-5">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Campaign Summary
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 p-5">
                <SummaryItem
                    label="Product"
                    value={
                        form.product_name ||
                        '—'
                    }
                />

                <SummaryItem
                    label="Event"
                    value={
                        selectedEvent?.name ||
                        '—'
                    }
                />

                <SummaryItem
                    label="Price"
                    value={
                        form.price
                            ? `₱${form.price}`
                            : '—'
                    }
                />

                <SummaryItem
                    label="Themes"
                    value={
                        form.content_style
                            .length
                            ? form.content_style.join(
                                ', ',
                            )
                            : 'None'
                    }
                />

                <SummaryItem
                    label="Tone"
                    value={
                        form.brand_tone
                            .length
                            ? form.brand_tone.join(
                                ', ',
                            )
                            : 'None'
                    }
                />

                <SummaryItem
                    label="Tagline"
                    value={
                        form.tagline_mode ===
                            'ai'
                            ? 'AI'
                            : form.tagline_mode ===
                                'none'
                                ? 'None'
                                : form.tagline ||
                                '—'
                    }
                />

                <SummaryItem
                    label="Reference"
                    value={
                        form.reference_image
                            ? 'Added'
                            : 'None'
                    }
                />
            </CardContent>
        </Card>
    );

    /* ==========================================================================
       GENERATION MOCKUP & MODALS
    ========================================================================== */

    const eventSelectionModal = eventModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-in fade-in duration-200">
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                {/* MODAL HEADER */}
                <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-4">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-foreground">
                                Select Holiday or Marketing Event
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Choose an event to tailor your creative visual and marketing dates
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setEventModalOpen(false)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        aria-label="Close event selector"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* FILTERS & YEAR TABS */}
                <div className="space-y-3 border-b border-border bg-muted/10 p-4">
                    {/* YEAR TABS */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                        <span className="mr-1 shrink-0 text-xs font-semibold text-muted-foreground">
                            Year:
                        </span>
                        {availableYears.map((yr) => {
                            const isCurrentYr = yr === currentYearStr;
                            const isSelected = selectedYearTab === yr;
                            return (
                                <button
                                    key={yr}
                                    type="button"
                                    onClick={() => setSelectedYearTab(yr)}
                                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${isSelected
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                                        }`}
                                >
                                    {isCurrentYr ? `This Year (${yr})` : yr}
                                </button>
                            );
                        })}
                        <button
                            type="button"
                            onClick={() => setSelectedYearTab('all')}
                            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${selectedYearTab === 'all'
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                        >
                            All Years
                        </button>
                    </div>

                    {/* SEARCH & CATEGORY CHIPS */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={eventSearchQuery}
                                onChange={(e) => setEventSearchQuery(e.target.value)}
                                placeholder="Search holidays or events..."
                                className="h-9 pl-9 text-xs"
                            />
                        </div>

                        <div className="flex items-center gap-1 overflow-x-auto">
                            {(['all', 'holidays', 'commercial', 'custom'] as const).map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setEventCategoryFilter(cat)}
                                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium capitalize transition-colors ${eventCategoryFilter === cat
                                            ? 'bg-accent font-semibold text-accent-foreground'
                                            : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {cat === 'all' ? 'All Types' : cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* EVENTS LIST */}
                <div className="max-h-[380px] min-h-[220px] space-y-2 overflow-y-auto p-4">
                    {filteredModalEvents.length > 0 ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                            {filteredModalEvents.map((event) => {
                                const eventYear = event.date?.slice(0, 4) ?? '';
                                const isSelected = String(event.id) === String(form.event_id);

                                return (
                                    <button
                                        key={event.id}
                                        type="button"
                                        onClick={() => {
                                            applySelectedEvent(String(event.id));
                                            setEventModalOpen(false);
                                        }}
                                        className={`group relative flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${isSelected
                                                ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30'
                                                : 'border-border bg-card hover:border-primary/40 hover:bg-muted/40'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="line-clamp-1 text-sm font-semibold text-foreground">
                                                {event.name}
                                            </p>
                                            {event.type && (
                                                <Badge
                                                    variant="secondary"
                                                    className="shrink-0 px-1.5 py-0 text-[9px] capitalize tracking-wider uppercase"
                                                >
                                                    {event.type}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                            <span>
                                                {event.date ? formatEventDateLabel(event.date) : 'Flexible date'}
                                            </span>
                                            {eventYear && (
                                                <span className="font-mono text-[10px] text-muted-foreground/80">
                                                    {eventYear}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <Calendar className="mb-2 h-8 w-8 text-muted-foreground/40" />
                            <p className="text-sm font-medium text-muted-foreground">
                                No events found for this filter.
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground/80">
                                Try changing your year or search keywords.
                            </p>
                        </div>
                    )}
                </div>

                {/* MODAL FOOTER */}
                <div className="flex items-center justify-between border-t border-border bg-muted/20 px-5 py-3">
                    {form.event_id ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                applySelectedEvent('');
                                setEventModalOpen(false);
                            }}
                            className="text-xs text-destructive hover:bg-destructive/10"
                        >
                            Clear Selected Event
                        </Button>
                    ) : (
                        <div />
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEventModalOpen(false)}
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    ) : null;

    const campaignActionModal = (
        <Dialog
            open={isCampaignModalOpen}
            onOpenChange={setIsCampaignModalOpen}
        >
            <DialogContent className="rounded-2xl sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-lg">
                        Connect with Campaign
                    </DialogTitle>
                    <DialogDescription>
                        Attach this generated marketing design to an existing campaign or launch a new one.
                    </DialogDescription>
                </DialogHeader>

                {/* SEGMENTED TAB SELECTOR */}
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 text-xs font-semibold">
                    <button
                        type="button"
                        onClick={() => setCampaignModalTab('existing')}
                        className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition-all ${campaignModalTab === 'existing'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <FolderPlus className="h-3.5 w-3.5" />
                        Add to Existing Campaign
                    </button>
                    <button
                        type="button"
                        onClick={() => setCampaignModalTab('new')}
                        className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition-all ${campaignModalTab === 'new'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Create New Campaign
                    </button>
                </div>

                {campaignModalTab === 'existing' ? (
                    /* TAB 1: ADD TO EXISTING CAMPAIGN */
                    <form onSubmit={handleAttachToExistingCampaign} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="sel-existing-campaign">
                                Choose Campaign
                            </Label>
                            {pageProps.campaigns && pageProps.campaigns.length > 0 ? (
                                <select
                                    id="sel-existing-campaign"
                                    value={selectedExistingCampaignId}
                                    onChange={(e) => setSelectedExistingCampaignId(e.target.value)}
                                    disabled={isAttachingCampaign}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30"
                                >
                                    <option value="">Select an existing campaign...</option>
                                    {pageProps.campaigns.map((camp) => (
                                        <option key={camp.id} value={camp.id}>
                                            {camp.name} ({camp.status || 'draft'}) {camp.start_date ? `• ${camp.start_date}` : ''}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-center">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        No active campaigns found.
                                    </p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCampaignModalTab('new')}
                                        className="mt-2 text-xs"
                                    >
                                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                                        Create your first campaign
                                    </Button>
                                </div>
                            )}
                        </div>

                        {selectedExistingCampaignId && (
                            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                                <p className="font-medium text-foreground">
                                    Campaign Connection:
                                </p>
                                <p className="mt-0.5">
                                    This visual asset will be linked to the selected campaign and will appear directly in its gallery and dashboard.
                                </p>
                            </div>
                        )}

                        <DialogFooter className="mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCampaignModalOpen(false)}
                                disabled={isAttachingCampaign}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isAttachingCampaign || !selectedExistingCampaignId}
                                className="gap-2"
                            >
                                {isAttachingCampaign ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Attaching...
                                    </>
                                ) : (
                                    <>
                                        <LinkIcon className="h-4 w-4" />
                                        Attach to Campaign
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    /* TAB 2: CREATE NEW CAMPAIGN */
                    <form onSubmit={handleCreateCampaignSubmit} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="gen-campaign-name">
                                Campaign Name
                            </Label>
                            <Input
                                id="gen-campaign-name"
                                value={campaignFormData.name}
                                onChange={(e) =>
                                    setCampaignFormData((cur) => ({
                                        ...cur,
                                        name: e.target.value,
                                    }))
                                }
                                placeholder="e.g. Summer Launch 2026"
                                disabled={isCreatingCampaign}
                                className={
                                    campaignFormErrors.name
                                        ? 'border-destructive'
                                        : ''
                                }
                            />
                            {campaignFormErrors.name && (
                                <p className="text-xs text-destructive">
                                    {campaignFormErrors.name}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="gen-campaign-event"
                                className="flex items-center gap-1.5"
                            >
                                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                                Linked Event / Holiday (Optional)
                            </Label>
                            <select
                                id="gen-campaign-event"
                                value={campaignFormData.event_id}
                                onChange={(e) => {
                                    const eventId = e.target.value;
                                    const selectedEvt = events.find(
                                        (ev) =>
                                            String(ev.id) === String(eventId),
                                    );
                                    setCampaignFormData((cur) => ({
                                        ...cur,
                                        event_id: eventId,
                                        start_date:
                                            selectedEvt?.date || cur.start_date,
                                        end_date:
                                            selectedEvt?.date || cur.end_date,
                                    }));
                                }}
                                disabled={isCreatingCampaign}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30"
                            >
                                <option value="">
                                    Select an event (optional)...
                                </option>
                                {events.map((ev) => (
                                    <option key={ev.id} value={ev.id}>
                                        {ev.name}{' '}
                                        {ev.date
                                            ? `(${formatEventDateLabel(ev.date)})`
                                            : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="gen-campaign-start">
                                    Start Date
                                </Label>
                                <Input
                                    id="gen-campaign-start"
                                    type="date"
                                    value={campaignFormData.start_date}
                                    onChange={(e) =>
                                        setCampaignFormData((cur) => ({
                                            ...cur,
                                            start_date: e.target.value,
                                        }))
                                    }
                                    disabled={isCreatingCampaign}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gen-campaign-end">
                                    End Date
                                </Label>
                                <Input
                                    id="gen-campaign-end"
                                    type="date"
                                    value={campaignFormData.end_date}
                                    onChange={(e) =>
                                        setCampaignFormData((cur) => ({
                                            ...cur,
                                            end_date: e.target.value,
                                        }))
                                    }
                                    disabled={isCreatingCampaign}
                                />
                            </div>
                        </div>

                        <DialogFooter className="mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCampaignModalOpen(false)}
                                disabled={isCreatingCampaign}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    isCreatingCampaign ||
                                    !campaignFormData.name.trim()
                                }
                                className="gap-2"
                            >
                                {isCreatingCampaign ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4" />
                                        Create & Link Campaign
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );

    const generationPanel = (
        <Card className="mx-auto max-w-3xl overflow-hidden rounded-2xl border-border shadow-sm">
            <CardHeader className="border-b p-5 md:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            AI Generation
                        </p>

                        <h2 className="mt-1 text-lg font-semibold">
                            {generationState === 'generating'
                                ? 'Creating your image'
                                : 'Generation ready'}
                        </h2>
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-5 md:p-7">
                {generationState === 'generating' && (
                    <div className="space-y-6">
                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5">
                            <Sparkles className="h-8 w-8 animate-pulse text-primary" />
                        </div>

                        <div className="text-center">
                            <p className="text-sm font-medium">
                                Preparing your marketing visual
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                                Creating your marketing asset design.
                            </p>
                        </div>

                        <div className="mx-auto max-w-md">
                            <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                                <span>Generating</span>
                                <span>{generationProgress}%</span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-primary transition-all duration-500"
                                    style={{
                                        width: `${generationProgress}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {generationState === 'ready' && (
                    <div className="space-y-6">
                        {/* IMAGE PREVIEW CARD */}
                        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                            <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-3">
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                <span className="text-xs font-medium">
                                    Generated Marketing Visual
                                </span>
                                <div className="ml-auto flex items-center gap-2">
                                    {form.include_logo && (
                                        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-[10px] text-primary">
                                            Logo Embedded
                                        </Badge>
                                    )}
                                    <Badge
                                        variant="secondary"
                                        className="text-[11px]"
                                    >
                                        {savedDesign
                                            ? 'Saved in My Designs'
                                            : 'Mockup Asset'}
                                    </Badge>
                                </div>
                            </div>

                            <div className="p-4 sm:p-6">
                                {savedDesign?.image_url ? (
                                    <div className="flex items-center justify-center overflow-hidden rounded-xl border border-border bg-slate-950">
                                        <img
                                            src={savedDesign.image_url}
                                            alt={form.product_name}
                                            className="max-h-[400px] w-full object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-slate-900 via-indigo-950/60 to-purple-950/70 p-8 text-center shadow-inner">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 text-primary shadow-md ring-1 ring-primary/30">
                                            <Sparkles className="h-7 w-7 animate-pulse text-primary" />
                                        </div>

                                        <h3 className="mt-4 text-xl font-bold tracking-tight text-white md:text-2xl">
                                            {form.product_name ||
                                                'Marketing Visual Asset'}
                                        </h3>

                                        {form.tagline &&
                                            form.tagline_mode !== 'none' && (
                                                <p className="mx-auto mt-2 max-w-md text-sm font-medium text-slate-300">
                                                    "{form.tagline}"
                                                </p>
                                            )}

                                        {form.price && (
                                            <p className="mt-3 text-lg font-bold text-sky-400">
                                                ₱
                                                {Number(form.price).toFixed(2)}
                                            </p>
                                        )}

                                        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                                            {selectedEvent && (
                                                <Badge
                                                    variant="outline"
                                                    className="border-pink-500/40 bg-pink-500/10 text-xs text-pink-300"
                                                >
                                                    {selectedEvent.name}
                                                </Badge>
                                            )}
                                            {form.include_logo && pageProps.business?.name && (
                                                <Badge
                                                    variant="outline"
                                                    className="border-emerald-500/40 bg-emerald-500/10 text-xs text-emerald-300"
                                                >
                                                    Brand: {pageProps.business.name}
                                                </Badge>
                                            )}
                                            {form.content_style.map((style) => (
                                                <Badge
                                                    key={style}
                                                    variant="outline"
                                                    className="border-indigo-500/40 bg-indigo-500/10 text-xs text-indigo-300"
                                                >
                                                    {style}
                                                </Badge>
                                            ))}
                                            {form.brand_tone.map((tone) => (
                                                <Badge
                                                    key={tone}
                                                    variant="outline"
                                                    className="border-border bg-background/50 text-xs text-slate-300"
                                                >
                                                    {tone}
                                                </Badge>
                                            ))}
                                        </div>

                                        <p className="mt-6 text-xs text-muted-foreground">
                                            Ready to save to My Designs or launch as a campaign.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* STATUS FEEDBACK */}
                        <div
                            className={`rounded-xl border p-4 transition-colors ${isSavedToDesigns || isCampaignCreated
                                    ? 'border-emerald-500/30 bg-emerald-500/5'
                                    : 'border-primary/20 bg-primary/5'
                                }`}
                        >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${isSavedToDesigns || isCampaignCreated
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                : 'bg-primary/10 text-primary'
                                            }`}
                                    >
                                        <Check className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">
                                            {isSavedToDesigns && isCampaignCreated
                                                ? 'Asset saved & campaign connected!'
                                                : isSavedToDesigns
                                                    ? 'Saved to My Designs'
                                                    : isCampaignCreated
                                                        ? 'Campaign created & linked'
                                                        : 'Generation complete'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {isSavedToDesigns && isCampaignCreated
                                                ? 'Your marketing asset is registered in My Designs and linked to your campaign.'
                                                : isSavedToDesigns
                                                    ? 'Your design is saved and accessible under My Designs.'
                                                    : isCampaignCreated
                                                        ? 'Your campaign is scheduled in the Campaigns hub.'
                                                        : 'Save this asset to My Designs or link it to a campaign.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-1 sm:pt-0">
                                    {isSavedToDesigns && (
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                                        >
                                            <Link href="/designs">
                                                View Designs
                                                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                                            </Link>
                                        </Button>
                                    )}
                                    {isCampaignCreated && (
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                                        >
                                            <Link href="/campaigns">
                                                View Campaigns
                                                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="space-y-4">
                            {/* PRIMARY COMBINED ACTIONS */}
                            <div className="grid gap-3 sm:grid-cols-3">
                                <Button
                                    type="button"
                                    onClick={saveToDesigns}
                                    disabled={isSavingDesign}
                                    variant="outline"
                                    className={`transition-all ${isSavedToDesigns
                                            ? 'border-emerald-500/50 bg-emerald-50 font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300'
                                            : 'border-border hover:bg-accent'
                                        }`}
                                >
                                    {isSavingDesign ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Check
                                            className={`mr-2 h-4 w-4 ${isSavedToDesigns
                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                    : 'text-muted-foreground'
                                                }`}
                                        />
                                    )}
                                    {isSavedToDesigns
                                        ? 'Saved to Designs'
                                        : 'Save to Designs'}
                                </Button>

                                <Button
                                    type="button"
                                    onClick={openCampaignModal}
                                    variant="outline"
                                    className={`transition-all ${isCampaignCreated
                                            ? 'border-emerald-500/50 bg-emerald-50 font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300'
                                            : 'border-border hover:bg-accent'
                                        }`}
                                >
                                    <Check
                                        className={`mr-2 h-4 w-4 ${isCampaignCreated
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-muted-foreground'
                                            }`}
                                    />
                                    {isCampaignCreated
                                        ? 'Linked to Campaign'
                                        : 'Add to Campaign'}
                                </Button>

                                <Button
                                    type="button"
                                    onClick={createAnother}
                                    className="bg-primary hover:bg-primary/90"
                                >
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Create Another
                                </Button>
                            </div>

                            {/* SECONDARY ACTIONS */}
                            <div className="flex gap-2 pt-2">
                                <Button
                                    type="button"
                                    onClick={downloadImage}
                                    variant="ghost"
                                    size="sm"
                                    className="flex-1"
                                >
                                    <Upload className="mr-1.5 h-4 w-4" />
                                    Download
                                </Button>

                                <Button
                                    type="button"
                                    onClick={handleEdit}
                                    variant="ghost"
                                    size="sm"
                                    className="flex-1"
                                >
                                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                                    Edit
                                </Button>

                                <Button
                                    type="button"
                                    onClick={handleRegenerate}
                                    variant="ghost"
                                    size="sm"
                                    className="flex-1"
                                >
                                    <RefreshCcw className="mr-1.5 h-4 w-4" />
                                    Regenerate
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    /* ==========================================================================
       RENDER
    ========================================================================== */

    return (
        <>
            <Head title="AI Marketing Studio" />

            <div className="min-h-screen bg-background text-foreground">
                <div className="p-4 md:p-6 lg:p-8">
                    {/* HEADER */}
                    <section className="mb-6">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                <Sparkles className="h-4 w-4 text-primary" />
                            </div>

                            <p className="text-sm font-medium text-muted-foreground">
                                AI Marketing Studio
                            </p>
                        </div>

                        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
                            Create your marketing
                            image
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Build your campaign in
                            three simple steps.
                        </p>
                    </section>

                    {eventSelectionModal}
                    {campaignActionModal}

                    {/* GENERATION TAB */}
                    {generationState !==
                        'idle' ? (
                        generationPanel
                    ) : (
                        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                            {/* MAIN FORM */}
                            <Card className="overflow-hidden rounded-2xl border-border shadow-sm">
                                {/* STEP HEADER */}
                                <CardHeader className="border-b p-5 md:p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                Step{' '}
                                                {
                                                    currentStep
                                                }{' '}
                                                of 3
                                            </p>

                                            <h2 className="mt-1 text-lg font-semibold">
                                                {currentStep ===
                                                    1
                                                    ? 'Product & Campaign'
                                                    : currentStep ===
                                                        2
                                                        ? 'Content Style'
                                                        : 'Tagline & Reference'}
                                            </h2>
                                        </div>

                                        {/* STEP INDICATORS */}
                                        <div className="flex items-center gap-1.5">
                                            {[1, 2, 3].map(
                                                (
                                                    step,
                                                ) => (
                                                    <button
                                                        key={
                                                            step
                                                        }
                                                        type="button"
                                                        onClick={() => {
                                                            if (
                                                                step <
                                                                currentStep
                                                            ) {
                                                                setCurrentStep(
                                                                    step as Step,
                                                                );
                                                            }

                                                            if (
                                                                step ===
                                                                2
                                                            ) {
                                                                if (
                                                                    stepOneValid
                                                                ) {
                                                                    setCurrentStep(
                                                                        2,
                                                                    );
                                                                }
                                                            }

                                                            if (
                                                                step ===
                                                                3
                                                            ) {
                                                                if (
                                                                    stepOneValid
                                                                ) {
                                                                    setCurrentStep(
                                                                        3,
                                                                    );
                                                                }
                                                            }
                                                        }}
                                                        className={`
                                                            h-1.5
                                                            rounded-full
                                                            transition-all

                                                            ${step ===
                                                                currentStep
                                                                ? 'w-7 bg-primary'
                                                                : step <
                                                                    currentStep
                                                                    ? 'w-4 bg-primary/40'
                                                                    : 'w-4 bg-muted'
                                                            }
                                                        `}
                                                        aria-label={`Step ${step}`}
                                                    />
                                                ),
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>

                                {/* CONTENT */}
                                <CardContent className="p-5 md:p-7">
                                    {currentStep ===
                                        1 &&
                                        renderStepOne()}

                                    {currentStep ===
                                        2 &&
                                        renderStepTwo()}

                                    {currentStep ===
                                        3 &&
                                        renderStepThree()}

                                    {/* FOOTER */}
                                    <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={
                                                previousStep
                                            }
                                            disabled={
                                                currentStep ===
                                                1
                                            }
                                            className="gap-2"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            Back
                                        </Button>

                                        {currentStep <
                                            3 ? (
                                            <Button
                                                type="button"
                                                onClick={
                                                    nextStep
                                                }
                                                disabled={
                                                    currentStep ===
                                                    1 &&
                                                    !stepOneValid
                                                }
                                                className="group gap-2"
                                            >
                                                Continue
                                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </Button>
                                        ) : (
                                            <Button
                                                type="button"
                                                onClick={
                                                    generateMarketingImage
                                                }
                                                disabled={
                                                    !canGenerate
                                                }
                                                className="group gap-2"
                                            >
                                                <Sparkles className="h-4 w-4" />
                                                Generate
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* SUMMARY */}
                            {summary}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

/* ==========================================================================
   SUMMARY ITEM
========================================================================== */

function SummaryItem({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start justify-between gap-4">
            <span className="shrink-0 text-xs text-muted-foreground">
                {label}
            </span>

            <span className="max-w-[190px] text-right text-xs font-medium">
                {value}
            </span>
        </div>
    );
}

/* ==========================================================================
   LAYOUT
========================================================================== */

GeneratorPage.layout = {
    breadcrumbs: [
        {
            title: 'AI Marketing Studio',
            href: '/generator',
        },
    ],
};