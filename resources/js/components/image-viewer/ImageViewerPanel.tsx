import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface ImageViewerPanelProps {
    children: React.ReactNode;
}

export function ImageViewerPanel({ children }: ImageViewerPanelProps) {
    const [isMobileExpanded, setIsMobileExpanded] = useState(false);

    return (
        <aside
            className={`flex flex-col min-h-0 overflow-hidden border-t border-border/80 bg-background/95 backdrop-blur-2xl transition-all duration-300 lg:h-full lg:w-[380px] xl:w-[420px] 2xl:w-[460px] lg:min-w-[360px] lg:max-w-[480px] lg:shrink-0 lg:border-t-0 lg:border-l lg:bg-card/95 ${
                isMobileExpanded
                    ? 'h-[75vh] max-h-[560px]'
                    : 'h-[200px] max-h-[220px] lg:h-full lg:max-h-none'
            }`}
        >
            {/* Mobile Sheet Handle / Toggle */}
            <div className="flex items-center justify-between border-b border-border/40 px-4 py-2 lg:hidden">
                <button
                    type="button"
                    onClick={() => setIsMobileExpanded(!isMobileExpanded)}
                    className="flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                    aria-label={
                        isMobileExpanded ? 'Collapse panel' : 'Expand panel'
                    }
                >
                    <div className="h-1 w-10 rounded-full bg-muted-foreground/30 mb-1" />
                </button>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                {children}
            </div>
        </aside>
    );
}
