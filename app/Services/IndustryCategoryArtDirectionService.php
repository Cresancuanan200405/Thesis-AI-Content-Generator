<?php

namespace App\Services;

class IndustryCategoryArtDirectionService
{
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

        // 1. Match Industry & Category
        if (str_contains($normIndustry, 'food') || str_contains($normIndustry, 'beverage') || str_contains($normCategory, 'cafe') || str_contains($normCategory, 'coffee') || str_contains($normCategory, 'restaurant') || str_contains($normCategory, 'bakery')) {
            return $this->resolveFoodAndBeverage($rawIndustry, $rawCategory, $productName, $normCategory);
        }

        if (str_contains($normIndustry, 'beauty') || str_contains($normIndustry, 'wellness') || str_contains($normCategory, 'skincare') || str_contains($normCategory, 'cosmetic') || str_contains($normCategory, 'salon') || str_contains($normCategory, 'spa')) {
            return $this->resolveBeautyAndWellness($rawIndustry, $rawCategory, $productName, $normCategory);
        }

        if (str_contains($normIndustry, 'automotive') || str_contains($normCategory, 'car') || str_contains($normCategory, 'auto') || str_contains($normCategory, 'motorcycle')) {
            return $this->resolveAutomotive($rawIndustry, $rawCategory, $productName, $normCategory);
        }

        if (str_contains($normIndustry, 'tech') || str_contains($normCategory, 'software') || str_contains($normCategory, 'saas') || str_contains($normCategory, 'gadget') || str_contains($normCategory, 'hardware')) {
            return $this->resolveTechnology($rawIndustry, $rawCategory, $productName, $normCategory);
        }

        if (str_contains($normIndustry, 'retail') || str_contains($normCategory, 'clothing') || str_contains($normCategory, 'fashion') || str_contains($normCategory, 'apparel') || str_contains($normCategory, 'store')) {
            return $this->resolveRetailAndFashion($rawIndustry, $rawCategory, $productName, $normCategory);
        }

        if (str_contains($normIndustry, 'real estate') || str_contains($normCategory, 'property') || str_contains($normCategory, 'interior') || str_contains($normCategory, 'home')) {
            return $this->resolveRealEstate($rawIndustry, $rawCategory, $productName, $normCategory);
        }

        if (str_contains($normIndustry, 'travel') || str_contains($normIndustry, 'hospitality') || str_contains($normCategory, 'hotel') || str_contains($normCategory, 'resort') || str_contains($normCategory, 'tour')) {
            return $this->resolveTravelAndHospitality($rawIndustry, $rawCategory, $productName, $normCategory);
        }

        if (str_contains($normIndustry, 'health') || str_contains($normCategory, 'clinic') || str_contains($normCategory, 'medical') || str_contains($normCategory, 'dental') || str_contains($normCategory, 'pharmacy')) {
            return $this->resolveHealthcare($rawIndustry, $rawCategory, $productName, $normCategory);
        }

        if (str_contains($normIndustry, 'fitness') || str_contains($normCategory, 'gym') || str_contains($normCategory, 'workout') || str_contains($normCategory, 'crossfit')) {
            return $this->resolveFitness($rawIndustry, $rawCategory, $productName, $normCategory);
        }

        if (str_contains($normIndustry, 'professional') || str_contains($normIndustry, 'service') || str_contains($normIndustry, 'finance') || str_contains($normCategory, 'consulting') || str_contains($normCategory, 'agency') || str_contains($normCategory, 'legal') || str_contains($normCategory, 'accounting')) {
            return $this->resolveProfessionalServices($rawIndustry, $rawCategory, $productName, $normCategory);
        }

