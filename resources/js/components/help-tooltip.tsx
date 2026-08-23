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
                        className="ml-1 inline-flex cursor-help items-center justify-center text-muted-foreground/70 transition-colors hover:text-primary focus:outline-none"
                        aria-label="Help information"
                    >
                        <HelpCircle className="h-3.5 w-3.5" />
                    </button>
                </TooltipTrigger>
                <TooltipContent
                    side="top"
                    className="max-w-xs rounded-xl p-2.5 text-xs leading-relaxed font-normal shadow-md"
                >
                    {text}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
