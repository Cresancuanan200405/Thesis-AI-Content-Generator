<?php

namespace App\Services;

use App\Models\Business;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;

class ImageCompositorService
{
    /**
     * @var array<string, mixed>|null
     */
    protected ?array $lastCompositingResult = null;

    /**
     * Build an exact deterministic marketing compositing overlay manifest.
     *
     * @param  array{
     *     width?: int,
     *     height?: int,
     *     product_name?: string|null,
     *     price?: string|float|int|null,
     *     tagline?: string|null,
     *     business_name?: string|null,
     *     aspect_ratio?: string|null,
     *     include_business_name?: bool|null,
     *     include_tagline?: bool|null,
     *     include_prices?: bool|null,
     *     design_treatment?: string|null,
     *     copy_emphasis?: string|null,
     * }  $params
     * @return array<string, mixed>
     */
    public function generateCompositingManifest(array $params, ?Business $business = null): array
    {
        $aspectRatio = $params['aspect_ratio'] ?? '1:1';
        [$width, $height] = match ($aspectRatio) {
            '16:9' => [1792, 1024],
            '9:16' => [1024, 1792],
            '4:5' => [1024, 1280],
            '4:3' => [1365, 1024],
            default => [1024, 1024],
        };

        // Enforce 20% safe margin
        $safeMarginX = (int) round($width * 0.20);
        $safeMarginY = (int) round($height * 0.20);
        $safeWidth = $width - ($safeMarginX * 2);
        $safeHeight = $height - ($safeMarginY * 2);

        // Resolve primary and co-featured products
        $primaryProduct = null;
        if (! empty($params['primary_product'])) {
            if (is_array($params['primary_product'])) {
                $primaryProduct = [
                    'name' => trim((string) ($params['primary_product']['name'] ?? '')),
                    'price' => $params['primary_product']['price'] ?? null,
                ];
            } elseif (is_string($params['primary_product'])) {
                $primaryProduct = [
                    'name' => trim($params['primary_product']),
                    'price' => $params['price'] ?? null,
                ];
            }
        }

        $coFeaturedProducts = [];
        if (! empty($params['co_featured_products']) && is_array($params['co_featured_products'])) {
            foreach ($params['co_featured_products'] as $prod) {
                if (is_array($prod) && ! empty($prod['name'])) {
                    $coFeaturedProducts[] = [
                        'name' => trim((string) $prod['name']),
                        'price' => $prod['price'] ?? null,
                    ];
                } elseif (is_string($prod) && trim($prod) !== '') {
                    $coFeaturedProducts[] = [
                        'name' => trim($prod),
                        'price' => null,
                    ];
                }
            }
        }

        // Auto-extract from catalog_products if primary_product was not explicitly provided
        if ($primaryProduct === null && ! empty($params['catalog_products'])) {
            $isFirst = true;
            foreach ($params['catalog_products'] as $cp) {
                $cpName = is_array($cp) ? ($cp['name'] ?? null) : ($cp->name ?? null);
                $cpPrice = is_array($cp) ? ($cp['price'] ?? null) : ($cp->price ?? null);
                if (! empty($cpName)) {
                    if ($isFirst) {
                        $primaryProduct = [
                            'name' => trim((string) $cpName),
                            'price' => $cpPrice,
                        ];
                        $isFirst = false;
                    } else {
                        $coFeaturedProducts[] = [
                            'name' => trim((string) $cpName),
                            'price' => $cpPrice,
                        ];
                    }
                }
            }
        }

        // Backward compatibility fallback for primary product
        if ($primaryProduct === null) {
            $pName = ! empty($params['product_name']) ? trim((string) $params['product_name']) : 'Featured Product';
            $primaryProduct = [
                'name' => $pName,
                'price' => $params['price'] ?? null,
            ];
        }

        $customProducts = [];
        if (! empty($params['custom_products']) && is_array($params['custom_products'])) {
            foreach ($params['custom_products'] as $cProd) {
                if (is_array($cProd) && ! empty($cProd['name'])) {
                    $customProducts[] = [
                        'name' => trim((string) $cProd['name']),
                        'price' => $cProd['price'] ?? null,
                    ];
                }
            }
        }

        $allSelectedProducts = [];
        if (! empty($primaryProduct['name'])) {
            $allSelectedProducts[] = [
                'name' => $primaryProduct['name'],
                'price' => $primaryProduct['price'] ?? null,
                'is_primary' => true,
            ];
        }
        foreach ($coFeaturedProducts as $co) {
            $allSelectedProducts[] = [
                'name' => $co['name'],
                'price' => $co['price'] ?? null,
                'is_primary' => false,
            ];
        }
        foreach ($customProducts as $cu) {
            $allSelectedProducts[] = [
                'name' => $cu['name'],
                'price' => $cu['price'] ?? null,
                'is_primary' => false,
            ];
        }

        $productName = $primaryProduct['name'] ?? (! empty($params['product_name']) ? trim((string) $params['product_name']) : 'Featured Product');

        $includePrices = array_key_exists('include_prices', $params)
            ? (bool) $params['include_prices']
            : (! empty($params['price']) || ! empty($params['prices']) || ! empty($primaryProduct['price']));

        $price = null;
        $prices = [];
        if ($includePrices) {
            // Priority 1: explicitly passed $params['prices']
            if (! empty($params['prices']) && is_array($params['prices'])) {
                foreach ($params['prices'] as $k => $v) {
                    if ($v !== null && $v !== '') {
                        $rawP = trim((string) $v);
                        $prices[$k] = is_numeric($rawP) ? '₱'.number_format((float) $rawP, 2) : $rawP;
                    }
                }
            }

            // Priority 2: extract prices from all selected products
            foreach ($allSelectedProducts as $sp) {
                if (! empty($sp['price']) && ! isset($prices[$sp['name']])) {
                    $rawP = trim((string) $sp['price']);
                    $prices[$sp['name']] = is_numeric($rawP) ? '₱'.number_format((float) $rawP, 2) : $rawP;
                }
            }

            // Primary display price for single-product compatibility
            $primaryRawPrice = $params['price'] ?? $primaryProduct['price'] ?? null;
            if ($primaryRawPrice !== null && $primaryRawPrice !== '') {
                $rawPrice = trim((string) $primaryRawPrice);
                $price = is_numeric($rawPrice) ? '₱'.number_format((float) $rawPrice, 2) : $rawPrice;
            } elseif (! empty($prices[$productName])) {
                $price = $prices[$productName];
            } elseif (! empty($prices)) {
                $price = reset($prices);
            }
        }

        $includeTagline = array_key_exists('include_tagline', $params)
            ? (bool) $params['include_tagline']
            : (! empty($params['tagline']));

        $tagline = null;
        if ($includeTagline && ! empty($params['tagline'])) {
            $tagline = TaglineNormalizationService::normalize($params['tagline']);
        }

        $includeBusinessName = array_key_exists('include_business_name', $params)
            ? (bool) $params['include_business_name']
            : (! empty($params['business_name']) || ! empty($business->name));

        $brandName = null;
        if ($includeBusinessName) {
            $brandName = ! empty($params['business_name']) ? trim((string) $params['business_name']) : ($business->name ?? null);
        }

        $designTreatment = $params['design_treatment'] ?? 'Classic';
        $copyEmphasis = $params['copy_emphasis'] ?? 'Balanced';

        $treatmentKey = strtolower(trim((string) $designTreatment));
        $emphasisKey = strtolower(trim((string) $copyEmphasis));

        $isEditorial = str_contains($treatmentKey, 'editorial');
        $isBold = str_contains($treatmentKey, 'bold');
        $isMinimal = str_contains($treatmentKey, 'minimal');
        $isPremium = str_contains($treatmentKey, 'premium');

        // Font sizes and weights
        $titleSize = $isBold ? 46.0 : ($isEditorial ? 40.0 : ($isMinimal ? 30.0 : ($isPremium ? 38.0 : 36.0)));
        $taglineSize = $isEditorial ? 18.0 : ($isMinimal ? 16.0 : ($isPremium ? 17.0 : 20.0));
        $priceSize = str_contains($emphasisKey, 'price') ? 36.0 : ($isBold ? 38.0 : ($isMinimal ? 20.0 : ($isPremium ? 26.0 : 24.0)));
        $brandSize = $isMinimal ? 11.0 : ($isEditorial ? 11.0 : ($isPremium ? 12.0 : 13.0));

        // Text alignment & placement hierarchy
        $alignment = $isEditorial ? 'left' : 'center';
        $hierarchy = match (true) {
            $isBold => 'promotional_price_emphasis',
            $isEditorial => 'refined_editorial_asymmetry',
            $isMinimal => 'uncluttered_restraint',
            $isPremium => 'understated_prestige',
            default => 'product_name_prominent',
        };

        // Scrim sizing and positioning strictly within 20% safe margin
        $scrimH = (float) min(220, round($safeHeight * 0.38));
        $scrimY = (float) ($safeMarginY + $safeHeight - $scrimH);
        $scrimX = (float) $safeMarginX;
        $scrimW = (float) $safeWidth;

        // Background scrim opacity / styling (0 = pure negative space)
        $scrimAlpha = $isMinimal ? 0 : ($isBold ? 180 : ($isPremium ? 140 : 120));

        $layoutProperties = [
            'design_treatment' => $designTreatment,
            'copy_emphasis' => $copyEmphasis,
            'title_size' => $titleSize,
            'tagline_size' => $taglineSize,
            'price_size' => $priceSize,
            'brand_size' => $brandSize,
            'alignment' => $alignment,
            'hierarchy' => $hierarchy,
            'scrim_alpha' => $scrimAlpha,
            'scrim_box' => [
                'x' => $scrimX,
                'y' => $scrimY,
                'width' => $scrimW,
                'height' => $scrimH,
            ],
            'safe_margins_respected' => true,
        ];

        return [
            'canvas' => [
                'width' => $width,
                'height' => $height,
                'aspect_ratio' => $aspectRatio,
            ],
            'safe_margins' => [
                'top' => $safeMarginY,
                'bottom' => $safeMarginY,
                'left' => $safeMarginX,
                'right' => $safeMarginX,
                'safe_width' => $safeWidth,
                'safe_height' => $safeHeight,
                'margin_percent' => 20,
            ],
            'exact_content' => [
                'product_name' => $productName,
                'price' => $price,
                'tagline' => $tagline,
                'brand_name' => $brandName,
                'business_name' => $brandName,
                'primary_product' => $primaryProduct,
                'co_featured_products' => $coFeaturedProducts,
                'custom_products' => $customProducts,
                'selected_products' => $allSelectedProducts,
                'prices' => $prices,
            ],
            'primary_product' => $primaryProduct,
            'co_featured_products' => $coFeaturedProducts,
            'custom_products' => $customProducts,
            'selected_products' => $allSelectedProducts,
            'prices' => $prices,
            'treatment' => $designTreatment,
            'emphasis' => $copyEmphasis,
            'layout_properties' => $layoutProperties,
        ];
    }

