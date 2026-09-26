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

    // Separate actual scheduled Campaigns from contextual marketing events/holidays
    const campaignEvents = useMemo(() => {
        return events.filter((evt) => Boolean(evt.has_campaign));
    }, [events]);

    const nonCampaignEvents = useMemo(() => {
        return events.filter((evt) => !evt.has_campaign);
    }, [events]);

    // Map contextual events (no campaign) to individual calendar day cells
    const occasionsByDate = useMemo(() => {
        const map = new Map<string, NormalizedCalendarEvent[]>();
        for (const evt of nonCampaignEvents) {
            for (const day of calendarDays) {
                if (evt.startDate <= day.dateString && evt.endDate >= day.dateString) {
                    const list = map.get(day.dateString) || [];
                    list.push(evt);
                    map.set(day.dateString, list);
                }
            }
        }
        return map;
    }, [nonCampaignEvents, calendarDays]);

    // For each week, calculate campaign timeline segments and allocate non-colliding layer tracks
    const weekData = useMemo(() => {
        return weeks.map((weekDays) => {
            const weekStart = weekDays[0].dateString;
            const weekEnd = weekDays[6].dateString;

            // Only actual campaigns generate horizontal timeline segments
            const overlapping = campaignEvents.filter(
                (evt) => evt.startDate <= weekEnd && evt.endDate >= weekStart
            );

            // Sort overlapping campaigns:
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
                maxTrack,
            };
        });
    }, [weeks, campaignEvents]);

    const trackHeightPx = 20; // Height per campaign line track
    const trackGapPx = 4;     // Gap between campaign lines
    const headerHeightPx = 32; // Height for day numbers header

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
                    const timelineHeightPx = week.maxTrack > 0
                        ? (week.maxTrack * trackHeightPx + (week.maxTrack - 1) * trackGapPx)
                        : 0;
                    const minRowHeightPx = Math.max(110, headerHeightPx + timelineHeightPx + 40);

                    return (
                        <div
                            key={`week-${weekIdx}`}
                            className="relative min-w-0"
                            style={{ minHeight: `${minRowHeightPx}px` }}
                        >
                            {/* Day Cells Background & Content */}
                            <div className="grid grid-cols-7 divide-x divide-border/60" style={{ minHeight: `${minRowHeightPx}px` }}>
                                {week.weekDays.map((cell) => {
                                    const isCellPast = cell.dateString < todayDateStr;
                                    const dayOccasions = occasionsByDate.get(cell.dateString) || [];

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

                                            {/* Reserved vertical clearance for campaign timeline lines */}
                                            {timelineHeightPx > 0 && (
                                                <div
                                                    style={{ height: `${timelineHeightPx + 4}px` }}
                                                    className="shrink-0"
                                                />
                                            )}

                                            {/* Lightweight Contextual Events (No campaign - plain text only, no capsule/badge) */}
                                            {dayOccasions.length > 0 && (
                                                <div className="flex flex-col gap-1 mt-1 overflow-hidden">
                                                    {dayOccasions.map((occ) => {
                                                        const styleKey = occ.category || occ.type || 'holiday';
                                                        const style = CATEGORY_STYLES[styleKey] || CATEGORY_STYLES.holiday;
                                                        const isOccPast = occ.endDate < todayDateStr;

                                                        return (
                                                            <button
                                                                key={occ.id}
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onSelectEvent(occ);
                                                                }}
                                                                className="group/occ flex flex-col items-start text-left w-full hover:opacity-80 transition-opacity cursor-pointer focus:outline-hidden"
                                                                title={`${occ.name} (${formatDateRange(occ.startDate, occ.endDate)}) • ${style.label}${isOccPast ? ' (Past)' : ''}`}
                                                            >
                                                                <span
                                                                    className={`text-[11px] font-medium leading-tight truncate w-full ${
                                                                        !cell.isCurrentMonth
                                                                            ? 'text-muted-foreground/40'
                                                                            : isOccPast
                                                                              ? 'text-muted-foreground/60'
                                                                              : style.text
                                                                    }`}
                                                                >
                                                                    {occ.name}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Campaign Timeline Lines Layer (Clean thin horizontal rule with restrained typography) */}
                            {week.segments.length > 0 && (
                                <div
                                    className="pointer-events-none absolute inset-x-0 top-8 z-10 px-1 pb-1 grid grid-cols-7 gap-x-1"
                                    style={{
                                        gridAutoRows: `${trackHeightPx}px`,
                                        rowGap: `${trackGapPx}px`,
                                    }}
                                >
                                    {week.segments.map((seg) => {
                                        const evt = seg.event;
                                        const isPast = evt.endDate < todayDateStr;
                                        const styleKey = evt.category || evt.type || 'commercial';
                                        const style = CATEGORY_STYLES[styleKey] || CATEGORY_STYLES.commercial;
                                        const displayName = evt.campaign_name || evt.name;

                                        // Clean line accent color
                                        const lineColor = isPast
                                            ? 'bg-muted-foreground/40'
                                            : (style?.solidBg || 'bg-primary');

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
                                                className="pointer-events-auto group/line relative flex flex-col justify-center px-1 text-left cursor-pointer select-none focus:outline-hidden"
                                                title={`${displayName} (${formatDateRange(evt.startDate, evt.endDate)})${isPast ? ' (Past Campaign)' : ''}`}
                                            >
                                                {/* Thin clean horizontal line */}
                                                <div className="w-full flex items-center h-[3px]">
                                                    <div
                                                        className={`w-full h-[3px] transition-all group-hover/line:h-[4px] ${lineColor} ${
                                                            seg.isStartSegment ? 'rounded-l-full' : ''
                                                        } ${seg.isEndSegment ? 'rounded-r-full' : ''}`}
                                                    />
                                                </div>

                                                {/* Restrained campaign title text */}
                                                <span
                                                    className={`truncate text-[10px] tracking-tight mt-0.5 leading-none transition-colors ${
                                                        isPast
                                                            ? 'text-muted-foreground/60 line-through'
                                                            : 'text-foreground/80 group-hover/line:text-primary font-semibold'
                                                    }`}
                                                >
                                                    {displayName}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
