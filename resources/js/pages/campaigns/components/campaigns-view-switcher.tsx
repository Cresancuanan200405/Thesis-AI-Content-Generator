import { CalendarDays, Layers } from 'lucide-react';

interface CampaignsViewSwitcherProps {
    activeView: 'opportunities' | 'hub';
    onViewChange: (view: 'opportunities' | 'hub') => void;
    campaignCount?: number;
    upcomingCount?: number;
}

export function CampaignsViewSwitcher({
    activeView,
    onViewChange,
    campaignCount = 0,
    upcomingCount = 0,
}: CampaignsViewSwitcherProps) {
    return (
        <div className="inline-flex items-center rounded-lg border border-border bg-background p-0.5 shadow-2xs">
            {/* Opportunities Button */}
            <button
                type="button"
                onClick={() => onViewChange('opportunities')}
                className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-all ${
                    activeView === 'opportunities'
                        ? 'bg-card text-foreground shadow-2xs'
                        : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                }`}
            >
                <CalendarDays
                    className={`h-3 w-3 transition-colors ${
                        activeView === 'opportunities'
                            ? 'text-primary'
                            : 'text-muted-foreground'
                    }`}
                />
                <span>Opportunities</span>
                {upcomingCount > 0 && (
                    <span
                        className={`inline-flex items-center justify-center rounded px-1.5 py-0.2 font-mono text-[10px] font-semibold transition-colors ${
                            activeView === 'opportunities'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-muted text-muted-foreground'
                        }`}
                    >
                        {upcomingCount}
                    </span>
                )}
            </button>

            {/* Campaign Hub Button */}
            <button
                type="button"
                onClick={() => onViewChange('hub')}
                className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-all ${
                    activeView === 'hub'
                        ? 'bg-card text-foreground shadow-2xs'
                        : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                }`}
            >
                <Layers
                    className={`h-3 w-3 transition-colors ${
                        activeView === 'hub'
                            ? 'text-primary'
                            : 'text-muted-foreground'
                    }`}
                />
                <span>Campaign Hub</span>
                {campaignCount > 0 && (
                    <span
                        className={`inline-flex items-center justify-center rounded px-1.5 py-0.2 font-mono text-[10px] font-semibold transition-colors ${
                            activeView === 'hub'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-muted text-muted-foreground'
                        }`}
                    >
                        {campaignCount}
                    </span>
                )}
            </button>
        </div>
    );
}
