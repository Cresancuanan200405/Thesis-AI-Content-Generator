<?php

namespace App\Services;

use App\Models\Business;
use App\Models\Design;
use App\Models\User;

class MarketingDesignSystem
{
    /**
     * Controlled registry for Design Treatments.
     *
     * @var array<string, string>
     */
    public const DESIGN_TREATMENTS = [
        'Auto' => 'Intelligent automatic selection tailored to industry conventions, brand tone, and campaign goal.',
        'Classic' => 'Timeless commercial print advertisement layout with structured copy zones and clear product dominance.',
        'Editorial' => 'High-fashion and magazine editorial layout featuring artistic whitespace, sophisticated framing, and bespoke typography.',
        'Bold Promo' => 'Dynamic retail promotional layout with high-energy accents, strong contrast, and urgent commercial callouts.',
        'Minimal' => 'Contemporary minimalist aesthetic featuring expansive negative space, muted elegance, and uncluttered focus.',
        'Premium' => 'High-end luxury brand aesthetic featuring opulent textures, refined studio lighting, and prestige finish.',
    ];

    /**
     * Controlled registry for Copy Emphases.
     *
     * @var array<string, string>
     */
    public const COPY_EMPHASES = [
        'Product-first' => 'Visual priority centered on product details and craftsmanship, typography subordinate.',
        'Tagline-first' => 'Headline tagline takes bold visual precedence, driving emotional hook and promotional narrative.',
        'Price-first' => 'Promotional pricing and value proposition featured prominently with strong conversion focus.',
        'Balanced' => 'Equal commercial harmony between product imagery, marketing headline, and supporting details.',
        'Price-Focused' => 'Promotional pricing and value proposition featured prominently with strong conversion focus.',
        'Headline-First' => 'Headline tagline takes bold visual precedence, driving emotional hook and promotional narrative.',
        'Product-Focused' => 'Visual priority centered on product details and craftsmanship, typography subordinate.',
    ];

    /**
     * Controlled registry for Typography Layouts.
     *
     * @var array<string, string>
     */
    public const TYPOGRAPHY_LAYOUTS = [
        'classic hierarchy' => 'Traditional commercial advertising hierarchy with clear headline, body, and call-to-action distinction.',
        'editorial' => 'Refined magazine-style editorial typography with elegant serif or high-contrast sans lettering.',
        'bold promotional' => 'High-impact display typography optimized for promotions, discounts, and flash sales.',
        'minimalist' => 'Clean, understated typography with generous negative space and disciplined alignment.',
        'premium' => 'Prestigious, luxury lettering with sophisticated kerning, subtle metallic/foil accents, and restrained elegance.',
        'balanced' => 'Harmonious commercial layout where text and product share balanced visual weight.',
    ];

    /**
     * Controlled registry for Composition Types.
     *
     * @var array<string, string>
     */
    public const COMPOSITION_TYPES = [
        'centered hero' => 'Product positioned dead-center as the unequivocal focal centerpiece, surrounded by contextual atmosphere.',
        'left product / right copy' => 'Product staged in left third with ample intentional negative space in right zone for copy typography.',
        'right product / left copy' => 'Product staged in right third with clear negative space in left zone for headline and branding.',
        'diagonal editorial' => 'Dynamic diagonal visual flow guiding the eye from top-corner typography down through the product.',
        'overhead' => 'Flat-lay overhead viewpoint looking directly down onto styled product arrangement and contextual surfaces.',
        'macro close-up' => 'Intimate macro crop emphasizing fine textures, ingredients, craftsmanship, and tactile details.',
        'environmental wide shot' => 'Spacious environmental staging placing product organically within its real-world context.',
        'layered foreground/background' => 'Dimensional multi-plane composition with soft foreground elements, sharp hero, and blurred depth.',
        'asymmetric negative-space layout' => 'Modern asymmetric rule-of-thirds composition intentionally reserving clean zones for typography.',
    ];

    /**
     * Controlled registry for Camera / Viewpoints.
     *
     * @var array<string, string>
     */
    public const CAMERA_VIEWPOINTS = [
        'front/eye-level' => 'Direct eye-level perspective creating an honest, relatable, and clear view of the product.',
        'three-quarter' => 'Slightly elevated 45-degree three-quarter commercial studio angle revealing both top and front geometry.',
        'overhead' => 'Direct 90-degree flat-lay top-down camera angle highlighting surface styling and geometric layout.',
        'macro' => 'Extreme close-up macro lens perspective highlighting intricate product details and textures.',
        'wide/environmental' => 'Medium-wide commercial lens showing the hero product within an expansive atmospheric environment.',
    ];

    /**
     * Controlled registry for Scene Families.
     *
     * @var array<string, string>
     */
    public const SCENE_FAMILIES = [
        'tabletop still life' => 'Intimate, focused arrangement of product and complementary accents on an artisanal tabletop surface.',
        'in-use lifestyle action' => 'Dynamic contextual moment capturing product actively integrated into an authentic daily routine.',
        'minimalist podium / pedestal' => 'Clean geometric plinth staging isolating product as a sculptural centerpiece.',
        'environmental workspace' => 'Organic placement within a professional studio, craft workspace, or commercial counter.',
        'curated editorial flat-lay' => 'Thoughtfully styled top-down arrangement with balanced spacing and textural storytelling.',
        'outdoor natural setting' => 'Fresh outdoor atmosphere featuring natural botanical textures, sunlight, and organic environment.',
        'architectural interior setting' => 'Sophisticated interior architectural framing highlighting refined materials and spatial depth.',
        'artistic floating / suspension' => 'Elevated artistic levitation or suspended elements creating dynamic energy and modern flair.',
    ];

    /**
     * Controlled registry for Environment Families.
     *
     * @var array<string, string>
     */
    public const ENVIRONMENT_FAMILIES = [
        'warm artisanal cafe' => 'Cozy wooden countertops, espresso equipment, soft morning cafe ambiance.',
        'sleek modern studio' => 'Pristine, neutral commercial photography studio with seamless cyclorama.',
        'sunlit contemporary kitchen' => 'Bright marble or quartz counters, morning sunlight through windows, clean modern home aesthetic.',
        'botanical garden / natural patio' => 'Lush foliage, natural stone, terracotta, warm dappled sunlight.',
        'cozy residential living space' => 'Warm interior textures, bookshelf, soft textiles, lived-in premium comfort.',
        'vibrant urban boutique' => 'Contemporary retail storefront or pop-up showroom with curated display shelving.',
        'clean architectural showroom' => 'Brutalist or Scandinavian concrete, glass, oak, and minimalist lines.',
        'rich textural backdrop' => 'Hand-painted canvas, textured plaster, brushed stone, or raw linen backdrop.',
    ];

