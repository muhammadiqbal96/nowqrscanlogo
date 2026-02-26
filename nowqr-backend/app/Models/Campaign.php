<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Campaign extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'business_name',
        'business_description',
        'target_audience',
        'cta_type',
        'custom_cta',
        'headline',
        'sub_headline',
        'description',
        'cta_button_text',
        'page_design',
        'logo_path',
        'background_image_path',
        'primary_color',
        'font_family',
        'subdomain',
        'slug',
        'is_published',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'page_design' => 'array',
            'is_published' => 'boolean',
        ];
    }

    // Auto-generate slug on creation
    protected static function booted(): void
    {
        static::creating(function (Campaign $campaign) {
            if (empty($campaign->slug)) {
                $base = Str::slug($campaign->business_name ?: $campaign->name);
                $slug = $base;
                $counter = 1;
                while (static::where('slug', $slug)->exists()) {
                    $slug = $base . '-' . $counter++;
                }
                $campaign->slug = $slug;
            }

            // Set subdomain based on CTA type
            if (empty($campaign->subdomain)) {
                $subdomainMap = [
                    'buy' => 'buy',
                    'give' => 'give',
                    'pay' => 'pay',
                    'call' => 'call',
                    'book' => 'book',
                    'watch' => 'see',
                    'order' => 'buy',
                    'custom' => 'go',
                ];
                $campaign->subdomain = $subdomainMap[$campaign->cta_type] ?? 'go';
            }
        });
    }

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scanLogos()
    {
        return $this->hasMany(ScanLogo::class);
    }

    public function scanEvents()
    {
        return $this->hasMany(ScanEvent::class);
    }

    // Helpers
    public function getPublicUrlAttribute(): string
    {
        return "https://{$this->subdomain}.nowqr.com/{$this->slug}";
    }

    public function getTotalScansAttribute(): int
    {
        return $this->scanEvents()->count();
    }
}
