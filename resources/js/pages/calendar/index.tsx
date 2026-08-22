import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    Edit3,
    Filter,
    LayoutGrid,
    List,
    PanelRightClose,
    PanelRightOpen,
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
    const todayDateStr = useMemo(() => {
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }, []);

    const isEventPast = (dateStr?: string | null) => {
        if (!dateStr) return false;
        return dateStr < todayDateStr;
    };

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
            } catch { }
        }
    };

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

            <div className="flex min-h-screen bg-background text-foreground relative">
                {/* MAIN CALENDAR WORKSPACE */}
                <div className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 space-y-6 pb-20">

                    {/* =====================================================
                        PAGE HEADER & ADD EVENT ACTION
                    ====================================================== */}

                    {/* COMPACT & PROFESSIONAL MARKETING CALENDAR HEADER */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                                <CalendarIcon className="h-4 w-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                                        Marketing Calendar
                                    </h1>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Plan visuals and campaigns around national holidays and retail sales dates.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
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
                                size="sm"
                                className="h-8 gap-1.5 font-semibold text-xs shadow-2xs"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Add Custom Event
                            </Button>
                        </div>
                    </div>

                    {/* =====================================================
                        STICKY NAVIGATION TOOLBAR: DROPDOWN SELECTIONS
                    ====================================================== */}

                    <div className="sticky top-14 z-20 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 py-2 bg-background/95 backdrop-blur-md border-b border-border/60 transition-all shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 bg-card border border-border/80 rounded-2xl p-2.5 sm:p-3 shadow-xs">
                            {/* Month & Year Selectors with Next/Prev controls */}
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Prev / Next Buttons */}
                                <div className="flex items-center rounded-xl border border-border bg-background p-0.5">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={prevMonth}
                                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                                        aria-label="Previous Month"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={nextMonth}
                                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
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
                                    <SelectTrigger className="h-8 w-[120px] text-xs font-semibold bg-background">
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
                                    <SelectTrigger className="h-8 w-[85px] text-xs font-semibold bg-background">
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
                                    className="h-8 px-2.5 text-xs font-medium shadow-none"
                                >
                                    Today
                                </Button>
                            </div>

                            {/* Dropdown Selections for Filters & View Modes (Icon-only triggers) */}
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                {/* Event Type Filter Dropdown (Icon Only Trigger) */}
                                <Select
                                    value={activeFilter}
                                    onValueChange={setActiveFilter}
                                >
                                    <SelectTrigger
                                        size="sm"
                                        className="h-8 w-8 min-w-8 p-0 flex items-center justify-center bg-background rounded-xl font-semibold relative [&_svg.lucide-chevron-down]:hidden [&_[data-radix-select-icon]]:hidden [&>svg:last-child]:hidden [&>span]:hidden"
                                        title={`Filter: ${activeFilter === 'all'
                                                ? 'All Events & Holidays'
                                                : activeFilter === 'regular'
                                                    ? 'Regular Holidays'
                                                    : activeFilter === 'special_non_working'
                                                        ? 'Special Non-Working'
                                                        : activeFilter === 'islamic'
                                                            ? 'Islamic Holidays'
                                                            : activeFilter === 'commercial'
                                                                ? 'Sales & Events'
                                                                : 'Custom Events'
                                            }`}
                                        aria-label="Filter events and holidays"
                                    >
                                        <div className="relative flex items-center justify-center">
                                            <Filter className={`h-4 w-4 ${activeFilter !== 'all' ? 'text-primary' : 'text-muted-foreground'}`} />
                                            {activeFilter !== 'all' && (
                                                <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-primary" />
                                            )}
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent align="end">
                                        <SelectItem value="all" className="text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-primary" />
                                                <span>All Events & Holidays</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="regular" className="text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-rose-500" />
                                                <span>Regular Holidays</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="special_non_working" className="text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-amber-500" />
                                                <span>Special Non-Working</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="islamic" className="text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                                <span>Islamic Holidays</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="commercial" className="text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                                                <span>Sales & Events</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="custom" className="text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-purple-500" />
                                                <span>Custom Events</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* View Mode Dropdown (Icon Only Trigger) */}
                                <Select
                                    value={viewMode}
                                    onValueChange={(val) => setViewMode(val as 'grid' | 'agenda' | 'year')}
                                >
                                    <SelectTrigger
                                        size="sm"
                                        className="h-8 w-8 min-w-8 p-0 flex items-center justify-center bg-background rounded-xl font-semibold relative [&_svg.lucide-chevron-down]:hidden [&_[data-radix-select-icon]]:hidden [&>svg:last-child]:hidden [&>span]:hidden"
                                        title={`View: ${viewMode === 'grid' ? 'Month Grid' : viewMode === 'agenda' ? 'Agenda List' : `Full Year ${currentYear}`}`}
                                        aria-label="Select calendar view"
                                    >
                                        <div className="flex items-center justify-center">
                                            {viewMode === 'grid' && <LayoutGrid className="h-4 w-4 text-primary" />}
                                            {viewMode === 'agenda' && <List className="h-4 w-4 text-blue-500" />}
                                            {viewMode === 'year' && <Sparkles className="h-4 w-4 text-amber-500" />}
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent align="end">
                                        <SelectItem value="grid" className="text-xs">
                                            <div className="flex items-center gap-2">
                                                <LayoutGrid className="h-3.5 w-3.5 text-primary" />
                                                <span>Month Grid View</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="agenda" className="text-xs">
                                            <div className="flex items-center gap-2">
                                                <List className="h-3.5 w-3.5 text-blue-500" />
                                                <span>Agenda List View</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="year" className="text-xs">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                                <span>Full Year ({currentYear})</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* =====================================================
                        MAIN CALENDAR CANVAS
                    ====================================================== */}

                    <div className="space-y-4">
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
                                        const isCellPast = cell.dateString < todayDateStr;

                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => handleCellClick(cell.dateString)}
                                                className={`group min-h-[115px] p-2 transition-colors hover:bg-muted/30 cursor-pointer flex flex-col justify-between ${!cell.isCurrentMonth
                                                        ? 'bg-muted/10 text-muted-foreground/30'
                                                        : isCellPast
                                                            ? 'bg-muted/5 text-foreground'
                                                            : 'bg-card text-foreground'
                                                    }`}
                                            >
                                                {/* Day Number Header */}
                                                <div className="flex items-center justify-between">
                                                    <span
                                                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${cell.isToday
                                                                ? 'bg-primary text-primary-foreground font-bold shadow-xs'
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

                                                {/* Event Pills with Indicator Colors */}
                                                <div className="mt-1.5 space-y-1 overflow-hidden">
                                                    {cellEvents.slice(0, 3).map((evt) => {
                                                        const isPast = isEventPast(evt.date);
                                                        const styleKey = evt.category || evt.type || 'holiday';
                                                        const baseStyle = categoryStyles[styleKey] || categoryStyles.holiday;

                                                        return (
                                                            <button
                                                                key={evt.id}
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedEvent(evt);
                                                                }}
                                                                className={`w-full text-left rounded-lg border px-2 py-1 text-[11px] font-medium transition-all truncate flex items-center gap-1.5 shadow-2xs ${isPast
                                                                        ? 'bg-muted/50 text-muted-foreground border-border/70 border-dashed opacity-75 hover:opacity-100 hover:bg-muted/70'
                                                                        : `${baseStyle.bg} ${baseStyle.text} ${baseStyle.border} hover:opacity-90`
                                                                    }`}
                                                                title={`${evt.name} • ${baseStyle.label}${isPast ? ' (Past Event)' : ''}`}
                                                            >
                                                                <span
                                                                    className={`h-1.5 w-1.5 rounded-full shrink-0 ${isPast ? 'bg-slate-400 dark:bg-slate-500 ring-1 ring-slate-300 dark:ring-slate-600' : baseStyle.dot
                                                                        }`}
                                                                />
                                                                <span className={`truncate ${isPast ? 'line-through decoration-muted-foreground/40' : ''}`}>
                                                                    {evt.name}
                                                                </span>
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
                        ) : viewMode === 'agenda' ? (
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
                                                const isPast = isEventPast(evt.date);
                                                const styleKey = evt.category || evt.type || 'holiday';
                                                const baseStyle = categoryStyles[styleKey] || categoryStyles.holiday;

                                                return (
                                                    <div
                                                        key={evt.id}
                                                        onClick={() => setSelectedEvent(evt)}
                                                        className={`flex items-center justify-between gap-4 rounded-2xl border p-4 transition-all hover:bg-muted/30 cursor-pointer shadow-xs ${isPast
                                                                ? 'border-border/70 border-dashed bg-muted/20 opacity-80 hover:opacity-100'
                                                                : 'border-border bg-card'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${isPast
                                                                    ? 'bg-muted text-muted-foreground border border-border/80'
                                                                    : `${baseStyle.bg} ${baseStyle.text}`
                                                                }`}>
                                                                {new Date(evt.date).getDate()}
                                                            </div>

                                                            <div className="space-y-0.5">
                                                                <div className="flex items-center gap-2">
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={`text-[10px] font-medium ${isPast
                                                                                ? 'bg-muted/50 text-muted-foreground border-border'
                                                                                : `${baseStyle.bg} ${baseStyle.text} ${baseStyle.border}`
                                                                            }`}
                                                                    >
                                                                        {baseStyle.label}
                                                                    </Badge>
                                                                    {isPast && (
                                                                        <Badge variant="secondary" className="text-[10px] text-muted-foreground font-mono bg-muted/80">
                                                                            Past Event
                                                                        </Badge>
                                                                    )}
                                                                    {evt.is_long_weekend && (
                                                                        <Badge variant="secondary" className="text-[10px]">
                                                                            Long Weekend
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <h4 className={`text-xs font-bold ${isPast ? 'text-muted-foreground line-through decoration-muted-foreground/40' : 'text-foreground'}`}>
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
                        ) : (
                            /* Full Year Overview (12 Months) */
                            <div className="space-y-6">
                                {/* Year Summary Metric Cards */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {[
                                        {
                                            label: 'Total in ' + currentYear,
                                            count: filteredEvents.filter((evt) => new Date(evt.date).getFullYear() === currentYear).length,
                                            bg: 'bg-primary/10',
                                            text: 'text-primary',
                                            border: 'border-primary/20',
                                        },
                                        {
                                            label: 'Regular Holidays',
                                            count: filteredEvents.filter((evt) => new Date(evt.date).getFullYear() === currentYear && (evt.category === 'regular' || evt.type === 'holiday')).length,
                                            bg: 'bg-rose-500/10',
                                            text: 'text-rose-600 dark:text-rose-400',
                                            border: 'border-rose-500/20',
                                        },
                                        {
                                            label: 'Special Non-Working',
                                            count: filteredEvents.filter((evt) => new Date(evt.date).getFullYear() === currentYear && evt.category === 'special_non_working').length,
                                            bg: 'bg-amber-500/10',
                                            text: 'text-amber-600 dark:text-amber-400',
                                            border: 'border-amber-500/20',
                                        },
                                        {
                                            label: 'Long Weekends',
                                            count: filteredEvents.filter((evt) => new Date(evt.date).getFullYear() === currentYear && evt.is_long_weekend).length,
                                            bg: 'bg-emerald-500/10',
                                            text: 'text-emerald-600 dark:text-emerald-400',
                                            border: 'border-emerald-500/20',
                                        },
                                    ].map((stat) => (
                                        <div
                                            key={stat.label}
                                            className={`rounded-2xl border ${stat.border} ${stat.bg} p-4 space-y-1`}
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
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {monthNames.map((mName, mIdx) => {
                                        const monthEvts = filteredEvents.filter((evt) => {
                                            const dt = new Date(evt.date);
                                            return dt.getFullYear() === currentYear && dt.getMonth() === mIdx;
                                        });

                                        return (
                                            <Card
                                                key={mName}
                                                className="overflow-hidden rounded-3xl border-border bg-card shadow-xs flex flex-col justify-between"
                                            >
                                                <div className="p-4 space-y-3">
                                                    {/* Month Header */}
                                                    <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-sm font-bold text-foreground">
                                                                {mName}
                                                            </h4>
                                                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                                {monthEvts.length}
                                                            </span>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setCurrentDate(new Date(currentYear, mIdx, 1));
                                                                setViewMode('grid');
                                                            }}
                                                            className="text-[11px] font-semibold text-primary hover:underline"
                                                        >
                                                            Open Grid →
                                                        </button>
                                                    </div>

                                                    {/* Month Events List */}
                                                    {monthEvts.length === 0 ? (
                                                        <div className="py-6 text-center text-xs text-muted-foreground/60">
                                                            No holidays or events
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {monthEvts.map((evt) => {
                                                                const isPast = isEventPast(evt.date);
                                                                const styleKey = evt.category || evt.type || 'holiday';
                                                                const baseStyle = categoryStyles[styleKey] || categoryStyles.holiday;
                                                                const dayNumber = new Date(evt.date).getDate();

                                                                return (
                                                                    <div
                                                                        key={evt.id}
                                                                        onClick={() => setSelectedEvent(evt)}
                                                                        className={`flex items-center justify-between gap-2.5 rounded-xl border p-2.5 transition-all cursor-pointer shadow-2xs group ${isPast
                                                                                ? 'border-border/60 border-dashed bg-muted/20 opacity-75 hover:opacity-100'
                                                                                : 'border-border/70 bg-card/60 hover:bg-muted/40'
                                                                            }`}
                                                                    >
                                                                        <div className="flex items-center gap-2 min-w-0">
                                                                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-bold text-[11px] ${isPast
                                                                                    ? 'bg-muted text-muted-foreground border border-border/60'
                                                                                    : `${baseStyle.bg} ${baseStyle.text}`
                                                                                }`}>
                                                                                {dayNumber}
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <p className={`text-xs font-semibold truncate transition-colors ${isPast
                                                                                        ? 'text-muted-foreground line-through decoration-muted-foreground/40'
                                                                                        : 'text-foreground group-hover:text-primary'
                                                                                    }`}>
                                                                                    {evt.name}
                                                                                </p>
                                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isPast ? 'bg-slate-400 dark:bg-slate-500' : baseStyle.dot}`} />
                                                                                    <span className="text-[10px] text-muted-foreground truncate">
                                                                                        {isPast ? 'Past • ' : ''}{baseStyle.label}
                                                                                    </span>
                                                                                    {evt.is_long_weekend && (
                                                                                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-sm">
                                                                                            Long Weekend
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                router.visit(`/generator?event_id=${evt.id}`);
                                                                            }}
                                                                            className="shrink-0 p-1.5 rounded-lg border border-primary/20 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                                                                            title="Generate Visuals"
                                                                        >
                                                                            <Sparkles className="h-3.5 w-3.5" />
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
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
                            <div className="flex items-center gap-1.5 border-l border-border/80 pl-3">
                                <span className="h-2.5 w-2.5 rounded-full bg-slate-400 dark:bg-slate-500 ring-1 ring-slate-300 dark:ring-slate-600" />
                                <span className="font-medium text-muted-foreground">Past Event / Date</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* =====================================================
                    DOCKED RIGHT SIDEBAR: UPCOMING DATES (ATTACHED TO SYSTEM HEADER)
                ====================================================== */}
                {isUpcomingCollapsed ? (
                    /* COLLAPSED VERTICAL RAIL BOX (LIKE LEFT SIDEBAR RAIL) */
                    <aside
                        onClick={() => handleSetUpcomingCollapsed(false)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') handleSetUpcomingCollapsed(false);
                        }}
                        className="w-11 lg:w-12 shrink-0 border-l border-border bg-card/60 hover:bg-muted/40 backdrop-blur-md sticky top-14 h-[calc(100vh-3.5rem)] flex flex-col items-center justify-between py-4 cursor-pointer select-none transition-all duration-200 z-20 group"
                        title="Open Upcoming Dates"
                    >
                        <div className="flex flex-col items-center gap-5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-2xs">
                                <PanelRightOpen className="h-4 w-4" />
                            </div>

                            <div className="flex flex-col items-center gap-4 py-2">
                                <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] font-bold tracking-widest uppercase text-muted-foreground group-hover:text-foreground transition-colors">
                                    Upcoming Dates
                                </span>
                                <span className="[writing-mode:vertical-rl] rotate-180 text-[9px] font-mono font-bold text-primary px-1 py-0.5 rounded border border-primary/30 bg-primary/5">
                                    {upcoming_events.length}
                                </span>
                            </div>
                        </div>

                        <div className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground group-hover:text-foreground transition-colors">
                            <Clock className="h-3.5 w-3.5" />
                        </div>
                    </aside>
                ) : (
                    /* EXPANDED FULL RIGHT SIDEBAR */
                    <aside className="w-80 lg:w-[320px] shrink-0 border-l border-border bg-card/75 backdrop-blur-md sticky top-14 h-[calc(100vh-3.5rem)] flex flex-col justify-between overflow-y-auto p-5 transition-all duration-300 z-20">
                        <div className="space-y-4">
                            {/* Sidebar Header */}
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                <div className="text-sm font-bold flex items-center gap-2 text-foreground">
                                    <Clock className="h-4 w-4 text-primary" />
                                    Upcoming Dates
                                    <Badge variant="secondary" className="text-[10px] font-semibold">
                                        {upcoming_events.length}
                                    </Badge>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleSetUpcomingCollapsed(true)}
                                    className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                                    title="Collapse upcoming dates"
                                >
                                    <PanelRightClose className="h-4 w-4" />
                                </Button>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Scheduled marketing holidays and retail events for the next 60 days.
                            </p>

                            {/* Next 60 Days Events List */}
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
                        </div>
                    </aside>
                )}
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
                                    const isPast = isEventPast(selectedEvent.date);
                                    const styleKey = selectedEvent.category || selectedEvent.type || 'holiday';
                                    const style = categoryStyles[styleKey] || categoryStyles.holiday;
                                    return (
                                        <>
                                            <Badge variant="outline" className={`text-[10px] font-semibold ${style.bg} ${style.text} ${style.border}`}>
                                                {style.label}
                                            </Badge>
                                            {isPast ? (
                                                <Badge variant="secondary" className="text-[10px] font-mono text-muted-foreground bg-muted">
                                                    Past Event
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30">
                                                    Upcoming
                                                </Badge>
                                            )}
                                        </>
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