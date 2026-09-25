import { router } from '@inertiajs/react';
import {
    CalendarDays,
    Clock,
    FileText,
    Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    CATEGORY_STYLES,
    formatDateRange,
    NormalizedCalendarEvent,
} from '../calendar-types';

interface EventDetailModalProps {
    event: NormalizedCalendarEvent | null;
    todayDateStr: string;
    onClose: () => void;
}

export function EventDetailModal({
    event,
    todayDateStr,
    onClose,
}: EventDetailModalProps) {
    if (!event) {
        return null;
    }

    const isPast = event.endDate < todayDateStr;
    const hasCampaign = Boolean(event.has_campaign);
    const isMissed = isPast && !event.has_design && !hasCampaign;
    const styleKey = event.category || event.type || 'holiday';
    const style = CATEGORY_STYLES[styleKey] || CATEGORY_STYLES.holiday;

    return (
        <Dialog open={!!event} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="rounded-3xl border-border bg-card p-6 shadow-xl sm:max-w-md">
                <DialogHeader className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold ${style.bg} ${style.text} ${style.border}`}
                        >
                            <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${style.dot}`} />
                            {style.label}
                        </Badge>

                        {event.isMultiDay && (
                            <Badge
                                variant="secondary"
                                className="border border-primary/20 bg-primary/10 text-[10px] font-semibold text-primary"
                            >
                                <Clock className="mr-1 h-3 w-3" />
                                {event.dayCount}-Day Range
                            </Badge>
                        )}

                        {event.is_long_weekend && (
                            <Badge
                                variant="secondary"
                                className="border border-emerald-500/20 bg-emerald-500/10 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
                            >
                                Long Weekend
                            </Badge>
                        )}

                        {hasCampaign ? (
                            <Badge
                                variant="outline"
                                className="border-primary/40 bg-primary/10 text-[10px] font-semibold text-primary"
                            >
                                Campaign Linked
                            </Badge>
                        ) : isMissed ? (
                            <Badge
                                variant="outline"
                                className="border-amber-500/40 bg-amber-500/10 font-mono text-[10px] font-semibold text-amber-600 dark:text-amber-400"
                            >
                                Missed Opportunity
                            </Badge>
                        ) : isPast ? (
                            <Badge
                                variant="secondary"
                                className="bg-muted font-mono text-[10px] text-muted-foreground"
                            >
                                Past Event
                            </Badge>
                        ) : (
                            <Badge
                                variant="outline"
                                className="border-emerald-500/30 bg-emerald-500/10 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
                            >
                                Upcoming
                            </Badge>
                        )}
                    </div>

                    <DialogTitle className="text-lg font-bold text-foreground">
                        {event.name}
                    </DialogTitle>

                    <DialogDescription className="flex items-center gap-1.5 text-xs font-medium text-foreground/80">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>
                            {event.has_campaign
                                ? formatDateRange(event.startDate, event.endDate)
                                : event.catalogEndDate && event.catalogEndDate !== event.startDate
                                  ? `${formatDateRange(event.startDate, event.catalogEndDate)} (Catalog Range)`
                                  : formatDateRange(event.startDate, event.startDate)}
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 pt-1 text-xs">

                    {/* Long Weekend Details */}
                    {event.long_weekend_details && (
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-[11px] text-emerald-700 dark:text-emerald-300">
                            <span className="font-semibold">Long Weekend Note:</span>{' '}
                            {event.long_weekend_details}
                        </div>
                    )}

                    {/* Official Holiday Metadata */}
                    {event.proclamation_no && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Official Reference: {event.proclamation_no}</span>
                        </div>
                    )}

                    {/* Shifted Holiday Note */}
                    {event.shifted_from_date && (
                        <div className="text-[11px] text-muted-foreground">
                            * Observance moved from original date ({event.shifted_from_date}) by official proclamation.
                        </div>
                    )}

                    {/* Description */}
                    {event.description ? (
                        <div className="rounded-2xl border border-border bg-muted/20 p-3.5 leading-relaxed text-muted-foreground">
                            {event.description}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-border/60 bg-muted/10 p-3 text-[11px] text-muted-foreground italic">
                            No additional description provided.
                        </div>
                    )}

                    {/* Status Highlights */}
                    {isMissed && (
                        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-3.5 text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">
                                Missed Promotional Opportunity:
                            </span>{' '}
                            This marketing date passed without an active campaign or design. You can still launch a campaign anytime using Create Campaign Anyway.
                        </div>
                    )}

                    {hasCampaign && event.campaign_name && (
                        <div className="rounded-2xl border border-primary/25 bg-primary/5 p-3.5 text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">
                                Campaign Active:
                            </span>{' '}
                            Organized under "{event.campaign_name}".
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-4 flex items-center justify-between">
                    <div>
                        {hasCampaign && event.campaign_id ? (
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    onClose();
                                    router.visit(`/campaigns/${event.campaign_id}`);
                                }}
                                className="text-xs font-semibold shadow-xs"
                            >
                                View Linked Campaign
                            </Button>
                        ) : (
                            <span className="text-xs text-muted-foreground">
                                Read-only schedule details
                            </span>
                        )}
                    </div>

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="text-xs font-semibold"
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
