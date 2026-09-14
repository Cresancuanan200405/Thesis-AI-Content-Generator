import { Head, router } from '@inertiajs/react';
import {
    Briefcase,
    Building2,
    FileText,
    Info,
    Loader2,
    RotateCcw,
    Save,
    Store,
    Tag,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { PhilippineAddressSelectors } from '@/components/philippine-address-selectors';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { industryCategories, industryOptions } from '@/lib/industry-taxonomy';

const MAX_DESCRIPTION_LENGTH = 3000;

interface BusinessProfileProps {
    profile?: {
        id?: number;
        name?: string;
        email?: string;
        email_verified?: boolean;
        member_since?: string;
    };
    business?: {
        id?: number;
        name?: string;
        industry?: string;
        category?: string;
        description?: string;
        main_business_activity?: string;
        business_address?: string;
        barangay?: string;
        city_municipality?: string;
        province?: string;
        region?: string;
        business_contact_number?: string;
        business_email?: string;
        website_social_page?: string;
        registration_type?: string;
        registration_number?: string;
        business_permit_number?: string;
        registration_permit_date?: string;
        business_registration_document_path?: string;
        created_at?: string;
    };
}

export default function BusinessProfilePage({
    profile: _profile = {},
    business = {},
}: BusinessProfileProps) {
    const initialValues = useMemo(
        () => ({
            name:
                business.name && business.name !== 'Not specified'
                    ? business.name
                    : '',
            industry:
                business.industry && business.industry !== 'General'
                    ? business.industry
                    : 'Food & Beverage',
            category:
                business.category && business.category !== 'General'
                    ? business.category
                    : 'Restaurant',
            description: business.description || '',
            main_business_activity: business.main_business_activity || '',
            business_address: business.business_address || '',
            barangay: business.barangay || '',
            city_municipality: business.city_municipality || '',
            province: business.province || '',
            region: business.region || '',
            business_contact_number: business.business_contact_number || '',
            business_email: business.business_email || '',
            website_social_page: business.website_social_page || '',
            registration_type: business.registration_type || '',
            registration_number: business.registration_number || '',
            business_permit_number: business.business_permit_number || '',
            registration_permit_date: business.registration_permit_date || '',
        }),
        [business],
    );

    const [formData, setFormData] = useState(initialValues);
    const [selectedDocument, setSelectedDocument] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const hasUnsavedChanges = useMemo(() => {
        return (
            formData.name !== initialValues.name ||
            formData.industry !== initialValues.industry ||
            formData.category !== initialValues.category ||
            formData.description !== initialValues.description ||
            formData.main_business_activity !==
                initialValues.main_business_activity ||
            formData.business_address !== initialValues.business_address ||
            formData.barangay !== initialValues.barangay ||
            formData.city_municipality !== initialValues.city_municipality ||
            formData.province !== initialValues.province ||
            formData.region !== initialValues.region ||
            formData.business_contact_number !==
                initialValues.business_contact_number ||
            formData.business_email !== initialValues.business_email ||
            formData.website_social_page !==
                initialValues.website_social_page ||
            formData.registration_type !== initialValues.registration_type ||
            formData.registration_number !==
                initialValues.registration_number ||
            formData.business_permit_number !==
                initialValues.business_permit_number ||
            formData.registration_permit_date !==
                initialValues.registration_permit_date
        );
    }, [formData, initialValues]);

    const availableCategories = useMemo(() => {
        if (!formData.industry) {
            return [];
        }

        return industryCategories[formData.industry] ?? [];
    }, [formData.industry]);

    const handleIndustryChange = (selectedIndustry: string) => {
        const defaultCategory = industryCategories[selectedIndustry]?.[0] || '';
        setFormData((prev) => ({
            ...prev,
            industry: selectedIndustry,
            category: defaultCategory,
        }));
    };

    const handleFieldChange = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        if (formErrors[field]) {
            setFormErrors((prev) => {
                const next = { ...prev };
                delete next[field];

                return next;
            });
        }
    };

    const handleReset = () => {
        setFormData(initialValues);
        setFormErrors({});
        toast.info('Form reset to saved values.');
    };

    const handleDocumentUpload = () => {
        if (!selectedDocument) {
            toast.error('Please choose a PDF, JPG, PNG, or WebP file first.');

            return;
        }

        router.post(
            '/profile/business/document',
            {
                business_registration_document: selectedDocument,
            },
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedDocument(null);
                    toast.success(
                        'Business registration document uploaded successfully.',
                    );
                },
                onError: (errors: Record<string, string>) => {
                    const message =
                        Object.values(errors)[0] ||
                        'Unable to upload the business registration document.';
                    toast.error(message);
                },
            },
        );
    };

    const handleDocumentDelete = () => {
        router.delete('/profile/business/document', {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    'Business registration document removed successfully.',
                );
            },
            onError: () => {
                toast.error(
                    'Unable to remove the business registration document.',
                );
            },
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setFormErrors({ name: 'Business name is required.' });
            toast.error('Please enter your business name.');

            return;
        }

        setIsSubmitting(true);
        setFormErrors({});

        router.post(
            '/profile/business',
            {
                name: formData.name.trim(),
                industry: formData.industry,
                category: formData.category,
                description: formData.description.trim(),
                main_business_activity: formData.main_business_activity.trim(),
                business_address: formData.business_address.trim(),
                barangay: formData.barangay.trim(),
                city_municipality: formData.city_municipality.trim(),
                province: formData.province.trim(),
                region: formData.region.trim(),
                business_contact_number:
                    formData.business_contact_number.trim(),
                business_email: formData.business_email.trim(),
                website_social_page: formData.website_social_page.trim(),
                registration_type: formData.registration_type.trim(),
                registration_number: formData.registration_number.trim(),
                business_permit_number: formData.business_permit_number.trim(),
                registration_permit_date: formData.registration_permit_date,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    toast.success('Business profile updated successfully.');
                },
                onError: (errors: Record<string, string>) => {
                    setIsSubmitting(false);
                    setFormErrors(errors);
                    toast.error(
                        'Please resolve the highlighted issues and try again.',
                    );
                },
            },
        );
    };

    return (
        <>
            <Head title="Business Profile" />

            <div className="min-h-screen bg-background pb-24 text-foreground">
                <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
                    {/* Top Navigation Bar */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                    Business Profile
                                </h1>
                                {hasUnsavedChanges ? (
                                    <Badge
                                        variant="outline"
                                        className="animate-pulse border-amber-500/30 bg-amber-500/10 text-[11px] font-semibold text-amber-600 dark:text-amber-400"
                                    >
                                        Unsaved Changes
                                    </Badge>
                                ) : (
                                    <Badge
                                        variant="outline"
                                        className="border-emerald-500/30 bg-emerald-500/10 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400"
                                    >
                                        Synchronized
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground sm:text-sm">
                                Persistent commercial context used by the AI
                                engine to calibrate authentic visual generation.
                            </p>
                        </div>
                    </div>

                    {/* Main Form Content - 2-Column Responsive Layout */}
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-8 lg:grid-cols-12">
                            {/* Left Column (8 cols): Primary Business Information Inputs */}
                            <div className="space-y-6 lg:col-span-8">
                                {/* Card 1: Core Business Identity */}
                                <Card className="overflow-hidden rounded-3xl border-border/80 bg-card p-6 shadow-xs md:p-7">
                                    <div className="flex items-center gap-3 border-b border-border/60 pb-5">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                            <Building2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-foreground">
                                                Business Identity
                                            </h2>
                                            <p className="text-xs text-muted-foreground">
                                                The official registered name and
                                                commercial vertical of your
                                                brand.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6 space-y-6">
                                        {/* Business Name Field */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="business-name"
                                                    className="flex items-center gap-1.5 text-xs font-bold text-foreground"
                                                >
                                                    <Store className="h-3.5 w-3.5 text-primary" />
                                                    Business Name
                                                    <span className="text-rose-500">
                                                        *
                                                    </span>
                                                </Label>
                                                <span className="text-[11px] font-medium text-muted-foreground">
                                                    Required
                                                </span>
                                            </div>
                                            <Input
                                                id="business-name"
                                                value={formData.name}
                                                onChange={(e) =>
                                                    handleFieldChange(
                                                        'name',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="e.g. Apit Burger, Cafe Dolce, Artisan Studio"
                                                className={`h-11 rounded-xl text-sm font-medium transition-colors ${
                                                    formErrors.name
                                                        ? 'border-destructive focus-visible:ring-destructive'
                                                        : 'border-border/80 focus-visible:border-primary'
                                                }`}
                                            />
                                            {formErrors.name && (
                                                <p className="text-xs font-semibold text-destructive">
                                                    {formErrors.name}
                                                </p>
                                            )}
                                        </div>

                                        {/* Industry & Category Dual Selectors */}
                                        <div className="grid gap-5 sm:grid-cols-2">
                                            {/* Industry */}
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                                    <Briefcase className="h-3.5 w-3.5 text-primary" />
                                                    Industry Sector
                                                </Label>
                                                <Select
                                                    value={formData.industry}
                                                    onValueChange={
                                                        handleIndustryChange
                                                    }
                                                >
                                                    <SelectTrigger className="h-11 rounded-xl border-border/80 text-sm font-medium">
                                                        <SelectValue placeholder="Select Industry" />
                                                    </SelectTrigger>
                                                    <SelectContent className="max-h-64 rounded-xl">
                                                        {industryOptions.map(
                                                            (ind) => (
                                                                <SelectItem
                                                                    key={ind}
                                                                    value={ind}
                                                                    className="cursor-pointer"
                                                                >
                                                                    {ind}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-[11px] text-muted-foreground">
                                                    Determines visual art
                                                    direction and environmental
                                                    materials.
                                                </p>
                                            </div>

                                            {/* Niche Category */}
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                                    <Tag className="h-3.5 w-3.5 text-primary" />
                                                    Niche Category
                                                </Label>
                                                <Select
                                                    value={formData.category}
                                                    onValueChange={(val) =>
                                                        handleFieldChange(
                                                            'category',
                                                            val,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="h-11 rounded-xl border-border/80 text-sm font-medium">
                                                        <SelectValue placeholder="Select Category" />
                                                    </SelectTrigger>
                                                    <SelectContent className="max-h-64 rounded-xl">
                                                        {availableCategories.map(
                                                            (cat) => (
                                                                <SelectItem
                                                                    key={cat}
                                                                    value={cat}
                                                                    className="cursor-pointer"
                                                                >
                                                                    {cat}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-[11px] text-muted-foreground">
                                                    Calibrates specific
                                                    supporting props and
                                                    commercial lighting.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="overflow-hidden rounded-3xl border-border/80 bg-card p-6 shadow-xs md:p-7">
                                    <div className="flex items-center gap-3 border-b border-border/60 pb-5">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                            <Briefcase className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-foreground">
                                                Registration & Business Details
                                            </h2>
                                            <p className="text-xs text-muted-foreground">
                                                Optional commercial information
                                                used for verification and
                                                contact details.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6 grid gap-5 md:grid-cols-2">
                                        <div className="space-y-2 md:col-span-2">
                                            <Label
                                                htmlFor="main-business-activity"
                                                className="text-xs font-bold text-foreground"
                                            >
                                                Main Business Activity
                                            </Label>
                                            <Input
                                                id="main-business-activity"
                                                value={
                                                    formData.main_business_activity
                                                }
                                                onChange={(e) =>
                                                    handleFieldChange(
                                                        'main_business_activity',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Coffee shop and food service"
                                                className="h-11 rounded-xl text-sm"
                                            />
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <Label
                                                htmlFor="business-address"
                                                className="text-xs font-bold text-foreground"
                                            >
                                                Street Address
                                            </Label>
                                            <Input
                                                id="business-address"
                                                value={
                                                    formData.business_address
                                                }
                                                onChange={(e) =>
                                                    handleFieldChange(
                                                        'business_address',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="123 Example Street"
                                                className="h-11 rounded-xl text-sm"
                                            />
                                        </div>

                                        <PhilippineAddressSelectors
                                            region={formData.region}
                                            province={formData.province}
                                            cityMunicipality={
                                                formData.city_municipality
                                            }
                                            barangay={formData.barangay}
                                            onChange={(field, value) =>
                                                handleFieldChange(field, value)
                                            }
                                        />

                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="business-contact-number"
                                                className="text-xs font-bold text-foreground"
                                            >
                                                Business Contact Number
                                            </Label>
                                            <Input
                                                id="business-contact-number"
                                                value={
                                                    formData.business_contact_number
                                                }
                                                onChange={(e) =>
                                                    handleFieldChange(
                                                        'business_contact_number',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="+63 917 123 4567"
                                                className="h-11 rounded-xl text-sm"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="business-email"
                                                className="text-xs font-bold text-foreground"
                                            >
                                                Business Email
                                            </Label>
                                            <Input
                                                id="business-email"
                                                type="email"
                                                value={formData.business_email}
                                                onChange={(e) =>
                                                    handleFieldChange(
                                                        'business_email',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="hello@business.com"
                                                className="h-11 rounded-xl text-sm"
                                            />
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <Label
                                                htmlFor="website-social-page"
                                                className="text-xs font-bold text-foreground"
                                            >
                                                Website / Social Page
                                            </Label>
                                            <Input
                                                id="website-social-page"
                                                value={
                                                    formData.website_social_page
                                                }
                                                onChange={(e) =>
                                                    handleFieldChange(
                                                        'website_social_page',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="https://example.com"
                                                className="h-11 rounded-xl text-sm"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="registration-type"
                                                className="text-xs font-bold text-foreground"
                                            >
                                                Registration Type
                                            </Label>
                                            <Input
                                                id="registration-type"
                                                value={
                                                    formData.registration_type
                                                }
                                                onChange={(e) =>
                                                    handleFieldChange(
                                                        'registration_type',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="DTI / SEC / Mayor's Permit"
                                                className="h-11 rounded-xl text-sm"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="registration-number"
                                                className="text-xs font-bold text-foreground"
                                            >
                                                Registration Number
                                            </Label>
                                            <Input
                                                id="registration-number"
                                                value={
                                                    formData.registration_number
                                                }
                                                onChange={(e) =>
                                                    handleFieldChange(
                                                        'registration_number',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="REG-2024-001"
                                                className="h-11 rounded-xl text-sm"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="business-permit-number"
                                                className="text-xs font-bold text-foreground"
                                            >
                                                Business Permit Number
                                            </Label>
                                            <Input
                                                id="business-permit-number"
                                                value={
                                                    formData.business_permit_number
                                                }
                                                onChange={(e) =>
                                                    handleFieldChange(
                                                        'business_permit_number',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="BP-2024-987"
                                                className="h-11 rounded-xl text-sm"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="registration-permit-date"
                                                className="text-xs font-bold text-foreground"
                                            >
                                                Registration / Permit Date
                                            </Label>
                                            <Input
                                                id="registration-permit-date"
                                                type="date"
                                                value={
                                                    formData.registration_permit_date
                                                }
                                                onChange={(e) =>
                                                    handleFieldChange(
                                                        'registration_permit_date',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-11 rounded-xl text-sm"
                                            />
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <Label className="text-xs font-bold text-foreground">
                                                Registration / Permit Document
                                            </Label>
                                            {business.business_registration_document_path ? (
                                                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/80 bg-muted/20 p-3">
                                                    <a
                                                        href="/profile/business/document"
                                                        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        View current document
                                                    </a>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            const input =
                                                                document.getElementById(
                                                                    'business-registration-document-input',
                                                                ) as HTMLInputElement | null;
                                                            input?.click();
                                                        }}
                                                    >
                                                        Replace
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={
                                                            handleDocumentDelete
                                                        }
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-border/80 bg-muted/20 p-3 md:flex-row md:items-center">
                                                    <Input
                                                        id="business-registration-document-input"
                                                        type="file"
                                                        accept=".pdf,.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp,application/pdf"
                                                        onChange={(event) => {
                                                            const file =
                                                                event.target
                                                                    .files?.[0] ??
                                                                null;
                                                            setSelectedDocument(
                                                                file,
                                                            );
                                                        }}
                                                        className="h-11 w-full rounded-xl text-sm md:max-w-xs"
                                                    />
                                                    <Button
                                                        type="button"
                                                        onClick={
                                                            handleDocumentUpload
                                                        }
                                                        className="h-11"
                                                    >
                                                        Upload document
                                                    </Button>
                                                </div>
                                            )}
                                            {selectedDocument &&
                                            !business.business_registration_document_path ? (
                                                <p className="text-xs text-muted-foreground">
                                                    Selected file:{' '}
                                                    {selectedDocument.name}
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                </Card>

                                {/* Card 2: Business Description & Craft Details */}
                                <Card className="overflow-hidden rounded-3xl border-border/80 bg-card p-6 shadow-xs md:p-7">
                                    <div className="flex items-center justify-between border-b border-border/60 pb-5">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h2 className="text-base font-bold text-foreground">
                                                    Business Description
                                                </h2>
                                                <p className="text-xs text-muted-foreground">
                                                    Detailed context informing
                                                    the AI about your products,
                                                    culinary style, or craft.
                                                </p>
                                            </div>
                                        </div>

                                        <span
                                            className={`font-mono text-xs ${
                                                formData.description.length >
                                                MAX_DESCRIPTION_LENGTH - 100
                                                    ? 'font-bold text-rose-500'
                                                    : 'text-muted-foreground'
                                            }`}
                                        >
                                            {formData.description.length} /{' '}
                                            {MAX_DESCRIPTION_LENGTH}
                                        </span>
                                    </div>

                                    <div className="mt-6 space-y-4">
                                        <Textarea
                                            id="business-description"
                                            rows={5}
                                            maxLength={MAX_DESCRIPTION_LENGTH}
                                            value={formData.description}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    'description',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="e.g. An approachable local burger shop specializing in flame-grilled burgers, crispy fries, craft milkshakes, and refreshing comfort food."
                                            className={`resize-y rounded-2xl text-sm leading-relaxed ${
                                                formErrors.description
                                                    ? 'border-destructive focus-visible:ring-destructive'
                                                    : 'border-border/80 focus-visible:border-primary'
                                            }`}
                                        />

                                        {formErrors.description && (
                                            <p className="text-xs font-semibold text-destructive">
                                                {formErrors.description}
                                            </p>
                                        )}

                                        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground">
                                            <div className="flex items-start gap-2.5">
                                                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                                <p className="leading-relaxed">
                                                    Describe what your business
                                                    offers. This information
                                                    helps the AI create more
                                                    relevant environments,
                                                    styling, props, and
                                                    commercial visuals when
                                                    generating images. It is
                                                    used strictly as background
                                                    context and will not be
                                                    printed as text in the
                                                    image.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                {/* Action Buttons Footer */}
                                <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-card/60 p-4 shadow-xs">
                                    <div className="flex items-center gap-2">
                                        {hasUnsavedChanges && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleReset}
                                                disabled={isSubmitting}
                                                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                                            >
                                                <RotateCcw className="h-3.5 w-3.5" />
                                                Reset
                                            </Button>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={
                                            isSubmitting || !hasUnsavedChanges
                                        }
                                        className="min-w-36 gap-2 rounded-xl px-6 text-xs font-bold shadow-xs"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Right Column (4 cols): Context Overview & Guidance */}
                            <div className="space-y-6 lg:col-span-4">
                                {/* Card 3: Live Context Summary */}
                                <Card className="overflow-hidden rounded-3xl border-border/80 bg-card p-6 shadow-xs">
                                    <div className="flex items-center gap-2.5 border-b border-border/60 pb-4">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                            <Store className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-foreground">
                                                Live Context Summary
                                            </h3>
                                            <p className="text-[11px] text-muted-foreground">
                                                Active values supplied to AI
                                                Studio
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-5 space-y-4">
                                        <div className="space-y-1">
                                            <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                                                Business Name
                                            </p>
                                            <p className="text-sm font-bold text-foreground">
                                                {formData.name.trim() || (
                                                    <span className="text-muted-foreground italic">
                                                        Not specified
                                                    </span>
                                                )}
                                            </p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                                                Industry & Classification
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                <Badge
                                                    variant="outline"
                                                    className="border-primary/30 bg-primary/10 text-xs font-semibold text-primary"
                                                >
                                                    {formData.industry}
                                                </Badge>
                                                {formData.category && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-xs font-medium"
                                                    >
                                                        {formData.category}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                                                Description Status
                                            </p>
                                            <p className="line-clamp-3 text-xs text-muted-foreground">
                                                {formData.description.trim() || (
                                                    <span className="italic">
                                                        No description added
                                                        yet.
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

BusinessProfilePage.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Business Profile',
            href: '/profile/business',
        },
    ],
};
