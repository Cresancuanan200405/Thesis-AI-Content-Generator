<?php

namespace Database\Seeders;

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->seedGlobalEvents();

        $user = User::factory()->create([
            'name' => 'Demo User',
            'email' => 'demo@example.com',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
        ]);

        $business = Business::factory()->create([
            'user_id' => $user->id,
            'name' => 'Northstar Studio',
            'industry' => 'Retail',
            'category' => 'E-commerce',
            'description' => 'A boutique lifestyle brand creating premium everyday essentials for modern homes.',
        ]);

        Product::factory()->count(3)->create([
            'business_id' => $business->id,
        ]);

        $event = Event::factory()->create([
            'user_id' => $user->id,
            'name' => 'Holiday Launch Campaign',
            'description' => 'A seasonal campaign for premium product drops.',
            'date' => now()->addMonths(2)->toDateString(),
            'type' => 'custom',
            'is_global' => false,
        ]);

        $campaign = Campaign::factory()->create([
            'user_id' => $user->id,
            'business_id' => $business->id,
            'event_id' => $event->id,
            'name' => 'Seasonal Launch',
            'status' => 'active',
        ]);

        Design::factory()->count(2)->create([
            'user_id' => $user->id,
            'business_id' => $business->id,
            'campaign_id' => $campaign->id,
            'event_id' => $event->id,
            'status' => 'completed',
            'is_favorite' => true,
        ]);
    }

    protected function seedGlobalEvents(): void
    {
        $eventDefinitions = [
            ['New Year', 'holiday', '01-01'],
            ['Valentine\'s Day', 'holiday', '02-14'],
            ['Chinese New Year', 'holiday', '01-29'],
            ["International Women's Day", 'holiday', '03-08'],
            ['Easter', 'holiday', '04-20'],
            ["Mother's Day", 'holiday', '05-11'],
            ["Father's Day", 'holiday', '06-15'],
            ['Halloween', 'holiday', '10-31'],
            ['Black Friday', 'commercial', '11-28'],
            ['Cyber Monday', 'commercial', '12-02'],
            ['Christmas', 'holiday', '12-25'],
        ];

        $year = now()->year;

        foreach ($eventDefinitions as [$name, $type, $dateString]) {
            Event::query()->firstOrCreate(
                [
                    'name' => $name,
                    'date' => sprintf('%s-%s', $year, $dateString),
                    'type' => $type,
                    'is_global' => true,
                ],
                [
                    'user_id' => null,
                    'description' => 'Global marketing opportunity for seasonal and promotional content.',
                ],
            );
        }
    }
}
