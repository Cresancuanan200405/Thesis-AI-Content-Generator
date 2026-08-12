<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Event>
 */
class EventFactory extends Factory
{
    protected $model = Event::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'date' => fake()->dateTimeBetween('now', '+1 year')->format('Y-m-d'),
            'type' => fake()->randomElement(['holiday', 'seasonal', 'commercial', 'custom']),
            'is_global' => false,
        ];
    }

    public function global(): static
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => null,
            'is_global' => true,
        ]);
    }
}
