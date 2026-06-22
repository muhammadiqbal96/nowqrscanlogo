<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class AutoPostSubscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'frequency',
        'posts_per_cycle',
        'credits_per_post',
        'status',
        'niche',
        'tone',
        'keywords',
        'custom_instructions',
        'next_post_at',
        'last_posted_at',
        'total_posts_delivered',
        'total_credits_spent',
    ];

    protected function casts(): array
    {
        return [
            'keywords' => 'array',
            'posts_per_cycle' => 'integer',
            'credits_per_post' => 'integer',
            'total_posts_delivered' => 'integer',
            'total_credits_spent' => 'integer',
            'next_post_at' => 'datetime',
            'last_posted_at' => 'datetime',
        ];
    }

    // ─── Relationships ──────────────────────────────────────────

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function autoPosts()
    {
        return $this->hasMany(AutoPost::class, 'subscription_id');
    }

    // ─── Scopes ─────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeDue($query)
    {
        return $query->active()->where('next_post_at', '<=', now());
    }

    // ─── Helpers ────────────────────────────────────────────────

    /**
     * Calculate the next post time based on frequency.
     */
    public function calculateNextPostAt(): Carbon
    {
        $now = now();

        return match ($this->frequency) {
            'daily' => $now->addDay(),
            'weekly' => $now->addWeek(),
            'monthly' => $now->addMonth(),
            default => $now->addWeek(),
        };
    }

    /**
     * Get human-readable frequency label.
     */
    public function getFrequencyLabelAttribute(): string
    {
        return match ($this->frequency) {
            'daily' => 'Daily',
            'weekly' => 'Weekly',
            'monthly' => 'Monthly',
            default => ucfirst($this->frequency),
        };
    }

    /**
     * Get credits needed for one full cycle.
     */
    public function getCreditsPerCycleAttribute(): int
    {
        return $this->posts_per_cycle * $this->credits_per_post;
    }

    /**
     * Pricing table for auto-post plans.
     */
    public static function getPricing(): array
    {
        return [
            'daily' => [
                'label' => 'Daily Posts',
                'description' => 'Fresh content posted every day',
                'credits_per_post' => 2,
                'suggested_posts' => 1,
                'monthly_estimate' => '~60 credits/month',
            ],
            'weekly' => [
                'label' => 'Weekly Posts',
                'description' => 'Consistent weekly content updates',
                'credits_per_post' => 2,
                'suggested_posts' => 2,
                'monthly_estimate' => '~16 credits/month',
            ],
            'monthly' => [
                'label' => 'Monthly Posts',
                'description' => 'Monthly content batches',
                'credits_per_post' => 2,
                'suggested_posts' => 5,
                'monthly_estimate' => '~10 credits/month',
            ],
        ];
    }
}
