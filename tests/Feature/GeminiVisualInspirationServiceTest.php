<?php

use App\Services\GeminiVisualInspirationService;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config()->set('services.gemini.api_key', 'test-fake-key-for-testing-only');
    config()->set('services.gemini.model', 'gemini-3.1-pro-preview');
    config()->set('services.gemini.fallback_model', 'gemini-3.6-flash');
});

it('fails file validation when file does not exist', function () {
    $service = new GeminiVisualInspirationService;

    expect(fn () => $service->validateFile('/non/existent/image.jpg'))
        ->toThrow(InvalidArgumentException::class, 'Reference image file does not exist');
});

it('fails file validation when MIME type is not allowed', function () {
    $tempFile = tempnam(sys_get_temp_dir(), 'test_gemini_');
    file_put_contents($tempFile, 'Plain text content that is not an image');

    $service = new GeminiVisualInspirationService;

    try {
        expect(fn () => $service->validateFile($tempFile))
            ->toThrow(InvalidArgumentException::class, 'Unsupported image format');
    } finally {
        @unlink($tempFile);
    }
});

it('fails file validation when file exceeds 10 MB', function () {
    $tempFile = tempnam(sys_get_temp_dir(), 'test_gemini_');
    // Simulate oversized file by writing dummy data larger than 10MB or mock size check
    $service = new class extends GeminiVisualInspirationService
    {
        public function validateFile(string $filePath): void
        {
            if (! file_exists($filePath)) {
                throw new InvalidArgumentException("Reference image file does not exist: {$filePath}");
            }
            $size = self::MAX_FILE_SIZE_BYTES + 1024;
            if ($size > self::MAX_FILE_SIZE_BYTES) {
                throw new InvalidArgumentException("Reference image exceeds maximum allowed size of 10 MB (size: {$size} bytes).");
            }
        }
    };

    file_put_contents($tempFile, 'small content');

    try {
        expect(fn () => $service->validateFile($tempFile))
            ->toThrow(InvalidArgumentException::class, 'exceeds maximum allowed size of 10 MB');
    } finally {
        @unlink($tempFile);
    }
});

it('enforces product agnosticism and catalog product authority in the Gemini analysis prompt', function () {
    $service = new GeminiVisualInspirationService;
    $prompt = $service->getAnalysisSystemPrompt();

    expect($prompt)
        ->toContain('PRODUCT AGNOSTICISM')
        ->toContain('The eventual image generator must use the selected MarketPilot catalog product image as the sole source of product identity and appearance')
        ->toContain('NEVER name or describe the reference product or its category')
        ->toContain('GENERIC PROPS ONLY')
        ->toContain('REUSABLE STYLE DIRECTIVE REQUIREMENTS')
        ->toContain('70–120 words')
        ->toContain('Layout geometry & spatial relationships')
        ->toContain('Typography character & hierarchy')
        ->toContain('Graphic elements & textures')
        ->toContain('Studio Product Still')
        ->toContain('Balanced');
});

