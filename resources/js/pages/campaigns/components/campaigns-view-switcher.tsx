import { Layers, Sparkles } from 'lucide-react';

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
        <div className="inline-flex w-full items-center rounded-xl border border-border/70 bg-muted/40 p-1 text-xs sm:w-auto">
            {/* Opportunities Button */}
            <button
                type="button"
                onClick={() => onViewChange('opportunities')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all sm:flex-initial ${
                    activeView === 'opportunities'
                        ? 'bg-background text-foreground shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                }`}
            >
                <Sparkles
                    className={`h-3.5 w-3.5 transition-colors ${
                        activeView === 'opportunities'
                            ? 'text-primary'
                            : 'text-muted-foreground'
                    }`}
                />
                <span>Opportunities</span>
                {upcomingCount > 0 && (
                    <span className="font-mono text-[11px] font-medium opacity-70">
                        ({upcomingCount})
                    </span>
                )}
            </button>

            {/* Campaign Hub Button */}
            <button
                type="button"
                onClick={() => onViewChange('hub')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all sm:flex-initial ${
                    activeView === 'hub'
                        ? 'bg-background text-foreground shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
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
                    <span className="font-mono text-[11px] font-medium opacity-70">
                        ({campaignCount})
                    </span>
                )}
            </button>
        </div>
    );
}
