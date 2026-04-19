<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'first_name',
        'last_name',
        'business_name',
        'email',
        'password',
        'google_id',
        'avatar',
        'plan',
        'credits',
        'is_admin',
        'is_blocked',
        'blocked_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'google_id',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'credits' => 'integer',
            'is_admin' => 'boolean',
            'is_blocked' => 'boolean',
            'blocked_at' => 'datetime',
        ];
    }

    // Accessors
    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function getAvatarUrlAttribute(): ?string
    {
        if (!$this->avatar) return null;
        // If already a full URL (e.g., from Google), return as-is
        if (str_starts_with($this->avatar, 'http')) return $this->avatar;
        // Otherwise, build the storage URL
        return url("storage/{$this->avatar}");
    }

    // Relationships
    public function campaigns()
    {
        return $this->hasMany(Campaign::class);
    }

    public function scanLogos()
    {
        return $this->hasMany(ScanLogo::class);
    }

    public function creditTransactions()
    {
        return $this->hasMany(CreditTransaction::class);
    }

    public function scanEvents()
    {
        return $this->hasMany(ScanEvent::class);
    }

    public function blogs()
    {
        return $this->hasMany(Blog::class, 'author_id');
    }

    public function connectedPlatforms()
    {
        return $this->hasMany(ConnectedPlatform::class);
    }

    public function autoPostSubscriptions()
    {
        return $this->hasMany(AutoPostSubscription::class);
    }

    public function autoPosts()
    {
        return $this->hasMany(AutoPost::class);
    }

    // Credit helpers
    public function hasCredits(int $amount): bool
    {
        return $this->credits >= $amount;
    }

    public function deductCredits(int $amount, string $description, ?string $refType = null, ?int $refId = null): CreditTransaction
    {
        $this->decrement('credits', $amount);

        return $this->creditTransactions()->create([
            'amount' => -$amount,
            'balance_after' => $this->fresh()->credits,
            'type' => 'usage',
            'description' => $description,
            'reference_type' => $refType,
            'reference_id' => $refId,
        ]);
    }

    public function addCredits(int $amount, string $type, string $description, ?array $paymentInfo = null): CreditTransaction
    {
        $this->increment('credits', $amount);

        return $this->creditTransactions()->create([
            'amount' => $amount,
            'balance_after' => $this->fresh()->credits,
            'type' => $type,
            'description' => $description,
            'payment_provider' => $paymentInfo['provider'] ?? null,
            'payment_id' => $paymentInfo['payment_id'] ?? null,
            'payment_amount' => $paymentInfo['amount'] ?? null,
            'payment_currency' => $paymentInfo['currency'] ?? 'USD',
        ]);
    }
}