    /**
     * Controlled registry for Prop Profiles.
     *
     * @var array<string, string>
     */
    public const PROP_PROFILES = [
        'raw organic ingredients & botanicals' => 'Fresh raw ingredients, botanicals, and unrefined natural elements related to product craft.',
        'refined ceramics & linen textures' => 'Handmade ceramic saucers, neutral crumpled linen napkins, artisanal pottery.',
        'minimal geometry & brass accents' => 'Subtle architectural blocks, warm brass or chrome hardware, minimalist styling.',
        'lifestyle accessories & tools of craft' => 'Notebook, artisan utensils, measuring tools, authentic craft accessories.',
        'fresh seasonal foliage & warm stoneware' => 'Subtle eucalyptus sprigs, seasonal flowers, warm matte stoneware.',
        'none / pure zero-prop isolation' => 'Zero distracting props; absolute laser focus on product geometry and packaging.',
    ];

    /**
     * The six authoritative dimensions comprising the Primary Visual Core.
     *
     * @var array<int, string>
     */
    public const PRIMARY_VISUAL_CORE_KEYS = [
        'scene_family',
        'environment_family',
        'composition_type',
        'camera_viewpoint',
        'lighting_profile',
        'prop_profile',
    ];

    /**
     * Controlled registry for Lighting Profiles.
     *
     * @var array<string, string>
     */
    public const LIGHTING_PROFILES = [
        'soft diffused' => 'Even, gentle commercial softbox light eliminating harsh specular glares while maintaining soft contact shadows.',
        'warm morning' => 'Warm, angled natural morning sunlight casting golden light rays and gentle elongated shadows.',
        'golden hour' => 'Rich, warm late-afternoon golden-hour sunlight with amber glows and dimensional rim highlights.',
        'dramatic side light' => 'Chiaroscuro high-contrast directional key light from one side creating striking volume and depth.',
        'premium studio' => 'Multi-point commercial studio lighting with dedicated key, fill, and hair/rim lights for maximum polish.',
        'moody contrast' => 'Atmospheric low-key lighting with deep velvety shadows, selective spotlighting, and mysterious ambiance.',
    ];

    /**
     * Controlled registry for Render Styles.
     *
     * @var array<int, string>
     */
    public const RENDER_STYLES = [
        'Studio Product Still',
        'Cinematic Marketing',
        'Lifestyle Capture',
        'Minimalist Graphic Vec',
    ];

    /**
     * Controlled registry for Render Style canonical specifications.
     *
     * @var array<string, string>
     */
    public const RENDER_STYLE_SPECS = [
        'Studio Product Still' => "Studio Product Still\n• Product-focused commercial studio presentation\n• Controlled three-point studio lighting with razor-sharp product clarity\n• Clean neutral or premium backdrop with generous negative space\n• The product is unquestionably the dominant centerpiece",
        'Cinematic Marketing' => "Cinematic Marketing\n• Volumetric atmospheric rim lighting and rich color grading\n• Dramatic editorial depth of field\n• Cinematic visual storytelling with commercial advertising composition\n• The product remains in crystal-clear focus",
        'Lifestyle Capture' => "Lifestyle Capture\n• Realistic authentic contextual environment\n• Natural window sunlight with soft organic shadows\n• Candid lifestyle atmosphere and warm textures\n• The product remains clearly identifiable and prominent",
        'Minimalist Graphic Vec' => "Minimalist Graphic\n• Clean graphic composition with high negative space\n• Bold typography and sharp vector geometry\n• High-contrast color blocking and modern poster aesthetics\n• Product prominence with graphic advertising clarity",
        'Minimalist Graphic' => "Minimalist Graphic\n• Clean graphic composition with high negative space\n• Bold typography and sharp vector geometry\n• High-contrast color blocking and modern poster aesthetics\n• Product prominence with graphic advertising clarity",
    ];

    /**
     * Controlled registry for Brand Tones.
     *
     * @var array<int, string>
     */
    public const BRAND_TONES = [
        'Professional',
        'Friendly',
        'Luxury',
        'Playful',
        'Minimal',
        'Bold',
        'Elegant',
        'Warm',
        'Modern',
        'Inspiring',
    ];

    /**
     * Controlled registry for Brand Tone canonical specifications.
     *
     * @var array<string, string>
     */
    public const BRAND_TONE_SPECS = [
        'Professional' => 'Clean, authoritative, dependable, and polished commercial advertising aesthetic.',
        'Friendly' => 'Approachable, cheerful, warm, inviting, and community-centered visual feel.',
        'Luxury' => 'Exclusive, prestigious, sophisticated, and high-value luxury aesthetic with rich textures and refined lighting.',
        'Playful' => 'Vibrant, whimsical, energetic, and spirited atmosphere with dynamic color accents.',
        'Minimal' => 'Subtle, understated, quiet confidence, and uncluttered simplicity.',
        'Bold' => 'High-impact, assertive, confident, and dramatic contrast that commands attention.',
        'Elegant' => 'Graceful, refined, timeless beauty with soft transitions and delicate highlights.',
        'Warm' => 'Cozy, golden, comfortable, comforting, and heartfelt emotional ambiance.',
        'Modern' => 'Sleek, forward-looking, contemporary, clean lines, and state-of-the-art styling.',
        'Inspiring' => 'Uplifting, aspirational, visionary, and motivating commercial presentation.',
    ];

    /**
     * Controlled registry for Visual Themes.
     *
     * @var array<int, string>
     */
    public const VISUAL_THEMES = [
        'Product-focused',
        'Lifestyle',
        'Promotional',
        'Educational',
        'Social Media',
        'Seasonal',
        'Minimal',
        'Storytelling',
        'Premium',
        'Editorial',
    ];

    /**
     * Controlled registry for Visual Theme canonical specifications.
     *
     * @var array<string, string>
     */
    public const VISUAL_THEME_SPECS = [
        'Product-focused' => 'Laser-focused presentation isolating the product with clean backdrop, crisp lighting, and distraction-free clarity.',
        'Lifestyle' => 'Authentic lived-in context showing real-world atmosphere, organic textures, and natural lifestyle staging.',
        'Promotional' => 'High-energy commercial sale atmosphere with vibrant accents, high contrast, and dynamic promotional appeal.',
        'Educational' => 'Clear, informative staging highlighting ingredients, components, craftsmanship, and functional details.',
        'Social Media' => 'Modern, thumb-stopping, vibrant social-first aesthetic with trendy color accents and scroll-stopping appeal.',
        'Seasonal' => 'Thematic seasonal props, seasonal color palette, and atmospheric festive weather/lighting accents.',
        'Minimal' => 'Expansive negative space, muted sophisticated tones, and disciplined uncluttered geometry.',
        'Storytelling' => 'Rich narrative visual depth suggesting origin, heritage, artisanal process, and evocative lifestyle background.',
        'Premium' => 'Opulent textures, refined specular highlights, architectural materials, and prestigious high-end luxury feel.',
        'Editorial' => 'Sophisticated magazine-grade aesthetic with artistic asymmetry, directional lighting, and refined cultural styling.',
    ];

