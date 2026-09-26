import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    CalendarDays,
    Check,
    Clock,
    Edit3,
    ExternalLink,
    Eye,
    Filter,
    Lock,
    PartyPopper,
    Plus,
    Search,
    ShoppingBag,
    Tag,
    Trash2,
    X,
} from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

interface EventItem {
    id: number | string;
    name: string;
    description?: string | null;
    date: string;
    start_date: string;
    end_date: string;
    type: string;
    category: string;
    is_global: boolean;
    is_long_weekend?: boolean;
    long_weekend_details?: string | null;
    can_edit: boolean;
    can_delete: boolean;
    campaigns_count: number;
    has_campaign: boolean;
    latest_campaign_id?: number | null;
    show_url: string;
}

interface HolidayCatalogItem {
    name: string;
    date: string;
    end_date?: string;
    type: string;
    category?: string;
    description?: string;
    is_long_weekend?: boolean;
    long_weekend_details?: string;
}

interface EventManagementPageProps {
    events: EventItem[];
    filter?: string;
    current_year?: number;
    selected_year?: string;
    holiday_catalog?: HolidayCatalogItem[];
    stats?: {
        total: number;
        holidays: number;
        commercial: number;
        custom: number;
    };
}

const TYPE_STYLES: Record<string, { text: string; label: string }> = {
    holiday: {
        text: 'text-rose-600 dark:text-rose-400',
        label: 'Philippine Holiday',
    },
    seasonal: {
        text: 'text-cyan-600 dark:text-cyan-400',
        label: 'Seasonal Event',
    },
    commercial: {
        text: 'text-blue-600 dark:text-blue-400',
        label: 'Marketing Event',
    },
    custom: {
        text: 'text-purple-600 dark:text-purple-400',
        label: 'Custom Event',
    },
};

