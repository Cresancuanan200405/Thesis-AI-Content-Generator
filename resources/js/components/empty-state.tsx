import React from 'react';
import { Card } from '@/components/ui/card';

interface EmptyStateProps {
    icon: React.ElementType;
    title: string;
    description: React.ReactNode;
    action?: React.ReactNode;
    secondaryAction?: React.ReactNode;
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    secondaryAction,
    className = '',
}: EmptyStateProps) {
    return (
        <Card
            className={`flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card/40 p-8 text-center sm:p-12 ${className}`}
        >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-8 ring-primary/5">
                <Icon className="h-8 w-8 stroke-[1.8]" />
            </div>

            <h3 className="mt-5 text-base font-bold text-foreground sm:text-lg">
                {title}
            </h3>

            <p className="mt-2 max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {description}
            </p>

            {(action || secondaryAction) && (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    {action}
                    {secondaryAction}
                </div>
            )}
        </Card>
    );
}

export default EmptyState;
