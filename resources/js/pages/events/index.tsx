import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    CalendarDays,
    Check,
    Clock,
    Edit3,
    Filter,
    Lock,
    PartyPopper,
    Plus,
    Search,
    ShoppingBag,
    Tag,
    Trash2,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
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
    holiday_catalog?: HolidayCatalogItem[];
    stats?: {
        total: number;
        holidays: number;
        commercial: number;
        custom: number;
    };
}

const TYPE_STYLES: Record<string, { bg: string; text: string; border: string; label: string; dot: string }> = {
    holiday: {
        bg: 'bg-rose-500/10 dark:bg-rose-500/15',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-500/30',
        label: 'Philippine Holiday',
        dot: 'bg-rose-500',
    },
    seasonal: {
        bg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
        text: 'text-cyan-700 dark:text-cyan-300',
        border: 'border-cyan-500/30',
        label: 'Seasonal Event',
        dot: 'bg-cyan-500',
    },
    commercial: {
        bg: 'bg-blue-500/10 dark:bg-blue-500/15',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-500/30',
        label: 'Marketing Event',
        dot: 'bg-blue-500',
    },
    custom: {
        bg: 'bg-purple-500/10 dark:bg-purple-500/15',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-500/30',
        label: 'Custom Event',
        dot: 'bg-purple-500',
    },
};

