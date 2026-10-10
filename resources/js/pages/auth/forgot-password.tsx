import { Form, Head } from '@inertiajs/react';
import React from 'react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <div className="space-y-4">
            <Head title="Forgot password" />

            {/* Status Message */}
            {status && (
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3.5 py-2 text-center text-xs font-medium text-blue-400">
                    {status}
                </div>
            )}

            <Form
                {...email.form()}
                resetOnSuccess={['email']}
                className="space-y-4"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="email"
                                className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
                            >
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                autoFocus
                                required
                                placeholder="name@example.com"
                                className="h-11 sm:h-12 rounded-xl border-zinc-200 bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-900 focus-visible:ring-1 focus-visible:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:border-zinc-500 dark:focus-visible:ring-zinc-500/20"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <Button
                            type="submit"
                            disabled={processing}
                            className="h-11 sm:h-12 w-full cursor-pointer rounded-xl bg-zinc-950 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                            data-test="email-password-reset-link-button"
                        >
                            {processing ? <Spinner /> : 'Send reset link'}
                        </Button>
                    </>
                )}
            </Form>

            <div className="pt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
                Remember your password?{' '}
                <TextLink
                    href={login()}
                    className="font-medium text-zinc-950 underline-offset-4 transition-colors hover:underline dark:text-white"
                >
                    Log in
                </TextLink>
            </div>
        </div>
    );
}

ForgotPassword.layout = {
    title: 'Forgot password',
    description: 'Enter your email to receive a password reset link.',
};
