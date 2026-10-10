import { AlertCircle, Loader2, Package } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    BusinessProfile,
    CampaignItem,
    EventItem,
} from './types';

interface SynthesisScreenProps {
    business?: BusinessProfile | null;
    activeIndustry?: string;
    productName?: string;
    productImageUrl?: string | null;
    renderStyle?: string;
    activeCampaign?: CampaignItem | null;
    selectedEvent?: EventItem | null;
    currentStatusMessage: string;
    generationProgress: number;
    onResetToIdle: () => void;
    isError?: boolean;
}

export function SynthesisScreen({
    business,
    activeIndustry = 'Commercial',
    productName,
    productImageUrl,
    renderStyle,
    activeCampaign,
    selectedEvent,
    currentStatusMessage,
    generationProgress,
    onResetToIdle,
    isError = false,
}: SynthesisScreenProps) {
    const imgRef = useRef<HTMLImageElement | null>(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Completely disable and hide scrolling on the page while generating
    useEffect(() => {
        const originalBodyOverflow = document.body.style.overflow;
        const originalHtmlOverflow = document.documentElement.style.overflow;
        const originalBodyOverscroll = document.body.style.overscrollBehavior;
        const originalHtmlOverscroll = document.documentElement.style.overscrollBehavior;

        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overscrollBehavior = 'none';
        document.documentElement.style.overscrollBehavior = 'none';

        // Reset scroll position to top so the card fills the visible viewport exactly
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });

        const preventScroll = (e: Event) => {
            e.preventDefault();
        };

        window.addEventListener('wheel', preventScroll, { passive: false });
        window.addEventListener('touchmove', preventScroll, { passive: false });

        return () => {
            document.body.style.overflow = originalBodyOverflow;
            document.documentElement.style.overflow = originalHtmlOverflow;
            document.body.style.overscrollBehavior = originalBodyOverscroll;
            document.documentElement.style.overscrollBehavior = originalHtmlOverscroll;

            window.removeEventListener('wheel', preventScroll);
            window.removeEventListener('touchmove', preventScroll);
        };
    }, []);

    useEffect(() => {
        if (!productImageUrl) {
            setImageLoaded(false);
            setImageError(false);
            return;
        }

        const img = imgRef.current;
        if (img && img.complete) {
            if (img.naturalWidth > 0) {
                setImageLoaded(true);
                setImageError(false);
            } else {
                setImageError(true);
                setImageLoaded(false);
            }
            return;
        }

        setImageLoaded(false);
        setImageError(false);
    }, [productImageUrl]);

    const showFallback = !productImageUrl || imageError;

    if (isError) {
        return (
            <div className="flex w-full flex-1 h-full min-h-0 items-center justify-center p-3 sm:p-4 lg:p-6 overflow-hidden motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in">
                <div className="relative w-full max-w-md rounded-[12px] border border-destructive/20 bg-card/95 p-6 sm:p-8 text-center shadow-xl backdrop-blur-xl dark:border-destructive/30 dark:bg-[#13151b]">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[10px] border border-destructive/30 bg-destructive/10 text-destructive">
                        <AlertCircle className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-bold text-foreground sm:text-lg">
                        Unable to complete creative generation
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                        {currentStatusMessage || 'Please review your parameters and try again.'}
                    </p>
                    <Button
                        type="button"
                        onClick={onResetToIdle}
                        className="mt-6 cursor-pointer rounded-[8px] px-6 text-xs font-semibold shadow-xs"
                    >
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full flex-1 h-full min-h-0 items-center justify-center p-3 sm:p-4 lg:p-5 overflow-hidden motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in">
            {/* Main spacious loading card with uniform 12px standard curve on all 4 corners */}
            <div className="relative flex flex-col justify-center w-full h-full max-w-5xl xl:max-w-6xl overflow-hidden rounded-[12px] border border-border/70 bg-card/95 p-6 shadow-2xl backdrop-blur-xl transition-all sm:p-8 lg:p-10 dark:border-white/[0.08] dark:bg-[#13151b] dark:shadow-black/60">
                {/* Subtle ambient lighting accent */}
                <div
                    className="pointer-events-none absolute -top-32 -left-32 h-72 w-72 rounded-full bg-primary/5 blur-3xl"
                    aria-hidden="true"
                />
                <div
                    className="pointer-events-none absolute -bottom-32 -right-32 h-72 w-72 rounded-full bg-amber-500/5 blur-3xl"
                    aria-hidden="true"
                />

                {/* Two-Column Responsive Layout */}
                <div className="relative z-10 grid grid-cols-1 items-center gap-6 md:grid-cols-12 lg:gap-8 xl:gap-12 my-auto w-full">
                    {/* Left Column: Prominent Product Preview */}
                    <div className="flex items-center justify-center md:col-span-5">
                        <div className="relative flex aspect-square w-full max-w-[240px] sm:max-w-[280px] md:max-w-[320px] lg:max-w-[360px] xl:max-w-[400px] max-h-[min(400px,45vh)] items-center justify-center overflow-hidden rounded-[12px] border border-border/60 bg-muted/20 p-4 shadow-inner dark:border-white/[0.06] dark:bg-[#0d0f14]">
                            {/* Radial backdrop illumination */}
                            <div
                                className="pointer-events-none absolute inset-0 bg-radial from-primary/10 via-transparent to-transparent opacity-70"
                                aria-hidden="true"
                            />

                            {showFallback ? (
                                <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center text-muted-foreground/60 motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in">
                                    <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-[12px] border border-border/60 bg-muted/40 shadow-xs">
                                        <Package className="h-8 w-8 text-muted-foreground/80 stroke-1" />
                                    </div>
                                    <p
                                        className="max-w-[200px] truncate text-xs font-medium text-muted-foreground"
                                        title={productName || 'Product Asset'}
                                    >
                                        {productName || 'Product Asset'}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Understated skeleton placeholder while image loads */}
                                    {!imageLoaded && (
                                        <div className="absolute inset-5 z-0 flex flex-col items-center justify-center rounded-[10px] bg-muted/20 p-6 text-center text-muted-foreground/40 motion-safe:animate-pulse">
                                            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-[10px] border border-border/40 bg-muted/30">
                                                <Package className="h-7 w-7 text-muted-foreground/50 stroke-1" />
                                            </div>
                                        </div>
                                    )}
                                    <img
                                        ref={imgRef}
                                        key={productImageUrl}
                                        src={productImageUrl}
                                        alt={productName || 'Selected Product'}
                                        onLoad={(e) => {
                                            if (e.currentTarget.naturalWidth > 0) {
                                                setImageLoaded(true);
                                                setImageError(false);
                                            } else {
                                                setImageError(true);
                                                setImageLoaded(false);
                                            }
                                        }}
                                        onError={() => {
                                            setImageError(true);
                                            setImageLoaded(false);
                                        }}
                                        className={`relative z-10 max-h-full max-w-full object-contain drop-shadow-md transition-all duration-300 motion-safe:hover:scale-[1.02] ${
                                            imageLoaded
                                                ? 'opacity-100 scale-100'
                                                : 'opacity-0 scale-95 pointer-events-none'
                                        }`}
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Heading, Stage, and Progress */}
                    <div className="flex flex-col justify-center md:col-span-7">
                        {/* Heading & Supporting Text */}
                        <div>
                            <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl lg:text-2xl leading-tight">
                                Creating your marketing creative
                            </h2>
                            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                                Preparing your product and campaign visuals
                            </p>
                        </div>

                        {/* Current Dynamic Stage Message with understated spinner */}
                        <div className="mt-4 sm:mt-5 flex items-center gap-2.5 text-xs sm:text-sm font-medium text-foreground">
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                            <span className="transition-opacity duration-300">
                                {currentStatusMessage}
                            </span>
                        </div>

                        {/* Truthful Progress Bar */}
                        <div className="mt-3.5 sm:mt-4 space-y-1.5">
                            <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
                                <span>Progress</span>
                                <span className="font-semibold tabular-nums text-foreground">
                                    {generationProgress}%
                                </span>
                            </div>
                            <div className="relative h-2 w-full overflow-hidden rounded-full border border-border/60 bg-muted/40 dark:border-white/[0.08]">
                                <div
                                    className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                                    style={{
                                        width: `${Math.min(100, Math.max(0, generationProgress))}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
