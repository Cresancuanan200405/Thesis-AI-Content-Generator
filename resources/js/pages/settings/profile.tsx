import { Form, Head, Link, usePage } from '@inertiajs/react';
import { CheckCircle2, Mail } from 'lucide-react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
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
        ? (user as any).provider_name.charAt(0).toUpperCase() +
          (user as any).provider_name.slice(1)
        : 'Email & Password';

    return (
        <>
            <Head title="Profile Settings" />

            <div className="max-w-4xl space-y-6">
                {/* Section Header */}
                <div className="border-b border-border/70 pb-4">
                    <h1 className="text-xl font-bold text-foreground">
                        Profile & Account Settings
                    </h1>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Manage your personal account credentials, email
                        verification, and security.
                    </p>
                </div>

                {/* Profile Overview Banner */}
                <Card className="rounded-2xl border-border bg-card p-5 shadow-xs">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-xs">
                                {initials}
                            </div>

                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-base font-bold text-foreground">
                                        {user.name}
                                    </h2>
                                    {user.email_verified_at ? (
                                        <Badge
                                            variant="outline"
                                            className="gap-1 border-emerald-500/30 bg-emerald-500/10 py-0 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
                                        >
                                            <CheckCircle2 className="h-2.5 w-2.5" />
                                            Verified
                                        </Badge>
                                    ) : (
                                        <Badge
                                            variant="outline"
                                            className="border-amber-500/30 bg-amber-500/10 py-0 text-[10px] font-semibold text-amber-600 dark:text-amber-400"
                                        >
                                            Unverified
                                        </Badge>
                                    )}
                                    <Badge
                                        variant="secondary"
                                        className="py-0 text-[10px]"
                                    >
                                        {providerName}
                                    </Badge>
                                </div>

                                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Mail className="h-3 w-3" />
                                    {user.email}
                                </p>
                            </div>
                        </div>

                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="self-start text-xs font-semibold shadow-none sm:self-center"
                        >
                            <Link href="/profile">View My Profile →</Link>
                        </Button>
                    </div>
                </Card>

                {/* Edit Personal Information Form */}
                <Card className="rounded-2xl border-border bg-card shadow-xs">
                    <CardHeader className="border-b border-border/60 p-5 pb-3">
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
                                        <Label
                                            htmlFor="name"
                                            className="text-xs font-medium"
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
                                            className="h-9 max-w-lg text-xs"
                                        />
                                        <InputError
                                            message={errors.name}
                                            className="text-xs"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="email"
                                            className="text-xs font-medium"
                                        >
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
                                            className="h-9 max-w-lg text-xs"
                                        />
                                        <InputError
                                            message={errors.email}
                                            className="text-xs"
                                        />
                                    </div>

                                    {mustVerifyEmail &&
                                        user.email_verified_at === null && (
                                            <div className="max-w-lg rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                                                <p className="text-xs text-amber-800 dark:text-amber-300">
                                                    Your email address is
                                                    unverified.{' '}
                                                    <Link
                                                        href={send()}
                                                        as="button"
                                                        className="font-semibold underline underline-offset-2 transition-colors hover:text-foreground"
                                                    >
                                                        Click here to re-send
                                                        verification link.
                                                    </Link>
                                                </p>

                                                {status ===
                                                    'verification-link-sent' && (
                                                    <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                                        A new verification email
                                                        has been sent.
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
                                            {processing
                                                ? 'Saving...'
                                                : 'Save Changes'}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </CardContent>
                </Card>

                {/* Account Security Quick Links */}
                <Card className="space-y-3 rounded-2xl border-border bg-card p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-foreground">
                                Password & Security
                            </h3>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Update your password and manage two-factor
                                authentication.
                            </p>
                        </div>

                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="text-xs shadow-none"
                        >
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
