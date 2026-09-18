import { Form } from '@inertiajs/react';
import { KeyRound, Lock } from 'lucide-react';
import React, { useRef, useState } from 'react';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface ChangePasswordDialogProps {
    passwordRules?: string;
    hasPassword?: boolean;
    trigger?: React.ReactNode;
}

export function ChangePasswordDialog({
    passwordRules = '',
    hasPassword = true,
    trigger,
}: ChangePasswordDialogProps) {
    const [open, setOpen] = useState(false);
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 rounded-xl border-border/80 px-4 text-xs font-semibold shadow-xs hover:bg-muted"
                    >
                        <KeyRound className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                        {hasPassword ? 'Change Password' : 'Set Password'}
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="rounded-3xl p-6 sm:max-w-md">
                <DialogHeader>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-1">
                        <Lock className="h-5 w-5" />
                    </div>
                    <DialogTitle className="text-lg font-bold text-foreground">
                        {hasPassword ? 'Change Account Password' : 'Set Account Password'}
                    </DialogTitle>
                    <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
                        Ensure your account uses a strong, unique password to stay protected against unauthorized access.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...SecurityController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    resetOnError={[
                        'password',
                        'password_confirmation',
                        'current_password',
                    ]}
                    resetOnSuccess
                    onSuccess={() => {
                        setOpen(false);
                    }}
                    onError={(errors) => {
                        if (errors.password) {
                            passwordInput.current?.focus();
                        }

                        if (errors.current_password) {
                            currentPasswordInput.current?.focus();
                        }
                    }}
                    className="space-y-4 pt-2"
                >
                    {({ errors, processing }) => (
                        <>
                            {hasPassword && (
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="dialog_current_password"
                                        className="text-xs font-bold text-foreground"
                                    >
                                        Current Password
                                    </Label>
                                    <PasswordInput
                                        id="dialog_current_password"
                                        ref={currentPasswordInput}
                                        name="current_password"
                                        className="h-11 rounded-xl text-sm"
                                        autoComplete="current-password"
                                        placeholder="Enter your current password"
                                    />
                                    <InputError
                                        message={errors.current_password}
                                        className="text-xs font-semibold text-destructive"
                                    />
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="dialog_password"
                                    className="text-xs font-bold text-foreground"
                                >
                                    New Password
                                </Label>
                                <PasswordInput
                                    id="dialog_password"
                                    ref={passwordInput}
                                    name="password"
                                    className="h-11 rounded-xl text-sm"
                                    autoComplete="new-password"
                                    placeholder="Enter new password"
                                    passwordrules={passwordRules}
                                />
                                <InputError
                                    message={errors.password}
                                    className="text-xs font-semibold text-destructive"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="dialog_password_confirmation"
                                    className="text-xs font-bold text-foreground"
                                >
                                    Confirm New Password
                                </Label>
                                <PasswordInput
                                    id="dialog_password_confirmation"
                                    name="password_confirmation"
                                    className="h-11 rounded-xl text-sm"
                                    autoComplete="new-password"
                                    placeholder="Confirm new password"
                                    passwordrules={passwordRules}
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                    className="text-xs font-semibold text-destructive"
                                />
                            </div>

                            <DialogFooter className="gap-2 pt-3">
                                <DialogClose asChild>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="rounded-xl text-xs font-semibold"
                                    >
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-xl px-5 text-xs font-bold shadow-xs"
                                >
                                    {processing ? 'Updating...' : 'Update Password'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default ChangePasswordDialog;
