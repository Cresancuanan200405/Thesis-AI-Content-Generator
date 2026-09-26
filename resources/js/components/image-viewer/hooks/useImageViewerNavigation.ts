import { useEffect, useCallback } from 'react';

interface UseImageViewerNavigationProps<T> {
    items: T[];
    currentIndex: number;
    onNavigate: (index: number) => void;
    getImageUrl: (item: T) => string | null | undefined;
}

export function useImageViewerNavigation<T>({
    items,
    currentIndex,
    onNavigate,
    getImageUrl,
}: UseImageViewerNavigationProps<T>) {
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < items.length - 1;

    const goToPrev = useCallback(() => {
        if (hasPrev) {
            onNavigate(currentIndex - 1);
        }
    }, [hasPrev, currentIndex, onNavigate]);

    const goToNext = useCallback(() => {
        if (hasNext) {
            onNavigate(currentIndex + 1);
        }
    }, [hasNext, currentIndex, onNavigate]);

    // Preload neighboring images for smooth carousel navigation
    useEffect(() => {
        if (items.length === 0) return;

        const urlsToPreload: string[] = [];

        if (hasPrev && items[currentIndex - 1]) {
            const prevUrl = getImageUrl(items[currentIndex - 1]);
            if (prevUrl) urlsToPreload.push(prevUrl);
        }

        if (hasNext && items[currentIndex + 1]) {
            const nextUrl = getImageUrl(items[currentIndex + 1]);
            if (nextUrl) urlsToPreload.push(nextUrl);
        }

        urlsToPreload.forEach((url) => {
            const img = new Image();
            img.src = url;
        });
    }, [currentIndex, items, hasPrev, hasNext, getImageUrl]);

    return {
        hasPrev,
        hasNext,
        goToPrev,
        goToNext,
    };
}
