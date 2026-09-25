import { toast } from 'sonner';

/**
 * Downloads an image in PNG, JPEG, or SVG format using HTML5 Canvas & Blob URLs.
 */
export async function downloadVisualAsFormat(
    imageUrl: string | null | undefined,
    filename: string = 'marketing-visual',
    format: 'png' | 'jpeg' | 'svg' = 'png',
): Promise<boolean> {
    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
        toast.error('No image available for download.');
        return false;
    }

    // Sanitize filename for local filesystem
    const cleanName =
        filename
            .replace(/[<>:"/\\|?*]+/g, '-')
            .replace(/\.[^/.]+$/, '')
            .trim() || 'marketing-visual';

    const targetExt = format === 'jpeg' ? 'jpeg' : format === 'svg' ? 'svg' : 'png';
    const toastId = toast.loading(`Preparing ${format.toUpperCase()} download...`);

    try {
        // Handle legacy SVG downloads if called from other pages
        if (format === 'svg') {
            if (imageUrl.includes('.svg')) {
                try {
                    const res = await fetch(imageUrl);
                    if (res.ok) {
                        const svgText = await res.text();
                        const blob = new Blob([svgText], {
                            type: 'image/svg+xml;charset=utf-8',
                        });
                        triggerBlobDownload(blob, `${cleanName}.svg`);
                        toast.success(`Downloaded ${cleanName}.svg`, { id: toastId });
                        return true;
                    }
                } catch {
                    // fallback to canvas/img below
                }
            }

            const img = new Image();
            img.crossOrigin = 'anonymous';
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error('Failed to load image for SVG wrapper'));
                img.src = imageUrl;
            });

            const width = img.naturalWidth || 1024;
            const height = img.naturalHeight || 1024;
            const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <image width="${width}" height="${height}" xlink:href="${imageUrl}" />
</svg>`;
            const blob = new Blob([svgContent], {
                type: 'image/svg+xml;charset=utf-8',
            });
            triggerBlobDownload(blob, `${cleanName}.svg`);
            toast.success(`Downloaded ${cleanName}.svg (SVG Wrapper)`, { id: toastId });
            return true;
        }

        // Normalize URL to relative path if it contains /storage/ or is localhost/same-origin
        let fetchUrl = imageUrl;
        try {
            const storageIdx = imageUrl.indexOf('/storage/');
            if (storageIdx !== -1) {
                fetchUrl = imageUrl.substring(storageIdx);
            } else {
                const parsed = new URL(imageUrl, window.location.href);
                const isLocalHost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
                const isCurrentLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

                if (parsed.origin === window.location.origin || (isLocalHost && isCurrentLocal)) {
                    fetchUrl = parsed.pathname + parsed.search;
                }
            }
        } catch {
            // Keep fetchUrl as imageUrl if parsing fails
        }

        // Fetch image data as Blob
        let sourceBlob: Blob | null = null;
        try {
            const response = await fetch(fetchUrl);
            if (response.ok) {
                sourceBlob = await response.blob();
            }
        } catch {
            // Cross-origin fetch failed, will attempt fallback image loading
        }

        // If requesting PNG and source is already PNG, download directly
        if (format === 'png' && sourceBlob && (sourceBlob.type === 'image/png' || fetchUrl.toLowerCase().endsWith('.png'))) {
            const pngBlob = sourceBlob.type === 'image/png' ? sourceBlob : new Blob([sourceBlob], { type: 'image/png' });
            triggerBlobDownload(pngBlob, `${cleanName}.png`);
            toast.success(`Downloaded ${cleanName}.png`, { id: toastId });
            return true;
        }

        // Load into HTMLImageElement
        const img = new Image();
        let objectUrlToRevoke: string | null = null;

        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Failed to load image element for conversion'));

            if (sourceBlob) {
                // Blob URL is always same-origin, zero CORS issues
                const blobWithMime = sourceBlob.type.startsWith('image/')
                    ? sourceBlob
                    : new Blob([sourceBlob], { type: 'image/png' });
                objectUrlToRevoke = URL.createObjectURL(blobWithMime);
                img.src = objectUrlToRevoke;
            } else {
                img.crossOrigin = 'anonymous';
                const separator = fetchUrl.includes('?') ? '&' : '?';
                img.src = `${fetchUrl}${separator}_cb=${Date.now()}`;
            }
        });

        // Convert via HTML5 Canvas (guarantees genuine PNG or JPEG transcoding)
        const canvas = document.createElement('canvas');
        const width = img.naturalWidth || img.width || 1024;
        const height = img.naturalHeight || img.height || 1024;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
            throw new Error('Could not initialize 2D canvas context');
        }

        // If JPEG: Fill with white background to eliminate transparency turning black
        if (format === 'jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Safe to revoke the object URL only AFTER drawing has finished
        if (objectUrlToRevoke) {
            URL.revokeObjectURL(objectUrlToRevoke);
            objectUrlToRevoke = null;
        }

        const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
        const quality = format === 'jpeg' ? 0.95 : 1.0;

        const exportedBlob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((b) => resolve(b), mimeType, quality);
        });

        if (!exportedBlob) {
            if (sourceBlob) {
                triggerBlobDownload(sourceBlob, `${cleanName}.${targetExt}`);
                toast.success(`Downloaded ${cleanName}.${targetExt}`, { id: toastId });
                return true;
            }
            throw new Error('Canvas blob export failed');
        }

        triggerBlobDownload(exportedBlob, `${cleanName}.${targetExt}`);
        toast.success(`Downloaded ${cleanName}.${targetExt}`, { id: toastId });
        return true;
    } catch (error) {
        console.error('Error during image download:', error);

        // Fallback: direct download link without target="_blank" so modern browsers trigger save instead of navigation
        try {
            const fallbackLink = document.createElement('a');
            fallbackLink.style.display = 'none';
            fallbackLink.href = imageUrl;
            fallbackLink.download = `${cleanName}.${targetExt}`;
            document.body.appendChild(fallbackLink);
            fallbackLink.click();
            setTimeout(() => {
                if (document.body.contains(fallbackLink)) {
                    document.body.removeChild(fallbackLink);
                }
            }, 5000);
            toast.success(`Download started for ${cleanName}.${targetExt}`, { id: toastId });
            return true;
        } catch (fallbackError) {
            console.error('Fallback download failed:', fallbackError);
            toast.error('Failed to download image. Please try opening in a new tab.', { id: toastId });
            return false;
        }
    }
}

/**
 * Triggers a file download in the browser using a Blob object URL.
 * Blob URLs are treated as same-origin, ensuring modern browsers always honor the `download` attribute.
 */
function triggerBlobDownload(blob: Blob, filename: string): void {
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    // Allow sufficient time for the browser to begin reading the blob stream before revoking
    setTimeout(() => {
        if (document.body.contains(link)) {
            document.body.removeChild(link);
        }
        URL.revokeObjectURL(blobUrl);
    }, 15000);
}

