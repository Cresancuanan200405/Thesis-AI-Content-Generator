<?php

namespace Database\Factories;

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Event;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Campaign>
 */
class CampaignFactory extends Factory
{
    protected $model = Campaign::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'business_id' => Business::factory(),
            'event_id' => Event::factory(),
            'name' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'start_date' => fake()->dateTimeBetween('now', '+2 months')->format('Y-m-d'),
            'end_date' => fake()->dateTimeBetween('+3 months', '+6 months')->format('Y-m-d'),
            'status' => fake()->randomElement(['draft', 'scheduled', 'active', 'completed']),
        ];
    }
}
