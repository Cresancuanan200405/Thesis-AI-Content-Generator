import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4 text-foreground selection:bg-primary/20 selection:text-primary sm:p-6">
            {/* Ambient Fixed Background Glow Orbs */}
            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-32 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[140px] dark:bg-primary/20" />
                <div className="absolute top-1/3 -right-32 h-[450px] w-[450px] rounded-full bg-blue-500/12 blur-[130px] dark:bg-blue-500/15" />
                <div className="absolute -bottom-32 -left-32 h-[450px] w-[450px] rounded-full bg-purple-500/12 blur-[130px] dark:bg-purple-500/15" />
            </div>

            <div className="flex w-full max-w-md flex-col gap-6">
                <Link
                    href={home()}
                    className="group flex items-center gap-2.5 self-center font-medium transition-transform active:scale-95"
                >
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-card p-1 shadow-lg ring-1 ring-border/80 transition-transform duration-200 group-hover:scale-105 dark:bg-zinc-900/90 dark:ring-white/15">
                        <AppLogoIcon className="size-full rounded-lg object-contain" />
                        <div className="absolute inset-0 -z-10 rounded-xl bg-primary/25 opacity-70 blur-sm transition-all group-hover:opacity-100 group-hover:blur-md" />
                    </div>
                    <span className="text-base font-bold tracking-tight text-foreground">
                        MarketPilot
                    </span>
                </Link>

                <div className="overflow-hidden rounded-card border border-white/25 bg-card/85 p-6 shadow-2xl backdrop-blur-2xl sm:p-8 dark:border-white/10 dark:bg-card/85">
                    <div className="mb-6 space-y-1.5 text-center">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            {title}
                        </h1>
                        {description && (
                            <p className="text-xs leading-relaxed text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                    <div>{children}</div>
                </div>
            </div>
        </div>
    );
}
