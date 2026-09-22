<?php

namespace App\Services;

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use Exception;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;

class VisualPromptGeneratorService
{
    public function __construct(
        protected OpenAIModelRegistry $modelRegistry,
        protected ?IndustryCategoryArtDirectionService $artDirectionService = null,
    ) {
        $this->artDirectionService = $artDirectionService ?? app(IndustryCategoryArtDirectionService::class);
    }

    /**
     * Generate an AI-powered visual prompt using OpenAI Responses API and GPT-5.6 Luna.
     *
     * @param  array{
     *     generation_mode?: string|null,
     *     previous_concepts?: array<int, string>|null,
     *     catalog_products?: Collection<int, Product>|array<int, Product>,
     *     custom_products?: array<int, array{name: string, price?: string|float|int|null}>,
     *     user_instruction?: string|null,
     *     render_style?: string|null,
     *     visual_theme?: string|array<int, string>|null,
     *     brand_tone?: string|array<int, string>|null,
     *     aspect_ratio?: string|null,
     *     tagline?: string|null,
     *     include_business_name?: bool|null,
     *     has_reference_image?: bool|null,
     * }  $options
     * @return array{
     *     visual_prompt: string,
     *     creative_concept: string|null,
     *     visual_strategy: string|null,
     *     model: string,
     *     usage: array{input_tokens: int|null, output_tokens: int|null, total_tokens: int|null},
     *     duration_seconds: float,
     * }
     */
    public function generate(
        User $user,
        Campaign $campaign,
        ?Business $business,
        array $options = []
    ): array {
        $apiKey = config('services.openai.api_key');

        if (blank($apiKey)) {
            throw new RuntimeException('OpenAI API key is not configured. Please configure OPENAI_API_KEY.');
        }

        $model = $this->modelRegistry->getTextModel();
        $startTime = microtime(true);

        $generationMode = ($options['generation_mode'] ?? null) === 'automatic' ? 'automatic' : 'manual';
        $isAutomatic = $generationMode === 'automatic';

        $requiresAiTagline = $isAutomatic || ! empty($options['require_tagline']);

        // Retrieve previous creative concepts for campaign to avoid repetition
        $previousConcepts = $this->resolvePreviousConcepts($user, $campaign, $options['previous_concepts'] ?? []);

        $systemInstructions = $this->buildSystemInstructions($isAutomatic, $requiresAiTagline);
        $userContext = $this->buildContextPayload($campaign, $business, $options, $previousConcepts);

        $headers = [
            'Authorization' => 'Bearer '.$apiKey,
            'Content-Type' => 'application/json',
        ];

        if ($org = config('services.openai.organization')) {
            $headers['OpenAI-Organization'] = $org;
        }

        if ($requiresAiTagline) {
            $schemaProperties = [
                'tagline' => [
                    'type' => 'string',
                    'description' => 'A concise, punchy, original commercial marketing tagline tailored to the business, product/service, and campaign event context. Free of invented claims, fake promotions, fake awards, or unsupported discounts.',
                ],
                'creative_concept' => [
                    'type' => 'string',
                    'description' => 'A clear, evocative title and summary of the core creative idea behind this marketing visual (e.g., "Quiet Café Morning Appreciation", "Gourmet Holiday Gift Unboxing").',
                ],
                'visual_strategy' => [
                    'type' => 'string',
                    'description' => 'The strategic visual approach explaining how the event, industry conventions, lighting, and composition elevate the hero product.',
                ],
                'visual_prompt' => [
                    'type' => 'string',
                    'description' => 'The complete, production-ready visual marketing prompt describing product staging, scene lighting, composition, environment, festive/campaign accents, and atmosphere for image generation.',
                ],
            ];

            $requiredFields = ['tagline', 'creative_concept', 'visual_strategy', 'visual_prompt'];
        } else {
            $schemaProperties = [
                'creative_concept' => [
                    'type' => 'string',
                    'description' => 'A clear, evocative title and summary of the core creative idea behind this marketing visual (e.g., "Quiet Café Morning Appreciation", "Gourmet Holiday Gift Unboxing").',
                ],
                'visual_strategy' => [
                    'type' => 'string',
                    'description' => 'The strategic visual approach explaining how the event, industry conventions, lighting, and composition elevate the hero product.',
                ],
                'visual_prompt' => [
                    'type' => 'string',
                    'description' => 'The complete, production-ready visual marketing prompt describing product staging, scene lighting, composition, environment, festive/campaign accents, and atmosphere for image generation.',
                ],
            ];

            $requiredFields = ['creative_concept', 'visual_strategy', 'visual_prompt'];
        }

        $schema = [
            'type' => 'object',
            'properties' => $schemaProperties,
            'required' => $requiredFields,
            'additionalProperties' => false,
        ];

        $payload = [
            'model' => $model,
            'instructions' => $systemInstructions,
            'input' => $userContext,
            'text' => [
                'format' => [
                    'type' => 'json_schema',
                    'name' => 'visual_prompt_response',
                    'strict' => true,
                    'schema' => $schema,
                ],
            ],
        ];

        try {
            $response = Http::withHeaders($headers)
                ->timeout(45)
                ->post('https://api.openai.com/v1/responses', $payload);
        } catch (Exception $e) {
            Log::error('OpenAI Responses API network failure: '.$e->getMessage(), [
                'campaign_id' => $campaign->id,
                'user_id' => $user->id,
            ]);

            throw new RuntimeException('Unable to communicate with the visual prompt service. Please try again.');
        }

        if (! $response->successful()) {
            $status = $response->status();
            $body = $response->body();
            Log::error("OpenAI Responses API error (HTTP {$status}): {$body}", [
                'campaign_id' => $campaign->id,
                'user_id' => $user->id,
            ]);

            throw new RuntimeException('OpenAI visual prompt generation failed with HTTP status '.$status);
        }

        $responseData = $response->json();
        $duration = round(microtime(true) - $startTime, 2);

        $result = $this->extractResult($responseData);
        $usage = $this->extractUsage($responseData);

        // Usage telemetry logging without secrets or private personal information
        Log::info('OpenAI Visual Prompt Generated', [
            'model' => $model,
            'mode' => $generationMode,
            'campaign_id' => $campaign->id,
            'user_id' => $user->id,
            'duration_seconds' => $duration,
            'input_tokens' => $usage['input_tokens'],
            'output_tokens' => $usage['output_tokens'],
            'total_tokens' => $usage['total_tokens'],
        ]);

        $finalTagline = ! empty($result['tagline']) ? trim($result['tagline']) : (! empty($options['tagline']) ? trim($options['tagline']) : null);

        if ($requiresAiTagline && (empty($finalTagline) || ! is_string($finalTagline))) {
            throw new RuntimeException('AI Creative Director failed to generate a valid commercial tagline from campaign context.');
        }

        return [
            'tagline' => $finalTagline,
            'visual_prompt' => $result['visual_prompt'],
            'creative_concept' => $result['creative_concept'],
            'visual_strategy' => $result['visual_strategy'],
            'model' => $model,
            'usage' => $usage,
            'duration_seconds' => $duration,
        ];
    }

