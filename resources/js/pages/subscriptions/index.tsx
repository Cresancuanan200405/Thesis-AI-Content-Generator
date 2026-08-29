import { Head, usePage } from '@inertiajs/react';
import {
    Activity,
    ArrowUpRight,
    Calendar,
    Check,
    CheckCircle2,
    Coins,
    Cpu,
    ExternalLink,
    FolderKanban,
    Gauge,
    Hash,
    HelpCircle,
    Info,
    Layers,
    Mail,
    Maximize2,
    Package,
    Shield,
    ShieldCheck,
    Sparkles,
    Type,
    Zap,
} from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { OpenAIUsageTelemetry } from '@/types';

interface PlanFeature {
    icon: React.ElementType;
    title: string;
    description: string;
    tag?: string;
}

interface CapabilityItem {
    name: string;
    status: string;
    description: string;
    included: boolean;
}

interface SubscriptionsProps {
    plan?: {
        name?: string;
        status?: string;
        description?: string;
    };
    quota?: {
        application_configured_limit?: number;
        is_unlimited?: boolean;
    };
    profile?: {
        name?: string;
        email?: string;
        member_since?: string;
    };
}

export default function SubscriptionsIndexPage({
    plan = {},
    quota = {},
    profile = {},
}: SubscriptionsProps) {
    const { ai_usage } = usePage<{ ai_usage?: OpenAIUsageTelemetry | null }>().props;

    const planName = plan.name || 'Studio Pro Workspace';
    const planStatus = plan.status || 'Active';
    const planDescription =
        plan.description ||
        'Full AI-powered marketing visual generation access. Your current plan provides access to the following system capabilities.';

    const features: PlanFeature[] = [
        {
            icon: Sparkles,
            title: 'AI Image Generation Engine',
            description: "Generate high-fidelity marketing visuals using OpenAI-powered image synthesis tailored for commercial creatives.",
            tag: 'Core Engine',
        },
        {
            icon: Package,
            title: 'Product Preservation & Staging',
            description: 'Catalog products, upload reference shots, and seamlessly composite catalog items into photorealistic commercial scenes.',
            tag: 'Catalog Staging',
        },
        {
            icon: Calendar,
            title: 'Philippine Holiday & Event Context',
            description: 'Real-time spatial calendar with curated Philippine national holidays, cultural festivals, and seasonal marketing prompts.',
            tag: 'Context Aware',
        },
        {
            icon: Layers,
            title: '13 Industry Visual Profiles',
            description: 'Domain-tailored prompt engineering across retail, food & beverage, beauty, tech, healthcare, hospitality, and more.',
            tag: 'Art Direction',
        },
        {
            icon: Type,
            title: 'Smart Tagline Normalization',
            description: 'Automated headline styling, typographical layout rules, and visual overlay compositing for ready-to-publish creatives.',
            tag: 'Compositor',
        },
        {
            icon: Maximize2,
            title: 'Multi-Aspect Ratio Synthesis',
            description: 'Direct generation across 5 standard digital marketing formats: Square (1:1), Story (9:16), Landscape (16:9), Portrait (4:5), and Standard (4:3).',
            tag: 'Multi-Format',
        },
        {
            icon: FolderKanban,
            title: 'Campaign & Design Management',
            description: 'Organize assets into multi-channel marketing campaigns, save unlimited designs, and trigger infinite variation regenerations.',
            tag: 'Workflow',
        },
        {
            icon: Activity,
            title: 'Live OpenAI Telemetry & Budgeting',
            description: 'Monitor organization-level OpenAI API spend, token counts, request rates, and remaining budget headroom in real-time.',
            tag: 'Telemetry',
        },
    ];

    const capabilities: CapabilityItem[] = [
        {
            name: 'AI Image Generation Studio',
            status: 'Available',
            description: 'Full access to prompt composer, spatial layout, and synthesis engine',
            included: true,
        },
        {
            name: 'Product Catalog Asset Staging',
            status: 'Available',
            description: 'Product preservation and realistic background staging',
            included: true,
        },
        {
            name: 'Marketing Campaign Manager',
            status: 'Available',
            description: 'Create multi-creative campaigns with design versioning',
            included: true,
        },
        {
            name: 'Philippine Event & Holiday Library',
            status: 'Available',
            description: 'Full calendar of national holidays and cultural events',
            included: true,
        },
        {
            name: 'Multi-Format Export (5 Ratios)',
            status: 'Available',
            description: '1:1, 9:16, 16:9, 4:5, and 4:3 high-resolution formats',
            included: true,
        },
        {
            name: 'Organization Telemetry & Quota Monitor',
            status: 'Available',
            description: 'Live OpenAI API spend and application limit tracking',
            included: true,
        },
    ];

    // Telemetry values from authoritative OpenAI telemetry
    const totalSpent =
        ai_usage?.total_spent_formatted ||
        (ai_usage?.total_spent !== undefined && ai_usage?.total_spent !== null
            ? `$${Number(ai_usage.total_spent).toFixed(2)}`
            : '$0.00');
    const configuredLimit =
        ai_usage?.application_configured_limit_formatted ||
        `$${(quota.application_configured_limit ?? ai_usage?.budget_limit ?? 10.0).toFixed(2)}`;
    const remainingLimit =
        ai_usage?.remaining_app_limit_formatted ||
        (ai_usage?.remaining_budget !== undefined && ai_usage?.remaining_budget !== null
            ? `$${Number(ai_usage.remaining_budget).toFixed(2)}`
            : configuredLimit);
    const inputTokens =
        ai_usage?.input_tokens_formatted ||
        (ai_usage?.input_tokens ? Number(ai_usage.input_tokens).toLocaleString() : '0');
    const totalRequests =
        ai_usage?.total_requests_formatted ||
        (ai_usage?.total_requests ? Number(ai_usage.total_requests).toLocaleString() : '0');
    const creditBalance = ai_usage?.api_credit_balance_formatted || '—';
    const creditStatus = ai_usage?.credit_balance_status || 'unavailable';
    const creditMessage =
        ai_usage?.credit_balance_message || 'Unavailable through API';
    const budgetPercent = Math.min(
        100,
        Math.max(0, ai_usage?.budget_percentage ?? ai_usage?.percentage_used ?? 0),
    );

    const scrollToTelemetryOrOpen = () => {
        // Trigger the OpenAI Usage telemetry dropdown in the header
        const telemetryTrigger = document.querySelector<HTMLButtonElement>(
            '[data-telemetry-trigger="true"]',
        );

        if (telemetryTrigger) {
            telemetryTrigger.click();
            telemetryTrigger.scrollIntoView({ behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <>
            <Head title="Subscription" />

            <div className="min-h-screen bg-background pb-24 text-foreground">
                <div className="mx-auto max-w-6xl space-y-10 p-4 sm:p-6 lg:p-10">
                    {/* =========================================================
                        PAGE HEADER
                    ========================================================== */}
                    <div className="flex flex-col gap-1 border-b border-border/60 pb-6">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                Subscription
                            </h1>
                            <Badge
                                variant="outline"
                                className="border-primary/30 bg-primary/10 text-[11px] font-semibold text-primary"
                            >
                                Workspace Plan
                            </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
                            Manage your application plan and view the features and access available to your account.
                        </p>
                    </div>

                    {/* =========================================================
                        1. CURRENT PLAN HERO CARD
                    ========================================================== */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                Current Plan
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                                Account Status & Allocation
                            </span>
                        </div>

                        <Card className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/[0.03] p-6 sm:p-8 shadow-xs transition-all">
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                                <div className="space-y-3 max-w-2xl">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                                            {planName}
                                        </h2>
                                        <Badge
                                            variant="outline"
                                            className="flex items-center gap-1.5 rounded-full border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                                        >
                                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                            {planStatus}
                                        </Badge>
                                    </div>

                                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                        {planDescription}
                                    </p>

                                    {profile.email && (
                                        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 pt-2 text-[11px] text-muted-foreground">
                                            <div className="flex items-center gap-1.5 font-medium text-foreground">
                                                <Shield className="h-3.5 w-3.5 text-primary" />
                                                <span>Workspace Owner:</span>
                                                <span className="font-mono text-muted-foreground">{profile.email}</span>
                                            </div>
                                            {profile.member_since && (
                                                <div className="flex items-center gap-1">
                                                    <span>• Member since</span>
                                                    <span className="font-medium text-foreground">{profile.member_since}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-4 border-t border-border/60 pt-4 lg:border-t-0 lg:pt-0">
                                    <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-left lg:text-right">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Workspace Tier
                                        </div>
                                        <div className="text-sm font-bold text-foreground">
                                            Full Capabilities
                                        </div>
                                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                            All 8 Modules Active
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* =========================================================
                        2. PLAN FEATURES & 3. ACCESS CAPABILITIES
                    ========================================================== */}
                    <div className="grid gap-8 lg:grid-cols-12">
                        {/* Plan Features (7 cols) */}
                        <div className="space-y-4 lg:col-span-7">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Plan Features
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                    Verified Capabilities ({features.length})
                                </span>
                            </div>

                            <Card className="rounded-3xl border-border/80 bg-card p-6 shadow-xs space-y-4">
                                <p className="text-xs text-muted-foreground">
                                    The following verified features are fully active and included in your workspace plan:
                                </p>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    {features.map((feature, index) => {
                                        const Icon = feature.icon;

                                        return (
                                            <div
                                                key={index}
                                                className="group relative flex flex-col justify-between rounded-2xl border border-border/60 bg-muted/15 p-4 transition-all duration-200 hover:border-primary/40 hover:bg-muted/30 hover:shadow-xs"
                                            >
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                                                            <Icon className="h-4 w-4" />
                                                        </div>
                                                        {feature.tag && (
                                                            <span className="rounded-md border border-border/50 bg-background/60 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                                                                {feature.tag}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h4 className="text-xs font-bold text-foreground">
                                                        {feature.title}
                                                    </h4>

                                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                        {feature.description}
                                                    </p>
                                                </div>

                                                <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-border/30 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                                    <Check className="h-3 w-3 stroke-[3]" />
                                                    <span>Included in plan</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        </div>

                        {/* Access & Capabilities (5 cols) */}
                        <div className="space-y-4 lg:col-span-5">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Access & Capabilities
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                    Status Matrix
                                </span>
                            </div>

                            <Card className="rounded-3xl border-border/80 bg-card p-6 shadow-xs space-y-4">
                                <p className="text-xs text-muted-foreground">
                                    System permission and capability status across your workspace modules:
                                </p>

                                <div className="space-y-2.5">
                                    {capabilities.map((cap, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/15 p-3.5 transition-all hover:bg-muted/30"
                                        >
                                            <div className="space-y-0.5">
                                                <div className="text-xs font-semibold text-foreground">
                                                    {cap.name}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    {cap.description}
                                                </div>
                                            </div>

                                            <Badge
                                                variant="outline"
                                                className="shrink-0 flex items-center gap-1 rounded-full border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
                                            >
                                                <Check className="h-3 w-3 stroke-[3]" />
                                                {cap.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>

                                <div className="rounded-2xl border border-border/60 bg-muted/25 p-4 text-[11px] text-muted-foreground space-y-1.5">
                                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                                        <ShieldCheck className="h-4 w-4 text-primary" />
                                        <span>Full Account Provisioning</span>
                                    </div>
                                    <p className="leading-relaxed">
                                        All features and marketing studio tools are provisioned without restrictions for your account.
                                    </p>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* =========================================================
                        4. USAGE & LIMITS (OPENAI INFRASTRUCTURE)
                    ========================================================== */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Usage & Limits
                                </span>
                                <Badge
                                    variant="outline"
                                    className="border-border/60 bg-muted/40 text-[10px] font-medium text-muted-foreground"
                                >
                                    OpenAI Infrastructure
                                </Badge>
                            </div>
                            <span className="text-[11px] text-muted-foreground">
                                Authoritative Telemetry
                            </span>
                        </div>

                        <Card className="rounded-3xl border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
                                <div>
                                    <h3 className="text-base font-bold text-foreground">
                                        OpenAI Infrastructure Usage Overview
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Organization-level API consumption measured against the Application Configured Limit.
                                    </p>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={scrollToTelemetryOrOpen}
                                    className="h-9 gap-1.5 rounded-xl border-border text-xs font-semibold shadow-xs hover:border-primary/40 hover:text-primary transition-all"
                                >
                                    <Activity className="h-3.5 w-3.5 text-primary" />
                                    <span>View OpenAI Usage & Billing</span>
                                    <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                                </Button>
                            </div>

                            {/* Key Telemetry Metric Grid */}
                            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
                                {/* OpenAI API Spend */}
                                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-1.5 transition-all hover:bg-muted/30">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            OpenAI API Spend
                                        </span>
                                        <Coins className="h-3.5 w-3.5 text-primary/80" />
                                    </div>
                                    <p className="text-2xl font-black tracking-tight text-foreground">
                                        {totalSpent}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        Actual billed API usage
                                    </p>
                                </div>

                                {/* Application Configured Limit */}
                                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-1.5 transition-all hover:bg-muted/30">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            App Configured Limit
                                        </span>
                                        <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                                    </div>
                                    <p className="text-2xl font-black tracking-tight text-foreground">
                                        {configuredLimit}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        Application soft ceiling
                                    </p>
                                </div>

                                {/* Remaining App Limit */}
                                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-1.5 transition-all hover:bg-muted/30">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Remaining App Limit
                                        </span>
                                        <Zap className="h-3.5 w-3.5 text-emerald-500" />
                                    </div>
                                    <p className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                                        {remainingLimit}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        Budget headroom
                                    </p>
                                </div>

                                {/* Input Tokens */}
                                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-1.5 transition-all hover:bg-muted/30">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Input Tokens
                                        </span>
                                        <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                                    </div>
                                    <p className="text-2xl font-black tracking-tight text-foreground">
                                        {inputTokens}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        Prompt token volume
                                    </p>
                                </div>

                                {/* Total Requests */}
                                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-1.5 transition-all hover:bg-muted/30">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Total Requests
                                        </span>
                                        <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                                    </div>
                                    <p className="text-2xl font-black tracking-tight text-foreground">
                                        {totalRequests}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        API calls recorded
                                    </p>
                                </div>
                            </div>

                            {/* Progress Indicator */}
                            <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/15 p-4">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-medium text-muted-foreground">
                                        Application Limit Consumption:
                                    </span>
                                    <span className="font-bold text-foreground">
                                        {budgetPercent.toFixed(1)}% ({totalSpent} of {configuredLimit})
                                    </span>
                                </div>
                                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/60">
                                    <div
                                        className="h-full rounded-full bg-primary transition-all duration-500"
                                        style={{ width: `${budgetPercent}%` }}
                                    />
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* =========================================================
                        5. OPENAI API CREDIT BALANCE
                    ========================================================== */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                OpenAI API Credit Balance
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                                Independent OpenAI Grant Metric
                            </span>
                        </div>

                        <Card className="rounded-3xl border-border/80 bg-card p-6 sm:p-7 shadow-xs">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                <div className="space-y-1.5 max-w-xl">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-foreground">
                                            OpenAI Organization Prepaid Balance
                                        </h3>
                                        <Badge
                                            variant="outline"
                                            className={
                                                creditStatus === 'live'
                                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400'
                                                    : 'border-muted-foreground/30 bg-muted/50 text-[10px] font-medium text-muted-foreground'
                                            }
                                        >
                                            {creditStatus === 'live' ? 'Live Balance' : 'Unavailable through API'}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Independent prepaid grant balance reported by OpenAI. This balance is separate from the application soft limit.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                                            {creditBalance}
                                        </div>
                                        <div className="text-[11px] text-muted-foreground">
                                            {creditMessage}
                                        </div>
                                    </div>

                                    <Button
                                        asChild
                                        variant="outline"
                                        size="sm"
                                        className="h-9 gap-1.5 rounded-xl border-border bg-background text-xs font-semibold shadow-xs hover:border-primary/40 hover:text-primary transition-all shrink-0"
                                    >
                                        <a
                                            href="https://platform.openai.com/settings/organization/billing/overview"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <span>View OpenAI Billing Dashboard</span>
                                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* =========================================================
                        6. IMPORTANT INFORMATION NOTICE
                    ========================================================== */}
                    <Card className="rounded-3xl border border-border/80 bg-muted/20 p-6 shadow-xs">
                        <div className="flex items-start gap-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Info className="h-4.5 w-4.5" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                                    Important Architecture Information
                                </h3>
                                <div className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
                                    <p>
                                        Your application subscription determines your access to system features and capabilities.
                                    </p>
                                    <p>
                                        OpenAI API usage is organization-level infrastructure usage and is tracked separately from your application subscription.
                                    </p>
                                    <p>
                                        The <strong className="text-foreground">Application Configured Limit</strong> is an application-level threshold and is not the same as your <strong className="text-foreground">OpenAI API credit balance</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* =========================================================
                        7. WORKSPACE INQUIRIES / SUPPORT
                    ========================================================== */}
                    <Card className="rounded-3xl border border-border/70 bg-card p-6 shadow-xs">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1 max-w-xl">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                                    Need Higher Volume or Custom Quota?
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    For higher generation volume, custom dedicated rate limits, or additional marketing workflows, reach out to your workspace administrator.
                                </p>
                            </div>

                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="h-9 gap-1.5 rounded-xl border-border bg-background text-xs font-semibold shadow-xs hover:border-primary/40 hover:text-primary transition-all shrink-0"
                            >
                                <a href="mailto:support@marketpilot.ai?subject=Application%20Quota%20Inquiry">
                                    <Mail className="h-3.5 w-3.5 text-primary" />
                                    <span>Contact Administrator</span>
                                </a>
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
}

SubscriptionsIndexPage.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Subscriptions & Quota',
            href: '/subscriptions',
        },
    ],
};
