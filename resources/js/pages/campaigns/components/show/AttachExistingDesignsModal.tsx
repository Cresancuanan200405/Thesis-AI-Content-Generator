import { router } from '@inertiajs/react';
import { Check, FolderPlus, ImageIcon } from 'lucide-react';
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
import { AvailableDesign, CampaignData } from './types';

interface AttachExistingDesignsModalProps {
    isOpen: boolean;
    onClose: () => void;
    campaign: CampaignData;
    availableDesigns: AvailableDesign[];
}

export function AttachExistingDesignsModal({
    isOpen,
    onClose,
    campaign,
    availableDesigns,
}: AttachExistingDesignsModalProps) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toggleDesign = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    };

    const handleConfirm = () => {
        if (selectedIds.length === 0) {
            return;
        }

        setIsSubmitting(true);

        router.post(
            `/campaigns/${campaign.id}/attach-designs`,
            { design_ids: selectedIds },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        `${selectedIds.length} visual(s) added to campaign.`,
                    );
                    setSelectedIds([]);
                    onClose();
                },
                onError: () => {
                    toast.error('Failed to add visuals to campaign.');
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open && !isSubmitting) {
                    setSelectedIds([]);
                    onClose();
                }
            }}
        >
            <DialogContent className="flex max-h-[85vh] flex-col rounded-2xl sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <FolderPlus className="h-5 w-5 text-amber-500" />
                        Attach Existing Visuals
                    </DialogTitle>
                    <DialogDescription>
                        Select visuals created for{' '}
                        <span className="font-semibold text-foreground">
                            {campaign.event_name || 'this event'}
                        </span>{' '}
                        to attach to "{campaign.name}".
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {availableDesigns.map((d) => {
                            const isChosen = selectedIds.includes(d.id);

                            return (
                                <button
                                    key={d.id}
                                    type="button"
                                    onClick={() => toggleDesign(d.id)}
                                    className={`group relative aspect-square cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-200 text-left ${
                                        isChosen
                                            ? 'border-primary ring-2 ring-primary/40 shadow-sm'
                                            : 'border-border/80 hover:border-primary/50'
                                    }`}
                                >
                                    {d.image_url ? (
                                        <img
                                            src={d.image_url}
                                            alt={d.product_name || 'Visual'}
                                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                                            <ImageIcon className="h-6 w-6 opacity-40" />
                                        </div>
                                    )}

                                    {isChosen && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-primary/25">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                                                <Check className="h-4 w-4 stroke-[3]" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-4">
                                        <p className="truncate text-[11px] font-medium text-white">
                                            {d.product_name || 'Untitled'}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <DialogFooter className="mt-4 gap-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isSubmitting || selectedIds.length === 0}
                        className="gap-2"
                    >
                        <FolderPlus className="h-4 w-4" />
                        {isSubmitting
                            ? 'Adding...'
                            : `Add ${selectedIds.length || ''} Visual${selectedIds.length !== 1 ? 's' : ''}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
