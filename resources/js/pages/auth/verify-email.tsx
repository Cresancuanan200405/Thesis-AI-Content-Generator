import { Form, Head } from '@inertiajs/react';
import React, { useRef } from 'react';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
    const codeInputRef = useRef<HTMLInputElement>(null);

    const submitVerificationForm = () => {
        const form = document
            .getElementById('verification-code')
            ?.closest('form');

        if (form instanceof HTMLFormElement) {
            if (form.requestSubmit) {
                form.requestSubmit();
            } else {
                form.submit();
            }
        }
    };

    const updateCode = () => {
        const code = inputRefs.current
            .map((input) => input?.value || '')
            .join('');

        if (codeInputRef.current) {
            codeInputRef.current.value = code;
        }

        if (code.length === 6) {
            submitVerificationForm();
        }
    };

    const handleCodeInput = (index: number, value: string) => {
        const numericValue = value.replace(/\D/g, '');
        const digit = numericValue.slice(-1);
        const input = inputRefs.current[index];

        if (input) {
            input.value = digit;
        }

        if (digit && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        updateCode();
    };

    const handleKeyDown = (
        index: number,
        event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (
            event.key === 'Backspace' &&
            !event.currentTarget.value &&
            index > 0
        ) {
            inputRefs.current[index - 1]?.focus();
        }

        const allowedKeys = [
            'Backspace',
            'Delete',
            'Tab',
            'ArrowLeft',
            'ArrowRight',
            'Home',
            'End',
        ];

        if (!allowedKeys.includes(event.key) && !/^[0-9]$/.test(event.key)) {
            event.preventDefault();
        }

        if (event.key === 'Backspace') {
            setTimeout(updateCode, 0);
        }
    };

    const handlePaste = (event: React.ClipboardEvent) => {
        event.preventDefault();
        const pastedValue = event.clipboardData
            .getData('text')
            .replace(/\D/g, '')
            .slice(0, 6);
        pastedValue.split('').forEach((digit, index) => {
            const input = inputRefs.current[index];

            if (input) {
                input.value = digit;
            }
        });
        const nextIndex = Math.min(pastedValue.length, 5);
        inputRefs.current[nextIndex]?.focus();
        updateCode();
    };

    return (
        <div className="space-y-4">
            <Head title="Verify your email" />

            {status === 'verification-link-sent' && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 py-2 text-center text-xs font-medium text-emerald-400">
                    A new verification code has been sent to your email.
                </div>
            )}

            <Form
                action="/email/verify-code"
                method="post"
                className="space-y-4 text-left"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="space-y-2">
                            <Label className="block text-center text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                6-Digit Verification Code
                            </Label>

                            {/* Hidden field submitted to Laravel */}
                            <input
                                type="hidden"
                                name="code"
                                id="verification-code"
                                ref={codeInputRef}
                            />

                            <div
                                className="flex justify-center gap-1.5 sm:gap-2 py-1"
                                onPaste={handlePaste}
                            >
                                {Array.from({ length: 6 }, (_, index) => (
                                    <Input
                                        key={index}
                                        ref={(element) => {
                                            inputRefs.current[index] = element;
                                        }}
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete={
                                            index === 0
                                                ? 'one-time-code'
                                                : 'off'
                                        }
                                        maxLength={1}
                                        aria-label={`Verification digit ${index + 1}`}
                                        onInput={(event) =>
                                            handleCodeInput(
                                                index,
                                                event.currentTarget.value,
                                            )
                                        }
                                        onKeyDown={(event) =>
                                            handleKeyDown(index, event)
                                        }
                                        className="h-11 w-10 sm:h-12 sm:w-11 rounded-xl border-zinc-200 bg-white text-center font-mono text-lg font-bold text-zinc-900 shadow-xs focus-visible:border-zinc-900 focus-visible:ring-1 focus-visible:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-white dark:focus-visible:border-zinc-500 dark:focus-visible:ring-zinc-500/20"
                                    />
                                ))}
                            </div>

                            {errors?.code && (
                                <p className="mt-1 text-center text-xs font-medium text-red-500 dark:text-red-400">
                                    {String(errors.code)}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={processing}
                            className="h-11 sm:h-12 w-full cursor-pointer rounded-xl bg-zinc-950 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                        >
                            {processing ? <Spinner /> : 'Verify email'}
                        </Button>
                    </>
                )}
            </Form>

            <div className="space-y-2.5 pt-2 text-center">
                <Form {...send.form()} className="inline-block">
                    {({ processing }) => (
                        <button
                            type="submit"
                            disabled={processing}
                            className="cursor-pointer text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-white"
                        >
                            {processing ? 'Sending...' : 'Resend verification code'}
                        </button>
                    )}
                </Form>

                <div>
                    <TextLink
                        href={logout()}
                        className="inline-block text-xs text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                    >
                        Log out
                    </TextLink>
                </div>
            </div>
        </div>
    );
}

VerifyEmail.layout = {
    title: 'Verify your email',
    description: 'Enter the 6-digit verification code sent to your email.',
};
