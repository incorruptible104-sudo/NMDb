'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createBrowserClient } from '@supabase/ssr'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'

type WatchlistMovie = {
  id: string
  title: string
  poster_url: string | null
  release_date: string | null
  nmdb_meter: number | null
}

export default function WatchlistPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [checking, setChecking] = useState(true)
  const [signedIn, setSignedIn] = useState(false)
  const [movies, setMovies] = useState<WatchlistMovie[]>([])
  const [loadingMovies, setLoadingMovies] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user?.id ?? null
      setSignedIn(!!uid)
      setChecking(false)

      if (uid) {
        const { data: rows } = await supabase
          .from('watchlist')
          .select('movie_id, created_at, movies(id, title, poster_url, release_date, nmdb_meter)')
          .eq('user_id', uid)
          .order('created_at', { ascending: false })

        const list = (rows || [])
          .map((r: any) => r.movies)
          .filter(Boolean)
        setMovies(list)
      }
      setLoadingMovies(false)
    })
  }, [supabase])

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <section className="px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">My Watchlist</h1>

          {checking || loadingMovies ? (
            <p className="text-gray-500 text-sm">Loading…</p>
          ) : !signedIn ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <p className="text-gray-400 mb-4">Sign in to see movies you've saved.</p>
              <a
                href="/auth/signin?redirectTo=/watchlist"
                className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
              >
                Sign In
              </a>
            </div>
          ) : movies.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <p className="text-gray-400 mb-4">Your watchlist is empty.</p>
              <a href="/movies" className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition">
                Browse movies →
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {movies.map(movie => (
                <a key={movie.id} href={`/movies/${movie.id}`} className="group">
                  <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 relative mb-2">
                    {movie.poster_url ? (
                      <Image
                        src={movie.poster_url}
                        alt={movie.title}
                        fill
                        sizes="(max-width: 768px) 45vw, 200px"
                        className="object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">🎬</div>
                    )}
                  </div>
                  <h3 className="text-sm font-medium truncate group-hover:text-emerald-400 transition">{movie.title}</h3>
                  {movie.release_date && (
                    <p className="text-gray-600 text-xs">{new Date(movie.release_date).getFullYear()}</p>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