        if (str_contains($normIndustry, 'education') || str_contains($normCategory, 'school') || str_contains($normCategory, 'course') || str_contains($normCategory, 'tutorial')) {
            return $this->resolveEducation($rawIndustry, $rawCategory, $productName, $normCategory);
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
     * Food & Beverage / Café / Restaurant / Bakery Art Direction
     */
    private function resolveFoodAndBeverage(string $industry, string $category, string $productName, string $normCategory): array
    {
        if (str_contains($normCategory, 'coffee') || str_contains($normCategory, 'cafe')) {
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
     * Beauty & Wellness / Skincare / Cosmetics / Salon Art Direction
     */
    private function resolveBeautyAndWellness(string $industry, string $category, string $productName, string $normCategory): array
    {
        if (str_contains($normCategory, 'salon') || str_contains($normCategory, 'hair') || str_contains($normCategory, 'barber')) {
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
     * Automotive / Car Detailing / Dealership Art Direction
     */
    private function resolveAutomotive(string $industry, string $category, string $productName, string $normCategory): array
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
            'commercial_conventions' => 'High-impact automotive advertisement photography emphasizing precision engineering, speed, luxury, and premium automotive aesthetics.',
            'things_to_avoid' => 'Avoid generic used car lots, cluttered license plates, or chaotic junkyard backgrounds.',
        ];
    }

    /**
     * Technology / SaaS / Hardware Art Direction
     */
    private function resolveTechnology(string $industry, string $category, string $productName, string $normCategory): array
    {
        return [
            'industry' => $industry,
            'category' => $category,
            'environment' => 'Futuristic minimalist tech studio, sleek executive workspace, or modern innovation lab.',
            'surfaces' => 'Anodized aerospace aluminum, dark matte obsidian, smoked glass, or clean architectural resin tabletop.',
            'lighting' => 'Precision cool-white studio lighting with subtle ambient blue or cyan edge glow, accentuating crisp geometric product bevels.',
            'props' => "Minimalist wireless accessories, subtle ambient LED lightbar, or clean modern workspace elements in distant soft focus framing {$productName}.",
            'commercial_conventions' => 'Hyper-clean commercial technology photography with pristine lens clarity, zero dust or fingerprints, and sophisticated industrial design emphasis.',
            'things_to_avoid' => 'Do not include tangled cable nests, messy soldering irons, dated beige electronics, or cheesy matrix code overlays.',
        ];
    }

    /**
     * Retail / Fashion & Apparel Art Direction
     */
    private function resolveRetailAndFashion(string $industry, string $category, string $productName, string $normCategory): array
    {
        return [
            'industry' => $industry,
            'category' => $category,
            'environment' => 'High-fashion editorial runway, boutique designer showroom, or sun-drenched architectural lifestyle terrace.',
            'surfaces' => 'Raw linen fabric backdrops, polished terrazzo, pale oak parquet, or minimalist architectural concrete.',
            'lighting' => 'Editorial fashion lighting with sculpted soft daylight, gentle shadow gradation, and rich textile texture illumination.',
            'props' => "Subtle architectural archway, draped raw fabric texture, or minimalist hanger silhouette in background bokeh framing {$productName}.",
            'commercial_conventions' => 'Contemporary fashion lookbook and commercial catalog aesthetics with emphasis on silhouette, weave textures, and garment drape.',
            'things_to_avoid' => 'Avoid messy retail clothes racks, cheap plastic mannequins, wrinkled backdrops, or distracting shopping bag logos.',
        ];
    }

    /**
     * Real Estate & Interior Design Art Direction
     */
    private function resolveRealEstate(string $industry, string $category, string $productName, string $normCategory): array
    {
        return [
            'industry' => $industry,
            'category' => $category,
            'environment' => 'Luxury contemporary interior space, sunlit penthouse living suite, or modern architectural property showcase.',
            'surfaces' => 'Polished hardwood flooring, imported marble feature walls, floor-to-ceiling glass, and designer acoustic paneling.',
            'lighting' => 'Natural expansive architectural sunlight balanced with warm interior ambient fixtures and subtle evening glow.',
            'props' => 'Designer coffee table books, minimalist ceramic vase with pampas grass, and tasteful architectural furniture in soft focus.',
            'commercial_conventions' => 'Professional architectural and interior design photography with straight vertical lines, wide spatial breathing room, and aspirational living appeal.',
            'things_to_avoid' => 'Avoid distorted fisheye perspectives, cluttered personal clutter, dark unlit corners, or messy construction equipment.',
        ];
    }

    /**
     * Travel & Hospitality Art Direction
     */
    private function resolveTravelAndHospitality(string $industry, string $category, string $productName, string $normCategory): array
    {
        return [
            'industry' => $industry,
            'category' => $category,
            'environment' => 'Tropical luxury resort terrace, boutique hotel veranda, or breathtaking scenic destination viewpoint.',
            'surfaces' => 'Sun-bleached teak wood, natural coral stone, woven rattan, or pristine poolside travertine.',
            'lighting' => 'Radiant tropical golden hour sunlight, soft turquoise water reflections, and breezy ambient warmth.',
            'props' => 'Gentle palm leaf silhouette in soft focus, crisp linen resort lounge, or distant ocean horizon providing deep atmospheric perspective.',
            'commercial_conventions' => "Aspirational travel lifestyle photography creating an inviting, relaxing vacation aura that elevates {$productName}.",
            'things_to_avoid' => 'Avoid crowded tourist mobs, tacky souvenir clutter, overcast gloomy skies, or chaotic airport terminals.',
        ];
    }

    /**
     * Healthcare & Clinical Art Direction
     */
    private function resolveHealthcare(string $industry, string $category, string $productName, string $normCategory): array
    {
        return [
            'industry' => $industry,
            'category' => $category,
            'environment' => 'Modern state-of-the-art wellness clinic, pristine medical consultation suite, or premium health studio.',
            'surfaces' => 'Seamless antibacterial matte white composite, frosted tempered glass, polished light oak, or clean ceramic.',
            'lighting' => 'Bright, uplifting high-CRI clinical daylight with clean gentle fill, promoting a sterile, trustworthy, and caring atmosphere.',
            'props' => 'Subtle fresh botanical accent, clean ergonomic clipboard in soft background, or minimalist health laboratory glassware.',
            'commercial_conventions' => 'Clean, trustworthy pharmaceutical and healthcare commercial photography emphasizing safety, wellness, and scientific precision.',
            'things_to_avoid' => 'Avoid intimidating needles, scary surgical tools, blood, dramatic dark shadows, or cluttered medical charts.',
        ];
    }

    /**
     * Fitness & Gym Art Direction
     */
    private function resolveFitness(string $industry, string $category, string $productName, string $normCategory): array
    {
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

    /**
     * Professional & Corporate Services Art Direction
     */
    private function resolveProfessionalServices(string $industry, string $category, string $productName, string $normCategory): array
    {
        return [
            'industry' => $industry,
            'category' => $category,
            'environment' => 'Contemporary executive conference suite, bright creative agency workspace, or modern glass-walled corporate office.',
            'surfaces' => 'Rich walnut executive desk, architectural frosted glass, brushed nickel, or premium matte leather blotter.',
            'lighting' => 'Clean corporate ambient daylight paired with warm architectural desk lighting and soft office depth.',
            'props' => "Minimalist leather notebook, premium pen, or architectural skyline in distant soft-focus bokeh behind {$productName}.",
            'commercial_conventions' => 'Polished corporate B2B commercial photography conveying trust, prestige, strategic clarity, and professional excellence.',
            'things_to_avoid' => 'Avoid messy stacks of paper, generic handshakes, boring cubicle farms, or cheesy corporate clip-art metaphors.',
        ];
    }

    /**
     * Education & Coaching Art Direction
     */
    private function resolveEducation(string $industry, string $category, string $productName, string $normCategory): array
    {
        return [
            'industry' => $industry,
            'category' => $category,
            'environment' => 'Inspiring modern university library, bright interactive workshop studio, or collaborative learning campus lounge.',
            'surfaces' => 'Light Scandinavian birchwood, matte whiteboard glass, acoustic felt, or clean polished laminate tabletop.',
            'lighting' => 'Inviting, natural classroom sunlight promoting focus, optimism, clarity, and intellectual vibrancy.',
            'props' => 'Tastefully curated hardcover books, clean digital tablet, or architectural learning space in gentle soft focus.',
            'commercial_conventions' => 'Inspiring educational commercial photography focusing on growth, discovery, achievement, and accessibility.',
            'things_to_avoid' => 'Avoid dusty old chalkboards, boring exam desks, chaotic student clutter, or dull institutional corridors.',
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
