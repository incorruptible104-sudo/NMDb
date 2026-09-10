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

export default function LatestNewsPanel({ posts }: { posts: BlogPost[] }) {
  const [postIndex, setPostIndex] = useState(0)

  useEffect(() => {
    if (!posts.length) return
    const t = setInterval(() => setPostIndex((i) => (i + 1) % posts.length), 5000)
    return () => clearInterval(t)
  }, [posts.length])

  const prevPost = () => setPostIndex((i) => (i - 1 + posts.length) % posts.length)
  const nextPost = () => setPostIndex((i) => (i + 1) % posts.length)
  const currentPost = posts[postIndex]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">📰 Latest News</h2>
        <a href="/blog" className="text-emerald-400 text-sm hover:text-emerald-300 transition">All →</a>
      </div>

      {posts.length > 0 && currentPost ? (
        <div className="relative rounded-2xl overflow-hidden bg-gray-900 h-[340px] md:h-[380px]">
          {currentPost.cover_image_url ? (
            <Image
              key={currentPost.id}
              src={currentPost.cover_image_url}
              alt={currentPost.title}
              fill
              sizes="100vw"
              className="object-cover transition-opacity duration-700"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-900 to-gray-900 flex items-center justify-center">
              <span className="text-6xl">📰</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

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
            <h3 className="text-white font-bold text-lg mt-1 leading-snug group-hover:text-emerald-400 transition line-clamp-2">
              {currentPost.title}
            </h3>
            {currentPost.excerpt && (
              <p className="text-gray-300 text-sm mt-1.5 line-clamp-2 max-w-2xl">{currentPost.excerpt}</p>
            )}
            <p className="text-gray-500 text-xs mt-2">
              {currentPost.author} · {new Date(currentPost.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </a>

          <div className="absolute top-4 right-14 flex gap-1.5">
            {posts.map((_, i) => (
              <button key={i} onClick={() => setPostIndex(i)}
                className={`w-2 h-2 rounded-full transition ${i === postIndex ? 'bg-emerald-400' : 'bg-white/40'}`}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-2xl p-6 text-center text-gray-600 text-sm">No news posts yet.</div>
      )}
    </div>
  )
}
