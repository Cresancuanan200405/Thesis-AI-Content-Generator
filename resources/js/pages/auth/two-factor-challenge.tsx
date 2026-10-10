import { Form, Head, setLayoutProps } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import React, { useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { Spinner } from '@/components/ui/spinner';
import { OTP_MAX_LENGTH } from '@/hooks/use-two-factor-auth';
import { store } from '@/routes/two-factor/login';

export default function TwoFactorChallenge() {
    const [showRecoveryInput, setShowRecoveryInput] = useState<boolean>(false);
    const [code, setCode] = useState<string>('');

    const authConfigContent = useMemo<{
        title: string;
        description: string;
        toggleText: string;
    }>(() => {
        if (showRecoveryInput) {
            return {
                title: 'Recovery code',
                description:
                    'Please confirm access to your account by entering one of your emergency recovery codes.',
                toggleText: 'Use an authentication code',
            };
        }

        return {
            title: 'Authentication code',
            description:
                'Enter the 6-digit code provided by your authenticator app.',
            toggleText: 'Use a recovery code',
        };
    }, [showRecoveryInput]);

    setLayoutProps({
        title: authConfigContent.title,
        description: authConfigContent.description,
    });

    const toggleRecoveryMode = (clearErrors: () => void): void => {
        setShowRecoveryInput(!showRecoveryInput);
        clearErrors();
        setCode('');
    };

    return (
        <div className="space-y-4">
            <Head title="Two-factor authentication" />

            <Form
                {...store.form()}
                className="space-y-4"
                resetOnError
                resetOnSuccess={!showRecoveryInput}
            >
                {({ errors, processing, clearErrors }) => (
                    <>
                        {showRecoveryInput ? (
                            <div className="space-y-1.5">
                                <Input
                                    name="recovery_code"
                                    type="text"
                                    placeholder="Enter recovery code"
                                    autoFocus={showRecoveryInput}
                                    required
                                    className="h-11 sm:h-12 rounded-xl border-zinc-200 bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-900 focus-visible:ring-1 focus-visible:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:border-zinc-500 dark:focus-visible:ring-zinc-500/20"
                                />
                                <InputError message={errors.recovery_code} />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center space-y-2.5">
                                <InputOTP
                                    name="code"
                                    maxLength={OTP_MAX_LENGTH}
                                    value={code}
                                    onChange={(value) => setCode(value)}
                                    disabled={processing}
                                    pattern={REGEXP_ONLY_DIGITS}
                                    autoFocus
                                >
                                    <InputOTPGroup className="gap-1.5">
                                        {Array.from(
                                            { length: OTP_MAX_LENGTH },
                                            (_, index) => (
                                                <InputOTPSlot
                                                    key={index}
                                                    index={index}
                                                    className="h-11 w-11 rounded-xl border-zinc-200 bg-white font-mono text-base font-semibold text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-white"
                                                />
                                            ),
                                        )}
                                    </InputOTPGroup>
                                </InputOTP>
                                <InputError message={errors.code} />
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={processing}
                            className="h-11 sm:h-12 w-full cursor-pointer rounded-xl bg-zinc-950 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                        >
                            {processing ? <Spinner /> : 'Continue'}
                        </Button>

                        <div className="pt-1 text-center">
                            <button
                                type="button"
                                onClick={() => toggleRecoveryMode(clearErrors)}
                                className="cursor-pointer text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                            >
                                {authConfigContent.toggleText}
                            </button>
                        </div>
                    </>
                )}
            </Form>
        </div>
    );
}

TwoFactorChallenge.layout = {
    title: 'Two-factor confirmation',
    description: 'Please confirm access to your account.',
};
