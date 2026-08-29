import { router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { showSemanticToast } from '@/components/notification-toast';
import type { FlashToast } from '@/types/ui';

type FlashData = {
    success?: string | null;
    error?: string | null;
    info?: string | null;
    message?: string | null;
    toast?: FlashToast | null;
};

export function useFlashToast(): void {
    const lastToastRef = useRef<string | null>(null);

    useEffect(() => {
        const handleFlash = (flash?: FlashData | null) => {
            if (!flash) {
                return;
            }

            if (flash.toast?.type && flash.toast?.message) {
                const title = flash.toast.title || (
                    flash.toast.type === 'success' ? 'Success' :
                    flash.toast.type === 'error' ? 'Error' :
                    'Notification'
                );
                const key = `${flash.toast.type}:${title}:${flash.toast.message}`;

                if (lastToastRef.current !== key) {
                    lastToastRef.current = key;
                    showSemanticToast({
                        type: flash.toast.type,
                        title,
                        message: flash.toast.message,
                        action_url: flash.toast.action_url,
                    });
                }
            } else if (flash.success) {
                const key = `success:${flash.success}`;

                if (lastToastRef.current !== key) {
                    lastToastRef.current = key;
                    showSemanticToast({
                        type: 'success',
                        title: 'Success',
                        message: flash.success,
                    });
                }
            } else if (flash.error) {
                const key = `error:${flash.error}`;

                if (lastToastRef.current !== key) {
                    lastToastRef.current = key;
                    showSemanticToast({
                        type: 'error',
                        title: 'Error',
                        message: flash.error,
                    });
                }
            } else if (flash.info || flash.message) {
                const msg = flash.info || flash.message;

                if (msg) {
                    const key = `info:${msg}`;

                    if (lastToastRef.current !== key) {
                        lastToastRef.current = key;
                        showSemanticToast({
                            type: 'info',
                            title: 'Information',
                            message: msg,
                        });
                    }
                }
            }
        };

        // Check initial page flash on mount (e.g. after full page redirects like logout)
        try {
            const dataPage =
                document.querySelector('script[data-page]')?.textContent ||
                document.getElementById('app')?.getAttribute('data-page');

            if (dataPage) {
                const parsed = JSON.parse(dataPage);
                if (parsed?.props?.flash) {
                    handleFlash(parsed.props.flash);
                }
            } else {
                const routerWithPage = router as unknown as {
                    page?: { props?: { flash?: FlashData } };
                };
                if (routerWithPage.page?.props?.flash) {
                    handleFlash(routerWithPage.page.props.flash);
                }
            }
        } catch {
            // Ignore parse errors
        }

        const unregisterNavigate = router.on('navigate', (event: any) => {
            const flash = event?.detail?.page?.props?.flash as
                FlashData | undefined;
            handleFlash(flash);
        });

        return () => {
            unregisterNavigate();
        };
    }, []);
}
