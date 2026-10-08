import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { toast } from 'sonner';

import {
    CampaignViewerItem,
    CampaignViewerPanel,
    UnifiedImageViewer,
} from '@/components/image-viewer';
import { downloadVisualAsFormat } from '@/lib/download';
import { AttachExistingDesignsModal } from './components/show/AttachExistingDesignsModal';
import { CampaignCompactContext } from './components/show/CampaignCompactContext';
import { CampaignDesignsSection } from './components/show/CampaignDesignsSection';
import { CampaignHeader } from './components/show/CampaignHeader';
import { CreateDesignSelectionModal } from './components/show/CreateDesignSelectionModal';
import { DeleteCampaignModal } from './components/show/DeleteCampaignModal';
import { DeleteDesignModal } from './components/show/DeleteDesignModal';
import { EditCampaignModal } from './components/show/EditCampaignModal';
import {
    AvailableDesign,
    CampaignData,
    CampaignDesign,
} from './components/show/types';

interface CampaignShowPageProps {
    campaign: CampaignData;
    available_designs?: AvailableDesign[];
}

export default function CampaignShowPage({
    campaign,
    available_designs = [],
}: CampaignShowPageProps) {
    const designs = campaign?.designs || [];

    // Modal states
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isAttachExistingOpen, setIsAttachExistingOpen] = useState(false);
    const [isCreateDesignOpen, setIsCreateDesignOpen] = useState(false);

    // Image Viewer & Design Action states
    const [previewDesign, setPreviewDesign] = useState<CampaignDesign | null>(null);
    const [designToDelete, setDesignToDelete] = useState<CampaignDesign | null>(null);
    const [isDeletingDesign, setIsDeletingDesign] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);

    // Current viewer preview index
    const currentPreviewIndex = previewDesign
        ? designs.findIndex((d) => d.id === previewDesign.id)
        : -1;

    const openPreview = (design: CampaignDesign) => {
        setPreviewDesign(design);
    };

    const closePreview = () => {
        setPreviewDesign(null);
    };

    // Design Actions
    const handleFinalize = (designId: number) => {
        setIsFinalizing(true);
        router.post(
            `/designs/${designId}/finalize`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Design finalized successfully.');
                    setPreviewDesign((prev) =>
                        prev && prev.id === designId
                            ? { ...prev, status: 'final', is_draft: false }
                            : prev,
                    );
                },
                onError: () => {
                    toast.error('Failed to finalize design.');
                },
                onFinish: () => {
                    setIsFinalizing(false);
                },
            },
        );
    };

    const confirmDeleteDesign = () => {
        if (!designToDelete) {
            return;
        }

        setIsDeletingDesign(true);

        router.delete(`/designs/${designToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                const deletedId = designToDelete.id;
                setDesignToDelete(null);

                if (previewDesign?.id === deletedId) {
                    closePreview();
                }

                toast.success('Visual deleted successfully.');
            },
            onError: () => {
                toast.error('Failed to delete visual.');
            },
            onFinish: () => {
                setIsDeletingDesign(false);
            },
        });
    };

    const handleDownload = (
        design: CampaignDesign,
        format: 'png' | 'jpeg' | 'svg',
    ) => {
        const url = design.download_url || design.image_url;
        if (!url) {
            toast.error('No image available to download.');
            return;
        }

        downloadVisualAsFormat(
            url,
            `${campaign.name}-${design.product_name || 'visual'}`,
            format,
        );
    };

    const handleDownloadAll = () => {
        if (designs.length === 0) {
            toast.info('No visual assets to download.');
            return;
        }

        toast.success(`Downloading assets archive for "${campaign.name}"...`);
        window.location.href = `/campaigns/${campaign.id}/download-all`;
    };

    const handleArchive = () => {
        router.post(
            `/campaigns/${campaign.id}/archive`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`"${campaign.name}" moved to archive.`);
                },
                onError: () => {
                    toast.error('Failed to archive campaign.');
                },
            },
        );
    };

    const handleUnarchive = () => {
        router.post(
            `/campaigns/${campaign.id}/unarchive`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`"${campaign.name}" restored to active.`);
                },
                onError: () => {
                    toast.error('Failed to restore campaign.');
                },
            },
        );
    };

    return (
        <>
            <Head title={campaign?.name ?? 'Campaign Details'} />

            <div className="relative flex min-h-screen bg-background text-foreground">
                <main className="min-w-0 flex-1 space-y-6 p-4 pb-20 md:p-6 lg:p-8">
                    {/* 1. CAMPAIGN HEADER */}
                    <CampaignHeader
                        campaign={campaign}
                        onCreateDesign={() => setIsCreateDesignOpen(true)}
                        onEdit={() => setIsEditOpen(true)}
                        onDownloadAll={handleDownloadAll}
                        onArchive={handleArchive}
                        onUnarchive={handleUnarchive}
                        onDelete={() => setIsDeleteOpen(true)}
                    />

                    {/* 2. COMPACT CAMPAIGN CONTEXT (EVENT · PRODUCTS · GENERATION) */}
                    <CampaignCompactContext campaign={campaign} />

                    {/* 3. PRIMARY DESIGNS SECTION (VISUAL FOCUS - DRAFT + FINAL) */}
                    <CampaignDesignsSection
                        campaign={campaign}
                        hasAvailableDesigns={available_designs.length > 0}
                        onCreateDesign={() => setIsCreateDesignOpen(true)}
                        onOpenAttachExisting={() => setIsAttachExistingOpen(true)}
                        onOpenViewer={openPreview}
                        onFinalize={handleFinalize}
                        onDownload={handleDownload}
                        onDelete={(design) => setDesignToDelete(design)}
                        isFinalizing={isFinalizing}
                    />
                </main>
            </div>

            {/* UNIFIED IMAGE VIEWER (PRESERVES EXISTING SHARED INFRASTRUCTURE) */}
            <UnifiedImageViewer
                isOpen={Boolean(previewDesign)}
                onClose={closePreview}
                items={designs}
                currentIndex={currentPreviewIndex}
                onNavigate={(newIndex) => {
                    if (newIndex >= 0 && newIndex < designs.length) {
                        setPreviewDesign(designs[newIndex]);
                    }
                }}
                context="campaign"
                onDownload={(item, format) => {
                    const url =
                        (item as any)?.download_url || (item as any)?.image_url;
                    downloadVisualAsFormat(
                        url,
                        `${campaign.name}-${(item as any)?.product_name || 'visual'}`,
                        format,
                    );
                }}
                renderCustomPanel={(design) => (
                    <CampaignViewerPanel
                        design={design as CampaignViewerItem}
                        campaign={campaign}
                        onFinalize={handleFinalize}
                        isFinalizing={isFinalizing}
                        onDownload={(item, format) => {
                            const url =
                                (item as any)?.download_url || item?.image_url;
                            downloadVisualAsFormat(
                                url,
                                `${campaign.name}-${item?.product_name || 'visual'}`,
                                format,
                            );
                        }}
                        onDelete={(item) =>
                            setDesignToDelete(item as CampaignDesign)
                        }
                    />
                )}
            />

            {/* MODALS */}
            <EditCampaignModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                campaign={campaign}
            />

            <DeleteCampaignModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                campaign={campaign}
            />

            <DeleteDesignModal
                design={designToDelete}
                isOpen={Boolean(designToDelete)}
                onClose={() => setDesignToDelete(null)}
                onConfirm={confirmDeleteDesign}
                isDeleting={isDeletingDesign}
            />

            <AttachExistingDesignsModal
                isOpen={isAttachExistingOpen}
                onClose={() => setIsAttachExistingOpen(false)}
                campaign={campaign}
                availableDesigns={available_designs}
            />

            <CreateDesignSelectionModal
                isOpen={isCreateDesignOpen}
                onClose={() => setIsCreateDesignOpen(false)}
                campaign={campaign}
            />
        </>
    );
}

CampaignShowPage.layout = {
    breadcrumbs: [
        {
            title: 'Campaigns',
            href: '/campaigns',
        },
        {
            title: 'Campaign Details',
            href: '#',
            current: true,
        },
    ],
};
