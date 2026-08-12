<?php

namespace App\Models;

use Database\Factories\BrandKitFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $business_id
 * @property string|null $logo_path
 * @property string|null $primary_color
 * @property string|null $secondary_color
 * @property string|null $accent_color
 * @property array<int, string>|string|null $brand_tone
 * @property string|null $typography
 * @property string|null $brand_guidelines
 * @property array<int, string>|string|null $visual_preferences
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Business $business
 */
class BrandKit extends Model
{
    /** @use HasFactory<BrandKitFactory> */
    use HasFactory;

    protected $fillable = [
        'business_id',
        'logo_path',
        'primary_color',
        'secondary_color',
        'accent_color',
        'brand_tone',
        'typography',
        'brand_guidelines',
        'visual_preferences',
    ];

    protected $casts = [
    ];

    /**
     * @return BelongsTo<Business, $this>
     */
    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
