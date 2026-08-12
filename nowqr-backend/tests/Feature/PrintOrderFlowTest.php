<?php

namespace Tests\Feature;

use App\Models\PrintArtwork;
use App\Models\PrintOrder;
use App\Models\PrintProduct;
use App\Models\User;
use App\Services\PayPalService;
use App\Services\PrintOrderFulfiller;
use App\Services\Printify\PrintifyClient;
use App\Services\Printify\PrintifyException;
use App\Services\Printify\StubPrintifyClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PrintOrderFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        $this->app->instance(PrintifyClient::class, new StubPrintifyClient());
        config()->set('services.printify.allowed_countries', []);
        config()->set('services.printify.auto_send_to_production', false);
    }

    /**
     * Minimal valid PNG. Only the IHDR chunk matters for dimension checks, so
     * this avoids needing the GD extension.
     */
    private function pngBytes(int $width, int $height): string
    {
        $ihdr = pack('N', $width) . pack('N', $height)
            . chr(8) . chr(6) . chr(0) . chr(0) . chr(0);

        $chunk = static function (string $type, string $data): string {
            return pack('N', strlen($data)) . $type . $data
                . pack('N', crc32($type . $data));
        };

        return "\x89PNG\r\n\x1a\n"
            . $chunk('IHDR', $ihdr)
            . $chunk('IDAT', "\x08\x1d\x01\x00\x00\xff\xff\x00\x00\x00\x02\x00\x01")
            . $chunk('IEND', '');
    }

    private function product(array $overrides = []): PrintProduct
    {
        return PrintProduct::create(array_merge([
            'key' => 'bumper-sticker-11x3',
            'name' => 'Bumper Sticker (11.5" x 3")',
            'width_in' => 11.5,
            'height_in' => 3,
            'print_dpi' => 300,
            'print_width_px' => 3450,
            'print_height_px' => 900,
            'retail_price_cents' => 1995,
            'estimated_cost_cents' => 450,
            'currency' => 'USD',
            'min_quantity' => 1,
            'max_quantity' => 100,
            'is_active' => true,
            'blueprint_id' => 123,
            'print_provider_id' => 45,
            'variant_id' => 6789,
        ], $overrides));
    }

    public function test_artwork_below_print_resolution_is_rejected(): void
    {
        $user = User::factory()->create();
        $product = $this->product();

        $response = $this->actingAs($user)->postJson('/api/print/artwork', [
            'print_product_id' => $product->id,
            'image' => 'data:image/png;base64,' . base64_encode($this->pngBytes(800, 209)),
        ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('800x209', $response->json('message'));
        $this->assertSame(3450, $response->json('required.width'));
    }

    public function test_print_resolution_artwork_is_accepted_and_deduplicated(): void
    {
        $user = User::factory()->create();
        $product = $this->product();
        $image = 'data:image/png;base64,' . base64_encode($this->pngBytes(3450, 900));

        $first = $this->actingAs($user)->postJson('/api/print/artwork', [
            'print_product_id' => $product->id,
            'image' => $image,
        ]);

        $first->assertStatus(201);
        $first->assertJsonPath('reused', false);

        // The same design must not be stored (or later uploaded) twice.
        $second = $this->actingAs($user)->postJson('/api/print/artwork', [
            'print_product_id' => $product->id,
            'image' => $image,
        ]);

        $second->assertStatus(200);
        $second->assertJsonPath('reused', true);
        $this->assertSame($first->json('artwork.id'), $second->json('artwork.id'));
        $this->assertSame(1, PrintArtwork::count());
    }

    public function test_order_total_uses_catalog_price_not_client_input(): void
    {
        $user = User::factory()->create();
        $product = $this->product();
        $artwork = $this->artworkFor($user);
        $this->fakePayPal();

        $response = $this->actingAs($user)->postJson('/api/print/orders', [
            'items' => [[
                'print_product_id' => $product->id,
                'print_artwork_id' => $artwork->id,
                'quantity' => 3,
                // A tampered client price must be ignored entirely.
                'unit_price_cents' => 1,
                'price' => 0.01,
            ]],
            'shipping' => $this->address(),
        ]);

        $response->assertStatus(201);

        $order = PrintOrder::firstOrFail();
        $this->assertSame(1995 * 3, $order->subtotal_cents);
        $this->assertSame(1995 * 3, $order->total_cents);
        $this->assertSame(0, $order->shipping_charged_cents);
        $this->assertSame(PrintOrder::STATUS_PENDING_PAYMENT, $order->status);
    }

    public function test_quantity_above_product_maximum_is_rejected(): void
    {
        $user = User::factory()->create();
        $product = $this->product(['max_quantity' => 10]);
        $artwork = $this->artworkFor($user);
        $this->fakePayPal();

        $response = $this->actingAs($user)->postJson('/api/print/orders', [
            'items' => [[
                'print_product_id' => $product->id,
                'print_artwork_id' => $artwork->id,
                'quantity' => 999,
            ]],
            'shipping' => $this->address(),
        ]);

        $response->assertStatus(422);
        $this->assertSame(0, PrintOrder::count());
    }

    public function test_unshippable_country_is_rejected(): void
    {
        config()->set('services.printify.allowed_countries', ['US', 'CA']);

        $user = User::factory()->create();
        $product = $this->product();
        $artwork = $this->artworkFor($user);

        $response = $this->actingAs($user)->postJson('/api/print/orders', [
            'items' => [[
                'print_product_id' => $product->id,
                'print_artwork_id' => $artwork->id,
                'quantity' => 1,
            ]],
            'shipping' => $this->address(['country' => 'PK']),
        ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('cannot ship to PK', $response->json('message'));
    }

    public function test_artwork_belonging_to_another_user_is_rejected(): void
    {
        $owner = User::factory()->create();
        $attacker = User::factory()->create();
        $product = $this->product();
        $artwork = $this->artworkFor($owner);

        $response = $this->actingAs($attacker)->postJson('/api/print/orders', [
            'items' => [[
                'print_product_id' => $product->id,
                'print_artwork_id' => $artwork->id,
                'quantity' => 1,
            ]],
            'shipping' => $this->address(),
        ]);

        $response->assertStatus(403);
    }

    public function test_paid_order_is_fulfilled_and_records_true_shipping_cost(): void
    {
        $user = User::factory()->create();
        $product = $this->product();
        $artwork = $this->artworkFor($user);
        $order = $this->makeOrder($user, $product, $artwork, quantity: 2);

        $order->update(['status' => PrintOrder::STATUS_PAID, 'paid_at' => now()]);

        $fulfiller = $this->app->make(PrintOrderFulfiller::class);
        $order = $fulfiller->fulfil($order->fresh());

        $this->assertSame(PrintOrder::STATUS_SUBMITTED, $order->status);
        $this->assertNotNull($order->printify_order_id);
        $this->assertFalse($order->needs_attention);

        // Free shipping only stays safe if the real cost is measured.
        $this->assertSame(474, $order->printify_shipping_cost_cents); // US: 399 + 75
        $this->assertSame(900, $order->printify_production_cost_cents); // 450 x 2
        $this->assertNotNull($order->items()->first()->artwork->printify_image_id);

        // Draft only: nothing is sent to production while the flag is off.
        $this->assertNull($order->sent_to_production_at);
    }

    public function test_fulfilment_is_idempotent(): void
    {
        $user = User::factory()->create();
        $product = $this->product();
        $artwork = $this->artworkFor($user);
        $order = $this->makeOrder($user, $product, $artwork);
        $order->update(['status' => PrintOrder::STATUS_PAID, 'paid_at' => now()]);

        $fulfiller = $this->app->make(PrintOrderFulfiller::class);
        $first = $fulfiller->fulfil($order->fresh());
        $printifyId = $first->printify_order_id;

        // A retried verification must not create a second physical order.
        $second = $fulfiller->fulfil($first->fresh()->forceFill([
            'status' => PrintOrder::STATUS_PAID,
        ]));

        $this->assertSame($printifyId, $second->printify_order_id);
    }

    public function test_unmapped_product_flags_a_paid_order_for_attention(): void
    {
        $user = User::factory()->create();
        // No blueprint mapping yet — the catalog exists but cannot be fulfilled.
        $product = $this->product(['blueprint_id' => null, 'print_provider_id' => null, 'variant_id' => null]);
        $artwork = $this->artworkFor($user);
        $order = $this->makeOrder($user, $product, $artwork);
        $order->update(['status' => PrintOrder::STATUS_PAID, 'paid_at' => now()]);

        $fulfiller = $this->app->make(PrintOrderFulfiller::class);

        try {
            $fulfiller->fulfil($order->fresh());
            $this->fail('Expected fulfilment to fail for an unmapped product.');
        } catch (PrintifyException) {
            // expected
        }

        $order->refresh();

        // The customer has paid; this must never fail silently.
        $this->assertSame(PrintOrder::STATUS_FULFILMENT_FAILED, $order->status);
        $this->assertTrue($order->needs_attention);
        $this->assertNotNull($order->failure_reason);
    }

    public function test_unpaid_order_is_never_fulfilled(): void
    {
        $user = User::factory()->create();
        $product = $this->product();
        $artwork = $this->artworkFor($user);
        $order = $this->makeOrder($user, $product, $artwork);

        $this->expectException(PrintifyException::class);

        $this->app->make(PrintOrderFulfiller::class)->fulfil($order);
    }

    // ─── helpers ────────────────────────────────────────────────

    /**
     * Stand in for PayPal so checkout can be exercised without credentials.
     */
    private function fakePayPal(): void
    {
        $fake = new class extends PayPalService {
            public function isConfigured(): bool
            {
                return true;
            }

            public function createPhysicalOrder(
                string $referenceId,
                string $customId,
                float $amountUsd,
                string $description,
                array $shippingAddress,
                string $shippingFullName,
                string $returnUrl,
                string $cancelUrl,
            ): array {
                return [
                    'id' => 'PAYPAL-' . $referenceId,
                    'approve_url' => 'https://paypal.test/approve',
                ];
            }
        };

        $this->app->instance(PayPalService::class, $fake);
    }

    private function artworkFor(User $user): PrintArtwork
    {
        Storage::disk('public')->put('print-artwork/test.png', $this->pngBytes(3450, 900));

        return PrintArtwork::create([
            'user_id' => $user->id,
            'file_path' => 'print-artwork/test.png',
            'width_px' => 3450,
            'height_px' => 900,
            'byte_size' => 100,
            'checksum' => hash('sha256', 'test'),
        ]);
    }

    private function address(array $overrides = []): array
    {
        return array_merge([
            'first_name' => 'Ada',
            'last_name' => 'Lovelace',
            'email' => 'ada@example.com',
            'address1' => '1 Analytical Way',
            'city' => 'Austin',
            'region' => 'TX',
            'country' => 'US',
            'zip' => '73301',
        ], $overrides);
    }

    private function makeOrder(
        User $user,
        PrintProduct $product,
        PrintArtwork $artwork,
        int $quantity = 1,
    ): PrintOrder {
        $subtotal = $product->retail_price_cents * $quantity;

        $order = PrintOrder::create([
            'user_id' => $user->id,
            'status' => PrintOrder::STATUS_PENDING_PAYMENT,
            'subtotal_cents' => $subtotal,
            'shipping_charged_cents' => 0,
            'total_cents' => $subtotal,
            'currency' => 'USD',
            'ship_first_name' => 'Ada',
            'ship_last_name' => 'Lovelace',
            'ship_email' => 'ada@example.com',
            'ship_address1' => '1 Analytical Way',
            'ship_city' => 'Austin',
            'ship_region' => 'TX',
            'ship_country' => 'US',
            'ship_zip' => '73301',
        ]);

        $order->items()->create([
            'print_product_id' => $product->id,
            'print_artwork_id' => $artwork->id,
            'quantity' => $quantity,
            'unit_price_cents' => $product->retail_price_cents,
            'total_price_cents' => $subtotal,
            'product_name' => $product->name,
            'blueprint_id' => $product->blueprint_id,
            'print_provider_id' => $product->print_provider_id,
            'variant_id' => $product->variant_id,
        ]);

        return $order->fresh();
    }
}