    /**
     * Controlled registry for Aspect Ratios.
     *
     * @var array<int, string>
     */
    public const ASPECT_RATIOS = [
        '1:1',
        '9:16',
        '16:9',
        '4:5',
        '4:3',
    ];

    /**
     * Incompatibility mappings to prevent jarring or contradictory preset combinations.
     *
     * @var array<string, array{incompatible_tones?: array<int, string>, incompatible_themes?: array<int, string>, incompatible_lighting?: array<int, string>}>
     */
    protected const INCOMPATIBILITIES = [
        'Minimal' => [
            'incompatible_tones' => ['Playful', 'Bold'],
            'incompatible_themes' => ['Social Media', 'Storytelling'],
        ],
        'Bold Promo' => [
            'incompatible_tones' => ['Minimal'],
            'incompatible_themes' => ['Minimal'],
        ],
        'Premium' => [
            'incompatible_tones' => ['Playful'],
            'incompatible_themes' => ['Social Media'],
        ],
        'Minimalist Graphic Vec' => [
            'incompatible_lighting' => ['moody contrast', 'dramatic side light'],
        ],
    ];

    /**
     * Resolve canonical specification for a Brand Tone.
     */
    public function resolveBrandToneSpec(string $tone): string
    {
        $match = null;
        $lower = strtolower(trim($tone));
        foreach (self::BRAND_TONE_SPECS as $k => $v) {
            if (strtolower($k) === $lower) {
                $match = $v;
                break;
            }
        }

        return $match ?? 'Distinctive brand tone calibrating commercial atmosphere and visual personality.';
    }

    /**
     * Resolve canonical specification for a Visual Theme.
     */
    public function resolveVisualThemeSpec(string $theme): string
    {
        $match = null;
        $lower = strtolower(trim($theme));
        foreach (self::VISUAL_THEME_SPECS as $k => $v) {
            if (strtolower($k) === $lower) {
                $match = $v;
                break;
            }
        }

        return $match ?? 'Harmonious contextual props and commercial background staging that enrich the product environment.';
    }

    /**
     * Resolve canonical specification for a Design Treatment.
     */
    public function resolveDesignTreatmentSpec(string $treatment): string
    {
        $match = null;
        $lower = strtolower(trim($treatment));
        foreach (self::DESIGN_TREATMENTS as $k => $v) {
            if (strtolower($k) === $lower) {
                $match = $v;
                break;
            }
        }

        return $match ?? 'Structured commercial layout with balanced negative space and clear visual hierarchy.';
    }

    /**
     * Resolve canonical specification for a Copy Emphasis.
     */
    public function resolveCopyEmphasisSpec(string $emphasis): string
    {
        $match = null;
        $lower = strtolower(trim($emphasis));
        foreach (self::COPY_EMPHASES as $k => $v) {
            if (strtolower($k) === $lower) {
                $match = $v;
                break;
            }
        }

        return $match ?? 'Harmonious commercial balance between product presentation and marketing copy.';
    }

    /**
     * Resolve canonical specification for a Render Style.
     */
    public function resolveRenderStyleSpec(string $renderStyle): string
    {
        $match = null;
        $lower = strtolower(trim($renderStyle));
        foreach (self::RENDER_STYLE_SPECS as $k => $v) {
            if (strtolower($k) === $lower) {
                $match = $v;
                break;
            }
        }

        return $match ?? "{$renderStyle}\n• Professional commercial presentation with balanced lighting and clear product focus";
    }

    public function designTreatments(): array
    {
        return array_keys(self::DESIGN_TREATMENTS);
    }

    public function copyEmphases(): array
    {
        return array_keys(self::COPY_EMPHASES);
    }

    public function typographyLayouts(): array
    {
        return array_keys(self::TYPOGRAPHY_LAYOUTS);
    }

    public function compositionTypes(): array
    {
        return array_keys(self::COMPOSITION_TYPES);
    }

    public function cameraViewpoints(): array
    {
        return array_keys(self::CAMERA_VIEWPOINTS);
    }

    public function lightingProfiles(): array
    {
        return array_keys(self::LIGHTING_PROFILES);
    }

    public function renderStyles(): array
    {
        return self::RENDER_STYLES;
    }

    public function brandTones(): array
    {
        return self::BRAND_TONES;
    }

    public function visualThemes(): array
    {
        return self::VISUAL_THEMES;
    }

    public function sceneFamilies(): array
    {
        return array_keys(self::SCENE_FAMILIES);
    }

    public function environmentFamilies(): array
    {
        return array_keys(self::ENVIRONMENT_FAMILIES);
    }

    public function propProfiles(): array
    {
        return array_keys(self::PROP_PROFILES);
    }

    /**
     * Get all controlled taxonomies as an exportable configuration array.
     *
     * @return array<string, mixed>
     */
    public function getExportableTaxonomies(): array
    {
        return [
            'design_treatments' => self::DESIGN_TREATMENTS,
            'copy_emphases' => self::COPY_EMPHASES,
            'typography_layouts' => self::TYPOGRAPHY_LAYOUTS,
            'composition_types' => self::COMPOSITION_TYPES,
            'camera_viewpoints' => self::CAMERA_VIEWPOINTS,
            'lighting_profiles' => self::LIGHTING_PROFILES,
            'scene_families' => self::SCENE_FAMILIES,
            'environment_families' => self::ENVIRONMENT_FAMILIES,
            'prop_profiles' => self::PROP_PROFILES,
            'render_styles' => self::RENDER_STYLES,
            'brand_tones' => self::BRAND_TONES,
            'visual_themes' => self::VISUAL_THEMES,
            'aspect_ratios' => self::ASPECT_RATIOS,
        ];
    }

    /**
     * Validate and sanitize a Design Treatment.
     */
    public function validateDesignTreatment(?string $value): string
    {
        if (! $value) {
            return 'Auto';
        }

        $lower = strtolower(trim($value));
        foreach (self::DESIGN_TREATMENTS as $key => $desc) {
            if (strtolower($key) === $lower) {
                return $key;
            }
        }

        return 'Auto';
    }

    /**
     * Validate and sanitize a Copy Emphasis.
     */
    public function validateCopyEmphasis(?string $value): string
    {
        if (! $value) {
            return 'Balanced';
        }

        $lower = strtolower(trim($value));
        foreach (self::COPY_EMPHASES as $key => $desc) {
            if (strtolower($key) === $lower) {
                return $key;
            }
        }

        return 'Balanced';
    }

    /**
     * Validate and sanitize a Typography Layout.
     */
    public function validateTypographyLayout(?string $value): string
    {
        if ($value && array_key_exists($value, self::TYPOGRAPHY_LAYOUTS)) {
            return $value;
        }

        return 'balanced';
    }

    /**
     * Validate and sanitize a Composition Type.
     */
    public function validateCompositionType(?string $value): string
    {
        if ($value && array_key_exists($value, self::COMPOSITION_TYPES)) {
            return $value;
        }

        return 'centered hero';
    }