export default function EventManagementPage({
    events = [],
    filter = 'all',
    current_year,
    selected_year,
    stats = { total: 0, holidays: 0, commercial: 0, custom: 0 },
}: EventManagementPageProps) {
    const dynamicCurrentYear = String(current_year || new Date().getFullYear());
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTypeFilter, setActiveTypeFilter] = useState(filter || 'all');
    const [selectedYear, setSelectedYear] = useState<string>(selected_year || dynamicCurrentYear);

    // Available years extracted from events list + dynamic current year
    const availableYears = useMemo(() => {
        const yearsSet = new Set<string>();
        events.forEach((e) => {
            const rawStart = e.start_date || e.date;
            if (rawStart) {
                const y = String(rawStart).substring(0, 4);
                if (/^\d{4}$/.test(y)) {
                    yearsSet.add(y);
                }
            }
            if (e.end_date) {
                const y = String(e.end_date).substring(0, 4);
                if (/^\d{4}$/.test(y)) {
                    yearsSet.add(y);
                }
            }
        });
        yearsSet.add(dynamicCurrentYear);
        return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
    }, [events, dynamicCurrentYear]);

    // Active Year-Scoped Events
    const yearScopedEvents = useMemo(() => {
        if (selectedYear === 'all') return events;
        return events.filter((e) => {
            const startYear = String(e.start_date || e.date || '').substring(0, 4);
            const endYear = String(e.end_date || '').substring(0, 4);
            return startYear === selectedYear || endYear === selectedYear;
        });
    }, [events, selectedYear]);

    // Active Metrics scoped to selected year
    const activeStats = useMemo(() => ({
        total: yearScopedEvents.length,
        holidays: yearScopedEvents.filter((e) => e.type === 'holiday' || e.type === 'seasonal').length,
        commercial: yearScopedEvents.filter((e) => e.type === 'commercial').length,
        custom: yearScopedEvents.filter((e) => e.type === 'custom').length,
    }), [yearScopedEvents]);

    // Create Modal State (Marketing Event & Custom Event only)
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createCategory, setCreateCategory] = useState<'commercial' | 'custom'>('commercial');
    const [createForm, setCreateForm] = useState({
        name: '',
        start_date: new Date().toISOString().substring(0, 10),
        end_date: new Date().toISOString().substring(0, 10),
        description: '',
        type: 'commercial',
    });
    const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Duplicate detection helper: checks against existing canonical events
    const findExistingEvent = useCallback((name: string, date: string) => {
        const normName = name.trim().toLowerCase();
        if (!normName || !date) return null;
        return (
            events.find((e) => {
                const eDate = e.start_date || e.date;
                return eDate === date && e.name.trim().toLowerCase() === normName;
            }) || null
        );
    }, [events]);

    const existingDuplicateForForm = useMemo(() => {
        return findExistingEvent(createForm.name, createForm.start_date);
    }, [findExistingEvent, createForm.name, createForm.start_date]);

    // View Event Modal State
    const [viewingEvent, setViewingEvent] = useState<EventItem | null>(null);

    // Edit Modal State
    const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
    const [editForm, setEditForm] = useState({
        name: '',
        start_date: '',
        end_date: '',
        description: '',
        type: 'custom',
    });
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});

    // Delete Modal State
    const [deletingEvent, setDeletingEvent] = useState<EventItem | null>(null);

    // Filtered events based on year + search + type
    const filteredEvents = useMemo(() => {
        return yearScopedEvents.filter((e) => {
            const matchesSearch =
                !searchQuery ||
                e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase()));

            let matchesType = true;
            if (activeTypeFilter === 'holiday') {
                matchesType = e.type === 'holiday' || e.type === 'seasonal';
            } else if (activeTypeFilter === 'commercial') {
                matchesType = e.type === 'commercial';
            } else if (activeTypeFilter === 'custom') {
                matchesType = e.type === 'custom';
            }

            return matchesSearch && matchesType;
        });
    }, [yearScopedEvents, searchQuery, activeTypeFilter]);

    // Handle Create Submit
    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setCreateErrors({});

        router.post('/events', {
            name: createForm.name,
            start_date: createForm.start_date,
            end_date: createForm.end_date,
            description: createForm.description,
            type: createCategory,
        }, {
            onSuccess: () => {
                setIsCreateOpen(false);
                setIsSubmitting(false);
                const defaultDate = selectedYear !== 'all' ? `${selectedYear}-01-01` : new Date().toISOString().substring(0, 10);
                setCreateForm({
                    name: '',
                    start_date: defaultDate,
                    end_date: defaultDate,
                    description: '',
                    type: createCategory,
                });
            },
            onError: (errs) => {
                setIsSubmitting(false);
                setCreateErrors(errs as Record<string, string>);
            },
        });
    };

    // Open Edit Modal
    const handleOpenEdit = (evt: EventItem) => {
        setEditingEvent(evt);
        setEditForm({
            name: evt.name,
            start_date: evt.start_date,
            end_date: evt.end_date,
            description: evt.description || '',
            type: evt.type,
        });
        setEditErrors({});
    };

    // Handle Edit Submit
    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingEvent) return;

        setIsSubmitting(true);
        setEditErrors({});

        router.put(`/events/${editingEvent.id}`, {
            name: editForm.name,
            start_date: editForm.start_date,
            end_date: editForm.end_date,
            description: editForm.description,
            type: editForm.type,
        }, {
            onSuccess: () => {
                setEditingEvent(null);
                setIsSubmitting(false);
            },
            onError: (errs) => {
                setIsSubmitting(false);
                setEditErrors(errs as Record<string, string>);
            },
        });
    };

    // Handle Delete Submit
    const handleDeleteSubmit = () => {
        if (!deletingEvent) return;

        setIsSubmitting(true);
        router.delete(`/events/${deletingEvent.id}`, {
            onSuccess: () => {
                setDeletingEvent(null);
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <>
            <Head title="Event Bank" />

            <div className="min-h-screen bg-background pb-24 text-foreground">
                <div className="space-y-6 p-4 md:p-6 lg:p-8">
                    {/* Header */}
                    <div className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <h1 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                                        Event Bank
                                    </h1>
                                    {/* Prominent Current-Year Selector */}
                                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                                        <SelectTrigger className="h-7 rounded-lg bg-muted/60 hover:bg-muted font-bold text-xs px-2.5 border-border/80 gap-1.5 text-primary">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent align="start">
                                            {availableYears.map((yr) => (
                                                <SelectItem key={yr} value={yr} className="text-xs font-semibold">
                                                    {yr} {yr === dynamicCurrentYear && '(Current Year)'}
                                                </SelectItem>
                                            ))}
                                            <SelectItem value="all" className="text-xs text-muted-foreground border-t border-border/60 mt-1">
                                                All Years
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Manage your marketing occasions, business events, and Philippine holidays for {selectedYear === 'all' ? 'all time' : selectedYear}.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="h-8 gap-1.5 rounded-xl text-xs font-semibold shadow-2xs"
                            >
                                <Link href="/calendar">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    View Calendar
                                </Link>
                            </Button>

                            <Button
                                onClick={() => {
                                    setCreateCategory('commercial');
                                    setCreateErrors({});
                                    const defaultDate = selectedYear !== 'all' ? `${selectedYear}-01-01` : new Date().toISOString().substring(0, 10);
                                    setCreateForm({
                                        name: '',
                                        start_date: defaultDate,
                                        end_date: defaultDate,
                                        description: '',
                                        type: 'commercial',
                                    });
                                    setIsCreateOpen(true);
                                }}
                                size="sm"
                                className="h-8 gap-1.5 rounded-xl bg-primary text-xs font-semibold text-primary-foreground shadow-2xs hover:bg-primary/90"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Add Event
                            </Button>
                        </div>
                    </div>

                    {/* Metric Summary Cards Scoped to Selected Year */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <Card
                            onClick={() => setActiveTypeFilter('all')}
                            className={`cursor-pointer rounded-2xl border border-border/70 bg-card p-4 shadow-2xs transition-all hover:bg-muted/30 ${
                                activeTypeFilter === 'all' ? 'ring-2 ring-primary/40 bg-primary/5' : ''
                            }`}
                            role="button"
                            tabIndex={0}
                        >
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Total Events ({selectedYear === 'all' ? 'All' : selectedYear})</span>
                                <Calendar className="h-4 w-4 text-primary" />
                            </div>
                            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{activeStats.total}</p>
                        </Card>

                        <Card
                            onClick={() => setActiveTypeFilter(activeTypeFilter === 'holiday' ? 'all' : 'holiday')}
                            className={`cursor-pointer rounded-2xl border border-border/70 bg-card p-4 shadow-2xs transition-all hover:bg-rose-500/5 ${
                                activeTypeFilter === 'holiday' ? 'ring-2 ring-rose-500/50 bg-rose-500/10' : ''
                            }`}
                            role="button"
                            tabIndex={0}
                        >
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Philippine Holidays</span>
                                <PartyPopper className="h-4 w-4 text-rose-500" />
                            </div>
                            <p className="mt-2 text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">{activeStats.holidays}</p>
                        </Card>

                        <Card
                            onClick={() => setActiveTypeFilter(activeTypeFilter === 'commercial' ? 'all' : 'commercial')}
                            className={`cursor-pointer rounded-2xl border border-border/70 bg-card p-4 shadow-2xs transition-all hover:bg-blue-500/5 ${
                                activeTypeFilter === 'commercial' ? 'ring-2 ring-blue-500/50 bg-blue-500/10' : ''
                            }`}
                            role="button"
                            tabIndex={0}
                        >
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Marketing Events</span>
                                <ShoppingBag className="h-4 w-4 text-blue-500" />
                            </div>
                            <p className="mt-2 text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">{activeStats.commercial}</p>
                        </Card>

                        <Card
                            onClick={() => setActiveTypeFilter(activeTypeFilter === 'custom' ? 'all' : 'custom')}
                            className={`cursor-pointer rounded-2xl border border-border/70 bg-card p-4 shadow-2xs transition-all hover:bg-purple-500/5 ${
                                activeTypeFilter === 'custom' ? 'ring-2 ring-purple-500/50 bg-purple-500/10' : ''
                            }`}
                            role="button"
                            tabIndex={0}
                        >
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Custom Events</span>
                                <Tag className="h-4 w-4 text-purple-500" />
                            </div>
                            <p className="mt-2 text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">{activeStats.custom}</p>
                        </Card>
                    </div>

                    {/* Sticky Filter Toolbar */}
                    <div className="sticky top-11 z-30 mb-5 rounded-2xl border border-white/25 bg-card/95 p-2.5 shadow-md backdrop-blur-xl transition-all sm:top-12 sm:p-3 dark:border-white/10 dark:bg-card/95">
                        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                            {/* Search */}
                            <div className="relative min-w-0 flex-1">
                                <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search events by name or description..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-8.5 border-input bg-background pr-8 pl-8.5 text-xs shadow-none focus-visible:ring-primary/30"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-muted-foreground/60 transition-colors hover:text-foreground"
                                        aria-label="Clear search"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>

                            <div className="flex shrink-0 flex-wrap items-center gap-2.5">
                                {/* Year Filter */}
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-medium text-muted-foreground">Year:</span>
                                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                                        <SelectTrigger className="h-8.5 w-[110px] rounded-xl bg-background text-xs font-semibold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent align="end">
                                            {availableYears.map((yr) => (
                                                <SelectItem key={yr} value={yr} className="text-xs font-mono font-medium">
                                                    {yr}
                                                </SelectItem>
                                            ))}
                                            <SelectItem value="all" className="text-xs text-muted-foreground border-t border-border/60 mt-1">
                                                All Years
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Type Filter */}
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-medium text-muted-foreground">Type:</span>
                                    <Select value={activeTypeFilter} onValueChange={setActiveTypeFilter}>
                                        <SelectTrigger className="h-8.5 w-[140px] rounded-xl bg-background text-xs font-medium">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent align="end">
                                            <SelectItem value="all" className="text-xs">All Types</SelectItem>
                                            <SelectItem value="holiday" className="text-xs font-medium text-rose-600 dark:text-rose-400">Philippine Holidays</SelectItem>
                                            <SelectItem value="commercial" className="text-xs font-medium text-blue-600 dark:text-blue-400">Marketing Events</SelectItem>
                                            <SelectItem value="custom" className="text-xs font-medium text-purple-600 dark:text-purple-400">Custom Events</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <span className="text-xs font-medium text-muted-foreground pl-1">
                                    {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Events Table / List */}
                    <Card className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-border/60 bg-muted/30 text-[11px] font-semibold text-muted-foreground">
                                    <tr>
                                        <th className="py-3 px-4">Event Name</th>
                                        <th className="py-3 px-4">Type</th>
                                        <th className="py-3 px-4">Schedule Dates</th>
                                        <th className="py-3 px-4">Status & Campaigns</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {filteredEvents.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-xs text-muted-foreground">
                                                <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-3">
                                                        <Calendar className="h-5 w-5" />
                                                    </div>
                                                    <p className="font-semibold text-sm text-foreground">
                                                        {activeTypeFilter === 'holiday'
                                                            ? `No Philippine Holidays in ${selectedYear === 'all' ? 'the calendar' : selectedYear}.`
                                                            : activeTypeFilter === 'commercial'
                                                              ? `No Marketing Events in ${selectedYear === 'all' ? 'the calendar' : selectedYear}.`
                                                              : activeTypeFilter === 'custom'
                                                                ? `No Custom Events in ${selectedYear === 'all' ? 'the calendar' : selectedYear}.`
                                                                : `No events found for ${selectedYear === 'all' ? 'the selected criteria' : selectedYear}.`}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {activeTypeFilter === 'holiday'
                                                            ? 'Official Philippine holidays for this year will appear here when loaded.'
                                                            : activeTypeFilter === 'commercial'
                                                              ? 'Create promotional sales, flash deals, and commercial marketing occasions.'
                                                              : activeTypeFilter === 'custom'
                                                                ? 'Create store anniversaries, product launches, or business milestones.'
                                                                : 'Get started by creating a marketing or custom event for your Event Bank.'}
                                                    </p>
                                                    {activeTypeFilter !== 'holiday' && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => {
                                                                setCreateCategory(activeTypeFilter === 'custom' ? 'custom' : 'commercial');
                                                                setCreateErrors({});
                                                                const defaultDate = selectedYear !== 'all' ? `${selectedYear}-01-01` : new Date().toISOString().substring(0, 10);
                                                                setCreateForm({
                                                                    name: '',
                                                                    start_date: defaultDate,
                                                                    end_date: defaultDate,
                                                                    description: '',
                                                                    type: activeTypeFilter === 'custom' ? 'custom' : 'commercial',
                                                                });
                                                                setIsCreateOpen(true);
                                                            }}
                                                            className="mt-4 gap-1.5 rounded-xl text-xs font-semibold"
                                                        >
                                                            <Plus className="h-3.5 w-3.5" />
                                                            {activeTypeFilter === 'commercial'
                                                                ? 'Create Marketing Event'
                                                                : activeTypeFilter === 'custom'
                                                                  ? 'Create Custom Event'
                                                                  : 'Add Event'}
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredEvents.map((evt) => {
                                            const typeStyle = TYPE_STYLES[evt.type] || TYPE_STYLES.custom;
                                            const isMultiDay = evt.start_date !== evt.end_date;

                                            return (
                                                <tr
                                                    key={evt.id}
                                                    onClick={() => setViewingEvent(evt)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            setViewingEvent(evt);
                                                        }
                                                    }}
                                                    tabIndex={0}
                                                    role="button"
                                                    className="group cursor-pointer transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:bg-muted/40"
                                                >
                                                    <td className="py-3.5 px-4">
                                                        <div>
                                                            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                                                {evt.name}
                                                            </p>
                                                            {evt.description && (
                                                                <p className="line-clamp-1 max-w-sm text-[11px] text-muted-foreground mt-0.5">
                                                                    {evt.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="py-3.5 px-4 font-medium">
                                                        <span className={`text-xs font-semibold ${typeStyle.text}`}>
                                                            {typeStyle.label}
                                                        </span>
                                                    </td>

                                                    <td className="py-3.5 px-4">
                                                        <div className="space-y-0.5">
                                                            <p className="font-mono text-xs font-medium text-foreground">
                                                                {evt.start_date}
                                                                {isMultiDay && <span className="text-muted-foreground"> → {evt.end_date}</span>}
                                                            </p>
                                                            {isMultiDay && (
                                                                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                                                                    <Clock className="h-2.5 w-2.5" />
                                                                    Multi-day
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="py-3.5 px-4">
                                                        {evt.has_campaign ? (
                                                            <Link
                                                                href={evt.latest_campaign_id ? `/campaigns/${evt.latest_campaign_id}` : `/campaigns?event_id=${evt.id}`}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                                                            >
                                                                <span>Open Campaign ({evt.campaigns_count})</span>
                                                                <ExternalLink className="h-3 w-3" />
                                                            </Link>
                                                        ) : (
                                                            <Link
                                                                href={`/campaigns?create=true&event_id=${evt.id}`}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="text-[11px] text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                                <span>Create Campaign</span>
                                                            </Link>
                                                        )}
                                                    </td>

                                                    <td className="py-3.5 px-4 text-right">
                                                        <div
                                                            className="flex items-center justify-end gap-1.5"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {evt.can_edit ? (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleOpenEdit(evt);
                                                                    }}
                                                                    className="h-7 px-2 text-xs"
                                                                >
                                                                    <Edit3 className="mr-1 h-3 w-3" />
                                                                    Edit
                                                                </Button>
                                                            ) : (
                                                                <span className="text-[11px] text-muted-foreground/50 px-2 italic">Protected</span>
                                                            )}

                                                            {evt.can_delete && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setDeletingEvent(evt);
                                                                    }}
                                                                    className="h-7 px-2 text-xs text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>

            {/* =====================================================
                VIEW EVENT DETAILS MODAL
            ====================================================== */}
            <Dialog open={Boolean(viewingEvent)} onOpenChange={(open) => !open && setViewingEvent(null)}>
                <DialogContent className="max-h-[85vh] flex flex-col overflow-hidden rounded-3xl border-border bg-card p-0 shadow-2xl sm:max-w-lg">
                    <DialogHeader className="shrink-0 border-b border-border bg-muted/20 p-5 sm:p-6 pb-4">
                        <div className="flex items-center gap-2.5 min-w-0 pr-6">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <CalendarDays className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className={`text-[11px] font-bold uppercase tracking-wider ${TYPE_STYLES[viewingEvent?.type || '']?.text || 'text-muted-foreground'}`}>
                                    {TYPE_STYLES[viewingEvent?.type || '']?.label || 'Marketing Event'}
                                </p>
                                <DialogTitle className="text-base font-bold text-foreground sm:text-lg truncate" title={viewingEvent?.name}>
                                    {viewingEvent?.name}
                                </DialogTitle>
                            </div>
                        </div>
                        <DialogDescription className="sr-only">
                            Details and timeline for {viewingEvent?.name}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Modal Body - Scrollable so it never overflows user screen */}
                    <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
                        {/* Schedule Dates & Type */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-border/70 bg-muted/20 p-3.5 space-y-1">
                                <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                                    Schedule Date
                                </span>
                                <p className="font-mono text-xs font-semibold text-foreground">
                                    {viewingEvent?.start_date}
                                    {viewingEvent?.start_date !== viewingEvent?.end_date && (
                                        <span> → {viewingEvent?.end_date}</span>
                                    )}
                                </p>
                                {viewingEvent?.start_date !== viewingEvent?.end_date && (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <Clock className="h-2.5 w-2.5 shrink-0" />
                                        Multi-day range
                                    </span>
                                )}
                            </div>

                            <div className="rounded-2xl border border-border/70 bg-muted/20 p-3.5 space-y-1">
                                <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                                    <Tag className="h-3.5 w-3.5 text-primary shrink-0" />
                                    Event Type
                                </span>
                                <p className={`text-xs font-bold truncate ${TYPE_STYLES[viewingEvent?.type || '']?.text || 'text-foreground'}`}>
                                    {TYPE_STYLES[viewingEvent?.type || '']?.label || 'Custom Event'}
                                </p>
                                <span className="text-[10px] text-muted-foreground block truncate">
                                    {viewingEvent?.is_global ? 'System / Official' : 'Custom Business Event'}
                                </span>
                            </div>
                        </div>

                        {/* Long weekend alert if applicable */}
                        {viewingEvent?.is_long_weekend && (
                            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-amber-700 dark:text-amber-300">
                                <div className="flex items-center gap-1.5 font-semibold text-xs">
                                    <PartyPopper className="h-4 w-4 shrink-0" />
                                    <span>Long Weekend Opportunity</span>
                                </div>
                                {viewingEvent.long_weekend_details && (
                                    <p className="mt-1 text-[11px] text-amber-800/80 dark:text-amber-200/80 leading-relaxed">
                                        {viewingEvent.long_weekend_details}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Overview / Description */}
                        <div className="rounded-2xl border border-border/70 bg-muted/20 p-3.5 space-y-1.5">
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Overview & Marketing Context
                            </span>
                            <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                                {viewingEvent?.description?.trim() ||
                                    'No description provided for this marketing event. Use this event date to plan targeted promotional campaigns.'}
                            </p>
                        </div>

                        {/* Linked Campaigns Info */}
                        <div className="rounded-2xl border border-border/70 bg-muted/20 p-3.5 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <ShoppingBag className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">Linked Campaigns</p>
                                    <p className="text-[11px] text-muted-foreground">
                                        {viewingEvent?.has_campaign
                                            ? `${viewingEvent.campaigns_count} active campaign(s) running for this event`
                                            : 'No campaigns currently associated with this event'}
                                    </p>
                                </div>
                            </div>
                            <span className="font-mono text-sm font-bold text-foreground">
                                {viewingEvent?.campaigns_count || 0}
                            </span>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <DialogFooter className="shrink-0 border-t border-border bg-muted/20 p-3.5 sm:p-4 flex flex-row items-center justify-end gap-2">
                        <div className="flex items-center gap-2">
                            {viewingEvent?.can_edit && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const evt = viewingEvent;
                                        setViewingEvent(null);
                                        handleOpenEdit(evt);
                                    }}
                                    className="text-xs gap-1.5"
                                >
                                    <Edit3 className="h-3.5 w-3.5" />
                                    Edit Event
                                </Button>
                            )}

                            {viewingEvent?.has_campaign ? (
                                <Button
                                    asChild
                                    size="sm"
                                    className="text-xs gap-1.5 bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                                >
                                    <Link href={viewingEvent.latest_campaign_id ? `/campaigns/${viewingEvent.latest_campaign_id}` : `/campaigns?event_id=${viewingEvent.id}`}>
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Open Campaign
                                    </Link>
                                </Button>
                            ) : (
                                <Button
                                    asChild
                                    size="sm"
                                    className="text-xs gap-1.5 bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                                >
                                    <Link href={`/campaigns?create=true&event_id=${viewingEvent?.id}`}>
                                        <Plus className="h-3.5 w-3.5" />
                                        Create Campaign
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =====================================================
                ADD EVENT MODAL (USER-MANAGED EVENTS ONLY)
            ====================================================== */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border-border bg-card p-0 shadow-2xl sm:max-w-lg">
                    <form onSubmit={handleCreateSubmit} className="flex flex-col min-h-0 h-full">
                        <DialogHeader className="shrink-0 border-b border-border bg-muted/20 p-5 sm:p-6 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <Plus className="h-5 w-5" />
                                </div>
                                <DialogTitle className="text-lg font-bold text-foreground">
                                    Add Event
                                </DialogTitle>
                            </div>
                            <DialogDescription className="mt-1 text-xs text-muted-foreground">
                                Create a marketing or business event for your Event Bank.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Category Selector Tabs: Marketing Event & Custom Event Only */}
                        <div className="shrink-0 border-b border-border/70 bg-muted/10 p-3">
                            <div className="grid grid-cols-2 gap-1 rounded-2xl border border-border/80 bg-muted/30 p-1 text-xs">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCreateCategory('commercial');
                                        setCreateErrors({});
                                        setCreateForm((prev) => ({
                                            ...prev,
                                            type: 'commercial',
                                        }));
                                    }}
                                    className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 font-semibold transition-all ${
                                        createCategory === 'commercial'
                                            ? 'bg-card text-foreground shadow-2xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <ShoppingBag className="h-3.5 w-3.5 text-blue-500" />
                                    <span>Marketing Event</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setCreateCategory('custom');
                                        setCreateErrors({});
                                        setCreateForm((prev) => ({
                                            ...prev,
                                            type: 'custom',
                                        }));
                                    }}
                                    className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 font-semibold transition-all ${
                                        createCategory === 'custom'
                                            ? 'bg-card text-foreground shadow-2xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <Tag className="h-3.5 w-3.5 text-purple-500" />
                                    <span>Custom Event</span>
                                </button>
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="min-h-0 flex-1 overflow-y-auto space-y-4 p-5 sm:p-6">
                            <div className="space-y-1.5">
                                <Label htmlFor="event_name" className="text-xs font-semibold text-foreground">
                                    Event Name *
                                </Label>
                                <Input
                                    id="event_name"
                                    value={createForm.name}
                                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                    placeholder={
                                        createCategory === 'commercial'
                                            ? 'e.g., 11.11 Flash Sale, Summer Sale, Back to School, Anniversary Sale'
                                            : 'e.g., Store Anniversary, Grand Opening, New Branch Launch, Customer Appreciation Day'
                                    }
                                    required
                                    className="text-xs"
                                />
                                {createErrors.name && (
                                    <p className="text-[11px] text-rose-500">{createErrors.name}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="start_date" className="text-xs font-semibold text-foreground">
                                        Start Date *
                                    </Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={createForm.start_date}
                                        onChange={(e) => setCreateForm({ ...createForm, start_date: e.target.value })}
                                        required
                                        className="text-xs font-mono"
                                    />
                                    {createErrors.start_date && (
                                        <p className="text-[11px] text-rose-500">{createErrors.start_date}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="end_date" className="text-xs font-semibold text-foreground">
                                        End Date *
                                    </Label>
                                    <Input
                                        id="end_date"
                                        type="date"
                                        value={createForm.end_date}
                                        onChange={(e) => setCreateForm({ ...createForm, end_date: e.target.value })}
                                        required
                                        className="text-xs font-mono"
                                    />
                                    {createErrors.end_date && (
                                        <p className="text-[11px] text-rose-500">{createErrors.end_date}</p>
                                    )}
                                </div>
                            </div>

                            {/* Existing duplicate notice for marketing/custom */}
                            {existingDuplicateForForm && (
                                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-700 dark:text-amber-300 text-xs">
                                    <p className="font-semibold">Event already exists on this date</p>
                                    <p className="text-[11px] text-amber-800/80 dark:text-amber-200/80 mt-0.5">
                                        An event named &quot;{existingDuplicateForForm.name}&quot; already exists in your Event Bank for this date ({existingDuplicateForForm.start_date || existingDuplicateForForm.date}).
                                    </p>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label htmlFor="description" className="text-xs font-semibold text-foreground">
                                    Description / Promotion Notes
                                </Label>
                                <Textarea
                                    id="description"
                                    rows={3}
                                    value={createForm.description}
                                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                                    placeholder="Add any notes, promotional objectives, or scheduling reminders for this event..."
                                    className="text-xs resize-none"
                                />
                                {createErrors.description && (
                                    <p className="text-[11px] text-rose-500">{createErrors.description}</p>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="shrink-0 border-t border-border bg-muted/20 p-4 sm:p-6">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsCreateOpen(false)}
                                className="text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isSubmitting || !createForm.name}
                                className="bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                            >
                                {isSubmitting
                                    ? 'Creating...'
                                    : createCategory === 'commercial'
                                      ? 'Create Marketing Event'
                                      : 'Create Custom Event'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* =====================================================
                EDIT EVENT MODAL
            ====================================================== */}
            <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
                <DialogContent className="max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border-border bg-card p-0 shadow-2xl sm:max-w-lg">
                    <form onSubmit={handleEditSubmit} className="flex min-h-0 flex-1 flex-col">
                        <DialogHeader className="shrink-0 border-b border-border bg-muted/20 p-5 sm:p-6 pb-4">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <Edit3 className="h-4 w-4" />
                                </div>
                                <DialogTitle className="text-lg font-bold text-foreground">
                                    Edit Event
                                </DialogTitle>
                            </div>
                            <DialogDescription className="mt-1 text-xs text-muted-foreground">
                                Update the schedule or information for this user-owned event.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="min-h-0 flex-1 overflow-y-auto space-y-4 p-5 sm:p-6">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_name" className="text-xs font-semibold text-foreground">
                                    Event Name *
                                </Label>
                                <Input
                                    id="edit_name"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    required
                                    className="text-xs"
                                />
                                {editErrors.name && (
                                    <p className="text-[11px] text-rose-500">{editErrors.name}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit_start_date" className="text-xs font-semibold text-foreground">
                                        Start Date *
                                    </Label>
                                    <Input
                                        id="edit_start_date"
                                        type="date"
                                        value={editForm.start_date}
                                        onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                                        required
                                        className="text-xs font-mono"
                                    />
                                    {editErrors.start_date && (
                                        <p className="text-[11px] text-rose-500">{editErrors.start_date}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="edit_end_date" className="text-xs font-semibold text-foreground">
                                        End Date *
                                    </Label>
                                    <Input
                                        id="edit_end_date"
                                        type="date"
                                        value={editForm.end_date}
                                        onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                                        required
                                        className="text-xs font-mono"
                                    />
                                    {editErrors.end_date && (
                                        <p className="text-[11px] text-rose-500">{editErrors.end_date}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit_description" className="text-xs font-semibold text-foreground">
                                    Description
                                </Label>
                                <Textarea
                                    id="edit_description"
                                    rows={3}
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    className="text-xs resize-none"
                                />
                            </div>
                        </div>

                        <DialogFooter className="shrink-0 border-t border-border bg-muted/20 p-4 sm:p-6">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingEvent(null)}
                                className="text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isSubmitting || !editForm.name}
                                className="bg-primary text-xs font-semibold text-primary-foreground"
                            >
                                {isSubmitting ? 'Updating...' : 'Update Event'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* =====================================================
                DELETE CONFIRMATION DIALOG
            ====================================================== */}
            <Dialog open={!!deletingEvent} onOpenChange={(open) => !open && setDeletingEvent(null)}>
                <DialogContent className="rounded-3xl border-border bg-card p-6 shadow-2xl sm:max-w-md">
                    <DialogHeader className="space-y-2">
                        <DialogTitle className="text-base font-bold text-foreground">
                            Delete Event
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Are you sure you want to delete <span className="font-semibold text-foreground">"{deletingEvent?.name}"</span>? This will remove the event from your schedule.
                        </DialogDescription>
                    </DialogHeader>

                    {deletingEvent?.has_campaign ? (
                        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
                            This event is currently linked to an active campaign and cannot be deleted.
                        </div>
                    ) : null}

                    <DialogFooter className="mt-4 flex items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingEvent(null)}
                            className="text-xs font-medium"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={isSubmitting || deletingEvent?.has_campaign}
                            onClick={handleDeleteSubmit}
                            className="text-xs font-medium"
                        >
                            {isSubmitting ? 'Deleting...' : 'Delete Event'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
