<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scan_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scan_logo_id')->constrained()->onDelete('cascade');
            $table->foreignId('campaign_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // owner of the QR

            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->string('device_type')->nullable(); // mobile, desktop, tablet
            $table->string('browser')->nullable();
            $table->string('os')->nullable();
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->string('region')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->string('referrer')->nullable();
            $table->enum('scan_type', ['qr_scan', 'button_click'])->default('qr_scan');

            $table->timestamp('scanned_at');
            $table->timestamps();

            $table->index(['scan_logo_id', 'scanned_at']);
            $table->index(['user_id', 'scanned_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scan_events');
    }
};
