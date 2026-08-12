import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    { value: 'auto', label: 'Generate automatically' },
    { value: 'manual', label: 'Use my tagline' },
    { value: 'ask_me', label: 'Ask me each time' },
];

function toggleValue(values: string[], next: string) {
    return values.includes(next)
        ? values.filter((value) => value !== next)
        : [...values, next];
}

export default function GeneratorPage() {
    const pageProps = usePage().props as any;
    const { business, brand, products = [], events = [], campaign = null, errors = {} } = pageProps;
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({
        product_id: '',
        event_id: '',
        product_name: business?.name ? `${business.name} Offer` : '',
        marketing_goal: '',
        content_style: Array.isArray(brand?.brand_tone) ? [...brand.brand_tone] : [],
        brand_tone: Array.isArray(brand?.brand_tone) ? [...brand.brand_tone] : [],
        tagline: '',
        tagline_mode: 'auto',
        target_audience: business?.target_audience ?? '',
        unique_selling_point: business?.unique_selling_point ?? '',
        notes: '',
        reference_image: null as File | null,
    });

    const progress = useMemo(() => (currentStep / stepTitles.length) * 100, [currentStep]);

    useEffect(() => {
        if (campaign) {
            if (campaign.product_id) {
                updateField('product_id', String(campaign.product_id));
            }

            if (campaign.event_id) {
                updateField('event_id', String(campaign.event_id));
            }

            if (campaign.name) {
                updateField('marketing_goal', campaign.objective || form.marketing_goal || '');
            }

            if (campaign.target_audience) {
                updateField('target_audience', campaign.target_audience);
            }
        }
    }, [campaign]);

    const selectedProduct = products.find((item: any) => String(item.id) === String(form.product_id));
    const selectedEvent = events.find((item: any) => String(item.id) === String(form.event_id));

    const updateField = <K extends keyof typeof form>(field: K, value: typeof form[K]) => {
        setForm((previous) => ({ ...previous, [field]: value }));
    };

    const goToStep = (step: number) => setCurrentStep(Math.min(Math.max(step, 1), stepTitles.length));

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

        if (form.product_id) payload.append('product_id', form.product_id);
        if (form.event_id) payload.append('event_id', form.event_id);
        if (campaign?.id) payload.append('campaign_id', String(campaign.id));
        payload.append('product_name', form.product_name || selectedProduct?.name || 'Custom product');
        payload.append('marketing_goal', form.marketing_goal);
        payload.append('target_audience', form.target_audience || business?.target_audience || '');
        payload.append('unique_selling_point', form.unique_selling_point || business?.unique_selling_point || '');
        if (campaign?.name) payload.append('campaign_name', campaign.name);
        if (campaign?.objective) payload.append('campaign_objective', campaign.objective);
        if (campaign?.target_audience) payload.append('campaign_target_audience', campaign.target_audience);
        payload.append('tagline', form.tagline || '');
        payload.append('tagline_mode', form.tagline_mode || 'auto');
        payload.append('notes', form.notes || '');

        form.content_style.forEach((item) => payload.append('content_style[]', item));
        form.brand_tone.forEach((item) => payload.append('brand_tone[]', item));

        if (form.reference_image) {
            payload.append('reference_image', form.reference_image);
        }

        router.post('/generator', payload, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => setIsSubmitting(false),
            onError: () => setIsSubmitting(false),
        });
    };

    const renderStep = () => {
        if (currentStep === 1) {
            return (
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="product_id">Product</Label>
                        <select
                            id="product_id"
                            value={form.product_id}
                            onChange={(event) => updateField('product_id', event.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <option value="">Select an existing product</option>
                            {products.map((product: any) => (
                                <option key={product.id} value={product.id}>
                                    {product.name}
                                </option>
                            ))}
                        </select>
                        {errors.product_id && <p className="text-sm text-destructive">{errors.product_id}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="product_name">Product name</Label>
                        <Input
                            id="product_name"
                            value={form.product_name}
                            onChange={(event) => updateField('product_name', event.target.value)}
                            placeholder="North Star Seasonal Blend"
                        />
                        {errors.product_name && <p className="text-sm text-destructive">{errors.product_name}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="event_id">Campaign event</Label>
                        <select
                            id="event_id"
                            value={form.event_id}
                            onChange={(event) => updateField('event_id', event.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <option value="">Select an upcoming event</option>
                            {events.map((event: any) => (
                                <option key={event.id} value={event.id}>
                                    {event.name} {event.date ? `(${event.date})` : ''}
                                </option>
                            ))}
                        </select>
                        {errors.event_id && <p className="text-sm text-destructive">{errors.event_id}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="marketing_goal">Primary marketing goal</Label>
                        <Textarea
                            id="marketing_goal"
                            value={form.marketing_goal}
                            onChange={(event) => updateField('marketing_goal', event.target.value)}
                            placeholder="Drive weekend traffic and increase conversion for the new seasonal release."
                        />
                        {errors.marketing_goal && <p className="text-sm text-destructive">{errors.marketing_goal}</p>}
                    </div>
                </div>
            );
        }

        if (currentStep === 2) {
            return (
                <div className="space-y-6">
                    <div className="space-y-3">
                        <Label>Content style</Label>
                        <div className="grid gap-2 md:grid-cols-2">
                            {contentStyleOptions.map((option) => {
                                const active = form.content_style.includes(option);

                                return (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => updateField('content_style', toggleValue(form.content_style, option))}
                                        className={`rounded-xl border p-3 text-left transition ${active ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background hover:bg-muted'}`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-sm font-medium">{option}</span>
                                            {active && <Check className="h-4 w-4" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label>Brand tone</Label>
                        <div className="grid gap-2 md:grid-cols-3">
                            {toneOptions.map((option) => {
                                const active = form.brand_tone.includes(option);

                                return (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => updateField('brand_tone', toggleValue(form.brand_tone, option))}
                                        className={`rounded-xl border p-3 text-left transition ${active ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background hover:bg-muted'}`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-sm">{option}</span>
                                            {active && <Check className="h-4 w-4" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            );
        }

        if (currentStep === 3) {
            return (
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="tagline_mode">Tagline behavior</Label>
                        <div className="grid gap-2 md:grid-cols-3">
                            {tagLineModes.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => updateField('tagline_mode', option.value)}
                                    className={`rounded-xl border p-3 text-left transition ${form.tagline_mode === option.value ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background hover:bg-muted'}`}
                                >
                                    <span className="text-sm font-medium">{option.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tagline">Custom tagline</Label>
                        <Input
                            id="tagline"
                            value={form.tagline}
                            onChange={(event) => updateField('tagline', event.target.value)}
                            placeholder="Fresh coffee, made for your everyday ritual."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reference_image">Reference image</Label>
                        <Input
                            id="reference_image"
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={(event) => updateField('reference_image', event.target.files?.[0] ?? null)}
                        />
                        {errors.reference_image && <p className="text-sm text-destructive">{errors.reference_image}</p>}
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <div className="rounded-2xl border bg-muted/30 p-4">
                    <h3 className="text-lg font-semibold">Generation summary</h3>
                    <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
                        <div>
                            <dt className="text-muted-foreground">Product</dt>
                            <dd className="mt-1 font-medium">{form.product_name || selectedProduct?.name || 'Custom product'}</dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">Event</dt>
                            <dd className="mt-1 font-medium">{selectedEvent?.name || 'No event selected'}</dd>
                        </div>
                        <div className="md:col-span-2">
                            <dt className="text-muted-foreground">Marketing goal</dt>
                            <dd className="mt-1 font-medium">{form.marketing_goal || 'No goal provided yet'}</dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">Content style</dt>
                            <dd className="mt-1 font-medium">{form.content_style.join(', ') || 'Not selected'}</dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">Brand tone</dt>
                            <dd className="mt-1 font-medium">{form.brand_tone.join(', ') || 'Not selected'}</dd>
                        </div>
                        <div className="md:col-span-2">
                            <dt className="text-muted-foreground">Tagline</dt>
                            <dd className="mt-1 font-medium">{form.tagline || 'Auto-generated by the workflow'}</dd>
                        </div>
                    </dl>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="target_audience">Target audience</Label>
                    <Input
                        id="target_audience"
                        value={form.target_audience}
                        onChange={(event) => updateField('target_audience', event.target.value)}
                        placeholder="Young professionals, local commuters, and wellness shoppers"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="unique_selling_point">Unique selling point</Label>
                    <Textarea
                        id="unique_selling_point"
                        value={form.unique_selling_point}
                        onChange={(event) => updateField('unique_selling_point', event.target.value)}
                        placeholder="Small-batch ingredients, premium packaging, and a neighborhood-first brand experience."
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="notes">Creative notes</Label>
                    <Textarea
                        id="notes"
                        value={form.notes}
                        onChange={(event) => updateField('notes', event.target.value)}
                        placeholder="Use warm studio lighting, clean product framing, and a premium but approachable visual direction."
                    />
                </div>
            </div>
        );
    };

    return (
        <>
            <Head title="AI Marketing Studio" />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">AI Marketing Studio</p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Create a marketing brief</h1>
                        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                            Capture your product details, brand signal, and campaign context before generating the next marketing asset.
                        </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border bg-primary/5 px-3 py-2 text-sm font-medium text-primary">
                        <Sparkles className="h-4 w-4" />
                        Draft workflow
                    </div>
                </div>

                <Card className="shadow-sm">
                    <CardHeader className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>Step {currentStep} of {stepTitles.length}</span>
                                <span>{stepTitles[currentStep - 1]}</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {renderStep()}

                        <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-between">
                            <Button type="button" variant="outline" onClick={previousStep} disabled={currentStep === 1} className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Button>

                            {currentStep < stepTitles.length ? (
                                <Button type="button" onClick={nextStep} className="gap-2" disabled={isSubmitting}>
                                    Continue
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button type="button" onClick={submit} className="gap-2" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                            Creating your marketing visual
                                        </>
                                    ) : (
                                        <>
                                            Generate design
                                            <Sparkles className="h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {isSubmitting && (
                    <div className="rounded-2xl border bg-card p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/5">
                                <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            </div>
                            <div>
                                <p className="text-base font-semibold">Preparing your campaign</p>
                                <p className="text-sm text-muted-foreground">Creating your marketing visual and finalizing your design.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

GeneratorPage.layout = {
    breadcrumbs: [
        { title: 'AI Marketing Studio', href: '/generator' },
    ],
};
