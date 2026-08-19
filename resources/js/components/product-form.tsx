import { router, useForm } from '@inertiajs/react';
import { ImagePlus, Loader2, Trash2, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type ProductFormProps = {
    product?: {
        id?: number;
        name?: string;
        description?: string;
        price?: string | number | null;
        image_path?: string | null;
        image_url?: string | null;
    } | null;
    mode?: 'create' | 'edit';
    submitLabel?: string;
    cancelUrl?: string;
};

export default function ProductForm({
    product,
    mode = 'create',
    submitLabel = 'Save product',
    cancelUrl = '/products',
}: ProductFormProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(
        product?.image_url ?? null,
    );
    const [removeImage, setRemoveImage] = useState<boolean>(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const { data, setData, processing, errors } = useForm({
        name: product?.name ?? '',
        description: product?.description ?? '',
        price: product?.price ?? '',
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setRemoveImage(false);
            const reader = new FileReader();
            reader.onload = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setSelectedFile(null);
        setImagePreview(null);
        setRemoveImage(true);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('description', data.description || '');
        formData.append('price', data.price ? String(data.price) : '');

        if (selectedFile) {
            formData.append('image', selectedFile);
        }

        if (removeImage) {
            formData.append('remove_image', '1');
        }

        if (mode === 'edit' && product?.id) {
            formData.append('_method', 'PUT');
            router.post(`/products/${product.id}`, formData, {
                preserveScroll: true,
            });
            return;
        }

        router.post('/products', formData, {
            preserveScroll: true,
        });
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>
                        {mode === 'edit' ? 'Edit product' : 'Create product'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* PHOTO UPLOAD */}
                    <div className="space-y-2">
                        <Label>Product Photo</Label>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            {imagePreview ? (
                                <div className="group relative h-36 w-36 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted/30 shadow-sm">
                                    <img
                                        src={imagePreview}
                                        alt="Product preview"
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="h-8 w-8 rounded-full shadow"
                                            onClick={handleRemoveImage}
                                            title="Remove photo"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex h-36 w-36 shrink-0 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/20 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
                                >
                                    <ImagePlus className="h-8 w-8 text-muted-foreground/60" />
                                    <span className="mt-2 text-xs font-medium text-muted-foreground">
                                        Add Photo
                                    </span>
                                </div>
                            )}

                            <div className="flex-1 space-y-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="gap-2 text-xs"
                                    >
                                        <Upload className="h-3.5 w-3.5" />
                                        {imagePreview ? 'Change Photo' : 'Upload Photo'}
                                    </Button>
                                    {imagePreview && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleRemoveImage}
                                            className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    JPG, PNG, WebP, or SVG up to 5MB. This photo will be available in AI Marketing Studio as a reference image for your marketing designs.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Product name</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(event) =>
                                setData('name', event.target.value)
                            }
                            placeholder="Signature Candle"
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {mode === 'edit' && (
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(event) =>
                                    setData('description', event.target.value)
                                }
                                rows={4}
                                placeholder="Describe the product, its purpose, and what makes it stand out."
                            />
                            {errors.description && (
                                <p className="text-sm text-destructive">
                                    {errors.description}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="price">Price</Label>
                        <Input
                            id="price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={data.price}
                            onChange={(event) =>
                                setData('price', event.target.value)
                            }
                            placeholder="49.99"
                        />
                        {errors.price && (
                            <p className="text-sm text-destructive">
                                {errors.price}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => (window.location.href = cancelUrl)}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={processing} className="gap-2">
                    {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                    {processing
                        ? mode === 'edit'
                            ? 'Saving...'
                            : 'Creating...'
                        : submitLabel}
                </Button>
            </div>
        </form>
    );
}
