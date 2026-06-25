<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Blog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BlogController extends Controller
{
    /**
     * List published blogs (public).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Blog::published()->latest('published_at')
            ->with('author:id,first_name,last_name');

        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('excerpt', 'like', "%{$search}%");
            });
        }

        $blogs = $query->paginate(12);

        $blogs->getCollection()->transform(function ($blog) {
            return [
                'id' => $blog->id,
                'title' => $blog->title,
                'slug' => $blog->slug,
                'excerpt' => $blog->excerpt,
                'cover_image_url' => $blog->cover_image_url,
                'category' => $blog->category,
                'tags' => $blog->tags,
                'read_time' => $blog->read_time,
                'published_at' => $blog->published_at,
                'author' => [
                    'name' => $blog->author->first_name . ' ' . $blog->author->last_name,
                ],
            ];
        });

        return response()->json($blogs);
    }

    /**
     * Show a single published blog.
     */
    public function show(string $slug): JsonResponse
    {
        $blog = Blog::published()->where('slug', $slug)
            ->with('author:id,first_name,last_name')
            ->firstOrFail();

        // Increment views
        $blog->increment('views');

        return response()->json([
            'blog' => [
                'id' => $blog->id,
                'title' => $blog->title,
                'slug' => $blog->slug,
                'excerpt' => $blog->excerpt,
                'content' => $blog->content,
                'cover_image_url' => $blog->cover_image_url,
                'category' => $blog->category,
                'tags' => $blog->tags,
                'read_time' => $blog->read_time,
                'views' => $blog->views,
                'published_at' => $blog->published_at,
                'author' => [
                    'name' => $blog->author->first_name . ' ' . $blog->author->last_name,
                ],
            ],
        ]);
    }

    /**
     * Get latest blogs for homepage.
     */
    public function latest(): JsonResponse
    {
        $blogs = Blog::published()->latest('published_at')
            ->with('author:id,first_name,last_name')
            ->take(3)
            ->get()
            ->map(function ($blog) {
                return [
                    'id' => $blog->id,
                    'title' => $blog->title,
                    'slug' => $blog->slug,
                    'excerpt' => $blog->excerpt,
                    'cover_image_url' => $blog->cover_image_url,
                    'category' => $blog->category,
                    'read_time' => $blog->read_time,
                    'published_at' => $blog->published_at,
                    'author' => [
                        'name' => $blog->author->first_name . ' ' . $blog->author->last_name,
                    ],
                ];
            });

        return response()->json(['blogs' => $blogs]);
    }
}
