import { CalendarDays, Clock } from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    CATEGORY_STYLES,
    formatDateRange,
    NormalizedCalendarEvent,
} from '../calendar-types';

interface CalendarAgendaViewProps {
    events: NormalizedCalendarEvent[];
    currentMonth: number;
    currentYear: number;
    monthNames: string[];
    todayDateStr: string;
    onSelectEvent: (event: NormalizedCalendarEvent) => void;
}

export function CalendarAgendaView({
    events,
    currentMonth,
    currentYear,
    monthNames,
    todayDateStr,
    onSelectEvent,
}: CalendarAgendaViewProps) {
    // Events overlapping current month
    const monthStartStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const monthEndStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

    const monthEvents = events.filter((evt) => {
        return evt.startDate <= monthEndStr && evt.endDate >= monthStartStr;
    });

    return (
        <Card className="space-y-4 rounded-3xl border-border bg-card p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-bold text-foreground">
                    Schedule for {monthNames[currentMonth]} {currentYear}
                </h3>
                <span className="text-xs text-muted-foreground font-mono">
                    {monthEvents.length} Events
                </span>
            </div>

            {monthEvents.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                    No events scheduled for {monthNames[currentMonth]} {currentYear}.
                </div>
            ) : (
                <div className="space-y-2.5">
                    {monthEvents.map((evt) => {
                        const isPast = evt.endDate < todayDateStr;
                        const styleKey = evt.category || evt.type || 'holiday';
                        const baseStyle = CATEGORY_STYLES[styleKey] || CATEGORY_STYLES.holiday;

                        return (
                            <div
                                key={evt.id}
                                onClick={() => onSelectEvent(evt)}
                                className={`group flex flex-col gap-2 rounded-2xl border p-3.5 transition-all cursor-pointer sm:flex-row sm:items-center sm:justify-between ${
                                    isPast
                                        ? 'border-border/60 bg-muted/20 opacity-80 hover:opacity-100 hover:bg-muted/40'
                                        : `${baseStyle.bg} ${baseStyle.border} hover:brightness-105 shadow-2xs`
                                }`}
                            >
                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] font-medium ${
                                                isPast
                                                    ? 'border-border bg-muted/50 text-muted-foreground'
                                                    : `${baseStyle.bg} ${baseStyle.text} ${baseStyle.border}`
                                            }`}
                                        >
                                            <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${baseStyle.dot}`} />
                                            {baseStyle.label}
                                        </Badge>

                                        {evt.isMultiDay && (
                                            <Badge
                                                variant="secondary"
                                                className="border border-primary/20 bg-primary/10 text-[10px] font-semibold text-primary"
                                            >
                                                <Clock className="mr-1 h-3 w-3" />
                                                {evt.dayCount}-Day Range
                                            </Badge>
                                        )}

                                        {evt.is_long_weekend && (
                                            <Badge variant="secondary" className="text-[10px]">
                                                Long Weekend
                                            </Badge>
                                        )}

                                        {isPast && (
                                            <Badge
                                                variant="secondary"
                                                className="bg-muted font-mono text-[10px] text-muted-foreground"
                                            >
                                                Past Event
                                            </Badge>
                                        )}
                                    </div>

                                    <h4
                                        className={`text-sm font-bold ${
                                            isPast
                                                ? 'text-muted-foreground line-through decoration-muted-foreground/40'
                                                : 'text-foreground'
                                        }`}
                                    >
                                        {evt.name}
                                    </h4>

                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <CalendarDays className="h-3.5 w-3.5" />
                                        <span>{formatDateRange(evt.startDate, evt.endDate)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-start sm:self-center">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectEvent(evt);
                                        }}
                                        className="h-8 text-xs font-semibold shadow-none"
                                    >
                                        View Details
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
}
