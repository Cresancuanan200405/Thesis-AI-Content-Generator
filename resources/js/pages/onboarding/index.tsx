import { Head, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Briefcase,
    Building2,
    Car,
    Check,
    Cpu,
    GraduationCap,
    HeartPulse,
    Home,
    ImageIcon,
    Landmark,
    Layers,
    Palette,
    Plane,
    ShoppingBag,
    ShoppingCart,
    Sparkles,
    UploadCloud,
    UtensilsCrossed,
    X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
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
    business?: Partial<
        BusinessForm &
        DescriptionForm & {
            logo_url?: string | null;
        }
    > | null;
};

/*
|--------------------------------------------------------------------------
| Industry Data
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
        'Mobile App Dev',
        'Tech Consulting',
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
        'Brokerage',
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
        'Other Services',
    ],

    'Travel & Hospitality': [
        'Hotel',
        'Resort',
        'Travel Agency',
        'Tour Operator',
        'Vacation Rental',
        'Hospitality',
        'Transportation',
        'Other Hospitality',
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
        'Subscription',
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

const visualStyleOptions = [
    {
        title: 'Studio Pedestal',
        description: 'Clean studio lighting with minimal geometric staging.',
    },
    {
        title: 'Lifestyle & In-Situ',
        description: 'Natural settings with authentic warm lighting.',
    },
    {
        title: 'Editorial & Vogue',
        description: 'Dramatic lighting with elegant premium styling.',
    },
    {
        title: 'Minimalist Commercial',
        description: 'Simple composition focused on the product.',
    },
    {
        title: 'Cinematic Atmosphere',
        description: 'Rich depth with warm cinematic lighting.',
    },
    {
        title: 'Modern Flat Lay',
        description: 'Top-down composition with themed elements.',
    },
    {
        title: '3D Clean Render',
        description: 'Crisp digital 3D visuals with soft reflections.',
    },
    {
        title: 'Vibrant Pop Commercial',
        description: 'Energetic colors and dynamic commercial visuals.',
    },
];

const steps = [
    {
        id: 1,
        title: 'Business',
        description: 'Basic information',
        icon: Building2,
    },
    {
        id: 2,
        title: 'About',
        description: 'Business profile',
        icon: Layers,
    },
    {
        id: 3,
        title: 'Visuals',
        description: 'Brand direction',
        icon: Palette,
    },
    {
        id: 4,
        title: 'Logo',
        description: 'Brand identity',
        icon: ImageIcon,
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

    const [currentStep, setCurrentStep] = useState(
        Math.min(Math.max(step, 1), 4),
    );

    const [businessPage, setBusinessPage] = useState(() => {
        if (business?.industry && business?.category) {
            return 3;
        }

        if (business?.industry) {
            return 2;
        }

        return 1;
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [businessForm, setBusinessForm] = useState<BusinessForm>({
        name: business?.name ?? '',
        industry: business?.industry ?? '',
        category: business?.category ?? '',
    });

    const [customCategoryMode, setCustomCategoryMode] = useState(
        business?.industry === 'Other',
    );

    const [descriptionForm, setDescriptionForm] =
        useState<DescriptionForm>({
            description: business?.description ?? '',
        });

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
    | Derived Data
    |--------------------------------------------------------------------------
    */

    const availableCategories = useMemo(() => {
        if (!businessForm.industry) {
            return [];
        }

        return industryCategories[businessForm.industry] ?? [];
    }, [businessForm.industry]);

    const progress =
        currentStep === 1
            ? businessPage === 1
                ? 15
                : businessPage === 2
                    ? 28
                    : 40
            : currentStep === 2
                ? 60
                : currentStep === 3
                    ? 80
                    : 100;

    /*
    |--------------------------------------------------------------------------
    | Navigation
    |--------------------------------------------------------------------------
    */

    const goBack = () => {
        if (currentStep === 1) {
            if (businessPage > 1) {
                setBusinessPage((page) => page - 1);
            }

            return;
        }

        setCurrentStep((step) => Math.max(1, step - 1));
    };

    /*
    |--------------------------------------------------------------------------
    | Logo
    |--------------------------------------------------------------------------
    */

    const handleLogoChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0] ?? null;

        if (!file) {
            setLogoForm({
                logo: null,
                logoPreview: business?.logo_url ?? null,
            });

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

    const handleSelectIndustry = (industry: string) => {
        setBusinessForm((current) => ({
            ...current,
            industry,
            category:
                current.industry === industry
                    ? current.category
                    : '',
        }));

        setCustomCategoryMode(industry === 'Other');
    };

    const handleSelectCategory = (category: string) => {
        setCustomCategoryMode(category === 'Other');

        setBusinessForm((current) => ({
            ...current,
            category:
                category === 'Other'
                    ? ''
                    : category,
        }));
    };

    /*
    |--------------------------------------------------------------------------
    | Preferences
    |--------------------------------------------------------------------------
    */

    const togglePreference = (title: string) => {
        setPreferencesForm((current) => {
            const selected =
                current.marketing_preferences.includes(title);

            return {
                marketing_preferences: selected
                    ? current.marketing_preferences.filter(
                        (item) => item !== title,
                    )
                    : [
                        ...current.marketing_preferences,
                        title,
                    ],
            };
        });
    };

    /*
    |--------------------------------------------------------------------------
    | Submit Business
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
                description:
                    descriptionForm.description.trim(),
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
    | Finish
    |--------------------------------------------------------------------------
    */

    const finishSetup = () => {
        setIsSubmitting(true);

        const formData = new FormData();

        formData.append(
            'marketing_preferences',
            JSON.stringify(
                preferencesForm.marketing_preferences,
            ),
        );

        if (logoForm.logo) {
            formData.append('logo', logoForm.logo);
        }

        router.post(
            '/onboarding/complete',
            formData,
            {
                forceFormData: true,
                preserveScroll: true,

                onError: () => {
                    setIsSubmitting(false);
                },

                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Next
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
                if (
                    customCategoryMode
                        ? businessForm.category.trim()
                        : businessForm.category
                ) {
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
    | Validation
    |--------------------------------------------------------------------------
    */

    const canContinue = useMemo(() => {
        if (currentStep === 1) {
            if (businessPage === 1) {
                return !!businessForm.industry;
            }

            if (businessPage === 2) {
                return customCategoryMode
                    ? !!businessForm.category.trim()
                    : !!businessForm.category;
            }

            return !!businessForm.name.trim();
        }

        if (currentStep === 2) {
            return !!descriptionForm.description.trim();
        }

        return true;
    }, [
        currentStep,
        businessPage,
        businessForm,
        customCategoryMode,
        descriptionForm,
    ]);

    const getContinueLabel = () => {
        if (currentStep === 1) {
            if (businessPage === 1 || businessPage === 2) {
                return 'Continue';
            }

            return 'Save & Continue';
        }

        if (currentStep === 2) {
            return 'Save & Continue';
        }

        if (currentStep === 3) {
            return 'Continue';
        }

        return 'Finish Setup';
    };

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <>
            <Head title="Business Onboarding" />

            <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-3 py-4 sm:px-5">

                {/* Ambient system glow */}
                <div className="pointer-events-none absolute -left-32 -top-32 h-72 w-72 rounded-full bg-primary/20 blur-[110px]" />

                <div className="pointer-events-none absolute -bottom-32 -right-32 h-72 w-72 rounded-full bg-blue-500/10 blur-[110px]" />

                <div className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[80px]" />

                {/* Main onboarding card */}
                <div className="relative z-10 flex w-full max-w-[680px] flex-col overflow-hidden rounded-[26px] border border-white/30 bg-card/80 shadow-2xl shadow-black/10 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/80 dark:shadow-black/40">

                    {/* --------------------------------------------------
                        HEADER
                    -------------------------------------------------- */}

                    <div className="border-b border-border/60 bg-background/35 px-4 py-3 backdrop-blur-xl sm:px-5">

                        <div className="flex items-center justify-between gap-4">

                            {/* Brand */}
                            <div className="flex min-w-0 items-center gap-2.5">

                                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">

                                    <Sparkles className="h-4 w-4" />

                                    <span className="absolute inset-0 rounded-xl ring-1 ring-white/30" />
                                </div>

                                <div className="min-w-0">
                                    <p className="truncate text-xs font-bold tracking-tight">
                                        MarketPilot
                                    </p>

                                    <p className="hidden text-[9px] text-muted-foreground sm:block">
                                        AI Marketing Assistant
                                    </p>
                                </div>
                            </div>

                            {/* Progress */}
                            <div className="flex items-center gap-1.5">

                                {steps.map((item) => {
                                    const Icon = item.icon;

                                    const active =
                                        currentStep === item.id;

                                    const completed =
                                        currentStep > item.id;

                                    return (
                                        <div
                                            key={item.id}
                                            className={cn(
                                                'flex h-7 items-center gap-1.5 rounded-full px-2 transition-all duration-300',
                                                active &&
                                                'bg-primary text-primary-foreground shadow-md shadow-primary/20',
                                                completed &&
                                                'bg-primary/10 text-primary',
                                                !active &&
                                                !completed &&
                                                'text-muted-foreground',
                                            )}
                                        >
                                            {completed ? (
                                                <Check className="h-3 w-3" />
                                            ) : (
                                                <Icon className="h-3 w-3" />
                                            )}

                                            <span
                                                className={cn(
                                                    'hidden text-[10px] font-semibold sm:inline',
                                                    active &&
                                                    'inline',
                                                )}
                                            >
                                                {item.title}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Progress line */}
                        <div className="mt-3">
                            <Progress
                                value={progress}
                                className="h-1 bg-muted/60"
                            />
                        </div>
                    </div>

                    {/* --------------------------------------------------
                        CONTENT
                    -------------------------------------------------- */}

                    <div className="min-h-[410px] px-4 py-5 sm:px-7 sm:py-6">

                        {/* ============================
                            STEP 1
                        ============================ */}

                        {currentStep === 1 && (
                            <div className="animate-in fade-in-50 duration-300">

                                {/* Mini step */}
                                <div className="mb-4 flex items-center justify-between">

                                    <div className="flex items-center gap-2">
                                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-primary">
                                            Business Profile
                                        </span>

                                        <span className="text-[10px] text-muted-foreground">
                                            {businessPage}/3
                                        </span>
                                    </div>

                                    <div className="flex gap-1">
                                        {[1, 2, 3].map((page) => (
                                            <div
                                                key={page}
                                                className={cn(
                                                    'h-1 rounded-full transition-all',
                                                    businessPage === page
                                                        ? 'w-5 bg-primary'
                                                        : businessPage > page
                                                            ? 'w-2 bg-primary/40'
                                                            : 'w-2 bg-muted',
                                                )}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Industry */}
                                {businessPage === 1 && (
                                    <div>

                                        <div className="mb-4">
                                            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                                                What does your business do?
                                            </h1>

                                            <p className="mt-1 text-xs text-muted-foreground">
                                                This helps MarketPilot tailor AI-generated marketing content to your business.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                            {industryOptions.map(
                                                (industry) => {
                                                    const Icon =
                                                        industryIcons[
                                                        industry
                                                        ] ?? Layers;

                                                    const selected =
                                                        businessForm.industry ===
                                                        industry;

                                                    return (
                                                        <button
                                                            key={industry}
                                                            type="button"
                                                            onClick={() =>
                                                                handleSelectIndustry(
                                                                    industry,
                                                                )
                                                            }
                                                            className={cn(
                                                                'group relative flex h-[58px] items-center gap-2 rounded-xl border px-2.5 text-left transition-all duration-200',
                                                                'hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md',
                                                                'active:scale-[0.97]',
                                                                selected
                                                                    ? 'border-primary/60 bg-primary/10 shadow-sm ring-1 ring-primary/20'
                                                                    : 'border-border/70 bg-background/30',
                                                            )}
                                                        >
                                                            <div
                                                                className={cn(
                                                                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all',
                                                                    selected
                                                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                                                        : 'bg-muted/70 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary',
                                                                )}
                                                            >
                                                                <Icon className="h-3.5 w-3.5" />
                                                            </div>

                                                            <span className="min-w-0 truncate text-[11px] font-semibold">
                                                                {industry}
                                                            </span>

                                                            {selected && (
                                                                <div className="absolute right-1.5 top-1.5">
                                                                    <Check className="h-3 w-3 text-primary" />
                                                                </div>
                                                            )}
                                                        </button>
                                                    );
                                                },
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Category */}
                                {businessPage === 2 && (
                                    <div>

                                        <div className="mb-4">
                                            <div className="mb-1 text-[10px] font-medium text-muted-foreground">
                                                Industry
                                            </div>

                                            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                                                Choose your category
                                            </h1>

                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Select the category that best describes your business.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                            {availableCategories.map(
                                                (category) => {
                                                    const selected =
                                                        businessForm.category ===
                                                        category;

                                                    return (
                                                        <button
                                                            key={category}
                                                            type="button"
                                                            onClick={() =>
                                                                handleSelectCategory(
                                                                    category,
                                                                )
                                                            }
                                                            className={cn(
                                                                'group flex h-12 items-center justify-between rounded-xl border px-3 text-left transition-all duration-200',
                                                                'hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm',
                                                                'active:scale-[0.97]',
                                                                selected
                                                                    ? 'border-primary/60 bg-primary/10 ring-1 ring-primary/20'
                                                                    : 'border-border/70 bg-background/30',
                                                            )}
                                                        >
                                                            <span className="truncate text-[11px] font-semibold">
                                                                {category}
                                                            </span>

                                                            <div
                                                                className={cn(
                                                                    'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all',
                                                                    selected
                                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                                        : 'border-muted-foreground/20 group-hover:border-primary/50',
                                                                )}
                                                            >
                                                                {selected && (
                                                                    <Check className="h-2.5 w-2.5" />
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                },
                                            )}
                                        </div>

                                        {customCategoryMode && (
                                            <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3">

                                                <Label
                                                    htmlFor="custom-category"
                                                    className="text-[10px] font-bold uppercase tracking-wider"
                                                >
                                                    Custom Category
                                                </Label>

                                                <Input
                                                    id="custom-category"
                                                    value={
                                                        businessForm.category
                                                    }
                                                    onChange={(e) =>
                                                        setBusinessForm(
                                                            (curr) => ({
                                                                ...curr,
                                                                category:
                                                                    e.target
                                                                        .value,
                                                            }),
                                                        )
                                                    }
                                                    placeholder="Enter your category"
                                                    className="mt-1.5 h-9 rounded-lg bg-background/70 text-xs"
                                                    autoFocus
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Business Name */}
                                {businessPage === 3 && (
                                    <div className="mx-auto max-w-md py-6">

                                        <div className="mb-5 text-center">

                                            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                                <Building2 className="h-5 w-5" />
                                            </div>

                                            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                                                What's your business name?
                                            </h1>

                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Use the name customers recognize your brand by.
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="business-name"
                                                className="text-[10px] font-bold uppercase tracking-wider"
                                            >
                                                Business Name
                                            </Label>

                                            <Input
                                                id="business-name"
                                                value={
                                                    businessForm.name
                                                }
                                                onChange={(e) =>
                                                    setBusinessForm(
                                                        (curr) => ({
                                                            ...curr,
                                                            name: e.target
                                                                .value,
                                                        }),
                                                    )
                                                }
                                                placeholder="e.g. Brew & Co."
                                                className="h-11 rounded-xl bg-background/50 text-sm"
                                                autoFocus
                                            />

                                            {errors?.name && (
                                                <p className="text-xs text-destructive">
                                                    {errors.name}
                                                </p>
                                            )}

                                            <div className="mt-3 flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5">

                                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                    <Layers className="h-3.5 w-3.5" />
                                                </div>

                                                <div className="min-w-0 text-[10px] text-muted-foreground">
                                                    <span className="font-semibold text-foreground">
                                                        {businessForm.industry}
                                                    </span>

                                                    <span className="mx-1">
                                                        •
                                                    </span>

                                                    {businessForm.category}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ============================
                            STEP 2
                        ============================ */}

                        {currentStep === 2 && (
                            <div className="mx-auto max-w-lg animate-in fade-in-50 duration-300">

                                <div className="mb-5">
                                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-primary">
                                        About your business
                                    </span>

                                    <h1 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">
                                        Tell us about your business
                                    </h1>

                                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                        Give MarketPilot some context so its AI can create more relevant captions, campaigns, and promotional ideas.
                                    </p>
                                </div>

                                <div className="space-y-2">

                                    <div className="flex items-center justify-between">
                                        <Label
                                            htmlFor="description"
                                            className="text-[10px] font-bold uppercase tracking-wider"
                                        >
                                            Business Description
                                        </Label>

                                        <span className="text-[9px] text-muted-foreground">
                                            Recommended
                                        </span>
                                    </div>

                                    <Textarea
                                        id="description"
                                        value={
                                            descriptionForm.description
                                        }
                                        onChange={(e) =>
                                            setDescriptionForm({
                                                description:
                                                    e.target.value,
                                            })
                                        }
                                        placeholder="Example: We are a specialty coffee shop serving locally roasted coffee, pastries, and comfortable spaces for students and professionals."
                                        className="h-32 resize-none rounded-xl bg-background/50 text-xs leading-relaxed sm:h-36"
                                        autoFocus
                                    />

                                    {errors?.description && (
                                        <p className="text-xs text-destructive">
                                            {errors.description}
                                        </p>
                                    )}
                                </div>

                                <div className="mt-3 flex items-start gap-2 rounded-xl border border-primary/10 bg-primary/5 p-3">

                                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />

                                    <p className="text-[10px] leading-relaxed text-muted-foreground">
                                        The more context you provide, the more accurately MarketPilot can adapt AI-generated marketing content to your brand.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ============================
                            STEP 3
                        ============================ */}

                        {currentStep === 3 && (
                            <div className="animate-in fade-in-50 duration-300">

                                <div className="mb-4">
                                    <div className="flex items-center justify-between">

                                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-primary">
                                            Visual Direction
                                        </span>

                                        <span className="text-[9px] text-muted-foreground">
                                            Optional preferences
                                        </span>
                                    </div>

                                    <h1 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">
                                        What should your visuals feel like?
                                    </h1>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Select one or more styles for your AI-generated marketing visuals.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">

                                    {visualStyleOptions.map(
                                        (style) => {
                                            const selected =
                                                preferencesForm.marketing_preferences.includes(
                                                    style.title,
                                                );

                                            return (
                                                <button
                                                    key={style.title}
                                                    type="button"
                                                    onClick={() =>
                                                        togglePreference(
                                                            style.title,
                                                        )
                                                    }
                                                    className={cn(
                                                        'group relative flex min-h-[82px] flex-col justify-between rounded-xl border p-3 text-left transition-all duration-200',
                                                        'hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md',
                                                        'active:scale-[0.97]',
                                                        selected
                                                            ? 'border-primary/60 bg-primary/10 ring-1 ring-primary/20'
                                                            : 'border-border/70 bg-background/30',
                                                    )}
                                                >

                                                    <div className="flex items-start justify-between gap-2">

                                                        <span className="text-[10px] font-bold leading-tight">
                                                            {style.title}
                                                        </span>

                                                        <Checkbox
                                                            checked={
                                                                selected
                                                            }
                                                            onCheckedChange={() =>
                                                                togglePreference(
                                                                    style.title,
                                                                )
                                                            }
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                            className="h-3.5 w-3.5"
                                                        />
                                                    </div>

                                                    <p className="mt-2 line-clamp-2 text-[9px] leading-relaxed text-muted-foreground">
                                                        {
                                                            style.description
                                                        }
                                                    </p>

                                                    {selected && (
                                                        <div className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />
                                                    )}
                                                </button>
                                            );
                                        },
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ============================
                            STEP 4
                        ============================ */}

                        {currentStep === 4 && (
                            <div className="mx-auto max-w-md animate-in fade-in-50 duration-300">

                                <div className="mb-5 text-center">

                                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                        <ImageIcon className="h-5 w-5" />
                                    </div>

                                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-primary">
                                        Brand Identity
                                    </span>

                                    <h1 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">
                                        Add your business logo
                                    </h1>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Your logo can be incorporated into future marketing visuals.
                                    </p>
                                </div>

                                <input
                                    ref={logoInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleLogoChange}
                                />

                                {logoForm.logoPreview ? (
                                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">

                                        <div className="flex items-center gap-4">

                                            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white p-2 shadow-sm">
                                                <img
                                                    src={
                                                        logoForm.logoPreview
                                                    }
                                                    alt="Logo preview"
                                                    className="h-full w-full object-contain"
                                                />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold">
                                                    Logo uploaded
                                                </p>

                                                <p className="mt-1 text-[10px] text-muted-foreground">
                                                    Your logo is ready to be used in your marketing visuals.
                                                </p>

                                                <div className="mt-3 flex gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            logoInputRef.current?.click()
                                                        }
                                                        className="h-7 rounded-lg text-[10px]"
                                                    >
                                                        Change
                                                    </Button>

                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setLogoForm({
                                                                logo: null,
                                                                logoPreview:
                                                                    null,
                                                            });

                                                            if (
                                                                logoInputRef.current
                                                            ) {
                                                                logoInputRef.current.value =
                                                                    '';
                                                            }
                                                        }}
                                                        className="h-7 rounded-lg px-2 text-[10px] text-muted-foreground hover:text-destructive"
                                                    >
                                                        <X className="mr-1 h-3 w-3" />
                                                        Remove
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            logoInputRef.current?.click()
                                        }
                                        className="group w-full rounded-2xl border border-dashed border-border bg-background/30 p-6 text-center transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 hover:shadow-lg"
                                    >

                                        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-110">
                                            <UploadCloud className="h-5 w-5" />
                                        </div>

                                        <p className="text-xs font-bold">
                                            Upload your logo
                                        </p>

                                        <p className="mt-1 text-[10px] text-muted-foreground">
                                            PNG, JPG or SVG • Up to 2MB
                                        </p>
                                    </button>
                                )}

                                <div className="mt-3 flex items-center gap-2 rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5">
                                    <Sparkles className="h-3.5 w-3.5 text-primary" />

                                    <p className="text-[9px] leading-relaxed text-muted-foreground">
                                        You can skip this step and add your logo later.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --------------------------------------------------
                        FOOTER
                    -------------------------------------------------- */}

                    <div className="border-t border-border/60 bg-background/35 px-4 py-3 backdrop-blur-xl sm:px-5">

                        <div className="flex items-center justify-between">

                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={goBack}
                                disabled={
                                    currentStep === 1 &&
                                    businessPage === 1
                                }
                                className="h-8 rounded-lg px-3 text-[10px] font-semibold"
                            >
                                <ArrowLeft className="mr-1.5 h-3 w-3" />
                                Back
                            </Button>

                            <div className="flex items-center gap-2">

                                {currentStep === 4 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={finishSetup}
                                        disabled={isSubmitting}
                                        className="h-8 rounded-lg px-3 text-[10px] text-muted-foreground"
                                    >
                                        Skip
                                    </Button>
                                )}

                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleNext}
                                    disabled={
                                        !canContinue ||
                                        isSubmitting
                                    }
                                    className="group h-8 rounded-lg px-4 text-[10px] font-bold shadow-md shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.97]"
                                >
                                    {isSubmitting
                                        ? currentStep === 4
                                            ? 'Finalizing...'
                                            : 'Saving...'
                                        : getContinueLabel()}

                                    {!isSubmitting && (
                                        currentStep === 4 ? (
                                            <Check className="ml-1.5 h-3 w-3 transition-transform group-hover:scale-110" />
                                        ) : (
                                            <ArrowRight className="ml-1.5 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                                        )
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Small footer */}
                <div className="absolute bottom-2 left-1/2 hidden -translate-x-1/2 text-[9px] text-muted-foreground/60 sm:block">
                    Powered by MarketPilot AI
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