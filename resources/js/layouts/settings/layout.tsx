import { Link } from '@inertiajs/react';
import { Shield, UserCog } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

const settingsNavItems: NavItem[] = [
    {
        title: 'Profile & Preferences',
        href: edit(),
        icon: UserCog,
    },
    {
        title: 'Security',
        href: editSecurity(),
        icon: Shield,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
            <div className="border-b border-border/70 pb-5">
                <Heading
                    title="Account Settings"
                    description="Manage your personal credentials, appearance preferences, security, and authentication."
                />
            </div>

            <div className="flex flex-col lg:flex-row lg:space-x-10">
                <aside className="w-full shrink-0 lg:w-60">
                    <nav
                        className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:space-y-1 lg:overflow-x-visible"
                        aria-label="Settings"
                    >
                        {settingsNavItems.map((item, index) => {
                            const Icon = item.icon;
                            const isActive = isCurrentOrParentUrl(item.href);

                            return (
                                <Button
                                    key={`${toUrl(item.href)}-${index}`}
                                    size="sm"
                                    variant="ghost"
                                    asChild
                                    className={cn(
                                        'h-10 w-full justify-start gap-2.5 rounded-xl px-3.5 text-xs font-semibold transition-colors',
                                        isActive
                                            ? 'bg-primary/10 text-primary hover:bg-primary/15'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                    )}
                                >
                                    <Link href={item.href}>
                                        {Icon && (
                                            <Icon className="h-4 w-4 shrink-0" />
                                        )}
                                        <span>{item.title}</span>
                                    </Link>
                                </Button>
                            );
                        })}
                    </nav>
                </aside>

                <Separator className="my-6 lg:hidden" />

                <main className="flex-1 overflow-hidden">
                    <div className="max-w-3xl space-y-8">{children}</div>
                </main>
            </div>
        </div>
    );
}
