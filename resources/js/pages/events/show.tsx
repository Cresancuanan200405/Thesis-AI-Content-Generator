import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EventShowPage({ event }: any) {
    return (
        <>
            <Head title={event?.name ?? 'Event'} />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex items-center justify-between gap-4">
                    <Button variant="outline" size="sm" asChild className="rounded-md">
                        <Link
                            href={event?.calendar_url ?? '/calendar'}
                            className="inline-flex items-center gap-2 text-xs font-semibold"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to calendar
                        </Link>
                    </Button>
                    <Badge variant={event?.is_global ? 'secondary' : 'default'} className="rounded-md">
                        {event?.is_global ? 'Global event' : 'Your event'}
                    </Badge>
                </div>

                <Card className="rounded-card border-border/80 shadow-xs">
                    <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Marketing Event
                                </p>
                                <CardTitle className="mt-1.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                    {event?.name}
                                </CardTitle>
                            </div>
                            <Badge variant="outline" className="rounded-md">{event?.type}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                                <CalendarDays className="h-4 w-4" />
                                <span>{event?.date}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                                <Clock className="h-4 w-4" />
                                <span>{event?.created_at}</span>
                            </div>
                        </div>

                        <div className="rounded-xl border bg-muted/20 p-4">
                            <p className="text-sm font-medium text-muted-foreground">
                                Overview
                            </p>
                            <p className="mt-2 text-sm leading-6 text-foreground">
                                {event?.description ||
                                    'No description provided for this marketing event.'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

EventShowPage.layout = {
    breadcrumbs: [
        { title: 'Marketing Calendar', href: '/calendar' },
        { title: 'Event Details', href: '#', current: true },
    ],
};