it('successfully parses and validates a well-formed Gemini vision response with product-agnostic visual style prompt', function () {
    $tempImage = tempnam(sys_get_temp_dir(), 'test_img_').'.png';
    // Create a 1x1 valid PNG image
    $pngBinary = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    file_put_contents($tempImage, $pngBinary);

    $geminiResponsePayload = [
        'candidates' => [
            [
                'content' => [
                    'parts' => [
                        [
                            'text' => json_encode([
                                'visual_analysis' => [
                                    'composition_and_framing' => 'Top-down flat lay with a diagonal split canvas between deep green and cream. Off-center hero placement with negative space.',
                                    'color_palette' => 'Deep forest green, warm beige cream, dark roasted espresso tone, and metallic gold accents.',
                                    'lighting_and_shadows' => 'Soft directional top-right lighting casting delicate leaf gobo shadows and subtle contact shadows.',
                                    'typography_character_and_hierarchy' => 'Bold condensed sans-serif primary headline layered vertically with tracked-out secondary subtext.',
                                    'mood_and_visual_direction' => 'Upscale, cozy, artisanal cafe atmosphere combining graphic layout with organic warmth.',
                                    'reusable_visual_style_prompt' => 'Top-down overhead composition on a dual-tone split matte backdrop with soft dappled leaf shadows, warm directional rim light, and clean negative space for hero product placement.',
                                ],
                                'marketpilot_recommendations' => [
                                    'render_style' => 'Studio Product Still',
                                    'copy_emphasis' => 'Product',
                                    'visibility_suggestions' => [
                                        'product_name' => true,
                                        'price' => false,
                                        'tagline' => true,
                                        'business_name' => true,
                                        'event_text' => false,
                                    ],
                                    'confidence_notes' => 'High certainty on color palette, lighting style, and framing. Price is absent from the reference design.',
                                ],
                            ]),
                        ],
                    ],
                ],
            ],
        ],
    ];

    Http::fake([
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent' => Http::response($geminiResponsePayload, 200),
    ]);

    $service = new GeminiVisualInspirationService;

    try {
        $result = $service->analyze($tempImage);

        expect($result['success'])->toBeTrue()
            ->and($result['model_used'])->toBe('gemini-3.1-pro-preview')
            ->and($result['marketpilot_recommendations']['render_style'])->toBe('Studio Product Still')
            ->and($result['marketpilot_recommendations']['copy_emphasis'])->toBe('Product')
            ->and($result['marketpilot_recommendations']['visibility_suggestions']['price'])->toBeFalse()
            ->and($result['visual_analysis']['reusable_visual_style_prompt'])->toContain('Top-down overhead composition')
            ->and($result['visual_analysis']['reusable_visual_style_prompt'])->not->toContain('coffee')
            ->and($result['visual_analysis']['reusable_visual_style_prompt'])->not->toContain('beverage')
            ->and($result['visual_analysis']['reusable_visual_style_prompt'])->not->toContain('saucer')
            ->and($result['visual_analysis']['reusable_visual_style_prompt'])->not->toContain('beans');
    } finally {
        @unlink($tempImage);
    }
});

it('falls back to default enums when model returns unrecognized settings', function () {
    $tempImage = tempnam(sys_get_temp_dir(), 'test_img_').'.png';
    $pngBinary = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    file_put_contents($tempImage, $pngBinary);

    $geminiResponsePayload = [
        'candidates' => [
            [
                'content' => [
                    'parts' => [
                        [
                            'text' => json_encode([
                                'visual_analysis' => [
                                    'composition_and_framing' => 'Unknown framing',
                                ],
                                'marketpilot_recommendations' => [
                                    'render_style' => 'Unrecognized Experimental Style',
                                    'copy_emphasis' => 'CrazyEmphasisType',
                                    'visibility_suggestions' => [],
                                ],
                            ]),
                        ],
                    ],
                ],
            ],
        ],
    ];

    Http::fake([
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent' => Http::response($geminiResponsePayload, 200),
    ]);

    $service = new GeminiVisualInspirationService;

    try {
        $result = $service->analyze($tempImage);

        expect($result['success'])->toBeTrue()
            ->and($result['marketpilot_recommendations']['render_style'])->toBe('Studio Product Still')
            ->and($result['marketpilot_recommendations']['copy_emphasis'])->toBe('Balanced')
            ->and($result['marketpilot_recommendations']['visibility_suggestions']['product_name'])->toBeTrue()
            ->and($result['marketpilot_recommendations']['visibility_suggestions']['event_text'])->toBeFalse();
    } finally {
        @unlink($tempImage);
    }
});

it('handles malformed JSON from Gemini candidates gracefully', function () {
    $tempImage = tempnam(sys_get_temp_dir(), 'test_img_').'.png';
    $pngBinary = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    file_put_contents($tempImage, $pngBinary);

    $geminiResponsePayload = [
        'candidates' => [
            [
                'content' => [
                    'parts' => [
                        [
                            'text' => 'Not valid JSON at all: Error 500 occurred in generation pipeline { broken',
                        ],
                    ],
                ],
            ],
        ],
    ];

    Http::fake([
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent' => Http::response($geminiResponsePayload, 200),
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent' => Http::response($geminiResponsePayload, 200),
    ]);

    $service = new GeminiVisualInspirationService;

    try {
        $result = $service->analyze($tempImage);

        expect($result['success'])->toBeFalse()
            ->and($result['error'])->toContain('Failed to decode Gemini response into JSON structure');
    } finally {
        @unlink($tempImage);
    }
});

