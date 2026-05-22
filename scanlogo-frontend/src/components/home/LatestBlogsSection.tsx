import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { blogApi } from '@/lib/api'
import { ArrowRight, Clock, BookOpen } from 'lucide-react'

interface BlogPost {
    id: number
    title: string
    slug: string
    excerpt: string | null
    cover_image_url: string | null
    category: string
    read_time: number
    published_at: string
    author: { name: string }
}

export default function LatestBlogsSection() {
    const [blogs, setBlogs] = useState<BlogPost[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadBlogs()
    }, [])

    const loadBlogs = async () => {
        try {
            const res = await blogApi.latest()
            setBlogs(res.data.blogs)
        } catch {
            // Silently fail - just don't show the section
        } finally {
            setLoading(false)
        }
    }

    // Don't render section if no blogs
    if (!loading && blogs.length === 0) return null

    return (
        <section className="py-20 lg:py-28 bg-muted/30">
            <div className="max-w-6xl mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
                        <BookOpen className="w-4 h-4" />
                        From Our Blog
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Latest <span className="text-primary">Insights</span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Stay ahead with tips, strategies, and guides for growing your business.
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-6">
                        {blogs.map(blog => (
                            <Link
                                key={blog.id}
                                to={`/blog/${blog.slug}`}
                                className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-black/5 transition-all hover:-translate-y-1"
                            >
                                <div className="aspect-[16/9] bg-muted overflow-hidden">
                                    {blog.cover_image_url ? (
                                        <img src={blog.cover_image_url} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                                            <BookOpen className="w-10 h-10 text-primary/30" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md capitalize">
                                            {blog.category.replace('-', ' ')}
                                        </span>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {blog.read_time} min
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                        {blog.title}
                                    </h3>
                                    {blog.excerpt && (
                                        <p className="text-sm text-muted-foreground line-clamp-2">{blog.excerpt}</p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* View All Link */}
                <div className="text-center mt-10">
                    <Link
                        to="/blog"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-xl text-sm font-semibold hover:bg-muted transition-all group"
                    >
                        View All Articles
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
            </div>
        </section>
    )
}
