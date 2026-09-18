import {
    CheckCircle2,
    KeyRound,
    Loader2,
    RefreshCw,
    Shield,
    ShieldAlert,
    ShieldCheck,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import PasswordInput from '@/components/password-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface ChangeGoogleAccountModalProps {
    isGoogle: boolean;
    currentEmail: string;
    hasPassword?: boolean;
    isAuthorized?: boolean;
    trigger?: React.ReactNode;
}

export function ChangeGoogleAccountModal({
    isGoogle,
    currentEmail,
    hasPassword = false,
    isAuthorized = false,
    trigger,
}: ChangeGoogleAccountModalProps) {
    const [open, setOpen] = useState(isAuthorized);
    const [step, setStep] = useState<'verify' | 'connect'>(
        isAuthorized ? 'connect' : 'verify',
    );
    const [password, setPassword] = useState('');
    const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
    const [verifyError, setVerifyError] = useState('');

    useEffect(() => {
        if (isAuthorized) {
            setStep('connect');
            setOpen(true);
        }
    }, [isAuthorized]);

    const handleVerifyPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setVerifyError('');

        if (!password) {
            setVerifyError('Please enter your password.');

            return;
        }

        setIsVerifyingPassword(true);

        try {
            const response = await fetch('/settings/google/verify-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        (
                            document.querySelector(
                                'meta[name="csrf-token"]',
                            ) as HTMLMetaElement
                        )?.content || '',
                },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setVerifyError(
                    data.errors?.password?.[0] ||
                        data.message ||
                        'Incorrect password.',
                );
                setIsVerifyingPassword(false);

                return;
            }

            setIsVerifyingPassword(false);
            setStep('connect');
            toast.success(
                'Ownership verified. You may now connect a Google account.',
            );
        } catch {
            setIsVerifyingPassword(false);
            setVerifyError('Verification failed. Please try again.');
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 rounded-xl border-border/80 px-4 text-xs font-semibold shadow-xs hover:bg-muted"
                    >
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                        Change Google Account
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="rounded-3xl p-6 sm:max-w-md">
                <DialogHeader>
                    <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                        </svg>
                    </div>
                    <DialogTitle className="text-lg font-bold text-foreground">
                        Change Linked Google Account
                    </DialogTitle>
                    <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
                        Replace the Google account currently linked to your
                        MarketPilot account. All your workspace data, campaigns,
                        and designs will remain in this account.
                    </DialogDescription>
                </DialogHeader>

                {step === 'verify' && (
                    <div className="space-y-4 pt-2">
                        {isGoogle ? (
                            <div className="space-y-4">
                                <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4">
                                    <div className="flex items-start gap-2.5">
                                        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                                        <div className="space-y-1 text-xs text-blue-900 dark:text-blue-300">
                                            <p className="font-semibold">
                                                Verify Current Google Ownership
                                            </p>
                                            <p className="leading-relaxed">
                                                For security, you must first
                                                verify ownership of your
                                                currently connected Google
                                                account ({currentEmail}) before
                                                replacing it.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setOpen(false)}
                                        className="h-10 rounded-xl text-xs font-semibold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            window.location.href =
                                                '/settings/google/verify-current';
                                        }}
                                        className="h-10 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
                                    >
                                        <Shield className="mr-2 h-4 w-4" />
                                        Verify Current Google Account
                                    </Button>
                                </div>
                            </div>
                        ) : hasPassword ? (
                            <form
                                onSubmit={handleVerifyPassword}
                                className="space-y-4"
                            >
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="verify_current_pwd"
                                        className="text-xs font-bold text-foreground"
                                    >
                                        Current Password
                                    </Label>
                                    <PasswordInput
                                        id="verify_current_pwd"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        placeholder="Enter your current password"
                                        className="h-11 rounded-xl text-sm"
                                    />
                                    {verifyError && (
                                        <p className="text-xs font-medium text-destructive">
                                            {verifyError}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => setOpen(false)}
                                        className="rounded-xl text-xs font-semibold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isVerifyingPassword}
                                        className="rounded-xl px-5 text-xs font-bold shadow-xs"
                                    >
                                        {isVerifyingPassword ? (
                                            <>
                                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                                Verifying...
                                            </>
                                        ) : (
                                            'Verify & Continue'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        ) : null}
                    </div>
                )}

                {step === 'connect' && (
                    <div className="space-y-4 pt-2">
                        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                            <div className="flex items-start gap-2.5">
                                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                <div className="space-y-1 text-xs text-emerald-900 dark:text-emerald-300">
                                    <p className="font-semibold">
                                        Current Account Ownership Verified
                                    </p>
                                    <p className="leading-relaxed">
                                        You may now select the new Google
                                        account you wish to link. It will
                                        replace your current Google login for
                                        this MarketPilot profile.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5 rounded-2xl border border-border/70 bg-muted/40 p-3.5 text-xs">
                            <p className="font-semibold text-foreground">
                                What happens next:
                            </p>
                            <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                                <li>
                                    You will be redirected to Google to choose
                                    your new account.
                                </li>
                                <li>
                                    The new Google account will become the login
                                    for this MarketPilot account.
                                </li>
                                <li>
                                    All your existing data and business settings
                                    remain in this same account.
                                </li>
                            </ul>
                        </div>

                        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                className="h-10 rounded-xl text-xs font-semibold"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={() => {
                                    window.location.href =
                                        '/settings/google/change';
                                }}
                                className="h-10 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
                            >
                                <svg
                                    className="mr-2 h-4 w-4"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                    />
                                </svg>
                                Authenticate New Google Account
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
