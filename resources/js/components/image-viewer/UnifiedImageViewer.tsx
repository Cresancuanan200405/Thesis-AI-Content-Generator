import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UnifiedImageViewerProps, ProductViewerItem } from './types';
import { useImageViewerScrollLock } from './hooks/useImageViewerScrollLock';
import { useImageViewerZoom } from './hooks/useImageViewerZoom';
import { useImageViewerNavigation } from './hooks/useImageViewerNavigation';
import { useImageViewerKeyboard } from './hooks/useImageViewerKeyboard';
import { ImageViewerHeader } from './ImageViewerHeader';
import { ImageViewerStage } from './ImageViewerStage';
import { ImageViewerPanel } from './ImageViewerPanel';
import { ProductViewerPanel } from './panels/ProductViewerPanel';
import { DesignViewerPanel } from './panels/DesignViewerPanel';
import { DesignViewerItem } from './types';

export function UnifiedImageViewer<T = any>({
    isOpen,
    onClose,
    items,
    currentIndex,
    onNavigate,
    context,
    onDownload,
    onEdit,
    onDelete,
    onGenerateAi,
    onFinalize,
    isFinalizing,
    onRegenerate,
    isRegenerating,
    onFavoriteToggle,
    isFavorite,
    getStudioUrl,
    renderCustomPanel,
}: UnifiedImageViewerProps<T>) {
    const [mounted, setMounted] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // 1. Scroll Lock
    useImageViewerScrollLock(isOpen);

    // 2. Zoom & Pan State
    const {
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
    } = useImageViewerZoom('neutral');

    // Reset zoom when navigating to another item
    useEffect(() => {
        resetZoom();
    }, [currentIndex, resetZoom]);

    // 3. Navigation & Preloading
    const getImageUrl = (item: any): string | null | undefined => {
        if (!item) return null;
        return item.image_url || item.imageUrl || null;
    };

    const { hasPrev, hasNext, goToPrev, goToNext } = useImageViewerNavigation({
        items,
        currentIndex,
        onNavigate,
        getImageUrl,
    });

    // 4. Keyboard Shortcuts & Focus Trapping
    useImageViewerKeyboard({
        isOpen,
        onClose,
        onPrev: goToPrev,
        onNext: goToNext,
        onZoomIn: zoomIn,
        onZoomOut: zoomOut,
        onFit: fit,
        containerRef,
    });

    if (!isOpen || !mounted || items.length === 0 || currentIndex < 0 || currentIndex >= items.length) {
        return null;
    }

    const currentItem = items[currentIndex];
    const imageUrl = getImageUrl(currentItem);
    const itemRecord = currentItem as Record<string, any>;
    const itemTitle = itemRecord?.product_name || itemRecord?.name || itemRecord?.title || 'Visual Media';

    const modalContent = (
        <div
            ref={containerRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={`${itemTitle} viewer`}
            className="fixed inset-0 z-[150] flex flex-col bg-black/95 text-white backdrop-blur-xl animate-in fade-in duration-200 outline-hidden select-none overscroll-contain"
        >
            {/* Minimal Header */}
            <ImageViewerHeader
                title={itemTitle}
                currentIndex={currentIndex}
                totalItems={items.length}
                surface={surface}
                onSurfaceChange={setSurface}
                onClose={onClose}
                contextBadge={context === 'product' ? 'Product' : context === 'design' ? 'Design' : context === 'campaign' ? 'Campaign' : context === 'generator' ? 'Generator' : 'Creative'}
            />

            {/* Main Stage & Panel Split View */}
            <div className="flex flex-1 flex-col overflow-hidden min-h-0 lg:flex-row">
                {/* Visual Stage */}
                <ImageViewerStage
                    imageUrl={imageUrl}
                    altText={itemTitle}
                    zoomLevel={zoomLevel}
                    pan={pan}
                    isZoomed={isZoomed}
                    isDragging={isDragging}
                    surface={surface}
                    hasPrev={hasPrev}
                    hasNext={hasNext}
                    onPrev={goToPrev}
                    onNext={goToNext}
                    onZoomIn={zoomIn}
                    onZoomOut={zoomOut}
                    onReset100={reset100}
                    onFit={fit}
                    onToggleZoom={toggleZoom}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                />

                {/* Contextual Action & Metadata Panel */}
                <ImageViewerPanel>
                    {renderCustomPanel ? (
                        renderCustomPanel(currentItem)
                    ) : context === 'product' ? (
                        <ProductViewerPanel
                            product={currentItem as unknown as ProductViewerItem}
                            onDownload={onDownload as any}
                            onDelete={onDelete as any}
                        />
                    ) : context === 'design' ? (
                        <DesignViewerPanel
                            design={currentItem as unknown as DesignViewerItem}
                            onFinalize={onFinalize as any}
                            isFinalizing={isFinalizing}
                            onRegenerate={onRegenerate as any}
                            isRegenerating={isRegenerating}
                            onDownload={onDownload as any}
                            onDelete={onDelete as any}
                            onFavoriteToggle={onFavoriteToggle as any}
                            isFavorite={isFavorite as any}
                            getStudioUrl={getStudioUrl as any}
                        />
                    ) : null}
                </ImageViewerPanel>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
