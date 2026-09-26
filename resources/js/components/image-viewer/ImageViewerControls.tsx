import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';
import { ZoomLevel } from './types';

interface ImageViewerControlsProps {
    zoomLevel: ZoomLevel;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset100: () => void;
    onFit: () => void;
    isZoomed: boolean;
}

export function ImageViewerControls({
    zoomLevel,
    onZoomIn,
    onZoomOut,
    onReset100,
    onFit,
    isZoomed,
}: ImageViewerControlsProps) {
    const formattedZoom =
        zoomLevel === 'fit'
            ? 'Fit'
            : `${Math.round(zoomLevel * 100)}%`;

    return (
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/15 bg-black/75 px-2 py-1 shadow-2xl backdrop-blur-xl">
            {/* Zoom Out Button */}
            <button
                type="button"
                onClick={onZoomOut}
                className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 transition-all hover:bg-white/20 hover:text-white active:scale-95 disabled:opacity-30"
                title="Zoom Out (-)"
                aria-label="Zoom Out"
            >
                <ZoomOut className="h-3.5 w-3.5" />
            </button>

            {/* 100% Button */}
            <button
                type="button"
                onClick={onReset100}
                className={`min-w-[48px] rounded-full px-2 py-0.5 text-[11px] font-mono font-medium transition-all ${
                    zoomLevel === 1
                        ? 'bg-primary text-primary-foreground font-bold'
                        : 'text-white/80 hover:bg-white/15 hover:text-white'
                }`}
                title="Zoom to 100%"
                aria-label="Zoom to 100%"
            >
                {formattedZoom}
            </button>

            {/* Zoom In Button */}
            <button
                type="button"
                onClick={onZoomIn}
                className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 transition-all hover:bg-white/20 hover:text-white active:scale-95 disabled:opacity-30"
                title="Zoom In (+)"
                aria-label="Zoom In"
            >
                <ZoomIn className="h-3.5 w-3.5" />
            </button>

            <div className="mx-0.5 h-3.5 w-[1px] bg-white/20" />

            {/* Fit to Viewport Button */}
            <button
                type="button"
                onClick={onFit}
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-all ${
                    zoomLevel === 'fit'
                        ? 'bg-white/20 text-white font-semibold'
                        : 'text-white/70 hover:bg-white/15 hover:text-white'
                }`}
                title="Fit to Screen (0)"
                aria-label="Fit image to screen"
            >
                <Maximize2 className="h-3 w-3" />
                <span>Fit</span>
            </button>
        </div>
    );
}
