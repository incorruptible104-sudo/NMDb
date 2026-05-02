'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image_url: string | null
  author: string
  created_at: string
}

type StreamingRecord = {
  platform: string
  movies: {
    id: string
    title: string
    poster_url: string | null
    nmdb_meter: number | null
    release_date: string | null
  } | null
}

// ─── Arrow button ─────────────────────────────────────────────────────────────
function Arrow({ dir, onClick }: { dir: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick() }}
      className={`absolute top-1/2 -translate-y-1/2 z-20 ${dir === 'left' ? 'left-3' : 'right-3'}
        bg-black/50 hover:bg-black/80 text-white rounded-full w-9 h-9 flex items-center justify-center
        transition backdrop-blur-sm border border-white/10`}
      aria-label={dir === 'left' ? 'Previous' : 'Next'}
    >
      {dir === 'left' ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HeroSlideshow({
  posts,
  streaming,
}: {
  posts: BlogPost[]
  streaming: StreamingRecord[]
}) {
  const [postIndex, setPostIndex] = useState(0)
  const [postDir, setPostDir] = useState(1)
  const [postAnimating, setPostAnimating] = useState(false)

  const [streamIndex, setStreamIndex] = useState(0)
  const [streamDir, setStreamDir] = useState(1)
  const [streamAnimating, setStreamAnimating] = useState(false)

  const validStreaming = streaming.filter((r) => r.movies)

  // ── Navigate posts ──
  const goPost = useCallback((nextIdx: number, dir: number) => {
    if (postAnimating) return
    setPostDir(dir)
    setPostAnimating(true)
    setTimeout(() => {
      setPostIndex(nextIdx)
      setPostAnimating(false)
    }, 450)
  }, [postAnimating])

  const nextPost = useCallback(() => {
    goPost((postIndex + 1) % posts.length, 1)
  }, [goPost, postIndex, posts.length])

  const prevPost = useCallback(() => {
    goPost((postIndex - 1 + posts.length) % posts.length, -1)
  }, [goPost, postIndex, posts.length])

  // ── Navigate streaming ──
  const goStream = useCallback((nextIdx: number, dir: number) => {
    if (streamAnimating) return
    setStreamDir(dir)
    setStreamAnimating(true)
    setTimeout(() => {
      setStreamIndex(nextIdx)
      setStreamAnimating(false)
    }, 450)
  }, [streamAnimating])

  const nextStream = useCallback(() => {
    goStream((streamIndex + 1) % validStreaming.length, 1)
  }, [goStream, streamIndex, validStreaming.length])

  const prevStream = useCallback(() => {
    goStream((streamIndex - 1 + validStreaming.length) % validStreaming.length, -1)
  }, [goStream, streamIndex, validStreaming.length])

  // ── Auto-advance ──
  useEffect(() => {
    if (posts.length <= 1) return
    const t = setInterval(nextPost, 5000)
    return () => clearInterval(t)
  }, [nextPost])

  useEffect(() => {
    if (validStreaming.length <= 1) return
    const t = setInterval(nextStream, 4000)
    return () => clearInterval(t)
  }, [nextStream])

  const currentPost = posts[postIndex]
  const currentStream = validStreaming[streamIndex]

  // Slide animation classes
  const slideEnterClass = (dir: number) => dir > 0 ? 'translate-x-full' : '-translate-x-full'

  return (
    <div className="flex gap-4 items-stretch">

      {/* ── LEFT: Blog post slideshow ── */}
      <div className="flex-1 min-w-0">
        {posts.length > 0 && currentPost ? (
          <div className="relative rounded-2xl overflow-hidden bg-black" style={{ height: '420px' }}>

            {/* Slide container */}
            <div
              key={currentPost.id}
              className={`absolute inset-0 transition-transform duration-500 ease-in-out ${postAnimating ? slideEnterClass(postDir) : 'translate-x-0'}`}
            >
              {/* Blurred background fill for images that don't fill frame */}
              {currentPost.cover_image_url && (
                <div
                  className="absolute inset-0 scale-110 blur-2xl opacity-50"
                  style={{
                    backgroundImage: `url(${currentPost.cover_image_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              )}

              {/* Main image — object-cover fills frame, no empty space */}
              {currentPost.cover_image_url ? (
                <Image
                  src={currentPost.cover_image_url}
                  alt={currentPost.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 55vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-900 to-gray-900 flex items-center justify-center">
                  <span className="text-6xl">📰</span>
                </div>
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

              {/* Text overlay */}
              <a href={`/blog/${currentPost.slug}`} className="absolute bottom-0 left-0 right-0 p-6 group">
                <span className="text-emerald-400 text-xs uppercase tracking-wider font-semibold">Latest</span>
                <h2 className="text-white font-bold text-xl mt-1 leading-snug group-hover:text-emerald-400 transition line-clamp-2">
                  {currentPost.title}
                </h2>
                {currentPost.excerpt && (
                  <p className="text-gray-300 text-sm mt-2 line-clamp-2">{currentPost.excerpt}</p>
                )}
                <p className="text-gray-500 text-xs mt-2">
                  {currentPost.author} · {new Date(currentPost.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </a>
            </div>

            {/* Arrows */}
            {posts.length > 1 && (
              <>
                <Arrow dir="left" onClick={prevPost} />
                <Arrow dir="right" onClick={nextPost} />
              </>
            )}

            {/* Dots */}
            <div className="absolute top-4 right-14 flex gap-1.5 z-10">
              {posts.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goPost(i, i > postIndex ? 1 : -1)}
                  className={`w-2 h-2 rounded-full transition ${i === postIndex ? 'bg-emerald-400' : 'bg-white/40'}`}
                />
              ))}
            </div>

          </div>
        ) : (
          <div className="rounded-2xl bg-gradient-to-br from-emerald-950 to-gray-900 flex flex-col items-center justify-center text-center p-12" style={{ height: '420px' }}>
            <h1 className="text-4xl font-bold mb-4">The <span className="text-emerald-400">Nollywood</span> Movie Database</h1>
            <p className="text-gray-400 mb-6 max-w-md">The definitive record of every professional Nollywood production.</p>
            <div className="flex gap-3">
              <a href="/movies" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition">Browse Movies</a>
              <a href="/box-office" className="border border-gray-600 text-gray-300 px-6 py-2.5 rounded-full text-sm font-semibold transition">Box Office</a>
            </div>
          </div>
        )}

        <a href="/blog" className="block text-center text-sm text-emerald-400 hover:text-emerald-300 transition mt-3">
          View all articles →
        </a>
      </div>

      {/* ── RIGHT: Now Streaming slideshow ── */}
      <div className="w-80 flex-shrink-0">
        <div className="bg-gray-900 rounded-2xl overflow-hidden" style={{ height: '420px' }}>

          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-sm font-bold">📺 Now Streaming</h3>
            <a href="/movies" className="text-emerald-400 text-xs hover:text-emerald-300 transition">All →</a>
          </div>

          {validStreaming.length > 0 && currentStream?.movies ? (
            <div className="relative h-[calc(100%-48px)] overflow-hidden">

              {/* Slide */}
              <div
                key={currentStream.movies.id}
                className={`absolute inset-0 transition-transform duration-500 ease-in-out ${streamAnimating ? slideEnterClass(streamDir) : 'translate-x-0'}`}
              >
                <a href={`/movies/${currentStream.movies.id}`} className="group absolute inset-0 block">
                  {currentStream.movies.poster_url ? (
                    <Image
                      src={currentStream.movies.poster_url}
                      alt={currentStream.movies.title}
                      fill
                      sizes="320px"
                      className="object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 bg-gray-800">🎬</div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <span className="bg-gray-800/90 text-white text-xs px-2 py-0.5 rounded font-medium">
                      {currentStream.platform}
                    </span>
                    <h4 className="text-white font-semibold text-sm mt-2 group-hover:text-emerald-400 transition line-clamp-2">
                      {currentStream.movies.title}
                    </h4>
                    {currentStream.movies.nmdb_meter && (
                      <p className="text-emerald-400 text-xs font-bold mt-1">⭐ {currentStream.movies.nmdb_meter}</p>
                    )}
                  </div>
                </a>
              </div>

              {/* Arrows */}
              {validStreaming.length > 1 && (
                <>
                  <Arrow dir="left" onClick={prevStream} />
                  <Arrow dir="right" onClick={nextStream} />
                </>
              )}

              {/* Dots */}
              <div className="absolute top-3 right-3 flex gap-1.5 z-10">
                {validStreaming.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.preventDefault(); goStream(i, i > streamIndex ? 1 : -1) }}
                    className={`w-2 h-2 rounded-full transition ${i === streamIndex ? 'bg-emerald-400' : 'bg-white/40'}`}
                  />
                ))}
              </div>

            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm">
              No streaming data yet
            </div>
          )}

        </div>
      </div>

    </div>
  )
}
