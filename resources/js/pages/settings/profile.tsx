import { Form, Head, Link, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    Laptop,
    Mail,
    Monitor,
    Moon,
    ShieldAlert,
    Sun,
    User as UserIcon,
} from 'lucide-react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

export default function ProfileAndPreferencesSettings({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;
    const { appearance, updateAppearance } = useAppearance();

    const providerName = (user as any).provider_name
        ? (user as any).provider_name.charAt(0).toUpperCase() +
          (user as any).provider_name.slice(1)
        : 'Email & Password';

    return (
        <>
            <Head title="Profile & Preferences" />

            <div className="space-y-8">
                {/* 1. Personal Information Card */}
                <Card className="rounded-3xl border-border/80 bg-card shadow-xs">
                    <CardHeader className="border-b border-border/60 p-6 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <CardTitle className="text-base font-bold text-foreground">
                                    Personal Information
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    Update your personal name and primary account contact email.
                                </p>
                            </div>
                            <Badge
                                variant="secondary"
                                className="text-[11px] font-medium"
                            >
                                {providerName}
                            </Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="p-6">
                        <Form
                            {...ProfileController.update.form()}
                            options={{
                                preserveScroll: true,
                            }}
                            className="space-y-5"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="name"
                                            className="text-xs font-bold text-foreground"
                                        >
                                            Full Name
                                        </Label>
                                        <Input
                                            id="name"
                                            defaultValue={user.name}
                                            name="name"
                                            required
                                            autoComplete="name"
                                            placeholder="Your full name"
                                            className="h-11 rounded-xl text-sm"
                                        />
                                        <InputError
                                            message={errors.name}
                                            className="text-xs font-semibold text-destructive"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label
                                                htmlFor="email"
                                                className="text-xs font-bold text-foreground"
                                            >
                                                Email Address
                                            </Label>
                                            {user.email_verified_at ? (
                                                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Verified
                                                </span>
                                            ) : (
                                                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                                    Unverified
                                                </span>
                                            )}
                                        </div>
                                        <Input
                                            id="email"
                                            type="email"
                                            defaultValue={user.email}
                                            name="email"
                                            required
                                            autoComplete="username"
                                            placeholder="you@example.com"
                                            className="h-11 rounded-xl text-sm"
                                        />
                                        <InputError
                                            message={errors.email}
                                            className="text-xs font-semibold text-destructive"
                                        />
                                    </div>

                                    {mustVerifyEmail && user.email_verified_at === null && (
                                        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs">
                                            <p className="text-amber-800 dark:text-amber-300">
                                                Your email address is currently unverified.{' '}
                                                <Link
                                                    href={send()}
                                                    as="button"
                                                    className="font-bold underline underline-offset-2 hover:text-foreground"
                                                >
                                                    Click here to re-send verification link.
                                                </Link>
                                            </p>

                                            {status === 'verification-link-sent' && (
                                                <p className="mt-2 font-medium text-emerald-600 dark:text-emerald-400">
                                                    A new verification link has been sent to your email address.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex justify-end pt-2">
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            data-test="update-profile-button"
                                            className="h-10 min-w-32 rounded-xl px-5 text-xs font-bold shadow-xs"
                                        >
                                            {processing ? 'Saving...' : 'Save Profile'}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </CardContent>
                </Card>

                {/* 2. Application Preferences (Theme & Appearance) */}
                <Card className="rounded-3xl border-border/80 bg-card shadow-xs">
                    <CardHeader className="border-b border-border/60 p-6 pb-4">
                        <CardTitle className="text-base font-bold text-foreground">
                            Application Appearance
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                            Choose how the studio interface appears across your browser sessions.
                        </p>
                    </CardHeader>

                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <button
                                type="button"
                                onClick={() => updateAppearance('light')}
                                className={cn(
                                    'flex flex-col items-center justify-between gap-3 rounded-2xl border p-4 text-center transition-all',
                                    appearance === 'light'
                                        ? 'border-primary bg-primary/5 text-primary shadow-xs ring-2 ring-primary/20'
                                        : 'border-border/80 bg-card hover:bg-muted text-muted-foreground'
                                )}
                            >
                                <Sun className="h-6 w-6" />
                                <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-foreground">Light Mode</p>
                                    <p className="text-[11px] text-muted-foreground">Bright, clean theme</p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => updateAppearance('dark')}
                                className={cn(
                                    'flex flex-col items-center justify-between gap-3 rounded-2xl border p-4 text-center transition-all',
                                    appearance === 'dark'
                                        ? 'border-primary bg-primary/5 text-primary shadow-xs ring-2 ring-primary/20'
                                        : 'border-border/80 bg-card hover:bg-muted text-muted-foreground'
                                )}
                            >
                                <Moon className="h-6 w-6" />
                                <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-foreground">Dark Mode</p>
                                    <p className="text-[11px] text-muted-foreground">Sleek, low-glare theme</p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => updateAppearance('system')}
                                className={cn(
                                    'flex flex-col items-center justify-between gap-3 rounded-2xl border p-4 text-center transition-all',
                                    appearance === 'system'
                                        ? 'border-primary bg-primary/5 text-primary shadow-xs ring-2 ring-primary/20'
                                        : 'border-border/80 bg-card hover:bg-muted text-muted-foreground'
                                )}
                            >
                                <Monitor className="h-6 w-6" />
                                <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-foreground">System Match</p>
                                    <p className="text-[11px] text-muted-foreground">Syncs with OS theme</p>
                                </div>
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Danger Zone Card */}
                <div className="pt-2">
                    <DeleteUser />
                </div>
            </div>
        </>
    );
}

ProfileAndPreferencesSettings.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Account Settings',
            href: edit(),
        },
    ],
};