    /**
     * Generate an AI-powered marketing tagline using OpenAI Responses API.
     *
     * @param  array<string, mixed>  $options
     */
    public function generateTagline(
        User $user,
        Campaign $campaign,
        ?Business $business,
        array $options = []
    ): string {
        $apiKey = config('services.openai.api_key');

        if (blank($apiKey)) {
            throw new RuntimeException('OpenAI API key is not configured. Please configure OPENAI_API_KEY.');
        }

        $model = $this->modelRegistry->getTextModel();
        $startTime = microtime(true);

        $systemInstructions = $this->buildTaglineSystemInstructions();
        $userContext = $this->buildTaglineContextPayload($campaign, $business, $options);

        $headers = [
            'Authorization' => 'Bearer '.$apiKey,
            'Content-Type' => 'application/json',
        ];

        if ($org = config('services.openai.organization')) {
            $headers['OpenAI-Organization'] = $org;
        }

        $schema = [
            'type' => 'object',
            'properties' => [
                'tagline' => [
                    'type' => 'string',
                    'description' => 'A concise, punchy, original commercial marketing tagline tailored to the business, product/service, and campaign event context. Free of invented claims, fake promotions, fake awards, or unsupported discounts.',
                ],
            ],
            'required' => ['tagline'],
            'additionalProperties' => false,
        ];

        $payload = [
            'model' => $model,
            'instructions' => $systemInstructions,
            'input' => $userContext,
            'text' => [
                'format' => [
                    'type' => 'json_schema',
                    'name' => 'tagline_suggestion_response',
                    'strict' => true,
                    'schema' => $schema,
                ],
            ],
        ];

        try {
            $response = Http::withHeaders($headers)
                ->timeout(30)
                ->post('https://api.openai.com/v1/responses', $payload);
        } catch (Exception $e) {
            Log::error('OpenAI Responses API network failure during tagline suggestion: '.$e->getMessage(), [
                'campaign_id' => $campaign->id,
                'user_id' => $user->id,
            ]);

            throw new RuntimeException('Unable to communicate with the tagline service. Please try again.');
        }

        if (! $response->successful()) {
            $status = $response->status();
            $body = $response->body();
            Log::error("OpenAI Responses API error during tagline suggestion (HTTP {$status}): {$body}", [
                'campaign_id' => $campaign->id,
                'user_id' => $user->id,
            ]);

            throw new RuntimeException('OpenAI tagline generation failed with HTTP status '.$status);
        }

        $responseData = $response->json();
        $duration = round(microtime(true) - $startTime, 2);

        $rawTagline = $this->extractTaglineResult($responseData);
        $usage = $this->extractUsage($responseData);

        Log::info('OpenAI Tagline Generated', [
            'model' => $model,
            'campaign_id' => $campaign->id,
            'user_id' => $user->id,
            'duration_seconds' => $duration,
            'input_tokens' => $usage['input_tokens'] ?? null,
            'output_tokens' => $usage['output_tokens'] ?? null,
            'total_tokens' => $usage['total_tokens'] ?? null,
        ]);

        $normalized = TaglineNormalizationService::normalize($rawTagline);

        if (empty($normalized)) {
            throw new RuntimeException('Generated tagline could not be normalized into a valid marketing phrase.');
        }

        return $normalized;
    }

