import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type BusinessForm = {
    name: string;
    industry: string;
    category: string;
    description: string;
};

type BrandForm = {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    brand_tone: string[];
    typography: string;
    brand_guidelines: string;
    visual_preferences: string;
};

type PreferencesForm = {
    target_audience: string;
    unique_selling_point: string;
    content_style: string[];
    default_tagline_behavior: string;
};

type Props = {
    step?: number;
    business?: Partial<BusinessForm> | null;
    brand?: Partial<BrandForm> | null;
};

type StepConfig = {
    title: string;
    subtitle?: string;
};

const steps: StepConfig[] = [
    { title: 'Welcome', subtitle: 'Set up your business profile' },
    { title: 'Business Information', subtitle: 'Tell us about your company' },
    { title: 'Brand Identity', subtitle: 'Define your visual direction' },
    { title: 'Marketing Preferences', subtitle: 'Tune the type of content you want' },
    { title: 'Complete', subtitle: 'You’re ready to go' },
];

const industryOptions = [
    'Retail',
    'Food & Beverage',
    'Technology',
    'Healthcare',
    'Real Estate',
    'Education',
    'Beauty & Wellness',
    'Professional Services',
    'Travel & Hospitality',
    'Automotive',
    'Finance',
    'E-commerce',
    'Other',
];

