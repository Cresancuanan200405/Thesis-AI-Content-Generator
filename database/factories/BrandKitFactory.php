<?php

namespace Database\Factories;

use App\Models\BrandKit;
use App\Models\Business;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BrandKit>
 */
class BrandKitFactory extends Factory
{
    protected $model = BrandKit::class;

    public function definition(): array
    {
        return [
            'business_id' => Business::factory(),
            'logo_path' => null,
            'primary_color' => '#111827',
            'secondary_color' => '#F59E0B',
            'accent_color' => '#E5E7EB',
            'brand_tone' => fake()->randomElement(['Professional', 'Friendly', 'Luxury', 'Playful', 'Bold', 'Elegant', 'Minimal', 'Energetic']),
            'typography' => 'Modern Sans',
            'brand_guidelines' => fake()->sentence(),
            'visual_preferences' => json_encode([
                'style' => 'clean',
                'lighting' => 'soft studio light',
            ]),
        ];
    }
}
