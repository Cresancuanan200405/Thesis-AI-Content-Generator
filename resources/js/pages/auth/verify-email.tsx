import { Form, Head } from '@inertiajs/react';
import { useRef } from 'react';

import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({
    status,
}: {
    status?: string;
}) {
    const inputRefs = useRef<
        Array<HTMLInputElement | null>
    >([]);
    const codeInputRef = useRef<HTMLInputElement>(null);

    const submitVerificationForm = () => {
        const form =
            document
                .getElementById(
                    'verification-code',
                )
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

        // Auto-submit when all 6 digits are filled
        if (code.length === 6) {
            submitVerificationForm();
        }
    };

    const handleCodeInput = (
        index: number,
        value: string,
    ) => {
        // Numbers only
        const numericValue =
            value.replace(/\D/g, '');

        // Keep only one digit
        const digit =
            numericValue.slice(-1);

        const input =
            inputRefs.current[index];

        if (input) {
            input.value = digit;
        }

        // Automatically move to next box
        if (
            digit &&
            index < 5
        ) {
            inputRefs.current[
                index + 1
            ]?.focus();
        }

        // Update the hidden code field
        updateCode();
    };

    const handleKeyDown = (
        index: number,
        event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        // Move to previous box when pressing Backspace
        if (
            event.key === 'Backspace' &&
            !event.currentTarget.value &&
            index > 0
        ) {
            inputRefs.current[
                index - 1
            ]?.focus();
        }

        // Allow only numbers and control keys
        const allowedKeys = [
            'Backspace',
            'Delete',
            'Tab',
            'ArrowLeft',
            'ArrowRight',
            'Home',
            'End',
        ];

        if (
            !allowedKeys.includes(
                event.key,
            ) &&
            !/^[0-9]$/.test(
                event.key,
            )
        ) {
            event.preventDefault();
        }

        // Update code after backspace
        if (event.key === 'Backspace') {
            setTimeout(updateCode, 0);
        }
    };

    const handlePaste = (
        event: React.ClipboardEvent,
    ) => {
        event.preventDefault();

        const pastedValue =
            event.clipboardData
                .getData('text')
                .replace(/\D/g, '')
                .slice(0, 6);

        pastedValue
            .split('')
            .forEach(
                (digit, index) => {
                    const input =
                        inputRefs.current[
                            index
                        ];

                    if (input) {
                        input.value =
                            digit;
                    }
                },
            );

        const nextIndex =
            Math.min(
                pastedValue.length,
                5,
            );

        inputRefs.current[
            nextIndex
        ]?.focus();

        // Update code after paste
        updateCode();
    };

    return (
        <>
            <Head title="Verify your email" />

            {status ===
                'verification-link-sent' && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    A new verification code has
                    been sent to your email.
                </div>
            )}

            <div className="space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Enter your verification code
                    </h1>

                    <p className="text-sm text-muted-foreground">
                        Check your email for the
                        6-digit code and enter it
                        below to verify your
                        account.
                    </p>
                </div>

                <Form
                    action="/email/verify-code"
                    method="post"
                    className="space-y-4 text-left"
                >
                    {({
                        processing,
                        errors,
                    }) => (
                        <>
                            <div className="space-y-2">
                                <Label>
                                    Verification
                                    code
                                </Label>

                                {/* Hidden field submitted to Laravel */}
                                <input
                                    type="hidden"
                                    name="code"
                                    id="verification-code"
                                    ref={codeInputRef}
                                />

                                <div
                                    className="flex justify-center gap-2 sm:gap-3"
                                    onPaste={
                                        handlePaste
                                    }
                                >
                                    {Array.from(
                                        {
                                            length: 6,
                                        },
                                        (
                                            _,
                                            index,
                                        ) => (
                                            <Input
                                                key={
                                                    index
                                                }
                                                ref={(
                                                    element,
                                                ) => {
                                                    inputRefs.current[
                                                        index
                                                    ] =
                                                        element;
                                                }}
                                                type="text"
                                                inputMode="numeric"
                                                autoComplete={
                                                    index ===
                                                    0
                                                        ? 'one-time-code'
                                                        : 'off'
                                                }
                                                maxLength={
                                                    1
                                                }
                                                aria-label={`Verification digit ${index + 1}`}
                                                onInput={(
                                                    event,
                                                ) =>
                                                    handleCodeInput(
                                                        index,
                                                        event
                                                            .currentTarget
                                                            .value,
                                                    )
                                                }
                                                onKeyDown={(
                                                    event,
                                                ) =>
                                                    handleKeyDown(
                                                        index,
                                                        event,
                                                    )
                                                }
                                                className="h-12 w-11 text-center text-lg font-semibold sm:h-14 sm:w-12"
                                            />
                                        ),
                                    )}
                                </div>

                                {errors?.code && (
                                    <p className="text-center text-sm text-destructive">
                                        {String(
                                            errors.code,
                                        )}
                                    </p>
                                )}
                            </div>

                            <Button
                                disabled={
                                    processing
                                }
                                className="w-full"
                            >
                                {processing && (
                                    <Spinner />
                                )}

                                Verify email
                            </Button>
                        </>
                    )}
                </Form>

                <div className="space-y-3 text-center">
                    <Form
                        {...send.form()}
                        className="inline-block"
                    >
                        {({
                            processing,
                        }) => (
                            <Button
                                type="submit"
                                disabled={
                                    processing
                                }
                                variant="secondary"
                            >
                                {processing && (
                                    <Spinner />
                                )}

                                Resend verification
                                code
                            </Button>
                        )}
                    </Form>

                    <TextLink
                        href={logout()}
                        className="mx-auto block text-sm"
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