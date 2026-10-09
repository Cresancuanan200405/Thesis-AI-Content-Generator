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
                <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link
                        className="flex w-full cursor-pointer items-center gap-2"
                        href="/profile"
                        prefetch
                        onClick={cleanup}
                    >
                        <User className="h-4 w-4 shrink-0" />
                        <span>My Profile</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link
                        className="flex w-full cursor-pointer items-center gap-2"
                        href="/settings/profile"
                        prefetch
                        onClick={cleanup}
                    >
                        <Settings className="h-4 w-4 shrink-0" />
                        <span>Account Settings</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link
                        className="flex w-full cursor-pointer items-center justify-between"
                        href="/notifications"
                        prefetch
                        onClick={cleanup}
                    >
                        <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4 shrink-0" />
                            <span>Notifications</span>
                        </div>
                        {unreadCount > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link
                        className="flex w-full cursor-pointer items-center gap-2"
                        href="/subscriptions"
                        prefetch
                        onClick={cleanup}
                    >
                        <CreditCard className="h-4 w-4 shrink-0" />
                        <span>Subscriptions</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link
                    className="flex w-full cursor-pointer items-center gap-2 text-left"
                    href={logout()}
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className="h-4 w-4 shrink-0" />
                    <span>Sign Out</span>
                </Link>
            </DropdownMenuItem>
        </>
    );
}
