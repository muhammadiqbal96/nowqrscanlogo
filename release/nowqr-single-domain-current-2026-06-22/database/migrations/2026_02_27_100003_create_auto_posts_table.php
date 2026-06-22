<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('auto_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('subscription_id')->constrained('auto_post_subscriptions')->onDelete('cascade');
            $table->foreignId('platform_id')->nullable()->constrained('connected_platforms')->onDelete('set null');
            $table->string('title');
            $table->text('excerpt')->nullable();
            $table->longText('content');
            $table->string('category')->nullable();
            $table->json('tags')->nullable();
            $table->string('featured_image_url')->nullable();
            $table->enum('status', ['draft', 'scheduled', 'published', 'failed'])->default('draft');
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->string('external_post_id')->nullable();  // ID on the external platform
            $table->string('external_post_url')->nullable();  // URL on the external platform
            $table->integer('credits_charged')->default(0);
            $table->text('error_message')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('scheduled_at');
            $table->index('subscription_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auto_posts');
    }
};