    /**
     * Validate and sanitize a Camera Viewpoint.
     */
    public function validateCameraViewpoint(?string $value): string
    {
        if ($value && array_key_exists($value, self::CAMERA_VIEWPOINTS)) {
            return $value;
        }

        return 'front/eye-level';
    }

    /**
     * Validate and sanitize a Lighting Profile.
     */
    public function validateLightingProfile(?string $value): string
    {
        if ($value && array_key_exists($value, self::LIGHTING_PROFILES)) {
            return $value;
        }

        return 'premium studio';
    }

    public function validateSceneFamily(?string $value): ?string
    {
        if (empty($value)) {
            return null;
        }

        $trimmed = strtolower(trim($value));
        foreach (self::SCENE_FAMILIES as $key => $desc) {
            if ($trimmed === strtolower($key)) {
                return $key;
            }
        }

        return 'tabletop still life';
    }

    public function validateEnvironmentFamily(?string $value): ?string
    {
        if (empty($value)) {
            return null;
        }

        $trimmed = strtolower(trim($value));
        foreach (self::ENVIRONMENT_FAMILIES as $key => $desc) {
            if ($trimmed === strtolower($key)) {
                return $key;
            }
        }

        return 'warm artisanal cafe';
    }

    public function validatePropProfile(?string $value): ?string
    {
        if (empty($value)) {
            return null;
        }

        $trimmed = strtolower(trim($value));
        foreach (self::PROP_PROFILES as $key => $desc) {
            if ($trimmed === strtolower($key)) {
                return $key;
            }
        }

        return 'refined ceramics & linen textures';
    }

    /**
     * Validate and sanitize a Render Style.
     */
    public function validateRenderStyle(?string $value): string
    {
        if ($value && in_array($value, self::RENDER_STYLES, true)) {
            return $value;
        }

        return 'Studio Product Still';
    }

    /**
     * Validate and sanitize an Aspect Ratio.
     */
    public function validateAspectRatio(?string $value): string
    {
        if ($value && in_array($value, self::ASPECT_RATIOS, true)) {
            return $value;
        }

        return '1:1';
    }

    /**
     * Validate and sanitize multi-select Brand Tones (max 3).
     *
     * @param  array<int, string>|string|null  $values
     * @return array<int, string>
     */
    public function validateBrandTones(array|string|null $values, int $max = 3): array
    {
        if (is_string($values)) {
            $values = array_map('trim', explode(',', $values));
        }

        if (! is_array($values)) {
            return [];
        }

        $validated = [];
        foreach ($values as $item) {
            $item = trim((string) $item);
            if (in_array($item, self::BRAND_TONES, true) && ! in_array($item, $validated, true)) {
                $validated[] = $item;
                if (count($validated) >= $max) {
                    break;
                }
            }
        }

        return $validated;
    }

    /**
     * Validate and sanitize multi-select Visual Themes (max 3).
     *
     * @param  array<int, string>|string|null  $values
     * @return array<int, string>
     */
    public function validateVisualThemes(array|string|null $values, int $max = 3): array
    {
        if (is_string($values)) {
            $values = array_map('trim', explode(',', $values));
        }

        if (! is_array($values)) {
            return [];
        }

        $validated = [];
        foreach ($values as $item) {
            $item = trim((string) $item);
            if (in_array($item, self::VISUAL_THEMES, true) && ! in_array($item, $validated, true)) {
                $validated[] = $item;
                if (count($validated) >= $max) {
                    break;
                }
            }
        }

        return $validated;
    }

    /**
     * Perform deterministic, fast, zero-network preset shuffling.
     * Adheres to:
     * - Single-select (Render Style: 1, Design Treatment: 1, Copy Emphasis: 1, Aspect Ratio: 1)
     * - Multi-select (Brand Tone: exactly 3 distinct compatible values if available; Visual Theme: exactly 3 distinct compatible values if available)
     * - Compatibility filtering to prevent jarring combinations
     * - Recent combination exclusion
     *
     * @param  array<string, mixed>  $options
     * @param  array<int, array<string, mixed>>  $recentFingerprints
     * @return array{
     *     render_style: string,
     *     design_treatment: string,
     *     copy_emphasis: string,
     *     aspect_ratio: string,
     *     brand_tone: array<int, string>,
     *     visual_theme: array<int, string>,
     *     composition_type: string,
     *     camera_viewpoint: string,
     *     lighting_profile: string,
     * }
     */
    public function shufflePresets(array $options = [], array $recentFingerprints = []): array
    {
        // 1. Resolve candidate Design Treatment (excluding recent treatments if alternatives exist)
        $recentTreatments = collect($recentFingerprints)->pluck('design_treatment')->filter()->unique()->all();
        $treatmentCandidates = array_values(array_diff(array_keys(self::DESIGN_TREATMENTS), ['Auto']));
        $filteredTreatments = array_values(array_diff($treatmentCandidates, $recentTreatments));
        $chosenTreatment = ! empty($filteredTreatments)
            ? $filteredTreatments[array_rand($filteredTreatments)]
            : $treatmentCandidates[array_rand($treatmentCandidates)];

        // 2. Resolve candidate Render Style (excluding recent styles if alternatives exist)
        $recentStyles = collect($recentFingerprints)->pluck('render_style')->filter()->unique()->all();
        $styleCandidates = self::RENDER_STYLES;
        $filteredStyles = array_values(array_diff($styleCandidates, $recentStyles));
        $chosenStyle = ! empty($filteredStyles)
            ? $filteredStyles[array_rand($filteredStyles)]
            : $styleCandidates[array_rand($styleCandidates)];

        // 3. Resolve candidate Copy Emphasis
        $copyCandidates = array_keys(self::COPY_EMPHASES);
        $recentCopy = collect($recentFingerprints)->pluck('copy_emphasis')->filter()->unique()->all();
        $filteredCopy = array_values(array_diff($copyCandidates, $recentCopy));
        $chosenCopy = ! empty($filteredCopy)
            ? $filteredCopy[array_rand($filteredCopy)]
            : $copyCandidates[array_rand($copyCandidates)];

        // 4. Resolve candidate Aspect Ratio (single-select, keep requested or pick 1)
        $aspectCandidates = self::ASPECT_RATIOS;
        $chosenAspect = ! empty($options['aspect_ratio']) && in_array($options['aspect_ratio'], $aspectCandidates, true)
            ? $options['aspect_ratio']
            : $aspectCandidates[array_rand($aspectCandidates)];

        // 5. Apply compatibility filter for Brand Tones
        $incompatibleTones = self::INCOMPATIBILITIES[$chosenTreatment]['incompatible_tones'] ?? [];
        $availableTones = array_values(array_diff(self::BRAND_TONES, $incompatibleTones));
        if (count($availableTones) < 3) {
            $availableTones = self::BRAND_TONES;
        }
        shuffle($availableTones);
        $chosenTones = array_slice($availableTones, 0, min(3, count($availableTones)));

        // 6. Apply compatibility filter for Visual Themes
        $incompatibleThemes = self::INCOMPATIBILITIES[$chosenTreatment]['incompatible_themes'] ?? [];
        $availableThemes = array_values(array_diff(self::VISUAL_THEMES, $incompatibleThemes));
        if (count($availableThemes) < 3) {
            $availableThemes = self::VISUAL_THEMES;
        }
        shuffle($availableThemes);
        $chosenThemes = array_slice($availableThemes, 0, min(3, count($availableThemes)));

        // 7. Resolve Composition Type & Camera Viewpoint & Lighting Profile
        $compCandidates = array_keys(self::COMPOSITION_TYPES);
        $recentComp = collect($recentFingerprints)->pluck('composition_type')->filter()->unique()->all();
        $filteredComp = array_values(array_diff($compCandidates, $recentComp));
        $chosenComp = ! empty($filteredComp)
            ? $filteredComp[array_rand($filteredComp)]
            : $compCandidates[array_rand($compCandidates)];

        $cameraCandidates = array_keys(self::CAMERA_VIEWPOINTS);
        $chosenCamera = $cameraCandidates[array_rand($cameraCandidates)];

        $lightingCandidates = array_keys(self::LIGHTING_PROFILES);
        $incompatibleLighting = self::INCOMPATIBILITIES[$chosenStyle]['incompatible_lighting'] ?? [];
        $availableLighting = array_values(array_diff($lightingCandidates, $incompatibleLighting));
        if (empty($availableLighting)) {
            $availableLighting = $lightingCandidates;
        }
        $chosenLighting = $availableLighting[array_rand($availableLighting)];

        return [
            'render_style' => $chosenStyle,
            'design_treatment' => $chosenTreatment,
            'copy_emphasis' => $chosenCopy,
            'aspect_ratio' => $chosenAspect,
            'brand_tone' => $chosenTones,
            'visual_theme' => $chosenThemes,
            'composition_type' => $chosenComp,
            'camera_viewpoint' => $chosenCamera,
            'lighting_profile' => $chosenLighting,
        ];
    }

