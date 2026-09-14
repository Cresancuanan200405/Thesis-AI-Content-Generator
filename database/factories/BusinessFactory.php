<?php

namespace Database\Factories;

use App\Models\Business;
use App\Models\User;
use App\Services\IndustryCategoryArtDirectionService;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Business>
 */
class BusinessFactory extends Factory
{
    protected $model = Business::class;

    public function definition(): array
    {
        $industry = fake()->randomElement(IndustryCategoryArtDirectionService::getIndustries());
        $categories = IndustryCategoryArtDirectionService::getCategoriesForIndustry($industry);
        $category = fake()->randomElement($categories);

        return [
            'user_id' => User::factory(),
            'name' => fake()->company(),
            'industry' => $industry,
            'category' => $category,
            'description' => fake()->paragraph(),
        ];
    }
}
