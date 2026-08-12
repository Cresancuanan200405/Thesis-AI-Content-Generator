import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight, ImageIcon, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function DesignsPage({
    designs = [],
    events = [],
    products = [],
    campaigns = [],
    filters = {},
    pagination = {},
}: any) {
    const designList = Array.isArray(designs) ? designs : (designs.data ?? []);
    const currentPage = pagination.current_page ?? 1;
    const lastPage = pagination.last_page ?? 1;

    const updateFilters = (next: Partial<Record<string, string>>) => {
        router.get(
            '/designs',
            {
                search: next.search ?? filters.search ?? '',
                product_id: next.product_id ?? filters.product_id ?? '',
                campaign_id: next.campaign_id ?? filters.campaign_id ?? '',
                event_id: next.event_id ?? filters.event_id ?? '',
                sort: next.sort ?? filters.sort ?? 'newest',
                page: 1,
            },
            {
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const clearFilters = () => {
        router.get(
            '/designs',
            { page: 1 },
            { preserveScroll: true, replace: true },
        );
    };

    return (
        <>
            <Head title="My Designs" />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">
                            My Designs
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                            Your generated marketing visuals
                        </h1>
                    </div>
                    <Button asChild size="lg" className="gap-2">
                        <Link href="/generator">
                            Create Design
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>

                <Card className="shadow-sm">
                    <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:flex-wrap md:items-center">
                        <div className="relative min-w-[220px] flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={filters.search ?? ''}
                                onChange={(event) =>
                                    updateFilters({
                                        search: event.target.value,
                                    })
                                }
                                placeholder="Search designs or product names"
                                className="pl-9"
                            />
                        </div>

                        <div className="w-full md:w-48">
                            <Select
                                value={filters.product_id || 'all'}
                                onValueChange={(value) =>
                                    updateFilters({
                                        product_id:
                                            value === 'all' ? '' : value,
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All products" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All products
                                    </SelectItem>
                                    {products.map((product: any) => (
                                        <SelectItem
                                            key={product.id}
                                            value={String(product.id)}
                                        >
                                            {product.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full md:w-48">
                            <Select
                                value={filters.campaign_id || 'all'}
                                onValueChange={(value) =>
                                    updateFilters({
                                        campaign_id:
                                            value === 'all' ? '' : value,
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All campaigns" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All campaigns
                                    </SelectItem>
                                    {campaigns.map((campaign: any) => (
                                        <SelectItem
                                            key={campaign.id}
                                            value={String(campaign.id)}
                                        >
                                            {campaign.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full md:w-48">
                            <Select
                                value={filters.event_id || 'all'}
                                onValueChange={(value) =>
                                    updateFilters({
                                        event_id: value === 'all' ? '' : value,
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All events" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All events
                                    </SelectItem>
                                    {events.map((event: any) => (
                                        <SelectItem
                                            key={event.id}
                                            value={String(event.id)}
                                        >
                                            {event.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full md:w-40">
                            <Select
                                value={filters.sort || 'newest'}
                                onValueChange={(value) =>
                                    updateFilters({ sort: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sort" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">
                                        Newest
                                    </SelectItem>
                                    <SelectItem value="oldest">
                                        Oldest
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {(filters.search ||
                            filters.product_id ||
                            filters.campaign_id ||
                            filters.event_id ||
                            (filters.sort && filters.sort !== 'newest')) && (
                            <Button
                                variant="outline"
                                onClick={clearFilters}
                                className="md:ml-auto"
                            >
                                Clear filters
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {designList.length === 0 ? (
                    <Card className="shadow-sm">
                        <CardContent className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/5 text-primary">
                                <ImageIcon className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">
                                    No designs yet
                                </h2>
                                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                                    Create your first AI-powered marketing
                                    visual for your product or upcoming event.
                                </p>
                            </div>
                            <Button asChild>
                                <Link href="/generator">
                                    Create your first design
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                            {designList.map((design: any) => (
                                <Card
                                    key={design.id}
                                    className="overflow-hidden shadow-sm transition hover:shadow-md"
                                >
                                    <Link
                                        href={`/designs/${design.id}`}
                                        className="block"
                                    >
                                        {design.image_url ? (
                                            <img
                                                src={design.image_url}
                                                alt={design.product_name}
                                                className="h-56 w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-56 items-center justify-center bg-muted text-muted-foreground">
                                                <ImageIcon className="h-10 w-10" />
                                            </div>
                                        )}
                                    </Link>
                                    <CardContent className="space-y-3 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-lg font-semibold">
                                                    {design.product_name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {design.event_name ||
                                                        'General marketing'}
                                                </p>
                                            </div>
                                            <Badge
                                                variant={
                                                    design.status ===
                                                    'completed'
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {design.status}
                                            </Badge>
                                        </div>

                                        {design.tagline && (
                                            <p className="text-sm text-muted-foreground">
                                                {design.tagline}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>{design.created_at}</span>
                                            <Link
                                                href={`/designs/${design.id}`}
                                                className="font-medium text-primary"
                                            >
                                                View
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {lastPage > 1 && (
                            <div className="flex items-center justify-between rounded-xl border bg-card p-3 shadow-sm">
                                <Button
                                    variant="outline"
                                    asChild
                                    disabled={currentPage <= 1}
                                >
                                    <Link
                                        href={`/designs?page=${Math.max(currentPage - 1, 1)}${filters.search ? `&search=${encodeURIComponent(filters.search)}` : ''}${filters.event_id ? `&event_id=${filters.event_id}` : ''}`}
                                    >
                                        Previous
                                    </Link>
                                </Button>
                                <p className="text-sm text-muted-foreground">
                                    Page {currentPage} of {lastPage}
                                </p>
                                <Button
                                    variant="outline"
                                    asChild
                                    disabled={currentPage >= lastPage}
                                >
                                    <Link
                                        href={`/designs?page=${Math.min(currentPage + 1, lastPage)}${filters.search ? `&search=${encodeURIComponent(filters.search)}` : ''}${filters.event_id ? `&event_id=${filters.event_id}` : ''}`}
                                    >
                                        Next
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}

DesignsPage.layout = {
    breadcrumbs: [{ title: 'My Designs', href: '/designs' }],
};
