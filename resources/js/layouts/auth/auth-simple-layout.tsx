import { Link } from '@inertiajs/react';
import React, { useEffect } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
    logoClassName,
    titleClassName,
}: AuthLayoutProps) {
    // Automatically synchronize with operating-system theme preference
    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const syncTheme = () => {
            const isDark = mq.matches;
            document.documentElement.classList.toggle('dark', isDark);
            document.documentElement.style.colorScheme = isDark
                ? 'dark'
                : 'light';
        };

        syncTheme();
        mq.addEventListener('change', syncTheme);
        return () => mq.removeEventListener('change', syncTheme);
    }, []);

    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-zinc-50 px-4 py-10 text-zinc-900 antialiased transition-colors duration-200 selection:bg-zinc-900/20 selection:text-zinc-900 sm:py-16 dark:bg-[#09090b] dark:text-[#f4f4f5] dark:selection:bg-white/20 dark:selection:text-white">
            <div className="w-full max-w-[380px] sm:max-w-[420px]">
                {/* Centered Logo & Header */}
                <div className="mb-7 flex flex-col items-center text-center">
                    <Link
                        href={home()}
                        className={cn(
                            'group mb-4 inline-flex items-center justify-center transition-transform duration-200 hover:opacity-90 active:scale-95',
                            logoClassName,
                        )}
                        aria-label="MarketPilot Home"
                    >
                        <AppLogoIcon className="h-11 w-11 object-contain sm:h-12 sm:w-12" />
                    </Link>

                    {title && (
                        <h1
                            className={cn(
                                'font-black tracking-tight text-zinc-950 dark:text-white',
                                titleClassName ||
                                    'text-4xl leading-tight sm:text-5xl',
                            )}
                        >
                            {title}
                        </h1>
                    )}

                    {description && (
                        <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                            {description}
                        </p>
                    )}
                </div>

                {/* Form Body */}
                <div>{children}</div>
            </div>
        </div>
    );
}
