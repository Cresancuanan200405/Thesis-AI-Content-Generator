import { useForm } from '@inertiajs/react';
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
    const { data, setData, post, put, processing, errors } = useForm({
        name: product?.name ?? '',
        description: product?.description ?? '',
        price: product?.price ?? '',
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (mode === 'edit' && product?.id) {
            put(`/products/${product.id}`, {
                preserveScroll: true,
            });

            return;
        }

        post('/products', {
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
                <CardContent className="space-y-5">
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

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(event) =>
                                setData('description', event.target.value)
                            }
                            rows={5}
                            placeholder="Describe the product, its purpose, and what makes it stand out."
                        />
                        {errors.description && (
                            <p className="text-sm text-destructive">
                                {errors.description}
                            </p>
                        )}
                    </div>

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
                <Button type="submit" disabled={processing}>
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
