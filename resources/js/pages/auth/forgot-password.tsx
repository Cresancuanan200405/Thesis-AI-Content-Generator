import { Form, Head } from '@inertiajs/react';
import {
    ArrowRight,
    CheckCircle2,
    LoaderCircle,
    Mail,
} from 'lucide-react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/routes';
import { email } from '@/routes/password';

const fieldGlow =
    'group relative rounded-lg transition-all duration-300 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.18)] hover:shadow-[0_0_0_3px_rgba(59,130,246,0.08)]';

export default function ForgotPassword({
    status,
}: {
    status?: string;
}) {
    return (
        <>
            <Head title="Reset password" />

            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* Success Status */}
                {status && (
                    <div className="flex items-center justify-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-center text-sm font-medium text-blue-600 animate-in fade-in slide-in-from-top-1 dark:text-blue-400">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        {status}
                    </div>
                )}

                <Form
                    {...email.form()}
                    resetOnSuccess={['email']}
                    className="flex flex-col gap-6"
                >
                    {({ processing, errors }) => (
                        <>
                            {/* Email Address */}
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
                                        name="email"
                                        autoComplete="email"
                                        autoFocus
                                        required
                                        placeholder="email@example.com"
                                        className="pl-9 transition-colors duration-300 focus-visible:border-[#3B82F6] focus-visible:ring-[#3B82F6]/30"
                                    />
                                </div>

                                <InputError message={errors.email} />
                            </div>

                            {/* Send Reset Link */}
                            <Button
                                type="submit"
                                className="group mt-2 w-full rounded-full bg-[#3B82F6] text-white shadow-[0_15px_35px_-12px_rgba(59,130,246,0.6)] transition-all duration-300 hover:scale-[1.02] hover:bg-[#2563EB] hover:shadow-[0_20px_45px_-12px_rgba(59,130,246,0.7)] disabled:opacity-70 disabled:hover:scale-100"
                                disabled={processing}
                                data-test="email-password-reset-link-button"
                            >
                                {processing ? (
                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                ) : (
                                    <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                                )}

                                Email password reset link
                            </Button>
                        </>
                    )}
                </Form>

                {/* Return to Login */}
                <div className="text-center text-sm text-muted-foreground">
                    Or, return to{' '}

                    <TextLink
                        href={login()}
                        className="text-[#2563EB] transition-colors duration-300 hover:text-[#3B82F6] dark:text-[#60A5FA] dark:hover:text-[#93C5FD]"
                    >
                        log in
                    </TextLink>
                </div>
            </div>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Reset your password',
    description:
        'Enter your email and we’ll send a secure reset link to continue.',
};