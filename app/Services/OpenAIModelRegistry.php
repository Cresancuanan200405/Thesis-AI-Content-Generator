<?php

namespace App\Services;

class OpenAIModelRegistry
{
    public const DEFAULT_IMAGE_MODEL = 'gpt-image-2';

    public const DEFAULT_TEXT_MODEL = 'gpt-5.6-luna';

    /**
     * The single authoritative image-generation model specification.
     *
     * @var array<string, mixed>
     */
    protected array $flagshipModel = [
        'id' => 'gpt-image-2',
        'display_name' => 'GPT-Image-2',
        'api_model_id' => 'gpt-image-2',
        'supports_image_input' => true,
        'supports_image_editing' => true,
        'supports_quality' => true,
        'supported_sizes' => ['1024x1024', '1792x1024', '1024x1792'],
        'status' => 'recommended',
        'is_recommended' => true,
        'product_preservation_capability' => 'flagship_photorealistic',
        'recommended_generation_mode' => 'PRODUCT_PRESERVING_FLAGSHIP',
        'compatibility_notes' => 'OpenAI recommended flagship model. Native image-to-image edits pipeline with maximum product fidelity, ray-traced shadows, and photorealistic environmental integration.',
        'badge' => 'Recommended',
        'tag' => 'Flagship Photorealism',
        'speed' => 'Deep Studio (~9s)',
        'quality_label' => 'Photorealistic Pro',
        'price_usd' => '$0.053 / gen',
        'price_php' => '~₱3.05',
        'description' => 'OpenAI flagship engine for photorealistic campaigns, billboard visuals, and luxury lookbooks with direct image input support.',
    ];

    /**
     * Get all registered active image models.
     * Only GPT-Image-2 is active.
     *
     * @return array<string, array<string, mixed>>
     */
    public function getAllModels(): array
    {
        return [
            'gpt-image-2' => $this->flagshipModel,
        ];
    }

    /**
     * Get a model's specification. Always resolves to GPT-Image-2.
     *
     * @return array<string, mixed>
     */
    public function getModel(?string $modelId = null): array
    {
        return $this->flagshipModel;
    }

    /**
     * Get the default / authoritative model (GPT-Image-2).
     *
     * @return array<string, mixed>
     */
    public function getDefaultModel(): array
    {
        return $this->flagshipModel;
    }

    /**
     * Get the authoritative active image model ID ('gpt-image-2').
     */
    public function getImageModel(): string
    {
        return self::DEFAULT_IMAGE_MODEL;
    }

    /**
     * Get the configured text model ID for visual prompt generation (GPT-5.6 Luna).
     */
    public function getTextModel(): string
    {
        return (string) config('services.openai.text_model', self::DEFAULT_TEXT_MODEL);
    }

    /**
     * Resolve the exact OpenAI API model string.
     * Always returns 'gpt-image-2' regardless of any passed legacy/external argument.
     */
    public function resolveApiModelId(?string $modelId = null): string
    {
        return self::DEFAULT_IMAGE_MODEL;
    }

    /**
     * Check if a model supports direct image input.
     */
    public function supportsImageInput(?string $modelId = null): bool
    {
        return true;
    }

    /**
     * Get the capability policy for a specific model.
     *
     * @return array{
     *     model_id: string,
     *     display_name: string,
     *     api_model_id: string,
     *     is_recommended: bool,
     *     status: string,
     *     product_preservation_capability: string,
     *     supports_image_input: bool,
     *     supports_image_editing: bool,
     *     recommended_generation_mode: string,
     *     compatibility_notes: string,
     * }
     */
    public function getModelPolicy(?string $modelId = null): array
    {
        return [
            'model_id' => $this->flagshipModel['id'],
            'display_name' => $this->flagshipModel['display_name'],
            'api_model_id' => $this->flagshipModel['api_model_id'],
            'is_recommended' => true,
            'status' => 'recommended',
            'product_preservation_capability' => 'flagship_photorealistic',
            'supports_image_input' => true,
            'supports_image_editing' => true,
            'recommended_generation_mode' => 'PRODUCT_PRESERVING_FLAGSHIP',
            'compatibility_notes' => $this->flagshipModel['compatibility_notes'],
        ];
    }

    /**
     * Check if a model is the recommended flagship model.
     */
    public function isRecommended(?string $modelId = null): bool
    {
        return true;
    }

    /**
     * Get the preservation capability string for a model.
     */
    public function getPreservationCapability(?string $modelId = null): string
    {
        return 'flagship_photorealistic';
    }

    /**
     * Get the recommended generation mode for a model.
     */
    public function getRecommendedGenerationMode(?string $modelId = null): string
    {
        return 'PRODUCT_PRESERVING_FLAGSHIP';
    }
}
