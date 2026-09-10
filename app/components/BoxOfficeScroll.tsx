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
    <>
      {/* Mobile: 3-col grid, 6 movies (2 rows) */}
      <div className="grid grid-cols-3 gap-3 md:hidden">
        {records.slice(0, 6).map((record, index) => {
          const days = daysInCinemas(record.movies?.release_date)
          return (
            <a key={record.movie_id} href={`/movies/${record.movies?.id}`} className="group">
              <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 relative mb-2">
                {record.movies?.poster_url ? (
                  <Image src={record.movies.poster_url} alt={record.movies.title} fill sizes="110px" className="object-cover group-hover:scale-105 transition duration-300" loading="lazy" />
                ) : <div className="w-full h-full flex items-center justify-center text-gray-600">🎬</div>}
                <div className="absolute top-1 left-1">
                  <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${index === 0 ? 'bg-yellow-400 text-black' : index === 1 ? 'bg-gray-300 text-black' : index === 2 ? 'bg-amber-600 text-white' : 'bg-black/80 text-gray-300'}`}>
                    {index + 1}
                  </span>
                </div>
                <div className="absolute bottom-1 left-0 right-0 px-1">
                  <div className="bg-black/80 text-emerald-400 text-xs font-bold px-1.5 py-0.5 rounded text-center">{formatNaira(record.total_nigeria || 0)}</div>
                </div>
              </div>
              <h3 className="text-xs font-medium truncate group-hover:text-emerald-400 transition">{record.movies?.title}</h3>
              {days !== null && <p className="text-gray-600 text-xs">{days === 0 ? 'Opens today' : `${days}d in cinemas`}</p>}
            </a>
          )
        })}
      </div>

      {/* Desktop: 7-col grid, stretched full width */}
      <div className="hidden md:grid gap-3 md:grid-cols-7">
        {records.slice(0, 7).map((record, index) => {
          const days = daysInCinemas(record.movies?.release_date)
          return (
            <a key={record.movie_id} href={`/movies/${record.movies?.id}`} className="group">
              <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 relative mb-2">
                {record.movies?.poster_url ? (
                  <Image src={record.movies.poster_url} alt={record.movies.title} fill sizes="(max-width: 1200px) 14vw, 140px" className="object-cover group-hover:scale-105 transition duration-300" loading="lazy" />
                ) : <div className="w-full h-full flex items-center justify-center text-gray-600">🎬</div>}
                <div className="absolute top-2 left-2">
                  <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${index === 0 ? 'bg-yellow-400 text-black' : index === 1 ? 'bg-gray-300 text-black' : index === 2 ? 'bg-amber-600 text-white' : 'bg-black/80 text-gray-300'}`}>
                    {index + 1}
                  </span>
                </div>
                <div className="absolute bottom-2 left-0 right-0 px-2">
                  <div className="bg-black/80 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded text-center">{formatNaira(record.total_nigeria || 0)}</div>
                </div>
              </div>
              <h3 className="text-xs font-medium truncate group-hover:text-emerald-400 transition">{record.movies?.title}</h3>
              {days !== null && <p className="text-gray-500 text-xs">{days === 0 ? 'Opens today' : `${days} day${days === 1 ? '' : 's'} in cinemas`}</p>}
            </a>
          )
        })}
      </div>
    </>
  )
}
