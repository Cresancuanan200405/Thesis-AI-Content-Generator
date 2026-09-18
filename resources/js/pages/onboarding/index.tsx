import { Head, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    BadgeCheck,
    Building2,
    Check,
    CheckCircle2,
    FileCheck2,
    FileText,
    Layers,
    Lock,
    MapPin,
    Moon,
    PanelLeftClose,
    PanelLeftOpen,
    ShieldCheck,
    Sparkles,
    Sun,
    Upload,
    User as UserIcon,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import AppLogo from '@/components/app-logo';
import AppLogoIcon from '@/components/app-logo-icon';
import { PhilippineAddressSelectors } from '@/components/philippine-address-selectors';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAppearance } from '@/hooks/use-appearance';
import {
    industryCategories,
    industryIcons,
    industryOptions,
} from '@/lib/industry-taxonomy';
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
    business_address: string;
    barangay: string;
    city_municipality: string;
    province: string;
    region: string;
    registration_type: string;
    registration_number: string;
    business_permit_number: string;
    registration_permit_date: string;
};

type DescriptionForm = {
    description: string;
};

type LegalDocumentSection = {
    heading: string;
    content: string;
};

type LegalDocument = {
    type: string;
    version: string;
    title: string;
    sections: LegalDocumentSection[];
};

type PersonalForm = {
    first_name: string;
    middle_name: string;
    last_name: string;
    suffix: string;
    mobile_number: string;
    email: string;
    is_social?: boolean;
    is_google?: boolean;
};

type Props = {
    step?: number;
    personal?:
        | (Partial<PersonalForm> & { is_social?: boolean; is_google?: boolean })
        | null;
    business?:
        | (Partial<BusinessForm & DescriptionForm> & {
              has_registration_document?: boolean;
              business_registration_document_path?: string | null;
          })
        | null;
    legalDocuments?: Record<string, LegalDocument>;
    acceptedLegalDocuments?: string[];
};

/*
|--------------------------------------------------------------------------
| Onboarding steps configuration
|--------------------------------------------------------------------------
*/

const TOTAL_STEPS = 4;

const steps = [
    { id: 1, title: 'Profile', subtitle: 'Personal identity', icon: UserIcon },
    {
        id: 2,
        title: 'Business',
        subtitle: 'Industry & category',
        icon: Building2,
    },
    {
        id: 3,
        title: 'Business Details',
        subtitle: 'Location & compliance',
        icon: Layers,
    },
    {
        id: 4,
        title: 'Launch',
        subtitle: 'Review & activate',
        icon: CheckCircle2,
    },
] as const;

const legalDocumentOrder = [
    'terms_of_service',
    'privacy_notice',
    'content_ip_responsibility',
    'ai_content_responsibility',
] as const;

const legalCopy: Record<
    (typeof legalDocumentOrder)[number],
    { title: string; text: string }
> = {
    terms_of_service: {
        title: 'Terms of Service',
        text: 'Accept MarketPilot platform terms, fair usage policies, and service standards.',
    },
    privacy_notice: {
        title: 'Privacy Notice',
        text: 'Understand how personal and business data are stored securely and kept private.',
    },
    content_ip_responsibility: {
        title: 'Content & IP Responsibility',
        text: 'Confirm ownership or authorized license for all brand assets and trademarks provided.',
    },
    ai_content_responsibility: {
        title: 'AI-Generated Content Responsibility',
        text: 'Review AI marketing outputs before publishing or distributing commercially.',
    },
};

