'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { ALL_ROLES, GENDERS } from '@/lib/constants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function EditPersonPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null)
  const [credits, setCredits] = useState<any[]>([])

  const [form, setForm] = useState({
    full_name: '',
    stage_name: '',
    bio: '',
    date_of_birth: '',
    nationality: 'Nigerian',
    gender: '',
    primary_role: '',
    secondary_roles: [] as string[],
    instagram_url: '',
  })

  // Load person data
  useEffect(() => {
    const load = async () => {
      const [personRes, creditsRes] = await Promise.all([
        supabase.from('people').select('*').eq('id', id).single(),
        supabase
          .from('movie_credits')
          .select('*, movies(id, title, release_date, poster_url)')
          .eq('person_id', id)
          .order('created_at', { ascending: false }),
      ])

      if (personRes.data) {
        const p = personRes.data
        setExistingPhotoUrl(p.photo_url || null)
        setForm({
          full_name: p.full_name || '',
          stage_name: p.stage_name || '',
          bio: p.bio || '',
          date_of_birth: p.date_of_birth || '',
          nationality: p.nationality || 'Nigerian',
          gender: p.gender || '',
          primary_role: p.primary_role || '',
          secondary_roles: Array.isArray(p.secondary_roles) ? p.secondary_roles : [],
          instagram_url: p.instagram_url || '',
        })
      }

      setCredits(creditsRes.data || [])
      setLoading(false)
    }
    load()
  }, [id])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const toggleSecondaryRole = (role: string) => {
    if (role === form.primary_role) return
    setForm((prev) => ({
      ...prev,
      secondary_roles: prev.secondary_roles.includes(role)
        ? prev.secondary_roles.filter((r) => r !== role)
        : [...prev.secondary_roles, role],
    }))
  }

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile) return null
    const ext = photoFile.name.split('.').pop()
    const path = `${id}.${ext}`
    const { error } = await supabase.storage
      .from('people')
      .upload(path, photoFile, { upsert: true })
    if (error) return null
    const { data } = supabase.storage.from('people').getPublicUrl(path)
    return data.publicUrl
  }

  const handleSubmit = async () => {
    if (!form.full_name || !form.primary_role) {
      setError('Full name and primary role are required.')
      return
    }

    setSaving(true)
    setError('')

    // Upload new photo if selected
    let photoUrl = existingPhotoUrl
    if (photoFile) {
      const uploaded = await uploadPhoto()
      if (uploaded) photoUrl = uploaded
    }

    const { error: updateError } = await supabase
      .from('people')
      .update({
        full_name: form.full_name,
        stage_name: form.stage_name || null,
        bio: form.bio || null,
        date_of_birth: form.date_of_birth || null,
        nationality: form.nationality,
        gender: form.gender || null,
        primary_role: form.primary_role,
        secondary_roles: form.secondary_roles.length > 0 ? form.secondary_roles : null,
        instagram_url: form.instagram_url || null,
        photo_url: photoUrl,
      })
      .eq('id', id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setSaving(false)
    setSuccess('✅ Profile updated successfully!')
    setTimeout(() => setSuccess(''), 4000)
  }

  const removeCredit = async (creditId: string) => {
    await supabase.from('movie_credits').delete().eq('id', creditId)
    setCredits((prev) => prev.filter((c) => c.id !== creditId))
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Loading profile...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-4 sticky top-0 bg-gray-950 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-2xl font-bold text-emerald-500">NMDb</a>
            <span className="text-gray-600 text-sm">/ Admin / Edit Person</span>
          </div>
          <div className="flex gap-4 text-sm text-gray-400">
            <a href={`/people/${id}`} className="hover:text-white transition">View Profile →</a>
            <a href="/people" className="hover:text-white transition">All People</a>
            <a href="/admin/add-person" className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-full transition text-xs">+ Add Person</a>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-1">Edit: {form.full_name}</h1>
        <p className="text-gray-500 text-sm mb-8">Update this person's profile, photo, and filmography credits.</p>

        {/* Messages */}
        {success && (
          <div className="bg-emerald-900/50 border border-emerald-500 text-emerald-300 px-6 py-3 rounded-xl mb-6">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 px-6 py-3 rounded-xl mb-6">
            ❌ {error}
          </div>
        )}

        <div className="space-y-8">

          {/* Photo */}
          <section className="bg-gray-900 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-emerald-400 mb-4">Photo</h2>
            <div className="flex gap-6 items-start">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-800 flex-shrink-0 flex items-center justify-center border border-gray-700 relative">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : existingPhotoUrl ? (
                  <Image src={existingPhotoUrl} alt={form.full_name} fill className="object-cover" sizes="128px" />
                ) : (
                  <span className="text-4xl">👤</span>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-3">
                  Upload a new photo to replace the current one.
                </label>
                <label className="cursor-pointer inline-block bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-emerald-500 text-gray-300 px-6 py-3 rounded-xl transition text-sm">
                  📁 Choose Photo
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
                {photoFile && (
                  <p className="text-emerald-400 text-xs mt-2">✅ {photoFile.name} selected</p>
                )}
                <p className="text-gray-600 text-xs mt-3">JPG or PNG, square format recommended, minimum 400×400px</p>
              </div>
            </div>
          </section>

          {/* Basic Info */}
          <section className="bg-gray-900 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-emerald-400 mb-2">Basic Information</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Full Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Stage Name</label>
                <input
                  type="text"
                  value={form.stage_name}
                  onChange={(e) => setForm({ ...form, stage_name: e.target.value })}
                  placeholder="If different from full name"
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={4}
                placeholder="Brief biography..."
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nationality</label>
                <input
                  type="text"
                  value={form.nationality}
                  onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select gender</option>
                {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </section>

          {/* Primary Role */}
          <section className="bg-gray-900 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-emerald-400 mb-1">
              Primary Role <span className="text-red-400">*</span>
            </h2>
            <p className="text-gray-500 text-sm mb-4">The main thing this person is known for.</p>
            <div className="flex flex-wrap gap-3">
              {ALL_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm({
                    ...form,
                    primary_role: role,
                    secondary_roles: form.secondary_roles.filter(r => r !== role),
                  })}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    form.primary_role === role
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </section>

          {/* Secondary Roles */}
          <section className="bg-gray-900 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-emerald-400 mb-1">Secondary Roles</h2>
            <p className="text-gray-500 text-sm mb-4">Other roles this person also performs.</p>
            <div className="flex flex-wrap gap-3">
              {ALL_ROLES.filter((role) => role !== form.primary_role).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleSecondaryRole(role)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    form.secondary_roles.includes(role)
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
            {form.secondary_roles.length > 0 && (
              <p className="text-gray-500 text-xs mt-4">Selected: {form.secondary_roles.join(', ')}</p>
            )}
          </section>

          {/* Social */}
          <section className="bg-gray-900 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-emerald-400 mb-4">Social Media</h2>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Instagram URL</label>
              <input
                type="text"
                value={form.instagram_url}
                onChange={(e) => setForm({ ...form, instagram_url: e.target.value })}
                placeholder="https://instagram.com/username"
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </section>

          {/* Save button */}
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:text-emerald-700 text-white font-bold py-4 rounded-2xl text-lg transition"
          >
            {saving ? 'Saving...' : '💾 Save Changes'}
          </button>

          {/* Filmography */}
          {credits.length > 0 && (
            <section className="bg-gray-900 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-emerald-400 mb-4">
                Filmography ({credits.length} credits)
              </h2>
              <div className="space-y-2">
                {credits.map((credit: any) => (
                  <div key={credit.id} className="flex items-center justify-between bg-gray-800 px-4 py-3 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-12 rounded bg-gray-700 overflow-hidden relative flex-shrink-0">
                        {credit.movies?.poster_url ? (
                          <Image
                            src={credit.movies.poster_url}
                            alt={credit.movies.title}
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">🎬</div>
                        )}
                      </div>
                      <div>
                        <a
                          href={`/movies/${credit.movies?.id}`}
                          className="text-white text-sm font-medium hover:text-emerald-400 transition"
                        >
                          {credit.movies?.title}
                        </a>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-emerald-500 text-xs">{credit.role_type}</span>
                          {credit.character_name && (
                            <span className="text-gray-500 text-xs">as "{credit.character_name}"</span>
                          )}
                          {credit.movies?.release_date && (
                            <span className="text-gray-600 text-xs">
                              · {credit.movies.release_date.slice(0, 4)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeCredit(credit.id)}
                      className="text-red-500 hover:text-red-400 text-xs transition ml-4"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </main>
  )
}
