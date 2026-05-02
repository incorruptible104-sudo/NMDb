'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { ALL_ROLES, GENDERS } from '@/lib/constants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AddPersonPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const toggleSecondaryRole = (role: string) => {
    if (role === form.primary_role) return // can't be both primary and secondary
    setForm((prev) => ({
      ...prev,
      secondary_roles: prev.secondary_roles.includes(role)
        ? prev.secondary_roles.filter((r) => r !== role)
        : [...prev.secondary_roles, role],
    }))
  }

  const uploadPhoto = async (personId: string): Promise<string | null> => {
    if (!photoFile) return null
    const ext = photoFile.name.split('.').pop()
    const path = `${personId}.${ext}`
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

    setLoading(true)
    setError('')

    const { data: person, error: insertError } = await supabase
      .from('people')
      .insert({
        full_name: form.full_name,
        stage_name: form.stage_name || null,
        bio: form.bio || null,
        date_of_birth: form.date_of_birth || null,
        nationality: form.nationality,
        gender: form.gender || null,
        primary_role: form.primary_role,
        secondary_roles: form.secondary_roles.length > 0 ? form.secondary_roles : null,
        instagram_url: form.instagram_url || null,
      })
      .select()
      .single()

    if (insertError || !person) {
      setError(insertError?.message || 'Failed to save person.')
      setLoading(false)
      return
    }

    if (photoFile) {
      const photoUrl = await uploadPhoto(person.id)
      if (photoUrl) {
        await supabase.from('people').update({ photo_url: photoUrl }).eq('id', person.id)
      }
    }

    setLoading(false)
    setSuccess(true)
    setPhotoFile(null)
    setPhotoPreview(null)
    setForm({
      full_name: '',
      stage_name: '',
      bio: '',
      date_of_birth: '',
      nationality: 'Nigerian',
      gender: '',
      primary_role: '',
      secondary_roles: [],
      instagram_url: '',
    })
    setTimeout(() => setSuccess(false), 5000)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Navigation */}
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-2xl font-bold text-emerald-500">NMDb</a>
            <span className="text-gray-600 text-sm">/ Admin / Add Person</span>
          </div>
          <div className="flex gap-4 text-sm text-gray-400">
            <a href="/admin/add-movie" className="hover:text-white transition">Add Movie</a>
            <a href="/people" className="hover:text-white transition">View People →</a>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Add Person</h1>
        <p className="text-gray-400 mb-10">
          Add anyone who works in front of or behind the camera in Nollywood.
        </p>

        {success && (
          <div className="bg-emerald-900/50 border border-emerald-500 text-emerald-300 px-6 py-4 rounded-xl mb-8">
            ✅ Person added successfully! You can now link them to films.
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 px-6 py-4 rounded-xl mb-8">
            ❌ {error}
          </div>
        )}

        <div className="space-y-8">

          {/* Photo Upload */}
          <section className="bg-gray-900 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-emerald-400 mb-4">Photo</h2>
            <div className="flex gap-6 items-start">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-800 flex-shrink-0 flex items-center justify-center border border-gray-700">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">👤</span>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-3">
                  Upload a professional headshot. Stored securely on NMDb servers.
                </label>
                <label className="cursor-pointer inline-block bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-emerald-500 text-gray-300 px-6 py-3 rounded-xl transition text-sm">
                  📁 Choose Photo
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
                {photoFile && (
                  <p className="text-emerald-400 text-xs mt-2">✅ {photoFile.name} selected</p>
                )}
                <p className="text-gray-600 text-xs mt-3">
                  JPG or PNG, square format recommended, minimum 400×400px
                </p>
              </div>
            </div>
          </section>

          {/* Basic Info */}
          <section className="bg-gray-900 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-emerald-400 mb-4">Basic Information</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="e.g. Funke Akindele"
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
                placeholder="Brief biography..."
                rows={4}
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
                {GENDERS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </section>

          {/* Primary Role */}
          <section className="bg-gray-900 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-emerald-400 mb-1">
              Primary Role <span className="text-red-400">*</span>
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              The main thing this person is known for in the industry.
            </p>
            <div className="flex flex-wrap gap-3">
              {ALL_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm({ ...form, primary_role: role, secondary_roles: form.secondary_roles.filter(r => r !== role) })}
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
            <p className="text-gray-500 text-sm mb-4">
              Select all other roles this person also performs. Primary role is excluded automatically.
            </p>
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
              <p className="text-gray-500 text-xs mt-4">
                Selected: {form.secondary_roles.join(', ')}
              </p>
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

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:text-emerald-700 text-white font-bold py-4 rounded-2xl text-lg transition"
          >
            {loading ? 'Saving to NMDb...' : '+ Add Person to NMDb'}
          </button>

        </div>
      </div>
    </main>
  )
}
