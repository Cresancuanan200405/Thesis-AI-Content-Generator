import { Head } from '@inertiajs/react';
import {
    Calendar as CalendarIcon,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Filter,
    LayoutGrid,
    List,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    normalizeCalendarEvent,
    NormalizedCalendarEvent,
    RawCalendarEvent,
} from './calendar-types';
import { CalendarAgendaView } from './components/CalendarAgendaView';
import { CalendarMonthGrid } from './components/CalendarMonthGrid';
import { CalendarYearView } from './components/CalendarYearView';
import { EventDetailModal } from './components/EventDetailModal';
import { UpcomingSidebar } from './components/UpcomingSidebar';

const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

const availableYears = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

interface MarketingCalendarPageProps {
    events?: RawCalendarEvent[];
    upcoming_events?: any[];
    filter?: string;
}

export default function MarketingCalendarPage({
    events = [],
    upcoming_events = [],
    filter = 'all',
}: MarketingCalendarPageProps) {
    const today = new Date();
    const todayDateStr = useMemo(() => {
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }, []);

    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [activeFilter, setActiveFilter] = useState<string>(filter || 'all');
    const [viewMode, setViewMode] = useState<'grid' | 'agenda' | 'year'>('grid');

    const [isUpcomingCollapsed, setIsUpcomingCollapsed] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('calendar_upcoming_collapsed');
            if (saved !== null) {
                return saved === 'true';
            }
        }
        return false;
    });

    const handleSetUpcomingCollapsed = (collapsed: boolean) => {
        setIsUpcomingCollapsed(collapsed);
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('calendar_upcoming_collapsed', String(collapsed));
            } catch {
                // Ignore storage error
            }
        }
    };

    // Dialog State (Read-only inspection)
    const [selectedEvent, setSelectedEvent] = useState<NormalizedCalendarEvent | null>(null);

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Direct Month & Year Navigation Handlers
    const handleMonthChange = (monthIdxStr: string) => {
        const mIdx = parseInt(monthIdxStr, 10);
        setCurrentDate(new Date(currentYear, mIdx, 1));
    };

    const handleYearChange = (yearStr: string) => {
        const yr = parseInt(yearStr, 10);
        setCurrentDate(new Date(yr, currentMonth, 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    };

    const jumpToToday = () => {
        setCurrentDate(new Date());
    };

    // Normalize all incoming events
    const normalizedEvents: NormalizedCalendarEvent[] = useMemo(() => {
        if (!Array.isArray(events)) {
            return [];
        }
        return events.map((raw) => normalizeCalendarEvent(raw));
    }, [events]);

    // Filter events according to active filter
    const filteredEvents: NormalizedCalendarEvent[] = useMemo(() => {
        return normalizedEvents.filter((evt) => {
            if (activeFilter === 'all') {
                return true;
            }

            if (activeFilter === 'regular') {
                return evt.category === 'regular' || evt.type === 'holiday';
            }

            if (activeFilter === 'special_non_working') {
                return evt.category === 'special_non_working';
            }

            if (activeFilter === 'islamic') {
                return evt.category === 'islamic';
            }

            if (activeFilter === 'commercial') {
                return evt.type === 'commercial' || evt.category === 'commercial';
            }

            if (activeFilter === 'custom') {
                return evt.type === 'custom' || evt.category === 'custom';
            }

            if (activeFilter === 'missed') {
                const isPast = evt.endDate < todayDateStr;
                return isPast && !evt.has_design && !evt.has_campaign;
            }

            return true;
        });
    }, [normalizedEvents, activeFilter, todayDateStr]);

    // Calendar Grid Days Calculation (42 cells: 7 columns x 6 rows)
    const calendarDays = useMemo(() => {
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

        let firstDayIndex = firstDayOfMonth.getDay() - 1;
        if (firstDayIndex === -1) {
            firstDayIndex = 6;
        }

        const totalDays = lastDayOfMonth.getDate();
        const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();

        const days = [];

        // Previous month padding
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            const dayNum = prevMonthLastDay - i;
            const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            const prevMonthNum = currentMonth === 0 ? 12 : currentMonth;
            const dateStr = `${prevYear}-${String(prevMonthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            days.push({
                dayNumber: dayNum,
                dateString: dateStr,
                isCurrentMonth: false,
                isToday: false,
            });
        }

        // Current month days
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        for (let i = 1; i <= totalDays; i++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            days.push({
                dayNumber: i,
                dateString: dateStr,
                isCurrentMonth: true,
                isToday: dateStr === todayStr,
            });
        }

        // Next month padding to complete 42 cells grid
        const remainingCells = 42 - days.length;
        for (let i = 1; i <= remainingCells; i++) {
            const nextMonthNum = currentMonth === 11 ? 1 : currentMonth + 2;
            const nextYearNum = currentMonth === 11 ? currentYear + 1 : currentYear;
            const dateStr = `${nextYearNum}-${String(nextMonthNum).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            days.push({
                dayNumber: i,
                dateString: dateStr,
                isCurrentMonth: false,
                isToday: false,
            });
        }

        return days;
    }, [currentYear, currentMonth]);

    return (
        <>
            <Head title="Marketing Calendar" />

            <div className="relative flex min-h-screen bg-background text-foreground">
                {/* MAIN CALENDAR WORKSPACE */}
                <div className="min-w-0 flex-1 space-y-6 p-4 pb-20 md:p-6 lg:p-8">
                    {/* =====================================================
                        PAGE HEADER: STATIC SCHEDULE VIEWER
                    ====================================================== */}
                    <div className="flex flex-col gap-3 border-b border-border/60 pb-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <CalendarIcon className="h-4 w-4" />
                            </div>
                            <div>
                                <h1 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                                    Marketing Calendar
                                </h1>
                                <p className="text-xs text-muted-foreground">
                                    Static read-only schedule viewer and multi-day marketing campaign planner.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* =====================================================
                        STICKY NAVIGATION & FILTER TOOLBAR (MATCHING SYSTEM TOOLBAR)
                    ====================================================== */}
                    <div className="sticky top-11 z-30 mb-5 rounded-2xl border border-white/25 bg-card/95 px-2.5 py-1.5 shadow-md backdrop-blur-xl transition-all sm:top-12 sm:px-3 sm:py-1.5 dark:border-white/10 dark:bg-card/95">
                        <div className="flex items-center justify-between gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2.5">
                            {/* Navigation controls & Filters (Static left-anchored group) */}
                            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                                {/* Prev / Next Buttons */}
                                <div className="flex shrink-0 items-center rounded-lg border border-border bg-background p-0.5 shadow-2xs">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={prevMonth}
                                        className="h-7 w-7 rounded-md text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                                        aria-label="Previous Month"
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={nextMonth}
                                        className="h-7 w-7 rounded-md text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                                        aria-label="Next Month"
                                    >
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </Button>
                                </div>

                                {/* Month Selector */}
                                <Select
                                    value={String(currentMonth)}
                                    onValueChange={handleMonthChange}
                                >
                                    <SelectTrigger className="h-7 w-[108px] shrink-0 rounded-lg border-border bg-background px-2.5 text-xs font-semibold shadow-2xs">
                                        <SelectValue>
                                            {monthNames[currentMonth]}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {monthNames.map((mName, idx) => (
                                            <SelectItem
                                                key={mName}
                                                value={String(idx)}
                                                className="text-xs"
                                            >
                                                {mName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Year Selector */}
                                <Select
                                    value={String(currentYear)}
                                    onValueChange={handleYearChange}
                                >
                                    <SelectTrigger className="h-7 w-[72px] shrink-0 rounded-lg border-border bg-background px-2 text-xs font-semibold shadow-2xs">
                                        <SelectValue>{currentYear}</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableYears.map((yr) => (
                                            <SelectItem
                                                key={yr}
                                                value={String(yr)}
                                                className="text-xs"
                                            >
                                                {yr}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={jumpToToday}
                                    className="h-7 shrink-0 rounded-lg border-border bg-background px-2.5 text-xs font-semibold text-foreground shadow-2xs hover:bg-muted/40"
                                >
                                    Today
                                </Button>

                                {/* Vertical Divider */}
                                <div className="mx-0.5 h-4 w-px shrink-0 bg-border/80" />

                                {/* Category Filter Selector */}
                                <div className="w-36 shrink-0 sm:w-40">
                                    <Select
                                        value={activeFilter}
                                        onValueChange={setActiveFilter}
                                    >
                                        <SelectTrigger
                                            className={`h-7 w-full min-w-0 gap-1.5 rounded-lg text-xs shadow-2xs ${
                                                activeFilter !== 'all'
                                                    ? 'border-primary/50 bg-primary/10 font-semibold text-primary'
                                                    : 'border-border bg-background'
                                            }`}
                                        >
                                            <Filter className="h-3 w-3 shrink-0 text-muted-foreground" />
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all" className="text-xs">All Events</SelectItem>
                                            <SelectItem value="regular" className="text-xs">Regular Holidays</SelectItem>
                                            <SelectItem value="special_non_working" className="text-xs">Special Non-Working</SelectItem>
                                            <SelectItem value="islamic" className="text-xs">Islamic Holidays</SelectItem>
                                            <SelectItem value="commercial" className="text-xs">Retail Sales</SelectItem>
                                            <SelectItem value="custom" className="text-xs">Custom Events</SelectItem>
                                            <SelectItem value="missed" className="text-xs">Missed Promos</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Clear All (Fixed slot so toolbar never shifts when toggling filters) */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setActiveFilter('all')}
                                    disabled={activeFilter === 'all'}
                                    className={`h-7 shrink-0 rounded-lg px-2 text-xs transition-opacity ${
                                        activeFilter !== 'all'
                                            ? 'cursor-pointer text-muted-foreground opacity-100 hover:bg-destructive/10 hover:text-destructive'
                                            : 'pointer-events-none opacity-0'
                                    }`}
                                >
                                    Clear
                                </Button>

                                {/* Event Count */}
                                <span className="hidden items-center justify-center rounded-md bg-muted/60 px-2 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground sm:inline-flex">
                                    {filteredEvents.length}{' '}
                                    {filteredEvents.length === 1 ? 'event' : 'events'}
                                </span>
                            </div>

                            {/* View Mode Switcher (Clear Button with Label & Icon) */}
                            <div className="flex shrink-0 items-center pl-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-7 shrink-0 gap-1.5 rounded-lg border-border bg-background px-2.5 text-xs font-semibold text-foreground shadow-2xs hover:bg-muted/40"
                                            aria-label="Toggle View Mode"
                                        >
                                            {viewMode === 'grid' && (
                                                <LayoutGrid className="h-3 w-3 text-primary" />
                                            )}
                                            {viewMode === 'agenda' && (
                                                <List className="h-3 w-3 text-primary" />
                                            )}
                                            {viewMode === 'year' && (
                                                <CalendarIcon className="h-3 w-3 text-primary" />
                                            )}
                                            <span>
                                                {viewMode === 'grid'
                                                    ? 'Month'
                                                    : viewMode === 'agenda'
                                                      ? 'Agenda'
                                                      : 'Year'}
                                            </span>
                                            <ChevronDown className="h-3 w-3 opacity-60" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="w-36 rounded-xl p-1 shadow-md"
                                    >
                                        <DropdownMenuItem
                                            onClick={() => setViewMode('grid')}
                                            className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                                                viewMode === 'grid'
                                                    ? 'bg-primary/10 font-semibold text-primary'
                                                    : 'text-foreground hover:bg-muted'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <LayoutGrid className="h-3.5 w-3.5" />
                                                <span>Month</span>
                                            </div>
                                            {viewMode === 'grid' && (
                                                <Check className="h-3.5 w-3.5 text-primary" />
                                            )}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => setViewMode('agenda')}
                                            className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                                                viewMode === 'agenda'
                                                    ? 'bg-primary/10 font-semibold text-primary'
                                                    : 'text-foreground hover:bg-muted'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <List className="h-3.5 w-3.5" />
                                                <span>Agenda</span>
                                            </div>
                                            {viewMode === 'agenda' && (
                                                <Check className="h-3.5 w-3.5 text-primary" />
                                            )}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => setViewMode('year')}
                                            className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                                                viewMode === 'year'
                                                    ? 'bg-primary/10 font-semibold text-primary'
                                                    : 'text-foreground hover:bg-muted'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <CalendarIcon className="h-3.5 w-3.5" />
                                                <span>Year</span>
                                            </div>
                                            {viewMode === 'year' && (
                                                <Check className="h-3.5 w-3.5 text-primary" />
                                            )}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>


                    {/* =====================================================
                        MAIN CALENDAR CANVAS
                    ====================================================== */}
                    <div className="space-y-4">
                        {viewMode === 'grid' ? (
                            <CalendarMonthGrid
                                calendarDays={calendarDays}
                                events={filteredEvents}
                                todayDateStr={todayDateStr}
                                weekdayNames={weekdayNames}
                                onSelectEvent={(evt) => setSelectedEvent(evt)}
                            />
                        ) : viewMode === 'agenda' ? (
                            <CalendarAgendaView
                                events={filteredEvents}
                                currentMonth={currentMonth}
                                currentYear={currentYear}
                                monthNames={monthNames}
                                todayDateStr={todayDateStr}
                                onSelectEvent={(evt) => setSelectedEvent(evt)}
                            />
                        ) : (
                            <CalendarYearView
                                events={filteredEvents}
                                currentYear={currentYear}
                                monthNames={monthNames}
                                todayDateStr={todayDateStr}
                                onSelectMonth={(mIdx) => {
                                    setCurrentDate(new Date(currentYear, mIdx, 1));
                                    setViewMode('grid');
                                }}
                                onSelectEvent={(evt) => setSelectedEvent(evt)}
                            />
                        )}

                        {/* Semantic Color Legend & Multi-Day Range Indicator Guide */}
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/60 p-3 text-xs text-muted-foreground shadow-2xs backdrop-blur-md">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="font-semibold text-foreground">Legend:</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-[2px] bg-rose-500" />
                                    <span>Regular Holiday</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-[2px] bg-amber-500" />
                                    <span>Special Non-Working</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-[2px] bg-emerald-500" />
                                    <span>Islamic Holiday</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-[2px] bg-blue-500" />
                                    <span>Retail Sale</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-[2px] bg-purple-500" />
                                    <span>Custom Event</span>
                                </div>
                                <div className="flex items-center gap-1.5 border-l border-border/80 pl-3">
                                    <span className="h-2.5 w-2.5 rounded-[2px] bg-slate-400 dark:bg-slate-500" />
                                    <span className="font-medium text-muted-foreground">Past Event</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* DOCKED RIGHT SIDEBAR: UPCOMING DATES */}
                <UpcomingSidebar
                    upcomingEvents={upcoming_events}
                    allEvents={normalizedEvents}
                    isCollapsed={isUpcomingCollapsed}
                    onToggleCollapse={handleSetUpcomingCollapsed}
                    onSelectEvent={(evt) => setSelectedEvent(evt)}
                />
            </div>

            {/* Read-Only Event Detail Modal */}
            <EventDetailModal
                event={selectedEvent}
                todayDateStr={todayDateStr}
                onClose={() => setSelectedEvent(null)}
            />
        </>
    );
}

MarketingCalendarPage.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Marketing Calendar',
            href: '/calendar',
        },
    ],
};
