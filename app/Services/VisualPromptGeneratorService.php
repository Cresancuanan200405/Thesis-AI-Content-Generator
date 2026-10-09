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
        protected ?ReferenceImageAnalyzer $referenceAnalyzer = null,
    ) {
        $this->artDirectionService = $artDirectionService ?? app(IndustryCategoryArtDirectionService::class);
        $this->designSystem = $designSystem ?? app(MarketingDesignSystem::class);
        $this->referenceAnalyzer = $referenceAnalyzer ?? app(ReferenceImageAnalyzer::class);
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
                        'description' => 'A concise (40–90 words) commercial creative visual concept describing the setting, atmosphere, mood, and visual world around the product. Connects Campaign, Event, Product, and product visual identity without camera/lens instructions, lighting recipes, exact composition, text zones, or invented product features.',
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
                        'description' => 'A concise (40–90 words) commercial creative visual concept describing the setting, atmosphere, mood, and visual world around the product. Connects Campaign, Event, Product, and product visual identity without camera/lens instructions, lighting recipes, exact composition, text zones, or invented product features.',
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
            $visionBlueprint = $options['vision_blueprint'] ?? null;
            if (! $visionBlueprint && $this->referenceAnalyzer) {
                $imagePathToAnalyze = $options['reference_image_path'] ?? null;
                if (! $imagePathToAnalyze && ! empty($options['catalog_products'])) {
                    foreach ($options['catalog_products'] as $p) {
                        $imgPath = is_array($p) ? ($p['image_path'] ?? null) : ($p->image_path ?? null);
                        if (! empty($imgPath)) {
                            $imagePathToAnalyze = $imgPath;
                            break;
                        }
                    }
                }
                if (! $imagePathToAnalyze && ! empty($options['product']) && is_object($options['product'])) {
                    $imagePathToAnalyze = $options['product']->image_path ?? null;
                }
                if ($imagePathToAnalyze) {
                    $visionBlueprint = $this->referenceAnalyzer->analyze($imagePathToAnalyze);
                }
            }

            $systemInstructions = $this->buildManualSystemInstructions($options, $requiresAiTagline);
            $userContext = $this->buildManualContextPayload($campaign, $business, $options, $previousConcepts, $visionBlueprint);

            $schemaProperties = [
                'creative_concept' => [
                    'type' => 'string',
                    'description' => 'A clear, evocative title of the core creative idea (3–6 words).',
                ],
                'visual_strategy' => [
                    'type' => 'string',
                    'description' => 'Concise 1-sentence summary of the visual atmosphere and mood.',
                ],
                'visual_prompt' => [
                    'type' => 'string',
                    'description' => 'A concise (40–90 words) creative visual concept describing the setting, atmosphere, mood, and visual environment. Does not include headlines, slogans, claims, prices, typography instructions, badges, or exact layout coordinates.',
                ],
                'render_style' => [
                    'type' => 'string',
                    'enum' => MarketingDesignSystem::RENDER_STYLES,
                    'description' => 'The selected or complementary canonical commercial render style for this visual scene: Studio Product Still, Cinematic Marketing, Lifestyle Capture, or Minimalist Graphic.',
                ],
            ];
            $requiredFields = ['creative_concept', 'visual_strategy', 'visual_prompt', 'render_style'];

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
        $selectedRenderStyle = ! empty($options['render_style']) ? $this->designSystem->validateRenderStyle($options['render_style']) : null;
        $renderStyle = $selectedRenderStyle ?? $this->designSystem->validateRenderStyle($result['render_style'] ?? null);
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
8. PRODUCTION VISUAL PROMPT: Formulate a concise creative visual concept (40–90 words) describing the visual world, atmosphere, and setting around the product without technical art-direction recipes (no camera/lens recipes, no text zones, no exact coordinates).
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
3. "visual_prompt": A concise (40–90 words) creative visual concept describing the setting, atmosphere, and visual world around the product.
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
9. PRODUCTION VISUAL PROMPT: Formulate a concise creative visual concept (40–90 words) describing the visual world, atmosphere, and setting around the product without technical art-direction recipes (no camera/lens recipes, no text zones, no exact coordinates).
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
4. "visual_prompt": A concise (40–90 words) creative visual concept describing the setting, atmosphere, and visual world around the product.
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
    public function buildManualSystemInstructions(array $options = [], bool $requiresAiTagline = false): string
    {
        $instructions = <<<'INSTRUCTIONS'
You are a visual concept assistant for a marketing image generator. Your role is to generate a concise creative visual concept (approximately 40–90 words) that connects:
1. Campaign
2. Campaign Event / Holiday / Occasion (when present)
3. Selected Product Name
4. Actual Selected Product Image (observed visual identity)
5. Optional User Creative Direction (if supplied)

Core question to answer: "What kind of visual world should this campaign create around the supplied product?"

Create a concise visual concept from the supplied business, product, campaign, event, render style, and user direction. Describe the atmosphere, setting, and overall visual idea. Treat the user's direction as a concept, not a rigid layout. Do not write headlines, slogans, product claims, feature copy, prices, product names, event text, typography instructions, camera specifications, or exact layout instructions. Do not invent marketing claims or promotional elements. Give the image model creative freedom to execute the strongest composition. Keep the result concise.

CORE RULES:
• Meaningful Campaign & Event Connection: The visual concept MUST be meaningfully related to the campaign and, when present, its event. Do NOT produce generic visual concepts that could apply to any campaign. The campaign and event must influence the atmosphere, creative context, mood, or visual character.
• Event Visibility Semantics: The toggle "Show Event/Holiday Text" controls typography. When Event visibility is Hidden, do NOT display the event name or slogans as visible text; let the event influence only the visual atmosphere and festive mood. When Event visibility is Allowed, event typography is permitted downstream. NEVER turn the event name into visible headline copy or promotional artwork.
• Product Image Fidelity & Anti-Hallucination: The actual product image is the primary visual reference; the product name is semantic/contextual information. You may analyze the supplied product image to understand its visible visual identity, but you must NEVER invent physical product characteristics that are not supported by the image or factual product data. Do NOT invent containers, cups, bottles, packaging, steam, ingredients, materials, shapes, props, or product accessories unless they are clearly visible in the supplied product image or explicitly requested by the user.
• Creative Direction: If the user supplied a creative direction, preserve their core idea faithfully. Do not replace it and do not expand it into technical art direction.
• Composition: Do NOT generate exact layout instructions, text zones, pricing zones, headline areas, negative-space instructions, left/right/top/bottom coordinates, exact product positioning, split backgrounds, camera angles, lenses, apertures, photography recipes, or typography systems.
• Render Style Compatibility: The visual concept must naturally complement the user's selected Render Style rather than working against it. If "Minimalist Graphic", formulate a visual concept suited for graphic design, clean modern surfaces, high-contrast focal points, and uncluttered aesthetics rather than photographic clutter. If "Studio Product Still", focus on clean studio staging, product hero isolation, refined commercial lighting, and elegant surfaces. If "Cinematic Marketing", evoke dramatic narrative lighting, rich depth, and cinematic atmosphere. If "Lifestyle Capture", describe an authentic real-world setting, natural environment, and relatable lifestyle mood. Preserve creative freedom without prescribing rigid layouts, camera focal lengths, or typography arrangements.
• Marketing Copy: Do NOT invent marketing claims, promotional slogans, feature badges, icons, or additional copy.
• Output Size: Approximately 40–90 words.
INSTRUCTIONS;

        if ($requiresAiTagline) {
            $instructions .= "\n- \"tagline\": A concise, punchy marketing tagline (3-8 words) aligned with the business and event context. Do not invent fake claims or discounts.";
        }

        return $instructions;
    }

    /**
     * Build the context payload for Manual Mode "Suggest Visual Prompt".
     *
     * @param  array<string, mixed>  $options
     * @param  array<int, string>  $previousConcepts
     * @param  array<string, mixed>|null  $visionBlueprint
     */
    public function buildManualContextPayload(
        Campaign $campaign,
        ?Business $business,
        array $options,
        array $previousConcepts = [],
        ?array $visionBlueprint = null
    ): string {
        $sections = [];

        // 1. Business
        if ($business) {
            $bizLines = [
                'BUSINESS:',
                '- Name: '.$business->name,
                '- Industry & Category: '.($business->industry ?: 'General').' / '.($business->category ?: 'General'),
            ];
            if (! empty($business->description)) {
                $bizLines[] = '- Character: '.trim($business->description);
            }
            $sections[] = implode("\n", $bizLines);
        }

        // 2. Campaign
        $campaignLines = [
            'CAMPAIGN:',
            '- Name: '.$campaign->name,
        ];
        if (! empty($campaign->objective)) {
            $campaignLines[] = '- Objective: '.$campaign->objective;
        }
        $sections[] = implode("\n", $campaignLines);

        // 3. Event / Holiday Context (Contextual Inspiration Only)
        $event = $options['event'] ?? (! empty($options['event_id']) ? Event::query()->where('id', $options['event_id'])->first() : $campaign->event);
        if ($event) {
            $showEventText = array_key_exists('show_event_text', $options)
                ? filter_var($options['show_event_text'], FILTER_VALIDATE_BOOLEAN)
                : true;

            $eventLines = [
                'EVENT / OCCASION:',
                "- Name: {$event->name}",
            ];
            if ($event->description || $event->long_weekend_details) {
                $eventLines[] = '- Context: '.($event->description ?: $event->long_weekend_details);
            }
            $eventLines[] = '• Visual Influence: ALWAYS ACTIVE. Use for subtle atmospheric mood and festive energy only.';
            if (! $showEventText) {
                $eventLines[] = '• Show Event Text: FALSE (Event name text is FORBIDDEN). Focus purely on atmospheric visual storytelling without visible event text, badges, shopping bags, or banners.';
            } else {
                $eventLines[] = '• Show Event Text: TRUE (Event name typography is ALLOWED downstream if suitable). Do not invent slogans.';
            }
            $eventLines[] = '• Guidance: Do NOT use the event name as headline copy.';
            $sections[] = implode("\n", $eventLines);
        } else {
            $sections[] = "EVENT / OCCASION:\n- Name: None\n• Event visibility: Hidden";
        }

        // 4. Products & Product Image
        $catalogProducts = $options['catalog_products'] ?? [];
        $customProducts = $options['custom_products'] ?? [];
        $productLines = ['PRODUCTS:'];
        $hasImageReference = false;

        if (! empty($catalogProducts)) {
            foreach ($catalogProducts as $prod) {
                $pName = is_array($prod) ? ($prod['name'] ?? 'Product') : $prod->name;
                $pDesc = is_array($prod) ? ($prod['description'] ?? null) : $prod->description;
                $imgPath = is_array($prod) ? ($prod['image_path'] ?? null) : ($prod->image_path ?? null);

                $line = "- {$pName}";
                if (! empty($pDesc)) {
                    $line .= " ({$pDesc})";
                }
                $productLines[] = $line;

                if (! empty($imgPath)) {
                    $hasImageReference = true;
                    $productLines[] = "  • Product Image: Attached reference image ({$imgPath})";
                }
            }
        }
        if (! empty($customProducts) && is_array($customProducts)) {
            foreach ($customProducts as $cProd) {
                if (! empty($cProd['name'])) {
                    $productLines[] = "- {$cProd['name']}";
                }
            }
        }
        if (count($productLines) === 1) {
            $singleProd = is_string($options['product_name'] ?? null) ? $options['product_name'] : 'Featured Product';
            $productLines[] = "- {$singleProd}";
        }

        if (! empty($visionBlueprint['product_identity']) || ! empty($visionBlueprint['product_physical_details'])) {
            $observed = trim(($visionBlueprint['product_identity'] ?? '').' '.($visionBlueprint['product_physical_details'] ?? ''));
            $productLines[] = "• Observed Visual Identity from Product Image:\n  \"{$observed}\"";
            $productLines[] = '• Product Image Rule: The supplied product image is the primary visual reference. Only depict physical characteristics visible in the image or factual product data. Do NOT invent containers, cups, bottles, packaging, steam, ingredients, materials, shapes, props, or accessories not present in the image or explicitly requested by the user.';
        } elseif ($hasImageReference) {
            $productLines[] = '• Product Image Rule: An authoritative product image is attached. Use the image as the primary visual source of truth. Do NOT invent physical containers, packaging, or accessories not supported by the product image.';
        } else {
            $productLines[] = '• Product Fidelity Rule: Only depict physical characteristics supported by the factual product data. Do NOT invent unsupported containers, cups, bottles, packaging, steam, or accessories.';
        }

        $sections[] = implode("\n", $productLines);

        // 5. Render Style
        $renderStyle = $options['render_style'] ?? 'Studio Product Still';
        $sections[] = "SELECTED RENDER STYLE:\n- {$renderStyle}\n• Style Guidance: Formulate a visual concept that naturally complements \"{$renderStyle}\" without prescribing camera specifications or rigid graphic layouts.";

        // 6. User Creative Direction
        $userInstruction = trim((string) ($options['user_instruction'] ?? ''));
        $isSeedFromPriorSuggestion = ! empty($userInstruction) && in_array($userInstruction, $previousConcepts, true);

        if (! empty($userInstruction) && ! $isSeedFromPriorSuggestion) {
            $sections[] = "USER CREATIVE DIRECTION (AUTHORITATIVE CONCEPT):\n\"{$userInstruction}\"\nPreserve this core visual idea and translate it into a concise visual concept (40–90 words). Do not turn it into an elaborate poster layout, promotional graphic, or badge design.";
        } elseif ($isSeedFromPriorSuggestion) {
            $sections[] = "USER ACTION: Requesting an ALTERNATIVE visual direction from the prior suggestion (\"{$userInstruction}\").\nConceive a fresh, distinct visual setting and mood.";
        } else {
            $sections[] = "USER CREATIVE DIRECTION:\nNone provided. Conceive a concise, tasteful visual concept (40–90 words) tailored to the product and setting.";
        }

        // 7. Anti-Repetition (if previous suggestions provided)
        if (! empty($previousConcepts)) {
            $antiRepLines = [
                'PREVIOUS VISUAL SUGGESTIONS (DO NOT REPEAT):',
                'Formulate a distinctly DIFFERENT visual world and setting from:',
            ];
            foreach ($previousConcepts as $idx => $concept) {
                $antiRepLines[] = ($idx + 1).'. "'.$concept.'"';
            }
            $sections[] = implode("\n", $antiRepLines);
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

        $includeProductName = array_key_exists('include_product_name', $options)
            ? filter_var($options['include_product_name'], FILTER_VALIDATE_BOOLEAN)
            : true;
        if ($includeProductName) {
            $creativeLines[] = '- Product Name Display: ENABLED (Authoritative product name may appear as visible typography)';
        } else {
            $creativeLines[] = '- Product Name Display: DISABLED (Do not render product name as visible text typography. Hero physical product must remain visually present)';
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
            } elseif (isset($decoded['suggested_scene']) && is_string($decoded['suggested_scene'])) {
                $prompt = trim($decoded['suggested_scene']);
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
