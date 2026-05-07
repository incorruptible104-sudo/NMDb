import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import HeroSlideshow from '@/app/components/HeroSlideshow'
import SearchBar from '@/app/components/SearchBar'
import BoxOfficeScroll from '@/app/components/BoxOfficeScroll'
import StreamingSlideshow from '@/app/components/StreamingSlideshow'
import FeaturedFilmsCarousel from '@/app/components/FeaturedFilmsCarousel'
import Navbar from '@/app/components/Navbar'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function Home() {
  const [
    { data: latestPosts },
    { data: nowStreaming },
    { data: inCinemas },
    { data: boxOfficeRecords },
    { data: comingSoon },
    { data: featuredMovies },
    { data: popularActors },
    { data: series },
    { data: latestTrailers },
  ] = await Promise.all([
    // Blog posts for hero
    supabase.from('blog_posts').select('id, title, slug, excerpt, cover_image_url, author, created_at')
      .eq('published', true).order('created_at', { ascending: false }).limit(5),

    // Now streaming — for hero sidebar
    supabase.from('streaming_platforms')
      .select('platform, movies(id, title, poster_url, nmdb_meter, release_date)')
      .order('available_from', { ascending: false }).limit(6),

    // In cinemas with box office
    supabase.from('movies')
      .select('id, title, poster_url, release_date, nmdb_meter, content_type')
      .eq('in_cinemas', true)
      .eq('content_type', 'Movie')
      .order('release_date', { ascending: false }).limit(6),

    // Box office — in-cinemas movies with their highest total_nigeria, sorted highest first
    supabase.from('box_office')
      .select('movie_id, total_nigeria, movies!inner(id, title, poster_url, release_date, in_cinemas)')
      .eq('movies.in_cinemas', true)
      .not('total_nigeria', 'is', null)
      .order('total_nigeria', { ascending: false }),

    // Coming soon
    supabase.from('movies')
      .select('id, title, poster_url, release_date, genre, content_type')
      .eq('status', 'Announced')
      .order('release_date', { ascending: true }).limit(6),

    // Featured movies
    supabase.from('movies')
      .select('id, title, poster_url, release_date, nmdb_meter, genre, content_type')
.eq('content_type', 'Movie')
.not('poster_url', 'is', null)
      .order('nmdb_meter', { ascending: false }).limit(7),

    // Popular actors — sorted by number of credits (most filmography first)
    supabase.from('people')
      .select('id, full_name, stage_name, photo_url, primary_role, movie_credits(count)')
      .eq('primary_role', 'Actor')
      .not('photo_url', 'is', null)
      .order('full_name').limit(100),

    // TV/Web Series
    supabase.from('movies')
      .select('id, title, poster_url, release_date, nmdb_meter, genre')
      .eq('content_type', 'Series')
      .order('release_date', { ascending: false }).limit(5),

    // Latest trailers for hero middle panel
    supabase.from('movies')
      .select('id, title, poster_url, release_date, trailer_url')
      .not('trailer_url', 'is', null)
      .order('release_date', { ascending: false }).limit(5),
  ])

  // Sort actors by number of credits (most filmography first), show top 8
  const sortedActors = (popularActors || [])
    .map((p: any) => ({
      ...p,
      creditCount: p.movie_credits?.[0]?.count || 0,
    }))
    .sort((a: any, b: any) => b.creditCount - a.creditCount)
    .slice(0, 8)

  // Deduplicate — one row per movie, keep highest total_nigeria
  const movieMap = new Map()
  boxOfficeRecords?.forEach((r: any) => {
    const mid = r.movies?.id
    if (!mid) return
    const ex = movieMap.get(mid)
    if (!ex || (r.total_nigeria || 0) > (ex.total_nigeria || 0)) {
      movieMap.set(mid, r)
    }
  })

  // Sort by total_nigeria highest to lowest
  const topBoxOffice = Array.from(movieMap.values())
    .sort((a, b) => (b.total_nigeria || 0) - (a.total_nigeria || 0))

  const daysInCinemas = (releaseDate: string) => {
    if (!releaseDate) return null
    const diff = Date.now() - new Date(releaseDate).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    return days >= 0 ? days : null
  }

  const formatNaira = (n: number) => {
    if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`
    if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`
    return `₦${n.toLocaleString()}`
  }

  // Get box office for a specific movie
  const getBoxOffice = (movieId: string) => {
    return movieMap.get(movieId)?.total_nigeria || null
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Navigation */}
      <Navbar />

      {/* ============================================
          HERO: Blog Slideshow + Now Streaming Slideshow
          ============================================ */}
      <section className="border-b border-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <HeroSlideshow
            posts={latestPosts || []}
            streaming={nowStreaming || []}
            trailers={latestTrailers || []}
          />
        </div>
      </section>

      {/* ============================================
          MAIN BODY: Two Column Layout
          ============================================ */}
      {/* ============================================
          ROW 1: Now In Cinemas (left) + Box Office (right)
          ============================================ */}
      <section className="py-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-8 items-stretch" style={{ minHeight: 0 }}>

            {/* LEFT: Now In Cinemas */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">🎬 Now In Cinemas</h2>
                <a href="/movies?in_cinemas=true" className="text-emerald-400 text-sm hover:text-emerald-300 transition">View all →</a>
              </div>
              {inCinemas && inCinemas.length > 0 ? (
                <>
                  {/* Mobile: 3-col grid, 6 movies (2 rows) */}
                  <div className="grid grid-cols-3 gap-3 md:hidden">
                    {inCinemas.slice(0, 6).map((movie: any) => {
                      const bo = getBoxOffice(movie.id)
                      return (
                        <a key={movie.id} href={`/movies/${movie.id}`} className="group">
                          <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 relative mb-2">
                            {movie.poster_url ? (
                              <Image src={movie.poster_url} alt={movie.title} fill sizes="110px" className="object-cover group-hover:scale-105 transition duration-300" loading="lazy" />
                            ) : <div className="w-full h-full flex items-center justify-center text-gray-600">🎬</div>}
                            <div className="absolute top-1 left-1">
                              <span className="bg-emerald-600 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">In Cinemas</span>
                            </div>
                            {bo && (
                              <div className="absolute bottom-1 left-0 right-0 px-1">
                                <div className="bg-black/80 text-emerald-400 text-xs font-bold px-1.5 py-0.5 rounded text-center">{formatNaira(bo)}</div>
                              </div>
                            )}
                          </div>
                          <h3 className="text-xs font-medium truncate group-hover:text-emerald-400 transition">{movie.title}</h3>
                          <p className="text-gray-500 text-xs">{movie.release_date?.slice(0, 4)}</p>
                        </a>
                      )
                    })}
                  </div>
                  {/* Desktop: original horizontal scroll / 5-col grid */}
                  <div className="hidden md:flex md:grid gap-3 md:grid-cols-5">
                    {inCinemas.slice(0, 5).map((movie: any) => {
                      const bo = getBoxOffice(movie.id)
                      return (
                        <a key={movie.id} href={`/movies/${movie.id}`} className="group flex-shrink-0 w-36 md:w-auto">
                          <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 relative mb-2">
                            {movie.poster_url ? (
                              <Image src={movie.poster_url} alt={movie.title} fill sizes="(max-width: 768px) 144px, 140px" className="object-cover group-hover:scale-105 transition duration-300" loading="lazy" />
                            ) : <div className="w-full h-full flex items-center justify-center text-gray-600">🎬</div>}
                            <div className="absolute top-2 left-2">
                              <span className="bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">In Cinemas</span>
                            </div>
                            {bo && (
                              <div className="absolute bottom-2 left-0 right-0 px-2">
                                <div className="bg-black/80 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded text-center">{formatNaira(bo)}</div>
                              </div>
                            )}
                          </div>
                          <h3 className="text-xs font-medium truncate group-hover:text-emerald-400 transition">{movie.title}</h3>
                          <p className="text-gray-500 text-xs">{movie.release_date?.slice(0, 4)}</p>
                        </a>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="bg-gray-900 rounded-xl p-6 text-center text-gray-600 text-sm">
                  No films currently in cinemas.<br />
                  <a href="/admin/movie/new" className="text-emerald-400 hover:underline mt-1 block">Add one →</a>
                </div>
              )}
            </div>

            {/* RIGHT: Box Office */}
            <div className="w-full md:w-72 md:flex-shrink-0 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">💰 Box Office</h2>
                <a href="/box-office" className="text-emerald-400 text-sm hover:text-emerald-300 transition">See all →</a>
              </div>
              {topBoxOffice.length > 0 ? (
                <div className="flex flex-col">
                  <BoxOfficeScroll records={topBoxOffice} />
                  <a href="/box-office" className="block text-center text-emerald-400 text-xs hover:text-emerald-300 transition py-2.5 bg-gray-900 rounded-xl hover:bg-gray-800 mt-2">
                    View full Box Office →
                  </a>
                </div>
              ) : (
                <div className="bg-gray-900 rounded-xl p-6 text-center text-gray-600 text-sm">No box office data yet.</div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ============================================
          ROW 2: Coming Soon (left) + Streaming (right)
          ============================================ */}
      <section className="py-10 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-8 items-stretch" style={{ minHeight: 0 }}>

            {/* LEFT: Coming Soon */}
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">🔜 Coming Soon</h2>
                <a href="/movies?status=Announced" className="text-emerald-400 text-sm hover:text-emerald-300 transition">View all →</a>
              </div>
              {comingSoon && comingSoon.length > 0 ? (
                <>
                  {/* Mobile: 3-col grid, 6 movies (2 rows) */}
                  <div className="grid grid-cols-3 gap-3 md:hidden">
                    {comingSoon.slice(0, 6).map((movie: any) => (
                      <a key={movie.id} href={`/movies/${movie.id}`} className="group">
                        <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 relative mb-2">
                          {movie.poster_url ? (
                            <Image src={movie.poster_url} alt={movie.title} fill sizes="110px" className="object-cover group-hover:scale-105 transition duration-300" loading="lazy" />
                          ) : <div className="w-full h-full flex items-center justify-center text-gray-600">🎬</div>}
                        </div>
                        <h3 className="text-xs font-medium truncate group-hover:text-emerald-400 transition">{movie.title}</h3>
                        {movie.release_date && <p className="text-gray-600 text-xs">{new Date(movie.release_date).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })}</p>}
                      </a>
                    ))}
                  </div>
                  {/* Desktop: original 5-col grid */}
                  <div className="hidden md:grid gap-3 md:grid-cols-5">
                    {comingSoon.slice(0, 5).map((movie: any) => (
                      <a key={movie.id} href={`/movies/${movie.id}`} className="group flex-shrink-0 w-36 md:w-auto">
                        <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 relative mb-2">
                          {movie.poster_url ? (
                            <Image src={movie.poster_url} alt={movie.title} fill sizes="(max-width: 768px) 144px, 140px" className="object-cover group-hover:scale-105 transition duration-300" loading="lazy" />
                          ) : <div className="w-full h-full flex items-center justify-center text-gray-600">🎬</div>}
                        </div>
                        <h3 className="text-xs font-medium truncate group-hover:text-emerald-400 transition">{movie.title}</h3>
                        {movie.release_date && <p className="text-gray-600 text-xs">{new Date(movie.release_date).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })}</p>}
                      </a>
                    ))}
                  </div>
                </>
              ) : (
                <div className="bg-gray-900 rounded-xl p-6 text-center text-gray-600 text-sm flex-1">No upcoming films yet.</div>
              )}
            </div>

            {/* RIGHT: Now Streaming slideshow */}
            <div className="w-full md:w-72 md:flex-shrink-0 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">📺 Now Streaming</h2>
                <a href="/movies" className="text-emerald-400 text-sm hover:text-emerald-300 transition">View all →</a>
              </div>
              <StreamingSlideshow records={nowStreaming || []} />
            </div>

          </div>
        </div>
      </section>

      {/* ============================================
          FULL WIDTH SECTIONS
          ============================================ */}

      {/* Featured Movies */}
      {featuredMovies && featuredMovies.filter((m: any) => m.poster_url).length > 0 && (
        <section className="py-10 border-t border-gray-800">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">⭐ Featured Films</h2>
              <a href="/movies" className="text-emerald-400 text-sm hover:text-emerald-300 transition">View all →</a>
            </div>
            <FeaturedFilmsCarousel movies={featuredMovies.filter((m: any) => m.poster_url)} />
          </div>
        </section>
      )}

      {/* Most Popular Actors */}
      {sortedActors && sortedActors.length > 0 && (
        <section className="py-10 border-t border-gray-800">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">🎭 Popular Actors</h2>
              <a href="/people" className="text-emerald-400 text-sm hover:text-emerald-300 transition">View all →</a>
            </div>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))' }}>
              {sortedActors.map((person: any) => (
                <a key={person.id} href={`/people/${person.id}`} className="group text-center">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-gray-800 relative mb-2">
                    {person.photo_url ? (
                      <Image src={person.photo_url} alt={person.full_name} fill sizes="110px" className="object-cover group-hover:scale-105 transition duration-300" loading="lazy" />
                    ) : <div className="w-full h-full flex items-center justify-center text-gray-600 text-3xl">👤</div>}
                  </div>
                  <h3 className="text-xs font-medium truncate group-hover:text-emerald-400 transition">{person.stage_name || person.full_name}</h3>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TV/Web Series */}
      {series && series.length > 0 && (
        <section className="py-10 border-t border-gray-800">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">📺 TV & Web Series</h2>
              <a href="/movies?type=Series" className="text-emerald-400 text-sm hover:text-emerald-300 transition">View all →</a>
            </div>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
              {series.map((show: any) => (
                <a key={show.id} href={`/movies/${show.id}`} className="group">
                  <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 relative mb-2">
                    {show.poster_url ? (
                      <Image src={show.poster_url} alt={show.title} fill sizes="130px" className="object-cover group-hover:scale-105 transition duration-300" loading="lazy" />
                    ) : <div className="w-full h-full flex items-center justify-center text-gray-600">📺</div>}
                    <div className="absolute top-2 left-2">
                      <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">Series</span>
                    </div>
                    {show.nmdb_meter && (
                      <div className="absolute bottom-1 right-1 bg-black/80 text-emerald-400 text-xs font-bold px-1.5 py-0.5 rounded">⭐ {show.nmdb_meter}</div>
                    )}
                  </div>
                  <h3 className="text-sm font-medium truncate group-hover:text-emerald-400 transition">{show.title}</h3>
                  <p className="text-gray-500 text-xs">{show.release_date?.slice(0, 4)}</p>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-8 mt-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-gray-500 text-sm">
          <span>© 2026 NMDb — Nollywood Movie Database</span>
          <span>Built for the industry. Powered by data.</span>
        </div>
      </footer>

    </main>
  )
}
