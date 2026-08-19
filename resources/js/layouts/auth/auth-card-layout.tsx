import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
        <div className="relative flex min-h-svh flex-col items-center justify-center bg-background p-6 text-foreground md:p-10">
            {/* Ambient Background Glow */}
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_60%)]"
            />

            <div className="flex w-full max-w-md flex-col gap-6">
                <Link
                    href={home()}
                    className="flex items-center gap-3 self-center font-medium transition-transform active:scale-95"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground shadow-sm">
                        <AppLogoIcon className="size-6 fill-current" />
                    </div>
                    <span className="text-sm font-semibold tracking-[0.18em] text-foreground uppercase">
                        MarketPilot
                    </span>
                </Link>

                <Card className="rounded-2xl">
                    <CardHeader className="px-8 pt-8 pb-0 text-center">
                        <CardTitle className="text-2xl font-bold tracking-tight">{title}</CardTitle>
                        {description && <CardDescription className="mt-1.5">{description}</CardDescription>}
                    </CardHeader>
                    <CardContent className="px-8 py-8">
                        {children}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
