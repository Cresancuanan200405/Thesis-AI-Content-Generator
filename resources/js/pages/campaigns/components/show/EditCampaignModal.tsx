import { router } from '@inertiajs/react';
import { Check, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CampaignData } from './types';

interface EditCampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
    campaign: CampaignData;
}

export function EditCampaignModal({
    isOpen,
    onClose,
    campaign,
}: EditCampaignModalProps) {
    const [name, setName] = useState(campaign?.name || '');
    const [startDate, setStartDate] = useState(campaign?.start_date || '');
    const [endDate, setEndDate] = useState(campaign?.end_date || '');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName(campaign?.name || '');
            setStartDate(campaign?.start_date || '');
            setEndDate(campaign?.end_date || '');
            setErrors({});
        }
    }, [isOpen, campaign]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isSaving) {
            return;
        }

        const newErrors: Record<string, string> = {};
        const trimmedName = name.trim();

        if (!trimmedName) {
            newErrors.name = 'Campaign name is required.';
        }

        if (startDate && endDate && startDate > endDate) {
            newErrors.end_date = 'Start date must not be after end date.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSaving(true);
        setErrors({});

        router.put(
            `/campaigns/${campaign.id}`,
            {
                name: trimmedName,
                start_date: startDate || null,
                end_date: endDate || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    onClose();
                    toast.success('Campaign updated successfully.');
                },
                onError: (errs) => {
                    setErrors(errs);
                    toast.error('Failed to update campaign. Please check inputs.');
                },
                onFinish: () => {
                    setIsSaving(false);
                },
            },
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !isSaving && onClose()}>
            <DialogContent className="rounded-2xl sm:max-w-lg">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-lg">Edit Campaign</DialogTitle>
                        <DialogDescription>
                            Update the campaign name and scheduled timeline.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-camp-name">Campaign Name</Label>
                            <Input
                                id="edit-camp-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Campaign Name"
                                disabled={isSaving}
                                className={errors.name ? 'border-destructive' : ''}
                            />
                            {errors.name && (
                                <p className="text-xs text-destructive">{errors.name}</p>
                            )}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="edit-camp-start">Start Date</Label>
                                <Input
                                    id="edit-camp-start"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    disabled={isSaving}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-camp-end">End Date</Label>
                                <Input
                                    id="edit-camp-end"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    disabled={isSaving}
                                    className={errors.end_date ? 'border-destructive' : ''}
                                />
                                {errors.end_date && (
                                    <p className="text-xs text-destructive">{errors.end_date}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving || !name.trim()}
                            className="gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
