import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Download, ImageIcon, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function DesignShowPage({ design }: any) {
    const handleDelete = () => {
        router.delete(`/designs/${design.id}`);
    };

    return (
        <>
            <Head title={design.product_name || 'Design'} />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/designs">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to My Designs
                            </Link>
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline">
                            <a href={design.download_url} className="inline-flex items-center gap-2">
                                <Download className="h-4 w-4" />
                                Download
                            </a>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/generator" className="inline-flex items-center gap-2">
                                Create Another Design
                            </Link>
                        </Button>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="destructive" className="gap-2">
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Delete this design?</DialogTitle>
                                    <DialogDescription>
                                        This will remove the generated image and the design record from your account.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button variant="outline" type="button">Cancel</Button>
                                    <Button variant="destructive" type="button" onClick={handleDelete}>Delete design</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
                    <Card className="overflow-hidden shadow-sm">
                        <CardContent className="p-0">
                            {design.image_url ? (
                                <img src={design.image_url} alt={design.product_name} className="h-full min-h-[420px] w-full object-cover" />
                            ) : (
                                <div className="flex min-h-[420px] items-center justify-center bg-muted text-muted-foreground">
                                    <ImageIcon className="h-12 w-12" />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <div className="flex items-center justify-between gap-3">
                                    <CardTitle className="text-2xl">{design.product_name}</CardTitle>
                                    <Badge>{design.status}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <p className="text-muted-foreground">Business</p>
                                        <p className="mt-1 font-medium">{design.business_name || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Event</p>
                                        <p className="mt-1 font-medium">{design.event_name || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Brand tone</p>
                                        <p className="mt-1 font-medium">{design.brand_tone || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Content style</p>
                                        <p className="mt-1 font-medium">{design.visual_theme || '—'}</p>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <p className="text-muted-foreground">Tagline</p>
                                        <p className="mt-1 font-medium">{design.tagline || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Created</p>
                                        <p className="mt-1 font-medium">{design.created_at || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Status</p>
                                        <p className="mt-1 font-medium">{design.status || '—'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Prompt details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{design.prompt || 'No prompt details available yet.'}</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

DesignShowPage.layout = {
    breadcrumbs: [{ title: 'My Designs', href: '/designs' }, { title: 'Design detail', href: '#' }],
};
