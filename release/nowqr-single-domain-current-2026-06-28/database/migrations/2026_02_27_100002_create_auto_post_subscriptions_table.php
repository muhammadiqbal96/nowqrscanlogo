<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('auto_post_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('frequency', ['daily', 'weekly', 'monthly'])->default('weekly');
            $table->integer('posts_per_cycle')->default(1);           // how many posts per frequency cycle
            $table->integer('credits_per_post')->default(2);          // credits charged per post
            $table->enum('status', ['active', 'paused', 'cancelled'])->default('active');
            $table->string('niche')->nullable();                      // user's niche/topic focus
            $table->string('tone')->default('professional');          // writing tone
            $table->json('keywords')->nullable();                     // SEO keywords
            $table->text('custom_instructions')->nullable();          // user's custom guidance
            $table->timestamp('next_post_at')->nullable();            // next scheduled post time
            $table->timestamp('last_posted_at')->nullable();
            $table->integer('total_posts_delivered')->default(0);
            $table->integer('total_credits_spent')->default(0);
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('next_post_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auto_post_subscriptions');
    }
};
