import { Form, Head } from '@inertiajs/react';
import React from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { update } from '@/routes/password';

type Props = {
    token: string;
    email: string;
    passwordRules: string;
};

export default function ResetPassword({ token, email, passwordRules }: Props) {
    return (
        <div className="space-y-4">
            <Head title="Reset password" />

            <Form
                {...update.form()}
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
                className="space-y-3.5"
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
                                value={email}
                                readOnly
                                className="h-11 sm:h-12 rounded-xl border-zinc-200 bg-zinc-100/60 px-4 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="space-y-1.5">
                            <Label
                                htmlFor="password"
                                className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
                            >
                                New password
                            </Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                autoComplete="new-password"
                                autoFocus
                                required
                                placeholder="Enter new password"
                                passwordrules={passwordRules}
                                className="h-11 sm:h-12 rounded-xl border-zinc-200 bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-900 focus-visible:ring-1 focus-visible:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:border-zinc-500 dark:focus-visible:ring-zinc-500/20"
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="space-y-1.5">
                            <Label
                                htmlFor="password_confirmation"
                                className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
                            >
                                Confirm password
                            </Label>
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                autoComplete="new-password"
                                required
                                placeholder="Confirm new password"
                                passwordrules={passwordRules}
                                className="h-11 sm:h-12 rounded-xl border-zinc-200 bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-900 focus-visible:ring-1 focus-visible:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:border-zinc-500 dark:focus-visible:ring-zinc-500/20"
                            />
                            <InputError message={errors.password_confirmation} />
                        </div>

                        <Button
                            type="submit"
                            disabled={processing}
                            className="mt-2 h-11 sm:h-12 w-full cursor-pointer rounded-xl bg-zinc-950 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                            data-test="reset-password-button"
                        >
                            {processing ? <Spinner /> : 'Reset password'}
                        </Button>
                    </>
                )}
            </Form>
        </div>
    );
}

ResetPassword.layout = {
    title: 'Reset password',
    description: 'Enter a new password for your account.',
};
