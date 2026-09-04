import { Form, Head, router } from '@inertiajs/react';
import {
    Globe,
    KeyRound,
    Laptop,
    Loader2,
    LogOut,
    ShieldCheck,
    Smartphone,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import InputError from '@/components/input-error';
import type { Props as ManageTwoFactorProps } from '@/components/manage-two-factor';
import ManageTwoFactor from '@/components/manage-two-factor';
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
import { edit } from '@/routes/security';

interface SessionItem {
    id: string;
    ip_address?: string;
    is_current_device: boolean;
    platform: string;
    browser: string;
    is_desktop: boolean;
    last_active: string;
}

type Props = {
    passwordRules: string;
    sessions?: SessionItem[];
} & ManageTwoFactorProps;

export default function SecuritySettings(props: Props) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [logoutPassword, setLogoutPassword] = useState('');
    const [logoutPasswordError, setLogoutPasswordError] = useState('');
    const [isLoggingOutOthers, setIsLoggingOutOthers] = useState(false);

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
            <Head title="Security Settings" />

            <div className="space-y-8">
                {/* 1. Update Password Card */}
                <Card className="rounded-3xl border-border/80 bg-card shadow-xs">
                    <CardHeader className="border-b border-border/60 p-6 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <KeyRound className="h-4.5 w-4.5" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-bold text-foreground">
                                    Update Password
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    Ensure your account uses a strong, random
                                    password to maintain security.
                                </p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-6">
                        <Form
                            {...SecurityController.update.form()}
                            options={{
                                preserveScroll: true,
                            }}
                            resetOnError={[
                                'password',
                                'password_confirmation',
                                'current_password',
                            ]}
                            resetOnSuccess
                            onError={(errors) => {
                                if (errors.password) {
                                    passwordInput.current?.focus();
                                }

                                if (errors.current_password) {
                                    currentPasswordInput.current?.focus();
                                }
                            }}
                            className="space-y-5"
                        >
                            {({ errors, processing }) => (
                                <>
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="current_password"
                                            className="text-xs font-bold text-foreground"
                                        >
                                            Current Password
                                        </Label>
                                        <PasswordInput
                                            id="current_password"
                                            ref={currentPasswordInput}
                                            name="current_password"
                                            className="h-11 rounded-xl text-sm"
                                            autoComplete="current-password"
                                            placeholder="Enter your current password"
                                        />
                                        <InputError
                                            message={errors.current_password}
                                            className="text-xs font-semibold text-destructive"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="password"
                                            className="text-xs font-bold text-foreground"
                                        >
                                            New Password
                                        </Label>
                                        <PasswordInput
                                            id="password"
                                            ref={passwordInput}
                                            name="password"
                                            className="h-11 rounded-xl text-sm"
                                            autoComplete="new-password"
                                            placeholder="Enter new password"
                                            passwordrules={props.passwordRules}
                                        />
                                        <InputError
                                            message={errors.password}
                                            className="text-xs font-semibold text-destructive"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="password_confirmation"
                                            className="text-xs font-bold text-foreground"
                                        >
                                            Confirm New Password
                                        </Label>
                                        <PasswordInput
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            className="h-11 rounded-xl text-sm"
                                            autoComplete="new-password"
                                            placeholder="Confirm new password"
                                            passwordrules={props.passwordRules}
                                        />
                                        <InputError
                                            message={
                                                errors.password_confirmation
                                            }
                                            className="text-xs font-semibold text-destructive"
                                        />
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            data-test="update-password-button"
                                            className="h-10 min-w-32 rounded-xl px-5 text-xs font-bold shadow-xs"
                                        >
                                            {processing
                                                ? 'Saving...'
                                                : 'Update Password'}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </CardContent>
                </Card>

                {/* 2. Two-Factor Authentication */}
                <Card className="rounded-3xl border-border/80 bg-card shadow-xs">
                    <CardHeader className="border-b border-border/60 p-6 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <ShieldCheck className="h-4.5 w-4.5" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-bold text-foreground">
                                    Two-Factor Authentication
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    Add an extra layer of security to your
                                    account using TOTP authentication.
                                </p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-6">
                        <ManageTwoFactor
                            canManageTwoFactor={props.canManageTwoFactor}
                            requiresConfirmation={props.requiresConfirmation}
                            twoFactorEnabled={props.twoFactorEnabled}
                        />
                    </CardContent>
                </Card>

                {/* 3. Active Browser Sessions */}
                <Card className="rounded-3xl border-border/80 bg-card shadow-xs">
                    <CardHeader className="border-b border-border/60 p-6 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-foreground">
                                <Globe className="h-4.5 w-4.5 text-muted-foreground" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-bold text-foreground">
                                    Browser Sessions
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    Manage and log out your active sessions on
                                    other browsers and devices.
                                </p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-5 p-6">
                        <p className="text-xs leading-relaxed text-muted-foreground">
                            If necessary, you may log out of all of your other
                            browser sessions across all of your devices. Some of
                            your recent sessions are listed below.
                        </p>

                        <div className="space-y-3">
                            {props.sessions && props.sessions.length > 0 ? (
                                props.sessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/30 p-4"
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
                                                    {session.platform} —{' '}
                                                    {session.browser}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    {session.ip_address} • Last
                                                    active {session.last_active}
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
                                <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
                                    <Laptop className="h-5 w-5 text-muted-foreground" />
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-foreground">
                                            Current Browser Session
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">
                                            Active device
                                        </p>
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

                        <div className="pt-2">
                            <Dialog
                                open={isLogoutModalOpen}
                                onOpenChange={setIsLogoutModalOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="gap-2 rounded-xl border-border bg-background text-xs font-semibold shadow-xs hover:bg-muted"
                                    >
                                        <LogOut className="h-3.5 w-3.5" />
                                        Log Out Other Browser Sessions
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="rounded-3xl p-6 sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle className="text-base font-bold text-foreground">
                                            Log Out Other Browser Sessions
                                        </DialogTitle>
                                        <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
                                            Please enter your password to
                                            confirm you would like to log out of
                                            your other browser sessions across
                                            all of your devices.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <form
                                        onSubmit={handleLogoutOtherSessions}
                                        className="space-y-4 pt-2"
                                    >
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="logout-password"
                                                className="text-xs font-bold text-foreground"
                                            >
                                                Password
                                            </Label>
                                            <PasswordInput
                                                id="logout-password"
                                                value={logoutPassword}
                                                onChange={(e) =>
                                                    setLogoutPassword(
                                                        e.target.value,
                                                    )
                                                }
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
                                                    'Log Out Other Sessions'
                                                )}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

SecuritySettings.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Account Settings',
            href: '/settings/profile',
        },
        {
            title: 'Security',
            href: edit(),
        },
    ],
};
