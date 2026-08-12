<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('print_products', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // e.g. bumper-sticker-11x3
            $table->string('name');
            $table->text('description')->nullable();

            // Printify catalog coordinates. Nullable so products can be defined
            // before the Printify account exists.
            $table->unsignedBigInteger('blueprint_id')->nullable();
            $table->unsignedBigInteger('print_provider_id')->nullable();
            $table->unsignedBigInteger('variant_id')->nullable();

            // Physical size and the artwork the editor must produce for it.
            $table->decimal('width_in', 6, 2);
            $table->decimal('height_in', 6, 2);
            $table->unsignedInteger('print_dpi')->default(300);
            $table->unsignedInteger('print_width_px');
            $table->unsignedInteger('print_height_px');

            // Retail price is shipping-inclusive; the customer pays no shipping.
            $table->unsignedInteger('retail_price_cents');
            $table->unsignedInteger('estimated_cost_cents')->default(0);
            $table->string('currency', 3)->default('USD');

            $table->unsignedInteger('min_quantity')->default(1);
            $table->unsignedInteger('max_quantity')->default(100);
            $table->string('canvas_preset')->nullable(); // matches frontend CANVAS_SIZES key
            $table->string('mockup_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['is_active', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('print_products');
    }
};
