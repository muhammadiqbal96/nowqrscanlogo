<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('scan_logos') && !Schema::hasColumn('scan_logos', 'banner')) {
            Schema::table('scan_logos', function (Blueprint $table) {
                $table->string('banner')->nullable()->default('restaurant');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('scan_logos') && Schema::hasColumn('scan_logos', 'banner')) {
            Schema::table('scan_logos', function (Blueprint $table) {
                $table->dropColumn('banner');
            });
        }
    }
};
