'use client'

import Image from 'next/image'

type BoxOfficeRecord = {
  movie_id: string
  total_nigeria: number
  movies: {
    id: string
    title: string
    poster_url: string | null
    release_date: string
  }
}

function formatNaira(n: number) {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`
  return `₦${n.toLocaleString()}`
}

function daysInCinemas(releaseDate: string) {
  if (!releaseDate) return null
  const diff = Date.now() - new Date(releaseDate).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  return days >= 0 ? days : null
}

export default function BoxOfficeScroll({ records }: { records: BoxOfficeRecord[] }) {
  return (
    <div
      className="flex flex-col gap-2 pr-1"
      style={{
        maxHeight: '232px',
        overflowY: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: '#10b981 #1f2937',
      }}
    >
      {records.map((record, index) => {
        const days = daysInCinemas(record.movies?.release_date)
        return (
          <a
            key={record.movie_id}
            href={`/movies/${record.movies?.id}`}
            className="group flex items-center gap-3 bg-gray-900 hover:bg-gray-800 rounded-xl p-3 transition flex-shrink-0"
          >
            <span className={`text-sm font-bold w-5 text-center flex-shrink-0 ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : 'text-gray-600'}`}>
              {index + 1}
            </span>
            <div className="w-10 h-14 rounded-lg overflow-hidden bg-gray-800 relative flex-shrink-0">
              {record.movies?.poster_url ? (
                <Image src={record.movies.poster_url} alt={record.movies.title} fill sizes="40px" className="object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">🎬</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-medium truncate group-hover:text-emerald-400 transition">{record.movies?.title}</h3>
              <p className="text-emerald-400 text-xs font-bold">{formatNaira(record.total_nigeria || 0)}</p>
              {days !== null && (
                <p className="text-gray-600 text-xs">{days === 0 ? 'Opens today' : `${days} day${days === 1 ? '' : 's'} in cinemas`}</p>
              )}
            </div>
          </a>
        )
      })}
    </div>
  )
}
