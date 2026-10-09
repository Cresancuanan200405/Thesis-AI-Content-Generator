import { CalendarDays, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CampaignsViewSwitcherProps {
    activeView: 'opportunities' | 'hub';
    onViewChange: (view: 'opportunities' | 'hub') => void;
    campaignCount?: number;
    upcomingCount?: number;
    className?: string;
}

export function CampaignsViewSwitcher({
    activeView,
    onViewChange,
    campaignCount = 0,
    upcomingCount = 0,
    className,
}: CampaignsViewSwitcherProps) {
    return (
        <div
            className={cn(
                'flex w-full items-center justify-center rounded-lg border border-border bg-background p-0.5 shadow-2xs',
                className,
            )}
        >
            {/* Opportunities Button */}
            <button
                type="button"
                onClick={() => onViewChange('opportunities')}
                className={`flex flex-1 h-8 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-all ${
                    activeView === 'opportunities'
                        ? 'bg-card text-foreground shadow-2xs'
                        : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                }`}
            >
                <CalendarDays
                    className={`h-3.5 w-3.5 transition-colors ${
                        activeView === 'opportunities'
                            ? 'text-primary'
                            : 'text-muted-foreground'
                    }`}
                />
                <span>Opportunities</span>
                {upcomingCount > 0 && (
                    <span
                        className={`inline-flex items-center justify-center rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold transition-colors ${
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
                className={`flex flex-1 h-8 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-all ${
                    activeView === 'hub'
                        ? 'bg-card text-foreground shadow-2xs'
                        : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                }`}
            >
                <Layers
                    className={`h-3.5 w-3.5 transition-colors ${
                        activeView === 'hub'
                            ? 'text-primary'
                            : 'text-muted-foreground'
                    }`}
                />
                <span>Campaign Hub</span>
                {campaignCount > 0 && (
                    <span
                        className={`inline-flex items-center justify-center rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold transition-colors ${
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
