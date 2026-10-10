<?php

namespace App\Services;

use Exception;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;
use RuntimeException;

class GeminiVisualInspirationService
{
    public const MAX_FILE_SIZE_BYTES = 10485760; // 10 MB

    public const ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'image/webp',
    ];

    public const ALLOWED_RENDER_STYLES = [
        'Studio Product Still',
        'Cinematic Marketing',
        'Lifestyle Capture',
        'Minimalist Graphic',
    ];

    public const ALLOWED_COPY_EMPHASIS = [
        'Balanced',
        'Product',
        'Price',
        'Tagline',
    ];

    public const DEFAULT_RENDER_STYLE = 'Studio Product Still';

    public const DEFAULT_COPY_EMPHASIS = 'Balanced';

    public const DEFAULT_RETRY_ATTEMPTS_ON_503 = 2; // Total attempts per model on 503 (1 initial + 1 retry)

    public const DEFAULT_RETRY_DELAY_MS_ON_503 = 500; // Delay in milliseconds between 503 retries

    public function __construct(
        protected int $retryAttemptsOn503 = self::DEFAULT_RETRY_ATTEMPTS_ON_503,
        protected int $retryDelayMsOn503 = self::DEFAULT_RETRY_DELAY_MS_ON_503,
    ) {}

    /**
     * Analyze a single reference image and return structured MarketPilot design recommendations.
     *
     * @param  string  $filePath  Absolute or relative path to the image file.
     * @param  bool  $forceFallback  Force using the fallback model instead of the primary model.
     * @return array{
     *     success: bool,
     *     model_used: string,
     *     visual_analysis: array{
     *         composition_and_framing: string,
     *         color_palette: string,
     *         lighting_and_shadows: string,
     *         typography_character_and_hierarchy: string,
     *         mood_and_visual_direction: string,
     *         reusable_visual_style_prompt: string,
     *     },
     *     marketpilot_recommendations: array{
     *         render_style: string,
     *         copy_emphasis: string,
     *         visibility_suggestions: array{
     *             product_name: bool,
     *             price: bool,
     *             tagline: bool,
     *             business_name: bool,
     *             event_text: bool,
     *         },
     *         confidence_notes: string,
     *     },
     *     error?: string,
     * }
     */
    public function analyze(string $filePath, bool $forceFallback = false): array
    {
        $this->validateFile($filePath);

        $apiKey = config('services.gemini.api_key');
        if (blank($apiKey)) {
            throw new InvalidArgumentException('GEMINI_API_KEY is not configured in services.gemini.');
        }

        $primaryModel = config('services.gemini.model', 'gemini-3.1-pro-preview');
        $fallbackModel = config('services.gemini.fallback_model', 'gemini-3.6-flash');

        $mimeType = $this->detectMimeType($filePath);
        $binaryData = file_get_contents($filePath);
        if ($binaryData === false || $binaryData === '') {
            throw new RuntimeException('Unable to read reference image data.');
        }

        $base64Data = base64_encode($binaryData);
        // Clear binary data from variable immediately
        unset($binaryData);

        $modelsToTry = $forceFallback ? [$fallbackModel] : [$primaryModel, $fallbackModel];
        $attemptErrors = [];

        foreach ($modelsToTry as $index => $model) {
            try {
                $response = $this->sendGenerateContentRequest($model, $apiKey, $mimeType, $base64Data);

                if ($response->successful()) {
                    $parsed = $this->parseAndValidateResponse($response->json(), $model);

                    return array_merge(['success' => true, 'model_used' => $model], $parsed);
                }

                $status = $response->status();
                $errorMessage = $this->extractErrorMessage($response);

                // Permanent client/auth failures: do NOT retry
                if (in_array($status, [400, 401, 403, 404], true)) {
                    Log::warning('Gemini vision API client error', [
                        'status' => $status,
                        'model' => $model,
                    ]);

                    return [
                        'success' => false,
                        'model_used' => $model,
                        'error' => "Gemini API client error (HTTP {$status}): {$errorMessage}",
                    ];
                }

                // Transient errors (429 rate limit, 500, 503 service unavailable):
                Log::warning('Gemini vision API transient error encountered', [
                    'status' => $status,
                    'model' => $model,
                    'will_retry_fallback' => $index === 0 && count($modelsToTry) > 1,
                ]);

                $attemptErrors[$model] = "HTTP {$status}: {$errorMessage}";

            } catch (Exception $e) {
                Log::warning('Gemini vision API network or unexpected exception', [
                    'message' => $e->getMessage(),
                    'model' => $model,
                ]);

                $attemptErrors[$model] = $e->getMessage();
            }
        }

        $formattedDetails = [];
        foreach ($attemptErrors as $attemptedModel => $errorDescription) {
            $label = ($attemptedModel === $primaryModel) ? 'primary model' : 'fallback model';
            $formattedDetails[] = "{$label} ({$attemptedModel}) -> {$errorDescription}";
        }
        $summary = count($formattedDetails) > 0 ? ' '.implode('; ', $formattedDetails) : '';

        return [
            'success' => false,
            'model_used' => end($modelsToTry) ?: $primaryModel,
            'error' => "All Gemini vision attempts failed.{$summary}",
        ];
    }

    /**
     * Send generateContent HTTP POST request to Gemini.
     */
    protected function sendGenerateContentRequest(
        string $model,
        string $apiKey,
        string $mimeType,
        string $base64Data
    ): Response {
        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent";

        $prompt = $this->getAnalysisSystemPrompt();

        return Http::withHeaders([
            'x-goog-api-key' => $apiKey,
            'Content-Type' => 'application/json',
        ])
            ->timeout(30)
            ->retry(
                $this->retryAttemptsOn503,
                $this->retryDelayMsOn503,
                function ($exception) {
                    return $exception instanceof RequestException
                        && $exception->response?->status() === 503;
                },
                throw: false
            )
            ->post($endpoint, [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt],
                            [
                                'inline_data' => [
                                    'mime_type' => $mimeType,
                                    'data' => $base64Data,
                                ],
                            ],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'responseMimeType' => 'application/json',
                    'temperature' => 0.2,
                ],
            ]);
    }

    /**
     * Parse and strictly validate the JSON response against MarketPilot's domain options.
     *
     * @param  array<string, mixed>|null  $rawResponse
     * @return array{
     *     visual_analysis: array<string, string>,
     *     marketpilot_recommendations: array<string, mixed>,
     * }
     */
    public function parseAndValidateResponse(?array $rawResponse, string $model): array
    {
        $rawText = $rawResponse['candidates'][0]['content']['parts'][0]['text'] ?? null;

        if (blank($rawText)) {
            throw new RuntimeException('Gemini returned an empty content candidate.');
        }

        $decoded = json_decode($rawText, true);

        if (! is_array($decoded)) {
            throw new RuntimeException('Failed to decode Gemini response into JSON structure.');
        }

        $visual = $decoded['visual_analysis'] ?? [];
        $recommendations = $decoded['marketpilot_recommendations'] ?? [];

        // 1. Sanitize visual analysis fields
        $visualAnalysis = [
            'composition_and_framing' => (string) ($visual['composition_and_framing'] ?? 'Standard commercial framing with centered subject presentation.'),
            'color_palette' => (string) ($visual['color_palette'] ?? 'Balanced natural studio palette with subtle neutral contrast.'),
            'lighting_and_shadows' => (string) ($visual['lighting_and_shadows'] ?? 'Diffused studio ambient lighting with soft contact shadows.'),
            'typography_character_and_hierarchy' => (string) ($visual['typography_character_and_hierarchy'] ?? 'Clean commercial typography zones with primary headline priority.'),
            'mood_and_visual_direction' => (string) ($visual['mood_and_visual_direction'] ?? 'Modern professional commercial advertising aesthetic.'),
            'reusable_visual_style_prompt' => (string) ($visual['reusable_visual_style_prompt'] ?? 'Commercial studio product presentation, diffused directional lighting, clean neutral tabletop, subtle organic depth.'),
        ];

        // 2. Validate and map render_style
        $rawRenderStyle = (string) ($recommendations['render_style'] ?? '');
        $renderStyle = in_array($rawRenderStyle, self::ALLOWED_RENDER_STYLES, true)
            ? $rawRenderStyle
            : self::DEFAULT_RENDER_STYLE;

        // 3. Validate and map copy_emphasis
        $rawCopyEmphasis = (string) ($recommendations['copy_emphasis'] ?? '');
        $copyEmphasis = in_array($rawCopyEmphasis, self::ALLOWED_COPY_EMPHASIS, true)
            ? $rawCopyEmphasis
            : self::DEFAULT_COPY_EMPHASIS;

        // 4. Validate visibility suggestions
        $rawVisibility = is_array($recommendations['visibility_suggestions'] ?? null)
            ? $recommendations['visibility_suggestions']
            : [];

        $visibilitySuggestions = [
            'product_name' => isset($rawVisibility['product_name']) ? (bool) $rawVisibility['product_name'] : true,
            'price' => isset($rawVisibility['price']) ? (bool) $rawVisibility['price'] : true,
            'tagline' => isset($rawVisibility['tagline']) ? (bool) $rawVisibility['tagline'] : true,
            'business_name' => isset($rawVisibility['business_name']) ? (bool) $rawVisibility['business_name'] : true,
            'event_text' => isset($rawVisibility['event_text']) ? (bool) $rawVisibility['event_text'] : false,
        ];

        $confidenceNotes = (string) ($recommendations['confidence_notes'] ?? 'Visual characteristics successfully extracted and mapped to MarketPilot parameters.');

        return [
            'visual_analysis' => $visualAnalysis,
            'marketpilot_recommendations' => [
                'render_style' => $renderStyle,
                'copy_emphasis' => $copyEmphasis,
                'visibility_suggestions' => $visibilitySuggestions,
                'confidence_notes' => $confidenceNotes,
            ],
        ];
    }

    /**
     * Validate file existence, size, and real MIME type.
     */
    public function validateFile(string $filePath): void
    {
        if (! file_exists($filePath)) {
            throw new InvalidArgumentException("Reference image file does not exist: {$filePath}");
        }

        $size = filesize($filePath);
        if ($size === false || $size <= 0) {
            throw new InvalidArgumentException("Reference image file is empty or unreadable: {$filePath}");
        }

        if ($size > self::MAX_FILE_SIZE_BYTES) {
            throw new InvalidArgumentException("Reference image exceeds maximum allowed size of 10 MB (size: {$size} bytes).");
        }

        $mimeType = $this->detectMimeType($filePath);
        if (! in_array($mimeType, self::ALLOWED_MIME_TYPES, true)) {
            throw new InvalidArgumentException("Unsupported image format '{$mimeType}'. Allowed formats: JPEG, PNG, WEBP.");
        }
    }

    /**
     * Inspect file headers using finfo to detect true MIME type.
     */
    public function detectMimeType(string $filePath): string
    {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo === false) {
            return 'application/octet-stream';
        }

        $mime = finfo_file($finfo, $filePath);
        finfo_close($finfo);

        return is_string($mime) ? strtolower($mime) : 'application/octet-stream';
    }

    /**
     * Build the structured analysis prompt for Gemini.
     */
    public function getAnalysisSystemPrompt(): string
    {
        return <<<'PROMPT'
You are an expert commercial advertising art director and product photographer analyst.
Analyze the provided advertising reference image to extract its abstract visual style, aesthetic treatment, lighting, and composition.

CRITICAL RULES & PRODUCT AGNOSTICISM:
1. PRODUCT AGNOSTICISM: Do NOT describe, name, or infer the reference image's specific product, food/drink, container, or ingredients (e.g., do NOT mention "coffee", "latte", "saucer", "beans", "shoes", "bottle", "perfume", "burger"). Refer only to the general subject placement as "hero product" or "subject". NEVER name or describe the reference product or its category.
2. SOLE SOURCE OF TRUTH: The eventual image generator must use the selected MarketPilot catalog product image as the sole source of product identity and appearance. The reference image provides ONLY environmental aesthetics and visual style.
3. GENERIC PROPS ONLY: Do NOT include props that belong to or imply a specific product category. Mention styling elements ONLY if they are universal, generic environmental staging (e.g., "dappled leaf shadows / gobo effect", "matte dual-tone backdrop", "neutral stone surface", "clean wooden podium").
4. REUSABLE STYLE DIRECTIVE REQUIREMENTS:
   In "reusable_visual_style_prompt", consolidate the five visual analysis sections into ONE coherent, copy-ready paragraph (typically 70–120 words for detailed advertising posters; concise for simple references) that serves as self-contained visual style instructions for an image generation pipeline:
   - Layout geometry & spatial relationships: Specify exact hero product placement (e.g. "hero product anchored in lower-right foreground"), scale, camera perspective, negative space, and designated copy zones (e.g. "upper-left area reserved for prominent headline typography").
   - Color palette & tonal harmony: Describe dominant background colors, supporting tones, accent colors, contrast, and overall color temperature.
   - Lighting & shadows: Detail directional lighting, softness, diffusion, contact shadows, cast shadows, and atmospheric effects.
   - Typography character & hierarchy: Describe font character (e.g. bold condensed sans-serif, elegant editorial serif, retro block display), scale, alignment, and hierarchy without copying reference wording.
   - Graphic elements & textures: Include relevant shapes, borders, badges, line illustrations, patterns, and material textures (e.g. subtle grain overlay, geometric framing borders, matte stone surface) ONLY when visibly supported by the reference.
   - Mood & visual direction: Articulate the commercial visual atmosphere and advertising aesthetic.
   - Avoid redundant descriptions, speculative details, and unnecessary prose. For simple references, keep the directive clean without inventing unneeded decorative elements.
5. NO TRADEMARK OR COPY EXTRACTION: Do NOT copy exact headline text, brand names, logos, slogans, trademarks, or distinctive branded artwork from the reference.
6. GROUNDED IN VISIBLE EVIDENCE: Ground all observations in visible evidence. If you cannot infer a setting with high confidence, return neutral defaults instead of inventing certainty.

Map your recommendations ONLY to MarketPilot's allowed options:
- render_style MUST be exactly one of: ["Studio Product Still", "Cinematic Marketing", "Lifestyle Capture", "Minimalist Graphic"]. Default: "Studio Product Still".
- copy_emphasis MUST be exactly one of: ["Balanced", "Product", "Price", "Tagline"]. Default: "Balanced".
- visibility_suggestions: boolean flags for product_name, price, tagline, business_name, event_text.

Respond strictly in valid JSON matching this exact structure:
{
  "visual_analysis": {
    "composition_and_framing": "Image orientation, layout geometry, hero product placement and scale, camera perspective, negative space, and designated text zones.",
    "color_palette": "Dominant background tones, supporting and accent colors, contrast, and overall tonal temperature.",
    "lighting_and_shadows": "Light direction, diffusion, softness, contrast, contact shadows, cast shadows, and atmospheric lighting characteristics.",
    "typography_character_and_hierarchy": "Typographic style, font weight character, headline and supporting text scale, alignment, spacing, and placement hierarchy without copying text.",
    "mood_and_visual_direction": "Commercial visual atmosphere, emotional tone, and overall advertising aesthetic direction.",
    "reusable_visual_style_prompt": "A consolidated, specific, copy-ready paragraph (70-120 words for detailed posters, concise for simple references) detailing composition, product placement, camera perspective, lighting, colors, background materials, graphic framing elements, and typography zones for any generic hero product. NEVER name or describe the reference product or its category."
  },
  "marketpilot_recommendations": {
    "render_style": "Studio Product Still",
    "copy_emphasis": "Balanced",
    "visibility_suggestions": {
      "product_name": true,
      "price": true,
      "tagline": true,
      "business_name": true,
      "event_text": false
    },
    "confidence_notes": "Brief notes on visible evidence or neutral fallback rationale."
  }
}
PROMPT;
    }

    /**
     * Extract a sanitized error message from a non-successful HTTP response.
     */
    protected function extractErrorMessage(Response $response): string
    {
        $json = $response->json();
        if (is_array($json) && ! empty($json['error']['message'])) {
            return (string) $json['error']['message'];
        }

        return substr($response->body(), 0, 200);
    }
}