    /**
     * Build an exact creative fingerprint for anti-repetition tracking.
     *
     * @param  array<string, mixed>  $params
     * @return array<string, mixed>
     */
    public function buildFingerprint(array $params): array
    {
        return [
            'creative_concept' => $params['creative_concept'] ?? null,
            'scene_family' => $this->validateSceneFamily($params['scene_family'] ?? null),
            'environment_family' => $this->validateEnvironmentFamily($params['environment_family'] ?? null),
            'composition_type' => $this->validateCompositionType($params['composition_type'] ?? null),
            'camera_viewpoint' => $this->validateCameraViewpoint($params['camera_viewpoint'] ?? null),
            'lighting_profile' => $this->validateLightingProfile($params['lighting_profile'] ?? null),
            'prop_profile' => $this->validatePropProfile($params['prop_profile'] ?? null),
            'typography_layout' => $this->validateTypographyLayout($params['typography_layout'] ?? null),
            'copy_emphasis' => $this->validateCopyEmphasis($params['copy_emphasis'] ?? null),
            'design_treatment' => $this->validateDesignTreatment($params['design_treatment'] ?? null),
            'render_style' => $this->validateRenderStyle($params['render_style'] ?? null),
            'visual_theme' => $this->validateVisualThemes($params['visual_theme'] ?? null),
            'brand_tone' => $this->validateBrandTones($params['brand_tone'] ?? null),
            'aspect_ratio' => $this->validateAspectRatio($params['aspect_ratio'] ?? null),
        ];
    }

    /**
     * Retrieve recent compatible creative fingerprints for the authenticated business.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getRecentFingerprints(User $user, ?Business $business = null, int $limit = 6): array
    {
        $bizId = $business?->id ?? $user->business?->id;
        if (! $bizId) {
            return [];
        }

        $designs = Design::query()
            ->where('business_id', $bizId)
            ->latest('id')
            ->limit($limit)
            ->get();

        $fingerprints = [];
        foreach ($designs as $design) {
            $meta = (array) ($design->generation_metadata ?? []);
            if (! empty($meta['creative_fingerprint']) && is_array($meta['creative_fingerprint'])) {
                $fingerprints[] = $meta['creative_fingerprint'];
            } else {
                $fingerprints[] = [
                    'creative_concept' => $meta['creative_concept'] ?? null,
                    'scene_family' => $meta['scene_family'] ?? null,
                    'environment_family' => $meta['environment_family'] ?? null,
                    'composition_type' => $meta['composition_type'] ?? null,
                    'camera_viewpoint' => $meta['camera_viewpoint'] ?? null,
                    'lighting_profile' => $meta['lighting_profile'] ?? null,
                    'prop_profile' => $meta['prop_profile'] ?? null,
                    'typography_layout' => $meta['typography_layout'] ?? null,
                    'copy_emphasis' => $meta['copy_emphasis'] ?? null,
                    'design_treatment' => $meta['design_treatment'] ?? null,
                    'render_style' => $meta['render_style'] ?? null,
                    'visual_theme' => $meta['visual_theme'] ?? null,
                    'brand_tone' => $meta['brand_tone'] ?? null,
                    'aspect_ratio' => $meta['aspect_ratio'] ?? null,
                ];
            }
        }

        return $fingerprints;
    }

    /**
     * Extract the 6-part primary visual core from a parameter set or fingerprint.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, string|null>
     */
    public function extractVisualCore(array $data): array
    {
        return [
            'scene_family' => $this->validateSceneFamily($data['scene_family'] ?? null),
            'environment_family' => $this->validateEnvironmentFamily($data['environment_family'] ?? null),
            'composition_type' => $this->validateCompositionType($data['composition_type'] ?? null),
            'camera_viewpoint' => $this->validateCameraViewpoint($data['camera_viewpoint'] ?? null),
            'lighting_profile' => $this->validateLightingProfile($data['lighting_profile'] ?? null),
            'prop_profile' => $this->validatePropProfile($data['prop_profile'] ?? null),
        ];
    }

    /**
     * Compute the similarity between a candidate visual core and a target visual core.
     * Returns matching count (0-6) and list of matching dimension keys.
     *
     * @param  array<string, mixed>  $candidate
     * @param  array<string, mixed>  $target
     * @return array{match_count: int, matching_keys: array<int, string>, similarity_ratio: float}
     */
    public function calculateVisualCoreSimilarity(array $candidate, array $target): array
    {
        $candidateCore = $this->extractVisualCore($candidate);
        $targetCore = $this->extractVisualCore($target);

        $matchingKeys = [];
        foreach (self::PRIMARY_VISUAL_CORE_KEYS as $key) {
            if (
                ! empty($candidateCore[$key])
                && ! empty($targetCore[$key])
                && strcasecmp((string) $candidateCore[$key], (string) $targetCore[$key]) === 0
            ) {
                $matchingKeys[] = $key;
            }
        }

        $count = count($matchingKeys);

        return [
            'match_count' => $count,
            'matching_keys' => $matchingKeys,
            'similarity_ratio' => round($count / 6.0, 2),
        ];
    }