    /**
     * Build system instructions for tagline generation.
     */
    protected function buildTaglineSystemInstructions(): string
    {
        return <<<'INSTRUCTIONS'
You are MarketPilot's AI Creative Copywriter and Brand Strategist.

Your job is to generate a concise, punchy, commercially viable, and original marketing tagline tailored to the business, product/service, campaign event/holiday, target audience, brand tone, and marketing style.

TAGLINE MANDATE:
- The tagline must be campaign-relevant, event/holiday-aware, and aligned with the business, industry, and product/service.
- Concise, punchy, memorable, and commercially usable (typically 3-8 words).
- Grounded strictly in factual truth: NO invented factual claims, NO fake awards, NO fake certifications, NO fake promotions, and NO unsupported discounts (never invent "50% off", "World's Best", "100% Organic", or "Guaranteed Results" unless explicitly provided in business or product context).
- Never contradict catalog pricing, campaign facts, or business positioning.
- Tailor the voice and personality to the specified Brand Tone and Content Style if provided.

Output Format:
You must return a JSON object adhering to the schema with one key:
"tagline": A single concise, punchy marketing tagline.
Do not include commentary or Markdown formatting outside the JSON object.
INSTRUCTIONS;
    }

    /**
     * Build the context payload for tagline suggestion.
     *
     * @param  array<string, mixed>  $options
     */
    protected function buildTaglineContextPayload(Campaign $campaign, ?Business $business, array $options = []): string
    {
        $sections = [];

        // 1. Campaign Details
        $campaignLines = [
            'CAMPAIGN DETAILS:',
            '- Campaign Name: '.$campaign->name,
            '- Objective: '.($campaign->objective ?: 'General Commercial Engagement'),
        ];
        if (! empty($campaign->target_audience)) {
            $campaignLines[] = '- Campaign Target Audience: '.$campaign->target_audience;
        }
        $sections[] = implode("\n", $campaignLines);

        // 2. Linked Event / Holiday Context
        $event = $campaign->event;
        if ($event) {
            $eventLines = [
                'MARKETING OCCASION / EVENT:',
                '- Event Name: '.$event->name,
            ];
            if (! empty($event->event_date)) {
                $eventLines[] = '- Date: '.$event->event_date;
            }
            if (! empty($event->description)) {
                $eventLines[] = '- Event Description: '.$event->description;
            }
            $sections[] = implode("\n", $eventLines);
        }

        // 3. Business Profile Context
        if ($business) {
            $bizLines = [
                'BUSINESS PROFILE:',
                '- Business Name: '.$business->name,
                '- Industry: '.($business->industry ?: 'General'),
                '- Category: '.($business->category ?: 'General'),
            ];
            if (! empty($business->description)) {
                $bizLines[] = '- Description: '.$business->description;
            }
            if (! empty($business->unique_selling_point)) {
                $bizLines[] = '- USP: '.$business->unique_selling_point;
            }
            if (! empty($business->target_audience)) {
                $bizLines[] = '- Business Target Audience: '.$business->target_audience;
            }
            $sections[] = implode("\n", $bizLines);
        }

        // 4. Products & Services Context
        $productLines = ['PRODUCTS & SERVICES:'];
        $catalogProducts = $options['catalog_products'] ?? [];
        if (! empty($catalogProducts)) {
            $productLines[] = '• Catalog Products:';
            foreach ($catalogProducts as $prod) {
                $pName = is_array($prod) ? ($prod['name'] ?? 'Product') : $prod->name;
                $pPrice = is_array($prod) ? ($prod['price'] ?? null) : $prod->price;
                $pDesc = is_array($prod) ? ($prod['description'] ?? null) : $prod->description;

                $line = "  - {$pName}";
                if ($pPrice !== null && $pPrice !== '') {
                    $formattedPrice = is_numeric($pPrice) ? '₱'.number_format((float) $pPrice, 2) : (string) $pPrice;
                    $line .= " (Price: {$formattedPrice})";
                }
                if (! empty($pDesc)) {
                    $line .= " — {$pDesc}";
                }
                $productLines[] = $line;
            }
        }

        $customProducts = $options['custom_products'] ?? [];
        if (! empty($customProducts) && is_array($customProducts)) {
            $productLines[] = '• Custom Products / Services:';
            foreach ($customProducts as $cProd) {
                if (! empty($cProd['name'])) {
                    $cLine = "  - {$cProd['name']}";
                    if (! empty($cProd['price'])) {
                        $cLine .= " (Price: {$cProd['price']})";
                    }
                    $productLines[] = $cLine;
                }
            }
        }

        if (empty($catalogProducts) && empty($customProducts)) {
            $productLines[] = '• Featured Product: '.(is_string($options['product_name'] ?? null) && trim($options['product_name']) !== '' ? $options['product_name'] : 'Featured Product');
        }
        $sections[] = implode("\n", $productLines);

        // 5. Creative Preferences
        $prefLines = ['CREATIVE PREFERENCES:'];
        if (! empty($options['render_style'])) {
            $prefLines[] = '- Marketing Style: '.$options['render_style'];
        }
        if (! empty($options['visual_theme'])) {
            $themes = is_array($options['visual_theme']) ? implode(', ', $options['visual_theme']) : (string) $options['visual_theme'];
            $prefLines[] = '- Theme: '.$themes;
        }
        if (! empty($options['brand_tone'])) {
            $tones = is_array($options['brand_tone']) ? implode(', ', $options['brand_tone']) : (string) $options['brand_tone'];
            $prefLines[] = '- Brand Tone: '.$tones;
        }
        if (count($prefLines) > 1) {
            $sections[] = implode("\n", $prefLines);
        }

        // 6. Optional Scene / Creative Context
        $instruction = trim((string) ($options['user_instruction'] ?? $options['notes'] ?? ''));
        if (! empty($instruction)) {
            $bounded = mb_substr($instruction, 0, 1000);
            $sections[] = "CREATIVE SETTING CONTEXT:\n\"{$bounded}\"";
        }

        return implode("\n\n", $sections);
    }

