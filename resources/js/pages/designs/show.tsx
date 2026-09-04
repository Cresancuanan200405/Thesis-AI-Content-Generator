import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Briefcase,
    Building2,
    Car,
    ChevronDown,
    ChevronUp,
    Coffee,
    Cpu,
    Download,
    Dumbbell,
    ExternalLink,
    GraduationCap,
    Heart,
    HeartPulse,
    ImageIcon,
    Landmark,
    Plane,
    RefreshCw,
    ShieldCheck,
    Shirt,
    ShoppingBag,
    ShoppingBasket,
    Sparkles,
    Trash2,
    Utensils,
    UtensilsCrossed,
    X,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { createElement, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { useSidebar } from '@/components/ui/sidebar';

const resolveIndustryIcon = (
    industry?: string | null,
    category?: string | null,
) => {
    const raw = `${industry || ''} ${category || ''}`.toLowerCase().trim();

    if (!raw) {
        return Sparkles;
    }

    if (
        raw.includes('coffee') ||
        raw.includes('cafe') ||
        raw.includes('café') ||
        raw.includes('tea') ||
        raw.includes('beverage')
    ) {
        return Coffee;
    }

    if (
        raw.includes('food') ||
        raw.includes('restaurant') ||
        raw.includes('dining') ||
        raw.includes('eatery')
    ) {
        return UtensilsCrossed;
    }

    if (
        raw.includes('bakery') ||
        raw.includes('pastry') ||
        raw.includes('bread') ||
        raw.includes('dessert') ||
        raw.includes('cake')
    ) {
        return Utensils;
    }

    if (
        raw.includes('fashion') ||
        raw.includes('apparel') ||
        raw.includes('clothing') ||
        raw.includes('wear') ||
        raw.includes('garment')
    ) {
        return Shirt;
    }

    if (
        raw.includes('beauty') ||
        raw.includes('wellness') ||
        raw.includes('cosmetic') ||
        raw.includes('skincare') ||
        raw.includes('salon')
    ) {
        return Sparkles;
    }

    if (
        raw.includes('fitness') ||
        raw.includes('gym') ||
        raw.includes('sport') ||
        raw.includes('workout')
    ) {
        return Dumbbell;
    }

    if (
        raw.includes('grocery') ||
        raw.includes('market') ||
        raw.includes('supermarket') ||
        raw.includes('produce')
    ) {
        return ShoppingBasket;
    }

    if (
        raw.includes('retail') ||
        raw.includes('e-commerce') ||
        raw.includes('shop') ||
        raw.includes('store')
    ) {
        return ShoppingBag;
    }

    if (
        raw.includes('tech') ||
        raw.includes('software') ||
        raw.includes('app') ||
        raw.includes('digital') ||
        raw.includes('it')
    ) {
        return Cpu;
    }

    if (
        raw.includes('health') ||
        raw.includes('medical') ||
        raw.includes('clinic') ||
        raw.includes('care')
    ) {
        return HeartPulse;
    }

    if (
        raw.includes('real estate') ||
        raw.includes('property') ||
        raw.includes('realty') ||
        raw.includes('housing')
    ) {
        return Building2;
    }

    if (
        raw.includes('education') ||
        raw.includes('school') ||
        raw.includes('academy') ||
        raw.includes('learning')
    ) {
        return GraduationCap;
    }

    if (
        raw.includes('professional') ||
        raw.includes('consulting') ||
        raw.includes('agency') ||
        raw.includes('service') ||
        raw.includes('legal')
    ) {
        return Briefcase;
    }

    if (
        raw.includes('travel') ||
        raw.includes('hospitality') ||
        raw.includes('hotel') ||
        raw.includes('tourism') ||
        raw.includes('flight')
    ) {
        return Plane;
    }

    if (
        raw.includes('auto') ||
        raw.includes('vehicle') ||
        raw.includes('car') ||
        raw.includes('motor')
    ) {
        return Car;
    }

    if (
        raw.includes('finance') ||
        raw.includes('banking') ||
        raw.includes('investment') ||
        raw.includes('accounting')
    ) {
        return Landmark;
    }

    return Sparkles;
};

const regenerationStatusPhrases = [
    'Analyzing creative parameters & scene...',
    'Composing lighting, shadows & atmosphere...',
    'Synthesizing fresh visual variation...',
    'Applying commercial typography hierarchy...',
    'Finalizing high-fidelity rendering...',
];

export default function DesignShowPage({ design }: any) {
    const { state: sidebarState } = useSidebar();
    const [isFavorite, setIsFavorite] = useState<boolean>(
        Boolean(design.is_favorite),
    );
    const [isGenerationDetailsOpen, setIsGenerationDetailsOpen] =
        useState(false);
    const [isPreviewFullViewOpen, setIsPreviewFullViewOpen] = useState(false);
    const [isPreviewZoomed, setIsPreviewZoomed] = useState(false);
    const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(15);
    const [rotatingPhraseIndex, setRotatingPhraseIndex] = useState(0);

    const activeIndustry = design.business_industry || 'Creative Marketing';
    const currentStatusMessage =
        regenerationStatusPhrases[
            rotatingPhraseIndex % regenerationStatusPhrases.length
        ];

    // Progress animation and message rotation during regeneration
    useEffect(() => {
        if (!isRegenerating) {
            setGenerationProgress(15);
            setRotatingPhraseIndex(0);

            return;
        }

        const progressInterval = window.setInterval(() => {
            setGenerationProgress((prev) => {
                if (prev < 35) {
                    return prev + 6;
                }

                if (prev < 65) {
                    return prev + 4;
                }

                if (prev < 85) {
                    return prev + 2;
                }

                if (prev < 95) {
                    return prev + 1;
                }

                return prev;
            });
        }, 500);

        const phraseInterval = window.setInterval(() => {
            setRotatingPhraseIndex(
                (prev) => (prev + 1) % regenerationStatusPhrases.length,
            );
        }, 2200);

        return () => {
            window.clearInterval(progressInterval);
            window.clearInterval(phraseInterval);
        };
    }, [isRegenerating]);

    useEffect(() => {
        if (!isRegenerating) {
            return;
        }

        const originalBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = originalBodyOverflow;
        };
    }, [isRegenerating]);

    // Tab visibility and exit warning during regeneration
    useEffect(() => {
        if (!isRegenerating) {
            return;
        }

        const originalTitle =
            typeof document !== 'undefined' ? document.title : '';

        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (typeof document !== 'undefined') {
                    document.title =
                        '⚠️ Regenerating... Keep Tab Open! — MarketPilot';
                }

                toast.warning('Warning: You switched away from this tab!', {
                    description:
                        'Keep this tab active and in focus. Switching tabs or minimizing the browser may interrupt visual creative regeneration.',
                    duration: 8000,
                    id: 'tab-switch-warning',
                });
            } else {
                if (typeof document !== 'undefined') {
                    document.title = originalTitle;
                }
            }
        };

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue =
                'Visual creative regeneration is in progress. Leaving this page will interrupt it.';

            return e.returnValue;
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            if (typeof document !== 'undefined' && originalTitle) {
                document.title = originalTitle;
            }

            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange,
            );
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isRegenerating]);

    const meta = design.generation_metadata || {};
    const isProductPreserved = Boolean(
        meta.product_preserved ||
        meta.generation_mode === 'PRODUCT_PRESERVING' ||
        meta.generation_method === 'image_to_image_edit',
    );
    const promptVersion = meta.prompt_version || 'marketing-pipeline-v1';
    const modelName =
        meta.model_name ||
        (meta.model === 'gpt-image-2'
            ? 'GPT-Image-2'
            : meta.model || 'GPT-Image-2');
    const generationMethod =
        meta.generation_method === 'image_to_image_edit'
            ? 'Image-to-Image Edit'
            : meta.generation_method || 'Image-to-Image Edit';
    const aspectRatio = meta.aspect_ratio || '1:1';
    const duration = meta.duration_seconds ? `${meta.duration_seconds}s` : null;

    const toggleFavorite = async () => {
        const nextVal = !isFavorite;
        setIsFavorite(nextVal);

        try {
            const res = await fetch(`/designs/${design.id}/favorite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN':
                        document.querySelector<HTMLMetaElement>(
                            'meta[name="csrf-token"]',
                        )?.content || '',
                },
            });

            if (!res.ok) {
                throw new Error('Failed to update favorite');
            }

            const data = await res.json();
            setIsFavorite(data.is_favorite);
            toast.success(
                data.message ||
                    (data.is_favorite
                        ? 'Added to favorites'
                        : 'Removed from favorites'),
            );
        } catch {
            setIsFavorite(!nextVal);
            toast.error('Unable to update favorite status.');
        }
    };

    const handleDelete = () => {
        router.delete(`/designs/${design.id}`);
    };

    const handleRegenerate = () => {
        setIsRegenerateModalOpen(false);
        setIsRegenerating(true);
        router.post(
            `/designs/${design.id}/regenerate`,
            {},
            {
                onFinish: () => setIsRegenerating(false),
                onError: () => {
                    toast.error(
                        'Unable to regenerate design. Please try again.',
                    );
                },
            },
        );
    };

    return (
        <>
            <Head title={design.product_name || 'Design'} />

            <div className="space-y-6 p-4 md:p-6">
                {/* Page Header */}
                <div className="flex flex-col gap-5 rounded-2xl border border-border/80 bg-card/80 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl md:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="bg-background/60"
                            >
                                <Link href="/designs">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to My Designs
                                </Link>
                            </Button>

                            <div className="hidden h-5 w-px bg-border sm:block" />

                            <div className="hidden sm:block">
                                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                    Design detail
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={toggleFavorite}
                                className={`gap-2 bg-background/60 ${
                                    isFavorite
                                        ? 'border-rose-500/40 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 hover:text-rose-600'
                                        : 'hover:text-rose-500'
                                }`}
                            >
                                <Heart
                                    className={`h-4 w-4 ${
                                        isFavorite
                                            ? 'fill-rose-500 text-rose-500'
                                            : ''
                                    }`}
                                />
                                {isFavorite ? 'Favorited' : 'Favorite'}
                            </Button>

                            <Button
                                asChild
                                variant="outline"
                                className="bg-background/60"
                            >
                                <a
                                    href={design.download_url}
                                    className="inline-flex items-center gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Download
                                </a>
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsRegenerateModalOpen(true)}
                                disabled={isRegenerating}
                                className="gap-2 bg-background/60 text-primary hover:bg-primary/10 hover:text-primary"
                            >
                                <RefreshCw
                                    className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`}
                                />
                                {isRegenerating
                                    ? 'Regenerating...'
                                    : 'Regenerate Design'}
                            </Button>

                            <Button asChild className="gap-2">
                                <Link href="/generator">
                                    <Sparkles className="h-4 w-4" />
                                    Create Another Design
                                </Link>
                            </Button>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="gap-2 border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                    </Button>
                                </DialogTrigger>

                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            Delete this design?
                                        </DialogTitle>

                                        <DialogDescription>
                                            This will remove the generated image
                                            and the design record from your
                                            account.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <DialogFooter>
                                        <Button variant="outline" type="button">
                                            Cancel
                                        </Button>

                                        <Button
                                            variant="destructive"
                                            type="button"
                                            onClick={handleDelete}
                                        >
                                            Delete design
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <Dialog
                                open={isRegenerateModalOpen}
                                onOpenChange={setIsRegenerateModalOpen}
                            >
                                <DialogContent className="rounded-3xl sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle className="text-lg font-bold">
                                            Regenerate Creative Design?
                                        </DialogTitle>
                                        <DialogDescription className="text-xs leading-relaxed">
                                            This will create a fresh creative
                                            variation using your original
                                            product, scene prompt, brand
                                            styling, pricing, and campaign
                                            settings.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <DialogFooter className="mt-6 gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setIsRegenerateModalOpen(false)
                                            }
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={handleRegenerate}
                                            disabled={isRegenerating}
                                            className="gap-2"
                                        >
                                            <RefreshCw
                                                className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`}
                                            />
                                            {isRegenerating
                                                ? 'Regenerating...'
                                                : 'Yes, Regenerate'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                    {/* Generated Design */}
                    <Card className="overflow-hidden border-border/80 bg-card/80 shadow-[0_10px_35px_rgba(15,23,42,0.07)] backdrop-blur-xl">
                        <CardContent className="p-0">
                            <div className="relative overflow-hidden bg-muted/30">
                                {design.image_url ? (
                                    <div
                                        onClick={() => {
                                            setIsPreviewFullViewOpen(true);
                                            setIsPreviewZoomed(false);
                                        }}
                                        className="group relative cursor-pointer"
                                    >
                                        <img
                                            src={design.image_url}
                                            alt={
                                                design.product_name ||
                                                'Generated design'
                                            }
                                            className="max-h-[760px] min-h-[420px] w-full object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                                        />
                                        <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/60 via-transparent to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                                            <span className="flex items-center gap-1.5 rounded-xl bg-black/75 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-md">
                                                <ZoomIn className="h-4 w-4" />
                                                Click to view full size
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex min-h-[520px] items-center justify-center bg-muted/40 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-background/70">
                                                <ImageIcon className="h-8 w-8" />
                                            </div>

                                            <p className="text-sm">
                                                No image available
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Details */}
                    <div className="space-y-6">
                        {/* Design Information */}
                        <Card className="border-border/80 bg-card/80 shadow-[0_10px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl">
                            <CardHeader className="border-b border-border/70 pb-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-medium text-muted-foreground">
                                                Generated marketing visual
                                            </p>
                                            {isProductPreserved && (
                                                <Badge
                                                    variant="outline"
                                                    className="border-emerald-500/30 bg-emerald-500/10 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
                                                >
                                                    <ShieldCheck className="mr-1 inline h-3 w-3" />
                                                    Product-First Generation
                                                </Badge>
                                            )}
                                        </div>

                                        <CardTitle className="mt-1 text-2xl tracking-tight">
                                            {design.product_name ||
                                                'Untitled design'}
                                        </CardTitle>
                                    </div>

                                    <Badge
                                        variant={
                                            design.status === 'completed'
                                                ? 'default'
                                                : 'secondary'
                                        }
                                        className="shrink-0"
                                    >
                                        {design.status}
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="pt-5">
                                <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                                    <div>
                                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                            Business
                                        </p>

                                        <p className="mt-1.5 text-sm font-medium text-foreground">
                                            {design.business_name || '—'}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                            Event
                                        </p>

                                        <p className="mt-1.5 text-sm font-medium text-foreground">
                                            {design.event_name || '—'}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                            Brand tone
                                        </p>

                                        <p className="mt-1.5 text-sm font-medium text-foreground">
                                            {design.brand_tone || '—'}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                            Content style
                                        </p>

                                        <p className="mt-1.5 text-sm font-medium text-foreground">
                                            {design.visual_theme || '—'}
                                        </p>
                                    </div>

                                    <div className="sm:col-span-2">
                                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                            Tagline
                                        </p>

                                        <div className="mt-2 rounded-xl border border-border/70 bg-muted/30 p-3">
                                            <p className="text-sm leading-6 text-foreground">
                                                {design.tagline || '—'}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                            Created
                                        </p>

                                        <p className="mt-1.5 text-sm font-medium text-foreground">
                                            {design.created_at || '—'}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                            Status
                                        </p>

                                        <p className="mt-1.5 text-sm font-medium text-foreground capitalize">
                                            {design.status || '—'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Collapsible Technical Summary / Generation Details */}
                        <Card className="border-border/80 bg-card/80 shadow-[0_10px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl">
                            <CardHeader
                                className="cursor-pointer border-b border-border/70 pb-4 transition-colors hover:bg-muted/20"
                                onClick={() =>
                                    setIsGenerationDetailsOpen(
                                        !isGenerationDetailsOpen,
                                    )
                                }
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Cpu className="h-4 w-4 text-primary" />
                                        <CardTitle className="text-base">
                                            Generation Details
                                        </CardTitle>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        type="button"
                                        aria-label="Toggle generation details"
                                    >
                                        {isGenerationDetailsOpen ? (
                                            <ChevronUp className="h-4 w-4" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </CardHeader>

                            {isGenerationDetailsOpen && (
                                <CardContent className="space-y-4 pt-4">
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5">
                                            <p className="font-mono text-[10px] font-semibold text-muted-foreground uppercase">
                                                Model
                                            </p>
                                            <p className="mt-1 font-semibold text-foreground">
                                                {modelName}
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5">
                                            <p className="font-mono text-[10px] font-semibold text-muted-foreground uppercase">
                                                Method
                                            </p>
                                            <p className="mt-1 font-semibold text-foreground">
                                                {generationMethod}
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5">
                                            <p className="font-mono text-[10px] font-semibold text-muted-foreground uppercase">
                                                Product Source
                                            </p>
                                            <p className="mt-1 font-semibold text-foreground">
                                                {isProductPreserved
                                                    ? 'Catalog Product Preserved'
                                                    : 'Text Concept'}
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5">
                                            <p className="font-mono text-[10px] font-semibold text-muted-foreground uppercase">
                                                Prompt Version
                                            </p>
                                            <p className="mt-1 font-mono text-foreground">
                                                {promptVersion}
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5">
                                            <p className="font-mono text-[10px] font-semibold text-muted-foreground uppercase">
                                                Aspect Ratio
                                            </p>
                                            <p className="mt-1 font-semibold text-foreground">
                                                {aspectRatio}
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5">
                                            <p className="font-mono text-[10px] font-semibold text-muted-foreground uppercase">
                                                Safe Margin
                                            </p>
                                            <p className="mt-1 font-semibold text-foreground">
                                                20% Safe Zone Enforced
                                            </p>
                                        </div>
                                        {duration && (
                                            <div className="col-span-2 rounded-xl border border-border/60 bg-muted/20 p-2.5">
                                                <p className="font-mono text-[10px] font-semibold text-muted-foreground uppercase">
                                                    Generation Duration
                                                </p>
                                                <p className="mt-1 font-semibold text-foreground">
                                                    {duration}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            )}
                        </Card>

                        {/* Prompt Details */}
                        <Card className="border-border/80 bg-card/80 shadow-[0_10px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl">
                            <CardHeader className="border-b border-border/70 pb-4">
                                <CardTitle className="text-lg">
                                    Prompt details
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="pt-5">
                                <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                                    <p className="text-sm leading-6 whitespace-pre-wrap text-muted-foreground">
                                        {design.prompt ||
                                            'No prompt details available yet.'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Full Size Modal Viewer */}
            {isPreviewFullViewOpen && design.image_url && (
                <div
                    className="fixed inset-0 z-50 flex animate-in flex-col items-center justify-between overflow-hidden bg-black/95 backdrop-blur-md duration-200 select-none fade-in"
                    onClick={() => {
                        setIsPreviewFullViewOpen(false);
                        setIsPreviewZoomed(false);
                    }}
                >
                    {/* Top Floating Control Bar */}
                    <div
                        className="relative z-50 flex w-full items-center justify-between bg-gradient-to-b from-black/90 via-black/60 to-transparent px-4 py-3 sm:px-8 sm:py-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3">
                            <h2 className="max-w-[200px] truncate text-sm font-semibold text-white sm:max-w-md sm:text-base">
                                {design.product_name || 'Generated Design'}
                            </h2>
                            <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 font-mono text-xs text-white">
                                {meta.aspect_ratio || '1:1'}
                            </span>
                            <span className="hidden rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-400 sm:inline">
                                Full Resolution
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Zoom Toggle Button */}
                            <button
                                type="button"
                                onClick={() =>
                                    setIsPreviewZoomed(!isPreviewZoomed)
                                }
                                className="flex h-9 items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20"
                                title={
                                    isPreviewZoomed
                                        ? 'Fit to Screen'
                                        : 'Zoom 100% Full Size'
                                }
                            >
                                {isPreviewZoomed ? (
                                    <>
                                        <ZoomOut className="h-4 w-4" />
                                        <span className="hidden sm:inline">
                                            Fit Screen
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <ZoomIn className="h-4 w-4" />
                                        <span className="hidden sm:inline">
                                            Zoom 100%
                                        </span>
                                    </>
                                )}
                            </button>

                            {/* Open Raw in New Tab Button */}
                            <a
                                href={design.image_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hidden h-9 items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20 sm:flex"
                                title="Open image in new tab"
                            >
                                <ExternalLink className="h-4 w-4" />
                                <span>Open Tab</span>
                            </a>

                            <a
                                href={`/designs/${design.id}/download`}
                                className="flex h-9 items-center gap-1.5 rounded-full bg-white/15 px-3 text-xs font-semibold text-white backdrop-blur-md transition-all hover:bg-white/25"
                                title="Download Image"
                            >
                                <Download className="h-4 w-4" />
                                <span className="hidden sm:inline">
                                    Download
                                </span>
                            </a>

                            {/* Close Button */}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsPreviewFullViewOpen(false);
                                    setIsPreviewZoomed(false);
                                }}
                                className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-all hover:bg-white/30"
                                title="Close (Esc)"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Main Full View Canvas - Responsive & Uncut */}
                    <div
                        className={`relative flex h-full w-full flex-1 items-center justify-center p-3 transition-all duration-300 sm:p-6 ${
                            isPreviewZoomed
                                ? 'cursor-zoom-out overflow-auto'
                                : 'cursor-zoom-in overflow-hidden'
                        }`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsPreviewZoomed(!isPreviewZoomed);
                        }}
                    >
                        <div
                            className={`flex items-center justify-center transition-all duration-300 ${
                                isPreviewZoomed
                                    ? 'min-h-full min-w-full p-6'
                                    : 'h-full max-h-full w-full max-w-full'
                            }`}
                        >
                            <img
                                src={design.image_url}
                                alt={design.product_name || 'Generated design'}
                                className={`rounded-2xl object-contain shadow-2xl drop-shadow-2xl transition-all duration-300 ${
                                    isPreviewZoomed
                                        ? 'h-auto max-h-none w-auto max-w-none'
                                        : 'h-auto max-h-[calc(100vh-140px)] w-auto max-w-[calc(100vw-32px)] scale-100 sm:max-w-[calc(100vw-64px)]'
                                }`}
                            />
                        </div>
                    </div>

                    {/* Bottom bar info */}
                    <div
                        className="relative z-50 flex w-full items-center justify-center bg-gradient-to-t from-black/95 via-black/70 to-transparent px-4 py-3 text-xs text-white/70"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span>
                            Click anywhere on image to toggle 100% zoom & fit
                        </span>
                    </div>
                </div>
            )}

            {/* =============================================================
                LIVE REGENERATION STUDIO RENDERING OVERLAY (STUDIO EXPERIENCE)
            ============================================================= */}
            {isRegenerating && (
                <div
                    className={`fixed top-11 right-0 bottom-0 left-0 z-20 flex items-center justify-center overflow-hidden bg-background/80 p-4 backdrop-blur-2xl motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in sm:top-12 sm:p-6 ${sidebarState === 'collapsed' ? 'md:left-[var(--sidebar-width-icon)]' : 'md:left-[var(--sidebar-width)]'}`}
                >
                    <div className="relative flex max-h-full w-full max-w-lg flex-col items-center justify-between gap-5 overflow-hidden rounded-3xl border border-border/80 bg-card/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
                        {/* Ambient Background Studio Aura */}
                        <div className="pointer-events-none absolute -top-16 left-1/2 h-36 w-36 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl motion-reduce:hidden" />
                        <div className="pointer-events-none absolute -bottom-16 left-1/2 h-36 w-36 -translate-x-1/2 rounded-full bg-emerald-500/15 blur-3xl motion-reduce:hidden" />

                        {/* 1. LIVE SYNTHESIS BADGE WITH GREEN INDICATOR DOT & TITLE */}
                        <div className="relative flex flex-col items-center space-y-2 text-center">
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 shadow-2xs dark:text-emerald-400">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-safe:animate-ping motion-reduce:hidden" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                </span>
                                <span>Live Regeneration</span>
                            </div>

                            <div className="flex flex-col items-center space-y-1">
                                <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg md:text-xl">
                                    Regenerating visual creative
                                </h2>

                                {design.business_name && (
                                    <p className="text-xs font-medium text-muted-foreground sm:text-sm">
                                        for{' '}
                                        <span className="font-semibold text-foreground/90">
                                            {design.business_name}
                                        </span>
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* 2. CENTER PIECE: PROMINENT CHOSEN INDUSTRY LOGO / PICTOGRAM */}
                        <div className="relative flex w-full items-center justify-center py-2 sm:py-3">
                            {/* Ambient Radiant Glow */}
                            <div className="pointer-events-none absolute h-28 w-28 rounded-full bg-primary/20 blur-2xl motion-safe:animate-pulse motion-reduce:hidden" />

                            {/* Glassmorphic Industry Emblem Pedestal */}
                            <div className="relative flex h-28 w-28 flex-col items-center justify-center rounded-3xl border border-primary/25 bg-gradient-to-b from-primary/15 via-primary/5 to-muted/40 shadow-xl ring-1 shadow-primary/10 ring-primary/20 backdrop-blur-xl transition-all sm:h-32 sm:w-32">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-xs ring-1 ring-primary/25 sm:h-14 sm:w-14">
                                    {createElement(
                                        resolveIndustryIcon(activeIndustry),
                                        {
                                            className:
                                                'h-6 w-6 sm:h-7 sm:w-7 text-primary motion-safe:animate-pulse',
                                        },
                                    )}
                                </div>
                                {activeIndustry && (
                                    <span className="mt-1.5 max-w-[90px] truncate text-[10px] font-bold tracking-wider text-primary/80 uppercase">
                                        {activeIndustry}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* 3. DYNAMIC STATUS MESSAGE, PROGRESS BAR & CLEAN METADATA */}
                        <div className="relative w-full space-y-3">
                            {/* Dynamic Creative Phase Message */}
                            <div className="flex items-center justify-center gap-1.5 text-center">
                                <Sparkles className="h-3.5 w-3.5 text-primary motion-safe:animate-pulse motion-reduce:hidden" />
                                <p className="text-xs font-semibold text-foreground transition-opacity duration-500 sm:text-sm">
                                    {currentStatusMessage}
                                </p>
                            </div>

                            {/* Illuminated Modern Progress Bar with Dynamic Indicator */}
                            <div className="mx-auto w-full max-w-xs space-y-1 sm:max-w-sm">
                                <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                                    <span>Synthesizing variation</span>
                                    <span className="font-mono font-semibold text-primary">
                                        {generationProgress}%
                                    </span>
                                </div>
                                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/80 p-0.5 ring-1 ring-border/50">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-primary via-indigo-500 to-emerald-500 shadow-xs shadow-primary/30 transition-all duration-500 ease-out"
                                        style={{
                                            width: `${generationProgress}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Clean, Non-Flooded Single-Row Metadata Context */}
                            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 pt-0.5 text-xs text-muted-foreground">
                                {design.product_name && (
                                    <span className="max-w-[140px] truncate font-medium text-foreground/90">
                                        {design.product_name}
                                    </span>
                                )}
                                {design.product_name &&
                                    (design.visual_theme ||
                                        design.brand_tone) && (
                                        <span className="text-muted-foreground/40">
                                            •
                                        </span>
                                    )}
                                {(design.visual_theme || design.brand_tone) && (
                                    <span className="max-w-[140px] truncate font-medium text-muted-foreground">
                                        {design.visual_theme ||
                                            design.brand_tone}
                                    </span>
                                )}
                                {(design.product_name ||
                                    design.visual_theme ||
                                    design.brand_tone) &&
                                    (design.campaign_name ||
                                        design.event_name) && (
                                        <span className="text-muted-foreground/40">
                                            •
                                        </span>
                                    )}
                                {(design.campaign_name ||
                                    design.event_name) && (
                                    <span className="max-w-[150px] truncate font-semibold text-primary">
                                        {design.campaign_name ||
                                            design.event_name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

DesignShowPage.layout = {
    breadcrumbs: [
        { title: 'My Designs', href: '/designs' },
        { title: 'Design detail', href: '#' },
    ],
};
