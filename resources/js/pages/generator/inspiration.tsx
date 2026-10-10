import { Head } from '@inertiajs/react';
import {
    AlertCircle,
    Check,
    ChevronDown,
    Copy,
    ImageIcon,
    Loader2,
    RotateCcw,
    Sparkles,
    Upload,
    X,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface VisualAnalysis {
    composition_and_framing: string;
    color_palette: string;
    lighting_and_shadows: string;
    typography_character_and_hierarchy: string;
    mood_and_visual_direction: string;
    reusable_visual_style_prompt: string;
}

interface VisibilitySuggestions {
    product_name: boolean;
    price: boolean;
    tagline: boolean;
    business_name: boolean;
    event_text: boolean;
}

interface MarketPilotRecommendations {
    render_style: string;
    copy_emphasis: string;
    visibility_suggestions: VisibilitySuggestions;
    confidence_notes: string;
}

interface AnalysisResult {
    success: boolean;
    model_used: string;
    visual_analysis: VisualAnalysis;
    marketpilot_recommendations: MarketPilotRecommendations;
    error?: string;
}

interface VisualInspirationPageProps {
    primaryModel?: string;
    fallbackModel?: string;
}

export default function VisualInspirationPage({
    primaryModel = 'gemini-3.6-flash',
    fallbackModel = 'gemini-3.5-flash-lite',
}: VisualInspirationPageProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [promptText, setPromptText] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Revoke browser object URLs when preview changes or component unmounts
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleFileSelect = useCallback((file: File | null) => {
        setError(null);
        setResult(null);

        if (!file) {
            setSelectedFile(null);
            setPromptText('');
            setPreviewUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
            return;
        }

        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setError('Please upload a valid JPG, PNG, or WebP image file.');
            toast.error('Unsupported image format.');
            return;
        }

        const maxBytes = 10 * 1024 * 1024; // 10 MB
        if (file.size > maxBytes) {
            setError('Image file exceeds the 10 MB limit. Please select a smaller file.');
            toast.error('File exceeds 10 MB limit.');
            return;
        }

        setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(file);
        });
        setSelectedFile(file);
    }, []);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleAnalyze = async (forceFallback = false) => {
        if (!selectedFile) {
            setError('Please select a reference image first.');
            return;
        }

        setIsAnalyzing(true);
        setError(null);

        const csrfToken =
            document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content') || '';

        const formData = new FormData();
        formData.append('image', selectedFile);
        if (forceFallback) {
            formData.append('force_fallback', '1');
        }

        try {
            const response = await fetch('/generator/inspiration/analyze', {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                const message =
                    data.error ||
                    (response.status === 429
                        ? 'Rate limit reached. Please wait a moment before trying again.'
                        : 'Analysis failed. Please try again.');
                setError(message);
                toast.error(message);
                return;
            }

            setResult(data);
            const generatedDirective =
                data.visual_analysis?.reusable_visual_style_prompt || '';
            setPromptText(generatedDirective);
            toast.success('Visual analysis complete!');
        } catch (err: any) {
            const message =
                err?.message || 'Network error while contacting analysis server.';
            setError(message);
            toast.error(message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleCopyPrompt = () => {
        if (!promptText) return;

        navigator.clipboard.writeText(promptText);
        setIsCopied(true);
        toast.success('Prompt directive copied to clipboard!');
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleReset = () => {
        handleFileSelect(null);
        setPromptText('');
        setError(null);
        setResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
            <Head title="Design Inspiration — MarketPilot" />

            {/* MINIMAL STANDALONE HEADER */}
            <header className="sticky top-0 z-20 border-b border-border/60 bg-background/95 backdrop-blur-xs">
                <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Sparkles className="h-4 w-4" />
                        </span>
                        <div>
                            <h1 className="text-sm font-semibold tracking-tight text-foreground">
                                Design Inspiration
                            </h1>
                        </div>
                    </div>
                </div>
            </header>

            {/* MAIN WORKSPACE */}
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT COLUMN: REFERENCE IMAGE & PRIMARY ACTION */}
                    <div className="space-y-4 lg:col-span-5">
                        <Card className="rounded-xl border border-border/80 bg-card/60 shadow-xs">
                            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <ImageIcon className="h-3.5 w-3.5 text-primary" />
                                    Reference Image
                                </CardTitle>

                                {selectedFile && (
                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isAnalyzing}
                                            className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                                        >
                                            Replace
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleReset}
                                            disabled={isAnalyzing}
                                            className="h-7 px-2 text-[11px] text-destructive hover:bg-destructive/10 cursor-pointer"
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                )}
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileSelect(file);
                                    }}
                                />

                                {/* EMPTY DROPZONE */}
                                {!previewUrl && (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        onDrop={handleDrop}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 sm:p-10 text-center cursor-pointer transition-all duration-150 ${
                                            isDragOver
                                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                                : 'border-border/80 bg-muted/10 hover:border-border hover:bg-muted/20'
                                        }`}
                                    >
                                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                                            <Upload className="h-5 w-5" />
                                        </div>
                                        <p className="text-xs font-semibold text-foreground">
                                            Drop advertisement image here
                                        </p>
                                        <p className="mt-1 text-[11px] text-muted-foreground">
                                            or click to browse from device
                                        </p>
                                        <span className="mt-3 text-[10px] text-muted-foreground/70 font-mono">
                                            JPG, PNG, WebP · Max 10 MB
                                        </span>
                                    </div>
                                )}

                                {/* IMAGE PREVIEW */}
                                {previewUrl && (
                                    <div className="space-y-3">
                                        <div className="relative max-h-80 overflow-hidden rounded-lg border border-border/70 bg-muted/20 flex items-center justify-center p-2">
                                            <img
                                                src={previewUrl}
                                                alt="Reference advertisement preview"
                                                className="max-h-72 w-auto rounded object-contain shadow-2xs"
                                            />
                                        </div>
                                        {selectedFile && (
                                            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
                                                <span className="truncate max-w-[200px] font-medium text-foreground">
                                                    {selectedFile.name}
                                                </span>
                                                <span className="font-mono text-[10px]">
                                                    {Math.round(selectedFile.size / 1024)} KB
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ERROR NOTIFICATION & RETRY */}
                                {error && (
                                    <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2.5">
                                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                        <div className="flex-1 space-y-2">
                                            <p className="text-[11px] leading-relaxed">{error}</p>
                                            <div className="flex flex-wrap gap-2 pt-0.5">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleAnalyze(false)}
                                                    disabled={isAnalyzing}
                                                    className="h-7 text-xs border-destructive/40 hover:bg-destructive/20 text-destructive cursor-pointer"
                                                >
                                                    <RotateCcw className="h-3 w-3 mr-1" />
                                                    Retry
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleAnalyze(true)}
                                                    disabled={isAnalyzing}
                                                    className="h-7 text-xs border-destructive/40 hover:bg-destructive/20 text-destructive cursor-pointer"
                                                >
                                                    Retry with Fallback ({fallbackModel})
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* PRIMARY ANALYZE ACTION */}
                                <Button
                                    type="button"
                                    onClick={() => handleAnalyze(false)}
                                    disabled={!selectedFile || isAnalyzing}
                                    className="w-full gap-2 h-10 text-xs font-semibold shadow-xs cursor-pointer"
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Analyzing with Gemini...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-4 w-4" />
                                            <span>Analyze Reference Image</span>
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: GENERATED PROMPT & COMPACT RESULTS */}
                    <div className="space-y-4 lg:col-span-7">
                        <Card className="rounded-xl border border-border/80 bg-card/60 shadow-xs">
                            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                                    Reusable Prompt Directive
                                </CardTitle>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCopyPrompt}
                                    disabled={!promptText}
                                    className="h-7 gap-1.5 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/10 cursor-pointer disabled:opacity-40"
                                >
                                    {isCopied ? (
                                        <>
                                            <Check className="h-3 w-3 text-emerald-500" />
                                            <span>Copied</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-3 w-3" />
                                            <span>Copy Prompt</span>
                                        </>
                                    )}
                                </Button>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {/* EDITABLE PROMPT TEXT AREA */}
                                <Textarea
                                    value={promptText}
                                    onChange={(e) => setPromptText(e.target.value)}
                                    placeholder={
                                        isAnalyzing
                                            ? 'Analyzing reference image with Gemini...'
                                            : 'Upload an advertising reference image and click Analyze to generate a reusable prompt directive. You can freely edit the generated prompt here.'
                                    }
                                    rows={10}
                                    className="font-mono text-xs leading-relaxed resize-y min-h-[220px] bg-background/60"
                                />

                                <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
                                    <span>
                                        {promptText ? `${promptText.split(/\s+/).filter(Boolean).length} words` : 'Awaiting analysis'}
                                    </span>
                                    <span>Editable text area</span>
                                </div>

                                {/* COMPACT ESSENTIAL ANALYSIS RESULTS */}
                                {result && (
                                    <div className="space-y-3 pt-3 border-t border-border/70 animate-in fade-in-50 duration-150">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                Recommended Parameters
                                            </span>
                                            <span className="text-[10px] font-mono text-muted-foreground">
                                                Model: {result.model_used}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            <div className="rounded-lg border border-border/70 bg-muted/20 p-2.5">
                                                <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                                    Render Style
                                                </span>
                                                <span className="mt-0.5 block text-xs font-semibold text-foreground truncate">
                                                    {result.marketpilot_recommendations?.render_style}
                                                </span>
                                            </div>

                                            <div className="rounded-lg border border-border/70 bg-muted/20 p-2.5">
                                                <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                                    Copy Emphasis
                                                </span>
                                                <span className="mt-0.5 block text-xs font-semibold text-foreground truncate">
                                                    {result.marketpilot_recommendations?.copy_emphasis}
                                                </span>
                                            </div>

                                            <div className="col-span-2 rounded-lg border border-border/70 bg-muted/20 p-2.5">
                                                <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                                                    Visible Elements
                                                </span>
                                                <div className="flex flex-wrap gap-1">
                                                    {result.marketpilot_recommendations?.visibility_suggestions &&
                                                        Object.entries(result.marketpilot_recommendations.visibility_suggestions)
                                                            .filter(([_, isVisible]) => Boolean(isVisible))
                                                            .map(([key]) => (
                                                                <Badge
                                                                    key={key}
                                                                    variant="outline"
                                                                    className="text-[10px] font-medium bg-background/50 border-border capitalize px-1.5 py-0"
                                                                >
                                                                    {key.replace(/_/g, ' ')}
                                                                </Badge>
                                                            ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* COMPACT DETAILS DISCLOSURE */}
                                        <details className="group rounded-lg border border-border/60 bg-muted/10 p-2.5 text-xs transition-colors open:bg-muted/20">
                                            <summary className="flex items-center justify-between cursor-pointer font-medium text-muted-foreground hover:text-foreground select-none">
                                                <span>View Full Analysis Breakdown</span>
                                                <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                                            </summary>
                                            <div className="mt-2.5 space-y-2 pt-2 border-t border-border/50 text-[11px] leading-relaxed text-muted-foreground">
                                                <div>
                                                    <strong className="text-foreground">Composition & Framing: </strong>
                                                    {result.visual_analysis?.composition_and_framing}
                                                </div>
                                                <div>
                                                    <strong className="text-foreground">Color Palette: </strong>
                                                    {result.visual_analysis?.color_palette}
                                                </div>
                                                <div>
                                                    <strong className="text-foreground">Lighting & Shadows: </strong>
                                                    {result.visual_analysis?.lighting_and_shadows}
                                                </div>
                                                <div>
                                                    <strong className="text-foreground">Typography Hierarchy: </strong>
                                                    {result.visual_analysis?.typography_character_and_hierarchy}
                                                </div>
                                                <div>
                                                    <strong className="text-foreground">Mood & Visual Direction: </strong>
                                                    {result.visual_analysis?.mood_and_visual_direction}
                                                </div>
                                            </div>
                                        </details>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}

VisualInspirationPage.layout = null;