    /**
     * Backward-compatible alias for layout property and manifest generation.
     *
     * @param  array<string, mixed>  $params
     * @return array<string, mixed>
     */
    public function buildDeterministicLayoutProperties(int $width, int $height, array $params, ?Business $business = null): array
    {
        return $this->generateCompositingManifest($params, $business);
    }

    /**
     * Inspect and return current environment compositor capabilities.
     *
     * @return array{
     *     engine_detected: string,
     *     raster_rendering_available: bool,
     *     production_safe: bool,
     *     supports_gd: bool,
     *     supports_imagick: bool,
     *     supports_powershell: bool,
     *     supports_svg: bool,
     * }
     */
    public function detectCapabilities(): array
    {
        $hasGd = extension_loaded('gd') && function_exists('imagecreatefromstring');
        $hasImagick = extension_loaded('imagick') && class_exists('\Imagick');
        $hasPs = $this->canUsePowerShellDrawing();

        $engine = 'none';
        if ($hasGd) {
            $engine = 'php_gd';
        } elseif ($hasImagick) {
            $engine = 'php_imagick';
        } elseif ($hasPs) {
            $engine = 'powershell_system_drawing';
        }

        $rasterAvailable = in_array($engine, ['php_gd', 'php_imagick', 'powershell_system_drawing'], true);
        $productionSafe = $hasGd || $hasImagick;

        return [
            'engine_detected' => $engine,
            'raster_rendering_available' => $rasterAvailable,
            'production_safe' => $productionSafe,
            'supports_gd' => $hasGd,
            'supports_imagick' => $hasImagick,
            'supports_powershell' => $hasPs,
            'supports_svg' => true,
        ];
    }

