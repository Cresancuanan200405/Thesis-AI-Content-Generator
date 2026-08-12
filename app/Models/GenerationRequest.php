<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GenerationRequest extends Model
{
    /** @use HasFactory<\Database\Factories\GenerationRequestFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'business_id',
        'campaign_id',
        'product_id',
        'event_id',
        'product_name',
        'marketing_goal',
        'content_style',
        'brand_tone',
        'tagline',
        'tagline_mode',
        'target_audience',
        'unique_selling_point',
        'reference_image_path',
        'notes',
        'prompt',
        'status',
    ];

    protected $casts = [
        'content_style' => 'array',
        'brand_tone' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}
