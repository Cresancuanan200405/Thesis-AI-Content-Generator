import * as React from 'react';

import { cn } from '@/lib/utils';

function Progress({
    className,
    value,
    ...props
}: React.ComponentProps<'div'> & { value?: number }) {
    const safeValue = Math.min(Math.max(value ?? 0, 0), 100);

    return (
        <div
            data-slot="progress"
            className={cn(
                'relative h-2 w-full overflow-hidden rounded-full bg-primary/20',
                className,
            )}
            {...props}
        >
            <div
                data-slot="progress-indicator"
                className="h-full bg-primary transition-all duration-200"
                style={{ width: `${safeValue}%` }}
            />
        </div>
    );
}

export { Progress };
