'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function NowStreamingPanel({ streaming }: { streaming: any[] }) {
  const [streamIndex, setStreamIndex] = useState(0)
  const validStreaming = streaming.filter((r) => r.movies)

  useEffect(() => {
    if (!validStreaming.length) return
    const t = setInterval(() => setStreamIndex((i) => (i + 1) % validStreaming.length), 4000)
    return () => clearInterval(t)
  }, [validStreaming.length])

  const currentStream = validStreaming[streamIndex]

  return (
    <div>
      <div className="flex items-center justify-between mb-4 max-w-sm mx-auto">
        <h2 className="text-xl font-bold">📺 Now Streaming</h2>
        <a href="/streaming" className="text-emerald-400 text-sm hover:text-emerald-300 transition">All →</a>
      </div>

      <div className="bg-gray-900 rounded-2xl overflow-hidden relative h-[420px] max-w-sm mx-auto">
        {validStreaming.length > 0 && currentStream?.movies ? (
          <a href={`/movies/${currentStream.movies.id}`} className="group absolute inset-0">
            {currentStream.movies.poster_url ? (
              <Image
                key={currentStream.movies.id}
                src={currentStream.movies.poster_url}
                alt={currentStream.movies.title}
                fill
                sizes="384px"
                className="object-cover group-hover:scale-105 transition duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600">🎬</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <span className="bg-gray-800/90 text-white text-xs px-2 py-0.5 rounded font-medium">
                {currentStream.platform}
              </span>
              <h3 className="text-white font-semibold text-base mt-2 group-hover:text-emerald-400 transition line-clamp-2">
                {currentStream.movies.title}
              </h3>
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
  )
}