    /**
     * Extract the tagline from the OpenAI Responses API result.
     */
    public function extractTaglineResult(?array $data): string
    {
        if (empty($data)) {
            throw new RuntimeException('Received empty response from tagline service.');
        }

        $rawText = null;

        if (! empty($data['output']) && is_array($data['output'])) {
            foreach ($data['output'] as $item) {
                if (! empty($item['content']) && is_array($item['content'])) {
                    foreach ($item['content'] as $contentBlock) {
                        $type = $contentBlock['type'] ?? null;

                        if (
                            in_array($type, ['output_text', 'text'], true)
                            && isset($contentBlock['text'])
                            && is_string($contentBlock['text'])
                            && trim($contentBlock['text']) !== ''
                        ) {
                            $rawText = $contentBlock['text'];
                            break 2;
                        }
                    }
                }
            }
        }

        if ($rawText === null) {
            if (! empty($data['output_text']) && is_string($data['output_text']) && trim($data['output_text']) !== '') {
                $rawText = $data['output_text'];
            } elseif (! empty($data['choices'][0]['message']['content']) && is_string($data['choices'][0]['message']['content'])) {
                $rawText = (string) $data['choices'][0]['message']['content'];
            }
        }

        if (empty($rawText)) {
            throw new RuntimeException('Tagline service returned no readable text.');
        }

        $decoded = json_decode($rawText, true);
        if (! is_array($decoded)) {
            $clean = trim(preg_replace('/^```(?:json)?\s*|\s*```$/i', '', trim($rawText)) ?? '');
            $decoded = json_decode($clean, true);
        }

        $tagline = null;
        if (is_array($decoded) && isset($decoded['tagline']) && is_string($decoded['tagline'])) {
            $tagline = trim($decoded['tagline']);
        }

        if (empty($tagline)) {
            throw new RuntimeException('Tagline generated was empty.');
        }

        return $tagline;
    }

    /**
     * Resolve previous creative concepts from in-session requests and database history.
     *
     * @param  array<int, string>  $clientPreviousConcepts
     * @return array<int, string>
     */
    protected function resolvePreviousConcepts(User $user, Campaign $campaign, array $clientPreviousConcepts): array
    {
        $concepts = [];

        foreach ($clientPreviousConcepts as $c) {
            if (is_string($c) && trim($c) !== '') {
                $concepts[] = trim($c);
            }
        }

        $priorDesigns = Design::query()
            ->where('campaign_id', $campaign->id)
            ->where('user_id', $user->id)
            ->whereNotNull('prompt')
            ->latest()
            ->take(5)
            ->get();

        foreach ($priorDesigns as $prior) {
            $meta = $prior->generation_metadata;
            if (is_array($meta) && ! empty($meta['creative_concept']) && is_string($meta['creative_concept'])) {
                $concepts[] = trim($meta['creative_concept']);
            } elseif (! empty($prior->prompt)) {
                $firstSentence = strtok($prior->prompt, '.');
                if (! empty($firstSentence)) {
                    $concepts[] = trim($firstSentence);
                }
            }
        }

        return array_values(array_unique(array_filter($concepts)));
    }

