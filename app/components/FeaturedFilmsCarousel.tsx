'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

type Movie = {
  id: string
  title: string
  poster_url: string
  release_date?: string
  nmdb_meter?: number
}

export default function FeaturedFilmsCarousel({ movies }: { movies: Movie[] }) {
  // We keep exactly 7 movies max
  const items = movies.slice(0, 7)

  // For the sliding effect we duplicate the list so it can loop seamlessly
  // We show 7 posters at a time; the carousel cycles through by pushing one off the left
  const [offset, setOffset] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Number of visible cards at a time (desktop: 7, mobile: 3)
  // We render items * 3 copies for infinite feel
  const repeated = [...items, ...items, ...items]

  const cardWidthPercent = 100 / 7 // 7 visible on desktop

  const startInterval = () => {
    intervalRef.current = setInterval(() => {
      setIsAnimating(true)
      setOffset(prev => prev + 1)
    }, 3000)
  }

  useEffect(() => {
    startInterval()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // Reset offset seamlessly when we've gone through one full set
  useEffect(() => {
    if (offset >= items.length) {
      // After the transition completes, snap back without animation
      const timer = setTimeout(() => {
        setIsAnimating(false)
        setOffset(0)
      }, 500) // match transition duration
      return () => clearTimeout(timer)
    }
  }, [offset, items.length])

  const translateX = -(offset * cardWidthPercent)

  return (
    <div className="w-full overflow-hidden">
      {/* Desktop carousel */}
      <div
        className="hidden md:flex gap-4"
        style={{
          transform: `translateX(calc(${translateX}% - ${offset * (16 / 7)}px))`,
          transition: isAnimating ? 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          width: `${(repeated.length / 7) * 100}%`,
        }}
      >
        {repeated.map((movie, i) => (
          <a
            key={`${movie.id}-${i}`}
            href={`/movies/${movie.id}`}
            className="group flex-shrink-0"
            style={{ width: `${100 / repeated.length}%` }}
          >
            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 relative mb-2">
              <Image
                src={movie.poster_url}
                alt={movie.title}
                fill
                sizes="130px"
                className="object-cover group-hover:scale-105 transition duration-300"
                loading="lazy"
              />
              {movie.nmdb_meter && (
                <div className="absolute bottom-1 right-1 bg-black/80 text-emerald-400 text-xs font-bold px-1.5 py-0.5 rounded">
                  ⭐ {movie.nmdb_meter}
                </div>
              )}
            </div>
            <h3 className="text-sm font-medium truncate group-hover:text-emerald-400 transition">{movie.title}</h3>
            <p className="text-gray-500 text-xs">{movie.release_date?.slice(0, 4)}</p>
          </a>
        ))}
      </div>

      {/* Mobile carousel — shows 3 at a time, same sliding logic */}
      <MobileCarousel items={items} />
    </div>
  )
}

function MobileCarousel({ items }: { items: Movie[] }) {
  const repeated = [...items, ...items, ...items]
  const [offset, setOffset] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const cardWidthPercent = 100 / 3 // 3 visible on mobile

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setIsAnimating(true)
      setOffset(prev => prev + 1)
    }, 3000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  useEffect(() => {
    if (offset >= items.length) {
      const timer = setTimeout(() => {
        setIsAnimating(false)
        setOffset(0)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [offset, items.length])

  const translateX = -(offset * cardWidthPercent)

  return (
    <div className="md:hidden w-full overflow-hidden">
      <div
        className="flex gap-3"
        style={{
          transform: `translateX(calc(${translateX}% - ${offset * (12 / 3)}px))`,
          transition: isAnimating ? 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          width: `${(repeated.length / 3) * 100}%`,
        }}
      >
        {repeated.map((movie, i) => (
          <a
            key={`${movie.id}-mob-${i}`}
            href={`/movies/${movie.id}`}
            className="group flex-shrink-0"
            style={{ width: `${100 / repeated.length}%` }}
          >
            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 relative mb-2">
              <Image
                src={movie.poster_url}
                alt={movie.title}
                fill
                sizes="110px"
                className="object-cover group-hover:scale-105 transition duration-300"
                loading="lazy"
              />
              {movie.nmdb_meter && (
                <div className="absolute bottom-1 right-1 bg-black/80 text-emerald-400 text-xs font-bold px-1.5 py-0.5 rounded">
                  ⭐ {movie.nmdb_meter}
                </div>
              )}
            </div>
            <h3 className="text-xs font-medium truncate group-hover:text-emerald-400 transition">{movie.title}</h3>
            <p className="text-gray-500 text-xs">{movie.release_date?.slice(0, 4)}</p>
          </a>
        ))}
      </div>
    </div>
  )
}
