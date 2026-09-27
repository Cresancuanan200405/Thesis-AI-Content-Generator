import { Trash2 } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { CampaignDesign } from './types';

interface DeleteDesignModalProps {
    design: CampaignDesign | null;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isDeleting?: boolean;
}

export function DeleteDesignModal({
    design,
    isOpen,
    onClose,
    onConfirm,
    isDeleting = false,
}: DeleteDesignModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
            <DialogContent
                className="z-[160] rounded-2xl sm:max-w-md"
                overlayClassName="z-[160]"
            >
                <DialogHeader>
                    <DialogTitle className="text-lg">Delete Visual?</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete{' '}
                        <span className="font-semibold text-foreground">
                            "{design?.product_name || 'this visual'}"
                        </span>
                        ? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="mt-6 gap-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="gap-2"
                    >
                        <Trash2 className="h-4 w-4" />
                        {isDeleting ? 'Deleting...' : 'Delete Visual'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
