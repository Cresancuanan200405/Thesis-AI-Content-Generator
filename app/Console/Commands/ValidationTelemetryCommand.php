<?php

namespace App\Console\Commands;

use App\Services\ValidationTelemetryService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('validation:telemetry {--business= : Scope telemetry to a specific business ID} {--exclude-deleted : Exclude soft-deleted designs}')]
#[Description('Display deterministic AI output validation telemetry and diagnostic breakdowns')]
class ValidationTelemetryCommand extends Command
{
    public function handle(ValidationTelemetryService $telemetryService): int
    {
        $businessOption = $this->option('business');
        $businessId = $businessOption !== null && $businessOption !== '' ? (int) $businessOption : null;
        $includeDeleted = ! $this->option('exclude-deleted');

        $report = $telemetryService->generateReport($businessId, $includeDeleted);

        $this->line('');
        $this->line('MarketPilot Validation Telemetry');
        $this->line('================================');
        if ($businessId !== null) {
            $this->comment("Scope: Business #{$businessId}");
        } else {
            $this->comment('Scope: System-Wide (Administrative Diagnostics)');
        }
        $this->line('');

        // Population
        $pop = $report['population'];
        $this->line('Population');
        $this->line('----------');
        $this->line(sprintf('AI Designs:             %d', $pop['ai_designs']));
        $this->line(sprintf('Validated:               %d', $pop['validated']));
        $this->line(sprintf('Unvalidated:              %d', $pop['unvalidated']));
        $this->line(sprintf('Coverage:              %.2f%%', $pop['coverage_percent']));
        $this->line('');

        // Validation Status
        $statuses = $report['statuses'];
        $this->line('Validation Status');
        $this->line('-----------------');
        foreach (['PASS', 'REVIEW', 'RETRY'] as $statusKey) {
            $st = $statuses[$statusKey] ?? ['count' => 0, 'percent_of_validated' => 0.0];
            $this->line(sprintf('%-8s                 %d  (%.2f%%)', $statusKey.':', $st['count'], $st['percent_of_validated']));
        }
        foreach ($statuses as $statusKey => $st) {
            if (! in_array($statusKey, ['PASS', 'REVIEW', 'RETRY'], true)) {
                $this->line(sprintf('%-8s                 %d  (%.2f%%)', $statusKey.':', $st['count'], $st['percent_of_validated']));
            }
        }
        $this->line('');

        // Validation Issues
        $issues = $report['issues'];
        $this->line('Validation Issues');
        $this->line('-----------------');
        if (empty($issues)) {
            $this->line('No validation issues recorded.');
        } else {
            foreach ($issues as $issueText => $issueCount) {
                $this->line(sprintf('%-60s  %d', $issueText, $issueCount));
            }
        }
        $this->line('');

        // Generation Mode
        $this->renderSection('Generation Mode', $report['generation_mode']);

        // Generation Method
        $this->renderSection('Generation Method', $report['generation_method']);

        // Model
        $this->renderSection('Model', $report['model']);

        // Aspect Ratio
        $this->renderSection('Aspect Ratio', $report['aspect_ratio']);

        // Product Count
        $this->renderSection('Product Count', $report['product_count']);

        // Lineage
        $this->renderSection('Lineage', $report['lineage']);

        // Industry
        $this->renderSection('Industry', $report['industry']);

        // Category
        $this->renderSection('Category', $report['category']);

        // Campaign & Event Association
        $this->renderSection('Campaign Association', $report['campaign']);
        $this->renderSection('Event Association', $report['event']);

        return self::SUCCESS;
    }

    /**
     * @param  array<string, int>  $data
     */
    protected function renderSection(string $title, array $data): void
    {
        $this->line($title);
        $this->line(str_repeat('-', max(strlen($title), 10)));
        if (empty($data)) {
            $this->line('None recorded.');
        } else {
            foreach ($data as $key => $count) {
                $this->line(sprintf('%-30s %d', (string) $key, $count));
            }
        }
        $this->line('');
    }
}
