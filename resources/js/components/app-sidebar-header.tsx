import { Bell, Check, Monitor, Moon, Sun } from 'lucide-react';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAppearance } from '@/hooks/use-appearance';
import type { Appearance } from '@/hooks/use-appearance';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { appearance, updateAppearance } = useAppearance();

    const themes: {
        value: Appearance;
        label: string;
        icon: typeof Sun;
    }[] = [
        {
            value: 'light',
            label: 'Light',
            icon: Sun,
        },
        {
            value: 'dark',
            label: 'Dark',
            icon: Moon,
        },
        {
            value: 'system',
            label: 'System',
            icon: Monitor,
        },
    ];

    const currentTheme =
        themes.find((theme) => theme.value === appearance) ??
        themes[0];

    const CurrentIcon = currentTheme.icon;

    return (
        <header
            className="
                flex
                h-16
                shrink-0
                items-center
                justify-between
                border-b
                border-sidebar-border/50
                px-4
                transition-[width,height]
                ease-linear
                group-has-data-[collapsible=icon]/sidebar-wrapper:h-12
                md:px-4
            "
        >
            {/* ============================================================
                LEFT SIDE
            ============================================================= */}
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />

                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            {/* ============================================================
                RIGHT SIDE
            ============================================================= */}
            <div className="flex items-center gap-1.5">

                {/* ========================================================
                    THEME DROPDOWN
                ========================================================= */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Choose theme"
                            title="Choose theme"
                            className="
                                h-9
                                w-9
                                rounded-full
                                transition-all
                                duration-200
                                hover:bg-muted
                                data-[state=open]:bg-muted
                                data-[state=open]:text-primary
                            "
                        >
                            <CurrentIcon
                                className="
                                    h-4
                                    w-4
                                    transition-transform
                                    duration-300
                                "
                            />

                            <span className="sr-only">
                                Choose theme
                            </span>
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        align="end"
                        sideOffset={8}
                        className="
                            relative
                            w-36
                            overflow-visible
                            rounded-xl
                            border
                            border-border
                            bg-popover
                            p-1.5
                            shadow-lg
                            shadow-black/10
                            duration-200
                            animate-in
                            fade-in-0
                            zoom-in-95
                            slide-in-from-top-2
                            dark:shadow-black/30
                        "
                    >
                        {/* Pointer */}
                        <span
                            className="
                                absolute
                                -top-1.5
                                right-3
                                h-3
                                w-3
                                rotate-45
                                border-l
                                border-t
                                border-border
                                bg-popover
                            "
                        />

                        {themes.map(
                            ({
                                value,
                                label,
                                icon: Icon,
                            }) => {
                                const selected =
                                    appearance === value;

                                return (
                                    <DropdownMenuItem
                                        key={value}
                                        onClick={() =>
                                            updateAppearance(
                                                value,
                                            )
                                        }
                                        className={`
                                            relative
                                            z-10
                                            cursor-pointer
                                            rounded-lg
                                            px-2.5
                                            py-2
                                            outline-none
                                            transition-all
                                            duration-150

                                            ${
                                                selected
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'text-foreground hover:bg-muted'
                                            }
                                        `}
                                    >
                                        <Icon
                                            className={`
                                                mr-2
                                                h-4
                                                w-4
                                                transition-transform
                                                duration-200

                                                ${
                                                    selected
                                                        ? 'scale-110'
                                                        : ''
                                                }
                                            `}
                                        />

                                        <span className="text-sm font-medium">
                                            {label}
                                        </span>

                                        {selected && (
                                            <Check
                                                className="
                                                    ml-auto
                                                    h-3.5
                                                    w-3.5
                                                    text-primary
                                                "
                                            />
                                        )}
                                    </DropdownMenuItem>
                                );
                            },
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* ========================================================
                    NOTIFICATIONS DROPDOWN
                ========================================================= */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Notifications"
                            title="Notifications"
                            className="
                                h-9
                                w-9
                                rounded-full
                                transition-all
                                duration-200
                                hover:bg-muted
                                data-[state=open]:bg-muted
                                data-[state=open]:text-primary
                            "
                        >
                            <Bell className="h-4 w-4 transition-transform duration-300" />

                            <span className="sr-only">
                                Notifications
                            </span>
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        align="end"
                        sideOffset={8}
                        className="
                            relative
                            w-80
                            overflow-visible
                            rounded-xl
                            border
                            border-border
                            bg-popover
                            p-0
                            shadow-lg
                            shadow-black/10
                            duration-200
                            animate-in
                            fade-in-0
                            zoom-in-95
                            slide-in-from-top-2
                            dark:shadow-black/30
                        "
                    >
                        {/* Pointer connected to notification icon */}
                        <span
                            className="
                                absolute
                                -top-1.5
                                right-3
                                h-3
                                w-3
                                rotate-45
                                border-l
                                border-t
                                border-border
                                bg-popover
                            "
                        />

                        {/* Notification Header */}
                        <div className="relative z-10 flex items-center justify-between border-b border-border px-4 py-3">
                            <div>
                                <p className="text-sm font-semibold text-foreground">
                                    Notifications
                                </p>

                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Stay updated with your workspace
                                </p>
                            </div>

                            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-medium text-primary">
                                0
                            </span>
                        </div>

                        {/* Empty State */}
                        <div className="relative z-10 flex flex-col items-center justify-center px-5 py-8 text-center">
                            <div
                                className="
                                    flex
                                    h-10
                                    w-10
                                    items-center
                                    justify-center
                                    rounded-full
                                    border
                                    border-border
                                    bg-muted/50
                                "
                            >
                                <Bell className="h-4 w-4 text-muted-foreground" />
                            </div>

                            <p className="mt-3 text-sm font-medium text-foreground">
                                You&apos;re all caught up
                            </p>

                            <p className="mt-1 max-w-[220px] text-xs leading-5 text-muted-foreground">
                                New campaign updates and important
                                activity will appear here.
                            </p>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}