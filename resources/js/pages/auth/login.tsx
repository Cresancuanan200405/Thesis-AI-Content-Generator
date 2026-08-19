import { Form, Head } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, Mail } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { SocialAuthButtons } from '@/components/social-auth-buttons';
import TextLink from '@/components/text-link';
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

const fieldGlow =
    'group relative rounded-xl transition-all duration-300 ' +
    'focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.18)] ' +
    'hover:shadow-[0_0_0_3px_rgba(59,130,246,0.08)]';

export default function Login({ status, canResetPassword }: Props) {
    return (
        <div className="space-y-6">
            <Head title="Welcome back" />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6 duration-500 animate-in fade-in slide-in-from-bottom-2"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            {/* Email Address */}
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                                    Email address
                                </Label>

                                <div className={fieldGlow}>
                                    <Mail
                                        className="
                                            pointer-events-none
                                            absolute
                                            top-1/2
                                            left-3.5
                                            h-4
                                            w-4
                                            -translate-y-1/2
                                            text-muted-foreground
                                            transition-colors
                                            duration-300
                                            group-focus-within:text-[#2563EB]
                                        "
                                    />

                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="email"
                                        placeholder="email@example.com"
                                        className="
                                            h-11
                                            rounded-xl
                                            border-border
                                            bg-background
                                            pl-10
                                            text-foreground
                                            transition-colors
                                            duration-300
                                            placeholder:text-muted-foreground/60
                                            focus-visible:border-[#2563EB]
                                            focus-visible:ring-[#2563EB]/30
                                        "
                                    />
                                </div>

                                <InputError message={errors.email} />
                            </div>

                            {/* Password */}
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-sm font-medium text-foreground">
                                        Password
                                    </Label>

                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="
                                                text-xs
                                                font-medium
                                                text-[#2563EB]
                                                transition-colors
                                                duration-300
                                                hover:text-[#1D4ED8]
                                                dark:text-[#60A5FA]
                                                dark:hover:text-[#93C5FD]
                                            "
                                            tabIndex={5}
                                        >
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>

                                <div className={fieldGlow}>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder="Enter your password"
                                        className="h-11 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground/60"
                                    />
                                </div>

                                <InputError message={errors.password} />
                            </div>

                            {/* Remember Me */}
                            <label
                                htmlFor="remember"
                                className="
                                    flex
                                    cursor-pointer
                                    items-center
                                    space-x-3
                                    rounded-lg
                                    py-1
                                    transition-colors
                                    duration-300
                                "
                            >
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                    className="
                                        rounded-md
                                        border-border
                                        transition-colors
                                        duration-300
                                        focus-visible:ring-[#2563EB]/40
                                        data-[state=checked]:border-[#2563EB]
                                        data-[state=checked]:bg-[#2563EB]
                                        data-[state=checked]:text-white
                                    "
                                />

                                <span className="cursor-pointer text-sm text-muted-foreground">
                                    Remember me
                                </span>
                            </label>

                            {/* Social Auth Platforms */}
                            <SocialAuthButtons dividerText="Or continue with" />

                            {/* Login Button */}
                            <Button
                                type="submit"
                                className="
                                    group
                                    mt-2
                                    h-11
                                    w-full
                                    rounded-xl
                                    bg-[#2563EB]
                                    font-semibold
                                    text-white
                                    shadow-[0_15px_35px_-12px_rgba(37,99,235,0.6)]
                                    transition-all
                                    duration-300
                                    hover:scale-[1.01]
                                    hover:bg-[#1D4ED8]
                                    hover:shadow-[0_20px_45px_-12px_rgba(37,99,235,0.7)]
                                    disabled:opacity-70
                                    disabled:hover:scale-100
                                "
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing ? (
                                    <Spinner />
                                ) : (
                                    <>
                                        <span>Log in</span>
                                        <ArrowRight
                                            className="
                                                ml-2
                                                h-4
                                                w-4
                                                transition-transform
                                                duration-300
                                                group-hover:translate-x-1
                                            "
                                        />
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Sign Up */}
                        <div className="text-center text-sm text-muted-foreground">
                            Don't have an account?{' '}
                            <TextLink
                                href={register()}
                                tabIndex={6}
                                className="
                                    font-semibold
                                    text-[#2563EB]
                                    transition-colors
                                    duration-300
                                    hover:text-[#1D4ED8]
                                    dark:text-[#60A5FA]
                                    dark:hover:text-[#93C5FD]
                                "
                            >
                                Sign up
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>

            {/* Status Message */}
            {status && (
                <div
                    className="
                        mt-4
                        flex
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        border
                        border-blue-500/30
                        bg-blue-500/10
                        px-4
                        py-2.5
                        text-center
                        text-sm
                        font-medium
                        text-blue-700
                        duration-300
                        animate-in
                        fade-in
                        slide-in-from-top-1
                        dark:text-blue-400
                    "
                >
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {status}
                </div>
            )}
        </div>
    );
}

Login.layout = {
    title: 'Welcome back',
    description:
        'Sign in to keep your campaigns, brand guidance, and content calendar moving.',
};