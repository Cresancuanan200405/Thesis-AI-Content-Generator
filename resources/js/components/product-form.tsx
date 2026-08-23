import { router, useForm } from '@inertiajs/react';
import {
    Check,
    ImagePlus,
    Loader2,
    Sparkles,
    Tag,
    Trash2,
    Upload,
    X,
    ZoomIn,
    ZoomOut,
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

                // Use PNG for pngs with transparency or webp for others
                const isPng = file.type === 'image/png';
                const outputType = isPng ? 'image/png' : 'image/jpeg';

                canvas.toBlob(
                    (blob) => {
                        if (blob && (blob.size < file.size || file.size > 1.8 * 1024 * 1024)) {
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
    submitLabel = 'Save Product',
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

    // Lightbox / Full Image View State
    const [isViewingImage, setIsViewingImage] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });

    const { data, setData, errors } = useForm({
        name: product?.name ?? '',
        price: product?.price ?? '',
    });

    const handleFile = async (file: File) => {
        if (!file) return;

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
        if (e) e.stopPropagation();
        setSelectedFile(null);
        setImagePreview(null);
        setRemoveImage(true);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);

        const payload: Record<string, any> = {
            name: data.name || '',
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
                    const message = Object.values(errs)[0] || 'Failed to update product.';
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
                toast.success('Product created successfully!');
            },
            onError: (errs) => {
                const message = Object.values(errs)[0] || 'Failed to create product.';
                toast.error(message);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <>
            <form onSubmit={submit} className="max-w-4xl mx-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    {/* PHOTO UPLOAD CARD (LEFT / 5 COLS) */}
                    <Card className="md:col-span-5 rounded-3xl border-border bg-card shadow-xs overflow-hidden">
                        <CardContent className="p-5 sm:p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold uppercase tracking-wider text-foreground">
                                    Product Visual
                                </Label>
                                {imagePreview && (
                                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                        Photo Added
                                    </span>
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                                className="hidden"
                                onChange={handleFileChange}
                            />

                            {imagePreview ? (
                                <div className="space-y-3">
                                    <div
                                        onClick={() => setIsViewingImage(true)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                setIsViewingImage(true);
                                            }
                                        }}
                                        className="group relative aspect-square w-full rounded-2xl overflow-hidden border border-border bg-muted/20 shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        title="Click image to view full size"
                                    >
                                        <img
                                            src={imagePreview}
                                            alt="Product preview"
                                            className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                                        />
                                    </div>

                                    {/* Action Buttons Below Image */}
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex-1 h-8 text-xs gap-1.5 rounded-xl font-semibold shadow-none"
                                        >
                                            <Upload className="h-3.5 w-3.5" />
                                            Change Photo
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="destructive"
                                            onClick={handleRemoveImage}
                                            className="h-8 px-3 text-xs gap-1.5 rounded-xl font-semibold shadow-none"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    className={`aspect-square w-full cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all p-6 text-center group ${
                                        isDragging
                                            ? 'border-primary bg-primary/10 scale-[0.99]'
                                            : 'border-border/80 bg-muted/15 hover:border-primary/50 hover:bg-primary/5'
                                    }`}
                                >
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform shadow-2xs">
                                        <ImagePlus className="h-7 w-7" />
                                    </div>
                                    <p className="mt-3 text-xs font-bold text-foreground">
                                        Click or Drag & Drop Photo
                                    </p>
                                    <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                                        PNG, JPG, WebP, or SVG
                                    </p>
                                </div>
                            )}

                            <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-[11px] text-muted-foreground leading-relaxed space-y-1">
                                <p className="font-semibold text-foreground flex items-center gap-1.5">
                                    <Sparkles className="h-3 w-3 text-primary" />
                                    AI Studio Integration
                                </p>
                                <p>
                                    This photo will be available in AI Studio when generating marketing creatives.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* DETAILS CARD (RIGHT / 7 COLS) */}
                    <div className="md:col-span-7 space-y-6">
                        <Card className="rounded-3xl border-border bg-card shadow-xs">
                            <CardContent className="p-5 sm:p-6 space-y-5">
                                {/* PRODUCT NAME */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="product-name" className="text-xs font-bold uppercase tracking-wider text-foreground">
                                            Product Name
                                        </Label>
                                        <span className="text-[11px] text-muted-foreground">Optional</span>
                                    </div>
                                    <div className="relative">
                                        <Tag className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="product-name"
                                            value={data.name}
                                            onChange={(event) =>
                                                setData('name', event.target.value)
                                            }
                                            placeholder="e.g. Signature Lavender Scented Candle"
                                            className={`h-11 pl-10 text-sm font-medium rounded-xl border-input bg-background focus-visible:ring-primary/30 ${
                                                errors.name ? 'border-destructive ring-destructive/20' : ''
                                            }`}
                                        />
                                    </div>
                                    {errors.name && (
                                        <p className="text-xs text-destructive font-medium mt-1">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                {/* PRICE */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="product-price" className="text-xs font-bold uppercase tracking-wider text-foreground">
                                            Price (₱ PHP)
                                        </Label>
                                        <span className="text-[11px] text-muted-foreground">Optional</span>
                                    </div>
                                    <div className="relative">
                                        <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-bold text-muted-foreground select-none">
                                            ₱
                                        </span>
                                        <Input
                                            id="product-price"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={data.price}
                                            onChange={(event) =>
                                                setData('price', event.target.value)
                                            }
                                            placeholder="0.00"
                                            className={`h-11 pl-9 text-sm font-medium rounded-xl border-input bg-background focus-visible:ring-primary/30 ${
                                                errors.price ? 'border-destructive ring-destructive/20' : ''
                                            }`}
                                        />
                                    </div>
                                    {errors.price ? (
                                        <p className="text-xs text-destructive font-medium mt-1">
                                            {errors.price}
                                        </p>
                                    ) : (
                                        <p className="text-[11px] text-muted-foreground">
                                            Optional retail price displayed on generated product designs.
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* ACTION BUTTON */}
                        <div className="flex items-center justify-end pt-2">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="h-11 px-8 rounded-xl text-sm font-bold gap-2 shadow-sm w-full sm:w-auto"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Saving Product...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4 stroke-[2.5]" />
                                        <span>{submitLabel}</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>

            {/* FULLSCREEN IMAGE VIEWER MODAL ON CLICK */}
            {isViewingImage && imagePreview && (
                <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-black/95 backdrop-blur-2xl text-white select-none animate-in fade-in duration-200 p-4">
                    {/* Top Control Bar */}
                    <div className="absolute top-4 right-4 z-[160] flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIsZoomed(!isZoomed)}
                            className="flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 text-xs font-medium backdrop-blur-md transition-all cursor-pointer"
                        >
                            {isZoomed ? (
                                <>
                                    <ZoomOut className="h-3.5 w-3.5 text-primary" />
                                    <span>Zoom Out</span>
                                </>
                            ) : (
                                <>
                                    <ZoomIn className="h-3.5 w-3.5" />
                                    <span>Zoom In</span>
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setIsViewingImage(false);
                                setIsZoomed(false);
                            }}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 hover:bg-white/30 text-white transition-all backdrop-blur-md cursor-pointer"
                            title="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Image View Canvas */}
                    <div className="relative max-h-[85vh] max-w-[90vw] overflow-hidden flex items-center justify-center">
                        <img
                            src={imagePreview}
                            alt="Full product preview"
                            onClick={(e) => {
                                if (!isZoomed) {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const offsetX = e.clientX - rect.left;
                                    const offsetY = e.clientY - rect.top;
                                    const xPercent = Math.max(0, Math.min(100, (offsetX / rect.width) * 100));
                                    const yPercent = Math.max(0, Math.min(100, (offsetY / rect.height) * 100));
                                    setZoomOrigin({ x: xPercent, y: yPercent });
                                    setIsZoomed(true);
                                } else {
                                    setIsZoomed(false);
                                }
                            }}
                            style={{
                                transformOrigin: isZoomed ? `${zoomOrigin.x}% ${zoomOrigin.y}%` : 'center center',
                            }}
                            className={`max-h-[82vh] max-w-[88vw] object-contain rounded-2xl drop-shadow-2xl transition-transform duration-300 ease-out cursor-pointer ${
                                isZoomed ? 'scale-[1.75] cursor-zoom-out' : 'scale-100 cursor-zoom-in'
                            }`}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
