import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
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

    // Active sessions management state
    const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [logoutPassword, setLogoutPassword] = useState('');
    const [logoutPasswordError, setLogoutPasswordError] = useState('');
    const [isLoggingOutOthers, setIsLoggingOutOthers] = useState(false);

    // Two-factor modal state
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
            data: { password: logoutPassword },
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
                    toast.error('Could not log out other sessions. Please check your password.');
                }
            },
        });
    };

    return (
        <>
            <Head title="Account Settings" />

            <div className="space-y-8">
                {/* 1. Page Header */}
                <PageHeader
                    title="Account Settings"
                    description="Manage your account, security, and preferences."
                    breadcrumbs={breadcrumbs}
                />

                {/* Pending Email Change Notice Banner */}
                {hasPendingEmailChange && (
                    <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300">
                                <Mail className="h-4 w-4" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                    Email Change Pending Verification
                                </p>
                                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                                    A verification code was sent to <span className="font-semibold">{pendingEmail}</span>. Your current email remains active until confirmed.
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
                                    className="h-8 shrink-0 rounded-xl bg-amber-600 px-3 text-xs font-bold text-white hover:bg-amber-700"
                                >
                                    Resume Verification
                                </Button>
                            }
                        />
                    </div>
                )}

                {/* SECTION 1: ACCOUNT */}
                <div className="space-y-3">
                    <div className="space-y-0.5">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                            Account
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Account credentials and authentication methods.
                        </p>
                    </div>

                    <Card className="rounded-3xl border-border/80 bg-card shadow-xs">
                        <CardContent className="divide-y divide-border/60 p-0">
                            {/* Email Address Row */}
                            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            Email Address
                                        </Label>
                                        {isGoogle && (
                                            <Badge
                                                variant="outline"
                                                className="border-blue-500/30 bg-blue-500/10 text-[10px] font-semibold text-blue-600 dark:text-blue-400"
                                            >
                                                Google Account
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <span className="text-sm font-bold text-foreground">
                                            {user.email}
                                        </span>

                                        {isEmailVerified ? (
                                            <Badge
                                                variant="outline"
                                                className="border-emerald-500/30 bg-emerald-500/10 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400"
                                            >
                                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                                Verified ✓
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="outline"
                                                className="border-amber-500/30 bg-amber-500/10 text-[11px] font-semibold text-amber-600 dark:text-amber-400"
                                            >
                                                <AlertCircle className="mr-1 h-3 w-3" />
                                                Email not verified
                                            </Badge>
                                        )}
                                    </div>

                                    {!isEmailVerified && mustVerifyEmail && (
                                        <div className="pt-1">
                                            <Link
                                                href={send()}
                                                method="post"
                                                as="button"
                                                className="text-xs font-semibold text-primary underline hover:text-primary/80"
                                            >
                                                Resend verification link
                                            </Link>
                                            {status === 'verification-link-sent' && (
                                                <p className="mt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                                    A new verification link has been sent to your email.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="shrink-0">
                                    <ChangeEmailModal
                                        currentEmail={user.email}
                                        hasPassword={hasPassword}
                                        twoFactorEnabled={twoFactorEnabled}
                                        isGoogle={isGoogle}
                                        hasPendingChange={hasPendingEmailChange}
                                        pendingEmail={pendingEmail}
                                    />
                                </div>
                            </div>

                            {/* Password Row */}
                            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Password
                                    </Label>
                                    <p className="font-mono text-base font-bold tracking-widest text-foreground">
                                        ••••••••••••
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Keep your MarketPilot account secure with a strong password.
                                    </p>
                                </div>

                                <div className="shrink-0">
                                    <ChangePasswordDialog
                                        passwordRules={passwordRules}
                                        hasPassword={hasPassword}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* SECTION 2: SECURITY */}
                <div className="space-y-3">
                    <div className="space-y-0.5">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                            Security
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Two-factor authentication and active device management.
                        </p>
                    </div>

                    <Card className="rounded-3xl border-border/80 bg-card shadow-xs">
                        <CardContent className="divide-y divide-border/60 p-0">
                            {/* Two-Factor Authentication Row */}
                            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            Two-Factor Authentication
                                        </Label>
                                        {twoFactorEnabled ? (
                                            <Badge
                                                variant="outline"
                                                className="border-emerald-500/30 bg-emerald-500/10 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400"
                                            >
                                                <ShieldCheck className="mr-1 h-3 w-3" />
                                                Enabled ✓
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="secondary"
                                                className="border-border/60 bg-muted text-[11px] font-medium text-muted-foreground"
                                            >
                                                Not enabled
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Add an additional layer of protection to your account using TOTP.
                                    </p>
                                </div>

                                <div className="shrink-0">
                                    <Dialog open={isTwoFactorModalOpen} onOpenChange={setIsTwoFactorModalOpen}>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-9 rounded-xl border-border/80 px-4 text-xs font-semibold shadow-xs hover:bg-muted"
                                            >
                                                <Shield className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                                                {twoFactorEnabled ? 'Manage 2FA' : 'Enable 2FA'}
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="rounded-3xl p-6 sm:max-w-lg">
                                            <DialogHeader>
                                                <DialogTitle className="text-lg font-bold text-foreground">
                                                    Two-Factor Authentication
                                                </DialogTitle>
                                                <DialogDescription className="text-xs text-muted-foreground">
                                                    Protect your account with an extra verification code from your authenticator app.
                                                </DialogDescription>
                                            </DialogHeader>

                                            <div className="pt-2">
                                                <ManageTwoFactor
                                                    canManageTwoFactor={canManageTwoFactor}
                                                    requiresConfirmation={requiresConfirmation}
                                                    twoFactorEnabled={twoFactorEnabled}
                                                />
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>

                            {/* Active Sessions Row */}
                            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            Active Sessions
                                        </Label>
                                        <Badge
                                            variant="outline"
                                            className="border-border/70 bg-muted/40 text-[11px] font-medium text-foreground"
                                        >
                                            {sessions.length > 0 ? `${sessions.length} active sessions` : '1 active session'}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Manage the devices currently signed in to your MarketPilot account.
                                    </p>
                                </div>

                                <div className="shrink-0">
                                    <Dialog open={isSessionsModalOpen} onOpenChange={setIsSessionsModalOpen}>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-9 rounded-xl border-border/80 px-4 text-xs font-semibold shadow-xs hover:bg-muted"
                                            >
                                                <Globe className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                                                Manage Sessions
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="rounded-3xl p-6 sm:max-w-lg">
                                            <DialogHeader>
                                                <DialogTitle className="text-lg font-bold text-foreground">
                                                    Active Browser Sessions
                                                </DialogTitle>
                                                <DialogDescription className="text-xs text-muted-foreground">
                                                    Review devices currently logged into your account and terminate unauthorized sessions.
                                                </DialogDescription>
                                            </DialogHeader>

                                            <div className="space-y-3 pt-2">
                                                {sessions && sessions.length > 0 ? (
                                                    sessions.map((session) => (
                                                        <div
                                                            key={session.id}
                                                            className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/30 p-3.5"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background text-muted-foreground">
                                                                    {session.is_desktop ? (
                                                                        <Laptop className="h-4 w-4" />
                                                                    ) : (
                                                                        <Smartphone className="h-4 w-4" />
                                                                    )}
                                                                </div>
                                                                <div className="space-y-0.5">
                                                                    <p className="text-xs font-bold text-foreground">
                                                                        {session.platform} — {session.browser}
                                                                    </p>
                                                                    <p className="text-[11px] text-muted-foreground">
                                                                        {session.ip_address} • Last active {session.last_active}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {session.is_current_device ? (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="border-emerald-500/30 bg-emerald-500/10 text-[10px] font-bold text-emerald-600 dark:text-emerald-400"
                                                                >
                                                                    This Device
                                                                </Badge>
                                                            ) : null}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 p-3.5">
                                                        <Laptop className="h-4 w-4 text-muted-foreground" />
                                                        <div className="space-y-0.5">
                                                            <p className="text-xs font-bold text-foreground">
                                                                Current Browser Session
                                                            </p>
                                                            <p className="text-[11px] text-muted-foreground">Active device</p>
                                                        </div>
                                                        <Badge
                                                            variant="outline"
                                                            className="ml-auto border-emerald-500/30 bg-emerald-500/10 text-[10px] font-bold text-emerald-600 dark:text-emerald-400"
                                                        >
                                                            This Device
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between border-t border-border/60 pt-4">
                                                <Dialog open={isLogoutModalOpen} onOpenChange={setIsLogoutModalOpen}>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-1.5 rounded-xl border-border text-xs font-semibold text-destructive hover:bg-destructive/10"
                                                        >
                                                            <LogOut className="h-3.5 w-3.5" />
                                                            Log Out Other Devices
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="rounded-3xl p-6 sm:max-w-md">
                                                        <DialogHeader>
                                                            <DialogTitle className="text-base font-bold text-foreground">
                                                                Log Out Other Browser Sessions
                                                            </DialogTitle>
                                                            <DialogDescription className="text-xs text-muted-foreground">
                                                                Enter your password to sign out of all other active browser sessions across all devices.
                                                            </DialogDescription>
                                                        </DialogHeader>

                                                        <form onSubmit={handleLogoutOtherSessions} className="space-y-4 pt-2">
                                                            <div className="space-y-1.5">
                                                                <Label
                                                                    htmlFor="logout-password"
                                                                    className="text-xs font-bold text-foreground"
                                                                >
                                                                    Current Password
                                                                </Label>
                                                                <PasswordInput
                                                                    id="logout-password"
                                                                    value={logoutPassword}
                                                                    onChange={(e) => setLogoutPassword(e.target.value)}
                                                                    placeholder="Enter password to confirm"
                                                                    className="h-11 rounded-xl text-sm"
                                                                />
                                                                {logoutPasswordError && (
                                                                    <p className="text-xs font-semibold text-destructive">
                                                                        {logoutPasswordError}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <DialogFooter className="gap-2 pt-2">
                                                                <DialogClose asChild>
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
                                                                    disabled={isLoggingOutOthers}
                                                                    className="gap-2 rounded-xl text-xs font-bold shadow-xs"
                                                                >
                                                                    {isLoggingOutOthers ? (
                                                                        <>
                                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                            Logging out...
                                                                        </>
                                                                    ) : (
                                                                        'Confirm & Log Out'
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
                                                    onClick={() => setIsSessionsModalOpen(false)}
                                                    className="rounded-xl text-xs font-semibold"
                                                >
                                                    Done
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* SECTION 3: PREFERENCES */}
                <div className="space-y-3">
                    <div className="space-y-0.5">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                            Preferences
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Theme and visual appearance settings.
                        </p>
                    </div>

                    <Card className="rounded-3xl border-border/80 bg-card shadow-xs">
                        <CardHeader className="border-b border-border/60 p-6 pb-4">
                            <CardTitle className="text-base font-bold text-foreground">
                                Appearance
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                                Choose how MarketPilot looks on your device.
                            </p>
                        </CardHeader>

                        <CardContent className="p-6">
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    type="button"
                                    onClick={() => updateAppearance('light')}
                                    className={cn(
                                        'flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-2xl border p-4 text-center transition-all',
                                        appearance === 'light'
                                            ? 'border-primary bg-primary/5 font-semibold text-foreground shadow-xs'
                                            : 'border-border/70 bg-card/50 text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground',
                                    )}
                                >
                                    <Sun className="h-5 w-5" />
                                    <span className="text-xs">Light</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => updateAppearance('dark')}
                                    className={cn(
                                        'flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-2xl border p-4 text-center transition-all',
                                        appearance === 'dark'
                                            ? 'border-primary bg-primary/5 font-semibold text-foreground shadow-xs'
                                            : 'border-border/70 bg-card/50 text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground',
                                    )}
                                >
                                    <Moon className="h-5 w-5" />
                                    <span className="text-xs">Dark</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => updateAppearance('system')}
                                    className={cn(
                                        'flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-2xl border p-4 text-center transition-all',
                                        appearance === 'system'
                                            ? 'border-primary bg-primary/5 font-semibold text-foreground shadow-xs'
                                            : 'border-border/70 bg-card/50 text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground',
                                    )}
                                >
                                    <Monitor className="h-5 w-5" />
                                    <span className="text-xs">System</span>
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* SECTION 4: DANGER ZONE */}
                <div className="space-y-3">
                    <div className="space-y-0.5">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-destructive">
                            Danger Zone
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Irreversible workspace actions. Proceed with caution.
                        </p>
                    </div>

                    <Card className="rounded-3xl border-destructive/30 bg-destructive/5 shadow-xs">
                        <CardHeader className="border-b border-destructive/20 p-6 pb-4">
                            <CardTitle className="text-base font-bold text-destructive">
                                Delete your MarketPilot account
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                                Permanently delete your account and associated data. This action cannot be undone.
                            </p>
                        </CardHeader>

                        <CardContent className="p-6">
                            <DeleteUser />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

AccountSettingsPage.layout = {
    breadcrumbs,
};