    /**
     * Deterministically composite authoritative marketing typography onto the generated image.
     *
     * @param  string  $storagePath  Relative storage path in public disk
     * @param  array<string, mixed>  $params  Generation options / authoritative copy
     */
    public function composite(string $storagePath, array $params, ?Business $business = null): string
    {
        $disk = Storage::disk('public');
        if (! $disk->exists($storagePath)) {
            // Check default disk
            if (Storage::exists($storagePath)) {
                $disk = Storage::disk(config('filesystems.default'));
            } else {
                Log::warning("ImageCompositorService: Image not found at path '{$storagePath}'. Skipping compositing.");

                return $storagePath;
            }
        }

        $manifest = $this->generateCompositingManifest($params, $business);
        $fullPath = $disk->path($storagePath);
        $isSvg = str_ends_with(strtolower($storagePath), '.svg') || str_starts_with(ltrim($disk->get($storagePath)), '<svg');

        $caps = $this->detectCapabilities();

        // Production environment guard: require ext-gd or ext-imagick for raster images
        if (app()->environment('production') && ! $isSvg && ! $caps['production_safe']) {
            throw new \RuntimeException(
                "Deterministic raster compositing requires 'ext-gd' or 'ext-imagick' in production environments. "
                .'Neither extension was detected. Please install php-gd or php-imagick.'
            );
        }

        $engineUsed = 'none';
        $rasterModified = false;

        try {
            if ($isSvg) {
                $this->compositeSvg($disk, $storagePath, $manifest);
                $engineUsed = 'svg_compositor';
                $rasterModified = true;
            } elseif ($caps['raster_rendering_available']) {
                if ($this->canUsePowerShellDrawing()) {
                    $this->compositeWithPowerShell($fullPath, $manifest);
                    $engineUsed = 'powershell_system_drawing';
                    $rasterModified = true;
                } elseif (extension_loaded('gd')) {
                    $this->compositeWithGd($disk, $storagePath, $manifest);
                    $engineUsed = 'php_gd';
                    $rasterModified = true;
                } elseif (extension_loaded('imagick')) {
                    $this->compositeWithImagick($fullPath, $manifest);
                    $engineUsed = 'php_imagick';
                    $rasterModified = true;
                }
            } else {
                Log::warning('ImageCompositorService: No raster compositing engine available. Skipping pixel manipulation.');
                $engineUsed = 'none';
                $rasterModified = false;
            }
        } catch (\Throwable $e) {
            Log::error("ImageCompositorService execution failed: {$e->getMessage()}", [
                'storage_path' => $storagePath,
                'exception' => $e,
            ]);
            if (app()->environment('production')) {
                throw $e;
            }
        }

        $visibleLayers = [];
        if (! empty($manifest['exact_content']['product_name'])) {
            $visibleLayers[] = 'product_name';
        }
        if (! empty($manifest['exact_content']['brand_name'])) {
            $visibleLayers[] = 'business_name';
        }
        if (! empty($manifest['exact_content']['tagline'])) {
            $visibleLayers[] = 'tagline';
        }
        if (! empty($manifest['exact_content']['price']) || ! empty($manifest['exact_content']['prices'])) {
            $visibleLayers[] = 'price';
        }

        $textLayersRendered = $rasterModified ? $visibleLayers : [];
        $fallbackState = $rasterModified ? 'none' : 'uncomposited_engine_missing';

        $this->lastCompositingResult = [
            'manifest' => $manifest,
            'raster_modified' => $rasterModified,
            'engine' => $engineUsed,
            'path' => $storagePath,
            'authoritative_copy' => array_filter($manifest['exact_content'], fn ($v) => $v !== null && $v !== '' && $v !== []),
            'visible_layers' => $visibleLayers,
            'text_layers_rendered' => $textLayersRendered,
            'fallback_state' => $fallbackState,
            'treatment' => $manifest['treatment'] ?? 'Classic',
            'emphasis' => $manifest['emphasis'] ?? 'Balanced',
            'aspect_ratio' => $manifest['canvas']['aspect_ratio'] ?? '1:1',
            'layout_properties' => $manifest['layout_properties'] ?? [],
        ];

        return $storagePath;
    }