    /**
     * Build the dedicated system instruction for the Visual Prompt Assistant / AI Creative Director.
     */
    protected function buildSystemInstructions(bool $isAutomatic, bool $requiresAiTagline = false): string
    {
        if ($isAutomatic || $requiresAiTagline) {
            return <<<'INSTRUCTIONS'
You are MarketPilot's AI Creative Director.

Your job is to conceive a complete commercial campaign creative direction — an original marketing tagline, creative concept, visual strategy, and production-ready visual marketing prompt — for downstream commercial image generation in one continuous creative flow.

AUTOMATIC CREATIVE DECISION HIERARCHY (STRICT PRIORITY):
1. CAMPAIGN OBJECTIVE: The marketing purpose (e.g., Product Promotion vs Brand Awareness vs Seasonal Sale vs Customer Retention vs Launch) is a PRIMARY creative driver that dictates the overarching advertising intent, emotional tone, and commercial urgency.
2. LINKED EVENT / HOLIDAY: The linked campaign Event/Holiday is a GENUINE CREATIVE DRIVER, not just decorative text. Use the event to profoundly shape the creative concept, emotional framing, visual story, environment, props, lighting, composition, and marketing emphasis.
3. INDUSTRY & SUBCATEGORY DOMAIN STANDARDS: Ground the staging in deterministic commercial knowledge (surfaces, textures, lighting standards, commercial environments, props, and industry conventions) while applying creative reasoning.
4. BUSINESS POSITIONING & TARGET AUDIENCE: Tailor the creative direction to the specific business context, positioning (e.g., affordable neighborhood vs premium luxury), USP, and target audience.
5. PRODUCT / SERVICE (AUTHORITATIVE): The selected product/service is authoritative. Ground the scene in its physical reality without hallucinating fake claims, invented prices, fake certifications, or unsupported discounts.
6. ORIGINAL CAMPAIGN TAGLINE: Formulate an original, punchy, commercially viable, and event-aware tagline.
7. CREATIVE CONCEPT: Formulate a genuine advertising idea and title (e.g., "The Gratitude Desk", "Morning Radiance Awakening"), not merely repeating the holiday name.
8. VISUAL STRATEGY: Explain how the event, campaign objective, industry conventions, lighting, and composition visually express the concept.
9. PRODUCTION VISUAL PROMPT: Formulate the complete, high-fidelity visual scene description for image generation.
10. ASPECT RATIO & CANVAS: Adapt composition, spatial depth, and safe areas to the requested aspect ratio format.

GROUNDED TAGLINE MANDATE:
- The tagline must be campaign-relevant, event/holiday-aware, and aligned with the business, industry, and product/service.
- Concise, punchy, memorable, and commercially usable.
- Grounded strictly in factual truth: NO invented factual claims, NO fake awards, NO fake certifications, NO fake promotions, and NO unsupported discounts (never invent "50% off", "World's Best", "100% Organic", or "Guaranteed Results" unless explicitly provided).
- Never contradict catalog pricing, campaign facts, or business positioning.

CREATIVE VARIATION & ANTI-REPETITION MANDATE:
Every automatic generation must feel original and fresh. The Automatic Creative Director is instructed to produce substantially different creative concepts and uses prior campaign generations to reduce repetition. If previous creative concepts are provided, you MUST NOT repeat or superficially rephrase them. Formulate a noticeably fresh, distinct creative concept, visual story, scene setting, composition, lighting mood, or creative metaphor while preserving the business, campaign, product identity, and aspect ratio.

Never invent or alter:
- product names
- catalog prices
- campaign events
- business facts
- product physical identity

Use the supplied information exactly.

Respect MarketPilot's visual constraints:
- PRESERVE PRODUCT IDENTITY: The supplied product image and identity are authoritative. Describe environmental staging, lighting, composition, and festive/promotional atmosphere around the product without reconstructing or altering the product itself.
- STRICT LOGO RESTRICTION: Do NOT generate, invent, draw, or add any logo, emblem, brand mark, icon, watermark, cup logo, café emblem, crown, badge, fake certification mark, or social media badge anywhere in the artwork.
- BUSINESS NAME AS TYPOGRAPHY ONLY: If business name is enabled, describe it strictly as readable, stylized commercial typography integrated into the design. Never describe it as a logo or inside an invented brand mark.
- EXACT PRICE & COPY: If price is specified, treat exact characters, digits, and currency symbols as immutable.
- RESPECT CANVAS: Respect the requested aspect ratio (e.g. 1:1, 16:9, 9:16, 4:5). Adapt visual composition to the selected canvas format.
- EVENT AS MAJOR DRIVER: The campaign event and objective actively direct the visual storytelling and festive environment appropriate to the industry. If no event is present, do not invent one.
- COMPOSITION & SAFE AREA: Place hero products and typography within clear, uncluttered safe zones with balanced visual hierarchy.

Output Format:
You must return a JSON object adhering to the schema with four keys:
1. "tagline": The concise, original marketing tagline.
2. "creative_concept": A clear, evocative title and summary of the core creative idea (e.g., "Quiet Café Morning Appreciation").
3. "visual_strategy": The rationale explaining how the event, industry conventions, lighting, and composition elevate the hero product.
4. "visual_prompt": The complete, high-fidelity visual prompt for commercial image generation.
Do not include commentary or Markdown formatting outside the JSON object.
INSTRUCTIONS;
        }

        return <<<'INSTRUCTIONS'
You are MarketPilot's Visual Prompt Assistant for MANUAL MODE.

Your job is to transform structured campaign, business, product/service, event, brand, and user creative-direction choices into a concise, production-ready visual marketing prompt for downstream commercial image generation.

MANUAL CREATIVE DECISION HIERARCHY (USER-DIRECTED PRIORITY):
1. USER SCENE CONCEPT / VISUAL PROMPT: High authority. When the user specifies a scene, setting, or visual instruction, fulfill it faithfully. Do NOT silently replace it with a different scene or AI-invented theme.
2. CONTENT STYLE: Explicit user choice (e.g., Studio Product Still, Cinematic Marketing, Lifestyle Capture, Minimalist Graphic). Enforce this style strictly.
3. BRAND TONE: Explicit user choice (e.g., Sophisticated, Warm, Playful, Professional, Bold). Shape visual personality and mood accordingly.
4. VISUAL THEME: Explicit user choice if specified. Enrich background environment with props that complement the user scene.
5. PRODUCT / SERVICE (AUTHORITATIVE): Center the composition around the user's selected product/service without altering its physical identity.
6. USER TAGLINE: Respect user-provided tagline verbatim, or suggest an aligned tagline that matches the user's explicit style and tone.
7. CAMPAIGN EVENT AS CONTEXT: In Manual Mode, the linked Campaign Event/Holiday provides subtle CONTEXTUAL atmosphere and decorative accents. It is subordinate to the user's explicit scene prompt and style choices and must NOT override them.
8. ASPECT RATIO: Enforce the user-selected canvas aspect ratio.

You are NOT the source of truth for factual business information.

Never invent or alter:
- product names
- catalog prices
- campaign events
- business facts
- product physical identity
- provided taglines

Use the supplied information exactly.

Respect MarketPilot's visual constraints:
- PRESERVE PRODUCT IDENTITY: The supplied product image and identity are authoritative. Describe environmental staging, lighting, composition, and festive/promotional atmosphere around the product without reconstructing or altering the product itself.
- STRICT LOGO RESTRICTION: Do NOT generate, invent, draw, or add any logo, emblem, brand mark, icon, watermark, cup logo, café emblem, crown, badge, fake certification mark, or social media badge anywhere in the artwork.
- BUSINESS NAME AS TYPOGRAPHY ONLY: If business name is enabled, describe it strictly as readable, stylized commercial typography integrated into the design. Never describe it as a logo or inside an invented brand mark.
- EXACT PRICE & COPY: If price or tagline is specified, treat exact characters, digits, and currency symbols as immutable.
- RESPECT CANVAS & ART DIRECTION: Respect the requested aspect ratio (e.g. 1:1, 16:9, 9:16, 4:5), render style, visual theme, and brand tone.
- EVENT AS CONTEXT: The campaign event (holiday/occasion) provides contextual atmosphere, lighting, and decorative accents. It must not erase the primary product focal point or override user scene choices.
- COMPOSITION & SAFE AREA: Place hero products and typography within clear, uncluttered safe zones with balanced visual hierarchy.

Output Format:
You must return a JSON object adhering to the schema with three keys:
1. "creative_concept": A clear, evocative title and summary of the core creative idea.
2. "visual_strategy": The rationale for the scene, lighting, and composition.
3. "visual_prompt": The complete, production-ready visual prompt for image generation.
Do not include commentary or Markdown formatting outside the JSON object.
INSTRUCTIONS;
    }

