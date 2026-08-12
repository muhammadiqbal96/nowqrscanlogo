<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('print_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('order_number')->unique();

            // pending_payment → paid → submitted → in_production → shipped → delivered
            // Off-path: cancelled, payment_failed, fulfilment_failed
            $table->string('status')->default('pending_payment');

            // Money, in minor units. Customer pays no shipping (baked into price),
            // so shipping_cents is what *we* pay Printify — recorded for margin.
            $table->unsignedInteger('subtotal_cents')->default(0);
            $table->unsignedInteger('shipping_charged_cents')->default(0);
            $table->unsignedInteger('total_cents')->default(0);
            $table->string('currency', 3)->default('USD');
            $table->integer('printify_shipping_cost_cents')->nullable();
            $table->integer('printify_production_cost_cents')->nullable();

            $table->string('payment_provider')->default('paypal');
            $table->string('payment_id')->nullable()->index();
            $table->string('payment_capture_id')->nullable();
            $table->timestamp('paid_at')->nullable();

            $table->string('printify_order_id')->nullable()->index();
            $table->string('printify_status')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('sent_to_production_at')->nullable();

            // Shipping destination
            $table->string('ship_first_name');
            $table->string('ship_last_name');
            $table->string('ship_email');
            $table->string('ship_phone')->nullable();
            $table->string('ship_address1');
            $table->string('ship_address2')->nullable();
            $table->string('ship_city');
            $table->string('ship_region')->nullable();
            $table->string('ship_country', 2);
            $table->string('ship_zip', 32);

            $table->string('tracking_number')->nullable();
            $table->string('tracking_url', 2048)->nullable();
            $table->string('carrier')->nullable();

            $table->text('failure_reason')->nullable();
            $table->boolean('needs_attention')->default(false);
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['needs_attention', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('print_orders');
    }
};
