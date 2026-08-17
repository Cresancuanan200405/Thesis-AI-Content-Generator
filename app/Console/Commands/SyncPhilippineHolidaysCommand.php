<?php

namespace App\Console\Commands;

use App\Services\PhilippineHolidayService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('holidays:sync {--year= : Specific year to sync (optional)}')]
#[Description('Sync Philippine holidays from Nager.Date API')]
class SyncPhilippineHolidaysCommand extends Command
{
    public function handle(PhilippineHolidayService $service): int
    {
        $year = $this->option('year') ? (int) $this->option('year') : null;

        $this->info('Syncing Philippine holidays'.($year ? " for {$year}" : ' for current and next year').'...');

        try {
            $result = $service->syncHolidays($year);

            $this->info("\n✓ Sync completed!");
            $this->line("  Synced: {$result['synced']}");
            $this->line("  Skipped (already existed): {$result['skipped']}");

            if (! empty($result['errors'])) {
                $this->warn("\n⚠ Errors occurred:");
                foreach ($result['errors'] as $error) {
                    $this->warn("  - {$error}");
                }

                return 1;
            }

            return 0;
        } catch (\Exception $e) {
            $this->error("Failed to sync holidays: {$e->getMessage()}");

            return 1;
        }
    }
}
