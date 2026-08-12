import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProductShowPage({ product }: any) {
    return (
        <>
            <Head title={product?.name ?? 'Product'} />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-6 shadow-sm">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Products</p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{product?.name}</h1>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/products">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to products
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Product details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Price</p>
                                <p className="mt-1 text-lg font-semibold">${Number(product?.price ?? 0).toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Business</p>
                                <p className="mt-1 text-lg font-medium">{product?.business_name}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Description</p>
                                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                                    {product?.description || 'No description provided.'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Recent designs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {product?.designs?.length ? (
                                <div className="space-y-3">
                                    {product.designs.map((design: any) => (
                                        <div key={design.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                                            <div className="flex items-center gap-3">
                                                {design.image_url ? (
                                                    <img src={design.image_url} alt={design.product_name} className="h-12 w-12 rounded-md object-cover" />
                                                ) : null}
                                                <div>
                                                    <p className="font-medium">{design.product_name}</p>
                                                    <p className="text-sm text-muted-foreground">{design.status}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No designs have used this product yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

ProductShowPage.layout = {
    breadcrumbs: [
        { title: 'Products', href: '/products' },
        { title: 'Details', href: '/products/show' },
    ],
};
