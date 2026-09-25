import { Clock } from 'lucide-react';
import React from 'react';
import { Card } from '@/components/ui/card';
import {
    CATEGORY_STYLES,
    formatDateRange,
    NormalizedCalendarEvent,
} from '../calendar-types';

interface CalendarYearViewProps {
    events: NormalizedCalendarEvent[];
    currentYear: number;
    monthNames: string[];
    todayDateStr: string;
    onSelectMonth: (monthIndex: number) => void;
    onSelectEvent: (event: NormalizedCalendarEvent) => void;
}

export function CalendarYearView({
    events,
    currentYear,
    monthNames,
    todayDateStr,
    onSelectMonth,
    onSelectEvent,
}: CalendarYearViewProps) {
    const yearStartStr = `${currentYear}-01-01`;
    const yearEndStr = `${currentYear}-12-31`;

    const yearEvents = events.filter(
        (evt) => evt.startDate <= yearEndStr && evt.endDate >= yearStartStr
    );

    const regularCount = yearEvents.filter(
        (evt) => evt.category === 'regular' || evt.type === 'holiday'
    ).length;

    const specialCount = yearEvents.filter(
        (evt) => evt.category === 'special_non_working'
    ).length;

    const longWeekendCount = yearEvents.filter((evt) => evt.is_long_weekend).length;

    return (
        <div className="space-y-6">
            {/* Year Summary Metric Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                    {
                        label: `Total in ${currentYear}`,
                        count: yearEvents.length,
                        bg: 'bg-primary/10',
                        text: 'text-primary',
                        border: 'border-primary/20',
                    },
                    {
                        label: 'Regular Holidays',
                        count: regularCount,
                        bg: 'bg-rose-500/10',
                        text: 'text-rose-600 dark:text-rose-400',
                        border: 'border-rose-500/20',
                    },
                    {
                        label: 'Special Non-Working',
                        count: specialCount,
                        bg: 'bg-amber-500/10',
                        text: 'text-amber-600 dark:text-amber-400',
                        border: 'border-amber-500/20',
                    },
                    {
                        label: 'Long Weekends',
                        count: longWeekendCount,
                        bg: 'bg-emerald-500/10',
                        text: 'text-emerald-600 dark:text-emerald-400',
                        border: 'border-emerald-500/20',
                    },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className={`rounded-2xl border ${stat.border} ${stat.bg} space-y-1 p-4 shadow-2xs`}
                    >
                        <div className={`text-2xl font-extrabold ${stat.text}`}>
                            {stat.count}
                        </div>
                        <div className="text-[11px] font-semibold text-muted-foreground">
                            {stat.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* 12 Months Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {monthNames.map((mName, mIdx) => {
                    const monthStartStr = `${currentYear}-${String(mIdx + 1).padStart(2, '0')}-01`;
                    const lastDayOfMonth = new Date(currentYear, mIdx + 1, 0).getDate();
                    const monthEndStr = `${currentYear}-${String(mIdx + 1).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

                    const monthEvts = yearEvents.filter(
                        (evt) => evt.startDate <= monthEndStr && evt.endDate >= monthStartStr
                    );

                    return (
                        <Card
                            key={mName}
                            className="flex flex-col justify-between overflow-hidden rounded-3xl border-border bg-card shadow-xs"
                        >
                            <div className="space-y-3 p-4">
                                {/* Month Header */}
                                <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-bold text-foreground">
                                            {mName}
                                        </h4>
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground font-mono">
                                            {monthEvts.length}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => onSelectMonth(mIdx)}
                                        className="text-xs font-semibold text-primary hover:underline"
                                    >
                                        View Month →
                                    </button>
                                </div>

                                {/* Event previews */}
                                {monthEvts.length === 0 ? (
                                    <div className="py-6 text-center text-xs text-muted-foreground italic">
                                        No scheduled events
                                    </div>
                                ) : (
                                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                                        {monthEvts.slice(0, 5).map((evt) => {
                                            const isPast = evt.endDate < todayDateStr;
                                            const styleKey = evt.category || evt.type || 'holiday';
                                            const style = CATEGORY_STYLES[styleKey] || CATEGORY_STYLES.holiday;

                                            return (
                                                <button
                                                    key={evt.id}
                                                    type="button"
                                                    onClick={() => onSelectEvent(evt)}
                                                    className={`flex w-full items-center justify-between gap-2 rounded-xl border p-2 text-left text-xs transition-all hover:brightness-105 ${
                                                        isPast
                                                            ? 'border-border/60 bg-muted/20 text-muted-foreground opacity-80'
                                                            : `${style.bg} ${style.border} ${style.text}`
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
                                                        <span className="truncate font-medium">{evt.name}</span>
                                                    </div>

                                                    <div className="flex items-center gap-1 shrink-0 text-[10px] opacity-80 font-mono">
                                                        {evt.isMultiDay ? (
                                                            <span className="flex items-center gap-0.5">
                                                                <Clock className="h-2.5 w-2.5" />
                                                                {evt.dayCount}d
                                                            </span>
                                                        ) : (
                                                            <span>{evt.startDate.slice(8)}</span>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}

                                        {monthEvts.length > 5 && (
                                            <div className="pt-1 text-center text-[11px] font-medium text-muted-foreground">
                                                +{monthEvts.length - 5} more events
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
