'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AddBlogPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [error, setError] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [published, setPublished] = useState(false)

  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    author: 'NMDb Editorial',
  })

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const handleTitleChange = (title: string) => {
    setForm({ ...form, title, slug: generateSlug(title) })
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const uploadCover = async (postId: string): Promise<string | null> => {
    if (!coverFile) return null
    const ext = coverFile.name.split('.').pop()
    const path = `${postId}.${ext}`
    const { error } = await supabase.storage.from('blog').upload(path, coverFile, { upsert: true })
    if (error) return null
    const { data } = supabase.storage.from('blog').getPublicUrl(path)
    return data.publicUrl
  }

  const handleSubmit = async () => {
    if (!form.title || !form.slug || !form.content) {
      setError('Title, slug and content are required.')
      return
    }
    setLoading(true)
    setError('')

    const { data: post, error: insertError } = await supabase
      .from('blog_posts')
      .insert({
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt || null,
        content: form.content,
        author: form.author,
        published: published,
      })
      .select()
      .single()

    if (insertError || !post) {
      setError(insertError?.message || 'Failed to save.')
      setLoading(false)
      return
    }

    if (coverFile) {
      const coverUrl = await uploadCover(post.id)
      if (coverUrl) await supabase.from('blog_posts').update({ cover_image_url: coverUrl }).eq('id', post.id)
    }

    setLoading(false)
    setSuccess(true)
    setSuccessMsg(published ? '🚀 Post published! It is now live on NMDb.' : '💾 Post saved as draft.')
    setCoverFile(null)
    setCoverPreview(null)
    setPublished(false)
    setForm({ title: '', slug: '', excerpt: '', content: '', author: 'NMDb Editorial' })
    setTimeout(() => setSuccess(false), 6000)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-2xl font-bold text-emerald-500">NMDb</a>
            <span className="text-gray-600 text-sm">/ Admin / Add Blog Post</span>
          </div>
          <a href="/blog" className="text-sm text-gray-400 hover:text-white transition">View Blog →</a>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Write Blog Post</h1>
        <p className="text-gray-400 mb-10">Publish news, reviews and industry analysis on NMDb.</p>

        {success && (
          <div className="bg-emerald-900/50 border border-emerald-500 text-emerald-300 px-6 py-4 rounded-xl mb-8">
            ✅ {successMsg}
          </div>
        )}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 px-6 py-4 rounded-xl mb-8">
            ❌ {error}
          </div>
        )}

        <div className="space-y-6">

          <section className="bg-gray-900 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-emerald-400">Post Details</h2>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Title <span className="text-red-400">*</span></label>
              <input type="text" value={form.title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="e.g. A Tribe Called Judah Crosses ₦1 Billion" className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Slug (URL)</label>
              <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm" />
              <p className="text-gray-600 text-xs mt-1">nmdb.cc/blog/{form.slug || 'your-post-slug'}</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Excerpt</label>
              <textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Short summary shown on homepage and blog listing..." rows={2} className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Author</label>
              <input type="text" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </section>

          <section className="bg-gray-900 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-emerald-400 mb-4">Cover Image</h2>
            <div className="flex gap-6 items-start">
              <div className="w-40 h-24 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0 flex items-center justify-center border border-gray-700">
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-600 text-xs">No image</span>
                )}
              </div>
              <div>
                <label className="cursor-pointer inline-block bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-emerald-500 text-gray-300 px-6 py-3 rounded-xl transition text-sm">
                  📁 Choose Cover Image
                  <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                </label>
                {coverFile && <p className="text-emerald-400 text-xs mt-2">✅ {coverFile.name}</p>}
              </div>
            </div>
          </section>

          <section className="bg-gray-900 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-emerald-400 mb-4">Content <span className="text-red-400">*</span></h2>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Write your full article here..."
              rows={16}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-mono text-sm leading-relaxed"
            />
          </section>

          {/* Publish toggle — now using independent state */}
          <section className="bg-gray-900 rounded-2xl p-6">
            <label className="flex items-center gap-3 cursor-pointer" onClick={() => setPublished(!published)}>
              <div className={`w-12 h-6 rounded-full transition-colors duration-200 flex items-center px-1 ${published ? 'bg-emerald-600' : 'bg-gray-700'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${published ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
              <div>
                <span className={`text-sm font-medium ${published ? 'text-emerald-400' : 'text-white'}`}>
                  {published ? '🚀 Will publish immediately' : '💾 Save as draft'}
                </span>
                <p className="text-gray-500 text-xs mt-0.5">
                  {published ? 'Post will be visible to everyone on NMDb' : 'Only you can see drafts — not visible to public'}
                </p>
              </div>
            </label>
          </section>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full text-white font-bold py-4 rounded-2xl text-lg transition ${
              published
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : 'bg-gray-700 hover:bg-gray-600'
            } disabled:opacity-50`}
          >
            {loading ? 'Saving...' : published ? '🚀 Publish Post' : '💾 Save as Draft'}
          </button>
        </div>
      </div>
    </main>
  )
}
