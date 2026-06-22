<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CampaignFlyer extends Model
{
    use HasFactory;

    protected $fillable = [
        'campaign_id',
        'title',
        'image_path',
        'canvas_state',
    ];

    protected function casts(): array
    {
        return [
            'canvas_state' => 'array',
        ];
    }

    public function campaign()
    {
        return $this->belongsTo(Campaign::class);
    }
}
