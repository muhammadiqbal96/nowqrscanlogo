<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('connected_platforms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name'); // e.g. "My Blog", "Client Store"
            $table->enum('type', ['wordpress', 'shopify', 'custom'])->default('wordpress');
            $table->string('site_url');
            $table->text('api_key')->nullable();       // REST API key / app password
            $table->text('api_secret')->nullable();     // secret or token
            $table->string('username')->nullable();     // WP username
            $table->enum('status', ['active', 'inactive', 'error'])->default('active');
            $table->timestamp('last_synced_at')->nullable();
            $table->json('meta')->nullable();           // extra platform-specific config
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('connected_platforms');
    }
};
