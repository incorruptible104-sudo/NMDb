import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import { notFound } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: movie } = await supabase
    .from('movies')
    .select('*')
    .eq('id', id)
    .single()

  if (!movie) return { title: 'Film Not Found — NMDb' }

  return {
    title: `${movie.title} (${movie.release_date?.slice(0, 4)}) — NMDb`,
    description: movie.synopsis || `${movie.title} on NMDb — The Nollywood Movie Database`,
    openGraph: {
      title: `${movie.title} — NMDb`,
      description: movie.synopsis || '',
      images: movie.poster_url ? [movie.poster_url] : [],
    },
  }
}

export default async function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: movie } = await supabase
    .from('movies')
    .select('*')
    .eq('id', id)
    .single()

  if (!movie) notFound()

  const { data: platforms } = await supabase
    .from('streaming_platforms')
    .select('*')
    .eq('movie_id', id)

  const { data: boxOffice } = await supabase
    .from('box_office')
    .select('*')
    .eq('movie_id', id)
    .order('week_number', { ascending: true })

  const { data: credits } = await supabase
    .from('movie_credits')
    .select('*, people(*)')
    .eq('movie_id', id)
    .order('billing_order', { ascending: true })

  const totalBoxOffice = boxOffice?.reduce(
    (sum, record) => sum + (record.total_nigeria || 0), 0
  ) || 0

  const directors = credits?.filter((c: any) => c.role_type === 'Director') || []
  const producers = credits?.filter((c: any) => c.role_type === 'Producer') || []
  const actors = credits?.filter((c: any) => c.role_type === 'Actor') || []
  const writers = credits?.filter((c: any) => c.role_type === 'Writer') || []

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: movie.title,
    description: movie.synopsis,
    datePublished: movie.release_date,
    image: movie.poster_url,
    duration: movie.runtime ? `PT${movie.runtime}M` : undefined,
    contentRating: movie.classification,
    genre: Array.isArray(movie.genre) ? movie.genre : [movie.genre],
    productionCompany: movie.production_company ? {
      '@type': 'Organization',
      name: movie.production_company,
    } : undefined,
    director: directors.map((d: any) => ({ '@type': 'Person', name: d.people?.full_name })),
    actor: actors.slice(0, 5).map((a: any) => ({ '@type': 'Person', name: a.people?.full_name })),
    aggregateRating: movie.nmdb_meter ? {
      '@type': 'AggregateRating',
      ratingValue: movie.nmdb_meter,
      bestRating: 100,
      ratingCount: 1,
    } : undefined,
  }

  const classificationColors: Record<string, string> = {
    G: 'bg-green-600',
    PG: 'bg-yellow-600',
    '12': 'bg-orange-500',
    '12A': 'bg-orange-500',
    '15': 'bg-orange-600',
    '18': 'bg-red-600',
    RE: 'bg-red-800',
  }

  const getYouTubeId = (url: string) => {
    return url.split('v=')[1]?.split('&')[0] || url.split('/').pop() || ''
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-gray-950 text-white">

        {/* Navigation */}
        <nav className="border-b border-gray-800 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-8">
              <a href="/" className="text-2xl font-bold text-emerald-500">NMDb</a>
              <div className="hidden md:flex gap-6 text-sm text-gray-400">
                <a href="/movies" className="hover:text-white transition">Movies</a>
                <a href="/people" className="hover:text-white transition">People</a>
                <a href="/box-office" className="hover:text-white transition">Box Office</a>
              </div>
            </div>
            <a href="/movies" className="text-sm text-gray-400 hover:text-white transition">
              ← Back to Movies
            </a>
          </div>
        </nav>

        {/* TOP SECTION: IMDb-style — title block, then poster + trailer */}
        <section className="px-6 pt-8 pb-6 border-b border-gray-800">
          <div className="max-w-5xl mx-auto">

            {/* Title block — left aligned, compact, sits above everything */}
            <div className="mb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl md:text-4xl font-bold">{movie.title}</h1>
                {movie.classification && (
                  <span className={`px-2 py-0.5 rounded text-white text-xs font-bold ${classificationColors[movie.classification] || 'bg-gray-600'}`}>
                    {movie.classification}
                  </span>
                )}
              </div>
              {/* Metadata line — year · runtime · release type · country */}
              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-400">
                {movie.release_date && <span>{new Date(movie.release_date).getFullYear()}</span>}
                {movie.runtime && <><span className="text-gray-700">·</span><span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span></>}
                {movie.release_type && <><span className="text-gray-700">·</span><span className="text-emerald-400">{movie.release_type}</span></>}
                {movie.country && <><span className="text-gray-700">·</span><span>{movie.country}</span></>}
              </div>
              {movie.tagline && (
                <p className="text-gray-400 text-sm mt-1">{movie.tagline}</p>
              )}
            </div>

            {/* Poster LEFT — Trailer RIGHT */}
            <div className="flex flex-col md:flex-row gap-4">

              {/* Poster — 224px wide → 336px tall */}
              <div className="flex-shrink-0 flex flex-col gap-2">
                <div className="w-56 rounded-xl overflow-hidden bg-gray-800 relative shadow-2xl" style={{ aspectRatio: '2/3' }}>
                  {movie.poster_url ? (
                    <Image
                      src={movie.poster_url}
                      alt={movie.title}
                      fill
                      className="object-cover"
                      sizes="224px"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <span className="text-6xl">🎬</span>
                    </div>
                  )}
                </div>
                <a
                  href={`/admin/movie/${movie.id}`}
                  className="block text-center text-xs text-gray-600 hover:text-emerald-400 transition"
                >
                  ✏️ Edit this film
                </a>
              </div>

              {/* Trailer — height matches poster (224px × 3/2 = 336px) */}
              <div className="flex-1">
                {movie.trailer_url ? (
                  <div className="w-full rounded-xl overflow-hidden bg-gray-800" style={{ height: '336px' }}>
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${getYouTubeId(movie.trailer_url)}`}
                      title={`${movie.title} — Official Trailer`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ display: 'block' }}
                    />
                  </div>
                ) : (
                  <div className="w-full rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center" style={{ height: '336px' }}>
                    <p className="text-gray-600 text-sm">No trailer available</p>
                  </div>
                )}
              </div>

            </div>

          </div>
        </section>

        {/* BOTTOM SECTION: Two columns — left (tags/synopsis) + right (production/ratings) */}
        <section className="px-6 py-8">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">

            {/* LEFT COLUMN — Synopsis on top, then Genre + Language + Streaming side by side */}
            <div className="flex-1 flex flex-col gap-5">

              {/* Synopsis — full width */}
              {movie.synopsis && (
                <div>
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Synopsis</h2>
                  <p className="text-gray-300 text-sm leading-relaxed">{movie.synopsis}</p>
                </div>
              )}

              {/* Genre + Language + Streaming — horizontal row */}
              <div className="flex flex-wrap gap-6">

                {/* Genre */}
                {movie.genre && (
                  <div>
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Genre</h2>
                    <div className="flex flex-wrap gap-1.5">
                      {(Array.isArray(movie.genre) ? movie.genre : [movie.genre]).map((g: string) => (
                        <span key={g} className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-xs">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Language */}
                {movie.language && (
                  <div>
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Language</h2>
                    <div className="flex flex-wrap gap-1.5">
                      {(Array.isArray(movie.language) ? movie.language : [movie.language]).map((l: string) => (
                        <span key={l} className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-xs">
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Streaming Platforms */}
                {platforms && platforms.length > 0 && (
                  <div>
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Now Streaming On</h2>
                    <div className="flex flex-wrap gap-1.5">
                      {platforms.map((p: any) => (
                        <span key={p.id} className="bg-gray-800 border border-gray-700 text-white px-3 py-1 rounded-full text-xs font-medium">
                          {p.platform}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>

            </div>

            {/* RIGHT COLUMN — Production info, NMDb Meter, Holiday Blockbuster */}
            <div className="w-full md:w-40 flex-shrink-0 flex flex-col gap-3 text-sm">

              {/* NMDb Meter — compact */}
              {movie.nmdb_meter && (
                <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">NMDb Meter</span>
                  <span className="text-xl font-bold text-emerald-400">{movie.nmdb_meter}</span>
                </div>
              )}

              {/* Holiday Blockbuster — compact */}
              {movie.is_holiday_blockbuster && (
                <div className="bg-gray-900 border border-yellow-800 rounded-lg px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-yellow-500 uppercase tracking-wider">Holiday Blockbuster</span>
                  <span>🎄</span>
                </div>
              )}

              {/* Production details */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex flex-col gap-3">
                {movie.production_company && (
                  <div>
                    <span className="text-gray-500 text-xs uppercase tracking-wider">Production</span>
                    <p className="text-white text-xs mt-1">{movie.production_company}</p>
                  </div>
                )}
                {directors.length > 0 && (
                  <div>
                    <span className="text-gray-500 text-xs uppercase tracking-wider">Director</span>
                    <p className="text-white text-xs mt-1">{directors.map((d: any) => d.people?.full_name).join(', ')}</p>
                  </div>
                )}
                {writers.length > 0 && (
                  <div>
                    <span className="text-gray-500 text-xs uppercase tracking-wider">Writer</span>
                    <p className="text-white text-xs mt-1">{writers.map((w: any) => w.people?.full_name).join(', ')}</p>
                  </div>
                )}
                {movie.classification && (
                  <div>
                    <span className="text-gray-500 text-xs uppercase tracking-wider">NFVCB Rating</span>
                    <p className="text-white text-xs mt-1">{movie.classification}</p>
                  </div>
                )}
              </div>

              <a
               href={`/admin/movie/${movie.id}`}
                className="text-center text-xs text-gray-600 hover:text-emerald-400 transition"
              >
                ✏️ Edit this film
              </a>

            </div>

          </div>
        </section>

        {/* Box Office */}
        {totalBoxOffice > 0 && (
          <section className="px-6 py-10 border-t border-gray-800">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Box Office</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gray-900 rounded-xl p-5">
                  <div className="text-gray-400 text-sm mb-1">Total Nigeria</div>
                  <div className="text-2xl font-bold text-emerald-400">
                    ₦{totalBoxOffice.toLocaleString()}
                  </div>
                </div>
                {boxOffice?.[0]?.opening_weekend && (
                  <div className="bg-gray-900 rounded-xl p-5">
                    <div className="text-gray-400 text-sm mb-1">Opening Weekend</div>
                    <div className="text-2xl font-bold text-white">
                      ₦{boxOffice[0].opening_weekend.toLocaleString()}
                    </div>
                  </div>
                )}
                {boxOffice?.[0]?.total_worldwide && (
                  <div className="bg-gray-900 rounded-xl p-5">
                    <div className="text-gray-400 text-sm mb-1">Worldwide</div>
                    <div className="text-2xl font-bold text-white">
                      ₦{boxOffice[0].total_worldwide.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Cast */}
        {actors.length > 0 && (
          <section className="px-6 py-10 border-t border-gray-800">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Cast</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {actors.map((credit: any) => (
                  <a key={credit.id} href={`/people/${credit.person_id}`} className="group text-center">
                    <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-800 relative mb-2">
                      {credit.people?.photo_url ? (
                        <Image
                          src={credit.people.photo_url}
                          alt={credit.people.full_name}
                          fill
                          className="object-cover group-hover:scale-105 transition"
                          sizes="150px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-3xl">👤</div>
                      )}
                    </div>
                    <p className="text-sm font-medium group-hover:text-emerald-400 transition truncate">
                      {credit.people?.full_name}
                    </p>
                    {credit.character_name && (
                      <p className="text-xs text-gray-500 truncate">{credit.character_name}</p>
                    )}
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Producers */}
        {producers.length > 0 && (
          <section className="px-6 py-10 border-t border-gray-800">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">Producers</h2>
              <div className="flex flex-wrap gap-3">
                {producers.map((credit: any) => (
                  <a
                    key={credit.id}
                    href={`/people/${credit.person_id}`}
                    className="bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-emerald-500 px-4 py-2 rounded-full text-sm transition"
                  >
                    {credit.people?.full_name}
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-gray-800 px-6 py-8 mt-12">
          <div className="max-w-5xl mx-auto flex items-center justify-between text-gray-500 text-sm">
            <span>© 2026 NMDb — Nollywood Movie Database</span>
            <span>Built for the industry. Powered by data.</span>
          </div>
        </footer>

      </main>
    </>
  )
}
