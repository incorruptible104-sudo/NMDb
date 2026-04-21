import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function Home() {
  const { data: movies } = await supabase
    .from('movies')
    .select('*')
    .limit(8)

  const { count: movieCount } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })

  const { data: boxOffice } = await supabase
    .from('box_office')
    .select('total_nigeria')

  const totalBoxOffice =
    boxOffice?.reduce((sum, record) => sum + (record.total_nigeria || 0), 0) || 0

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Navigation */}
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="text-2xl font-bold text-emerald-500">NMDb</span>
            <div className="hidden md:flex gap-6 text-sm text-gray-400">
              <a href="/movies" className="hover:text-white transition">Movies</a>
              <a href="/people" className="hover:text-white transition">People</a>
              <a href="/box-office" className="hover:text-white transition">Box Office</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search NMDb..."
              className="bg-gray-800 text-sm px-4 py-2 rounded-full text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-48"
            />
            <button className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-4 py-2 rounded-full transition">
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            The <span className="text-emerald-500">Nollywood</span> Movie Database
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            The definitive record of every professional Nollywood production — ratings, box office, cast, and more.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/movies"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-full font-semibold transition"
            >
              Browse Movies
            </a>
            <a
              href="/box-office"
              className="border border-gray-600 hover:border-emerald-500 text-gray-300 hover:text-white px-8 py-3 rounded-full font-semibold transition"
            >
              Box Office
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-8 border-y border-gray-800">
        <div className="max-w-7xl mx-auto grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-emerald-500">{movieCount || 0}</div>
            <div className="text-gray-400 text-sm mt-1">Films Catalogued</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-emerald-500">
              &#8358;{(totalBoxOffice / 1_000_000_000).toFixed(1)}B
            </div>
            <div className="text-gray-400 text-sm mt-1">Total Box Office</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-emerald-500">2019</div>
            <div className="text-gray-400 text-sm mt-1">Coverage From</div>
          </div>
        </div>
      </section>

      {/* Featured Movies */}
      <section className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Featured Films</h2>
          {movies && movies.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {movies.map((movie) => (
                <a
                  key={movie.id}
                  href={`/movies/${movie.id}`}
                  className="group bg-gray-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-emerald-500 transition"
                >
                  <div className="aspect-[2/3] bg-gray-800 relative">
                    {movie.poster_url ? (
                      <img
                        src={movie.poster_url}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">
                        No Poster
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm truncate">{movie.title}</h3>
                    <p className="text-gray-400 text-xs mt-1">
                      {movie.release_date?.slice(0, 4)}
                    </p>
                    {movie.nmdb_meter && (
                      <div className="mt-2 text-xs text-emerald-400 font-bold">
                        &#11088; {movie.nmdb_meter}
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">
              <div className="text-6xl mb-4">&#127916;</div>
              <p className="text-xl">No films yet. Start adding Nollywood movies to NMDb.</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-8 mt-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-gray-500 text-sm">
          <span>&#169; 2026 NMDb &#8212; Nollywood Movie Database</span>
          <span>Built for the industry. Powered by data.</span>
        </div>
      </footer>

    </main>
  )
}
