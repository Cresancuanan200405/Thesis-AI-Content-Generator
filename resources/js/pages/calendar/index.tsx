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
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

const weekdayLabels = [
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
    'Sun',
];

const eventTypeStyles: Record<string, string> = {
    holiday:
        'border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300',

    seasonal:
        'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',

    commercial:
        'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300',

    custom:
        'border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300',
};

const filterOptions = [
    {
        value: 'all',
        label: 'All',
    },
    {
        value: 'holidays',
        label: 'Holidays',
    },
    {
        value: 'commercial',
        label: 'Commercial',
    },
    {
        value: 'custom',
        label: 'Custom',
    },
];

export default function CalendarPage({
    events = [],
    filter = 'all',
    upcoming_events = [],
}: any) {
    const [month, setMonth] = useState(
        () =>
            new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                1,
            ),
    );

    /*
    |--------------------------------------------------------------------------
    | Filter
    |--------------------------------------------------------------------------
    */

    const changeFilter = (value: string) => {
        router.get(
            '/calendar',
            {
                filter: value === 'all' ? '' : value,
            },
            {
                preserveScroll: true,
                replace: true,
            },
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Calendar calculation
    |--------------------------------------------------------------------------
    */

    const monthView = useMemo(() => {
        const year = month.getFullYear();
        const monthIndex = month.getMonth();

        const firstDay = new Date(
            year,
            monthIndex,
            1,
        );

        const lastDay = new Date(
            year,
            monthIndex + 1,
            0,
        );

        const daysInMonth = lastDay.getDate();

        const leadingDays =
            (firstDay.getDay() + 6) % 7;

        const totalCells =
            Math.ceil(
                (leadingDays + daysInMonth) / 7,
            ) * 7;

        const cells = Array.from(
            {
                length: totalCells,
            },
            (_, index) => {
                const dateIndex =
                    index -
                    leadingDays +
                    1;

                const date = new Date(
                    year,
                    monthIndex,
                    dateIndex,
                );

                return {
                    date,
                    currentMonth:
                        date.getMonth() ===
                        monthIndex,
                };
            },
        );

        const datesByKey = new Map<
            string,
            any[]
        >();

        for (const event of events) {
            if (!event.date) {
                continue;
            }

            const eventDate = new Date(
                event.date,
            );

            if (Number.isNaN(eventDate.getTime())) {
                continue;
            }

            const key =
                eventDate.toDateString();

            const value =
                datesByKey.get(key) ?? [];

            value.push(event);

            datesByKey.set(
                key,
                value,
            );
        }

        return {
            cells,
            datesByKey,
        };
    }, [events, month]);

    /*
    |--------------------------------------------------------------------------
    | Month label
    |--------------------------------------------------------------------------
    */

    const monthLabel =
        month.toLocaleString(
            'en-US',
            {
                month: 'long',
                year: 'numeric',
            },
        );

    /*
    |--------------------------------------------------------------------------
    | Month navigation
    |--------------------------------------------------------------------------
    */

    const previousMonth = () => {
        setMonth(
            new Date(
                month.getFullYear(),
                month.getMonth() - 1,
                1,
            ),
        );
    };

    const nextMonth = () => {
        setMonth(
            new Date(
                month.getFullYear(),
                month.getMonth() + 1,
                1,
            ),
        );
    };

    const goToToday = () => {
        const today = new Date();

        setMonth(
            new Date(
                today.getFullYear(),
                today.getMonth(),
                1,
            ),
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    const isCurrentMonth = (
        date: Date,
    ) => {
        return (
            date.getMonth() ===
                month.getMonth() &&
            date.getFullYear() ===
                month.getFullYear()
        );
    };

    const isToday = (date: Date) => {
        return (
            date.toDateString() ===
            new Date().toDateString()
        );
    };

    return (
        <>
            <Head title="Marketing Calendar" />

            <div className="min-h-screen bg-background text-foreground">
                <div
                    className="
                        space-y-6
                        p-4
                        duration-500
                        animate-in
                        fade-in
                        md:space-y-8
                        md:p-6
                        lg:p-8
                    "
                >

                    {/* =====================================================
                        PAGE HEADER
                    ====================================================== */}

                    <section
                        className="
                            relative
                            overflow-hidden
                            rounded-2xl
                            border
                            border-border
                            bg-card
                            p-5
                            shadow-[0_2px_8px_rgba(0,0,0,0.05)]
                            transition-all
                            duration-300
                            hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)]
                            md:p-6
                        "
                    >
                        {/* Decorative background */}
                        <div
                            className="
                                pointer-events-none
                                absolute
                                -right-20
                                -top-20
                                h-48
                                w-48
                                rounded-full
                                bg-primary/5
                                blur-3xl
                            "
                        />

                        <div
                            className="
                                relative
                                flex
                                flex-col
                                gap-5
                                md:flex-row
                                md:items-center
                                md:justify-between
                            "
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="
                                            flex
                                            h-9
                                            w-9
                                            shrink-0
                                            items-center
                                            justify-center
                                            rounded-lg
                                            bg-primary/10
                                        "
                                    >
                                        <CalendarDays className="h-4 w-4 text-primary" />
                                    </div>

                                    <p className="text-sm font-medium text-muted-foreground">
                                        Marketing Calendar
                                    </p>
                                </div>

                                <h1
                                    className="
                                        mt-3
                                        text-2xl
                                        font-semibold
                                        tracking-tight
                                        text-foreground
                                        md:text-3xl
                                    "
                                >
                                    Plan launches and seasonal campaigns
                                </h1>

                                <p
                                    className="
                                        mt-2
                                        max-w-2xl
                                        text-sm
                                        leading-6
                                        text-muted-foreground
                                    "
                                >
                                    Organize upcoming marketing
                                    opportunities and plan your
                                    campaigns around important dates.
                                </p>
                            </div>

                            <div
                                className="
                                    flex
                                    flex-col
                                    gap-2
                                    sm:flex-row
                                "
                            >
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        changeFilter('all')
                                    }
                                    className="
                                        gap-2
                                        shadow-none
                                        transition-all
                                        duration-200
                                        hover:-translate-y-0.5
                                    "
                                >
                                    <Filter className="h-4 w-4" />

                                    {filter === 'all'
                                        ? 'All events'
                                        : filter}
                                </Button>

                                <Button
                                    asChild
                                    className="
                                        gap-2
                                        shadow-sm
                                        transition-all
                                        duration-200
                                        hover:-translate-y-0.5
                                        hover:shadow-md
                                    "
                                >
                                    <Link href="/generator">
                                        Create campaign asset

                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </section>

                    {/* =====================================================
                        MAIN CONTENT
                    ====================================================== */}

                    <div
                        className="
                            grid
                            gap-6
                            xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]
                        "
                    >

                        {/* =================================================
                            CALENDAR
                        ================================================== */}

                        <Card
                            className="
                                overflow-hidden
                                rounded-2xl
                                border-border
                                bg-card
                                shadow-[0_2px_8px_rgba(0,0,0,0.05)]
                                transition-all
                                duration-300
                                hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)]
                            "
                        >
                            {/* -------------------------------------------------
                                CALENDAR HEADER
                            -------------------------------------------------- */}

                            <CardHeader
                                className="
                                    border-b
                                    border-border
                                    p-5
                                    md:p-6
                                "
                            >
                                <div
                                    className="
                                        flex
                                        flex-col
                                        gap-5
                                        lg:flex-row
                                        lg:items-center
                                        lg:justify-between
                                    "
                                >
                                    <div>
                                        <CardTitle
                                            className="
                                                flex
                                                items-center
                                                gap-2
                                                text-lg
                                                text-foreground
                                            "
                                        >
                                            <div
                                                className="
                                                    flex
                                                    h-8
                                                    w-8
                                                    items-center
                                                    justify-center
                                                    rounded-lg
                                                    bg-primary/10
                                                "
                                            >
                                                <CalendarDays className="h-4 w-4 text-primary" />
                                            </div>

                                            Event timeline
                                        </CardTitle>

                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Browse your marketing
                                            opportunities by date.
                                        </p>
                                    </div>

                                    {/* Filters */}

                                    <div
                                        className="
                                            flex
                                            flex-wrap
                                            gap-1.5
                                            rounded-lg
                                            bg-muted/40
                                            p-1
                                        "
                                    >
                                        {filterOptions.map(
                                            (item) => {
                                                const active =
                                                    filter ===
                                                    item.value;

                                                return (
                                                    <button
                                                        key={
                                                            item.value
                                                        }
                                                        type="button"
                                                        onClick={() =>
                                                            changeFilter(
                                                                item.value,
                                                            )
                                                        }
                                                        className={`
                                                            rounded-md
                                                            px-3
                                                            py-1.5
                                                            text-xs
                                                            font-medium
                                                            transition-all
                                                            duration-200

                                                            ${
                                                                active
                                                                    ? 'bg-background text-foreground shadow-sm'
                                                                    : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
                                                            }
                                                        `}
                                                    >
                                                        {
                                                            item.label
                                                        }
                                                    </button>
                                                );
                                            },
                                        )}
                                    </div>
                                </div>
                            </CardHeader>

                            {/* -------------------------------------------------
                                CALENDAR CONTENT
                            -------------------------------------------------- */}

                            <CardContent className="space-y-5 p-4 md:p-6">

                                {/* Month toolbar */}

                                <div
                                    className="
                                        flex
                                        items-center
                                        justify-between
                                        rounded-xl
                                        border
                                        border-border
                                        bg-muted/20
                                        p-2
                                        transition-colors
                                    "
                                >
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={
                                            previousMonth
                                        }
                                        className="
                                            h-9
                                            w-9
                                            rounded-lg
                                            transition-all
                                            duration-200
                                            hover:-translate-x-0.5
                                        "
                                        aria-label="Previous month"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>

                                    <div className="text-center">
                                        <p
                                            className="
                                                text-[10px]
                                                font-medium
                                                tracking-[0.18em]
                                                text-muted-foreground
                                                uppercase
                                            "
                                        >
                                            Calendar
                                        </p>

                                        <h2
                                            className="
                                                mt-0.5
                                                text-base
                                                font-semibold
                                                text-foreground
                                                md:text-lg
                                            "
                                        >
                                            {monthLabel}
                                        </h2>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={
                                                goToToday
                                            }
                                            className="
                                                hidden
                                                h-9
                                                shadow-none
                                                transition-all
                                                duration-200
                                                hover:-translate-y-0.5
                                                sm:inline-flex
                                            "
                                        >
                                            Today
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={
                                                nextMonth
                                            }
                                            className="
                                                h-9
                                                w-9
                                                rounded-lg
                                                transition-all
                                                duration-200
                                                hover:translate-x-0.5
                                            "
                                            aria-label="Next month"
                                        >
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Weekdays */}

                                <div
                                    className="
                                        grid
                                        grid-cols-7
                                        gap-1.5
                                        sm:gap-2
                                    "
                                >
                                    {weekdayLabels.map(
                                        (name) => (
                                            <div
                                                key={name}
                                                className="
                                                    py-1.5
                                                    text-center
                                                    text-[10px]
                                                    font-semibold
                                                    tracking-wide
                                                    text-muted-foreground
                                                    uppercase
                                                    sm:text-[11px]
                                                "
                                            >
                                                {name}
                                            </div>
                                        ),
                                    )}
                                </div>

                                {/* Calendar grid */}

                                <div
                                    className="
                                        grid
                                        grid-cols-7
                                        gap-1.5
                                        sm:gap-2
                                    "
                                >
                                    {monthView.cells.map(
                                        (
                                            { date },
                                            index,
                                        ) => {
                                            const dateKey =
                                                date.toDateString();

                                            const dayEvents =
                                                monthView
                                                    .datesByKey
                                                    .get(
                                                        dateKey,
                                                    ) ??
                                                [];

                                            const today =
                                                isToday(
                                                    date,
                                                );

                                            const inMonth =
                                                isCurrentMonth(
                                                    date,
                                                );

                                            return (
                                                <div
                                                    key={`${dateKey}-${index}`}
                                                    className={`
                                                        group
                                                        relative
                                                        min-h-[92px]
                                                        overflow-hidden
                                                        rounded-xl
                                                        border
                                                        p-1.5
                                                        transition-all
                                                        duration-200
                                                        sm:min-h-[110px]
                                                        sm:p-2

                                                        ${
                                                            inMonth
                                                                ? 'border-border bg-background hover:-translate-y-0.5 hover:bg-muted/20 hover:shadow-sm'
                                                                : 'border-border/50 bg-muted/20 text-muted-foreground'
                                                        }

                                                        ${
                                                            today
                                                                ? 'border-primary/40 bg-primary/[0.03] ring-1 ring-primary/30'
                                                                : ''
                                                        }
                                                    `}
                                                >
                                                    {/* Today indicator */}

                                                    {today && (
                                                        <span
                                                            className="
                                                                absolute
                                                                right-2
                                                                top-2
                                                                h-1.5
                                                                w-1.5
                                                                rounded-full
                                                                bg-primary
                                                            "
                                                        />
                                                    )}

                                                    {/* Date */}

                                                    <div
                                                        className="
                                                            mb-2
                                                            flex
                                                            items-center
                                                            justify-between
                                                        "
                                                    >
                                                        <span
                                                            className={`
                                                                flex
                                                                h-6
                                                                min-w-6
                                                                items-center
                                                                justify-center
                                                                rounded-full
                                                                px-1.5
                                                                text-xs
                                                                font-medium
                                                                transition-colors

                                                                ${
                                                                    today
                                                                        ? 'bg-primary text-primary-foreground'
                                                                        : inMonth
                                                                          ? 'text-foreground'
                                                                          : 'text-muted-foreground'
                                                                }
                                                            `}
                                                        >
                                                            {
                                                                date.getDate()
                                                            }
                                                        </span>
                                                    </div>

                                                    {/* Events */}

                                                    <div className="space-y-1">
                                                        {dayEvents
                                                            .slice(
                                                                0,
                                                                2,
                                                            )
                                                            .map(
                                                                (
                                                                    event: any,
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            event.id
                                                                        }
                                                                        title={
                                                                            event.name
                                                                        }
                                                                        className={`
                                                                            truncate
                                                                            rounded-md
                                                                            border
                                                                            px-1.5
                                                                            py-1
                                                                            text-[9px]
                                                                            font-medium
                                                                            leading-3.5
                                                                            transition-all
                                                                            duration-200
                                                                            hover:brightness-95
                                                                            sm:px-2
                                                                            sm:text-[10px]

                                                                            ${
                                                                                eventTypeStyles[
                                                                                    event
                                                                                        .type
                                                                                ] ??
                                                                                'border-border bg-muted text-muted-foreground'
                                                                            }
                                                                        `}
                                                                    >
                                                                        {
                                                                            event.name
                                                                        }
                                                                    </div>
                                                                ),
                                                            )}

                                                        {dayEvents.length >
                                                            2 && (
                                                            <div
                                                                className="
                                                                    px-1
                                                                    text-[9px]
                                                                    font-medium
                                                                    text-muted-foreground
                                                                    sm:text-[10px]
                                                                "
                                                            >
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

                                {/* Legend */}

                                <div
                                    className="
                                        flex
                                        flex-wrap
                                        items-center
                                        gap-x-4
                                        gap-y-2
                                        border-t
                                        border-border
                                        pt-4
                                    "
                                >
                                    <span className="text-[11px] font-medium text-muted-foreground">
                                        Event types
                                    </span>

                                    {Object.entries(
                                        eventTypeStyles,
                                    ).map(
                                        ([
                                            type,
                                            styles,
                                        ]) => (
                                            <div
                                                key={type}
                                                className="flex items-center gap-1.5"
                                            >
                                                <span
                                                    className={`
                                                        h-2
                                                        w-2
                                                        rounded-full
                                                        ${styles
                                                            .split(
                                                                ' ',
                                                            )
                                                            .filter(
                                                                (
                                                                    item,
                                                                ) =>
                                                                    item.startsWith(
                                                                        'bg-',
                                                                    ),
                                                            )
                                                            .join(
                                                                ' ',
                                                            )}
                                                    `}
                                                />

                                                <span className="text-[11px] capitalize text-muted-foreground">
                                                    {
                                                        type
                                                    }
                                                </span>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* =================================================
                            UPCOMING EVENTS
                        ================================================== */}

                        <Card
                            className="
                                overflow-hidden
                                rounded-2xl
                                border-border
                                bg-card
                                shadow-[0_2px_8px_rgba(0,0,0,0.05)]
                                transition-all
                                duration-300
                                hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)]
                            "
                        >
                            <CardHeader
                                className="
                                    border-b
                                    border-border
                                    p-5
                                    md:p-6
                                "
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <CardTitle
                                            className="
                                                flex
                                                items-center
                                                gap-2
                                                text-lg
                                                text-foreground
                                            "
                                        >
                                            <div
                                                className="
                                                    flex
                                                    h-8
                                                    w-8
                                                    items-center
                                                    justify-center
                                                    rounded-lg
                                                    bg-primary/10
                                                "
                                            >
                                                <Sparkles className="h-4 w-4 text-primary" />
                                            </div>

                                            Upcoming opportunities
                                        </CardTitle>

                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Your next marketing dates.
                                        </p>
                                    </div>

                                    {upcoming_events.length >
                                        0 && (
                                        <Badge
                                            variant="secondary"
                                            className="shrink-0"
                                        >
                                            {
                                                upcoming_events.length
                                            }
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="p-4 md:p-5">
                                {upcoming_events.length ===
                                0 ? (
                                    <div
                                        className="
                                            rounded-xl
                                            border
                                            border-dashed
                                            border-border
                                            bg-muted/20
                                            p-8
                                            text-center
                                        "
                                    >
                                        <div
                                            className="
                                                mx-auto
                                                flex
                                                h-10
                                                w-10
                                                items-center
                                                justify-center
                                                rounded-lg
                                                bg-muted
                                            "
                                        >
                                            <CalendarDays className="h-5 w-5 text-muted-foreground" />
                                        </div>

                                        <p className="mt-3 text-sm font-medium text-foreground">
                                            No upcoming campaigns
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                            Your upcoming marketing
                                            opportunities will appear
                                            here.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {upcoming_events.map(
                                            (
                                                event: any,
                                                index: number,
                                            ) => (
                                                <div
                                                    key={
                                                        event.id
                                                    }
                                                    className="
                                                        group
                                                        relative
                                                        overflow-hidden
                                                        rounded-xl
                                                        border
                                                        border-border
                                                        bg-background
                                                        p-4
                                                        transition-all
                                                        duration-200
                                                        hover:-translate-y-0.5
                                                        hover:bg-muted/20
                                                        hover:shadow-sm
                                                    "
                                                >
                                                    {/* Timeline line */}

                                                    {index <
                                                        upcoming_events.length -
                                                            1 && (
                                                        <div
                                                            className="
                                                                absolute
                                                                bottom-[-12px]
                                                                left-[23px]
                                                                top-[55px]
                                                                w-px
                                                                bg-border
                                                            "
                                                        />
                                                    )}

                                                    <div className="relative flex gap-3">
                                                        {/* Date marker */}

                                                        <div
                                                            className="
                                                                flex
                                                                h-9
                                                                w-9
                                                                shrink-0
                                                                items-center
                                                                justify-center
                                                                rounded-lg
                                                                border
                                                                border-primary/20
                                                                bg-primary/5
                                                                text-primary
                                                            "
                                                        >
                                                            <CalendarDays className="h-4 w-4" />
                                                        </div>

                                                        {/* Details */}

                                                        <div className="min-w-0 flex-1">
                                                            <div
                                                                className="
                                                                    flex
                                                                    items-start
                                                                    justify-between
                                                                    gap-2
                                                                "
                                                            >
                                                                <p
                                                                    className="
                                                                        truncate
                                                                        text-sm
                                                                        font-semibold
                                                                        text-foreground
                                                                    "
                                                                >
                                                                    {
                                                                        event.name
                                                                    }
                                                                </p>

                                                                <Badge
                                                                    variant="outline"
                                                                    className="
                                                                        shrink-0
                                                                        border-border
                                                                        bg-muted/30
                                                                        text-[10px]
                                                                        text-muted-foreground
                                                                    "
                                                                >
                                                                    {
                                                                        event.type
                                                                    }
                                                                </Badge>
                                                            </div>

                                                            <p className="mt-2 text-xs font-medium text-foreground">
                                                                {
                                                                    event.date
                                                                }
                                                            </p>

                                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                                {
                                                                    event.days
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}

                                {/* Create asset */}

                                <div className="mt-5 border-t border-border pt-5">
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="
                                            w-full
                                            gap-2
                                            shadow-none
                                            transition-all
                                            duration-200
                                            hover:-translate-y-0.5
                                            hover:shadow-sm
                                        "
                                    >
                                        <Link href="/generator">
                                            Create campaign asset

                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
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