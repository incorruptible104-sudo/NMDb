'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function WatchlistButton({ movieId }: { movieId: string }) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [userId, setUserId] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  const [onWatchlist, setOnWatchlist] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user?.id ?? null
      setUserId(uid)
      if (uid) {
        const { data: row } = await supabase
          .from('watchlist')
          .select('id')
          .eq('user_id', uid)
          .eq('movie_id', movieId)
          .maybeSingle()
        setOnWatchlist(!!row)
      }
      setChecking(false)
    })
  }, [movieId, supabase])

  async function toggleWatchlist() {
    if (!userId) {
      window.location.href = `/auth/signin?redirectTo=${encodeURIComponent(window.location.pathname)}`
      return
    }
    setLoading(true)
    if (onWatchlist) {
      await supabase.from('watchlist').delete().eq('user_id', userId).eq('movie_id', movieId)
      setOnWatchlist(false)
    } else {
      await supabase.from('watchlist').insert({ user_id: userId, movie_id: movieId })
      setOnWatchlist(true)
    }
    setLoading(false)
  }

  if (checking) {
    return (
      <div className="h-9 w-full rounded-lg bg-gray-900 border border-gray-800 animate-pulse" />
    )
  }

  return (
    <button
      onClick={toggleWatchlist}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border transition disabled:opacity-50 ${
        onWatchlist
          ? 'bg-emerald-600/10 border-emerald-600 text-emerald-400 hover:bg-emerald-600/20'
          : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-emerald-500 hover:text-emerald-400'
      }`}
    >
      <span>{onWatchlist ? '✓' : '+'}</span>
      {onWatchlist ? 'On Watchlist' : 'Add to Watchlist'}
    </button>
  )
}
