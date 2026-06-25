<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const SHAPES_UP = "('shield','circle','gear','eye','diamond','hexagon','square','drum','tv')";
    private const SHAPES_DOWN = "('shield','circle','gear','eye','diamond','hexagon','square','drum')";

    private const ANIMATIONS_UP = "('spin','pulse','expand','bounce','glow','flash','orbit','none')";
    private const ANIMATIONS_DOWN = "('spin','pulse','expand','bounce','glow','flash','none')";

    public function up(): void
    {
        if (!Schema::hasTable('scan_logos')) {
            return;
        }

        if (DB::getDriverName() === 'sqlite') {
            $this->rebuildSqliteTable(self::SHAPES_UP, self::ANIMATIONS_UP);
            return;
        }

        DB::statement("ALTER TABLE scan_logos MODIFY COLUMN shape ENUM('shield','circle','gear','eye','diamond','hexagon','square','drum','tv') NOT NULL DEFAULT 'shield'");
        DB::statement("ALTER TABLE scan_logos MODIFY COLUMN animation ENUM('spin','pulse','expand','bounce','glow','flash','orbit','none') NOT NULL DEFAULT 'pulse'");
    }

    public function down(): void
    {
        if (!Schema::hasTable('scan_logos')) {
            return;
        }

        if (DB::getDriverName() === 'sqlite') {
            $this->rebuildSqliteTable(self::SHAPES_DOWN, self::ANIMATIONS_DOWN);
            return;
        }

        DB::statement("ALTER TABLE scan_logos MODIFY COLUMN shape ENUM('shield','circle','gear','eye','diamond','hexagon','square','drum') NOT NULL DEFAULT 'shield'");
        DB::statement("ALTER TABLE scan_logos MODIFY COLUMN animation ENUM('spin','pulse','expand','bounce','glow','flash','none') NOT NULL DEFAULT 'pulse'");
    }

    private function rebuildSqliteTable(string $allowedShapes, string $allowedAnimations): void
    {
        DB::statement('PRAGMA foreign_keys = OFF');

        try {
            DB::beginTransaction();

            DB::statement('DROP TABLE IF EXISTS scan_logos_tmp');

            DB::statement(
                "CREATE TABLE scan_logos_tmp (
                    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                    user_id INTEGER NOT NULL,
                    campaign_id INTEGER NULL,
                    destination_url VARCHAR NOT NULL,
                    short_code VARCHAR NOT NULL UNIQUE,
                    short_url VARCHAR NOT NULL,
                    shape VARCHAR NOT NULL CHECK (shape IN {$allowedShapes}) DEFAULT 'shield',
                    animation VARCHAR NOT NULL CHECK (animation IN {$allowedAnimations}) DEFAULT 'pulse',
                    color VARCHAR NOT NULL DEFAULT '#c8401a',
                    cta_text VARCHAR NOT NULL DEFAULT 'SCAN NOW',
                    center_logo_path VARCHAR NULL,
                    safe_scan_badge INTEGER NOT NULL DEFAULT 1,
                    png_path VARCHAR NULL,
                    gif_path VARCHAR NULL,
                    webp_path VARCHAR NULL,
                    is_dynamic INTEGER NOT NULL DEFAULT 1,
                    is_active INTEGER NOT NULL DEFAULT 1,
                    created_at DATETIME NULL,
                    updated_at DATETIME NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL
                )"
            );

            DB::statement(
                "INSERT INTO scan_logos_tmp (
                    id, user_id, campaign_id, destination_url, short_code, short_url, shape,
                    animation, color, cta_text, center_logo_path, safe_scan_badge,
                    png_path, gif_path, webp_path, is_dynamic, is_active, created_at, updated_at
                )
                SELECT
                    id, user_id, campaign_id, destination_url, short_code, short_url,
                    CASE
                        WHEN shape IN {$allowedShapes} THEN shape
                        ELSE 'square'
                    END,
                    CASE
                        WHEN animation IN {$allowedAnimations} THEN animation
                        ELSE 'pulse'
                    END,
                    color, cta_text, center_logo_path, safe_scan_badge,
                    png_path, gif_path, webp_path, is_dynamic, is_active, created_at, updated_at
                FROM scan_logos"
            );

            DB::statement('DROP TABLE scan_logos');
            DB::statement('ALTER TABLE scan_logos_tmp RENAME TO scan_logos');

            DB::commit();
        } catch (\Throwable $exception) {
            DB::rollBack();
            throw $exception;
        } finally {
            DB::statement('PRAGMA foreign_keys = ON');
        }
    }
};
