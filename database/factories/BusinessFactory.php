<?php

namespace Database\Factories;

use App\Models\Business;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Business>
 */
class BusinessFactory extends Factory
{
    protected $model = Business::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->company(),
            'industry' => fake()->randomElement(['Retail', 'Hospitality', 'Fashion', 'Food & Beverage', 'Technology', 'Wellness']),
            'category' => fake()->randomElement(['Boutique', 'E-commerce', 'Service Business', 'Brand Studio', 'Local Store', 'Professional Service']),
            'description' => fake()->paragraph(),
        ];
    }
}
