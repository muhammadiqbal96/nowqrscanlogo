import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { blogApi } from '@/lib/api'
import { Search, Clock, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'

interface BlogPost {
    id: number
    title: string
    slug: string
    excerpt: string | null
    cover_image_url: string | null
    category: string
    tags: string[] | null
    read_time: number
    published_at: string
    author: { name: string }
}

export default function BlogListPage() {
    const [blogs, setBlogs] = useState<BlogPost[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('')
    const [page, setPage] = useState(1)
    const [lastPage, setLastPage] = useState(1)

    useEffect(() => {
        loadBlogs()
    }, [page, category])

    const loadBlogs = async () => {
        setLoading(true)
        try {
            const res = await blogApi.list(page, category || undefined, search || undefined)
            setBlogs(res.data.data)
            setLastPage(res.data.last_page)
        } catch (err) {
            console.error('Failed to load blogs:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setPage(1)
        loadBlogs()
    }

    const categories = ['general', 'marketing', 'tutorial', 'tips', 'case-study', 'product']

    return (
        <div className="pt-32 pb-20">
            <div className="max-w-6xl mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
                        <BookOpen className="w-4 h-4" />
                        ScanLogo Blog
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Insights & <span className="text-primary">Resources</span>
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Tips, strategies, and guides to help you grow your business with QR codes and digital marketing.
                    </p>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                    <form onSubmit={handleSearch} className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search articles..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </form>
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => { setCategory(''); setPage(1) }}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${!category ? 'bg-primary text-primary-foreground' : 'bg-card border border-border hover:bg-muted'}`}
                        >
                            All
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => { setCategory(cat); setPage(1) }}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${category === cat ? 'bg-primary text-primary-foreground' : 'bg-card border border-border hover:bg-muted'}`}
                            >
                                {cat.replace('-', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Blog Grid */}
                {loading ? (
                    <div className="flex items-center justify-center min-h-[40vh]">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : blogs.length === 0 ? (
                    <div className="text-center py-20">
                        <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No articles found</h3>
                        <p className="text-muted-foreground">Check back soon for new content!</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {blogs.map(blog => (
                            <Link
                                key={blog.id}
                                to={`/blog/${blog.slug}`}
                                className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-black/5 transition-all hover:-translate-y-0.5"
                            >
                                {/* Cover */}
                                <div className="aspect-[16/9] bg-muted overflow-hidden">
                                    {blog.cover_image_url ? (
                                        <img src={blog.cover_image_url} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <BookOpen className="w-10 h-10 text-muted-foreground/50" />
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
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
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{blog.excerpt}</p>
                                    )}
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{blog.author.name}</span>
                                        <span>{new Date(blog.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {lastPage > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-10">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-sm text-muted-foreground px-4">Page {page} of {lastPage}</span>
                        <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page === lastPage} className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
