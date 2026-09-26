import React, { useState } from 'react';
import { Tag, AlertCircle, Loader2 } from 'lucide-react';
import { ZoomLevel, PanCoordinates, BackgroundSurface } from './types';
import { ImageViewerControls } from './ImageViewerControls';
import { ImageViewerNavigation } from './ImageViewerNavigation';

interface ImageViewerStageProps {
    imageUrl?: string | null;
    altText: string;
    zoomLevel: ZoomLevel;
    pan: PanCoordinates;
    isZoomed: boolean;
    isDragging: boolean;
    surface: BackgroundSurface;
    hasPrev: boolean;
    hasNext: boolean;
    onPrev: () => void;
    onNext: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset100: () => void;
    onFit: () => void;
    onToggleZoom: () => void;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
}

export function ImageViewerStage({
    imageUrl,
    altText,
    zoomLevel,
    pan,
    isZoomed,
    isDragging,
    surface,
    hasPrev,
    hasNext,
    onPrev,
    onNext,
    onZoomIn,
    onZoomOut,
    onReset100,
    onFit,
    onToggleZoom,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
}: ImageViewerStageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    // Surface class styles
    const surfaceStyles: Record<BackgroundSurface, string> = {
        cinema: 'bg-black',
        neutral: 'bg-gradient-to-b from-zinc-900/90 via-zinc-950 to-black',
        checkerboard:
            'bg-[linear-gradient(45deg,#18181b_25%,transparent_25%),linear-gradient(-45deg,#18181b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#18181b_75%),linear-gradient(-45deg,transparent_75%,#18181b_75%)] bg-[size:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0] bg-zinc-900',
    };

    const currentScale =
        zoomLevel === 'fit'
            ? 1
            : typeof zoomLevel === 'number'
            ? zoomLevel
            : 1;

    return (
        <div
            className={`relative flex flex-1 flex-col items-center justify-center overflow-hidden select-none transition-colors duration-300 ${surfaceStyles[surface]}`}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* Ambient Background Glow for Product Contrast */}
            {surface === 'neutral' && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30 blur-3xl">
                    <div className="h-[450px] w-[450px] rounded-full bg-gradient-to-tr from-white/10 via-primary/10 to-transparent" />
                </div>
            )}

            {/* Navigation Chevrons */}
            <ImageViewerNavigation
                hasPrev={hasPrev}
                hasNext={hasNext}
                onPrev={onPrev}
                onNext={onNext}
            />

            {/* Main Image Stage */}
            <div className="relative z-10 flex h-full w-full items-center justify-center p-4 sm:p-6 md:p-8">
                {imageUrl && !hasError ? (
                    <>
                        {/* Loading Indicator */}
                        {isLoading && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center">
                                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-4 py-2 text-xs font-medium text-white/80 backdrop-blur-md">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    Loading visual...
                                </div>
                            </div>
                        )}

                        <img
                            src={imageUrl}
                            alt={altText}
                            onLoad={() => setIsLoading(false)}
                            onError={() => {
                                setIsLoading(false);
                                setHasError(true);
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!isDragging) {
                                    onToggleZoom();
                                }
                            }}
                            style={{
                                transform: isZoomed
                                    ? `scale(${currentScale}) translate(${pan.x / currentScale}px, ${pan.y / currentScale}px)`
                                    : 'scale(1)',
                                cursor: isZoomed
                                    ? isDragging
                                        ? 'grabbing'
                                        : 'grab'
                                    : 'zoom-in',
                            }}
                            className={`block max-h-[calc(100vh-10rem)] max-w-full rounded-lg object-contain drop-shadow-2xl transition-transform ${
                                isDragging ? 'duration-0' : 'duration-200 ease-out'
                            }`}
                            draggable={false}
                        />
                    </>
                ) : hasError ? (
                    <div className="flex flex-col items-center justify-center text-center text-white/60">
                        <AlertCircle className="h-12 w-12 text-destructive/80 mb-2" />
                        <p className="text-sm font-medium text-white/90">
                            Failed to load image
                        </p>
                        <p className="text-xs text-white/50 mt-1">
                            The visual could not be retrieved.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center text-white/50">
                        <Tag className="h-14 w-14 opacity-40 mb-2" />
                        <p className="text-sm font-medium">
                            No visual uploaded for this item
                        </p>
                    </div>
                )}
            </div>

            {/* Floating Zoom Controls Pill */}
            {imageUrl && !hasError && (
                <div className="absolute bottom-5 z-20 flex justify-center">
                    <ImageViewerControls
                        zoomLevel={zoomLevel}
                        onZoomIn={onZoomIn}
                        onZoomOut={onZoomOut}
                        onReset100={onReset100}
                        onFit={onFit}
                        isZoomed={isZoomed}
                    />
                </div>
            )}
        </div>
    );
}