    /**
     * Evaluate anti-repetition similarity against recent fingerprints using the 6-part Primary Visual Core.
     * Tiers:
     * - 6/6 matching: prohibited
     * - 5/6 matching: strongly_avoid
     * - 4/6 matching: discouraged (prefer materially different alternative)
     * - <= 3/6 matching: acceptable
     *
     * @param  array<string, mixed>  $candidate
     * @param  array<int, array<string, mixed>>  $recentFingerprints
     * @return array{
     *     max_match_count: int,
     *     matching_keys: array<int, string>,
     *     classification: 'prohibited'|'strongly_avoid'|'discouraged'|'acceptable',
     *     is_allowed: bool,
     *     most_similar_fingerprint: array<string, mixed>|null,
     * }
     */
    public function evaluateVisualCoreDiversity(array $candidate, array $recentFingerprints): array
    {
        $maxMatch = 0;
        $maxMatchingKeys = [];
        $mostSimilar = null;

        foreach ($recentFingerprints as $fp) {
            $sim = $this->calculateVisualCoreSimilarity($candidate, $fp);
            if ($sim['match_count'] > $maxMatch) {
                $maxMatch = $sim['match_count'];
                $maxMatchingKeys = $sim['matching_keys'];
                $mostSimilar = $fp;
            }
        }

        $classification = match (true) {
            $maxMatch >= 5 => 'prohibited',
            $maxMatch === 4 => 'discouraged',
            default => 'acceptable',
        };

        // Prohibited (6/6 and 5/6) reject duplicate/near-duplicate scenes
        $isAllowed = $maxMatch <= 4;

        return [
            'max_match_count' => $maxMatch,
            'matching_keys' => $maxMatchingKeys,
            'classification' => $classification,
            'is_allowed' => $isAllowed,
            'most_similar_fingerprint' => $mostSimilar,
        ];
    }

    /**
     * Derive a diverse, non-colliding visual core from canonical registries when a candidate is prohibited.
     * Enforces the sequence: Canonical registry -> compatibility filtering -> recent-history filtering -> diversity selection -> final coherence validation.
     *
     * @param  array<string, mixed>  $candidate
     * @param  array<int, array<string, mixed>>  $recentFingerprints
     * @param  array<string, mixed>  $context
     * @return array<string, string|null>
     */
    /**
     * Prioritize candidate values using a diversity budget with cooldown penalties for recently overused values.
     *
     * @param  array<int, string>  $pool
     * @param  array<int, string>  $recentHistory
     * @return array<int, string>
     */
    public function prioritizeByDiversityBudget(array $pool, array $recentHistory, ?string $currentValueToChange = null): array
    {
        $flatHistory = [];
        foreach ($recentHistory as $entry) {
            if (is_array($entry)) {
                foreach ($entry as $val) {
                    if (is_string($val) || is_int($val)) {
                        $flatHistory[] = (string) $val;
                    }
                }
            } elseif (is_string($entry) || is_int($entry)) {
                $flatHistory[] = (string) $entry;
            }
        }

        $filteredHistory = array_filter($flatHistory, fn ($v) => ! empty($v));
        $counts = array_count_values($filteredHistory);

        $sorted = $pool;
        usort($sorted, function (string $a, string $b) use ($counts, $currentValueToChange) {
            // Immediate change penalty: if a value matches the exact colliding candidate value, push it to bottom
            if ($currentValueToChange !== null) {
                if ($a === $currentValueToChange && $b !== $currentValueToChange) {
                    return 1;
                }
                if ($b === $currentValueToChange && $a !== $currentValueToChange) {
                    return -1;
                }
            }

            $countA = $counts[$a] ?? 0;
            $countB = $counts[$b] ?? 0;

            if ($countA !== $countB) {
                return $countA <=> $countB; // Least frequently used first (cooldown on overused)
            }

            return 0;
        });

        return array_values($sorted);
    }

