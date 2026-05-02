import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import SearchBar from '@/app/components/SearchBar'



const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const metadata = {
  title: 'Movies — NMDb | Nollywood Movie Database',
  description: 'Browse every Nollywood film catalogued on NMDb.',
}

export default async function MoviesPage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string; platform?: string; language?: string; year?: string; status?: string; in_cinemas?: string}>
}) {
  const params = await searchParams
 const { genre, platform, language, year, status, in_cinemas } = params

  let query = supabase
    .from('movies')
    .select('id, title, poster_url, release_date, nmdb_meter, genre, language, release_type, status, in_cinemas, content_type')
    .eq('content_type', 'Movie')
    .order('poster_url', { ascending: false, nullsFirst: false })
    .order('release_date', { ascending: false })

  if (genre) query = query.contains('genre', [genre])
  if (language) query = query.contains('language', [language])
  if (year) query = query.gte('release_date', `${year}-01-01`).lte('release_date', `${year}-12-31`)
  if (status) query = query.eq('status', status)
    if (in_cinemas === 'true') {
  query = query.eq('in_cinemas', true)
}

  const { data: movies } = await query

  const { data: allPlatforms } = await supabase
    .from('streaming_platforms')
    .select('movie_id, platform')

  const platformMovieIds = platform
    ? allPlatforms?.filter((p: any) => p.platform === platform).map((p: any) => p.movie_id) || []
    : null

  const filteredMovies = platformMovieIds
    ? movies?.filter((m: any) => platformMovieIds.includes(m.id))
    : movies

  const genres = ['Action', 'Comedy', 'Drama', 'Thriller', 'Romance', 'Horror', 'Documentary', 'Animation', 'Crime', 'Family', 'Mystery', 'Biography', 'Musical', 'Sci-Fi']
  const languages = ['English', 'Yoruba', 'Igbo', 'Hausa', 'Nigerian Pidgin', 'Mixed']
  const streamingPlatforms = ['Netflix', 'Prime Video', 'ShowMax', 'Canal+', 'Apple TV', 'YouTube', 'ROK', 'IrokoTV']
  const years = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019']
  const statuses = ['In Cinemas', 'Released', 'Announced', 'In Production']

  const buildUrl = (key: string, value: string) => {
    const current = new URLSearchParams()
    if (genre && key !== 'genre') current.set('genre', genre)
    if (platform && key !== 'platform') current.set('platform', platform)
    if (language && key !== 'language') current.set('language', language)
    if (year && key !== 'year') current.set('year', year)
    if (status && key !== 'status') current.set('status', status)
    if (value) current.set(key, value)
    const str = current.toString()
    return `/movies${str ? `?${str}` : ''}`
  }

  const hasFilters = genre || platform || language || year || status

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Navigation */}
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="/" className="text-2xl font-bold text-emerald-500">NMDb</a>
            <div className="hidden md:flex gap-6 text-sm text-gray-400">
              <a href="/movies" className="text-white">Movies</a>
              <a href="/series" className="hover:text-white transition">Series</a>
              <a href="/people" className="hover:text-white transition">People</a>
              <a href="/box-office" className="hover:text-white transition">Box Office</a>
              <a href="/blog" className="hover:text-white transition">Blog</a>
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

      {/* Header + Filters */}
      <section className="px-6 py-10 border-b border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1>
  {in_cinemas === 'true'
    ? 'Now In Cinemas'
    : status === 'Announced'
    ? 'Coming Soon'
    : 'Nollywood Films'}
