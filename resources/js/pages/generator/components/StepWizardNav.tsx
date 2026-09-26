import { LucideIcon } from 'lucide-react';
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
 * Professional, low-profile Technical Stepper.
 * Eliminates capsule pills and excess vertical space.
 * Uses a single-accent disciplined neutral palette.
 */
export function StepWizardNav({
    currentStep,
    steps,
    onSelectStep,
}: StepWizardNavProps) {
    const gridColsClass = steps.length === 4 ? 'grid-cols-4' : 'grid-cols-3';

    return (
        <nav aria-label="Generation Steps" className="w-full select-none">
            <div className={`grid ${gridColsClass} rounded-lg border border-border bg-muted/30 p-1`}>
                {steps.map(({ step, title, isCompleted, isAccessible }) => {
                    const isActive = currentStep === step;

                    return (
                        <button
                            key={step}
                            type="button"
                            disabled={!isAccessible}
                            onClick={() => isAccessible && onSelectStep(step)}
                            className={`flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-md px-2 text-xs transition-all ${
                                isActive
                                    ? 'bg-background font-semibold text-foreground shadow-2xs border border-border/80'
                                    : isCompleted
                                      ? 'text-foreground/90 hover:bg-background/50 hover:text-foreground cursor-pointer'
                                      : isAccessible
                                        ? 'text-muted-foreground hover:bg-background/40 hover:text-foreground cursor-pointer'
                                        : 'cursor-not-allowed opacity-40 text-muted-foreground'
                            }`}
                        >
                            <span
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] font-mono font-bold ${
                                    isCompleted
                                        ? 'border border-emerald-500/50 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                        : 'border border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400'
                                }`}
                                title={isCompleted ? 'Step completed' : 'Step incomplete'}
                            >
                                {step}
                            </span>
                            <span className="truncate tracking-tight">{title}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
