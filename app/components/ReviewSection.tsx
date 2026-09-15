'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'

type Review = {
  id: string
  user_id: string
  rating: number
  review_text: string | null
  created_at: string
}

export default function ReviewSection({ movieId }: { movieId: string }) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [userId, setUserId] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  const [reviews, setReviews] = useState<Review[]>([])
  const [myReview, setMyReview] = useState<Review | null>(null)

  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)

  const loadReviews = useCallback(async () => {
    const { data } = await supabase
      .from('reviews')
      .select('id, user_id, rating, review_text, created_at')
      .eq('movie_id', movieId)
      .order('created_at', { ascending: false })
    setReviews(data || [])
  }, [movieId, supabase])

  useEffect(() => {
    loadReviews()
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id ?? null
      setUserId(uid)
      setChecking(false)
    })
  }, [loadReviews, supabase])

  useEffect(() => {
    if (!userId) {
      setMyReview(null)
      return
    }
    const mine = reviews.find(r => r.user_id === userId) || null
    setMyReview(mine)
    if (mine) {
      setRating(mine.rating)
      setReviewText(mine.review_text || '')
    }
  }, [userId, reviews])

  async function handleSubmit() {
    if (!userId || rating < 1) return
    setSaving(true)
    await supabase.from('reviews').upsert(
      {
        user_id: userId,
        movie_id: movieId,
        rating,
        review_text: reviewText.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,movie_id' }
    )
    setSaving(false)
    setEditing(false)
    loadReviews()
  }

  async function handleDelete() {
    if (!userId) return
    setSaving(true)
    await supabase.from('reviews').delete().eq('user_id', userId).eq('movie_id', movieId)
    setSaving(false)
    setEditing(false)
    setRating(0)
    setReviewText('')
    loadReviews()
  }

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)
    : null

  return (
    <section className="px-6 py-10 border-t border-gray-800">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <h2 className="text-2xl font-bold">Ratings &amp; Reviews</h2>
          {avgRating !== null && (
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 text-2xl font-bold">{avgRating.toFixed(1)}</span>
              <span className="text-gray-500 text-sm">/ 10 · {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Write / edit a review */}
        {!checking && (
          userId ? (
            (myReview && !editing) ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-400">Your rating</p>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(true)} className="text-xs text-emerald-400 hover:text-emerald-300 transition">Edit</button>
                    <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-300 transition">Delete</button>
                  </div>
                </div>
                <p className="text-white text-xl font-bold mb-1">{myReview.rating}/10</p>
                {myReview.review_text && <p className="text-gray-300 text-sm">{myReview.review_text}</p>}
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8">
                <p className="text-sm text-gray-400 mb-3">Rate this film</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      onClick={() => setRating(n)}
                      className={`w-9 h-9 rounded-lg text-sm font-semibold transition ${
                        n <= rating
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  placeholder="Share your thoughts (optional)"
                  rows={3}
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition resize-none mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSubmit}
                    disabled={rating < 1 || saving}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
                  >
                    {saving ? 'Saving…' : myReview ? 'Update Review' : 'Submit Review'}
                  </button>
                  {editing && (
                    <button
                      onClick={() => { setEditing(false); setRating(myReview?.rating || 0); setReviewText(myReview?.review_text || '') }}
                      className="text-sm text-gray-400 hover:text-white px-4 py-2 transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8 text-center">
              <p className="text-gray-400 text-sm">
                <a href={`/auth/signin?redirectTo=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/')}`} className="text-emerald-400 hover:text-emerald-300 transition font-medium">
                  Sign in
                </a>{' '}
                to rate and review this film.
              </p>
            </div>
          )
        )}

        {/* All reviews */}
        {reviews.filter(r => r.review_text).length > 0 ? (
          <div className="flex flex-col gap-4">
            {reviews.filter(r => r.review_text).map(r => (
              <div key={r.id} className="border-b border-gray-800 pb-4 last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-emerald-600/10 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded">
                    {r.rating}/10
                  </span>
                  <span className="text-gray-600 text-xs">
                    {new Date(r.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <p className="text-gray-300 text-sm">{r.review_text}</p>
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-gray-600 text-sm">No ratings yet. Be the first to rate this film.</p>
        ) : null}
      </div>
    </section>
  )
}
