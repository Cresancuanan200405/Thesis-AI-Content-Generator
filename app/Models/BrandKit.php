<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BrandKit extends Model
{
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

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
