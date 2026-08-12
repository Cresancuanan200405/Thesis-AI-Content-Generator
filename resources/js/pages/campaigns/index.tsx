import { Head } from '@inertiajs/react';

export default function CampaignsPage() {
    return (
        <>
            <Head title="Campaigns" />
            <div className="space-y-6 p-4 md:p-6">
                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                    <p className="text-sm font-medium text-muted-foreground">Campaigns</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight">Manage active marketing campaigns</h1>
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                        Campaign status, launch windows, and reporting summaries will live here.
                    </p>
                </div>
            </div>
        </>
    );
}

CampaignsPage.layout = {
    breadcrumbs: [
        {
            title: 'Campaigns',
            href: '/campaigns',
        },
    ],
};
