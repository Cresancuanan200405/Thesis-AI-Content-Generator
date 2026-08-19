import { createInertiaApp } from '@inertiajs/react';
import type React from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => {
        const pages = import.meta.glob('./pages/**/*.tsx', { eager: true });
        const page: any = pages[`./pages/${name}.tsx`];

        if (page?.default) {
            const rawLayout = page.default.layout;
            const isPlainObject =
                rawLayout &&
                typeof rawLayout === 'object' &&
                !Array.isArray(rawLayout) &&
                !('$$typeof' in rawLayout);

            const breadcrumbs = isPlainObject ? rawLayout.breadcrumbs || [] : [];
            const title = isPlainObject ? rawLayout.title || '' : '';
            const description = isPlainObject ? rawLayout.description || '' : '';

            if (name === 'welcome' || name === 'onboarding' || name.startsWith('onboarding/')) {
                page.default.layout = null;
            } else if (name.startsWith('auth/')) {
                page.default.layout = (children: React.ReactNode) => (
                    <AuthLayout title={title} description={description}>{children}</AuthLayout>
                );
            } else if (name.startsWith('settings/')) {
                page.default.layout = (children: React.ReactNode) => (
                    <AppLayout breadcrumbs={breadcrumbs}>
                        <SettingsLayout>{children}</SettingsLayout>
                    </AppLayout>
                );
            } else {
                page.default.layout = (children: React.ReactNode) => (
                    <AppLayout breadcrumbs={breadcrumbs}>{children}</AppLayout>
                );
            }
        }

        return page;
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
