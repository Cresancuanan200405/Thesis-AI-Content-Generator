import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    ChevronRight,
    Globe,
    Laptop,
    Loader2,
    LogOut,
    Mail,
    Monitor,
    Moon,
    Shield,
    ShieldCheck,
    Smartphone,
    Sun,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

import { ChangeEmailModal } from '@/components/change-email-modal';
import { ChangeGoogleAccountModal } from '@/components/change-google-account-modal';
import { ChangePasswordDialog } from '@/components/change-password-dialog';
import DeleteUser from '@/components/delete-user';
import ManageTwoFactor from '@/components/manage-two-factor';
import PageHeader from '@/components/page-header';
import PasswordInput from '@/components/password-input';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

import { Label } from '@/components/ui/label';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { send } from '@/routes/verification';
import type { Auth, BreadcrumbItem } from '@/types';

interface SessionItem {
    id: string;
    ip_address?: string;
    is_current_device: boolean;
    platform: string;
    browser: string;
    is_desktop: boolean;
    last_active: string;
}

interface AccountSettingsProps {
    mustVerifyEmail: boolean;
    status?: string;
    hasPassword?: boolean;
    providerName?: string | null;
    isIdentityVerified?: boolean;
    isGoogleChangeAuthorized?: boolean;
    twoFactorEnabled?: boolean;
    canManageTwoFactor?: boolean;
    requiresConfirmation?: boolean;
    passwordRules?: string;
    sessions?: SessionItem[];
    hasPendingEmailChange?: boolean;
    pendingEmail?: string | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Settings',
        href: '/settings/profile',
    },
    {
        title: 'Account Settings',
        href: '/settings/profile',
    },
];

