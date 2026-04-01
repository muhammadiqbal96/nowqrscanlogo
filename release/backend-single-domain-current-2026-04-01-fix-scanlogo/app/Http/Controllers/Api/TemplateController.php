<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TemplateController extends Controller
{
    /**
     * Generate AI-powered template suggestions for a campaign.
     * Uses OpenAI to create poster content (taglines, color palettes, layout hints).
     */
    public function generateTemplates(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'campaign_id' => ['required', 'exists:campaigns,id'],
            'business_name' => ['required', 'string', 'max:255'],
            'business_description' => ['required', 'string', 'max:2000'],
            'target_audience' => ['nullable', 'string', 'max:500'],
            'cta_type' => ['required', 'string'],
            'category' => ['nullable', 'string', 'max:100'],
        ]);

        $user = $request->user();

        // Verify campaign belongs to user
        $campaign = $user->campaigns()->findOrFail($validated['campaign_id']);

        try {
            $apiKey = config('services.openai.api_key');

            if (!$apiKey || $apiKey === 'your-openai-api-key') {
                $templates = $this->getMockTemplates($validated);
            } else {
                $templates = $this->callOpenAIForTemplates($validated, $apiKey);
            }

            return response()->json([
                'message' => 'Templates generated successfully',
                'templates' => $templates,
                'campaign' => $campaign,
            ]);
        } catch (\Exception $e) {
            Log::error('Template generation error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to generate templates. Using defaults.',
                'templates' => $this->getMockTemplates($validated),
                'campaign' => $campaign,
            ]);
        }
    }

    /**
     * Get template categories.
     */
    public function categories(): JsonResponse
    {
        return response()->json([
            'categories' => [
                ['id' => 'all', 'name' => 'All Templates', 'icon' => 'grid'],
                ['id' => 'promotion', 'name' => 'Promotion', 'icon' => 'tag'],
                ['id' => 'fashion', 'name' => 'Fashion', 'icon' => 'shirt'],
                ['id' => 'food', 'name' => 'Food & Drink', 'icon' => 'utensils'],
                ['id' => 'event', 'name' => 'Events', 'icon' => 'calendar'],
                ['id' => 'beauty', 'name' => 'Beauty', 'icon' => 'sparkles'],
                ['id' => 'business', 'name' => 'Business', 'icon' => 'briefcase'],
                ['id' => 'fitness', 'name' => 'Fitness', 'icon' => 'dumbbell'],
                ['id' => 'product', 'name' => 'Product', 'icon' => 'box'],
                ['id' => 'seasonal', 'name' => 'Seasonal', 'icon' => 'sun'],
                ['id' => 'minimal', 'name' => 'Minimal', 'icon' => 'minus'],
                ['id' => 'bold', 'name' => 'Bold', 'icon' => 'zap'],
            ],
        ]);
    }

    private function callOpenAIForTemplates(array $data, string $apiKey): array
    {
        $prompt = $this->buildTemplatePrompt($data);

        $ch = curl_init('https://api.openai.com/v1/chat/completions');

        $payload = json_encode([
            'model' => 'gpt-4o',
            'messages' => [
                ['role' => 'system', 'content' => 'You are a professional graphic design assistant. Always respond with valid JSON only.'],
                ['role' => 'user', 'content' => $prompt],
            ],
            'temperature' => 0.9,
            'max_tokens' => 2000,
        ]);

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                "Authorization: Bearer {$apiKey}",
            ],
            CURLOPT_POSTFIELDS => $payload,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            throw new \Exception("OpenAI API returned status {$httpCode}");
        }

        $responseData = json_decode($response, true);
        $content = $responseData['choices'][0]['message']['content'] ?? '';

        $content = preg_replace('/^```json\s*/', '', $content);
        $content = preg_replace('/\s*```$/', '', $content);

        $parsed = json_decode($content, true);

        if (!$parsed || !isset($parsed['templates'])) {
            throw new \Exception('Invalid template response from OpenAI');
        }

        return $parsed['templates'];
    }

    private function buildTemplatePrompt(array $data): string
    {
        $category = $data['category'] ?? 'general';

        return <<<PROMPT
Generate 6 unique poster/flyer template suggestions for a business.

Business: {$data['business_name']}
Description: {$data['business_description']}
Target Audience: {$data['target_audience']}
CTA Type: {$data['cta_type']}
Category preference: {$category}

For each template provide:
- "name": Creative template name (e.g., "Spring Blossom", "Bold Impact")
- "tagline": A short catchy tagline for the poster (max 40 chars)
- "subtitle": Supporting text (max 60 chars)
- "body_text": Short body copy (max 120 chars)
- "cta_text": Call-to-action button text (max 20 chars)
- "color_scheme": Object with "primary", "secondary", "accent", "text", "background" hex colors
- "font_pair": Object with "heading" and "body" font names (use Google Fonts like Inter, Montserrat, Playfair Display, Poppins, Lato, Roboto, Oswald, Raleway)
- "mood": One of: elegant, bold, playful, minimal, warm, cool, luxury, energetic
- "layout": One of: centered, left-aligned, right-aligned, split, diagonal, stacked
- "category": Best matching category from: promotion, fashion, food, event, beauty, business, fitness, product, seasonal, minimal, bold

Respond ONLY with valid JSON in this format:
{
  "templates": [
    { "name": "...", "tagline": "...", "subtitle": "...", "body_text": "...", "cta_text": "...", "color_scheme": {"primary":"#...","secondary":"#...","accent":"#...","text":"#...","background":"#..."}, "font_pair": {"heading":"...","body":"..."}, "mood": "...", "layout": "...", "category": "..." }
  ]
}
PROMPT;
    }

    private function getMockTemplates(array $data): array
    {
        $businessName = $data['business_name'];

        return [
            [
                'name' => 'Spring Blossom',
                'tagline' => "Discover {$businessName}",
                'subtitle' => 'Fresh styles for the new season',
                'body_text' => "Experience the best of {$businessName}. Quality you can trust, service you'll love.",
                'cta_text' => 'Shop Now',
                'color_scheme' => ['primary' => '#2d5a3d', 'secondary' => '#f5f0e8', 'accent' => '#c8956c', 'text' => '#1a1a1a', 'background' => '#f5f0e8'],
                'font_pair' => ['heading' => 'Playfair Display', 'body' => 'Inter'],
                'mood' => 'elegant',
                'layout' => 'centered',
                'category' => 'promotion',
            ],
            [
                'name' => 'Bold Impact',
                'tagline' => 'Don\'t Miss Out',
                'subtitle' => 'Limited time offer from ' . $businessName,
                'body_text' => 'Grab this exclusive deal before it\'s gone. Premium quality at unbeatable prices.',
                'cta_text' => 'Get 35% Off',
                'color_scheme' => ['primary' => '#dc2626', 'secondary' => '#fef2f2', 'accent' => '#ffffff', 'text' => '#ffffff', 'background' => '#dc2626'],
                'font_pair' => ['heading' => 'Montserrat', 'body' => 'Inter'],
                'mood' => 'bold',
                'layout' => 'centered',
                'category' => 'promotion',
            ],
            [
                'name' => 'Midnight Luxe',
                'tagline' => 'Elevate Your Style',
                'subtitle' => 'Premium collection by ' . $businessName,
                'body_text' => 'Indulge in luxury. Crafted with care for those who appreciate the finer things.',
                'cta_text' => 'Explore Now',
                'color_scheme' => ['primary' => '#d4a574', 'secondary' => '#1a1a1a', 'accent' => '#d4a574', 'text' => '#ffffff', 'background' => '#0a0a0a'],
                'font_pair' => ['heading' => 'Playfair Display', 'body' => 'Lato'],
                'mood' => 'luxury',
                'layout' => 'centered',
                'category' => 'fashion',
            ],
            [
                'name' => 'Fresh Morning',
                'tagline' => 'Start Something New',
                'subtitle' => 'With ' . $businessName,
                'body_text' => 'Begin your journey with us. Fresh perspectives, genuine care, lasting results.',
                'cta_text' => 'Learn More',
                'color_scheme' => ['primary' => '#0ea5e9', 'secondary' => '#f0f9ff', 'accent' => '#0284c7', 'text' => '#0c4a6e', 'background' => '#f0f9ff'],
                'font_pair' => ['heading' => 'Poppins', 'body' => 'Inter'],
                'mood' => 'cool',
                'layout' => 'left-aligned',
                'category' => 'business',
            ],
            [
                'name' => 'Warm Earth',
                'tagline' => 'Naturally Yours',
                'subtitle' => 'Handcrafted by ' . $businessName,
                'body_text' => 'Rooted in quality. Our commitment to excellence shines through every detail.',
                'cta_text' => 'Discover',
                'color_scheme' => ['primary' => '#92400e', 'secondary' => '#fef3c7', 'accent' => '#b45309', 'text' => '#451a03', 'background' => '#fefbf0'],
                'font_pair' => ['heading' => 'Playfair Display', 'body' => 'Lato'],
                'mood' => 'warm',
                'layout' => 'centered',
                'category' => 'product',
            ],
            [
                'name' => 'Neon Pulse',
                'tagline' => 'The Future Is Now',
                'subtitle' => $businessName . ' presents',
                'body_text' => 'Breaking boundaries. Pushing limits. Join the movement that\'s changing everything.',
                'cta_text' => 'Join Now',
                'color_scheme' => ['primary' => '#22d3ee', 'secondary' => '#0f172a', 'accent' => '#a78bfa', 'text' => '#f8fafc', 'background' => '#020617'],
                'font_pair' => ['heading' => 'Montserrat', 'body' => 'Roboto'],
                'mood' => 'energetic',
                'layout' => 'centered',
                'category' => 'event',
            ],
            [
                'name' => 'Pure Minimal',
                'tagline' => 'Less is More',
                'subtitle' => 'By ' . $businessName,
                'body_text' => 'Simplicity meets sophistication. Clean design, clear purpose, genuine value.',
                'cta_text' => 'View More',
                'color_scheme' => ['primary' => '#334155', 'secondary' => '#f8fafc', 'accent' => '#64748b', 'text' => '#0f172a', 'background' => '#ffffff'],
                'font_pair' => ['heading' => 'Inter', 'body' => 'Inter'],
                'mood' => 'minimal',
                'layout' => 'left-aligned',
                'category' => 'minimal',
            ],
            [
                'name' => 'Coral Sunset',
                'tagline' => 'Made Just For You',
                'subtitle' => $businessName . ' Collection',
                'body_text' => 'Vibrant, bold, and unapologetically you. Find your perfect match today.',
                'cta_text' => 'Browse Now',
                'color_scheme' => ['primary' => '#f97316', 'secondary' => '#fff7ed', 'accent' => '#fb923c', 'text' => '#ffffff', 'background' => 'linear-gradient(145deg, #fb7185, #f97316)'],
                'font_pair' => ['heading' => 'Poppins', 'body' => 'Inter'],
                'mood' => 'playful',
                'layout' => 'centered',
                'category' => 'beauty',
            ],
            [
                'name' => 'Forest Calm',
                'tagline' => 'Find Your Balance',
                'subtitle' => 'Wellness by ' . $businessName,
                'body_text' => 'Nurture your mind, body, and soul. Natural wellness solutions crafted with care.',
                'cta_text' => 'Get Started',
                'color_scheme' => ['primary' => '#059669', 'secondary' => '#ecfdf5', 'accent' => '#10b981', 'text' => '#064e3b', 'background' => '#ecfdf5'],
                'font_pair' => ['heading' => 'Lato', 'body' => 'Inter'],
                'mood' => 'warm',
                'layout' => 'centered',
                'category' => 'fitness',
            ],
            [
                'name' => 'Royal Violet',
                'tagline' => 'Unlock Premium',
                'subtitle' => 'Exclusive from ' . $businessName,
                'body_text' => 'Step into a world of premium experiences. Curated just for you.',
                'cta_text' => 'Unlock Now',
                'color_scheme' => ['primary' => '#7c3aed', 'secondary' => '#ede9fe', 'accent' => '#a78bfa', 'text' => '#ffffff', 'background' => 'linear-gradient(135deg, #7c3aed, #4f46e5)'],
                'font_pair' => ['heading' => 'Montserrat', 'body' => 'Roboto'],
                'mood' => 'luxury',
                'layout' => 'centered',
                'category' => 'promotion',
            ],
            [
                'name' => 'Coffee House',
                'tagline' => 'Crafted With Love',
                'subtitle' => $businessName . ' Originals',
                'body_text' => 'Every sip, every bite, every moment — crafted with passion and served with pride.',
                'cta_text' => 'Order Now',
                'color_scheme' => ['primary' => '#fbbf24', 'secondary' => '#1c1917', 'accent' => '#f59e0b', 'text' => '#fef3c7', 'background' => '#1c1917'],
                'font_pair' => ['heading' => 'Playfair Display', 'body' => 'Lato'],
                'mood' => 'warm',
                'layout' => 'centered',
                'category' => 'food',
            ],
            [
                'name' => 'Coming Soon',
                'tagline' => 'Something Big Is Coming',
                'subtitle' => 'Stay tuned — ' . $businessName,
                'body_text' => 'The big reveal is almost here. Be the first to know. Stay tuned for something special.',
                'cta_text' => 'Notify Me',
                'color_scheme' => ['primary' => '#d6d3d1', 'secondary' => '#f5f5f4', 'accent' => '#a8a29e', 'text' => '#292524', 'background' => '#fafaf9'],
                'font_pair' => ['heading' => 'Oswald', 'body' => 'Lato'],
                'mood' => 'elegant',
                'layout' => 'centered',
                'category' => 'seasonal',
            ],
        ];
    }
}
