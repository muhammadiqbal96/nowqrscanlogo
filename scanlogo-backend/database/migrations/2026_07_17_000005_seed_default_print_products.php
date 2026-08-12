<?php

use Database\Seeders\PrintProductSeeder;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Seed the default sticker catalog so a fresh deploy has products to sell
     * without a manual `db:seed` step. The seeder upserts by key, so this is
     * idempotent and safe to re-run.
     *
     * Skipped under tests: those build their own products and a pre-seeded
     * catalog would collide on the unique `key`.
     */
    public function up(): void
    {
        if (app()->runningUnitTests()) {
            return;
        }

        (new PrintProductSeeder())->run();
    }

    public function down(): void
    {
        // Leave catalog data in place on rollback; dropping the table (handled
        // by the create migration) already removes it.
    }
};
