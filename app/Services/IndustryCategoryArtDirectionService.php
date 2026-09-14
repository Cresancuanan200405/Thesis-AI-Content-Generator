<?php

namespace App\Services;

class IndustryCategoryArtDirectionService
{
    /**
     * Authoritative 12 MSME-Oriented Industry & Category Taxonomy.
     *
     * @var array<string, array<int, string>>
     */
    public const TAXONOMY = [
        'Food & Beverage' => [
            'Restaurant',
            'Café / Coffee Shop',
            'Bakery / Pastry',
            'Catering',
            'Food Products',
            'Beverage Products',
            'Snacks / Desserts',
        ],
        'Retail & E-Commerce' => [
            'General Retail',
            'Online Shop',
            'Specialty Store',
            'Grocery / Convenience',
            'Consumer Products',
        ],
        'Fashion & Apparel' => [
            'Clothing',
            'Footwear',
            'Bags & Accessories',
            'Jewelry / Accessories',
            'Local / Handmade Fashion',
        ],
        'Beauty & Personal Care' => [
            'Skincare',
            'Cosmetics',
            'Hair Salon / Barbershop',
            'Nail / Beauty Services',
            'Personal Care Products',
        ],
        'Home & Lifestyle' => [
            'Furniture',
            'Home Décor',
            'Household Products',
            'Interior / Home Services',
            'Lifestyle Products',
        ],
        'Agriculture & Agribusiness' => [
            'Farm Produce',
            'Organic Products',
            'Coffee / Cacao',
            'Meat / Poultry',
            'Seafood',
            'Agricultural Products',
        ],
        'Arts, Crafts & Creative Services' => [
            'Handmade Crafts',
            'Souvenirs',
            'Gifts',
            'Printing',
            'Photography / Creative Services',
            'Local Artisan Products',
        ],
        'Tourism & Hospitality' => [
            'Hotel / Resort',
            'Homestay',
            'Travel Services',
            'Tour Services',
            'Tourism Attractions',
            'Events / Experiences',
        ],
        'Automotive & Transport Services' => [
            'Auto Repair',
            'Motorcycle Services',
            'Car Wash / Detailing',
            'Auto Parts',
            'Transport Services',
        ],
        'Technology & Digital Services' => [
            'Computer / Electronics Shop',
            'IT Services',
            'Software / Digital Services',
            'Digital Marketing',
            'Technology Services',
        ],
        'Education & Training' => [
            'Tutorial Center',
            'Training Center',
            'Skills Training',
            'Educational Services',
            'Review / Learning Services',
        ],
        'Health, Fitness & Wellness' => [
            'Fitness / Gym',
            'Wellness Services',
            'Massage / Spa',
            'Health Products',
            'Clinic / Health Services',
        ],
    ];

    /**
     * Get list of all supported industry names.
     *
     * @return array<int, string>
     */
    public static function getIndustries(): array
    {
        return array_keys(self::TAXONOMY);
    }

    /**
     * Get categories for a specific industry.
     *
     * @return array<int, string>
     */
    public static function getCategoriesForIndustry(string $industry): array
    {
        return self::TAXONOMY[$industry] ?? [];
    }

    /**
     * Get flat array of all valid categories across all industries.
     *
     * @return array<int, string>
     */
    public static function getAllCategories(): array
    {
        $categories = [];
        foreach (self::TAXONOMY as $cats) {
            $categories = array_merge($categories, $cats);
        }

        return array_values(array_unique($categories));
    }

    /**
     * Validate if an industry and category combination is valid.
     */
    public static function isValidCombination(?string $industry, ?string $category): bool
    {
        if (! $industry || ! $category) {
            return false;
        }

        $categories = self::getCategoriesForIndustry($industry);

        return in_array($category, $categories, true);
    }

