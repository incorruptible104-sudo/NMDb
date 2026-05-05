import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q?.trim() || ''

  const [moviesRes, peopleRes, blogRes] = query.length >= 2
    ? await Promise.all([
        supabase
          .from('movies')
          .select('id, title, release_date, poster_url, content_type, nmdb_meter, genre')
          .ilike('title', `%${query}%`)
          .limit(20),
        supabase
          .from('people')
          .select('id, full_name, stage_name, photo_url, primary_role, nationality')
          .ilike('full_name', `%${query}%`)
          .limit(12),
        supabase
          .from('blog_posts')
          .select('id, title, slug, cover_image_url, excerpt, created_at, author')
          .eq('published', true)
          .ilike('title', `%${query}%`)
          .limit(6),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }]

  const movies = moviesRes.data || []
  const people = peopleRes.data || []
  const posts = blogRes.data || []
  const total = movies.length + people.length + posts.length

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Navigation */}
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="/" className="text-2xl font-bold text-emerald-500">NMDb</a>
            <div className="hidden md:flex gap-6 text-sm text-gray-400">
              <a href="/movies" className="hover:text-white transition">Movies</a>
              <a href="/people" className="hover:text-white transition">People</a>
              <a href="/box-office" className="hover:text-white transition">Box Office</a>
              <a href="/blog" className="hover:text-white transition">Blog</a>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Search header */}
        <div className="mb-10">
          <form action="/search" method="GET">
            <div className="flex gap-3">
              <input
                name="q"
                defaultValue={query}
                placeholder="Search movies, people, articles..."
                className="flex-1 bg-gray-900 text-white px-6 py-4 rounded-2xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg"
                autoFocus
              />
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-semibold transition">
                Search
              </button>
            </div>
          </form>

          {query.length >= 2 && (
            <p className="text-gray-400 mt-4">
              {total > 0
                ? <>{total} result{total !== 1 ? 's' : ''} for <span className="text-white font-semibold">"{query}"</span></>
                : <>No results found for <span className="text-white font-semibold">"{query}"</span></>
              }
            </p>
          )}
        </div>

        {query.length < 2 ? (
          <div className="text-center py-20 text-gray-600">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-lg">Start typing to search NMDb</p>
            <p className="text-sm mt-2">Search across movies, people and articles</p>
          </div>
        ) : total === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <div className="text-6xl mb-4">😕</div>
            <p className="text-lg text-gray-400">No results for "{query}"</p>
            <p className="text-sm mt-2">Try a different spelling or fewer words</p>
          </div>
        ) : (
          <div className="space-y-12">

            {/* Movies */}
            {movies.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
                  🎬 Films
                  <span className="text-gray-500 text-sm font-normal">({movies.length})</span>
                </h2>
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
                  {movies.map((movie: any) => (
                    <a key={movie.id} href={`/movies/${movie.id}`} className="group">
                      <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 relative mb-2">
                        {movie.poster_url ? (
                          <Image
                            src={movie.poster_url}
                            alt={movie.title}
                            fill
                            sizes="130px"
                            className="object-cover group-hover:scale-105 transition duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600 text-3xl">🎬</div>
                        )}
                        {movie.nmdb_meter && (
                          <div className="absolute bottom-1 right-1 bg-black/80 text-emerald-400 text-xs font-bold px-1.5 py-0.5 rounded">
                            ⭐ {movie.nmdb_meter}
                          </div>
                        )}
                        {movie.content_type === 'Series' && (
                          <div className="absolute top-2 left-2">
                            <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">Series</span>
                          </div>
                        )}
                      </div>
                      <h3 className="text-sm font-medium truncate group-hover:text-emerald-400 transition">{movie.title}</h3>
                      <p className="text-gray-500 text-xs">{movie.release_date?.slice(0, 4)}</p>
                      {movie.genre && (
                        <p className="text-gray-600 text-xs truncate">
                          {Array.isArray(movie.genre) ? movie.genre.slice(0, 2).join(' · ') : movie.genre}
                        </p>
                      )}
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* People */}
            {people.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
                  👤 People
                  <span className="text-gray-500 text-sm font-normal">({people.length})</span>
                </h2>
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))' }}>
                  {people.map((person: any) => (
                    <a key={person.id} href={`/people/${person.id}`} className="group text-center">
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
                      <h3 className="text-xs font-medium truncate group-hover:text-emerald-400 transition">
                        {person.stage_name || person.full_name}
                      </h3>
                      <p className="text-gray-500 text-xs">{person.primary_role}</p>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Blog posts */}
            {posts.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
                  📰 Articles
                  <span className="text-gray-500 text-sm font-normal">({posts.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {posts.map((post: any) => (
                    <a key={post.id} href={`/blog/${post.slug}`}
                      className="group bg-gray-900 rounded-2xl overflow-hidden hover:ring-2 hover:ring-emerald-500 transition">
                      <div className="aspect-video bg-gray-800 relative">
                        {post.cover_image_url ? (
                          <Image
                            src={post.cover_image_url}
                            alt={post.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover group-hover:scale-105 transition duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600 text-4xl">📰</div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-sm leading-snug group-hover:text-emerald-400 transition mb-1">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-gray-500 text-xs line-clamp-2">{post.excerpt}</p>
                        )}
                        <p className="text-gray-600 text-xs mt-2">
                          {post.author} · {new Date(post.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}
      </div>

      <footer className="border-t border-gray-800 px-6 py-8 mt-12">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-gray-500 text-sm">
          <span>© 2026 NMDb — Nollywood Movie Database</span>
          <span>Built for the industry. Powered by data.</span>
        </div>
      </footer>
    </main>
  )
}
