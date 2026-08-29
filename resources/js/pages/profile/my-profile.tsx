import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    Calendar,
    CheckCircle2,
    CreditCard,
    Mail,
    Settings,
    Shield,
} from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface MyProfileProps {
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
    };
    stats?: {
        products_count?: number;
        campaigns_count?: number;
        designs_count?: number;
    };
}

export default function MyProfilePage({
    profile = {},
    business = {},
    stats = {},
}: MyProfileProps) {
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
                <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-8">
                    {/* Header Banner */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                My Profile
                            </h1>
                            <p className="text-xs text-muted-foreground sm:text-sm">
                                Overview of your personal account credentials, workspace role, and commercial profile.
                            </p>
                        </div>
                    </div>

                    {/* Profile Overview Hero Card */}
                    <Card className="overflow-hidden rounded-3xl border-border/80 bg-card p-6 shadow-xs md:p-8">
                        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-primary text-2xl font-black text-primary-foreground shadow-md ring-4 ring-primary/10">
                                    {initials}
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                                            {profile.name}
                                        </h2>

                                        <Badge
                                            variant="secondary"
                                            className="border-border/60 bg-muted text-xs font-semibold"
                                        >
                                            {profile.role || 'Workspace Owner'}
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
                                                className="border-amber-500/30 bg-amber-500/10 text-xs font-semibold text-amber-600 dark:text-amber-400"
                                            >
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
                                            <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                                            Auth: {profile.provider || 'Password'}
                                        </span>

                                        {profile.member_since && (
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                Member since {profile.member_since}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Quick Navigation Cards (3 Columns) */}
                    <div className="grid gap-5 md:grid-cols-3">
                        {/* 1. Account Settings Card */}
                        <Link
                            href="/settings/profile"
                            className="group flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 shadow-xs transition-all hover:border-primary/50 hover:shadow-md"
                        >
                            <div className="space-y-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
                                    <Settings className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-foreground">
                                        Account Settings
                                    </h3>
                                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                                        Manage your personal credentials, appearance theme, password, 2FA, and active sessions.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-primary">
                                <span>Manage Settings</span>
                                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                            </div>
                        </Link>

                        {/* 2. Business Profile Card */}
                        <Link
                            href="/profile/business"
                            className="group flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 shadow-xs transition-all hover:border-primary/50 hover:shadow-md"
                        >
                            <div className="space-y-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 transition-transform group-hover:scale-105">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-foreground">
                                        Business Profile
                                    </h3>
                                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                                        Update your business name, commercial description, and industry art direction context.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 flex items-center justify-between text-xs font-semibold text-blue-600">
                                <span>{business.name || 'Configure Business'}</span>
                                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                            </div>
                        </Link>

                        {/* 3. Subscriptions & Quota Card */}
                        <Link
                            href="/subscriptions"
                            className="group flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 shadow-xs transition-all hover:border-primary/50 hover:shadow-md"
                        >
                            <div className="space-y-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 transition-transform group-hover:scale-105">
                                    <CreditCard className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-foreground">
                                        Subscriptions & Tier
                                    </h3>
                                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                                        View your active workspace tier, AI generation quota, and studio feature capabilities.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                                <span>View Plan Details</span>
                                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                            </div>
                        </Link>
                    </div>

                    {/* Commercial Context Summary Strip */}
                    <Card className="rounded-3xl border-border/80 bg-card/60 p-6 shadow-xs">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-foreground">
                                        Active Business Context
                                    </h3>
                                    <Badge
                                        variant="outline"
                                        className="border-primary/30 bg-primary/10 text-[10px] font-semibold text-primary"
                                    >
                                        Persistent Context
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    <span className="font-semibold text-foreground">{business.name || 'Not configured'}</span>
                                    {business.industry && (
                                        <span> • {business.industry} ({business.category || 'General'})</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
}

MyProfilePage.layout = {
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

