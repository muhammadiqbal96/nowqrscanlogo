<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaign_flyers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained()->onDelete('cascade');
            $table->string('title')->default('Untitled Flyer');
            $table->string('image_path')->nullable();
            $table->json('canvas_state')->nullable(); // stores elements, bg, aspectRatio
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaign_flyers');
    }
};
