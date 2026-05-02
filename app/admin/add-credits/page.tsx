'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { ALL_ROLES } from '@/lib/constants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AddCreditsPage() {
  const [movies, setMovies] = useState<any[]>([])
  const [people, setPeople] = useState<any[]>([])
  const [existingCredits, setExistingCredits] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [searchPeople, setSearchPeople] = useState('')
  const [selectedPerson, setSelectedPerson] = useState<any>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState({
    movie_id: '',
    role_type: '',
    character_name: '',
    billing_order: '1',
  })

  useEffect(() => {
    Promise.all([
      supabase.from('movies').select('id, title, release_date').order('release_date', { ascending: false }),
      supabase.from('people').select('id, full_name, stage_name, primary_role').order('full_name'),
    ]).then(([moviesRes, peopleRes]) => {
      setMovies(moviesRes.data || [])
      setPeople(peopleRes.data || [])
    })
  }, [])

  useEffect(() => {
    if (!form.movie_id) { setExistingCredits([]); return }
    supabase
      .from('movie_credits')
      .select('*, people(full_name, primary_role)')
      .eq('movie_id', form.movie_id)
      .order('billing_order')
      .then(({ data }) => setExistingCredits(data || []))
  }, [form.movie_id, success])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filteredPeople = people.filter((p) =>
    searchPeople.length > 0 && (
      p.full_name.toLowerCase().includes(searchPeople.toLowerCase()) ||
      (p.stage_name && p.stage_name.toLowerCase().includes(searchPeople.toLowerCase()))
    )
  )

  const handleSelectPerson = (person: any) => {
    setSelectedPerson(person)
    setSearchPeople(person.full_name)
    setShowDropdown(false)
  }

  const handleSubmit = async () => {
    if (!form.movie_id || !selectedPerson || !form.role_type) {
      setError('Please select a movie, person and role type.')
      return
    }
    setLoading(true)
    setError('')

    const { error: insertError } = await supabase.from('movie_credits').insert({
      movie_id: form.movie_id,
      person_id: selectedPerson.id,
      role_type: form.role_type,
      character_name: form.character_name || null,
      billing_order: parseInt(form.billing_order),
    })

    setLoading(false)
    if (insertError) { setError(insertError.message); return }

    setSuccess(true)
    // Keep movie and person selected — only reset role details
    setForm({ ...form, role_type: '', character_name: '', billing_order: String(existingCredits.length + 2) })
    setTimeout(() => setSuccess(false), 3000)
  }

  const handleDeleteCredit = async (creditId: string) => {
    await supabase.from('movie_credits').delete().eq('id', creditId)
    setExistingCredits((prev) => prev.filter((c) => c.id !== creditId))
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-2xl font-bold text-emerald-500">NMDb</a>
            <span className="text-gray-600 text-sm">/ Admin / Link Cast & Crew</span>
          </div>
          <div className="flex gap-4 text-sm text-gray-400">
            <a href="/admin/add-person" className="hover:text-white transition">Add Person</a>
            <a href="/admin/add-movie" className="hover:text-white transition">Add Movie</a>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Link Cast & Crew to Films</h1>
        <p className="text-gray-400 mb-10">Connect directors, actors, producers and crew to their films.</p>

        {success && (
          <div className="bg-emerald-900/50 border border-emerald-500 text-emerald-300 px-6 py-4 rounded-xl mb-8">
            ✅ Credit added! You can add another role for the same person or select someone new.
          </div>
        )}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 px-6 py-4 rounded-xl mb-8">
            ❌ {error}
          </div>
        )}

        <div className="space-y-6">

          {/* Step 1: Select Movie */}
          <section className="bg-gray-900 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-emerald-400 mb-4">Step 1 — Select Film</h2>
            <select
              value={form.movie_id}
              onChange={(e) => setForm({ ...form, movie_id: e.target.value })}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Choose a film...</option>
              {movies.map((m) => (
                <option key={m.id} value={m.id}>{m.title} ({m.release_date?.slice(0, 4)})</option>
              ))}
            </select>

            {existingCredits.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-3">Current Credits</h3>
                <div className="space-y-2">
                  {existingCredits.map((credit: any) => (
                    <div key={credit.id} className="flex items-center justify-between bg-gray-800 px-4 py-3 rounded-xl">
                      <div>
                        <span className="text-white text-sm font-medium">{credit.people?.full_name}</span>
                        <span className="text-gray-500 text-xs ml-3">{credit.role_type}</span>
                        {credit.character_name && (
                          <span className="text-gray-600 text-xs ml-2">as "{credit.character_name}"</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteCredit(credit.id)}
                        className="text-red-500 hover:text-red-400 text-xs transition"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Step 2: Search & Select Person */}
          <section className="bg-gray-900 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-emerald-400">Step 2 — Select Person</h2>

            {/* Selected person confirmation */}
            {selectedPerson && (
              <div className="flex items-center justify-between bg-emerald-900/40 border border-emerald-700 px-4 py-3 rounded-xl">
                <div>
                  <span className="text-emerald-300 font-medium text-sm">✓ {selectedPerson.full_name}</span>
                  <span className="text-emerald-600 text-xs ml-3">{selectedPerson.primary_role}</span>
                </div>
                <button
                  onClick={() => { setSelectedPerson(null); setSearchPeople('') }}
                  className="text-gray-500 hover:text-white text-xs transition"
                >
                  Change
                </button>
              </div>
            )}

            {/* Search input with autocomplete */}
            {!selectedPerson && (
              <div ref={searchRef} className="relative">
                <input
                  type="text"
                  value={searchPeople}
                  onChange={(e) => { setSearchPeople(e.target.value); setShowDropdown(true) }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Start typing a name..."
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {showDropdown && filteredPeople.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden z-10 shadow-xl max-h-56 overflow-y-auto">
                    {filteredPeople.map((person) => (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => handleSelectPerson(person)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-700 transition flex items-center justify-between"
                      >
                        <span className="text-white text-sm font-medium">{person.full_name}</span>
                        <span className="text-gray-500 text-xs">{person.primary_role}</span>
                      </button>
                    ))}
                  </div>
                )}
                {showDropdown && searchPeople.length > 0 && filteredPeople.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl p-4 z-10">
                    <p className="text-gray-500 text-sm">No results for "{searchPeople}"</p>
                    <a href="/admin/add-person" className="text-emerald-400 text-sm hover:underline mt-1 block">
                      Add this person to NMDb →
                    </a>
                  </div>
                )}
              </div>
            )}

            {people.length === 0 && (
              <p className="text-gray-600 text-sm">
                No people in database yet.{' '}
                <a href="/admin/add-person" className="text-emerald-400 hover:underline">Add a person first →</a>
              </p>
            )}
          </section>

          {/* Step 3: Role Details */}
          <section className="bg-gray-900 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-emerald-400">Step 3 — Role Details</h2>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Role in this film <span className="text-red-400">*</span></label>
              <div className="flex flex-wrap gap-2">
                {ALL_ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setForm({ ...form, role_type: role })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      form.role_type === role
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Character Name</label>
                <input
                  type="text"
                  value={form.character_name}
                  onChange={(e) => setForm({ ...form, character_name: e.target.value })}
                  placeholder="For actors only"
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Billing Order</label>
                <input
                  type="number"
                  value={form.billing_order}
                  onChange={(e) => setForm({ ...form, billing_order: e.target.value })}
                  min="1"
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </section>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:text-emerald-700 text-white font-bold py-4 rounded-2xl text-lg transition"
          >
            {loading ? 'Saving...' : '+ Add Credit'}
          </button>
        </div>
      </div>
    </main>
  )
}
