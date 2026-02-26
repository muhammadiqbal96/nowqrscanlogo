<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ScanLogo extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'campaign_id',
        'destination_url',
        'short_code',
        'short_url',
        'shape',
        'animation',
        'color',
        'cta_text',
        'center_logo_path',
        'safe_scan_badge',
        'png_path',
        'gif_path',
        'webp_path',
        'is_dynamic',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'safe_scan_badge' => 'boolean',
            'is_dynamic' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (ScanLogo $scanLogo) {
            if (empty($scanLogo->short_code)) {
                do {
                    $code = strtolower(Str::random(8));
                } while (static::where('short_code', $code)->exists());
                $scanLogo->short_code = $code;
            }
            if (empty($scanLogo->short_url)) {
                $scanLogo->short_url = "https://nqr.ai/{$scanLogo->short_code}";
            }
        });
    }

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function campaign()
    {
        return $this->belongsTo(Campaign::class);
    }

    public function scanEvents()
    {
        return $this->hasMany(ScanEvent::class);
    }

    // Helpers
    public function getTotalScansAttribute(): int
    {
        return $this->scanEvents()->count();
    }
}
