<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('scan_logos') && !Schema::hasColumn('scan_logos', 'subtitle')) {
            Schema::table('scan_logos', function (Blueprint $table) {
                // Secondary "where the action goes" line shown under the headline
                // inside the Action ScanLogo text box (e.g. "MENSUAL", "Win big today").
                $table->string('subtitle')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('scan_logos') && Schema::hasColumn('scan_logos', 'subtitle')) {
            Schema::table('scan_logos', function (Blueprint $table) {
                $table->dropColumn('subtitle');
            });
        }
    }
};
