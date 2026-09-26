import { useEffect, useRef } from 'react';

interface UseImageViewerKeyboardProps {
    isOpen: boolean;
    onClose: () => void;
    onPrev?: () => void;
    onNext?: () => void;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onFit?: () => void;
    containerRef: React.RefObject<HTMLElement | null>;
}

export function useImageViewerKeyboard({
    isOpen,
    onClose,
    onPrev,
    onNext,
    onZoomIn,
    onZoomOut,
    onFit,
    containerRef,
}: UseImageViewerKeyboardProps) {
    const previousActiveElement = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        // Remember element that had focus before modal opened
        previousActiveElement.current = document.activeElement as HTMLElement | null;

        // Focus the modal container or first focusable child
        const focusTimer = setTimeout(() => {
            if (containerRef.current) {
                const focusable = containerRef.current.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (focusable.length > 0) {
                    focusable[0].focus();
                } else {
                    containerRef.current.focus();
                }
            }
        }, 50);

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if active element is an input or textarea
            const target = e.target as HTMLElement | null;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
                return;
            }

            // Keyboard Shortcuts
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            } else if (e.key === 'ArrowLeft') {
                if (onPrev) {
                    e.preventDefault();
                    onPrev();
                }
            } else if (e.key === 'ArrowRight') {
                if (onNext) {
                    e.preventDefault();
                    onNext();
                }
            } else if (e.key === '+' || e.key === '=') {
                if (onZoomIn) {
                    e.preventDefault();
                    onZoomIn();
                }
            } else if (e.key === '-' || e.key === '_') {
                if (onZoomOut) {
                    e.preventDefault();
                    onZoomOut();
                }
            } else if (e.key === '0') {
                if (onFit) {
                    e.preventDefault();
                    onFit();
                }
            } else if (e.key === 'Tab') {
                // Focus Trap inside the container
                if (!containerRef.current) return;
                const focusable = Array.from(
                    containerRef.current.querySelectorAll<HTMLElement>(
                        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                    )
                ).filter((el) => el.offsetParent !== null); // only visible elements

                if (focusable.length === 0) {
                    e.preventDefault();
                    return;
                }

                const firstEl = focusable[0];
                const lastEl = focusable[focusable.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === firstEl) {
                        e.preventDefault();
                        lastEl.focus();
                    }
                } else {
                    if (document.activeElement === lastEl) {
                        e.preventDefault();
                        firstEl.focus();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            clearTimeout(focusTimer);
            window.removeEventListener('keydown', handleKeyDown);

            // Restore focus when closing
            if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
                previousActiveElement.current.focus();
            }
        };
    }, [isOpen, onClose, onPrev, onNext, onZoomIn, onZoomOut, onFit, containerRef]);
}
