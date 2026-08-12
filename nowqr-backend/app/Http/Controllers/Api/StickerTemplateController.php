<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PrintProduct;
use App\Services\StickerTemplateComposer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class StickerTemplateController extends Controller
{
    public function __construct(private readonly StickerTemplateComposer $composer)
    {
    }

    /**
     * Generate ready-to-edit sticker designs.
     *
     * The model only supplies the brief (copy, palette, layout choice); the
     * composer lays it out. Every template comes back as a complete canvas
     * state the editor can load as-is, so the user never starts from a blank
     * canvas.
     */
    public function generate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_key' => ['required', 'string', 'exists:print_products,key'],
            'business_name' => ['required', 'string', 'max:255'],
            'business_description' => ['nullable', 'string', 'max:2000'],
            'tone' => ['nullable', 'string', 'max:60'],
            'scan_logo_id' => ['nullable', 'exists:scan_logos,id'],
            'count' => ['nullable', 'integer', 'min:1', 'max:6'],
        ]);

        $user = $request->user();

        if (!empty($validated['scan_logo_id'])
            && !$user->scanLogos()->whereKey($validated['scan_logo_id'])->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $product = PrintProduct::where('key', $validated['product_key'])->firstOrFail();
        $count = (int) ($validated['count'] ?? 4);

        $apiKey = config('services.openai.api_key');
        $usedAi = false;

        if ($apiKey && $apiKey !== 'your-openai-api-key') {
            try {
                $briefs = $this->generateBriefs($validated, $count, $apiKey);
                $usedAi = true;
            } catch (\Throwable $e) {
                Log::warning('Sticker brief generation failed; using built-in briefs', [
                    'error' => $e->getMessage(),
                ]);
                $briefs = $this->fallbackBriefs($validated, $count);
            }
        } else {
            $briefs = $this->fallbackBriefs($validated, $count);
        }

        $templates = [];
        foreach ($briefs as $index => $brief) {
            $composed = $this->composer->compose(
                brief: $brief,
                canvasWidth: $product->print_width_px,
                canvasHeight: $product->print_height_px,
                dpi: $product->print_dpi,
                aspectRatio: $product->canvas_preset ?? 'sticker-11.5x3',
                scanLogoId: $validated['scan_logo_id'] ?? null,
            );

            $templates[] = [
                'id' => 'tpl_' . $index,
                'name' => $brief['name'] ?? ('Design ' . ($index + 1)),
                'headline' => $brief['headline'] ?? '',
                'subtitle' => $brief['subtitle'] ?? '',
                'layout' => $brief['layout'] ?? 'qr-left',
                'canvas_state' => [
                    'elements' => $composed['elements'],
                    'bgColor' => $composed['bgColor'],
                    'aspectRatio' => $composed['aspectRatio'],
                ],
                'warnings' => $composed['warnings'],
            ];
        }

        return response()->json([
            'message' => 'Templates generated.',
            'ai_generated' => $usedAi,
            'product' => $product,
            'templates' => $templates,
        ]);
    }

    /**
     * @return array<int, array>
     */
    private function generateBriefs(array $data, int $count, string $apiKey): array
    {
        $layouts = implode(', ', StickerTemplateComposer::LAYOUTS);
        $description = $data['business_description'] ?? '';
        $tone = $data['tone'] ?? 'bold and friendly';

        $prompt = <<<PROMPT
Generate {$count} distinct bumper sticker design briefs.

Business: {$data['business_name']}
Description: {$description}
Tone: {$tone}

A bumper sticker is read from several metres away by someone in a moving car.
Headlines must be extremely short and high impact.

Respond with JSON only, shaped exactly like:
{"briefs":[{
  "name": "short design name",
  "headline": "max 18 characters, no emoji",
  "subtitle": "max 28 characters, may be empty",
  "cta_text": "max 14 characters, may be empty",
  "layout": one of [{$layouts}],
  "font": one of [Inter, Montserrat, Poppins, Oswald, Raleway],
  "colors": {"background": "#rrggbb", "primary": "#rrggbb", "accent": "#rrggbb", "text": "#rrggbb"}
}]}

Rules:
- Vary layout and palette across the briefs.
- Background and text must have strong contrast; these are printed, not backlit.
- All colours must be 6-digit hex.
PROMPT;

        $response = Http::timeout(45)
            ->withToken($apiKey)
            ->acceptJson()
            ->post('https://api.openai.com/v1/chat/completions', [
                'model' => 'gpt-4o',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a print design assistant for outdoor vinyl stickers. Respond with valid JSON only.',
                    ],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'temperature' => 0.9,
                'max_tokens' => 1500,
                'response_format' => ['type' => 'json_object'],
            ]);

        if (!$response->successful()) {
            throw new \RuntimeException('OpenAI returned status ' . $response->status());
        }

        $content = $response->json('choices.0.message.content') ?? '';
        $parsed = json_decode($content, true);

        if (!is_array($parsed) || !isset($parsed['briefs']) || !is_array($parsed['briefs'])) {
            throw new \RuntimeException('Invalid brief payload from OpenAI');
        }

        return array_slice($parsed['briefs'], 0, $count);
    }

    /**
     * Used when OpenAI is unconfigured or failing. The feature must still work.
     *
     * @return array<int, array>
     */
    private function fallbackBriefs(array $data, int $count): array
    {
        $name = $data['business_name'];

        $presets = [
            [
                'name' => 'Bold Contrast',
                'headline' => 'SCAN ME',
                'subtitle' => $name,
                'cta_text' => '',
                'layout' => 'qr-left',
                'font' => 'Inter',
                'colors' => ['background' => '#111111', 'primary' => '#c8401a', 'accent' => '#c8401a', 'text' => '#ffffff'],
            ],
            [
                'name' => 'Clean Band',
                'headline' => 'FOLLOW US',
                'subtitle' => $name,
                'cta_text' => 'TAP HERE',
                'layout' => 'band-left',
                'font' => 'Montserrat',
                'colors' => ['background' => '#ffffff', 'primary' => '#2563eb', 'accent' => '#2563eb', 'text' => '#111111'],
            ],
            [
                'name' => 'Night Drive',
                'headline' => 'GET THE APP',
                'subtitle' => $name,
                'cta_text' => '',
                'layout' => 'qr-right',
                'font' => 'Oswald',
                'colors' => ['background' => '#0f172a', 'primary' => '#38bdf8', 'accent' => '#38bdf8', 'text' => '#ffffff'],
            ],
            [
                'name' => 'Warm Invite',
                'headline' => 'ORDER NOW',
                'subtitle' => $name,
                'cta_text' => 'SCAN',
                'layout' => 'qr-left',
                'font' => 'Poppins',
                'colors' => ['background' => '#fef3c7', 'primary' => '#b45309', 'accent' => '#b45309', 'text' => '#111111'],
            ],
            [
                'name' => 'Minimal Mono',
                'headline' => 'VISIT US',
                'subtitle' => $name,
                'cta_text' => '',
                'layout' => 'centered',
                'font' => 'Raleway',
                'colors' => ['background' => '#ffffff', 'primary' => '#111111', 'accent' => '#111111', 'text' => '#111111'],
            ],
            [
                'name' => 'Signal Green',
                'headline' => 'JOIN US',
                'subtitle' => $name,
                'cta_text' => 'SCAN ME',
                'layout' => 'band-left',
                'font' => 'Inter',
                'colors' => ['background' => '#052e16', 'primary' => '#22c55e', 'accent' => '#22c55e', 'text' => '#ffffff'],
            ],
        ];

        return array_slice($presets, 0, $count);
    }
}
