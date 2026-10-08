import { Form, usePage } from '@inertiajs/react';
import { useRef } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DeleteUserProps {
    hasPassword?: boolean;
}

export default function DeleteUser({ hasPassword }: DeleteUserProps) {
    const page = usePage();
    const pageProps = page.props as { hasPassword?: boolean };
    const effectiveHasPassword = hasPassword ?? pageProps.hasPassword ?? true;

    const passwordInput = useRef<HTMLInputElement>(null);
    const confirmationInput = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-6">
            <Heading
                variant="small"
                title="Delete account"
                description="Permanently delete your account and all associated workspace resources"
            />
            <div className="space-y-4 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-700/10">
                <div className="relative space-y-0.5 text-red-600 dark:text-red-100">
                    <p className="font-medium">Warning</p>
                    <p className="text-sm">
                        Please proceed with caution, this action cannot be undone. All your business profile data, products, generated designs, and media files will be permanently deleted.
                    </p>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            variant="destructive"
                            data-test="delete-user-button"
                        >
                            Delete account
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogTitle>
                            Permanently delete your account?
                        </DialogTitle>
                        <DialogDescription>
                            {effectiveHasPassword
                                ? 'Once your account is deleted, all of its resources, products, generated designs, and uploaded documents will be permanently erased. Please enter your password to confirm permanent account deletion.'
                                : 'Once your account is deleted, all of its resources, products, generated designs, and uploaded documents will be permanently erased. As your account is signed in via Google, please type DELETE below to confirm permanent account deletion.'}
                        </DialogDescription>

                        <Form
                            {...ProfileController.destroy.form()}
                            options={{
                                preserveScroll: true,
                            }}
                            onError={() => {
                                if (effectiveHasPassword) {
                                    passwordInput.current?.focus();
                                } else {
                                    confirmationInput.current?.focus();
                                }
                            }}
                            resetOnSuccess
                            className="space-y-6"
                        >
                            {({ resetAndClearErrors, processing, errors }) => (
                                <>
                                    {effectiveHasPassword ? (
                                        <div className="grid gap-2">
                                            <Label
                                                htmlFor="password"
                                                className="sr-only"
                                            >
                                                Password
                                            </Label>

                                            <PasswordInput
                                                id="password"
                                                name="password"
                                                ref={passwordInput}
                                                placeholder="Password"
                                                autoComplete="current-password"
                                            />

                                            <InputError message={errors.password} />
                                        </div>
                                    ) : (
                                        <div className="grid gap-2">
                                            <Label
                                                htmlFor="confirmation"
                                                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                                            >
                                                Type <span className="font-bold text-destructive">DELETE</span> to confirm
                                            </Label>

                                            <Input
                                                id="confirmation"
                                                name="confirmation"
                                                ref={confirmationInput}
                                                placeholder="DELETE"
                                                autoComplete="off"
                                            />

                                            <InputError message={errors.confirmation} />
                                        </div>
                                    )}

                                    <DialogFooter className="gap-2">
                                        <DialogClose asChild>
                                            <Button
                                                variant="secondary"
                                                onClick={() =>
                                                    resetAndClearErrors()
                                                }
                                            >
                                                Cancel
                                            </Button>
                                        </DialogClose>

                                        <Button
                                            variant="destructive"
                                            disabled={processing}
                                            asChild
                                        >
                                            <button
                                                type="submit"
                                                data-test="confirm-delete-user-button"
                                            >
                                                Permanently delete account
                                            </button>
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