    /**
     * Derive a diverse, non-colliding visual core from canonical registries when a candidate is prohibited.
     * Enforces the sequence: Canonical registry -> compatibility filtering -> recent-history filtering -> diversity budget cooldown -> multi-dimensional change -> final coherence validation.
     *
     * @param  array<string, mixed>  $candidate
     * @param  array<int, array<string, mixed>>  $recentFingerprints
     * @param  array<string, mixed>  $context
     * @return array<string, string|null>
     */
    public function deriveDiverseVisualCore(array $candidate, array $recentFingerprints, array $context = []): array
    {
        $candidate = $this->extractVisualCore($candidate);
        $resolved = $candidate;

        $normalizedRecent = array_map(fn ($fp) => $this->extractVisualCore($fp), $recentFingerprints);
        $recentScenes = collect($normalizedRecent)->pluck('scene_family')->filter()->all();
        $recentEnvs = collect($normalizedRecent)->pluck('environment_family')->filter()->all();
        $recentComps = collect($normalizedRecent)->pluck('composition_type')->filter()->all();
        $recentCameras = collect($normalizedRecent)->pluck('camera_viewpoint')->filter()->all();
        $recentLighting = collect($normalizedRecent)->pluck('lighting_profile')->filter()->all();
        $recentProps = collect($normalizedRecent)->pluck('prop_profile')->filter()->all();

        $aspectRatio = $context['aspect_ratio'] ?? null;
        $industry = strtolower((string) ($context['industry'] ?? ''));
        $category = strtolower((string) ($context['category'] ?? ''));
        $product = strtolower((string) ($context['product'] ?? ''));
        $campaign = strtolower((string) ($context['campaign'] ?? ''));
        $event = strtolower((string) ($context['event'] ?? ''));

        $isFoodOrBeverage = str_contains($industry, 'food') || str_contains($industry, 'beverage')
            || str_contains($industry, 'cafe') || str_contains($category, 'beverage')
            || str_contains($category, 'coffee') || str_contains($category, 'tea')
            || str_contains($category, 'bakery') || str_contains($category, 'restaurant')
            || str_contains($category, 'pastry') || str_contains($category, 'snack')
            || str_contains($product, 'coffee') || str_contains($product, 'brew')
            || str_contains($product, 'tea') || str_contains($product, 'latte')
            || str_contains($product, 'cake') || str_contains($product, 'bread');

        $isFashionOrApparel = str_contains($industry, 'fashion') || str_contains($industry, 'apparel')
            || str_contains($category, 'clothing') || str_contains($category, 'footwear')
            || str_contains($category, 'bag') || str_contains($category, 'jewelry')
            || str_contains($category, 'accessory');

        $isBeautyOrPersonalCare = str_contains($industry, 'beauty') || str_contains($industry, 'personal care')
            || str_contains($category, 'skincare') || str_contains($category, 'cosmetic')
            || str_contains($category, 'salon') || str_contains($category, 'soap');

        $isTechOrOffice = str_contains($industry, 'tech') || str_contains($industry, 'digital')
            || str_contains($category, 'computer') || str_contains($category, 'electronics')
            || str_contains($category, 'software');

        // 1. Scene family: canonical registry -> compatibility filtering -> diversity budget cooldown
        $scenePool = array_keys(self::SCENE_FAMILIES);
        if ($isFoodOrBeverage) {
            $scenePool = [
                'tabletop still life',
                'curated editorial flat-lay',
                'in-use lifestyle action',
                'architectural interior setting',
                'outdoor natural setting',
                'minimalist podium / pedestal',
            ];
        } elseif ($isFashionOrApparel) {
            $scenePool = [
                'in-use lifestyle action',
                'minimalist podium / pedestal',
                'curated editorial flat-lay',
                'architectural interior setting',
                'outdoor natural setting',
                'artistic floating / suspension',
            ];
        } elseif ($isBeautyOrPersonalCare) {
            $scenePool = [
                'tabletop still life',
                'minimalist podium / pedestal',
                'curated editorial flat-lay',
                'architectural interior setting',
                'outdoor natural setting',
            ];
        } elseif ($isTechOrOffice) {
            $scenePool = [
                'environmental workspace',
                'tabletop still life',
                'minimalist podium / pedestal',
                'in-use lifestyle action',
                'architectural interior setting',
            ];
        }
        $prioritizedScenes = $this->prioritizeByDiversityBudget($scenePool, $recentScenes, $candidate['scene_family'] ?? null);
        $resolved['scene_family'] = $prioritizedScenes[0];

        // 2. Environment family: canonical registry -> compatibility filtering -> diversity budget cooldown
        $envPool = array_keys(self::ENVIRONMENT_FAMILIES);
        if ($isFoodOrBeverage) {
            $envPool = [
                'warm artisanal cafe',
                'sunlit contemporary kitchen',
                'botanical garden / natural patio',
                'cozy residential living space',
                'rich textural backdrop',
                'sleek modern studio',
            ];
        } elseif ($isFashionOrApparel) {
            $envPool = [
                'vibrant urban boutique',
                'clean architectural showroom',
                'sleek modern studio',
                'rich textural backdrop',
                'botanical garden / natural patio',
            ];
        } elseif ($isBeautyOrPersonalCare) {
            $envPool = [
                'sunlit contemporary kitchen',
                'clean architectural showroom',
                'sleek modern studio',
                'rich textural backdrop',
                'warm artisanal cafe',
            ];
        } elseif ($isTechOrOffice) {
            $envPool = [
                'sleek modern studio',
                'clean architectural showroom',
                'cozy residential living space',
                'rich textural backdrop',
            ];
        }
        $prioritizedEnvs = $this->prioritizeByDiversityBudget($envPool, $recentEnvs, $candidate['environment_family'] ?? null);
        $resolved['environment_family'] = $prioritizedEnvs[0];

        // 3. Composition type: canonical registry -> aspect-ratio compatibility -> diversity budget cooldown
        $compPool = array_keys(self::COMPOSITION_TYPES);
        if ($aspectRatio === '9:16') {
            $compPool = [
                'centered hero',
                'diagonal editorial',
                'layered foreground/background',
                'asymmetric negative-space layout',
            ];
        } elseif ($aspectRatio === '16:9') {
            $compPool = [
                'left product / right copy',
                'right product / left copy',
                'environmental wide shot',
                'layered foreground/background',
                'asymmetric negative-space layout',
                'centered hero',
            ];
        } elseif ($aspectRatio === '1:1') {
            $compPool = [
                'centered hero',
                'overhead',
                'macro close-up',
                'diagonal editorial',
                'asymmetric negative-space layout',
                'layered foreground/background',
            ];
        } elseif ($aspectRatio === '4:5') {
            $compPool = [
                'centered hero',
                'diagonal editorial',
                'asymmetric negative-space layout',
                'layered foreground/background',
            ];
        }
        $prioritizedComps = $this->prioritizeByDiversityBudget($compPool, $recentComps, $candidate['composition_type'] ?? null);
        $resolved['composition_type'] = $prioritizedComps[0];

        // 4. Camera viewpoint: canonical registry -> diversity budget cooldown
        $cameraPool = array_keys(self::CAMERA_VIEWPOINTS);
        $prioritizedCameras = $this->prioritizeByDiversityBudget($cameraPool, $recentCameras, $candidate['camera_viewpoint'] ?? null);
        $resolved['camera_viewpoint'] = $prioritizedCameras[0];

        // 5. Lighting profile: canonical registry -> context compatibility -> diversity budget cooldown
        $lightingPool = array_keys(self::LIGHTING_PROFILES);
        if ($isFoodOrBeverage) {
            $lightingPool = [
                'warm morning',
                'golden hour',
                'soft diffused',
                'premium studio',
            ];
        } elseif ($isTechOrOffice) {
            $lightingPool = [
                'premium studio',
                'dramatic side light',
                'soft diffused',
                'moody contrast',
            ];
        }
        $prioritizedLighting = $this->prioritizeByDiversityBudget($lightingPool, $recentLighting, $candidate['lighting_profile'] ?? null);
        $resolved['lighting_profile'] = $prioritizedLighting[0];

        // 6. Prop profile: canonical registry -> industry compatibility -> diversity budget cooldown
        $propPool = array_keys(self::PROP_PROFILES);
        if ($isFoodOrBeverage) {
            $propPool = [
                'refined ceramics & linen textures',
                'raw organic ingredients & botanicals',
                'fresh seasonal foliage & warm stoneware',
                'none / pure zero-prop isolation',
            ];
        } elseif ($isFashionOrApparel) {
            $propPool = [
                'minimal geometry & brass accents',
                'lifestyle accessories & tools of craft',
                'refined ceramics & linen textures',
                'none / pure zero-prop isolation',
            ];
        } elseif ($isBeautyOrPersonalCare) {
            $propPool = [
                'raw organic ingredients & botanicals',
                'minimal geometry & brass accents',
                'fresh seasonal foliage & warm stoneware',
                'none / pure zero-prop isolation',
            ];
        } elseif ($isTechOrOffice) {
            $propPool = [
                'minimal geometry & brass accents',
                'lifestyle accessories & tools of craft',
                'none / pure zero-prop isolation',
            ];
        }
        $prioritizedProps = $this->prioritizeByDiversityBudget($propPool, $recentProps, $candidate['prop_profile'] ?? null);
        $resolved['prop_profile'] = $prioritizedProps[0];

        // 7. Enforce multi-dimensional change: Require intentional change in at least THREE dimensions
        $changedCount = 0;
        foreach (self::PRIMARY_VISUAL_CORE_KEYS as $dimKey) {
            if (($resolved[$dimKey] ?? null) !== ($candidate[$dimKey] ?? null)) {
                $changedCount++;
            }
        }

        if ($changedCount < 3) {
            $dimensionOrder = ['composition_type', 'camera_viewpoint', 'lighting_profile', 'scene_family', 'environment_family', 'prop_profile'];
            foreach ($dimensionOrder as $dim) {
                if ($changedCount >= 3) {
                    break;
                }
                if (($resolved[$dim] ?? null) === ($candidate[$dim] ?? null)) {
                    $pool = match ($dim) {
                        'scene_family' => $prioritizedScenes,
                        'environment_family' => $prioritizedEnvs,
                        'composition_type' => $prioritizedComps,
                        'camera_viewpoint' => $prioritizedCameras,
                        'lighting_profile' => $prioritizedLighting,
                        'prop_profile' => $prioritizedProps,
                    };
                    $alternatives = array_values(array_filter($pool, fn ($item) => $item !== ($candidate[$dim] ?? null)));
                    if (! empty($alternatives)) {
                        $resolved[$dim] = $alternatives[0];
                        $changedCount++;
                    }
                }
            }
        }

        // 8. Final Coherence Validation: Enforce cross-dimensional physical/compositional harmony
        if ($resolved['composition_type'] === 'overhead') {
            $resolved['camera_viewpoint'] = 'overhead';
            if ($resolved['scene_family'] === 'architectural interior setting') {
                $resolved['scene_family'] = 'curated editorial flat-lay';
            }
        } elseif ($resolved['camera_viewpoint'] === 'overhead') {
            $resolved['composition_type'] = 'overhead';
            if ($resolved['scene_family'] === 'architectural interior setting') {
                $resolved['scene_family'] = 'curated editorial flat-lay';
            }
        }

        if ($resolved['composition_type'] === 'macro close-up') {
            $resolved['camera_viewpoint'] = 'macro';
        } elseif ($resolved['camera_viewpoint'] === 'macro') {
            $resolved['composition_type'] = 'macro close-up';
        }

        if ($resolved['composition_type'] === 'environmental wide shot') {
            $resolved['camera_viewpoint'] = 'wide/environmental';
        }

        return $resolved;
    }

