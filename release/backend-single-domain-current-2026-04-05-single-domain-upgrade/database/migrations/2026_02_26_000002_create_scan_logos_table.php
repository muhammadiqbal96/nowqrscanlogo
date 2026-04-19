<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scan_logos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('campaign_id')->nullable()->constrained()->onDelete('set null');

            // QR configuration
            $table->string('destination_url'); // where the QR points to
            $table->string('short_code')->unique(); // e.g., 'buy-abc123' -> nqr.ai/buy-abc123
            $table->string('short_url'); // full short URL

            // Design
            $table->enum('shape', ['shield', 'circle', 'gear', 'eye', 'diamond', 'hexagon', 'square'])->default('shield');
            $table->enum('animation', ['spin', 'pulse', 'expand', 'bounce', 'glow', 'flash', 'none'])->default('pulse');
            $table->string('color')->default('#c8401a');
            $table->string('cta_text')->default('SCAN NOW'); // e.g., "TAP TO ORDER"
            $table->string('center_logo_path')->nullable(); // logo embedded in QR center
            $table->boolean('safe_scan_badge')->default(true);

            // File outputs
            $table->string('png_path')->nullable();
            $table->string('gif_path')->nullable();
            $table->string('webp_path')->nullable();

            // Dynamic QR - destination can be updated
            $table->boolean('is_dynamic')->default(true);
            $table->boolean('is_active')->default(true);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scan_logos');
    }
};
