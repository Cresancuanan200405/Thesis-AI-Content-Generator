import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    Calendar,
    CheckCircle2,
    Edit3,
    ImageIcon,
    Layers,
    Mail,
    Package,
    Palette,
    Settings,
    Shield,
    Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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

            <div className="min-h-screen bg-background pb-20 text-foreground">
                <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6 lg:p-8">
                    {/* =====================================================
                        PROFILE HERO & QUICK ACTIONS
                    ====================================================== */}

                    <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-sm md:p-8">
                        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                                {/* Avatar */}
                                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-primary text-2xl font-bold text-primary-foreground shadow-md ring-4 ring-primary/10">
                                    {initials}
                                </div>

                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                            {profile.name}
                                        </h1>
                                        {profile.email_verified && (
                                            <Badge
                                                variant="outline"
                                                className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                                            >
                                                <CheckCircle2 className="h-3 w-3" />
                                                Verified
                                            </Badge>
                                        )}
                                        <Badge
                                            variant="secondary"
                                            className="text-xs font-medium"
                                        >
                                            {profile.provider || 'Email'}
                                        </Badge>
                                    </div>

                                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Mail className="h-3.5 w-3.5" />
                                        {profile.email}
                                    </p>

                                    <p className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Member since{' '}
                                        {profile.member_since ||
                                            profile.created_at}
                                    </p>
                                </div>
                            </div>

                            <div className="flex shrink-0 flex-wrap items-center gap-2.5">
                                <Button
                                    asChild
                                    variant="outline"
                                    className="gap-1.5 text-xs font-semibold shadow-none"
                                >
                                    <Link href="/settings/profile">
                                        <Settings className="h-4 w-4" />
                                        Account Settings
                                    </Link>
                                </Button>

                                <Button
                                    asChild
                                    className="gap-2 text-xs font-semibold shadow-sm"
                                >
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

                    <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <Link
                            href="/products"
                            className="group flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                                    <Package className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Catalog Products
                                    </p>
                                    <p className="text-xl font-bold text-foreground">
                                        {stats.products_count ?? 0}
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs font-semibold text-primary transition-transform group-hover:translate-x-0.5">
                                Manage →
                            </span>
                        </Link>

                        <Link
                            href="/campaigns"
                            className="group flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                                    <Layers className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Marketing Campaigns
                                    </p>
                                    <p className="text-xl font-bold text-foreground">
                                        {stats.campaigns_count ?? 0}
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs font-semibold text-primary transition-transform group-hover:translate-x-0.5">
                                View →
                            </span>
                        </Link>

                        <Link
                            href="/designs"
                            className="group flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                                    <ImageIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Generated Visuals
                                    </p>
                                    <p className="text-xl font-bold text-foreground">
                                        {stats.designs_count ?? 0}
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs font-semibold text-primary transition-transform group-hover:translate-x-0.5">
                                Library →
                            </span>
                        </Link>
                    </section>

                    {/* =====================================================
                        BUSINESS IDENTITY & ONBOARDING DETAILS
                    ====================================================== */}

                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* LEFT 2 COLUMNS: BUSINESS PROFILE & ONBOARDING DATA */}
                        <div className="space-y-6 lg:col-span-2">
                            <Card className="space-y-6 rounded-3xl border-border bg-card p-6 shadow-sm">
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
                                                Details configured during
                                                business onboarding and account
                                                setup.
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        asChild
                                        variant="ghost"
                                        size="sm"
                                        className="gap-1 text-xs text-primary hover:underline"
                                    >
                                        <Link href="/settings/profile">
                                            <Edit3 className="h-3.5 w-3.5" />
                                            Edit Details
                                        </Link>
                                    </Button>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">
                                            Business Name
                                        </p>
                                        <p className="text-sm font-semibold text-foreground">
                                            {business.name || 'Not configured'}
                                        </p>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">
                                            Industry & Niche
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className="text-xs font-medium"
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

                                    {business.target_audience && (
                                        <div className="space-y-1 sm:col-span-2">
                                            <p className="text-xs font-medium text-muted-foreground">
                                                Target Audience
                                            </p>
                                            <p className="rounded-xl border border-border/60 bg-muted/20 p-3 text-xs leading-relaxed font-medium text-foreground">
                                                {business.target_audience}
                                            </p>
                                        </div>
                                    )}

                                    {business.unique_selling_point && (
                                        <div className="space-y-1 sm:col-span-2">
                                            <p className="text-xs font-medium text-muted-foreground">
                                                Unique Selling Proposition (USP)
                                            </p>
                                            <p className="rounded-xl border border-border/60 bg-muted/20 p-3 text-xs leading-relaxed font-medium text-foreground">
                                                {business.unique_selling_point}
                                            </p>
                                        </div>
                                    )}

                                    {business.description && (
                                        <div className="space-y-1 sm:col-span-2">
                                            <p className="text-xs font-medium text-muted-foreground">
                                                Business Bio & Description
                                            </p>
                                            <p className="rounded-xl border border-border/60 bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
                                                {business.description}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* MARKETING STYLES & CREATIVE PREFERENCES */}
                            <Card className="space-y-5 rounded-3xl border-border bg-card p-6 shadow-sm">
                                <div className="flex items-center justify-between border-b border-border/60 pb-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                            <Palette className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-foreground">
                                                Visual Aesthetics & Creative
                                                Style Kit
                                            </h2>
                                            <p className="text-xs text-muted-foreground">
                                                Default art direction and
                                                photography styles tailored for
                                                your AI image generations.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <p className="mb-2 text-xs font-semibold text-muted-foreground">
                                            Preferred Content Styles
                                        </p>
                                        {business.content_style &&
                                        business.content_style.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {business.content_style.map(
                                                    (style: string) => (
                                                        <Badge
                                                            key={style}
                                                            variant="outline"
                                                            className="border-primary/30 bg-primary/10 text-xs font-semibold text-primary"
                                                        >
                                                            {style}
                                                        </Badge>
                                                    ),
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground italic">
                                                No specific style preferences
                                                set. Defaulting to general
                                                catalog themes.
                                            </p>
                                        )}
                                    </div>

                                    <div className="border-t border-border/50 pt-2">
                                        <p className="mb-1 text-xs font-semibold text-muted-foreground">
                                            Tagline Generation Strategy
                                        </p>
                                        <p className="text-xs font-medium text-foreground capitalize">
                                            {business.default_tagline_behavior ===
                                            'ai'
                                                ? 'AI Automated Catchphrases (Tailored per visual)'
                                                : business.default_tagline_behavior ===
                                                    'none'
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
                            <Card className="space-y-4 rounded-3xl border-border bg-card p-6 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                                        <Building2 className="h-4 w-4 text-primary" />
                                        Brand Logo
                                    </h3>
                                    <Button
                                        asChild
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto p-0 text-xs text-primary hover:underline"
                                    >
                                        <Link href="/settings/logo">
                                            {business.logo_url
                                                ? 'Change Logo'
                                                : 'Upload'}
                                        </Link>
                                    </Button>
                                </div>

                                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center">
                                    {business.logo_url ? (
                                        <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-border bg-background p-2 shadow-sm">
                                            <img
                                                src={business.logo_url}
                                                alt={
                                                    business.name ||
                                                    'Brand Logo'
                                                }
                                                className="h-full w-full object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <Building2 className="mb-2 h-10 w-10 text-muted-foreground/40" />
                                            <p className="text-xs font-semibold text-muted-foreground">
                                                No brand logo uploaded
                                            </p>
                                            <p className="mt-1 max-w-[180px] text-[11px] text-muted-foreground/80">
                                                Add a logo to automatically
                                                watermark your visual creatives.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Security & Authentication Card */}
                            <Card className="space-y-4 rounded-3xl border-border bg-card p-6 shadow-sm">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                                    <Shield className="h-4 w-4 text-primary" />
                                    Account Security
                                </h3>

                                <div className="space-y-3 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">
                                            Auth Provider
                                        </span>
                                        <span className="font-semibold text-foreground">
                                            {profile.provider}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">
                                            Email Verification
                                        </span>
                                        <span
                                            className={`font-semibold ${profile.email_verified ? 'text-emerald-500' : 'text-amber-500'}`}
                                        >
                                            {profile.email_verified
                                                ? 'Verified ✓'
                                                : 'Pending'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">
                                            2FA Status
                                        </span>
                                        <span className="font-semibold text-foreground">
                                            {profile.two_factor_enabled
                                                ? 'Enabled'
                                                : 'Disabled'}
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="mt-2 w-full text-xs shadow-none"
                                >
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