    /**
     * Check if PowerShell System.Drawing is available on the current OS.
     */
    protected function canUsePowerShellDrawing(): bool
    {
        return PHP_OS_FAMILY === 'Windows';
    }

    /**
     * Composite raster text onto PNG/JPEG using PowerShell System.Drawing.
     *
     * @param  array<string, mixed>  $manifest
     */
    protected function compositeWithPowerShell(string $filePath, array $manifest): void
    {
        $normalizedFilePath = str_replace('\\', '/', $filePath);
        $content = $manifest['exact_content'];
        $margins = $manifest['safe_margins'];
        $canvas = $manifest['canvas'];
        $treatment = strtolower($manifest['treatment'] ?? 'classic');
        $emphasis = strtolower($manifest['emphasis'] ?? 'balanced');

        $productName = addslashes($content['product_name'] ?? '');
        $tagline = addslashes($content['tagline'] ?? '');
        $price = addslashes($content['price'] ?? '');
        $businessName = addslashes($content['brand_name'] ?? '');

        // Safe coordinates calculation
        $safeX = (float) $margins['left'];
        $safeY = (float) $margins['top'];
        $safeW = (float) $margins['safe_width'];
        $safeH = (float) $margins['safe_height'];
        $canvasW = (float) $canvas['width'];
        $canvasH = (float) $canvas['height'];

        $layout = $manifest['layout_properties'] ?? [];
        $isEditorial = str_contains($treatment, 'editorial');
        $isBold = str_contains($treatment, 'bold');
        $isMinimal = str_contains($treatment, 'minimal');
        $isPremium = str_contains($treatment, 'premium');

        $titleSize = (float) ($layout['title_size'] ?? ($isBold ? 46.0 : ($isEditorial ? 40.0 : ($isMinimal ? 30.0 : 36.0))));
        $taglineSize = (float) ($layout['tagline_size'] ?? ($isEditorial ? 18.0 : ($isMinimal ? 16.0 : 20.0)));
        $priceSize = (float) ($layout['price_size'] ?? (str_contains($emphasis, 'price') ? 36.0 : ($isBold ? 38.0 : 24.0)));
        $brandSize = (float) ($layout['brand_size'] ?? ($isMinimal ? 11.0 : 13.0));
        $alignment = ($layout['alignment'] ?? '') === 'left' ? 'Near' : ($isEditorial ? 'Near' : 'Center');
        $scrimAlpha = (int) ($layout['scrim_alpha'] ?? ($isMinimal ? 0 : ($isBold ? 180 : 120)));

        if (! empty($layout['scrim_box'])) {
            $scrimX = (float) $layout['scrim_box']['x'];
            $scrimY = (float) $layout['scrim_box']['y'];
            $scrimW = (float) $layout['scrim_box']['width'];
            $scrimH = (float) $layout['scrim_box']['height'];
        } else {
            $scrimH = (float) min(220, $safeH * 0.38);
            $scrimY = (float) ($safeY + $safeH - $scrimH);
            $scrimX = (float) $safeX;
            $scrimW = (float) $safeW;
        }

        $script = <<<POWERSHELL
Add-Type -AssemblyName System.Drawing
\$img = [System.Drawing.Image]::FromFile('{$normalizedFilePath}')
\$bmp = New-Object System.Drawing.Bitmap \$img
\$img.Dispose()

\$g = [System.Drawing.Graphics]::FromImage(\$bmp)
\$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
\$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

# Semi-transparent safe-margin background scrim for contrast
if ({$scrimAlpha} -gt 0) {
    \$scrimBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb({$scrimAlpha}, 10, 15, 25))
    \$scrimRect = New-Object System.Drawing.RectangleF ({$scrimX}, {$scrimY}, {$scrimW}, {$scrimH})
    \$g.FillRectangle(\$scrimBrush, \$scrimRect)
    \$scrimBrush.Dispose()
}

\$format = New-Object System.Drawing.StringFormat
\$format.Alignment = [System.Drawing.StringAlignment]::{$alignment}
\$format.LineAlignment = [System.Drawing.StringAlignment]::Center

\$currentY = {$scrimY} + 12

# 1. Product Name (Exact Authoritative String)
if ('{$productName}' -ne '') {
    \$titleFont = New-Object System.Drawing.Font ('Segoe UI', [float]{$titleSize}, [System.Drawing.FontStyle]::Bold)
    \$titleBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    \$rectTitle = New-Object System.Drawing.RectangleF ({$safeX} + 10, \$currentY, {$safeW} - 20, 50)
    \$g.DrawString('{$productName}', \$titleFont, \$titleBrush, \$rectTitle, \$format)
    \$titleFont.Dispose()
    \$titleBrush.Dispose()
    \$currentY += 52
}

# 2. Tagline (Normalized Authoritative String - Only when included)
if ('{$tagline}' -ne '') {
    \$tagFont = New-Object System.Drawing.Font ('Segoe UI', [float]{$taglineSize}, [System.Drawing.FontStyle]::Italic)
    \$tagBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 226, 232, 240))
    \$rectTag = New-Object System.Drawing.RectangleF ({$safeX} + 10, \$currentY, {$safeW} - 20, 36)
    \$g.DrawString('{$tagline}', \$tagFont, \$tagBrush, \$rectTag, \$format)
    \$tagFont.Dispose()
    \$tagBrush.Dispose()
    \$currentY += 38
}

