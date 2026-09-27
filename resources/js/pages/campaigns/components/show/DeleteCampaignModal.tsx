import { router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { CampaignData } from './types';

interface DeleteCampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
    campaign: CampaignData;
}

export function DeleteCampaignModal({
    isOpen,
    onClose,
    campaign,
}: DeleteCampaignModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);

        router.delete(`/campaigns/${campaign.id}`, {
            onSuccess: () => {
                toast.success('Campaign deleted successfully.');
                onClose();
            },
            onError: () => {
                toast.error('Failed to delete campaign.');
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
            <DialogContent className="rounded-2xl sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg">Delete Campaign?</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete{' '}
                        <span className="font-semibold text-foreground">
                            "{campaign?.name}"
                        </span>
                        ? This will remove the campaign record. Associated designs will remain safe in My Designs.
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
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="gap-2"
                    >
                        <Trash2 className="h-4 w-4" />
                        {isDeleting ? 'Deleting...' : 'Delete Campaign'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
