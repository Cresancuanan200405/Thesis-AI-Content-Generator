import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    Edit3,
    List,
    Plus,
    Search,
    Sparkles,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type CalendarEvent = {
    id: string | number;
    name: string;
    date: string;
    description?: string | null;
    type?: string | null;
    category?: string | null;
    is_long_weekend?: boolean;
    long_weekend_details?: string | null;
    shifted_from_date?: string | null;
    proclamation_no?: string | null;
    days?: string | null;
    is_global?: boolean;
    user_id?: number | null;
};

const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const availableYears = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

// Color indicator mapping for calendar cells and badges
const categoryStyles: Record<string, { dot: string; bg: string; text: string; border: string; label: string }> = {
    regular: {
        dot: 'bg-rose-500',
        bg: 'bg-rose-500/10 dark:bg-rose-500/15',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-500/25',
        label: 'Regular Holiday',
    },
    special_non_working: {
        dot: 'bg-amber-500',
        bg: 'bg-amber-500/10 dark:bg-amber-500/15',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-500/25',
        label: 'Special Non-Working',
    },
    special_working: {
        dot: 'bg-orange-500',
        bg: 'bg-orange-500/10 dark:bg-orange-500/15',
        text: 'text-orange-700 dark:text-orange-300',
        border: 'border-orange-500/25',
        label: 'Special Working',
    },
    islamic: {
        dot: 'bg-emerald-500',
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-500/25',
        label: 'Islamic Holiday',
    },
    commercial: {
        dot: 'bg-blue-500',
        bg: 'bg-blue-500/10 dark:bg-blue-500/15',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-500/25',
        label: 'Commercial Sale',
    },
    custom: {
        dot: 'bg-purple-500',
        bg: 'bg-purple-500/10 dark:bg-purple-500/15',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-500/25',
        label: 'Custom Event',
    },
    holiday: {
        dot: 'bg-rose-500',
        bg: 'bg-rose-500/10 dark:bg-rose-500/15',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-500/25',
        label: 'Regular Holiday',
    },
};

