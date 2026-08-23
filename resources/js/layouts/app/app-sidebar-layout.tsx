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
            <div className="pointer-events-none fixed -top-36 -left-36 h-96 w-96 rounded-full bg-primary/10 blur-[140px] z-0" />
            <div className="pointer-events-none fixed -bottom-36 -right-36 h-96 w-96 rounded-full bg-blue-500/10 blur-[140px] z-0" />
            <div className="pointer-events-none fixed top-1/3 right-1/4 h-80 w-80 rounded-full bg-purple-500/5 blur-[150px] z-0" />

            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-clip min-h-screen relative z-10">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
        </AppShell>
    );
}
