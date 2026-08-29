import { useAppearance } from '@/hooks/use-appearance';
import { useFlashToast } from '@/hooks/use-flash-toast';
import { useNotificationToast } from '@/hooks/use-notification-toast';
import { AlertCircle, CheckCircle2, Info, Sparkles } from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster({ ...props }: ToasterProps) {
    const { appearance } = useAppearance();

    useFlashToast();
    useNotificationToast();

    return (
        <Sonner
            theme={appearance}
            className="toaster group"
            position="top-center"
            visibleToasts={1}
            offset={20}
            icons={{
                success: <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />,
                info: <Info className="h-4.5 w-4.5 text-sky-500" />,
                warning: <AlertCircle className="h-4.5 w-4.5 text-amber-500" />,
                error: <AlertCircle className="h-4.5 w-4.5 text-rose-500" />,
                loading: <Sparkles className="h-4.5 w-4.5 text-purple-500 animate-spin" />,
            }}
            toastOptions={{
                classNames: {
                    toast: 'group toast group-[.toaster]:bg-card/95 group-[.toaster]:text-card-foreground group-[.toaster]:border-border group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:backdrop-blur-md group-[.toaster]:p-4 group-[.toaster]:font-sans text-xs sm:text-sm',
                    success: 'group-[.toaster]:border-l-4 group-[.toaster]:border-l-emerald-500',
                    error: 'group-[.toaster]:border-l-4 group-[.toaster]:border-l-rose-500',
                    warning: 'group-[.toaster]:border-l-4 group-[.toaster]:border-l-amber-500',
                    info: 'group-[.toaster]:border-l-4 group-[.toaster]:border-l-sky-500',
                    description: 'group-[.toast]:text-muted-foreground text-xs',
                    actionButton:
                        'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-xl font-bold text-xs',
                    cancelButton:
                        'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-xl text-xs',
                    closeButton:
                        'group-[.toast]:bg-card group-[.toast]:border-border group-[.toast]:text-muted-foreground group-[.toast]:hover:text-foreground',
                },
            }}
            style={
                {
                    zIndex: 150,
                    '--normal-bg': 'var(--popover)',
                    '--normal-text': 'var(--popover-foreground)',
                    '--normal-border': 'var(--border)',
                } as React.CSSProperties
            }
            {...props}
        />
    );
}

export { Toaster };
