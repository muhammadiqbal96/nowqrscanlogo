<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AiContentController extends Controller
{
    /**
     * Generate AI ad copy for a campaign.
     * Uses OpenAI GPT-4o to create headline, sub-headline, description, and CTA button text.
     */
    public function generateAdCopy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'campaign_id' => ['nullable', 'exists:campaigns,id'],
            'business_name' => ['required', 'string', 'max:255'],
            'business_description' => ['required', 'string', 'max:2000'],
            'target_audience' => ['nullable', 'string', 'max:500'],
            'cta_type' => ['required', 'in:buy,give,pay,call,book,watch,order,custom'],
            'custom_cta' => ['nullable', 'string', 'max:100'],
            'tone' => ['nullable', 'string', 'in:professional,friendly,urgent,luxury,casual,bold'],
        ]);

        // Check credits (5 credits to generate AI content)
        $user = $request->user();
        $creditCost = 5;

        if (!$user->hasCredits($creditCost)) {
            return response()->json([
                'message' => "Insufficient credits. AI content generation costs {$creditCost} credits. You have {$user->credits} credits.",
                'required_credits' => $creditCost,
                'current_credits' => $user->credits,
            ], 402);
        }

        $ctaLabels = [
            'buy' => 'Buy Now',
            'give' => 'Give Now',
            'pay' => 'Pay Now',
            'call' => 'Call Now',
            'book' => 'Book Now',
            'watch' => 'Watch Now',
            'order' => 'Order Now',
            'custom' => $validated['custom_cta'] ?? 'Act Now',
        ];

        $ctaLabel = $ctaLabels[$validated['cta_type']] ?? 'Act Now';
        $tone = $validated['tone'] ?? 'professional';

        // Build the prompt
        $prompt = $this->buildPrompt($validated, $ctaLabel, $tone);

        try {
            $apiKey = config('services.openai.api_key');

            if (!$apiKey || $apiKey === 'your-openai-api-key') {
                // Return mock data in development
                $generated = $this->getMockContent($validated, $ctaLabel);
            } else {
                $generated = $this->callOpenAI($prompt, $apiKey);
            }

            // Deduct credits
            $user->deductCredits($creditCost, 'Generated AI ad copy', 'campaign', $validated['campaign_id'] ?? null);

            // If campaign_id provided, update the campaign
            if (isset($validated['campaign_id'])) {
                $campaign = $user->campaigns()->findOrFail($validated['campaign_id']);
                $campaign->update([
                    'headline' => $generated['headline'],
                    'sub_headline' => $generated['sub_headline'],
                    'description' => $generated['description'],
                    'cta_button_text' => $generated['cta_button_text'],
                ]);
            }

            return response()->json([
                'message' => 'Content generated successfully',
                'content' => $generated,
                'credits_remaining' => $user->fresh()->credits,
            ]);

        } catch (\Exception $e) {
            Log::error('AI content generation error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to generate content. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    private function buildPrompt(array $data, string $ctaLabel, string $tone): string
    {
        return <<<PROMPT
You are a world-class marketing copywriter. Generate ad copy for a small business's promotional page.

Business Name: {$data['business_name']}
What they offer: {$data['business_description']}
Target Audience: {$data['target_audience']}
Call to Action: {$ctaLabel}
Tone: {$tone}

Generate the following (respond in JSON format only):
1. "headline" - A compelling, attention-grabbing headline (max 60 chars)
2. "sub_headline" - A supporting sub-headline that adds context (max 100 chars)
3. "description" - A short paragraph describing the value proposition (max 200 chars)
4. "cta_button_text" - The text for the call-to-action button (max 25 chars, action-oriented)

Rules:
- Do NOT include any phone numbers, email addresses, or website URLs
- The copy should create urgency and drive the reader toward the single CTA button
- Keep it clean, professional, and compelling
- The CTA button text should be direct and action-oriented

Respond with ONLY valid JSON, no markdown formatting.
PROMPT;
    }

    private function callOpenAI(string $prompt, string $apiKey): array
    {
        $ch = curl_init('https://api.openai.com/v1/chat/completions');

        $payload = json_encode([
            'model' => 'gpt-4o',
            'messages' => [
                ['role' => 'system', 'content' => 'You are a marketing copywriter. Always respond with valid JSON only.'],
                ['role' => 'user', 'content' => $prompt],
            ],
            'temperature' => 0.8,
            'max_tokens' => 500,
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
            throw new \Exception("OpenAI API returned status {$httpCode}: {$response}");
        }

        $data = json_decode($response, true);
        $content = $data['choices'][0]['message']['content'] ?? '';

        // Clean any markdown formatting
        $content = preg_replace('/^```json\s*/', '', $content);
        $content = preg_replace('/\s*```$/', '', $content);

        $parsed = json_decode($content, true);

        if (!$parsed || !isset($parsed['headline'])) {
            throw new \Exception('Invalid response format from OpenAI');
        }

        return $parsed;
    }

    private function getMockContent(array $data, string $ctaLabel): array
    {
        $businessName = $data['business_name'];

        return [
            'headline' => "Discover What {$businessName} Has for You",
            'sub_headline' => "Your trusted partner for quality and excellence",
            'description' => "Experience the difference with {$businessName}. We deliver exceptional value tailored to your needs. Don't miss out on what we have to offer.",
            'cta_button_text' => $ctaLabel,
        ];
    }
}
