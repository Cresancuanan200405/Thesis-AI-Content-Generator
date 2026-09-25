import { Layers } from 'lucide-react';
import { HelpTooltip } from '@/components/help-tooltip';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
    const currentOption =
        aspectRatioOptions.find((opt) => opt.value === selectedRatio) ||
        aspectRatioOptions[0];

    return (
        <div className="flex flex-col gap-2.5 rounded-xl border border-border/80 bg-card/60 px-4 py-2.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                    Canvas Aspect Ratio
                </span>
                <Badge
                    variant="outline"
                    className="border-primary/30 bg-primary/10 font-mono text-[10px] font-bold text-primary"
                >
                    {selectedRatio}
                </Badge>
                <HelpTooltip text="Select the canvas proportions for your marketing visual." />
                <span className="hidden text-[11px] text-muted-foreground sm:inline">
                    • {currentOption.description}
                </span>
            </div>

            <div className="w-full sm:w-64">
                <Select value={selectedRatio} onValueChange={onChange}>
                    <SelectTrigger className="h-8 w-full rounded-lg border-border/80 bg-background/80 text-xs font-semibold">
                        <SelectValue placeholder="Select aspect ratio" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/80 bg-popover shadow-md">
                        {aspectRatioOptions.map((opt) => (
                            <SelectItem
                                key={opt.value}
                                value={opt.value}
                                className="cursor-pointer py-2 text-xs"
                            >
                                <div className="flex w-full items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={`shrink-0 rounded-xs border border-primary/50 bg-primary/20 ${
                                                opt.value === '9:16'
                                                    ? 'h-3.5 w-2'
                                                    : opt.value === '16:9'
                                                      ? 'h-2 w-3.5'
                                                      : opt.value === '4:5'
                                                        ? 'h-3 w-2.5'
                                                        : 'h-2.5 w-2.5'
                                            }`}
                                        />
                                        <span className="font-semibold text-foreground">
                                            {opt.label}
                                        </span>
                                    </div>
                                    <span className="font-mono text-[10px] text-muted-foreground">
                                        {opt.badge}
                                    </span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

