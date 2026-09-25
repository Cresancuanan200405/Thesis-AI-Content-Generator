import {
    ChevronLeft,
    ChevronRight,
    Clock,
} from 'lucide-react';
import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import {
    CATEGORY_STYLES,
    diffInDays,
    formatDateRange,
    NormalizedCalendarEvent,
} from '../calendar-types';

interface CalendarDay {
    dayNumber: number;
    dateString: string;
    isCurrentMonth: boolean;
    isToday: boolean;
}

interface CalendarMonthGridProps {
    calendarDays: CalendarDay[];
    events: NormalizedCalendarEvent[];
    todayDateStr: string;
    weekdayNames: string[];
    onSelectEvent: (event: NormalizedCalendarEvent) => void;
}

interface WeekEventSegment {
    event: NormalizedCalendarEvent;
    startCol: number; // 0 to 6
    endCol: number;   // 0 to 6
    isStartSegment: boolean;
    isEndSegment: boolean;
    track: number;
}

export function CalendarMonthGrid({
    calendarDays,
    events,
    todayDateStr,
    weekdayNames,
    onSelectEvent,
}: CalendarMonthGridProps) {
    // Break 42 days into 6 weeks of 7 days
    const weeks = useMemo(() => {
        const result = [];
        for (let w = 0; w < 6; w++) {
            result.push(calendarDays.slice(w * 7, w * 7 + 7));
        }
        return result;
    }, [calendarDays]);

    // For each week, calculate event segments and allocate non-colliding layer tracks
    const weekData = useMemo(() => {
        return weeks.map((weekDays) => {
            const weekStart = weekDays[0].dateString;
            const weekEnd = weekDays[6].dateString;

            // Find all events overlapping this week
            const overlapping = events.filter(
                (evt) => evt.startDate <= weekEnd && evt.endDate >= weekStart
            );

            // Sort overlapping events:
            // 1. Multi-day first (longer spans prioritized)
            // 2. Earlier startDate first
            // 3. String comparison on name/id for stability
            overlapping.sort((a, b) => {
                const aSpan = diffInDays(
                    a.startDate < weekStart ? weekStart : a.startDate,
                    a.endDate > weekEnd ? weekEnd : a.endDate
                );
                const bSpan = diffInDays(
                    b.startDate < weekStart ? weekStart : b.startDate,
                    b.endDate > weekEnd ? weekEnd : b.endDate
                );

                if (bSpan !== aSpan) {
                    return bSpan - aSpan; // longer first
                }

                if (a.startDate !== b.startDate) {
                    return a.startDate.localeCompare(b.startDate);
                }

                return String(a.id).localeCompare(String(b.id));
            });

            // Allocate tracks
            const tracks: boolean[][] = [];
            const segments: WeekEventSegment[] = [];

            overlapping.forEach((evt) => {
                const startCol = Math.max(0, Math.min(6, diffInDays(weekStart, evt.startDate)));
                const endCol = Math.max(0, Math.min(6, diffInDays(weekStart, evt.endDate)));
                const isStartSegment = evt.startDate >= weekStart;
                const isEndSegment = evt.endDate <= weekEnd;

                // Find first track without conflict
                let chosenTrack = 0;
                while (true) {
                    if (!tracks[chosenTrack]) {
                        tracks[chosenTrack] = [false, false, false, false, false, false, false];
                    }

                    let hasConflict = false;
                    for (let c = startCol; c <= endCol; c++) {
                        if (tracks[chosenTrack][c]) {
                            hasConflict = true;
                            break;
                        }
                    }

                    if (!hasConflict) {
                        for (let c = startCol; c <= endCol; c++) {
                            tracks[chosenTrack][c] = true;
                        }
                        break;
                    }

                    chosenTrack++;
                }

                segments.push({
                    event: evt,
                    startCol,
                    endCol,
                    isStartSegment,
                    isEndSegment,
                    track: chosenTrack,
                });
            });

            const maxTrack = tracks.length;

            return {
                weekDays,
                segments,
                maxTrack: Math.max(1, maxTrack),
            };
        });
    }, [weeks, events]);

    return (
        <Card className="overflow-hidden rounded-3xl border-border bg-card shadow-xs">
            {/* Weekday Header */}
            <div className="grid grid-cols-7 border-b border-border bg-muted/20 text-center text-xs font-semibold text-muted-foreground">
                {weekdayNames.map((wName) => (
                    <div key={wName} className="py-2.5">
                        {wName}
                    </div>
                ))}
            </div>

            {/* 6 Week Rows */}
            <div className="divide-y divide-border/60">
                {weekData.map((week, weekIdx) => {
                    const trackHeightPx = 26; // Height per track row
                    const headerHeightPx = 32; // Height for day numbers
                    const minRowHeightPx = Math.max(110, headerHeightPx + week.maxTrack * trackHeightPx + 16);

                    return (
                        <div
                            key={`week-${weekIdx}`}
                            className="relative min-w-0"
                            style={{ minHeight: `${minRowHeightPx}px` }}
                        >
                            {/* Day Cells Background & Number Headers */}
                            <div className="grid grid-cols-7 divide-x divide-border/60" style={{ minHeight: `${minRowHeightPx}px` }}>
                                {week.weekDays.map((cell) => {
                                    const isCellPast = cell.dateString < todayDateStr;

                                    return (
                                        <div
                                            key={cell.dateString}
                                            className={`group relative flex flex-col justify-start p-2 transition-colors ${
                                                !cell.isCurrentMonth
                                                    ? 'bg-muted/10 text-muted-foreground/30'
                                                    : isCellPast
                                                      ? 'bg-muted/5 text-foreground'
                                                      : 'bg-card text-foreground'
                                            }`}
                                        >
                                            {/* Day Number Header */}
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                                                        cell.isToday
                                                            ? 'bg-primary font-bold text-primary-foreground shadow-xs'
                                                            : cell.isCurrentMonth
                                                              ? isCellPast
                                                                  ? 'text-muted-foreground'
                                                                  : 'text-foreground'
                                                              : 'text-muted-foreground/40'
                                                    }`}
                                                >
                                                    {cell.dayNumber}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Event Range Bars Layer (Positioned with z-10 on top of day cells) */}
                            <div
                                className="pointer-events-none absolute inset-x-0 top-8 z-10 px-1 pb-1 grid grid-cols-7 gap-x-1"
                                style={{
                                    gridAutoRows: `${trackHeightPx}px`,
                                    rowGap: '3px',
                                }}
                            >
                                {week.segments.map((seg) => {
                                    const evt = seg.event;
                                    const isPast = evt.endDate < todayDateStr;
                                    const styleKey = evt.category || evt.type || 'holiday';
                                    const style = CATEGORY_STYLES[styleKey] || CATEGORY_STYLES.holiday;

                                    // Multi-day continuation styling
                                    let borderRounding = 'rounded-md';
                                    let continuationIndicator = null;

                                    if (evt.isMultiDay) {
                                        if (seg.isStartSegment && seg.isEndSegment) {
                                            borderRounding = 'rounded-md shadow-xs';
                                        } else if (seg.isStartSegment && !seg.isEndSegment) {
                                            borderRounding = 'rounded-l-md rounded-r-none border-r-0 shadow-xs';
                                            continuationIndicator = (
                                                <span className="ml-auto flex items-center text-[10px] font-bold text-white/95 shrink-0 pl-1">
                                                    cont. <ChevronRight className="h-3 w-3" />
                                                </span>
                                            );
                                        } else if (!seg.isStartSegment && seg.isEndSegment) {
                                            borderRounding = 'rounded-r-md rounded-l-none border-l-0 shadow-xs';
                                            continuationIndicator = (
                                                <span className="mr-1 flex items-center text-[10px] font-bold text-white/95 shrink-0 pr-1">
                                                    <ChevronLeft className="h-3 w-3" />
                                                </span>
                                            );
                                        } else {
                                            // Spans completely across this week
                                            borderRounding = 'rounded-none border-x-0 shadow-xs';
                                            continuationIndicator = (
                                                <span className="mx-auto flex items-center text-[10px] font-bold text-white/95 shrink-0 px-1">
                                                    <ChevronLeft className="h-3 w-3" /> cont. <ChevronRight className="h-3 w-3" />
                                                </span>
                                            );
                                        }
                                    }

                                    // Full-color solid styling: completely opaque and vibrant
                                    const visualClasses = isPast
                                        ? 'border-zinc-300 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 opacity-90 hover:opacity-100'
                                        : evt.isMultiDay
                                            ? `${style.solidBg} ${style.solidText} ${style.solidBorder} font-semibold shadow-xs hover:brightness-110 active:scale-[0.99]`
                                            : `${style.solidBg} ${style.solidText} ${style.solidBorder} font-medium shadow-2xs hover:brightness-110 active:scale-[0.99]`;

                                    return (
                                        <button
                                            key={`${evt.id}-${weekIdx}-${seg.track}`}
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectEvent(evt);
                                            }}
                                            style={{
                                                gridColumnStart: seg.startCol + 1,
                                                gridColumnEnd: seg.endCol + 2,
                                                gridRowStart: seg.track + 1,
                                            }}
                                            className={`pointer-events-auto group relative flex items-center h-6 text-left text-[11px] font-medium border px-1.5 transition-all cursor-pointer shadow-2xs overflow-hidden select-none ${borderRounding} ${visualClasses}`}
                                            title={`${evt.has_campaign && evt.campaign_name ? `${evt.campaign_name} (Campaign)` : evt.name} (${formatDateRange(evt.startDate, evt.endDate)}) • ${style.label}${isPast ? ' (Past)' : ''}`}
                                        >
                                            {/* Continuation prefix arrow if continued from prior week */}
                                            {!seg.isStartSegment && evt.isMultiDay && continuationIndicator}

                                            {/* Category dot if start segment or single-day */}
                                            {seg.isStartSegment && (
                                                <span
                                                    className={`mr-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                                                        isPast
                                                            ? 'bg-slate-400 dark:bg-slate-500'
                                                            : 'bg-white shadow-2xs'
                                                    }`}
                                                />
                                            )}

                                            {/* Event Name or Campaign Name */}
                                            <span className={`truncate ${isPast ? 'line-through decoration-muted-foreground/40' : ''}`}>
                                                {evt.has_campaign && evt.campaign_name ? evt.campaign_name : evt.name}
                                            </span>

                                            {/* Active Campaign Badge */}
                                            {evt.has_campaign && (
                                                <span className="ml-1.5 hidden shrink-0 items-center rounded bg-black/20 dark:bg-white/20 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white sm:inline-flex">
                                                    Campaign
                                                </span>
                                            )}

                                            {/* If multi-day and wide enough, show date badge */}
                                            {evt.isMultiDay && seg.isStartSegment && (seg.endCol - seg.startCol >= 1) && (
                                                <span className="ml-1.5 hidden items-center gap-1 rounded px-1 text-[9px] font-mono opacity-90 md:inline-flex bg-black/25 dark:bg-black/35 text-white">
                                                    <Clock className="h-2.5 w-2.5" />
                                                    {evt.dayCount}d
                                                </span>
                                            )}

                                            {/* Continuation suffix arrow if continuing into next week */}
                                            {seg.isStartSegment && !seg.isEndSegment && evt.isMultiDay && continuationIndicator}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
