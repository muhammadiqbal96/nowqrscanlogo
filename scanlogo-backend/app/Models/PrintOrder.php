<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class PrintOrder extends Model
{
    use HasFactory;

    public const STATUS_PENDING_PAYMENT = 'pending_payment';
    public const STATUS_PAID = 'paid';
    public const STATUS_SUBMITTED = 'submitted';
    public const STATUS_IN_PRODUCTION = 'in_production';
    public const STATUS_SHIPPED = 'shipped';
    public const STATUS_DELIVERED = 'delivered';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_PAYMENT_FAILED = 'payment_failed';
    public const STATUS_FULFILMENT_FAILED = 'fulfilment_failed';

    protected $fillable = [
        'user_id',
        'order_number',
        'status',
        'subtotal_cents',
        'shipping_charged_cents',
        'total_cents',
        'currency',
        'printify_shipping_cost_cents',
        'printify_production_cost_cents',
        'payment_provider',
        'payment_id',
        'payment_capture_id',
        'paid_at',
        'printify_order_id',
        'printify_status',
        'submitted_at',
        'sent_to_production_at',
        'ship_first_name',
        'ship_last_name',
        'ship_email',
        'ship_phone',
        'ship_address1',
        'ship_address2',
        'ship_city',
        'ship_region',
        'ship_country',
        'ship_zip',
        'tracking_number',
        'tracking_url',
        'carrier',
        'failure_reason',
        'needs_attention',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'paid_at' => 'datetime',
            'submitted_at' => 'datetime',
            'sent_to_production_at' => 'datetime',
            'needs_attention' => 'boolean',
            'meta' => 'array',
        ];
    }

    protected $appends = ['total', 'ship_full_name'];

    protected static function booted(): void
    {
        static::creating(function (PrintOrder $order) {
            if (empty($order->order_number)) {
                do {
                    $number = 'NQ-' . strtoupper(Str::random(8));
                } while (static::where('order_number', $number)->exists());
                $order->order_number = $number;
            }
        });
    }

    public function getTotalAttribute(): float
    {
        return round($this->total_cents / 100, 2);
    }

    public function getShipFullNameAttribute(): string
    {
        return trim("{$this->ship_first_name} {$this->ship_last_name}");
    }

    /**
     * Money is in but Printify has not accepted the order yet — someone has paid
     * for something that is not being made.
     */
    public function isAwaitingFulfilment(): bool
    {
        return $this->status === self::STATUS_PAID && $this->printify_order_id === null;
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(PrintOrderItem::class);
    }

    /**
     * Printify address payload for order creation and shipping quotes.
     */
    public function toPrintifyAddress(): array
    {
        return [
            'first_name' => $this->ship_first_name,
            'last_name' => $this->ship_last_name,
            'email' => $this->ship_email,
            'phone' => $this->ship_phone ?? '',
            'country' => $this->ship_country,
            'region' => $this->ship_region ?? '',
            'address1' => $this->ship_address1,
            'address2' => $this->ship_address2 ?? '',
            'city' => $this->ship_city,
            'zip' => $this->ship_zip,
        ];
    }
}
