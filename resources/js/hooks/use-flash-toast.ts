import { router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
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
                const key = `${flash.toast.type}:${flash.toast.message}`;
                if (lastToastRef.current !== key) {
                    lastToastRef.current = key;
                    toast[flash.toast.type](flash.toast.message);
                }
            } else if (flash.success) {
                const key = `success:${flash.success}`;
                if (lastToastRef.current !== key) {
                    lastToastRef.current = key;
                    toast.success(flash.success);
                }
            } else if (flash.error) {
                const key = `error:${flash.error}`;
                if (lastToastRef.current !== key) {
                    lastToastRef.current = key;
                    toast.error(flash.error);
                }
            } else if (flash.info || flash.message) {
                const msg = flash.info || flash.message;
                if (msg) {
                    const key = `info:${msg}`;
                    if (lastToastRef.current !== key) {
                        lastToastRef.current = key;
                        toast.info(msg);
                    }
                }
            }
        };

        const unregisterNavigate = router.on('navigate', (event: any) => {
            const flash = event?.detail?.page?.props?.flash as FlashData | undefined;
            handleFlash(flash);
        });

        const unregisterSuccess = router.on('success', (event: any) => {
            const flash = event?.detail?.page?.props?.flash as FlashData | undefined;
            handleFlash(flash);
        });

        const unregisterFlash = router.on('flash' as any, (event: any) => {
            const flash = event?.detail?.flash as FlashData | undefined;
            handleFlash(flash);
        });

        return () => {
            unregisterNavigate();
            unregisterSuccess();
            unregisterFlash();
        };
    }, []);
}