    /**
     * Resolve structured visual art direction based on the business industry and category.
     *
     * @return array{
     *     industry: string,
     *     category: string,
     *     environment: string,
     *     surfaces: string,
     *     lighting: string,
     *     props: string,
     *     commercial_conventions: string,
     *     things_to_avoid: string,
     * }
     */
    public function resolveArtDirection(?string $industry, ?string $category, string $productName = 'Product'): array
    {
        $rawIndustry = trim((string) ($industry ?: 'General'));
        $rawCategory = trim((string) ($category ?: 'General'));

        $normIndustry = strtolower($rawIndustry);
        $normCategory = strtolower($rawCategory);

        // 1. Food & Beverage
        if (str_contains($normIndustry, 'food') || str_contains($normIndustry, 'beverage') || str_contains($normCategory, 'cafe') || str_contains($normCategory, 'coffee') || str_contains($normCategory, 'restaurant') || str_contains($normCategory, 'bakery') || str_contains($normCategory, 'pastry') || str_contains($normCategory, 'snack') || str_contains($normCategory, 'dessert') || str_contains($normCategory, 'catering')) {
            return $this->resolveFoodAndBeverage($rawIndustry, $rawCategory, $productName, $normCategory);
        }

        // 2. Fashion & Apparel (matched before Retail to catch clothing/apparel)
        if (str_contains($normIndustry, 'fashion') || str_contains($normIndustry, 'apparel') || str_contains($normCategory, 'clothing') || str_contains($normCategory, 'footwear') || str_contains($normCategory, 'bag') || str_contains($normCategory, 'jewelry') || str_contains($normCategory, 'accessory')) {
            return $this->resolveFashionAndApparel($rawIndustry, $rawCategory, $productName, $normCategory);
        }

        // 3. Retail & E-Commerce
        if (str_contains($normIndustry, 'retail') || str_contains($normIndustry, 'e-commerce') || str_contains($normIndustry, 'ecommerce') || str_contains($normCategory, 'shop') || str_contains($normCategory, 'store') || str_contains($normCategory, 'grocery') || str_contains($normCategory, 'consumer product')) {
            return $this->resolveRetailAndEcommerce($rawIndustry, $rawCategory, $productName, $normCategory);
        }

        // 4. Beauty & Personal Care
        if (str_contains($normIndustry, 'beauty') || str_contains($normIndustry, 'personal care') || str_contains($normCategory, 'skincare') || str_contains($normCategory, 'cosmetic') || str_contains($normCategory, 'salon') || str_contains($normCategory, 'barber') || str_contains($normCategory, 'nail')) {
            return $this->resolveBeautyAndPersonalCare($rawIndustry, $rawCategory, $productName, $normCategory);
        }

        // 5. Home & Lifestyle
        if (str_contains($normIndustry, 'home') || str_contains($normIndustry, 'lifestyle') || str_contains($normCategory, 'furniture') || str_contains($normCategory, 'd&eacute;cor') || str_contains($normCategory, 'decor') || str_contains($normCategory, 'household') || str_contains($normCategory, 'interior')) {
            return $this->resolveHomeAndLifestyle($rawIndustry, $rawCategory, $productName, $normCategory);
        }

        // 6. Agriculture & Agribusiness
        if (str_contains($normIndustry, 'agri') || str_contains($normIndustry, 'farm') || str_contains($normCategory, 'produce') || str_contains($normCategory, 'organic') || str_contains($normCategory, 'cacao') || str_contains($normCategory, 'poultry') || str_contains($normCategory, 'seafood') || str_contains($normCategory, 'meat')) {
            return $this->resolveAgricultureAndAgribusiness($rawIndustry, $rawCategory, $productName, $normCategory);
        }

        // 7. Arts, Crafts & Creative Services
        if (str_contains($normIndustry, 'art') || str_contains($normIndustry, 'craft') || str_contains($normIndustry, 'creative') || str_contains($normCategory, 'handmade') || str_contains($normCategory, 'souvenir') || str_contains($normCategory, 'gift') || str_contains($normCategory, 'printing') || str_contains($normCategory, 'photography') || str_contains($normCategory, 'artisan')) {
            return $this->resolveArtsAndCrafts($rawIndustry, $rawCategory, $productName, $normCategory);
        }

        // 8. Tourism & Hospitality
        if (str_contains($normIndustry, 'tourism') || str_contains($normIndustry, 'hospitality') || str_contains($normIndustry, 'travel') || str_contains($normCategory, 'hotel') || str_contains($normCategory, 'resort') || str_contains($normCategory, 'homestay') || str_contains($normCategory, 'tour') || str_contains($normCategory, 'experience')) {
            return $this->resolveTourismAndHospitality($rawIndustry, $rawCategory, $productName, $normCategory);
        }

        // 9. Automotive & Transport Services
        if (str_contains($normIndustry, 'automotive') || str_contains($normIndustry, 'transport') || str_contains($normCategory, 'car') || str_contains($normCategory, 'auto') || str_contains($normCategory, 'motorcycle') || str_contains($normCategory, 'detailing')) {
            return $this->resolveAutomotiveAndTransport($rawIndustry, $rawCategory, $productName, $normCategory);
        }

        // 10. Technology & Digital Services
        if (str_contains($normIndustry, 'tech') || str_contains($normIndustry, 'digital') || str_contains($normCategory, 'software') || str_contains($normCategory, 'it service') || str_contains($normCategory, 'marketing') || str_contains($normCategory, 'electronics') || str_contains($normCategory, 'computer')) {
            return $this->resolveTechnologyAndDigital($rawIndustry, $rawCategory, $productName, $normCategory);
        }

        // 11. Education & Training
        if (str_contains($normIndustry, 'education') || str_contains($normIndustry, 'training') || str_contains($normCategory, 'tutorial') || str_contains($normCategory, 'learning') || str_contains($normCategory, 'skills') || str_contains($normCategory, 'school') || str_contains($normCategory, 'course')) {
            return $this->resolveEducationAndTraining($rawIndustry, $rawCategory, $productName, $normCategory);
        }

        // 12. Health, Fitness & Wellness
        if (str_contains($normIndustry, 'health') || str_contains($normIndustry, 'fitness') || str_contains($normIndustry, 'wellness') || str_contains($normCategory, 'gym') || str_contains($normCategory, 'clinic') || str_contains($normCategory, 'massage') || str_contains($normCategory, 'spa') || str_contains($normCategory, 'workout')) {
            return $this->resolveHealthFitnessAndWellness($rawIndustry, $rawCategory, $productName, $normCategory);
        }

        return $this->resolveGenericCommerce($rawIndustry, $rawCategory, $productName);
    }

