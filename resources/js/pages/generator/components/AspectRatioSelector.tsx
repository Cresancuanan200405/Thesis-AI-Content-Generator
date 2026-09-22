import { Check, Layers } from 'lucide-react';
import { HelpTooltip } from '@/components/help-tooltip';
import { Badge } from '@/components/ui/badge';
import { aspectRatioOptions } from './types';

interface AspectRatioSelectorProps {
    value: string;
    onChange: (aspectRatio: string) => void;
}

export function AspectRatioSelector({
    value,
    onChange,
}: AspectRatioSelectorProps) {
    const selectedRatio = value || '1:1';

    return (
        <div className="space-y-3 rounded-2xl border border-border/80 bg-card/60 p-4 shadow-xs">
            <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-xs font-bold text-foreground">Canvas Aspect Ratio</span>
                <Badge
                    variant="outline"
                    className="border-primary/30 bg-primary/10 font-mono text-[10px] font-bold text-primary"
                >
                    {selectedRatio}
                </Badge>
                <HelpTooltip text="Select the canvas proportions for your marketing image." />
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1 sm:grid-cols-4">
                {aspectRatioOptions.map((opt) => {
                    const isSelected = selectedRatio === opt.value;

                    return (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => onChange(opt.value)}
                            className={`group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border p-3.5 text-center transition-all ${
                                isSelected
                                    ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30'
                                    : 'border-border/70 bg-card/60 hover:border-primary/40 hover:bg-muted/30'
                            }`}
                        >
                            {isSelected && (
                                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                    <Check className="h-2.5 w-2.5" />
                                </span>
                            )}
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-muted/30">
                                <div
                                    className={`rounded-xs border ${
                                        isSelected
                                            ? 'border-primary bg-primary/50'
                                            : 'border-muted-foreground/60 bg-muted-foreground/20'
                                    } ${
                                        opt.value === '9:16'
                                            ? 'h-6 w-3'
                                            : opt.value === '16:9'
                                              ? 'h-3 w-6'
                                              : opt.value === '4:5'
                                                ? 'h-5 w-4'
                                                : 'h-4.5 w-4.5'
                                    }`}
                                />
                            </div>
                            <div>
                                <span className="block font-mono text-xs font-bold text-foreground">
                                    {opt.label}
                                </span>
                                <span className="block text-[10px] text-muted-foreground">
                                    {opt.badge}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
