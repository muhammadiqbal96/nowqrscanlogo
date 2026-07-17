<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Blog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminBlogController extends Controller
{
    /**
     * List all blogs (admin view).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Blog::with('author:id,first_name,last_name');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('content', 'like', "%{$search}%");
            });
        }
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }

        $blogs = $query->orderBy('created_at', 'desc')->paginate(15);

        // Append cover_image_url
        $blogs->getCollection()->transform(function ($blog) {
            $blog->cover_image_url = $blog->cover_image_url;
            $blog->read_time = $blog->read_time;
            return $blog;
        });

        return response()->json($blogs);
    }

    /**
     * Create a new blog post.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'content' => ['required', 'string'],
            'category' => ['nullable', 'string', 'max:100'],
            'tags' => ['nullable', 'array'],
            'status' => ['nullable', 'in:draft,published'],
        ]);

        $data = $request->only(['title', 'excerpt', 'content', 'category', 'tags', 'status']);
        $data['author_id'] = $request->user()->id;

        if (($data['status'] ?? 'draft') === 'published') {
            $data['published_at'] = now();
        }

        $blog = Blog::create($data);

        return response()->json([
            'message' => 'Blog post created successfully.',
            'blog' => $blog->load('author:id,first_name,last_name'),
        ], 201);
    }

    /**
     * Show a single blog.
     */
    public function show(Blog $blog): JsonResponse
    {
        $blog->load('author:id,first_name,last_name');
        $blog->cover_image_url = $blog->cover_image_url;
        $blog->read_time = $blog->read_time;

        return response()->json(['blog' => $blog]);
    }

    /**
     * Update a blog post.
     */
    public function update(Request $request, Blog $blog): JsonResponse
    {
        $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'content' => ['sometimes', 'string'],
            'category' => ['nullable', 'string', 'max:100'],
            'tags' => ['nullable', 'array'],
            'status' => ['nullable', 'in:draft,published'],
        ]);

        $data = $request->only(['title', 'excerpt', 'content', 'category', 'tags', 'status']);

        // Set published_at when publishing for first time
        if (isset($data['status']) && $data['status'] === 'published' && !$blog->published_at) {
            $data['published_at'] = now();
        }

        $blog->update($data);

        return response()->json([
            'message' => 'Blog post updated.',
            'blog' => $blog->fresh()->load('author:id,first_name,last_name'),
        ]);
    }

    /**
     * Delete a blog post.
     */
    public function destroy(Blog $blog): JsonResponse
    {
        // Delete cover image if exists
        if ($blog->cover_image && !str_starts_with($blog->cover_image, 'http')) {
            Storage::disk('public')->delete($blog->cover_image);
        }

        $blog->delete();

        return response()->json(['message' => 'Blog post deleted.']);
    }

    /**
     * Upload cover image for a blog post.
     */
    public function uploadCover(Request $request, Blog $blog): JsonResponse
    {
        $request->validate([
            'cover_image' => ['required', 'image', 'max:5120'], // 5MB max
        ]);

        // Delete old cover
        if ($blog->cover_image && !str_starts_with($blog->cover_image, 'http')) {
            Storage::disk('public')->delete($blog->cover_image);
        }

        $path = $request->file('cover_image')->store('blogs/covers', 'public');
        $blog->update(['cover_image' => $path]);

        return response()->json([
            'message' => 'Cover image uploaded.',
            'cover_image_url' => $blog->fresh()->cover_image_url,
        ]);
    }

    /**
     * Upload an image for blog content (inline images).
     */
    public function uploadContentImage(Request $request): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'image', 'max:5120'], // 5MB max
        ]);

        $path = $request->file('image')->store('blogs/content', 'public');
        $url = url("storage/{$path}");

        return response()->json([
            'message' => 'Image uploaded.',
            'url' => $url,
            'path' => $path,
        ]);
    }
}
