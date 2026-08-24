import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    ArrowUpRight,
    Briefcase,
    Building2,
    Calendar,
    Car,
    Check,
    CheckCircle2,
    Clock,
    Cpu,
    Edit3,
    Eye,
    GraduationCap,
    HeartPulse,
    Home,
    ImageIcon,
    Info,
    KeyRound,
    Landmark,
    Layers,
    Loader2,
    Lock,
    Mail,
    Package,
    Palette,
    Plane,
    Plus,
    RefreshCw,
    Settings,
    Shield,
    ShieldCheck,
    ShoppingBag,
    ShoppingCart,
    Sparkles,
    Trash2,
    Upload,
    User as UserIcon,
    UtensilsCrossed,
    Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { Progress } from '@/components/ui/progress';
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
| Industry & Category Presets (Synchronized with System Onboarding)
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

const industryIcons: Record<string, any> = {
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

export default function ProfileShowPage({
    profile = {},
    business = {},
    stats = {},
}: any) {
    const initials = profile.name
        ? profile.name
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
        : 'U';

    /*
    |--------------------------------------------------------------------------
    | EDIT BUSINESS MODAL STATE
    |--------------------------------------------------------------------------
    */
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'identity' | 'logo'>('identity');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState({
        name: '',
        industry: 'Retail',
        category: '',
        description: '',
    });

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [removeLogo, setRemoveLogo] = useState(false);

    // Synchronize form data whenever business prop updates or modal opens
    const resetFormWithBusinessData = () => {
        setFormData({
            name: business.name || '',
            industry: business.industry || 'Retail',
            category: business.category || '',
            description: business.description || '',
        });
        setLogoFile(null);
        setLogoPreview(business.logo_url || null);
        setRemoveLogo(false);
        setFormErrors({});
    };

    useEffect(() => {
        resetFormWithBusinessData();
    }, [business]);

    const openEditModal = (tab: 'identity' | 'logo' = 'identity') => {
        resetFormWithBusinessData();
        setActiveTab(tab);
        setIsEditModalOpen(true);
    };

    const availableCategories = useMemo(() => {
        if (!formData.industry) return [];
        return industryCategories[formData.industry] ?? [];
    }, [formData.industry]);

    const handleSelectIndustry = (industry: string) => {
        setFormData((prev) => ({
            ...prev,
            industry,
            category:
                prev.industry === industry
                    ? prev.category
                    : industryCategories[industry]?.[0] || '',
        }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            setRemoveLogo(false);
            const previewUrl = URL.createObjectURL(file);
            setLogoPreview(previewUrl);
        }
    };

    const handleRemoveLogo = () => {
        setLogoFile(null);
        setLogoPreview(null);
        setRemoveLogo(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormErrors({});

        const data = new FormData();
        data.append('name', formData.name);
        data.append('industry', formData.industry);
        data.append('category', formData.category || '');
        data.append('description', formData.description || '');

        if (logoFile) {
            data.append('logo', logoFile);
        }
        if (removeLogo) {
            data.append('remove_logo', '1');
        }

        router.post('/profile/business', data, {
            forceFormData: true,
            onSuccess: () => {
                setIsSubmitting(false);
                setIsEditModalOpen(false);
                toast.success('Business identity updated successfully!');
            },
            onError: (errors) => {
                setIsSubmitting(false);
                setFormErrors(errors);
                toast.error(
                    'Please resolve the highlighted fields to save changes.',
                );
            },
        });
    };

    const setupCompleteness = business.setup_completeness ?? 80;
    const checklist = business.checklist || {
        name: true,
        industry: true,
        category: true,
        description: !!business.description,
        logo: !!business.logo_url,
    };

    return (
        <>
            <Head title="My Account Profile" />

            <div className="min-h-screen bg-background pb-20 text-foreground">
                <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6 lg:p-8">
                    {/* =====================================================
                        PROFILE HERO & OVERVIEW CARD
                    ====================================================== */}
                    <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-sm md:p-8">
                        {/* Background subtle radial glow */}
                        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
                        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />

                        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                                {/* Avatar */}
                                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-primary text-2xl font-extrabold text-primary-foreground shadow-md ring-4 ring-primary/15">
                                    {initials}
                                    <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-emerald-500 text-white shadow-xs">
                                        <Check className="h-3 w-3 stroke-[3]" />
                                    </span>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                            {profile.name}
                                        </h1>

                                        <Badge
                                            variant="secondary"
                                            className="border-border/60 bg-muted/60 text-xs font-semibold text-foreground"
                                        >
                                            {profile.role || 'Workspace Admin'}
                                        </Badge>

                                        {profile.email_verified ? (
                                            <Badge
                                                variant="outline"
                                                className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                                            >
                                                <CheckCircle2 className="h-3 w-3" />
                                                Verified Account
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="outline"
                                                className="gap-1 border-amber-500/30 bg-amber-500/10 text-xs font-semibold text-amber-600 dark:text-amber-400"
                                            >
                                                <AlertCircle className="h-3 w-3" />
                                                Unverified Email
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1.5 font-medium text-foreground/90">
                                            <Mail className="h-3.5 w-3.5 text-primary" />
                                            {profile.email}
                                        </span>

                                        <span className="flex items-center gap-1.5">
                                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                            {business.name || 'My Workspace'}
                                        </span>

                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                            Member since{' '}
                                            {profile.member_since ||
                                                profile.created_at}
                                        </span>
                                    </div>

                                    {/* Profile Setup Progress Bar */}
                                    <div className="pt-2">
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="font-semibold text-muted-foreground">
                                                Business Setup Profile
                                            </span>
                                            <span className="font-bold text-primary">
                                                {setupCompleteness}% Complete
                                            </span>
                                        </div>
                                        <Progress
                                            value={setupCompleteness}
                                            className="mt-1 h-1.5 w-48 rounded-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Top Quick Actions */}
                            <div className="flex shrink-0 flex-wrap items-center gap-2.5">
                                <Button
                                    type="button"
                                    onClick={() => openEditModal('identity')}
                                    className="cursor-pointer gap-1.5 text-xs font-semibold shadow-xs"
                                >
                                    <Edit3 className="h-4 w-4" />
                                    Edit Business Identity
                                </Button>

                                <Button
                                    asChild
                                    variant="outline"
                                    className="gap-1.5 border-border bg-card text-xs font-semibold shadow-none hover:bg-muted"
                                >
                                    <Link href="/settings/profile">
                                        <Settings className="h-4 w-4 text-muted-foreground" />
                                        Account Settings
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </section>

                    {/* =====================================================
                        WORKSPACE KEY METRICS STRIP (4 METRICS)
                    ====================================================== */}
                    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* 1. Catalog Products */}
                        <Link
                            href="/products"
                            className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-4.5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted-foreground">
                                    Catalog Products
                                </span>
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 transition-transform group-hover:scale-110">
                                    <Package className="h-4.5 w-4.5" />
                                </div>
                            </div>
                            <div className="mt-3">
                                <p className="text-2xl font-bold tracking-tight text-foreground">
                                    {stats.products_count ?? 0}
                                </p>
                                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <span>Active catalog items</span>
                                    <ArrowUpRight className="ml-auto h-3.5 w-3.5 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                                </p>
                            </div>
                        </Link>

                        {/* 2. Marketing Campaigns */}
                        <Link
                            href="/campaigns"
                            className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-4.5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted-foreground">
                                    Marketing Campaigns
                                </span>
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 transition-transform group-hover:scale-110">
                                    <Layers className="h-4.5 w-4.5" />
                                </div>
                            </div>
                            <div className="mt-3">
                                <p className="text-2xl font-bold tracking-tight text-foreground">
                                    {stats.campaigns_count ?? 0}
                                </p>
                                <p className="mt-0.5 flex items-center justify-between text-[11px] text-muted-foreground">
                                    <span>
                                        {stats.active_campaigns_count ?? 0}{' '}
                                        Active •{' '}
                                        {stats.completed_campaigns_count ?? 0}{' '}
                                        Done
                                    </span>
                                    <ArrowUpRight className="h-3.5 w-3.5 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                                </p>
                            </div>
                        </Link>

                        {/* 3. Generated Visuals */}
                        <Link
                            href="/designs"
                            className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-4.5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted-foreground">
                                    Generated Visuals
                                </span>
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 transition-transform group-hover:scale-110">
                                    <ImageIcon className="h-4.5 w-4.5" />
                                </div>
                            </div>
                            <div className="mt-3">
                                <p className="text-2xl font-bold tracking-tight text-foreground">
                                    {stats.designs_count ?? 0}
                                </p>
                                <p className="mt-0.5 flex items-center justify-between text-[11px] text-muted-foreground">
                                    <span>
                                        Latest:{' '}
                                        {stats.latest_design_at || 'Recent'}
                                    </span>
                                    <ArrowUpRight className="h-3.5 w-3.5 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                                </p>
                            </div>
                        </Link>

                        {/* 4. AI Engine & Watermark Status */}
                        <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4.5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted-foreground">
                                    AI Engine & Logo
                                </span>
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                                    <Zap className="h-4.5 w-4.5" />
                                </div>
                            </div>
                            <div className="mt-3">
                                <p className="text-sm font-bold tracking-tight text-foreground">
                                    Gemini & Imagen
                                </p>
                                <p className="mt-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                    {business.logo_url
                                        ? '✓ Watermark Configured'
                                        : '• No Watermark Added'}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* =====================================================
                        MAIN PROFILE & BUSINESS DETAILS GRID (2 COLUMNS)
                    ====================================================== */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* LEFT 2 COLUMNS: BUSINESS PROFILE & ACCOUNT SECURITY */}
                        <div className="space-y-6 lg:col-span-2">
                            {/* Card 1: Business Identity & Overview */}
                            <Card className="space-y-5 rounded-3xl border-border bg-card p-6 shadow-sm">
                                <div className="flex items-center justify-between border-b border-border/60 pb-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                            <Building2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-foreground">
                                                Business Identity & Setup
                                            </h2>
                                            <p className="text-xs text-muted-foreground">
                                                Primary business parameters used
                                                by AI prompt engines and
                                                promotional graphics.
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            openEditModal('identity')
                                        }
                                        className="cursor-pointer gap-1.5 border-border bg-background text-xs font-semibold text-foreground shadow-none hover:bg-muted"
                                    >
                                        <Edit3 className="h-3.5 w-3.5 text-primary" />
                                        Edit Details
                                    </Button>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div className="space-y-1 rounded-2xl border border-border/50 bg-muted/20 p-3.5">
                                        <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                                            Registered Business Name
                                        </p>
                                        <p className="text-sm font-bold text-foreground">
                                            {business.name || 'Not configured'}
                                        </p>
                                    </div>

                                    <div className="space-y-1 rounded-2xl border border-border/50 bg-muted/20 p-3.5">
                                        <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                                            Industry & Niche Category
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                            <Badge
                                                variant="outline"
                                                className="border-primary/30 bg-primary/10 text-xs font-semibold text-primary"
                                            >
                                                {business.industry || 'General'}
                                            </Badge>
                                            {business.category && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs font-medium"
                                                >
                                                    {business.category}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {business.description ? (
                                        <div className="space-y-1.5 sm:col-span-2">
                                            <p className="text-xs font-semibold text-muted-foreground">
                                                Business Bio & Description
                                            </p>
                                            <p className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-xs leading-relaxed font-medium text-foreground">
                                                {business.description}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between rounded-2xl border border-dashed border-border bg-muted/20 p-4 sm:col-span-2">
                                            <div className="flex items-center gap-2">
                                                <Info className="h-4 w-4 text-muted-foreground" />
                                                <p className="text-xs text-muted-foreground">
                                                    No business bio set. Adding
                                                    a description improves AI
                                                    prompt contextualization.
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    openEditModal('identity')
                                                }
                                                className="h-auto p-0 text-xs font-bold text-primary hover:underline"
                                            >
                                                Add Bio +
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Card 2: Account & Security Profile */}
                            <Card className="space-y-5 rounded-3xl border-border bg-card p-6 shadow-sm">
                                <div className="flex items-center justify-between border-b border-border/60 pb-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                            <ShieldCheck className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-foreground">
                                                Account & Security Profile
                                            </h2>
                                            <p className="text-xs text-muted-foreground">
                                                Authentication methods, email
                                                verification, and 2FA protection
                                                status.
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        asChild
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5 border-border bg-background text-xs font-semibold text-foreground shadow-none hover:bg-muted"
                                    >
                                        <Link href="/settings/security">
                                            <Lock className="h-3.5 w-3.5 text-primary" />
                                            Manage Security
                                        </Link>
                                    </Button>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 p-3.5 text-xs">
                                        <span className="text-muted-foreground">
                                            Primary Email
                                        </span>
                                        <span className="font-semibold text-foreground">
                                            {profile.email}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 p-3.5 text-xs">
                                        <span className="text-muted-foreground">
                                            Email Status
                                        </span>
                                        <span
                                            className={`font-bold ${profile.email_verified ? 'text-emerald-500' : 'text-amber-500'}`}
                                        >
                                            {profile.email_verified
                                                ? 'Verified ✓'
                                                : 'Pending Verification'}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 p-3.5 text-xs">
                                        <span className="text-muted-foreground">
                                            Authentication Provider
                                        </span>
                                        <span className="font-semibold text-foreground">
                                            {profile.provider}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 p-3.5 text-xs">
                                        <span className="text-muted-foreground">
                                            Two-Factor Auth (2FA)
                                        </span>
                                        <span
                                            className={`font-bold ${profile.two_factor_enabled ? 'text-emerald-500' : 'text-muted-foreground'}`}
                                        >
                                            {profile.two_factor_enabled
                                                ? 'Active & Protected'
                                                : 'Disabled'}
                                        </span>
                                    </div>
                                </div>
                            </Card>

                            {/* Card 3: Quick Marketing Shortcuts */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <Link
                                    href="/campaigns?action=create"
                                    className="group flex items-center justify-between rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:bg-primary/5"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <Plus className="h-4 w-4" />
                                        </div>
                                        <span className="text-xs font-bold text-foreground">
                                            New Campaign
                                        </span>
                                    </div>
                                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                                </Link>

                                <Link
                                    href="/designs"
                                    className="group flex items-center justify-between rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:bg-primary/5"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                                            <ImageIcon className="h-4 w-4" />
                                        </div>
                                        <span className="text-xs font-bold text-foreground">
                                            Generate Visual
                                        </span>
                                    </div>
                                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                                </Link>

                                <Link
                                    href="/products"
                                    className="group flex items-center justify-between rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:bg-primary/5"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                                            <Package className="h-4 w-4" />
                                        </div>
                                        <span className="text-xs font-bold text-foreground">
                                            Add Product
                                        </span>
                                    </div>
                                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                                </Link>
                            </div>
                        </div>

                        {/* RIGHT 1 COLUMN: BRAND LOGO, CHECKLIST & SYSTEM INFO */}
                        <div className="space-y-6">
                            {/* Card 1: Official Brand Logo */}
                            <Card className="space-y-4 rounded-3xl border-border bg-card p-6 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                                        <Building2 className="h-4 w-4 text-primary" />
                                        Official Brand Logo
                                    </h3>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openEditModal('logo')}
                                        className="h-auto p-0 text-xs font-bold text-primary hover:underline"
                                    >
                                        {business.logo_url
                                            ? 'Change Logo'
                                            : 'Upload Logo'}
                                    </Button>
                                </div>

                                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center">
                                    {business.logo_url ? (
                                        <div className="space-y-3">
                                            <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-2xl border border-border bg-background p-2 shadow-sm">
                                                <img
                                                    src={business.logo_url}
                                                    alt={
                                                        business.name ||
                                                        'Brand Logo'
                                                    }
                                                    className="h-full w-full object-contain"
                                                />
                                            </div>
                                            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                Active Brand Watermark
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <Building2 className="mb-2 h-10 w-10 text-muted-foreground/40" />
                                            <p className="text-xs font-semibold text-muted-foreground">
                                                No brand logo uploaded
                                            </p>
                                            <p className="mt-1 max-w-[180px] text-[11px] text-muted-foreground/80">
                                                Upload your logo to
                                                automatically stamp it onto
                                                marketing outputs.
                                            </p>
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={() =>
                                                    openEditModal('logo')
                                                }
                                                className="mt-3 cursor-pointer text-xs font-bold"
                                            >
                                                <Upload className="mr-1 h-3.5 w-3.5" />
                                                Upload Logo
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Card 2: Setup Readiness Checklist */}
                            <Card className="space-y-3.5 rounded-3xl border-border bg-card p-6 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                                        <Activity className="h-4 w-4 text-primary" />
                                        Profile Setup Readiness
                                    </h3>
                                    <span className="text-xs font-bold text-primary">
                                        {setupCompleteness}%
                                    </span>
                                </div>

                                <div className="space-y-2.5 pt-1 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-muted-foreground">
                                            <CheckCircle2
                                                className={`h-4 w-4 ${checklist.name ? 'text-emerald-500' : 'text-muted-foreground/40'}`}
                                            />
                                            Business Name
                                        </span>
                                        <span className="text-[11px] font-semibold text-foreground">
                                            {checklist.name ? 'Set' : 'Missing'}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-muted-foreground">
                                            <CheckCircle2
                                                className={`h-4 w-4 ${checklist.industry ? 'text-emerald-500' : 'text-muted-foreground/40'}`}
                                            />
                                            Industry & Niche
                                        </span>
                                        <span className="text-[11px] font-semibold text-foreground">
                                            {checklist.industry
                                                ? 'Set'
                                                : 'Missing'}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-muted-foreground">
                                            <CheckCircle2
                                                className={`h-4 w-4 ${checklist.description ? 'text-emerald-500' : 'text-muted-foreground/40'}`}
                                            />
                                            Business Bio / Description
                                        </span>
                                        <span className="text-[11px] font-semibold text-foreground">
                                            {checklist.description
                                                ? 'Set'
                                                : 'Optional'}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-muted-foreground">
                                            <CheckCircle2
                                                className={`h-4 w-4 ${checklist.logo ? 'text-emerald-500' : 'text-muted-foreground/40'}`}
                                            />
                                            Brand Logo Stamp
                                        </span>
                                        <span className="text-[11px] font-semibold text-foreground">
                                            {checklist.logo
                                                ? 'Active'
                                                : 'Optional'}
                                        </span>
                                    </div>
                                </div>
                            </Card>

                            {/* Card 3: AI Engine & Workspace Info */}
                            <Card className="space-y-3 rounded-3xl border-border bg-card p-6 shadow-sm">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                                    <Cpu className="h-4 w-4 text-primary" />
                                    AI Generation Suite
                                </h3>

                                <div className="space-y-2 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">
                                            Model
                                        </span>
                                        <span className="font-semibold text-foreground">
                                            Gemini 2.5 Flash
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">
                                            Image Model
                                        </span>
                                        <span className="font-semibold text-foreground">
                                            Imagen 3.0
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">
                                            Cloud Storage
                                        </span>
                                        <span className="font-semibold text-emerald-500">
                                            Active
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="mt-2 w-full text-xs shadow-none"
                                >
                                    <Link href="/settings/appearance">
                                        Appearance & Themes →
                                    </Link>
                                </Button>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            {/* =============================================================
                EDIT BUSINESS IDENTITY MODAL DIALOG
            ============================================================= */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-border bg-card p-0 shadow-2xl sm:max-w-xl">
                    <DialogHeader className="border-b border-border/70 bg-muted/20 p-6 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold text-foreground">
                                    Business Identity & Setup
                                </DialogTitle>
                                <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                                    Configure your brand name, industry niche,
                                    and official logo.
                                </DialogDescription>
                            </div>
                        </div>

                        {/* Top Segmented Tabs */}
                        <div className="mt-4 flex items-center rounded-xl border border-border bg-muted/40 p-1 text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => setActiveTab('identity')}
                                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-center transition-all ${
                                    activeTab === 'identity'
                                        ? 'bg-card text-foreground shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Building2 className="h-3.5 w-3.5" />
                                <span>Identity & Niche</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('logo')}
                                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-center transition-all ${
                                    activeTab === 'logo'
                                        ? 'bg-card text-foreground shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <ImageIcon className="h-3.5 w-3.5" />
                                <span>Brand Logo</span>
                            </button>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 p-6">
                        {/* TAB 1: IDENTITY & NICHE */}
                        {activeTab === 'identity' && (
                            <div className="space-y-5">
                                {/* Business Name */}
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="edit-biz-name"
                                        className="text-xs font-semibold text-foreground"
                                    >
                                        Business / Brand Name{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        id="edit-biz-name"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                name: e.target.value,
                                            }))
                                        }
                                        placeholder="e.g. Lumina Apparel, BrewCraft Cafe"
                                        className={`h-10 rounded-xl text-xs ${
                                            formErrors.name
                                                ? 'border-destructive'
                                                : ''
                                        }`}
                                    />
                                    {formErrors.name && (
                                        <p className="text-[11px] font-medium text-destructive">
                                            {formErrors.name}
                                        </p>
                                    )}
                                </div>

                                {/* Industry Selection */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Primary Industry{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Select
                                        value={formData.industry}
                                        onValueChange={handleSelectIndustry}
                                    >
                                        <SelectTrigger className="h-10 rounded-xl text-xs">
                                            <SelectValue placeholder="Select industry" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60 rounded-xl">
                                            {industryOptions.map((ind) => {
                                                const Icon =
                                                    industryIcons[ind] ||
                                                    Building2;
                                                return (
                                                    <SelectItem
                                                        key={ind}
                                                        value={ind}
                                                        className="text-xs"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Icon className="h-3.5 w-3.5 text-primary" />
                                                            <span>{ind}</span>
                                                        </div>
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                    {formErrors.industry && (
                                        <p className="text-[11px] font-medium text-destructive">
                                            {formErrors.industry}
                                        </p>
                                    )}
                                </div>

                                {/* Category / Sub-category */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label
                                            htmlFor="edit-biz-category"
                                            className="text-xs font-semibold text-foreground"
                                        >
                                            Sub-Category / Specialization
                                        </Label>
                                        <span className="text-[11px] text-muted-foreground">
                                            Optional
                                        </span>
                                    </div>

                                    {availableCategories.length > 0 ? (
                                        <div className="space-y-2">
                                            <Select
                                                value={formData.category}
                                                onValueChange={(val) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        category: val,
                                                    }))
                                                }
                                            >
                                                <SelectTrigger className="h-10 rounded-xl text-xs">
                                                    <SelectValue placeholder="Choose a specialization or type below" />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-60 rounded-xl">
                                                    {availableCategories.map(
                                                        (cat) => (
                                                            <SelectItem
                                                                key={cat}
                                                                value={cat}
                                                                className="text-xs"
                                                            >
                                                                {cat}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <Input
                                                id="edit-biz-category"
                                                value={formData.category}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        category:
                                                            e.target.value,
                                                    }))
                                                }
                                                placeholder="Or enter custom category..."
                                                className="h-9 rounded-xl text-xs"
                                            />
                                        </div>
                                    ) : (
                                        <Input
                                            id="edit-biz-category"
                                            value={formData.category}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    category: e.target.value,
                                                }))
                                            }
                                            placeholder="e.g. Specialty Coffee, Streetwear"
                                            className="h-10 rounded-xl text-xs"
                                        />
                                    )}
                                </div>

                                {/* Business Description / Bio */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label
                                            htmlFor="edit-biz-desc"
                                            className="text-xs font-semibold text-foreground"
                                        >
                                            Business Bio & Description
                                        </Label>
                                        <span className="text-[11px] text-muted-foreground">
                                            Used in AI context
                                        </span>
                                    </div>
                                    <Textarea
                                        id="edit-biz-desc"
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                description: e.target.value,
                                            }))
                                        }
                                        placeholder="Briefly describe what your business offers, values, and core missions..."
                                        className="rounded-xl text-xs"
                                    />
                                </div>
                            </div>
                        )}

                        {/* TAB 2: BRAND LOGO */}
                        {activeTab === 'logo' && (
                            <div className="space-y-5">
                                <div>
                                    <Label className="text-xs font-semibold text-foreground">
                                        Brand Logo Asset
                                    </Label>
                                    <p className="text-[11px] text-muted-foreground">
                                        Used for branding stamps and visual
                                        watermarks. (PNG, JPG, SVG, WebP up to
                                        5MB)
                                    </p>
                                </div>

                                <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-muted/20 p-6 text-center">
                                    {logoPreview ? (
                                        <div className="space-y-4">
                                            <div className="relative mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background p-3 shadow-md">
                                                <img
                                                    src={logoPreview}
                                                    alt="Logo Preview"
                                                    className="h-full w-full object-contain"
                                                />
                                            </div>

                                            <div className="flex items-center justify-center gap-2">
                                                <label
                                                    htmlFor="edit-logo-upload"
                                                    className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground shadow-xs hover:bg-muted"
                                                >
                                                    <Upload className="h-3.5 w-3.5 text-primary" />
                                                    Change File
                                                    <input
                                                        id="edit-logo-upload"
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={
                                                            handleLogoChange
                                                        }
                                                        className="hidden"
                                                    />
                                                </label>

                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleRemoveLogo}
                                                    className="h-8 gap-1.5 border-destructive/30 text-xs font-semibold text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Remove Logo
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
                                                <Upload className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-foreground">
                                                    Upload your brand logo
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                    Transparent PNG works best
                                                    for visual overlays
                                                </p>
                                            </div>
                                            <label
                                                htmlFor="edit-logo-upload-empty"
                                                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
                                            >
                                                <Upload className="h-4 w-4" />
                                                Choose Image File
                                                <input
                                                    id="edit-logo-upload-empty"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleLogoChange}
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <DialogFooter className="flex flex-col-reverse gap-2 border-t border-border/70 pt-4 sm:flex-row sm:justify-between">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Info className="h-3.5 w-3.5 text-primary" />
                                <span>Changes apply across AI generators</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsEditModalOpen(false)}
                                    disabled={isSubmitting}
                                    className="cursor-pointer text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="cursor-pointer gap-2 text-xs font-bold shadow-sm"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-3.5 w-3.5" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
