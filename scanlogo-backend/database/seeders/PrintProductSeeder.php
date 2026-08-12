<?php

namespace Database\Seeders;

use App\Models\PrintProduct;
use Illuminate\Database\Seeder;

class PrintProductSeeder extends Seeder
{
    private const DPI = 300;

    /**
     * Retail prices are shipping-inclusive, so they must clear production plus
     * the worst-case destination. Priced against the stub's $10.99 rest-of-world
     * rate; re-check them against real Printify costs before going live.
     */
    public function run(): void
    {
        $products = [
            [
                'key' => 'bumper-sticker-11x3',
                'name' => 'Bumper Sticker (11.5" x 3")',
                'description' => 'Weather-resistant outdoor vinyl bumper sticker. The classic car-bumper size.',
                'width_in' => 11.5,
                'height_in' => 3,
                'retail_price_cents' => 1995,
                'estimated_cost_cents' => 450,
                'canvas_preset' => 'sticker-11.5x3',
                'sort_order' => 10,
            ],
            [
                'key' => 'bumper-sticker-10x3',
                'name' => 'Bumper Sticker (10" x 3")',
                'description' => 'Slightly shorter outdoor vinyl bumper sticker. Good for windows and laptops.',
                'width_in' => 10,
                'height_in' => 3,
                'retail_price_cents' => 1795,
                'estimated_cost_cents' => 420,
                'canvas_preset' => 'sticker-10x3',
                'sort_order' => 20,
            ],
            [
                'key' => 'sticker-5x3',
                'name' => 'Vinyl Sticker (5" x 3")',
                'description' => 'Compact kiss-cut vinyl sticker. Ideal for packaging and giveaways.',
                'width_in' => 5,
                'height_in' => 3,
                'retail_price_cents' => 1295,
                'estimated_cost_cents' => 260,
                'canvas_preset' => 'sticker-5x3',
                'sort_order' => 30,
            ],
            [
                'key' => 'sticker-square-3x3',
                'name' => 'Square Sticker (3" x 3")',
                'description' => 'Die-cut square vinyl sticker. Best fit for a ScanLogo badge on its own.',
                'width_in' => 3,
                'height_in' => 3,
                'retail_price_cents' => 995,
                'estimated_cost_cents' => 210,
                'canvas_preset' => 'sticker-3x3',
                'sort_order' => 40,
            ],
        ];

        foreach ($products as $product) {
            $product['print_dpi'] = self::DPI;
            $product['print_width_px'] = (int) round($product['width_in'] * self::DPI);
            $product['print_height_px'] = (int) round($product['height_in'] * self::DPI);
            $product['currency'] = 'USD';
            $product['is_active'] = true;

            // Placeholder Printify coordinates so the full order flow (including
            // the stub fulfiller) is testable out of the box. Before going live,
            // remap these to your real Printify blueprint/provider/variant via
            // the admin endpoint PUT /api/admin/print/products/{id}. In stub mode
            // the values are never sent anywhere real.
            $product['blueprint_id'] ??= 68;      // Printify "Kiss-Cut Stickers" blueprint
            $product['print_provider_id'] ??= 1;  // placeholder provider
            $product['variant_id'] ??= 1;         // placeholder variant

            PrintProduct::updateOrCreate(['key' => $product['key']], $product);
        }
    }
}
