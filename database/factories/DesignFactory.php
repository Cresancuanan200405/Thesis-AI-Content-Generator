<?php

namespace Database\Factories;

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Design>
 */
class DesignFactory extends Factory
{
    protected $model = Design::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'business_id' => Business::factory(),
            'campaign_id' => Campaign::factory(),
            'event_id' => Event::factory(),
            'product_id' => Product::factory(),
            'product_name' => fake()->words(2, true),
            'prompt' => fake()->paragraph(),
            'price' => fake()->randomFloat(2, 10, 200),
            'brand_tone' => fake()->randomElement(['Professional', 'Friendly', 'Luxury', 'Bold', 'Minimal']),
            'visual_theme' => fake()->randomElement(['Modern', 'Festive', 'Premium', 'Clean', 'Vibrant']),
            'tagline' => fake()->catchPhrase(),
            'tagline_mode' => fake()->randomElement(['write', 'generate', 'none']),
            'reference_image_path' => null,
            'generated_image_path' => null,
            'generation_metadata' => ['source' => 'demo'],
            'status' => fake()->randomElement(['pending', 'processing', 'completed', 'failed']),
            'is_favorite' => fake()->boolean(),
        ];
    }
}