    /**
     * Format the art direction into a structured prompt module string.
     */
    public function formatForPrompt(array $direction, string $productName): string
    {
        $lines = [
            "INDUSTRY & CATEGORY ART DIRECTION: {$direction['industry']} — {$direction['category']}",
            "• Commercial Environment: {$direction['environment']}",
            "• Contextual Surfaces & Materials: {$direction['surfaces']}",
            "• Commercial Lighting Direction: {$direction['lighting']}",
            "• Restrained Supporting Props: {$direction['props']}",
            "• Commercial Photography Standards: {$direction['commercial_conventions']}",
            "• Things to Avoid: {$direction['things_to_avoid']}",
            "• Hierarchy & Subordination: Industry and category staging must elevate {$productName} as the undisputed hero; background staging and props must remain strictly subordinate to the product and explicit user scene direction.",
        ];

        return implode("\n", $lines);
    }

    /**
     * 1. Food & Beverage Art Direction
     */
    private function resolveFoodAndBeverage(string $industry, string $category, string $productName, string $normCategory): array
    {
        if (str_contains($normCategory, 'coffee') || str_contains($normCategory, 'caf')) {
            return [
                'industry' => $industry,
                'category' => $category,
                'environment' => 'Artisanal specialty café counter, sunlit coffeehouse seating, or polished commercial coffee bar setting.',
                'surfaces' => 'Warm rustic natural wood, polished terrazzo, white marble countertop, or textured concrete with clean moisture mats.',
                'lighting' => 'Warm golden sunlight through expansive cafe windows, soft directional fill, gentle ambient backlighting highlighting liquid translucency or steam.',
                'props' => "Subtle cafe touches such as a ceramic saucer, linen napkin, glass water tumbler, or minimalist coffee menu in soft background bokeh, keeping {$productName} centered.",
                'commercial_conventions' => "Appetizing commercial beverage/food photography with shallow depth of field, crisp condensation/steam highlights, and authentic culinary styling around {$productName}.",
                'things_to_avoid' => 'Do not clutter the scene with excessive loose beans, industrial machinery, noisy background patrons, or messy countertops.',
            ];
        }

        if (str_contains($normCategory, 'bakery') || str_contains($normCategory, 'pastry')) {
            return [
                'industry' => $industry,
                'category' => $category,
                'environment' => 'Charming artisan bakery display, warm pastry atelier, or boutique patisserie countertop.',
                'surfaces' => 'Floured butcher block wood, French bakery marble, clean parchment paper, or matte ceramic platters.',
                'lighting' => 'Warm, golden-hour bakery glow, soft diffused daylight emphasizing golden-brown crust textures and delicate pastry layers.',
                'props' => "Minimalist baker's paddle in soft focus, elegant pastry tongs, or delicate glass dome display in the soft background, keeping {$productName} crisp.",
                'commercial_conventions' => "Sensory food photography focusing on flaky crust textures, golden glaze sheen, and warm inviting freshness of {$productName}.",
                'things_to_avoid' => 'Do not render messy flour explosions, chaotic kitchen utensils, or crowded displays that detract from the featured product.',
            ];
        }

        return [
            'industry' => $industry,
            'category' => $category,
            'environment' => 'Upscale culinary dining table, modern bistro counter, or commercial gourmet studio tabletop.',
            'surfaces' => 'Polished slate, dark stained walnut, smooth ceramic tableware, or clean contemporary marble.',
            'lighting' => 'Refined three-point culinary lighting with warm key light, soft edge highlights, and subtle rim glow to accentuate food texture and freshness.',
            'props' => "Complementary tableware, modern cutlery, subtle fresh herb sprig or garnish, and soft background dining atmosphere framing {$productName}.",
            'commercial_conventions' => "Professional food advertising photography with natural glistening surfaces, rich appetizing colors, and crisp focal precision on {$productName}.",
            'things_to_avoid' => 'Avoid unappetizing harsh flash, greasy highlights, messy spilled sauces, or crowded plates.',
        ];
    }

