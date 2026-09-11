'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

type Actor = {
  id: string
  full_name: string
  stage_name?: string | null
  photo_url?: string | null
}

export default function ActorsCarousel({ actors }: { actors: Actor[] }) {
  // We keep exactly 7 actors max, matching FeaturedFilmsCarousel
  const items = actors.slice(0, 7)

  const [offset, setOffset] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Number of visible cards at a time (desktop: 7, mobile: 3)
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
        {repeated.map((person, i) => (
          <a
            key={`${person.id}-${i}`}
            href={`/people/${person.id}`}
            className="group flex-shrink-0 text-center"
            style={{ width: `${100 / repeated.length}%` }}
          >
            <div className="aspect-square rounded-2xl overflow-hidden bg-gray-800 relative mb-2">
              {person.photo_url ? (
                <Image
                  src={person.photo_url}
                  alt={person.full_name}
                  fill
                  sizes="130px"
                  className="object-cover group-hover:scale-105 transition duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-3xl">👤</div>
              )}
            </div>
            <h3 className="text-sm font-medium truncate group-hover:text-emerald-400 transition">{person.stage_name || person.full_name}</h3>
          </a>
        ))}
      </div>

      {/* Mobile carousel — shows 3 at a time, same sliding logic */}
      <MobileActorsCarousel items={items} />
    </div>
  )
}

function MobileActorsCarousel({ items }: { items: Actor[] }) {
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
        {repeated.map((person, i) => (
          <a
            key={`${person.id}-mob-${i}`}
            href={`/people/${person.id}`}
            className="group flex-shrink-0 text-center"
            style={{ width: `${100 / repeated.length}%` }}
          >
            <div className="aspect-square rounded-2xl overflow-hidden bg-gray-800 relative mb-2">
              {person.photo_url ? (
                <Image
                  src={person.photo_url}
                  alt={person.full_name}
                  fill
                  sizes="110px"
                  className="object-cover group-hover:scale-105 transition duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-3xl">👤</div>
              )}
            </div>
            <h3 className="text-xs font-medium truncate group-hover:text-emerald-400 transition">{person.stage_name || person.full_name}</h3>
          </a>
        ))}
      </div>
    </div>
  )
}
