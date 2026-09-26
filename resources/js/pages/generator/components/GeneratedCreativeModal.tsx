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
}

export function GeneratedCreativeModal(props: GeneratedCreativeModalProps) {
    const { isOpen, onClose, savedDesign, productName } = props;

    if (!isOpen || !savedDesign?.image_url) {
        return null;
    }

    const viewerItem: GeneratorViewerItem = {
        ...savedDesign,
        image_url: savedDesign.image_url,
        product_name: productName || savedDesign.product_name || 'Generated Marketing Creative',
    };

    return (
        <UnifiedImageViewer
            isOpen={isOpen}
            onClose={onClose}
            items={[viewerItem]}
            currentIndex={0}
            onNavigate={() => {}}
            context="generator"
            renderCustomPanel={(item) => (
                <GeneratorViewerPanel
                    item={item as GeneratorViewerItem}
                    {...props}
                />
            )}
        />
    );
}
