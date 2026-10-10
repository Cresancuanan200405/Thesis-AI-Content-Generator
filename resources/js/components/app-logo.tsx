import { usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { cn } from '@/lib/utils';

export interface AppLogoProps {
    subtitle?: string;
    className?: string;
    iconClassName?: string;
    showContainer?: boolean;
}

export default function AppLogo({
    subtitle,
    className,
    iconClassName,
    showContainer = false,
}: AppLogoProps = {}) {
    const { name } = usePage().props;

    return (
        <div className={cn('flex items-center gap-2.5', className)}>
            <div
                className={cn(
                    'relative flex aspect-square size-8.5 shrink-0 items-center justify-center transition-transform duration-300 group-hover:scale-105',
                    showContainer &&
                        'rounded-xl bg-card p-0.5 shadow-xs ring-1 ring-border/80 group-hover:ring-primary/40 dark:bg-zinc-900/90 dark:ring-white/15',
                )}
            >
                <AppLogoIcon
                    className={cn(
                        'size-full object-contain',
                        showContainer && 'rounded-lg',
                        iconClassName,
                    )}
                />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold tracking-tight text-foreground">
                    {name ?? 'MarketPilot'}
                </span>
                {subtitle && (
                    <span className="truncate text-[10px] font-medium text-muted-foreground">
                        {subtitle}
                    </span>
                )}
            </div>
        </div>
    );
}
