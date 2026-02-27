import { useState, useEffect, useRef } from 'react'
import { adminApi } from '@/lib/api'
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight, Image, MoreHorizontal, Upload, ExternalLink } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select'
import toast from 'react-hot-toast'

interface BlogItem {
    id: number
    title: string
    slug: string
    excerpt: string | null
    content: string
    cover_image: string | null
    cover_image_url: string | null
    category: string
    tags: string[] | null
    status: 'draft' | 'published'
    published_at: string | null
    views: number
    read_time: number
    created_at: string
    author: { id: number; first_name: string; last_name: string }
}

export default function AdminBlogsPage() {
    const [blogs, setBlogs] = useState<BlogItem[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [page, setPage] = useState(1)
    const [lastPage, setLastPage] = useState(1)

    // Editor modal
    const [editorOpen, setEditorOpen] = useState(false)
    const [editingBlog, setEditingBlog] = useState<BlogItem | null>(null)
    const [form, setForm] = useState({
        title: '',
        excerpt: '',
        content: '',
        category: 'general',
        tags: '',
        status: 'draft' as 'draft' | 'published',
    })
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [coverFile, setCoverFile] = useState<File | null>(null)
    const [coverPreview, setCoverPreview] = useState<string | null>(null)
    const contentRef = useRef<HTMLTextAreaElement>(null)
    const coverInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        loadBlogs()
    }, [page, statusFilter])

    const loadBlogs = async () => {
        setLoading(true)
        try {
            const res = await adminApi.blogs.list(page, search, statusFilter)
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

    const openCreate = () => {
        setEditingBlog(null)
        setForm({ title: '', excerpt: '', content: '', category: 'general', tags: '', status: 'draft' })
        setCoverFile(null)
        setCoverPreview(null)
        setEditorOpen(true)
    }

    const openEdit = async (blog: BlogItem) => {
        try {
            const res = await adminApi.blogs.get(blog.id)
            const b = res.data.blog
            setEditingBlog(b)
            setForm({
                title: b.title,
                excerpt: b.excerpt || '',
                content: b.content,
                category: b.category,
                tags: b.tags ? b.tags.join(', ') : '',
                status: b.status,
            })
            setCoverFile(null)
            setCoverPreview(b.cover_image_url || null)
            setEditorOpen(true)
        } catch {
            toast.error('Failed to load blog')
        }
    }

    const handleSave = async () => {
        if (!form.title || !form.content) {
            toast.error('Title and content are required')
            return
        }
        setSaving(true)
        try {
            const data = {
                title: form.title,
                excerpt: form.excerpt || undefined,
                content: form.content,
                category: form.category,
                tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
                status: form.status,
            }
            let blogId: number
            if (editingBlog) {
                await adminApi.blogs.update(editingBlog.id, data)
                blogId = editingBlog.id
                toast.success('Blog updated')
            } else {
                const res = await adminApi.blogs.create(data)
                blogId = res.data.blog?.id || res.data.id
                toast.success('Blog created')
            }
            // Upload cover image if selected
            if (coverFile && blogId) {
                try {
                    await adminApi.blogs.uploadCover(blogId, coverFile)
                } catch {
                    toast.error('Blog saved but cover upload failed')
                }
            }
            setEditorOpen(false)
            loadBlogs()
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (blog: BlogItem) => {
        if (!confirm(`Delete "${blog.title}"?`)) return
        try {
            await adminApi.blogs.delete(blog.id)
            toast.success('Blog deleted')
            loadBlogs()
        } catch {
            toast.error('Failed to delete')
        }
    }

    const handleUploadCover = async (blogId: number) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (!file) return
            try {
                await adminApi.blogs.uploadCover(blogId, file)
                toast.success('Cover uploaded')
                loadBlogs()
            } catch {
                toast.error('Upload failed')
            }
        }
        input.click()
    }

    const handleInsertImage = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (!file) return
            setUploading(true)
            try {
                const res = await adminApi.blogs.uploadContentImage(file)
                const imageUrl = res.data.url
                // Insert img tag at cursor position in textarea
                const textarea = contentRef.current
                if (textarea) {
                    const start = textarea.selectionStart
                    const end = textarea.selectionEnd
                    const before = form.content.substring(0, start)
                    const after = form.content.substring(end)
                    const imgTag = `\n<img src="${imageUrl}" alt="${file.name.replace(/\.[^/.]+$/, '')}" class="rounded-xl w-full" />\n`
                    setForm(f => ({ ...f, content: before + imgTag + after }))
                    toast.success('Image inserted into content')
                    // Move cursor after the inserted image
                    setTimeout(() => {
                        if (textarea) {
                            textarea.selectionStart = textarea.selectionEnd = start + imgTag.length
                            textarea.focus()
                        }
                    }, 100)
                }
            } catch {
                toast.error('Image upload failed')
            } finally {
                setUploading(false)
            }
        }
        input.click()
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Blog Management</h1>
                    <p className="text-muted-foreground mt-1">Create and manage blog posts</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
                >
                    <Plus className="w-4 h-4" />
                    New Post
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <form onSubmit={handleSearch} className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search blog posts..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                </form>
                <Select value={statusFilter || 'all'} onValueChange={v => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Blog List */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : blogs.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        No blog posts yet. Create your first one!
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {blogs.map(blog => (
                            <div key={blog.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                                {/* Cover thumbnail */}
                                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {blog.cover_image_url ? (
                                        <img src={blog.cover_image_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <Image className="w-6 h-6 text-muted-foreground" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{blog.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {blog.category} · {blog.read_time} min read · {blog.views} views
                                        {blog.published_at && ` · ${new Date(blog.published_at).toLocaleDateString()}`}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-md ${blog.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                        {blog.status}
                                    </span>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-52">
                                            <DropdownMenuLabel>Blog Actions</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => openEdit(blog)}>
                                                <Edit className="w-4 h-4" />
                                                Edit Post
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleUploadCover(blog.id)}>
                                                <Upload className="w-4 h-4" />
                                                Upload Cover Image
                                            </DropdownMenuItem>
                                            {blog.status === 'published' && (
                                                <DropdownMenuItem asChild>
                                                    <a href={`/blog/${blog.slug}`} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="w-4 h-4" />
                                                        View Published
                                                    </a>
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => handleDelete(blog)}
                                                className="text-red-600 dark:text-red-400"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete Post
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {lastPage > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-muted-foreground">Page {page} of {lastPage}</span>
                    <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page === lastPage} className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Blog Editor Modal */}
            {editorOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setEditorOpen(false)} />
                    <div className="relative bg-card border border-border rounded-2xl w-full max-w-3xl shadow-2xl my-8">
                        <div className="p-6 border-b border-border">
                            <h3 className="text-lg font-semibold">{editingBlog ? 'Edit Blog Post' : 'New Blog Post'}</h3>
                        </div>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Title *</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="Blog post title"
                                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            {/* Cover / Thumbnail Image */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">Cover Image (Thumbnail)</label>
                                <div className="flex items-start gap-4">
                                    <div
                                        onClick={() => coverInputRef.current?.click()}
                                        className="relative w-32 h-20 rounded-xl border-2 border-dashed border-border bg-muted flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors overflow-hidden group"
                                    >
                                        {coverPreview ? (
                                            <>
                                                <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Upload className="w-4 h-4 text-white" />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                                <Image className="w-5 h-5" />
                                                <span className="text-[10px] font-medium">Upload</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground">
                                            This image will be shown on the blog card as a thumbnail. Recommended: 1200×630px.
                                        </p>
                                        {coverPreview && (
                                            <button
                                                type="button"
                                                onClick={() => { setCoverFile(null); setCoverPreview(null) }}
                                                className="text-xs text-red-500 hover:underline mt-1"
                                            >
                                                Remove image
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <input
                                    ref={coverInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={e => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                            setCoverFile(file)
                                            setCoverPreview(URL.createObjectURL(file))
                                        }
                                    }}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Excerpt</label>
                                <textarea
                                    value={form.excerpt}
                                    onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                                    placeholder="Brief description (shown in cards)"
                                    rows={2}
                                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Category</label>
                                    <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="general">General</SelectItem>
                                            <SelectItem value="marketing">Marketing</SelectItem>
                                            <SelectItem value="tutorial">Tutorial</SelectItem>
                                            <SelectItem value="tips">Tips & Tricks</SelectItem>
                                            <SelectItem value="case-study">Case Study</SelectItem>
                                            <SelectItem value="product">Product Update</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Status</label>
                                    <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as 'draft' | 'published' }))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="published">Published</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Tags (comma-separated)</label>
                                <input
                                    type="text"
                                    value={form.tags}
                                    onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                                    placeholder="qr-codes, marketing, tips"
                                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-sm font-medium">Content * (HTML or Markdown)</label>
                                    <button
                                        type="button"
                                        onClick={handleInsertImage}
                                        disabled={uploading}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50"
                                    >
                                        <Image className="w-3.5 h-3.5" />
                                        {uploading ? 'Uploading...' : 'Insert Image'}
                                    </button>
                                </div>
                                <textarea
                                    ref={contentRef}
                                    value={form.content}
                                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                                    placeholder="Write your blog content here... You can use HTML tags for formatting. Use the 'Insert Image' button above to add images."
                                    rows={12}
                                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y font-mono"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Tip: Click "Insert Image" to upload and embed images directly into your blog content.
                                </p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-border flex gap-3">
                            <button onClick={() => setEditorOpen(false)} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-muted">
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : editingBlog ? 'Update Post' : 'Create Post'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