    /**
     * Construct the authoritative context string sent to the model.
     *
     * @param  array<string, mixed>  $options
     * @param  array<int, string>  $previousConcepts
     */
    public function buildContextPayload(
        Campaign $campaign,
        ?Business $business,
        array $options,
        array $previousConcepts = []
    ): string {
        $sections = [];
        $isAutomatic = ($options['generation_mode'] ?? 'automatic') === 'automatic';

        // 1. Campaign Context
        $campaignLines = [
            'CAMPAIGN:',
            '- Name: '.$campaign->name,
        ];
        if (! empty($campaign->objective)) {
            $campaignLines[] = '- Objective: '.$campaign->objective;
        }
        if (! empty($campaign->target_audience)) {
            $campaignLines[] = '- Target Audience: '.$campaign->target_audience;
        }
        $sections[] = implode("\n", $campaignLines);

        // 2. Read-Only Campaign Event Context
        $event = $campaign->event;
        $eventLines = ['CAMPAIGN EVENT (READ-ONLY CONTEXT):'];
        if ($event) {
            $eventLines[] = '- Event Name: '.$event->name;
            if ($event->date) {
                $eventLines[] = '- Event Date: '.$event->date->format('F d, Y');
            }
            if ($event->type) {
                $eventLines[] = '- Event Classification: '.$event->type;
            }
            if ($event->category) {
                $eventLines[] = '- Event Category: '.$event->category;
            }
            if ($event->long_weekend_details) {
                $eventLines[] = '- Context / Atmosphere: '.$event->long_weekend_details;
            }
        } else {
            $eventLines[] = '- None linked. Do not invent a holiday or occasion.';
        }
        $sections[] = implode("\n", $eventLines);

        // 3. Business Profile Context
        if ($business) {
            $bizLines = [
                'BUSINESS PROFILE:',
                '- Business Name: '.$business->name,
                '- Industry: '.($business->industry ?: 'General'),
                '- Category: '.($business->category ?: 'General'),
            ];
            if (! empty($business->description)) {
                $bizLines[] = '- Description: '.$business->description;
            }
            if (! empty($business->unique_selling_point)) {
                $bizLines[] = '- USP: '.$business->unique_selling_point;
            }
            if (! empty($business->target_audience)) {
                $bizLines[] = '- Business Target Audience: '.$business->target_audience;
            }
            $sections[] = implode("\n", $bizLines);
        }

        // 4. Industry & Subcategory Art Direction Guidance
        $firstProductName = 'Product';
        $catalogProducts = $options['catalog_products'] ?? [];
        if (! empty($catalogProducts)) {
            $first = is_array($catalogProducts) ? reset($catalogProducts) : $catalogProducts->first();
            if ($first) {
                $firstProductName = is_array($first) ? ($first['name'] ?? 'Product') : $first->name;
            }
        }

        $artDirection = $this->artDirectionService->resolveArtDirection(
            $business?->industry,
            $business?->category,
            $firstProductName
        );

        $domainLines = [
            'INDUSTRY & SUBCATEGORY ART DIRECTION STANDARDS:',
            '- Domain Industry: '.$artDirection['industry'],
            '- Domain Subcategory: '.$artDirection['category'],
            '- Commercial Environment: '.$artDirection['environment'],
            '- Recommended Surfaces & Textures: '.$artDirection['surfaces'],
            '- Commercial Lighting Standards: '.$artDirection['lighting'],
            '- Contextual Props & Staging: '.$artDirection['props'],
            '- Commercial Conventions: '.$artDirection['commercial_conventions'],
            '- Visual Pitfalls To Avoid: '.$artDirection['things_to_avoid'],
        ];
        $sections[] = implode("\n", $domainLines);

        // 5. Products & Services Context (Authoritative Catalog Values)
        $productLines = ['PRODUCTS & SERVICES:'];

        if (! empty($catalogProducts)) {
            $productLines[] = '• Authoritative Catalog Products (Exact names and prices must not be altered):';
            foreach ($catalogProducts as $prod) {
                $pName = is_array($prod) ? ($prod['name'] ?? 'Product') : $prod->name;
                $pPrice = is_array($prod) ? ($prod['price'] ?? null) : $prod->price;
                $pDesc = is_array($prod) ? ($prod['description'] ?? null) : $prod->description;

                $line = "  - {$pName}";
                if ($pPrice !== null && $pPrice !== '') {
                    $formattedPrice = is_numeric($pPrice) ? '₱'.number_format((float) $pPrice, 2) : (string) $pPrice;
                    $line .= " (Authoritative Catalog Price: {$formattedPrice})";
                }
                if (! empty($pDesc)) {
                    $line .= " — {$pDesc}";
                }
                $productLines[] = $line;
            }
        }

        $customProducts = $options['custom_products'] ?? [];
        if (! empty($customProducts) && is_array($customProducts)) {
            $productLines[] = '• Custom Products / Services:';
            foreach ($customProducts as $cProd) {
                if (! empty($cProd['name'])) {
                    $cLine = "  - {$cProd['name']}";
                    if (! empty($cProd['price'])) {
                        $cLine .= " (Price: {$cProd['price']})";
                    }
                    $productLines[] = $cLine;
                }
            }
        }

        if (empty($catalogProducts) && empty($customProducts)) {
            $productLines[] = '• Featured Product: '.(is_string($options['product_name'] ?? null) ? $options['product_name'] : 'Featured Product');
        }
        $sections[] = implode("\n", $productLines);

        // 6. Creative Choices & Direction
        $creativeLines = ['CREATIVE SPECIFICATIONS:'];
        if ($isAutomatic) {
            $creativeLines[] = '- Generation Mode: AUTOMATIC (AI Creative Director autonomously synthesizes concept, style, lighting, and composition)';
        } else {
            $creativeLines[] = '- Generation Mode: MANUAL (User specifies fine artistic parameters)';
            if (! empty($options['render_style'])) {
                $creativeLines[] = '- Render Style: '.$options['render_style'];
            }
            if (! empty($options['visual_theme'])) {
                $themes = is_array($options['visual_theme']) ? implode(', ', $options['visual_theme']) : (string) $options['visual_theme'];
                $creativeLines[] = '- Visual Theme: '.$themes;
            }
            if (! empty($options['brand_tone'])) {
                $tones = is_array($options['brand_tone']) ? implode(', ', $options['brand_tone']) : (string) $options['brand_tone'];
                $creativeLines[] = '- Brand Tone: '.$tones;
            }
        }

        if (! empty($options['aspect_ratio'])) {
            $creativeLines[] = '- Aspect Ratio: '.$options['aspect_ratio'];
        }
        $requiresAiTagline = $isAutomatic || ! empty($options['require_tagline']);
        if (! empty($options['tagline'])) {
            $creativeLines[] = '- Tagline Copy: "'.$options['tagline'].'"';
        }
        if ($requiresAiTagline) {
            $creativeLines[] = '- Tagline Directive: AUTONOMOUS GENERATION (Formulate an original, commercially grounded, event-aware campaign tagline for this generation'.(! empty($options['tagline']) ? ' harmonizing with or elevating the seed copy' : '').')';
        }
        $includeBiz = $options['include_business_name'] ?? true;
        $creativeLines[] = '- Business Name Display: '.($includeBiz ? 'Enabled as typography only' : 'Disabled');
        $creativeLines[] = '- Reference Product Image Available: '.(! empty($options['has_reference_image']) ? 'YES (Preserve exact product geometry & packaging)' : 'NO');

        $sections[] = implode("\n", $creativeLines);

        // 7. Previous Concepts to Avoid (Anti-Repetition Engine)
        if (! empty($previousConcepts)) {
            $historyLines = [
                'PREVIOUS CREATIVE CONCEPTS (DO NOT REPEAT OR DUPLICATE):',
                'The following creative concepts were already conceived for this campaign. You MUST formulate a noticeably distinct, fresh creative metaphor, scene setting, lighting mood, or visual story:',
            ];
            foreach ($previousConcepts as $idx => $concept) {
                $historyLines[] = ($idx + 1).'. '.$concept;
            }
            $sections[] = implode("\n", $historyLines);
        }

        // 8. User Creative Instruction (Natural language from the Studio user)
        $userInstruction = trim((string) ($options['user_instruction'] ?? ''));
        if (! empty($userInstruction)) {
            $sections[] = "USER CREATIVE INSTRUCTION:\n\"{$userInstruction}\"\nIntegrate this artistic direction seamlessly with the authoritative product, event, and brand context.";
        } else {
            $sections[] = "USER CREATIVE INSTRUCTION:\nNone provided. Craft an original, high-performing commercial visual scene centered on the product and marketing context.";
        }

        return implode("\n\n", $sections);
    }

