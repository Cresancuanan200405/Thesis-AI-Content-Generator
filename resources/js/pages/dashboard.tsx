import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, CalendarClock, ImageIcon, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
    const { auth, campaigns = [], upcoming_events = [], recent_designs = [] } = usePage().props as any;
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    const summaryCards = [
        { label: 'Total Campaigns', value: String(campaigns.length ?? 0), note: 'Campaigns in your workspace' },
        { label: 'Active Campaigns', value: String(campaigns.filter((campaign: any) => campaign.status === 'active').length), note: 'Currently driving work' },
        { label: 'Upcoming Events', value: String(upcoming_events.length ?? 0), note: 'Events on your timeline' },
        { label: 'Generated Designs', value: String(campaigns.reduce((total: number, campaign: any) => total + Number(campaign.design_count || 0), 0)), note: 'Connected to campaigns' },
    ];

    return (
        <>
            <Head title="Dashboard" />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 rounded-[1.75rem] border border-border/80 bg-card/80 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{greeting}, {auth.user?.name}</p>
                        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Ready to create your next marketing campaign?</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button asChild size="lg" className="gap-2 shadow-sm">
                            <Link href="/generator">
                                Create New Design
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {summaryCards.map((card) => (
                        <Card key={card.label} className="border-border/80 bg-card/75 text-card-foreground shadow-[0_16px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl">
                            <CardHeader className="pb-2">
                                <p className="text-sm text-muted-foreground">{card.label}</p>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-end justify-between">
                                    <div className="text-3xl font-semibold tracking-tight text-foreground">{card.value}</div>
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">{card.note}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <Card className="border-border/80 bg-card/75 text-card-foreground shadow-[0_16px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-xl text-foreground">
                                <CalendarClock className="h-5 w-5 text-primary" />
                                Upcoming Marketing Opportunities
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {upcoming_events.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                                    No upcoming events yet.
                                </div>
                            ) : (
                                upcoming_events.map((event: any) => (
                                    <div key={event.name} className="flex items-center justify-between rounded-xl border border-border bg-muted/25 p-4">
                                        <div>
                                            <div className="font-semibold text-foreground">{event.name}</div>
                                            <div className="mt-1 text-sm text-muted-foreground">{event.date}</div>
                                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>{event.category}</span>
                                                <span>•</span>
                                                <span>{event.days}</span>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" asChild className="bg-background/40 hover:bg-accent/60">
                                            <Link href="/generator">Create Marketing Image</Link>
                                        </Button>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-border/80 bg-card/75 text-card-foreground shadow-[0_16px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl text-foreground">
                                <Sparkles className="h-5 w-5 text-primary" />
                                Recent Designs
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {recent_designs.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                                    No designs yet.
                                </div>
                            ) : (
                                recent_designs.map((design: any) => (
                                    <Link key={design.id} href={design.url || `/designs/${design.id}`} className="block">
                                        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3 transition hover:bg-accent/40">
                                            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-background text-muted-foreground">
                                                {design.image_url ? (
                                                    <img src={design.image_url} alt={design.product_name || 'Design'} className="h-full w-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="h-6 w-6" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="truncate font-medium text-foreground">{design.product_name || 'Untitled design'}</p>
                                                    <Badge variant={design.status === 'completed' ? 'default' : 'secondary'}>{design.status}</Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{design.campaign_name || design.event_name || 'General creative'}</p>
                                                <p className="text-xs text-muted-foreground">{design.created_at || 'Recently created'}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                            <div className="pt-2">
                                <Button asChild variant="outline" className="w-full bg-background/40 hover:bg-accent/60">
                                    <Link href="/designs">View All Designs</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
