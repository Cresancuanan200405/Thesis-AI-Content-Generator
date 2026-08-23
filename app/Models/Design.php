<?php

namespace App\Models;

use Database\Factories\DesignFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property int $business_id
 * @property int $campaign_id
 * @property int|null $event_id
 * @property int|null $product_id
 * @property string $product_name
 * @property string|null $prompt
 * @property string|null $tagline
 * @property string|null $content_style
 * @property string $status
 * @property string|null $generated_image_path
 * @property array<string, mixed>|null $generation_metadata
 * @property bool $is_favorite
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property User|null $user
 * @property Business|null $business
 * @property Campaign|null $campaign
 * @property Event|null $event
 * @property Product|null $product
 */
class Design extends Model
{
    /** @use HasFactory<DesignFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'business_id',
        'campaign_id',
        'event_id',
        'product_id',
        'product_name',
        'prompt',
        'price',
        'brand_tone',
        'visual_theme',
        'tagline',
        'tagline_mode',
        'reference_image_path',
        'generated_image_path',
        'generation_metadata',
        'status',
        'is_favorite',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'generation_metadata' => 'array',
        'is_favorite' => 'boolean',
    ];

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Business, $this>
     */
    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    /**
     * @return BelongsTo<Campaign, $this>
     */
    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    /**
     * @return BelongsTo<Event, $this>
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
