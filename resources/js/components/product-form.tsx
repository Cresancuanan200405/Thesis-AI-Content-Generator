import { router, useForm } from '@inertiajs/react';
import {
    Check,
    ImagePlus,
    Loader2,
    Trash2,
    Upload,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ProductFormProps = {
    product?: {
        id?: number;
        name?: string;
        price?: string | number | null;
        image_path?: string | null;
        image_url?: string | null;
    } | null;
    mode?: 'create' | 'edit';
    submitLabel?: string;
    cancelUrl?: string;
};

/**
 * Client-side image compressor: Ensures uploaded images are properly sized (<2MB)
 * to prevent PHP upload_max_filesize rejections on large camera photos.
 */
async function processImageForUpload(file: File): Promise<File> {
    if (file.type === 'image/svg+xml') {
        return file;
    }

    return new Promise((resolve) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.onload = () => {
                const maxDim = 2048;
                let width = img.width;
                let height = img.height;

                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    resolve(file);

                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                const isPng = file.type === 'image/png';
                const outputType = isPng ? 'image/png' : 'image/jpeg';

                canvas.toBlob(
                    (blob) => {
                        if (
                            blob &&
                            (blob.size < file.size ||
                                file.size > 1.8 * 1024 * 1024)
                        ) {
                            const newExt = isPng ? '.png' : '.jpg';
                            const compressedFile = new File(
                                [blob],
                                file.name.replace(/\.[^/.]+$/, newExt),
                                {
                                    type: outputType,
                                    lastModified: Date.now(),
                                },
                            );
                            resolve(compressedFile);
                        } else {
                            resolve(file);
                        }
                    },
                    outputType,
                    0.9,
                );
            };
            img.onerror = () => resolve(file);
            img.src = e.target?.result as string;
        };
        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
    });
}

