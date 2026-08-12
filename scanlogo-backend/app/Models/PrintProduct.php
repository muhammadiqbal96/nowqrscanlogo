<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PrintProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'name',
        'description',
        'blueprint_id',
        'print_provider_id',
        'variant_id',
        'width_in',
        'height_in',
        'print_dpi',
        'print_width_px',
        'print_height_px',
        'retail_price_cents',
        'estimated_cost_cents',
        'currency',
        'min_quantity',
        'max_quantity',
        'canvas_preset',
        'mockup_url',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'width_in' => 'float',
            'height_in' => 'float',
        ];
    }

    protected $appends = ['retail_price', 'size_label'];

    public function getRetailPriceAttribute(): float
    {
        return round($this->retail_price_cents / 100, 2);
    }

    public function getSizeLabelAttribute(): string
    {
        return rtrim(rtrim(number_format($this->width_in, 2), '0'), '.')
            . '" x '
            . rtrim(rtrim(number_format($this->height_in, 2), '0'), '.')
            . '"';
    }

    /**
     * A product can only be ordered once it has been mapped to a real Printify
     * blueprint/provider/variant. Until then it is catalog-only.
     */
    public function isFulfillable(): bool
    {
        return $this->blueprint_id !== null
            && $this->print_provider_id !== null
            && $this->variant_id !== null;
    }

    public function orderItems()
    {
        return $this->hasMany(PrintOrderItem::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
