export interface RawCalendarEvent {
    id: string | number;
    name: string;
    description?: string | null;
    date: string;
    start_date?: string | null;
    end_date?: string | null;
    type?: string | null;
    category?: string | null;
    is_long_weekend?: boolean;
    long_weekend_details?: string | null;
    shifted_from_date?: string | null;
    proclamation_no?: string | null;
    days?: string | null;
    is_global?: boolean;
    user_id?: number | null;
    has_design?: boolean;
    is_missed?: boolean;
    has_campaign?: boolean;
    campaign_id?: string | number | null;
    campaign_name?: string | null;
    campaign_status?: string | null;
    show_url?: string;
}

export interface NormalizedCalendarEvent {
    id: string | number;
    name: string;
    description?: string | null;
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD (inclusive)
    isMultiDay: boolean;
    dayCount: number;
    catalogEndDate?: string | null;
    catalogDayCount?: number;
    type: string;
    category: string;
    is_long_weekend?: boolean;
    long_weekend_details?: string | null;
    shifted_from_date?: string | null;
    proclamation_no?: string | null;
    days?: string | null;
    is_global?: boolean;
    user_id?: number | null;
    has_design?: boolean;
    is_missed?: boolean;
    has_campaign?: boolean;
    campaign_id?: string | number | null;
    campaign_name?: string | null;
    campaign_status?: string | null;
    show_url?: string;
}

/**
 * Safely parses YYYY-MM-DD into a local Date without timezone shifting.
 */
export function parseDateString(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map((n) => parseInt(n, 10));
    return new Date(y, m - 1, d);
}

/**
 * Normalizes any raw event into a standard format.
 * Events with distinct start and end dates display as multi-day ranges.
 * Legacy records with end_date = null normalize to startDate = endDate.
 */
export function normalizeCalendarEvent(evt: RawCalendarEvent): NormalizedCalendarEvent {
    const startDate = evt.start_date || evt.date || '';
    const rawEndDate = evt.end_date || evt.date || startDate;
    const endDate = rawEndDate < startDate ? startDate : rawEndDate;

    const startDt = parseDateString(startDate);
    const endDt = parseDateString(endDate);
    const diffTime = Math.abs(endDt.getTime() - startDt.getTime());
    const dayCount = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const isMultiDay = Boolean(startDate && endDate && startDate !== endDate && dayCount > 1);

    const rawType = evt.type || 'custom';
    const rawCategory = evt.category || rawType;

    return {
        ...evt,
        startDate,
        endDate,
        isMultiDay,
        dayCount,
        catalogEndDate: endDate,
        catalogDayCount: dayCount,
        type: rawType,
        category: rawCategory,
    };
}

/**
 * Calculates day difference (b - a in days) between two YYYY-MM-DD strings.
 */
export function diffInDays(startStr: string, endStr: string): number {
    const a = parseDateString(startStr);
    const b = parseDateString(endStr);
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.round((b.getTime() - a.getTime()) / msPerDay);
}

const MONTH_NAMES_SHORT = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const MONTH_NAMES_LONG = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Formats a single date or date range inclusively.
 * Examples:
 * "September 10, 2026"
 * "Sep 10 – Sep 14, 2026 (5 days)"
 * "Sep 28 – Oct 4, 2026 (7 days)"
 */
export function formatDateRange(
    startDateStr: string,
    endDateStr: string,
    options: { shortMonth?: boolean } = {}
): string {
    if (!startDateStr) {
        return '';
    }

    const start = parseDateString(startDateStr);
    const end = endDateStr ? parseDateString(endDateStr) : start;
    const months = options.shortMonth ? MONTH_NAMES_SHORT : MONTH_NAMES_LONG;

    if (startDateStr === endDateStr || !endDateStr) {
        return `${months[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()}`;
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const dayCount = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Same month & year
    if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
        return `${months[start.getMonth()]} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()} (${dayCount} days)`;
    }

    // Same year, different month
    if (start.getFullYear() === end.getFullYear()) {
        return `${MONTH_NAMES_SHORT[start.getMonth()]} ${start.getDate()} – ${MONTH_NAMES_SHORT[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()} (${dayCount} days)`;
    }

    // Different year
    return `${MONTH_NAMES_SHORT[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()} – ${MONTH_NAMES_SHORT[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()} (${dayCount} days)`;
}

