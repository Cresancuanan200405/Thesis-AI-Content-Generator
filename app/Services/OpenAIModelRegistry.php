<?php

namespace App\Services;

class OpenAIModelRegistry
{
    /**
     * @var array<string, array<string, mixed>>
     */
    protected array $models = [
        'gpt-image-2' => [
            'id' => 'gpt-image-2',
            'display_name' => 'GPT-Image-2',
            'api_model_id' => 'gpt-image-2',
            'supports_image_input' => true,
            'supports_image_editing' => true,
            'supports_quality' => true,
            'supported_sizes' => ['1024x1024', '1792x1024', '1024x1792'],
            'status' => 'recommended',
            'is_recommended' => true,
            'badge' => 'Recommended',
            'tag' => 'Flagship Photorealism',
            'speed' => 'Deep Studio (~9s)',
            'quality_label' => 'Photorealistic Pro',
            'price_usd' => '$0.053 / gen',
            'price_php' => '~₱3.05',
            'description' => 'OpenAI flagship engine for photorealistic campaigns, billboard visuals, and luxury lookbooks with direct image input support.',
        ],
        'gpt-image-1.5' => [
            'id' => 'gpt-image-1.5',
            'display_name' => 'GPT-Image-1.5',
            'api_model_id' => 'gpt-image-1.5',
            'supports_image_input' => true,
            'supports_image_editing' => true,
            'supports_quality' => false,
            'supported_sizes' => ['1024x1024', '1792x1024', '1024x1792'],
            'status' => 'previous',
            'is_recommended' => false,
            'badge' => 'Previous',
            'tag' => 'Previous Flagship',
            'speed' => 'Enhanced (~7s)',
            'quality_label' => 'High Detail',
            'price_usd' => '$0.040 / gen',
            'price_php' => '~₱2.30',
            'description' => 'Previous flagship rendering for intricate textures, micro-details, and fine depth.',
        ],
        'gpt-image-1' => [
            'id' => 'gpt-image-1',
            'display_name' => 'GPT-Image-1',
            'api_model_id' => 'gpt-image-1',
            'supports_image_input' => true,
            'supports_image_editing' => true,
            'supports_quality' => false,
            'supported_sizes' => ['1024x1024', '1792x1024', '1024x1792'],
            'status' => 'previous',
            'is_recommended' => false,
            'badge' => 'Previous',
            'tag' => 'Previous Benchmark',
            'speed' => 'Balanced (~5s)',
            'quality_label' => 'Commercial Standard',
            'price_usd' => '$0.042 / gen',
            'price_php' => '~₱2.42',
            'description' => 'Previous commercial benchmark for product showcases, seasonal sales, and branded ads.',
        ],
        'gpt-image-1-mini' => [
            'id' => 'gpt-image-1-mini',
            'display_name' => 'GPT-Image-1 Mini',
            'api_model_id' => 'gpt-image-1-mini',
            'supports_image_input' => true,
            'supports_image_editing' => true,
            'supports_quality' => false,
            'supported_sizes' => ['1024x1024', '1792x1024', '1024x1792'],
            'status' => 'fast',
            'is_recommended' => false,
            'badge' => 'Previous / Fast',
            'tag' => 'Fastest & Budget',
            'speed' => 'Ultra Fast (~3s)',
            'quality_label' => 'Standard Crisp',
            'price_usd' => '$0.011 / gen',
            'price_php' => '~₱0.63',
            'description' => 'Ultra-fast turnarounds and maximum budget efficiency for rapid drafts.',
        ],
        'chatgpt-image-latest' => [
            'id' => 'chatgpt-image-latest',
            'display_name' => 'ChatGPT Image Latest',
            'api_model_id' => 'chatgpt-image-latest',
            'supports_image_input' => true,
            'supports_image_editing' => true,
            'supports_quality' => false,
            'supported_sizes' => ['1024x1024', '1792x1024', '1024x1792'],
            'status' => 'previous',
            'is_recommended' => false,
            'badge' => 'Previous',
            'tag' => 'Standard ChatGPT View',
            'speed' => 'Adaptive (~6s)',
            'quality_label' => 'Creative Fidelity',
            'price_usd' => '$0.034 / gen',
            'price_php' => '~₱1.96',
            'description' => 'Adaptive checkpoint tuned for narrative context, lifestyle backdrops, and creative storytelling.',
        ],
        'dall-e-3' => [
            'id' => 'dall-e-3',
            'display_name' => 'DALL-E 3',
            'api_model_id' => 'dall-e-3',
            'supports_image_input' => false,
            'supports_image_editing' => false,
            'supports_quality' => true,
            'supported_sizes' => ['1024x1024', '1792x1024', '1024x1792'],
            'status' => 'legacy',
            'is_recommended' => false,
            'badge' => 'Legacy',
            'tag' => 'Legacy Engine',
            'speed' => 'Standard (~10s)',
            'quality_label' => 'Standard / HD',
            'price_usd' => '$0.040 / gen',
            'price_php' => '~₱2.30',
            'description' => 'Legacy DALL-E 3 image generation engine.',
        ],
    ];

    /**
     * Get all registered models.
     *
     * @return array<string, array<string, mixed>>
     */
    public function getAllModels(): array
    {
        return $this->models;
    }

    /**
     * Get a model's specification by ID.
     *
     * @return array<string, mixed>
     */
    public function getModel(string $modelId): array
    {
        return $this->models[$modelId] ?? $this->getDefaultModel();
    }

    /**
     * Get the default / recommended model (GPT-Image-2).
     *
     * @return array<string, mixed>
     */
    public function getDefaultModel(): array
    {
        return $this->models['gpt-image-2'];
    }

    /**
     * Resolve the exact OpenAI API model string.
     */
    public function resolveApiModelId(string $modelId): string
    {
        $spec = $this->getModel($modelId);

        return $spec['api_model_id'] ?? 'gpt-image-2';
    }

    /**
     * Check if a model supports direct image input.
     */
    public function supportsImageInput(string $modelId): bool
    {
        $spec = $this->getModel($modelId);

        return (bool) ($spec['supports_image_input'] ?? false);
    }
}
