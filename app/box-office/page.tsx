import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import SearchBar from '@/app/components/SearchBar'



const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const metadata = {
  title: 'Box Office — NMDb | Nollywood Movie Database',
  description: 'Track Nollywood box office performance — opening weekends, total grosses, and weekly earnings.',
}

export default async function BoxOfficePage() {

  // Get all box office records with movie details
  const { data: boxOfficeRecords } = await supabase
    .from('box_office')
    .select('*, movies(id, title, release_date, poster_url, release_type, production_company)')
    .order('total_nigeria', { ascending: false })

  // Get total industry box office
  const totalIndustry = boxOfficeRecords?.reduce(
    (sum, record) => sum + (record.total_nigeria || 0), 0
  ) || 0

  // Get highest single opening weekend
  const highestOpening = boxOfficeRecords?.reduce(
    (max, record) => Math.max(max, record.opening_weekend || 0), 0
  ) || 0

  // Deduplicate movies — one row per movie showing their highest total
  const movieMap = new Map()
  boxOfficeRecords?.forEach((record: any) => {
    const movieId = record.movies?.id
    if (!movieId) return
    const existing = movieMap.get(movieId)
    if (!existing || (record.total_nigeria || 0) > (existing.total_nigeria || 0)) {
      movieMap.set(movieId, record)
    }
  })
  const topMovies = Array.from(movieMap.values())
    .sort((a, b) => (b.total_nigeria || 0) - (a.total_nigeria || 0))

  // Format naira
  const formatNaira = (amount: number) => {
    if (amount >= 1_000_000_000) return `₦${(amount / 1_000_000_000).toFixed(2)}B`
    if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`
    return `₦${amount.toLocaleString()}`
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Navigation */}
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="/" className="text-2xl font-bold text-emerald-500">NMDb</a>
            <div className="hidden md:flex gap-6 text-sm text-gray-400">
              <a href="/movies" className="hover:text-white transition">Movies</a>
              <a href="/people" className="hover:text-white transition">People</a>
              <a href="/box-office" className="text-white transition">Box Office</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
           <SearchBar />
            <button className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-4 py-2 rounded-full transition">
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="px-6 py-12 border-b border-gray-800">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Nollywood Box Office</h1>
          <p className="text-gray-400 mb-8">
            The financial record of Nollywood cinema — transparent, verified, and growing.
          </p>

          {/* Industry Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">Total Industry Gross</div>
              <div className="text-3xl font-bold text-emerald-400">{formatNaira(totalIndustry)}</div>
              <div className="text-gray-600 text-xs mt-1">From 2019 to present</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">Films Tracked</div>
              <div className="text-3xl font-bold text-white">{topMovies.length}</div>
              <div className="text-gray-600 text-xs mt-1">With verified box office data</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">Highest Opening Weekend</div>
              <div className="text-3xl font-bold text-white">{formatNaira(highestOpening)}</div>
              <div className="text-gray-600 text-xs mt-1">Single film record</div>
            </div>
          </div>
        </div>
      </section>

      {/* Box Office Table */}
      <section className="px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">All Time Rankings</h2>

          {topMovies.length > 0 ? (
            <div className="space-y-3">
              {topMovies.map((record: any, index: number) => (
                <a
                  key={record.id}
                  href={`/movies/${record.movies?.id}`}
                  className="flex items-center gap-4 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-emerald-700 rounded-2xl p-4 transition group"
                >
                  {/* Rank */}
                  <div className="w-8 text-center flex-shrink-0">
                    <span className={`text-lg font-bold ${
                      index === 0 ? 'text-yellow-400' :
                      index === 1 ? 'text-gray-400' :
                      index === 2 ? 'text-amber-600' :
                      'text-gray-600'
                    }`}>
                      #{index + 1}
                    </span>
                  </div>

                  {/* Poster */}
                  <div className="w-12 h-16 rounded-lg overflow-hidden bg-gray-800 relative flex-shrink-0">
                    {record.movies?.poster_url ? (
                      <Image
                        src={record.movies.poster_url}
                        alt={record.movies.title}
                        fill
                        sizes="48px"
                        className="object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 text-lg">
                        🎬
                      </div>
                    )}
                  </div>

                  {/* Movie Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold group-hover:text-emerald-400 transition truncate">
                      {record.movies?.title}
                    </h3>
                    <div className="flex gap-3 mt-1 text-xs text-gray-500">
                      {record.movies?.release_date && (
                        <span>{record.movies.release_date.slice(0, 4)}</span>
                      )}
                      {record.movies?.release_type && (
                        <span>{record.movies.release_type}</span>
                      )}
                      {record.movies?.production_company && (
                        <span className="truncate">{record.movies.production_company}</span>
                      )}
                    </div>
                  </div>

                  {/* Box Office Figures */}
                  <div className="flex gap-6 flex-shrink-0 text-right">
                    {record.opening_weekend && (
                      <div className="hidden md:block">
                        <div className="text-xs text-gray-500 mb-1">Opening Weekend</div>
                        <div className="text-sm font-semibold text-white">
                          {formatNaira(record.opening_weekend)}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Total Nigeria</div>
                      <div className="text-base font-bold text-emerald-400">
                        {formatNaira(record.total_nigeria || 0)}
                      </div>
                    </div>
                    {record.total_worldwide && (
                      <div className="hidden md:block">
                        <div className="text-xs text-gray-500 mb-1">Worldwide</div>
                        <div className="text-sm font-semibold text-white">
                          {formatNaira(record.total_worldwide)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Verified badge */}
                  {record.verified && (
                    <div className="flex-shrink-0">
                      <span className="text-xs bg-emerald-900/50 border border-emerald-700 text-emerald-400 px-2 py-1 rounded-full">
                        ✓ Verified
                      </span>
                    </div>
                  )}
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 text-gray-500">
              <div className="text-7xl mb-6">💰</div>
              <h2 className="text-2xl font-bold text-gray-400 mb-3">No box office data yet</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Box office figures are added via the movie admin panel.
                This will become NMDb's most powerful differentiator.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Data Note */}
      <section className="px-6 pb-12">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">About This Data</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              NMDb collects box office figures from verified industry sources.
              All figures are in Nigerian Naira (₦). Figures marked ✓ Verified have been
              confirmed from official or multiple credible sources. NMDb is committed to
              financial transparency in the Nollywood industry.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-gray-500 text-sm">
          <span>© 2026 NMDb — Nollywood Movie Database</span>
          <span>Built for the industry. Powered by data.</span>
        </div>
      </footer>

    </main>
  )
}
