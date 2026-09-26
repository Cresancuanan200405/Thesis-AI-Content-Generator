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
        protected ?MarketingDesignSystem $designSystem = null,
    ) {
        $this->artDirectionService = $artDirectionService ?? app(IndustryCategoryArtDirectionService::class);
        $this->designSystem = $designSystem ?? app(MarketingDesignSystem::class);
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

        if (array_key_exists('require_tagline', $options) && $options['require_tagline'] !== null) {
            $requiresAiTagline = filter_var($options['require_tagline'], FILTER_VALIDATE_BOOLEAN);
        } elseif (array_key_exists('include_tagline', $options) && $options['include_tagline'] !== null) {
            $requiresAiTagline = filter_var($options['include_tagline'], FILTER_VALIDATE_BOOLEAN);
        } else {
            $requiresAiTagline = $isAutomatic;
        }

        // Retrieve previous creative concepts for campaign to avoid repetition
        $previousConcepts = $this->resolvePreviousConcepts($user, $campaign, $options['previous_concepts'] ?? []);

        $headers = [
            'Authorization' => 'Bearer '.$apiKey,
            'Content-Type' => 'application/json',
        ];

        if ($org = config('services.openai.organization')) {
            $headers['OpenAI-Organization'] = $org;
        }

        if ($isAutomatic) {
            $systemInstructions = $this->buildSystemInstructions($isAutomatic, $requiresAiTagline);
            $userContext = $this->buildContextPayload($campaign, $business, $options, $previousConcepts);

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

            $designProperties = [
                'design_treatment' => [
                    'type' => 'string',
                    'description' => 'Commercial design treatment from controlled registry: '.implode(', ', array_keys(MarketingDesignSystem::DESIGN_TREATMENTS)),
                ],
                'copy_emphasis' => [
                    'type' => 'string',
                    'description' => 'Commercial copy emphasis from controlled registry: '.implode(', ', array_keys(MarketingDesignSystem::COPY_EMPHASES)),
                ],
                'typography_layout' => [
                    'type' => 'string',
                    'description' => 'Typography layout hierarchy from controlled registry: '.implode(', ', array_keys(MarketingDesignSystem::TYPOGRAPHY_LAYOUTS)),
                ],
                'copy_layout' => [
                    'type' => 'string',
                    'description' => 'Copy layout structure from controlled registry: '.implode(', ', array_keys(MarketingDesignSystem::COPY_LAYOUTS)),
                ],
                'product_name_style' => [
                    'type' => 'string',
                    'description' => 'Product name typography style from controlled registry: '.implode(', ', array_keys(MarketingDesignSystem::PRODUCT_NAME_STYLES)),
                ],
                'price_style' => [
                    'type' => 'string',
                    'description' => 'Price typography presentation style from controlled registry: '.implode(', ', array_keys(MarketingDesignSystem::PRICE_STYLES)),
                ],
                'tagline_style' => [
                    'type' => 'string',
                    'description' => 'Tagline typography presentation style from controlled registry: '.implode(', ', array_keys(MarketingDesignSystem::TAGLINE_STYLES)),
                ],
                'text_depth_mode' => [
                    'type' => 'string',
                    'description' => 'Typographic layering and plane depth from controlled registry: '.implode(', ', array_keys(MarketingDesignSystem::TEXT_DEPTH_MODES)),
                ],
                'composition_type' => [
                    'type' => 'string',
                    'description' => 'Composition geometry from controlled registry: '.implode(', ', array_keys(MarketingDesignSystem::COMPOSITION_TYPES)),
                ],
                'camera_viewpoint' => [
                    'type' => 'string',
                    'description' => 'Camera perspective from controlled registry: '.implode(', ', array_keys(MarketingDesignSystem::CAMERA_VIEWPOINTS)),
                ],
                'lighting_profile' => [
                    'type' => 'string',
                    'description' => 'Lighting profile from controlled registry: '.implode(', ', array_keys(MarketingDesignSystem::LIGHTING_PROFILES)),
                ],
                'scene_family' => [
                    'type' => 'string',
                    'description' => 'Scene family from controlled registry: '.implode(', ', array_keys(MarketingDesignSystem::SCENE_FAMILIES)),
                ],
                'environment_family' => [
                    'type' => 'string',
                    'description' => 'Environment setting from controlled registry: '.implode(', ', array_keys(MarketingDesignSystem::ENVIRONMENT_FAMILIES)),
                ],
                'prop_profile' => [
                    'type' => 'string',
                    'description' => 'Prop arrangement from controlled registry: '.implode(', ', array_keys(MarketingDesignSystem::PROP_PROFILES)),
                ],
                'render_style' => [
                    'type' => 'string',
                    'description' => 'Commercial render style from controlled registry: '.implode(', ', MarketingDesignSystem::RENDER_STYLES),
                ],
                'visual_world_archetype' => [
                    'type' => 'string',
                    'description' => 'Visual world archetype from controlled registry: '.implode(', ', array_keys(MarketingDesignSystem::VISUAL_WORLD_ARCHETYPES)),
                ],
                'background_style' => [
                    'type' => 'string',
                    'description' => 'Background style treatment from controlled registry: '.implode(', ', array_keys(MarketingDesignSystem::BACKGROUND_STYLES)),
                ],
                'product_arrangement' => [
                    'type' => 'string',
                    'description' => 'Multi-product spatial arrangement strategy: '.implode(', ', array_keys(MarketingDesignSystem::PRODUCT_ARRANGEMENTS)),
                ],
                'visual_theme' => [
                    'type' => 'string',
                    'description' => 'Visual theme from controlled registry: '.implode(', ', MarketingDesignSystem::VISUAL_THEMES),
                ],
                'brand_tone' => [
                    'type' => 'string',
                    'description' => 'Brand tone from controlled registry: '.implode(', ', MarketingDesignSystem::BRAND_TONES),
                ],
            ];

            $schemaProperties = array_merge($schemaProperties, $designProperties);
            $requiredFields = array_merge($requiredFields, array_keys($designProperties));
        } else {
            // MANUAL MODE: AI Creative Director for the VISUAL SCENE only.
            $systemInstructions = $this->buildManualSystemInstructions($options, $requiresAiTagline);
            $userContext = $this->buildManualContextPayload($campaign, $business, $options, $previousConcepts);

            $schemaProperties = [
                'creative_concept' => [
                    'type' => 'string',
                    'description' => 'A clear, evocative title of the core creative idea (e.g., "Travertine Gift Sanctuary", "Minimalist Pastel Harmony").',
                ],
                'visual_strategy' => [
                    'type' => 'string',
                    'description' => 'Concise explanation (1-2 sentences) of how the composition, lighting, and materials stage the product and reflect the design treatment.',
                ],
                'visual_prompt' => [
                    'type' => 'string',
                    'description' => 'A concise (60-130 words) natural-language visual scene prompt describing the environment, materials, multi-product spatial arrangement, composition, lighting, and atmosphere. Does not include raw prices, taglines, business names, or technical prompt syntax.',
                ],
            ];
            $requiredFields = ['creative_concept', 'visual_strategy', 'visual_prompt'];

            if ($requiresAiTagline) {
                $schemaProperties['tagline'] = [
                    'type' => 'string',
                    'description' => 'A concise, punchy, original commercial marketing tagline tailored to the business and event context.',
                ];
                $requiredFields[] = 'tagline';
            }
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

        $finalTagline = $requiresAiTagline
            ? (! empty($result['tagline']) ? trim($result['tagline']) : (! empty($options['tagline']) ? trim($options['tagline']) : null))
            : null;

        if ($requiresAiTagline && (empty($finalTagline) || ! is_string($finalTagline))) {
            throw new RuntimeException('AI Creative Director failed to generate a valid commercial tagline from campaign context.');
        }

        $designTreatment = $this->designSystem->validateDesignTreatment($result['design_treatment'] ?? null);
        $copyEmphasis = $this->designSystem->validateCopyEmphasis($result['copy_emphasis'] ?? null);
        $typographyLayout = $this->designSystem->validateTypographyLayout($result['typography_layout'] ?? null);
        $copyLayout = $this->designSystem->validateCopyLayout($result['copy_layout'] ?? ($result['typography_layout'] ?? null));
        $productNameStyle = $this->designSystem->validateProductNameStyle($result['product_name_style'] ?? null);
        $priceStyle = $this->designSystem->validatePriceStyle($result['price_style'] ?? null);
        $taglineStyle = $this->designSystem->validateTaglineStyle($result['tagline_style'] ?? null);
        $textDepthMode = $this->designSystem->validateTextDepthMode($result['text_depth_mode'] ?? null);
        $compositionType = $this->designSystem->validateCompositionType($result['composition_type'] ?? null);
        $cameraViewpoint = $this->designSystem->validateCameraViewpoint($result['camera_viewpoint'] ?? null);
        $lightingProfile = $this->designSystem->validateLightingProfile($result['lighting_profile'] ?? null);
        $sceneFamily = $this->designSystem->validateSceneFamily($result['scene_family'] ?? null);
        $environmentFamily = $this->designSystem->validateEnvironmentFamily($result['environment_family'] ?? null);
        $propProfile = $this->designSystem->validatePropProfile($result['prop_profile'] ?? null);
        $renderStyle = $this->designSystem->validateRenderStyle($result['render_style'] ?? ($options['render_style'] ?? null));
        $visualWorldArchetype = $this->designSystem->validateVisualArchetype($result['visual_world_archetype'] ?? null);
        $backgroundStyle = $this->designSystem->validateBackgroundStyle($result['background_style'] ?? null);
        $productArrangement = $this->designSystem->validateProductArrangement($result['product_arrangement'] ?? null);
        $visualTheme = ! empty($result['visual_theme']) && in_array($result['visual_theme'], MarketingDesignSystem::VISUAL_THEMES, true) ? $result['visual_theme'] : null;
        $brandTone = ! empty($result['brand_tone']) && in_array($result['brand_tone'], MarketingDesignSystem::BRAND_TONES, true) ? $result['brand_tone'] : null;

        return [
            'tagline' => $finalTagline,
            'visual_prompt' => $result['visual_prompt'],
            'creative_concept' => $result['creative_concept'],
            'visual_strategy' => $result['visual_strategy'],
            'design_treatment' => $designTreatment,
            'copy_emphasis' => $copyEmphasis,
            'typography_layout' => $typographyLayout,
            'copy_layout' => $copyLayout,
            'product_name_style' => $productNameStyle,
            'price_style' => $priceStyle,
            'tagline_style' => $taglineStyle,
            'text_depth_mode' => $textDepthMode,
            'composition_type' => $compositionType,
            'camera_viewpoint' => $cameraViewpoint,
            'lighting_profile' => $lightingProfile,
            'scene_family' => $sceneFamily,
            'environment_family' => $environmentFamily,
            'prop_profile' => $propProfile,
            'render_style' => $renderStyle,
            'visual_world_archetype' => $visualWorldArchetype,
            'background_style' => $backgroundStyle,
            'product_arrangement' => $productArrangement,
            'visual_theme' => $visualTheme,
            'brand_tone' => $brandTone,
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
        if ($isAutomatic && ! $requiresAiTagline) {
            return <<<'INSTRUCTIONS'
You are MarketPilot's AI Creative Director.

Your job is to conceive a complete commercial campaign creative direction — creative concept, visual strategy, and production-ready visual marketing prompt — for downstream commercial image generation in one continuous creative flow.

TAGLINE DIRECTIVE (DISABLED):
Tagline generation is explicitly DISABLED for this visual. Do NOT generate, suggest, or invent a tagline. Do NOT include headline copy, promotional slogans, or visible tagline text anywhere in the visual prompt. Focus entirely on product presentation, authentic scene setting, commercial lighting, props, and composition.

AUTOMATIC CREATIVE DECISION HIERARCHY (STRICT PRIORITY):
1. CAMPAIGN OBJECTIVE: The marketing purpose (e.g., Product Promotion vs Brand Awareness vs Seasonal Sale vs Customer Retention vs Launch) is a PRIMARY creative driver that dictates the overarching advertising intent, emotional tone, and commercial urgency.
2. LINKED EVENT / HOLIDAY: The linked campaign Event/Holiday is a GENUINE CREATIVE DRIVER, not just decorative text. Event visual influence is ALWAYS ACTIVE. Use the event to profoundly shape the creative concept, emotional framing, visual story, environment, props, lighting, composition, and marketing emphasis.
3. INDUSTRY & SUBCATEGORY DOMAIN STANDARDS: Ground the staging in deterministic commercial knowledge (surfaces, textures, lighting standards, commercial environments, props, and industry conventions) while applying creative reasoning.
4. BUSINESS POSITIONING & TARGET AUDIENCE: Tailor the creative direction to the specific business context, positioning (e.g., affordable neighborhood vs premium luxury), USP, and target audience.
5. PRODUCT / SERVICE (AUTHORITATIVE): The selected product/service is authoritative. Ground the scene in its physical reality without hallucinating fake claims, invented prices, fake certifications, or unsupported discounts.
6. CREATIVE CONCEPT: Formulate a genuine advertising idea and title (e.g., "The Gratitude Desk", "Morning Radiance Awakening"), not merely repeating the holiday name.
7. VISUAL STRATEGY: Explain how the event, campaign objective, industry conventions, lighting, and composition visually express the concept.
8. PRODUCTION VISUAL PROMPT: Formulate the complete, high-fidelity visual scene description for image generation.
9. ASPECT RATIO & CANVAS: Adapt composition, spatial depth, and safe areas to the requested aspect ratio format.

SHARED CREATIVE SYSTEM DIRECTIVES:
- MULTI-PRODUCT SPATIAL RELATIONSHIPS: When multiple products are selected, you MUST create a deliberate spatial relationship between them (such as hero + supporting products, staggered depth, diagonal progression, asymmetric grouping, foreground/background, tiered pedestal, nested arrangement, mirrored arrangement, sculptural cluster, or editorial cascade). NEVER place them in a flat side-by-side row. All selected products must remain represented.
- VISUAL WORLD & BACKGROUND DIVERSITY: Intentionally explore and vary visual worlds (clean centered premium studio, full black luxury gradient, dual-tone color-block environment, marble/travertine set, botanical lifestyle, futuristic glass environment, architectural interior, dark cinematic environment, colorful abstract environment, geometric sculptural environment, editorial campaign, surreal/custom visual world, tropical/outdoor scene, vanity/bathroom scene, lifestyle environment). Intentionally vary background treatments (clean white, full black, dark gradient, dual-tone split, pastel color blocking, monochrome, glass, marble, stone, botanical, architectural, cinematic atmospheric, abstract, geometric, natural outdoor). Do NOT repeatedly default to beige/white studio backgrounds.
- EVENT / HOLIDAY VISUAL STORYTELLING: When an event/holiday exists, event visual influence is ALWAYS ACTIVE. The event shapes the scene, environment, props, atmosphere, color, lighting, composition, and visual storytelling around the product. Do not force the event name into visible typography unless event text is explicitly approved.
- TYPOGRAPHIC CREATIVE VARIATION & COPY IMMUTABILITY: Select diverse typographic presentations (copy layout, product-name style, price style, tagline style, text depth, and hierarchy). Creative freedom applies to HOW the copy looks; ZERO freedom applies to WHAT the copy says. Never alter or invent product names, prices, business names, slogans, claims, or discounts.

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
- EXACT PRICE & COPY: If price is specified and enabled, treat exact characters, digits, and currency symbols as immutable. If disabled, do NOT render prices as text.
- NO TAGLINE / HEADLINE COPY: Do NOT include or describe any tagline or marketing slogan text.
- RESPECT CANVAS: Respect the requested aspect ratio (e.g. 1:1, 16:9, 9:16, 4:5). Adapt visual composition to the selected canvas format.
- EVENT AS MAJOR DRIVER: The campaign event and objective actively direct the visual storytelling and festive environment appropriate to the industry. If no event is present, do not invent one.
- COMPOSITION & SAFE AREA: Place hero products within clear, uncluttered safe zones with balanced visual hierarchy.

Output Format:
You must return a JSON object adhering to the schema with three keys:
1. "creative_concept": A clear, evocative title and summary of the core creative idea (e.g., "Quiet Café Morning Appreciation").
2. "visual_strategy": The rationale explaining how the event, industry conventions, lighting, and composition elevate the hero product.
3. "visual_prompt": The complete, high-fidelity visual prompt for commercial image generation.
Do not include commentary or Markdown formatting outside the JSON object.
INSTRUCTIONS;
        }

        if ($isAutomatic || $requiresAiTagline) {
            return <<<'INSTRUCTIONS'
You are MarketPilot's AI Creative Director.

Your job is to conceive a complete commercial campaign creative direction — an original marketing tagline, creative concept, visual strategy, and production-ready visual marketing prompt — for downstream commercial image generation in one continuous creative flow.

AUTOMATIC CREATIVE DECISION HIERARCHY (STRICT PRIORITY):
1. CAMPAIGN OBJECTIVE: The marketing purpose (e.g., Product Promotion vs Brand Awareness vs Seasonal Sale vs Customer Retention vs Launch) is a PRIMARY creative driver that dictates the overarching advertising intent, emotional tone, and commercial urgency.
2. LINKED EVENT / HOLIDAY: The linked campaign Event/Holiday is a GENUINE CREATIVE DRIVER, not just decorative text. Event visual influence is ALWAYS ACTIVE. Use the event to profoundly shape the creative concept, emotional framing, visual story, environment, props, lighting, composition, and marketing emphasis.
3. INDUSTRY & SUBCATEGORY DOMAIN STANDARDS: Ground the staging in deterministic commercial knowledge (surfaces, textures, lighting standards, commercial environments, props, and industry conventions) while applying creative reasoning.
4. BUSINESS POSITIONING & TARGET AUDIENCE: Tailor the creative direction to the specific business context, positioning (e.g., affordable neighborhood vs premium luxury), USP, and target audience.
5. PRODUCT / SERVICE (AUTHORITATIVE): The selected product/service is authoritative. Ground the scene in its physical reality without hallucinating fake claims, invented prices, fake certifications, or unsupported discounts.
6. ORIGINAL CAMPAIGN TAGLINE: Formulate an original, punchy, commercially viable, and event-aware tagline.
7. CREATIVE CONCEPT: Formulate a genuine advertising idea and title (e.g., "The Gratitude Desk", "Morning Radiance Awakening"), not merely repeating the holiday name.
8. VISUAL STRATEGY: Explain how the event, campaign objective, industry conventions, lighting, and composition visually express the concept.
9. PRODUCTION VISUAL PROMPT: Formulate the complete, high-fidelity visual scene description for image generation.
10. ASPECT RATIO & CANVAS: Adapt composition, spatial depth, and safe areas to the requested aspect ratio format.

SHARED CREATIVE SYSTEM DIRECTIVES:
- MULTI-PRODUCT SPATIAL RELATIONSHIPS: When multiple products are selected, you MUST create a deliberate spatial relationship between them (such as hero + supporting products, staggered depth, diagonal progression, asymmetric grouping, foreground/background, tiered pedestal, nested arrangement, mirrored arrangement, sculptural cluster, or editorial cascade). NEVER place them in a flat side-by-side row. All selected products must remain represented.
- VISUAL WORLD & BACKGROUND DIVERSITY: Intentionally explore and vary visual worlds (clean centered premium studio, full black luxury gradient, dual-tone color-block environment, marble/travertine set, botanical lifestyle, futuristic glass environment, architectural interior, dark cinematic environment, colorful abstract environment, geometric sculptural environment, editorial campaign, surreal/custom visual world, tropical/outdoor scene, vanity/bathroom scene, lifestyle environment). Intentionally vary background treatments (clean white, full black, dark gradient, dual-tone split, pastel color blocking, monochrome, glass, marble, stone, botanical, architectural, cinematic atmospheric, abstract, geometric, natural outdoor). Do NOT repeatedly default to beige/white studio backgrounds.
- EVENT / HOLIDAY VISUAL STORYTELLING: When an event/holiday exists, event visual influence is ALWAYS ACTIVE. The event shapes the scene, environment, props, atmosphere, color, lighting, composition, and visual storytelling around the product. Do not force the event name into visible typography unless event text is explicitly approved.
- TYPOGRAPHIC CREATIVE VARIATION & COPY IMMUTABILITY: Select diverse typographic presentations (copy layout, product-name style, price style, tagline style, text depth, and hierarchy). Creative freedom applies to HOW the copy looks; ZERO freedom applies to WHAT the copy says. Never alter or invent product names, prices, business names, slogans, claims, or discounts.

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
     * Build the dedicated system instructions for Manual Mode "Suggest Visual Prompt" / AI Creative Director.
     *
     * @param  array<string, mixed>  $options
     */
    public function buildManualSystemInstructions(array $options, bool $requiresAiTagline = false): string
    {
        $instructions = <<<'INSTRUCTIONS'
You are MarketPilot's AI Creative Director for Manual Mode Visual Scene Staging.

OBJECTIVE:
Your sole role is to conceive a concise, evocative, natural-language VISUAL SCENE PROMPT (approximately 60–130 words) describing the physical visual world for downstream commercial marketing image generation.

You are directing the VISUAL SCENE ONLY. You are NOT generating a technical production prompt or final layout rules.

CORE MARKETPILOT CONSTRAINTS:
- PRESERVE PRODUCT IDENTITY: The supplied product image and identity are authoritative. Describe environmental staging, lighting, composition, and festive/promotional atmosphere around the product without reconstructing or altering the product itself.
- STRICT LOGO RESTRICTION: Do NOT generate, invent, draw, or add any logo, emblem, brand mark, icon, watermark, cup logo, café emblem, crown, badge, fake certification mark, or social media badge anywhere in the artwork.
- BUSINESS NAME AS TYPOGRAPHY ONLY: If business name is enabled, it is handled downstream as typography only. Never describe it as a logo or inside an invented brand mark.

TARGET VISUAL SCENE OUTPUT FORMAT & VOICE:
- Length: approximately 60–130 words.
- Structure: A single, beautifully crafted natural-language paragraph reading like an inspiring commercial art-director brief.
- Tone: Professional commercial photography / advertising creative direction.
- Focus strictly on: scene world, environment setting, background materials/surfaces, multi-product spatial arrangement, composition, lighting, festive/event props, and overall atmosphere.
- FORBIDDEN IN THE OUTPUT:
  * NO raw prices, currency symbols, or discount percentages (e.g., do NOT say "₱180" or "$50").
  * NO tagline slogans, quotes, or marketing claims (handled downstream).
  * NO business name, shop name, or logo descriptions (handled downstream).
  * NO technical prompt syntax, aspect ratio codes, resolution metrics, quality keywords, or camera lens specs (e.g., do NOT write "1:1", "--ar", "8k", "safe margins").
  * NO taxonomy IDs, JSON, internal system terminology, or validation rules.

CREATIVE PRINCIPLES & DIMENSIONS:

1. TRANSLATE DESIGN TREATMENT INTO CONCRETE VISUAL DECISIONS:
   - MINIMAL: Clean geometry, restrained architectural props, ample negative space, simple matte materials, and uncluttered composition.
   - EDITORIAL: Asymmetry, magazine-like styling, sophisticated surfaces, unusual scale relationships, artful cropping, and elevated spatial hierarchy.
   - BOLD PROMO: Stronger contrast, dynamic color blocking, energetic diagonals, and clear negative space structured for promotional impact.
   - PREMIUM: Refined luxury materials (polished marble, travertine, brass, crystal glass), controlled sculptural highlights, elegant staging, and sophisticated atmosphere.
   - CLASSIC: Balanced, timeless commercial setting, polished pedestal surfaces, harmonious lighting, and restrained visual language.

2. TRANSLATE COPY EMPHASIS INTO SPATIAL COMPOSITION:
   - PRICE-FIRST: Stage the scene to provide clear, high-contrast negative space or a clean foreground surface where price elements can easily live without crowding the product.
   - PRODUCT-FIRST: Give the product dominant central scale and focal authority, keeping environmental elements supportive and subordinate.
   - TAGLINE-FIRST: Provide generous upper or background negative space (e.g. clean architectural wall or open sky/gradient) suitable for a prominent headline.
   - BALANCED: Establish comfortable visual harmony with balanced breathing room around the product and negative space zones.

3. TRANSLATE RENDER STYLE INTO VISUAL LANGUAGE:
   - Studio Product Still: Controlled studio product photography, clean backdrop, flawless reflections, precision commercial lighting.
   - Cinematic Marketing: Dramatic atmospheric depth, volumetric light shafts, directional shadows, cinematic mood.
   - Editorial Campaign: Magazine spread visual language, artful composition, curated styling, contemporary textures.
   - Lifestyle Commercial: Contextual real-world environment, authentic physical setting, lived-in warmth.

4. TRANSLATE VISUAL THEMES AND BRAND TONES:
   - Ground abstract tones into physical materials:
     * Premium/Luxury → marble, travertine, translucent glass, polished stone, velvet, controlled caustics.
     * Modern/Minimalist → smooth concrete, architectural curves, geometric pedestals, clean acrylic.
     * Natural/Organic → untreated timber, river stones, botanical greenery, dewy moss, linen.
     * Bold/Vibrant → saturated color blocking, stark shadows, dynamic backdrops.
     * Warm/Approachable → soft morning sunlight, warm terracotta, blonde wood, cozy ambiance.

5. MULTI-PRODUCT SPATIAL RELATIONSHIPS (CRITICAL):
   - When 2 or more products are selected, NEVER generate a plain side-by-side row (do NOT say "products arranged side by side").
   - Explicitly establish a dynamic spatial relationship between the products:
     * Hero + supporting: One primary hero product elevated on a raised block while secondary products flank or rest on a lower tier.
     * Staggered depth: Primary product in crisp foreground focus with companion items layered behind at differing depths.
     * Diagonal progression: Products arranged along a dynamic diagonal line on stepped pedestals.
     * Tiered pedestals / multi-level blocks: Varied surface heights giving each item distinct vertical clearance.
     * Asymmetric or clustered grouping: Natural, editorial grouping with deliberate spacing and breathing room.

6. EVENT / HOLIDAY AS VISUAL STORYTELLING:
   - The selected event/holiday ALWAYS influences visual storytelling (atmosphere, props, materials, festive styling, lighting).
   - The toggle "Show Event/Holiday Text" controls ONLY whether the event name may appear as visible typography.
   - Even when event text is hidden (show_event_text = false), the event's visual influence, props, and mood MUST remain fully active.
   - Use the linked campaign event/holiday as creative inspiration for atmospheric props, seasonal textures, and mood (e.g., rolled diploma with satin ribbon for Teachers' Day; botanical blossoms for Spring; gift boxes and festive lights for Holidays).
   - NEVER turn the event name into visible headline copy or banner text in the scene description.

7. VISUAL DIVERSITY & ANTI-REPETITION:
   - Each suggestion must feel like a fresh creative exploration.
   - Actively vary combinations of background styles (clean white, full black, dark gradient, dual-tone split, pastel color block, monochrome, translucent architectural, textured stone, botanical, sunlit interior, cinematic dark), compositions, lighting moods, and prop profiles.
   - Review the provided PREVIOUS SUGGESTIONS and intentionally explore an alternative visual direction.

8. RESPECT USER-AUTHORED SEED PROMPTS:
   - If the user provides an explicit creative direction, honour their vision! Refine and elevate their specific scene, materials, and lighting rather than reverting to a generic studio default.

OUTPUT SCHEMA REQUIREMENT:
Return a valid JSON object strictly matching the schema with:
- "creative_concept": Short evocative concept title (3–6 words).
- "visual_strategy": 1–2 sentences summarizing the visual hierarchy, lighting approach, and event integration.
- "visual_prompt": The concise 60–130 word natural-language visual scene prompt.
INSTRUCTIONS;

        if ($requiresAiTagline) {
            $instructions .= "\n- \"tagline\": A concise, punchy marketing tagline (3-8 words) aligned with the business and event context.";
        }

        return $instructions;
    }

    /**
     * Build the context payload for Manual Mode "Suggest Visual Prompt".
     *
     * @param  array<string, mixed>  $options
     * @param  array<int, string>  $previousConcepts
     */
    public function buildManualContextPayload(
        Campaign $campaign,
        ?Business $business,
        array $options,
        array $previousConcepts = []
    ): string {
        $sections = [];

        // 1. Business Profile Context
        if ($business) {
            $bizLines = [
                'BUSINESS CONTEXT:',
                '- Business Name: '.$business->name,
                '- Industry: '.($business->industry ?: 'Commercial'),
                '- Category: '.($business->category ?: 'General'),
            ];
            if (! empty($business->description)) {
                $bizLines[] = '- Business Summary: '.$business->description;
            }
            if (! empty($business->unique_selling_point)) {
                $bizLines[] = '- USP: '.$business->unique_selling_point;
            }
            if (! empty($business->target_audience)) {
                $bizLines[] = '- Target Audience: '.$business->target_audience;
            }
            $sections[] = implode("\n", $bizLines);
        }

        // 2. Campaign Context
        $campaignLines = [
            'CAMPAIGN CONTEXT:',
            '- Campaign Name: '.$campaign->name,
            '- Campaign Objective: '.($campaign->objective ?: 'Product Promotion and Brand Engagement'),
        ];
        if (! empty($campaign->target_audience)) {
            $campaignLines[] = '- Campaign Target Audience: '.$campaign->target_audience;
        }
        $sections[] = implode("\n", $campaignLines);

        // 3. Linked Campaign Event / Holiday (Visual Influence is ALWAYS ACTIVE)
        $event = $options['event'] ?? (! empty($options['event_id']) ? Event::query()->where('id', $options['event_id'])->first() : $campaign->event);
        $eventLines = ['CAMPAIGN EVENT / OCCASION:'];
        if ($event) {
            $showEventText = array_key_exists('show_event_text', $options)
                ? filter_var($options['show_event_text'], FILTER_VALIDATE_BOOLEAN)
                : true;

            $eventLines[] = '- Event Name: '.$event->name;
            if ($event->date) {
                $eventLines[] = '- Event Date: '.$event->date->format('F d, Y');
            }
            if ($event->type) {
                $eventLines[] = '- Event Type: '.$event->type;
            }
            if ($event->long_weekend_details || $event->description) {
                $eventLines[] = '- Event Atmosphere / Visual Context: '.($event->long_weekend_details ?: $event->description);
            }
            $eventLines[] = '• Visual Influence: ALWAYS ACTIVE. The event ALWAYS inspires the visual scene, atmosphere, props, materials, color direction, and festive storytelling around the product.';
            if (! $showEventText) {
                $eventLines[] = '• Show Event Text: FALSE (Event name text is FORBIDDEN). Focus purely on atmospheric visual storytelling and thematic props (e.g. stationery, ribbons, diploma scrolls for Teachers\' Day) without including or describing the event title as visible text.';
            } else {
                $eventLines[] = '• Show Event Text: TRUE (Event name typography is ALLOWED downstream if suitable). Focus scene prompt on visual world and props.';
            }
            $eventLines[] = '• Visual Guidance: Use this occasion for thematic props, subtle festive styling, and celebratory mood. Do NOT use the event name as headline copy.';
        } else {
            $eventLines[] = '- None linked. Focus purely on timeless brand and product aesthetics.';
        }
        $sections[] = implode("\n", $eventLines);

        // 4. Products Context (With Explicit Product Count and Multi-Product Arrangement Guidance)
        $productLines = ['PRODUCTS TO STAGE IN THE SCENE:'];
        $catalogProducts = $options['catalog_products'] ?? [];
        $customProducts = $options['custom_products'] ?? [];

        $totalProductCount = (is_countable($catalogProducts) ? count($catalogProducts) : 0)
            + (is_countable($customProducts) ? count($customProducts) : 0);

        if ($totalProductCount === 0 && ! empty($options['product_name'])) {
            $totalProductCount = 1;
        }

        $productLines[] = "- Total Product Count: {$totalProductCount}";

        if (! empty($catalogProducts)) {
            $productLines[] = '• Selected Catalog Products:';
            foreach ($catalogProducts as $prod) {
                $pName = is_array($prod) ? ($prod['name'] ?? 'Product') : $prod->name;
                $pDesc = is_array($prod) ? ($prod['description'] ?? null) : $prod->description;
                $pPrice = is_array($prod) ? ($prod['price'] ?? null) : $prod->price;

                $line = "  - {$pName}";
                if ($pPrice !== null && $pPrice !== '') {
                    $formattedPrice = is_numeric($pPrice) ? '₱'.number_format((float) $pPrice, 2) : (string) $pPrice;
                    $line .= " (Catalog Price: {$formattedPrice})";
                }
                if (! empty($pDesc)) {
                    $line .= " — {$pDesc}";
                }
                $productLines[] = $line;
            }
        }

        if (! empty($customProducts) && is_array($customProducts)) {
            $productLines[] = '• Custom Products:';
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

        if ($totalProductCount === 0) {
            $productLines[] = '• Featured Product: '.(is_string($options['product_name'] ?? null) ? $options['product_name'] : 'Featured Product');
        }

        if ($totalProductCount > 1) {
            $productLines[] = '• MULTI-PRODUCT DIRECTIVE: You MUST describe a deliberate, tiered, staggered, or asymmetric spatial arrangement for all selected products. NEVER place them in a flat side-by-side row.';
        }

        $sections[] = implode("\n", $productLines);

        // 5. Manual Creative Controls
        $ctrlLines = ['MANUAL CREATIVE CONTROLS:'];
        $ctrlLines[] = '- Design Treatment: '.($options['design_treatment'] ?? 'Classic');
        $ctrlLines[] = '- Copy Emphasis: '.($options['copy_emphasis'] ?? 'Balanced');
        $ctrlLines[] = '- Render Style: '.($options['render_style'] ?? 'Studio Product Still');

        if (! empty($options['visual_theme'])) {
            $themes = is_array($options['visual_theme']) ? implode(', ', $options['visual_theme']) : (string) $options['visual_theme'];
            $ctrlLines[] = '- Visual Theme: '.$themes;
        }
        if (! empty($options['brand_tone'])) {
            $tones = is_array($options['brand_tone']) ? implode(', ', $options['brand_tone']) : (string) $options['brand_tone'];
            $ctrlLines[] = '- Brand Tone: '.$tones;
        }
        $ctrlLines[] = '- Aspect Ratio: '.($options['aspect_ratio'] ?? '1:1');
        $sections[] = implode("\n", $ctrlLines);

        // 6. Marketing Copy Space Awareness (For Negative-Space Staging)
        $copyLines = ['MARKETING COPY SPACE AWARENESS:'];
        $includePrices = array_key_exists('include_prices', $options) ? filter_var($options['include_prices'], FILTER_VALIDATE_BOOLEAN) : true;
        $includeTagline = array_key_exists('include_tagline', $options) ? filter_var($options['include_tagline'], FILTER_VALIDATE_BOOLEAN) : true;
        $includeBiz = array_key_exists('include_business_name', $options) ? filter_var($options['include_business_name'], FILTER_VALIDATE_BOOLEAN) : true;

        $copyLines[] = '- Price Display: '.($includePrices ? 'Enabled (reserve clear negative space for price element)' : 'Disabled');
        $copyLines[] = '- Headline / Tagline Display: '.($includeTagline ? 'Enabled (reserve open space for headline typography)' : 'Disabled');
        $copyLines[] = '- Business Branding: '.($includeBiz ? 'Enabled' : 'Disabled');
        $copyLines[] = '• Rule: Do NOT include literal price numbers or tagline quotes in the scene prompt. Simply ensure the physical composition offers natural breathing room for them.';
        $sections[] = implode("\n", $copyLines);

        // 7. Recent Suggestions & Anti-Repetition
        if (! empty($previousConcepts)) {
            $antiRepLines = [
                'PREVIOUS VISUAL SUGGESTIONS (DO NOT REPEAT):',
                'The user was already shown the following concepts. Formulate a distinctly DIFFERENT visual world, background, lighting, and product staging:',
            ];
            foreach ($previousConcepts as $idx => $concept) {
                $antiRepLines[] = ($idx + 1).'. "'.$concept.'"';
            }
            $sections[] = implode("\n", $antiRepLines);
        }

        // 8. User Seed Creative Instruction
        $userInstruction = trim((string) ($options['user_instruction'] ?? ''));
        $isSeedFromPriorSuggestion = ! empty($userInstruction) && in_array($userInstruction, $previousConcepts, true);

        if (! empty($userInstruction) && ! $isSeedFromPriorSuggestion) {
            $sections[] = "USER EXPLICIT SCENE DIRECTION (AUTHORITATIVE SEED):\n\"{$userInstruction}\"\nRefine, enhance, and creatively expand this exact artistic direction with rich sensory textures, lighting, and composition without replacing it with an unrelated concept.";
        } elseif ($isSeedFromPriorSuggestion) {
            $sections[] = "USER ACTION: Requesting a DIFFERENT visual angle from the previous suggestion (\"{$userInstruction}\").\nConceive a completely fresh visual world, new background style, alternate lighting, and new product arrangement.";
        } else {
            $sections[] = "USER SCENE DIRECTION:\nNone provided. Synthesize an original, high-performing commercial visual scene prompt tailored to the products, event, and creative controls.";
        }

        return implode("\n\n", $sections);
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

        // 2. Campaign Event Context (Visual Influence is ALWAYS ACTIVE)
        $event = $options['event'] ?? (! empty($options['event_id']) ? Event::query()->where('id', $options['event_id'])->first() : $campaign->event);
        $eventLines = ['CAMPAIGN EVENT (VISUAL INFLUENCE IS ALWAYS ACTIVE):'];
        if ($event) {
            $showEventText = array_key_exists('show_event_text', $options)
                ? filter_var($options['show_event_text'], FILTER_VALIDATE_BOOLEAN)
                : true;

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
            if ($event->long_weekend_details || $event->description) {
                $eventLines[] = '- Context / Atmosphere: '.($event->long_weekend_details ?: $event->description);
            }
            $eventLines[] = '• Visual Influence: ALWAYS ACTIVE. The event ALWAYS inspires the visual scene, atmosphere, props, materials, color direction, and festive storytelling around the product.';
            if (! $showEventText) {
                $eventLines[] = '• Show Event Text: FALSE (Event name text is FORBIDDEN). Focus purely on atmospheric visual storytelling and thematic props without including or describing the event title as visible text.';
            } else {
                $eventLines[] = '• Show Event Text: TRUE (Event name typography is ALLOWED downstream if suitable). Focus scene prompt on visual world and props.';
            }
            $eventLines[] = '• Visual Guidance: Use this occasion for thematic props, subtle festive styling, and celebratory mood. Do NOT invent event slogans.';
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

        $totalProductCount = (is_countable($catalogProducts) ? count($catalogProducts) : 0)
            + (is_countable($customProducts) ? count($customProducts) : 0);

        if ($totalProductCount === 0 && ! empty($options['product_name'])) {
            $totalProductCount = 1;
        }

        if ($totalProductCount > 1) {
            $productLines[] = '• MULTI-PRODUCT DIRECTIVE: Multiple products are selected. You MUST establish a deliberate spatial relationship between them (such as hero + supporting products, staggered depth, diagonal progression, asymmetric grouping, foreground/background, tiered pedestal, nested arrangement, mirrored arrangement, sculptural cluster, or editorial cascade). NEVER place them in a flat side-by-side row. All selected products must remain represented.';
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
        if (array_key_exists('include_tagline', $options)) {
            $requiresAiTagline = filter_var($options['include_tagline'], FILTER_VALIDATE_BOOLEAN);
        } elseif (array_key_exists('require_tagline', $options)) {
            $requiresAiTagline = filter_var($options['require_tagline'], FILTER_VALIDATE_BOOLEAN);
        } else {
            $requiresAiTagline = $isAutomatic;
        }

        if (! empty($options['tagline'])) {
            $creativeLines[] = '- Tagline Copy: "'.$options['tagline'].'"';
        }
        if ($requiresAiTagline) {
            $creativeLines[] = '- Tagline Directive: AUTONOMOUS GENERATION (Formulate an original, commercially grounded, event-aware campaign tagline for this generation'.(! empty($options['tagline']) ? ' harmonizing with or elevating the seed copy' : '').')';
        } else {
            $creativeLines[] = '- Tagline Directive: DISABLED (Do NOT formulate, suggest, or include any tagline, headline, slogan, or visible promotional copy in this visual)';
        }

        $includePrices = array_key_exists('include_prices', $options)
            ? filter_var($options['include_prices'], FILTER_VALIDATE_BOOLEAN)
            : true;
        if ($includePrices) {
            $creativeLines[] = '- Marketing Price Display: ENABLED (Authoritative product prices may appear as visible commercial typography)';
        } else {
            $creativeLines[] = '- Marketing Price Display: DISABLED (Do not render product/service prices as visible text. Exclude visible price typography from the visual)';
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

        // 7b. Anti-Repetition Combination Guidance (Part 6)
        if (! empty($options['recent_fingerprints']) && is_array($options['recent_fingerprints'])) {
            $sections[] = $this->designSystem->formatAntiRepetitionGuidance($options['recent_fingerprints']);
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
            'design_treatment' => isset($decoded['design_treatment']) && is_string($decoded['design_treatment']) ? trim($decoded['design_treatment']) : null,
            'copy_emphasis' => isset($decoded['copy_emphasis']) && is_string($decoded['copy_emphasis']) ? trim($decoded['copy_emphasis']) : null,
            'typography_layout' => isset($decoded['typography_layout']) && is_string($decoded['typography_layout']) ? trim($decoded['typography_layout']) : null,
            'copy_layout' => isset($decoded['copy_layout']) && is_string($decoded['copy_layout']) ? trim($decoded['copy_layout']) : (isset($decoded['typography_layout']) && is_string($decoded['typography_layout']) ? trim($decoded['typography_layout']) : null),
            'product_name_style' => isset($decoded['product_name_style']) && is_string($decoded['product_name_style']) ? trim($decoded['product_name_style']) : null,
            'price_style' => isset($decoded['price_style']) && is_string($decoded['price_style']) ? trim($decoded['price_style']) : null,
            'tagline_style' => isset($decoded['tagline_style']) && is_string($decoded['tagline_style']) ? trim($decoded['tagline_style']) : null,
            'text_depth_mode' => isset($decoded['text_depth_mode']) && is_string($decoded['text_depth_mode']) ? trim($decoded['text_depth_mode']) : null,
            'composition_type' => isset($decoded['composition_type']) && is_string($decoded['composition_type']) ? trim($decoded['composition_type']) : null,
            'camera_viewpoint' => isset($decoded['camera_viewpoint']) && is_string($decoded['camera_viewpoint']) ? trim($decoded['camera_viewpoint']) : null,
            'lighting_profile' => isset($decoded['lighting_profile']) && is_string($decoded['lighting_profile']) ? trim($decoded['lighting_profile']) : null,
            'scene_family' => isset($decoded['scene_family']) && is_string($decoded['scene_family']) ? trim($decoded['scene_family']) : null,
            'environment_family' => isset($decoded['environment_family']) && is_string($decoded['environment_family']) ? trim($decoded['environment_family']) : null,
            'prop_profile' => isset($decoded['prop_profile']) && is_string($decoded['prop_profile']) ? trim($decoded['prop_profile']) : null,
            'render_style' => isset($decoded['render_style']) && is_string($decoded['render_style']) ? trim($decoded['render_style']) : null,
            'visual_world_archetype' => isset($decoded['visual_world_archetype']) && is_string($decoded['visual_world_archetype']) ? trim($decoded['visual_world_archetype']) : null,
            'background_style' => isset($decoded['background_style']) && is_string($decoded['background_style']) ? trim($decoded['background_style']) : null,
            'product_arrangement' => isset($decoded['product_arrangement']) && is_string($decoded['product_arrangement']) ? trim($decoded['product_arrangement']) : null,
            'visual_theme' => isset($decoded['visual_theme']) && is_string($decoded['visual_theme']) ? trim($decoded['visual_theme']) : null,
            'brand_tone' => isset($decoded['brand_tone']) && is_string($decoded['brand_tone']) ? trim($decoded['brand_tone']) : null,
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
