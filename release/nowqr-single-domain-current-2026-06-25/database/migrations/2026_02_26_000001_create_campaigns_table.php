<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('business_name');
            $table->text('business_description')->nullable();
            $table->string('target_audience')->nullable();
            $table->enum('cta_type', ['buy', 'give', 'pay', 'call', 'book', 'watch', 'order', 'custom'])->default('buy');
            $table->string('custom_cta')->nullable();

            // AI-generated content
            $table->string('headline')->nullable();
            $table->string('sub_headline')->nullable();
            $table->text('description')->nullable();
            $table->string('cta_button_text')->nullable();

            // Page design
            $table->json('page_design')->nullable(); // stores editor state (colors, fonts, layout, images)
            $table->string('logo_path')->nullable();
            $table->string('background_image_path')->nullable();
            $table->string('primary_color')->default('#c8401a');
            $table->string('font_family')->default('Inter');

            // Hosting
            $table->string('subdomain')->nullable(); // e.g., 'buy', 'give', 'pay'
            $table->string('slug')->unique(); // e.g., 'jordanshop' -> buy.nowqr.com/jordanshop
            $table->boolean('is_published')->default(false);

            $table->enum('status', ['draft', 'active', 'paused', 'expired'])->default('draft');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaigns');
    }
};
