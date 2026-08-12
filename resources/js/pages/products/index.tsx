import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function ProductsIndexPage({ products = [], filters = {}, count = 0 }: any) {
    const updateSearch = (value: string) => {
        router.get('/products', { search: value }, {
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <>
            <Head title="Products" />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Products</p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Your product catalog</h1>
                    </div>
                    <Button asChild size="lg" className="gap-2">
                        <Link href="/products/create">
                            <Plus className="h-4 w-4" />
                            Create product
                        </Link>
                    </Button>
                </div>

                <Card className="shadow-sm">
                    <CardContent className="p-4">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={filters.search ?? ''}
                                onChange={(event) => updateSearch(event.target.value)}
                                placeholder="Search products"
                                className="pl-9"
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{count} products</span>
                </div>

                {products.length === 0 ? (
                    <Card className="shadow-sm">
                        <CardContent className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
                            <div className="text-4xl">📦</div>
                            <div>
                                <h2 className="text-xl font-semibold">No products yet</h2>
                                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                                    Add your first product so it can be used in campaigns and generated marketing content.
                                </p>
                            </div>
                            <Button asChild>
                                <Link href="/products/create">Add your first product</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {products.map((product: any) => (
                            <Card key={product.id} className="shadow-sm">
                                <CardContent className="space-y-4 p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h2 className="text-xl font-semibold">{product.name}</h2>
                                            <p className="text-sm text-muted-foreground">{product.created_at}</p>
                                        </div>
                                        <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                                            ${Number(product.price ?? 0).toFixed(2)}
                                        </span>
                                    </div>

                                    <p className="line-clamp-3 text-sm text-muted-foreground">
                                        {product.description || 'No description provided yet.'}
                                    </p>

                                    <div className="flex items-center gap-2 pt-2">
                                        <Button variant="outline" asChild size="sm">
                                            <Link href={product.show_url}>View</Link>
                                        </Button>
                                        <Button variant="outline" asChild size="sm">
                                            <Link href={product.edit_url}>Edit</Link>
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => {
                                                if (window.confirm('Delete this product?')) {
                                                    router.delete(`/products/${product.id}`);
                                                }
                                            }}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

ProductsIndexPage.layout = {
    breadcrumbs: [{ title: 'Products', href: '/products' }],
};
