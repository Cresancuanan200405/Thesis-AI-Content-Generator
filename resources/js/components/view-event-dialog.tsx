import { Link } from '@inertiajs/react';
import {
    Calendar,
    CalendarDays,
    Clock,
    Edit3,
    ExternalLink,
    PartyPopper,
    Plus,
    ShoppingBag,
    Tag,
} from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export interface EventModalData {
    id: number | string;
    name: string;
    description?: string | null;
    date?: string;
    start_date?: string;
    end_date?: string;
    type?: string;
    category?: string;
    is_global?: boolean;
    is_long_weekend?: boolean;
    long_weekend_details?: string | null;
    can_edit?: boolean;
    can_delete?: boolean;
    campaigns_count?: number;
    has_campaign?: boolean;
    latest_campaign_id?: number | null;
    show_url?: string;
}

export const EVENT_TYPE_STYLES: Record<string, { text: string; label: string }> = {
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

interface ViewEventDialogProps {
    event: EventModalData | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit?: (event: EventModalData) => void;
}

export function ViewEventDialog({
    event,
    open,
    onOpenChange,
    onEdit,
}: ViewEventDialogProps) {
    if (!event) return null;

    const typeKey = event.type || event.category || '';
    const typeStyle = EVENT_TYPE_STYLES[typeKey] || {
        text: 'text-muted-foreground',
        label: 'Marketing Event',
    };

    const startDate = event.start_date || event.date;
    const endDate = event.end_date || startDate;
    const isMultiDay = Boolean(startDate && endDate && startDate !== endDate);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] flex flex-col overflow-hidden rounded-card border-border bg-card p-0 shadow-2xl sm:max-w-lg">
                <DialogHeader className="shrink-0 border-b border-border bg-muted/20 p-5 sm:p-6 pb-4">
                    <div className="flex items-center gap-2.5 min-w-0 pr-6">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <CalendarDays className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p
                                className={`text-[11px] font-bold uppercase tracking-wider ${typeStyle.text}`}
                            >
                                {typeStyle.label}
                            </p>
                            <DialogTitle
                                className="text-base font-bold text-foreground sm:text-lg truncate"
                                title={event.name}
                            >
                                {event.name}
                            </DialogTitle>
                        </div>
                    </div>
                    <DialogDescription className="sr-only">
                        Details and timeline for {event.name}
                    </DialogDescription>
                </DialogHeader>

                {/* Modal Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
                    {/* Schedule Dates & Type */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-border/70 bg-muted/20 p-3.5 space-y-1">
                            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                                Schedule Date
                            </span>
                            <p className="font-mono text-xs font-semibold text-foreground">
                                {startDate}
                                {isMultiDay && <span> → {endDate}</span>}
                            </p>
                            {isMultiDay && (
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
                            <p
                                className={`text-xs font-bold truncate ${typeStyle.text}`}
                            >
                                {typeStyle.label}
                            </p>
                            <span className="text-[10px] text-muted-foreground block truncate">
                                {event.is_global
                                    ? 'System / Official'
                                    : 'Custom Business Event'}
                            </span>
                        </div>
                    </div>

                    {/* Long weekend alert if applicable */}
                    {event.is_long_weekend && (
                        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-amber-700 dark:text-amber-300">
                            <div className="flex items-center gap-1.5 font-semibold text-xs">
                                <PartyPopper className="h-4 w-4 shrink-0" />
                                <span>Long Weekend Opportunity</span>
                            </div>
                            {event.long_weekend_details && (
                                <p className="mt-1 text-[11px] text-amber-800/80 dark:text-amber-200/80 leading-relaxed">
                                    {event.long_weekend_details}
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
                            {event.description?.trim() ||
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
                                <p className="font-semibold text-foreground">
                                    Linked Campaigns
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                    {event.has_campaign
                                        ? `${event.campaigns_count || 1} active campaign(s) running for this event`
                                        : 'No campaigns currently associated with this event'}
                                </p>
                            </div>
                        </div>
                        <span className="font-mono text-sm font-bold text-foreground">
                            {event.campaigns_count || (event.has_campaign ? 1 : 0)}
                        </span>
                    </div>
                </div>

                {/* Modal Footer */}
                <DialogFooter className="shrink-0 border-t border-border bg-muted/20 p-3.5 sm:p-4 flex flex-row items-center justify-end gap-2">
                    <div className="flex items-center gap-2">
                        {event.can_edit && onEdit && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => onEdit(event)}
                                className="text-xs gap-1.5"
                            >
                                <Edit3 className="h-3.5 w-3.5" />
                                Edit Event
                            </Button>
                        )}

                        {event.has_campaign ? (
                            <Button
                                asChild
                                size="sm"
                                className="text-xs gap-1.5 bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                            >
                                <Link
                                    href={
                                        event.latest_campaign_id
                                            ? `/campaigns/${event.latest_campaign_id}`
                                            : `/campaigns?event_id=${event.id}`
                                    }
                                >
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
                                <Link
                                    href={`/campaigns?create=true&event_id=${event.id}`}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Create Campaign
                                </Link>
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
