import { Form, Head } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, Mail } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
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

/*
|--------------------------------------------------------------------------
| System Blue Theme
|--------------------------------------------------------------------------
|
| Primary Blue  : #2563EB
| Hover Blue    : #3B82F6
| Dark Blue     : #1D4ED8
| Deep Blue     : #172554
|
*/

const fieldGlow =
    'group relative rounded-lg transition-all duration-300 ' +
    'focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.18)] ' +
    'hover:shadow-[0_0_0_3px_rgba(59,130,246,0.08)]';

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Welcome back" />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6 duration-500 animate-in fade-in slide-in-from-bottom-2"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">

                            {/* ------------------------------------------------ */}
                            {/* Email Address                                   */}
                            {/* ------------------------------------------------ */}

                            <div className="grid gap-2">
                                <Label htmlFor="email">
                                    Email address
                                </Label>

                                <div className={fieldGlow}>
                                    <Mail
                                        className="
                                            pointer-events-none
                                            absolute
                                            top-1/2
                                            left-3
                                            h-4
                                            w-4
                                            -translate-y-1/2
                                            text-slate-400
                                            transition-colors
                                            duration-300
                                            group-focus-within:text-[#2563EB]
                                            dark:text-slate-500
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
                                            border-slate-200 bg-white text-slate-900
                                            pl-9
                                            transition-colors duration-300
                                            placeholder:text-slate-400
                                            focus-visible:border-[#2563EB]
                                            focus-visible:ring-[#2563EB]/30
                                            dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500
                                        "
                                    />
                                </div>

                                <InputError message={errors.email} />
                            </div>

                            {/* ------------------------------------------------ */}
                            {/* Password                                        */}
                            {/* ------------------------------------------------ */}

                            <div className="grid gap-2">
                                <Label htmlFor="password">
                                    Password
                                </Label>

                                <div className={fieldGlow}>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder="Password"
                                    />
                                </div>

                                <InputError message={errors.password} />

                                {/* Forgot Password */}

                                {canResetPassword && (
                                    <div className="flex justify-end">
                                        <TextLink
                                            href={request()}
                                            className="
                                                text-sm
                                                text-[#2563EB]
                                                transition-colors
                                                duration-300
                                                hover:text-[#1D4ED8]
                                                dark:text-[#60A5FA]
                                                dark:hover:text-[#93C5FD]
                                            "
                                            tabIndex={5}
                                        >
                                            Forgot your password?
                                        </TextLink>
                                    </div>
                                )}
                            </div>

                            {/* ------------------------------------------------ */}
                            {/* Remember Me                                     */}
                            {/* ------------------------------------------------ */}

                            <label
                                htmlFor="remember"
                                className="
                                    -mx-2
                                    flex
                                    cursor-pointer
                                    items-center
                                    space-x-3
                                    rounded-lg
                                    px-2
                                    py-1.5
                                    transition-colors
                                    duration-300
                                    hover:bg-[#2563EB]/5
                                "
                            >
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                    className="
                                        transition-colors
                                        duration-300
                                        focus-visible:ring-[#2563EB]/40
                                        data-[state=checked]:border-[#2563EB]
                                        data-[state=checked]:bg-[#2563EB]
                                        data-[state=checked]:text-white
                                    "
                                />

                                <Label
                                    htmlFor="remember"
                                    className="cursor-pointer"
                                >
                                    Remember me
                                </Label>
                            </label>

                            {/* ------------------------------------------------ */}
                            {/* Login Button                                    */}
                            {/* ------------------------------------------------ */}

                            <Button
                                type="submit"
                                className="
                                    group
                                    mt-4
                                    w-full
                                    rounded-full
                                    bg-[#2563EB]
                                    text-white
                                    shadow-[0_15px_35px_-12px_rgba(37,99,235,0.6)]
                                    transition-all
                                    duration-300
                                    hover:scale-[1.02]
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
                                    <ArrowRight
                                        className="
                                            h-4
                                            w-4
                                            -translate-x-1
                                            opacity-0
                                            transition-all
                                            duration-300
                                            group-hover:translate-x-0
                                            group-hover:opacity-100
                                        "
                                    />
                                )}

                                Log in
                            </Button>
                        </div>

                        {/* ---------------------------------------------------- */}
                        {/* Sign Up                                             */}
                        {/* ---------------------------------------------------- */}

                        <div className="text-center text-sm text-muted-foreground">
                            Don't have an account?{' '}

                            <TextLink
                                href={register()}
                                tabIndex={6}
                                className="
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

            {/* -------------------------------------------------------------- */}
            {/* Status Message                                                 */}
            {/* -------------------------------------------------------------- */}

            {status && (
                <div
                    className="
                        mt-4
                        flex
                        items-center
                        justify-center
                        gap-2
                        rounded-lg
                        border
                        border-blue-500/30
                        bg-blue-500/10
                        px-4
                        py-2
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
        </>
    );
}

Login.layout = {
    title: 'Welcome back',
    description:
        'Sign in to keep your campaigns, brand guidance, and content calendar moving.',
};