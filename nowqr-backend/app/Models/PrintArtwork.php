<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class PrintArtwork extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'scan_logo_id',
        'campaign_flyer_id',
        'file_path',
        'width_px',
        'height_px',
        'byte_size',
        'checksum',
        'printify_image_id',
        'printify_preview_url',
        'uploaded_to_printify_at',
        'design_snapshot',
    ];

    protected function casts(): array
    {
        return [
            'design_snapshot' => 'array',
            'uploaded_to_printify_at' => 'datetime',
        ];
    }

    protected $appends = ['url'];

    public function getUrlAttribute(): ?string
    {
        return $this->file_path ? Storage::disk('public')->url($this->file_path) : null;
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scanLogo()
    {
        return $this->belongsTo(ScanLogo::class);
    }

    public function campaignFlyer()
    {
        return $this->belongsTo(CampaignFlyer::class);
    }
}
