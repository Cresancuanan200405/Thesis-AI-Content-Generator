<?php

namespace App\Models;

use Database\Factories\BusinessFactory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $name
 * @property string|null $industry
 * @property string|null $category
 * @property string|null $description
 * @property string|null $target_audience
 * @property string|null $unique_selling_point
 * @property string|null $content_style
 * @property string|null $default_tagline_behavior
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property BrandKit|null $brandKit
 * @property Collection<int,Product> $products
 * @property Collection<int,Campaign> $campaigns
 * @property Collection<int,Design> $designs
 */
class Business extends Model
{
    /** @use HasFactory<BusinessFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'industry',
        'category',
        'description',
        'target_audience',
        'unique_selling_point',
        'content_style',
        'default_tagline_behavior',
    ];

    protected $casts = [
    ];

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasOne<BrandKit, $this>
     */
    public function brandKit(): HasOne
    {
        return $this->hasOne(BrandKit::class);
    }

    /**
     * @return HasMany<Product, $this>
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /**
     * @return HasMany<Campaign, $this>
     */
    public function campaigns(): HasMany
    {
        return $this->hasMany(Campaign::class);
    }

    /**
     * @return HasMany<Design, $this>
     */
    public function designs(): HasMany
    {
        return $this->hasMany(Design::class);
    }
}
