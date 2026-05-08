'use client'

import { useState, useEffect, useRef } from 'react'
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

type Trailer = {
  id: string
  title: string
  poster_url: string | null
  release_date?: string
  trailer_url: string
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export default function HeroSlideshow({
  posts,
  streaming,
  trailers = [],
}: {
  posts: BlogPost[]
  streaming: any[]
  trailers?: Trailer[]
}) {
  const [postIndex, setPostIndex] = useState(0)
  const [streamIndex, setStreamIndex] = useState(0)
  const [trailerIndex, setTrailerIndex] = useState(0)
  const [trailerPlaying, setTrailerPlaying] = useState(false)
  const trailerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Auto-advance blog posts every 5s
  useEffect(() => {
    if (!posts.length) return
    const t = setInterval(() => setPostIndex((i) => (i + 1) % posts.length), 5000)
    return () => clearInterval(t)
  }, [posts.length])

  // Auto-advance streaming every 4s
  useEffect(() => {
    if (!streaming.length) return
    const t = setInterval(() => setStreamIndex((i) => (i + 1) % streaming.length), 4000)
    return () => clearInterval(t)
  }, [streaming.length])

  // Auto-advance trailers every 6s — pause when playing
  const startTrailerInterval = () => {
    if (trailerIntervalRef.current) clearInterval(trailerIntervalRef.current)
    trailerIntervalRef.current = setInterval(() => {
      setTrailerIndex((i) => (i + 1) % Math.max(trailers.length, 1))
      setTrailerPlaying(false)
    }, 6000)
  }

  useEffect(() => {
    if (!trailers.length) return
    startTrailerInterval()
    return () => { if (trailerIntervalRef.current) clearInterval(trailerIntervalRef.current) }
  }, [trailers.length])

  // Stop auto-advance when trailer is playing
  useEffect(() => {
    if (trailerPlaying) {
      if (trailerIntervalRef.current) clearInterval(trailerIntervalRef.current)
    } else {
      startTrailerInterval()
    }
  }, [trailerPlaying])

  // Reset player when trailer changes
  useEffect(() => {
    setTrailerPlaying(false)
  }, [trailerIndex])

  const prevTrailer = () => {
    setTrailerIndex((i) => (i - 1 + trailers.length) % trailers.length)
    startTrailerInterval()
  }
  const nextTrailer = () => {
    setTrailerIndex((i) => (i + 1) % trailers.length)
    startTrailerInterval()
  }
  const prevPost = () => setPostIndex((i) => (i - 1 + posts.length) % posts.length)
  const nextPost = () => setPostIndex((i) => (i + 1) % posts.length)

  const validStreaming = streaming.filter((r) => r.movies)
  const currentPost = posts[postIndex]
  const currentStream = validStreaming[streamIndex]
  const currentTrailer = trailers[trailerIndex]
  const youtubeId = currentTrailer ? getYouTubeId(currentTrailer.trailer_url) : null
  const youtubeThumbnail = youtubeId
    ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
    : null

  return (
    <div className="flex flex-col md:flex-row gap-3 md:h-[380px]">

      {/* ── LEFT: Latest News (~50%) ──────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center justify-between mb-1.5 px-1 flex-shrink-0">
          <h3 className="text-sm font-bold">📰 Latest News</h3>
          <a href="/blog" className="text-emerald-400 text-xs hover:text-emerald-300 transition">All →</a>
        </div>

        {posts.length > 0 && currentPost ? (
          <div className="relative rounded-2xl overflow-hidden bg-gray-900 flex-1 min-h-[280px] md:min-h-0">
            {currentPost.cover_image_url ? (
              <Image
                key={currentPost.id}
                src={currentPost.cover_image_url}
                alt={currentPost.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-opacity duration-700"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-900 to-gray-900 flex items-center justify-center">
                <span className="text-6xl">📰</span>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

            {/* ← → Arrow buttons */}
            <button
              onClick={prevPost}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 flex items-center justify-center transition z-10"
              aria-label="Previous"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextPost}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 flex items-center justify-center transition z-10"
              aria-label="Next"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <a href={`/blog/${currentPost.slug}`} className="absolute bottom-0 left-0 right-0 p-5 group">
              <span className="text-emerald-400 text-xs uppercase tracking-wider font-semibold">Latest</span>
              <h2 className="text-white font-bold text-lg mt-1 leading-snug group-hover:text-emerald-400 transition line-clamp-2">
                {currentPost.title}
              </h2>
              {currentPost.excerpt && (
                <p className="text-gray-300 text-sm mt-1.5 line-clamp-2">{currentPost.excerpt}</p>
              )}
              <p className="text-gray-500 text-xs mt-2">
                {currentPost.author} · {new Date(currentPost.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </a>

            {/* Dot indicators */}
            <div className="absolute top-4 right-14 flex gap-1.5">
              {posts.map((_, i) => (
                <button key={i} onClick={() => setPostIndex(i)}
                  className={`w-2 h-2 rounded-full transition ${i === postIndex ? 'bg-emerald-400' : 'bg-white/40'}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-gradient-to-br from-emerald-950 to-gray-900 flex flex-col items-center justify-center text-center p-8 flex-1">
            <h1 className="text-3xl font-bold mb-3">The <span className="text-emerald-400">Nollywood</span> Movie Database</h1>
            <p className="text-gray-400 mb-5 max-w-md text-sm">The definitive record of every professional Nollywood production.</p>
            <div className="flex gap-3">
              <a href="/movies" className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-full text-sm font-semibold transition">Browse Movies</a>
              <a href="/box-office" className="border border-gray-600 text-gray-300 px-5 py-2 rounded-full text-sm font-semibold transition">Box Office</a>
            </div>
          </div>
        )}
      </div>

      {/* ── MIDDLE: Latest Trailers (~25%) — auto-slideshow, no All link ── */}
      <div className="w-full md:w-[25%] md:flex-shrink-0 flex flex-col h-64 md:h-auto">
        <div className="flex items-center mb-1.5 px-1 flex-shrink-0">
          <h3 className="text-sm font-bold">🎬 Latest Trailers</h3>
        </div>

        <div className="bg-gray-900 rounded-2xl overflow-hidden flex flex-col flex-1">
          {currentTrailer && youtubeId ? (
            <>
              {/* Video / thumbnail */}
              <div className="relative overflow-hidden bg-black flex-1">
                {trailerPlaying ? (
                  <iframe
                    key={youtubeId}
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=0&rel=0&modestbranding=1`}
                    title={currentTrailer.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full border-0"
                  />
                ) : (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={youtubeThumbnail!}
                      alt={currentTrailer.title}
                      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                      onError={(e) => {
                        const img = e.currentTarget
                        if (img.src.includes('maxresdefault')) {
                          img.src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-black/30" />

                    {/* ← → Arrows */}
                    {trailers.length > 1 && (
                      <>
                        <button
                          onClick={prevTrailer}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 flex items-center justify-center transition z-10"
                          aria-label="Previous trailer"
                        >
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={nextTrailer}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 flex items-center justify-center transition z-10"
                          aria-label="Next trailer"
                        >
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </>
                    )}

                    {/* Play button */}
                    <button
                      onClick={() => setTrailerPlaying(true)}
                      className="absolute inset-0 flex items-center justify-center group"
                      aria-label="Play trailer"
                    >
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/70 flex items-center justify-center group-hover:bg-white/35 group-hover:scale-110 transition-all duration-200">
                        <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </button>
                  </>
                )}
              </div>

              {/* Info strip */}
              <div className="px-3 py-2.5 flex-shrink-0 bg-gray-900">
                <a href={`/movies/${currentTrailer.id}`} className="group block">
                  <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wide mb-0.5">Trailer</p>
                  <h4 className="text-white text-sm font-semibold line-clamp-1 group-hover:text-emerald-400 transition">
                    {currentTrailer.title}
                  </h4>
                </a>
                {trailers.length > 1 && (
                  <div className="flex gap-1.5 mt-1.5">
                    {trailers.map((_, i) => (
                      <button key={i} onClick={() => { setTrailerIndex(i); startTrailerInterval() }}
                        className={`w-2 h-2 rounded-full transition ${i === trailerIndex ? 'bg-emerald-400' : 'bg-white/30'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center flex-1 text-gray-600 text-sm">
              No trailers available
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Now Streaming (~25%) ──────────────────────────────── */}
      <div className="w-full md:w-[25%] md:flex-shrink-0 flex flex-col h-64 md:h-auto">
        <div className="flex items-center justify-between mb-1.5 px-1 flex-shrink-0">
          <h3 className="text-sm font-bold">📺 Now Streaming</h3>
          <a href="/streaming" className="text-emerald-400 text-xs hover:text-emerald-300 transition">All →</a>
        </div>

        <div className="bg-gray-900 rounded-2xl overflow-hidden flex-1 relative">
          {validStreaming.length > 0 && currentStream?.movies ? (
            <a href={`/movies/${currentStream.movies.id}`} className="group absolute inset-0">
              {currentStream.movies.poster_url ? (
                <Image
                  key={currentStream.movies.id}
                  src={currentStream.movies.poster_url}
                  alt={currentStream.movies.title}
                  fill
                  sizes="25vw"
                  className="object-cover group-hover:scale-105 transition duration-500"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">🎬</div>
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
              <div className="absolute top-3 right-3 flex gap-1.5">
                {validStreaming.map((_, i) => (
                  <button key={i} onClick={(e) => { e.preventDefault(); setStreamIndex(i) }}
                    className={`w-2 h-2 rounded-full transition ${i === streamIndex ? 'bg-emerald-400' : 'bg-white/40'}`}
                  />
                ))}
              </div>
            </a>
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
