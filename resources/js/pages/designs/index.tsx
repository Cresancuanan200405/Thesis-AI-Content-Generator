import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    ImageIcon,
    Search,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
} from '@/components/ui/card';
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
    const designList = Array.isArray(designs)
        ? designs
        : (designs.data ?? []);

    const currentPage =
        pagination.current_page ?? 1;

    const lastPage =
        pagination.last_page ?? 1;

    /*
    |--------------------------------------------------------------------------
    | Filter handling
    |--------------------------------------------------------------------------
    */

    const updateFilters = (
        next: Partial<Record<string, string>>,
    ) => {
        router.get(
            '/designs',
            {
                search:
                    next.search ??
                    filters.search ??
                    '',

                product_id:
                    next.product_id ??
                    filters.product_id ??
                    '',

                campaign_id:
                    next.campaign_id ??
                    filters.campaign_id ??
                    '',

                event_id:
                    next.event_id ??
                    filters.event_id ??
                    '',

                sort:
                    next.sort ??
                    filters.sort ??
                    'newest',

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
            {
                page: 1,
            },
            {
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const hasFilters =
        filters.search ||
        filters.product_id ||
        filters.campaign_id ||
        filters.event_id ||
        (filters.sort &&
            filters.sort !== 'newest');

    /*
    |--------------------------------------------------------------------------
    | Pagination URL
    |--------------------------------------------------------------------------
    */

    const buildPageUrl = (
        page: number,
    ) => {
        const params =
            new URLSearchParams();

        params.set(
            'page',
            String(page),
        );

        if (filters.search) {
            params.set(
                'search',
                filters.search,
            );
        }

        if (filters.product_id) {
            params.set(
                'product_id',
                filters.product_id,
            );
        }

        if (filters.campaign_id) {
            params.set(
                'campaign_id',
                filters.campaign_id,
            );
        }

        if (filters.event_id) {
            params.set(
                'event_id',
                filters.event_id,
            );
        }

        if (
            filters.sort &&
            filters.sort !== 'newest'
        ) {
            params.set(
                'sort',
                filters.sort,
            );
        }

        return `/designs?${params.toString()}`;
    };

    return (
        <>
            <Head title="My Designs" />

            <div className="min-h-screen bg-background text-foreground">
                <div className="space-y-8 p-4 md:p-6 lg:p-8">

                    {/* =====================================================
                        PAGE HEADER
                    ====================================================== */}

                    <section
                        className="
                            flex
                            flex-col
                            gap-5
                            rounded-xl
                            border
                            border-border
                            bg-card
                            p-5
                            shadow-[0_2px_8px_rgba(0,0,0,0.05)]
                            md:flex-row
                            md:items-center
                            md:justify-between
                        "
                    >
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                My Designs
                            </p>

                            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                                Your generated marketing visuals
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                Browse, filter, and manage the marketing
                                visuals generated for your products and
                                campaigns.
                            </p>
                        </div>

                        <Button
                            asChild
                            size="lg"
                            className="gap-2 shadow-sm"
                        >
                            <Link href="/generator">
                                Create Design
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </section>

                    {/* =====================================================
                        FILTER BAR
                    ====================================================== */}

                    <Card
                        className="
                            rounded-xl
                            border-border
                            bg-card
                            shadow-[0_2px_8px_rgba(0,0,0,0.05)]
                        "
                    >
                        <CardContent
                            className="
                                flex
                                flex-col
                                gap-3
                                p-4
                                md:flex-row
                                md:flex-wrap
                                md:items-center
                            "
                        >
                            {/* Search */}

                            <div className="relative min-w-[220px] flex-1">
                                <Search
                                    className="
                                        absolute
                                        top-1/2
                                        left-3
                                        h-4
                                        w-4
                                        -translate-y-1/2
                                        text-muted-foreground
                                    "
                                />

                                <Input
                                    value={
                                        filters.search ??
                                        ''
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        updateFilters(
                                            {
                                                search:
                                                    event
                                                        .target
                                                        .value,
                                            },
                                        )
                                    }
                                    placeholder="Search designs or product names"
                                    className="
                                        h-10
                                        border-input
                                        bg-background
                                        pl-9
                                        shadow-none
                                    "
                                />
                            </div>

                            {/* Product */}

                            <div className="w-full md:w-48">
                                <Select
                                    value={
                                        filters.product_id ||
                                        'all'
                                    }
                                    onValueChange={(
                                        value,
                                    ) =>
                                        updateFilters(
                                            {
                                                product_id:
                                                    value ===
                                                    'all'
                                                        ? ''
                                                        : value,
                                            },
                                        )
                                    }
                                >
                                    <SelectTrigger className="h-10 shadow-none">
                                        <SelectValue placeholder="All products" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectItem value="all">
                                            All products
                                        </SelectItem>

                                        {products.map(
                                            (
                                                product: any,
                                            ) => (
                                                <SelectItem
                                                    key={
                                                        product.id
                                                    }
                                                    value={String(
                                                        product.id,
                                                    )}
                                                >
                                                    {
                                                        product.name
                                                    }
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Campaign */}

                            <div className="w-full md:w-48">
                                <Select
                                    value={
                                        filters.campaign_id ||
                                        'all'
                                    }
                                    onValueChange={(
                                        value,
                                    ) =>
                                        updateFilters(
                                            {
                                                campaign_id:
                                                    value ===
                                                    'all'
                                                        ? ''
                                                        : value,
                                            },
                                        )
                                    }
                                >
                                    <SelectTrigger className="h-10 shadow-none">
                                        <SelectValue placeholder="All campaigns" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectItem value="all">
                                            All campaigns
                                        </SelectItem>

                                        {campaigns.map(
                                            (
                                                campaign: any,
                                            ) => (
                                                <SelectItem
                                                    key={
                                                        campaign.id
                                                    }
                                                    value={String(
                                                        campaign.id,
                                                    )}
                                                >
                                                    {
                                                        campaign.name
                                                    }
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Event */}

                            <div className="w-full md:w-48">
                                <Select
                                    value={
                                        filters.event_id ||
                                        'all'
                                    }
                                    onValueChange={(
                                        value,
                                    ) =>
                                        updateFilters(
                                            {
                                                event_id:
                                                    value ===
                                                    'all'
                                                        ? ''
                                                        : value,
                                            },
                                        )
                                    }
                                >
                                    <SelectTrigger className="h-10 shadow-none">
                                        <SelectValue placeholder="All events" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectItem value="all">
                                            All events
                                        </SelectItem>

                                        {events.map(
                                            (
                                                event: any,
                                            ) => (
                                                <SelectItem
                                                    key={
                                                        event.id
                                                    }
                                                    value={String(
                                                        event.id,
                                                    )}
                                                >
                                                    {
                                                        event.name
                                                    }
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Sort */}

                            <div className="w-full md:w-40">
                                <Select
                                    value={
                                        filters.sort ||
                                        'newest'
                                    }
                                    onValueChange={(
                                        value,
                                    ) =>
                                        updateFilters(
                                            {
                                                sort: value,
                                            },
                                        )
                                    }
                                >
                                    <SelectTrigger className="h-10 shadow-none">
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

                            {/* Clear */}

                            {hasFilters && (
                                <Button
                                    variant="outline"
                                    onClick={
                                        clearFilters
                                    }
                                    className="
                                        shadow-none
                                        md:ml-auto
                                    "
                                >
                                    Clear filters
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* =====================================================
                        EMPTY STATE
                    ====================================================== */}

                    {designList.length === 0 ? (
                        <Card
                            className="
                                rounded-xl
                                border-border
                                bg-card
                                shadow-[0_2px_8px_rgba(0,0,0,0.05)]
                            "
                        >
                            <CardContent
                                className="
                                    flex
                                    flex-col
                                    items-center
                                    justify-center
                                    gap-5
                                    px-6
                                    py-20
                                    text-center
                                "
                            >
                                <div
                                    className="
                                        flex
                                        h-16
                                        w-16
                                        items-center
                                        justify-center
                                        rounded-xl
                                        border
                                        border-primary/15
                                        bg-primary/5
                                        text-primary
                                    "
                                >
                                    <ImageIcon className="h-8 w-8" />
                                </div>

                                <div>
                                    <h2 className="text-xl font-semibold text-foreground">
                                        No designs yet
                                    </h2>

                                    <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                                        Create your first AI-powered
                                        marketing visual for your product
                                        or upcoming event.
                                    </p>
                                </div>

                                <Button
                                    asChild
                                    className="shadow-sm"
                                >
                                    <Link href="/generator">
                                        Create your first design
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* =================================================
                                DESIGN GRID
                            ================================================== */}

                            <div
                                className="
                                    grid
                                    gap-5
                                    sm:grid-cols-2
                                    lg:grid-cols-3
                                    xl:grid-cols-4
                                "
                            >
                                {designList.map(
                                    (
                                        design: any,
                                    ) => (
                                        <Card
                                            key={
                                                design.id
                                            }
                                            className="
                                                group
                                                overflow-hidden
                                                rounded-xl
                                                border-border
                                                bg-card
                                                shadow-[0_2px_8px_rgba(0,0,0,0.05)]
                                                transition-all
                                                duration-200
                                                hover:-translate-y-0.5
                                                hover:shadow-[0_5px_16px_rgba(0,0,0,0.07)]
                                            "
                                        >
                                            {/* Image */}

                                            <Link
                                                href={`/designs/${design.id}`}
                                                className="block"
                                            >
                                                <div
                                                    className="
                                                        relative
                                                        h-56
                                                        overflow-hidden
                                                        bg-muted
                                                    "
                                                >
                                                    {design.image_url ? (
                                                        <img
                                                            src={
                                                                design.image_url
                                                            }
                                                            alt={
                                                                design.product_name ||
                                                                'Marketing design'
                                                            }
                                                            className="
                                                                h-full
                                                                w-full
                                                                object-cover
                                                                transition-transform
                                                                duration-300
                                                                group-hover:scale-[1.02]
                                                            "
                                                        />
                                                    ) : (
                                                        <div
                                                            className="
                                                                flex
                                                                h-full
                                                                w-full
                                                                items-center
                                                                justify-center
                                                                bg-muted
                                                                text-muted-foreground
                                                            "
                                                        >
                                                            <ImageIcon className="h-10 w-10" />
                                                        </div>
                                                    )}

                                                    {/* Subtle image overlay */}

                                                    <div
                                                        className="
                                                            pointer-events-none
                                                            absolute
                                                            inset-x-0
                                                            bottom-0
                                                            h-16
                                                            bg-gradient-to-t
                                                            from-black/15
                                                            to-transparent
                                                            opacity-0
                                                            transition-opacity
                                                            group-hover:opacity-100
                                                        "
                                                    />
                                                </div>
                                            </Link>

                                            {/* Card content */}

                                            <CardContent className="space-y-3 p-4">

                                                {/* Title + status */}

                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p
                                                            className="
                                                                truncate
                                                                text-base
                                                                font-semibold
                                                                text-foreground
                                                            "
                                                        >
                                                            {design.product_name ||
                                                                'Untitled design'}
                                                        </p>

                                                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
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
                                                        className="shrink-0"
                                                    >
                                                        {
                                                            design.status
                                                        }
                                                    </Badge>
                                                </div>

                                                {/* Tagline */}

                                                {design.tagline && (
                                                    <p
                                                        className="
                                                            line-clamp-2
                                                            text-sm
                                                            leading-5
                                                            text-muted-foreground
                                                        "
                                                    >
                                                        {
                                                            design.tagline
                                                        }
                                                    </p>
                                                )}

                                                {/* Footer */}

                                                <div
                                                    className="
                                                        flex
                                                        items-center
                                                        justify-between
                                                        border-t
                                                        border-border
                                                        pt-3
                                                    "
                                                >
                                                    <span className="text-xs text-muted-foreground">
                                                        {
                                                            design.created_at
                                                        }
                                                    </span>

                                                    <Link
                                                        href={`/designs/${design.id}`}
                                                        className="
                                                            text-sm
                                                            font-medium
                                                            text-primary
                                                            transition-colors
                                                            hover:text-primary/80
                                                        "
                                                    >
                                                        View
                                                    </Link>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ),
                                )}
                            </div>

                            {/* =================================================
                                PAGINATION
                            ================================================== */}

                            {lastPage > 1 && (
                                <div
                                    className="
                                        flex
                                        items-center
                                        justify-between
                                        rounded-xl
                                        border
                                        border-border
                                        bg-card
                                        p-3
                                        shadow-[0_2px_8px_rgba(0,0,0,0.05)]
                                    "
                                >
                                    <Button
                                        variant="outline"
                                        asChild={
                                            currentPage >
                                            1
                                        }
                                        disabled={
                                            currentPage <=
                                            1
                                        }
                                        className="shadow-none"
                                    >
                                        {currentPage >
                                        1 ? (
                                            <Link
                                                href={buildPageUrl(
                                                    Math.max(
                                                        currentPage -
                                                            1,
                                                        1,
                                                    ),
                                                )}
                                            >
                                                Previous
                                            </Link>
                                        ) : (
                                            <span>
                                                Previous
                                            </span>
                                        )}
                                    </Button>

                                    <p className="text-sm text-muted-foreground">
                                        Page{' '}
                                        <span className="font-medium text-foreground">
                                            {
                                                currentPage
                                            }
                                        </span>{' '}
                                        of{' '}
                                        <span className="font-medium text-foreground">
                                            {
                                                lastPage
                                            }
                                        </span>
                                    </p>

                                    <Button
                                        variant="outline"
                                        asChild={
                                            currentPage <
                                            lastPage
                                        }
                                        disabled={
                                            currentPage >=
                                            lastPage
                                        }
                                        className="shadow-none"
                                    >
                                        {currentPage <
                                        lastPage ? (
                                            <Link
                                                href={buildPageUrl(
                                                    Math.min(
                                                        currentPage +
                                                            1,
                                                        lastPage,
                                                    ),
                                                )}
                                            >
                                                Next
                                            </Link>
                                        ) : (
                                            <span>
                                                Next
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

DesignsPage.layout = {
    breadcrumbs: [
        {
            title: 'My Designs',
            href: '/designs',
        },
    ],
};