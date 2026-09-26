import { useState, useCallback, useRef } from 'react';
import { ZoomLevel, PanCoordinates, BackgroundSurface } from '../types';

export function useImageViewerZoom(initialSurface: BackgroundSurface = 'neutral') {
    const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('fit');
    const [pan, setPan] = useState<PanCoordinates>({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [surface, setSurface] = useState<BackgroundSurface>(initialSurface);

    const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const panStartRef = useRef<PanCoordinates>({ x: 0, y: 0 });

    const isZoomed = zoomLevel !== 'fit' && typeof zoomLevel === 'number' && zoomLevel > 1;

    const zoomIn = useCallback(() => {
        setZoomLevel((prev) => {
            if (prev === 'fit') return 1.25;
            return Math.min(Number((prev + 0.25).toFixed(2)), 3.0);
        });
    }, []);

    const zoomOut = useCallback(() => {
        setZoomLevel((prev) => {
            if (prev === 'fit') return 0.75;
            const next = Math.max(Number((prev - 0.25).toFixed(2)), 0.5);
            if (next <= 1) setPan({ x: 0, y: 0 });
            return next;
        });
    }, []);

    const reset100 = useCallback(() => {
        setZoomLevel(1);
        setPan({ x: 0, y: 0 });
    }, []);

    const fit = useCallback(() => {
        setZoomLevel('fit');
        setPan({ x: 0, y: 0 });
    }, []);

    const toggleZoom = useCallback(() => {
        if (zoomLevel === 'fit' || zoomLevel === 1) {
            setZoomLevel(1.75);
        } else {
            fit();
        }
    }, [zoomLevel, fit]);

    const resetZoom = useCallback(() => {
        setZoomLevel('fit');
        setPan({ x: 0, y: 0 });
    }, []);

    // Drag / Pan Mouse Handlers
    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (!isZoomed || e.button !== 0) return;
            e.preventDefault();
            setIsDragging(true);
            dragStartRef.current = { x: e.clientX, y: e.clientY };
            panStartRef.current = { ...pan };
        },
        [isZoomed, pan]
    );

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!isDragging || !isZoomed) return;
            const deltaX = e.clientX - dragStartRef.current.x;
            const deltaY = e.clientY - dragStartRef.current.y;
            setPan({
                x: panStartRef.current.x + deltaX,
                y: panStartRef.current.y + deltaY,
            });
        },
        [isDragging, isZoomed]
    );

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Touch Handlers for Mobile Pan
    const handleTouchStart = useCallback(
        (e: React.TouchEvent) => {
            if (!isZoomed || e.touches.length !== 1) return;
            setIsDragging(true);
            const touch = e.touches[0];
            dragStartRef.current = { x: touch.clientX, y: touch.clientY };
            panStartRef.current = { ...pan };
        },
        [isZoomed, pan]
    );

    const handleTouchMove = useCallback(
        (e: React.TouchEvent) => {
            if (!isDragging || !isZoomed || e.touches.length !== 1) return;
            const touch = e.touches[0];
            const deltaX = touch.clientX - dragStartRef.current.x;
            const deltaY = touch.clientY - dragStartRef.current.y;
            setPan({
                x: panStartRef.current.x + deltaX,
                y: panStartRef.current.y + deltaY,
            });
        },
        [isDragging, isZoomed]
    );

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    return {
        zoomLevel,
        pan,
        isZoomed,
        isDragging,
        surface,
        setSurface,
        zoomIn,
        zoomOut,
        reset100,
        fit,
        toggleZoom,
        resetZoom,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
    };
}
