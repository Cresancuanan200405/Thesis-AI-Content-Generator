import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            {/* Ambient Background Glowing Orbs (Glassmorphism Atmosphere) */}
            <div className="pointer-events-none fixed -top-36 -left-36 z-0 h-96 w-96 rounded-full bg-primary/10 blur-[140px]" />
            <div className="pointer-events-none fixed -right-36 -bottom-36 z-0 h-96 w-96 rounded-full bg-blue-500/10 blur-[140px]" />
            <div className="pointer-events-none fixed top-1/3 right-1/4 z-0 h-80 w-80 rounded-full bg-purple-500/5 blur-[150px]" />

            <AppSidebar />
            <AppContent
                variant="sidebar"
                className="relative z-10 min-h-screen overflow-x-clip"
            >
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
        </AppShell>
    );
}