export default function MarketingCalendarPage({
    events = [],
    upcoming_events = [],
    filter = 'all',
}: any) {
    const today = new Date();
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [activeFilter, setActiveFilter] = useState<string>(filter || 'all');
    const [viewMode, setViewMode] = useState<'grid' | 'agenda'>('grid');

    // Dialog States
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        date: '',
        type: 'custom',
        description: '',
    });

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

    // Filter events
    const filteredEvents: CalendarEvent[] = useMemo(() => {
        if (!Array.isArray(events)) return [];

        return events.filter((evt: CalendarEvent) => {
            if (activeFilter === 'all') return true;
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
            return true;
        });
    }, [events, activeFilter]);

    // Calendar Grid Days Calculation
    const calendarDays = useMemo(() => {
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

        let firstDayIndex = firstDayOfMonth.getDay() - 1;
        if (firstDayIndex === -1) firstDayIndex = 6;

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

    // Map events by dateString
    const eventsByDate = useMemo(() => {
        const map: Record<string, CalendarEvent[]> = {};
        filteredEvents.forEach((evt) => {
            if (!evt.date) return;
            if (!map[evt.date]) {
                map[evt.date] = [];
            }
            map[evt.date].push(evt);
        });
        return map;
    }, [filteredEvents]);

    // Open create modal prefilled with date
    const handleCellClick = (dateStr: string) => {
        setFormData({
            name: '',
            date: dateStr,
            type: 'custom',
            description: '',
        });
        setIsCreateOpen(true);
    };

    // Open edit modal
    const handleOpenEdit = (evt: CalendarEvent) => {
        setSelectedEvent(null);
        setFormData({
            name: evt.name,
            date: evt.date,
            type: evt.type || 'custom',
            description: evt.description || '',
        });
        setSelectedEvent(evt);
        setIsEditOpen(true);
    };

    // Submit Create Event
    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.date) {
            toast.error('Please enter an event name and date.');
            return;
        }

        setIsSubmitting(true);
        router.post('/events', formData, {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateOpen(false);
                setFormData({ name: '', date: '', type: 'custom', description: '' });
                toast.success('Event added to schedule.');
            },
            onError: (errors) => {
                const msg = Object.values(errors)[0] as string;
                toast.error(msg || 'Failed to add event.');
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    // Submit Edit Event
    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEvent) return;

        setIsSubmitting(true);
        router.put(`/events/${selectedEvent.id}`, formData, {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditOpen(false);
                setSelectedEvent(null);
                toast.success('Event updated successfully.');
            },
            onError: (errors) => {
                const msg = Object.values(errors)[0] as string;
                toast.error(msg || 'Failed to update event.');
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    // Submit Delete Event
    const handleDeleteSubmit = () => {
        if (!eventToDelete) return;

        setIsSubmitting(true);
        router.delete(`/events/${eventToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEventToDelete(null);
                setSelectedEvent(null);
                toast.success('Event deleted.');
            },
            onError: () => toast.error('Failed to delete event.'),
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <>
            <Head title="Marketing Calendar" />

            <div className="min-h-screen bg-background text-foreground pb-20">
                <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">

                    {/* =====================================================
                        PAGE HEADER & ADD EVENT ACTION
                    ====================================================== */}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Marketing Calendar
                            </h1>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Plan visuals and promotional campaigns around national holidays and retail sales dates.
                            </p>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <Button
                                onClick={() => {
                                    setFormData({
                                        name: '',
                                        date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
                                        type: 'custom',
                                        description: '',
                                    });
                                    setIsCreateOpen(true);
                                }}
                                className="gap-1.5 font-semibold text-xs h-9 shadow-xs"
                            >
                                <Plus className="h-4 w-4" />
                                Add Custom Event
                            </Button>
                        </div>
                    </div>

                    {/* =====================================================
                        INTERACTIVE NAVIGATION TOOLBAR: CLICKABLE MONTH & YEAR
                    ====================================================== */}

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-card border border-border rounded-2xl p-4 shadow-xs">
                        {/* Month & Year Selectors with Next/Prev controls */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Prev / Next Buttons */}
                            <div className="flex items-center rounded-xl border border-border bg-background p-0.5">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={prevMonth}
                                    className="h-8 w-8 rounded-lg"
                                    aria-label="Previous Month"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={nextMonth}
                                    className="h-8 w-8 rounded-lg"
                                    aria-label="Next Month"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Clickable Month Selector */}
                            <Select
                                value={String(currentMonth)}
                                onValueChange={handleMonthChange}
                            >
                                <SelectTrigger className="h-9 w-[130px] text-xs font-semibold bg-background">
                                    <SelectValue>{monthNames[currentMonth]}</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {monthNames.map((mName, idx) => (
                                        <SelectItem key={mName} value={String(idx)} className="text-xs">
                                            {mName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Clickable Year Selector */}
                            <Select
                                value={String(currentYear)}
                                onValueChange={handleYearChange}
                            >
                                <SelectTrigger className="h-9 w-[95px] text-xs font-semibold bg-background">
                                    <SelectValue>{currentYear}</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {availableYears.map((yr) => (
                                        <SelectItem key={yr} value={String(yr)} className="text-xs">
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
                                className="h-9 px-3 text-xs font-medium shadow-none"
                            >
                                Today
                            </Button>
                        </div>

                        {/* Filter Tabs & View Toggle */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            {/* Filter Segment */}
                            <div className="flex items-center rounded-xl border border-border bg-muted/30 p-1 text-xs">
                                {[
                                    { id: 'all', label: 'All' },
                                    { id: 'regular', label: 'Regular' },
                                    { id: 'special_non_working', label: 'Non-Working' },
                                    { id: 'islamic', label: 'Islamic' },
                                    { id: 'commercial', label: 'Sales & Events' },
                                    { id: 'custom', label: 'Custom' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveFilter(tab.id)}
                                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                                            activeFilter === tab.id
                                                ? 'bg-card text-foreground shadow-xs font-semibold border border-border/80'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Grid vs Agenda Toggle */}
                            <div className="flex items-center rounded-xl border border-border bg-muted/30 p-1 text-xs">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('grid')}
                                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-all ${
                                        viewMode === 'grid'
                                            ? 'bg-card text-foreground shadow-xs font-semibold'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <CalendarIcon className="h-3.5 w-3.5" />
                                    Grid
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('agenda')}
                                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-all ${
                                        viewMode === 'agenda'
                                            ? 'bg-card text-foreground shadow-xs font-semibold'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <List className="h-3.5 w-3.5" />
                                    Agenda
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* =====================================================
                        MAIN CALENDAR CANVAS & CLEAN UPCOMING SIDEBAR
                    ====================================================== */}

                    <div className="grid gap-6 lg:grid-cols-4">

                        {/* LEFT 3 COLUMNS: MONTH GRID */}
                        <div className="lg:col-span-3 space-y-4">
                            {viewMode === 'grid' ? (
                                <Card className="overflow-hidden rounded-3xl border-border bg-card shadow-xs">
                                    {/* Weekday Header */}
                                    <div className="grid grid-cols-7 border-b border-border bg-muted/20 text-center text-xs font-semibold text-muted-foreground">
                                        {weekdayNames.map((wName) => (
                                            <div key={wName} className="py-3">
                                                {wName}
                                            </div>
                                        ))}
                                    </div>

                                    {/* 7x6 Month Cells Grid */}
                                    <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-border/60">
                                        {calendarDays.map((cell, idx) => {
                                            const cellEvents = eventsByDate[cell.dateString] || [];

                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => handleCellClick(cell.dateString)}
                                                    className={`group min-h-[115px] p-2 transition-colors hover:bg-muted/30 cursor-pointer flex flex-col justify-between ${
                                                        !cell.isCurrentMonth
                                                            ? 'bg-muted/10 text-muted-foreground/30'
                                                            : 'bg-card text-foreground'
                                                    }`}
                                                >
                                                    {/* Day Number Header */}
                                                    <div className="flex items-center justify-between">
                                                        <span
                                                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                                                                cell.isToday
                                                                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                                                                    : cell.isCurrentMonth
                                                                      ? 'text-foreground'
                                                                      : 'text-muted-foreground/40'
                                                            }`}
                                                        >
                                                            {cell.dayNumber}
                                                        </span>
                                                    </div>

                                                    {/* Event Pills with Indicator Colors */}
                                                    <div className="mt-1.5 space-y-1 overflow-hidden">
                                                        {cellEvents.slice(0, 3).map((evt) => {
                                                            const styleKey = evt.category || evt.type || 'holiday';
                                                            const style = categoryStyles[styleKey] || categoryStyles.holiday;

                                                            return (
                                                                <button
                                                                    key={evt.id}
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedEvent(evt);
                                                                    }}
                                                                    className={`w-full text-left rounded-lg border px-2 py-1 text-[11px] font-medium transition-all truncate flex items-center gap-1.5 ${style.bg} ${style.text} ${style.border} hover:opacity-90 shadow-2xs`}
                                                                >
                                                                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${style.dot}`} />
                                                                    <span className="truncate">{evt.name}</span>
                                                                </button>
                                                            );
                                                        })}

                                                        {cellEvents.length > 3 && (
                                                            <div className="text-[10px] font-medium text-muted-foreground px-1">
                                                                +{cellEvents.length - 3} more
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>
                            ) : (
                                /* Agenda View */
                                <Card className="rounded-3xl border-border bg-card shadow-xs p-6 space-y-4">
                                    <div className="flex items-center justify-between border-b border-border pb-3">
                                        <h3 className="text-sm font-bold text-foreground">
                                            Schedule for {monthNames[currentMonth]} {currentYear}
                                        </h3>
                                        <span className="text-xs text-muted-foreground">
                                            {filteredEvents.filter((evt) => {
                                                const dt = new Date(evt.date);
                                                return dt.getFullYear() === currentYear && dt.getMonth() === currentMonth;
                                            }).length} Events
                                        </span>
                                    </div>

                                    {filteredEvents.filter((evt) => {
                                        const dt = new Date(evt.date);
                                        return dt.getFullYear() === currentYear && dt.getMonth() === currentMonth;
                                    }).length === 0 ? (
                                        <div className="py-12 text-center text-muted-foreground text-xs">
                                            No events scheduled for {monthNames[currentMonth]} {currentYear}.
                                        </div>
                                    ) : (
                                        <div className="space-y-2.5">
                                            {filteredEvents
                                                .filter((evt) => {
                                                    const dt = new Date(evt.date);
                                                    return dt.getFullYear() === currentYear && dt.getMonth() === currentMonth;
                                                })
                                                .map((evt) => {
                                                    const styleKey = evt.category || evt.type || 'holiday';
                                                    const style = categoryStyles[styleKey] || categoryStyles.holiday;

                                                    return (
                                                        <div
                                                            key={evt.id}
                                                            onClick={() => setSelectedEvent(evt)}
                                                            className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:bg-muted/30 cursor-pointer shadow-xs"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${style.bg} ${style.text}`}>
                                                                    {new Date(evt.date).getDate()}
                                                                </div>

                                                                <div className="space-y-0.5">
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge variant="outline" className={`text-[10px] font-medium ${style.bg} ${style.text} ${style.border}`}>
                                                                            {style.label}
                                                                        </Badge>
                                                                        {evt.is_long_weekend && (
                                                                            <Badge variant="secondary" className="text-[10px]">
                                                                                Long Weekend
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    <h4 className="text-xs font-bold text-foreground">
                                                                        {evt.name}
                                                                    </h4>
                                                                </div>
                                                            </div>

                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    router.visit(`/generator?event_id=${evt.id}`);
                                                                }}
                                                                className="gap-1.5 text-xs h-8 shadow-none"
                                                            >
                                                                <Sparkles className="h-3.5 w-3.5 text-primary" />
                                                                Generate Visuals
                                                            </Button>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    )}
                                </Card>
                            )}

                            {/* Indicator Color Legend */}
                            <div className="flex flex-wrap items-center gap-4 bg-card border border-border rounded-2xl px-4 py-3 text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground">Legend:</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                                    <span>Regular Holiday</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                                    <span>Special Non-Working</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                    <span>Islamic Holiday</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                                    <span>Retail Sale</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                                    <span>Custom Event</span>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT 1 COLUMN: REDESIGNED CLEAN & SPACIOUS UPCOMING DATES */}
                        <div className="space-y-4">
                            <Card className="rounded-3xl border-border bg-card shadow-xs p-4 sm:p-5 space-y-4">
                                <div className="flex items-center justify-between border-b border-border/80 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-primary" />
                                        <h3 className="text-sm font-bold text-foreground">
                                            Upcoming Dates
                                        </h3>
                                    </div>
                                    <span className="text-[11px] font-medium text-muted-foreground">
                                        Next 60 Days
                                    </span>
                                </div>

                                <div className="space-y-2.5">
                                    {upcoming_events.length === 0 ? (
                                        <p className="text-xs text-muted-foreground py-8 text-center">
                                            No upcoming events scheduled.
                                        </p>
                                    ) : (
                                        upcoming_events.map((evt: any) => {
                                            const styleKey = evt.category || evt.type || 'holiday';
                                            const style = categoryStyles[styleKey] || categoryStyles.holiday;

                                            return (
                                                <div
                                                    key={evt.id}
                                                    onClick={() => setSelectedEvent(evt)}
                                                    className="rounded-2xl border border-border/70 bg-card p-3.5 transition-all hover:border-primary/50 hover:shadow-xs cursor-pointer space-y-2 group"
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-xs font-bold text-foreground whitespace-nowrap">
                                                            {evt.date}
                                                        </span>
                                                        {evt.days && (
                                                            <Badge variant="outline" className={`text-[10px] font-semibold shrink-0 whitespace-nowrap ${style.bg} ${style.text} ${style.border}`}>
                                                                {evt.days}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                                        {evt.name}
                                                    </h4>

                                                    <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px] text-muted-foreground">
                                                        <span className="capitalize truncate max-w-[130px]">{style.label}</span>
                                                        <span className="text-primary font-semibold text-[11px] shrink-0">View →</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            {/* =============================================================
                CLEAN EVENT DETAILS MODAL
            ============================================================= */}

            {selectedEvent && (
                <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
                    <DialogContent className="rounded-3xl sm:max-w-md border-border bg-card shadow-xl p-6">
                        <DialogHeader className="space-y-2">
                            <div className="flex items-center gap-2">
                                {(() => {
                                    const styleKey = selectedEvent.category || selectedEvent.type || 'holiday';
                                    const style = categoryStyles[styleKey] || categoryStyles.holiday;
                                    return (
                                        <Badge variant="outline" className={`text-[10px] font-semibold ${style.bg} ${style.text} ${style.border}`}>
                                            {style.label}
                                        </Badge>
                                    );
                                })()}
                                {selectedEvent.is_long_weekend && (
                                    <Badge variant="secondary" className="text-[10px] font-semibold">
                                        Long Weekend
                                    </Badge>
                                )}
                            </div>

                            <DialogTitle className="text-lg font-bold text-foreground">
                                {selectedEvent.name}
                            </DialogTitle>

                            <DialogDescription className="text-xs text-muted-foreground">
                                Date: {selectedEvent.date}
                            </DialogDescription>
                        </DialogHeader>

                        {selectedEvent.description && (
                            <div className="rounded-2xl border border-border bg-muted/20 p-3.5 text-xs leading-relaxed text-muted-foreground">
                                {selectedEvent.description}
                            </div>
                        )}

                        <DialogFooter className="mt-4 flex-col sm:flex-row gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    router.visit(`/generator?event_id=${selectedEvent.id}`);
                                }}
                                className="gap-1.5 text-xs shadow-none w-full sm:w-auto font-semibold"
                            >
                                <Sparkles className="h-3.5 w-3.5 text-primary" />
                                Generate Visuals
                            </Button>

                            <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                    router.visit(`/campaigns/create?event_id=${selectedEvent.id}`);
                                }}
                                className="text-xs w-full sm:w-auto font-semibold shadow-xs"
                            >
                                Create Campaign
                            </Button>

                            {!selectedEvent.is_global && (
                                <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleOpenEdit(selectedEvent)}
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        title="Edit Event"
                                    >
                                        <Edit3 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            setEventToDelete(selectedEvent);
                                            setSelectedEvent(null);
                                        }}
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        title="Delete Event"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* =============================================================
                CREATE CUSTOM EVENT MODAL
            ============================================================= */}

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="rounded-3xl sm:max-w-md border-border bg-card p-6 shadow-xl">
                    <form onSubmit={handleCreateSubmit} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold">
                                Add Custom Event
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Schedule a sale, promotion, or company date.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 text-xs">
                            <div className="space-y-1">
                                <Label htmlFor="create-name" className="text-xs font-medium">
                                    Event Name *
                                </Label>
                                <Input
                                    id="create-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Mid-Year Flash Sale"
                                    required
                                    className="h-9 text-xs"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="space-y-1">
                                    <Label htmlFor="create-date" className="text-xs font-medium">
                                        Date *
                                    </Label>
                                    <Input
                                        id="create-date"
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        required
                                        className="h-9 text-xs"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="create-type" className="text-xs font-medium">
                                        Category
                                    </Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(val) => setFormData({ ...formData, type: val })}
                                    >
                                        <SelectTrigger id="create-type" className="h-9 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="custom">Custom Event</SelectItem>
                                            <SelectItem value="commercial">Retail Sale</SelectItem>
                                            <SelectItem value="seasonal">Seasonal</SelectItem>
                                            <SelectItem value="holiday">Holiday</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="create-desc" className="text-xs font-medium">
                                    Description (Optional)
                                </Label>
                                <Textarea
                                    id="create-desc"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief campaign notes or goals..."
                                    rows={2}
                                    className="text-xs"
                                />
                            </div>
                        </div>

                        <DialogFooter className="mt-4 gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsCreateOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" size="sm" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Add Event'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* =============================================================
                EDIT EVENT MODAL
            ============================================================= */}

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="rounded-3xl sm:max-w-md border-border bg-card p-6 shadow-xl">
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold">
                                Edit Event
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Update the scheduled event details.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 text-xs">
                            <div className="space-y-1">
                                <Label htmlFor="edit-name" className="text-xs font-medium">
                                    Event Name *
                                </Label>
                                <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="h-9 text-xs"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="space-y-1">
                                    <Label htmlFor="edit-date" className="text-xs font-medium">
                                        Date *
                                    </Label>
                                    <Input
                                        id="edit-date"
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        required
                                        className="h-9 text-xs"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="edit-type" className="text-xs font-medium">
                                        Category
                                    </Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(val) => setFormData({ ...formData, type: val })}
                                    >
                                        <SelectTrigger id="edit-type" className="h-9 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="custom">Custom Event</SelectItem>
                                            <SelectItem value="commercial">Retail Sale</SelectItem>
                                            <SelectItem value="seasonal">Seasonal</SelectItem>
                                            <SelectItem value="holiday">Holiday</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="edit-desc" className="text-xs font-medium">
                                    Description (Optional)
                                </Label>
                                <Textarea
                                    id="edit-desc"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={2}
                                    className="text-xs"
                                />
                            </div>
                        </div>

                        <DialogFooter className="mt-4 gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEditOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" size="sm" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* =============================================================
                DELETE CONFIRMATION MODAL
            ============================================================= */}

            <Dialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
                <DialogContent className="rounded-3xl sm:max-w-md border-border bg-card p-6 shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">
                            Delete Event?
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Are you sure you want to delete "{eventToDelete?.name}"?
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="mt-4 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEventToDelete(null)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={handleDeleteSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}