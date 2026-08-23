import { Head, Link } from '@inertiajs/react';
import { ChevronLeft, Edit3, Tag } from 'lucide-react';
import ProductForm from '@/components/product-form';
import { Button } from '@/components/ui/button';

export default function ProductEditPage({ product }: any) {
    return (
        <>
            <Head title={`Edit ${product?.name ?? 'Product'}`} />

            <div className="min-h-screen bg-background text-foreground pb-24">
                <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                                <Edit3 className="h-4 w-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                                        Edit Product
                                    </h1>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Update details and visual photo for <span className="font-semibold text-foreground">"{product?.name}"</span>.
                                </p>
                            </div>
                        </div>

                        <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 font-semibold text-xs shadow-none self-start sm:self-auto rounded-xl">
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
