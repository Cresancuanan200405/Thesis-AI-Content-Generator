<?php

namespace App\Services;

use App\Models\Event;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PhilippineHolidayService
{
    private const CACHE_DURATION = 86400 * 30; // 30 days

    private const API_BASE_URL = 'https://date.nager.at/api/v3/PublicHolidays';

    private const COUNTRY_CODE = 'PH';

    private const SOURCE = 'nager-api';

    /**
     * Sync Philippine holidays for a specific year or range of years.
     * Fetches holidays from the Nager.Date API and stores them in the database.
     *
     * @param  int|null  $year  Optional specific year. If null, syncs current year and next year.
     * @return array Returns summary of synced holidays
     */
    public function syncHolidays(?int $year = null): array
    {
        $yearsToSync = $year ? [$year] : [now()->year, now()->year + 1];
        $totalSynced = 0;
        $totalSkipped = 0;
        $errors = [];

        foreach ($yearsToSync as $targetYear) {
            try {
                $holidays = $this->fetchHolidaysFromApi($targetYear);

                foreach ($holidays as $holiday) {
                    if ($this->storeHoliday($holiday)) {
                        $totalSynced++;
                    } else {
                        $totalSkipped++;
                    }
                }

                // Cache the fact that we've synced this year
                Cache::put("ph_holidays_synced_{$targetYear}", true, self::CACHE_DURATION);
            } catch (\Exception $e) {
                $errorMsg = "Error syncing Philippine holidays for year {$targetYear}: {$e->getMessage()}";
                Log::error($errorMsg);
                $errors[] = $errorMsg;
            }
        }

        return [
            'synced' => $totalSynced,
            'skipped' => $totalSkipped,
            'errors' => $errors,
        ];
    }

    /**
     * Fetch holidays from the Nager.Date API for a specific year.
     *
     * @throws \Exception
     */
    private function fetchHolidaysFromApi(int $year): array
    {
        try {
            $response = Http::timeout(10)->get(self::API_BASE_URL.'/'.$year.'/'.self::COUNTRY_CODE);

            if (! $response->successful()) {
                throw new \Exception("API returned status {$response->status()}");
            }

            $holidays = $response->json();

            if (! is_array($holidays)) {
                throw new \Exception('Invalid API response format');
            }

            return array_map(function ($holiday) {
                return $this->normalizeApiResponse($holiday);
            }, $holidays);
        } catch (\Exception $e) {
            Log::error("Failed to fetch Philippine holidays from API: {$e->getMessage()}");
            throw $e;
        }
    }

    /**
     * Normalize API response to application format.
     */
    private function normalizeApiResponse(array $apiHoliday): array
    {
        return [
            'name' => $apiHoliday['name'] ?? '',
            'date' => $apiHoliday['date'] ?? '',
            'type' => $this->mapHolidayType($apiHoliday),
            'description' => $apiHoliday['types'] ? implode(', ', $apiHoliday['types']) : 'Philippine holiday',
            'country' => self::COUNTRY_CODE,
            'source' => self::SOURCE,
        ];
    }

    /**
     * Map API holiday types to our internal event types.
     * Nager.Date returns types like 'Public', 'Observance', etc.
     */
    private function mapHolidayType(array $apiHoliday): string
    {
        $types = $apiHoliday['types'] ?? [];

        // Map specific types to our event types
        if (in_array('Public', $types)) {
            return 'holiday';
        }

        if (in_array('Observance', $types)) {
            return 'seasonal';
        }

        // Default to holiday for any other type
        return 'holiday';
    }

    /**
     * Store a holiday in the database, avoiding duplicates.
     * Uses a unique constraint based on name + date + country.
     *
     * @return bool Returns true if stored, false if already exists
     */
    private function storeHoliday(array $holiday): bool
    {
        try {
            // Try to find existing event
            $existing = Event::query()
                ->where('name', $holiday['name'])
                ->where('date', $holiday['date'])
                ->where('country', $holiday['country'])
                ->first();

            if ($existing) {
                // Update if source is different or fields changed
                if ($existing->source !== self::SOURCE) {
                    $existing->update([
                        'type' => $holiday['type'],
                        'description' => $holiday['description'],
                        'source' => self::SOURCE,
                    ]);
                }

                return false; // Already existed
            }

            // Create new event
            Event::create([
                'name' => $holiday['name'],
                'date' => $holiday['date'],
                'type' => $holiday['type'],
                'description' => $holiday['description'],
                'country' => $holiday['country'],
                'source' => self::SOURCE,
                'is_global' => true,
                'user_id' => null,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error("Failed to store holiday: {$e->getMessage()}", ['holiday' => $holiday]);

            return false;
        }
    }

    /**
     * Get Philippine holidays for a specific year.
     * Returns from cache or fetches from database.
     *
     * @return Collection
     */
    public function getHolidaysForYear(int $year)
    {
        return Event::query()
            ->where('country', self::COUNTRY_CODE)
            ->whereYear('date', $year)
            ->orderBy('date')
            ->get();
    }

    /**
     * Check if holidays have been synced for a specific year.
     */
    public function isYearSynced(int $year): bool
    {
        return Cache::has("ph_holidays_synced_{$year}");
    }

    /**
     * Get or sync holidays for a year (returns from cache if already synced).
     * This is useful for the frontend to ensure a year's holidays are available.
     *
     * @return Collection
     */
    public function ensureYearSynced(int $year)
    {
        if (! $this->isYearSynced($year)) {
            $this->syncHolidays($year);
        }

        return $this->getHolidaysForYear($year);
    }
}