it('does not retry client or authentication errors (401 / 400)', function () {
    $tempImage = tempnam(sys_get_temp_dir(), 'test_img_').'.png';
    $pngBinary = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    file_put_contents($tempImage, $pngBinary);

    Http::fake([
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent' => Http::response([
            'error' => ['message' => 'API_KEY_INVALID'],
        ], 401),
    ]);

    $service = new GeminiVisualInspirationService;

    try {
        $result = $service->analyze($tempImage);

        expect($result['success'])->toBeFalse()
            ->and($result['error'])->toContain('HTTP 401')
            ->and($result['error'])->toContain('API_KEY_INVALID');

        // Confirm fallback was NOT called on 401
        Http::assertSentCount(1);
    } finally {
        @unlink($tempImage);
    }
});

it('retries with fallback model on transient 429 or 503 errors', function () {
    $tempImage = tempnam(sys_get_temp_dir(), 'test_img_').'.png';
    $pngBinary = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    file_put_contents($tempImage, $pngBinary);

    $fallbackSuccessPayload = [
        'candidates' => [
            [
                'content' => [
                    'parts' => [
                        [
                            'text' => json_encode([
                                'visual_analysis' => [
                                    'composition_and_framing' => 'Fallback framing',
                                    'color_palette' => 'Fallback palette',
                                    'lighting_and_shadows' => 'Fallback lighting',
                                    'typography_character_and_hierarchy' => 'Fallback hierarchy',
                                    'mood_and_visual_direction' => 'Fallback mood',
                                    'reusable_visual_style_prompt' => 'Fallback style prompt',
                                ],
                                'marketpilot_recommendations' => [
                                    'render_style' => 'Lifestyle Capture',
                                    'copy_emphasis' => 'Balanced',
                                    'visibility_suggestions' => [
                                        'product_name' => true,
                                        'price' => true,
                                        'tagline' => true,
                                        'business_name' => true,
                                        'event_text' => false,
                                    ],
                                    'confidence_notes' => 'Fallback model processed successfully.',
                                ],
                            ]),
                        ],
                    ],
                ],
            ],
        ],
    ];

    Http::fake([
        // Primary returns 429
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent' => Http::response([
            'error' => ['message' => 'Resource has been exhausted (e.g. check quota).'],
        ], 429),
        // Fallback returns 200
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent' => Http::response($fallbackSuccessPayload, 200),
    ]);

    $service = new GeminiVisualInspirationService;

    try {
        $result = $service->analyze($tempImage);

        expect($result['success'])->toBeTrue()
            ->and($result['model_used'])->toBe('gemini-3.6-flash')
            ->and($result['marketpilot_recommendations']['render_style'])->toBe('Lifestyle Capture');

        // Confirm both primary and fallback were called
        Http::assertSentCount(2);
    } finally {
        @unlink($tempImage);
    }
});

it('executes the marketpilot:test-gemini-vision command successfully with mocked HTTP', function () {
    $tempImage = tempnam(sys_get_temp_dir(), 'test_cmd_').'.png';
    $pngBinary = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    file_put_contents($tempImage, $pngBinary);

    $geminiResponsePayload = [
        'candidates' => [
            [
                'content' => [
                    'parts' => [
                        [
                            'text' => json_encode([
                                'visual_analysis' => [
                                    'composition_and_framing' => 'Test framing',
                                    'color_palette' => 'Test palette',
                                    'lighting_and_shadows' => 'Test shadows',
                                    'typography_character_and_hierarchy' => 'Test typography',
                                    'mood_and_visual_direction' => 'Test mood',
                                    'reusable_visual_style_prompt' => 'Test reusable prompt directive',
                                ],
                                'marketpilot_recommendations' => [
                                    'render_style' => 'Minimalist Graphic',
                                    'copy_emphasis' => 'Tagline',
                                    'visibility_suggestions' => [
                                        'product_name' => true,
                                        'price' => true,
                                        'tagline' => true,
                                        'business_name' => true,
                                        'event_text' => false,
                                    ],
                                    'confidence_notes' => 'CLI mock verified.',
                                ],
                            ]),
                        ],
                    ],
                ],
            ],
        ],
    ];

    Http::fake([
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent' => Http::response($geminiResponsePayload, 200),
    ]);

    try {
        $this->artisan('marketpilot:test-gemini-vision', ['path' => $tempImage])
            ->expectsOutputToContain('MarketPilot — Isolated Gemini Visual Inspiration Test Harness')
            ->expectsOutputToContain('Analysis Succeeded using [gemini-3.1-pro-preview]')
            ->expectsOutputToContain('Minimalist Graphic')
            ->expectsOutputToContain('Tagline')
            ->assertExitCode(0);
    } finally {
        @unlink($tempImage);
    }
});

