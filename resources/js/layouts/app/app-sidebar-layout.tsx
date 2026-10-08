import * as React from 'react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { BreadcrumbContext } from '@/context/breadcrumb-context';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { breadcrumbs: contextBreadcrumbs } = React.useContext(BreadcrumbContext);
    const activeBreadcrumbs = contextBreadcrumbs ?? breadcrumbs;

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent
                variant="sidebar"
                className="relative z-10 min-h-screen min-w-0 max-w-full"
            >
                <AppSidebarHeader breadcrumbs={activeBreadcrumbs} />
                {children}
            </AppContent>
        </AppShell>
    );
}
