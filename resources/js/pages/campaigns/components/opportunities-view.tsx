import { EventsHolidays } from './events-holidays';
import { UpcomingOpportunities } from './upcoming-opportunities';

interface OpportunitiesViewProps {
    upcomingList: any[];
    rawEvents: any[];
    currentCampaignYear: number | string;
    eventTypeStyles: Record<
        string,
        { bg: string; text: string; border: string; dot: string; label: string }
    >;
    onCreateCampaign: (event: any) => void;
}

export function OpportunitiesView({
    upcomingList,
    rawEvents,
    currentCampaignYear,
    eventTypeStyles,
    onCreateCampaign,
}: OpportunitiesViewProps) {
    return (
        <div className="space-y-6">
            {/* Primary Section: Upcoming Opportunities */}
            <UpcomingOpportunities
                upcomingList={upcomingList}
                currentCampaignYear={currentCampaignYear}
                eventTypeStyles={eventTypeStyles}
                onCreateCampaign={onCreateCampaign}
            />

            {/* Secondary Section: This Year's Events & Holidays */}
            <EventsHolidays
                rawEvents={rawEvents}
                currentCampaignYear={currentCampaignYear}
                eventTypeStyles={eventTypeStyles}
                onCreateCampaign={onCreateCampaign}
            />
        </div>
    );
}
