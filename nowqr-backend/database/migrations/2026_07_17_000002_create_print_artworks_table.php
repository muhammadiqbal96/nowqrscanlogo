<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('print_artworks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('scan_logo_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('campaign_flyer_id')->nullable()->constrained()->nullOnDelete();

            $table->string('file_path');
            $table->unsignedInteger('width_px');
            $table->unsignedInteger('height_px');
            $table->unsignedInteger('byte_size')->default(0);
            $table->string('checksum', 64)->nullable();

            // Printify's id for the uploaded image, reused across orders so the
            // same artwork is never uploaded twice.
            $table->string('printify_image_id')->nullable();
            $table->string('printify_preview_url', 2048)->nullable();
            $table->timestamp('uploaded_to_printify_at')->nullable();

            $table->json('design_snapshot')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'checksum']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('print_artworks');
    }
};
