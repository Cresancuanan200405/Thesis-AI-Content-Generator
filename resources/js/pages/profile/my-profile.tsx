import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    CheckCircle2,
    Mail,
    MapPin,
    Phone,
    Tag,
    User as UserIcon,
} from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';

interface MyProfileProps {
    profile?: {
        id?: number;
        name?: string;
        email?: string;
        first_name?: string;
        middle_name?: string;
        last_name?: string;
        suffix?: string;
        mobile_number?: string;
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
        city_municipality?: string;
        province?: string;
    };
    stats?: {
        products_count?: number;
        campaigns_count?: number;
        designs_count?: number;
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
];

export default function MyProfilePage({
    profile = {},
    business = {},
}: MyProfileProps) {
    const initials = profile.name
        ? profile.name
              .split(' ')
              .map((n: string) => n[0])
              .filter(Boolean)
              .join('')
              .toUpperCase()
              .slice(0, 2)
        : 'MP';

    const isGoogle = profile.provider?.toLowerCase() === 'google';

    const formattedLocation = [business.city_municipality, business.province]
        .filter(Boolean)
        .join(', ');

    return (
        <>
            <Head title="My Profile" />

            <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-8">
                {/* 1. Page Header */}
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        My Profile
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Manage your personal information and view your active
                        business summary.
                    </p>
                </div>

                {/* 2. Profile Overview Header Card */}
                <Card className="overflow-hidden rounded-3xl border-border/80 bg-card p-6 shadow-xs sm:p-8">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground shadow-sm ring-4 ring-primary/10">
                                {initials}
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
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
                                            className="border-emerald-500/30 bg-emerald-500/10 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                                        >
                                            <CheckCircle2 className="mr-1 h-3 w-3" />
                                            Verified
                                        </Badge>
                                    ) : (
                                        <Badge
                                            variant="outline"
                                            className="border-amber-500/30 bg-amber-500/10 text-xs font-semibold text-amber-600 dark:text-amber-400"
                                        >
                                            Pending Verification
                                        </Badge>
                                    )}

                                    {isGoogle && (
                                        <Badge
                                            variant="outline"
                                            className="border-blue-500/30 bg-blue-500/10 text-xs font-medium text-blue-600 dark:text-blue-400"
                                        >
                                            Connected with Google
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground sm:text-sm">
                                    <span className="flex items-center gap-1.5">
                                        <Mail className="h-3.5 w-3.5 shrink-0" />
                                        {profile.email}
                                    </span>
                                    {profile.member_since && (
                                        <span>
                                            • Member since{' '}
                                            {profile.member_since}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* 3. Two-Column Information Layout */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Personal Information Overview */}
                    <Card className="rounded-3xl border-border/80 bg-card shadow-xs">
                        <CardHeader className="border-b border-border/60 p-6 pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <UserIcon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold text-foreground">
                                            Personal Information
                                        </CardTitle>
                                        <p className="text-xs text-muted-foreground">
                                            Your individual user identity
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 rounded-lg text-xs font-medium"
                                >
                                    <Link href="/settings/profile">Edit</Link>
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4 p-6">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-muted-foreground">
                                    Full Name
                                </span>
                                <p className="text-sm font-medium text-foreground">
                                    {profile.name || '—'}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-muted-foreground">
                                    Email Address
                                </span>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-foreground">
                                        {profile.email || '—'}
                                    </p>
                                    {profile.email_verified && (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-muted-foreground">
                                    Mobile Number
                                </span>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                    <p className="text-sm font-medium text-foreground">
                                        {profile.mobile_number ||
                                            'Not provided'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-muted-foreground">
                                    Authentication Method
                                </span>
                                <p className="text-sm font-medium text-foreground">
                                    {profile.provider || 'Email & Password'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Your Business Summary */}
                    <Card className="flex flex-col justify-between rounded-3xl border-border/80 bg-card shadow-xs">
                        <div>
                            <CardHeader className="border-b border-border/60 p-6 pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                            <Building2 className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-bold text-foreground">
                                                Your Business
                                            </CardTitle>
                                            <p className="text-xs text-muted-foreground">
                                                Active marketing brand context
                                            </p>
                                        </div>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className="border-primary/30 bg-primary/10 text-[10px] font-semibold text-primary"
                                    >
                                        Active Workspace
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4 p-6">
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-muted-foreground">
                                        Business Name
                                    </span>
                                    <p className="text-sm font-bold text-foreground">
                                        {business.name || 'Not configured'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <span className="text-xs font-semibold text-muted-foreground">
                                            Industry
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                                            <p className="text-sm font-medium text-foreground">
                                                {business.industry || 'General'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <span className="text-xs font-semibold text-muted-foreground">
                                            Category
                                        </span>
                                        <p className="text-sm font-medium text-foreground">
                                            {business.category || 'General'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-muted-foreground">
                                        Location
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                        <p className="text-sm font-medium text-foreground">
                                            {formattedLocation || 'Philippines'}
                                        </p>
                                    </div>
                                </div>

                                {business.description && (
                                    <div className="space-y-1 pt-1">
                                        <span className="text-xs font-semibold text-muted-foreground">
                                            About the Brand
                                        </span>
                                        <p className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
                                            {business.description}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </div>

                        <div className="border-t border-border/60 p-6 pt-4">
                            <Button
                                asChild
                                className="w-full justify-between rounded-xl bg-foreground font-semibold text-background hover:bg-foreground/90"
                            >
                                <Link href="/profile/business">
                                    <span>View Business Profile</span>
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
}

MyProfilePage.layout = {
    breadcrumbs,
};
