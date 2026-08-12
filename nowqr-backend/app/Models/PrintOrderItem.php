<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PrintOrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'print_order_id',
        'print_product_id',
        'print_artwork_id',
        'quantity',
        'unit_price_cents',
        'total_price_cents',
        'product_name',
        'blueprint_id',
        'print_provider_id',
        'variant_id',
    ];

    public function order()
    {
        return $this->belongsTo(PrintOrder::class, 'print_order_id');
    }

    public function product()
    {
        return $this->belongsTo(PrintProduct::class, 'print_product_id');
    }

    public function artwork()
    {
        return $this->belongsTo(PrintArtwork::class, 'print_artwork_id');
    }
}