export default function AccountSettingsPage({
    mustVerifyEmail,
    status,
    hasPassword = true,
    providerName: _providerName,
    isIdentityVerified = false,
    isGoogleChangeAuthorized = false,
    twoFactorEnabled = false,
    canManageTwoFactor = false,
    requiresConfirmation = false,
    passwordRules = '',
    sessions = [],
    hasPendingEmailChange = false,
    pendingEmail = null,
}: AccountSettingsProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth.user;

    const { appearance, updateAppearance } = useAppearance();

    const isGoogle = (user as any).provider_name?.toLowerCase() === 'google';

    const isEmailVerified = Boolean(user.email_verified_at);

    const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const [logoutPassword, setLogoutPassword] = useState('');
    const [logoutPasswordError, setLogoutPasswordError] = useState('');
    const [isLoggingOutOthers, setIsLoggingOutOthers] = useState(false);

    const [isTwoFactorModalOpen, setIsTwoFactorModalOpen] = useState(false);

    const handleLogoutOtherSessions = (e: React.FormEvent) => {
        e.preventDefault();

        if (!logoutPassword) {
            setLogoutPasswordError('Please enter your current password.');

            return;
        }

        setIsLoggingOutOthers(true);
        setLogoutPasswordError('');

        router.delete('/settings/sessions', {
            data: {
                password: logoutPassword,
            },
            preserveScroll: true,

            onSuccess: () => {
                setIsLoggingOutOthers(false);
                setIsLogoutModalOpen(false);
                setIsSessionsModalOpen(false);
                setLogoutPassword('');

                toast.success('Logged out of all other browser sessions.');
            },

            onError: (errors) => {
                setIsLoggingOutOthers(false);

                if (errors.password) {
                    setLogoutPasswordError(errors.password);
                } else {
                    toast.error(
                        'Could not log out other sessions. Please check your password.',
                    );
                }
            },
        });
    };

    return (
        <>
            <Head title="Account Settings" />

            <div className="mx-auto w-full max-w-5xl space-y-8 pb-10">
                {/* =========================================================
                    HEADER
                ========================================================== */}
                <PageHeader
                    title="Account Settings"
                    description="Manage your account, security, and MarketPilot preferences."
                />

                {/* =========================================================
                    PENDING EMAIL VERIFICATION
                ========================================================== */}
                {hasPendingEmailChange && (
                    <div className="overflow-hidden rounded-2xl border border-amber-500/25 bg-amber-500/[0.06]">
                        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-start gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    <Mail className="h-4 w-4" />
                                </div>

                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-semibold text-foreground">
                                            Email change pending
                                        </p>

                                        <Badge
                                            variant="outline"
                                            className="border-amber-500/25 bg-amber-500/10 text-[10px] font-semibold text-amber-700 dark:text-amber-300"
                                        >
                                            Verification required
                                        </Badge>
                                    </div>

                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                        A verification code was sent to{' '}
                                        <span className="font-semibold text-foreground">
                                            {pendingEmail}
                                        </span>
                                        . Your current email remains active
                                        until verification is completed.
                                    </p>
                                </div>
                            </div>

                            <ChangeEmailModal
                                currentEmail={user.email}
                                hasPassword={hasPassword}
                                twoFactorEnabled={twoFactorEnabled}
                                isGoogle={isGoogle}
                                hasPendingChange={true}
                                pendingEmail={pendingEmail}
                                trigger={
                                    <Button
                                        size="sm"
                                        className="h-9 shrink-0 rounded-xl px-4 text-xs font-semibold"
                                    >
                                        Resume verification
                                        <ChevronRight className="ml-1 h-3.5 w-3.5" />
                                    </Button>
                                }
                            />
                        </div>
                    </div>
                )}

                {/* =========================================================
                    ACCOUNT
                ========================================================== */}
                <SettingsSection
                    title="Account"
                    description="Manage your account identity and authentication methods."
                >
                    <Card className="overflow-hidden rounded-2xl border-border/70 bg-card shadow-xs">
                        <CardContent className="p-0">
                            {/* EMAIL */}
                            <SettingsRow
                                icon={<Mail className="h-4 w-4" />}
                                title="Email address"
                                description={
                                    isEmailVerified
                                        ? 'Your primary email address for MarketPilot.'
                                        : 'Verify your email address to keep your account secure.'
                                }
                                action={
                                    <ChangeEmailModal
                                        currentEmail={user.email}
                                        hasPassword={hasPassword}
                                        twoFactorEnabled={twoFactorEnabled}
                                        isGoogle={isGoogle}
                                        isIdentityVerified={isIdentityVerified}
                                        hasPendingChange={hasPendingEmailChange}
                                        pendingEmail={pendingEmail}
                                    />
                                }
                            >
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-semibold break-all text-foreground">
                                        {user.email}
                                    </span>

                                    {isGoogle && (
                                        <Badge
                                            variant="outline"
                                            className="border-blue-500/25 bg-blue-500/10 text-[10px] font-semibold text-blue-600 dark:text-blue-400"
                                        >
                                            Google
                                        </Badge>
                                    )}

                                    {isEmailVerified ? (
                                        <Badge
                                            variant="outline"
                                            className="border-emerald-500/25 bg-emerald-500/10 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
                                        >
                                            <CheckCircle2 className="mr-1 h-3 w-3" />
                                            Verified
                                        </Badge>
                                    ) : (
                                        <Badge
                                            variant="outline"
                                            className="border-amber-500/25 bg-amber-500/10 text-[10px] font-semibold text-amber-600 dark:text-amber-400"
                                        >
                                            <AlertCircle className="mr-1 h-3 w-3" />
                                            Not verified
                                        </Badge>
                                    )}
                                </div>

                                {!isEmailVerified && mustVerifyEmail && (
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <Link
                                            href={send()}
                                            method="post"
                                            as="button"
                                            className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
                                        >
                                            Resend verification
                                        </Link>

                                        {status ===
                                            'verification-link-sent' && (
                                            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                                Verification link sent.
                                            </span>
                                        )}
                                    </div>
                                )}
                            </SettingsRow>

                            {/* GOOGLE */}
                            {isGoogle && (
                                <SettingsRow
                                    icon={<Globe className="h-4 w-4" />}
                                    title="Connected Google account"
                                    description="Manage the Google account linked to your MarketPilot account."
                                    action={
                                        <ChangeGoogleAccountModal
                                            isGoogle={isGoogle}
                                            currentEmail={user.email}
                                            hasPassword={hasPassword}
                                            isAuthorized={
                                                isGoogleChangeAuthorized
                                            }
                                        />
                                    }
                                >
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-semibold text-foreground">
                                            {user.email}
                                        </span>

                                        <Badge
                                            variant="outline"
                                            className="border-blue-500/25 bg-blue-500/10 text-[10px] font-semibold text-blue-600 dark:text-blue-400"
                                        >
                                            Active login
                                        </Badge>
                                    </div>
                                </SettingsRow>
                            )}

                            {/* PASSWORD */}
                            <SettingsRow
                                icon={<Shield className="h-4 w-4" />}
                                title="Password"
                                description={
                                    hasPassword
                                        ? 'Use a strong password to protect your MarketPilot account.'
                                        : 'Set a password so you can also sign in with email.'
                                }
                                action={
                                    <ChangePasswordDialog
                                        passwordRules={passwordRules}
                                        hasPassword={hasPassword}
                                    />
                                }
                            >
                                {hasPassword ? (
                                    <span className="font-mono text-sm font-bold tracking-[0.22em] text-foreground">
                                        ••••••••••••
                                    </span>
                                ) : (
                                    <Badge
                                        variant="secondary"
                                        className="text-[10px] font-medium"
                                    >
                                        No password set
                                    </Badge>
                                )}
                            </SettingsRow>
                        </CardContent>
                    </Card>
                </SettingsSection>

                {/* =========================================================
                    SECURITY
                ========================================================== */}
                <SettingsSection
                    title="Security"
                    description="Protect your account and manage signed-in devices."
                >
                    <Card className="overflow-hidden rounded-2xl border-border/70 bg-card shadow-xs">
                        <CardContent className="p-0">
                            {/* TWO FACTOR */}
                            <SettingsRow
                                icon={<ShieldCheck className="h-4 w-4" />}
                                title="Two-factor authentication"
                                description="Add an extra verification step using an authenticator app."
                                action={
                                    <Dialog
                                        open={isTwoFactorModalOpen}
                                        onOpenChange={setIsTwoFactorModalOpen}
                                    >
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-9 rounded-xl border-border/80 px-4 text-xs font-semibold shadow-xs hover:bg-muted"
                                            >
                                                {twoFactorEnabled
                                                    ? 'Manage 2FA'
                                                    : 'Enable 2FA'}
                                                <ChevronRight className="ml-1 h-3.5 w-3.5" />
                                            </Button>
                                        </DialogTrigger>

                                        <DialogContent className="rounded-2xl p-6 sm:max-w-lg">
                                            <DialogHeader>
                                                <DialogTitle className="text-lg font-bold">
                                                    Two-Factor Authentication
                                                </DialogTitle>

                                                <DialogDescription className="text-xs leading-5">
                                                    Protect your account with an
                                                    additional verification code
                                                    from your authenticator app.
                                                </DialogDescription>
                                            </DialogHeader>

                                            <div className="pt-2">
                                                <ManageTwoFactor
                                                    canManageTwoFactor={
                                                        canManageTwoFactor
                                                    }
                                                    requiresConfirmation={
                                                        requiresConfirmation
                                                    }
                                                    twoFactorEnabled={
                                                        twoFactorEnabled
                                                    }
                                                />
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                }
                            >
                                {twoFactorEnabled ? (
                                    <Badge
                                        variant="outline"
                                        className="border-emerald-500/25 bg-emerald-500/10 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
                                    >
                                        <CheckCircle2 className="mr-1 h-3 w-3" />
                                        Enabled
                                    </Badge>
                                ) : (
                                    <Badge
                                        variant="secondary"
                                        className="text-[10px] font-medium"
                                    >
                                        Not enabled
                                    </Badge>
                                )}
                            </SettingsRow>

                            {/* SESSIONS */}
                            <SettingsRow
                                icon={<Laptop className="h-4 w-4" />}
                                title="Active sessions"
                                description="Review browsers and devices currently signed in to your account."
                                action={
                                    <Dialog
                                        open={isSessionsModalOpen}
                                        onOpenChange={setIsSessionsModalOpen}
                                    >
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-9 rounded-xl border-border/80 px-4 text-xs font-semibold shadow-xs hover:bg-muted"
                                            >
                                                Manage sessions
                                                <ChevronRight className="ml-1 h-3.5 w-3.5" />
                                            </Button>
                                        </DialogTrigger>

                                        <DialogContent className="rounded-2xl p-6 sm:max-w-lg">
                                            <DialogHeader>
                                                <DialogTitle className="text-lg font-bold">
                                                    Active browser sessions
                                                </DialogTitle>

                                                <DialogDescription className="text-xs leading-5">
                                                    Review devices currently
                                                    logged into your account and
                                                    terminate sessions you do
                                                    not recognize.
                                                </DialogDescription>
                                            </DialogHeader>

                                            <div className="space-y-2.5 pt-2">
                                                {sessions &&
                                                sessions.length > 0 ? (
                                                    sessions.map((session) => (
                                                        <div
                                                            key={session.id}
                                                            className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3"
                                                        >
                                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background text-muted-foreground">
                                                                {session.is_desktop ? (
                                                                    <Laptop className="h-4 w-4" />
                                                                ) : (
                                                                    <Smartphone className="h-4 w-4" />
                                                                )}
                                                            </div>

                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate text-xs font-semibold text-foreground">
                                                                    {
                                                                        session.platform
                                                                    }{' '}
                                                                    —{' '}
                                                                    {
                                                                        session.browser
                                                                    }
                                                                </p>

                                                                <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                                                                    {session.ip_address ??
                                                                        'IP unavailable'}{' '}
                                                                    • Last
                                                                    active{' '}
                                                                    {
                                                                        session.last_active
                                                                    }
                                                                </p>
                                                            </div>

                                                            {session.is_current_device && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="shrink-0 border-emerald-500/25 bg-emerald-500/10 text-[9px] font-bold text-emerald-600 dark:text-emerald-400"
                                                                >
                                                                    Current
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background text-muted-foreground">
                                                            <Laptop className="h-4 w-4" />
                                                        </div>

                                                        <div>
                                                            <p className="text-xs font-semibold text-foreground">
                                                                Current browser
                                                                session
                                                            </p>
                                                            <p className="text-[10px] text-muted-foreground">
                                                                Active device
                                                            </p>
                                                        </div>

                                                        <Badge
                                                            variant="outline"
                                                            className="ml-auto border-emerald-500/25 bg-emerald-500/10 text-[9px] font-bold text-emerald-600 dark:text-emerald-400"
                                                        >
                                                            Current
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
                                                <Dialog
                                                    open={isLogoutModalOpen}
                                                    onOpenChange={
                                                        setIsLogoutModalOpen
                                                    }
                                                >
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-9 rounded-xl border-destructive/30 text-xs font-semibold text-destructive hover:bg-destructive/10"
                                                        >
                                                            <LogOut className="mr-1.5 h-3.5 w-3.5" />
                                                            Log out other
                                                            devices
                                                        </Button>
                                                    </DialogTrigger>

                                                    <DialogContent className="rounded-2xl p-6 sm:max-w-md">
                                                        <DialogHeader>
                                                            <DialogTitle className="text-base font-bold">
                                                                Log out other
                                                                sessions
                                                            </DialogTitle>

                                                            <DialogDescription className="text-xs leading-5">
                                                                Enter your
                                                                password to sign
                                                                out of all other
                                                                active browser
                                                                sessions.
                                                            </DialogDescription>
                                                        </DialogHeader>

                                                        <form
                                                            onSubmit={
                                                                handleLogoutOtherSessions
                                                            }
                                                            className="space-y-4 pt-2"
                                                        >
                                                            <div className="space-y-1.5">
                                                                <Label
                                                                    htmlFor="logout-password"
                                                                    className="text-xs font-semibold"
                                                                >
                                                                    Current
                                                                    password
                                                                </Label>

                                                                <PasswordInput
                                                                    id="logout-password"
                                                                    value={
                                                                        logoutPassword
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setLogoutPassword(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    placeholder="Enter your password"
                                                                    className="h-10 rounded-xl text-sm"
                                                                />

                                                                {logoutPasswordError && (
                                                                    <p className="text-xs font-medium text-destructive">
                                                                        {
                                                                            logoutPasswordError
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <DialogFooter className="gap-2">
                                                                <DialogClose
                                                                    asChild
                                                                >
                                                                    <Button
                                                                        type="button"
                                                                        variant="secondary"
                                                                        className="rounded-xl text-xs font-semibold"
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                </DialogClose>

                                                                <Button
                                                                    type="submit"
                                                                    disabled={
                                                                        isLoggingOutOthers
                                                                    }
                                                                    className="rounded-xl text-xs font-semibold"
                                                                >
                                                                    {isLoggingOutOthers ? (
                                                                        <>
                                                                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                                                            Logging
                                                                            out...
                                                                        </>
                                                                    ) : (
                                                                        'Confirm & log out'
                                                                    )}
                                                                </Button>
                                                            </DialogFooter>
                                                        </form>
                                                    </DialogContent>
                                                </Dialog>

                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() =>
                                                        setIsSessionsModalOpen(
                                                            false,
                                                        )
                                                    }
                                                    className="rounded-xl text-xs font-semibold"
                                                >
                                                    Done
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                }
                            >
                                <Badge
                                    variant="outline"
                                    className="border-border/70 bg-muted/40 text-[10px] font-medium text-foreground"
                                >
                                    {sessions.length > 0
                                        ? `${sessions.length} active`
                                        : '1 active'}
                                </Badge>
                            </SettingsRow>
                        </CardContent>
                    </Card>
                </SettingsSection>

                {/* =========================================================
                    PREFERENCES
                ========================================================== */}
                <SettingsSection
                    title="Preferences"
                    description="Customize how MarketPilot looks on your device."
                >
                    <Card className="overflow-hidden rounded-2xl border-border/70 bg-card shadow-xs">
                        <CardHeader className="border-b border-border/60 px-5 py-4 sm:px-6">
                            <CardTitle className="text-sm font-bold">
                                Appearance
                            </CardTitle>

                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                Select a theme or follow your device preference.
                            </p>
                        </CardHeader>

                        <CardContent className="p-4 sm:p-5">
                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                                <AppearanceOption
                                    active={appearance === 'light'}
                                    icon={<Sun className="h-4 w-4" />}
                                    title="Light"
                                    description="Bright interface"
                                    onClick={() => updateAppearance('light')}
                                />

                                <AppearanceOption
                                    active={appearance === 'dark'}
                                    icon={<Moon className="h-4 w-4" />}
                                    title="Dark"
                                    description="Dark interface"
                                    onClick={() => updateAppearance('dark')}
                                />

                                <AppearanceOption
                                    active={appearance === 'system'}
                                    icon={<Monitor className="h-4 w-4" />}
                                    title="System"
                                    description="Use device setting"
                                    onClick={() => updateAppearance('system')}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </SettingsSection>

                {/* =========================================================
                    DANGER ZONE
                ========================================================== */}
                <SettingsSection
                    title="Danger Zone"
                    description="Permanent account actions. These actions may not be reversible."
                    danger
                >
                    <Card className="overflow-hidden rounded-2xl border-destructive/25 bg-destructive/[0.025] shadow-xs">
                        <CardHeader className="border-b border-destructive/15 px-5 py-4 sm:px-6">
                            <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 text-destructive">
                                    <AlertCircle className="h-4 w-4" />
                                </div>

                                <div>
                                    <CardTitle className="text-sm font-bold text-destructive">
                                        Delete MarketPilot account
                                    </CardTitle>

                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                        Permanently delete your account and
                                        associated workspace data. This action
                                        cannot be undone.
                                    </p>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                            <p className="max-w-xl text-xs leading-5 text-muted-foreground">
                                Make sure you have exported anything you need
                                before continuing.
                            </p>

                            <div className="shrink-0">
                                <DeleteUser />
                            </div>
                        </CardContent>
                    </Card>
                </SettingsSection>
            </div>
        </>
    );
}

/* =========================================================================
   REUSABLE SETTINGS COMPONENTS
========================================================================= */

interface SettingsSectionProps {
    title: string;
    description: string;
    children: React.ReactNode;
    danger?: boolean;
}

function SettingsSection({
    title,
    description,
    children,
    danger = false,
}: SettingsSectionProps) {
    return (
        <section className="space-y-3">
            <div className="flex flex-col gap-1 px-0.5">
                <h2
                    className={cn(
                        'text-sm font-bold tracking-tight',
                        danger ? 'text-destructive' : 'text-foreground',
                    )}
                >
                    {title}
                </h2>

                <p className="text-xs leading-5 text-muted-foreground">
                    {description}
                </p>
            </div>

            {children}
        </section>
    );
}

interface SettingsRowProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    action: React.ReactNode;
    children?: React.ReactNode;
}

function SettingsRow({
    icon,
    title,
    description,
    action,
    children,
}: SettingsRowProps) {
    return (
        <div className="group flex flex-col gap-4 p-5 transition-colors hover:bg-muted/[0.18] sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex min-w-0 flex-1 items-start gap-3.5">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/30 text-muted-foreground transition-colors group-hover:border-border group-hover:bg-muted/50 group-hover:text-foreground">
                    {icon}
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                    <div>
                        <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                            {title}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            {description}
                        </p>
                    </div>

                    {children && <div className="pt-0.5">{children}</div>}
                </div>
            </div>

            <div className="shrink-0 sm:ml-6">{action}</div>
        </div>
    );
}

interface AppearanceOptionProps {
    active: boolean;
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}

function AppearanceOption({
    active,
    icon,
    title,
    description,
    onClick,
}: AppearanceOptionProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'group flex min-h-[76px] cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-all',
                active
                    ? 'border-primary/50 bg-primary/[0.06] shadow-xs'
                    : 'border-border/70 bg-background hover:border-border hover:bg-muted/40',
            )}
        >
            <div
                className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors',
                    active
                        ? 'border-primary/20 bg-primary/10 text-primary'
                        : 'border-border/60 bg-muted/30 text-muted-foreground group-hover:text-foreground',
                )}
            >
                {icon}
            </div>

            <div className="min-w-0">
                <p
                    className={cn(
                        'text-xs font-bold',
                        active ? 'text-foreground' : 'text-foreground/90',
                    )}
                >
                    {title}
                </p>

                <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">
                    {description}
                </p>
            </div>

            <div className="ml-auto shrink-0">
                <div
                    className={cn(
                        'flex h-4 w-4 items-center justify-center rounded-full border transition-all',
                        active
                            ? 'border-primary bg-primary'
                            : 'border-border bg-background',
                    )}
                >
                    {active && (
                        <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                    )}
                </div>
            </div>
        </button>
    );
}

AccountSettingsPage.layout = {
    breadcrumbs,
};
