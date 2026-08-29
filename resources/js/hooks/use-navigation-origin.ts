import { usePage } from '@inertiajs/react';
import * as React from 'react';
import type { BreadcrumbItem } from '@/types';

const STORAGE_KEY = 'app_navigation_primary_origin_breadcrumbs';

// Secondary routes where we want to inherit the "where you left off" origin
const SECONDARY_ROUTE_PREFIXES = [
    '/profile',
    '/settings',
    '/subscriptions',
    '/notifications',
];

function isSecondaryRoute(pathname: string): boolean {
    return SECONDARY_ROUTE_PREFIXES.some((prefix) =>
        pathname === prefix || pathname.startsWith(`${prefix}/`) || pathname.startsWith(`${prefix}?`)
    );
}

function resolvePrimaryBreadcrumbs(pathname: string, explicitBreadcrumbs?: BreadcrumbItem[]): BreadcrumbItem[] {
    if (explicitBreadcrumbs && explicitBreadcrumbs.length > 0) {
        // If explicit breadcrumbs were provided and didn't just hardcode 'Dashboard' on a non-dashboard page
        const isGenericDashboard =
            explicitBreadcrumbs.length === 1 &&
            explicitBreadcrumbs[0].href === '/dashboard' &&
            pathname !== '/dashboard' &&
            pathname !== '/';

        if (!isGenericDashboard) {
            return explicitBreadcrumbs;
        }
    }

    if (!pathname || pathname === '/' || pathname === '/dashboard') {
        return [{ title: 'Dashboard', href: '/dashboard' }];
    }

    if (pathname === '/campaigns') {
        return [{ title: 'Campaigns', href: '/campaigns' }];
    }
    if (pathname.startsWith('/campaigns/create')) {
        return [
            { title: 'Campaigns', href: '/campaigns' },
            { title: 'New Campaign', href: '/campaigns/create' },
        ];
    }
    if (pathname.startsWith('/campaigns/')) {
        return [
            { title: 'Campaigns', href: '/campaigns' },
            { title: 'Campaign Details', href: pathname },
        ];
    }

    if (pathname === '/designs') {
        return [{ title: 'Designs', href: '/designs' }];
    }
    if (pathname.startsWith('/designs/')) {
        return [
            { title: 'Designs', href: '/designs' },
            { title: 'Design Studio', href: pathname },
        ];
    }

    if (pathname === '/generator') {
        return [{ title: 'AI Studio', href: '/generator' }];
    }

    if (pathname === '/products') {
        return [{ title: 'Products', href: '/products' }];
    }
    if (pathname.startsWith('/products/create')) {
        return [
            { title: 'Products', href: '/products' },
            { title: 'New Product', href: '/products/create' },
        ];
    }
    if (pathname.startsWith('/products/')) {
        return [
            { title: 'Products', href: '/products' },
            { title: 'Product Details', href: pathname },
        ];
    }

    if (pathname === '/calendar') {
        return [{ title: 'Calendar', href: '/calendar' }];
    }
    if (pathname.startsWith('/events/')) {
        return [
            { title: 'Calendar', href: '/calendar' },
            { title: 'Event Details', href: pathname },
        ];
    }

    // Default fallback parsing
    const segments = pathname.replace(/^\//, '').split('/');
    return segments.map((seg, i) => ({
        title: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
        href: '/' + segments.slice(0, i + 1).join('/'),
    }));
}

function resolveSecondaryTail(pathname: string): BreadcrumbItem[] {
    if (pathname === '/profile' || pathname === '/profile/my-profile') {
        return [{ title: 'My Profile', href: '/profile' }];
    }
    if (pathname === '/profile/show') {
        return [
            { title: 'My Profile', href: '/profile' },
            { title: 'Profile Information', href: '/profile/show' },
        ];
    }
    if (pathname === '/profile/business') {
        return [
            { title: 'My Profile', href: '/profile' },
            { title: 'Business Profile', href: '/profile/business' },
        ];
    }

    if (pathname === '/settings' || pathname === '/settings/profile') {
        return [{ title: 'Account Settings', href: '/settings/profile' }];
    }
    if (pathname === '/settings/security') {
        return [
            { title: 'Account Settings', href: '/settings/profile' },
            { title: 'Security', href: '/settings/security' },
        ];
    }
    if (pathname === '/settings/appearance') {
        return [
            { title: 'Account Settings', href: '/settings/profile' },
            { title: 'Appearance', href: '/settings/appearance' },
        ];
    }

    if (pathname === '/subscriptions') {
        return [{ title: 'Subscriptions & Quota', href: '/subscriptions' }];
    }

    if (pathname === '/notifications') {
        return [{ title: 'Notifications', href: '/notifications' }];
    }

    const segments = pathname.replace(/^\//, '').split('/');
    return segments.map((seg, i) => ({
        title: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
        href: '/' + segments.slice(0, i + 1).join('/'),
    }));
}

/**
 * Hook to resolve contextual breadcrumbs that remember where the user left off
 * when visiting utility/secondary destinations (My Profile, Account Settings, Subscriptions, Notifications).
 */
export function useNavigationOriginBreadcrumbs(explicitBreadcrumbs?: BreadcrumbItem[]): BreadcrumbItem[] {
    const { url } = usePage();
    const pathname = (url || window.location.pathname || '').split('?')[0];

    const isSecondary = isSecondaryRoute(pathname);

    // Track and persist primary workspace location
    React.useEffect(() => {
        if (!isSecondary && typeof window !== 'undefined') {
            const primaryChain = resolvePrimaryBreadcrumbs(pathname, explicitBreadcrumbs);
            try {
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify(primaryChain));
            } catch {
                // Ignore storage quota/security errors
            }
        }
    }, [pathname, explicitBreadcrumbs, isSecondary]);

    return React.useMemo(() => {
        if (!isSecondary) {
            // On a primary page, use its resolved or explicit breadcrumbs
            return resolvePrimaryBreadcrumbs(pathname, explicitBreadcrumbs);
        }

        // On a secondary page: retrieve the origin "where you left off" breadcrumb chain
        let originChain: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

        if (typeof window !== 'undefined') {
            try {
                const stored = sessionStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored) as BreadcrumbItem[];
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        originChain = parsed;
                    }
                }
            } catch {
                // Ignore parsing errors
            }
        }

        const tailChain = resolveSecondaryTail(pathname);

        // Deduplicate in case origin ends with the same href as tail start
        const combined = [...originChain];
        for (const item of tailChain) {
            if (!combined.some((c) => c.href === item.href)) {
                combined.push(item);
            }
        }

        return combined;
    }, [pathname, explicitBreadcrumbs, isSecondary]);
}
