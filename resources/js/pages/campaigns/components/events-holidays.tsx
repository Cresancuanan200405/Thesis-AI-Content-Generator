import { Link } from '@inertiajs/react';
import {
    Calendar,
    CalendarDays,
    ChevronDown,
    ChevronUp,
    Plus,
    Search,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface EventsHolidaysProps {
    rawEvents: any[];
    currentCampaignYear: number | string;
    eventTypeStyles: Record<
        string,
        { bg: string; text: string; border: string; dot: string; label: string }
    >;
    onCreateCampaign: (event: any) => void;
}

export function EventsHolidays({
    rawEvents = [],
    currentCampaignYear,
    eventTypeStyles,
    onCreateCampaign,
}: EventsHolidaysProps) {
    const [eventsTab, setEventsTab] = useState<
        'all' | 'upcoming' | 'past' | 'missed'
    >('all');
    const [eventsSearchQuery, setEventsSearchQuery] = useState('');
    const [eventsCategoryFilter, setEventsCategoryFilter] = useState('all');
    const [isSecondaryExpanded, setIsSecondaryExpanded] = useState(false);

    const eventCounts = useMemo(() => {
        return {
            all: rawEvents.length,
            upcoming: rawEvents.filter((e: any) => e.is_upcoming).length,
            past: rawEvents.filter((e: any) => e.is_past).length,
            missed: rawEvents.filter((e: any) => e.is_missed).length,
        };
    }, [rawEvents]);

    const displayedHolidays = useMemo(() => {
        return rawEvents.filter((evt: any) => {
            if (eventsTab === 'upcoming' && !evt.is_upcoming) {
                return false;
            }

            if (eventsTab === 'past' && !evt.is_past) {
                return false;
            }

            if (eventsTab === 'missed' && !evt.is_missed) {
                return false;
            }

            if (eventsSearchQuery.trim()) {
                const q = eventsSearchQuery.toLowerCase();
                const matchesName = evt.name?.toLowerCase().includes(q);
                const matchesDesc = evt.description?.toLowerCase().includes(q);
                const matchesDate = evt.date?.includes(q);

                if (!matchesName && !matchesDesc && !matchesDate) {
                    return false;
                }
            }

            if (eventsCategoryFilter !== 'all') {
                const cat = evt.category || evt.type || 'holiday';

                if (
                    eventsCategoryFilter === 'regular' &&
                    !(cat === 'regular' || cat === 'holiday')
                ) {
                    return false;
                }

                if (
                    eventsCategoryFilter === 'special_non_working' &&
                    cat !== 'special_non_working'
                ) {
                    return false;
                }

                if (eventsCategoryFilter === 'islamic' && cat !== 'islamic') {
                    return false;
                }

                if (
                    eventsCategoryFilter === 'commercial' &&
                    !(
                        cat === 'commercial' ||
                        cat === 'sale' ||
                        cat === 'retail'
                    )
                ) {
                    return false;
                }

                if (eventsCategoryFilter === 'custom' && cat !== 'custom') {
                    return false;
                }
            }

            return true;
        });
    }, [rawEvents, eventsTab, eventsSearchQuery, eventsCategoryFilter]);

    const visibleSecondary = useMemo(() => {
        return displayedHolidays.slice(0, isSecondaryExpanded ? undefined : 6);
    }, [displayedHolidays, isSecondaryExpanded]);

    return (
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-2xs sm:p-5">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-foreground">
                            This Year's Events & Holidays — {currentCampaignYear}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Browse all promotional opportunities, holidays, and observances for {currentCampaignYear}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border/70 bg-muted/40 p-1">
                    <button
                        type="button"
                        onClick={() => setEventsTab('all')}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                            eventsTab === 'all'
                                ? 'bg-background text-foreground shadow-2xs'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        All ({eventCounts.all})
                    </button>
                    <button
                        type="button"
                        onClick={() => setEventsTab('upcoming')}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                            eventsTab === 'upcoming'
                                ? 'bg-background text-foreground shadow-2xs'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Upcoming ({eventCounts.upcoming})
                    </button>
                    <button
                        type="button"
                        onClick={() => setEventsTab('past')}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                            eventsTab === 'past'
                                ? 'bg-background text-foreground shadow-2xs'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Past ({eventCounts.past})
                    </button>
                    <button
                        type="button"
                        onClick={() => setEventsTab('missed')}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                            eventsTab === 'missed'
                                ? 'bg-rose-500/10 text-rose-600 shadow-2xs dark:text-rose-400'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Missed ({eventCounts.missed})
                    </button>
                </div>
            </div>

            {/* Search and Category Filters */}
            <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                    <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={eventsSearchQuery}
                        onChange={(e) => setEventsSearchQuery(e.target.value)}
                        placeholder="Search events, holidays, observances..."
                        className="h-8.5 rounded-xl border-input bg-background pr-8 pl-8.5 text-xs shadow-none"
                    />
                    {eventsSearchQuery && (
                        <button
                            type="button"
                            onClick={() => setEventsSearchQuery('')}
                            className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-muted-foreground/60 transition-colors hover:text-foreground"
                            aria-label="Clear search"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                <Select
                    value={eventsCategoryFilter}
                    onValueChange={setEventsCategoryFilter}
                >
                    <SelectTrigger className="h-8.5 w-full rounded-xl bg-background text-xs font-medium sm:w-[180px]">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent align="end" className="rounded-xl border-border bg-popover">
                        <SelectItem value="all" className="text-xs">
                            All Categories
                        </SelectItem>
                        <SelectItem value="regular" className="text-xs">
                            Regular Holiday
                        </SelectItem>
                        <SelectItem
                            value="special_non_working"
                            className="text-xs"
                        >
                            Special Non-Working
                        </SelectItem>
                        <SelectItem value="islamic" className="text-xs">
                            Islamic Holiday
                        </SelectItem>
                        <SelectItem value="commercial" className="text-xs">
                            Sales & Events
                        </SelectItem>
                        <SelectItem value="custom" className="text-xs">
                            Custom Business Event
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Secondary Event Cards Grid */}
            {displayedHolidays.length > 0 ? (
                <>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {visibleSecondary.map((evt: any) => {
                            const style =
                                eventTypeStyles[evt.category] ||
                                eventTypeStyles[evt.type] ||
                                eventTypeStyles.holiday;

                            return (
                                <div
                                    key={evt.id}
                                    className="group flex flex-col justify-between rounded-xl border border-border/70 bg-card p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <span
                                                    className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                                                />
                                                <span className="font-medium">
                                                    {style.label}
                                                </span>
                                            </div>
                                            {evt.is_missed ? (
                                                <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                                                    Missed Opportunity
                                                </span>
                                            ) : evt.has_campaign ? (
                                                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                    Campaign Active
                                                </span>
                                            ) : evt.is_upcoming ? (
                                                <span className="text-[11px] font-semibold text-primary">
                                                    Upcoming
                                                </span>
                                            ) : (
                                                <span className="text-[11px] font-medium text-muted-foreground">
                                                    Past Event
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="line-clamp-1 text-xs font-semibold text-foreground transition-colors group-hover:text-primary">
                                            {evt.name}
                                        </h3>

                                        <p className="text-xs text-muted-foreground">
                                            {evt.date_formatted || evt.date}
                                        </p>

                                        {evt.description && (
                                            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground/80">
                                                {evt.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-3.5 flex items-center justify-between border-t border-border/50 pt-2.5">
                                        {evt.has_campaign ? (
                                            <>
                                                <span className="max-w-[130px] truncate text-xs font-medium text-muted-foreground">
                                                    {evt.campaign_name ||
                                                        'Active Campaign'}
                                                </span>
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7.5 rounded-xl text-xs font-semibold"
                                                >
                                                    <Link
                                                        href={`/campaigns/${evt.campaign_id}`}
                                                    >
                                                        View Campaign
                                                    </Link>
                                                </Button>
                                            </>
                                        ) : evt.is_missed ? (
                                            <>
                                                <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                                                    Window missed
                                                </span>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        onCreateCampaign(evt)
                                                    }
                                                    className="h-7.5 gap-1 rounded-xl border-rose-500/30 text-xs font-semibold text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
                                                >
                                                    Create Campaign
                                                </Button>
                                            </>
                                        ) : evt.is_past ? (
                                            <>
                                                <span className="text-xs text-muted-foreground">
                                                    Past holiday
                                                </span>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        onCreateCampaign(evt)
                                                    }
                                                    className="h-7.5 rounded-xl text-xs font-semibold"
                                                >
                                                    Create Campaign
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-xs text-muted-foreground">
                                                    No campaign yet
                                                </span>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() =>
                                                        onCreateCampaign(evt)
                                                    }
                                                    className="h-7.5 gap-1 rounded-xl text-xs font-semibold shadow-2xs"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                    Create Campaign
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {displayedHolidays.length > 6 && (
                        <div className="mt-4 flex justify-center">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                    setIsSecondaryExpanded(!isSecondaryExpanded)
                                }
                                className="h-8 gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                            >
                                {isSecondaryExpanded ? (
                                    <>
                                        Show Less
                                        <ChevronUp className="h-3.5 w-3.5" />
                                    </>
                                ) : (
                                    <>
                                        Show More (
                                        {displayedHolidays.length - 6} more)
                                        <ChevronDown className="h-3.5 w-3.5" />
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/10 p-8 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                        <CalendarDays className="h-5 w-5" />
                    </div>
                    <h3 className="mt-3 text-xs font-bold text-foreground">
                        {eventsTab === 'missed'
                            ? 'No Missed Promotional Opportunities'
                            : eventsTab === 'upcoming'
                              ? 'No Upcoming Events'
                              : eventsTab === 'past'
                                ? 'No Past Events Found'
                                : 'No Events or Holidays Found'}
                    </h3>
                    <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                        {eventsTab === 'missed'
                            ? "Great news! You haven't missed any eligible promotional opportunity windows since finalizing your account."
                            : eventsTab === 'upcoming'
                              ? 'No upcoming events match your active search or category filters.'
                              : 'No events match your current filter selection.'}
                    </p>
                </div>
            )}
        </div>
    );
}
