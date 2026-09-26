import { useState } from 'react';
import { Check, ChevronDown, Layers } from 'lucide-react';
import { HelpTooltip } from '@/components/help-tooltip';
import { aspectRatioOptions } from './types';

interface AspectRatioSelectorProps {
    value: string;
    onChange: (aspectRatio: string) => void;
    defaultOpen?: boolean;
}

/**
 * Clickable card-based Canvas Aspect Ratio Selector with expandable dropdown section.
 * Allows instant, effortless 1-click selection across commercial ratios.
 */
export function AspectRatioSelector({
    value,
    onChange,
    defaultOpen = true,
}: AspectRatioSelectorProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const selectedRatio = value || '1:1';
    const selectedOption = aspectRatioOptions.find((o) => o.value === selectedRatio);

    return (
        <div className="space-y-2.5 rounded-xl border border-border/80 bg-card/60 p-3 shadow-xs">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between cursor-pointer select-none text-left"
            >
                <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 shrink-0 text-primary" />
                    <span className="text-xs font-bold text-foreground">
                        Canvas Aspect Ratio
                    </span>
                    <HelpTooltip text="Select canvas proportions tailored to your target marketing channel." />
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                        {selectedRatio} ({selectedOption?.badge || 'Ratio'})
                    </span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {isOpen && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200 grid grid-cols-2 gap-2.5 sm:grid-cols-4 pt-1">
                    {aspectRatioOptions.map((opt) => {
                        const isSelected = selectedRatio === opt.value;

                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => onChange(opt.value)}
                                className={`group relative flex flex-col items-center justify-between rounded-xl border p-3 text-center transition-all cursor-pointer select-none ${
                                    isSelected
                                        ? 'border-emerald-500 bg-emerald-500/10 shadow-xs ring-1 ring-emerald-500/40'
                                        : 'border-border/80 bg-card hover:border-emerald-500/40 hover:bg-muted/30'
                                }`}
                            >
                                {/* Proportional visual box preview */}
                                <div className="flex h-16 w-full items-center justify-center">
                                    <div
                                        className={`rounded-sm border-2 transition-all ${
                                            isSelected
                                                ? 'border-emerald-500 bg-emerald-500/20 shadow-xs'
                                                : 'border-muted-foreground/40 bg-muted/30 group-hover:border-emerald-500/60'
                                        } ${
                                            opt.value === '9:16'
                                                ? 'h-14 w-8'
                                                : opt.value === '16:9'
                                                  ? 'h-8 w-14'
                                                  : opt.value === '4:5'
                                                    ? 'h-13 w-10'
                                                    : 'h-11 w-11'
                                        }`}
                                    />
                                </div>

                                <div className="mt-2 w-full space-y-0.5">
                                    <div className="flex items-center justify-center gap-1">
                                        <span className={`font-mono text-xs font-bold ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                                            {opt.value}
                                        </span>
                                    </div>
                                    <p className="truncate text-[11px] font-medium text-foreground">
                                        {opt.label.replace(` (${opt.value})`, '')}
                                    </p>
                                    <p className="line-clamp-1 text-[10px] text-muted-foreground">
                                        {opt.badge}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
