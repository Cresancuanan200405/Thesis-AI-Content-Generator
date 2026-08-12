import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CampaignShowPage({ campaign }: any) {
    return (
        <>
            <Head title={campaign?.name ?? 'Campaign'} />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">
                            Campaigns
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                            {campaign?.name}
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                            {campaign?.objective ||
                                'Campaign details and strategy summary.'}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">
                            {campaign?.status ?? 'Draft'}
                        </Badge>
                        <Button asChild variant="outline">
                            <Link
                                href="/campaigns"
                                className="inline-flex items-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to campaigns
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Campaign summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                    Target audience
                                </p>
                                <p className="mt-1 text-lg font-medium">
                                    {campaign?.target_audience ??
                                        'General audience'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                    Product
                                </p>
                                <p className="mt-1 text-lg font-medium">
                                    {campaign?.product_name ??
                                        'No product selected'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                    Event
                                </p>
                                <p className="mt-1 text-lg font-medium">
                                    {campaign?.event_name ??
                                        'No event selected'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Campaign details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                    Description
                                </p>
                                <p className="mt-1 text-sm leading-6 whitespace-pre-wrap text-muted-foreground">
                                    {campaign?.description ||
                                        'No campaign description provided.'}
                                </p>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                        Start date
                                    </p>
                                    <p className="mt-1 text-sm font-medium">
                                        {campaign?.start_date ?? 'TBD'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                        End date
                                    </p>
                                    <p className="mt-1 text-sm font-medium">
                                        {campaign?.end_date ?? 'TBD'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Designs</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {campaign?.designs?.length ? (
                                <div className="space-y-3">
                                    {campaign.designs.map((design: any) => (
                                        <div
                                            key={design.id}
                                            className="flex items-center gap-3 rounded-lg border p-4"
                                        >
                                            {design.image_url ? (
                                                <img
                                                    src={design.image_url}
                                                    alt={design.product_name}
                                                    className="h-14 w-14 rounded-md object-cover"
                                                />
                                            ) : null}
                                            <div>
                                                <p className="font-medium">
                                                    {design.product_name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {design.status}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No designs have been generated for this
                                    campaign yet.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Generator</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Use the campaign generator to create new designs
                                and marketing assets for this campaign.
                            </p>
                            <Button asChild>
                                <Link
                                    href={
                                        campaign?.generator_url ?? '/generator'
                                    }
                                >
                                    Open generator
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

CampaignShowPage.layout = {
    breadcrumbs: [
        { title: 'Campaigns', href: '/campaigns' },
        { title: 'Campaign details', href: '#', current: true },
    ],
};