export default function ProductForm({
    product,
    mode = 'create',
    submitLabel = 'Add Product',
    cancelUrl = '/products',
}: ProductFormProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(
        product?.image_url ?? null,
    );
    const [removeImage, setRemoveImage] = useState<boolean>(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data, setData, errors } = useForm({
        name: product?.name ?? '',
        price: product?.price ? String(product.price) : '',
    });

    const handleFile = async (file: File) => {
        if (!file) {
            return;
        }

        // Preview immediately
        const reader = new FileReader();
        reader.onload = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Process file
        try {
            const processed = await processImageForUpload(file);
            setSelectedFile(processed);
            setRemoveImage(false);
        } catch {
            setSelectedFile(file);
            setRemoveImage(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            handleFile(file);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];

        if (file && file.type.startsWith('image/')) {
            handleFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleRemoveImage = (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }

        setSelectedFile(null);
        setImagePreview(null);
        setRemoveImage(true);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCancel = () => {
        if (cancelUrl) {
            router.visit(cancelUrl);
        } else {
            router.visit('/products');
        }
    };

    // Validation rules:
    // - a valid product image exists
    // - product name is non-empty
    // - price is valid
    const hasImage = Boolean(selectedFile || imagePreview);
    const hasName = data.name.trim().length > 0;
    const parsedPrice = parseFloat(data.price);
    const hasValidPrice =
        data.price.trim() !== '' &&
        !isNaN(parsedPrice) &&
        parsedPrice >= 0;

    const isFormValid = hasImage && hasName && hasValidPrice;

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!isFormValid || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        const payload: Record<string, any> = {
            name: data.name.trim(),
            price: data.price ? String(data.price) : '',
        };

        if (selectedFile) {
            payload.image = selectedFile;
        }

        if (removeImage) {
            payload.remove_image = 1;
        }

        if (mode === 'edit' && product?.id) {
            payload._method = 'PUT';
            router.post(`/products/${product.id}`, payload, {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    toast.success('Product updated successfully!');
                },
                onError: (errs) => {
                    const message =
                        Object.values(errs)[0] || 'Failed to update product.';
                    toast.error(message);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            });

            return;
        }

        router.post('/products', payload, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                toast.success('Product added successfully!');
            },
            onError: (errs) => {
                const message =
                    Object.values(errs)[0] || 'Failed to add product.';
                toast.error(message);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <div className="mx-auto w-full max-w-xl">
            <Card className="overflow-hidden rounded-3xl border-border bg-card shadow-sm">
                {/* Header */}
                <div className="border-b border-border/60 p-6 sm:p-7">
                    <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                        {mode === 'edit' ? 'Edit Product' : 'Add Product'}
                    </h1>
                    <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
                        {mode === 'edit'
                            ? 'Update your catalog product details and marketing visual.'
                            : 'Add a product to your catalog so MarketPilot can use it in marketing designs.'}
                    </p>
                </div>

                <form onSubmit={submit}>
                    <CardContent className="space-y-6 p-6 sm:p-7">
                        {/* SECTION 1 — PRODUCT IMAGE */}
                        <div className="space-y-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                className="hidden"
                                onChange={handleFileChange}
                            />

                            {imagePreview ? (
                                <div className="space-y-3">
                                    <div className="relative flex aspect-4/3 w-full items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-muted/20 p-4 transition-all sm:aspect-16/10">
                                        <img
                                            src={imagePreview}
                                            alt="Product preview"
                                            className="max-h-full w-auto max-w-full rounded-xl object-contain drop-shadow-xs"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                            className="h-8.5 gap-1.5 rounded-xl text-xs font-semibold shadow-2xs"
                                        >
                                            <Upload className="h-3.5 w-3.5" />
                                            Change image
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleRemoveImage}
                                            className="h-8.5 gap-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    className={`group flex aspect-4/3 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 sm:aspect-16/10 ${isDragging
                                        ? 'scale-[0.99] border-primary bg-primary/10'
                                        : 'border-border/80 bg-muted/15 hover:border-primary/50 hover:bg-primary/5'
                                        }`}
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-2xs transition-transform duration-200 group-hover:scale-105">
                                        <ImagePlus className="h-6 w-6" />
                                    </div>
                                    <p className="mt-3 text-sm font-bold text-foreground">
                                        Upload Product Image
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Drag & drop or click to upload
                                    </p>
                                    <span className="mt-3.5 rounded-full bg-muted/80 px-2.5 py-0.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                        PNG, JPG, WEBP
                                    </span>
                                </div>
                            )}

                            {(errors as Record<string, string | undefined>).image && (
                                <p className="text-xs font-medium text-destructive">
                                    {(errors as Record<string, string | undefined>).image}
                                </p>
                            )}
                        </div>

                        {/* SECTION 2 — PRODUCT NAME */}
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="product-name"
                                className="text-xs font-bold tracking-wider text-foreground uppercase"
                            >
                                Product Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="product-name"
                                value={data.name}
                                onChange={(event) =>
                                    setData('name', event.target.value)
                                }
                                placeholder="Enter product name"
                                className={`h-11 rounded-xl border-input bg-background px-3.5 text-sm font-medium focus-visible:ring-primary/30 ${errors.name
                                    ? 'border-destructive ring-destructive/20'
                                    : ''
                                    }`}
                                required
                            />
                            {errors.name && (
                                <p className="text-xs font-medium text-destructive">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* SECTION 3 — PRICE */}
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="product-price"
                                className="text-xs font-bold tracking-wider text-foreground uppercase"
                            >
                                Price <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                                    <span className="text-sm font-bold text-muted-foreground select-none">
                                        ₱
                                    </span>
                                </div>
                                <Input
                                    id="product-price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={data.price}
                                    onChange={(event) =>
                                        setData('price', event.target.value)
                                    }
                                    placeholder="00.00"
                                    className={`h-11 rounded-xl border-input bg-background pl-8 pr-28 text-sm font-medium focus-visible:ring-primary/30 ${errors.price
                                        ? 'border-destructive ring-destructive/20'
                                        : ''
                                        }`}
                                    required
                                />
                                {data.price &&
                                    !isNaN(Number(data.price)) &&
                                    Number(data.price) >= 0 && (
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-foreground/80">
                                                ₱
                                                {Number(
                                                    data.price,
                                                ).toLocaleString('en-PH', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                    )}
                            </div>
                            {errors.price ? (
                                <p className="text-xs font-medium text-destructive">
                                    {errors.price}
                                </p>
                            ) : (
                                <p className="text-[11px] text-muted-foreground">

                                </p>
                            )}
                        </div>
                    </CardContent>

                    {/* FOOTER */}
                    <div className="flex items-center justify-end gap-3 border-t border-border/60 bg-muted/10 px-6 py-4 sm:px-7">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                            className="h-10 rounded-xl px-4 text-xs font-semibold text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!isFormValid || isSubmitting}
                            className="h-10 gap-2 rounded-xl px-6 text-xs font-bold shadow-xs disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>
                                        {mode === 'edit'
                                            ? 'Saving...'
                                            : 'Adding Product...'}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4 stroke-[2.5]" />
                                    <span>
                                        {mode === 'edit'
                                            ? submitLabel || 'Save Changes'
                                            : 'Add Product'}
                                    </span>
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
