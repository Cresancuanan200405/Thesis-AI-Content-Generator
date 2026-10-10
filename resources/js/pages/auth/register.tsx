import { Form, Head } from '@inertiajs/react';
import React from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { SocialAuthButtons } from '@/components/social-auth-buttons';
import TextLink from '@/components/text-link';
import AuthLayout from '@/layouts/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
};

export default function Register({ passwordRules }: Props) {
    return (
        <div className="space-y-5">
            <Head title="Create an account" />

            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="space-y-4"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="space-y-2">
                            <Label
                                htmlFor="username"
                                className="text-sm font-medium text-zinc-700 dark:text-zinc-200"
                            >
                                Username
                            </Label>
                            <Input
                                id="username"
                                type="text"
                                name="username"
                                required
                                autoFocus
                                autoComplete="username"
                                placeholder="username"
                                className="h-12 rounded-xl border-zinc-200 bg-white px-4 text-base sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-900 focus-visible:ring-1 focus-visible:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:border-zinc-500 dark:focus-visible:ring-zinc-500/20"
                            />
                            <InputError message={errors.username} />
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="email"
                                className="text-sm font-medium text-zinc-700 dark:text-zinc-200"
                            >
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                required
                                autoComplete="email"
                                placeholder="name@example.com"
                                className="h-12 rounded-xl border-zinc-200 bg-white px-4 text-base sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-900 focus-visible:ring-1 focus-visible:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:border-zinc-500 dark:focus-visible:ring-zinc-500/20"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="password"
                                className="text-sm font-medium text-zinc-700 dark:text-zinc-200"
                            >
                                Password
                            </Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                required
                                autoComplete="new-password"
                                placeholder="Create a password"
                                passwordrules={passwordRules}
                                className="h-12 rounded-xl border-zinc-200 bg-white px-4 text-base sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-900 focus-visible:ring-1 focus-visible:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:border-zinc-500 dark:focus-visible:ring-zinc-500/20"
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="password_confirmation"
                                className="text-sm font-medium text-zinc-700 dark:text-zinc-200"
                            >
                                Confirm password
                            </Label>
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                required
                                autoComplete="new-password"
                                placeholder="Confirm your password"
                                className="h-12 rounded-xl border-zinc-200 bg-white px-4 text-base sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-900 focus-visible:ring-1 focus-visible:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:border-zinc-500 dark:focus-visible:ring-zinc-500/20"
                            />
                            <InputError message={errors.password_confirmation} />
                        </div>

                        <Button
                            type="submit"
                            disabled={processing}
                            className="mt-2 h-12 w-full cursor-pointer rounded-xl bg-zinc-950 text-base font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                            data-test="register-user-button"
                        >
                            {processing ? <Spinner /> : 'Create account'}
                        </Button>

                        <SocialAuthButtons dividerText="OR" />

                        {/* Login link below social selector */}
                        <p className="pt-2.5 text-center text-sm text-zinc-500 dark:text-zinc-400">
                            Already have an account?{' '}
                            <TextLink
                                href={login()}
                                className="font-semibold text-zinc-950 underline-offset-4 transition-colors hover:underline dark:text-white"
                            >
                                Log in
                            </TextLink>
                        </p>
                    </>
                )}
            </Form>
        </div>
    );
}

Register.layout = (page: React.ReactNode) => (
    <AuthLayout title="Create an account">
        {page}
    </AuthLayout>
);
