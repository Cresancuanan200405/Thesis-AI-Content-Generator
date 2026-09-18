import React from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { BreadcrumbItem } from '@/types';

interface PageHeaderProps {
    title: string;
    description?: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    badge?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

export function PageHeader({
    title,
    description,
    breadcrumbs,
    badge,
    actions,
    className = '',
}: PageHeaderProps) {
    return (
        <div className={`space-y-3 ${className}`}>
            {breadcrumbs && breadcrumbs.length > 0 && (
                <div className="pb-1">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                            {title}
                        </h1>
                        {badge}
                    </div>
                    {description && (
                        <p className="text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>

                {actions && (
                    <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}

export default PageHeader;
