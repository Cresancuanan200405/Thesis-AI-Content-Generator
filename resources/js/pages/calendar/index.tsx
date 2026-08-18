import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Filter,
    Info,
    Layers,
    Loader2,
    Plus,
    Sparkles,
    Tag,
    Trash2,
    X,
} from 'lucide-react';
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
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

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

type CalendarEvent = {
    id: string | number;
    name: string;
    date: string;
    description?: string | null;
    type?: string | null;
    days?: string | null;
};

type FormData = {
    name: string;
    date: string;
    description: string;
    type: string;
};

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const weekdayLabels = [
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
    'Sun',
];

const eventTypeStyles: Record<string, string> = {
    holiday:
        'border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300',

    seasonal:
        'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',

    commercial:
        'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300',

    custom:
        'border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300',
};

const eventTypeLabels: Record<string, string> = {
    holiday: 'Holiday',
    seasonal: 'Seasonal',
    commercial: 'Commercial',
    custom: 'Custom',
};

const filterOptions = [
    {
        value: 'all',
        label: 'All events',
    },
    {
        value: 'holidays',
        label: 'Holidays',
    },
    {
        value: 'commercial',
        label: 'Commercial',
    },
    {
        value: 'custom',
        label: 'Custom',
    },
];

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const emptyForm: FormData = {
    name: '',
    date: '',
    description: '',
    type: 'custom',
};

