import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// The VHS/VCD era this page covers. Adjust here if you want to widen or
// narrow the range later -- everything else on the page reads from these.
const ERA_START_YEAR = 1990
const ERA_END_YEAR = 2009
const VHS_VCD_CUTOFF_YEAR = 2000 // films before this are tagged "VHS", on/after are "VCD"

const PAGE_SIZE = 24

export default async function OldNollywoodPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; decade?: string }>
}) {
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page || '1', 10) || 1)
  const decadeFilter = params.decade === '1990s' || params.decade === '2000s' ? params.decade : 'all'

  let rangeStart = `${ERA_START_YEAR}-01-01`
  let rangeEnd = `${ERA_END_YEAR}-12-31`
  if (decadeFilter === '1990s') {
    rangeStart = '1990-01-01'
    rangeEnd = '1999-12-31'
  } else if (decadeFilter === '2000s') {
    rangeStart = '2000-01-01'
    rangeEnd = '2009-12-31'
  }

  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data: movies, count } = await supabase
    .from('movies')
    .select('id, title, poster_url, release_date, genre, nmdb_meter, content_type', { count: 'exact' })
    .eq('content_type', 'Movie')
    .gte('release_date', rangeStart)
    .lte('release_date', rangeEnd)
    .order('release_date', { ascending: true })
    .range(from, to)

  const totalCount = count || 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const formatYear = (releaseDate: string | null) => releaseDate?.slice(0, 4) || null

  const eraTag = (releaseDate: string | null) => {
    const year = releaseDate ? parseInt(releaseDate.slice(0, 4), 10) : null
    if (!year) return null
    return year < VHS_VCD_CUTOFF_YEAR ? 'VHS' : 'VCD'
  }

  const pageHref = (targetPage: number) => {
    const query = new URLSearchParams()
    if (decadeFilter !== 'all') query.set('decade', decadeFilter)
    if (targetPage > 1) query.set('page', String(targetPage))
    const qs = query.toString()
    return `/old-nollywood${qs ? `?${qs}` : ''}`
  }

  const decadeHref = (targetDecade: 'all' | '1990s' | '2000s') => {
    const query = new URLSearchParams()
    if (targetDecade !== 'all') query.set('decade', targetDecade)
    const qs = query.toString()
    return `/old-nollywood${qs ? `?${qs}` : ''}`
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      {/* ============================================
          HERO
          ============================================ */}
      <section className="relative border-b border-gray-800 overflow-hidden">
        {/* subtle scanline texture -- evokes the format without being kitsch */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)',
          }}
        />
        <div className="max-w-6xl mx-auto px-6 py-14 relative">
          <p className="text-amber-400 text-sm font-medium mb-3 tracking-wide">
            {ERA_START_YEAR}&ndash;{ERA_END_YEAR}
          </p>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 max-w-2xl leading-tight">
            Old Nollywood
          </h1>
          <p className="text-gray-400 max-w-xl leading-relaxed">
            The films that started it all &mdash; shot straight to VHS and VCD before
            Nigerian cinema ever saw a projector. {totalCount.toLocaleString()} titles
            from this era, so far.
          </p>
        </div>
      </section>

      {/* ============================================
          DECADE FILTER
          ============================================ */}
      <section className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex gap-2">
          {(['all', '1990s', '2000s'] as const).map((d) => (
            <a
              key={d}
              href={decadeHref(d)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                decadeFilter === d
                  ? 'bg-amber-400 text-gray-950'
                  : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {d === 'all' ? 'All years' : d}
            </a>
          ))}
        </div>
      </section>

      {/* ============================================
          GRID
          ============================================ */}
      <section className="py-10">
        <div className="max-w-6xl mx-auto px-6">
          {movies && movies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {movies.map((movie: any) => (
                <a key={movie.id} href={`/movies/${movie.id}`} className="group">
                  <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 relative mb-2">
                    {movie.poster_url ? (
                      <Image
                        src={movie.poster_url}
                        alt={movie.title}
                        fill
                        sizes="(max-width: 768px) 150px, 180px"
                        className="object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 text-2xl">
                        📼
                      </div>
                    )}
                    {eraTag(movie.release_date) && (
                      <div className="absolute top-2 left-2 bg-black/80 text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide">
                        {eraTag(movie.release_date)}
                      </div>
                    )}
                    {movie.nmdb_meter && (
                      <div className="absolute bottom-2 right-2 bg-black/80 text-emerald-400 text-xs font-bold px-1.5 py-0.5 rounded">
                        ⭐ {movie.nmdb_meter}
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-medium truncate group-hover:text-amber-400 transition">
                    {movie.title}
                  </h3>
                  <p className="text-gray-500 text-xs">{formatYear(movie.release_date)}</p>
                </a>
              ))}
            </div>
          ) : (
            <div className="bg-gray-900 rounded-xl p-10 text-center text-gray-500">
              No titles found for this filter yet.
            </div>
          )}

          {/* ============================================
              PAGINATION
              ============================================ */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <a
                href={pageHref(Math.max(1, currentPage - 1))}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  currentPage === 1
                    ? 'text-gray-700 pointer-events-none'
                    : 'text-gray-300 hover:text-white bg-gray-900 hover:bg-gray-800'
                }`}
              >
                ← Prev
              </a>
              <span className="text-gray-500 text-sm px-2">
                Page {currentPage} of {totalPages}
              </span>
              <a
                href={pageHref(Math.min(totalPages, currentPage + 1))}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  currentPage === totalPages
                    ? 'text-gray-700 pointer-events-none'
                    : 'text-gray-300 hover:text-white bg-gray-900 hover:bg-gray-800'
                }`}
              >
                Next →
              </a>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
