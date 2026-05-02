import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import { notFound } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data: post } = await supabase.from('blog_posts').select('*').eq('slug', slug).single()
  if (!post) return { title: 'Post Not Found — NMDb' }
  return {
    title: `${post.title} — NMDb`,
    description: post.excerpt || post.title,
    openGraph: {
      title: post.title,
      description: post.excerpt || '',
      images: post.cover_image_url ? [post.cover_image_url] : [],
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!post) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    description: post.excerpt,
    image: post.cover_image_url,
    datePublished: post.created_at,
    author: { '@type': 'Organization', name: post.author },
    publisher: { '@type': 'Organization', name: 'NMDb', url: 'https://nmdb.cc' },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="min-h-screen bg-gray-950 text-white">
        <nav className="border-b border-gray-800 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-8">
              <a href="/" className="text-2xl font-bold text-emerald-500">NMDb</a>
              <div className="hidden md:flex gap-6 text-sm text-gray-400">
                <a href="/movies" className="hover:text-white transition">Movies</a>
                <a href="/people" className="hover:text-white transition">People</a>
                <a href="/box-office" className="hover:text-white transition">Box Office</a>
                <a href="/blog" className="hover:text-white transition">Blog</a>
              </div>
            </div>
            <a href="/blog" className="text-sm text-gray-400 hover:text-white transition">← Back to Blog</a>
          </div>
        </nav>

        <article className="max-w-3xl mx-auto px-6 py-12">

          {/* Cover Image */}
          {post.cover_image_url && (
            <div className="aspect-video rounded-2xl overflow-hidden bg-gray-800 relative mb-8">
              <Image
                src={post.cover_image_url}
                alt={post.title}
                fill
                className="object-cover"
                sizes="768px"
                priority
              />
            </div>
          )}

          {/* Header */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold leading-tight mb-4">{post.title}</h1>
            {post.excerpt && (
              <p className="text-xl text-gray-400 leading-relaxed mb-4">{post.excerpt}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-600 border-t border-gray-800 pt-4">
              <span>{post.author}</span>
              <span>·</span>
              <span>{new Date(post.created_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </header>

          {/* Content */}
          <div className="prose prose-invert max-w-none">
            {post.content.split('\n').map((paragraph: string, i: number) => (
              paragraph.trim() ? (
                <p key={i} className="text-gray-300 leading-relaxed mb-4">{paragraph}</p>
              ) : (
                <br key={i} />
              )
            ))}
          </div>

        </article>

        <footer className="border-t border-gray-800 px-6 py-8 mt-12">
          <div className="max-w-5xl mx-auto flex items-center justify-between text-gray-500 text-sm">
            <span>© 2026 NMDb — Nollywood Movie Database</span>
            <span>Built for the industry. Powered by data.</span>
          </div>
        </footer>
      </main>
    </>
  )
}