it('attempts fallback model when primary encounters 429 and reports both models with their HTTP statuses', function () {
    $tempImage = tempnam(sys_get_temp_dir(), 'test_img_').'.png';
    $pngBinary = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    file_put_contents($tempImage, $pngBinary);

    Http::fake([
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent' => Http::response([
            'error' => ['message' => 'Resource has been exhausted (rate limit / quota).'],
        ], 429),
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent' => Http::response([
            'error' => ['message' => 'This model is currently experiencing high demand.'],
        ], 503),
    ]);

    $service = new GeminiVisualInspirationService(retryAttemptsOn503: 2, retryDelayMsOn503: 0);

    try {
        $result = $service->analyze($tempImage);

        expect($result['success'])->toBeFalse()
            ->and($result['error'])->toContain('All Gemini vision attempts failed')
            ->and($result['error'])->toContain('primary model (gemini-3.1-pro-preview) -> HTTP 429')
            ->and($result['error'])->toContain('fallback model (gemini-3.6-flash) -> HTTP 503')
            ->and($result['error'])->not->toContain('test-fake-key-for-testing-only');

        // 1 call for primary (429 is not retried) + 2 calls for fallback (initial 503 + 1 bounded retry)
        Http::assertSentCount(3);
    } finally {
        @unlink($tempImage);
    }
});

it('retries a 503 response up to the configured bounded retry count', function () {
    $tempImage = tempnam(sys_get_temp_dir(), 'test_img_').'.png';
    $pngBinary = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    file_put_contents($tempImage, $pngBinary);

    Http::fake([
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent' => Http::response([
            'error' => ['message' => 'This model is currently experiencing high demand.'],
        ], 503),
    ]);

    $service = new GeminiVisualInspirationService(retryAttemptsOn503: 2, retryDelayMsOn503: 0);

    try {
        $result = $service->analyze($tempImage, forceFallback: true);

        expect($result['success'])->toBeFalse()
            ->and($result['error'])->toContain('All Gemini vision attempts failed')
            ->and($result['error'])->toContain('fallback model (gemini-3.6-flash) -> HTTP 503: This model is currently experiencing high demand');

        // Confirms exactly 2 bounded attempts occurred (1 initial + 1 retry)
        Http::assertSentCount(2);
    } finally {
        @unlink($tempImage);
    }
});

it('successfully parses response when a 503 response is followed by a successful retry', function () {
    $tempImage = tempnam(sys_get_temp_dir(), 'test_img_').'.png';
    $pngBinary = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    file_put_contents($tempImage, $pngBinary);

    $successPayload = [
        'candidates' => [
            [
                'content' => [
                    'parts' => [
                        [
                            'text' => json_encode([
                                'visual_analysis' => [
                                    'composition_and_framing' => 'Centered hero product composition',
                                    'color_palette' => 'Warm amber and cream tones',
                                    'lighting_and_shadows' => 'Soft rim lighting with subtle fill',
                                    'typography_character_and_hierarchy' => 'Bold modern sans headline',
                                    'mood_and_visual_direction' => 'Sophisticated commercial warmth',
                                    'reusable_visual_style_prompt' => 'Centered product still life with warm rim lighting',
                                ],
                                'marketpilot_recommendations' => [
                                    'render_style' => 'Studio Product Still',
                                    'copy_emphasis' => 'Balanced',
                                    'visibility_suggestions' => [
                                        'product_name' => true,
                                        'price' => false,
                                        'tagline' => true,
                                        'business_name' => true,
                                        'event_text' => false,
                                    ],
                                    'confidence_notes' => 'Recovered successfully on retry.',
                                ],
                            ]),
                        ],
                    ],
                ],
            ],
        ],
    ];

    Http::fake([
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent' => Http::sequence()
            ->push(['error' => ['message' => 'This model is currently experiencing high demand.']], 503)
            ->push($successPayload, 200),
    ]);

    $service = new GeminiVisualInspirationService(retryAttemptsOn503: 2, retryDelayMsOn503: 0);

    try {
        $result = $service->analyze($tempImage, forceFallback: true);

        expect($result['success'])->toBeTrue()
            ->and($result['model_used'])->toBe('gemini-3.6-flash')
            ->and($result['marketpilot_recommendations']['render_style'])->toBe('Studio Product Still')
            ->and($result['marketpilot_recommendations']['confidence_notes'])->toBe('Recovered successfully on retry.');

        // First attempt 503, second attempt 200 (succeeded on retry)
        Http::assertSentCount(2);
    } finally {
        @unlink($tempImage);
    }
});

