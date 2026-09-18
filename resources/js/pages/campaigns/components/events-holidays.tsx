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

import { Badge } from '@/components/ui/badge';
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
        <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-foreground">
                                This Year's Events & Holidays —{' '}
                                {currentCampaignYear}
                            </h2>
                            <Badge
                                variant="outline"
                                className="border-border text-[10px] font-medium text-muted-foreground"
                            >
                                Secondary
                            </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            Browse all promotional opportunities, holidays, and
                            observances for {currentCampaignYear}
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
                                ? 'bg-background text-foreground shadow-xs'
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
                                ? 'bg-background text-foreground shadow-xs'
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
                                ? 'bg-background text-foreground shadow-xs'
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
                                ? 'bg-rose-500/10 text-rose-600 shadow-xs dark:text-rose-400'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Missed Opportunities ({eventCounts.missed})
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
                        className="h-8 rounded-xl bg-background pl-8 text-xs"
                    />
                    {eventsSearchQuery && (
                        <button
                            type="button"
                            onClick={() => setEventsSearchQuery('')}
                            className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                <Select
                    value={eventsCategoryFilter}
                    onValueChange={setEventsCategoryFilter}
                >
                    <SelectTrigger className="h-8 w-full rounded-xl bg-background text-xs sm:w-[180px]">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border bg-popover">
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
                                    className={`flex flex-col justify-between rounded-xl border p-3.5 transition-all hover:shadow-2xs ${
                                        evt.is_missed
                                            ? 'border-rose-500/30 bg-rose-500/[0.02] dark:border-rose-500/20'
                                            : evt.has_campaign
                                              ? 'border-emerald-500/30 bg-emerald-500/[0.02] dark:border-emerald-500/20'
                                              : 'border-border/70 bg-background/60 hover:border-primary/40'
                                    }`}
                                >
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase ${style.border} ${style.bg} ${style.text}`}
                                            >
                                                <span
                                                    className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                                                />
                                                {style.label}
                                            </span>
                                            {evt.is_missed ? (
                                                <Badge
                                                    variant="outline"
                                                    className="border-rose-500/30 bg-rose-500/10 text-[9px] font-bold text-rose-600 dark:text-rose-400"
                                                >
                                                    Missed Opportunity
                                                </Badge>
                                            ) : evt.has_campaign ? (
                                                <Badge
                                                    variant="outline"
                                                    className="border-emerald-500/30 bg-emerald-500/10 text-[9px] font-bold text-emerald-600 dark:text-emerald-400"
                                                >
                                                    Campaign Exists
                                                </Badge>
                                            ) : evt.is_upcoming ? (
                                                <Badge
                                                    variant="outline"
                                                    className="border-primary/30 bg-primary/10 text-[9px] font-bold text-primary"
                                                >
                                                    Upcoming Opportunity
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="outline"
                                                    className="border-border/80 bg-muted/40 text-[9px] font-medium text-muted-foreground"
                                                >
                                                    Past Event
                                                </Badge>
                                            )}
                                        </div>

                                        <h3 className="line-clamp-1 text-xs font-bold text-foreground">
                                            {evt.name}
                                        </h3>

                                        <p className="text-[11px] font-medium text-muted-foreground">
                                            {evt.date_formatted || evt.date}
                                        </p>

                                        {evt.description && (
                                            <p className="line-clamp-2 text-[10px] text-muted-foreground/80">
                                                {evt.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2.5">
                                        {evt.has_campaign ? (
                                            <>
                                                <span className="max-w-[130px] truncate text-[10px] font-medium text-muted-foreground">
                                                    {evt.campaign_name ||
                                                        'Active Campaign'}
                                                </span>
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 text-xs font-semibold"
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
                                                <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400">
                                                    Window missed
                                                </span>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        onCreateCampaign(evt)
                                                    }
                                                    className="h-7 gap-1 border-rose-500/30 text-xs font-semibold text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
                                                >
                                                    Create Campaign Anyway
                                                </Button>
                                            </>
                                        ) : evt.is_past ? (
                                            <>
                                                <span className="text-[10px] text-muted-foreground">
                                                    Past holiday
                                                </span>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        onCreateCampaign(evt)
                                                    }
                                                    className="h-7 text-xs font-semibold"
                                                >
                                                    Create Campaign Anyway
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-[10px] text-muted-foreground">
                                                    No campaign yet
                                                </span>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() =>
                                                        onCreateCampaign(evt)
                                                    }
                                                    className="h-7 gap-1 text-xs font-semibold"
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
                        <div className="mt-3.5 flex justify-center">
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
                    <p className="mt-1 max-w-sm text-[11px] text-muted-foreground">
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
