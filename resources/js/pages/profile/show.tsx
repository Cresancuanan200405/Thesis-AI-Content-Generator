import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    Calendar,
    CheckCircle2,
    Edit3,
    ExternalLink,
    Globe,
    ImageIcon,
    Layers,
    Mail,
    Package,
    Palette,
    Settings,
    Shield,
    Sparkles,
    Tag,
    User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

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

    return (
        <>
            <Head title="My Profile" />

            <div className="min-h-screen bg-background text-foreground pb-20">
                <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">

                    {/* =====================================================
                        PROFILE HERO & QUICK ACTIONS
                    ====================================================== */}

                    <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 md:p-8 shadow-sm">
                        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                                {/* Avatar */}
                                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-primary text-primary-foreground text-2xl font-bold shadow-md ring-4 ring-primary/10">
                                    {initials}
                                </div>

                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                                            {profile.name}
                                        </h1>
                                        {profile.email_verified && (
                                            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold gap-1">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Verified
                                            </Badge>
                                        )}
                                        <Badge variant="secondary" className="text-xs font-medium">
                                            {profile.provider || 'Email'}
                                        </Badge>
                                    </div>

                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Mail className="h-3.5 w-3.5" />
                                        {profile.email}
                                    </p>

                                    <p className="text-xs text-muted-foreground flex items-center gap-2 pt-1">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Member since {profile.member_since || profile.created_at}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                                <Button asChild variant="outline" className="gap-1.5 text-xs font-semibold shadow-none">
                                    <Link href="/settings/profile">
                                        <Settings className="h-4 w-4" />
                                        Account Settings
                                    </Link>
                                </Button>

                                <Button asChild className="gap-2 text-xs font-semibold shadow-sm">
                                    <Link href="/generator">
                                        <Sparkles className="h-4 w-4" />
                                        Create Visuals
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </section>

                    {/* =====================================================
                        WORKSPACE METRICS STRIP
                    ====================================================== */}

                    <section className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                        <Link
                            href="/products"
                            className="group flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-primary/40 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                                    <Package className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Catalog Products</p>
                                    <p className="text-xl font-bold text-foreground">{stats.products_count ?? 0}</p>
                                </div>
                            </div>
                            <span className="text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
                                Manage →
                            </span>
                        </Link>

                        <Link
                            href="/campaigns"
                            className="group flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-primary/40 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                                    <Layers className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Marketing Campaigns</p>
                                    <p className="text-xl font-bold text-foreground">{stats.campaigns_count ?? 0}</p>
                                </div>
                            </div>
                            <span className="text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
                                View →
                            </span>
                        </Link>

                        <Link
                            href="/designs"
                            className="group flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-primary/40 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                                    <ImageIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Generated Visuals</p>
                                    <p className="text-xl font-bold text-foreground">{stats.designs_count ?? 0}</p>
                                </div>
                            </div>
                            <span className="text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
                                Library →
                            </span>
                        </Link>
                    </section>

                    {/* =====================================================
                        BUSINESS IDENTITY & ONBOARDING DETAILS
                    ====================================================== */}

                    <div className="grid gap-6 lg:grid-cols-3">

                        {/* LEFT 2 COLUMNS: BUSINESS PROFILE & ONBOARDING DATA */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="rounded-3xl border-border bg-card shadow-sm p-6 space-y-6">
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
                                                Details configured during business onboarding and account setup.
                                            </p>
                                        </div>
                                    </div>

                                    <Button asChild variant="ghost" size="sm" className="text-xs text-primary hover:underline gap-1">
                                        <Link href="/settings/profile">
                                            <Edit3 className="h-3.5 w-3.5" />
                                            Edit Details
                                        </Link>
                                    </Button>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">Business Name</p>
                                        <p className="text-sm font-semibold text-foreground">
                                            {business.name || 'Not configured'}
                                        </p>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">Industry & Niche</p>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs font-medium">
                                                {business.industry || 'General'}
                                            </Badge>
                                            {business.category && (
                                                <Badge variant="secondary" className="text-xs font-medium">
                                                    {business.category}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {business.target_audience && (
                                        <div className="space-y-1 sm:col-span-2">
                                            <p className="text-xs font-medium text-muted-foreground">Target Audience</p>
                                            <p className="text-xs leading-relaxed text-foreground font-medium rounded-xl border border-border/60 bg-muted/20 p-3">
                                                {business.target_audience}
                                            </p>
                                        </div>
                                    )}

                                    {business.unique_selling_point && (
                                        <div className="space-y-1 sm:col-span-2">
                                            <p className="text-xs font-medium text-muted-foreground">Unique Selling Proposition (USP)</p>
                                            <p className="text-xs leading-relaxed text-foreground font-medium rounded-xl border border-border/60 bg-muted/20 p-3">
                                                {business.unique_selling_point}
                                            </p>
                                        </div>
                                    )}

                                    {business.description && (
                                        <div className="space-y-1 sm:col-span-2">
                                            <p className="text-xs font-medium text-muted-foreground">Business Bio & Description</p>
                                            <p className="text-xs leading-relaxed text-muted-foreground rounded-xl border border-border/60 bg-muted/20 p-3">
                                                {business.description}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* MARKETING STYLES & CREATIVE PREFERENCES */}
                            <Card className="rounded-3xl border-border bg-card shadow-sm p-6 space-y-5">
                                <div className="flex items-center justify-between border-b border-border/60 pb-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                            <Palette className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-foreground">
                                                Visual Aesthetics & Creative Style Kit
                                            </h2>
                                            <p className="text-xs text-muted-foreground">
                                                Default art direction and photography styles tailored for your AI image generations.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground mb-2">Preferred Content Styles</p>
                                        {business.content_style && business.content_style.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {business.content_style.map((style: string) => (
                                                    <Badge key={style} variant="outline" className="border-primary/30 bg-primary/10 text-primary text-xs font-semibold">
                                                        {style}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground italic">No specific style preferences set. Defaulting to general catalog themes.</p>
                                        )}
                                    </div>

                                    <div className="pt-2 border-t border-border/50">
                                        <p className="text-xs font-semibold text-muted-foreground mb-1">Tagline Generation Strategy</p>
                                        <p className="text-xs text-foreground font-medium capitalize">
                                            {business.default_tagline_behavior === 'ai'
                                                ? 'AI Automated Catchphrases (Tailored per visual)'
                                                : business.default_tagline_behavior === 'none'
                                                  ? 'Minimalist / No Text Overlay'
                                                  : 'Custom Manual Input'}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* RIGHT 1 COLUMN: BRAND LOGO & QUICK ACTIONS */}
                        <div className="space-y-6">
                            {/* Brand Logo Card */}
                            <Card className="rounded-3xl border-border bg-card shadow-sm p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-primary" />
                                        Brand Logo
                                    </h3>
                                    <Button asChild variant="ghost" size="sm" className="text-xs text-primary hover:underline p-0 h-auto">
                                        <Link href="/settings/logo">
                                            {business.logo_url ? 'Change Logo' : 'Upload'}
                                        </Link>
                                    </Button>
                                </div>

                                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center">
                                    {business.logo_url ? (
                                        <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-border bg-background p-2 shadow-sm">
                                            <img
                                                src={business.logo_url}
                                                alt={business.name || 'Brand Logo'}
                                                className="h-full w-full object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <Building2 className="h-10 w-10 text-muted-foreground/40 mb-2" />
                                            <p className="text-xs font-semibold text-muted-foreground">No brand logo uploaded</p>
                                            <p className="text-[11px] text-muted-foreground/80 mt-1 max-w-[180px]">
                                                Add a logo to automatically watermark your visual creatives.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Security & Authentication Card */}
                            <Card className="rounded-3xl border-border bg-card shadow-sm p-6 space-y-4">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-primary" />
                                    Account Security
                                </h3>

                                <div className="space-y-3 text-xs">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Auth Provider</span>
                                        <span className="font-semibold text-foreground">{profile.provider}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Email Verification</span>
                                        <span className={`font-semibold ${profile.email_verified ? 'text-emerald-500' : 'text-amber-500'}`}>
                                            {profile.email_verified ? 'Verified ✓' : 'Pending'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">2FA Status</span>
                                        <span className="font-semibold text-foreground">
                                            {profile.two_factor_enabled ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>
                                </div>

                                <Button asChild variant="outline" size="sm" className="w-full text-xs shadow-none mt-2">
                                    <Link href="/settings/security">
                                        Security Settings →
                                    </Link>
                                </Button>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