</h1>
            <a href="/series" className="text-sm text-gray-400 hover:text-emerald-400 transition border border-gray-700 hover:border-emerald-600 px-4 py-2 rounded-full">
              Switch to Series →
            </a>
          </div>
          <p className="text-gray-400 mb-8">
            {filteredMovies?.length || 0} film{filteredMovies?.length !== 1 ? 's' : ''} catalogued
            {hasFilters ? ' — filtered' : ' from 2019 to present'}
          </p>

          <div className="space-y-3">

            {/* Status */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-gray-600 w-16">Status:</span>
              <a href={buildUrl('status', '')}
                className={`px-3 py-1 rounded-full text-xs transition ${!status ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                All
              </a>
              {statuses.map(s => (
                <a key={s} href={buildUrl('status', status === s ? '' : s)}
                  className={`px-3 py-1 rounded-full text-xs transition ${status === s ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                  {s}
                </a>
              ))}
            </div>

            {/* Genre */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-gray-600 w-16">Genre:</span>
              <a href={buildUrl('genre', '')}
                className={`px-3 py-1 rounded-full text-xs transition ${!genre ? 'bg-gray-700 text-gray-300' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                All
              </a>
              {genres.map(g => (
                <a key={g} href={buildUrl('genre', genre === g ? '' : g)}
                  className={`px-3 py-1 rounded-full text-xs transition ${genre === g ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                  {g}
                </a>
              ))}
            </div>

            {/* Language */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-gray-600 w-16">Language:</span>
              {languages.map(l => (
                <a key={l} href={buildUrl('language', language === l ? '' : l)}
                  className={`px-3 py-1 rounded-full text-xs transition ${language === l ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                  {l}
                </a>
              ))}
            </div>

            {/* Year */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-gray-600 w-16">Year:</span>
              {years.map(y => (
                <a key={y} href={buildUrl('year', year === y ? '' : y)}
                  className={`px-3 py-1 rounded-full text-xs transition ${year === y ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                  {y}
                </a>
              ))}
            </div>

            {/* Platform */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-gray-600 w-16">Platform:</span>
              {streamingPlatforms.map(p => (
                <a key={p} href={buildUrl('platform', platform === p ? '' : p)}
                  className={`px-3 py-1 rounded-full text-xs transition ${platform === p ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                  {p}
                </a>
              ))}
              {hasFilters && (
                <a href="/movies"
                  className="px-3 py-1 rounded-full text-xs bg-red-900/40 border border-red-800 text-red-400 hover:bg-red-900 transition">
                  ✕ Clear all
                </a>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Movies Grid */}
      <section className="px-6 py-10">
        <div className="max-w-6xl mx-auto">
          {filteredMovies && filteredMovies.length > 0 ? (
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}
            >
              {filteredMovies.map((movie: any) => (
                <a
                  key={movie.id}
                  href={`/movies/${movie.id}`}
                  className="group bg-gray-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-emerald-500 transition"
                >
                  <div className="aspect-[2/3] bg-gray-800 relative">
                    {movie.poster_url ? (
                      <Image
                        src={movie.poster_url}
                        alt={movie.title}
                        fill
                        sizes="(max-width: 640px) 50vw, 140px"
                        className="object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                        <span className="text-3xl mb-1">🎬</span>
                        <span className="text-xs">No Poster</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {movie.in_cinemas && (
                        <span className="bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                          In Cinemas
                        </span>
                      )}
                      {movie.status === 'Announced' && !movie.in_cinemas && (
                        <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    {movie.nmdb_meter && (
                      <div className="absolute bottom-2 right-2 bg-black/80 text-emerald-400 text-xs font-bold px-1.5 py-0.5 rounded-lg">
                        ⭐ {movie.nmdb_meter}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm truncate group-hover:text-emerald-400 transition">
                      {movie.title}
                    </h3>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-gray-500 text-xs">{movie.release_date?.slice(0, 4)}</p>
                      {movie.release_type && (
                        <p className="text-gray-600 text-xs">{movie.release_type}</p>
                      )}
                    </div>
                    {movie.genre && (
                      <p className="text-gray-600 text-xs mt-1 truncate">
                        {Array.isArray(movie.genre) ? movie.genre.slice(0, 2).join(' · ') : movie.genre}
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 text-gray-500">
              <div className="text-7xl mb-6">🎬</div>
              <h2 className="text-2xl font-bold text-gray-400 mb-3">
                {hasFilters ? 'No films match these filters' : 'No films yet'}
              </h2>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                {hasFilters
                  ? 'Try removing some filters to see more results.'
                  : 'Start adding Nollywood movies to NMDb via the admin panel.'}
              </p>
              {hasFilters ? (
                <a href="/movies" className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-full text-sm font-semibold transition">
                  Clear all filters
                </a>
              ) : (
                <a href="/admin/movie/new" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-full text-sm font-semibold transition">
                  + Add First Film
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-8 mt-12">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-gray-500 text-sm">
          <span>© 2026 NMDb — Nollywood Movie Database</span>
          <span>Built for the industry. Powered by data.</span>
        </div>
      </footer>

    </main>
  )
}
