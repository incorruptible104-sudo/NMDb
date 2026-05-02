'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Result = {
  id: string
  type: 'movie' | 'person' | 'blog'
  title: string
  subtitle?: string
  image?: string | null
  url: string
}

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      setOpen(false)
      return
    }

    const timeout = setTimeout(async () => {
      setLoading(true)

      const q = query.trim()

      const [moviesRes, peopleRes, blogRes] = await Promise.all([
        supabase
          .from('movies')
          .select('id, title, release_date, poster_url, content_type')
          .ilike('title', `%${q}%`)
          .limit(4),
        supabase
          .from('people')
          .select('id, full_name, stage_name, photo_url, primary_role')
          .ilike('full_name', `%${q}%`)
          .limit(3),
        supabase
          .from('blog_posts')
          .select('id, title, slug, cover_image_url, created_at')
          .eq('published', true)
          .ilike('title', `%${q}%`)
          .limit(2),
      ])

      const combined: Result[] = [
        ...(moviesRes.data || []).map((m: any) => ({
          id: m.id,
          type: 'movie' as const,
          title: m.title,
          subtitle: `${m.content_type || 'Movie'} · ${m.release_date?.slice(0, 4) || ''}`,
          image: m.poster_url,
          url: `/movies/${m.id}`,
        })),
        ...(peopleRes.data || []).map((p: any) => ({
          id: p.id,
          type: 'person' as const,
          title: p.full_name,
          subtitle: p.stage_name ? `"${p.stage_name}" · ${p.primary_role}` : p.primary_role,
          image: p.photo_url,
          url: `/people/${p.id}`,
        })),
        ...(blogRes.data || []).map((b: any) => ({
          id: b.id,
          type: 'blog' as const,
          title: b.title,
          subtitle: `Article · ${new Date(b.created_at).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })}`,
          image: b.cover_image_url,
          url: `/blog/${b.slug}`,
        })),
      ]

      setResults(combined)
      setOpen(combined.length > 0)
      setLoading(false)
    }, 300)

    return () => clearTimeout(timeout)
  }, [query])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim().length < 2) return
    setOpen(false)
    router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  const handleSelect = (url: string) => {
    setOpen(false)
    setQuery('')
    router.push(url)
  }

  const typeIcon = (type: string) => {
    if (type === 'movie') return '🎬'
    if (type === 'person') return '👤'
    return '📰'
  }

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Search movies, people, articles..."
            className="bg-gray-800 text-sm px-4 py-2 pl-9 rounded-full text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-56 transition-all focus:w-72"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
          {loading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">...</span>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl z-50">
          <div className="divide-y divide-gray-800">
            {results.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleSelect(result.url)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition text-left"
              >
                {/* Thumbnail */}
                <div className={`flex-shrink-0 overflow-hidden bg-gray-800 relative ${
                  result.type === 'person' ? 'w-9 h-9 rounded-full' : 'w-9 h-12 rounded-lg'
                }`}>
                  {result.image ? (
                    <Image
                      src={result.image}
                      alt={result.title}
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">
                      {typeIcon(result.type)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{result.title}</p>
                  <p className="text-gray-500 text-xs truncate">{result.subtitle}</p>
                </div>

                {/* Type badge */}
                <span className="text-gray-600 text-xs flex-shrink-0">{typeIcon(result.type)}</span>
              </button>
            ))}
          </div>

          {/* View all results */}
          <button
            onClick={() => { setOpen(false); router.push(`/search?q=${encodeURIComponent(query.trim())}`) }}
            className="w-full px-4 py-3 text-emerald-400 hover:text-emerald-300 text-sm text-center hover:bg-gray-800 transition border-t border-gray-800"
          >
            View all results for "{query}" →
          </button>
        </div>
      )}
    </div>
  )
}
