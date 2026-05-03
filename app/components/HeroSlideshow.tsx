'use client'

import { useState, useEffect } from 'react'
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

export default function HeroSlideshow({
  posts,
  streaming,
}: {
  posts: BlogPost[]
  streaming: any[]
}) {
  const [postIndex, setPostIndex] = useState(0)
  const [streamIndex, setStreamIndex] = useState(0)

  // Auto-advance blog posts every 5 seconds
  useEffect(() => {
    if (!posts.length) return
    const t = setInterval(() => {
      setPostIndex((i) => (i + 1) % posts.length)
    }, 5000)
    return () => clearInterval(t)
  }, [posts.length])

  // Auto-advance streaming every 4 seconds (offset so they don't change together)
  useEffect(() => {
    if (!streaming.length) return
    const t = setInterval(() => {
      setStreamIndex((i) => (i + 1) % streaming.length)
    }, 4000)
    return () => clearInterval(t)
  }, [streaming.length])

  const validStreaming = streaming.filter((r) => r.movies)
  const currentPost = posts[postIndex]
  const currentStream = validStreaming[streamIndex]

  return (
    <div className="flex gap-4 items-stretch">

      {/* LEFT — Blog post slideshow */}
      <div className="flex-1 min-w-0">
        {posts.length > 0 && currentPost ? (
          <div className="relative rounded-2xl overflow-hidden bg-gray-900" style={{ height: '420px' }}>

            {/* Image — object-contain so nothing gets cropped */}
            {currentPost.cover_image_url ? (
              <Image
                key={currentPost.id}
                src={currentPost.cover_image_url}
                alt={currentPost.title}
                fill
                sizes="(max-width: 768px) 100vw, 55vw"
                className="object-contain transition-opacity duration-700"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-900 to-gray-900 flex items-center justify-center">
                <span className="text-6xl">📰</span>
              </div>
            )}

            {/* Gradient overlay for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

            {/* Text content */}
            <a
              href={`/blog/${currentPost.slug}`}
              className="absolute bottom-0 left-0 right-0 p-6 group"
            >
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

            {/* Dot indicators */}
            <div className="absolute top-4 right-4 flex gap-1.5">
              {posts.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPostIndex(i)}
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

        {/* View all articles link */}
        <a href="/blog" className="block text-center text-sm text-emerald-400 hover:text-emerald-300 transition mt-3">
          View all articles →
        </a>
      </div>

      {/* RIGHT — Now Streaming slideshow */}
      <div className="w-80 flex-shrink-0">
        <div className="bg-gray-900 rounded-2xl overflow-hidden" style={{ height: '420px' }}>

          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-sm font-bold">📺 Now Streaming</h3>
            <a href="/movies" className="text-emerald-400 text-xs hover:text-emerald-300 transition">All →</a>
          </div>

          {validStreaming.length > 0 && currentStream?.movies ? (
            <div className="flex flex-col h-[calc(100%-48px)]">

              {/* Large poster slideshow */}
              <a
                href={`/movies/${currentStream.movies.id}`}
                className="group relative flex-1 overflow-hidden"
              >
                {currentStream.movies.poster_url ? (
                  <Image
                    key={currentStream.movies.id}
                    src={currentStream.movies.poster_url}
                    alt={currentStream.movies.title}
                    fill
                    sizes="320px"
                    className="object-cover group-hover:scale-105 transition duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600">🎬</div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

                {/* Info */}
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

                {/* Dot indicators */}
                <div className="absolute top-3 right-3 flex gap-1.5">
                  {validStreaming.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.preventDefault(); setStreamIndex(i) }}
                      className={`w-2 h-2 rounded-full transition ${i === streamIndex ? 'bg-emerald-400' : 'bg-white/40'}`}
                    />
                  ))}
                </div>
              </a>

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
