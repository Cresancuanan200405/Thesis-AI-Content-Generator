import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowUpRight,
    Briefcase,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    FileText,
    Info,
    Layers,
    Loader2,
    Mail,
    RotateCcw,
    Save,
    Settings,
    Shield,
    Sparkles,
    Store,
    Tag,
    User as UserIcon,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { HelpTooltip } from '@/components/help-tooltip';
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

/*
|--------------------------------------------------------------------------
| Industry & Category Taxonomy (Synchronized with Art Direction Engine)
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
const MAX_DESCRIPTION_LENGTH = 3000;

interface ProfileProps {
    profile?: {
        id?: number;
        name?: string;
        email?: string;
        email_verified?: boolean;
        email_verified_at?: string;
        provider?: string;
        role?: string;
        account_status?: string;
        created_at?: string;
        member_since?: string;
        two_factor_enabled?: boolean;
    };
    business?: {
        id?: number;
        name?: string;
        industry?: string;
        category?: string;
        description?: string;
        created_at?: string;
    };
}

export default function ProfileShowPage({
    profile = {},
    business = {},
}: ProfileProps) {
    const initialValues = useMemo(() => ({
        name: business.name && business.name !== 'Not specified' ? business.name : '',
        industry: business.industry && business.industry !== 'General' ? business.industry : 'Food & Beverage',
        category: business.category && business.category !== 'General' ? business.category : 'Restaurant',
        description: business.description || '',
    }), [business]);

    const [formData, setFormData] = useState(initialValues);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const hasUnsavedChanges = useMemo(() => {
        return (
            formData.name !== initialValues.name ||
            formData.industry !== initialValues.industry ||
            formData.category !== initialValues.category ||
            formData.description !== initialValues.description
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
                    toast.error('Please resolve the highlighted issues and try again.');
                },
            },
        );
    };

    const initials = profile.name
        ? profile.name
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
        : 'U';

    return (
        <>
            <Head title="Business Profile" />

            <div className="min-h-screen bg-background pb-24 text-foreground">
                <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
                    {/* Top Navigation & Breadcrumbs Bar */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3.5">
                            <Button
                                asChild
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 rounded-2xl border-border bg-card shadow-xs transition-colors hover:bg-muted"
                            >
                                <Link href="/generator">
                                    <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                                </Link>
                            </Button>
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
                                    Configure your business identity and offerings to guide authentic commercial visual generation.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <Button
                                asChild
                                variant="outline"
                                className="h-10 gap-2 rounded-xl border-border bg-card text-xs font-semibold text-muted-foreground shadow-xs hover:bg-muted hover:text-foreground"
                            >
                                <Link href="/settings/profile">
                                    <Settings className="h-3.5 w-3.5" />
                                    Account Settings
                                </Link>
                            </Button>
                            <Button
                                asChild
                                className="h-10 gap-2 rounded-xl text-xs font-semibold shadow-xs"
                            >
                                <Link href="/generator">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Open Studio
                                </Link>
                            </Button>
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
                                                The official registered name and commercial vertical of your business.
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
                                                    <span className="text-rose-500">*</span>
                                                </Label>
                                                <span className="text-[11px] font-medium text-muted-foreground">
                                                    Required
                                                </span>
                                            </div>
                                            <Input
                                                id="business-name"
                                                value={formData.name}
                                                onChange={(e) => handleFieldChange('name', e.target.value)}
                                                placeholder="e.g. Apit Burger, Cafe Dolce, Artisan Studio"
                                                className={`h-11 rounded-xl text-sm font-medium transition-colors ${
                                                    formErrors.name
                                                        ? 'border-destructive focus-visible:ring-destructive'
                                                        : 'border-border/80 focus-visible:border-primary'
                                                }`}
                                            />
                                            {formErrors.name && (
                                                <p className="text-xs font-semibold text-destructive">{formErrors.name}</p>
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
                                                    onValueChange={handleIndustryChange}
                                                >
                                                    <SelectTrigger className="h-11 rounded-xl border-border/80 text-sm font-medium">
                                                        <SelectValue placeholder="Select Industry" />
                                                    </SelectTrigger>
                                                    <SelectContent className="max-h-64 rounded-xl">
                                                        {industryOptions.map((ind) => (
                                                            <SelectItem key={ind} value={ind} className="cursor-pointer">
                                                                {ind}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-[11px] text-muted-foreground">
                                                    Determines visual art direction and environmental materials.
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
                                                    onValueChange={(val) => handleFieldChange('category', val)}
                                                >
                                                    <SelectTrigger className="h-11 rounded-xl border-border/80 text-sm font-medium">
                                                        <SelectValue placeholder="Select Category" />
                                                    </SelectTrigger>
                                                    <SelectContent className="max-h-64 rounded-xl">
                                                        {availableCategories.map((cat) => (
                                                            <SelectItem key={cat} value={cat} className="cursor-pointer">
                                                                {cat}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-[11px] text-muted-foreground">
                                                    Calibrates specific supporting props and commercial lighting.
                                                </p>
                                            </div>
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
                                                    Detailed context informing the AI about your products, culinary style, or craft.
                                                </p>
                                            </div>
                                        </div>

                                        <span
                                            className={`font-mono text-xs ${
                                                formData.description.length > MAX_DESCRIPTION_LENGTH - 100
                                                    ? 'font-bold text-rose-500'
                                                    : 'text-muted-foreground'
                                            }`}
                                        >
                                            {formData.description.length} / {MAX_DESCRIPTION_LENGTH}
                                        </span>
                                    </div>

                                    <div className="mt-6 space-y-4">
                                        <Textarea
                                            id="business-description"
                                            rows={5}
                                            maxLength={MAX_DESCRIPTION_LENGTH}
                                            value={formData.description}
                                            onChange={(e) => handleFieldChange('description', e.target.value)}
                                            placeholder="e.g. A casual dining burger joint serving flame-grilled artisanal beef burgers, seasoned curly fries, craft milkshakes, and comfort food made with fresh local ingredients."
                                            className={`resize-y rounded-2xl text-sm leading-relaxed ${
                                                formErrors.description
                                                    ? 'border-destructive focus-visible:ring-destructive'
                                                    : 'border-border/80 focus-visible:border-primary'
                                            }`}
                                        />

                                        {formErrors.description && (
                                            <p className="text-xs font-semibold text-destructive">{formErrors.description}</p>
                                        )}

                                        {/* Helper guidance card */}
                                        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground">
                                            <div className="flex items-start gap-2.5">
                                                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                                <p className="leading-relaxed">
                                                    Describe what your business offers. This information helps the AI create
                                                    more relevant environments, styling, props, and commercial visuals when generating
                                                    images. It is used strictly as background context and will not be printed as text in the image.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                {/* Action Buttons Footer (Desktop & Tablet) */}
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
                                        disabled={isSubmitting || !hasUnsavedChanges}
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

                            {/* Right Column (4 cols): Context Overview & Account Summary */}
                            <div className="space-y-6 lg:col-span-4">
                                {/* Card 3: Business Information Preview & Status */}
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
                                                Active values supplied to AI Studio
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
                                                    <span className="text-muted-foreground italic">Not specified</span>
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
                                                    <span className="italic">No description added yet.</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </Card>

                                {/* Card 4: Account Security & Credentials */}
                                <Card className="overflow-hidden rounded-3xl border-border/80 bg-card p-6 shadow-xs">
                                    <div className="flex items-center gap-2.5 border-b border-border/60 pb-4">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-foreground">
                                            <Shield className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-foreground">
                                                Account Overview
                                            </h3>
                                            <p className="text-[11px] text-muted-foreground">
                                                Authentication & workspace credentials
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-5 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-xs">
                                                {initials}
                                            </div>
                                            <div className="space-y-0.5 overflow-hidden">
                                                <p className="truncate text-sm font-bold text-foreground">
                                                    {profile.name || 'Account Admin'}
                                                </p>
                                                <div className="flex items-center gap-1.5">
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-[10px] font-semibold"
                                                    >
                                                        {profile.role || 'Workspace Admin'}
                                                    </Badge>
                                                    {profile.email_verified && (
                                                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                                            <Check className="h-2.5 w-2.5" /> Verified
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                                            <div className="flex items-center justify-between">
                                                <span className="flex items-center gap-1.5">
                                                    <Mail className="h-3.5 w-3.5" /> Email
                                                </span>
                                                <span className="max-w-44 truncate font-medium text-foreground">
                                                    {profile.email}
                                                </span>
                                            </div>

                                            {profile.member_since && (
                                                <div className="flex items-center justify-between">
                                                    <span className="flex items-center gap-1.5">
                                                        <Calendar className="h-3.5 w-3.5" /> Member Since
                                                    </span>
                                                    <span className="font-medium text-foreground">
                                                        {profile.member_since}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-2">
                                            <Button
                                                asChild
                                                variant="outline"
                                                size="sm"
                                                className="w-full gap-1.5 rounded-xl border-border bg-background text-xs font-semibold text-muted-foreground shadow-xs hover:bg-muted hover:text-foreground"
                                            >
                                                <Link href="/settings/profile">
                                                    <span>Manage Security & Login</span>
                                                    <ArrowUpRight className="h-3 w-3" />
                                                </Link>
                                            </Button>
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

ProfileShowPage.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'My Profile',
            href: '/profile',
        },
    ],
};
