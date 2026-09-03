<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ReferenceImageAnalyzer
{
    /**
     * Analyze a reference or product image file using OpenAI Vision (gpt-4o-mini) to extract
     * a structured visual design blueprint and authoritative product details.
     *
     * @param  string  $imagePath  Relative path on public disk (e.g. 'generation-requests/abc.jpg')
     * @return array{
     *     product_identity?: string,
     *     product_physical_details?: string,
     *     is_product_photo?: bool,
     *     composition: string,
     *     layout: string,
     *     product_position: string,
     *     text_position: string,
     *     background: string,
     *     color_palette: string,
     *     lighting: string,
     *     typography: string,
     *     decorative_elements: string,
     *     visual_hierarchy: string,
     *     negative_space: string,
     *     overall_style: string,
     * }|null
     */
    public function analyze(string $imagePath): ?array
    {
        if (! Storage::exists($imagePath)) {
            return null;
        }

        $fileContents = Storage::get($imagePath);

        if (empty($fileContents)) {
            return null;
        }

        $cacheKey = 'ref_analysis_v2_'.md5($fileContents);

        return Cache::remember($cacheKey, 3600, function () use ($fileContents, $imagePath): ?array {
            return $this->performVisionAnalysis($fileContents, $imagePath);
        });
    }

    /**
     * Perform the actual vision analysis request to OpenAI.
     */
    protected function performVisionAnalysis(string $binaryData, string $imagePath): ?array
    {
        $apiKey = config('services.openai.api_key');
        if (blank($apiKey)) {
            return null;
        }

        $mimeType = $this->detectMimeType($imagePath, $binaryData);
        $base64 = base64_encode($binaryData);
        $dataUrl = "data:{$mimeType};base64,{$base64}";

        $systemPrompt = <<<'PROMPT'
You are an expert commercial advertising art director and product photographer analyst.
Your task is to analyze the uploaded image (which may be an authoritative product photograph or a reference advertisement) and extract its exact visual design language and product details into a structured JSON blueprint.

CRITICAL PRODUCT FIDELITY RULES:
1. Treat the uploaded image as the authoritative SOURCE OF TRUTH for the product.
2. Note the product's EXACT identity, container/glass/plate, ingredients, visible layers, colors, textures, toppings, ice, straw, or packaging.
3. Note what makes this visual look authentic and professionally designed.
4. Extract the layout, composition, lighting, typography hierarchy, background environment, and decorative elements.

Respond ONLY with a valid JSON object matching this schema:
{
    "product_identity": "Precise product description (e.g. Iced caramel macchiato in a clear tall cylindrical glass with visible ice cubes, distinct milk-espresso-caramel layers, caramel drizzle on top, and a black straw)",
    "product_physical_details": "Exact physical features to preserve (e.g. Clear tall glass, layered gradient, ice cubes, caramel drizzle on top, black straw. Do NOT change into a hot drink or ceramic cup)",
    "is_product_photo": true,
    "composition": "Short summary of overall composition and camera angle (e.g. 45-degree angle product presentation with clean horizontal balance and deliberate text zones)",
    "layout": "Specific layout structure (e.g. Hero product placed clearly on right with left-aligned typographic hierarchy)",
    "product_position": "Exact placement and surface presentation (e.g. Placed on right half with realistic contact shadows on a clean natural surface)",
    "text_position": "Headline, tagline, and price coordinates (e.g. Upper left quadrant with headline dominant, tagline secondary, and price badge cleanly positioned)",
    "background": "Background surface, materials, and environment (e.g. Clean bright studio tabletop with soft natural window sunlight and gentle organic bokeh)",
    "color_palette": "Dominant and accent colors (e.g. Warm cream and coffee tones with vibrant accent highlight)",
    "lighting": "Lighting direction and quality (e.g. Soft diffused morning window light from top-left, realistic soft contact shadows)",
    "typography": "Typography styling and hierarchy (e.g. Level 1 bold modern headline, Level 2 clean tagline, Level 3 small details, Level 4 visible price badge)",
    "decorative_elements": "Subtle props and accents (e.g. Subtle coffee beans scattered naturally near base, clean graphic badge)",
    "visual_hierarchy": "Focal order: 1st Product as Hero, 2nd Main Headline, 3rd Tagline & Price, 4th Supporting Elements",
    "negative_space": "Generous 20% safe margin padding around text and product for clean breathing room",
    "overall_style": "Commercial advertising aesthetic (e.g. Professional contemporary beverage commercial advertisement)"
}
PROMPT;

        try {
            $headers = [
                'Authorization' => 'Bearer '.$apiKey,
                'Content-Type' => 'application/json',
            ];

            if ($org = config('services.openai.organization')) {
                $headers['OpenAI-Organization'] = $org;
            }

            $response = Http::withHeaders($headers)
                ->timeout(30)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => config('services.openai.chat_model', 'gpt-4o-mini'),
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => $systemPrompt,
                        ],
                        [
                            'role' => 'user',
                            'content' => [
                                [
                                    'type' => 'text',
                                    'text' => 'Analyze the product details, visual design, composition, and styling of this image.',
                                ],
                                [
                                    'type' => 'image_url',
                                    'image_url' => [
                                        'url' => $dataUrl,
                                        'detail' => 'low',
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'response_format' => ['type' => 'json_object'],
                    'max_tokens' => 900,
                    'temperature' => 0.2,
                ]);

            if (! $response->successful()) {
                Log::warning('Reference image vision analysis failed: '.$response->body());

                return null;
            }

            $data = $response->json();
            $content = $data['choices'][0]['message']['content'] ?? null;

            if (empty($content)) {
                return null;
            }

            $blueprint = json_decode($content, true);

            if (! is_array($blueprint)) {
                return null;
            }

            return $blueprint;
        } catch (Exception $e) {
            Log::warning('Reference image vision analysis exception: '.$e->getMessage());

            return null;
        }
    }

    /**
     * Synthesize the extracted reference visual blueprint into a cohesive prompt directive.
     *
     * @param  array<string, mixed>  $blueprint
     */
    public function formatBlueprintForPrompt(array $blueprint): string
    {
        $lines = [];

        // 1. Authoritative Product Fidelity Directive
        if (! empty($blueprint['product_identity']) || ! empty($blueprint['product_physical_details'])) {
            $lines[] = 'AUTHORITATIVE PRODUCT FIDELITY (SOURCE OF TRUTH):';
            if (! empty($blueprint['product_identity'])) {
                $lines[] = '• Visual Product Identity: '.$blueprint['product_identity'].'.';
            }
            if (! empty($blueprint['product_physical_details'])) {
                $lines[] = '• Mandatory Physical Details: '.$blueprint['product_physical_details'].'. Preserve all container shapes, layers, ingredients, textures, toppings, and physical attributes exactly. Do NOT transform into a different product variation.';
            }
        }

        // 2. Composition & Visual Design Blueprint
        $lines[] = 'VISUAL DESIGN & COMPOSITION BLUEPRINT:';

        if (! empty($blueprint['overall_style'])) {
            $lines[] = '• Commercial Aesthetic: '.$blueprint['overall_style'];
        }
        if (! empty($blueprint['layout']) || ! empty($blueprint['composition'])) {
            $lines[] = '• Layout & Alignment: '.($blueprint['layout'] ?? $blueprint['composition']);
        }
        if (! empty($blueprint['product_position'])) {
            $lines[] = '• Hero Product Presentation: '.$blueprint['product_position'].' with natural contact shadows and realistic surface lighting integration.';
        }
        if (! empty($blueprint['background'])) {
            $lines[] = '• Background Environment: '.$blueprint['background'];
        }
        if (! empty($blueprint['color_palette'])) {
            $lines[] = '• Color Palette: '.$blueprint['color_palette'];
        }
        if (! empty($blueprint['lighting'])) {
            $lines[] = '• Lighting & Mood: '.$blueprint['lighting'];
        }
        if (! empty($blueprint['text_position']) || ! empty($blueprint['typography'])) {
            $textStyle = array_filter([$blueprint['text_position'] ?? null, $blueprint['typography'] ?? null]);
            $lines[] = '• Typography Hierarchy: '.implode(' — ', $textStyle);
        }
        if (! empty($blueprint['decorative_elements'])) {
            $lines[] = '• Subtle Accents & Props: '.$blueprint['decorative_elements'];
        }
        if (! empty($blueprint['negative_space'])) {
            $lines[] = '• Spacing & Margins: '.$blueprint['negative_space'];
        }

        return implode(' ', $lines);
    }

    /**
     * Detect MIME type from file extension or fallback to binary inspection.
     */
    protected function detectMimeType(string $path, string $data): string
    {
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        return match ($extension) {
            'png' => 'image/png',
            'webp' => 'image/webp',
            'gif' => 'image/gif',
            default => 'image/jpeg',
        };
    }
}
