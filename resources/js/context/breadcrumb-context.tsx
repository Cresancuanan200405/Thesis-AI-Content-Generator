import * as React from 'react';
import type { BreadcrumbItem } from '@/types';

interface BreadcrumbContextValue {
    breadcrumbs: BreadcrumbItem[] | null;
    setBreadcrumbs: (breadcrumbs: BreadcrumbItem[] | null) => void;
}

export const BreadcrumbContext = React.createContext<BreadcrumbContextValue>({
    breadcrumbs: null,
    setBreadcrumbs: () => {},
});

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
    const [breadcrumbs, setBreadcrumbs] = React.useState<BreadcrumbItem[] | null>(null);

    return (
        <BreadcrumbContext.Provider value={{ breadcrumbs, setBreadcrumbs }}>
            {children}
        </BreadcrumbContext.Provider>
    );
}

export function useSetBreadcrumbs(breadcrumbs: BreadcrumbItem[]) {
    const { setBreadcrumbs } = React.useContext(BreadcrumbContext);

    React.useEffect(() => {
        setBreadcrumbs(breadcrumbs);
        return () => {
            setBreadcrumbs(null);
        };
    }, [JSON.stringify(breadcrumbs), setBreadcrumbs]);
}
