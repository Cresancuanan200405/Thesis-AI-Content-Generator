import { useEffect } from 'react';

/**
 * Robust scroll lock that prevents background document scrolling while keeping
 * exact scroll position and preventing layout shift from disappearing scrollbars.
 */
export function useImageViewerScrollLock(isOpen: boolean) {
    useEffect(() => {
        if (!isOpen) return;

        const originalBodyOverflow = document.body.style.overflow;
        const originalBodyPosition = document.body.style.position;
        const originalBodyTop = document.body.style.top;
        const originalBodyWidth = document.body.style.width;
        const originalHtmlOverflow = document.documentElement.style.overflow;
        const originalHtmlScrollBehavior = document.documentElement.style.scrollBehavior;

        const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

        document.documentElement.style.overflow = 'hidden';
        document.documentElement.style.scrollBehavior = 'auto';
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';

        if (scrollbarWidth > 0) {
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        }

        return () => {
            document.documentElement.style.overflow = originalHtmlOverflow;
            document.documentElement.style.scrollBehavior = originalHtmlScrollBehavior;
            document.body.style.overflow = originalBodyOverflow;
            document.body.style.position = originalBodyPosition;
            document.body.style.top = originalBodyTop;
            document.body.style.width = originalBodyWidth;
            document.body.style.paddingRight = '';

            window.scrollTo(0, scrollY);
        };
    }, [isOpen]);
}
