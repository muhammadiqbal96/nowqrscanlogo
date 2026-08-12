<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('print_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('print_order_id')->constrained()->onDelete('cascade');
            $table->foreignId('print_product_id')->constrained()->restrictOnDelete();
            $table->foreignId('print_artwork_id')->constrained()->restrictOnDelete();

            $table->unsignedInteger('quantity');
            $table->unsignedInteger('unit_price_cents');
            $table->unsignedInteger('total_price_cents');

            // Copied at purchase time so an admin editing the catalog later can
            // never change what a customer already bought.
            $table->string('product_name');
            $table->unsignedBigInteger('blueprint_id')->nullable();
            $table->unsignedBigInteger('print_provider_id')->nullable();
            $table->unsignedBigInteger('variant_id')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('print_order_items');
    }
};
