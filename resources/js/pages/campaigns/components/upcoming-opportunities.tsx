import { Link } from '@inertiajs/react';
import {
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock,
    Plus,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';

interface UpcomingOpportunitiesProps {
    upcomingList: any[];
    currentCampaignYear: number | string;
    eventTypeStyles: Record<
        string,
        { bg: string; text: string; border: string; dot: string; label: string }
    >;
    onCreateCampaign: (event: any) => void;
}

export function UpcomingOpportunities({
    upcomingList = [],
    currentCampaignYear,
    eventTypeStyles,
    onCreateCampaign,
}: UpcomingOpportunitiesProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const visibleUpcoming = useMemo(() => {
        return upcomingList.slice(0, isExpanded ? undefined : 4);
    }, [upcomingList, isExpanded]);

    return (
        <div className="rounded-card border border-border/70 bg-card p-4 shadow-2xs sm:p-5">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <CalendarDays className="h-4 w-4" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold tracking-tight text-foreground">
                            Upcoming Opportunities
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Approaching promotional dates in {currentCampaignYear} ready to turn into marketing campaigns
                        </p>
                    </div>
                </div>
                {upcomingList.length > 0 && (
                    <span className="text-xs font-medium text-muted-foreground">
                        {upcomingList.length} upcoming{' '}
                        {upcomingList.length === 1
                            ? 'opportunity'
                            : 'opportunities'}
                    </span>
                )}
            </div>

            {/* Upcoming Cards Grid */}
            {upcomingList.length > 0 ? (
                <>
                    <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                        {visibleUpcoming.map((opp: any) => {
                            const style =
                                eventTypeStyles[opp.category] ||
                                eventTypeStyles[opp.type] ||
                                eventTypeStyles.holiday;

                            const timingText =
                                opp.relative_timing ||
                                (opp.days_until === 0
                                    ? 'Today'
                                    : opp.days_until === 1
                                      ? 'Tomorrow'
                                      : `In ${opp.days_until} days`);

                            return (
                                <div
                                    key={opp.id}
                                    className="group relative flex flex-col justify-between rounded-xl border border-border/70 bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-1.5">
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <span
                                                    className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                                                />
                                                <span className="font-medium">
                                                    {style.label}
                                                </span>
                                            </div>
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                                                <Clock className="h-3 w-3" />
                                                {timingText}
                                            </span>
                                        </div>

                                        <div>
                                            <h3 className="line-clamp-1 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                                                {opp.name}
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                {opp.date_formatted || opp.date}
                                            </p>
                                        </div>

                                        {opp.description && (
                                            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground/80">
                                                {opp.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-4 border-t border-border/50 pt-3">
                                        {opp.has_campaign ? (
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="max-w-[120px] truncate text-xs font-medium text-muted-foreground">
                                                    {opp.campaign_name ||
                                                        'Active Campaign'}
                                                </span>
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7.5 rounded-xl text-xs font-semibold"
                                                >
                                                    <Link
                                                        href={`/campaigns/${opp.campaign_id}`}
                                                    >
                                                        View Campaign
                                                    </Link>
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={() =>
                                                    onCreateCampaign(opp)
                                                }
                                                className="h-7.5 w-full gap-1.5 rounded-xl text-xs font-semibold shadow-2xs"
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                                Create Campaign
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {upcomingList.length > 4 && (
                        <div className="mt-4 flex justify-center">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="h-8 gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                            >
                                {isExpanded ? (
                                    <>
                                        Show Less
                                        <ChevronUp className="h-3.5 w-3.5" />
                                    </>
                                ) : (
                                    <>
                                        Show More ({upcomingList.length - 4}{' '}
                                        more)
                                        <ChevronDown className="h-3.5 w-3.5" />
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/10 p-8 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <h3 className="mt-3 text-xs font-bold text-foreground">
                        You're all caught up
                    </h3>
                    <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                        There are currently no upcoming opportunities in your{' '}
                        {currentCampaignYear} campaign year.
                    </p>
                </div>
            )}
        </div>
    );
}
