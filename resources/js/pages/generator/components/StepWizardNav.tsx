import { Check, LucideIcon } from 'lucide-react';
import { Step } from './types';

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

/**
 * Simplified, ultra-low-profile Segmented Progress Bar for AI Marketing Studio steps.
 * Minimizes vertical height to prevent unnecessary scrolling.
 */
export function StepWizardNav({
    currentStep,
    steps,
    onSelectStep,
}: StepWizardNavProps) {
    const gridColsClass = steps.length === 4 ? 'grid-cols-4' : 'grid-cols-3';

    return (
        <nav aria-label="Generation Steps" className="w-full">
            <div className={`grid ${gridColsClass} gap-2 sm:gap-3`}>
                {steps.map(({ step, title, isCompleted, isAccessible }) => {
                    const isActive = currentStep === step;

                    return (
                        <button
                            key={step}
                            type="button"
                            disabled={!isAccessible}
                            onClick={() => isAccessible && onSelectStep(step)}
                            className={`group flex min-w-0 flex-1 flex-col gap-1 text-left transition-all ${
                                isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
                            }`}
                        >
                            {/* Sleek Segment Line */}
                            <div className="relative h-1 w-full overflow-hidden rounded-full bg-muted/60 transition-colors">
                                <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                        isActive
                                            ? 'w-full bg-primary'
                                            : isCompleted
                                              ? 'w-full bg-primary/75'
                                              : 'w-0'
                                    }`}
                                />
                            </div>

                            {/* Minimal Step Label */}
                            <div className="flex min-w-0 items-center gap-1 px-0.5">
                                {isCompleted ? (
                                    <Check className="h-2.5 w-2.5 shrink-0 stroke-[3] text-primary" />
                                ) : (
                                    <span
                                        className={`font-mono text-[10px] shrink-0 ${
                                            isActive
                                                ? 'font-bold text-primary'
                                                : 'text-muted-foreground'
                                        }`}
                                    >
                                        {step}.
                                    </span>
                                )}
                                <span
                                    className={`truncate text-xs transition-colors ${
                                        isActive
                                            ? 'font-bold text-foreground'
                                            : isCompleted
                                              ? 'font-medium text-foreground/80 group-hover:text-foreground'
                                              : 'font-medium text-muted-foreground'
                                    }`}
                                >
                                    {title}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
