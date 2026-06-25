<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AutoPost extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'subscription_id',
        'platform_id',
        'title',
        'excerpt',
        'content',
        'category',
        'tags',
        'featured_image_url',
        'status',
        'scheduled_at',
        'published_at',
        'external_post_id',
        'external_post_url',
        'credits_charged',
        'error_message',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'tags' => 'array',
            'meta' => 'array',
            'credits_charged' => 'integer',
            'scheduled_at' => 'datetime',
            'published_at' => 'datetime',
        ];
    }

    // ─── Relationships ──────────────────────────────────────────

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function subscription()
    {
        return $this->belongsTo(AutoPostSubscription::class, 'subscription_id');
    }

    public function platform()
    {
        return $this->belongsTo(ConnectedPlatform::class, 'platform_id');
    }

    // ─── Scopes ─────────────────────────────────────────────────

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeScheduled($query)
    {
        return $query->where('status', 'scheduled');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function scopeDue($query)
    {
        return $query->scheduled()->where('scheduled_at', '<=', now());
    }
}
