'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { GENRES, LANGUAGES, STREAMING_PLATFORMS, CLASSIFICATIONS } from '@/lib/constants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function EditMoviePage() {
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [posterPreview, setPosterPreview] = useState<string | null>(null)
  const [existingPosterUrl, setExistingPosterUrl] = useState<string | null>(null)
  const [existingPlatforms, setExistingPlatforms] = useState<any[]>([])

  const [form, setForm] = useState({
    title: '',
    tagline: '',
    synopsis: '',
    trailer_url: '',
    release_date: '',
    release_type: '',
    language: [] as string[],
    runtime: '',
    genre: [] as string[],
    production_company: '',
    country: 'Nigeria',
    status: 'Released',
    nmdb_meter: '',
    classification: '',
    is_youtube_release: false,
    is_holiday_blockbuster: false,
    streaming_platforms: [] as string[],
  })

  // Load existing movie data
  useEffect(() => {
    const loadMovie = async () => {
      const { data: movie } = await supabase
        .from('movies')
        .select('*')
        .eq('id', id)
        .single()

      if (!movie) {
        setError('Movie not found.')
        setLoading(false)
        return
      }

      const { data: platforms } = await supabase
        .from('streaming_platforms')
        .select('*')
        .eq('movie_id', id)

      setExistingPlatforms(platforms || [])
      setExistingPosterUrl(movie.poster_url || null)

      setForm({
        title: movie.title || '',
        tagline: movie.tagline || '',
        synopsis: movie.synopsis || '',
        trailer_url: movie.trailer_url || '',
        release_date: movie.release_date || '',
        release_type: movie.release_type || '',
        language: Array.isArray(movie.language) ? movie.language : movie.language ? [movie.language] : [],
        runtime: movie.runtime ? String(movie.runtime) : '',
        genre: Array.isArray(movie.genre) ? movie.genre : movie.genre ? [movie.genre] : [],
        production_company: movie.production_company || '',
        country: movie.country || 'Nigeria',
        status: movie.status || 'Released',
        nmdb_meter: movie.nmdb_meter ? String(movie.nmdb_meter) : '',
        classification: movie.classification || '',
        is_youtube_release: movie.is_youtube_release || false,
        is_holiday_blockbuster: movie.is_holiday_blockbuster || false,
        streaming_platforms: platforms?.map((p: any) => p.platform) || [],
      })

      setLoading(false)
    }

    if (id) loadMovie()
  }, [id])

  const handleCheckbox = (field: 'genre' | 'language' | 'streaming_platforms', value: string) => {
    setForm((prev) => {
      const current = prev[field]
      return {
        ...prev,
        [field]: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value],
      }
    })
  }

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPosterFile(file)
    setPosterPreview(URL.createObjectURL(file))
  }

  const uploadPoster = async (): Promise<string | null> => {
    if (!posterFile) return null
    const ext = posterFile.name.split('.').pop()
    const path = `${id}.${ext}`
    const { error } = await supabase.storage
      .from('posters')
      .upload(path, posterFile, { upsert: true })
    if (error) return null
    const { data } = supabase.storage.from('posters').getPublicUrl(path)
    return data.publicUrl
  }

  const handleSubmit = async () => {
    if (!form.title || !form.release_date || !form.release_type) {
      setError('Title, Release Date and Release Type are required.')
      return
    }

    setSaving(true)
    setError('')

    // Upload new poster if selected
    let posterUrl = existingPosterUrl
    if (posterFile) {
      const newUrl = await uploadPoster()
      if (newUrl) posterUrl = newUrl
    }

    // Update movie
    const { error: updateError } = await supabase
      .from('movies')
      .update({
        title: form.title,
        tagline: form.tagline || null,
        synopsis: form.synopsis || null,
        trailer_url: form.trailer_url || null,
        release_date: form.release_date,
        release_type: form.release_type,
        language: form.language.length > 0 ? form.language : null,
        runtime: form.runtime ? parseInt(form.runtime) : null,
        genre: form.genre.length > 0 ? form.genre : null,
        production_company: form.production_company || null,
        country: form.country,
        status: form.status,
        nmdb_meter: form.nmdb_meter ? parseFloat(form.nmdb_meter) : null,
        classification: form.classification || null,
        is_youtube_release: form.is_youtube_release,
        is_holiday_blockbuster: form.is_holiday_blockbuster,
        poster_url: posterUrl,
      })
      .eq('id', id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    // Update streaming platforms — delete ALL existing rows first,
    // only insert new ones if delete succeeds. This prevents duplicates.
    const { error: deleteError } = await supabase
      .from('streaming_platforms')
      .delete()
      .eq('movie_id', id)

    if (deleteError) {
      setError('Failed to update streaming platforms: ' + deleteError.message)
      setSaving(false)
      return
    }

    if (form.streaming_platforms.length > 0) {
      const { error: platformInsertError } = await supabase
        .from('streaming_platforms')
        .insert(
          form.streaming_platforms.map((platform) => ({
            movie_id: id,
            platform,
            available_from: new Date().toISOString().slice(0, 10),
          }))
        )

      if (platformInsertError) {
        setError('Platforms deleted but re-insert failed: ' + platformInsertError.message)
        setSaving(false)
        return
      }
    }

    setSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 5000)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-gray-400 text-lg">Loading film data...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Navigation */}
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-2xl font-bold text-emerald-500">NMDb</a>
            <span className="text-gray-600 text-sm">/ Admin / Edit Movie</span>
          </div>
          <div className="flex gap-4 text-sm text-gray-400">
            <a href={`/movies/${id}`} className="hover:text-white transition">View Film →</a>
            <a href="/movies" className="hover:text-white transition">All Movies</a>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Edit Film</h1>
        <p className="text-gray-400 mb-10">
          Update the details for <span className="text-white font-semibold">{form.title}</span>
        </p>

        {success && (
          <div className="bg-emerald-900/50 border border-emerald-500 text-emerald-300 px-6 py-4 rounded-xl mb-8">
            ✅ Film updated successfully!
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 px-6 py-4 rounded-xl mb-8">
            ❌ {error}
          </div>
        )}

        <div className="space-y-8">

          {/* Basic Info */}
          <section className="bg-gray-900 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-emerald-400 mb-4">Basic Information</h2>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Film Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Tagline</label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Synopsis</label>
              <textarea
                value={form.synopsis}
                onChange={(e) => setForm({ ...form, synopsis: e.target.value })}
                rows={4}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Production Company</label>
              <input
                type="text"
                value={form.production_company}
                onChange={(e) => setForm({ ...form, production_company: e.target.value })}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </section>

          {/* Poster */}
          <section className="bg-gray-900 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-emerald-400 mb-4">Film Poster</h2>
            <div className="flex gap-6 items-start">
              <div className="w-32 h-48 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0 relative border border-gray-700">
                {posterPreview ? (
                  <img src={posterPreview} alt="New poster" className="w-full h-full object-cover" />
                ) : existingPosterUrl ? (
                  <Image
                    src={existingPosterUrl}
                    alt={form.title}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
                    No poster
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-3">
                  {existingPosterUrl
                    ? 'Upload a new poster to replace the current one.'
                    : 'Upload a poster for this film.'}
                </label>
                <label className="cursor-pointer inline-block bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-emerald-500 text-gray-300 px-6 py-3 rounded-xl transition text-sm">
                  📁 Choose New Poster
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePosterChange}
                    className="hidden"
                  />
                </label>
                {posterFile && (
                  <p className="text-emerald-400 text-xs mt-2">✅ {posterFile.name} selected</p>
                )}
              </div>
            </div>
          </section>

          {/* Release Info */}
          <section className="bg-gray-900 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-emerald-400 mb-4">Release Details</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Release Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={form.release_date}
                  onChange={(e) => setForm({ ...form, release_date: e.target.value })}
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Original Release Type <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.release_type}
                  onChange={(e) => setForm({ ...form, release_type: e.target.value })}
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Where did it first release?</option>
                  <option>Cinema</option>
                  <option>Streaming</option>
                  <option>Straight-to-streaming</option>
                  <option>YouTube</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Runtime (minutes)</label>
                <input
                  type="number"
                  value={form.runtime}
                  onChange={(e) => setForm({ ...form, runtime: e.target.value })}
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">NMDb Meter (0-100)</label>
                <input
                  type="number"
                  value={form.nmdb_meter}
                  onChange={(e) => setForm({ ...form, nmdb_meter: e.target.value })}
                  min="0"
                  max="100"
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option>Released</option>
                  <option>In Production</option>
                  <option>Announced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Country</label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">NFVCB Classification</label>
              <select
                value={form.classification}
                onChange={(e) => setForm({ ...form, classification: e.target.value })}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select NFVCB classification</option>
                {CLASSIFICATIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_youtube_release}
                  onChange={(e) => setForm({ ...form, is_youtube_release: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500"
                />
                <span className="text-sm text-gray-400">This is a YouTube release</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_holiday_blockbuster}
                  onChange={(e) => setForm({ ...form, is_holiday_blockbuster: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500"
                />
                <span className="text-sm text-gray-400">
                  🎄 Holiday Blockbuster — released in the December rush
                </span>
              </label>
            </div>
          </section>

          {/* Now Streaming On */}
          <section className="bg-gray-900 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-emerald-400 mb-1">Now Streaming On</h2>
            <p className="text-gray-500 text-sm mb-4">
              Update all platforms where this film is currently available.
            </p>
            <div className="flex flex-wrap gap-3">
              {STREAMING_PLATFORMS.map((platform) => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => handleCheckbox('streaming_platforms', platform)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    form.streaming_platforms.includes(platform)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {platform}
                </button>
              ))}
            </div>
          </section>

          {/* Genre */}
          <section className="bg-gray-900 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-emerald-400 mb-4">Genre</h2>
            <div className="flex flex-wrap gap-3">
              {GENRES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleCheckbox('genre', g)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    form.genre.includes(g)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </section>

          {/* Language */}
          <section className="bg-gray-900 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-emerald-400 mb-4">Language</h2>
            <div className="flex flex-wrap gap-3">
              {LANGUAGES.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => handleCheckbox('language', l)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    form.language.includes(l)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </section>

          {/* Trailer */}
          <section className="bg-gray-900 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-emerald-400 mb-4">Trailer</h2>
            <input
              type="text"
              value={form.trailer_url}
              onChange={(e) => setForm({ ...form, trailer_url: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </section>

          {/* Save */}
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:text-emerald-700 text-white font-bold py-4 rounded-2xl text-lg transition"
          >
            {saving ? 'Saving changes...' : '💾 Save Changes'}
          </button>

        </div>
      </div>
    </main>
  )
}
