import {
    CalendarDays,
    Clock,
    PanelRightClose,
    PanelRightOpen,
} from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    CATEGORY_STYLES,
    formatDateRange,
    NormalizedCalendarEvent,
} from '../calendar-types';

interface UpcomingSidebarProps {
    upcomingEvents: any[];
    allEvents: NormalizedCalendarEvent[];
    isCollapsed: boolean;
    onToggleCollapse: (collapsed: boolean) => void;
    onSelectEvent: (event: NormalizedCalendarEvent) => void;
}

export function UpcomingSidebar({
    upcomingEvents = [],
    allEvents = [],
    isCollapsed,
    onToggleCollapse,
    onSelectEvent,
}: UpcomingSidebarProps) {
    if (isCollapsed) {
        return (
            <aside
                onClick={() => onToggleCollapse(false)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        onToggleCollapse(false);
                    }
                }}
                className="group sticky top-11 z-20 flex h-[calc(100vh-2.75rem)] w-11 shrink-0 cursor-pointer flex-col items-center justify-between border-l border-border/80 bg-card/60 py-4 backdrop-blur-xl transition-all duration-200 select-none hover:bg-muted/40 sm:top-12 sm:h-[calc(100vh-3rem)] lg:w-12"
                title="Open Upcoming Dates"
            >
                <div className="flex flex-col items-center gap-5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-2xs transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                        <PanelRightOpen className="h-4 w-4" />
                    </div>

                    <div className="flex flex-col items-center gap-4 py-2">
                        <span className="rotate-180 text-[10px] font-bold tracking-widest text-muted-foreground uppercase transition-colors [writing-mode:vertical-rl] group-hover:text-foreground">
                            Upcoming Dates
                        </span>
                        <span className="rotate-180 rounded border border-primary/30 bg-primary/5 px-1 py-0.5 font-mono text-[9px] font-bold text-primary [writing-mode:vertical-rl]">
                            {upcomingEvents.length}
                        </span>
                    </div>
                </div>

                <div className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors group-hover:text-foreground">
                    <Clock className="h-3.5 w-3.5" />
                </div>
            </aside>
        );
    }

    return (
        <aside className="sticky top-11 z-20 flex h-[calc(100vh-2.75rem)] w-80 shrink-0 flex-col justify-between overflow-y-auto border-l border-border/80 bg-card/75 p-5 backdrop-blur-2xl transition-all duration-300 sm:top-12 sm:h-[calc(100vh-3rem)] lg:w-[320px] dark:bg-card/85">
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <Clock className="h-4 w-4 text-primary" />
                        Upcoming Dates
                        <Badge variant="secondary" className="text-[10px] font-semibold font-mono">
                            {upcomingEvents.length}
                        </Badge>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onToggleCollapse(true)}
                        className="h-7 w-7 cursor-pointer rounded-lg text-muted-foreground hover:text-foreground"
                        title="Collapse upcoming dates"
                    >
                        <PanelRightClose className="h-4 w-4" />
                    </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                    Scheduled marketing holidays and retail events arriving soon.
                </p>

                {/* Event list */}
                <div className="space-y-2.5">
                    {upcomingEvents.length === 0 ? (
                        <div className="py-8 text-center text-xs text-muted-foreground">
                            No upcoming events on schedule.
                        </div>
                    ) : (
                        upcomingEvents.map((evt) => {
                            const fullEvent = allEvents.find((e) => String(e.id) === String(evt.id));
                            const styleKey = evt.category || evt.type || 'holiday';
                            const style = CATEGORY_STYLES[styleKey] || CATEGORY_STYLES.holiday;

                            return (
                                <div
                                    key={evt.id}
                                    onClick={() => {
                                        if (fullEvent) {
                                            onSelectEvent(fullEvent);
                                        }
                                    }}
                                    className={`group rounded-2xl border ${style.border} ${style.bg} p-3 transition-all hover:brightness-105 cursor-pointer shadow-2xs space-y-2`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="space-y-0.5 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
                                                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                    {style.label}
                                                </span>
                                            </div>
                                            <h4 className="text-xs font-bold text-foreground truncate">
                                                {evt.name}
                                            </h4>
                                        </div>

                                        {evt.days && (
                                            <Badge
                                                variant="outline"
                                                className="border-primary/30 bg-primary/10 text-[9px] font-bold text-primary shrink-0"
                                            >
                                                {evt.days}
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px] text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <CalendarDays className="h-3 w-3" />
                                            <span>
                                                {fullEvent
                                                    ? formatDateRange(fullEvent.startDate, fullEvent.endDate, { shortMonth: true })
                                                    : (evt.date || evt.raw_date)}
                                            </span>
                                        </div>

                                        <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">
                                            View Details →
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </aside>
    );
}
