import { Head, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    Check,
    ImagePlus,
    RefreshCcw,
    Sparkles,
    Upload,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
       EVENTS
    ---------------------------------------------------------------------- */

    const events = useMemo(
        () => pageProps.events ?? [],
        [pageProps.events],
    );

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
                campaign?.product_name ?? '',

            image_prompt:
                campaign?.image_prompt ?? '',

            price:
                campaign?.price !== undefined
                    ? String(campaign.price)
                    : '',

            event_id:
                campaign?.event_id !== undefined
                    ? String(campaign.event_id)
                    : '',

            content_style: [],

            brand_tone: [],

            tagline_mode: 'ai',

            tagline: '',

            reference_image: null,
        });

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
        if (!eventSuggestion) {
            return;
        }

        updateField(
            'content_style',
            pickRandomItems(
                eventSuggestion.styles,
                3,
            ),
        );

        updateField(
            'brand_tone',
            pickRandomItems(
                eventSuggestion.tones,
                3,
            ),
        );
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
    };

    const handleEdit = () => {
        setGenerationState('idle');
        setGenerationProgress(0);
        setCurrentStep(1);
    };

    const handleRegenerate = () => {
        setGenerationState('idle');
        setGenerationProgress(0);
        generateMarketingImage();
    };

    const downloadImage = () => {
        const link =
            document.createElement('a');
        link.href =
            'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22800%22 height=%22600%22%3E%3Crect fill=%22%23111827%22 width=%22800%22 height=%22600%22/%3E%3C/svg%3E';
        link.download =
            `marketing-image-${Date.now()}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const saveToDesigns = () => {
        console.log(
            'Saving to designs:',
            form,
        );
    };

    const createCampaign = () => {
        console.log(
            'Creating campaign:',
            form,
        );
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

                    <p className="text-xs text-muted-foreground">
                        Describe the visual you
                        want.
                    </p>

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

                    <p className="text-xs text-muted-foreground">
                        Numbers only — no letters.
                    </p>
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

            {/* EVENT INFO */}
            {selectedEvent && (
                <div className="mt-5 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <CalendarDays className="h-4 w-4 text-primary" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                            {
                                selectedEvent.name
                            }
                        </p>

                        <p className="text-xs text-muted-foreground">
                            {selectedEvent.date
                                ? formatEventDateLabel(
                                      selectedEvent.date,
                                  )
                                : 'Campaign event'}
                        </p>
                    </div>

                    {selectedEvent.days !==
                        undefined &&
                        selectedEvent.days !==
                            null && (
                            <Badge variant="secondary">
                                {
                                    selectedEvent.days
                                }{' '}
                                days
                            </Badge>
                        )}
                </div>
            )}
        </div>
    );

    /* ==========================================================================
       STEP 2
    ========================================================================== */

    const renderStepTwo = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
            {/* EVENT RECOMMENDATION */}
            {eventSuggestion && (
                <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-medium">
                            Suggested for{' '}
                            {
                                selectedEvent?.name
                            }
                        </p>

                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Use styles and tones
                            that fit this event.
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

                        <p className="mt-1 text-xs text-muted-foreground">
                            Choose up to 3
                        </p>
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

                                        ${
                                            active
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
                    <div>
                        <Label>
                            Brand Tone
                        </Label>

                        <p className="mt-1 text-xs text-muted-foreground">
                            Choose up to 3
                        </p>
                    </div>

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

                                        ${
                                            active
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

                                        ${
                                            active
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

                <p className="text-xs text-muted-foreground">
                    Your selections.
                </p>
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
       GENERATION MOCKUP
    ========================================================================== */

    const eventSelectionModal = eventModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
                <div className="flex items-center justify-between border-b px-4 py-3 md:px-5">
                    <div>
                        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                            Marketing calendar
                        </p>
                        <h3 className="mt-1 text-base font-semibold tracking-tight text-foreground">
                            Choose a holiday or event
                        </h3>
                    </div>

                    <button
                        type="button"
                        onClick={() => setEventModalOpen(false)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 text-slate-300 transition-all duration-200 hover:bg-slate-800 hover:text-white"
                        aria-label="Close event selector"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="max-h-[calc(90vh-90px)] space-y-3 overflow-y-auto p-3 md:p-4">
                    <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
                        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                            Available events
                        </p>
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                        {events.length > 0 ? (
                            [...events]
                                .sort((a, b) =>
                                    (a.date ?? '').localeCompare(
                                        b.date ?? '',
                                    ),
                                )
                                .map((event) => {
                                    const eventYear =
                                        event.date?.slice(0, 4) ?? '—';

                                    const isSelected =
                                        String(event.id) ===
                                        String(form.event_id);

                                    return (
                                        <button
                                            key={event.id}
                                            type="button"
                                            onClick={() =>
                                                applySelectedEvent(
                                                    String(event.id),
                                                )
                                            }
                                            className={`
                                                group relative overflow-hidden rounded-xl border p-3 text-left transition-all duration-200 ease-out
                                                ${
                                                    isSelected
                                                        ? 'border-primary/40 bg-primary/5 shadow-sm'
                                                        : 'border-border/80 bg-muted/10 hover:-translate-y-0.5 hover:border-border hover:bg-slate-900/70'
                                                }
                                            `}
                                        >
                                            <span
                                                className={`
                                                    absolute inset-y-0 left-0 w-[2px] transition-colors
                                                    ${
                                                        isSelected
                                                            ? 'bg-primary'
                                                            : 'bg-slate-600 group-hover:bg-slate-400'
                                                    }
                                                `}
                                            />

                                            <div className="flex items-start justify-between gap-2.5 pl-2.5">
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-[15px] font-semibold tracking-[-0.02em] text-foreground">
                                                        {event.name}
                                                    </p>
                                                    <p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground/80">
                                                        {event.date
                                                            ? formatEventDateLabel(
                                                                  event.date,
                                                              )
                                                            : 'No date'}
                                                    </p>
                                                </div>

                                                <span className="shrink-0 rounded-full border border-border bg-slate-950/80 px-1.5 py-0.5 text-[9px] font-medium tracking-[0.08em] text-muted-foreground transition-colors group-hover:border-border/80 group-hover:text-foreground">
                                                    {eventYear}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })
                        ) : (
                            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground md:col-span-2">
                                No marketing calendar events are available yet.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    ) : null;

    const generationPanel = (
        <Card className="mx-auto max-w-3xl overflow-hidden rounded-2xl border-border shadow-sm">
            <CardHeader className="border-b p-5 md:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            AI Generation
                        </p>

                        <h2 className="mt-1 text-lg font-semibold">
                            {generationState ===
                            'generating'
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
                {generationState ===
                    'generating' && (
                    <div className="space-y-6">
                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5">
                            <Sparkles className="h-8 w-8 animate-pulse text-primary" />
                        </div>

                        <div className="text-center">
                            <p className="text-sm font-medium">
                                Preparing your
                                marketing visual
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                                This is a mock
                                generation while
                                the AI service is
                                being connected.
                            </p>
                        </div>

                        <div className="mx-auto max-w-md">
                            <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                                <span>
                                    Generating
                                </span>

                                <span>
                                    {
                                        generationProgress
                                    }
                                    %
                                </span>
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

                {generationState ===
                    'ready' && (
                    <div className="space-y-6">
                        {/* MOCK IMAGE TAB */}
                        <div className="overflow-hidden rounded-2xl border border-border bg-muted/20">
                            <div className="flex items-center gap-2 border-b bg-background px-4 py-3">
                                <div className="h-2 w-2 rounded-full bg-primary" />

                                <span className="text-xs font-medium">
                                    Generated
                                    Marketing
                                    Image
                                </span>

                                <Badge
                                    variant="secondary"
                                    className="ml-auto"
                                >
                                    Mockup
                                </Badge>
                            </div>

                            <div className="flex min-h-[280px] items-center justify-center p-8">
                                <div className="w-full max-w-md rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-8 text-center">
                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                                        <ImagePlus className="h-6 w-6 text-primary" />
                                    </div>

                                    <p className="mt-4 text-sm font-semibold">
                                        Image
                                        preview
                                        placeholder
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                        The actual
                                        AI-generated
                                        image will
                                        appear here
                                        once the
                                        image API
                                        is connected.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* SIMPLE STATUS */}
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                    <Check className="h-4 w-4 text-primary" />
                                </div>

                                <div>
                                    <p className="text-sm font-medium">
                                        Mock generation
                                        complete
                                    </p>

                                    <p className="text-xs text-muted-foreground">
                                        Ready for the
                                        real AI image
                                        service.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="space-y-4">
                            {/* PRIMARY ACTIONS */}
                            <div className="grid gap-3 sm:grid-cols-3">
                                <Button
                                    type="button"
                                    onClick={
                                        saveToDesigns
                                    }
                                    variant="outline"
                                    className="border-border"
                                >
                                    <Check className="mr-2 h-4 w-4" />
                                    Save to Designs
                                </Button>

                                <Button
                                    type="button"
                                    onClick={
                                        createCampaign
                                    }
                                    variant="outline"
                                    className="border-border"
                                >
                                    <Check className="mr-2 h-4 w-4" />
                                    Create Campaign
                                </Button>

                                <Button
                                    type="button"
                                    onClick={
                                        createAnother
                                    }
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
                                    onClick={
                                        downloadImage
                                    }
                                    variant="ghost"
                                    size="sm"
                                    className="flex-1"
                                >
                                    <Upload className="mr-1.5 h-4 w-4" />
                                    Download
                                </Button>

                                <Button
                                    type="button"
                                    onClick={
                                        handleEdit
                                    }
                                    variant="ghost"
                                    size="sm"
                                    className="flex-1"
                                >
                                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                                    Edit
                                </Button>

                                <Button
                                    type="button"
                                    onClick={
                                        handleRegenerate
                                    }
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

                                                            ${
                                                                step ===
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