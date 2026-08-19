import { HelpCircle } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export function HelpTooltip({ text }: { text: string }) {
    return (
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        onClick={(e) => e.preventDefault()}
                        className="inline-flex items-center justify-center text-muted-foreground/70 hover:text-primary transition-colors focus:outline-none ml-1 cursor-help"
                        aria-label="Help information"
                    >
                        <HelpCircle className="h-3.5 w-3.5" />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs font-normal shadow-md leading-relaxed rounded-xl p-2.5">
                    {text}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
