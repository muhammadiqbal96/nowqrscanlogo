<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('scan_logos') || Schema::hasColumn('scan_logos', 'wrapper_color')) {
            return;
        }

        Schema::table('scan_logos', function (Blueprint $table) {
            $table->string('wrapper_color')->default('#c8401a');
        });

        DB::table('scan_logos')->update([
            'wrapper_color' => DB::raw('color'),
        ]);
    }

    public function down(): void
    {
        if (!Schema::hasTable('scan_logos') || !Schema::hasColumn('scan_logos', 'wrapper_color')) {
            return;
        }

        Schema::table('scan_logos', function (Blueprint $table) {
            $table->dropColumn('wrapper_color');
        });
    }
};
