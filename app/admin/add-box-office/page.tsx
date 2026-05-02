'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AddBoxOfficePage() {
  const [movies, setMovies] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    movie_id: '',
    opening_weekend: '',
    total_nigeria: '',
    total_worldwide: '',
    week_number: '1',
    weekly_gross: '',
    source: '',
    verified: false,
    notes: '',
  })

  useEffect(() => {
    supabase
      .from('movies')
      .select('id, title, release_date')
      .order('release_date', { ascending: false })
      .then(({ data }) => setMovies(data || []))
  }, [])

  const handleSubmit = async () => {
    if (!form.movie_id || !form.total_nigeria) {
      setError('Please select a movie and enter the total Nigeria gross.')
      return
    }
    setLoading(true)
    setError('')

    const { error: insertError } = await supabase.from('box_office').insert({
      movie_id: form.movie_id,
      opening_weekend: form.opening_weekend ? parseFloat(form.opening_weekend) : null,
      total_nigeria: parseFloat(form.total_nigeria),
      total_worldwide: form.total_worldwide ? parseFloat(form.total_worldwide) : null,
      week_number: parseInt(form.week_number),
      weekly_gross: form.weekly_gross ? parseFloat(form.weekly_gross) : null,
      source: form.source || null,
      verified: form.verified,
      notes: form.notes || null,
    })

    setLoading(false)
    if (insertError) { setError(insertError.message); return }
    setSuccess(true)
    setForm({ movie_id: '', opening_weekend: '', total_nigeria: '', total_worldwide: '', week_number: '1', weekly_gross: '', source: '', verified: false, notes: '' })
    setTimeout(() => setSuccess(false), 5000)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-2xl font-bold text-emerald-500">NMDb</a>
            <span className="text-gray-600 text-sm">/ Admin / Add Box Office</span>
          </div>
          <a href="/box-office" className="text-sm text-gray-400 hover:text-white transition">View Box Office →</a>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Add Box Office Data</h1>
        <p className="text-gray-400 mb-10">Enter verified box office figures for a Nollywood film.</p>

        {success && <div className="bg-emerald-900/50 border border-emerald-500 text-emerald-300 px-6 py-4 rounded-xl mb-8">✅ Box office data saved successfully!</div>}
        {error && <div className="bg-red-900/50 border border-red-500 text-red-300 px-6 py-4 rounded-xl mb-8">❌ {error}</div>}

        <div className="space-y-6">

          <section className="bg-gray-900 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-emerald-400">Select Film</h2>
            <select
              value={form.movie_id}
              onChange={(e) => setForm({ ...form, movie_id: e.target.value })}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Choose a film...</option>
              {movies.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.release_date?.slice(0, 4)})
                </option>
              ))}
            </select>
          </section>

          <section className="bg-gray-900 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-emerald-400">Box Office Figures (₦)</h2>
            <p className="text-gray-500 text-sm">Enter amounts in full Naira — e.g. 500000000 for ₦500M</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Opening Weekend</label>
                <input type="number" value={form.opening_weekend} onChange={(e) => setForm({ ...form, opening_weekend: e.target.value })} placeholder="e.g. 150000000" className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Total Nigeria Gross <span className="text-red-400">*</span></label>
                <input type="number" value={form.total_nigeria} onChange={(e) => setForm({ ...form, total_nigeria: e.target.value })} placeholder="e.g. 600000000" className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Total Worldwide</label>
                <input type="number" value={form.total_worldwide} onChange={(e) => setForm({ ...form, total_worldwide: e.target.value })} placeholder="If available" className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Weekly Gross</label>
                <input type="number" value={form.weekly_gross} onChange={(e) => setForm({ ...form, weekly_gross: e.target.value })} placeholder="This week's gross" className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Week Number</label>
              <input type="number" value={form.week_number} onChange={(e) => setForm({ ...form, week_number: e.target.value })} min="1" className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </section>

          <section className="bg-gray-900 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-emerald-400">Source & Verification</h2>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Source</label>
              <input type="text" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="e.g. Cinema Exhibitors Association, Variety, Production company" className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any context or caveats about this figure..." rows={3} className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })} className="w-4 h-4 accent-emerald-500" />
              <span className="text-sm text-gray-400">✓ Mark as verified — confirmed from official or multiple credible sources</span>
            </label>
          </section>

          <button onClick={handleSubmit} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:text-emerald-700 text-white font-bold py-4 rounded-2xl text-lg transition">
            {loading ? 'Saving...' : '+ Add Box Office Data'}
          </button>
        </div>
      </div>
    </main>
  )
}