export default function OnboardingIndex({
    step = 1,
    personal,
    business,
    legalDocuments = {},
    acceptedLegalDocuments = [],
}: Props) {
    const { errors } = usePage().props as any;
    const { resolvedAppearance, updateAppearance } = useAppearance();

    const toggleTheme = () => {
        updateAppearance(resolvedAppearance === 'dark' ? 'light' : 'dark');
    };

    const [currentStep, setCurrentStep] = useState(
        Math.min(Math.max(step, 1), TOTAL_STEPS),
    );

    // Step 2 sub-pages (1: Industry, 2: Category, 3: Business Name)
    const [businessPage, setBusinessPage] = useState(() => {
        if (business?.industry && business?.category) {
            return 3;
        }

        if (business?.industry) {
            return 2;
        }

        return 1;
    });

    // Step 3 sub-pages (1: Brand & Location, 2: Registration, 3: Agreements)
    const [step3Page, setStep3Page] = useState<number>(1);
    const [registrationTab, setRegistrationTab] = useState<number>(1);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [descriptionError, setDescriptionError] = useState<string>('');

    const isGoogleAccount = Boolean(personal?.is_google);

    const [personalForm, setPersonalForm] = useState<PersonalForm>({
        first_name: personal?.first_name ?? '',
        middle_name: personal?.middle_name ?? '',
        last_name: personal?.last_name ?? '',
        suffix: personal?.suffix ?? '',
        mobile_number: personal?.mobile_number ?? '',
        email: personal?.email ?? '',
        is_social: personal?.is_social ?? false,
        is_google: isGoogleAccount,
    });

    const [businessForm, setBusinessForm] = useState<BusinessForm>({
        name: business?.name ?? '',
        industry: business?.industry ?? '',
        category: business?.category ?? '',
        business_address: business?.business_address ?? '',
        barangay: business?.barangay ?? '',
        city_municipality: business?.city_municipality ?? '',
        province: business?.province ?? '',
        region: business?.region ?? '',
        registration_type: business?.registration_type ?? '',
        registration_number: business?.registration_number ?? '',
        business_permit_number: business?.business_permit_number ?? '',
        registration_permit_date: business?.registration_permit_date ?? '',
    });

    const [descriptionForm, setDescriptionForm] = useState<DescriptionForm>({
        description: business?.description ?? '',
    });

    const [legalAcceptances, setLegalAcceptances] = useState<
        Record<string, boolean>
    >({
        terms_of_service:
            acceptedLegalDocuments?.includes('terms_of_service') ?? false,
        privacy_notice:
            acceptedLegalDocuments?.includes('privacy_notice') ?? false,
        content_ip_responsibility:
            acceptedLegalDocuments?.includes('content_ip_responsibility') ??
            false,
        ai_content_responsibility:
            acceptedLegalDocuments?.includes('ai_content_responsibility') ??
            false,
    });

    const [activeLegalModal, setActiveLegalModal] = useState<string | null>(
        null,
    );
    const [registrationDocumentFile, setRegistrationDocumentFile] =
        useState<File | null>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isReviewDescriptionExpanded, setIsReviewDescriptionExpanded] =
        useState(false);

    const availableCategories = useMemo(() => {
        if (!businessForm.industry) {
            return [];
        }

        return industryCategories[businessForm.industry] ?? [];
    }, [businessForm.industry]);

    const activeLegalDoc = activeLegalModal
        ? legalDocuments[activeLegalModal]
        : null;

    const allAgreementsChecked = legalDocumentOrder.every(
        (k) => legalAcceptances[k],
    );

    const progress = useMemo(() => {
        if (currentStep >= 4) {
            return 99;
        }

        let completedUnits = currentStep - 1;

        if (currentStep === 2) {
            completedUnits += (businessPage - 1) / 3;
        }

        if (currentStep === 3) {
            completedUnits += (step3Page - 1) / 3;

            if (step3Page === 3 && allAgreementsChecked) {
                return 99;
            }
        }

        return Math.min(99, Math.round((completedUnits / TOTAL_STEPS) * 100));
    }, [currentStep, businessPage, step3Page, allAgreementsChecked]);

    const currentStepData = steps[currentStep - 1] ?? steps[0];

    /*
    |--------------------------------------------------------------------------
    | Navigation Handlers
    |--------------------------------------------------------------------------
    */

    const goBack = () => {
        if (currentStep === 1) {
            return;
        }

        if (currentStep === 2) {
            if (businessPage > 1) {
                setBusinessPage((p) => p - 1);

                return;
            }

            setCurrentStep(1);

            return;
        }

        if (currentStep === 3) {
            if (step3Page > 1) {
                setStep3Page((p) => p - 1);

                return;
            }

            setCurrentStep(2);
            setBusinessPage(3);

            return;
        }

        if (currentStep === 4) {
            setCurrentStep(3);
            setStep3Page(3);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Submit Actions
    |--------------------------------------------------------------------------
    */

    // Step 1: Submit Personal Profile
    const submitPersonal = () => {
        if (!personalForm.first_name.trim() || !personalForm.last_name.trim()) {
            return;
        }

        setIsSubmitting(true);
        router.post(
            '/onboarding/personal',
            {
                first_name: personalForm.first_name.trim(),
                middle_name: personalForm.middle_name.trim(),
                last_name: personalForm.last_name.trim(),
                suffix: personalForm.suffix.trim(),
                mobile_number: personalForm.mobile_number.trim(),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCurrentStep(2);
                    setBusinessPage(1);
                },
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    // Step 2: Taxonomy & Name
    const handleSelectIndustry = (industry: string) => {
        setBusinessForm((curr) => ({
            ...curr,
            industry,
            category: curr.industry === industry ? curr.category : '',
        }));
    };

    const handleSelectCategory = (category: string) => {
        setBusinessForm((curr) => ({
            ...curr,
            category,
        }));
    };

    const submitBusinessStep = () => {
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
                    setCurrentStep(3);
                    setStep3Page(1);
                },
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    // Step 3 Sub-page 1 -> Sub-page 2 (Brand & Location -> Registration)
    const continueToRegistration = () => {
        if (!descriptionForm.description.trim()) {
            setDescriptionError(
                'Please enter a brief business description before continuing.',
            );

            return;
        }

        setDescriptionError('');
        setIsSubmitting(true);

        const data = new FormData();
        data.append('name', businessForm.name.trim());
        data.append('industry', businessForm.industry);
        data.append('category', businessForm.category);
        data.append('description', descriptionForm.description.trim());
        data.append('business_address', businessForm.business_address.trim());
        data.append('region', businessForm.region);
        data.append('province', businessForm.province);
        data.append('city_municipality', businessForm.city_municipality);
        data.append('barangay', businessForm.barangay);
        data.append('sub_step', '1');

        router.post('/onboarding/business', data, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setStep3Page(2);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    // Step 3 Sub-page 2 -> Sub-page 3 (Registration -> Agreements)
    const continueToAgreements = () => {
        setIsSubmitting(true);

        const data = new FormData();
        data.append('name', businessForm.name.trim());
        data.append('industry', businessForm.industry);
        data.append('category', businessForm.category);
        data.append('description', descriptionForm.description.trim());
        data.append('business_address', businessForm.business_address.trim());
        data.append('region', businessForm.region);
        data.append('province', businessForm.province);
        data.append('city_municipality', businessForm.city_municipality);
        data.append('barangay', businessForm.barangay);

        if (businessForm.registration_type) {
            data.append('registration_type', businessForm.registration_type);
        }

        if (businessForm.registration_number) {
            data.append(
                'registration_number',
                businessForm.registration_number,
            );
        }

        if (businessForm.business_permit_number) {
            data.append(
                'business_permit_number',
                businessForm.business_permit_number,
            );
        }

        if (businessForm.registration_permit_date) {
            data.append(
                'registration_permit_date',
                businessForm.registration_permit_date,
            );
        }

        if (registrationDocumentFile) {
            data.append(
                'business_registration_document',
                registrationDocumentFile,
            );
        }

        data.append('sub_step', '2');

        router.post('/onboarding/business', data, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setStep3Page(3);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    // Step 3 Sub-page 3 -> Step 4 (Agreements -> Launch Workspace)
    const submitStep3Complete = () => {
        if (!allAgreementsChecked) {
            return;
        }

        setIsSubmitting(true);
        const data = new FormData();
        data.append('name', businessForm.name.trim());
        data.append('industry', businessForm.industry);
        data.append('category', businessForm.category);
        data.append('description', descriptionForm.description.trim());
        data.append('business_address', businessForm.business_address.trim());
        data.append('region', businessForm.region);
        data.append('province', businessForm.province);
        data.append('city_municipality', businessForm.city_municipality);
        data.append('barangay', businessForm.barangay);

        if (businessForm.registration_type) {
            data.append('registration_type', businessForm.registration_type);
        }

        if (businessForm.registration_number) {
            data.append(
                'registration_number',
                businessForm.registration_number,
            );
        }

        if (businessForm.business_permit_number) {
            data.append(
                'business_permit_number',
                businessForm.business_permit_number,
            );
        }

        if (businessForm.registration_permit_date) {
            data.append(
                'registration_permit_date',
                businessForm.registration_permit_date,
            );
        }

        if (registrationDocumentFile) {
            data.append(
                'business_registration_document',
                registrationDocumentFile,
            );
        }

        data.append('terms_of_service', '1');
        data.append('privacy_notice', '1');
        data.append('content_ip_responsibility', '1');
        data.append('ai_content_responsibility', '1');

        router.post('/onboarding/business', data, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => setCurrentStep(4),
            onFinish: () => setIsSubmitting(false),
        });
    };

    // Step 4: Launch Workspace
    const launchWorkspace = () => {
        setIsSubmitting(true);
        router.post(
            '/onboarding/complete',
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    const canGoBack =
        currentStep > 1 ||
        (currentStep === 2 && businessPage > 1) ||
        (currentStep === 3 && step3Page > 1);

    const canContinue = useMemo(() => {
        if (isSubmitting) {
            return false;
        }

        if (currentStep === 1) {
            return Boolean(
                personalForm.first_name.trim() && personalForm.last_name.trim(),
            );
        }

        if (currentStep === 2) {
            if (businessPage === 1) {
                return Boolean(businessForm.industry);
            }

            if (businessPage === 2) {
                return Boolean(businessForm.category);
            }

            if (businessPage === 3) {
                return Boolean(businessForm.name.trim());
            }
        }

        if (currentStep === 3) {
            if (step3Page === 1) {
                return true;
            }

            if (step3Page === 2) {
                return true;
            }

            if (step3Page === 3) {
                return allAgreementsChecked;
            }
        }

        if (currentStep === 4) {
            return true;
        }

        return false;
    }, [
        isSubmitting,
        currentStep,
        personalForm,
        businessPage,
        businessForm,
        step3Page,
        allAgreementsChecked,
    ]);

    const handleContinue = () => {
        if (currentStep === 1) {
            submitPersonal();
        } else if (currentStep === 2) {
            if (businessPage < 3) {
                setBusinessPage((p) => p + 1);
            } else {
                submitBusinessStep();
            }
        } else if (currentStep === 3) {
            if (step3Page === 1) {
                continueToRegistration();
            } else if (step3Page === 2) {
                continueToAgreements();
            } else if (step3Page === 3) {
                submitStep3Complete();
            }
        } else if (currentStep === 4) {
            launchWorkspace();
        }
    };

    const continueButtonLabel = useMemo(() => {
        if (isSubmitting) {
            if (currentStep === 4) {
                return 'Launching workspace…';
            }

            if (currentStep === 3 && step3Page === 3) {
                return 'Activating…';
            }

            return 'Saving…';
        }

        if (currentStep === 4) {
            return 'Launch MarketPilot';
        }

        if (currentStep === 3 && step3Page === 3) {
            return 'Review workspace';
        }

        return 'Continue';
    }, [isSubmitting, currentStep, step3Page]);

    return (
        <>
            <Head
                title={`Set up MarketPilot — Step ${currentStep} of ${TOTAL_STEPS}`}
            />

            <div className="relative flex h-screen w-full flex-col overflow-hidden bg-background text-foreground transition-colors duration-200">
                {/* Rich system-style ambient gradients & lighting - tuned for both Light and Dark modes */}
                <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none">
                    {/* Top ambient radial spotlight */}
                    <div className="absolute -top-32 left-1/2 h-[500px] w-[880px] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/[0.08] via-primary/[0.02] to-transparent blur-3xl dark:from-primary/[0.14]" />
                    {/* Subtle top-right ambient emerald aura */}
                    <div className="absolute top-10 right-0 h-[450px] w-[450px] rounded-full bg-gradient-to-bl from-emerald-500/[0.04] via-transparent to-transparent blur-3xl dark:from-emerald-500/[0.08]" />
                    {/* Bottom ambient glow */}
                    <div className="absolute -bottom-24 left-1/3 h-[350px] w-[550px] rounded-full bg-gradient-to-t from-primary/[0.04] via-transparent to-transparent blur-3xl dark:from-primary/[0.07]" />
                    {/* Subtle grid pattern overlay with radial mask */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_20%,#000_70%,transparent_100%)] bg-[size:24px_24px]" />
                </div>

                {/* Mobile header */}
                <div className="relative z-10 shrink-0 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur-md lg:hidden">
                    <div className="flex items-center justify-between">
                        <AppLogo />
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={toggleTheme}
                                aria-label="Toggle theme"
                                className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground"
                            >
                                {resolvedAppearance === 'dark' ? (
                                    <Sun className="h-4 w-4 text-amber-400" />
                                ) : (
                                    <Moon className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 flex h-full w-full flex-1 overflow-hidden">
                    {/* Desktop sidebar navigation - Structured with header (h-12) & footer (h-11) aligned to main grid */}
                    <aside
                        className={cn(
                            'relative hidden h-full shrink-0 flex-col justify-between overflow-hidden overflow-x-hidden border-r border-sidebar-border bg-gradient-to-b from-sidebar via-sidebar/95 to-sidebar-accent/30 text-sidebar-foreground transition-[width] duration-300 ease-in-out lg:flex',
                            isSidebarCollapsed
                                ? 'w-16'
                                : 'w-[265px] xl:w-[275px]',
                        )}
                    >
                        {/* Ambient subtle glow like setup wizard */}
                        <div className="pointer-events-none absolute -top-16 left-1/2 z-0 h-44 w-60 -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/[0.12] via-primary/[0.03] to-transparent blur-2xl dark:from-primary/[0.18]" />
                        <div className="pointer-events-none absolute bottom-8 -left-10 z-0 h-32 w-32 rounded-full bg-gradient-to-tr from-emerald-500/[0.06] to-transparent blur-2xl dark:from-emerald-500/[0.10]" />

                        {/* Sidebar Top Header - Exactly aligned with main header (h-12 border-b) */}
                        <div
                            className={cn(
                                'relative z-10 flex h-12 shrink-0 items-center overflow-hidden border-b border-sidebar-border/80 bg-gradient-to-r from-sidebar via-sidebar/95 to-sidebar/90 transition-all before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-border/60 before:to-transparent',
                                isSidebarCollapsed
                                    ? 'justify-center px-2'
                                    : 'justify-between px-4 xl:px-5',
                            )}
                        >
                            {isSidebarCollapsed ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsSidebarCollapsed(false)}
                                    title="Expand sidebar"
                                    aria-label="Expand sidebar"
                                    className="group relative flex aspect-square size-8.5 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-card p-0.5 shadow-xs ring-1 ring-border/80 transition-all duration-300 hover:scale-105 hover:ring-primary/40 dark:bg-zinc-900/90 dark:ring-white/15"
                                >
                                    <AppLogoIcon className="size-full rounded-lg object-contain transition-opacity group-hover:opacity-0" />
                                    <PanelLeftOpen className="absolute h-4 w-4 text-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                </Button>
                            ) : (
                                <>
                                    <AppLogo />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            setIsSidebarCollapsed(true)
                                        }
                                        title="Collapse sidebar"
                                        aria-label="Collapse sidebar"
                                        className="h-7 w-7 cursor-pointer rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent/80 hover:text-foreground"
                                    >
                                        <PanelLeftClose className="h-4 w-4" />
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Sidebar Scrollable Body */}
                        <div
                            className={cn(
                                'relative z-10 flex flex-1 flex-col overflow-x-hidden overflow-y-auto',
                                isSidebarCollapsed
                                    ? 'items-center space-y-4 px-2 py-4'
                                    : 'p-5 xl:p-6',
                            )}
                        >
                            {isSidebarCollapsed ? (
                                <>
                                    {/* Collapsed Mini Progress indicator */}
                                    <div
                                        className="flex w-10 flex-col items-center justify-center rounded-xl border border-sidebar-border/80 bg-gradient-to-b from-sidebar-accent/60 to-sidebar-accent/20 p-1.5 shadow-2xs"
                                        title={`Setup Progress: ${progress}% (Step ${currentStep} of ${TOTAL_STEPS})`}
                                    >
                                        <span className="text-[10px] font-bold text-foreground tabular-nums">
                                            {progress}%
                                        </span>
                                        <div className="mt-1 h-1 w-6 overflow-hidden rounded-full bg-muted/80">
                                            <div
                                                className="h-full rounded-full bg-primary transition-all duration-300"
                                                style={{
                                                    width: `${progress}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Collapsed Step Icons */}
                                    <nav className="flex w-full flex-col items-center gap-2">
                                        {steps.map((item) => {
                                            const active =
                                                currentStep === item.id;
                                            const completed =
                                                currentStep > item.id;

                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    disabled={
                                                        !completed && !active
                                                    }
                                                    onClick={() => {
                                                        if (completed) {
                                                            setCurrentStep(
                                                                item.id,
                                                            );

                                                            if (item.id === 2) {
                                                                setBusinessPage(
                                                                    1,
                                                                );
                                                            }

                                                            if (item.id === 3) {
                                                                setStep3Page(1);
                                                            }
                                                        }
                                                    }}
                                                    title={`${item.title} - ${item.subtitle} (${completed ? 'Completed' : active ? 'In Progress' : 'Pending'})`}
                                                    className={cn(
                                                        'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs transition-all',
                                                        active &&
                                                            'bg-gradient-to-b from-primary to-primary/90 font-semibold text-primary-foreground shadow-2xs ring-2 ring-primary/25',
                                                        completed &&
                                                            'cursor-pointer border border-primary/25 bg-primary/10 text-primary shadow-2xs hover:bg-primary/20',
                                                        !active &&
                                                            !completed &&
                                                            'cursor-not-allowed border border-sidebar-border/60 bg-muted/60 text-muted-foreground opacity-60',
                                                    )}
                                                >
                                                    {completed ? (
                                                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                                                    ) : (
                                                        <span className="text-[11px] font-bold">
                                                            {item.id}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </nav>
                                </>
                            ) : (
                                <>
                                    {/* Workspace Setup Progress Card - Styled with signature setup wizard gradient and luminous top highlight */}
                                    <div className="relative overflow-hidden rounded-2xl border border-sidebar-border/80 bg-gradient-to-br from-card/95 via-card to-sidebar-accent/30 p-3.5 shadow-xs ring-1 ring-border/20 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-primary/35 before:to-transparent">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                                Setup Progress
                                            </span>
                                            <span className="text-xs font-bold text-foreground tabular-nums">
                                                {progress}%
                                            </span>
                                        </div>
                                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted/80">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-primary/80 shadow-xs transition-all duration-300 ease-out"
                                                style={{
                                                    width: `${progress}%`,
                                                }}
                                            />
                                        </div>
                                        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                                            <span>
                                                Step {currentStep} of{' '}
                                                {TOTAL_STEPS}
                                            </span>
                                            <span className="font-semibold text-foreground/90">
                                                {currentStepData.title}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Steps List - Clean, professional steps with gentle gradient */}
                                    <nav className="mt-4 space-y-1.5">
                                        {steps.map((item) => {
                                            const active =
                                                currentStep === item.id;
                                            const completed =
                                                currentStep > item.id;

                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    disabled={
                                                        !completed && !active
                                                    }
                                                    onClick={() => {
                                                        if (completed) {
                                                            setCurrentStep(
                                                                item.id,
                                                            );

                                                            if (item.id === 2) {
                                                                setBusinessPage(
                                                                    1,
                                                                );
                                                            }

                                                            if (item.id === 3) {
                                                                setStep3Page(1);
                                                            }
                                                        }
                                                    }}
                                                    className={cn(
                                                        'group relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs transition-all',
                                                        active &&
                                                            'border border-sidebar-border/80 bg-gradient-to-r from-sidebar-accent via-sidebar-accent/80 to-sidebar-accent/35 font-semibold text-sidebar-accent-foreground shadow-2xs ring-1 ring-primary/20 before:absolute before:top-2 before:bottom-2 before:left-0 before:w-1 before:rounded-r-full before:bg-gradient-to-b before:from-primary before:to-primary/80',
                                                        completed &&
                                                            'cursor-pointer text-muted-foreground hover:bg-sidebar-accent/40 hover:text-foreground',
                                                        !active &&
                                                            !completed &&
                                                            'cursor-not-allowed text-muted-foreground/60 opacity-75',
                                                    )}
                                                >
                                                    <div
                                                        className={cn(
                                                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold transition-all',
                                                            active &&
                                                                'bg-gradient-to-b from-primary to-primary/90 text-primary-foreground shadow-2xs',
                                                            completed &&
                                                                'border border-primary/20 bg-primary/10 text-primary shadow-2xs',
                                                            !active &&
                                                                !completed &&
                                                                'border border-sidebar-border/60 bg-muted/80 text-muted-foreground',
                                                        )}
                                                    >
                                                        {completed ? (
                                                            <Check className="h-3 w-3 stroke-[3]" />
                                                        ) : (
                                                            <span>
                                                                {item.id}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <p
                                                            className={cn(
                                                                'truncate text-xs leading-none font-medium',
                                                                active &&
                                                                    'font-semibold text-foreground',
                                                            )}
                                                        >
                                                            {item.title}
                                                        </p>
                                                        <p className="mt-1 truncate text-[10px] leading-none text-muted-foreground">
                                                            {item.subtitle}
                                                        </p>
                                                    </div>

                                                    {completed && (
                                                        <span className="text-[10px] font-medium text-muted-foreground">
                                                            Done
                                                        </span>
                                                    )}
                                                    {active && (
                                                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </nav>
                                </>
                            )}
                        </div>

                        {/* Bottom security notice - Exactly aligned with action footer (h-11 border-t), centered */}
                        <div
                            className={cn(
                                'relative z-10 flex h-11 shrink-0 items-center justify-center overflow-hidden border-t border-sidebar-border/80 bg-gradient-to-t from-sidebar-accent/30 via-sidebar/95 to-sidebar px-3 text-xs text-muted-foreground transition-all before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-border/60 before:to-transparent',
                            )}
                        >
                            {isSidebarCollapsed ? (
                                <div
                                    className="relative flex items-center justify-center"
                                    title="256-bit SSL Encrypted (Secure Connection)"
                                >
                                    <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500/80 shadow-2xs" />
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-1.5 text-center">
                                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    <span className="truncate text-[11px] font-medium text-muted-foreground">
                                        256-bit SSL Encrypted
                                    </span>
                                    <span
                                        className="h-1.5 w-1.5 rounded-full bg-emerald-500/80 shadow-2xs"
                                        title="Secure Connection"
                                    />
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* Main area - Seamless extension of layout */}
                    <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
                        {/* Desktop top header bar - Aligned with sidebar header (h-12 border-b) */}
                        <header className="hidden h-12 shrink-0 items-center justify-between border-b border-border/80 bg-card/60 px-4 backdrop-blur-md sm:px-6 lg:flex lg:px-8 xl:px-10">
                            <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 xl:max-w-7xl">
                                <nav
                                    aria-label="Breadcrumb navigation"
                                    className="flex min-w-0 flex-1 scrollbar-none items-center gap-1.5 overflow-x-auto pr-3 text-xs whitespace-nowrap"
                                >
                                    {currentStep === 1 && (
                                        <span className="font-semibold text-foreground">
                                            Setup
                                        </span>
                                    )}

                                    {currentStep === 2 && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setCurrentStep(1)
                                                }
                                                className="cursor-pointer font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline"
                                            >
                                                Setup
                                            </button>
                                            <span className="font-normal text-muted-foreground/40">
                                                /
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setBusinessPage(1)
                                                }
                                                className={cn(
                                                    'font-medium transition-colors',
                                                    businessPage > 1
                                                        ? 'cursor-pointer text-muted-foreground hover:text-foreground hover:underline'
                                                        : 'cursor-default font-semibold text-foreground',
                                                )}
                                            >
                                                Business
                                            </button>
                                            <span className="font-normal text-muted-foreground/40">
                                                /
                                            </span>
                                            <div className="flex items-center gap-1">
                                                {[
                                                    {
                                                        page: 1,
                                                        label: 'Industry',
                                                    },
                                                    {
                                                        page: 2,
                                                        label: 'Category',
                                                    },
                                                    { page: 3, label: 'Name' },
                                                ].map((sub, idx) => {
                                                    const isCurrent =
                                                        businessPage ===
                                                        sub.page;
                                                    const isAccessible =
                                                        businessPage >=
                                                        sub.page;

                                                    return (
                                                        <span
                                                            key={sub.page}
                                                            className="flex items-center gap-1"
                                                        >
                                                            {idx > 0 && (
                                                                <span className="text-[10px] text-muted-foreground/30">
                                                                    ›
                                                                </span>
                                                            )}
                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    !isAccessible
                                                                }
                                                                onClick={() => {
                                                                    if (
                                                                        sub.page ===
                                                                            2 &&
                                                                        !businessForm.industry
                                                                    ) {
                                                                        return;
                                                                    }

                                                                    if (
                                                                        sub.page ===
                                                                            3 &&
                                                                        !businessForm.category
                                                                    ) {
                                                                        return;
                                                                    }

                                                                    setBusinessPage(
                                                                        sub.page,
                                                                    );
                                                                }}
                                                                className={cn(
                                                                    'transition-colors',
                                                                    isCurrent
                                                                        ? 'cursor-default font-semibold text-foreground'
                                                                        : isAccessible
                                                                          ? 'cursor-pointer text-muted-foreground hover:text-foreground hover:underline'
                                                                          : 'cursor-not-allowed text-muted-foreground/40',
                                                                )}
                                                            >
                                                                {sub.label}
                                                            </button>
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}

                                    {currentStep === 3 && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setCurrentStep(1)
                                                }
                                                className="cursor-pointer font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline"
                                            >
                                                Setup
                                            </button>
                                            <span className="font-normal text-muted-foreground/40">
                                                /
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCurrentStep(2);
                                                    setBusinessPage(1);
                                                }}
                                                className="cursor-pointer font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline"
                                            >
                                                Business
                                            </button>
                                            <span className="font-normal text-muted-foreground/40">
                                                /
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setStep3Page(1)}
                                                className={cn(
                                                    'font-medium transition-colors',
                                                    step3Page > 1
                                                        ? 'cursor-pointer text-muted-foreground hover:text-foreground hover:underline'
                                                        : 'cursor-default font-semibold text-foreground',
                                                )}
                                            >
                                                Business Details
                                            </button>
                                            <span className="font-normal text-muted-foreground/40">
                                                /
                                            </span>
                                            <div className="flex items-center gap-1">
                                                {[
                                                    {
                                                        page: 1,
                                                        label: 'Brand & Location',
                                                    },
                                                    {
                                                        page: 2,
                                                        label: 'Registration',
                                                    },
                                                    {
                                                        page: 3,
                                                        label: 'Agreements',
                                                    },
                                                ].map((sub, idx) => {
                                                    const isCurrent =
                                                        step3Page === sub.page;
                                                    const isAccessible =
                                                        step3Page >= sub.page ||
                                                        Boolean(
                                                            descriptionForm.description.trim(),
                                                        );

                                                    return (
                                                        <span
                                                            key={sub.page}
                                                            className="flex items-center gap-1"
                                                        >
                                                            {idx > 0 && (
                                                                <span className="text-[10px] text-muted-foreground/30">
                                                                    ›
                                                                </span>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (
                                                                        sub.page >
                                                                            1 &&
                                                                        !descriptionForm.description.trim()
                                                                    ) {
                                                                        setDescriptionError(
                                                                            'Please enter a brief business description before continuing.',
                                                                        );

                                                                        return;
                                                                    }

                                                                    setDescriptionError(
                                                                        '',
                                                                    );
                                                                    setStep3Page(
                                                                        sub.page,
                                                                    );
                                                                }}
                                                                className={cn(
                                                                    'transition-colors',
                                                                    isCurrent
                                                                        ? 'cursor-default font-semibold text-foreground'
                                                                        : isAccessible
                                                                          ? 'cursor-pointer text-muted-foreground hover:text-foreground hover:underline'
                                                                          : 'cursor-pointer text-muted-foreground/50 hover:text-foreground hover:underline',
                                                                )}
                                                            >
                                                                {sub.label}
                                                            </button>
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}

                                    {currentStep === 4 && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setCurrentStep(1)
                                                }
                                                className="cursor-pointer font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline"
                                            >
                                                Setup
                                            </button>
                                            <span className="font-normal text-muted-foreground/40">
                                                /
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCurrentStep(2);
                                                    setBusinessPage(1);
                                                }}
                                                className="cursor-pointer font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline"
                                            >
                                                Business
                                            </button>
                                            <span className="font-normal text-muted-foreground/40">
                                                /
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCurrentStep(3);
                                                    setStep3Page(1);
                                                }}
                                                className="cursor-pointer font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline"
                                            >
                                                Business Details
                                            </button>
                                            <span className="font-normal text-muted-foreground/40">
                                                /
                                            </span>
                                            <span className="font-semibold text-foreground">
                                                Launch Review
                                            </span>
                                        </>
                                    )}
                                </nav>

                                {/* Theme toggle at the right side of the header where setup is located */}
                                <div className="flex shrink-0 items-center">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={toggleTheme}
                                        title={
                                            resolvedAppearance === 'dark'
                                                ? 'Switch to Light Mode'
                                                : 'Switch to Dark Mode'
                                        }
                                        aria-label="Toggle theme"
                                        className="h-8 w-8 cursor-pointer rounded-lg text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        {resolvedAppearance === 'dark' ? (
                                            <Sun className="h-4 w-4 text-amber-400 transition-transform hover:rotate-45" />
                                        ) : (
                                            <Moon className="h-4 w-4 text-foreground transition-transform hover:-rotate-12" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </header>

                        {/* Scrollable middle content area */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 lg:px-8 xl:px-10">
                            <div className="mx-auto w-full max-w-6xl pb-6 xl:max-w-7xl">
                                {/* Page title header without badges */}
                                <div className="mb-4">
                                    {currentStep === 1 && (
                                        <div className="space-y-1">
                                            <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                                                Let's start with your profile.
                                            </h2>
                                            <p className="text-xs text-muted-foreground">
                                                Confirm the administrator
                                                credentials responsible for this
                                                MarketPilot workspace.
                                            </p>
                                        </div>
                                    )}

                                    {currentStep === 2 && (
                                        <div className="space-y-2.5">
                                            <div className="space-y-1">
                                                <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                                                    Tell us about your business.
                                                </h2>
                                                <p className="text-xs text-muted-foreground">
                                                    Select your industry and
                                                    specialization so the AI
                                                    generates relevant,
                                                    high-converting marketing
                                                    materials.
                                                </p>
                                            </div>

                                            {/* AI Image Generation & Creative Engine Indicator */}
                                            <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/[0.08] via-primary/[0.03] to-transparent p-3 shadow-2xs">
                                                <div className="flex items-start gap-2.5">
                                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary shadow-2xs">
                                                        <Sparkles className="h-3.5 w-3.5" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-xs font-semibold text-foreground">
                                                                AI Creative &
                                                                Image Generation
                                                                Engine
                                                            </p>
                                                            <span className="py-0.2 rounded-md border border-primary/30 bg-primary/10 px-1.5 text-[9px] font-bold tracking-wider text-primary uppercase">
                                                                Image
                                                                Calibration
                                                            </span>
                                                        </div>
                                                        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                                                            This business
                                                            identity (industry
                                                            sector,
                                                            specialization
                                                            category, and brand
                                                            name) provides the
                                                            core creative
                                                            baseline for
                                                            MarketPilot’s AI. It
                                                            directly calibrates
                                                            photographic styles,
                                                            lighting, color
                                                            harmony, and visual
                                                            art prompts when
                                                            synthesizing
                                                            on-brand promotional
                                                            images and marketing
                                                            graphics.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {currentStep === 3 && (
                                        <div className="space-y-1">
                                            <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                                                Add your business details.
                                            </h2>
                                            <p className="text-xs text-muted-foreground">
                                                Provide brand context, operating
                                                location, optional legal
                                                registration, and required
                                                platform agreements.
                                            </p>
                                        </div>
                                    )}

                                    {currentStep === 4 && (
                                        <div className="space-y-1">
                                            <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                                                Your workspace is ready to
                                                launch.
                                            </h2>
                                            <p className="text-xs text-muted-foreground">
                                                Verify your workspace profile
                                                configuration below, then
                                                activate MarketPilot.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* ========================================================================= */}
                                {/* STEP 1: PROFILE & PERSONAL INFO                                            */}
                                {/* ========================================================================= */}
                                {currentStep === 1 && (
                                    <div className="space-y-4">
                                        {/* Google account connection alert */}
                                        {isGoogleAccount && (
                                            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-gradient-to-r from-muted/70 via-muted/35 to-card px-3.5 py-2.5 text-xs text-muted-foreground shadow-2xs">
                                                <Lock className="h-4 w-4 shrink-0 text-foreground" />
                                                <p className="text-[11px] leading-relaxed">
                                                    <span className="font-semibold text-foreground">
                                                        Signed in with Google:
                                                    </span>{' '}
                                                    Your name and email are
                                                    synchronized from your
                                                    Google profile. You can
                                                    still customize your middle
                                                    name and mobile number.
                                                </p>
                                            </div>
                                        )}

                                        <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card via-card to-card/95 text-card-foreground shadow-xs ring-1 ring-border/20 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-primary/25 before:to-transparent">
                                            {/* Identity Section */}
                                            <div className="border-b border-border/70 p-4 sm:p-5">
                                                <div className="mb-3.5 flex items-center gap-2.5">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-gradient-to-b from-muted to-muted/70 text-foreground shadow-2xs">
                                                        <UserIcon className="h-3.5 w-3.5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-foreground">
                                                            Personal identity
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            Official name for
                                                            workspace
                                                            administration
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <div className="space-y-1">
                                                        <Label
                                                            htmlFor="first_name"
                                                            className="text-[11px] font-medium text-foreground"
                                                        >
                                                            First name{' '}
                                                            <span className="text-destructive">
                                                                *
                                                            </span>
                                                        </Label>
                                                        <Input
                                                            id="first_name"
                                                            value={
                                                                personalForm.first_name
                                                            }
                                                            disabled={
                                                                isGoogleAccount
                                                            }
                                                            onChange={(e) =>
                                                                setPersonalForm(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        first_name:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    }),
                                                                )
                                                            }
                                                            placeholder="First name"
                                                            className="h-9 rounded-xl border border-input bg-background/90 px-3 text-xs font-medium text-foreground shadow-xs transition-colors placeholder:text-muted-foreground hover:border-ring/50 focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
                                                        />
                                                        {errors?.first_name && (
                                                            <p className="text-[10px] font-medium text-destructive">
                                                                {
                                                                    errors.first_name
                                                                }
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Label
                                                            htmlFor="middle_name"
                                                            className="text-[11px] font-medium text-foreground"
                                                        >
                                                            Middle name{' '}
                                                            <span className="font-normal text-muted-foreground">
                                                                Optional
                                                            </span>
                                                        </Label>
                                                        <Input
                                                            id="middle_name"
                                                            value={
                                                                personalForm.middle_name
                                                            }
                                                            onChange={(e) =>
                                                                setPersonalForm(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        middle_name:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    }),
                                                                )
                                                            }
                                                            placeholder="Middle name"
                                                            className="h-9 rounded-xl border border-input bg-background/90 px-3 text-xs font-medium text-foreground shadow-xs transition-colors placeholder:text-muted-foreground hover:border-ring/50 focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/50"
                                                        />
                                                        {errors?.middle_name && (
                                                            <p className="text-[10px] font-medium text-destructive">
                                                                {
                                                                    errors.middle_name
                                                                }
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Label
                                                            htmlFor="last_name"
                                                            className="text-[11px] font-medium text-foreground"
                                                        >
                                                            Last name{' '}
                                                            <span className="text-destructive">
                                                                *
                                                            </span>
                                                        </Label>
                                                        <Input
                                                            id="last_name"
                                                            value={
                                                                personalForm.last_name
                                                            }
                                                            disabled={
                                                                isGoogleAccount
                                                            }
                                                            onChange={(e) =>
                                                                setPersonalForm(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        last_name:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    }),
                                                                )
                                                            }
                                                            placeholder="Last name"
                                                            className="h-9 rounded-xl border border-input bg-background/90 px-3 text-xs font-medium text-foreground shadow-xs transition-colors placeholder:text-muted-foreground hover:border-ring/50 focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
                                                        />
                                                        {errors?.last_name && (
                                                            <p className="text-[10px] font-medium text-destructive">
                                                                {
                                                                    errors.last_name
                                                                }
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Label
                                                            htmlFor="suffix"
                                                            className="text-[11px] font-medium text-foreground"
                                                        >
                                                            Suffix{' '}
                                                            <span className="font-normal text-muted-foreground">
                                                                Optional
                                                            </span>
                                                        </Label>
                                                        <Input
                                                            id="suffix"
                                                            value={
                                                                personalForm.suffix
                                                            }
                                                            disabled={
                                                                isGoogleAccount
                                                            }
                                                            onChange={(e) =>
                                                                setPersonalForm(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        suffix: e
                                                                            .target
                                                                            .value,
                                                                    }),
                                                                )
                                                            }
                                                            placeholder="Jr., Sr., III"
                                                            className="h-9 rounded-xl border border-input bg-background/90 px-3 text-xs font-medium text-foreground shadow-xs transition-colors placeholder:text-muted-foreground hover:border-ring/50 focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
                                                        />
                                                        {errors?.suffix && (
                                                            <p className="text-[10px] font-medium text-destructive">
                                                                {errors.suffix}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Contact & Verification Section */}
                                            <div className="p-4 sm:p-5">
                                                <div className="mb-3.5 flex items-center gap-2.5">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-gradient-to-b from-muted to-muted/70 text-foreground shadow-2xs">
                                                        <ShieldCheck className="h-3.5 w-3.5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-foreground">
                                                            Contact &
                                                            credentials
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            For critical alerts,
                                                            reports, and
                                                            security
                                                            verification
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <Label
                                                                htmlFor="email"
                                                                className="text-[11px] font-medium text-foreground"
                                                            >
                                                                Email address
                                                            </Label>
                                                            <span className="py-0.2 inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 px-2 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                                                                <BadgeCheck className="h-2.5 w-2.5" />{' '}
                                                                VERIFIED
                                                            </span>
                                                        </div>
                                                        <Input
                                                            id="email"
                                                            value={
                                                                personalForm.email
                                                            }
                                                            disabled
                                                            className="h-9 cursor-not-allowed rounded-xl border border-border bg-muted/60 px-3 text-xs font-medium text-muted-foreground shadow-xs"
                                                        />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <Label
                                                                htmlFor="mobile_number"
                                                                className="text-[11px] font-medium text-foreground"
                                                            >
                                                                Mobile number
                                                            </Label>
                                                            <span className="text-[10px] text-muted-foreground">
                                                                Optional
                                                            </span>
                                                        </div>
                                                        <div className="relative flex h-9 w-full items-center overflow-hidden rounded-xl border border-input bg-background/90 shadow-xs transition-colors focus-within:border-ring focus-within:ring-[2px] focus-within:ring-ring/50 hover:border-ring/50">
                                                            <div className="flex h-full shrink-0 items-center gap-2 border-r border-border/80 bg-muted/40 px-2.5 select-none">
                                                                {/* Flat 2D Philippine Flag */}
                                                                <span className="inline-flex h-3.5 w-5 shrink-0 overflow-hidden rounded-[2px] border border-black/15 dark:border-white/20">
                                                                    <svg
                                                                        className="h-full w-full"
                                                                        viewBox="0 0 30 20"
                                                                        fill="none"
                                                                        aria-hidden="true"
                                                                    >
                                                                        <rect
                                                                            width="30"
                                                                            height="10"
                                                                            fill="#0038A8"
                                                                        />
                                                                        <rect
                                                                            y="10"
                                                                            width="30"
                                                                            height="10"
                                                                            fill="#CE1126"
                                                                        />
                                                                        <polygon
                                                                            points="0,0 17.32,10 0,20"
                                                                            fill="#FFFFFF"
                                                                        />
                                                                        <circle
                                                                            cx="5.77"
                                                                            cy="10"
                                                                            r="2.5"
                                                                            fill="#FCD116"
                                                                        />
                                                                        <circle
                                                                            cx="2"
                                                                            cy="3"
                                                                            r="0.75"
                                                                            fill="#FCD116"
                                                                        />
                                                                        <circle
                                                                            cx="2"
                                                                            cy="17"
                                                                            r="0.75"
                                                                            fill="#FCD116"
                                                                        />
                                                                        <circle
                                                                            cx="14.5"
                                                                            cy="10"
                                                                            r="0.75"
                                                                            fill="#FCD116"
                                                                        />
                                                                    </svg>
                                                                </span>
                                                                <span className="font-mono text-xs font-semibold text-foreground">
                                                                    +63
                                                                </span>
                                                            </div>
                                                            <input
                                                                id="mobile_number"
                                                                type="tel"
                                                                value={personalForm.mobile_number
                                                                    .replace(
                                                                        /^\+?63\s?/,
                                                                        '',
                                                                    )
                                                                    .replace(
                                                                        /^0/,
                                                                        '',
                                                                    )}
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const raw =
                                                                        e.target.value.replace(
                                                                            /[^\d\s-]/g,
                                                                            '',
                                                                        );
                                                                    const digits =
                                                                        raw.replace(
                                                                            /[^\d]/g,
                                                                            '',
                                                                        );
                                                                    setPersonalForm(
                                                                        (
                                                                            prev,
                                                                        ) => ({
                                                                            ...prev,
                                                                            mobile_number:
                                                                                digits
                                                                                    ? `+63 ${raw.trim()}`
                                                                                    : '',
                                                                        }),
                                                                    );
                                                                }}
                                                                placeholder="917 123 4567"
                                                                className="h-full flex-1 bg-transparent px-3 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
                                                            />
                                                        </div>
                                                        {errors?.mobile_number ? (
                                                            <p className="text-[10px] font-medium text-destructive">
                                                                {
                                                                    errors.mobile_number
                                                                }
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                )}

                                {/* ========================================================================= */}
                                {/* STEP 2: BUSINESS (Industry, Category, Name)                                */}
                                {/* ========================================================================= */}
                                {currentStep === 2 && (
                                    <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card via-card to-card/95 text-card-foreground shadow-xs ring-1 ring-border/20 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-primary/25 before:to-transparent">
                                        {/* Segmented Stepper Bar */}
                                        <div className="border-b border-border/70 px-4 pt-3.5 pb-3 sm:px-5">
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <p className="text-xs font-semibold tracking-tight text-foreground">
                                                        {businessPage === 1 &&
                                                            'Select your industry'}
                                                        {businessPage === 2 &&
                                                            'Select your category specialization'}
                                                        {businessPage === 3 &&
                                                            'Name your business workspace'}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        Step {businessPage} of 3
                                                        in Business Setup
                                                    </p>
                                                </div>

                                                <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                                    {businessPage} / 3
                                                </span>
                                            </div>

                                            {/* Sub-step Pill Controls */}
                                            <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl border border-border bg-muted p-1">
                                                {[
                                                    {
                                                        num: 1,
                                                        label: 'Industry',
                                                        value: businessForm.industry,
                                                    },
                                                    {
                                                        num: 2,
                                                        label: 'Category',
                                                        value: businessForm.category,
                                                    },
                                                    {
                                                        num: 3,
                                                        label: 'Name',
                                                        value: businessForm.name,
                                                    },
                                                ].map((p) => {
                                                    const isActive =
                                                        businessPage === p.num;
                                                    const isDone =
                                                        businessPage > p.num;

                                                    return (
                                                        <button
                                                            key={p.num}
                                                            type="button"
                                                            onClick={() => {
                                                                if (
                                                                    p.num ===
                                                                        2 &&
                                                                    !businessForm.industry
                                                                ) {
                                                                    return;
                                                                }

                                                                if (
                                                                    p.num ===
                                                                        3 &&
                                                                    (!businessForm.industry ||
                                                                        !businessForm.category)
                                                                ) {
                                                                    return;
                                                                }

                                                                setBusinessPage(
                                                                    p.num,
                                                                );
                                                            }}
                                                            className={cn(
                                                                'flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all',
                                                                isActive
                                                                    ? 'border border-border/80 bg-gradient-to-b from-background to-background/95 font-semibold text-foreground shadow-2xs'
                                                                    : isDone
                                                                      ? 'text-emerald-600 hover:bg-background/40 dark:text-emerald-400'
                                                                      : 'text-muted-foreground hover:bg-background/30 hover:text-foreground',
                                                            )}
                                                        >
                                                            {isDone ? (
                                                                <Check className="h-3 w-3 shrink-0 text-emerald-500" />
                                                            ) : (
                                                                <span
                                                                    className={cn(
                                                                        'text-[10px] opacity-70',
                                                                        isActive &&
                                                                            'font-bold text-foreground',
                                                                    )}
                                                                >
                                                                    {p.num}.
                                                                </span>
                                                            )}
                                                            <span className="truncate">
                                                                {p.label}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Sub-page 1: Industry Selection */}
                                        {businessPage === 1 && (
                                            <div className="p-4 sm:p-5">
                                                <div className="mb-3">
                                                    <p className="text-xs font-semibold text-foreground">
                                                        Which industry best
                                                        describes your business?
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Select your primary
                                                        industry below, then
                                                        click Continue.
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                                    {industryOptions.map(
                                                        (ind) => {
                                                            const Icon =
                                                                industryIcons[
                                                                    ind
                                                                ] ?? Building2;
                                                            const selected =
                                                                businessForm.industry ===
                                                                ind;

                                                            return (
                                                                <button
                                                                    key={ind}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        handleSelectIndustry(
                                                                            ind,
                                                                        );
                                                                    }}
                                                                    className={cn(
                                                                        'group relative flex min-h-[50px] cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-all',
                                                                        selected
                                                                            ? 'border-primary/60 bg-gradient-to-br from-primary/12 via-primary/6 to-transparent text-foreground shadow-xs ring-1 ring-primary/25'
                                                                            : 'border-border/80 bg-gradient-to-b from-card via-card to-muted/20 text-foreground shadow-2xs hover:border-border hover:from-card hover:to-muted/40',
                                                                    )}
                                                                >
                                                                    <div
                                                                        className={cn(
                                                                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                                                                            selected
                                                                                ? 'bg-gradient-to-br from-primary to-primary/85 text-primary-foreground shadow-2xs'
                                                                                : 'bg-gradient-to-br from-muted to-muted/70 text-muted-foreground group-hover:from-background group-hover:to-muted/50 group-hover:text-foreground',
                                                                        )}
                                                                    >
                                                                        <Icon className="h-4 w-4" />
                                                                    </div>

                                                                    <div className="min-w-0 flex-1">
                                                                        <span className="block text-xs leading-snug font-semibold break-words text-foreground">
                                                                            {
                                                                                ind
                                                                            }
                                                                        </span>
                                                                        <span className="text-[10px] text-muted-foreground">
                                                                            {industryCategories[
                                                                                ind
                                                                            ]
                                                                                ?.length ??
                                                                                0}{' '}
                                                                            specializations
                                                                        </span>
                                                                    </div>

                                                                    {selected ? (
                                                                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xs">
                                                                            <Check className="h-3 w-3 stroke-[3]" />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="h-4 w-4 rounded-full border-2 border-border/80 transition-colors group-hover:border-primary/50" />
                                                                    )}
                                                                </button>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Sub-page 2: Category Selection */}
                                        {businessPage === 2 && (
                                            <div className="p-4 sm:p-5">
                                                <div className="mb-3.5 flex items-center justify-between gap-3 rounded-xl border border-border bg-gradient-to-r from-muted/70 via-muted/35 to-card p-2.5 shadow-2xs">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background text-foreground shadow-2xs">
                                                            <Building2 className="h-3.5 w-3.5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-medium text-muted-foreground">
                                                                Selected
                                                                Industry
                                                            </p>
                                                            <p className="text-xs font-bold text-foreground">
                                                                {
                                                                    businessForm.industry
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setBusinessPage(1)
                                                        }
                                                        className="cursor-pointer rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-2xs transition-colors hover:bg-accent"
                                                    >
                                                        Change
                                                    </button>
                                                </div>

                                                <div className="mb-3">
                                                    <p className="text-xs font-semibold text-foreground">
                                                        Select your business
                                                        category
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Select your
                                                        specialization below,
                                                        then click Continue to
                                                        name your brand.
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                                    {availableCategories.map(
                                                        (cat) => {
                                                            const selected =
                                                                businessForm.category ===
                                                                cat;

                                                            return (
                                                                <button
                                                                    key={cat}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        handleSelectCategory(
                                                                            cat,
                                                                        );
                                                                    }}
                                                                    className={cn(
                                                                        'flex min-h-[42px] cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2 text-left text-xs font-medium transition-all',
                                                                        selected
                                                                            ? 'border-primary/60 bg-gradient-to-br from-primary/12 via-primary/6 to-transparent font-semibold text-foreground shadow-xs ring-1 ring-primary/25'
                                                                            : 'border-border/80 bg-gradient-to-b from-card to-card/90 text-foreground shadow-2xs hover:border-border hover:from-card hover:to-muted/30',
                                                                    )}
                                                                >
                                                                    <span className="truncate">
                                                                        {cat}
                                                                    </span>
                                                                    {selected ? (
                                                                        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xs">
                                                                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="h-3.5 w-3.5 rounded-full border border-border/80 transition-colors group-hover:border-primary/50" />
                                                                    )}
                                                                </button>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Sub-page 3: Business Name & Preview */}
                                        {businessPage === 3 && (
                                            <div className="p-4 sm:p-5">
                                                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-[1fr_320px]">
                                                    {/* Form input */}
                                                    <div className="space-y-4">
                                                        <div>
                                                            <p className="text-xs font-semibold text-foreground">
                                                                What is your
                                                                business name?
                                                            </p>
                                                            <p className="text-[11px] text-muted-foreground">
                                                                This brand name
                                                                will appear in
                                                                headlines,
                                                                captions, and
                                                                campaign
                                                                deliverables.
                                                            </p>
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <Label
                                                                htmlFor="business_name"
                                                                className="text-[11px] font-medium text-foreground"
                                                            >
                                                                Official
                                                                business or
                                                                brand name{' '}
                                                                <span className="text-destructive">
                                                                    *
                                                                </span>
                                                            </Label>
                                                            <Input
                                                                id="business_name"
                                                                value={
                                                                    businessForm.name
                                                                }
                                                                onChange={(e) =>
                                                                    setBusinessForm(
                                                                        (
                                                                            prev,
                                                                        ) => ({
                                                                            ...prev,
                                                                            name: e
                                                                                .target
                                                                                .value,
                                                                        }),
                                                                    )
                                                                }
                                                                placeholder="e.g. Metro Roasters Café"
                                                                className="h-10 rounded-xl border border-input bg-background px-3 text-xs font-medium text-foreground shadow-xs transition-colors placeholder:text-muted-foreground hover:border-ring/50 focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/50"
                                                            />
                                                            {errors?.name && (
                                                                <p className="text-[10px] font-medium text-destructive">
                                                                    {
                                                                        errors.name
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div className="rounded-xl border border-border bg-gradient-to-br from-muted/40 to-muted/20 p-3 shadow-2xs">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                                                    Category
                                                                    Taxonomy
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setBusinessPage(
                                                                            2,
                                                                        )
                                                                    }
                                                                    className="cursor-pointer text-[10px] font-semibold text-foreground hover:underline"
                                                                >
                                                                    Edit
                                                                    category
                                                                </button>
                                                            </div>
                                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                                <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-semibold text-foreground shadow-2xs">
                                                                    {
                                                                        businessForm.industry
                                                                    }
                                                                </span>
                                                                <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground shadow-2xs">
                                                                    {
                                                                        businessForm.category
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Live Identity Preview Card with subtle gradient */}
                                                    <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/40 p-4 shadow-xs before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-primary/25 before:to-transparent">
                                                        <div>
                                                            <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                                                Workspace
                                                                Preview
                                                            </p>
                                                            <div className="mt-3 flex items-center gap-3">
                                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-sm font-bold text-primary-foreground shadow-xs">
                                                                    {businessForm.name.trim()
                                                                        ? businessForm.name
                                                                              .trim()
                                                                              .charAt(
                                                                                  0,
                                                                              )
                                                                              .toUpperCase()
                                                                        : 'B'}
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="truncate text-xs font-bold text-foreground">
                                                                        {businessForm.name.trim() ||
                                                                            'Your Business Name'}
                                                                    </p>
                                                                    <p className="truncate text-[10px] text-muted-foreground">
                                                                        {businessForm.category ||
                                                                            'Specialization'}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="mt-4 space-y-1.5 rounded-xl border border-border/80 bg-background/80 p-2.5 text-[10px] shadow-2xs">
                                                                <div className="flex justify-between text-muted-foreground">
                                                                    <span>
                                                                        Sector
                                                                    </span>
                                                                    <span className="font-semibold text-foreground">
                                                                        {businessForm.industry ||
                                                                            '—'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between text-muted-foreground">
                                                                    <span>
                                                                        Category
                                                                    </span>
                                                                    <span className="font-semibold text-foreground">
                                                                        {businessForm.category ||
                                                                            '—'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between text-muted-foreground">
                                                                    <span>
                                                                        Status
                                                                    </span>
                                                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                                        Ready to
                                                                        configure
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mt-3 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-2 text-[10px] text-muted-foreground">
                                                            <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
                                                            <span>
                                                                Seeds the AI
                                                                image generator
                                                                & brand voice
                                                                for automated
                                                                campaigns.
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </section>
                                )}

                                {/* ========================================================================= */}
                                {/* STEP 3: BUSINESS DETAILS (Brand & Location, Registration, Agreements)      */}
                                {/* ========================================================================= */}
                                {currentStep === 3 && (
                                    <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card via-card to-card/95 text-card-foreground shadow-xs ring-1 ring-border/20 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-primary/25 before:to-transparent">
                                        {/* Sub-step Stepper Bar */}
                                        <div className="border-b border-border/70 px-4 pt-3.5 pb-3 sm:px-5">
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <p className="text-xs font-semibold tracking-tight text-foreground">
                                                        {step3Page === 1 &&
                                                            'Brand voice & physical location'}
                                                        {step3Page === 2 &&
                                                            'Business registration (Optional)'}
                                                        {step3Page === 3 &&
                                                            'Required platform agreements'}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {step3Page === 1 &&
                                                            'Give MarketPilot the context it needs to craft accurate content.'}
                                                        {step3Page === 2 &&
                                                            'Upload business permits or skip to finish later.'}
                                                        {step3Page === 3 &&
                                                            'Review the required documents before workspace launch.'}
                                                    </p>
                                                </div>

                                                <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                                    {step3Page} / 3
                                                </span>
                                            </div>

                                            {/* Sub-step Pill Controls */}
                                            <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl border border-border bg-muted p-1">
                                                {[
                                                    {
                                                        num: 1,
                                                        label: 'Brand & Location',
                                                    },
                                                    {
                                                        num: 2,
                                                        label: 'Registration (Opt.)',
                                                    },
                                                    {
                                                        num: 3,
                                                        label: 'Agreements',
                                                    },
                                                ].map((p) => {
                                                    const isActive =
                                                        step3Page === p.num;
                                                    const isDone =
                                                        step3Page > p.num;

                                                    return (
                                                        <button
                                                            key={p.num}
                                                            type="button"
                                                            onClick={() => {
                                                                if (
                                                                    p.num > 1 &&
                                                                    !descriptionForm.description.trim()
                                                                ) {
                                                                    setDescriptionError(
                                                                        'Please enter a description first.',
                                                                    );

                                                                    return;
                                                                }

                                                                setDescriptionError(
                                                                    '',
                                                                );
                                                                setStep3Page(
                                                                    p.num,
                                                                );
                                                            }}
                                                            className={cn(
                                                                'flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all',
                                                                isActive
                                                                    ? 'border border-border/80 bg-gradient-to-b from-background to-background/95 font-semibold text-foreground shadow-2xs'
                                                                    : isDone
                                                                      ? 'text-emerald-600 hover:bg-background/40 dark:text-emerald-400'
                                                                      : 'text-muted-foreground hover:bg-background/30 hover:text-foreground',
                                                            )}
                                                        >
                                                            {isDone ? (
                                                                <Check className="h-3 w-3 shrink-0 text-emerald-500" />
                                                            ) : (
                                                                <span
                                                                    className={cn(
                                                                        'text-[10px] opacity-70',
                                                                        isActive &&
                                                                            'font-bold text-foreground',
                                                                    )}
                                                                >
                                                                    {p.num}.
                                                                </span>
                                                            )}
                                                            <span className="truncate">
                                                                {p.label}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Sub-page 1: Brand & Location */}
                                        <div
                                            className={cn(
                                                'space-y-5 p-4 sm:p-5',
                                                step3Page !== 1 && 'hidden',
                                            )}
                                        >
                                            {/* Brand Description Card */}
                                            <div className="space-y-3.5 rounded-2xl border border-border/80 bg-gradient-to-b from-card via-card/95 to-muted/20 p-4 shadow-xs transition-all duration-300 sm:p-5">
                                                <div className="flex items-start gap-2.5 sm:items-center">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border bg-gradient-to-b from-muted to-muted/60 text-foreground shadow-2xs">
                                                        <Sparkles className="h-4 w-4 text-amber-500" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Label
                                                                htmlFor="business_description"
                                                                className="cursor-pointer text-xs font-semibold text-foreground sm:text-sm"
                                                            >
                                                                About your
                                                                business & brand
                                                            </Label>
                                                            <span className="text-xs font-bold text-destructive">
                                                                *
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground sm:text-[11px]">
                                                            What do you sell,
                                                            who do you serve,
                                                            and what makes your
                                                            brand stand out?
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="relative">
                                                    <Textarea
                                                        id="business_description"
                                                        value={
                                                            descriptionForm.description
                                                        }
                                                        onChange={(e) => {
                                                            setDescriptionForm({
                                                                description:
                                                                    e.target
                                                                        .value,
                                                            });

                                                            if (
                                                                e.target.value.trim()
                                                            ) {
                                                                setDescriptionError(
                                                                    '',
                                                                );
                                                            }
                                                        }}
                                                        placeholder="e.g. We are an artisanal sourdough bakery in Quezon City serving organic pastries, specialty pour-overs, and handcrafted breakfasts to local families and remote workers. Our focus is natural fermentation and zero artificial additives."
                                                        className="max-h-[550px] min-h-[160px] w-full resize-y rounded-xl border border-input bg-background/95 p-3.5 text-xs leading-relaxed text-foreground shadow-2xs transition-all placeholder:text-muted-foreground hover:border-ring/50 focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/50 sm:min-h-[185px] sm:p-4 sm:text-sm md:min-h-[210px]"
                                                    />
                                                </div>

                                                <div className="flex items-center gap-1.5 border-t border-border/50 pt-1 text-[10px] text-muted-foreground sm:text-[11px]">
                                                    <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                                    <span>
                                                        AI engine uses this
                                                        context to personalize
                                                        captions, marketing
                                                        hooks, and imagery
                                                    </span>
                                                </div>

                                                {(descriptionError ||
                                                    errors?.description) && (
                                                    <p className="mt-1 text-[11px] font-medium text-destructive">
                                                        {descriptionError ||
                                                            errors?.description}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Operating Location */}
                                            <div className="border-t border-border/70 pt-4">
                                                <div className="mb-3 flex items-center gap-2">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-gradient-to-b from-muted to-muted/70 text-foreground shadow-2xs">
                                                        <MapPin className="h-3.5 w-3.5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-foreground">
                                                            Operating location
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            Specify your
                                                            headquarters or
                                                            service area so AI
                                                            localizes campaigns
                                                            and offers.
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="space-y-1">
                                                        <Label
                                                            htmlFor="business_address"
                                                            className="text-[11px] font-medium text-foreground"
                                                        >
                                                            Street address{' '}
                                                            <span className="font-normal text-muted-foreground">
                                                                Optional
                                                            </span>
                                                        </Label>
                                                        <Input
                                                            id="business_address"
                                                            value={
                                                                businessForm.business_address
                                                            }
                                                            onChange={(e) =>
                                                                setBusinessForm(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        business_address:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    }),
                                                                )
                                                            }
                                                            placeholder="e.g. Unit 4B, 123 Rizal Avenue"
                                                            className="h-9 rounded-xl border border-input bg-background/90 px-3 text-xs font-medium text-foreground shadow-xs transition-colors placeholder:text-muted-foreground hover:border-ring/50 focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/50"
                                                        />
                                                    </div>

                                                    {/* Region, Province, City, Barangay with proper screen-fitting dropdowns */}
                                                    <PhilippineAddressSelectors
                                                        region={
                                                            businessForm.region
                                                        }
                                                        province={
                                                            businessForm.province
                                                        }
                                                        cityMunicipality={
                                                            businessForm.city_municipality
                                                        }
                                                        barangay={
                                                            businessForm.barangay
                                                        }
                                                        onChange={(
                                                            field,
                                                            val,
                                                        ) =>
                                                            setBusinessForm(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    [field]:
                                                                        val,
                                                                }),
                                                            )
                                                        }
                                                        compact={true}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sub-page 2: Registration (Optional) */}
                                        {step3Page === 2 && (
                                            <div className="p-4 sm:p-5">
                                                <div className="mb-4 rounded-xl border border-border bg-gradient-to-r from-muted/70 via-muted/35 to-card p-3 shadow-2xs">
                                                    <div className="flex items-start gap-2.5">
                                                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                                                        <div>
                                                            <p className="text-xs font-semibold text-foreground">
                                                                Registration is
                                                                optional
                                                            </p>
                                                            <p className="text-[10px] leading-relaxed text-muted-foreground">
                                                                Official permits
                                                                help verify your
                                                                business
                                                                identity for
                                                                verified ad
                                                                accounts, but
                                                                you can safely
                                                                skip this step
                                                                and upload them
                                                                later in
                                                                Settings.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Registration Tabs */}
                                                <div className="mb-3.5 flex gap-1 rounded-xl border border-border bg-muted p-1">
                                                    {[
                                                        {
                                                            num: 1,
                                                            label: 'Registration details',
                                                        },
                                                        {
                                                            num: 2,
                                                            label: 'Document upload',
                                                        },
                                                    ].map((t) => (
                                                        <button
                                                            key={t.num}
                                                            type="button"
                                                            onClick={() =>
                                                                setRegistrationTab(
                                                                    t.num,
                                                                )
                                                            }
                                                            className={cn(
                                                                'flex-1 cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all',
                                                                registrationTab ===
                                                                    t.num
                                                                    ? 'border border-border/80 bg-gradient-to-b from-background to-background/95 font-semibold text-foreground shadow-2xs'
                                                                    : 'text-muted-foreground hover:text-foreground',
                                                            )}
                                                        >
                                                            {t.label}
                                                        </button>
                                                    ))}
                                                </div>

                                                {registrationTab === 1 && (
                                                    <div className="grid gap-3 sm:grid-cols-2">
                                                        <div className="space-y-1">
                                                            <Label
                                                                htmlFor="registration_type"
                                                                className="text-[11px] font-semibold text-foreground"
                                                            >
                                                                Registration
                                                                type
                                                            </Label>
                                                            <Select
                                                                value={
                                                                    businessForm.registration_type ||
                                                                    undefined
                                                                }
                                                                onValueChange={(
                                                                    val,
                                                                ) =>
                                                                    setBusinessForm(
                                                                        (
                                                                            prev,
                                                                        ) => ({
                                                                            ...prev,
                                                                            registration_type:
                                                                                val,
                                                                        }),
                                                                    )
                                                                }
                                                            >
                                                                <SelectTrigger
                                                                    id="registration_type"
                                                                    className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs font-medium text-foreground shadow-xs transition-colors hover:bg-accent/30 focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/50"
                                                                >
                                                                    <SelectValue placeholder="Select registration type" />
                                                                </SelectTrigger>
                                                                <SelectContent className="max-h-48 w-[var(--radix-select-trigger-width)] min-w-[200px] overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-lg sm:max-h-56">
                                                                    <SelectItem
                                                                        value="DTI"
                                                                        className="cursor-pointer text-xs focus:bg-accent focus:text-accent-foreground"
                                                                    >
                                                                        DTI
                                                                        (Sole
                                                                        Proprietorship)
                                                                    </SelectItem>
                                                                    <SelectItem
                                                                        value="SEC"
                                                                        className="cursor-pointer text-xs focus:bg-accent focus:text-accent-foreground"
                                                                    >
                                                                        SEC
                                                                        (Corporation
                                                                        /
                                                                        Partnership)
                                                                    </SelectItem>
                                                                    <SelectItem
                                                                        value="CDA"
                                                                        className="cursor-pointer text-xs focus:bg-accent focus:text-accent-foreground"
                                                                    >
                                                                        CDA
                                                                        (Cooperative)
                                                                    </SelectItem>
                                                                    <SelectItem
                                                                        value="Mayor's Permit"
                                                                        className="cursor-pointer text-xs focus:bg-accent focus:text-accent-foreground"
                                                                    >
                                                                        Mayor's
                                                                        / LGU
                                                                        Business
                                                                        Permit
                                                                    </SelectItem>
                                                                    <SelectItem
                                                                        value="BIR"
                                                                        className="cursor-pointer text-xs focus:bg-accent focus:text-accent-foreground"
                                                                    >
                                                                        BIR
                                                                        Certificate
                                                                        of
                                                                        Registration
                                                                    </SelectItem>
                                                                    <SelectItem
                                                                        value="Other"
                                                                        className="cursor-pointer text-xs focus:bg-accent focus:text-accent-foreground"
                                                                    >
                                                                        Other
                                                                        Official
                                                                        Registration
                                                                    </SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        <div className="space-y-1">
                                                            <Label
                                                                htmlFor="registration_number"
                                                                className="text-[11px] font-medium text-foreground"
                                                            >
                                                                Registration
                                                                number
                                                            </Label>
                                                            <Input
                                                                id="registration_number"
                                                                value={
                                                                    businessForm.registration_number
                                                                }
                                                                onChange={(e) =>
                                                                    setBusinessForm(
                                                                        (
                                                                            prev,
                                                                        ) => ({
                                                                            ...prev,
                                                                            registration_number:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                        }),
                                                                    )
                                                                }
                                                                placeholder="e.g. DTI-2024-001234"
                                                                className="h-9 rounded-xl border border-input bg-background/90 px-3 text-xs font-medium text-foreground shadow-xs transition-colors placeholder:text-muted-foreground hover:border-ring/50 focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/50"
                                                            />
                                                        </div>

                                                        <div className="space-y-1">
                                                            <Label
                                                                htmlFor="business_permit_number"
                                                                className="text-[11px] font-medium text-foreground"
                                                            >
                                                                Business permit
                                                                number
                                                            </Label>
                                                            <Input
                                                                id="business_permit_number"
                                                                value={
                                                                    businessForm.business_permit_number
                                                                }
                                                                onChange={(e) =>
                                                                    setBusinessForm(
                                                                        (
                                                                            prev,
                                                                        ) => ({
                                                                            ...prev,
                                                                            business_permit_number:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                        }),
                                                                    )
                                                                }
                                                                placeholder="e.g. BP-2024-998877"
                                                                className="h-9 rounded-xl border border-input bg-background/90 px-3 text-xs font-medium text-foreground shadow-xs transition-colors placeholder:text-muted-foreground hover:border-ring/50 focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/50"
                                                            />
                                                        </div>

                                                        <div className="space-y-1">
                                                            <Label
                                                                htmlFor="registration_permit_date"
                                                                className="text-[11px] font-medium text-foreground"
                                                            >
                                                                Permit /
                                                                registration
                                                                date
                                                            </Label>
                                                            <Input
                                                                id="registration_permit_date"
                                                                type="date"
                                                                value={
                                                                    businessForm.registration_permit_date
                                                                }
                                                                onChange={(e) =>
                                                                    setBusinessForm(
                                                                        (
                                                                            prev,
                                                                        ) => ({
                                                                            ...prev,
                                                                            registration_permit_date:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                        }),
                                                                    )
                                                                }
                                                                className="h-9 rounded-xl border border-input bg-background/90 px-3 text-xs font-medium text-foreground shadow-xs transition-colors hover:border-ring/50 focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/50"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {registrationTab === 2 && (
                                                    <div>
                                                        {registrationDocumentFile ? (
                                                            <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent p-4 shadow-2xs">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                                        <FileCheck2 className="h-5 w-5" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs font-semibold text-foreground">
                                                                            {
                                                                                registrationDocumentFile.name
                                                                            }
                                                                        </p>
                                                                        <p className="text-[10px] text-muted-foreground">
                                                                            {(
                                                                                registrationDocumentFile.size /
                                                                                1024
                                                                            ).toFixed(
                                                                                1,
                                                                            )}{' '}
                                                                            KB ·
                                                                            Ready
                                                                            to
                                                                            attach
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        setRegistrationDocumentFile(
                                                                            null,
                                                                        )
                                                                    }
                                                                    className="h-7 cursor-pointer rounded-lg text-xs text-destructive hover:bg-destructive/10"
                                                                >
                                                                    <X className="mr-1 h-3 w-3" />{' '}
                                                                    Remove
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <label
                                                                htmlFor="doc_upload"
                                                                className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-gradient-to-b from-muted/30 via-muted/15 to-transparent px-4 py-7 text-center transition-all hover:border-ring/60 hover:from-muted/40 hover:to-muted/20"
                                                            >
                                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-gradient-to-b from-muted to-muted/60 text-foreground shadow-2xs transition-transform group-hover:scale-105">
                                                                    <Upload className="h-4 w-4" />
                                                                </div>
                                                                <p className="mt-2.5 text-xs font-semibold text-foreground">
                                                                    Click to
                                                                    upload
                                                                    certificate
                                                                    or
                                                                    registration
                                                                    document
                                                                </p>
                                                                <p className="mt-0.5 text-[10px] text-muted-foreground">
                                                                    Supported
                                                                    formats:
                                                                    PDF, PNG,
                                                                    JPG, or WEBP
                                                                    (Max 5MB)
                                                                </p>
                                                                <span className="mt-3 rounded-lg border border-border bg-background px-3 py-1 text-[11px] font-medium text-foreground shadow-2xs transition-colors group-hover:bg-accent">
                                                                    Browse files
                                                                </span>
                                                                <input
                                                                    type="file"
                                                                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                                                                    id="doc_upload"
                                                                    className="hidden"
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        const f =
                                                                            e
                                                                                .target
                                                                                .files?.[0];

                                                                        if (f) {
                                                                            setRegistrationDocumentFile(
                                                                                f,
                                                                            );
                                                                        }
                                                                    }}
                                                                />
                                                            </label>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Sub-page 3: Agreements */}
                                        {step3Page === 3 && (
                                            <div className="p-4 sm:p-5">
                                                <div className="mb-3">
                                                    <p className="text-xs font-semibold text-foreground">
                                                        Platform agreements
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        All 4 agreements must be
                                                        acknowledged before
                                                        workspace activation.
                                                    </p>
                                                </div>

                                                <div className="space-y-2">
                                                    {legalDocumentOrder.map(
                                                        (docKey) => {
                                                            const doc =
                                                                legalCopy[
                                                                    docKey
                                                                ];
                                                            const checked =
                                                                legalAcceptances[
                                                                    docKey
                                                                ] ?? false;

                                                            return (
                                                                <div
                                                                    key={docKey}
                                                                    className={cn(
                                                                        'flex items-center gap-3 rounded-xl border p-3 transition-all',
                                                                        checked
                                                                            ? 'border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-card/70 shadow-2xs'
                                                                            : 'border-border/80 bg-gradient-to-b from-card to-card/95 hover:bg-muted/30',
                                                                    )}
                                                                >
                                                                    <Checkbox
                                                                        id={
                                                                            docKey
                                                                        }
                                                                        checked={
                                                                            checked
                                                                        }
                                                                        onCheckedChange={(
                                                                            val,
                                                                        ) =>
                                                                            setLegalAcceptances(
                                                                                (
                                                                                    prev,
                                                                                ) => ({
                                                                                    ...prev,
                                                                                    [docKey]:
                                                                                        val ===
                                                                                        true,
                                                                                }),
                                                                            )
                                                                        }
                                                                        className="h-4 w-4 cursor-pointer rounded-md"
                                                                    />

                                                                    <div className="min-w-0 flex-1">
                                                                        <Label
                                                                            htmlFor={
                                                                                docKey
                                                                            }
                                                                            className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-foreground"
                                                                        >
                                                                            {
                                                                                doc.title
                                                                            }
                                                                            {checked && (
                                                                                <span className="text-[9px] font-bold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
                                                                                    ✓
                                                                                    Accepted
                                                                                </span>
                                                                            )}
                                                                        </Label>
                                                                        <p className="truncate text-[10px] text-muted-foreground">
                                                                            {
                                                                                doc.text
                                                                            }
                                                                        </p>
                                                                    </div>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setActiveLegalModal(
                                                                                docKey,
                                                                            )
                                                                        }
                                                                        className="shrink-0 cursor-pointer rounded-lg border border-border bg-background px-2.5 py-1 text-[10px] font-semibold text-foreground shadow-2xs transition-colors hover:bg-accent"
                                                                    >
                                                                        View
                                                                        Terms
                                                                    </button>
                                                                </div>
                                                            );
                                                        },
                                                    )}
                                                </div>

                                                {/* Bottom bar with Accept all on the right */}
                                                <div className="mt-4 flex flex-col gap-2 border-t border-border/70 pt-3 sm:flex-row sm:items-center sm:justify-between">
                                                    <span className="text-[11px] text-muted-foreground">
                                                        {allAgreementsChecked
                                                            ? 'All 4 agreements acknowledged'
                                                            : 'Acknowledge all required platform agreements'}
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            const next =
                                                                !allAgreementsChecked;
                                                            setLegalAcceptances(
                                                                {
                                                                    terms_of_service:
                                                                        next,
                                                                    privacy_notice:
                                                                        next,
                                                                    content_ip_responsibility:
                                                                        next,
                                                                    ai_content_responsibility:
                                                                        next,
                                                                },
                                                            );
                                                        }}
                                                        className="h-8 cursor-pointer rounded-lg border-border text-xs font-semibold shadow-2xs hover:bg-accent"
                                                    >
                                                        {allAgreementsChecked
                                                            ? 'Uncheck all'
                                                            : 'Accept all'}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </section>
                                )}

                                {/* ========================================================================= */}
                                {/* STEP 4: LAUNCH & VERIFICATION                                             */}
                                {/* ========================================================================= */}
                                {currentStep === 4 && (
                                    <div className="space-y-4">
                                        {/* Header / Pre-launch Hero Banner */}
                                        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-card/95 p-4 shadow-xs ring-1 ring-border/20 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-emerald-500/30 before:to-transparent sm:p-5">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 shadow-2xs dark:text-emerald-400">
                                                        <Sparkles className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-bold text-foreground sm:text-base">
                                                            Workspace Ready for
                                                            Launch
                                                        </h3>
                                                        <p className="text-xs text-muted-foreground">
                                                            All configuration
                                                            modules are
                                                            calibrated. Review
                                                            your business
                                                            profile below before
                                                            launching.
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 shadow-2xs dark:text-emerald-400">
                                                        <CheckCircle2 className="h-3 w-3" />{' '}
                                                        4 of 4 Steps Complete
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Business Inputs Review Cards Grid */}
                                        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                                            {/* Card 1: Brand Core & AI Creative Baseline */}
                                            <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
                                                <div>
                                                    <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                                                        <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                                            <Sparkles className="h-3.5 w-3.5 text-primary" />{' '}
                                                            Brand Core & AI
                                                            Creative Baseline
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="py-0.2 rounded-md border border-primary/20 bg-primary/10 px-1.5 text-[9px] font-bold tracking-wider text-primary uppercase">
                                                                AI Seed
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setCurrentStep(
                                                                        2,
                                                                    );
                                                                    setBusinessPage(
                                                                        3,
                                                                    );
                                                                }}
                                                                className="cursor-pointer text-[10px] font-semibold text-primary hover:underline"
                                                            >
                                                                Edit
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 space-y-2.5">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-xs font-bold text-primary-foreground shadow-2xs">
                                                                {businessForm.name.trim()
                                                                    ? businessForm.name
                                                                          .trim()
                                                                          .charAt(
                                                                              0,
                                                                          )
                                                                          .toUpperCase()
                                                                    : 'B'}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate text-sm font-bold text-foreground">
                                                                    {businessForm.name ||
                                                                        'Untitled Business'}
                                                                </p>
                                                                <div className="mt-0.5 flex flex-wrap gap-1">
                                                                    <span className="rounded-md border border-border bg-muted/60 px-1.5 py-0.5 text-[9px] font-semibold text-foreground">
                                                                        {businessForm.industry ||
                                                                            'No industry selected'}
                                                                    </span>
                                                                    <span className="rounded-md border border-border bg-muted/60 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                                                                        {businessForm.category ||
                                                                            'No category selected'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Brand Story / Description block */}
                                                        <div className="rounded-xl border border-border/70 bg-muted/30 p-2.5 transition-all">
                                                            <div className="mb-1 flex items-center justify-between">
                                                                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                                                    Brand Voice
                                                                    & AI Image
                                                                    Context
                                                                </span>
                                                                {descriptionForm.description.trim()
                                                                    .length >
                                                                    110 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setIsReviewDescriptionExpanded(
                                                                                (
                                                                                    prev,
                                                                                ) =>
                                                                                    !prev,
                                                                            )
                                                                        }
                                                                        className="text-[10px] font-medium text-primary hover:underline"
                                                                    >
                                                                        {isReviewDescriptionExpanded
                                                                            ? 'Show less'
                                                                            : 'Read full'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <p
                                                                className={cn(
                                                                    'text-xs leading-relaxed text-muted-foreground italic',
                                                                    !isReviewDescriptionExpanded &&
                                                                        'line-clamp-3',
                                                                )}
                                                            >
                                                                "
                                                                {descriptionForm.description.trim() ||
                                                                    'No brand description provided yet.'}
                                                                "
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Card 2: Operating Location */}
                                            <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
                                                <div>
                                                    <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                                                        <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                                            <MapPin className="h-3.5 w-3.5 text-primary" />{' '}
                                                            Operating Location
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setCurrentStep(
                                                                    3,
                                                                );
                                                                setStep3Page(1);
                                                            }}
                                                            className="cursor-pointer text-[10px] font-semibold text-primary hover:underline"
                                                        >
                                                            Edit
                                                        </button>
                                                    </div>

                                                    <div className="mt-3 space-y-2">
                                                        {/* Street Address */}
                                                        <div className="rounded-xl border border-border/70 bg-muted/30 p-2.5">
                                                            <span className="mb-0.5 block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                                                Physical Address
                                                            </span>
                                                            <p className="text-xs font-semibold text-foreground">
                                                                {businessForm.business_address ||
                                                                    'No street address provided'}
                                                            </p>
                                                        </div>

                                                        {/* Administrative Location Hierarchy */}
                                                        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                                                            <div className="rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1.5">
                                                                <span className="block text-[9px] tracking-wider text-muted-foreground uppercase">
                                                                    Region
                                                                </span>
                                                                <span className="block truncate font-semibold text-foreground">
                                                                    {businessForm.region ||
                                                                        '—'}
                                                                </span>
                                                            </div>
                                                            <div className="rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1.5">
                                                                <span className="block text-[9px] tracking-wider text-muted-foreground uppercase">
                                                                    Province
                                                                </span>
                                                                <span className="block truncate font-semibold text-foreground">
                                                                    {businessForm.province ||
                                                                        '—'}
                                                                </span>
                                                            </div>
                                                            <div className="rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1.5">
                                                                <span className="block text-[9px] tracking-wider text-muted-foreground uppercase">
                                                                    City /
                                                                    Municipality
                                                                </span>
                                                                <span className="block truncate font-semibold text-foreground">
                                                                    {businessForm.city_municipality ||
                                                                        '—'}
                                                                </span>
                                                            </div>
                                                            <div className="rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1.5">
                                                                <span className="block text-[9px] tracking-wider text-muted-foreground uppercase">
                                                                    Barangay
                                                                </span>
                                                                <span className="block truncate font-semibold text-foreground">
                                                                    {businessForm.barangay ||
                                                                        '—'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Card 3: Business Registration & Documents */}
                                            <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
                                                <div>
                                                    <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                                                        <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                                            <FileText className="h-3.5 w-3.5 text-primary" />{' '}
                                                            Registration &
                                                            Permits
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setCurrentStep(
                                                                    3,
                                                                );
                                                                setStep3Page(2);
                                                            }}
                                                            className="cursor-pointer text-[10px] font-semibold text-primary hover:underline"
                                                        >
                                                            Edit
                                                        </button>
                                                    </div>

                                                    <div className="mt-3 space-y-2">
                                                        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                                                            <div className="rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1.5">
                                                                <span className="block text-[9px] tracking-wider text-muted-foreground uppercase">
                                                                    Reg. Type
                                                                </span>
                                                                <span className="block truncate font-semibold text-foreground">
                                                                    {businessForm.registration_type ||
                                                                        'Optional / Skipped'}
                                                                </span>
                                                            </div>
                                                            <div className="rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1.5">
                                                                <span className="block text-[9px] tracking-wider text-muted-foreground uppercase">
                                                                    Reg. Number
                                                                </span>
                                                                <span className="block truncate font-semibold text-foreground">
                                                                    {businessForm.registration_number ||
                                                                        '—'}
                                                                </span>
                                                            </div>
                                                            <div className="rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1.5">
                                                                <span className="block text-[9px] tracking-wider text-muted-foreground uppercase">
                                                                    Permit
                                                                    Number
                                                                </span>
                                                                <span className="block truncate font-semibold text-foreground">
                                                                    {businessForm.business_permit_number ||
                                                                        '—'}
                                                                </span>
                                                            </div>
                                                            <div className="rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1.5">
                                                                <span className="block text-[9px] tracking-wider text-muted-foreground uppercase">
                                                                    Date Issued
                                                                </span>
                                                                <span className="block truncate font-semibold text-foreground">
                                                                    {businessForm.registration_permit_date ||
                                                                        '—'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Attached Document Status */}
                                                        <div className="flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-muted/30 p-2.5">
                                                            <div className="flex min-w-0 items-center gap-2">
                                                                <FileCheck2
                                                                    className={cn(
                                                                        'h-4 w-4 shrink-0',
                                                                        registrationDocumentFile
                                                                            ? 'text-emerald-500'
                                                                            : 'text-muted-foreground',
                                                                    )}
                                                                />
                                                                <span className="truncate text-[11px] font-medium text-foreground">
                                                                    {registrationDocumentFile
                                                                        ? registrationDocumentFile.name
                                                                        : 'No permit document attached (Optional)'}
                                                                </span>
                                                            </div>
                                                            {registrationDocumentFile && (
                                                                <span className="shrink-0 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                                                                    Ready
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Card 4: Administrator & Legal Agreements */}
                                            <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
                                                <div>
                                                    <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                                                        <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                                            <ShieldCheck className="h-3.5 w-3.5 text-primary" />{' '}
                                                            Admin &
                                                            Authorizations
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setCurrentStep(
                                                                    1,
                                                                )
                                                            }
                                                            className="cursor-pointer text-[10px] font-semibold text-primary hover:underline"
                                                        >
                                                            Edit
                                                        </button>
                                                    </div>

                                                    <div className="mt-3 space-y-2">
                                                        <div className="rounded-xl border border-border/70 bg-muted/30 p-2.5">
                                                            <p className="text-xs font-semibold text-foreground">
                                                                {
                                                                    personalForm.first_name
                                                                }{' '}
                                                                {
                                                                    personalForm.middle_name
                                                                }{' '}
                                                                {
                                                                    personalForm.last_name
                                                                }{' '}
                                                                {
                                                                    personalForm.suffix
                                                                }
                                                            </p>
                                                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                                                <span>
                                                                    {
                                                                        personalForm.email
                                                                    }
                                                                </span>
                                                                <span className="py-0.2 rounded-full bg-emerald-500/10 px-1.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                                                                    Verified
                                                                </span>
                                                                {personalForm.mobile_number && (
                                                                    <span>
                                                                        ·{' '}
                                                                        {
                                                                            personalForm.mobile_number
                                                                        }
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Agreements status */}
                                                        <div className="space-y-1 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-[11px]">
                                                            <div className="flex items-center justify-between text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                                                <span>
                                                                    Platform
                                                                    Agreements
                                                                </span>
                                                                <span>
                                                                    4 of 4
                                                                    Acknowledged
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pt-1 text-[10px] text-muted-foreground">
                                                                <span className="flex items-center gap-1">
                                                                    <Check className="h-2.5 w-2.5 text-emerald-500" />{' '}
                                                                    Terms of
                                                                    Service
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Check className="h-2.5 w-2.5 text-emerald-500" />{' '}
                                                                    Privacy
                                                                    Notice
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Check className="h-2.5 w-2.5 text-emerald-500" />{' '}
                                                                    Content & IP
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Check className="h-2.5 w-2.5 text-emerald-500" />{' '}
                                                                    AI Usage
                                                                    Policy
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom Security / Pre-flight Assurance */}
                                        <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/25 px-4 py-3 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                                                <span className="text-[11px]">
                                                    Clicking{' '}
                                                    <strong className="font-semibold text-foreground">
                                                        Launch MarketPilot
                                                    </strong>{' '}
                                                    activates your workspace
                                                    database and opens your
                                                    dashboard immediately.
                                                </span>
                                            </div>
                                            <span className="hidden shrink-0 items-center gap-1 text-[10px] font-medium text-muted-foreground sm:inline-flex">
                                                256-bit SSL Protected
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Redesigned Sticky Bottom Action Footer - Compact & sleek (h-11) */}
                        <footer className="relative flex h-11 shrink-0 items-center border-t border-border/80 bg-card/85 px-4 backdrop-blur-md before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-border/60 before:to-transparent sm:px-6 lg:px-8 xl:px-10">
                            <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 xl:max-w-7xl">
                                <div className="flex items-center gap-2">
                                    {canGoBack && (
                                        <button
                                            type="button"
                                            onClick={goBack}
                                            className="inline-flex h-7 cursor-pointer items-center rounded-lg border border-border/80 bg-background/90 px-2.5 text-[11px] font-medium text-muted-foreground shadow-2xs transition-all hover:bg-accent hover:text-foreground active:scale-[0.98]"
                                        >
                                            <ArrowLeft className="mr-1 h-3 w-3" />{' '}
                                            Back
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleContinue}
                                        disabled={!canContinue}
                                        className={cn(
                                            'inline-flex h-7 cursor-pointer items-center rounded-lg px-3.5 text-[11px] font-semibold shadow-xs transition-all active:scale-[0.98]',
                                            currentStep === 4
                                                ? 'bg-gradient-to-r from-emerald-600 via-emerald-600 to-emerald-500 text-white shadow-sm shadow-emerald-500/25 hover:from-emerald-500 hover:to-emerald-400'
                                                : 'bg-gradient-to-r from-primary via-primary to-primary/85 text-primary-foreground hover:from-primary/95 hover:to-primary/80 hover:shadow-sm',
                                            'disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none',
                                        )}
                                    >
                                        {currentStep === 4 && (
                                            <Sparkles className="mr-1 h-3 w-3" />
                                        )}
                                        <span>{continueButtonLabel}</span>
                                        {currentStep !== 4 && (
                                            <ArrowRight className="ml-1 h-3 w-3" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </footer>
                    </main>
                </div>
            </div>

            {/* Radix Dialog for viewing Legal Documents - Wide & Spacious Redesign */}
            <Dialog
                open={!!activeLegalModal}
                onOpenChange={() => setActiveLegalModal(null)}
            >
                <DialogContent className="flex max-h-[90vh] w-[92vw] max-w-4xl flex-col rounded-3xl border border-border/80 bg-card p-6 shadow-2xl backdrop-blur-xl sm:max-w-3xl sm:p-8 md:max-w-4xl lg:max-w-5xl">
                    <DialogHeader className="space-y-1.5 border-b border-border/60 pb-3">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                Legal Agreement
                            </span>
                            <span className="font-mono text-[11px] text-muted-foreground">
                                Version {activeLegalDoc?.version ?? 'v1.0'}
                            </span>
                        </div>
                        <DialogTitle className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                            {activeLegalDoc?.title ?? 'Agreement Terms'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Please review all terms and conditions carefully
                            before proceeding with your MarketPilot workspace
                            activation.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[60vh] space-y-3.5 overflow-y-auto py-2 pr-3">
                        {activeLegalDoc?.sections?.map((sec, i) => (
                            <div
                                key={i}
                                className="rounded-2xl border border-border/70 bg-muted/30 p-4.5 shadow-2xs transition-colors hover:bg-muted/45 sm:p-5"
                            >
                                <div className="mb-2 flex items-center gap-2.5">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 font-mono text-[10px] font-bold text-primary">
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                    <h4 className="text-sm font-semibold text-foreground">
                                        {sec.heading}
                                    </h4>
                                </div>
                                <p className="text-xs leading-relaxed whitespace-pre-line text-muted-foreground sm:text-[13px]">
                                    {sec.content}
                                </p>
                            </div>
                        ))}
                    </div>

                    <DialogFooter className="border-t border-border/60 pt-3">
                        <p className="text-[11px] text-muted-foreground"></p>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