    /**
     * 2. Retail & E-Commerce Art Direction
     */
    private function resolveRetailAndEcommerce(string $industry, string $category, string $productName, string $normCategory): array
    {
        return [
            'industry' => $industry,
            'category' => $category,
            'environment' => 'Modern commercial retail showroom, curated storefront display, or high-end e-commerce product staging studio.',
            'surfaces' => 'Clean architectural plinths, polished concrete, light Scandinavian oak, or smooth matte acrylic display blocks.',
            'lighting' => 'Crisp balanced commercial studio lighting with soft diffused key light, precise fill, and subtle ground-level contact shadows.',
            'props' => "Minimal geometric display pedestals, subtle premium packaging accents, or clean architectural partitions framing {$productName}.",
            'commercial_conventions' => "High-conversion e-commerce and retail merchandising photography with razor-sharp product edge definition, true-to-life colors, and spacious commercial composition around {$productName}.",
            'things_to_avoid' => 'Avoid barcode stickers, cluttered clearance bins, generic shopping cart icons, or distracting commercial signage.',
        ];
    }

    /**
     * 3. Fashion & Apparel Art Direction
     */
    private function resolveFashionAndApparel(string $industry, string $category, string $productName, string $normCategory): array
    {
        return [
            'industry' => $industry,
            'category' => $category,
            'environment' => 'High-fashion editorial studio, boutique designer showroom, or sun-drenched architectural lifestyle terrace.',
            'surfaces' => 'Raw linen fabric backdrops, polished terrazzo, pale oak parquet, or minimalist architectural concrete.',
            'lighting' => 'Editorial fashion lighting with sculpted soft daylight, gentle shadow gradation, and rich textile texture illumination.',
            'props' => "Subtle architectural archway, draped raw fabric texture, or minimalist hanger silhouette in background bokeh framing {$productName}.",
            'commercial_conventions' => "Contemporary fashion lookbook and commercial catalog aesthetics with emphasis on silhouette, weave textures, garment drape, and luxury craftsmanship for {$productName}.",
            'things_to_avoid' => 'Avoid messy retail clothes racks, cheap plastic mannequins, wrinkled backdrops, or distracting shopping bag logos.',
        ];
    }

