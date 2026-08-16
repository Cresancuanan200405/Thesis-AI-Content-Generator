import { Head, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Sparkles,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';

const stepTitles = [
    'Product details',
    'Content style',
    'Tagline & reference',
    'Review',
];

const toneOptions = [
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

const contentStyleOptions = [
    'Product-focused',
    'Lifestyle',
    'Promotional',
    'Educational',
    'Social Media',
    'Seasonal',
    'Minimal',
    'Storytelling',
];

const tagLineModes = [
    {
        value: 'auto',
        label: 'Generate automatically',
        description:
            'Let the system create a suitable tagline.',
    },
    {
        value: 'manual',
        label: 'Use my tagline',
        description:
            'Provide the exact tagline you want to use.',
    },
    {
        value: 'ask_me',
        label: 'Ask me each time',
        description:
            'Choose the tagline behavior for each generation.',
    },
];

function toggleValue(values: string[], next: string) {
    return values.includes(next)
        ? values.filter((value) => value !== next)
        : [...values, next];
}

export default function GeneratorPage() {
    const pageProps = usePage().props as any;

    const {
        business,
        brand,
        products = [],
        events = [],
        campaign = null,
        errors = {},
    } = pageProps;

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        product_id: campaign?.product_id
            ? String(campaign.product_id)
            : '',

        event_id: campaign?.event_id
            ? String(campaign.event_id)
            : '',

        product_name: business?.name
            ? `${business.name} Offer`
            : '',

        marketing_goal: campaign?.objective || '',

        content_style: Array.isArray(brand?.brand_tone)
            ? [...brand.brand_tone]
            : [],

        brand_tone: Array.isArray(brand?.brand_tone)
            ? [...brand.brand_tone]
            : [],

        tagline: '',

        tagline_mode: 'auto',

        target_audience:
            business?.target_audience ?? '',

        unique_selling_point:
            business?.unique_selling_point ?? '',

        notes: '',

        reference_image: null as File | null,
    });

    const progress = useMemo(
        () => (currentStep / stepTitles.length) * 100,
        [currentStep],
    );

    const selectedProduct = products.find(
        (item: any) =>
            String(item.id) === String(form.product_id),
    );

    const selectedEvent = events.find(
        (item: any) =>
            String(item.id) === String(form.event_id),
    );

    const updateField = <K extends keyof typeof form>(
        field: K,
        value: (typeof form)[K],
    ) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    const nextStep = () => {
        if (currentStep < stepTitles.length) {
            setCurrentStep((value) => value + 1);
        }
    };

    const previousStep = () => {
        if (currentStep > 1) {
            setCurrentStep((value) => value - 1);
        }
    };

    const submit = () => {
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        const payload = new FormData();

        if (form.product_id) {
            payload.append(
                'product_id',
                form.product_id,
            );
        }

        if (form.event_id) {
            payload.append(
                'event_id',
                form.event_id,
            );
        }

        if (campaign?.id) {
            payload.append(
                'campaign_id',
                String(campaign.id),
            );
        }

        payload.append(
            'product_name',
            form.product_name ||
                selectedProduct?.name ||
                'Custom product',
        );

        payload.append(
            'marketing_goal',
            form.marketing_goal,
        );

        payload.append(
            'target_audience',
            form.target_audience ||
                business?.target_audience ||
                '',
        );

        payload.append(
            'unique_selling_point',
            form.unique_selling_point ||
                business?.unique_selling_point ||
                '',
        );

        if (campaign?.name) {
            payload.append(
                'campaign_name',
                campaign.name,
            );
        }

        if (campaign?.objective) {
            payload.append(
                'campaign_objective',
                campaign.objective,
            );
        }

        if (campaign?.target_audience) {
            payload.append(
                'campaign_target_audience',
                campaign.target_audience,
            );
        }

        payload.append(
            'tagline',
            form.tagline || '',
        );

        payload.append(
            'tagline_mode',
            form.tagline_mode || 'auto',
        );

        payload.append(
            'notes',
            form.notes || '',
        );

        form.content_style.forEach((item) =>
            payload.append(
                'content_style[]',
                item,
            ),
        );

        form.brand_tone.forEach((item) =>
            payload.append(
                'brand_tone[]',
                item,
            ),
        );

        if (form.reference_image) {
            payload.append(
                'reference_image',
                form.reference_image,
            );
        }

        router.post('/generator', payload, {
            forceFormData: true,
            preserveScroll: true,

            onFinish: () =>
                setIsSubmitting(false),

            onError: () =>
                setIsSubmitting(false),
        });
    };

    const renderStep = () => {
        /* ================================================================
           STEP 1 — PRODUCT DETAILS
        ================================================================= */

        if (currentStep === 1) {
            return (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
                    {/* Product */}
                    <div className="space-y-2">
                        <Label htmlFor="product_id">
                            Product
                        </Label>

                        <select
                            id="product_id"
                            value={form.product_id}
                            onChange={(event) =>
                                updateField(
                                    'product_id',
                                    event.target.value,
                                )
                            }
                            className="
                                flex
                                h-10
                                w-full
                                rounded-md
                                border
                                border-input
                                bg-background
                                px-3
                                py-2
                                text-sm
                                text-foreground
                                outline-none

                                transition-all
                                duration-200

                                hover:border-ring/50

                                focus:border-ring
                                focus:ring-2
                                focus:ring-ring/30

                                focus:shadow-[0_0_0_3px_hsl(var(--ring)/0.08)]
                            "
                        >
                            <option value="">
                                Select an existing product
                            </option>

                            {products.map(
                                (product: any) => (
                                    <option
                                        key={product.id}
                                        value={product.id}
                                    >
                                        {product.name}
                                    </option>
                                ),
                            )}
                        </select>

                        {errors.product_id && (
                            <p className="animate-in fade-in slide-in-from-top-1 text-sm text-destructive duration-200">
                                {errors.product_id}
                            </p>
                        )}
                    </div>

                    {/* Product Name */}
                    <div className="space-y-2">
                        <Label htmlFor="product_name">
                            Product name
                        </Label>

                        <Input
                            id="product_name"
                            value={form.product_name}
                            onChange={(event) =>
                                updateField(
                                    'product_name',
                                    event.target.value,
                                )
                            }
                            placeholder="North Star Seasonal Blend"
                            className="
                                transition-all
                                duration-200
                                hover:border-ring/50
                                focus-visible:shadow-[0_0_0_3px_hsl(var(--ring)/0.08)]
                            "
                        />

                        <p className="text-xs text-muted-foreground">
                            Give your campaign a clear product
                            or offer name.
                        </p>

                        {errors.product_name && (
                            <p className="animate-in fade-in slide-in-from-top-1 text-sm text-destructive duration-200">
                                {errors.product_name}
                            </p>
                        )}
                    </div>

                    {/* Event */}
                    <div className="space-y-2">
                        <Label htmlFor="event_id">
                            Campaign event
                        </Label>

                        <select
                            id="event_id"
                            value={form.event_id}
                            onChange={(event) =>
                                updateField(
                                    'event_id',
                                    event.target.value,
                                )
                            }
                            className="
                                flex
                                h-10
                                w-full
                                rounded-md
                                border
                                border-input
                                bg-background
                                px-3
                                py-2
                                text-sm
                                text-foreground
                                outline-none

                                transition-all
                                duration-200

                                hover:border-ring/50

                                focus:border-ring
                                focus:ring-2
                                focus:ring-ring/30

                                focus:shadow-[0_0_0_3px_hsl(var(--ring)/0.08)]
                            "
                        >
                            <option value="">
                                Select an upcoming event
                            </option>

                            {events.map(
                                (event: any) => (
                                    <option
                                        key={event.id}
                                        value={event.id}
                                    >
                                        {event.name}{' '}
                                        {event.date
                                            ? `(${event.date})`
                                            : ''}
                                    </option>
                                ),
                            )}
                        </select>

                        {errors.event_id && (
                            <p className="animate-in fade-in slide-in-from-top-1 text-sm text-destructive duration-200">
                                {errors.event_id}
                            </p>
                        )}
                    </div>

                    {/* Marketing Goal */}
                    <div className="space-y-2">
                        <Label htmlFor="marketing_goal">
                            Primary marketing goal
                        </Label>

                        <Textarea
                            id="marketing_goal"
                            value={form.marketing_goal}
                            onChange={(event) =>
                                updateField(
                                    'marketing_goal',
                                    event.target.value,
                                )
                            }
                            placeholder="Drive weekend traffic and increase conversion for the new seasonal release."
                            className="
                                min-h-28
                                resize-none
                                transition-all
                                duration-200
                                hover:border-ring/50
                                focus-visible:shadow-[0_0_0_3px_hsl(var(--ring)/0.08)]
                            "
                        />

                        <p className="text-xs text-muted-foreground">
                            Describe what you want this campaign
                            to accomplish.
                        </p>

                        {errors.marketing_goal && (
                            <p className="animate-in fade-in slide-in-from-top-1 text-sm text-destructive duration-200">
                                {errors.marketing_goal}
                            </p>
                        )}
                    </div>
                </div>
            );
        }

        /* ================================================================
           STEP 2 — CONTENT STYLE
        ================================================================= */

        if (currentStep === 2) {
            return (
                <div className="space-y-9 animate-in fade-in slide-in-from-right-2 duration-300">
                    {/* Content Style */}
                    <div className="space-y-4">
                        <div>
                            <Label>
                                Content style
                            </Label>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Select one or more visual directions
                                for your marketing content.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            {contentStyleOptions.map(
                                (option) => {
                                    const active =
                                        form.content_style.includes(
                                            option,
                                        );

                                    return (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() =>
                                                updateField(
                                                    'content_style',
                                                    toggleValue(
                                                        form.content_style,
                                                        option,
                                                    ),
                                                )
                                            }
                                            className={`
                                                group
                                                rounded-xl
                                                border
                                                p-4
                                                text-left

                                                transition-all
                                                duration-200

                                                hover:-translate-y-0.5
                                                hover:shadow-sm

                                                active:translate-y-0

                                                ${
                                                    active
                                                        ? 'border-primary bg-primary/5 text-foreground shadow-sm ring-1 ring-primary/20'
                                                        : 'border-border bg-background hover:bg-muted/50'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <span
                                                    className={`
                                                        text-sm
                                                        font-medium
                                                        transition-colors
                                                        duration-200

                                                        ${
                                                            active
                                                                ? 'text-primary'
                                                                : 'text-foreground'
                                                        }
                                                    `}
                                                >
                                                    {option}
                                                </span>

                                                <div
                                                    className={`
                                                        flex
                                                        h-6
                                                        w-6
                                                        items-center
                                                        justify-center
                                                        rounded-full
                                                        border

                                                        transition-all
                                                        duration-200

                                                        ${
                                                            active
                                                                ? 'scale-100 border-primary bg-primary text-primary-foreground'
                                                                : 'scale-95 border-border group-hover:scale-100'
                                                        }
                                                    `}
                                                >
                                                    {active && (
                                                        <Check className="h-3.5 w-3.5 animate-in zoom-in-50 duration-200" />
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                },
                            )}
                        </div>
                    </div>

                    {/* Brand Tone */}
                    <div className="space-y-4">
                        <div>
                            <Label>
                                Brand tone
                            </Label>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Choose the personality your marketing
                                content should communicate.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {toneOptions.map(
                                (option) => {
                                    const active =
                                        form.brand_tone.includes(
                                            option,
                                        );

                                    return (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() =>
                                                updateField(
                                                    'brand_tone',
                                                    toggleValue(
                                                        form.brand_tone,
                                                        option,
                                                    ),
                                                )
                                            }
                                            className={`
                                                group
                                                rounded-xl
                                                border
                                                p-3.5
                                                text-left

                                                transition-all
                                                duration-200

                                                hover:-translate-y-0.5
                                                hover:shadow-sm

                                                active:translate-y-0

                                                ${
                                                    active
                                                        ? 'border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary/20'
                                                        : 'border-border bg-background text-foreground hover:bg-muted/50'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-sm font-medium">
                                                    {option}
                                                </span>

                                                <div
                                                    className={`
                                                        flex
                                                        h-5
                                                        w-5
                                                        items-center
                                                        justify-center
                                                        rounded-full
                                                        transition-all
                                                        duration-200

                                                        ${
                                                            active
                                                                ? 'scale-100'
                                                                : 'scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-50'
                                                        }
                                                    `}
                                                >
                                                    {active && (
                                                        <Check className="h-4 w-4 animate-in zoom-in-50 duration-200" />
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                },
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        /* ================================================================
           STEP 3 — TAGLINE & REFERENCE
        ================================================================= */

        if (currentStep === 3) {
            return (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
                    {/* Tagline Mode */}
                    <div className="space-y-4">
                        <div>
                            <Label>
                                Tagline behavior
                            </Label>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Decide how the tagline should be
                                handled during generation.
                            </p>
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                            {tagLineModes.map(
                                (option) => {
                                    const active =
                                        form.tagline_mode ===
                                        option.value;

                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() =>
                                                updateField(
                                                    'tagline_mode',
                                                    option.value,
                                                )
                                            }
                                            className={`
                                                group
                                                rounded-xl
                                                border
                                                p-4
                                                text-left

                                                transition-all
                                                duration-200

                                                hover:-translate-y-0.5
                                                hover:shadow-sm

                                                active:translate-y-0

                                                ${
                                                    active
                                                        ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                                                        : 'border-border bg-background hover:bg-muted/50'
                                                }
                                            `}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p
                                                        className={`
                                                            text-sm
                                                            font-medium
                                                            transition-colors
                                                            duration-200

                                                            ${
                                                                active
                                                                    ? 'text-primary'
                                                                    : 'text-foreground'
                                                            }
                                                        `}
                                                    >
                                                        {option.label}
                                                    </p>

                                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                                        {
                                                            option.description
                                                        }
                                                    </p>
                                                </div>

                                                <div
                                                    className={`
                                                        flex
                                                        h-6
                                                        w-6
                                                        shrink-0
                                                        items-center
                                                        justify-center
                                                        rounded-full
                                                        transition-all
                                                        duration-200

                                                        ${
                                                            active
                                                                ? 'scale-100 bg-primary text-primary-foreground'
                                                                : 'scale-90 border border-border opacity-60'
                                                        }
                                                    `}
                                                >
                                                    {active && (
                                                        <Check className="h-3.5 w-3.5 animate-in zoom-in-50 duration-200" />
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                },
                            )}
                        </div>
                    </div>

                    {/* Tagline */}
                    <div className="space-y-2">
                        <Label htmlFor="tagline">
                            Custom tagline
                        </Label>

                        <Input
                            id="tagline"
                            value={form.tagline}
                            onChange={(event) =>
                                updateField(
                                    'tagline',
                                    event.target.value,
                                )
                            }
                            placeholder="Fresh coffee, made for your everyday ritual."
                            className="
                                transition-all
                                duration-200
                                hover:border-ring/50
                                focus-visible:shadow-[0_0_0_3px_hsl(var(--ring)/0.08)]
                            "
                        />

                        <p className="text-xs text-muted-foreground">
                            You can leave this empty when using
                            automatic generation.
                        </p>
                    </div>

                    {/* Reference Image */}
                    <div className="space-y-3">
                        <div>
                            <Label htmlFor="reference_image">
                                Reference image
                            </Label>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Optionally provide an image to help
                                guide the visual direction.
                            </p>
                        </div>

                        <div
                            className="
                                rounded-xl
                                border
                                border-dashed
                                border-border
                                bg-muted/20
                                p-5

                                transition-all
                                duration-200

                                hover:border-primary/40
                                hover:bg-muted/30
                            "
                        >
                            <Input
                                id="reference_image"
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={(event) =>
                                    updateField(
                                        'reference_image',
                                        event.target.files?.[0] ??
                                            null,
                                    )
                                }
                                className="cursor-pointer"
                            />
                        </div>

                        {form.reference_image && (
                            <p className="animate-in fade-in slide-in-from-top-1 text-xs text-muted-foreground duration-200">
                                Selected:{' '}
                                <span className="font-medium text-foreground">
                                    {
                                        form.reference_image
                                            .name
                                    }
                                </span>
                            </p>
                        )}

                        {errors.reference_image && (
                            <p className="animate-in fade-in slide-in-from-top-1 text-sm text-destructive duration-200">
                                {errors.reference_image}
                            </p>
                        )}
                    </div>
                </div>
            );
        }

        /* ================================================================
           STEP 4 — REVIEW
        ================================================================= */

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
                {/* Summary */}
                <div
                    className="
                        rounded-xl
                        border
                        border-border
                        bg-muted/30
                        p-5

                        transition-all
                        duration-300

                        hover:bg-muted/40
                    "
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="
                                flex
                                h-10
                                w-10
                                items-center
                                justify-center
                                rounded-xl
                                border
                                border-border
                                bg-background

                                shadow-sm

                                transition-transform
                                duration-300

                                hover:scale-105
                            "
                        >
                            <Check className="h-4 w-4 text-primary" />
                        </div>

                        <div>
                            <h3 className="font-semibold text-foreground">
                                Generation summary
                            </h3>

                            <p className="text-sm text-muted-foreground">
                                Review your inputs before generating
                                the design.
                            </p>
                        </div>
                    </div>

                    <dl className="mt-6 grid gap-5 text-sm md:grid-cols-2">
                        <div>
                            <dt className="text-muted-foreground">
                                Product
                            </dt>

                            <dd className="mt-1 font-medium text-foreground">
                                {form.product_name ||
                                    selectedProduct?.name ||
                                    'Custom product'}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-muted-foreground">
                                Event
                            </dt>

                            <dd className="mt-1 font-medium text-foreground">
                                {selectedEvent?.name ||
                                    'No event selected'}
                            </dd>
                        </div>

                        <div className="md:col-span-2">
                            <dt className="text-muted-foreground">
                                Marketing goal
                            </dt>

                            <dd className="mt-1 font-medium leading-6 text-foreground">
                                {form.marketing_goal ||
                                    'No goal provided yet'}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-muted-foreground">
                                Content style
                            </dt>

                            <dd className="mt-1 font-medium text-foreground">
                                {form.content_style.join(
                                    ', ',
                                ) || 'Not selected'}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-muted-foreground">
                                Brand tone
                            </dt>

                            <dd className="mt-1 font-medium text-foreground">
                                {form.brand_tone.join(
                                    ', ',
                                ) || 'Not selected'}
                            </dd>
                        </div>

                        <div className="md:col-span-2">
                            <dt className="text-muted-foreground">
                                Tagline
                            </dt>

                            <dd className="mt-1 font-medium text-foreground">
                                {form.tagline ||
                                    'Auto-generated by the workflow'}
                            </dd>
                        </div>
                    </dl>
                </div>

                {/* Target Audience */}
                <div className="space-y-2">
                    <Label htmlFor="target_audience">
                        Target audience
                    </Label>

                    <Input
                        id="target_audience"
                        value={form.target_audience}
                        onChange={(event) =>
                            updateField(
                                'target_audience',
                                event.target.value,
                            )
                        }
                        placeholder="Young professionals, local commuters, and wellness shoppers"
                        className="
                            transition-all
                            duration-200
                            hover:border-ring/50
                            focus-visible:shadow-[0_0_0_3px_hsl(var(--ring)/0.08)]
                        "
                    />
                </div>

                {/* USP */}
                <div className="space-y-2">
                    <Label htmlFor="unique_selling_point">
                        Unique selling point
                    </Label>

                    <Textarea
                        id="unique_selling_point"
                        value={form.unique_selling_point}
                        onChange={(event) =>
                            updateField(
                                'unique_selling_point',
                                event.target.value,
                            )
                        }
                        placeholder="Small-batch ingredients, premium packaging, and a neighborhood-first brand experience."
                        className="
                            min-h-24
                            resize-none
                            transition-all
                            duration-200
                            hover:border-ring/50
                            focus-visible:shadow-[0_0_0_3px_hsl(var(--ring)/0.08)]
                        "
                    />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                    <Label htmlFor="notes">
                        Creative notes
                    </Label>

                    <Textarea
                        id="notes"
                        value={form.notes}
                        onChange={(event) =>
                            updateField(
                                'notes',
                                event.target.value,
                            )
                        }
                        placeholder="Use warm studio lighting, clean product framing, and a premium but approachable visual direction."
                        className="
                            min-h-24
                            resize-none
                            transition-all
                            duration-200
                            hover:border-ring/50
                            focus-visible:shadow-[0_0_0_3px_hsl(var(--ring)/0.08)]
                        "
                    />
                </div>
            </div>
        );
    };

    return (
        <>
            <Head title="AI Marketing Studio" />

            <div className="min-h-screen bg-background text-foreground">
                <div className="space-y-8 p-4 md:p-6 lg:p-8">
                    {/* =====================================================
                        PAGE HEADER
                    ====================================================== */}
                    <section
                        className="
                            space-y-2

                            animate-in
                            fade-in
                            slide-in-from-bottom-2
                            duration-500
                        "
                    >
                        <p className="text-sm font-medium text-muted-foreground">
                            AI Marketing Studio
                        </p>

                        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                            Create a marketing brief
                        </h1>

                        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                            Define your product, brand direction, and
                            campaign context before generating your
                            marketing asset.
                        </p>
                    </section>

                    {/* =====================================================
                        MAIN GENERATOR CARD
                    ====================================================== */}
                    <Card
                        className="
                            overflow-hidden
                            rounded-2xl
                            border-border
                            bg-card

                            shadow-[0_2px_8px_rgba(0,0,0,0.06)]

                            transition-all
                            duration-300

                            hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]

                            animate-in
                            fade-in
                            slide-in-from-bottom-3
                            duration-500
                        "
                    >
                        {/* =================================================
                            STEP HEADER
                        ================================================== */}
                        <CardHeader className="border-b border-border p-5 md:p-6">
                            <div className="space-y-6">
                                {/* Step Indicator */}
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            Step {currentStep} of{' '}
                                            {stepTitles.length}
                                        </p>

                                        <p
                                            key={currentStep}
                                            className="
                                                mt-1
                                                text-sm
                                                text-muted-foreground

                                                animate-in
                                                fade-in
                                                slide-in-from-left-1
                                                duration-200
                                            "
                                        >
                                            {
                                                stepTitles[
                                                    currentStep -
                                                        1
                                                ]
                                            }
                                        </p>
                                    </div>

                                    <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                                        {Math.round(progress)}%
                                    </span>
                                </div>

                                {/* Progress */}
                                <div className="relative">
                                    <Progress
                                        value={progress}
                                        className="h-1.5 overflow-hidden"
                                    />

                                    <div
                                        className="
                                            pointer-events-none
                                            absolute
                                            inset-y-0
                                            left-0
                                            rounded-full
                                            bg-primary/20
                                            blur-sm
                                            transition-all
                                            duration-500
                                        "
                                        style={{
                                            width: `${progress}%`,
                                        }}
                                    />
                                </div>

                                {/* Step Navigation */}
                                <div className="hidden grid-cols-4 gap-2 md:grid">
                                    {stepTitles.map(
                                        (
                                            title,
                                            index,
                                        ) => {
                                            const step =
                                                index + 1;

                                            const active =
                                                step ===
                                                currentStep;

                                            const completed =
                                                step <
                                                currentStep;

                                            return (
                                                <button
                                                    key={
                                                        title
                                                    }
                                                    type="button"
                                                    onClick={() =>
                                                        setCurrentStep(
                                                            step,
                                                        )
                                                    }
                                                    className={`
                                                        group
                                                        rounded-xl
                                                        px-3
                                                        py-2.5
                                                        text-left
                                                        text-xs

                                                        transition-all
                                                        duration-200

                                                        hover:-translate-y-0.5

                                                        ${
                                                            active
                                                                ? 'bg-primary/10 text-primary shadow-sm'
                                                                : completed
                                                                  ? 'text-foreground hover:bg-muted'
                                                                  : 'text-muted-foreground hover:bg-muted/60'
                                                        }
                                                    `}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <span
                                                            className={`
                                                                flex
                                                                h-6
                                                                w-6
                                                                shrink-0
                                                                items-center
                                                                justify-center
                                                                rounded-full
                                                                border
                                                                text-[10px]
                                                                font-semibold

                                                                transition-all
                                                                duration-200

                                                                ${
                                                                    active
                                                                        ? 'scale-105 border-primary bg-primary text-primary-foreground shadow-sm'
                                                                        : completed
                                                                          ? 'border-primary/40 bg-primary/10 text-primary'
                                                                          : 'border-border bg-background group-hover:border-primary/30'
                                                                }
                                                            `}
                                                        >
                                                            {completed ? (
                                                                <Check className="h-3 w-3 animate-in zoom-in-50 duration-200" />
                                                            ) : (
                                                                step
                                                            )}
                                                        </span>

                                                        <span>
                                                            {
                                                                title
                                                            }
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        },
                                    )}
                                </div>
                            </div>
                        </CardHeader>

                        {/* =================================================
                            CONTENT
                        ================================================== */}
                        <CardContent className="p-5 md:p-7">
                            {renderStep()}

                            {/* =================================================
                                FOOTER ACTIONS
                            ================================================== */}
                            <div className="mt-10 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={
                                        previousStep
                                    }
                                    disabled={
                                        currentStep === 1 ||
                                        isSubmitting
                                    }
                                    className="
                                        gap-2
                                        shadow-none

                                        transition-all
                                        duration-200

                                        hover:-translate-x-0.5
                                        hover:shadow-sm
                                    "
                                >
                                    <ArrowLeft className="h-4 w-4" />

                                    Back
                                </Button>

                                {currentStep <
                                stepTitles.length ? (
                                    <Button
                                        type="button"
                                        onClick={
                                            nextStep
                                        }
                                        className="
                                            group
                                            gap-2
                                            shadow-sm

                                            transition-all
                                            duration-200

                                            hover:translate-x-0.5
                                            hover:shadow-md
                                        "
                                        disabled={
                                            isSubmitting
                                        }
                                    >
                                        Continue

                                        <ArrowRight
                                            className="
                                                h-4
                                                w-4

                                                transition-transform
                                                duration-200

                                                group-hover:translate-x-1
                                            "
                                        />
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={
                                            submit
                                        }
                                        className="
                                            group
                                            gap-2
                                            shadow-sm

                                            transition-all
                                            duration-200

                                            hover:scale-[1.01]
                                            hover:shadow-md

                                            active:scale-[0.99]
                                        "
                                        disabled={
                                            isSubmitting
                                        }
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span
                                                    className="
                                                        h-4
                                                        w-4
                                                        animate-spin
                                                        rounded-full
                                                        border-2
                                                        border-current
                                                        border-t-transparent
                                                    "
                                                />

                                                Creating your
                                                marketing
                                                visual
                                            </>
                                        ) : (
                                            <>
                                                Generate design

                                                <Sparkles
                                                    className="
                                                        h-4
                                                        w-4

                                                        transition-transform
                                                        duration-300

                                                        group-hover:rotate-12
                                                        group-hover:scale-110
                                                    "
                                                />
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* =====================================================
                        GENERATION STATUS
                    ====================================================== */}
                    {isSubmitting && (
                        <Card
                            className="
                                overflow-hidden
                                rounded-2xl
                                border-border
                                bg-card

                                shadow-[0_2px_8px_rgba(0,0,0,0.06)]

                                animate-in
                                fade-in
                                slide-in-from-bottom-2
                                duration-300
                            "
                        >
                            <CardContent className="p-5">
                                <div className="flex items-center gap-4">
                                    <div
                                        className="
                                            relative
                                            flex
                                            h-11
                                            w-11
                                            shrink-0
                                            items-center
                                            justify-center
                                            rounded-xl
                                            border
                                            border-primary/20
                                            bg-primary/5
                                        "
                                    >
                                        <span
                                            className="
                                                absolute
                                                h-8
                                                w-8
                                                animate-ping
                                                rounded-full
                                                bg-primary/10
                                            "
                                        />

                                        <span
                                            className="
                                                relative
                                                h-5
                                                w-5
                                                animate-spin
                                                rounded-full
                                                border-2
                                                border-primary
                                                border-t-transparent
                                            "
                                        />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="font-medium text-foreground">
                                            Preparing your campaign
                                        </p>

                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Creating your marketing
                                            visual and finalizing
                                            your design.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
}

GeneratorPage.layout = {
    breadcrumbs: [
        {
            title: 'AI Marketing Studio',
            href: '/generator',
        },
    ],
};