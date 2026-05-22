import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { blogApi } from '@/lib/api'
import { ArrowLeft, Clock, Eye, Calendar, Tag } from 'lucide-react'

interface BlogFull {
    id: number
    title: string
    slug: string
    excerpt: string | null
    content: string
    cover_image_url: string | null
    category: string
    tags: string[] | null
    read_time: number
    views: number
    published_at: string
    author: { name: string }
}

export default function BlogDetailPage() {
    const { slug } = useParams<{ slug: string }>()
    const [blog, setBlog] = useState<BlogFull | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        if (slug) loadBlog()
    }, [slug])

    const loadBlog = async () => {
        setLoading(true)
        setError(false)
        try {
            const res = await blogApi.get(slug!)
            setBlog(res.data.blog)
        } catch {
            setError(true)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="pt-32 pb-20 flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (error || !blog) {
        return (
            <div className="pt-32 pb-20 text-center">
                <h2 className="text-2xl font-bold mb-2">Article not found</h2>
                <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist.</p>
                <Link to="/blog" className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
                    <ArrowLeft className="w-4 h-4" /> Back to blog
                </Link>
            </div>
        )
    }

    return (
        <div className="pt-32 pb-20">
            <article className="max-w-3xl mx-auto px-6">
                {/* Back link */}
                <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
                    <ArrowLeft className="w-4 h-4" /> Back to Blog
                </Link>

                {/* Category */}
                <div className="mb-4">
                    <span className="inline-flex text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full capitalize">
                        {blog.category.replace('-', ' ')}
                    </span>
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{blog.title}</h1>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
                    <span>By {blog.author.name}</span>
                    <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(blog.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {blog.read_time} min read
                    </span>
                    <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> {blog.views} views
                    </span>
                </div>

                {/* Cover Image */}
                {blog.cover_image_url && (
                    <div className="rounded-2xl overflow-hidden mb-8 border border-border">
                        <img src={blog.cover_image_url} alt={blog.title} className="w-full h-auto" />
                    </div>
                )}

                {/* Content */}
                <div
                    className="prose prose-lg dark:prose-invert max-w-none
                        prose-headings:font-bold prose-headings:tracking-tight
                        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                        prose-img:rounded-xl prose-img:border prose-img:border-border"
                    dangerouslySetInnerHTML={{ __html: blog.content }}
                />

                {/* Tags */}
                {blog.tags && blog.tags.length > 0 && (
                    <div className="mt-10 pt-6 border-t border-border">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Tag className="w-4 h-4 text-muted-foreground" />
                            {blog.tags.map(tag => (
                                <span key={tag} className="px-3 py-1 bg-muted text-sm rounded-full text-muted-foreground">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

            </article>
        </div>
    )
}
