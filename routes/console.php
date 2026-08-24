<?php

use App\Models\Campaign;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('campaigns:archive-completed', function () {
    $twoDaysAgo = now()->subDays(2);

    $archivedCount = Campaign::query()
        ->where('status', 'completed')
        ->where(function ($q) use ($twoDaysAgo) {
            $q->where('end_date', '<=', $twoDaysAgo->toDateString())
                ->orWhere(function ($sub) use ($twoDaysAgo) {
                    $sub->whereNull('end_date')
                        ->where('updated_at', '<=', $twoDaysAgo);
                })
                ->orWhereHas('event', function ($eventQ) use ($twoDaysAgo) {
                    $eventQ->where('date', '<=', $twoDaysAgo->toDateString());
                });
        })
        ->update(['status' => 'archived']);

    $this->info("Archived {$archivedCount} completed campaigns older than 2 days.");
})->purpose('Automatically archive campaigns for completed events older than 2 days');

Schedule::command('campaigns:archive-completed')->daily();