export default function EventManagementPage({
    events = [],
    filter = 'all',
    holiday_catalog = [],
    stats = { total: 0, holidays: 0, commercial: 0, custom: 0 },
}: EventManagementPageProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTypeFilter, setActiveTypeFilter] = useState(filter || 'all');

    // Create Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createCategory, setCreateCategory] = useState<'holiday' | 'commercial' | 'custom'>('custom');
    const [createForm, setCreateForm] = useState({
        name: '',
        start_date: new Date().toISOString().substring(0, 10),
        end_date: new Date().toISOString().substring(0, 10),
        description: '',
        type: 'custom',
    });
    const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    // Filtered events
    const filteredEvents = useMemo(() => {
        return events.filter((e) => {
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
    }, [events, searchQuery, activeTypeFilter]);

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
            type: createCategory === 'holiday' ? 'holiday' : createCategory,
        }, {
            onSuccess: () => {
                setIsCreateOpen(false);
                setIsSubmitting(false);
                setCreateForm({
                    name: '',
                    start_date: new Date().toISOString().substring(0, 10),
                    end_date: new Date().toISOString().substring(0, 10),
                    description: '',
                    type: 'custom',
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

    // Select Catalog Holiday
    const handleSelectCatalogHoliday = (h: HolidayCatalogItem) => {
        setCreateForm({
            name: h.name,
            start_date: h.date,
            end_date: h.end_date || h.date,
            description: h.description || '',
            type: h.type || 'holiday',
        });
    };

    return (
        <>
            <Head title="Event Management" />

            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-foreground">
                                    Event Management
                                </h1>
                                <p className="text-xs text-muted-foreground">
                                    Create and manage marketing events, custom sales, and Philippine holidays.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="rounded-xl text-xs font-semibold"
                        >
                            <Link href="/calendar">
                                <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                                View Calendar
                            </Link>
                        </Button>

                        <Button
                            onClick={() => {
                                setCreateCategory('custom');
                                setCreateErrors({});
                                setIsCreateOpen(true);
                            }}
                            size="sm"
                            className="rounded-xl bg-primary text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90"
                        >
                            <Plus className="mr-1.5 h-4 w-4" />
                            Add Event
                        </Button>
                    </div>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Card className="rounded-2xl border-border bg-card p-4 shadow-2xs">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Total Events</span>
                            <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <p className="mt-2 text-2xl font-bold text-foreground">{stats.total}</p>
                    </Card>

                    <Card className="rounded-2xl border-border bg-card p-4 shadow-2xs">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Philippine Holidays</span>
                            <PartyPopper className="h-4 w-4 text-rose-500" />
                        </div>
                        <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.holidays}</p>
                    </Card>

                    <Card className="rounded-2xl border-border bg-card p-4 shadow-2xs">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Marketing Events</span>
                            <ShoppingBag className="h-4 w-4 text-blue-500" />
                        </div>
                        <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.commercial}</p>
                    </Card>

                    <Card className="rounded-2xl border-border bg-card p-4 shadow-2xs">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Custom Events</span>
                            <Tag className="h-4 w-4 text-purple-500" />
                        </div>
                        <p className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.custom}</p>
                    </Card>
                </div>

                {/* Search & Filter Toolbar */}
                <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative flex-1 sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search events by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-8 rounded-xl pl-9 text-xs"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Filter className="h-3.5 w-3.5" />
                            <span>Type:</span>
                        </div>
                        <Select value={activeTypeFilter} onValueChange={setActiveTypeFilter}>
                            <SelectTrigger className="h-8 w-[140px] rounded-xl bg-background text-xs font-medium">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectItem value="all" className="text-xs">All Types</SelectItem>
                                <SelectItem value="holiday" className="text-xs">Holidays</SelectItem>
                                <SelectItem value="commercial" className="text-xs">Marketing Events</SelectItem>
                                <SelectItem value="custom" className="text-xs">Custom Events</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Events Table / List */}
                <Card className="overflow-hidden rounded-3xl border-border bg-card shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-border bg-muted/20 text-[11px] font-semibold text-muted-foreground">
                                <tr>
                                    <th className="py-3 px-4">Event Name</th>
                                    <th className="py-3 px-4">Type</th>
                                    <th className="py-3 px-4">Schedule Dates</th>
                                    <th className="py-3 px-4">Status & Campaigns</th>
                                    <th className="py-3 px-4">Ownership</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {filteredEvents.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-xs text-muted-foreground">
                                            No events found matching your search.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredEvents.map((evt) => {
                                        const typeStyle = TYPE_STYLES[evt.type] || TYPE_STYLES.custom;
                                        const isMultiDay = evt.start_date !== evt.end_date;

                                        return (
                                            <tr key={evt.id} className="transition-colors hover:bg-muted/10">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`h-2 w-2 shrink-0 rounded-full ${typeStyle.dot}`} />
                                                        <div>
                                                            <p className="font-semibold text-foreground">{evt.name}</p>
                                                            {evt.description && (
                                                                <p className="line-clamp-1 max-w-sm text-[11px] text-muted-foreground">
                                                                    {evt.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="py-3 px-4">
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[10px] font-semibold ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}
                                                    >
                                                        {typeStyle.label}
                                                    </Badge>
                                                </td>

                                                <td className="py-3 px-4">
                                                    <div className="space-y-0.5">
                                                        <p className="font-mono text-[11px] font-medium text-foreground">
                                                            {evt.start_date}
                                                            {isMultiDay && ` → ${evt.end_date}`}
                                                        </p>
                                                        {isMultiDay && (
                                                            <span className="inline-flex items-center gap-1 rounded bg-muted/40 px-1.5 py-0.2 text-[9px] font-mono text-muted-foreground">
                                                                <Clock className="h-2.5 w-2.5" />
                                                                Multi-day range
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="py-3 px-4">
                                                    {evt.has_campaign ? (
                                                        <Badge variant="outline" className="border-primary/40 bg-primary/10 text-[10px] font-semibold text-primary">
                                                            Linked ({evt.campaigns_count} Campaign{evt.campaigns_count > 1 ? 's' : ''})
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-[11px] text-muted-foreground">Unlinked</span>
                                                    )}
                                                </td>

                                                <td className="py-3 px-4">
                                                    {evt.is_global ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                                            <Lock className="h-3 w-3 text-muted-foreground/70" />
                                                            System / Official
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] font-medium text-foreground">Your Event</span>
                                                    )}
                                                </td>

                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            asChild
                                                            className="h-7 px-2 text-xs"
                                                        >
                                                            <Link href={evt.show_url}>View</Link>
                                                        </Button>

                                                        {evt.can_edit ? (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleOpenEdit(evt)}
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
                                                                onClick={() => setDeletingEvent(evt)}
                                                                className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-400"
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

            {/* =====================================================
                ADD EVENT MODAL
            ====================================================== */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border-border bg-card p-0 shadow-2xl sm:max-w-lg">
                    <form onSubmit={handleCreateSubmit} className="flex min-h-0 flex-1 flex-col">
                        <DialogHeader className="shrink-0 border-b border-border bg-muted/20 p-5 sm:p-6 pb-4">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <Plus className="h-4 w-4" />
                                </div>
                                <DialogTitle className="text-lg font-bold text-foreground">
                                    Add Calendar Event
                                </DialogTitle>
                            </div>
                            <DialogDescription className="mt-1 text-xs text-muted-foreground">
                                Add an event to your marketing schedule. Events exist independently and can be selected by future campaigns.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Category Selector Tabs */}
                        <div className="shrink-0 border-b border-border/70 bg-muted/10 p-3">
                            <div className="grid grid-cols-3 gap-1 rounded-2xl border border-border/80 bg-muted/30 p-1 text-xs">
                                <button
                                    type="button"
                                    onClick={() => setCreateCategory('holiday')}
                                    className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-1.5 font-semibold transition-all ${
                                        createCategory === 'holiday'
                                            ? 'bg-card text-foreground shadow-2xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <PartyPopper className="h-3.5 w-3.5 text-rose-500" />
                                    <span>Philippine Holiday</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setCreateCategory('commercial')}
                                    className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-1.5 font-semibold transition-all ${
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
                                    onClick={() => setCreateCategory('custom')}
                                    className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-1.5 font-semibold transition-all ${
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
                            {createCategory === 'holiday' ? (
                                <div className="space-y-3">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Select from Philippine Holiday Catalog
                                    </Label>
                                    <p className="text-[11px] text-muted-foreground">
                                        Official Philippine holidays are curated from the official catalog to avoid duplicate entries.
                                    </p>

                                    <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-xl border border-border p-2">
                                        {holiday_catalog.map((h) => {
                                            const isSelected = createForm.name === h.name;
                                            return (
                                                <div
                                                    key={h.name}
                                                    onClick={() => handleSelectCatalogHoliday(h)}
                                                    className={`flex cursor-pointer items-center justify-between rounded-lg p-2.5 transition-all text-xs ${
                                                        isSelected
                                                            ? 'bg-primary/10 border border-primary/30 text-primary font-semibold'
                                                            : 'hover:bg-muted/40 text-foreground'
                                                    }`}
                                                >
                                                    <div>
                                                        <p>{h.name}</p>
                                                        <p className="text-[10px] text-muted-foreground">{h.date}</p>
                                                    </div>
                                                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : null}

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
                                            ? 'e.g., Payday Flash Sale, Black Friday Mega Promo'
                                            : 'e.g., Shop Anniversary, Grand Reopening'
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
                                className="bg-primary text-xs font-semibold text-primary-foreground"
                            >
                                {isSubmitting ? 'Saving...' : 'Save Event'}
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