    /**
     * 4. Beauty & Personal Care Art Direction
     */
    private function resolveBeautyAndPersonalCare(string $industry, string $category, string $productName, string $normCategory): array
    {
        if (str_contains($normCategory, 'salon') || str_contains($normCategory, 'hair') || str_contains($normCategory, 'barber') || str_contains($normCategory, 'nail')) {
            return [
                'industry' => $industry,
                'category' => $category,
                'environment' => 'Chic minimalist salon station, luxury grooming vanity, or boutique styling lounge.',
                'surfaces' => 'Brushed chrome, sleek frosted glass, polished black granite, or clean illuminated mirror ledge.',
                'lighting' => 'Flattering diffused beauty lighting with soft ring-light glow, balanced daylight, and crisp reflections on packaging.',
                'props' => "Subtle salon styling accessories in distant bokeh (e.g. premium shears, textured salon towel, delicate plant stem), keeping {$productName} dominant.",
                'commercial_conventions' => 'High-end beauty editorial photography with clean glossy reflections, sharp packaging contours, and flawless grooming elegance.',
                'things_to_avoid' => 'Avoid messy stray hair clippings, cluttered salon chairs, harsh fluorescent tubes, or chaotic vanity trays.',
            ];
        }

        return [
            'industry' => $industry,
            'category' => $category,
            'environment' => 'Pristine luxury skincare vanity, serene spa sanctuary, or high-end cosmetic studio podium.',
            'surfaces' => 'Honed travertine stone, clean rippling water surface, satin acrylic pedestal, or soft frosted glass.',
            'lighting' => 'High-key luminous beauty lighting, gentle softbox diffusion, subtle prism refractions, and elegant translucent edge highlights.',
            'props' => "Minimalist botanical element (e.g., single eucalyptus leaf, dew droplet, gentle water ripple, or organic stone pedestal) framing {$productName}.",
            'commercial_conventions' => 'Premium cosmetic and skincare advertising photography with immaculate reflections, silky textures, and pristine product purity.',
            'things_to_avoid' => 'Avoid cluttered makeup kits, dirty powder smudges, heavy chaotic props, or distracting background colors.',
        ];
    }

    /**
     * 5. Home & Lifestyle Art Direction
     */
    private function resolveHomeAndLifestyle(string $industry, string $category, string $productName, string $normCategory): array
    {
        return [
            'industry' => $industry,
            'category' => $category,
            'environment' => 'Sunlit modern interior living space, contemporary minimalist home setting, or curated lifestyle interior suite.',
            'surfaces' => 'Natural hardwood flooring, honed marble tabletop, linen-textured surfaces, and warm architectural wood panels.',
            'lighting' => 'Expansive natural window daylight balanced with soft ambient warm interior lighting, creating an inviting, aspirational atmosphere.',
            'props' => "Tasteful minimalist home accents (e.g. ceramic vase, leafy indoor plant in soft focus, designer coffee table book) framing {$productName}.",
            'commercial_conventions' => "Sophisticated home and lifestyle advertising photography emphasizing comfort, functional beauty, organic materials, and refined interior harmony around {$productName}.",
            'things_to_avoid' => 'Avoid messy domestic clutter, unmade beds, chaotic wires, or dark uninviting rooms.',
        ];
    }

