import React, { useEffect, useRef, useState } from 'react';

export interface SectionRevealRenderProps {
    isVisible: boolean;
    exitDirection: 'up' | 'down';
    getStaggerStyle: (index?: number) => React.CSSProperties;
}

export interface SectionRevealProps {
    children:
        | React.ReactNode
        | ((props: SectionRevealRenderProps) => React.ReactNode);
    className?: string;
    prefersReducedMotion?: boolean;
    rootMargin?: string;
    threshold?: number | number[];
}

/**
 * SectionReveal
 * Lightweight, accessible scroll-triggered entrance and exit transition component.
 * Uses native browser IntersectionObserver to animate section content smoothly in both directions
 * while keeping section backgrounds, ambient glows, and layout dimensions completely stable.
 */
export function SectionReveal({
    children,
    className = '',
    prefersReducedMotion = false,
    rootMargin = '-6% 0px -6% 0px',
    threshold = 0,
}: SectionRevealProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [exitDirection, setExitDirection] = useState<'up' | 'down'>('down');

    useEffect(() => {
        if (prefersReducedMotion) {
            setIsVisible(true);
            return;
        }

        const el = containerRef.current;
        if (!el) {
            return;
        }

        if (
            typeof window === 'undefined' ||
            !('IntersectionObserver' in window)
        ) {
            setIsVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (!entry) return;

                if (entry.isIntersecting) {
                    setIsVisible(true);
                } else {
                    const rootTop = entry.rootBounds ? entry.rootBounds.top : 0;
                    if (entry.boundingClientRect.top < rootTop) {
                        setExitDirection('up'); // Exited through the top (user scrolled down)
                    } else {
                        setExitDirection('down'); // Exited through the bottom (user scrolled up)
                    }
                    setIsVisible(false);
                }
            },
            {
                rootMargin,
                threshold,
            },
        );

        observer.observe(el);

        return () => observer.disconnect();
    }, [prefersReducedMotion, rootMargin, threshold]);

    // Optional stagger helper for child cards/elements
    const getStaggerStyle = (index: number = 0): React.CSSProperties => {
        if (prefersReducedMotion) {
            return {};
        }

        const delayMs = isVisible ? Math.min(index * 75, 450) : 0;
        const translateY = isVisible
            ? '0px'
            : exitDirection === 'up'
              ? '-16px'
              : '16px';

        return {
            opacity: isVisible ? 1 : 0,
            transform: `translate3d(0, ${translateY}, 0)`,
            transitionProperty: 'opacity, transform',
            transitionDuration: '650ms',
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            transitionDelay: `${delayMs}ms`,
            willChange: 'opacity, transform',
        };
    };

    const containerStyle: React.CSSProperties = prefersReducedMotion
        ? {}
        : {
              opacity: isVisible ? 1 : 0,
              transform: `translate3d(0, ${
                  isVisible ? '0px' : exitDirection === 'up' ? '-18px' : '18px'
              }, 0)`,
              transitionProperty: 'opacity, transform',
              transitionDuration: '650ms',
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              willChange: 'opacity, transform',
          };

    const isFunctionChildren = typeof children === 'function';

    return (
        <div
            ref={containerRef}
            className={className}
            style={isFunctionChildren ? undefined : containerStyle}
        >
            {isFunctionChildren
                ? (
                      children as (
                          props: SectionRevealRenderProps,
                      ) => React.ReactNode
                  )({
                      isVisible,
                      exitDirection,
                      getStaggerStyle,
                  })
                : children}
        </div>
    );
}

export default SectionReveal;
