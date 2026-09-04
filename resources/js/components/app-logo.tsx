import { usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <div className="flex items-center gap-2.5">
            <div className="relative flex aspect-square size-8.5 shrink-0 items-center justify-center rounded-xl bg-card p-0.5 shadow-xs ring-1 ring-border/80 transition-all duration-300 group-hover:scale-105 group-hover:ring-primary/40 dark:bg-zinc-900/90 dark:ring-white/15">
                <AppLogoIcon className="size-full rounded-lg object-contain" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-extrabold tracking-tight text-foreground">
                    {name ?? 'MarketPilot'}
                </span>
                <span className="truncate text-[10px] font-medium text-muted-foreground">
                    MarketPilot
                </span>
            </div>
        </div>
    );
}
