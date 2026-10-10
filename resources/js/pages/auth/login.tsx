import { Form, Head } from '@inertiajs/react';
import React, { useEffect, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { SocialAuthButtons } from '@/components/social-auth-buttons';
import TextLink from '@/components/text-link';
import AuthLayout from '@/layouts/auth-layout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    const [step, setStep] = useState<'email' | 'password'>('email');
    const [email, setEmail] = useState<string>('');
    const [emailError, setEmailError] = useState<string | null>(null);
    const passwordInputRef = useRef<HTMLInputElement>(null);

    const handleContinue = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = email.trim();
        if (!trimmed) {
            setEmailError('Please enter your email or username.');
            return;
        }
        setEmailError(null);
        setStep('password');
    };

    useEffect(() => {
        if (step === 'password') {
            passwordInputRef.current?.focus();
        }
    }, [step]);

    return (
        <div className="space-y-5">
            <Head title="Hello there!" />

            {/* Status Message */}
            {status && (
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2.5 text-center text-sm font-medium text-blue-400">
                    {status}
                </div>
            )}

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="space-y-5"
            >
                {({ processing, errors }) => {
                    const activeEmailError = emailError || errors.email;

                    return (
                        <>
                            {step === 'email' ? (
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="email"
                                            className="text-sm font-medium text-zinc-700 dark:text-zinc-200"
                                        >
                                            Email
                                        </Label>
                                        <Input
                                            id="email"
                                            type="text"
                                            name="email"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                if (emailError) setEmailError(null);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleContinue();
                                                }
                                            }}
                                            required
                                            autoFocus
                                            autoComplete="username"
                                            placeholder="name@example.com"
                                            className="h-12 rounded-xl border-zinc-200 bg-white px-4 text-base sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-900 focus-visible:ring-1 focus-visible:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:border-zinc-500 dark:focus-visible:ring-zinc-500/20"
                                        />
                                        <InputError message={activeEmailError} />
                                    </div>

                                    {/* Primary Continue Button */}
                                    <Button
                                        type="button"
                                        onClick={() => handleContinue()}
                                        className="h-12 w-full cursor-pointer rounded-xl bg-zinc-950 text-base font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800 active:scale-[0.99] dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                                        data-test="login-continue-button"
                                    >
                                        Continue
                                    </Button>

                                    {/* Social Auth Platforms */}
                                    <SocialAuthButtons dividerText="OR" />

                                    {/* Sign-up link below social selector */}
                                    <p className="pt-2.5 text-center text-sm text-zinc-500 dark:text-zinc-400">
                                        Don't have an account?{' '}
                                        <TextLink
                                            href={register()}
                                            className="font-semibold text-zinc-950 underline-offset-4 transition-colors hover:underline dark:text-white"
                                        >
                                            Sign up
                                        </TextLink>
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-5 animate-in fade-in duration-200">
                                    {/* Selected Email display pill */}
                                    <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-100/80 px-4 py-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-900/40">
                                        <span className="truncate font-medium text-zinc-700 dark:text-zinc-300">
                                            {email}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setStep('email')}
                                            className="ml-2 cursor-pointer text-xs font-semibold text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                                        >
                                            Change
                                        </button>
                                    </div>

                                    {/* Hidden Email input for standard Fortify POST */}
                                    <input type="hidden" name="email" value={email} />

                                    {/* Password field */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label
                                                htmlFor="password"
                                                className="text-sm font-medium text-zinc-700 dark:text-zinc-200"
                                            >
                                                Password
                                            </Label>
                                            {canResetPassword && (
                                                <TextLink
                                                    href={request()}
                                                    className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                                                    tabIndex={5}
                                                >
                                                    Forgot password?
                                                </TextLink>
                                            )}
                                        </div>

                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            required
                                            autoFocus
                                            ref={passwordInputRef}
                                            autoComplete="current-password"
                                            placeholder="Enter your password"
                                            className="h-12 rounded-xl border-zinc-200 bg-white px-4 text-base sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-900 focus-visible:ring-1 focus-visible:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:border-zinc-500 dark:focus-visible:ring-zinc-500/20"
                                        />

                                        <InputError message={errors.password || errors.email} />
                                    </div>

                                    {/* Remember Me */}
                                    <label
                                        htmlFor="remember"
                                        className="flex cursor-pointer items-center space-x-2.5 py-0.5"
                                    >
                                        <Checkbox
                                            id="remember"
                                            name="remember"
                                            className="h-4.5 w-4.5 rounded border-zinc-300 bg-white data-[state=checked]:bg-zinc-950 data-[state=checked]:text-white dark:border-zinc-700 dark:bg-zinc-900/60 dark:data-[state=checked]:bg-white dark:data-[state=checked]:text-black"
                                        />
                                        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                            Remember me
                                        </span>
                                    </label>

                                    {/* Submit Button */}
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="h-12 w-full cursor-pointer rounded-xl bg-zinc-950 text-base font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                                        data-test="login-button"
                                    >
                                        {processing ? <Spinner /> : 'Log in'}
                                    </Button>

                                    {/* Sign-up link below password form */}
                                    <p className="pt-2.5 text-center text-sm text-zinc-500 dark:text-zinc-400">
                                        Don't have an account?{' '}
                                        <TextLink
                                            href={register()}
                                            className="font-semibold text-zinc-950 underline-offset-4 transition-colors hover:underline dark:text-white"
                                        >
                                            Sign up
                                        </TextLink>
                                    </p>
                                </div>
                            )}
                        </>
                    );
                }}
            </Form>
        </div>
    );
}

Login.layout = (page: React.ReactNode) => (
    <AuthLayout
        title="Hello there!"
        titleClassName="text-5xl sm:text-[54px] md:text-6xl font-black tracking-tight leading-[1.05]"
    >
        {page}
    </AuthLayout>
);
