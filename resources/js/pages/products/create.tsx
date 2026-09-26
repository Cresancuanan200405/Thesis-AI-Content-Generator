import { Head } from '@inertiajs/react';
import ProductForm from '@/components/product-form';

export default function ProductCreatePage() {
    return (
        <>
            <Head title="Add Product" />

            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-8 sm:px-6 sm:py-12">
                <ProductForm
                    mode="create"
                    submitLabel="Add Product"
                    cancelUrl="/products"
                />
            </div>
        </>
    );
}

ProductCreatePage.layout = {
    breadcrumbs: [
        { title: 'Products', href: '/products' },
        { title: 'Add Product', href: '/products/create' },
    ],
};
