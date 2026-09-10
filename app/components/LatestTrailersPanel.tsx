'use client'

import { useState, useEffect, useRef } from 'react'

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

export default function LatestTrailersPanel({ trailers = [] }: { trailers?: Trailer[] }) {
  const [trailerIndex, setTrailerIndex] = useState(0)
  const [trailerPlaying, setTrailerPlaying] = useState(false)
  const trailerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  useEffect(() => {
    if (trailerPlaying) {
      if (trailerIntervalRef.current) clearInterval(trailerIntervalRef.current)
    } else {
      startTrailerInterval()
    }
  }, [trailerPlaying])

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

  const currentTrailer = trailers[trailerIndex]
  const youtubeId = currentTrailer ? getYouTubeId(currentTrailer.trailer_url) : null
  const youtubeThumbnail = youtubeId
    ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
    : null

  return (
    <div>
      <div className="flex items-center mb-4">
        <h2 className="text-xl font-bold">🎬 Latest Trailers</h2>
      </div>

      <div className="bg-gray-900 rounded-2xl overflow-hidden flex flex-col max-w-2xl mx-auto">
        {currentTrailer && youtubeId ? (
          <>
            <div className="relative overflow-hidden bg-black aspect-video">
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

                  {trailers.length > 1 && (
                    <>
                      <button
                        onClick={prevTrailer}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 flex items-center justify-center transition z-10"
                        aria-label="Previous trailer"
                      >
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={nextTrailer}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 flex items-center justify-center transition z-10"
                        aria-label="Next trailer"
                      >
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setTrailerPlaying(true)}
                    className="absolute inset-0 flex items-center justify-center group"
                    aria-label="Play trailer"
                  >
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/70 flex items-center justify-center group-hover:bg-white/35 group-hover:scale-110 transition-all duration-200">
                      <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </button>
                </>
              )}
            </div>

            <div className="px-4 py-3 flex-shrink-0 bg-gray-900">
              <a href={`/movies/${currentTrailer.id}`} className="group block">
                <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wide mb-0.5">Trailer</p>
                <h3 className="text-white text-sm font-semibold line-clamp-1 group-hover:text-emerald-400 transition">
                  {currentTrailer.title}
                </h3>
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
          <div className="flex items-center justify-center aspect-video text-gray-600 text-sm">
            No trailers available
          </div>
        )}
      </div>
    </div>
  )
}
