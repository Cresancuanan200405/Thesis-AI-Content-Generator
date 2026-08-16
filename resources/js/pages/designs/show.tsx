import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Download,
    ImageIcon,
    Sparkles,
    Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

export default function DesignShowPage({ design }: any) {
    const handleDelete = () => {
        router.delete(`/designs/${design.id}`);
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

                        <div className="flex flex-wrap gap-2">
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
                                            This will remove the generated
                                            image and the design record from
                                            your account.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <DialogFooter>
                                        <Button
                                            variant="outline"
                                            type="button"
                                        >
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
                                    <img
                                        src={design.image_url}
                                        alt={
                                            design.product_name ||
                                            'Generated design'
                                        }
                                        className="max-h-[760px] min-h-[420px] w-full object-contain"
                                    />
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
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Generated marketing visual
                                        </p>

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

                                        <p className="mt-1.5 text-sm font-medium capitalize text-foreground">
                                            {design.status || '—'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
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
        </>
    );
}

DesignShowPage.layout = {
    breadcrumbs: [
        { title: 'My Designs', href: '/designs' },
        { title: 'Design detail', href: '#' },
    ],
};