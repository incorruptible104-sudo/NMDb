import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const metadata = {
  title: 'Blog — NMDb | Nollywood Movie Database',
  description: 'Nollywood news, box office analysis, reviews and industry insights from NMDb.',
}

export default async function BlogPage() {
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="/" className="text-2xl font-bold text-emerald-500">NMDb</a>
            <div className="hidden md:flex gap-6 text-sm text-gray-400">
              <a href="/movies" className="hover:text-white transition">Movies</a>
              <a href="/people" className="hover:text-white transition">People</a>
              <a href="/box-office" className="hover:text-white transition">Box Office</a>
              <a href="/blog" className="text-white transition">Blog</a>
            </div>
          </div>
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-4 py-2 rounded-full transition">Sign In</button>
        </div>
      </nav>

      <section className="px-6 py-12 border-b border-gray-800">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">NMDb Editorial</h1>
          <p className="text-gray-400">Nollywood news, box office analysis, reviews and industry insights.</p>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="max-w-5xl mx-auto">
          {posts && posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <a
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group bg-gray-900 rounded-2xl overflow-hidden hover:ring-2 hover:ring-emerald-500 transition"
                >
                  <div className="aspect-video bg-gray-800 relative">
                    {post.cover_image_url ? (
                      <Image
                        src={post.cover_image_url}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 text-4xl">📰</div>
                    )}
                  </div>
                  <div className="p-5">
                    <h2 className="font-bold text-lg leading-snug group-hover:text-emerald-400 transition mb-2">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">{post.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between mt-4 text-xs text-gray-600">
                      <span>{post.author}</span>
                      <span>{new Date(post.created_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 text-gray-500">
              <div className="text-7xl mb-6">📰</div>
              <h2 className="text-2xl font-bold text-gray-400 mb-3">No posts yet</h2>
              <p className="text-gray-600 mb-6">Start publishing Nollywood news and analysis.</p>
              <a href="/admin/add-blog" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-full text-sm font-semibold transition">
                + Write First Post
              </a>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-gray-800 px-6 py-8 mt-12">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-gray-500 text-sm">
          <span>© 2026 NMDb — Nollywood Movie Database</span>
          <span>Built for the industry. Powered by data.</span>
        </div>
      </footer>
    </main>
  )
}
