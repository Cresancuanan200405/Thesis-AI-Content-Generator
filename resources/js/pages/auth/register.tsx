import { Form, Head } from '@inertiajs/react';
import { ArrowRight, Mail, User } from 'lucide-react';
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
        <div className="space-y-3.5">
            <Head title="Create account" />

            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex animate-in flex-col gap-3.5 duration-300 fade-in slide-in-from-bottom-2"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-3">
                            {/* Row 1: Name & Email side-by-side */}
                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                {/* Name */}
                                <div className="grid gap-1">
                                    <Label
                                        htmlFor="name"
                                        className="text-xs font-semibold text-foreground"
                                    >
                                        Full name
                                    </Label>

                                    <div className={fieldGlow}>
                                        <User className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground transition-colors duration-300 group-focus-within:text-[#2563EB]" />

                                        <Input
                                            id="name"
                                            type="text"
                                            name="name"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="name"
                                            placeholder="Full name"
                                            className="h-9.5 rounded-xl border-border bg-background pl-9 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:border-[#2563EB] focus-visible:ring-[#2563EB]/30"
                                        />
                                    </div>

                                    <InputError message={errors.name} />
                                </div>

                                {/* Email */}
                                <div className="grid gap-1">
                                    <Label
                                        htmlFor="email"
                                        className="text-xs font-semibold text-foreground"
                                    >
                                        Email address
                                    </Label>

                                    <div className={fieldGlow}>
                                        <Mail className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground transition-colors duration-300 group-focus-within:text-[#2563EB]" />

                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            required
                                            tabIndex={2}
                                            autoComplete="email"
                                            placeholder="email@example.com"
                                            className="h-9.5 rounded-xl border-border bg-background pl-9 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:border-[#2563EB] focus-visible:ring-[#2563EB]/30"
                                        />
                                    </div>

                                    <InputError message={errors.email} />
                                </div>
                            </div>

                            {/* Row 2: Password & Confirm Password side-by-side */}
                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                {/* Password */}
                                <div className="grid gap-1">
                                    <Label
                                        htmlFor="password"
                                        className="text-xs font-semibold text-foreground"
                                    >
                                        Password
                                    </Label>

                                    <div className={fieldGlow}>
                                        <PasswordInput
                                            id="password"
                                            required
                                            tabIndex={3}
                                            autoComplete="new-password"
                                            name="password"
                                            placeholder="Password"
                                            passwordrules={passwordRules}
                                            className="h-9.5 rounded-xl border-border bg-background text-xs text-foreground placeholder:text-muted-foreground/60"
                                        />
                                    </div>

                                    <InputError message={errors.password} />
                                </div>

                                {/* Password Confirmation */}
                                <div className="grid gap-1">
                                    <Label
                                        htmlFor="password_confirmation"
                                        className="text-xs font-semibold text-foreground"
                                    >
                                        Confirm password
                                    </Label>

                                    <div className={fieldGlow}>
                                        <PasswordInput
                                            id="password_confirmation"
                                            required
                                            tabIndex={4}
                                            autoComplete="new-password"
                                            name="password_confirmation"
                                            placeholder="Confirm password"
                                            passwordrules={passwordRules}
                                            className="h-9.5 rounded-xl border-border bg-background text-xs text-foreground placeholder:text-muted-foreground/60"
                                        />
                                    </div>

                                    <InputError
                                        message={errors.password_confirmation}
                                    />
                                </div>
                            </div>

                            {/* Social Auth Platforms */}
                            <SocialAuthButtons dividerText="Or continue with" />

                            {/* Create Account Button */}
                            <Button
                                type="submit"
                                className="group mt-1.5 h-10 w-full cursor-pointer rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-[1.01] hover:bg-primary/90 hover:shadow-primary/35 active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
                                tabIndex={5}
                                disabled={processing}
                                data-test="register-user-button"
                            >
                                {processing ? (
                                    <Spinner />
                                ) : (
                                    <>
                                        <span>Create account</span>
                                        <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Login Link */}
                        <div className="pt-1 text-center text-xs text-muted-foreground">
                            Already have an account?{' '}
                            <TextLink
                                href={login()}
                                tabIndex={6}
                                className="font-bold text-primary transition-colors duration-300 hover:text-primary/80"
                            >
                                Log in &rarr;
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
    description: 'Sign up to start automating your visual marketing campaigns.',
};