# 3. Price (Exact Authoritative Price - Only when included)
if ('{$price}' -ne '') {
    \$priceFont = New-Object System.Drawing.Font ('Segoe UI', [float]{$priceSize}, [System.Drawing.FontStyle]::Bold)
    \$priceBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 56, 189, 248))
    \$rectPrice = New-Object System.Drawing.RectangleF ({$safeX} + 10, \$currentY, {$safeW} - 20, 38)
    \$g.DrawString('{$price}', \$priceFont, \$priceBrush, \$rectPrice, \$format)
    \$priceFont.Dispose()
    \$priceBrush.Dispose()
    \$currentY += 40
}

# 4. Business Name (Exact Authoritative Typography Only - No Logo/Emblem)
if ('{$businessName}' -ne '') {
    \$bizFont = New-Object System.Drawing.Font ('Segoe UI', [float]{$brandSize}, [System.Drawing.FontStyle]::Regular)
    \$bizBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 148, 163, 184))
    \$rectBiz = New-Object System.Drawing.RectangleF ({$safeX} + 10, {$scrimY} + {$scrimH} - 26, {$safeW} - 20, 22)
    \$g.DrawString('{$businessName}', \$bizFont, \$bizBrush, \$rectBiz, \$format)
    \$bizFont.Dispose()
    \$bizBrush.Dispose()
}