    /**
     * 6. Agriculture & Agribusiness Art Direction
     */
    private function resolveAgricultureAndAgribusiness(string $industry, string $category, string $productName, string $normCategory): array
    {
        return [
            'industry' => $industry,
            'category' => $category,
            'environment' => 'Sun-drenched organic farm landscape, lush fertile orchard terrace, or artisanal farm-to-table wooden harvest table.',
            'surfaces' => 'Weathered rustic cedar wood, rich earthy stone, natural jute sackcloth, or sun-warmed slate.',
            'lighting' => 'Radiant golden-hour agricultural sunlight with natural sun flare, luminous backlight on fresh leaves, and crisp organic textures.',
            'props' => "Subtle fresh botanical vines, natural woven harvest basket, or lush green farm rows in distant soft-focus bokeh, highlighting {$productName}.",
            'commercial_conventions' => "Wholesome, premium agricultural and agribusiness photography emphasizing farm-fresh authenticity, organic purity, harvest vitality, and sustainable commercial craftsmanship for {$productName}.",
            'things_to_avoid' => 'Avoid industrial heavy machinery clutter, muddy grime, pest damage, withered produce, or artificial synthetic props.',
        ];
    }

    /**
     * 7. Arts, Crafts & Creative Services Art Direction
     */
    private function resolveArtsAndCrafts(string $industry, string $category, string $productName, string $normCategory): array
    {
        return [
            'industry' => $industry,
            'category' => $category,
            'environment' => 'Sunlit artisan workshop atelier, boutique craft studio, or creative designer workbench.',
            'surfaces' => 'Warm butcher-block workbench, raw canvas fabric, handmade textured ceramic, or natural kraft paper.',
            'lighting' => 'Soft, natural studio window daylight with gentle directional modeling, illuminating delicate handmade details and handcrafted textures.',
            'props' => "Curated artisan tools in distant soft bokeh (e.g. ceramic carving rib, fine paint brush, linen thread spool), keeping {$productName} centered.",
            'commercial_conventions' => "Authentic artisan commercial photography showcasing tactile craftsmanship, bespoke handmade uniqueness, local creative heritage, and impeccable attention to detail for {$productName}.",
            'things_to_avoid' => 'Avoid messy chaotic studio trash, spilled paint blobs, cluttered toolboxes, or cheap plastic novelty items.',
        ];
    }

    /**
     * 8. Tourism & Hospitality Art Direction
     */
    private function resolveTourismAndHospitality(string $industry, string $category, string $productName, string $normCategory): array
    {
        return [
            'industry' => $industry,
            'category' => $category,
            'environment' => 'Tropical luxury boutique resort veranda, scenic destination terrace, or warm welcoming homestay patio.',
            'surfaces' => 'Sun-bleached teak wood, natural coral stone, woven rattan, or pristine poolside travertine.',
            'lighting' => 'Radiant tropical golden hour sunlight, soft turquoise water reflections, and breezy ambient warmth.',
            'props' => "Gentle palm leaf silhouette in soft focus, crisp linen resort lounge, or distant ocean/mountain horizon providing deep atmospheric perspective framing {$productName}.",
            'commercial_conventions' => "Aspirational travel and hospitality lifestyle photography creating an inviting, relaxing vacation aura that elevates {$productName}.",
            'things_to_avoid' => 'Avoid crowded tourist mobs, tacky souvenir clutter, overcast gloomy skies, or chaotic transport terminals.',
        ];
    }

