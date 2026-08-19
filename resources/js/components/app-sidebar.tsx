import { Link } from '@inertiajs/react';
import {
    CalendarDays,
    Images,
    LayoutDashboard,
    Megaphone,
    Package,
    Plus,
    Sparkles,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'AI Marketing Studio',
        href: '/generator',
        icon: Sparkles,
    },
    {
        title: 'Marketing Calendar',
        href: '/calendar',
        icon: CalendarDays,
    },
    {
        title: 'My Designs',
        href: '/designs',
        icon: Images,
    },
    {
        title: 'Products',
        href: '/products',
        icon: Package,
    },
    {
        title: 'Campaigns',
        href: '/campaigns',
        icon: Megaphone,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="gap-3 pb-3">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                <div className="px-2 group-data-[collapsible=icon]:hidden">
                    <Button
                        asChild
                        className="w-full justify-start gap-2 rounded-xl bg-foreground text-background font-semibold shadow-sm hover:bg-foreground/90 active:scale-[0.98] transition-all"
                        size="sm"
                    >
                        <Link href="/generator">
                            <Plus className="h-4 w-4 shrink-0 stroke-[2.5]" />
                            <span>Quick Create</span>
                        </Link>
                    </Button>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
