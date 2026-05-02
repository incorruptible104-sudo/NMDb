'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface StreamingRecord {
  platform: string
  movies: {
    id: string
    title: string
    poster_url: string | null
    nmdb_meter?: number | null
    release_date?: string | null
  } | null
}

interface Props {
  records: StreamingRecord[]
}

export default function StreamingSlideshow({ records }: Props) {
  const slides = records.filter((r) => r.movies?.poster_url).slice(0, 5)
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length)
  }, [slides.length])

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(next, 4000)
    return () => clearInterval(timer)
  }, [next, slides.length])

  if (slides.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 text-center text-gray-600 text-sm flex-1">
        No streaming data yet.
      </div>
    )
  }

  const movie = slides[current].movies!
  const platform = slides[current].platform

  return (
    <div className="flex flex-col">
      {/* Main slide — height tuned to match the Row 1 column height */}
      <a
        href={`/movies/${movie.id}`}
        className="group relative rounded-xl overflow-hidden bg-gray-800 block"
        style={{ height: '186px' }}
      >
        <Image
          src={movie.poster_url!}
          alt={movie.title}
          fill
          sizes="288px"
          className="object-contain transition-opacity duration-700"
          loading="lazy"
        />
        {/* Gradient overlay — bottom only so title is readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

        {/* Platform badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-gray-900/90 text-white text-xs px-2 py-1 rounded-lg font-medium">
            {platform}
          </span>
        </div>

        {/* Rating */}
        {movie.nmdb_meter && (
          <div className="absolute top-3 right-3 bg-black/80 text-emerald-400 text-xs font-bold px-1.5 py-0.5 rounded">
            ⭐ {movie.nmdb_meter}
          </div>
        )}

        {/* Title */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition leading-tight">
            {movie.title}
          </h3>
          {movie.release_date && (
            <p className="text-gray-400 text-xs mt-0.5">{movie.release_date.slice(0, 4)}</p>
          )}
        </div>
      </a>

      {/* Dot indicators + prev/next */}
      <div className="flex items-center justify-between mt-3 px-1">
        <button
          onClick={() => setCurrent((prev) => (prev - 1 + slides.length) % slides.length)}
          className="text-gray-500 hover:text-emerald-400 transition text-lg leading-none"
          aria-label="Previous"
        >
          ‹
        </button>

        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'bg-emerald-400 w-4 h-2'
                  : 'bg-gray-600 hover:bg-gray-400 w-2 h-2'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="text-gray-500 hover:text-emerald-400 transition text-lg leading-none"
          aria-label="Next"
        >
          ›
        </button>
      </div>
    </div>
  )
}
