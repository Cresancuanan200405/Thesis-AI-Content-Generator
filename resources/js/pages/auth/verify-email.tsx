import { Form, Head } from '@inertiajs/react';
import { MailCheck, RefreshCw } from 'lucide-react';
import { useRef } from 'react';
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
        <>
            <Head title="Verify your email" />

            <div className="space-y-4">
                {/* Visual Header Banner */}
                <div className="flex flex-col items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 p-3 text-center">
                    <div className="mb-1.5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                        <MailCheck className="h-5 w-5" />
                    </div>
                    <h3 className="text-xs font-bold text-foreground">
                        Verification Code Sent
                    </h3>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Please check your inbox and enter the 6-digit code
                        below.
                    </p>
                </div>

                {status === 'verification-link-sent' && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-2 text-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        A new verification code has been sent to your email.
                    </div>
                )}

                <Form
                    action="/email/verify-code"
                    method="post"
                    className="space-y-3.5 text-left"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">
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
                                    className="flex justify-center gap-2 py-1 sm:gap-2.5"
                                    onPaste={handlePaste}
                                >
                                    {Array.from({ length: 6 }, (_, index) => (
                                        <Input
                                            key={index}
                                            ref={(element) => {
                                                inputRefs.current[index] =
                                                    element;
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
                                            className="h-11 w-10 rounded-xl border-border bg-background text-center text-base font-bold shadow-xs focus-visible:border-primary focus-visible:ring-primary/20 sm:h-12 sm:w-11 sm:text-lg"
                                        />
                                    ))}
                                </div>

                                {errors?.code && (
                                    <p className="mt-1 text-center text-xs font-medium text-destructive">
                                        {String(errors.code)}
                                    </p>
                                )}
                            </div>

                            <Button
                                disabled={processing}
                                className="h-10 w-full cursor-pointer rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-[1.01] hover:bg-primary/90 hover:shadow-primary/35 active:scale-[0.98]"
                            >
                                {processing && <Spinner />}
                                Verify email &rarr;
                            </Button>
                        </>
                    )}
                </Form>

                <div className="space-y-2 border-t border-border/60 pt-1 text-center">
                    <Form {...send.form()} className="inline-block">
                        {({ processing }) => (
                            <Button
                                type="submit"
                                disabled={processing}
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                            >
                                {processing ? (
                                    <Spinner />
                                ) : (
                                    <RefreshCw className="h-3 w-3" />
                                )}
                                Resend verification code
                            </Button>
                        )}
                    </Form>

                    <TextLink
                        href={logout()}
                        className="mx-auto block text-xs text-muted-foreground hover:text-foreground"
                    >
                        Log out
                    </TextLink>
                </div>
            </div>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Verify your email',
    description:
        'Please confirm your email address to complete setup and unlock your workspace.',
};
