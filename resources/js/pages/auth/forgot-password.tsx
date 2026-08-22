import { Form, Head } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, Mail } from 'lucide-react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { email } from '@/routes/password';

const fieldGlow =
    'group relative rounded-xl transition-all duration-300 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.18)] hover:shadow-[0_0_0_3px_rgba(59,130,246,0.08)]';

export default function ForgotPassword({
    status,
}: {
    status?: string;
}) {
    return (
        <>
            <Head title="Reset password" />

            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Success Status */}
                {status && (
                    <div className="flex items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3.5 py-2 text-center text-xs font-medium text-blue-600 dark:text-blue-400">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        {status}
                    </div>
                )}

                <Form
                    {...email.form()}
                    resetOnSuccess={['email']}
                    className="flex flex-col gap-3.5"
                >
                    {({ processing, errors }) => (
                        <>
                            {/* Email Address */}
                            <div className="grid gap-1">
                                <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                                    Email address
                                </Label>

                                <div className={fieldGlow}>
                                    <Mail
                                        className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground transition-colors duration-300 group-focus-within:text-[#2563EB]"
                                    />

                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        autoComplete="email"
                                        autoFocus
                                        required
                                        placeholder="email@example.com"
                                        className="h-9.5 rounded-xl border-border bg-background pl-9 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:border-[#2563EB] focus-visible:ring-[#2563EB]/30"
                                    />
                                </div>

                                <InputError message={errors.email} />
                            </div>

                            <Button
                                type="submit"
                                className="group h-10 w-full rounded-xl bg-[#2563EB] text-xs font-semibold text-white shadow-[0_12px_28px_-10px_rgba(37,99,235,0.6)] transition-all duration-300 hover:scale-[1.01] hover:bg-[#1D4ED8] hover:shadow-[0_16px_36px_-10px_rgba(37,99,235,0.7)] disabled:opacity-70"
                                disabled={processing}
                                data-test="email-password-reset-link-button"
                            >
                                {processing ? (
                                    <Spinner />
                                ) : (
                                    <>
                                        <span>Send password reset link</span>
                                        <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </Form>

                <div className="text-center text-xs text-muted-foreground">
                    Remember your password?{' '}
                    <TextLink
                        href={login()}
                        className="font-semibold text-[#2563EB] transition-colors duration-300 hover:text-[#1D4ED8] dark:text-[#60A5FA] dark:hover:text-[#93C5FD]"
                    >
                        Log in
                    </TextLink>
                </div>
            </div>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Forgot password',
    description: 'Enter your email address to receive a secure password reset link.',
};