import { Form, Head } from '@inertiajs/react';
import {
    ArrowRight,
    Mail,
    User,
} from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
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

/*
|--------------------------------------------------------------------------
| Shared Field Glow
|--------------------------------------------------------------------------
|
| This matches the same visual treatment used on login.tsx.
| The blue color is kept consistent with the application's system theme.
|
*/

const fieldGlow =
    'group relative rounded-lg transition-all duration-300 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.18)] hover:shadow-[0_0_0_3px_rgba(59,130,246,0.08)]';

export default function Register({ passwordRules }: Props) {
    return (
        <>
            <Head title="Create account" />

            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">

                            {/* -------------------------------------------------
                                Name
                            ------------------------------------------------- */}
                            <div className="grid gap-2">
                                <Label htmlFor="name">
                                    Name
                                </Label>

                                <div className={fieldGlow}>
                                    <User
                                        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors duration-300 group-focus-within:text-[#3B82F6]"
                                    />

                                    <Input
                                        id="name"
                                        type="text"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="name"
                                        name="name"
                                        placeholder="Full name"
                                        className="pl-9 transition-colors duration-300 focus-visible:border-[#3B82F6] focus-visible:ring-[#3B82F6]/30"
                                    />
                                </div>

                                <InputError
                                    message={errors.name}
                                    className="mt-1"
                                />
                            </div>

                            {/* -------------------------------------------------
                                Email
                            ------------------------------------------------- */}
                            <div className="grid gap-2">
                                <Label htmlFor="email">
                                    Email address
                                </Label>

                                <div className={fieldGlow}>
                                    <Mail
                                        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors duration-300 group-focus-within:text-[#3B82F6]"
                                    />

                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        tabIndex={2}
                                        autoComplete="email"
                                        name="email"
                                        placeholder="email@example.com"
                                        className="pl-9 transition-colors duration-300 focus-visible:border-[#3B82F6] focus-visible:ring-[#3B82F6]/30"
                                    />
                                </div>

                                <InputError
                                    message={errors.email}
                                />
                            </div>

                            {/* -------------------------------------------------
                                Password
                            ------------------------------------------------- */}
                            <div className="grid gap-2">
                                <Label htmlFor="password">
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
                                    />
                                </div>

                                <InputError
                                    message={errors.password}
                                />
                            </div>

                            {/* -------------------------------------------------
                                Confirm Password
                            ------------------------------------------------- */}
                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
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
                                    />
                                </div>

                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            {/* -------------------------------------------------
                                Create Account Button
                            ------------------------------------------------- */}
                            <Button
                                type="submit"
                                className="group mt-2 w-full rounded-full bg-[#3B82F6] text-white shadow-[0_15px_35px_-12px_rgba(59,130,246,0.6)] transition-all duration-300 hover:scale-[1.02] hover:bg-[#2563EB] hover:shadow-[0_20px_45px_-12px_rgba(59,130,246,0.7)] disabled:opacity-70 disabled:hover:scale-100"
                                tabIndex={5}
                                disabled={processing}
                                data-test="register-user-button"
                            >
                                {processing ? (
                                    <Spinner />
                                ) : (
                                    <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                                )}

                                Create account
                            </Button>
                        </div>

                        {/* -----------------------------------------------------
                            Login Link
                        ----------------------------------------------------- */}
                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}

                            <TextLink
                                href={login()}
                                tabIndex={6}
                                className="text-[#2563EB] transition-colors duration-300 hover:text-[#3B82F6] dark:text-[#60A5FA] dark:hover:text-[#93C5FD]"
                            >
                                Log in
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Create your account',
    description:
        'Set up your workspace and start planning your next campaign.',
};