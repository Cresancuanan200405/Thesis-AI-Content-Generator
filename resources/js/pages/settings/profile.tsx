import { Form, Head, Link, usePage } from '@inertiajs/react';
import {
    Calendar,
    CheckCircle2,
    Clock,
    Lock,
    Mail,
    Shield,
    Sparkles,
    Trash2,
    User as UserIcon,
} from 'lucide-react';
import { useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;

    const initials = user.name
        ? user.name
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
        : 'U';

    const providerName = (user as any).provider_name
        ? (user as any).provider_name.charAt(0).toUpperCase() + (user as any).provider_name.slice(1)
        : 'Email & Password';

    return (
        <>
            <Head title="Profile Settings" />

            <div className="space-y-6 max-w-4xl">
                {/* Section Header */}
                <div className="border-b border-border/70 pb-4">
                    <h1 className="text-xl font-bold text-foreground">
                        Profile & Account Settings
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Manage your personal account credentials, email verification, and security.
                    </p>
                </div>

                {/* Profile Overview Banner */}
                <Card className="rounded-2xl border-border bg-card p-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-lg font-bold shadow-xs">
                                {initials}
                            </div>

                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-base font-bold text-foreground">
                                        {user.name}
                                    </h2>
                                    {user.email_verified_at ? (
                                        <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 font-semibold gap-1 py-0">
                                            <CheckCircle2 className="h-2.5 w-2.5" />
                                            Verified
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 font-semibold py-0">
                                            Unverified
                                        </Badge>
                                    )}
                                    <Badge variant="secondary" className="text-[10px] py-0">
                                        {providerName}
                                    </Badge>
                                </div>

                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <Mail className="h-3 w-3" />
                                    {user.email}
                                </p>
                            </div>
                        </div>

                        <Button asChild variant="outline" size="sm" className="text-xs font-semibold shadow-none self-start sm:self-center">
                            <Link href="/profile">
                                View My Profile →
                            </Link>
                        </Button>
                    </div>
                </Card>

                {/* Edit Personal Information Form */}
                <Card className="rounded-2xl border-border bg-card shadow-xs">
                    <CardHeader className="p-5 pb-3 border-b border-border/60">
                        <CardTitle className="text-sm font-bold text-foreground">
                            Personal Information
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="p-5">
                        <Form
                            {...ProfileController.update.form()}
                            options={{
                                preserveScroll: true,
                            }}
                            className="space-y-4"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="name" className="text-xs font-medium">
                                            Full Name
                                        </Label>
                                        <Input
                                            id="name"
                                            defaultValue={user.name}
                                            name="name"
                                            required
                                            autoComplete="name"
                                            placeholder="Your full name"
                                            className="h-9 text-xs max-w-lg"
                                        />
                                        <InputError message={errors.name} className="text-xs" />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="email" className="text-xs font-medium">
                                            Email Address
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            defaultValue={user.email}
                                            name="email"
                                            required
                                            autoComplete="username"
                                            placeholder="you@example.com"
                                            className="h-9 text-xs max-w-lg"
                                        />
                                        <InputError message={errors.email} className="text-xs" />
                                    </div>

                                    {mustVerifyEmail && user.email_verified_at === null && (
                                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 max-w-lg">
                                            <p className="text-xs text-amber-800 dark:text-amber-300">
                                                Your email address is unverified.{' '}
                                                <Link
                                                    href={send()}
                                                    as="button"
                                                    className="font-semibold underline underline-offset-2 hover:text-foreground transition-colors"
                                                >
                                                    Click here to re-send verification link.
                                                </Link>
                                            </p>

                                            {status === 'verification-link-sent' && (
                                                <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                                    A new verification email has been sent.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div className="pt-2">
                                        <Button
                                            type="submit"
                                            size="sm"
                                            disabled={processing}
                                            data-test="update-profile-button"
                                            className="text-xs font-semibold shadow-xs"
                                        >
                                            {processing ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </CardContent>
                </Card>

                {/* Account Security Quick Links */}
                <Card className="rounded-2xl border-border bg-card shadow-xs p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-foreground">
                                Password & Security
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Update your password and manage two-factor authentication.
                            </p>
                        </div>

                        <Button asChild variant="outline" size="sm" className="text-xs shadow-none">
                            <Link href="/settings/security">
                                Security Settings →
                            </Link>
                        </Button>
                    </div>
                </Card>

                {/* Danger Zone: Account Deletion */}
                <div className="pt-2">
                    <DeleteUser />
                </div>
            </div>
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