it('persistent 503 eventually fails and produces a clear sanitized error message', function () {
    $tempImage = tempnam(sys_get_temp_dir(), 'test_img_').'.png';
    $pngBinary = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    file_put_contents($tempImage, $pngBinary);

    Http::fake([
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent' => Http::response([
            'error' => ['message' => 'Service overloaded.'],
        ], 503),
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent' => Http::response([
            'error' => ['message' => 'Capacity exceeded.'],
        ], 503),
    ]);

    $service = new GeminiVisualInspirationService(retryAttemptsOn503: 2, retryDelayMsOn503: 0);

    try {
        $result = $service->analyze($tempImage);

        expect($result['success'])->toBeFalse()
            ->and($result['error'])->toContain('All Gemini vision attempts failed')
            ->and($result['error'])->toContain('primary model (gemini-3.1-pro-preview) -> HTTP 503')
            ->and($result['error'])->toContain('fallback model (gemini-3.6-flash) -> HTTP 503')
            ->and($result['error'])->not->toContain('test-fake-key-for-testing-only');

        // 2 attempts on primary + 2 attempts on fallback = 4 total calls
        Http::assertSentCount(4);
    } finally {
        @unlink($tempImage);
    }
});

it('produces a specific consolidated directive capturing complex poster layout, product placement, typography hierarchy, and textures', function () {
    $tempImage = tempnam(sys_get_temp_dir(), 'test_img_').'.png';
    $pngBinary = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    file_put_contents($tempImage, $pngBinary);

    $complexDirective = 'Commercial advertising poster layout with the hero product anchored in the lower-right foreground on a textured charcoal stone surface. The upper-left quadrant provides generous negative space with a soft warm amber ambient gradient, designated for a high-contrast heavy condensed sans-serif headline. An arched geometric framing border in muted terracotta accents the left margin with subtle film grain overlay. Warm directional rim lighting from the top-right casts soft contact shadows behind the product, maintaining crisp separation from the deep neutral backdrop.';

    $geminiResponsePayload = [
        'candidates' => [
            [
                'content' => [
                    'parts' => [
                        [
                            'text' => json_encode([
                                'visual_analysis' => [
                                    'composition_and_framing' => 'Vertical poster orientation with hero product anchored in the lower-right foreground. Generous negative space across the upper-left quadrant reserved for bold typography.',
                                    'color_palette' => 'Deep charcoal base, warm terracotta framing accents, amber ambient gradient, and crisp off-white typography zones.',
                                    'lighting_and_shadows' => 'Directional top-right rim lighting casting soft grounding contact shadows with high separation from the dark backdrop.',
                                    'typography_character_and_hierarchy' => 'Heavy condensed sans-serif headline in the upper-left margin paired with smaller tracked subtext.',
                                    'mood_and_visual_direction' => 'Premium, architectural commercial advertising aesthetic with graphic layout precision.',
                                    'reusable_visual_style_prompt' => $complexDirective,
                                ],
                                'marketpilot_recommendations' => [
                                    'render_style' => 'Cinematic Marketing',
                                    'copy_emphasis' => 'Product',
                                    'visibility_suggestions' => [
                                        'product_name' => true,
                                        'price' => false,
                                        'tagline' => true,
                                        'business_name' => true,
                                        'event_text' => false,
                                    ],
                                    'confidence_notes' => 'Distinctive vertical poster geometry with strong spatial hierarchy and graphic framing.',
                                ],
                            ]),
                        ],
                    ],
                ],
            ],
        ],
    ];

    Http::fake([
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent' => Http::response($geminiResponsePayload, 200),
    ]);

    $service = new GeminiVisualInspirationService(retryAttemptsOn503: 2, retryDelayMsOn503: 0);

    try {
        $result = $service->analyze($tempImage);

        expect($result['success'])->toBeTrue()
            ->and($result['visual_analysis'])->toHaveKeys([
                'composition_and_framing',
                'color_palette',
                'lighting_and_shadows',
                'typography_character_and_hierarchy',
                'mood_and_visual_direction',
                'reusable_visual_style_prompt',
            ])
            ->and($result['marketpilot_recommendations'])->toHaveKeys([
                'render_style',
                'copy_emphasis',
                'visibility_suggestions',
                'confidence_notes',
            ]);

        $directive = $result['visual_analysis']['reusable_visual_style_prompt'];

        // Word count is within expected bounded range (70-120 words)
        $wordCount = str_word_count($directive);
        expect($wordCount)->toBeGreaterThanOrEqual(70)
            ->and($wordCount)->toBeLessThanOrEqual(120);

        // Captures product placement, negative space, typography styling, and decorative textures
        expect($directive)
            ->toContain('lower-right foreground')
            ->toContain('generous negative space')
            ->toContain('heavy condensed sans-serif headline')
            ->toContain('arched geometric framing border')
            ->toContain('film grain overlay');

        // Strictly product-agnostic: no brand names, logos, or reference product categories
        expect($directive)
            ->not->toContain('Nike')
            ->not->toContain('coffee')
            ->not->toContain('burger')
            ->not->toContain('sneaker')
            ->not->toContain('shoe')
            ->not->toContain('latte')
            ->not->toContain('Starbucks');
    } finally {
        @unlink($tempImage);
    }
});

