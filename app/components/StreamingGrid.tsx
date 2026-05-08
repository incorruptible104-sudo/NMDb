'use client'

import { useState } from 'react'
import Image from 'next/image'

type StreamingRecord = {
  platform: string
  available_from: string | null
  movies: {
    id: string
    title: string
    poster_url: string | null
    release_date: string | null
    nmdb_meter: number | null
    genre: string | null
    content_type: string | null
  } | null
}

const PLATFORM_COLORS: Record<string, string> = {
  Netflix: 'bg-red-600',
  'Prime Video': 'bg-blue-500',
  Showmax: 'bg-purple-600',
  'Apple TV+': 'bg-gray-500',
  'Disney+': 'bg-blue-700',
}

export default function StreamingGrid({
  records,
  platforms,
}: {
  records: StreamingRecord[]
  platforms: string[]
}) {
  const [activePlatform, setActivePlatform] = useState('All')

  const filtered = activePlatform === 'All'
    ? records
    : records.filter(r => r.platform === activePlatform)

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const platformColor = (platform: string) =>
    PLATFORM_COLORS[platform] || 'bg-gray-700'

  return (
    <section className="px-6 py-10">
      <div className="max-w-6xl mx-auto">

        {/* Platform filter tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {platforms.map(platform => (
            <button
              key={platform}
              onClick={() => setActivePlatform(platform)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                activePlatform === platform
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {platform}
              {platform !== 'All' && (
                <span className="ml-2 text-xs opacity-70">
                  {records.filter(r => r.platform === platform).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-gray-500 text-sm mb-6">
          {filtered.length} film{filtered.length !== 1 ? 's' : ''} 
          {activePlatform !== 'All' ? ` on ${activePlatform}` : ' streaming'}
        </p>

        {/* Poster grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {filtered.map((record, i) => {
              const movie = record.movies
              if (!movie) return null
              return (
                <a key={`${movie.id}-${i}`} href={`/movies/${movie.id}`} className="group">
                  <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 relative mb-2">
                    {movie.poster_url ? (
                      <Image
                        src={movie.poster_url}
                        alt={movie.title}
                        fill
                        sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
                        className="object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">🎬</div>
                    )}

                    {/* Platform badge */}
                    <div className="absolute top-2 left-2">
                      <span className={`${platformColor(record.platform)} text-white text-xs px-2 py-0.5 rounded font-medium`}>
                        {record.platform}
                      </span>
                    </div>

                    {/* NMDb rating */}
                    {movie.nmdb_meter && (
                      <div className="absolute bottom-2 right-2 bg-black/80 text-emerald-400 text-xs font-bold px-1.5 py-0.5 rounded">
                        ⭐ {movie.nmdb_meter}
                      </div>
                    )}
                  </div>

                  <h3 className="text-xs font-medium truncate group-hover:text-emerald-400 transition">
                    {movie.title}
                  </h3>

                  {record.available_from && (
                    <p className="text-gray-600 text-xs mt-0.5">
                      {formatDate(record.available_from)}
                    </p>
                  )}
                </a>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-24 text-gray-500">
            <div className="text-6xl mb-4">📺</div>
            <p className="text-lg font-semibold text-gray-400">No films found for {activePlatform}</p>
            <p className="text-sm text-gray-600 mt-2">Try selecting a different platform</p>
          </div>
        )}

      </div>
    </section>
  )
}
