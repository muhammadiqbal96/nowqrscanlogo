<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConnectedPlatform extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'type',
        'site_url',
        'api_key',
        'api_secret',
        'username',
        'status',
        'last_synced_at',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'meta' => 'array',
            'last_synced_at' => 'datetime',
            'api_key' => 'encrypted',
            'api_secret' => 'encrypted',
        ];
    }

    // ─── Relationships ──────────────────────────────────────────

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function autoPosts()
    {
        return $this->hasMany(AutoPost::class, 'platform_id');
    }

    // ─── Scopes ─────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    // ─── Helpers ────────────────────────────────────────────────

    /**
     * Test connection to the platform and return true/false.
     */
    public function testConnection(): bool
    {
        try {
            if ($this->type === 'wordpress') {
                $response = \Illuminate\Support\Facades\Http::withBasicAuth(
                    $this->username ?? '',
                    $this->api_key ?? ''
                )->get(rtrim($this->site_url, '/') . '/wp-json/wp/v2/posts?per_page=1');

                return $response->successful();
            }

            if ($this->type === 'shopify') {
                $response = \Illuminate\Support\Facades\Http::withHeaders([
                    'X-Shopify-Access-Token' => $this->api_key,
                ])->get(rtrim($this->site_url, '/') . '/admin/api/2024-01/articles.json?limit=1');

                return $response->successful();
            }

            // Custom — just check site is reachable
            $response = \Illuminate\Support\Facades\Http::head($this->site_url);
            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Publish a post to this platform.
     */
    public function publishPost(AutoPost $autoPost): array
    {
        if ($this->type === 'wordpress') {
            return $this->publishToWordPress($autoPost);
        }

        if ($this->type === 'shopify') {
            return $this->publishToShopify($autoPost);
        }

        return ['success' => false, 'error' => 'Unsupported platform type'];
    }

    private function publishToWordPress(AutoPost $autoPost): array
    {
        try {
            $payload = [
                'title' => $autoPost->title,
                'content' => $autoPost->content,
                'excerpt' => $autoPost->excerpt ?? '',
                'status' => 'publish',
            ];

            if ($autoPost->category) {
                $payload['categories'] = [$autoPost->category];
            }

            if ($autoPost->tags && is_array($autoPost->tags)) {
                $payload['tags'] = $autoPost->tags;
            }

            $response = \Illuminate\Support\Facades\Http::withBasicAuth(
                $this->username ?? '',
                $this->api_key ?? ''
            )->post(rtrim($this->site_url, '/') . '/wp-json/wp/v2/posts', $payload);

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'success' => true,
                    'external_post_id' => (string) ($data['id'] ?? ''),
                    'external_post_url' => $data['link'] ?? '',
                ];
            }

            return [
                'success' => false,
                'error' => $response->body(),
            ];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    private function publishToShopify(AutoPost $autoPost): array
    {
        try {
            $payload = [
                'article' => [
                    'title' => $autoPost->title,
                    'body_html' => $autoPost->content,
                    'summary_html' => $autoPost->excerpt ?? '',
                    'published' => true,
                ],
            ];

            if ($autoPost->tags && is_array($autoPost->tags)) {
                $payload['article']['tags'] = implode(', ', $autoPost->tags);
            }

            // Get first blog id
            $blogsResponse = \Illuminate\Support\Facades\Http::withHeaders([
                'X-Shopify-Access-Token' => $this->api_key,
            ])->get(rtrim($this->site_url, '/') . '/admin/api/2024-01/blogs.json');

            $blogId = $blogsResponse->json('blogs.0.id');
            if (!$blogId) {
                return ['success' => false, 'error' => 'No Shopify blog found'];
            }

            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'X-Shopify-Access-Token' => $this->api_key,
            ])->post(
                rtrim($this->site_url, '/') . "/admin/api/2024-01/blogs/{$blogId}/articles.json",
                $payload
            );

            if ($response->successful()) {
                $data = $response->json('article');
                return [
                    'success' => true,
                    'external_post_id' => (string) ($data['id'] ?? ''),
                    'external_post_url' => rtrim($this->site_url, '/') . '/blogs/' . ($data['handle'] ?? ''),
                ];
            }

            return ['success' => false, 'error' => $response->body()];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
