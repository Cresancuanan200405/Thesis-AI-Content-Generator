import React from 'react';
import { X, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BackgroundSurface } from './types';

interface ImageViewerHeaderProps {
    title: string;
    currentIndex: number;
    totalItems: number;
    surface: BackgroundSurface;
    onSurfaceChange: (surface: BackgroundSurface) => void;
    onClose: () => void;
    contextBadge?: string;
}

export function ImageViewerHeader({
    title,
    currentIndex,
    totalItems,
    surface,
    onSurfaceChange,
    onClose,
    contextBadge = 'Product',
}: ImageViewerHeaderProps) {
    return (
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-black/60 px-4 backdrop-blur-md sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
                <Badge
                    variant="outline"
                    className="shrink-0 border-white/20 bg-white/5 text-[11px] font-medium text-white/90"
                >
                    {contextBadge}
                </Badge>
                <h2
                    className="truncate text-sm font-semibold tracking-tight text-white sm:text-base"
                    title={title}
                >
                    {title}
                </h2>
                {totalItems > 1 && (
                    <span className="hidden shrink-0 text-xs font-medium text-white/50 sm:inline-block">
                        • {currentIndex + 1} of {totalItems}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2">
                {/* Surface / Backdrop selector for cutout transparency */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 rounded-lg px-2.5 text-xs text-white/70 hover:bg-white/10 hover:text-white"
                            title="Canvas background mode"
                            aria-label="Change canvas background"
                        >
                            <Layers className="h-3.5 w-3.5" />
                            <span className="hidden md:inline capitalize">{surface}</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-40 border-white/15 bg-zinc-900 text-white shadow-2xl backdrop-blur-xl"
                    >
                        <DropdownMenuItem
                            onClick={() => onSurfaceChange('neutral')}
                            className="cursor-pointer text-xs focus:bg-white/15 focus:text-white"
                        >
                            Neutral Slate (Default)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => onSurfaceChange('cinema')}
                            className="cursor-pointer text-xs focus:bg-white/15 focus:text-white"
                        >
                            Cinema Black
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => onSurfaceChange('checkerboard')}
                            className="cursor-pointer text-xs focus:bg-white/15 focus:text-white"
                        >
                            Transparency Grid
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Counter pill for mobile */}
                {totalItems > 1 && (
                    <Badge
                        variant="secondary"
                        className="border-none bg-white/10 text-[10px] text-white/80 sm:hidden"
                    >
                        {currentIndex + 1} / {totalItems}
                    </Badge>
                )}

                {/* Close Button */}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-8 w-8 rounded-lg p-0 text-white/80 hover:bg-white/15 hover:text-white active:scale-95"
                    title="Close (Esc)"
                    aria-label="Close viewer"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </header>
    );
}
