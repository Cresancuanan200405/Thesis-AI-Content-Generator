import { Link, router, usePage } from '@inertiajs/react';
import { Bell, CreditCard, LogOut, Settings, User } from 'lucide-react';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout } from '@/routes';
import type { User as UserType } from '@/types';

type Props = {
    user: UserType;
};

export function UserMenuContent({ user }: Props) {
    const cleanup = useMobileNavigation();
    const { unread_notifications_count } = usePage<{
        unread_notifications_count?: number;
    }>().props;
    const unreadCount = Number(unread_notifications_count || 0);

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link
                        className="block w-full cursor-pointer"
                        href="/profile"
                        prefetch
                        onClick={cleanup}
                    >
                        <User className="mr-2 h-4 w-4" />
                        My Profile
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link
                        className="block w-full cursor-pointer"
                        href="/settings/profile"
                        prefetch
                        onClick={cleanup}
                    >
                        <Settings className="mr-2 h-4 w-4" />
                        Account Settings
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link
                        className="flex w-full cursor-pointer items-center justify-between"
                        href="/notifications"
                        prefetch
                        onClick={cleanup}
                    >
                        <span className="flex items-center">
                            <Bell className="mr-2 h-4 w-4" />
                            Notifications
                        </span>
                        {unreadCount > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link
                        className="block w-full cursor-pointer"
                        href="/subscriptions"
                        prefetch
                        onClick={cleanup}
                    >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Subscriptions
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link
                    className="block w-full cursor-pointer"
                    href={logout()}
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Link>
            </DropdownMenuItem>
        </>
    );
}
