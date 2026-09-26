import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageViewerNavigationProps {
    hasPrev: boolean;
    hasNext: boolean;
    onPrev: () => void;
    onNext: () => void;
}

export function ImageViewerNavigation({
    hasPrev,
    hasNext,
    onPrev,
    onNext,
}: ImageViewerNavigationProps) {
    return (
        <>
            {hasPrev && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onPrev();
                    }}
                    className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/60 text-white/80 shadow-xl backdrop-blur-md transition-all duration-200 hover:scale-105 hover:border-white/30 hover:bg-black/85 hover:text-white active:scale-95 sm:left-5 sm:h-12 sm:w-12"
                    title="Previous item (←)"
                    aria-label="Previous item"
                >
                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
            )}

            {hasNext && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onNext();
                    }}
                    className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/60 text-white/80 shadow-xl backdrop-blur-md transition-all duration-200 hover:scale-105 hover:border-white/30 hover:bg-black/85 hover:text-white active:scale-95 sm:right-5 sm:h-12 sm:w-12"
                    title="Next item (→)"
                    aria-label="Next item"
                >
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
            )}
        </>
    );
}
