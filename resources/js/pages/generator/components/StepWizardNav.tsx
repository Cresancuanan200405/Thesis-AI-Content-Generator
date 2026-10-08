import type { LucideIcon } from 'lucide-react';
import { Check } from 'lucide-react';
import type { Step } from './types';

export interface WizardStepItem {
    step: Step;
    title: string;
    subtitle: string;
    icon: LucideIcon;
    isCompleted: boolean;
    isAccessible: boolean;
}

interface StepWizardNavProps {
    currentStep: Step;
    steps: WizardStepItem[];
    onSelectStep: (step: Step) => void;
}

const CHEVRON_DEPTH = 14;

/**
 * Generates an interlocking geometric chevron polygon clip-path for each step.
 * - First step: Flat left edge, sharp rightward chevron vertex at (100% 50%).
 * - Middle steps: Indented left edge receiving previous vertex, sharp rightward vertex at (100% 50%).
 * - Last step: Indented left edge receiving previous vertex, flat right edge.
 */
function getChevronClipPath(index: number, total: number): string | undefined {
    if (total <= 1) {
        return undefined;
    }

    if (index === 0) {
        return `polygon(0% 0%, calc(100% - ${CHEVRON_DEPTH}px) 0%, 100% 50%, calc(100% - ${CHEVRON_DEPTH}px) 100%, 0% 100%)`;
    }

    if (index === total - 1) {
        return `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, ${CHEVRON_DEPTH}px 50%)`;
    }

    return `polygon(0% 0%, calc(100% - ${CHEVRON_DEPTH}px) 0%, 100% 50%, calc(100% - ${CHEVRON_DEPTH}px) 100%, 0% 100%, ${CHEVRON_DEPTH}px 50%)`;
}

function getStepPaddingClass(index: number, total: number): string {
    if (total <= 1) {
        return 'px-4';
    }

    if (index === 0) {
        return 'pl-3.5 pr-6 sm:pl-4 sm:pr-7';
    }

    if (index === total - 1) {
        return 'pl-6 pr-3.5 sm:pl-7 sm:pr-4';
    }

    return 'pl-6 pr-6 sm:pl-7 sm:pr-7';
}

/**
 * Connected Chevron Button Stepper for AI Marketing Studio.
 * Uses geometric clip-path polygons with sharp rightward vertices that seamlessly
 * interlock with the succeeding step's indentation.
 */
export function StepWizardNav({
    currentStep,
    steps,
    onSelectStep,
}: StepWizardNavProps) {
    return (
        <nav
            aria-label="Generation Steps"
            className="relative isolate z-0 w-full select-none"
        >
            <div className="flex w-full items-stretch overflow-hidden rounded-lg border border-border/80 bg-muted/20">
                {steps.map(
                    ({ step, title, isCompleted, isAccessible }, index) => {
                        const isActive = currentStep === step;
                        const clipPath = getChevronClipPath(
                            index,
                            steps.length,
                        );
                        const paddingClass = getStepPaddingClass(
                            index,
                            steps.length,
                        );

                        return (
                            <button
                                key={step}
                                type="button"
                                disabled={!isAccessible}
                                aria-current={isActive ? 'step' : undefined}
                                aria-label={`Step ${step}: ${title}`}
                                onClick={() =>
                                    isAccessible && onSelectStep(step)
                                }
                                style={{
                                    clipPath,
                                    marginLeft:
                                        index === 0 ? 0 : -CHEVRON_DEPTH,
                                    zIndex: isActive ? 4 : steps.length - index,
                                }}
                                className={`group relative flex h-10 min-w-0 flex-1 items-center transition-colors sm:h-11 ${paddingClass} ${
                                    isActive
                                        ? 'bg-primary font-semibold text-primary-foreground shadow-xs'
                                        : isCompleted
                                          ? 'cursor-pointer bg-muted/70 text-foreground hover:bg-muted'
                                          : isAccessible
                                            ? 'cursor-pointer bg-muted/35 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                            : 'cursor-not-allowed bg-muted/15 text-muted-foreground/40 opacity-60'
                                }`}
                            >
                                <div className="flex min-w-0 flex-col items-start justify-center text-left leading-none">
                                    <span
                                        className={`flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase sm:text-[10px] ${
                                            isActive
                                                ? 'text-primary-foreground/80'
                                                : isCompleted
                                                  ? 'text-foreground/70'
                                                  : 'text-muted-foreground/70'
                                        }`}
                                    >
                                        {isCompleted && !isActive && (
                                            <Check className="h-2.5 w-2.5 shrink-0 stroke-[2.5] text-foreground/80" />
                                        )}
                                        Step {step}
                                    </span>
                                    <span
                                        className={`mt-0.5 max-w-full truncate text-[11px] leading-tight font-semibold sm:text-xs ${
                                            isActive
                                                ? 'text-primary-foreground'
                                                : isCompleted
                                                  ? 'text-foreground'
                                                  : 'text-muted-foreground'
                                        }`}
                                    >
                                        {title}
                                    </span>
                                </div>
                            </button>
                        );
                    },
                )}
            </div>
        </nav>
    );
}
