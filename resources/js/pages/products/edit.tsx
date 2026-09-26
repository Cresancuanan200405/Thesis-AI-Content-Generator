import { Head } from '@inertiajs/react';
import ProductForm from '@/components/product-form';

export default function ProductEditPage({ product }: any) {
    return (
        <>
            <Head title={`Edit ${product?.name ?? 'Product'}`} />

            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-8 sm:px-6 sm:py-12">
                <ProductForm
                    product={product}
                    mode="edit"
                    submitLabel="Save Changes"
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
