import { Head, router } from '@inertiajs/react';
import {
    Building2,
    Calendar,
    Download,
    FileCheck,
    FileText,
    Hash,
    Info,
    Loader2,
    Lock,
    MapPin,
    RotateCcw,
    Save,
    Shield,
    Tag,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { PhilippineAddressSelectors } from '@/components/philippine-address-selectors';
import ProtectedField from '@/components/protected-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { BreadcrumbItem } from '@/types';

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
        business_address?: string;
        barangay?: string;
        city_municipality?: string;
        province?: string;
        region?: string;
        registration_type?: string;
        registration_number?: string;
        business_permit_number?: string;
        registration_permit_date?: string;
        business_registration_document_path?: string;
        created_at?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'My Profile',
        href: '/profile',
    },
    {
        title: 'Business Profile',
        href: '/profile/business',
    },
];

export default function BusinessProfilePage({
    business = {},
}: BusinessProfileProps) {
    const initialValues = useMemo(
        () => ({
            name:
                business.name && business.name !== 'Not specified'
                    ? business.name
                    : '',
            description: business.description || '',
            business_address: business.business_address || '',
            barangay: business.barangay || '',
            city_municipality: business.city_municipality || '',
            province: business.province || '',
            region: business.region || '',
            // Protected values preserved for request validation
            industry: business.industry || 'General',
            category: business.category || 'General',
        }),
        [business],
    );

    const [formData, setFormData] = useState(initialValues);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const hasUnsavedChanges = useMemo(() => {
        return (
            formData.name !== initialValues.name ||
            formData.description !== initialValues.description ||
            formData.business_address !== initialValues.business_address ||
            formData.barangay !== initialValues.barangay ||
            formData.city_municipality !== initialValues.city_municipality ||
            formData.province !== initialValues.province ||
            formData.region !== initialValues.region
        );
    }, [formData, initialValues]);

    const handleSaveBusiness = (e: React.FormEvent) => {
        e.preventDefault();
        setFormErrors({});

        if (!formData.name.trim()) {
            setFormErrors({ name: 'Business name is required.' });
            toast.error('Please provide your business name.');

            return;
        }

        setIsSubmitting(true);

        router.patch('/profile/business', formData, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSubmitting(false);
                toast.success('Business profile updated successfully.');
            },
            onError: (errors) => {
                setIsSubmitting(false);
                setFormErrors(errors);
                toast.error(
                    'Failed to update business profile. Please check the form.',
                );
            },
        });
    };

    const handleReset = () => {
        setFormData(initialValues);
        setFormErrors({});
        toast.info('Changes reverted to saved values.');
    };

    return (
        <>
            <Head title="Business Profile" />

            <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-8">
                {/* 1. Page Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                Business Profile
                            </h1>
                            <Badge
                                variant="outline"
                                className="border-primary/30 bg-primary/10 text-xs font-semibold text-primary"
                            >
                                Commercial Identity
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Manage the persistent information MarketPilot uses
                            to understand and stage your brand.
                        </p>
                    </div>

                    {hasUnsavedChanges && (
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleReset}
                                disabled={isSubmitting}
                                className="h-9 gap-1.5 rounded-xl text-xs font-medium"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span>Revert</span>
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleSaveBusiness}
                                disabled={isSubmitting}
                                className="h-9 gap-1.5 rounded-xl bg-foreground text-xs font-semibold text-background hover:bg-foreground/90"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Save className="h-3.5 w-3.5" />
                                )}
                                <span>Save Changes</span>
                            </Button>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSaveBusiness} className="space-y-8">
                    {/* SECTION 1: Business Information (Editable) */}
                    <Card className="rounded-3xl border-border/80 bg-card shadow-xs">
                        <CardHeader className="border-b border-border/60 p-6 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <Building2 className="h-4 w-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-bold text-foreground">
                                        Business Information
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground">
                                        Core identity used in marketing
                                        campaigns and creative prompts
                                    </p>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-5 p-6">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="business_name"
                                    className="text-xs font-bold text-foreground"
                                >
                                    Business Name{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="business_name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g., Kape Juan Butuan"
                                    className="h-11 rounded-xl text-sm"
                                    required
                                />
                                {formErrors.name && (
                                    <p className="text-xs font-medium text-destructive">
                                        {formErrors.name}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label
                                        htmlFor="business_description"
                                        className="text-xs font-bold text-foreground"
                                    >
                                        Business Description
                                    </Label>
                                    <span className="text-[11px] text-muted-foreground">
                                        {formData.description.length} /{' '}
                                        {MAX_DESCRIPTION_LENGTH} characters
                                    </span>
                                </div>
                                <Textarea
                                    id="business_description"
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            description: e.target.value.slice(
                                                0,
                                                MAX_DESCRIPTION_LENGTH,
                                            ),
                                        }))
                                    }
                                    placeholder="Describe your specialty products, customer vibe, unique value proposition, and brand personality..."
                                    rows={4}
                                    className="resize-none rounded-xl text-sm leading-relaxed"
                                />
                                <p className="text-[11px] text-muted-foreground">
                                    The AI uses this description to calibrate
                                    visual ambiance, scene elements, and brand
                                    tone.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* SECTION 2: Business Location (Editable) */}
                    <Card className="rounded-3xl border-border/80 bg-card shadow-xs">
                        <CardHeader className="border-b border-border/60 p-6 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    <MapPin className="h-4 w-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-bold text-foreground">
                                        Business Location
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground">
                                        Philippine geographic context for local
                                        marketing relevance
                                    </p>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-5 p-6">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="business_address"
                                    className="text-xs font-bold text-foreground"
                                >
                                    Street Address / Building / Unit
                                </Label>
                                <Input
                                    id="business_address"
                                    value={formData.business_address}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            business_address: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g., Unit 4B, J.C. Aquino Avenue"
                                    className="h-11 rounded-xl text-sm"
                                />
                            </div>

                            <PhilippineAddressSelectors
                                region={formData.region}
                                province={formData.province}
                                cityMunicipality={formData.city_municipality}
                                barangay={formData.barangay}
                                onChange={(field, value) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        [field]: value,
                                    }))
                                }
                            />
                        </CardContent>
                    </Card>

                    {/* SECTION 3: Industry & Category (Protected / Read-Only) */}
                    <Card className="rounded-3xl border-border/80 bg-card shadow-xs">
                        <CardHeader className="border-b border-border/60 p-6 pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                        <Tag className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold text-foreground">
                                            Industry & Category
                                        </CardTitle>
                                        <p className="text-xs text-muted-foreground">
                                            Art-direction taxonomy assigned
                                            during onboarding
                                        </p>
                                    </div>
                                </div>
                                <Badge
                                    variant="outline"
                                    className="flex items-center gap-1 border-border/70 bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                                >
                                    <Lock className="h-2.5 w-2.5" />
                                    <span>Protected</span>
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4 p-6">
                            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                                <div className="flex items-start gap-2.5">
                                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                    <p className="text-xs leading-relaxed text-muted-foreground">
                                        Industry and Category define your visual
                                        art direction, prompt styling profiles,
                                        and commercial design templates. These
                                        details are locked after onboarding
                                        activation.
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <ProtectedField
                                    label="Industry"
                                    value={business.industry || 'General'}
                                    icon={Tag}
                                />
                                <ProtectedField
                                    label="Category"
                                    value={business.category || 'General'}
                                    icon={Tag}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* SECTION 4: Registration & Compliance (Protected / Read-Only) */}
                    <Card className="rounded-3xl border-border/80 bg-card shadow-xs">
                        <CardHeader className="border-b border-border/60 p-6 pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                        <Shield className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold text-foreground">
                                            Registration & Compliance
                                        </CardTitle>
                                        <p className="text-xs text-muted-foreground">
                                            Official business registration
                                            records
                                        </p>
                                    </div>
                                </div>
                                <Badge
                                    variant="outline"
                                    className="flex items-center gap-1 border-border/70 bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                                >
                                    <Lock className="h-2.5 w-2.5" />
                                    <span>Compliance Protected</span>
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-5 p-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <ProtectedField
                                    label="Registration Type"
                                    value={
                                        business.registration_type
                                            ? business.registration_type.toUpperCase()
                                            : 'None Specified'
                                    }
                                    icon={FileText}
                                />
                                <ProtectedField
                                    label="Registration Number"
                                    value={
                                        business.registration_number ||
                                        'None Specified'
                                    }
                                    icon={Hash}
                                />
                                <ProtectedField
                                    label="Business Permit Number"
                                    value={
                                        business.business_permit_number ||
                                        'None Specified'
                                    }
                                    icon={Hash}
                                />
                                <ProtectedField
                                    label="Registration / Permit Date"
                                    value={
                                        business.registration_permit_date ||
                                        'None Specified'
                                    }
                                    icon={Calendar}
                                />
                            </div>

                            {/* Registration Document Privacy & Management Area (Protected) */}
                            <div className="space-y-2 pt-2">
                                <div className="flex items-center justify-between gap-2">
                                    <Label className="text-xs font-semibold text-muted-foreground">
                                        Business Registration Document
                                    </Label>
                                    <Badge
                                        variant="outline"
                                        className="flex items-center gap-1 border-border/70 bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                                    >
                                        <Lock className="h-2.5 w-2.5 shrink-0" />
                                        <span>Protected after onboarding</span>
                                    </Badge>
                                </div>

                                {business.business_registration_document_path ? (
                                    <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                <FileCheck className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-bold text-foreground">
                                                    Official Registration
                                                    Document
                                                </p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    Protected verification
                                                    record. Stored securely in
                                                    private tenant storage.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                asChild
                                                className="h-8 gap-1.5 rounded-lg text-xs font-medium"
                                            >
                                                <a
                                                    href="/profile/business/document"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Download className="h-3.5 w-3.5" />
                                                    <span>
                                                        Download Document
                                                    </span>
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex min-h-10 items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-3.5 py-2.5 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                            <span>
                                                No registration document was
                                                uploaded during onboarding.
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bottom Save Action Bar */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        {hasUnsavedChanges && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleReset}
                                disabled={isSubmitting}
                                className="h-10 rounded-xl px-5 text-xs font-medium sm:text-sm"
                            >
                                Cancel
                            </Button>
                        )}
                        <Button
                            type="submit"
                            disabled={isSubmitting || !hasUnsavedChanges}
                            className="h-10 gap-2 rounded-xl bg-foreground px-6 text-xs font-semibold text-background hover:bg-foreground/90 sm:text-sm"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            <span>Save Business Profile</span>
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

BusinessProfilePage.layout = {
    breadcrumbs,
};
