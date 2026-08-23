import { Head, Link } from '@inertiajs/react';
import { ChevronLeft, Edit3 } from 'lucide-react';
import ProductForm from '@/components/product-form';
import { Button } from '@/components/ui/button';

export default function ProductEditPage({ product }: any) {
    return (
        <>
            <Head title={`Edit ${product?.name ?? 'Product'}`} />

            <div className="min-h-screen bg-background pb-24 text-foreground">
                <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6 lg:p-8">
                    {/* Header */}
                    <div className="flex flex-col gap-3 border-b border-border/60 pb-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Edit3 className="h-4 w-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                                        Edit Product
                                    </h1>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Update details and visual photo for{' '}
                                    <span className="font-semibold text-foreground">
                                        "{product?.name}"
                                    </span>
                                    .
                                </p>
                            </div>
                        </div>

                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 self-start rounded-xl text-xs font-semibold shadow-none sm:self-auto"
                        >
                            <Link href="/products">
                                <ChevronLeft className="h-3.5 w-3.5" />
                                Products List
                            </Link>
                        </Button>
                    </div>

                    {/* Form Component */}
                    <ProductForm
                        product={product}
                        mode="edit"
                        submitLabel="Save Changes"
                        cancelUrl="/products"
                    />
                </div>
            </div>
        </>
    );
}

ProductEditPage.layout = {
    breadcrumbs: [
        { title: 'Products', href: '/products' },
        { title: 'Edit', href: '/products/edit' },
    ],
};