it('keeps the reusable directive concise without speculative detail for simple references', function () {
    $tempImage = tempnam(sys_get_temp_dir(), 'test_img_').'.png';
    $pngBinary = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    file_put_contents($tempImage, $pngBinary);

    $simpleDirective = 'Centered eye-level studio product presentation on a seamless neutral off-white surface with soft diffused ambient daylight, crisp subtle contact shadow, and generous balanced negative space around the hero subject.';

    $geminiResponsePayload = [
        'candidates' => [
            [
                'content' => [
                    'parts' => [
                        [
                            'text' => json_encode([
                                'visual_analysis' => [
                                    'composition_and_framing' => 'Centered eye-level framing with ample negative space around the subject.',
                                    'color_palette' => 'Monochromatic neutral off-white with subtle warm undertones.',
                                    'lighting_and_shadows' => 'Soft diffused ambient daylight with delicate contact shadow.',
                                    'typography_character_and_hierarchy' => 'Minimalist understated typography zones.',
                                    'mood_and_visual_direction' => 'Clean minimalist studio commercial presentation.',
                                    'reusable_visual_style_prompt' => $simpleDirective,
                                ],
                                'marketpilot_recommendations' => [
                                    'render_style' => 'Minimalist Graphic',
                                    'copy_emphasis' => 'Balanced',
                                    'visibility_suggestions' => [
                                        'product_name' => true,
                                        'price' => true,
                                        'tagline' => true,
                                        'business_name' => false,
                                        'event_text' => false,
                                    ],
                                    'confidence_notes' => 'Minimalist reference with clean backdrop and zero complex graphic clutter.',
                                ],
                            ]),
                        ],
                    ],
                ],
            ],
        ],
    ];

    Http::fake([
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent' => Http::response($geminiResponsePayload, 200),
    ]);

    $service = new GeminiVisualInspirationService(retryAttemptsOn503: 2, retryDelayMsOn503: 0);

    try {
        $result = $service->analyze($tempImage);

        expect($result['success'])->toBeTrue();

        $directive = $result['visual_analysis']['reusable_visual_style_prompt'];

        // Word count for simple reference remains concise (< 50 words)
        $wordCount = str_word_count($directive);
        expect($wordCount)->toBeLessThan(50);

        // Specific to the clean presentation without speculative decorative clutter
        expect($directive)
            ->toContain('Centered eye-level')
            ->toContain('seamless neutral off-white')
            ->toContain('soft diffused ambient daylight')
            ->not->toContain('border')
            ->not->toContain('badge')
            ->not->toContain('grain')
            ->not->toContain('pattern');
    } finally {
        @unlink($tempImage);
    }
});
