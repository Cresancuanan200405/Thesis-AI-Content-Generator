import { Head, router, usePage } from '@inertiajs/react';
import { ImageIcon, Palette, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const toneOptions = [
    'Professional',
    'Friendly',
    'Luxury',
    'Playful',
    'Minimal',
    'Bold',
    'Elegant',
    'Warm',
    'Modern',
    'Premium',
];

function toggleValue(values: string[], next: string) {
    return values.includes(next)
        ? values.filter((value) => value !== next)
        : [...values, next];
}

export default function BrandKitPage() {
    const { brand, business, errors, flash } = usePage().props as any;
    const [logo, setLogo] = useState<File | null>(null);
    const [removeLogo, setRemoveLogo] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState({
        primary_color: brand?.primary_color ?? '#111827',
        secondary_color: brand?.secondary_color ?? '#F59E0B',
        accent_color: brand?.accent_color ?? '#E5E7EB',
        brand_tone: Array.isArray(brand?.brand_tone) ? brand.brand_tone : [],
        typography: brand?.typography ?? 'Modern Sans',
        brand_guidelines: brand?.brand_guidelines ?? '',
        visual_preferences: brand?.visual_preferences ?? '',
    });

    const previewLogo = logo
        ? URL.createObjectURL(logo)
        : (brand?.logo_url ?? null);

    const brandDescription = useMemo(() => {
        const tone = form.brand_tone.length
            ? form.brand_tone.join(', ')
            : 'No tone selected';

        return `${tone} • ${form.typography || 'Modern Sans'}`;
    }, [form.brand_tone, form.typography]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSaving(true);

        const payload = new FormData();

        payload.append('primary_color', form.primary_color);
        payload.append('secondary_color', form.secondary_color);
        payload.append('accent_color', form.accent_color);
        payload.append('typography', form.typography);
        payload.append('brand_guidelines', form.brand_guidelines ?? '');
        payload.append('visual_preferences', form.visual_preferences ?? '');
        payload.append('remove_logo', removeLogo ? '1' : '0');

        form.brand_tone.forEach((tone: string) =>
            payload.append('brand_tone[]', tone),
        );

        if (logo) {
            payload.append('logo', logo);
        }

        router.put('/brand-kit', payload, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => setIsSaving(false),
        });
    };

    return (
        <>
            <Head title="Brand Kit" />
            <div className="space-y-6 p-4 md:p-6">
                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                    <p className="text-sm font-medium text-muted-foreground">
                        Brand Kit
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                        Brand Kit
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                        Manage the visual identity and brand voice used across
                        your marketing content.
                    </p>
                </div>

                {flash?.success && (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                        {flash.success}
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]"
                >
                    <div className="space-y-6">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <ImageIcon className="h-5 w-5" />
                                    Logo
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col gap-4 rounded-xl border border-dashed p-4 md:flex-row md:items-center">
                                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border bg-muted">
                                        {previewLogo ? (
                                            <img
                                                src={previewLogo}
                                                alt="Brand logo preview"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                        )}
                                    </div>

                                    <div className="flex-1 space-y-2">
                                        <Input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            onChange={(event) => {
                                                const file =
                                                    event.target.files?.[0] ??
                                                    null;
                                                setLogo(file);

                                                if (file) {
                                                    setRemoveLogo(false);
                                                }
                                            }}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Supported: JPG, PNG, WEBP. Max 2MB.
                                        </p>
                                        {errors?.logo && (
                                            <p className="text-sm text-destructive">
                                                {errors.logo}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {(brand?.logo_url || logo) && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setLogo(null);
                                            setRemoveLogo(true);
                                        }}
                                    >
                                        Remove logo
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Palette className="h-5 w-5" />
                                    Brand colors
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-3">
                                {[
                                    {
                                        key: 'primary_color',
                                        label: 'Primary color',
                                    },
                                    {
                                        key: 'secondary_color',
                                        label: 'Secondary color',
                                    },
                                    {
                                        key: 'accent_color',
                                        label: 'Accent color',
                                    },
                                ].map(({ key, label }) => (
                                    <div key={key} className="space-y-2">
                                        <Label htmlFor={key}>{label}</Label>
                                        <div className="flex items-center gap-2 rounded-md border px-2 py-2">
                                            <input
                                                id={key}
                                                type="color"
                                                value={
                                                    form[
                                                        key as keyof typeof form
                                                    ] as string
                                                }
                                                onChange={(event) =>
                                                    setForm((current) => ({
                                                        ...current,
                                                        [key]: event.target
                                                            .value,
                                                    }))
                                                }
                                                className="h-10 w-12 rounded border-0 bg-transparent p-0"
                                            />
                                            <Input
                                                value={
                                                    form[
                                                        key as keyof typeof form
                                                    ] as string
                                                }
                                                onChange={(event) =>
                                                    setForm((current) => ({
                                                        ...current,
                                                        [key]: event.target
                                                            .value,
                                                    }))
                                                }
                                                className="flex-1"
                                            />
                                        </div>
                                        {errors?.[key] && (
                                            <p className="text-sm text-destructive">
                                                {errors[key]}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-xl">
                                    Brand voice
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="space-y-2">
                                    <Label>Brand tone</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {toneOptions.map((tone) => {
                                            const active =
                                                form.brand_tone.includes(tone);

                                            return (
                                                <button
                                                    key={tone}
                                                    type="button"
                                                    onClick={() =>
                                                        setForm((current) => ({
                                                            ...current,
                                                            brand_tone:
                                                                toggleValue(
                                                                    current.brand_tone,
                                                                    tone,
                                                                ),
                                                        }))
                                                    }
                                                    className={`rounded-full border px-3 py-1.5 text-sm transition ${active ? 'border-primary bg-primary text-primary-foreground' : 'border-muted bg-transparent text-muted-foreground hover:bg-muted'}`}
                                                >
                                                    {tone}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="typography">
                                        Typography
                                    </Label>
                                    <Input
                                        id="typography"
                                        value={form.typography}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                typography: event.target.value,
                                            }))
                                        }
                                        placeholder="Modern Sans"
                                    />
                                    {errors?.typography && (
                                        <p className="text-sm text-destructive">
                                            {errors.typography}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="brand_guidelines">
                                        Brand guidelines
                                    </Label>
                                    <Textarea
                                        id="brand_guidelines"
                                        value={form.brand_guidelines}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                brand_guidelines:
                                                    event.target.value,
                                            }))
                                        }
                                        rows={5}
                                        placeholder="Describe your writing rules, brand voice, and standards."
                                    />
                                    {errors?.brand_guidelines && (
                                        <p className="text-sm text-destructive">
                                            {errors.brand_guidelines}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="visual_preferences">
                                        Visual preferences
                                    </Label>
                                    <Textarea
                                        id="visual_preferences"
                                        value={form.visual_preferences}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                visual_preferences:
                                                    event.target.value,
                                            }))
                                        }
                                        rows={5}
                                        placeholder="Describe your visual direction, lighting, compositions, and mood."
                                    />
                                    {errors?.visual_preferences && (
                                        <p className="text-sm text-destructive">
                                            {errors.visual_preferences}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-xl">
                                    Live preview
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div
                                    className="rounded-2xl border p-4"
                                    style={{ background: form.primary_color }}
                                >
                                    <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                {previewLogo ? (
                                                    <img
                                                        src={previewLogo}
                                                        alt="Brand logo"
                                                        className="h-12 w-12 rounded-lg object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 text-white">
                                                        <Sparkles className="h-5 w-5" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium text-white">
                                                        {business?.name ||
                                                            'Your business'}
                                                    </p>
                                                    <p className="text-xs text-white/80">
                                                        {brandDescription}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <span
                                                    className="h-4 w-4 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            form.primary_color,
                                                    }}
                                                />
                                                <span
                                                    className="h-4 w-4 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            form.secondary_color,
                                                    }}
                                                />
                                                <span
                                                    className="h-4 w-4 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            form.accent_color,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl border bg-muted/40 p-4">
                                    <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                        Sample heading
                                    </p>
                                    <h3
                                        className="mt-2 text-2xl font-semibold"
                                        style={{ color: form.primary_color }}
                                    >
                                        Fresh, premium creative direction
                                    </h3>
                                    <p
                                        className="mt-3 text-sm text-muted-foreground"
                                        style={{ color: form.primary_color }}
                                    >
                                        {form.brand_guidelines ||
                                            'Describe the standards that should guide your visual storytelling.'}
                                    </p>
                                </div>

                                <div className="rounded-xl border p-4">
                                    <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                        Sample body
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-foreground">
                                        {form.visual_preferences ||
                                            'Clean compositions, warm lighting, and product-first storytelling.'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isSaving}
                        >
                            {isSaving
                                ? 'Saving brand kit...'
                                : 'Save brand kit'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

BrandKitPage.layout = {
    breadcrumbs: [
        {
            title: 'Brand Kit',
            href: '/brand-kit',
        },
    ],
};
