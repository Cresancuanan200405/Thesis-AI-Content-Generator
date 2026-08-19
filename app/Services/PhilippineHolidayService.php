<?php

namespace App\Services;

use App\Models\Event;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class PhilippineHolidayService
{
    private const CACHE_DURATION = 86400 * 30; // 30 days

    private const COUNTRY_CODE = 'PH';

    private const SOURCE = 'official-ph-holidays';

    /**
     * Sync Philippine holidays for a specific year or range of years.
     * Generates official Philippine National Holidays across all 5 classifications:
     * 1. Regular Holidays
     * 2. Special Non-Working Holidays
     * 3. Special Working Holidays
     * 4. Islamic Holidays (Movable Dates)
     * 5. Shifted Dates & Long Weekend Metadata
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
                $holidays = $this->generateOfficialPhilippineHolidays($targetYear);

                foreach ($holidays as $holiday) {
                    if ($this->storeHoliday($holiday)) {
                        $totalSynced++;
                    } else {
                        $totalSkipped++;
                    }
                }

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
     * Generate complete list of Philippine official holidays with rich metadata for a given year.
     */
    public function generateOfficialPhilippineHolidays(int $year): array
    {
        $holidays = [];

        // ---------------------------------------------------------------------
        // 1. REGULAR HOLIDAYS (Labor Code / Republic Acts)
        // 100% standard pay if unworked, 200% premium if worked
        // ---------------------------------------------------------------------

        // New Year's Day (Jan 1)
        $holidays[] = $this->createHolidayItem(
            name: "New Year's Day (Araw ng Bagong Taon)",
            date: "{$year}-01-01",
            category: 'regular',
            type: 'holiday',
            description: 'Nationwide regular public holiday celebrating the start of the year. Essential retail and New Year promotional period.',
            proclamationNo: 'Proclamation No. 727, s. 2024 / RA 9492'
        );

        // Araw ng Kagitingan / Day of Valor (Apr 9)
        $holidays[] = $this->createHolidayItem(
            name: 'Araw ng Kagitingan (Day of Valor)',
            date: "{$year}-04-09",
            category: 'regular',
            type: 'holiday',
            description: 'National regular holiday commemorating the Fall of Bataan and the heroism of Filipino and American soldiers in WWII.',
            proclamationNo: 'Proclamation No. 727 / Executive Order 203'
        );

        // Movable Easter Holy Week dates
        $easterDate = $this->getEasterSunday($year);
        $maundyThursday = $easterDate->copy()->subDays(3);
        $goodFriday = $easterDate->copy()->subDays(2);
        $blackSaturday = $easterDate->copy()->subDays(1);

        // Maundy Thursday (Huwebes Santo)
        $holidays[] = $this->createHolidayItem(
            name: 'Maundy Thursday (Huwebes Santo)',
            date: $maundyThursday->toDateString(),
            category: 'regular',
            type: 'holiday',
            description: 'Holy Week regular holiday observed nationwide. Part of the annual nationwide 4-day Holy Week long weekend.',
            proclamationNo: 'Proclamation No. 727 / Republic Act 9492',
            isLongWeekend: true,
            longWeekendDetails: "4-Day Super Long Weekend ({$maundyThursday->format('M j')} - {$easterDate->format('M j')})"
        );

        // Good Friday (Biyernes Santo)
        $holidays[] = $this->createHolidayItem(
            name: 'Good Friday (Biyernes Santo)',
            date: $goodFriday->toDateString(),
            category: 'regular',
            type: 'holiday',
            description: 'Solemn Holy Week regular public holiday observed across the Philippines.',
            proclamationNo: 'Proclamation No. 727 / Republic Act 9492',
            isLongWeekend: true,
            longWeekendDetails: "4-Day Super Long Weekend ({$maundyThursday->format('M j')} - {$easterDate->format('M j')})"
        );

        // Labor Day (May 1)
        $holidays[] = $this->createHolidayItem(
            name: 'Labor Day (Araw ng Paggawa)',
            date: "{$year}-05-01",
            category: 'regular',
            type: 'holiday',
            description: 'Regular national holiday honoring Filipino workers and labor contributions. Key date for Labor Day sales campaigns.',
            proclamationNo: 'Proclamation No. 727 / RA 9492'
        );

        // Independence Day (Jun 12)
        $holidays[] = $this->createHolidayItem(
            name: 'Independence Day (Araw ng Kasarinlan)',
            date: "{$year}-06-12",
            category: 'regular',
            type: 'holiday',
            description: 'National holiday commemorating Philippine Independence from Spanish colonial rule on June 12, 1898.',
            proclamationNo: 'Proclamation No. 727 / RA 4166'
        );

        // National Heroes Day (Last Monday of August)
        $heroesDay = (new Carbon("last monday of august {$year}"))->toDateString();
        $holidays[] = $this->createHolidayItem(
            name: 'National Heroes Day (Araw ng mga Bayani)',
            date: $heroesDay,
            category: 'regular',
            type: 'holiday',
            description: 'Regular holiday honoring all Philippine national heroes, celebrated on the last Monday of August forming a 3-day weekend.',
            proclamationNo: 'Proclamation No. 727 / RA 9492',
            isLongWeekend: true,
            longWeekendDetails: '3-Day Long Weekend (Saturday - Monday)'
        );

        // Bonifacio Day (Nov 30)
        $holidays[] = $this->createHolidayItem(
            name: 'Bonifacio Day',
            date: "{$year}-11-30",
            category: 'regular',
            type: 'holiday',
            description: 'National regular holiday honoring Gat Andres Bonifacio, leader of the Katipunan revolution and national hero.',
            proclamationNo: 'Proclamation No. 727 / Act No. 2946'
        );

        // Christmas Day (Dec 25)
        $holidays[] = $this->createHolidayItem(
            name: 'Christmas Day (Araw ng Pasko)',
            date: "{$year}-12-25",
            category: 'regular',
            type: 'holiday',
            description: 'Peak nationwide holiday celebrating Christmas. The largest shopping, gifting, and marketing season in the Philippines.',
            proclamationNo: 'Proclamation No. 727 / RA 9492'
        );

        // Rizal Day (Dec 30)
        $holidays[] = $this->createHolidayItem(
            name: 'Rizal Day',
            date: "{$year}-12-30",
            category: 'regular',
            type: 'holiday',
            description: 'National regular holiday commemorating the martyrdom of Philippine national hero Dr. Jose Rizal.',
            proclamationNo: 'Proclamation No. 727 / RA 9492'
        );

        // ---------------------------------------------------------------------
        // 2. SPECIAL NON-WORKING HOLIDAYS
        // No work, no pay unless worked (+30% premium pay)
        // ---------------------------------------------------------------------

        // Chinese New Year (Spring Festival)
        $cnyDate = $this->getChineseNewYearDate($year);
        $holidays[] = $this->createHolidayItem(
            name: 'Chinese New Year (Spring Festival)',
            date: $cnyDate,
            category: 'special_non_working',
            type: 'holiday',
            description: 'Special non-working day celebrating the Lunar New Year and Filipino-Chinese cultural heritage.',
            proclamationNo: 'Proclamation No. 727, s. 2024'
        );

        // Black Saturday (Sabado de Gloria)
        $holidays[] = $this->createHolidayItem(
            name: 'Black Saturday (Sabado de Gloria)',
            date: $blackSaturday->toDateString(),
            category: 'special_non_working',
            type: 'holiday',
            description: 'Holy Week special non-working holiday between Good Friday and Easter Sunday.',
            proclamationNo: 'Proclamation No. 727 / RA 9492',
            isLongWeekend: true,
            longWeekendDetails: "4-Day Super Long Weekend ({$maundyThursday->format('M j')} - {$easterDate->format('M j')})"
        );

        // Ninoy Aquino Day (Aug 21)
        $holidays[] = $this->createHolidayItem(
            name: 'Ninoy Aquino Day',
            date: "{$year}-08-21",
            category: 'special_non_working',
            type: 'holiday',
            description: 'Special non-working holiday commemorating the assassination of Senator Benigno "Ninoy" Aquino Jr.',
            proclamationNo: 'Proclamation No. 727 / RA 9256'
        );

        // All Saints' Day (Nov 1 - Undas)
        $holidays[] = $this->createHolidayItem(
            name: "All Saints' Day (Undas)",
            date: "{$year}-11-01",
            category: 'special_non_working',
            type: 'holiday',
            description: 'Special non-working day observed nationwide for honoring departed loved ones and family gatherings.',
            proclamationNo: 'Proclamation No. 727'
        );

        // All Souls' Day (Nov 2)
        $holidays[] = $this->createHolidayItem(
            name: "All Souls' Day (Additional Special Non-Working Day)",
            date: "{$year}-11-02",
            category: 'special_non_working',
            type: 'holiday',
            description: 'Additional special non-working day declared to bolster domestic tourism and family traditions.',
            proclamationNo: 'Proclamation No. 727'
        );

        // Feast of the Immaculate Conception (Dec 8)
        $holidays[] = $this->createHolidayItem(
            name: 'Feast of the Immaculate Conception of Mary',
            date: "{$year}-12-08",
            category: 'special_non_working',
            type: 'holiday',
            description: 'Special non-working holiday honoring the Principal Patroness of the Philippines.',
            proclamationNo: 'Proclamation No. 727 / Republic Act 10966'
        );

        // Christmas Eve (Dec 24)
        $holidays[] = $this->createHolidayItem(
            name: 'Christmas Eve (Special Non-Working Day)',
            date: "{$year}-12-24",
            category: 'special_non_working',
            type: 'holiday',
            description: 'Special non-working day before Christmas Day to enable Filipinos to celebrate Noche Buena with families.',
            proclamationNo: 'Proclamation No. 727'
        );

        // Last Day of the Year (Dec 31)
        $holidays[] = $this->createHolidayItem(
            name: 'Last Day of the Year (New Year’s Eve)',
            date: "{$year}-12-31",
            category: 'special_non_working',
            type: 'holiday',
            description: 'Special non-working day closing out the year in preparation for New Year Media Noche celebrations.',
            proclamationNo: 'Proclamation No. 727'
        );

        // ---------------------------------------------------------------------
        // 3. SPECIAL WORKING HOLIDAYS / COMMEMORATIVE OBSERVANCES
        // Working days with commemorative marketing and national significance
        // ---------------------------------------------------------------------

        // EDSA People Power Revolution Anniversary (Feb 25)
        $holidays[] = $this->createHolidayItem(
            name: 'EDSA People Power Revolution Anniversary',
            date: "{$year}-02-25",
            category: 'special_working',
            type: 'holiday',
            description: 'Commemorative national anniversary celebrating the peaceful 1986 EDSA Revolution.',
            proclamationNo: 'Proclamation No. 727 (Special Working Day)'
        );

        // Jose Rizal Birth Anniversary (Jun 19)
        $holidays[] = $this->createHolidayItem(
            name: 'Dr. Jose Rizal Birth Anniversary',
            date: "{$year}-06-19",
            category: 'special_working',
            type: 'holiday',
            description: 'National commemorative observance celebrating the birth anniversary of national hero Dr. Jose Rizal.',
            proclamationNo: 'National Historical Commission Observance'
        );

        // National Teachers' Day (Oct 5)
        $holidays[] = $this->createHolidayItem(
            name: "National Teachers' Day",
            date: "{$year}-10-05",
            category: 'special_working',
            type: 'seasonal',
            description: 'Nationwide observance celebrating educators and mentors. Great for appreciation promo campaigns.',
            proclamationNo: 'Republic Act 10743'
        );

        // ---------------------------------------------------------------------
        // 4. ISLAMIC HOLIDAYS (Movable Dates based on Muslim Lunar Calendar / NCMF)
        // ---------------------------------------------------------------------

        $eidlFitrDate = $this->getEidlFitrDate($year);
        $holidays[] = $this->createHolidayItem(
            name: "Eid'l Fitr (Feast of Ramadhan)",
            date: $eidlFitrDate,
            category: 'islamic',
            type: 'holiday',
            description: 'National holiday marking the culmination of the Islamic holy month of Ramadan, officially proclaimed following lunar sighting by the National Commission on Muslim Filipinos (NCMF).',
            proclamationNo: 'Presidential Proclamation / RA 9177'
        );

        $eidlAdhaDate = $this->getEidlAdhaDate($year);
        $holidays[] = $this->createHolidayItem(
            name: "Eid'l Adha (Feast of the Sacrifice)",
            date: $eidlAdhaDate,
            category: 'islamic',
            type: 'holiday',
            description: 'National holiday commemorating the Feast of the Sacrifice, one of the two greatest feasts of Islam, determined under Islamic Hijri calendar proclamation.',
            proclamationNo: 'Presidential Proclamation / RA 9849'
        );

        // ---------------------------------------------------------------------
        // 5. COMMERCIAL SHOPPING DAYS & SEASONAL RETAIL CAMPAIGNS
        // Key e-commerce and retail sale mega days
        // ---------------------------------------------------------------------

        $commercialEvents = [
            ['name' => '1.1 New Year Kickoff Mega Sale', 'date' => "{$year}-01-01", 'desc' => 'First mega double-digit shopping campaign of the year.'],
            ['name' => "Valentine's Day & 2.2 Flash Sale", 'date' => "{$year}-02-14", 'desc' => 'High-conversion romance, gifting, dining, and luxury retail season.'],
            ['name' => '3.3 Mega Summer Shopping Festival', 'date' => "{$year}-03-03", 'desc' => 'Beginning of Philippine summer season sales & vacation apparel.'],
            ['name' => '4.4 Summer Kickoff Sale', 'date' => "{$year}-04-04", 'desc' => 'Peak hot summer sale and travel gear promos.'],
            ['name' => "Mother's Day & 5.5 Mid-Year Kickoff", 'date' => $this->getNthDayOfMonth($year, 5, Carbon::SUNDAY, 2), 'desc' => "Nationwide family dining, luxury gifts, and Mother's Day retail rush."],
            ['name' => "Father's Day & 6.6 Mid-Year Mega Sale", 'date' => $this->getNthDayOfMonth($year, 6, Carbon::SUNDAY, 3), 'desc' => "Father's Day gifting & giant mid-year clearance campaigns."],
            ['name' => '7.7 Great Mid-Year Sale', 'date' => "{$year}-07-07", 'desc' => 'High-volume mid-year retail discount day.'],
            ['name' => '8.8 Great August Sale', 'date' => "{$year}-08-08", 'desc' => 'Pre-Ber months shopping warmup.'],
            ['name' => '9.9 Super Shopping Day (Ber Months Kickoff)', 'date' => "{$year}-09-09", 'desc' => 'Official start of Philippine 4-month long Christmas shopping season (Ber months). Top sales spike of Q3.'],
            ['name' => '10.10 Perfect 10 Shopping Festival', 'date' => "{$year}-10-10", 'desc' => 'Major double-digit sale in the heart of Q4 retail rush.'],
            ['name' => "11.11 Single's Day Mega Sale", 'date' => "{$year}-11-11", 'desc' => 'The largest single e-commerce shopping festival day in Southeast Asia and the Philippines.'],
            ['name' => 'Black Friday & Cyber Weekend', 'date' => (new Carbon("fourth thursday of november {$year}"))->addDay()->toDateString(), 'desc' => 'Tech, gadgets, fashion, and global mega discount weekend.'],
            ['name' => '12.12 Grand Year-End Holiday Sale', 'date' => "{$year}-12-12", 'desc' => 'The grand finale of Christmas gifting, last-minute sales, and holiday shopping.'],
        ];

        foreach ($commercialEvents as $comm) {
            $holidays[] = [
                'name' => $comm['name'],
                'date' => $comm['date'],
                'type' => 'commercial',
                'category' => 'commercial',
                'description' => $comm['desc'],
                'country' => self::COUNTRY_CODE,
                'source' => self::SOURCE,
                'is_global' => true,
                'user_id' => null,
                'is_long_weekend' => false,
                'long_weekend_details' => null,
                'shifted_from_date' => null,
                'proclamation_no' => 'E-Commerce Mega Retail Calendar',
            ];
        }

        return $holidays;
    }

    /**
     * Helper to create a structured holiday item with automatic long-weekend detection.
     */
    private function createHolidayItem(
        string $name,
        string $date,
        string $category,
        string $type,
        string $description,
        ?string $proclamationNo = null,
        bool $isLongWeekend = false,
        ?string $longWeekendDetails = null,
        ?string $shiftedFrom = null
    ): array {
        $dt = Carbon::parse($date);
        $dayOfWeek = $dt->dayOfWeek; // 0 = Sunday, 1 = Monday, 5 = Friday, 6 = Saturday

        // Automatic long-weekend detection if falling on Friday or Monday
        if (! $isLongWeekend) {
            if ($dayOfWeek === Carbon::FRIDAY) {
                $isLongWeekend = true;
                $longWeekendDetails = "3-Day Long Weekend (Friday - Sunday, {$dt->format('M j')} - {$dt->copy()->addDays(2)->format('M j')})";
            } elseif ($dayOfWeek === Carbon::MONDAY) {
                $isLongWeekend = true;
                $longWeekendDetails = "3-Day Long Weekend (Saturday - Monday, {$dt->copy()->subDays(2)->format('M j')} - {$dt->format('M j')})";
            }
        }

        return [
            'name' => $name,
            'date' => $date,
            'type' => $type,
            'category' => $category,
            'description' => $description,
            'country' => self::COUNTRY_CODE,
            'source' => self::SOURCE,
            'is_global' => true,
            'user_id' => null,
            'is_long_weekend' => $isLongWeekend,
            'long_weekend_details' => $longWeekendDetails,
            'shifted_from_date' => $shiftedFrom,
            'proclamation_no' => $proclamationNo,
        ];
    }

    /**
     * Store a holiday in the database, avoiding duplicates.
     */
    private function storeHoliday(array $holiday): bool
    {
        try {
            $existing = Event::query()
                ->where('name', $holiday['name'])
                ->where('date', $holiday['date'])
                ->where('country', $holiday['country'])
                ->first();

            if ($existing) {
                $existing->update([
                    'type' => $holiday['type'],
                    'category' => $holiday['category'],
                    'description' => $holiday['description'],
                    'is_long_weekend' => $holiday['is_long_weekend'] ?? false,
                    'long_weekend_details' => $holiday['long_weekend_details'] ?? null,
                    'shifted_from_date' => $holiday['shifted_from_date'] ?? null,
                    'proclamation_no' => $holiday['proclamation_no'] ?? null,
                    'source' => self::SOURCE,
                ]);

                return false;
            }

            Event::create($holiday);

            return true;
        } catch (\Exception $e) {
            Log::error("Failed to store holiday: {$e->getMessage()}", ['holiday' => $holiday]);

            return false;
        }
    }

    /**
     * Compute Easter Sunday for a given year using PHP's easter_date / easter_days algorithm.
     */
    private function getEasterSunday(int $year): Carbon
    {
        $daysAfterMarch21 = easter_days($year);

        return Carbon::createFromDate($year, 3, 21)->addDays($daysAfterMarch21);
    }

    /**
     * Accurate Chinese New Year dates.
     */
    private function getChineseNewYearDate(int $year): string
    {
        $cnyDates = [
            2024 => '2024-02-10',
            2025 => '2025-01-29',
            2026 => '2026-02-17',
            2027 => '2027-02-06',
            2028 => '2028-01-26',
            2029 => '2029-02-13',
            2030 => '2030-02-03',
        ];

        return $cnyDates[$year] ?? "{$year}-02-10";
    }

    /**
     * Accurate Eid'l Fitr dates (National Commission on Muslim Filipinos / Lunar estimates).
     */
    private function getEidlFitrDate(int $year): string
    {
        $eidlFitrDates = [
            2024 => '2024-04-10',
            2025 => '2025-03-31',
            2026 => '2026-03-20',
            2027 => '2027-03-10',
            2028 => '2028-02-27',
            2029 => '2029-02-15',
            2030 => '2030-02-05',
        ];

        return $eidlFitrDates[$year] ?? "{$year}-03-31";
    }

    /**
     * Accurate Eid'l Adha dates (Feast of the Sacrifice).
     */
    private function getEidlAdhaDate(int $year): string
    {
        $eidlAdhaDates = [
            2024 => '2024-06-17',
            2025 => '2025-06-07',
            2026 => '2026-05-27',
            2027 => '2027-05-16',
            2028 => '2028-05-05',
            2029 => '2029-04-24',
            2030 => '2030-04-13',
        ];

        return $eidlAdhaDates[$year] ?? "{$year}-06-07";
    }

    /**
     * Helper to compute nth day of a month (e.g. 2nd Sunday of May for Mother's Day).
     */
    private function getNthDayOfMonth(int $year, int $month, int $targetDayOfWeek, int $nth): string
    {
        $dt = Carbon::createFromDate($year, $month, 1);
        $count = 0;

        while ($dt->month === $month) {
            if ($dt->dayOfWeek === $targetDayOfWeek) {
                $count++;
                if ($count === $nth) {
                    return $dt->toDateString();
                }
            }
            $dt->addDay();
        }

        return Carbon::createFromDate($year, $month, 1)->toDateString();
    }

    /**
     * Get Philippine holidays for a specific year.
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
     * Get or sync holidays for a year.
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