export const CATEGORY_STYLES: Record<
    string,
    {
        dot: string;
        bg: string;
        text: string;
        border: string;
        solidBg: string;
        solidText: string;
        solidBorder: string;
        label: string;
        badgeVariant?: string;
    }
> = {
    regular: {
        dot: 'bg-rose-500',
        bg: 'bg-rose-500/10 dark:bg-rose-500/15',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-500/30',
        solidBg: 'bg-rose-600 dark:bg-rose-600',
        solidText: 'text-white',
        solidBorder: 'border-rose-700/80 dark:border-rose-500/80',
        label: 'Regular Holiday',
    },
    special_non_working: {
        dot: 'bg-amber-500',
        bg: 'bg-amber-500/10 dark:bg-amber-500/15',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-500/30',
        solidBg: 'bg-amber-600 dark:bg-amber-600',
        solidText: 'text-white',
        solidBorder: 'border-amber-700/80 dark:border-amber-500/80',
        label: 'Special Non-Working',
    },
    special_working: {
        dot: 'bg-orange-500',
        bg: 'bg-orange-500/10 dark:bg-orange-500/15',
        text: 'text-orange-700 dark:text-orange-300',
        border: 'border-orange-500/30',
        solidBg: 'bg-orange-600 dark:bg-orange-600',
        solidText: 'text-white',
        solidBorder: 'border-orange-700/80 dark:border-orange-500/80',
        label: 'Special Working',
    },
    islamic: {
        dot: 'bg-emerald-500',
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-500/30',
        solidBg: 'bg-emerald-600 dark:bg-emerald-600',
        solidText: 'text-white',
        solidBorder: 'border-emerald-700/80 dark:border-emerald-500/80',
        label: 'Islamic Holiday',
    },
    commercial: {
        dot: 'bg-blue-500',
        bg: 'bg-blue-500/10 dark:bg-blue-500/15',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-500/30',
        solidBg: 'bg-blue-600 dark:bg-blue-600',
        solidText: 'text-white',
        solidBorder: 'border-blue-700/80 dark:border-blue-500/80',
        label: 'Commercial Event',
    },
    seasonal: {
        dot: 'bg-cyan-500',
        bg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
        text: 'text-cyan-700 dark:text-cyan-300',
        border: 'border-cyan-500/30',
        solidBg: 'bg-teal-600 dark:bg-teal-600',
        solidText: 'text-white',
        solidBorder: 'border-teal-700/80 dark:border-teal-500/80',
        label: 'Seasonal Event',
    },
    custom: {
        dot: 'bg-purple-500',
        bg: 'bg-purple-500/10 dark:bg-purple-500/15',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-500/30',
        solidBg: 'bg-purple-600 dark:bg-purple-600',
        solidText: 'text-white',
        solidBorder: 'border-purple-700/80 dark:border-purple-500/80',
        label: 'Custom Event',
    },
    holiday: {
        dot: 'bg-rose-500',
        bg: 'bg-rose-500/10 dark:bg-rose-500/15',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-500/30',
        solidBg: 'bg-rose-600 dark:bg-rose-600',
        solidText: 'text-white',
        solidBorder: 'border-rose-700/80 dark:border-rose-500/80',
        label: 'Regular Holiday',
    },
    missed: {
        dot: 'bg-slate-400 dark:bg-slate-500',
        bg: 'bg-slate-500/10 dark:bg-slate-500/15',
        text: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-500/30',
        solidBg: 'bg-slate-600 dark:bg-slate-600',
        solidText: 'text-white',
        solidBorder: 'border-slate-700/80 dark:border-slate-500/80',
        label: 'Missed Opportunity',
    },
};
