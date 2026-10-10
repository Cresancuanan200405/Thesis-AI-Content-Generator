<?php

namespace App\Console\Commands;

use App\Services\GeminiVisualInspirationService;
use Illuminate\Console\Command;
use Throwable;

class TestGeminiVisionCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'marketpilot:test-gemini-vision
                            {path : The path to the reference image file (absolute or workspace-relative)}
                            {--fallback : Force using the fallback model directly}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test Gemini visual inspiration reference image analysis without affecting existing generation pipelines';

    /**
     * Execute the console command.
     */
    public function handle(GeminiVisualInspirationService $service): int
    {
        $rawPath = (string) $this->argument('path');
        $forceFallback = (bool) $this->option('fallback');

        // Resolve absolute or relative path
        $filePath = file_exists($rawPath)
            ? $rawPath
            : base_path($rawPath);

        $this->info('===============================================================');
        $this->info(' MarketPilot — Isolated Gemini Visual Inspiration Test Harness');
        $this->info('===============================================================');
        $this->line("Target file: {$filePath}");

        try {
            // Pre-validation inspection
            $service->validateFile($filePath);
            $mimeType = $service->detectMimeType($filePath);
            $sizeKb = round((filesize($filePath) ?: 0) / 1024, 2);

            $this->line("Format: {$mimeType} | Size: {$sizeKb} KB");

            $primaryModel = config('services.gemini.model', 'gemini-3.1-pro-preview');
            $fallbackModel = config('services.gemini.fallback_model', 'gemini-3.6-flash');

            $this->line("Configured Primary Model: {$primaryModel}");
            $this->line("Configured Fallback Model: {$fallbackModel}");
            $this->line('Executing vision analysis request...');

            $result = $service->analyze($filePath, $forceFallback);

            if (! ($result['success'] ?? false)) {
                $this->error('Analysis Failed: '.($result['error'] ?? 'Unknown error.'));

                return self::FAILURE;
            }

            $modelUsed = $result['model_used'] ?? 'Unknown';
            $visual = $result['visual_analysis'] ?? [];
            $recs = $result['marketpilot_recommendations'] ?? [];
            $visibility = $recs['visibility_suggestions'] ?? [];

            $this->newLine();
            $this->info("✔ Analysis Succeeded using [{$modelUsed}]");
            $this->newLine();

            // Display Visual Analysis Breakdown
            $this->comment('--- 1. Visual Analysis Findings ---');
            $this->line("<fg=cyan>Composition & Framing:</> {$visual['composition_and_framing']}");
            $this->line("<fg=cyan>Color Palette:</> {$visual['color_palette']}");
            $this->line("<fg=cyan>Lighting & Shadows:</> {$visual['lighting_and_shadows']}");
            $this->line("<fg=cyan>Typography Hierarchy:</> {$visual['typography_character_and_hierarchy']}");
            $this->line("<fg=cyan>Mood & Aesthetic:</> {$visual['mood_and_visual_direction']}");
            $this->line("<fg=yellow>Reusable Style Directive:</> {$visual['reusable_visual_style_prompt']}");

            $this->newLine();

            // Display MarketPilot Recommendations
            $this->comment('--- 2. MarketPilot Studio Recommendations ---');
            $this->line("<fg=green>Render Style:</> {$recs['render_style']}");
            $this->line("<fg=green>Copy Emphasis:</> {$recs['copy_emphasis']}");

            $visibilityFormatted = collect($visibility)
                ->map(fn ($val, $key) => "{$key}: ".($val ? 'Visible' : 'Hidden'))
                ->implode(' | ');
            $this->line("<fg=green>Visibility Toggles:</> {$visibilityFormatted}");
            $this->line("<fg=gray>Confidence Notes:</> {$recs['confidence_notes']}");

            $this->newLine();
            $this->info('Inspection complete. Reference image remains non-persisted.');

            return self::SUCCESS;

        } catch (Throwable $e) {
            $this->error('Execution Exception: '.$e->getMessage());

            return self::FAILURE;
        }
    }
}