    /**
     * Build coherent textual creative direction (concept, strategy, scene prompt)
     * matching the accepted visual core to prevent contradictory instructions.
     *
     * @param  array<string, mixed>  $visualCore
     * @return array{creative_concept: string, visual_strategy: string, scene_prompt: string}
     */
    public function buildCoherentCreativeDirection(
        array $visualCore,
        string $productName,
        ?string $industry = null,
        ?string $category = null,
        ?string $eventName = null
    ): array {
        $scene = $visualCore['scene_family'] ?? 'tabletop still life';
        $env = $visualCore['environment_family'] ?? 'warm artisanal cafe';
        $comp = $visualCore['composition_type'] ?? 'centered hero';
        $camera = $visualCore['camera_viewpoint'] ?? 'front/eye-level';
        $lighting = $visualCore['lighting_profile'] ?? 'soft diffused';
        $props = $visualCore['prop_profile'] ?? 'refined ceramics & linen textures';

        $eventContext = $eventName ? " celebrating {$eventName}" : '';
        $concept = "Authentic {$productName} in {$scene} setting within {$env}{$eventContext}";

        $strategy = "Staged with {$comp} composition from a {$camera} viewpoint, illuminated by {$lighting} lighting in a {$env} environment with {$props}.";

        $scenePrompt = "A professional commercial advertisement showcasing {$productName}{$eventContext}. Staged as a {$scene} within a {$env}. The composition follows a {$comp} layout viewed from a {$camera} angle, bathed in {$lighting} lighting, and tastefully accented with {$props}. Product integrity and authentic commercial presentation are maintained with clean negative space for typography.";

        return [
            'creative_concept' => $concept,
            'visual_strategy' => $strategy,
            'scene_prompt' => $scenePrompt,
        ];
    }

    /**
     * Format recent fingerprints into prompt instructions for the AI Creative Director.
     *
     * @param  array<int, array<string, mixed>>  $recentFingerprints
     */
    public function formatAntiRepetitionGuidance(array $recentFingerprints): string
    {
        if (empty($recentFingerprints)) {
            return '• No previous visual campaigns recorded. Explore an innovative, industry-appropriate creative concept.';
        }

        $lines = [
            'RECENT VISUAL CORE HISTORY (DO NOT REPEAT):',
            'The Primary Visual Core consists of 6 authoritative dimensions: Scene Family, Environment Family, Composition Type, Camera Viewpoint, Lighting Profile, and Prop Profile.',
        ];

        foreach (array_slice($recentFingerprints, 0, 5) as $i => $fp) {
            $num = $i + 1;
            $concept = $fp['creative_concept'] ?? 'Untitled';
            $scene = $fp['scene_family'] ?? 'Standard';
            $env = $fp['environment_family'] ?? 'Standard';
            $comp = $fp['composition_type'] ?? 'Standard';
            $camera = $fp['camera_viewpoint'] ?? 'Standard';
            $lighting = $fp['lighting_profile'] ?? 'Standard';
            $props = $fp['prop_profile'] ?? 'Standard';

            $lines[] = "  {$num}. Concept: \"{$concept}\"\n"
                ."     scene_family=\"{$scene}\"\n"
                ."     environment_family=\"{$env}\"\n"
                ."     composition_type=\"{$comp}\"\n"
                ."     camera_viewpoint=\"{$camera}\"\n"
                ."     lighting_profile=\"{$lighting}\"\n"
                ."     prop_profile=\"{$props}\"";
        }

        $lines[] = '• STRUCTURED DIVERSITY INSTRUCTION:';
        $lines[] = '  Create a genuinely different visual composition from the recent visual core.';
        $lines[] = '  Do NOT reproduce the same:';
        $lines[] = '  - setting';
        $lines[] = '  - spatial arrangement';
        $lines[] = '  - camera viewpoint';
        $lines[] = '  - lighting pattern';
        $lines[] = '  - prop arrangement';
        $lines[] = '  - environmental treatment';
        $lines[] = '  even if the wording, tagline, or theme is different.';
        $lines[] = '• DIVERSITY MANDATE & SIMILARITY-AWARE ANTI-REPETITION RULES (PRIMARY VISUAL CORE):';
        $lines[] = '  1. EXACT MATCH (6/6 dimensions matching any recent generation): PROHIBITED. You MUST NOT reproduce an identical visual core.';
        $lines[] = '  2. NEAR DUPLICATE (5/6 dimensions matching): PROHIBITED / REGENERATE. You MUST NOT reuse a scene where 5 of the 6 core visual dimensions are identical. Candidate will be rejected and regenerated.';
        $lines[] = '  3. SUBSTANTIAL OVERLAP (4/6 dimensions matching): DISCOURAGED. Prefer a materially different alternative when valid commercial options exist.';
        $lines[] = '  4. DISTINCT COMBINATION (0–3/6 matching): ACCEPTABLE. Vary the visual staging while honoring authentic product fidelity.';

        return implode("\n", $lines);
    }
}