\$format.Dispose()
\$g.Dispose()

\$bmp.Save('{$normalizedFilePath}', [System.Drawing.Imaging.ImageFormat]::Png)
\$bmp.Dispose()
POWERSHELL;

        $process = new Process(['powershell', '-NoProfile', '-NonInteractive', '-Command', $script]);
        $process->setTimeout(30);
        $process->run();

        if (! $process->isSuccessful()) {
            Log::warning('PowerShell System.Drawing text compositor warning: '.$process->getErrorOutput());
        }
    }

    /**
     * Composite text into an SVG image.
     *
     * @param  array<string, mixed>  $manifest
     */
    protected function compositeSvg(Filesystem $disk, string $storagePath, array $manifest): void
    {
        $svg = $disk->get($storagePath);
        $content = $manifest['exact_content'];
        $margins = $manifest['safe_margins'];
        $canvas = $manifest['canvas'];
        $treatment = strtolower($manifest['treatment'] ?? 'classic');

        $safeX = (int) $margins['left'];
        $safeY = (int) $margins['top'];
        $safeW = (int) $margins['safe_width'];
        $safeH = (int) $margins['safe_height'];
        $centerX = $safeX + (int) ($safeW / 2);

        $productName = htmlspecialchars($content['product_name'] ?? '', ENT_QUOTES, 'UTF-8');
        $tagline = htmlspecialchars($content['tagline'] ?? '', ENT_QUOTES, 'UTF-8');
        $price = htmlspecialchars($content['price'] ?? '', ENT_QUOTES, 'UTF-8');
        $businessName = htmlspecialchars($content['brand_name'] ?? '', ENT_QUOTES, 'UTF-8');

        $bottomY = $safeY + $safeH - 180;

        $layers = [];
        $layers[] = '<g id="authoritative-marketing-text-overlay" class="composited-text-layer">';
        $layers[] = "<rect x=\"{$safeX}\" y=\"{$bottomY}\" width=\"{$safeW}\" height=\"170\" rx=\"16\" fill=\"rgba(15, 23, 42, 0.75)\" stroke=\"rgba(255, 255, 255, 0.1)\" stroke-width=\"1\"/>";

        $currY = $bottomY + 45;
        if ($productName !== '') {
            $layers[] = "<text x=\"{$centerX}\" y=\"{$currY}\" text-anchor=\"middle\" font-family=\"'Segoe UI', system-ui, sans-serif\" font-size=\"32\" font-weight=\"800\" fill=\"#ffffff\">{$productName}</text>";
            $currY += 36;
        }

        if ($tagline !== '') {
            $layers[] = "<text x=\"{$centerX}\" y=\"{$currY}\" text-anchor=\"middle\" font-family=\"'Segoe UI', system-ui, sans-serif\" font-size=\"18\" font-style=\"italic\" fill=\"#cbd5e1\">\"{$tagline}\"</text>";
            $currY += 32;
        }

        if ($price !== '') {
            $layers[] = "<text x=\"{$centerX}\" y=\"{$currY}\" text-anchor=\"middle\" font-family=\"'Segoe UI', system-ui, sans-serif\" font-size=\"24\" font-weight=\"700\" fill=\"#38bdf8\">{$price}</text>";
        }

        if ($businessName !== '') {
            $layers[] = "<text x=\"{$centerX}\" y=\"".($bottomY + 155)."\" text-anchor=\"middle\" font-family=\"'Segoe UI', system-ui, sans-serif\" font-size=\"12\" font-weight=\"600\" fill=\"#94a3b8\" letter-spacing=\"1\">{$businessName}</text>";
        }

        $layers[] = '</g>';

        $overlaySvg = implode("\n", $layers);
        if (str_contains($svg, '</svg>')) {
            $modifiedSvg = str_replace('</svg>', $overlaySvg."\n</svg>", $svg);
            $disk->put($storagePath, $modifiedSvg);
        }
    }

    /**
     * Composite text using PHP GD extension when loaded.
     *
     * @param  array<string, mixed>  $manifest
     */
    protected function compositeWithGd(Filesystem $disk, string $storagePath, array $manifest): void
    {
        $raw = $disk->get($storagePath);
        $image = @imagecreatefromstring($raw);
        if (! $image) {
            return;
        }

        $width = imagesx($image);
        $height = imagesy($image);
        $content = $manifest['exact_content'];
        $margins = $manifest['safe_margins'];

        $safeX = (int) $margins['left'];
        $safeY = (int) $margins['top'];
        $safeW = (int) $margins['safe_width'];
        $safeH = (int) $margins['safe_height'];

        $scrimH = min(180, (int) ($safeH * 0.35));
        $scrimY = $safeY + $safeH - $scrimH;

        // Semi-transparent scrim
        $scrimColor = imagecolorallocatealpha($image, 15, 23, 42, 40);
        imagefilledrectangle($image, $safeX, $scrimY, $safeX + $safeW, $scrimY + $scrimH, $scrimColor);

        $textColor = imagecolorallocate($image, 255, 255, 255);
        $taglineColor = imagecolorallocate($image, 226, 232, 240);
        $priceColor = imagecolorallocate($image, 56, 189, 248);
        $bizColor = imagecolorallocate($image, 148, 163, 184);

        $y = $scrimY + 20;
        if (! empty($content['product_name'])) {
            imagestring($image, 5, $safeX + 20, $y, (string) $content['product_name'], $textColor);
            $y += 30;
        }
        if (! empty($content['tagline'])) {
            imagestring($image, 4, $safeX + 20, $y, (string) $content['tagline'], $taglineColor);
            $y += 25;
        }
        if (! empty($content['price'])) {
            imagestring($image, 4, $safeX + 20, $y, (string) $content['price'], $priceColor);
            $y += 25;
        }
        if (! empty($content['brand_name'])) {
            imagestring($image, 3, $safeX + 20, $y, (string) $content['brand_name'], $bizColor);
        }

        ob_start();
        imagepng($image);
        $out = ob_get_clean();
        imagedestroy($image);

        if ($out) {
            $disk->put($storagePath, $out);
        }
    }

    /**
     * Composite text using PHP Imagick extension when loaded.
     *
     * @param  array<string, mixed>  $manifest
     */
    protected function compositeWithImagick(string $filePath, array $manifest): void
    {
        if (! class_exists('\Imagick')) {
            return;
        }

        $imagick = new \Imagick($filePath);
        $draw = new \ImagickDraw;

        $content = $manifest['exact_content'];
        $margins = $manifest['safe_margins'];

        $safeX = (int) $margins['left'];
        $safeY = (int) $margins['top'];
        $safeW = (int) $margins['safe_width'];
        $safeH = (int) $margins['safe_height'];

        $scrimH = min(180, (int) ($safeH * 0.35));
        $scrimY = $safeY + $safeH - $scrimH;

        $draw->setFillColor('rgba(15, 23, 42, 0.7)');
        $draw->rectangle($safeX, $scrimY, $safeX + $safeW, $scrimY + $scrimH);

        $draw->setFillColor('#ffffff');
        $draw->setFontSize(32);
        if (! empty($content['product_name'])) {
            $imagick->annotateImage($draw, $safeX + 20, $scrimY + 45, 0, (string) $content['product_name']);
        }

        $draw->setFillColor('#cbd5e1');
        $draw->setFontSize(20);
        if (! empty($content['tagline'])) {
            $imagick->annotateImage($draw, $safeX + 20, $scrimY + 80, 0, (string) $content['tagline']);
        }

        $draw->setFillColor('#38bdf8');
        $draw->setFontSize(24);
        if (! empty($content['price'])) {
            $imagick->annotateImage($draw, $safeX + 20, $scrimY + 115, 0, (string) $content['price']);
        }

        $draw->setFillColor('#94a3b8');
        $draw->setFontSize(14);
        if (! empty($content['brand_name'])) {
            $imagick->annotateImage($draw, $safeX + 20, $scrimY + 150, 0, (string) $content['brand_name']);
        }

        $imagick->drawImage($draw);
        $imagick->writeImage($filePath);
        $imagick->clear();
        $imagick->destroy();
    }

    /**
     * Get the last compositing result manifest.
     *
     * @return array<string, mixed>|null
     */
    public function getLastCompositingResult(): ?array
    {
        return $this->lastCompositingResult;
    }
}