    /**
     * 9. Automotive & Transport Services Art Direction
     */
    private function resolveAutomotiveAndTransport(string $industry, string $category, string $productName, string $normCategory): array
    {
        if (str_contains($normCategory, 'detail') || str_contains($normCategory, 'wash')) {
            return [
                'industry' => $industry,
                'category' => $category,
                'environment' => 'High-end automotive detailing bay, pristine ceramic coating studio, or luxury garage showroom.',
                'surfaces' => 'High-gloss epoxy showroom floor with honeycomb ceiling reflections, polished automotive clear-coat, or textured carbon fiber.',
                'lighting' => 'Sleek overhead LED strip lighting creating crisp linear reflections along vehicle curves, with cool ambient fill and precise product highlights.',
                'props' => "Hydrophobic water beading, clean microfiber texture, or professional detailing buffer in soft background bokeh behind {$productName}.",
                'commercial_conventions' => 'Dynamic automotive commercial photography with razor-sharp specular highlights, ultra-clean reflective surfaces, and powerful technical craft.',
                'things_to_avoid' => 'Do not show dirty puddles, rusty tools, oily grease stains, or chaotic workshop clutter.',
            ];
        }

        return [
            'industry' => $industry,
            'category' => $category,
            'environment' => 'Modern architectural automotive showroom, premium vehicle delivery suite, or dramatic open scenic highway setting.',
            'surfaces' => 'Polished concrete, dark asphalt, brushed aluminium, or architectural glass and steel.',
            'lighting' => 'Dramatic commercial automotive lighting with long linear softbox reflections, subtle rim lights, and high-contrast tonal depth.',
            'props' => "Sleek automotive design lines, distant showroom architecture, or clean metallic accents that complement {$productName}.",
            'commercial_conventions' => 'High-impact automotive advertisement photography emphasizing precision engineering, reliability, speed, and premium automotive aesthetics.',
            'things_to_avoid' => 'Avoid generic used car lots, cluttered license plates, rusty junk, or chaotic junkyard backgrounds.',
        ];
    }

    /**
     * 10. Technology & Digital Services Art Direction
     */
    private function resolveTechnologyAndDigital(string $industry, string $category, string $productName, string $normCategory): array
    {
        return [
            'industry' => $industry,
            'category' => $category,
            'environment' => 'Futuristic minimalist tech studio, sleek executive digital workspace, or modern innovation lab.',
            'surfaces' => 'Anodized aerospace aluminum, dark matte obsidian, smoked glass, or clean architectural resin tabletop.',
            'lighting' => 'Precision cool-white studio lighting with subtle ambient blue or cyan edge glow, accentuating crisp geometric product bevels.',
            'props' => "Minimalist wireless accessories, subtle ambient LED lightbar, or clean modern workspace elements in distant soft focus framing {$productName}.",
            'commercial_conventions' => 'Hyper-clean commercial technology photography with pristine lens clarity, zero dust or fingerprints, and sophisticated industrial design emphasis.',
            'things_to_avoid' => 'Do not include tangled cable nests, messy soldering irons, dated beige electronics, or cheesy matrix code overlays.',
        ];
    }

    /**
     * 11. Education & Training Art Direction
     */
    private function resolveEducationAndTraining(string $industry, string $category, string $productName, string $normCategory): array
    {
        return [
            'industry' => $industry,
            'category' => $category,
            'environment' => 'Inspiring modern learning library, bright interactive training studio, or collaborative campus workshop space.',
            'surfaces' => 'Light Scandinavian birchwood, matte whiteboard glass, acoustic felt, or clean polished laminate tabletop.',
            'lighting' => 'Inviting, natural classroom sunlight promoting focus, optimism, clarity, and intellectual vibrancy.',
            'props' => "Tastefully curated hardcover books, clean digital tablet, or architectural learning space in gentle soft focus framing {$productName}.",
            'commercial_conventions' => 'Inspiring educational commercial photography focusing on skills growth, discovery, achievement, clarity, and accessibility.',
            'things_to_avoid' => 'Avoid dusty old chalkboards, boring exam desks, chaotic student clutter, or dull institutional corridors.',
        ];
    }

