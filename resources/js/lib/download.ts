import { toast } from 'sonner';

/**
 * Downloads an image in PNG, JPEG, or SVG format using HTML5 Canvas & SVG embedding.
 */
export async function downloadVisualAsFormat(
    imageUrl: string | null | undefined,
    filename: string = 'marketing-visual',
    format: 'png' | 'jpeg' | 'svg' = 'png',
) {
    if (!imageUrl) {
        toast.error('No image available for download.');
        return;
    }

    const cleanName = filename.replace(/\.[^/.]+$/, '').trim() || 'marketing-visual';

    try {
        if (format === 'svg') {
            if (imageUrl.includes('.svg')) {
                try {
                    const res = await fetch(imageUrl);
                    if (res.ok) {
                        const svgText = await res.text();
                        const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${cleanName}.svg`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        toast.success(`Downloaded ${cleanName}.svg`);
                        return;
                    }
                } catch {
                    // fallback to canvas/img below
                }
            }

            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const width = img.naturalWidth || 1024;
                const height = img.naturalHeight || 1024;
                const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <image width="${width}" height="${height}" xlink:href="${imageUrl}" />
</svg>`;
                const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${cleanName}.svg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                toast.success(`Downloaded ${cleanName}.svg (Vector SVG)`);
            };
            img.onerror = () => {
                const a = document.createElement('a');
                a.href = imageUrl;
                a.download = `${cleanName}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                toast.success(`Downloaded ${cleanName}.png`);
            };
            img.src = imageUrl;
            return;
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || 1024;
            canvas.height = img.naturalHeight || 1024;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                if (format === 'jpeg') {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
                ctx.drawImage(img, 0, 0);
                const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
                const quality = format === 'jpeg' ? 0.92 : 1.0;
                const ext = format === 'jpeg' ? 'jpg' : 'png';

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${cleanName}.${ext}`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            toast.success(`Downloaded ${cleanName}.${ext} (${format.toUpperCase()})`);
                        } else {
                            const a = document.createElement('a');
                            a.href = imageUrl;
                            a.download = `${cleanName}.${ext}`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            toast.success(`Downloaded ${cleanName}.${ext}`);
                        }
                    },
                    mimeType,
                    quality,
                );
            }
        };
        img.onerror = () => {
            const ext = format === 'jpeg' ? 'jpg' : 'png';
            const a = document.createElement('a');
            a.href = imageUrl;
            a.download = `${cleanName}.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            toast.success(`Downloaded ${cleanName}.${ext}`);
        };
        img.src = imageUrl;
    } catch (e) {
        console.error(e);
        const ext = format === 'jpeg' ? 'jpg' : format === 'svg' ? 'svg' : 'png';
        const a = document.createElement('a');
        a.href = imageUrl;
        a.download = `${cleanName}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success(`Downloaded visual`);
    }
}
