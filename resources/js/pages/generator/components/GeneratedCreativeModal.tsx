import React from 'react';
import { UnifiedImageViewer, GeneratorViewerItem } from '@/components/image-viewer';
import { GeneratorViewerPanel } from '@/components/image-viewer/panels/GeneratorViewerPanel';
import { GeneratedDesign } from './types';

export interface GeneratedCreativeModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'automatic' | 'manual';
    productName: string;
    aspectRatio: string;
    campaignName?: string;
    eventName?: string;
    savedDesign: GeneratedDesign | null;
    generatedDesigns?: GeneratedDesign[];
    selectedIndex?: number;
    onSelectIndex?: (index: number) => void;
    isSavedToDesigns: boolean;
    isSavingDesign: boolean;
    onSaveToDesigns: () => void | Promise<void>;
    isSavedAsDraft?: boolean;
    isSavingDraft?: boolean;
    onSaveAsDraft?: () => void | Promise<void>;
    /**
     * Download menu formats supported:
     * - onDownload('png'): Download PNG
     * - onDownload('jpeg'): Download JPEG
     */
    onDownload: (format: 'png' | 'jpeg') => void;
    onRegenerate: () => void;
    onRegenerateSelected?: (index?: number) => void;
    isRegenerating?: boolean;
    isRegeneratingSelected?: boolean;
    onEditCreative: () => void;
    saveError?: string | null;

    // Context & Direction
    catalogProducts?: Array<{ id: number | string; name: string; price?: number | string | null }>;
    customProducts?: Array<{ name: string; price?: string; description?: string }>;
    creativeConcept?: string;
    visualStrategy?: string;
    designTreatment?: string;
    copyEmphasis?: string;
    renderStyle?: string;
    visualTheme?: string | string[];
    brandTone?: string | string[];
    composition?: string;
    cameraViewpoint?: string;
    lightingProfile?: string;

    // Marketing Copy & States
    businessName?: string;
    includeBusinessName?: boolean;
    tagline?: string;
    taglineMode?: string;
    includeTagline?: boolean;
    price?: string | number;
    includePrices?: boolean;
    showEventText?: boolean;

    // Generation Details / Technical
    imageModel?: string;
    hasReferenceImage?: boolean;
    creativeFingerprint?: string;
    origin?: string | null;
    showPanel?: boolean;
}

export function GeneratedCreativeModal(props: GeneratedCreativeModalProps) {
    const {
        isOpen,
        onClose,
        savedDesign,
        generatedDesigns,
        selectedIndex,
        onSelectIndex,
        productName,
        showPanel = false,
        onRegenerate,
        onRegenerateSelected,
        isRegenerating,
        isRegeneratingSelected,
        ...panelProps
    } = props;

    if (!isOpen) {
        return null;
    }

    const availableDesigns = React.useMemo(() => {
        if (generatedDesigns && generatedDesigns.length > 0) {
            return generatedDesigns.filter((d) => Boolean(d.image_url));
        }
        return savedDesign?.image_url ? [savedDesign] : [];
    }, [generatedDesigns, savedDesign]);

    if (availableDesigns.length === 0) {
        return null;
    }

    const viewerItems: GeneratorViewerItem[] = availableDesigns.map((design, index) => ({
        ...design,
        image_url: design.image_url,
        product_name: productName || design.product_name || `Generated Marketing Creative ${index + 1}`,
    }));

    const validIndex =
        selectedIndex !== undefined && selectedIndex >= 0 && selectedIndex < viewerItems.length
            ? selectedIndex
            : 0;

    const handleRegenerate = () => {
        if (props.onRegenerateSelected) {
            props.onRegenerateSelected(validIndex);
        } else if (props.onRegenerate) {
            props.onRegenerate();
        }
    };

    return (
        <UnifiedImageViewer
            isOpen={isOpen}
            onClose={onClose}
            items={viewerItems}
            currentIndex={validIndex}
            onNavigate={(newIndex) => {
                if (onSelectIndex) {
                    onSelectIndex(newIndex);
                }
            }}
            onRegenerate={handleRegenerate}
            isRegenerating={props.isRegeneratingSelected || props.isRegenerating}
            context="generator"
            showPanel={showPanel}
            renderCustomPanel={showPanel ? (item) => (
                <GeneratorViewerPanel
                    item={item as GeneratorViewerItem}
                    productName={productName}
                    onRegenerate={handleRegenerate}
                    {...panelProps}
                />
            ) : undefined}
        />
    );
}
