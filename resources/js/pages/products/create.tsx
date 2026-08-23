import { Head } from '@inertiajs/react';
import { Tag } from 'lucide-react';
import ProductForm from '@/components/product-form';

export default function ProductCreatePage() {
    return (
        <>
            <Head title="Add Product" />

            <div className="min-h-screen bg-background text-foreground pb-24">
                <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
                    {/* Header (No back button) */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                                <Tag className="h-4 w-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                                        Add New Product
                                    </h1>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Add an offering to your catalog to generate tailored marketing visuals and campaigns.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Component */}
                    <ProductForm
                        mode="create"
                        submitLabel="Create Product"
                        cancelUrl="/products"
                    />
                </div>
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
