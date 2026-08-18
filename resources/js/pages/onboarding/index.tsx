import { Head, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Briefcase,
    Car,
    Check,
    Cpu,
    GraduationCap,
    HeartPulse,
    Home,
    Landmark,
    Layers,
    Mail,
    Megaphone,
    Package,
    PartyPopper,
    Plane,
    Share2,
    ShoppingBag,
    ShoppingCart,
    Sparkles,
    Tag,
    UtensilsCrossed,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

type BusinessForm = {
    name: string;
    industry: string;
    category: string;
};

type DescriptionForm = {
    description: string;
};

type PreferencesForm = {
    marketing_preferences: string[];
};

type LogoForm = {
    logo: File | null;
    logoPreview: string | null;
};

type Props = {
    step?: number;
    business?: Partial<BusinessForm & DescriptionForm & { logo_url?: string | null }> | null;
};

/*
|--------------------------------------------------------------------------
| Industry / Category Data
|--------------------------------------------------------------------------
*/

const industryCategories: Record<string, string[]> = {
    Retail: [
        'Clothing Store',
        'Grocery Store',
        'Convenience Store',
        'Furniture Store',
        'Electronics Store',
        'Specialty Store',
        'Department Store',
        'Other Retail',
    ],

    'Food & Beverage': [
        'Restaurant',
        'Coffee Shop',
        'Bakery',
        'Cafe',
        'Fast Food',
        'Bar & Grill',
        'Catering',
        'Food Truck',
        'Other Food & Beverage',
    ],

    Technology: [
        'Software Company',
        'SaaS Business',
        'IT Services',
        'Web Development',
        'Mobile App Development',
        'Technology Consulting',
        'Hardware',
        'Other Technology',
    ],

    Healthcare: [
        'Medical Clinic',
        'Dental Clinic',
        'Pharmacy',
        'Wellness Center',
        'Diagnostic Center',
        'Healthcare Services',
        'Hospital',
        'Other Healthcare',
    ],

    'Real Estate': [
        'Real Estate Agency',
        'Property Developer',
        'Property Management',
        'Real Estate Brokerage',
        'Rental Properties',
        'Commercial Real Estate',
        'Other Real Estate',
    ],

    Education: [
        'School',
        'University',
        'Training Center',
        'Tutorial Center',
        'Online Education',
        'Coaching',
        'Educational Services',
        'Other Education',
    ],

    'Beauty & Wellness': [
        'Salon',
        'Barbershop',
        'Spa',
        'Skincare',
        'Beauty Products',
        'Fitness Center',
        'Wellness Center',
        'Other Beauty & Wellness',
    ],

    'Professional Services': [
        'Consulting',
        'Accounting',
        'Legal Services',
        'Marketing Agency',
        'Design Agency',
        'Business Services',
        'Freelance Services',
        'Other Professional Services',
    ],

    'Travel & Hospitality': [
        'Hotel',
        'Resort',
        'Travel Agency',
        'Tour Operator',
        'Vacation Rental',
        'Restaurant & Hospitality',
        'Transportation',
        'Other Travel & Hospitality',
    ],

    Automotive: [
        'Car Dealership',
        'Auto Repair',
        'Car Rental',
        'Auto Parts',
        'Car Wash',
        'Motorcycle Business',
        'Automotive Services',
        'Other Automotive',
    ],

    Finance: [
        'Banking',
        'Insurance',
        'Financial Services',
        'Accounting Firm',
        'Investment Services',
        'Lending',
        'FinTech',
        'Other Finance',
    ],

    'E-commerce': [
        'Online Store',
        'Marketplace',
        'Subscription Business',
        'Dropshipping',
        'Digital Products',
        'Online Retail',
        'Other E-commerce',
    ],

    Other: [
        'Local Business',
        'Service Business',
        'Online Business',
        'Startup',
        'Nonprofit',
        'Personal Brand',
        'Other',
    ],
};

const industryOptions = Object.keys(industryCategories);

// Purely visual — one icon per industry so the picker reads faster.
const industryIcons: Record<string, LucideIcon> = {
    Retail: ShoppingBag,
    'Food & Beverage': UtensilsCrossed,
    Technology: Cpu,
    Healthcare: HeartPulse,
    'Real Estate': Home,
    Education: GraduationCap,
    'Beauty & Wellness': Sparkles,
    'Professional Services': Briefcase,
    'Travel & Hospitality': Plane,
    Automotive: Car,
    Finance: Landmark,
    'E-commerce': ShoppingCart,
    Other: Layers,
};

const marketingPreferenceOptions = [
    'Social Media',
    'Promotions',
    'Product Marketing',
    'Advertisements',
    'Seasonal Marketing',
    'Email Campaigns',
    'Event Marketing',
];

// Purely visual — one icon per marketing preference.
const preferenceIcons: Record<string, LucideIcon> = {
    'Social Media': Share2,
    Promotions: Tag,
    'Product Marketing': Package,
    Advertisements: Megaphone,
    'Seasonal Marketing': Package,
    'Email Campaigns': Mail,
    'Event Marketing': PartyPopper,
};

const steps = [
    {
        title: 'Business',
        description: 'Basic business information',
    },
    {
        title: 'Description',
        description: 'Describe your business',
    },
    {
        title: 'Marketing',
        description: 'Choose your preferences',
    },
    {
        title: 'Logo',
        description: 'Optional brand logo',
    },
];

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function OnboardingIndex({
    step = 1,
    business,
}: Props) {
    const { errors } = usePage().props as any;

    /*
    |--------------------------------------------------------------------------
    | Main Step
    |--------------------------------------------------------------------------
    */

    const [currentStep, setCurrentStep] = useState(
        Math.min(Math.max(step, 1), 4),
    );

    /*
    |--------------------------------------------------------------------------
    | Step 1 Internal Pages
    |--------------------------------------------------------------------------
    |
    | 1 = Industry
    | 2 = Category
    | 3 = Business Name
    |
    */

    const [businessPage, setBusinessPage] = useState(() => {
        if (business?.industry && business?.category) {
            return 3;
        }

        if (business?.industry) {
            return 2;
        }

        return 1;
    });

    /*
    |--------------------------------------------------------------------------
    | Submission
    |--------------------------------------------------------------------------
    */

    const [isSubmitting, setIsSubmitting] = useState(false);

    /*
    |--------------------------------------------------------------------------
    | Business
    |--------------------------------------------------------------------------
    */

    const [businessForm, setBusinessForm] = useState<BusinessForm>({
        name: business?.name ?? '',
        industry: business?.industry ?? '',
        category: business?.category ?? '',
    });

    const [customCategoryMode, setCustomCategoryMode] = useState(
        business?.industry === 'Other',
    );

    /*
    |--------------------------------------------------------------------------
    | Description
    |--------------------------------------------------------------------------
    */

    const [descriptionForm, setDescriptionForm] =
        useState<DescriptionForm>({
            description: business?.description ?? '',
        });

    /*
    |--------------------------------------------------------------------------
    | Preferences
    |--------------------------------------------------------------------------
    */

    const [preferencesForm, setPreferencesForm] =
        useState<PreferencesForm>({
            marketing_preferences: [],
        });

    const logoInputRef = useRef<HTMLInputElement | null>(null);

    const [logoForm, setLogoForm] = useState<LogoForm>({
        logo: null,
        logoPreview: business?.logo_url ?? null,
    });

    /*
    |--------------------------------------------------------------------------
    | Derived Values
    |--------------------------------------------------------------------------
    */

    const availableCategories = useMemo(() => {
        if (!businessForm.industry) {
            return [];
        }

        return industryCategories[businessForm.industry] ?? [];
    }, [businessForm.industry]);

    /*
    |--------------------------------------------------------------------------
    | Progress
    |--------------------------------------------------------------------------
    */

    const progress =
        currentStep === 1
            ? businessPage === 1
                ? 11
                : businessPage === 2
                  ? 22
                  : 33
            : currentStep === 2
              ? 50
              : currentStep === 3
                ? 75
                : 100;

    /*
    |--------------------------------------------------------------------------
    | Navigation
    |--------------------------------------------------------------------------
    */

    const goToMainStep = (stepNumber: number) => {
        const nextStep = Math.min(Math.max(stepNumber, 1), 4);

        setCurrentStep(nextStep);

        router.get(
            '/onboarding',
            { step: nextStep },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const goBack = () => {
        if (currentStep === 1) {
            if (businessPage > 1) {
                setBusinessPage((page) => page - 1);
            }

            return;
        }

        goToMainStep(currentStep - 1);
    };

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;

        if (!file) {
            setLogoForm({ logo: null, logoPreview: business?.logo_url ?? null });

            return;
        }

        setLogoForm({
            logo: file,
            logoPreview: URL.createObjectURL(file),
        });
    };

    /*
    |--------------------------------------------------------------------------
    | Business Selection
    |--------------------------------------------------------------------------
    */

    const selectIndustry = (industry: string) => {
        setBusinessForm((current) => ({
            ...current,
            industry,
            category: '',
        }));

        setCustomCategoryMode(industry === 'Other');

        setTimeout(() => {
            setBusinessPage(2);
        }, 180);
    };

    const selectCategory = (category: string) => {
        setCustomCategoryMode(category === 'Other');

        setBusinessForm((current) => ({
            ...current,
            category: category === 'Other' ? '' : category,
        }));

        if (category !== 'Other') {
            setTimeout(() => {
                setBusinessPage(3);
            }, 180);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Submit Step 1
    |--------------------------------------------------------------------------
    */

    const submitBusiness = () => {
        if (
            !businessForm.industry ||
            !businessForm.category ||
            !businessForm.name.trim()
        ) {
            return;
        }

        setIsSubmitting(true);

        router.post(
            '/onboarding/business',
            {
                name: businessForm.name.trim(),
                industry: businessForm.industry,
                category: businessForm.category,
            },
            {
                preserveScroll: true,

                onSuccess: () => {
                    setCurrentStep(2);
                    setBusinessPage(1);
                },

                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Submit Description
    |--------------------------------------------------------------------------
    */

    const submitDescription = () => {
        if (!descriptionForm.description.trim()) {
            return;
        }

        setIsSubmitting(true);

        router.post(
            '/onboarding/business',
            {
                ...businessForm,
                description: descriptionForm.description.trim(),
            },
            {
                preserveScroll: true,

                onSuccess: () => {
                    setCurrentStep(3);
                },

                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Preferences
    |--------------------------------------------------------------------------
    */

    const togglePreference = (option: string) => {
        setPreferencesForm((current) => {
            const selected =
                current.marketing_preferences.includes(option);

            return {
                marketing_preferences: selected
                    ? current.marketing_preferences.filter(
                          (item) => item !== option,
                      )
                    : [
                          ...current.marketing_preferences,
                          option,
                      ],
            };
        });
    };

    const finishSetup = () => {
        setIsSubmitting(true);

        const formData = new FormData();

        formData.append(
            'marketing_preferences',
            JSON.stringify(preferencesForm.marketing_preferences),
        );

        if (logoForm.logo) {
            formData.append('logo', logoForm.logo);
        }

        router.post('/onboarding/complete', formData, {
            forceFormData: true,
            preserveScroll: true,
            onError: () => {
                setIsSubmitting(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    /*
    |--------------------------------------------------------------------------
    | Continue
    |--------------------------------------------------------------------------
    */

    const handleNext = () => {
        if (currentStep === 1) {
            if (businessPage === 1) {
                if (businessForm.industry) {
                    setBusinessPage(2);
                }

                return;
            }

            if (businessPage === 2) {
                if (customCategoryMode ? businessForm.category.trim() : businessForm.category) {
                    setBusinessPage(3);
                }

                return;
            }

            submitBusiness();

            return;
        }

        if (currentStep === 2) {
            submitDescription();

            return;
        }

        if (currentStep === 3) {
            setCurrentStep(4);

            return;
        }

        if (currentStep === 4) {
            finishSetup();
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Required State
    |--------------------------------------------------------------------------
    */

    const canContinue =
        currentStep === 1
            ? businessPage === 1
                ? !!businessForm.industry
                : businessPage === 2
                  ? customCategoryMode
                      ? !!businessForm.category.trim()
                      : !!businessForm.category
                  : !!businessForm.name.trim()
            : currentStep === 2
              ? !!descriptionForm.description.trim()
              : currentStep === 3
                ? true
                : true;

    /*
    |--------------------------------------------------------------------------
    | Compact Progress Header (mobile only — sidebar takes over on md+)
    |--------------------------------------------------------------------------
    */

    const renderCompactProgress = () => (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Step {currentStep} of 4
                    </p>

                    <p className="mt-0.5 text-sm font-semibold">
                        {steps[currentStep - 1].title}
                    </p>
                </div>

                <span className="text-xs text-muted-foreground">
                    {currentStep === 4 ? 'Final step' : `${currentStep}/4`}
                </span>
            </div>

            <Progress value={progress} className="h-1.5" />
        </div>
    );

    /*
    |--------------------------------------------------------------------------
    | Sidebar (md and up) — vertical stepper with a live progress readout
    |--------------------------------------------------------------------------
    */

    const renderSidebar = () => (
        <aside className="hidden w-[260px] shrink-0 flex-col border-r bg-muted/20 p-6 md:flex">
            <div className="mb-8">
                <p className="text-xs font-semibold tracking-wider text-primary uppercase">
                    Business setup
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                    A few quick steps to personalize your marketing.
                </p>
            </div>

            <div className="flex-1">
                {steps.map((item, index) => {
                    const itemStep = index + 1;
                    const completed = currentStep > itemStep;
                    const active = currentStep === itemStep;
                    const isLast = index === steps.length - 1;

                    return (
                        <div key={item.title} className="flex gap-3">
                            <div className="flex flex-col items-center">
                                <div
                                    className={cn(
                                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-300',
                                        (completed || active) &&
                                            'bg-primary text-primary-foreground',
                                        !completed &&
                                            !active &&
                                            'bg-muted text-muted-foreground',
                                    )}
                                >
                                    {completed ? (
                                        <Check className="h-3.5 w-3.5" />
                                    ) : (
                                        itemStep
                                    )}
                                </div>

                                {!isLast && (
                                    <div
                                        className={cn(
                                            'my-1 w-px flex-1 transition-colors duration-300',
                                            completed ? 'bg-primary' : 'bg-border',
                                        )}
                                    />
                                )}
                            </div>

                            <div className={cn('pb-7', isLast && 'pb-0')}>
                                <p
                                    className={cn(
                                        'text-sm font-medium transition-colors duration-300',
                                        active ? 'text-foreground' : 'text-muted-foreground',
                                    )}
                                >
                                    {item.title}
                                </p>
                                <p className="text-xs text-muted-foreground">{item.description}</p>

                                {active && itemStep === 1 && (
                                    <div className="mt-2 flex gap-1.5">
                                        {[1, 2, 3].map((page) => (
                                            <span
                                                key={page}
                                                className={cn(
                                                    'h-1 w-6 rounded-full transition-colors duration-300',
                                                    businessPage >= page ? 'bg-primary' : 'bg-muted',
                                                )}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 space-y-2 border-t pt-4">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Overall progress</span>
                    <span className="font-medium text-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
            </div>
        </aside>
    );

    /*
    |--------------------------------------------------------------------------
    | Industry Page
    |--------------------------------------------------------------------------
    */

    const renderIndustry = () => (
        <div className="flex h-full flex-col">
            <div className="mb-4">
                <p className="text-xs font-medium uppercase tracking-wider text-primary">
                    Business setup
                </p>

                <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                    What industry is your business in?
                </h1>

                <p className="mt-1.5 text-sm text-muted-foreground">
                    Choose the option that best matches your business.
                </p>
            </div>

            <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-3">
                {industryOptions.map((industry) => {
                    const selected = businessForm.industry === industry;
                    const Icon = industryIcons[industry] ?? Layers;

                    return (
                        <button
                            key={industry}
                            type="button"
                            onClick={() => selectIndustry(industry)}
                            className={cn(
                                'group flex min-h-[88px] w-full items-center gap-3 rounded-2xl border bg-card/80 px-3 py-3 text-left shadow-sm transition-all duration-200',
                                'hover:border-primary/50 hover:bg-primary/5 hover:-translate-y-0.5 hover:shadow-md',
                                selected &&
                                    'border-primary bg-primary/5 ring-2 ring-primary/15 shadow-md',
                            )}
                        >
                            <div
                                className={cn(
                                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-200',
                                    selected
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground group-hover:text-primary',
                                )}
                            >
                                <Icon className="h-4 w-4" />
                            </div>

                            <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                                <span className="w-full text-left text-sm font-medium leading-snug break-words">
                                    {industry}
                                </span>

                                {selected && (
                                    <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    /*
    |--------------------------------------------------------------------------
    | Category Page
    |--------------------------------------------------------------------------
    */

    const renderCategory = () => (
        <div className="flex h-full flex-col">
            <div className="mb-4">
                <p className="text-xs font-medium uppercase tracking-wider text-primary">
                    {businessForm.industry}
                </p>

                <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                    What type of business is it?
                </h1>

                <p className="mt-1.5 text-sm text-muted-foreground">
                    Choose the category that best describes your business.
                </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-2.5 auto-rows-min sm:grid-cols-3">
                    {availableCategories.map((category) => {
                        const selected = businessForm.category === category;

                        return (
                            <button
                                key={category}
                                type="button"
                                onClick={() => selectCategory(category)}
                                className={cn(
                                    'group flex min-h-[88px] w-full items-center justify-between gap-3 rounded-2xl border bg-card/80 px-3 py-3 text-left shadow-sm transition-all duration-200',
                                    'hover:border-primary/50 hover:bg-primary/5 hover:-translate-y-0.5 hover:shadow-md',
                                    selected &&
                                        'border-primary bg-primary/5 ring-2 ring-primary/15 shadow-md',
                                )}
                            >
                                <span className="w-full text-left text-sm font-medium leading-snug break-words">
                                    {category}
                                </span>

                                <div
                                    className={cn(
                                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-200',
                                        selected
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-muted-foreground/30 group-hover:border-primary/40',
                                    )}
                                >
                                    {selected && <Check className="h-3 w-3" />}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {customCategoryMode && (
                    <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-3 shadow-sm sm:p-4">
                        <Label htmlFor="custom-category" className="text-sm font-semibold text-foreground">
                            Custom category
                        </Label>

                        <Input
                            id="custom-category"
                            value={businessForm.category}
                            onChange={(event) => {
                                setBusinessForm((current) => ({
                                    ...current,
                                    category: event.target.value,
                                }));
                                setCustomCategoryMode(true);
                            }}
                            placeholder="e.g. Boutique Home Services"
                            className="mt-2 h-11 border-primary/20 text-base transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary/30"
                            autoFocus
                        />
                    </div>
                )}
            </div>

            <p className="mt-3 shrink-0 text-xs text-muted-foreground">
                Industry: {businessForm.industry}
            </p>
        </div>
    );

    /*
    |--------------------------------------------------------------------------
    | Business Name Page
    |--------------------------------------------------------------------------
    */

    const renderBusinessName = () => (
        <div className="flex h-full flex-col justify-center">
            <div className="mx-auto w-full max-w-lg">
                <p className="text-xs font-medium uppercase tracking-wider text-primary">
                    Almost there
                </p>

                <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                    What is your business name?
                </h1>

                <p className="mt-1.5 text-sm text-muted-foreground">
                    Enter the name customers know your business by.
                </p>

                <div className="mt-7 space-y-2">
                    <Label htmlFor="business-name">
                        Business Name
                        <span className="ml-1 text-destructive">*</span>
                    </Label>

                    <Input
                        id="business-name"
                        autoFocus
                        value={businessForm.name}
                        onChange={(event) =>
                            setBusinessForm({
                                ...businessForm,
                                name: event.target.value,
                            })
                        }
                        placeholder="e.g. Northstar Coffee"
                        className="h-12 text-base transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary/30"
                    />

                    {errors?.name && (
                        <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                </div>

                <div className="mt-5 flex items-center gap-3 rounded-xl bg-muted/50 p-4">
                    {(() => {
                        const Icon = industryIcons[businessForm.industry] ?? Layers;

                        return (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Icon className="h-4 w-4" />
                            </div>
                        );
                    })()}

                    <div>
                        <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Industry:</span>{' '}
                            {businessForm.industry}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Category:</span>{' '}
                            {businessForm.category}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    /*
    |--------------------------------------------------------------------------
    | Step 1
    |--------------------------------------------------------------------------
    */

    const renderBusiness = () => {
        if (businessPage === 1) {
            return renderIndustry();
        }

        if (businessPage === 2) {
            return renderCategory();
        }

        return renderBusinessName();
    };

    /*
    |--------------------------------------------------------------------------
    | Description
    |--------------------------------------------------------------------------
    */

    const renderDescription = () => (
        <div className="flex h-full flex-col justify-center">
            <div className="mx-auto w-full max-w-xl">
                <p className="text-xs font-medium uppercase tracking-wider text-primary">
                    Step 2
                </p>

                <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                    Tell us about your business
                </h1>

                <p className="mt-1.5 text-sm leading-5 text-muted-foreground">
                    Tell us what your business does, what you offer, and who you serve.
                </p>

                <div className="mt-6 space-y-2">
                    <Label htmlFor="description">
                        Business Description
                        <span className="ml-1 text-destructive">*</span>
                    </Label>

                    <Textarea
                        id="description"
                        autoFocus
                        value={descriptionForm.description}
                        onChange={(event) =>
                            setDescriptionForm({
                                description: event.target.value,
                            })
                        }
                        placeholder="Example: We are a local coffee shop serving specialty coffee, pastries, and breakfast to students and young professionals."
                        className="min-h-[170px] resize-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary/30"
                    />

                    <p className="text-xs text-muted-foreground">
                        A clear description helps personalize your marketing content.
                    </p>

                    {errors?.description && (
                        <p className="text-sm text-destructive">{errors.description}</p>
                    )}
                </div>
            </div>
        </div>
    );

    /*
    |--------------------------------------------------------------------------
    | Marketing Preferences
    |--------------------------------------------------------------------------
    */

    const renderPreferences = () => (
        <div className="flex h-full flex-col justify-center">
            <div className="mx-auto w-full max-w-xl">
                <p className="text-xs font-medium uppercase tracking-wider text-primary">
                    Step 3
                </p>

                <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                    Tell us how you want to market
                </h1>

                <p className="mt-1.5 text-sm leading-5 text-muted-foreground">
                    Select the marketing areas you are interested in. This step is optional.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-2.5">
                    {marketingPreferenceOptions.map((option) => {
                        const selected =
                            preferencesForm.marketing_preferences.includes(option);
                        const Icon = preferenceIcons[option] ?? Tag;

                        return (
                            <button
                                key={option}
                                type="button"
                                onClick={() => togglePreference(option)}
                                className={cn(
                                    'flex min-h-[52px] items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200',
                                    'hover:border-primary/40 hover:bg-primary/5',
                                    selected &&
                                        'border-primary bg-primary/5 ring-2 ring-primary/10',
                                )}
                            >
                                <div
                                    className={cn(
                                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200',
                                        selected
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground',
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                </div>

                                <span className="flex-1 text-sm font-medium">{option}</span>

                                <Checkbox
                                    checked={selected}
                                    onCheckedChange={() => togglePreference(option)}
                                    onClick={(event) => event.stopPropagation()}
                                />
                            </button>
                        );
                    })}
                </div>

                <p className="mt-4 text-center text-xs text-muted-foreground">
                    You can change these preferences later.
                </p>
            </div>
        </div>
    );

    /*
    |--------------------------------------------------------------------------
    | Current Content
    |--------------------------------------------------------------------------
    */

    const renderLogo = () => (
        <div className="flex h-full flex-col justify-center">
            <div className="mx-auto w-full max-w-xl">
                <p className="text-xs font-medium uppercase tracking-wider text-primary">
                    Step 4
                </p>

                <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                    Add your market logo
                </h1>

                <p className="mt-1.5 text-sm leading-5 text-muted-foreground">
                    Optional — upload your logo to personalize your marketing materials.
                </p>

                <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 p-8 text-center">
                    <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoChange}
                    />

                    {logoForm.logoPreview ? (
                        <div className="relative mb-4 h-32 w-32 overflow-hidden rounded-2xl border bg-white shadow-sm">
                            <img
                                src={logoForm.logoPreview}
                                alt="Business logo preview"
                                className="h-full w-full object-contain"
                            />
                        </div>
                    ) : (
                        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-dashed bg-white text-muted-foreground shadow-sm">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8">
                                <path d="M12 16V4m0 0 4 4m-4-4-4 4M4 15.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    )}

                    <Button type="button" variant="outline" onClick={() => logoInputRef.current?.click()}>
                        {logoForm.logoPreview ? 'Change logo' : 'Upload logo'}
                    </Button>

                    <p className="mt-3 text-xs text-muted-foreground">
                        PNG, JPG, WEBP, GIF, or SVG up to 2MB.
                    </p>

                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                            setLogoForm({ logo: null, logoPreview: null });

                            if (logoInputRef.current) {
                                logoInputRef.current.value = '';
                            }
                        }}
                        className="mt-2 text-muted-foreground"
                    >
                        Skip logo
                    </Button>
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (currentStep) {
            case 1:
                return renderBusiness();

            case 2:
                return renderDescription();

            case 3:
                return renderPreferences();

            case 4:
                return renderLogo();

            default:
                return null;
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Button Label
    |--------------------------------------------------------------------------
    */

    const getContinueLabel = () => {
        if (currentStep === 1) {
            return 'Continue';
        }

        if (currentStep === 3) {
            return 'Continue';
        }

        if (currentStep === 4) {
            return 'Finish Setup';
        }

        return 'Continue';
    };

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <>
            <Head title="Set up your business" />

            <div className="h-screen overflow-hidden bg-background">
                <div className="flex h-full items-center justify-center p-3 sm:p-5">
                    <Card className="flex h-full max-h-[720px] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border shadow-lg">
                        {/* Mobile compact progress — sidebar takes over on md+ */}
                        <div className="shrink-0 border-b bg-muted/20 px-4 py-3 md:hidden">
                            {renderCompactProgress()}
                        </div>

                        {/* Sidebar + content */}
                        <div className="flex min-h-0 flex-1">
                            {renderSidebar()}

                            <CardContent className="min-h-0 flex-1 overflow-hidden p-4 sm:p-6">
                                <div className="h-full">{renderContent()}</div>
                            </CardContent>
                        </div>

                        {/* Footer */}
                        <div className="shrink-0 border-t bg-background px-4 py-3 sm:px-6">
                            <div className="flex items-center justify-between gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={goBack}
                                    disabled={
                                        currentStep === 1 && businessPage === 1
                                    }
                                    className="gap-2"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back
                                </Button>

                                {currentStep < 4 ? (
                                    <Button
                                        type="button"
                                        onClick={handleNext}
                                        disabled={!canContinue || isSubmitting}
                                        className="group gap-2"
                                    >
                                        {isSubmitting ? 'Saving...' : getContinueLabel()}

                                        {!isSubmitting && (
                                            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                                        )}
                                    </Button>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={finishSetup}
                                            disabled={isSubmitting}
                                            className="text-muted-foreground"
                                        >
                                            Skip logo
                                        </Button>

                                        <Button
                                            type="button"
                                            onClick={finishSetup}
                                            disabled={isSubmitting}
                                            className="group gap-2"
                                        >
                                            {isSubmitting ? 'Finishing...' : 'Finish Setup'}

                                            {!isSubmitting && (
                                                <Check className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
}

OnboardingIndex.layout = {
    title: 'Setup your business',
    description:
        'Get your business profile ready to create marketing content.',
};