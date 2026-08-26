<?php

namespace Database\Seeders;

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use App\Services\PhilippineHolidayService;
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
        $holidayService = app(PhilippineHolidayService::class);
        $year = now()->year;

        foreach ([$year - 1, $year, $year + 1, $year + 2] as $y) {
            $holidayService->ensureYearSynced((int) $y);
        }
    }
}
