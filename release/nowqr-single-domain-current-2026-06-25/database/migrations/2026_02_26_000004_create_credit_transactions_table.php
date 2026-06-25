<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('credit_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            $table->integer('amount'); // positive = credit added, negative = credit spent
            $table->integer('balance_after'); // user's balance after this transaction
            $table->enum('type', ['purchase', 'usage', 'refund', 'bonus', 'signup_bonus']);
            $table->string('description'); // e.g., "Generated AI ad page", "Created ScanLogo"

            // Payment info (for purchases)
            $table->string('payment_provider')->nullable(); // 'stripe', 'paypal', etc.
            $table->string('payment_id')->nullable();
            $table->decimal('payment_amount', 10, 2)->nullable(); // dollar amount paid
            $table->string('payment_currency', 3)->default('USD');

            // Reference
            $table->string('reference_type')->nullable(); // 'campaign', 'scan_logo'
            $table->unsignedBigInteger('reference_id')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('credit_transactions');
    }
};