function formatDateForInput(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function formatLongDate(date: Date) {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatEventDate(date: string) {
    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return date;
    }

    return parsed.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function getEventTypeLabel(type?: string | null) {
    if (!type) {
        return 'Custom';
    }

    return (
        eventTypeLabels[type] ??
        type.charAt(0).toUpperCase() + type.slice(1)
    );
}

function getEventTypeClass(type?: string | null) {
    return (
        eventTypeStyles[type ?? 'custom'] ??
        'border-border bg-muted text-muted-foreground'
    );
}

function sortEventsByDate(events: CalendarEvent[]) {
    return [...events].sort((a, b) => {
        const aDate = a.date ? new Date(a.date).getTime() : Number.MAX_SAFE_INTEGER;
        const bDate = b.date ? new Date(b.date).getTime() : Number.MAX_SAFE_INTEGER;

        return aDate - bDate;
    });
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function CalendarPage({
    events: initialEvents = [],
    filter = 'all',
    upcoming_events = [],
}: any) {
    /*
    |--------------------------------------------------------------------------
    | Calendar state
    |--------------------------------------------------------------------------
    */

    const [month, setMonth] = useState(
        () =>
            new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                1,
            ),
    );

    const [allEvents, setAllEvents] = useState<CalendarEvent[]>(
        sortEventsByDate(initialEvents),
    );

    const [isLoadingYear, setIsLoadingYear] =
        useState(false);

    const loadedYearsRef = useRef<Set<number>>(
        new Set([new Date().getFullYear()]),
    );

    /*
    |--------------------------------------------------------------------------
    | Create event state
    |--------------------------------------------------------------------------
    */

    const [isCreateDialogOpen, setIsCreateDialogOpen] =
        useState(false);

    const [isCreatingEvent, setIsCreatingEvent] =
        useState(false);

    const [formData, setFormData] =
        useState<FormData>(emptyForm);

    const [formErrors, setFormErrors] =
        useState<Record<string, string>>({});

    /*
    |--------------------------------------------------------------------------
    | Selected calendar day state
    |--------------------------------------------------------------------------
    */

    const [selectedDate, setSelectedDate] =
        useState<Date | null>(null);

    const [isDayDialogOpen, setIsDayDialogOpen] =
        useState(false);

    /*
    |--------------------------------------------------------------------------
    | Selected event state
    |--------------------------------------------------------------------------
    */

    const [selectedEvent, setSelectedEvent] =
        useState<CalendarEvent | null>(null);

    const [isEventDialogOpen, setIsEventDialogOpen] =
        useState(false);

    /*
    |--------------------------------------------------------------------------
    | Delete event state
    |--------------------------------------------------------------------------
    */

    const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);
    const [isDeletingEvent, setIsDeletingEvent] = useState(false);

    const handleDeleteEvent = () => {
        if (!eventToDelete) return;
        setIsDeletingEvent(true);
        router.delete(`/events/${eventToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                const deletedId = eventToDelete.id;
                setAllEvents((prev) => prev.filter((e) => e.id !== deletedId));
                setIsEventDialogOpen(false);
                setEventToDelete(null);
                toast.success('Event deleted successfully.');
            },
            onError: () => {
                toast.error('Failed to delete event.');
            },
            onFinish: () => {
                setIsDeletingEvent(false);
            },
        });
    };

    /*
    |--------------------------------------------------------------------------
    | Create campaign from event state
    |--------------------------------------------------------------------------
    */

    const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
    const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
    const [campaignFormData, setCampaignFormData] = useState({
        name: '',
        event_id: '',
        start_date: '',
        end_date: '',
        status: 'draft',
    });
    const [campaignErrors, setCampaignErrors] = useState<Record<string, string>>({});

    const openCreateCampaignFromEvent = (event: CalendarEvent) => {
        const defaultDate = event.date ?? '';
        setCampaignFormData({
            name: `${event.name} Campaign`,
            event_id: String(event.id),
            start_date: defaultDate,
            end_date: defaultDate,
            status: 'draft',
        });
        setCampaignErrors({});
        setIsCampaignDialogOpen(true);
    };

    const handleCreateCampaignSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isCreatingCampaign) return;

        if (!campaignFormData.name.trim()) {
            setCampaignErrors({ name: 'Campaign name is required.' });
            return;
        }

        setIsCreatingCampaign(true);
        setCampaignErrors({});

        router.post(
            '/campaigns',
            {
                name: campaignFormData.name.trim(),
                event_id: campaignFormData.event_id ? Number(campaignFormData.event_id) : null,
                start_date: campaignFormData.start_date || null,
                end_date: campaignFormData.end_date || null,
                status: campaignFormData.status,
            },
            {
                onSuccess: () => {
                    setIsCampaignDialogOpen(false);
                    setIsEventDialogOpen(false);
                    toast.success('Campaign created successfully!');
                },
                onError: (errs) => {
                    setCampaignErrors(errs);
                    toast.error('Failed to create campaign. Please check inputs.');
                },
                onFinish: () => {
                    setIsCreatingCampaign(false);
                },
            },
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Today's date
    |--------------------------------------------------------------------------
    */

    const today = useMemo(() => {
        const date = new Date();

        return new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
        );
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Minimum create-event date
    |--------------------------------------------------------------------------
    */

    const minimumEventDate = useMemo(() => {
        const tomorrow = new Date();

        tomorrow.setDate(tomorrow.getDate() + 1);

        return formatDateForInput(tomorrow);
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Load events for a specific year
    |--------------------------------------------------------------------------
    */

    const loadYearEvents = useCallback(
        async (
            year: number,
            currentFilter: string,
        ) => {
            if (loadedYearsRef.current.has(year)) {
                return;
            }

            setIsLoadingYear(true);

            try {
                const params = new URLSearchParams({
                    year: year.toString(),
                    filter: currentFilter || 'all',
                });

                const response = await fetch(
                    `/calendar/events-year?${params}`,
                    {
                        method: 'GET',
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With':
                                'XMLHttpRequest',
                        },
                    },
                );

                if (!response.ok) {
                    console.error(
                        `Failed to load events for year ${year}`,
                    );

                    return;
                }

                const data = await response.json();

                setAllEvents((previousEvents) => {
                    const eventIds = new Set(
                        previousEvents.map(
                            (event) => event.id,
                        ),
                    );

                    const newEvents = (
                        data.events ?? []
                    ).filter(
                        (event: CalendarEvent) =>
                            !eventIds.has(event.id),
                    );

                    return sortEventsByDate([
                        ...previousEvents,
                        ...newEvents,
                    ]);
                });

                loadedYearsRef.current.add(year);
            } catch (error) {
                console.error(
                    `Error loading events for year ${year}:`,
                    error,
                );
            } finally {
                setIsLoadingYear(false);
            }
        },
        [],
    );

    /*
    |--------------------------------------------------------------------------
    | Auto-load events when month changes
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const year = month.getFullYear();
        const timeoutId = window.setTimeout(() => {
            void loadYearEvents(year, filter);
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [
        month,
        filter,
        loadYearEvents,
    ]);

    /*
    |--------------------------------------------------------------------------
    | Filter
    |--------------------------------------------------------------------------
    */

    const changeFilter = (value: string) => {
        router.get(
            '/calendar',
            {
                filter:
                    value === 'all'
                        ? ''
                        : value,
            },
            {
                preserveScroll: true,
                replace: true,
            },
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Apply filter
    |--------------------------------------------------------------------------
    */

    const filteredEvents = useMemo(() => {
        const sortedEvents =
            filter === 'holidays'
                ? allEvents.filter(
                      (event) =>
                          event.type === 'holiday' ||
                          event.type === 'seasonal',
                  )
                : filter === 'commercial'
                  ? allEvents.filter(
                        (event) =>
                            event.type === 'commercial',
                    )
                  : filter === 'custom'
                    ? allEvents.filter(
                          (event) =>
                              event.type === 'custom',
                      )
                    : allEvents;

        return sortEventsByDate(sortedEvents);
    }, [
        allEvents,
        filter,
    ]);

    /*
    |--------------------------------------------------------------------------
    | Calendar calculation
    |--------------------------------------------------------------------------
    */

    const monthView = useMemo(() => {
        const year = month.getFullYear();
        const monthIndex = month.getMonth();

        const firstDay = new Date(
            year,
            monthIndex,
            1,
        );

        const lastDay = new Date(
            year,
            monthIndex + 1,
            0,
        );

        const daysInMonth =
            lastDay.getDate();

        const leadingDays =
            (firstDay.getDay() + 6) % 7;

        const totalCells =
            Math.ceil(
                (leadingDays +
                    daysInMonth) /
                    7,
            ) * 7;

        const cells = Array.from(
            {
                length: totalCells,
            },
            (_, index) => {
                const dateIndex =
                    index -
                    leadingDays +
                    1;

                const date = new Date(
                    year,
                    monthIndex,
                    dateIndex,
                );

                return {
                    date,
                    currentMonth:
                        date.getMonth() ===
                        monthIndex,
                };
            },
        );

        const datesByKey = new Map<
            string,
            CalendarEvent[]
        >();

        for (const event of filteredEvents) {
            if (!event.date) {
                continue;
            }

            const eventDate =
                new Date(event.date);

            if (
                Number.isNaN(
                    eventDate.getTime(),
                )
            ) {
                continue;
            }

            const key =
                eventDate.toDateString();

            const current =
                datesByKey.get(key) ?? [];

            current.push(event);

            datesByKey.set(
                key,
                current,
            );
        }

        return {
            cells,
            datesByKey,
        };
    }, [
        filteredEvents,
        month,
    ]);

    /*
    |--------------------------------------------------------------------------
    | Month label
    |--------------------------------------------------------------------------
    */

    const monthLabel =
        month.toLocaleString(
            'en-US',
            {
                month: 'long',
                year: 'numeric',
            },
        );

    /*
    |--------------------------------------------------------------------------
    | Navigation
    |--------------------------------------------------------------------------
    */

    const previousMonth = () => {
        setMonth(
            new Date(
                month.getFullYear(),
                month.getMonth() - 1,
                1,
            ),
        );
    };

    const nextMonth = () => {
        setMonth(
            new Date(
                month.getFullYear(),
                month.getMonth() + 1,
                1,
            ),
        );
    };

    const goToToday = () => {
        const currentDate =
            new Date();

        setMonth(
            new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                1,
            ),
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Calendar helpers
    |--------------------------------------------------------------------------
    */

    const isToday = (
        date: Date,
    ) => {
        return (
            date.toDateString() ===
            today.toDateString()
        );
    };

    const isCurrentMonth = (
        date: Date,
    ) => {
        return (
            date.getMonth() ===
                month.getMonth() &&
            date.getFullYear() ===
                month.getFullYear()
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Get events for selected date
    |--------------------------------------------------------------------------
    */

    const selectedDateEvents = useMemo(() => {
        if (!selectedDate) {
            return [];
        }

        return (
            monthView.datesByKey.get(
                selectedDate.toDateString(),
            ) ?? []
        );
    }, [
        selectedDate,
        monthView.datesByKey,
    ]);

    /*
    |--------------------------------------------------------------------------
    | Open day details
    |--------------------------------------------------------------------------
    */

    const openDayDetails = (
        date: Date,
    ) => {
        setSelectedDate(date);
        setIsDayDialogOpen(true);
    };

    /*
    |--------------------------------------------------------------------------
    | Open event details
    |--------------------------------------------------------------------------
    */

    const openEventDetails = (
        event: CalendarEvent,
    ) => {
        setSelectedEvent(event);
        setIsEventDialogOpen(true);
    };

    /*
    |--------------------------------------------------------------------------
    | Open create dialog
    |--------------------------------------------------------------------------
    */

    const openCreateDialog = (
        date?: Date,
    ) => {
        const eventDate =
            date &&
            date > today
                ? formatDateForInput(date)
                : '';

        setFormData({
            ...emptyForm,
            date: eventDate,
        });

        setFormErrors({});

        setIsDayDialogOpen(false);

        setIsCreateDialogOpen(true);
    };

    /*
    |--------------------------------------------------------------------------
    | Close create dialog
    |--------------------------------------------------------------------------
    */

    const closeCreateDialog = () => {
        if (isCreatingEvent) {
            return;
        }

        setIsCreateDialogOpen(false);
        setFormData(emptyForm);
        setFormErrors({});
    };

    /*
    |--------------------------------------------------------------------------
    | Form validation
    |--------------------------------------------------------------------------
    */

    const validateForm = () => {
        const errors: Record<
            string,
            string
        > = {};

        const trimmedName =
            formData.name.trim();

        if (!trimmedName) {
            errors.name =
                'Event name is required.';
        } else if (
            trimmedName.length > 100
        ) {
            errors.name =
                'Event name must not exceed 100 characters.';
        }

        if (!formData.date) {
            errors.date =
                'Event date is required.';
        } else {
            const selectedDateValue = new Date(
                `${formData.date}T00:00:00`,
            );

            const current =
                new Date();

            current.setHours(
                0,
                0,
                0,
                0,
            );

            if (selectedDateValue <= current) {
                errors.date =
                    'Event date must be in the future.';
            }
        }

        if (
            formData.description.length >
            500
        ) {
            errors.description =
                'Description must not exceed 500 characters.';
        }

        const allowedTypes = [
            'holiday',
            'seasonal',
            'commercial',
            'custom',
        ];

        if (
            formData.type &&
            !allowedTypes.includes(
                formData.type,
            )
        ) {
            errors.type =
                'Invalid event type.';
        }

        setFormErrors(errors);

        return (
            Object.keys(errors).length ===
            0
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Create event
    |--------------------------------------------------------------------------
    */

    const handleCreateEvent = async () => {
        if (!validateForm()) {
            return;
        }

        const csrfToken =
            document.head
                .querySelector(
                    'meta[name="csrf-token"]',
                )
                ?.getAttribute(
                    'content',
                ) ?? '';

        setIsCreatingEvent(true);

        try {
            const response =
                await fetch(
                    '/events',
                    {
                        method: 'POST',
                        credentials:
                            'same-origin',
                        headers: {
                            'Content-Type':
                                'application/json',
                            Accept:
                                'application/json',
                            'X-Requested-With':
                                'XMLHttpRequest',
                            'X-CSRF-TOKEN':
                                csrfToken,
                        },
                        body: JSON.stringify(
                            {
                                name: formData.name.trim(),
                                date: formData.date,
                                description:
                                    formData.description.trim(),
                                type:
                                    formData.type ||
                                    'custom',
                            },
                        ),
                    },
                );

            let data: any = {};

            try {
                data =
                    await response.json();
            } catch {
                data = {};
            }

            if (!response.ok) {
                const backendErrors =
                    data.errors ?? {};

                const normalizedErrors: Record<
                    string,
                    string
                > = {};

                Object.entries(
                    backendErrors,
                ).forEach(
                    ([
                        field,
                        message,
                    ]) => {
                        normalizedErrors[
                            field
                        ] = Array.isArray(
                            message,
                        )
                            ? String(
                                  message[0],
                              )
                            : String(
                                  message,
                              );
                    },
                );

                if (
                    data.message &&
                    Object.keys(
                        normalizedErrors,
                    ).length === 0
                ) {
                    normalizedErrors.submit =
                        data.message;
                }

                setFormErrors(
                    normalizedErrors,
                );

                return;
            }

            const newEvent =
                data.event;

            if (newEvent) {
                setAllEvents(
                    (previous) => {
                        const exists =
                            previous.some(
                                (event) =>
                                    event.id ===
                                    newEvent.id,
                            );

                        if (exists) {
                            return previous;
                        }

                        return [
                            ...previous,
                            newEvent,
                        ];
                    },
                );
            }

            setIsCreateDialogOpen(false);

            setFormData(
                emptyForm,
            );

            setFormErrors({});
        } catch (error) {
            console.error(
                'Error creating event:',
                error,
            );

            setFormErrors({
                submit:
                    'Unable to create the event. Please try again.',
            });
        } finally {
            setIsCreatingEvent(
                false,
            );
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Upcoming events
    |--------------------------------------------------------------------------
    */

    const sortedUpcomingEvents = useMemo(() => {
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;

        const futureEvents = allEvents.filter(
            (ev) => (ev.date ?? '') >= todayStr,
        );

        return sortEventsByDate(futureEvents)
            .slice(0, 10)
            .map((ev) => {
                let daysText = ev.days;
                if (!daysText && ev.date) {
                    const eventDate = new Date(`${ev.date}T00:00:00`);
                    const diffTime = eventDate.getTime() - todayDate.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    daysText =
                        diffDays === 0
                            ? 'Today'
                            : diffDays === 1
                              ? 'Tomorrow'
                              : `${diffDays} days left`;
                }

                return {
                    ...ev,
                    days: daysText,
                };
            });
    }, [allEvents]);

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <>
            <Head title="Marketing Calendar" />

            <div className="min-h-screen bg-background text-foreground">
                <div
                    className="
                        space-y-6
                        p-4
                        md:space-y-8
                        md:p-6
                        lg:p-8
                    "
                >
                    {/* =====================================================
                        HERO HEADER
                    ====================================================== */}

                    <section
                        className="
                            relative
                            overflow-hidden
                            rounded-3xl
                            border
                            border-border
                            bg-card
                            shadow-sm
                        "
                    >
                        <div
                            className="
                                pointer-events-none
                                absolute
                                -right-24
                                -top-24
                                h-72
                                w-72
                                rounded-full
                                bg-primary/10
                                blur-3xl
                            "
                        />

                        <div
                            className="
                                pointer-events-none
                                absolute
                                -bottom-32
                                left-1/3
                                h-64
                                w-64
                                rounded-full
                                bg-violet-500/5
                                blur-3xl
                            "
                        />

                        <div
                            className="
                                relative
                                flex
                                flex-col
                                gap-6
                                p-6
                                md:p-8
                                lg:flex-row
                                lg:items-end
                                lg:justify-between
                            "
                        >
                            <div className="max-w-3xl">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="
                                            flex
                                            h-11
                                            w-11
                                            items-center
                                            justify-center
                                            rounded-2xl
                                            bg-primary/10
                                            text-primary
                                        "
                                    >
                                        <CalendarDays className="h-5 w-5" />
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                                            Marketing Calendar
                                        </p>

                                        <p className="text-xs text-muted-foreground">
                                            Campaign planning workspace
                                        </p>
                                    </div>
                                </div>

                                <h1
                                    className="
                                        mt-5
                                        text-3xl
                                        font-semibold
                                        tracking-tight
                                        md:text-4xl
                                    "
                                >
                                    Plan around the moments
                                    that matter.
                                </h1>

                                <p
                                    className="
                                        mt-3
                                        max-w-2xl
                                        text-sm
                                        leading-6
                                        text-muted-foreground
                                        md:text-base
                                    "
                                >
                                    Organize holidays,
                                    seasonal opportunities,
                                    commercial moments,
                                    and your own campaign
                                    events in one place.
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        changeFilter(
                                            'all',
                                        )
                                    }
                                    className="gap-2"
                                >
                                    <Filter className="h-4 w-4" />

                                    {filter === 'all'
                                        ? 'All events'
                                        : filter}
                                </Button>

                                <Button
                                    onClick={() =>
                                        openCreateDialog()
                                    }
                                    className="
                                        gap-2
                                        shadow-sm
                                    "
                                >
                                    <Plus className="h-4 w-4" />

                                    Create Event
                                </Button>

                                <Button
                                    asChild
                                    variant="outline"
                                    className="gap-2"
                                >
                                    <Link href="/generator">
                                        Create asset

                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </section>

                    {/* =====================================================
                        MAIN GRID
                    ====================================================== */}

                    <div
                        className="
                            grid
                            gap-6
                            xl:grid-cols-[minmax(0,1.5fr)_360px]
                        "
                    >
                        {/* =================================================
                            CALENDAR CARD
                        ================================================== */}

                        <Card
                            className="
                                overflow-hidden
                                rounded-3xl
                                border-border
                                shadow-sm
                            "
                        >
                            <CardHeader
                                className="
                                    border-b
                                    border-border
                                    p-5
                                    md:p-6
                                "
                            >
                                <div className="flex flex-col gap-5">
                                    <div
                                        className="
                                            flex
                                            flex-col
                                            gap-4
                                            lg:flex-row
                                            lg:items-center
                                            lg:justify-between
                                        "
                                    >
                                        <div>
                                            <CardTitle className="text-xl">
                                                Event timeline
                                            </CardTitle>

                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Click any day to
                                                inspect events or
                                                create a new one.
                                            </p>
                                        </div>

                                        <div
                                            className="
                                                flex
                                                flex-wrap
                                                gap-1.5
                                                rounded-xl
                                                bg-muted/50
                                                p-1
                                            "
                                        >
                                            {filterOptions.map(
                                                (
                                                    item,
                                                ) => {
                                                    const active =
                                                        filter ===
                                                        item.value;

                                                    return (
                                                        <button
                                                            key={
                                                                item.value
                                                            }
                                                            type="button"
                                                            onClick={() =>
                                                                changeFilter(
                                                                    item.value,
                                                                )
                                                            }
                                                            className={`
                                                                rounded-lg
                                                                px-3
                                                                py-1.5
                                                                text-xs
                                                                font-medium
                                                                transition-all

                                                                ${
                                                                    active
                                                                        ? 'bg-background text-foreground shadow-sm'
                                                                        : 'text-muted-foreground hover:text-foreground'
                                                                }
                                                            `}
                                                        >
                                                            {
                                                                item.label
                                                            }
                                                        </button>
                                                    );
                                                },
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-5 p-4 md:p-6">
                                {/* Month toolbar */}

                                <div
                                    className="
                                        flex
                                        items-center
                                        justify-between
                                        rounded-2xl
                                        border
                                        border-border
                                        bg-muted/20
                                        p-2
                                    "
                                >
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={
                                            previousMonth
                                        }
                                        disabled={
                                            isLoadingYear
                                        }
                                        className="h-9 w-9 rounded-xl"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>

                                    <div className="text-center">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                            Calendar
                                        </p>

                                        <h2 className="mt-0.5 text-lg font-semibold">
                                            {
                                                monthLabel
                                            }
                                        </h2>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={
                                                goToToday
                                            }
                                            disabled={
                                                isLoadingYear
                                            }
                                            className="hidden sm:inline-flex"
                                        >
                                            Today
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={
                                                nextMonth
                                            }
                                            disabled={
                                                isLoadingYear
                                            }
                                            className="h-9 w-9 rounded-xl"
                                        >
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Weekdays */}

                                <div className="grid grid-cols-7 gap-2">
                                    {weekdayLabels.map(
                                        (
                                            weekday,
                                        ) => (
                                            <div
                                                key={
                                                    weekday
                                                }
                                                className="
                                                    py-1
                                                    text-center
                                                    text-[10px]
                                                    font-semibold
                                                    uppercase
                                                    tracking-wide
                                                    text-muted-foreground
                                                "
                                            >
                                                {
                                                    weekday
                                                }
                                            </div>
                                        ),
                                    )}
                                </div>

                                {/* Calendar */}

                                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                                    {monthView.cells.map(
                                        (
                                            {
                                                date,
                                            },
                                            index,
                                        ) => {
                                            const dateKey =
                                                date.toDateString();

                                            const dayEvents =
                                                monthView
                                                    .datesByKey
                                                    .get(
                                                        dateKey,
                                                    ) ??
                                                [];

                                            const todayDate =
                                                isToday(
                                                    date,
                                                );

                                            const inMonth =
                                                isCurrentMonth(
                                                    date,
                                                );

                                            return (
                                                <button
                                                    key={`${dateKey}-${index}`}
                                                    type="button"
                                                    onClick={() =>
                                                        openDayDetails(
                                                            date,
                                                        )
                                                    }
                                                    className={`
                                                        group
                                                        relative
                                                        min-h-[105px]
                                                        overflow-hidden
                                                        rounded-2xl
                                                        border
                                                        p-2
                                                        text-left
                                                        transition-all
                                                        duration-200
                                                        sm:min-h-[125px]
                                                        sm:p-2.5

                                                        ${
                                                            inMonth
                                                                ? 'border-border bg-background hover:-translate-y-0.5 hover:border-primary/30 hover:bg-muted/20 hover:shadow-md'
                                                                : 'border-border/40 bg-muted/10 text-muted-foreground'
                                                        }

                                                        ${
                                                            todayDate
                                                                ? 'border-primary/40 bg-primary/[0.04] ring-1 ring-primary/20'
                                                                : ''
                                                        }
                                                    `}
                                                >
                                                    {/* Today marker */}

                                                    {todayDate && (
                                                        <span
                                                            className="
                                                                absolute
                                                                right-2.5
                                                                top-2.5
                                                                h-1.5
                                                                w-1.5
                                                                rounded-full
                                                                bg-primary
                                                            "
                                                        />
                                                    )}

                                                    {/* Date */}

                                                    <div className="mb-2 flex items-center justify-between">
                                                        <span
                                                            className={`
                                                                flex
                                                                h-7
                                                                min-w-7
                                                                items-center
                                                                justify-center
                                                                rounded-full
                                                                px-1.5
                                                                text-xs
                                                                font-semibold

                                                                ${
                                                                    todayDate
                                                                        ? 'bg-primary text-primary-foreground'
                                                                        : inMonth
                                                                          ? 'text-foreground'
                                                                          : 'text-muted-foreground'
                                                                }
                                                            `}
                                                        >
                                                            {
                                                                date.getDate()
                                                            }
                                                        </span>

                                                        {dayEvents.length >
                                                            0 && (
                                                            <span
                                                                className="
                                                                    text-[9px]
                                                                    font-medium
                                                                    text-muted-foreground
                                                                "
                                                            >
                                                                {
                                                                    dayEvents.length
                                                                }{' '}
                                                                {dayEvents.length ===
                                                                1
                                                                    ? 'event'
                                                                    : 'events'}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Events */}

                                                    <div className="space-y-1">
                                                        {dayEvents
                                                            .slice(
                                                                0,
                                                                3,
                                                            )
                                                            .map(
                                                                (
                                                                    event,
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            event.id
                                                                        }
                                                                        title={
                                                                            event.name
                                                                        }
                                                                        className={`
                                                                            truncate
                                                                            rounded-lg
                                                                            border
                                                                            px-2
                                                                            py-1.5
                                                                            text-[9px]
                                                                            font-medium
                                                                            leading-3
                                                                            transition-all
                                                                            sm:text-[10px]

                                                                            ${getEventTypeClass(
                                                                                event.type,
                                                                            )}
                                                                        `}
                                                                    >
                                                                        {
                                                                            event.name
                                                                        }
                                                                    </div>
                                                                ),
                                                            )}

                                                        {dayEvents.length >
                                                            3 && (
                                                            <div className="px-1 text-[9px] font-semibold text-muted-foreground">
                                                                +
                                                                {dayEvents.length -
                                                                    3}{' '}
                                                                more
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Click hint */}

                                                    <div
                                                        className="
                                                            pointer-events-none
                                                            absolute
                                                            bottom-2
                                                            right-2
                                                            opacity-0
                                                            transition-opacity
                                                            group-hover:opacity-100
                                                        "
                                                    >
                                                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                                    </div>
                                                </button>
                                            );
                                        },
                                    )}
                                </div>

                                {/* Legend */}

                                <div
                                    className="
                                        flex
                                        flex-wrap
                                        items-center
                                        gap-x-5
                                        gap-y-2
                                        border-t
                                        border-border
                                        pt-4
                                    "
                                >
                                    <span className="text-[11px] font-semibold text-muted-foreground">
                                        Event types
                                    </span>

                                    {Object.entries(
                                        eventTypeStyles,
                                    ).map(
                                        ([
                                            type,
                                            styles,
                                        ]) => (
                                            <div
                                                key={
                                                    type
                                                }
                                                className="flex items-center gap-1.5"
                                            >
                                                <span
                                                    className={`
                                                        h-2
                                                        w-2
                                                        rounded-full
                                                        ${styles
                                                            .split(
                                                                ' ',
                                                            )
                                                            .filter(
                                                                (
                                                                    item,
                                                                ) =>
                                                                    item.startsWith(
                                                                        'bg-',
                                                                    ),
                                                            )
                                                            .join(
                                                                ' ',
                                                            )}
                                                    `}
                                                />

                                                <span className="text-[11px] capitalize text-muted-foreground">
                                                    {
                                                        type
                                                    }
                                                </span>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* =================================================
                            RIGHT SIDEBAR
                        ================================================== */}

                        <div className="space-y-6">
                            {/* Upcoming */}

                            <Card className="overflow-hidden rounded-3xl border-border shadow-sm">
                                <CardHeader className="border-b border-border p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                    <Sparkles className="h-4 w-4" />
                                                </div>

                                                Upcoming
                                            </CardTitle>

                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Your next marketing
                                                opportunities.
                                            </p>
                                        </div>

                                        {sortedUpcomingEvents.length >
                                            0 && (
                                            <Badge variant="secondary">
                                                {
                                                    sortedUpcomingEvents.length
                                                }
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>

                                <CardContent className="p-4">
                                    {sortedUpcomingEvents.length ===
                                    0 ? (
                                        <div
                                            className="
                                                rounded-2xl
                                                border
                                                border-dashed
                                                border-border
                                                bg-muted/20
                                                p-6
                                                text-center
                                            "
                                        >
                                            <CalendarDays className="mx-auto h-6 w-6 text-muted-foreground" />

                                            <p className="mt-3 text-sm font-medium">
                                                No upcoming events
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                                Create an event to
                                                start planning your
                                                next campaign.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {sortedUpcomingEvents.map(
                                                (
                                                    event: CalendarEvent,
                                                ) => (
                                                    <button
                                                        key={
                                                            event.id
                                                        }
                                                        type="button"
                                                        onClick={() =>
                                                            openEventDetails(
                                                                event,
                                                            )
                                                        }
                                                        className="
                                                            w-full
                                                            rounded-2xl
                                                            border
                                                            border-border
                                                            bg-background
                                                            p-3
                                                            text-left
                                                            transition-all
                                                            hover:-translate-y-0.5
                                                            hover:bg-muted/20
                                                            hover:shadow-sm
                                                        "
                                                    >
                                                        <div className="flex gap-3">
                                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                                <CalendarDays className="h-4 w-4" />
                                                            </div>

                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <p className="truncate text-sm font-semibold">
                                                                        {
                                                                            event.name
                                                                        }
                                                                    </p>

                                                                    <Badge
                                                                        variant="outline"
                                                                        className="shrink-0 text-[9px]"
                                                                    >
                                                                        {getEventTypeLabel(
                                                                            event.type,
                                                                        )}
                                                                    </Badge>
                                                                </div>

                                                                <p className="mt-1 text-xs font-medium text-foreground">
                                                                    {formatEventDate(
                                                                        event.date,
                                                                    )}
                                                                </p>

                                                                {event.days && (
                                                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                                        {
                                                                            event.days
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                ),
                                            )}
                                        </div>
                                    )}

                                    <Button
                                        onClick={() =>
                                            openCreateDialog()
                                        }
                                        variant="outline"
                                        className="mt-4 w-full gap-2"
                                    >
                                        <Plus className="h-4 w-4" />

                                        Add event
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Quick planning card */}

                            <Card className="rounded-3xl border-border bg-muted/20 shadow-none">
                                <CardContent className="p-5">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm">
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>

                                        <div>
                                            <p className="text-sm font-semibold">
                                                Planning tip
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                                Click a calendar date
                                                to see all holidays
                                                and marketing events
                                                scheduled for that
                                                day.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            {/* =============================================================
                DAY DETAILS DIALOG
            ============================================================= */}

            <Dialog
                open={isDayDialogOpen}
                onOpenChange={
                    setIsDayDialogOpen
                }
            >
                <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl sm:max-w-lg">
                    <DialogHeader>
                        <div className="flex items-start gap-3">
                            <div
                                className="
                                    flex
                                    h-11
                                    w-11
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-2xl
                                    bg-primary/10
                                    text-primary
                                "
                            >
                                <CalendarDays className="h-5 w-5" />
                            </div>

                            <div>
                                <DialogTitle className="text-xl">
                                    {selectedDate
                                        ? formatLongDate(
                                              selectedDate,
                                          )
                                        : 'Day details'}
                                </DialogTitle>

                                <DialogDescription>
                                    {selectedDateEvents.length >
                                    0
                                        ? `${selectedDateEvents.length} ${
                                              selectedDateEvents.length ===
                                              1
                                                  ? 'event'
                                                  : 'events'
                                          } scheduled for this day.`
                                        : 'There are no events scheduled for this day.'}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {selectedDateEvents.length ===
                    0 ? (
                        <div className="py-5">
                            <div
                                className="
                                    rounded-2xl
                                    border
                                    border-dashed
                                    border-border
                                    bg-muted/20
                                    p-8
                                    text-center
                                "
                            >
                                <div
                                    className="
                                        mx-auto
                                        flex
                                        h-12
                                        w-12
                                        items-center
                                        justify-center
                                        rounded-2xl
                                        bg-background
                                        shadow-sm
                                    "
                                >
                                    <CalendarDays className="h-5 w-5 text-muted-foreground" />
                                </div>

                                <h3 className="mt-4 text-sm font-semibold">
                                    Nothing scheduled
                                </h3>

                                <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
                                    Use this date for a
                                    campaign, promotion,
                                    launch, or other marketing
                                    activity.
                                </p>

                                <Button
                                    onClick={() =>
                                        selectedDate &&
                                        openCreateDialog(
                                            selectedDate,
                                        )
                                    }
                                    className="mt-5 gap-2"
                                >
                                    <Plus className="h-4 w-4" />

                                    Create event
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {selectedDateEvents.map(
                                (
                                    event,
                                ) => (
                                    <button
                                        key={
                                            event.id
                                        }
                                        type="button"
                                        onClick={() =>
                                            openEventDetails(
                                                event,
                                            )
                                        }
                                        className="
                                            w-full
                                            rounded-2xl
                                            border
                                            border-border
                                            bg-background
                                            p-4
                                            text-left
                                            transition-all
                                            hover:-translate-y-0.5
                                            hover:bg-muted/20
                                            hover:shadow-sm
                                        "
                                    >
                                        <div className="flex gap-3">
                                            <div
                                                className={`
                                                    flex
                                                    h-10
                                                    w-10
                                                    shrink-0
                                                    items-center
                                                    justify-center
                                                    rounded-xl
                                                    border
                                                    ${getEventTypeClass(
                                                        event.type,
                                                    )}
                                                `}
                                            >
                                                <Tag className="h-4 w-4" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <h3 className="truncate text-sm font-semibold">
                                                            {
                                                                event.name
                                                            }
                                                        </h3>

                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            {getEventTypeLabel(
                                                                event.type,
                                                            )}
                                                        </p>
                                                    </div>

                                                    <Badge
                                                        variant="outline"
                                                        className={`
                                                            shrink-0
                                                            text-[10px]
                                                            ${getEventTypeClass(
                                                                event.type,
                                                            )}
                                                        `}
                                                    >
                                                        {getEventTypeLabel(
                                                            event.type,
                                                        )}
                                                    </Badge>
                                                </div>

                                                {event.description && (
                                                    <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">
                                                        {
                                                            event.description
                                                        }
                                                    </p>
                                                )}

                                                <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-primary">
                                                    <Info className="h-3.5 w-3.5" />

                                                    View event details
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ),
                            )}

                            {selectedDate && (
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        openCreateDialog(
                                            selectedDate,
                                        )
                                    }
                                    className="mt-2 w-full gap-2"
                                >
                                    <Plus className="h-4 w-4" />

                                    Add another event
                                </Button>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* =============================================================
                EVENT DETAILS DIALOG
            ============================================================= */}

            <Dialog
                open={isEventDialogOpen}
                onOpenChange={
                    setIsEventDialogOpen
                }
            >
                <DialogContent className="rounded-3xl sm:max-w-lg">
                    {selectedEvent && (
                        <>
                            <DialogHeader>
                                <div className="flex items-start justify-between gap-3 pr-6">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div
                                            className={`
                                                flex
                                                h-12
                                                w-12
                                                shrink-0
                                                items-center
                                                justify-center
                                                rounded-2xl
                                                border
                                                ${getEventTypeClass(
                                                    selectedEvent.type,
                                                )}
                                            `}
                                        >
                                            <CalendarDays className="h-5 w-5" />
                                        </div>

                                        <div className="min-w-0">
                                            <DialogTitle className="text-xl">
                                                {selectedEvent.name}
                                            </DialogTitle>

                                            <DialogDescription>
                                                Marketing calendar event details
                                            </DialogDescription>
                                        </div>
                                    </div>

                                    {(!selectedEvent.is_global || selectedEvent.type === 'custom') && (
                                        <button
                                            type="button"
                                            onClick={() => setEventToDelete(selectedEvent)}
                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                            title="Delete event"
                                            aria-label="Delete event"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </DialogHeader>

                            <div className="space-y-4">
                                {/* Event type */}

                                <div
                                    className="
                                        flex
                                        items-center
                                        justify-between
                                        rounded-2xl
                                        border
                                        border-border
                                        bg-muted/20
                                        p-4
                                    "
                                >
                                    <div className="flex items-center gap-3">
                                        <Tag className="h-4 w-4 text-muted-foreground" />

                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                Event type
                                            </p>

                                            <p className="mt-0.5 text-sm font-medium">
                                                {getEventTypeLabel(
                                                    selectedEvent.type,
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <Badge
                                        variant="outline"
                                        className={getEventTypeClass(
                                            selectedEvent.type,
                                        )}
                                    >
                                        {getEventTypeLabel(
                                            selectedEvent.type,
                                        )}
                                    </Badge>
                                </div>

                                {/* Date */}

                                <div
                                    className="
                                        flex
                                        items-center
                                        gap-3
                                        rounded-2xl
                                        border
                                        border-border
                                        p-4
                                    "
                                >
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <CalendarDays className="h-4 w-4" />
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                            Date
                                        </p>

                                        <p className="mt-0.5 text-sm font-medium">
                                            {formatEventDate(
                                                selectedEvent.date,
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {/* Description */}

                                <div className="rounded-2xl border border-border p-4">
                                    <div className="flex items-center gap-2">
                                        <Info className="h-4 w-4 text-muted-foreground" />

                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Description
                                        </p>
                                    </div>

                                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                        {selectedEvent.description?.trim()
                                            ? selectedEvent.description
                                            : 'No description was provided for this event.'}
                                    </p>
                                </div>

                                {/* Days */}

                                {selectedEvent.days && (
                                    <div className="flex items-center gap-3 rounded-2xl bg-muted/30 p-4">
                                        <Clock3 className="h-4 w-4 text-muted-foreground" />

                                        <p className="text-sm text-muted-foreground">
                                            {
                                                selectedEvent.days
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                                <Button
                                    onClick={() => {
                                        setIsEventDialogOpen(false);
                                        router.visit(
                                            `/generator?event_id=${selectedEvent.id}&event_name=${encodeURIComponent(
                                                selectedEvent.name,
                                            )}`,
                                        );
                                    }}
                                    className="flex-1 gap-2 rounded-xl shadow-sm"
                                >
                                    <Sparkles className="h-4 w-4" />
                                    Create Visual
                                </Button>

                                <Button
                                    variant="secondary"
                                    onClick={() => openCreateCampaignFromEvent(selectedEvent)}
                                    className="flex-1 gap-2 rounded-xl"
                                >
                                    <Layers className="h-4 w-4" />
                                    Create Campaign
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* =============================================================
                CREATE CAMPAIGN FROM EVENT DIALOG
            ============================================================= */}

            <Dialog
                open={isCampaignDialogOpen}
                onOpenChange={(open) => {
                    if (!open && !isCreatingCampaign) {
                        setIsCampaignDialogOpen(false);
                    }
                }}
            >
                <DialogContent className="rounded-2xl sm:max-w-lg">
                    <form onSubmit={handleCreateCampaignSubmit}>
                        <DialogHeader>
                            <DialogTitle className="text-lg">
                                Create Campaign from Event
                            </DialogTitle>
                            <DialogDescription>
                                Launch a new marketing campaign linked to this event.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="camp-name">Campaign Name</Label>
                                <Input
                                    id="camp-name"
                                    value={campaignFormData.name}
                                    onChange={(e) =>
                                        setCampaignFormData((prev) => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g. Independence Day Big Sale"
                                    disabled={isCreatingCampaign}
                                    className={campaignErrors.name ? 'border-destructive' : ''}
                                />
                                {campaignErrors.name && (
                                    <p className="text-xs text-destructive">
                                        {campaignErrors.name}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="camp-status">Status</Label>
                                <Select
                                    value={campaignFormData.status}
                                    onValueChange={(value) =>
                                        setCampaignFormData((prev) => ({
                                            ...prev,
                                            status: value,
                                        }))
                                    }
                                    disabled={isCreatingCampaign}
                                >
                                    <SelectTrigger id="camp-status">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="camp-start">Start Date</Label>
                                    <Input
                                        id="camp-start"
                                        type="date"
                                        value={campaignFormData.start_date}
                                        onChange={(e) =>
                                            setCampaignFormData((prev) => ({
                                                ...prev,
                                                start_date: e.target.value,
                                            }))
                                        }
                                        disabled={isCreatingCampaign}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="camp-end">End Date</Label>
                                    <Input
                                        id="camp-end"
                                        type="date"
                                        value={campaignFormData.end_date}
                                        onChange={(e) =>
                                            setCampaignFormData((prev) => ({
                                                ...prev,
                                                end_date: e.target.value,
                                            }))
                                        }
                                        disabled={isCreatingCampaign}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="mt-6 gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCampaignDialogOpen(false)}
                                disabled={isCreatingCampaign}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isCreatingCampaign || !campaignFormData.name.trim()}
                                className="gap-2"
                            >
                                {isCreatingCampaign ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Creating Campaign...
                                    </>
                                ) : (
                                    <>
                                        <Layers className="h-4 w-4" />
                                        Create Campaign
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* =============================================================
                DELETE EVENT CONFIRMATION DIALOG
            ============================================================= */}

            <Dialog
                open={!!eventToDelete}
                onOpenChange={(open) => {
                    if (!open && !isDeletingEvent) {
                        setEventToDelete(null);
                    }
                }}
            >
                <DialogContent className="rounded-2xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg">
                            Delete Calendar Event?
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-semibold text-foreground">
                                "{eventToDelete?.name}"
                            </span>
                            ? This event will be removed from your calendar.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="mt-6 gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEventToDelete(null)}
                            disabled={isDeletingEvent}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDeleteEvent}
                            disabled={isDeletingEvent}
                            className="gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            {isDeletingEvent ? 'Deleting...' : 'Delete Event'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =============================================================
                CREATE EVENT DIALOG
            ============================================================= */}

            <Dialog
                open={isCreateDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        closeCreateDialog();
                    } else {
                        setIsCreateDialogOpen(true);
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg">
                    <DialogHeader>
                        <div className="flex items-start gap-3">
                            <div
                                className="
                                    flex
                                    h-11
                                    w-11
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-2xl
                                    bg-primary/10
                                    text-primary
                                "
                            >
                                <Plus className="h-5 w-5" />
                            </div>

                            <div>
                                <DialogTitle className="text-xl">
                                    Create event
                                </DialogTitle>

                                <DialogDescription>
                                    Add a custom marketing
                                    opportunity to your calendar.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-5">
                        {/* Submit error */}

                        {formErrors.submit && (
                            <div
                                className="
                                    rounded-2xl
                                    border
                                    border-destructive/20
                                    bg-destructive/5
                                    p-4
                                    text-sm
                                    text-destructive
                                "
                            >
                                {formErrors.submit}
                            </div>
                        )}

                        {/* Event name */}

                        <div className="space-y-2">
                            <Label htmlFor="event-name">
                                Event name
                                <span className="ml-1 text-destructive">
                                    *
                                </span>
                            </Label>

                            <Input
                                id="event-name"
                                placeholder="e.g. Product launch"
                                value={
                                    formData.name
                                }
                                onChange={(
                                    event,
                                ) => {
                                    setFormData(
                                        (
                                            previous,
                                        ) => ({
                                            ...previous,
                                            name:
                                                event
                                                    .target
                                                    .value,
                                        }),
                                    );

                                    if (
                                        formErrors.name
                                    ) {
                                        setFormErrors(
                                            (
                                                previous,
                                            ) => ({
                                                ...previous,
                                                name: '',
                                            }),
                                        );
                                    }
                                }}
                                disabled={
                                    isCreatingEvent
                                }
                                maxLength={100}
                                className="h-11 rounded-xl"
                            />

                            <div className="flex justify-between">
                                {formErrors.name ? (
                                    <p className="text-xs text-destructive">
                                        {
                                            formErrors.name
                                        }
                                    </p>
                                ) : (
                                    <span />
                                )}

                                <span className="text-[11px] text-muted-foreground">
                                    {
                                        formData
                                            .name
                                            .length
                                    }
                                    /100
                                </span>
                            </div>
                        </div>

                        {/* Date */}

                        <div className="space-y-2">
                            <Label htmlFor="event-date">
                                Date
                                <span className="ml-1 text-destructive">
                                    *
                                </span>
                            </Label>

                            <Input
                                id="event-date"
                                type="date"
                                min={
                                    minimumEventDate
                                }
                                value={
                                    formData.date
                                }
                                onChange={(
                                    event,
                                ) => {
                                    setFormData(
                                        (
                                            previous,
                                        ) => ({
                                            ...previous,
                                            date:
                                                event
                                                    .target
                                                    .value,
                                        }),
                                    );

                                    if (
                                        formErrors.date
                                    ) {
                                        setFormErrors(
                                            (
                                                previous,
                                            ) => ({
                                                ...previous,
                                                date: '',
                                            }),
                                        );
                                    }
                                }}
                                disabled={
                                    isCreatingEvent
                                }
                                className="h-11 rounded-xl"
                            />

                            {formErrors.date && (
                                <p className="text-xs text-destructive">
                                    {
                                        formErrors.date
                                    }
                                </p>
                            )}

                            <p className="text-[11px] text-muted-foreground">
                                Events must be scheduled
                                for a future date.
                            </p>
                        </div>

                        {/* Description */}

                        <div className="space-y-2">
                            <Label htmlFor="event-description">
                                Description
                                <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                                    Optional
                                </span>
                            </Label>

                            <Textarea
                                id="event-description"
                                placeholder="Add context, campaign notes, or important details..."
                                value={
                                    formData.description
                                }
                                onChange={(
                                    event,
                                ) => {
                                    setFormData(
                                        (
                                            previous,
                                        ) => ({
                                            ...previous,
                                            description:
                                                event
                                                    .target
                                                    .value,
                                        }),
                                    );

                                    if (
                                        formErrors.description
                                    ) {
                                        setFormErrors(
                                            (
                                                previous,
                                            ) => ({
                                                ...previous,
                                                description:
                                                    '',
                                            }),
                                        );
                                    }
                                }}
                                disabled={
                                    isCreatingEvent
                                }
                                maxLength={500}
                                rows={4}
                                className="resize-none rounded-xl"
                            />

                            <div className="flex justify-between">
                                {formErrors.description ? (
                                    <p className="text-xs text-destructive">
                                        {
                                            formErrors.description
                                        }
                                    </p>
                                ) : (
                                    <span />
                                )}

                                <span className="text-[11px] text-muted-foreground">
                                    {
                                        formData
                                            .description
                                            .length
                                    }
                                    /500
                                </span>
                            </div>
                        </div>

                        {/* Event type */}

                        <div className="space-y-2">
                            <Label htmlFor="event-type">
                                Event type
                            </Label>

                            <Select
                                value={
                                    formData.type
                                }
                                onValueChange={(
                                    value,
                                ) =>
                                    setFormData(
                                        (
                                            previous,
                                        ) => ({
                                            ...previous,
                                            type: value,
                                        }),
                                    )
                                }
                                disabled={
                                    isCreatingEvent
                                }
                            >
                                <SelectTrigger
                                    id="event-type"
                                    className="h-11 rounded-xl"
                                >
                                    <SelectValue placeholder="Select event type" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="custom">
                                        Custom
                                    </SelectItem>

                                    <SelectItem value="commercial">
                                        Commercial
                                    </SelectItem>

                                    <SelectItem value="seasonal">
                                        Seasonal
                                    </SelectItem>

                                    <SelectItem value="holiday">
                                        Holiday
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            {formErrors.type && (
                                <p className="text-xs text-destructive">
                                    {
                                        formErrors.type
                                    }
                                </p>
                            )}

                            <p className="text-[11px] text-muted-foreground">
                                Choose how this event should
                                appear in the calendar.
                            </p>
                        </div>
                    </div>

                    {/* Actions */}

                    <div className="flex gap-3 border-t border-border pt-5">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={
                                closeCreateDialog
                            }
                            disabled={
                                isCreatingEvent
                            }
                            className="flex-1 rounded-xl"
                        >
                            Cancel
                        </Button>

                        <Button
                            type="button"
                            onClick={
                                handleCreateEvent
                            }
                            disabled={
                                isCreatingEvent
                            }
                            className="flex-1 gap-2 rounded-xl"
                        >
                            {isCreatingEvent ? (
                                <>
                                    <span
                                        className="
                                            h-4
                                            w-4
                                            animate-spin
                                            rounded-full
                                            border-2
                                            border-current
                                            border-t-transparent
                                        "
                                    />

                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4" />

                                    Create Event
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

/*
|--------------------------------------------------------------------------
| Layout
|--------------------------------------------------------------------------
*/

CalendarPage.layout = {
    breadcrumbs: [
        {
            title: 'Marketing Calendar',
            href: '/calendar',
        },
    ],
};