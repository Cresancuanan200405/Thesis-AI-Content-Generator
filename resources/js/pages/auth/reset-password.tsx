import { Form, Head } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
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

const fieldGlow =
    'group relative rounded-xl transition-all duration-300 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.18)] hover:shadow-[0_0_0_3px_rgba(59,130,246,0.08)]';

export default function ResetPassword({ token, email, passwordRules }: Props) {
    return (
        <>
            <Head title="Choose a new password" />

            <Form
                {...update.form()}
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
                className="animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
                {({ processing, errors }) => (
                    <div className="grid gap-5">
                        <div className="grid gap-2">
                            <Label htmlFor="email" className="text-sm font-medium text-foreground">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                value={email}
                                className="h-11 rounded-xl border-border bg-muted/40 text-muted-foreground"
                                readOnly
                            />
                            <InputError
                                message={errors.email}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password" className="text-sm font-medium text-foreground">
                                New password
                            </Label>
                            <div className={fieldGlow}>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    autoComplete="new-password"
                                    className="h-11 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground/60"
                                    autoFocus
                                    placeholder="Enter new password"
                                    passwordrules={passwordRules}
                                />
                            </div>
                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation" className="text-sm font-medium text-foreground">
                                Confirm password
                            </Label>
                            <div className={fieldGlow}>
                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    autoComplete="new-password"
                                    className="h-11 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground/60"
                                    placeholder="Confirm new password"
                                    passwordrules={passwordRules}
                                />
                            </div>
                            <InputError
                                message={errors.password_confirmation}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="group mt-2 h-11 w-full rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-[1.01] hover:bg-primary/90 hover:shadow-primary/35 active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 cursor-pointer"
                            disabled={processing}
                            data-test="reset-password-button"
                        >
                            {processing ? (
                                <Spinner />
                            ) : (
                                <>
                                    <span>Reset password</span>
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </Form>
        </>
    );
}

ResetPassword.layout = {
    title: 'Choose a new password',
    description:
        'Create a strong password to protect your marketing workspace.',
};