    /**
     * 12. Health, Fitness & Wellness Art Direction
     */
    private function resolveHealthFitnessAndWellness(string $industry, string $category, string $productName, string $normCategory): array
    {
        if (str_contains($normCategory, 'fitness') || str_contains($normCategory, 'gym')) {
            return [
                'industry' => $industry,
                'category' => $category,
                'environment' => 'High-performance athletic training facility, boutique fitness studio, or modern wellness gym.',
                'surfaces' => 'Durable rubber gym flooring, matte black powder-coated steel, clean gym turf, or industrial concrete wall.',
                'lighting' => 'High-energy directional athletic lighting with dramatic side-rim lights, bold contrast, and crisp product isolation.',
                'props' => "Subtle matte dumbbell silhouette, clean athletic towel, or textured gym floor in soft peripheral focus framing {$productName}.",
                'commercial_conventions' => 'Dynamic fitness commercial photography emphasizing motivation, performance, physical vitality, and premium athletic craft.',
                'things_to_avoid' => 'Avoid messy sweaty gym benches, broken equipment, dark dingy basements, or cluttered weight racks.',
            ];
        }

        if (str_contains($normCategory, 'spa') || str_contains($normCategory, 'massage') || str_contains($normCategory, 'wellness')) {
            return [
                'industry' => $industry,
                'category' => $category,
                'environment' => 'Tranquil luxury wellness spa sanctuary, aromatherapy suite, or serene relaxation haven.',
                'surfaces' => 'Honed river stone, warm bamboo, clean white ceramic, or soft linen decking.',
                'lighting' => 'Gentle warm candle-glow ambient light paired with soft diffused natural daylight, creating serene tranquility.',
                'props' => "Subtle smooth basalt stones, delicate orchid blossom, or aromatic diffuser in soft background bokeh framing {$productName}.",
                'commercial_conventions' => 'Serene wellness and spa commercial photography conveying deep relaxation, balance, rejuvenation, and holistic self-care.',
                'things_to_avoid' => 'Avoid harsh fluorescent lights, cluttered chemical bottles, dark dingy rooms, or sterile hospital vibes.',
            ];
        }

        return [
            'industry' => $industry,
            'category' => $category,
            'environment' => 'Modern state-of-the-art wellness clinic, pristine health consultation suite, or premium wellness studio.',
            'surfaces' => 'Seamless antibacterial matte white composite, frosted tempered glass, polished light oak, or clean ceramic.',
            'lighting' => 'Bright, uplifting high-CRI clinical daylight with clean gentle fill, promoting a trustworthy and caring atmosphere.',
            'props' => "Subtle fresh botanical accent, clean ergonomic clipboard in soft background, or minimalist health laboratory glassware framing {$productName}.",
            'commercial_conventions' => 'Clean, trustworthy healthcare and wellness commercial photography emphasizing safety, vitality, and professional precision.',
            'things_to_avoid' => 'Avoid intimidating needles, scary surgical tools, blood, dramatic dark shadows, or cluttered medical charts.',
        ];
    }

    /**
     * Generic / Fallback Commercial Commerce Art Direction
     */
    private function resolveGenericCommerce(string $industry, string $category, string $productName): array
    {
        return [
            'industry' => $industry,
            'category' => $category,
            'environment' => "Polished commercial studio setting tailored for {$industry} ({$category}) retail and commercial advertising.",
            'surfaces' => 'Smooth neutral studio tabletop, textured stone pedestal, or clean architectural presentation surface.',
            'lighting' => 'Controlled professional three-point commercial studio lighting with balanced key light, soft fill, and crisp edge separation.',
            'props' => "Subtle contextual framing elements that harmoniously complement {$productName} without distracting from the centerpiece.",
            'commercial_conventions' => 'Pristine commercial advertising photography with crisp focal separation, authentic material rendering, and generous negative space.',
            'things_to_avoid' => 'Avoid random unrelated props, cluttered backgrounds, harsh uncalibrated lighting, or distracting artifacts.',
        ];
    }
}
