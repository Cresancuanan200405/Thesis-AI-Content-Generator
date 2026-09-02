import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export interface AppPaginationProps {
    currentPage: number;
    lastPage: number;
    buildHref?: (page: number) => string;
    onPageChange?: (page: number) => void;
    floating?: boolean;
    className?: string;
}

function useOptionalSidebar() {
    try {
        return useSidebar();
    } catch {
        return null;
    }
}

export function AppPagination({
    currentPage,
    lastPage,
    buildHref,
    onPageChange,
    floating = true,
    className,
}: AppPaginationProps) {
    const sidebar = useOptionalSidebar();

    if (lastPage <= 1) {
        return null;
    }

    // Generate page numbers with smart ellipsis windowing
    const getPageItems = (): (number | 'ellipsis-start' | 'ellipsis-end')[] => {
        if (lastPage <= 7) {
            return Array.from({ length: lastPage }, (_, i) => i + 1);
        }

        const items: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];

        if (currentPage <= 4) {
            // Near beginning: 1, 2, 3, 4, 5, ..., lastPage
            for (let i = 1; i <= Math.max(5, currentPage + 1); i++) {
                items.push(i);
            }
            items.push('ellipsis-end');
            items.push(lastPage);
        } else if (currentPage >= lastPage - 3) {
            // Near end: 1, ..., lastPage-4, lastPage-3, lastPage-2, lastPage-1, lastPage
            items.push(1);
            items.push('ellipsis-start');
            for (let i = Math.min(lastPage - 4, currentPage - 1); i <= lastPage; i++) {
                items.push(i);
            }
        } else {
            // Middle: 1, ..., currentPage-1, currentPage, currentPage+1, ..., lastPage
            items.push(1);
            items.push('ellipsis-start');
            items.push(currentPage - 1);
            items.push(currentPage);
            items.push(currentPage + 1);
            items.push('ellipsis-end');
            items.push(lastPage);
        }

        return items;
    };

    const pages = getPageItems();

    const renderPageElement = (pageNumber: number) => {
        const isActive = pageNumber === currentPage;
        const activeStyles =
            'h-6 w-6 sm:h-6.5 sm:w-6.5 rounded-full bg-primary text-primary-foreground font-bold shadow-xs shadow-primary/30 ring-1 ring-primary/40 scale-105 transition-all text-[11px] sm:text-xs flex items-center justify-center select-none';
        const inactiveStyles =
            'h-6 w-6 sm:h-6.5 sm:w-6.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 dark:hover:bg-white/10 font-medium transition-all cursor-pointer text-[11px] sm:text-xs flex items-center justify-center select-none';

        if (isActive) {
            return (
                <span
                    key={`page-${pageNumber}`}
                    className={activeStyles}
                    aria-current="page"
                >
                    {pageNumber}
                </span>
            );
        }

        if (buildHref) {
            return (
                <Link
                    key={`page-${pageNumber}`}
                    href={buildHref(pageNumber)}
                    className={inactiveStyles}
                >
                    {pageNumber}
                </Link>
            );
        }

        return (
            <button
                key={`page-${pageNumber}`}
                type="button"
                onClick={() => onPageChange?.(pageNumber)}
                className={inactiveStyles}
            >
                {pageNumber}
            </button>
        );
    };

    const hasPrev = currentPage > 1;
    const hasNext = currentPage < lastPage;

    // Responsive alignment with sidebar state
    const sidebarAlignmentClass = React.useMemo(() => {
        if (!floating) return '';
        if (!sidebar || sidebar.isMobile) return 'inset-x-0';
        return sidebar.state === 'expanded'
            ? 'left-0 right-0 md:left-64'
            : 'left-0 right-0 md:left-12';
    }, [floating, sidebar?.isMobile, sidebar?.state]);

    return (
        <nav
            aria-label="Pagination Navigation"
            className={cn(
                floating
                    ? cn(
                          'fixed bottom-4 sm:bottom-5 z-40 flex justify-center pointer-events-none transition-[left,right,padding,bottom] duration-200 ease-linear animate-in fade-in slide-in-from-bottom-2',
                          sidebarAlignmentClass,
                      )
                    : 'flex items-center justify-center pt-6 pb-2',
                className,
            )}
        >
            <div className="pointer-events-auto inline-flex items-center justify-center gap-0.5 sm:gap-1 rounded-full border border-border/80 bg-background/85 px-1.5 py-0.5 sm:px-2 sm:py-0.5 shadow-lg shadow-black/5 backdrop-blur-xl ring-1 ring-black/5 transition-all hover:border-border dark:border-white/15 dark:bg-card/85 dark:shadow-black/40 dark:ring-white/10">
                {/* Previous Button */}
                {hasPrev ? (
                    buildHref ? (
                        <Link
                            href={buildHref(currentPage - 1)}
                            className="flex h-6 w-6 sm:h-6.5 sm:w-6.5 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-muted/80 hover:text-foreground active:scale-95 cursor-pointer dark:hover:bg-white/10"
                            aria-label="Previous page"
                        >
                            <ChevronLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </Link>
                    ) : (
                        <button
                            type="button"
                            onClick={() => onPageChange?.(currentPage - 1)}
                            className="flex h-6 w-6 sm:h-6.5 sm:w-6.5 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-muted/80 hover:text-foreground active:scale-95 cursor-pointer dark:hover:bg-white/10"
                            aria-label="Previous page"
                        >
                            <ChevronLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </button>
                    )
                ) : (
                    <span
                        className="flex h-6 w-6 sm:h-6.5 sm:w-6.5 items-center justify-center rounded-full text-muted-foreground/30 cursor-not-allowed select-none"
                        aria-disabled="true"
                    >
                        <ChevronLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </span>
                )}

                {/* Page Number Items */}
                <div className="flex items-center gap-0.5 sm:gap-1">
                    {pages.map((item, index) => {
                        if (typeof item === 'number') {
                            return renderPageElement(item);
                        }

                        return (
                            <span
                                key={`ellipsis-${index}`}
                                className="flex h-6 w-6 sm:h-6.5 sm:w-6.5 items-center justify-center text-[10px] font-semibold text-muted-foreground/60 select-none"
                            >
                                …
                            </span>
                        );
                    })}
                </div>

                {/* Next Button */}
                {hasNext ? (
                    buildHref ? (
                        <Link
                            href={buildHref(currentPage + 1)}
                            className="flex h-6 w-6 sm:h-6.5 sm:w-6.5 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-muted/80 hover:text-foreground active:scale-95 cursor-pointer dark:hover:bg-white/10"
                            aria-label="Next page"
                        >
                            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </Link>
                    ) : (
                        <button
                            type="button"
                            onClick={() => onPageChange?.(currentPage + 1)}
                            className="flex h-6 w-6 sm:h-6.5 sm:w-6.5 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-muted/80 hover:text-foreground active:scale-95 cursor-pointer dark:hover:bg-white/10"
                            aria-label="Next page"
                        >
                            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </button>
                    )
                ) : (
                    <span
                        className="flex h-6 w-6 sm:h-6.5 sm:w-6.5 items-center justify-center rounded-full text-muted-foreground/30 cursor-not-allowed select-none"
                        aria-disabled="true"
                    >
                        <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </span>
                )}
            </div>
        </nav>
    );
}
