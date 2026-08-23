import { Head, router } from '@inertiajs/react';
import {
    Building2,
    Check,
    ImagePlus,
    Loader2,
    Trash2,
    UploadCloud,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface BusinessLogoProps {
    business?: {
        id: number;
        name: string;
        logo_path?: string | null;
        logo_url?: string | null;
    } | null;
}

export default function BusinessLogoSettings({ business }: BusinessLogoProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(
        business?.logo_url || null,
    );
    const [isUploading, setIsUploading] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            processSelectedFile(file);
        }
    };

    const processSelectedFile = (file: File) => {
        if (!file.type.match(/^image\/(png|jpeg|jpg|webp|gif|svg\+xml)$/)) {
            toast.error(
                'Please upload a valid image file (PNG, JPG, SVG, WEBP).',
            );

            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB.');

            return;
        }

        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];

        if (file) {
            processSelectedFile(file);
        }
    };

    const handleUploadSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedFile) {
            toast.error('Please select an image file first.');

            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('logo', selectedFile);

        router.post('/settings/logo', formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setSelectedFile(null);
                toast.success('Business logo updated successfully!');
            },
            onError: (errors) => {
                console.error(errors);
                toast.error(errors.logo || 'Failed to upload logo.');
            },
            onFinish: () => {
                setIsUploading(false);
            },
        });
    };

    const handleRemoveLogo = () => {
        if (!business?.logo_url && !previewUrl) {
            return;
        }

        if (!confirm('Are you sure you want to remove your business logo?')) {
            return;
        }

        setIsRemoving(true);
        router.delete('/settings/logo', {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedFile(null);
                setPreviewUrl(null);

                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }

                toast.success('Business logo removed.');
            },
            onError: () => {
                toast.error('Failed to remove logo.');
            },
            onFinish: () => {
                setIsRemoving(false);
            },
        });
    };

    return (
        <>
            <Head title="Brand Logo Settings" />

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Brand Logo"
                    description="Manage your official brand logo. This logo can be seamlessly embedded into your generated marketing visual designs."
                />

                <Card className="rounded-2xl border-border bg-card shadow-sm">
                    <CardContent className="p-6">
                        <div className="space-y-6">
                            {/* CURRENT STATUS */}
                            <div className="flex items-center justify-between border-b border-border pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">
                                            {business?.name || 'Your Business'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {business?.logo_url
                                                ? 'Active logo registered'
                                                : 'No custom logo uploaded yet'}
                                        </p>
                                    </div>
                                </div>

                                {business?.logo_url && (
                                    <Badge
                                        variant="outline"
                                        className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    >
                                        <Check className="h-3 w-3" />
                                        Active
                                    </Badge>
                                )}
                            </div>

                            {/* LOGO PREVIEW & DROPZONE */}
                            <div className="grid gap-6 md:grid-cols-[200px_1fr]">
                                {/* LOGO DISPLAY BOX */}
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-center">
                                    <p className="mb-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                        Preview
                                    </p>
                                    <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-xl border border-border bg-background p-2 shadow-inner">
                                        {previewUrl ? (
                                            <img
                                                src={previewUrl}
                                                alt="Business Logo"
                                                className="max-h-full max-w-full object-contain"
                                            />
                                        ) : (
                                            <ImagePlus className="h-10 w-10 text-muted-foreground/40" />
                                        )}
                                    </div>
                                    <p className="mt-2 text-[11px] text-muted-foreground">
                                        {previewUrl
                                            ? selectedFile
                                                ? 'Unsaved preview'
                                                : 'Current active logo'
                                            : 'Placeholder'}
                                    </p>
                                </div>

                                {/* UPLOAD DROPZONE */}
                                <form
                                    onSubmit={handleUploadSubmit}
                                    className="flex flex-col justify-between space-y-4"
                                >
                                    <div
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                                            isDragging
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border/80 bg-muted/10 hover:border-primary/50 hover:bg-muted/20'
                                        }`}
                                    >
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                            <UploadCloud className="h-6 w-6" />
                                        </div>

                                        <p className="mt-3 text-sm font-medium">
                                            {selectedFile
                                                ? selectedFile.name
                                                : 'Click or drag & drop your logo here'}
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Supports PNG, SVG, JPG, WEBP (Max
                                            5MB)
                                        </p>

                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/png,image/jpeg,image/svg+xml,image/webp"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </div>

                                    {/* ACTION BUTTONS */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                                        <div className="flex gap-2">
                                            <Button
                                                type="submit"
                                                disabled={
                                                    isUploading || !selectedFile
                                                }
                                                className="gap-2"
                                            >
                                                {isUploading ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check className="h-4 w-4" />
                                                        Save Logo
                                                    </>
                                                )}
                                            </Button>

                                            {selectedFile && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setSelectedFile(null);
                                                        setPreviewUrl(
                                                            business?.logo_url ||
                                                                null,
                                                        );

                                                        if (
                                                            fileInputRef.current
                                                        ) {
                                                            fileInputRef.current.value =
                                                                '';
                                                        }
                                                    }}
                                                    disabled={isUploading}
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                        </div>

                                        {business?.logo_url && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleRemoveLogo}
                                                disabled={
                                                    isRemoving || isUploading
                                                }
                                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                {isRemoving ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Trash2 className="mr-1.5 h-4 w-4" />
                                                        Remove Logo
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            {/* BEST PRACTICE TIPS */}
                            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground">
                                <p className="font-semibold text-foreground">
                                    Logo Tips for Best AI Generation Quality:
                                </p>
                                <ul className="mt-2 list-disc space-y-1 pl-4">
                                    <li>
                                        Transparent PNG or SVG formats yield the
                                        cleanest integration.
                                    </li>
                                    <li>
                                        High resolution (at least 512x512
                                        pixels) ensures sharp results across
                                        banner sizes.
                                    </li>
                                    <li>
                                        You can toggle logo inclusion on or off
                                        whenever generating in the AI Marketing
                                        Studio.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

BusinessLogoSettings.layout = {
    breadcrumbs: [
        {
            title: 'Brand Logo',
            href: '/settings/logo',
        },
    ],
};
