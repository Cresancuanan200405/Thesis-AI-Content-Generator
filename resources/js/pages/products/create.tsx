import { Head } from '@inertiajs/react';
import ProductForm from '@/components/product-form';

export default function ProductCreatePage() {
    return (
        <>
            <Head title="Create Product" />
            <div className="space-y-6 p-4 md:p-6">
                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                    <p className="text-sm font-medium text-muted-foreground">
                        Products
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                        Create a new product
                    </h1>
                </div>

                <ProductForm
                    mode="create"
                    submitLabel="Create product"
                    cancelUrl="/products"
                />
            </div>
        </>
    );
}

ProductCreatePage.layout = {
    breadcrumbs: [
        { title: 'Products', href: '/products' },
        { title: 'Create', href: '/products/create' },
    ],
};