    /**
     * Extract and validate the structured result from the OpenAI Responses API result.
     *
     * @param  array<string, mixed>|null  $data
     * @return array{
     *     creative_concept: string|null,
     *     visual_strategy: string|null,
     *     visual_prompt: string,
     * }
     */
    public function extractResult(?array $data): array
    {
        if (empty($data)) {
            throw new RuntimeException('Received empty response from visual prompt service.');
        }

        $rawText = null;

        // OpenAI Responses API structure check
        if (! empty($data['output']) && is_array($data['output'])) {
            foreach ($data['output'] as $item) {
                if (! empty($item['content']) && is_array($item['content'])) {
                    foreach ($item['content'] as $contentBlock) {
                        $type = $contentBlock['type'] ?? null;

                        if (
                            in_array($type, ['output_text', 'text'], true)
                            && isset($contentBlock['text'])
                            && is_string($contentBlock['text'])
                            && trim($contentBlock['text']) !== ''
                        ) {
                            $rawText = $contentBlock['text'];
                            break 2;
                        }
                    }
                }
            }
        }

        // Compatibility fallbacks
        if ($rawText === null) {
            if (! empty($data['output_text']) && is_string($data['output_text']) && trim($data['output_text']) !== '') {
                $rawText = $data['output_text'];
            } elseif (! empty($data['choices'][0]['message']['content']) && is_string($data['choices'][0]['message']['content'])) {
                $rawText = (string) $data['choices'][0]['message']['content'];
            }
        }

        if (empty($rawText)) {
            throw new RuntimeException('Visual prompt service returned no readable text.');
        }

        // Parse structured JSON output
        $decoded = json_decode($rawText, true);

        if (! is_array($decoded)) {
            // Attempt to clean JSON block if wrapped in markdown
            $clean = trim(preg_replace('/^```(?:json)?\s*|\s*```$/i', '', trim($rawText)) ?? '');
            $decoded = json_decode($clean, true);
        }

        $prompt = null;
        $concept = null;
        $strategy = null;
        $tagline = null;

        if (is_array($decoded)) {
            if (isset($decoded['tagline']) && is_string($decoded['tagline'])) {
                $tagline = trim($decoded['tagline']);
            }
            if (isset($decoded['visual_prompt']) && is_string($decoded['visual_prompt'])) {
                $prompt = trim($decoded['visual_prompt']);
            }
            if (isset($decoded['creative_concept']) && is_string($decoded['creative_concept'])) {
                $concept = trim($decoded['creative_concept']);
            }
            if (isset($decoded['visual_strategy']) && is_string($decoded['visual_strategy'])) {
                $strategy = trim($decoded['visual_strategy']);
            }
        }

        if (empty($prompt)) {
            // If model returned plain text despite schema, validate and sanitize
            $prompt = trim($rawText);
        }

        if ($prompt === '') {
            throw new RuntimeException('Visual prompt generated was empty.');
        }

        return [
            'tagline' => $tagline,
            'creative_concept' => $concept,
            'visual_strategy' => $strategy,
            'visual_prompt' => Str::limit($prompt, 4000, ''),
        ];
    }

    /**
     * Extract and validate the visual prompt string from the OpenAI Responses API result.
     * Backwards compatibility method.
     *
     * @param  array<string, mixed>|null  $data
     */
    public function extractVisualPrompt(?array $data): string
    {
        return $this->extractResult($data)['visual_prompt'];
    }

    /**
     * Extract token usage metadata from response.
     *
     * @param  array<string, mixed>|null  $data
     * @return array{input_tokens: int|null, output_tokens: int|null, total_tokens: int|null}
     */
    protected function extractUsage(?array $data): array
    {
        $usage = $data['usage'] ?? [];

        return [
            'input_tokens' => isset($usage['input_tokens']) ? (int) $usage['input_tokens'] : null,
            'output_tokens' => isset($usage['output_tokens']) ? (int) $usage['output_tokens'] : null,
            'total_tokens' => isset($usage['total_tokens']) ? (int) $usage['total_tokens'] : null,
        ];
    }
}
