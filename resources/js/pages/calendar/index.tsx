import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    Filter,
    Sparkles,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarPage({
    events = [],
    filter = 'all',
    upcoming_events = [],
}: any) {
    const [month, setMonth] = useState(
        () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    );

    const eventTypeStyles: Record<string, string> = {
        holiday: 'bg-orange-500/15 text-orange-200 border border-orange-400/30',
        seasonal:
            'bg-emerald-500/15 text-emerald-200 border border-emerald-400/30',
        commercial: 'bg-blue-500/15 text-blue-200 border border-blue-400/30',
        custom: 'bg-violet-500/15 text-violet-200 border border-violet-400/30',
    };

    const changeFilter = (value: string) => {
        router.get(
            '/calendar',
            { filter: value === 'all' ? '' : value },
            {
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const monthView = useMemo(() => {
        const year = month.getFullYear();
        const monthIndex = month.getMonth();
        const firstDay = new Date(year, monthIndex, 1);
        const lastDay = new Date(year, monthIndex + 1, 0);
        const daysInMonth = lastDay.getDate();
        const leadingDays = (firstDay.getDay() + 6) % 7;
        const totalCells = Math.ceil((leadingDays + daysInMonth) / 7) * 7;

        const cells = Array.from({ length: totalCells }, (_, index) => {
            const dateIndex = index - leadingDays + 1;
            const date = new Date(year, monthIndex, dateIndex);

            return {
                date,
                currentMonth: date.getMonth() === monthIndex,
            };
        });

        const datesByKey = new Map<string, any[]>();

        for (const event of events) {
            if (!event.date) {
                continue;
            }

            const key = new Date(event.date).toDateString();
            const value = datesByKey.get(key) ?? [];
            value.push(event);
            datesByKey.set(key, value);
        }

        return { cells, datesByKey };
    }, [events, month]);

    const monthLabel = month.toLocaleString('en-US', {
        month: 'long',
        year: 'numeric',
    });

    return (
        <>
            <Head title="Marketing Calendar" />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-300">
                            Marketing Calendar
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                            Plan launches and seasonal campaigns
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() =>
                                changeFilter(filter === 'all' ? 'all' : 'all')
                            }
                            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                        >
                            <Filter className="mr-2 h-4 w-4" />
                            {filter === 'all' ? 'All events' : filter}
                        </Button>
                        <Button asChild>
                            <Link href="/generator">Create campaign asset</Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
                    <Card className="border-white/10 bg-slate-950/55 text-white shadow-[0_16px_50px_rgba(15,23,42,0.28)] backdrop-blur-xl">
                        <CardHeader className="flex flex-col gap-4 border-b border-white/10 md:flex-row md:items-center md:justify-between">
                            <CardTitle className="flex items-center gap-2 text-xl text-white">
                                <CalendarDays className="h-5 w-5 text-blue-400" />
                                Event timeline
                            </CardTitle>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    'all',
                                    'holidays',
                                    'commercial',
                                    'custom',
                                ].map((item) => (
                                    <Button
                                        key={item}
                                        variant={
                                            filter === item ||
                                            (item === 'all' && filter === 'all')
                                                ? 'default'
                                                : 'outline'
                                        }
                                        size="sm"
                                        onClick={() => changeFilter(item)}
                                        className={
                                            filter === item ||
                                            (item === 'all' && filter === 'all')
                                                ? ''
                                                : 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                                        }
                                    >
                                        {item === 'all' ? 'All' : item}
                                    </Button>
                                ))}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-5 pt-5">
                            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/60 p-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() =>
                                        setMonth(
                                            new Date(
                                                month.getFullYear(),
                                                month.getMonth() - 1,
                                                1,
                                            ),
                                        )
                                    }
                                    className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <div className="text-center">
                                    <p className="text-xs tracking-[0.2em] text-slate-400 uppercase">
                                        Calendar
                                    </p>
                                    <h2 className="text-lg font-semibold text-white">
                                        {monthLabel}
                                    </h2>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() =>
                                        setMonth(
                                            new Date(
                                                month.getFullYear(),
                                                month.getMonth() + 1,
                                                1,
                                            ),
                                        )
                                    }
                                    className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                                >
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-7 gap-2 text-center text-xs tracking-[0.15em] text-slate-400 uppercase">
                                {weekdayLabels.map((name) => (
                                    <div key={name} className="py-2">
                                        {name}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-2">
                                {monthView.cells.map(
                                    ({ date, currentMonth }, index) => {
                                        const isoKey = date
                                            .toISOString()
                                            .split('T')[0];
                                        const dayEvents =
                                            monthView.datesByKey.get(
                                                new Date(isoKey).toDateString(),
                                            ) ?? [];
                                        const isToday =
                                            date.toDateString() ===
                                            new Date().toDateString();

                                        return (
                                            <div
                                                key={`${isoKey}-${index}`}
                                                className={[
                                                    'min-h-[110px] rounded-2xl border p-2',
                                                    currentMonth
                                                        ? 'border-white/10 bg-slate-900/60'
                                                        : 'border-white/5 bg-slate-900/20 text-slate-500',
                                                    isToday
                                                        ? 'ring-1 ring-blue-400/70'
                                                        : '',
                                                ].join(' ')}
                                            >
                                                <div
                                                    className={[
                                                        'mb-2 flex items-center justify-between text-xs',
                                                        currentMonth
                                                            ? 'text-slate-300'
                                                            : 'text-slate-500',
                                                    ].join(' ')}
                                                >
                                                    <span
                                                        className={
                                                            isToday
                                                                ? 'rounded-full bg-blue-500 px-1.5 py-0.5 text-white'
                                                                : ''
                                                        }
                                                    >
                                                        {date.getDate()}
                                                    </span>
                                                </div>
                                                <div className="space-y-1.5">
                                                    {dayEvents
                                                        .slice(0, 2)
                                                        .map((event: any) => (
                                                            <div
                                                                key={event.id}
                                                                className={`rounded-md px-2 py-1 text-[10px] font-medium ${eventTypeStyles[event.type] ?? 'border border-white/10 bg-slate-700/80 text-slate-100'}`}
                                                            >
                                                                {event.name}
                                                            </div>
                                                        ))}
                                                    {dayEvents.length > 2 && (
                                                        <div className="text-[10px] text-slate-400">
                                                            +
                                                            {dayEvents.length -
                                                                2}{' '}
                                                            more
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    },
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-slate-950/55 text-white shadow-[0_16px_50px_rgba(15,23,42,0.28)] backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl text-white">
                                <Sparkles className="h-5 w-5 text-blue-400" />
                                Upcoming opportunities
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {upcoming_events.length === 0 ? (
                                <p className="text-sm text-slate-400">
                                    No upcoming campaigns scheduled.
                                </p>
                            ) : (
                                upcoming_events.map((event: any) => (
                                    <div
                                        key={event.id}
                                        className="rounded-xl border border-white/10 bg-slate-900/60 p-3"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="font-medium text-white">
                                                {event.name}
                                            </p>
                                            <Badge
                                                variant="outline"
                                                className="border-white/10 bg-white/5 text-slate-200"
                                            >
                                                {event.type}
                                            </Badge>
                                        </div>
                                        <p className="mt-1 text-sm text-slate-300">
                                            {event.date}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-400">
                                            {event.days}
                                        </p>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

CalendarPage.layout = {
    breadcrumbs: [
        {
            title: 'Marketing Calendar',
            href: '/calendar',
        },
    ],
};
