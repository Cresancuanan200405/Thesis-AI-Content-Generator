import { Form, Head } from '@inertiajs/react';
import {
    ArrowRight,
    Mail,
    User,
} from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { SocialAuthButtons } from '@/components/social-auth-buttons';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
};

const fieldGlow =
    'group relative rounded-xl transition-all duration-300 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.18)] hover:shadow-[0_0_0_3px_rgba(59,130,246,0.08)]';

export default function Register({ passwordRules }: Props) {
    return (
        <div className="space-y-6">
            <Head title="Create account" />

            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            {/* Name */}
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-sm font-medium text-foreground">
                                    Full name
                                </Label>

                                <div className={fieldGlow}>
                                    <User
                                        className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors duration-300 group-focus-within:text-[#2563EB]"
                                    />

                                    <Input
                                        id="name"
                                        type="text"
                                        name="name"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="name"
                                        placeholder="Full name"
                                        className="h-11 rounded-xl border-border bg-background pl-10 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-[#2563EB] focus-visible:ring-[#2563EB]/30"
                                    />
                                </div>

                                <InputError message={errors.name} />
                            </div>

                            {/* Email */}
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                                    Email address
                                </Label>

                                <div className={fieldGlow}>
                                    <Mail
                                        className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors duration-300 group-focus-within:text-[#2563EB]"
                                    />

                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        required
                                        tabIndex={2}
                                        autoComplete="email"
                                        placeholder="email@example.com"
                                        className="h-11 rounded-xl border-border bg-background pl-10 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-[#2563EB] focus-visible:ring-[#2563EB]/30"
                                    />
                                </div>

                                <InputError message={errors.email} />
                            </div>

                            {/* Password */}
                            <div className="grid gap-2">
                                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                                    Password
                                </Label>

                                <div className={fieldGlow}>
                                    <PasswordInput
                                        id="password"
                                        required
                                        tabIndex={3}
                                        autoComplete="new-password"
                                        name="password"
                                        placeholder="Create a password"
                                        passwordrules={passwordRules}
                                        className="h-11 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground/60"
                                    />
                                </div>

                                <InputError message={errors.password} />
                            </div>

                            {/* Password Confirmation */}
                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation" className="text-sm font-medium text-foreground">
                                    Confirm password
                                </Label>

                                <div className={fieldGlow}>
                                    <PasswordInput
                                        id="password_confirmation"
                                        required
                                        tabIndex={4}
                                        autoComplete="new-password"
                                        name="password_confirmation"
                                        placeholder="Confirm your password"
                                        passwordrules={passwordRules}
                                        className="h-11 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground/60"
                                    />
                                </div>

                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            {/* Social Auth Platforms */}
                            <SocialAuthButtons dividerText="Or continue with" />

                            {/* Create Account Button */}
                            <Button
                                type="submit"
                                className="group mt-2 h-11 w-full rounded-xl bg-[#2563EB] font-semibold text-white shadow-[0_15px_35px_-12px_rgba(37,99,235,0.6)] transition-all duration-300 hover:scale-[1.01] hover:bg-[#1D4ED8] hover:shadow-[0_20px_45px_-12px_rgba(37,99,235,0.7)] disabled:opacity-70 disabled:hover:scale-100"
                                tabIndex={5}
                                disabled={processing}
                                data-test="register-user-button"
                            >
                                {processing ? (
                                    <Spinner />
                                ) : (
                                    <>
                                        <span>Create account</span>
                                        <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Login Link */}
                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <TextLink
                                href={login()}
                                tabIndex={6}
                                className="font-semibold text-[#2563EB] transition-colors duration-300 hover:text-[#1D4ED8] dark:text-[#60A5FA] dark:hover:text-[#93C5FD]"
                            >
                                Log in
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </div>
    );
}

Register.layout = {
    title: 'Create your account',
    description:
        'Set up your workspace and start planning your next campaign.',
};