const toneOptions = [
    'Professional',
    'Friendly',
    'Luxury',
    'Playful',
    'Minimal',
    'Bold',
    'Elegant',
    'Modern',
    'Trustworthy',
    'Energetic',
    'Warm',
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

const taglineOptions = [
    'Always generate automatically',
    'Let me write the tagline',
    'Ask me each time',
];

function toggleItem(items: string[], value: string) {
    return items.includes(value)
        ? items.filter((item) => item !== value)
        : [...items, value];
}

export default function OnboardingIndex({ step = 1, business, brand }: Props) {
    const { errors, flash } = usePage().props as any;
    const [currentStep, setCurrentStep] = useState(Math.min(Math.max(step, 1), 5));
    const [businessForm, setBusinessForm] = useState<BusinessForm>({
        name: business?.name ?? '',
        industry: business?.industry ?? '',
        category: business?.category ?? '',
        description: business?.description ?? '',
    });
    const [brandForm, setBrandForm] = useState<BrandForm>({
        primary_color: brand?.primary_color ?? '#111827',
        secondary_color: brand?.secondary_color ?? '#F59E0B',
        accent_color: brand?.accent_color ?? '#E5E7EB',
        brand_tone: brand?.brand_tone ?? [],
        typography: brand?.typography ?? '',
        brand_guidelines: brand?.brand_guidelines ?? '',
        visual_preferences: brand?.visual_preferences ?? '',
    });
    const [preferencesForm, setPreferencesForm] = useState<PreferencesForm>({
        target_audience: business?.target_audience ?? '',
        unique_selling_point: business?.unique_selling_point ?? '',
        content_style: business?.content_style ?? [],
        default_tagline_behavior: business?.default_tagline_behavior ?? '',
    });

    const progress = useMemo(() => ((currentStep - 1) / 4) * 100, [currentStep]);

    const goToStep = (stepNumber: number) => {
        setCurrentStep(Math.min(Math.max(stepNumber, 1), 5));
        if (stepNumber !== currentStep) {
            router.get('/onboarding', { step: stepNumber }, { preserveState: true, preserveScroll: true });
        }
    };

    const submitBusiness = () => {
        router.post('/onboarding/business', businessForm, {
            preserveScroll: true,
            onSuccess: () => goToStep(3),
        });
    };

    const submitBrand = () => {
        router.post('/onboarding/brand', {
            ...brandForm,
            brand_tone: brandForm.brand_tone,
        }, {
            preserveScroll: true,
            onSuccess: () => goToStep(4),
        });
    };

    const submitPreferences = () => {
        router.post('/onboarding/preferences', preferencesForm, {
            preserveScroll: true,
            onSuccess: () => goToStep(5),
        });
    };

    const nextAction = () => {
        if (currentStep === 1) {
            goToStep(2);
            return;
        }

        if (currentStep === 2) {
            submitBusiness();
            return;
        }

        if (currentStep === 3) {
            submitBrand();
            return;
        }

        if (currentStep === 4) {
            submitPreferences();
            return;
        }

        router.post('/onboarding/complete');
    };

    const renderProgress = () => (
        <div className="mb-8 space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Step {currentStep} of 5</span>
                <span>{steps[currentStep - 1].title}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="hidden items-center justify-between gap-2 md:flex">
                {steps.map((stepItem, index) => (
                    <div key={stepItem.title} className="flex flex-1 items-center gap-2">
                        <div className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full border text-xs font-medium',
                            currentStep === index + 1 ? 'border-primary bg-primary text-primary-foreground' : index + 1 < currentStep ? 'border-primary bg-primary/10 text-primary' : 'border-muted-foreground/30 bg-background text-muted-foreground',
                        )}>
                            {index + 1 < currentStep ? <Check className="h-4 w-4" /> : index + 1}
                        </div>
                        {index < steps.length - 1 && <div className="h-px flex-1 bg-border" />}
                    </div>
                ))}
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1 md:hidden">
                {steps.map((stepItem, index) => (
                    <div key={stepItem.title} className={cn('rounded-full border px-2 py-1 text-[10px] uppercase tracking-wide', currentStep === index + 1 ? 'border-primary text-primary' : 'border-muted text-muted-foreground')}>
                        {stepItem.title}
                    </div>
                ))}
            </div>
        </div>
    );

    const renderWelcome = () => (
        <div className="space-y-6">
            <div className="flex items-center gap-3 text-primary">
                <div className="rounded-full bg-primary/10 p-2">
                    <Sparkles className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">Welcome</span>
            </div>
            <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight">Welcome to AI Marketing Automation</h1>
                <p className="text-base text-muted-foreground">
                    Let&apos;s set up your business so we can create marketing content that fits your brand.
                </p>
                <p className="text-sm text-muted-foreground">
                    This setup only takes a few minutes and helps us tailor content to your business.
                </p>
            </div>
        </div>
    );

    const renderBusiness = () => (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-semibold tracking-tight">Tell us about your business</h1>
            </div>
            <div className="grid gap-5">
                <div className="space-y-2">
                    <Label htmlFor="name">Business Name</Label>
                    <Input id="name" value={businessForm.name} onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })} placeholder="Northstar Studio" />
                    {errors?.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select value={businessForm.industry} onValueChange={(value) => setBusinessForm({ ...businessForm, industry: value })}>
                        <SelectTrigger id="industry" className="w-full">
                            <SelectValue placeholder="Select an industry" />
                        </SelectTrigger>
                        <SelectContent>
                            {industryOptions.map((option) => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors?.industry && <p className="text-sm text-destructive">{errors.industry}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="category">Business Category</Label>
                    <Input id="category" value={businessForm.category} onChange={(e) => setBusinessForm({ ...businessForm, category: e.target.value })} placeholder="Coffee Shop, SaaS Agency, Dental Clinic" />
                    {errors?.category && <p className="text-sm text-destructive">{errors.category}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">About Your Business</Label>
                    <Textarea id="description" value={businessForm.description} onChange={(e) => setBusinessForm({ ...businessForm, description: e.target.value })} placeholder="Tell us what your business does, who you serve, and what makes it unique." rows={5} />
                    {errors?.description && <p className="text-sm text-destructive">{errors.description}</p>}
                </div>
            </div>
        </div>
    );

    const renderBrand = () => (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-semibold tracking-tight">Build your brand identity</h1>
                <p className="mt-2 text-muted-foreground">Your brand settings help keep generated marketing designs visually consistent.</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="primary_color">Primary Color</Label>
                    <div className="flex items-center gap-3 rounded-md border px-3 py-2">
                        <input type="color" value={brandForm.primary_color} onChange={(e) => setBrandForm({ ...brandForm, primary_color: e.target.value })} className="h-10 w-12 rounded border-0 bg-transparent p-0" />
                        <Input id="primary_color" value={brandForm.primary_color} onChange={(e) => setBrandForm({ ...brandForm, primary_color: e.target.value })} className="flex-1" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="secondary_color">Secondary Color</Label>
                    <div className="flex items-center gap-3 rounded-md border px-3 py-2">
                        <input type="color" value={brandForm.secondary_color} onChange={(e) => setBrandForm({ ...brandForm, secondary_color: e.target.value })} className="h-10 w-12 rounded border-0 bg-transparent p-0" />
                        <Input id="secondary_color" value={brandForm.secondary_color} onChange={(e) => setBrandForm({ ...brandForm, secondary_color: e.target.value })} className="flex-1" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="accent_color">Accent Color</Label>
                    <div className="flex items-center gap-3 rounded-md border px-3 py-2">
                        <input type="color" value={brandForm.accent_color} onChange={(e) => setBrandForm({ ...brandForm, accent_color: e.target.value })} className="h-10 w-12 rounded border-0 bg-transparent p-0" />
                        <Input id="accent_color" value={brandForm.accent_color} onChange={(e) => setBrandForm({ ...brandForm, accent_color: e.target.value })} className="flex-1" />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="typography">Typography</Label>
                    <Select value={brandForm.typography} onValueChange={(value) => setBrandForm({ ...brandForm, typography: value })}>
                        <SelectTrigger id="typography" className="w-full">
                            <SelectValue placeholder="Select a typography style" />
                        </SelectTrigger>
                        <SelectContent>
                            {['Modern Sans', 'Classic Serif', 'Minimal', 'Bold', 'Elegant'].map((option) => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Brand Tone</Label>
                <div className="flex flex-wrap gap-2">
                    {toneOptions.map((tone) => {
                        const isSelected = brandForm.brand_tone.includes(tone);
                        return (
                            <button
                                type="button"
                                key={tone}
                                onClick={() => setBrandForm({ ...brandForm, brand_tone: toggleItem(brandForm.brand_tone, tone) })}
                                className={cn('rounded-full border px-3 py-1.5 text-sm transition', isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted bg-transparent text-muted-foreground hover:bg-muted')}
                            >
                                {tone}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="brand_guidelines">Brand Guidelines</Label>
                <Textarea id="brand_guidelines" value={brandForm.brand_guidelines} onChange={(e) => setBrandForm({ ...brandForm, brand_guidelines: e.target.value })} placeholder="Describe any important rules your marketing designs should follow." rows={4} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="visual_preferences">Visual Preferences</Label>
                <Textarea id="visual_preferences" value={brandForm.visual_preferences} onChange={(e) => setBrandForm({ ...brandForm, visual_preferences: e.target.value })} placeholder="Describe the visual style you prefer for your marketing images." rows={4} />
            </div>
        </div>
    );

    const renderPreferences = () => (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-semibold tracking-tight">Marketing preferences</h1>
            </div>

            <div className="grid gap-5">
                <div className="space-y-2">
                    <Label htmlFor="target_audience">Who is your target audience?</Label>
                    <Textarea id="target_audience" value={preferencesForm.target_audience} onChange={(e) => setPreferencesForm({ ...preferencesForm, target_audience: e.target.value })} placeholder="Young professionals aged 25–40 who enjoy premium coffee." rows={3} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="unique_selling_point">What makes your business different?</Label>
                    <Textarea id="unique_selling_point" value={preferencesForm.unique_selling_point} onChange={(e) => setPreferencesForm({ ...preferencesForm, unique_selling_point: e.target.value })} placeholder="We use locally sourced beans and roast them in small batches." rows={3} />
                </div>

                <div className="space-y-2">
                    <Label>What type of marketing content do you prefer?</Label>
                    <div className="flex flex-wrap gap-2">
                        {contentStyleOptions.map((option) => {
                            const selected = preferencesForm.content_style.includes(option);
                            return (
                                <button
                                    type="button"
                                    key={option}
                                    onClick={() => setPreferencesForm({ ...preferencesForm, content_style: toggleItem(preferencesForm.content_style, option) })}
                                    className={cn('rounded-full border px-3 py-1.5 text-sm transition', selected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted bg-transparent text-muted-foreground hover:bg-muted')}
                                >
                                    {option}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>How should taglines normally be handled?</Label>
                    <div className="grid gap-2 md:grid-cols-3">
                        {taglineOptions.map((option) => (
                            <button
                                type="button"
                                key={option}
                                onClick={() => setPreferencesForm({ ...preferencesForm, default_tagline_behavior: option })}
                                className={cn('rounded-md border p-3 text-left text-sm transition', preferencesForm.default_tagline_behavior === option ? 'border-primary bg-primary/10 text-primary' : 'border-muted bg-transparent text-muted-foreground hover:bg-muted')}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderComplete = () => (
        <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Check className="h-8 w-8" />
            </div>
            <div>
                <h1 className="text-3xl font-semibold tracking-tight">You&apos;re all set!</h1>
                <p className="mt-3 text-muted-foreground">Your business profile is ready. Let&apos;s start creating marketing content.</p>
            </div>
            <div className="grid gap-3 rounded-xl border bg-muted/30 p-4 text-left md:grid-cols-3">
                <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Business</p><p className="mt-2 font-medium">{businessForm.name || 'Not set yet'}</p></div>
                <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Brand</p><p className="mt-2 font-medium">{brandForm.typography || 'Brand identity set'}</p></div>
                <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Marketing Preferences</p><p className="mt-2 font-medium">{preferencesForm.content_style.length ? preferencesForm.content_style.join(', ') : 'Customizable'}</p></div>
            </div>
        </div>
    );

    return (
        <>
            <Head title="Onboarding" />
            <div className="flex min-h-screen items-center justify-center bg-background p-4 md:p-6">
                <Card className="w-full max-w-4xl overflow-hidden shadow-xl">
                    <CardHeader className="border-b bg-muted/30">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Setup Wizard</p>
                                <CardTitle className="mt-1 text-2xl">Onboarding</CardTitle>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <span>AI Marketing Automation</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8">
                        {renderProgress()}

                        {flash?.message && (
                            <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                                {flash.message}
                            </div>
                        )}

                        {currentStep === 1 && renderWelcome()}
                        {currentStep === 2 && renderBusiness()}
                        {currentStep === 3 && renderBrand()}
                        {currentStep === 4 && renderPreferences()}
                        {currentStep === 5 && renderComplete()}

                        <div className="mt-8 flex items-center justify-between gap-3 border-t pt-6">
                            <Button variant="outline" type="button" onClick={() => currentStep > 1 && goToStep(currentStep - 1)} disabled={currentStep === 1} className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Button>

                            {currentStep < 5 ? (
                                <Button type="button" onClick={nextAction} className="gap-2">
                                    {currentStep === 1 ? 'Get Started' : 'Continue'}
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button type="button" onClick={nextAction} className="gap-2">
                                    Go to Dashboard
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
