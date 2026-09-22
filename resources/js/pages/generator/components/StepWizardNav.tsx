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

export function StepWizardNav({
    currentStep,
    steps,
    onSelectStep,
}: StepWizardNavProps) {
    return (
        <div className="flex items-center rounded-xl border border-border/80 bg-card/80 p-1 shadow-xs">
            {steps.map(
                ({ step, title, isCompleted, isAccessible }) => {
                    const isActive = currentStep === step;

                    return (
                        <button
                            key={step}
                            type="button"
                            disabled={!isAccessible}
                            onClick={() => {
                                if (isAccessible) {
                                    onSelectStep(step);
                                }
                            }}
                            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left transition-all duration-200 ${
                                isActive
                                    ? 'bg-primary text-primary-foreground shadow-xs'
                                    : isCompleted
                                      ? 'text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400'
                                      : isAccessible
                                        ? 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                                        : 'cursor-not-allowed opacity-40'
                            }`}
                        >
                            {/* Step Number / Check */}
                            <span
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                                    isActive
                                        ? 'bg-white/20'
                                        : isCompleted
                                          ? 'bg-emerald-500/20'
                                          : 'bg-muted/60'
                                }`}
                            >
                                {isCompleted ? (
                                    <Check className="h-2.5 w-2.5" />
                                ) : (
                                    step
                                )}
                            </span>

                            {/* Step Label */}
                            <span className="truncate text-xs font-semibold">
                                <span className="hidden sm:inline">{title}</span>
                                <span className="sm:hidden">{step}</span>
                            </span>
                        </button>
                    );
                },
            )}
        </div>
    );
}
