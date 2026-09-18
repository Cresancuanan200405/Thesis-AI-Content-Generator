import { router } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    KeyRound,
    Loader2,
    Mail,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ChangeEmailModalProps {
    currentEmail: string;
    hasPassword?: boolean;
    twoFactorEnabled?: boolean;
    isGoogle?: boolean;
    hasPendingChange?: boolean;
    pendingEmail?: string | null;
    trigger?: React.ReactNode;
}

type Step = 'verify' | 'enter-email' | 'verify-code' | 'success';

export function ChangeEmailModal({
    currentEmail,
    hasPassword = true,
    twoFactorEnabled = false,
    isGoogle = false,
    hasPendingChange = false,
    pendingEmail = null,
    trigger,
}: ChangeEmailModalProps) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<Step>(hasPendingChange ? 'verify-code' : 'verify');

    // Step 1: Verification form state
    const [password, setPassword] = useState('');
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [verifyError, setVerifyError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    // Step 2: New email state
    const [newEmail, setNewEmail] = useState('');
    const [emailConfirmation, setEmailConfirmation] = useState('');
    const [emailError, setEmailError] = useState('');
    const [isRequesting, setIsRequesting] = useState(false);

    // Step 3: Verification code state
    const [code, setCode] = useState('');
    const [codeError, setCodeError] = useState('');
    const [maskedEmail, setMaskedEmail] = useState(pendingEmail || '');
    const [isConfirming, setIsConfirming] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Step 4: Final confirmed email
    const [confirmedEmail, setConfirmedEmail] = useState('');

    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (resendCooldown > 0) {
            timer = setTimeout(() => {
                setResendCooldown((prev) => prev - 1);
            }, 1000);
        }

        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const resetFlow = () => {
        setPassword('');
        setTwoFactorCode('');
        setVerifyError('');
        setNewEmail('');
        setEmailConfirmation('');
        setEmailError('');
        setCode('');
        setCodeError('');
        setStep(hasPendingChange ? 'verify-code' : 'verify');
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            resetFlow();
        }

        setOpen(newOpen);
    };

    // Step 1: Verify current identity
    const handleVerifyIdentity = async (e: React.FormEvent) => {
        e.preventDefault();
        setVerifyError('');

        if (!password) {
            setVerifyError('Please enter your current password.');

            return;
        }

        if (twoFactorEnabled && !twoFactorCode) {
            setVerifyError('Please enter your two-factor authentication code.');

            return;
        }

        setIsVerifying(true);

        try {
            const response = await fetch('/settings/email/verify-identity', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    password,
                    two_factor_code: twoFactorCode,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                const message =
                    data.errors?.password?.[0] ||
                    data.errors?.two_factor_code?.[0] ||
                    data.message ||
                    'Verification failed. Please check your credentials.';
                setVerifyError(message);
                setIsVerifying(false);

                return;
            }

            setIsVerifying(false);
            setStep('enter-email');
        } catch {
            setIsVerifying(false);
            setVerifyError('An unexpected error occurred. Please try again.');
        }
    };

    // Step 2: Request new email change
    const handleRequestChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailError('');

        if (!newEmail) {
            setEmailError('Please enter a new email address.');

            return;
        }

        if (newEmail.trim().toLowerCase() === currentEmail.trim().toLowerCase()) {
            setEmailError('The new email address cannot be the same as your current email address.');

            return;
        }

        if (newEmail !== emailConfirmation) {
            setEmailError('The email address confirmation does not match.');

            return;
        }

        setIsRequesting(true);

        try {
            const response = await fetch('/settings/email/request-change', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    email: newEmail,
                    email_confirmation: emailConfirmation,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                const message =
                    data.errors?.email?.[0] ||
                    data.errors?.email_confirmation?.[0] ||
                    data.message ||
                    'Could not send verification code. Please check the email entered.';
                setEmailError(message);
                setIsRequesting(false);

                return;
            }

            setIsRequesting(false);
            setMaskedEmail(data.masked_email || newEmail);
            setResendCooldown(60);
            setStep('verify-code');
            toast.success('Verification code sent to your new email address.');
        } catch {
            setIsRequesting(false);
            setEmailError('An unexpected error occurred. Please try again.');
        }
    };

    // Step 3: Confirm verification code
    const handleConfirmCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setCodeError('');

        const cleanedCode = code.replace(/\D/g, '');

        if (cleanedCode.length !== 6) {
            setCodeError('Please enter the 6-digit verification code.');

            return;
        }

        setIsConfirming(true);

        try {
            const response = await fetch('/settings/email/confirm-change', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    code: cleanedCode,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                const message =
                    data.errors?.code?.[0] ||
                    data.message ||
                    'The verification code entered was invalid or has expired.';
                setCodeError(message);
                setIsConfirming(false);

                return;
            }

            setIsConfirming(false);
            setConfirmedEmail(data.new_email || newEmail);
            setStep('success');
            toast.success('Email address updated successfully.');
            router.reload({ only: ['auth', 'hasPendingEmailChange', 'pendingEmail'] });
        } catch {
            setIsConfirming(false);
            setCodeError('An unexpected error occurred. Please try again.');
        }
    };

    // Resend code
    const handleResendCode = async () => {
        if (resendCooldown > 0 || isResending) {
            return;
        }

        setIsResending(true);
        setCodeError('');

        try {
            const response = await fetch('/settings/email/resend-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                setCodeError(data.message || 'Unable to resend code right now.');
                setIsResending(false);

                return;
            }

            setIsResending(false);
            setResendCooldown(60);
            toast.success('A fresh verification code was sent.');
        } catch {
            setIsResending(false);
            setCodeError('Unable to resend code. Please try again.');
        }
    };

    // Cancel pending request
    const handleCancelRequest = async () => {
        try {
            await fetch('/settings/email/cancel-change', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
            });
            toast.info('Email change request was cancelled.');
            router.reload({ only: ['hasPendingEmailChange', 'pendingEmail'] });
            setStep('verify');
            resetFlow();
            setOpen(false);
        } catch {
            toast.error('Failed to cancel request.');
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 rounded-xl border-border/80 px-4 text-xs font-semibold shadow-xs hover:bg-muted"
                    >
                        <Mail className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                        Change Email
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="rounded-3xl p-6 sm:max-w-md">
                {/* Flow Step Progress Indicator */}
                {step !== 'success' && (
                    <div className="mb-2 flex items-center justify-between border-b border-border/60 pb-3">
                        <div className="flex items-center gap-2">
                            <span
                                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                                    step === 'verify'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground'
                                }`}
                            >
                                1
                            </span>
                            <span className={`text-xs ${step === 'verify' ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                                Verify
                            </span>
                        </div>
                        <span className="text-muted-foreground/50">→</span>
                        <div className="flex items-center gap-2">
                            <span
                                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                                    step === 'enter-email'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground'
                                }`}
                            >
                                2
                            </span>
                            <span className={`text-xs ${step === 'enter-email' ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                                New Email
                            </span>
                        </div>
                        <span className="text-muted-foreground/50">→</span>
                        <div className="flex items-center gap-2">
                            <span
                                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                                    step === 'verify-code'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground'
                                }`}
                            >
                                3
                            </span>
                            <span className={`text-xs ${step === 'verify-code' ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                                Confirm
                            </span>
                        </div>
                    </div>
                )}

                {/* STEP 1: Verify Identity */}
                {step === 'verify' && (
                    <>
                        <DialogHeader>
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 mb-1">
                                <Shield className="h-5 w-5" />
                            </div>
                            <DialogTitle className="text-lg font-bold text-foreground">
                                Verify Your Identity
                            </DialogTitle>
                            <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
                                Changing your account email address is a security-sensitive action. Please verify your identity before continuing.
                            </DialogDescription>
                        </DialogHeader>

                        {isGoogle && !hasPassword ? (
                            <div className="space-y-4 pt-3">
                                <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4">
                                    <div className="flex items-start gap-2.5">
                                        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                                        <div className="space-y-1 text-xs text-blue-900 dark:text-blue-300">
                                            <p className="font-semibold">Account connected via Google Sign-In</p>
                                            <p className="leading-relaxed">
                                                Your MarketPilot account is authenticated directly through Google OAuth. Your sign-in email is managed securely by your Google provider.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => setOpen(false)}
                                        className="rounded-xl text-xs font-semibold"
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleVerifyIdentity} className="space-y-4 pt-2">
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="verify_current_password"
                                        className="text-xs font-bold text-foreground"
                                    >
                                        Current Password
                                    </Label>
                                    <PasswordInput
                                        id="verify_current_password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="current-password"
                                        placeholder="Enter your current password"
                                        className="h-11 rounded-xl text-sm"
                                    />
                                </div>

                                {twoFactorEnabled && (
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label
                                                htmlFor="verify_two_factor_code"
                                                className="text-xs font-bold text-foreground"
                                            >
                                                Two-Factor Authentication Code
                                            </Label>
                                            <Badge
                                                variant="outline"
                                                className="border-emerald-500/30 bg-emerald-500/10 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
                                            >
                                                2FA Active
                                            </Badge>
                                        </div>
                                        <Input
                                            id="verify_two_factor_code"
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={8}
                                            value={twoFactorCode}
                                            onChange={(e) => setTwoFactorCode(e.target.value)}
                                            placeholder="e.g., 123456 or recovery code"
                                            className="h-11 rounded-xl text-sm font-mono tracking-wider"
                                        />
                                    </div>
                                )}

                                {verifyError && (
                                    <p className="text-xs font-semibold text-destructive">
                                        {verifyError}
                                    </p>
                                )}

                                <div className="flex items-center justify-end gap-2 pt-3">
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
                                        disabled={isVerifying}
                                        className="rounded-xl px-5 text-xs font-bold shadow-xs"
                                    >
                                        {isVerifying ? (
                                            <>
                                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                                Verifying...
                                            </>
                                        ) : (
                                            'Continue'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </>
                )}

                {/* STEP 2: Enter New Email */}
                {step === 'enter-email' && (
                    <>
                        <DialogHeader>
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-1">
                                <Mail className="h-5 w-5" />
                            </div>
                            <DialogTitle className="text-lg font-bold text-foreground">
                                Change Email Address
                            </DialogTitle>
                            <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
                                Enter your candidate new email address. We will send a single-use verification code to ensure you own this address.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleRequestChange} className="space-y-4 pt-2">
                            <div className="space-y-1 rounded-2xl border border-border/60 bg-muted/40 p-3.5">
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Current Email
                                </span>
                                <p className="text-xs font-semibold text-foreground break-all">
                                    {currentEmail}
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="change_new_email"
                                    className="text-xs font-bold text-foreground"
                                >
                                    New Email Address
                                </Label>
                                <Input
                                    id="change_new_email"
                                    type="email"
                                    required
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    autoComplete="email"
                                    placeholder="new-email@example.com"
                                    className="h-11 rounded-xl text-sm"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="change_confirm_email"
                                    className="text-xs font-bold text-foreground"
                                >
                                    Confirm New Email Address
                                </Label>
                                <Input
                                    id="change_confirm_email"
                                    type="email"
                                    required
                                    value={emailConfirmation}
                                    onChange={(e) => setEmailConfirmation(e.target.value)}
                                    autoComplete="email"
                                    placeholder="Confirm new email address"
                                    className="h-11 rounded-xl text-sm"
                                />
                            </div>

                            {emailError && (
                                <p className="text-xs font-semibold text-destructive">
                                    {emailError}
                                </p>
                            )}

                            <div className="flex items-center justify-between pt-3">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setStep('verify')}
                                    className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
                                >
                                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                                    Back
                                </Button>
                                <div className="flex items-center gap-2">
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
                                        disabled={isRequesting}
                                        className="rounded-xl px-5 text-xs font-bold shadow-xs"
                                    >
                                        {isRequesting ? (
                                            <>
                                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                                Sending Code...
                                            </>
                                        ) : (
                                            'Send Verification Code'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </>
                )}

                {/* STEP 3: Verify Verification Code */}
                {step === 'verify-code' && (
                    <>
                        <DialogHeader>
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 mb-1">
                                <KeyRound className="h-5 w-5" />
                            </div>
                            <DialogTitle className="text-lg font-bold text-foreground">
                                Verify Your New Email
                            </DialogTitle>
                            <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
                                We sent a 6-digit verification code to:
                            </DialogDescription>
                        </DialogHeader>

                        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3 text-center">
                            <span className="font-mono text-sm font-bold text-blue-700 dark:text-blue-300">
                                {maskedEmail || newEmail}
                            </span>
                        </div>

                        <form onSubmit={handleConfirmCode} className="space-y-4 pt-2">
                            <div className="space-y-1.5 text-center">
                                <Label
                                    htmlFor="change_verification_code"
                                    className="text-xs font-bold text-foreground"
                                >
                                    Enter 6-Digit Verification Code
                                </Label>
                                <Input
                                    id="change_verification_code"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    required
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="• • • • • •"
                                    className="h-12 rounded-xl text-center font-mono text-xl font-bold tracking-[0.4em]"
                                    autoFocus
                                />
                                <span className="text-[11px] text-muted-foreground">
                                    The code is valid for 15 minutes.
                                </span>
                            </div>

                            {codeError && (
                                <p className="text-center text-xs font-semibold text-destructive">
                                    {codeError}
                                </p>
                            )}

                            <div className="flex items-center justify-center gap-2 border-t border-border/60 pt-3">
                                <span className="text-xs text-muted-foreground">
                                    Didn't receive the code?
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={resendCooldown > 0 || isResending}
                                    onClick={handleResendCode}
                                    className="h-8 gap-1.5 rounded-lg px-2 text-xs font-bold text-primary hover:bg-primary/10"
                                >
                                    {isResending ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : resendCooldown > 0 ? (
                                        <>
                                            <Clock className="h-3 w-3" />
                                            Resend in {resendCooldown}s
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="h-3 w-3" />
                                            Resend Code
                                        </>
                                    )}
                                </Button>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancelRequest}
                                    className="rounded-xl border-border/70 text-xs font-semibold text-destructive hover:bg-destructive/10"
                                >
                                    Cancel Request
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isConfirming || code.replace(/\D/g, '').length !== 6}
                                    className="rounded-xl px-5 text-xs font-bold shadow-xs"
                                >
                                    {isConfirming ? (
                                        <>
                                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        'Verify & Update Email'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </>
                )}

                {/* STEP 4: Success State */}
                {step === 'success' && (
                    <div className="space-y-5 py-4 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-8 w-8" />
                        </div>

                        <div className="space-y-1.5">
                            <h3 className="text-xl font-bold text-foreground">
                                Email Address Updated
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Your MarketPilot account email address has been successfully changed.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200 break-all">
                                {confirmedEmail}
                            </p>
                            <div className="mt-1 flex items-center justify-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Verified ✓
                            </div>
                        </div>

                        <Button
                            type="button"
                            onClick={() => {
                                setOpen(false);
                                router.reload();
                            }}
                            className="w-full rounded-xl text-xs font-bold"
                        >
                            Done
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default ChangeEmailModal;
