import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'



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
        <Navbar />

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

        <Footer />
      </main>
    </>
  )
}
