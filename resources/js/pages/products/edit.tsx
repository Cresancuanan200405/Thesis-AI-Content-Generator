import { Head } from '@inertiajs/react';
import ProductForm from '@/components/product-form';

export default function ProductEditPage({ product }: any) {
    return (
        <>
            <Head title={`Edit ${product?.name ?? 'Product'}`} />
            <div className="space-y-6 p-4 md:p-6">
                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                    <p className="text-sm font-medium text-muted-foreground">
                        Products
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                        Edit product
                    </h1>
                </div>

                <ProductForm
                    product={product}
                    mode="edit"
                    submitLabel="Save changes"
                    cancelUrl="/products"
                />
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
