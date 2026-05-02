'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import {
  ALL_ROLES,
  GENRES,
  LANGUAGES,
  STREAMING_PLATFORMS,
  CLASSIFICATIONS,
  CONTENT_TYPES,
  STATUS_OPTIONS,
  RELEASE_TYPES,
} from '@/lib/constants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const TABS = [
  { id: 'details', label: '🎬 Film Details' },
  { id: 'poster', label: '🖼️ Poster' },
  { id: 'release', label: '📅 Release & Classification' },
  { id: 'credits', label: '👥 Cast & Crew' },
  { id: 'boxoffice', label: '💰 Box Office' },
]

const emptyForm = {
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
  content_type: 'Movie',
  is_youtube_release: false,
  is_holiday_blockbuster: false,
  in_cinemas: false,
  streaming_platforms: [] as string[],
}

const emptyBoxOffice = {
  opening_weekend: '',
  total_nigeria: '',
  total_worldwide: '',
  week_number: '1',
  weekly_gross: '',
  source: '',
  verified: false,
  notes: '',
}

export default function MovieAdminPage() {
  const params = useParams()
  const id = params.id as string
  const isNew = id === 'new'

  const [pageLoading, setPageLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('details')
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [movieId, setMovieId] = useState<string | null>(isNew ? null : id)

  // Form state
  const [form, setForm] = useState(emptyForm)
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [posterPreview, setPosterPreview] = useState<string | null>(null)
  const [existingPosterUrl, setExistingPosterUrl] = useState<string | null>(null)

  // Box office state
  const [boForm, setBoForm] = useState(emptyBoxOffice)
  const [existingBoxOffice, setExistingBoxOffice] = useState<any[]>([])

  // Credits state
  const [credits, setCredits] = useState<any[]>([])
  const [people, setPeople] = useState<any[]>([])
  const [selectedPerson, setSelectedPerson] = useState<any>(null)
  const [personSearch, setPersonSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [creditRole, setCreditRole] = useState('')
  const [characterName, setCharacterName] = useState('')
  const [billingOrder, setBillingOrder] = useState('1')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setErrorMsg('')
    setTimeout(() => setSuccessMsg(''), 5000)
  }

  const showError = (msg: string) => {
    setErrorMsg(msg)
    setTimeout(() => setErrorMsg(''), 6000)
  }

  const toggle = (field: 'genre' | 'language' | 'streaming_platforms', value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value],
    }))
  }

  // Load existing movie data
  useEffect(() => {
    if (isNew) {
      supabase.from('people').select('id, full_name, stage_name, primary_role').order('full_name')
        .then(({ data }) => setPeople(data || []))
      return
    }

    const load = async () => {
      const [movieRes, platformsRes, boRes, creditsRes, peopleRes] = await Promise.all([
        supabase.from('movies').select('*').eq('id', id).single(),
        supabase.from('streaming_platforms').select('*').eq('movie_id', id),
        supabase.from('box_office').select('*').eq('movie_id', id).order('week_number'),
        supabase.from('movie_credits').select('*, people(id, full_name, photo_url, primary_role)').eq('movie_id', id).order('billing_order'),
        supabase.from('people').select('id, full_name, stage_name, primary_role').order('full_name'),
      ])

      const m = movieRes.data
      if (m) {
        setExistingPosterUrl(m.poster_url || null)
        setForm({
          title: m.title || '',
          tagline: m.tagline || '',
          synopsis: m.synopsis || '',
          trailer_url: m.trailer_url || '',
          release_date: m.release_date || '',
          release_type: m.release_type || '',
          language: Array.isArray(m.language) ? m.language : m.language ? [m.language] : [],
          runtime: m.runtime ? String(m.runtime) : '',
          genre: Array.isArray(m.genre) ? m.genre : m.genre ? [m.genre] : [],
          production_company: m.production_company || '',
          country: m.country || 'Nigeria',
          status: m.status || 'Released',
          nmdb_meter: m.nmdb_meter ? String(m.nmdb_meter) : '',
          classification: m.classification || '',
          content_type: m.content_type || 'Movie',
          is_youtube_release: m.is_youtube_release || false,
          is_holiday_blockbuster: m.is_holiday_blockbuster || false,
          in_cinemas: m.in_cinemas || false,
          streaming_platforms: platformsRes.data?.map((p: any) => p.platform) || [],
        })
      }

      setExistingBoxOffice(boRes.data || [])
      setCredits(creditsRes.data || [])
      setPeople(peopleRes.data || [])
      setPageLoading(false)
    }

    load()
  }, [id, isNew])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPosterFile(file)
    setPosterPreview(URL.createObjectURL(file))
  }

  const uploadPoster = async (mId: string): Promise<string | null> => {
    if (!posterFile) return null
    const ext = posterFile.name.split('.').pop()
    const path = `${mId}.${ext}`
    const { error } = await supabase.storage.from('posters').upload(path, posterFile, { upsert: true })
    if (error) return null
    const { data } = supabase.storage.from('posters').getPublicUrl(path)
    return data.publicUrl
  }

  const buildMoviePayload = (posterUrl?: string | null) => ({
    title: form.title,
    tagline: form.tagline || null,
    synopsis: form.synopsis || null,
    trailer_url: form.trailer_url || null,
    release_date: form.release_date || null,
    release_type: form.release_type || null,
    language: form.language.length > 0 ? form.language : null,
    runtime: form.runtime ? parseInt(form.runtime) : null,
    genre: form.genre.length > 0 ? form.genre : null,
    production_company: form.production_company || null,
    country: form.country || 'Nigeria',
    status: form.status,
    nmdb_meter: form.nmdb_meter ? parseFloat(form.nmdb_meter) : null,
    classification: form.classification || null,
    content_type: form.content_type,
    is_youtube_release: form.is_youtube_release,
    is_holiday_blockbuster: form.is_holiday_blockbuster,
    in_cinemas: form.in_cinemas,
    ...(posterUrl !== undefined ? { poster_url: posterUrl } : {}),
  })

  const savePlatforms = async (mId: string) => {
    await supabase.from('streaming_platforms').delete().eq('movie_id', mId)
    if (form.streaming_platforms.length > 0) {
      await supabase.from('streaming_platforms').insert(
        form.streaming_platforms.map(p => ({
          movie_id: mId,
          platform: p,
          available_from: new Date().toISOString().slice(0, 10),
        }))
      )
    }
  }

  const saveDetails = async () => {
    if (!form.title) { showError('Title is required.'); return }
    setSaving(true)

    if (isNew || !movieId) {
      const { data, error } = await supabase.from('movies')
        .insert(buildMoviePayload())
        .select().single()

      if (error || !data) { showError(error?.message || 'Failed to create film.'); setSaving(false); return }

      setMovieId(data.id)

      if (posterFile) {
        const url = await uploadPoster(data.id)
        if (url) await supabase.from('movies').update({ poster_url: url }).eq('id', data.id)
      }

      await savePlatforms(data.id)
      showSuccess('✅ Film created! Now add poster, cast & crew, and box office data using the tabs above.')
    } else {
      let posterUrl = existingPosterUrl
      if (posterFile) {
        const url = await uploadPoster(movieId)
        if (url) posterUrl = url
      }

      const { error } = await supabase.from('movies')
        .update(buildMoviePayload(posterUrl))
        .eq('id', movieId)

      if (error) { showError(error.message); setSaving(false); return }

      await savePlatforms(movieId)
      showSuccess('✅ Film updated successfully!')
    }

    setSaving(false)
  }

  const createNewPerson = async () => {
    if (!personSearch.trim()) return
    setSaving(true)
    const { data, error } = await supabase
      .from('people')
      .insert({
        full_name: personSearch.trim(),
        primary_role: creditRole || 'Actor',
        nationality: 'Nigerian',
      })
      .select()
      .single()

    if (error || !data) {
      showError('Failed to create person: ' + (error?.message || 'Unknown error'))
      setSaving(false)
      return
    }

    // Add to local people list and select them
    setPeople(prev => [...prev, data])
    setSelectedPerson(data)
    setShowDropdown(false)
    showSuccess(`✅ ${data.full_name} added to NMDb people database!`)
    setSaving(false)
  }

  const addCredit = async () => {
    const mId = movieId
    if (!mId) { showError('Save film details first before adding cast & crew.'); setActiveTab('details'); return }
    if (!selectedPerson || !creditRole) { showError('Select a person and role.'); return }
    setSaving(true)

    const { error } = await supabase.from('movie_credits').insert({
      movie_id: mId,
      person_id: selectedPerson.id,
      role_type: creditRole,
      character_name: characterName || null,
      billing_order: parseInt(billingOrder) || credits.length + 1,
    })

    if (error) { showError(error.message); setSaving(false); return }

    const { data } = await supabase.from('movie_credits')
      .select('*, people(id, full_name, photo_url, primary_role)')
      .eq('movie_id', mId).order('billing_order')
    setCredits(data || [])
    setCreditRole('')
    setCharacterName('')
    setBillingOrder(String((data?.length || 0) + 1))
    showSuccess('✅ Credit added!')
    setSaving(false)
  }

  const removeCredit = async (creditId: string) => {
    await supabase.from('movie_credits').delete().eq('id', creditId)
    setCredits(prev => prev.filter(c => c.id !== creditId))
  }

  const saveBoxOffice = async () => {
    const mId = movieId
    if (!mId) { showError('Save film details first.'); setActiveTab('details'); return }
    if (!boForm.total_nigeria) { showError('Total Nigeria gross is required.'); return }
    setSaving(true)

    const { error } = await supabase.from('box_office').insert({
      movie_id: mId,
      opening_weekend: boForm.opening_weekend ? parseFloat(boForm.opening_weekend) : null,
      total_nigeria: parseFloat(boForm.total_nigeria),
      total_worldwide: boForm.total_worldwide ? parseFloat(boForm.total_worldwide) : null,
      week_number: parseInt(boForm.week_number) || 1,
      weekly_gross: boForm.weekly_gross ? parseFloat(boForm.weekly_gross) : null,
      source: boForm.source || null,
      verified: boForm.verified,
      notes: boForm.notes || null,
    })

    if (error) { showError(error.message); setSaving(false); return }

    const { data } = await supabase.from('box_office').select('*').eq('movie_id', mId).order('week_number')
    setExistingBoxOffice(data || [])
    setBoForm({ ...emptyBoxOffice, week_number: String((data?.length || 0) + 1) })
    showSuccess('✅ Box office data saved!')
    setSaving(false)
  }

  const formatNaira = (n: number) => {
    if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`
    if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`
    return `₦${n.toLocaleString()}`
  }

  const filteredPeople = personSearch.length === 0 ? [] : people
    .filter(p =>
      p.full_name.toLowerCase().includes(personSearch.toLowerCase()) ||
      (p.stage_name?.toLowerCase().includes(personSearch.toLowerCase()))
    )
    .sort((a, b) => {
      const s = personSearch.toLowerCase()
      const aStarts = a.full_name.toLowerCase().startsWith(s)
      const bStarts = b.full_name.toLowerCase().startsWith(s)
      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1
      return a.full_name.localeCompare(b.full_name)
    })
    .slice(0, 8)

  const exactMatch = filteredPeople.some(
    p => p.full_name.toLowerCase() === personSearch.toLowerCase()
  )
  const showAddNew = personSearch.length > 1 && !exactMatch

  if (pageLoading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400 text-lg">Loading film data...</p>
      </main>
    )
  }

  const inputClass = "w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
  const sectionClass = "bg-gray-900 rounded-2xl p-6 space-y-4"
  const labelClass = "block text-sm text-gray-400 mb-1"
  const chipBase = "px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer"
  const chipOn = "bg-emerald-600 text-white"
  const chipOff = "bg-gray-800 text-gray-400 hover:bg-gray-700"

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Sticky nav */}
      <nav className="border-b border-gray-800 px-6 py-4 sticky top-0 bg-gray-950 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-2xl font-bold text-emerald-500">NMDb</a>
            <span className="text-gray-600 text-sm">/ Admin / {isNew ? 'New Film' : form.title || 'Edit Film'}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            {movieId && <a href={`/movies/${movieId}`} className="hover:text-white transition">View Film →</a>}
            <a href="/movies" className="hover:text-white transition">All Films</a>
            <a href="/admin/movie/new" className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-full transition text-xs">+ New Film</a>
          </div>
        </div>
      </nav>

      {/* Messages */}
      {successMsg && (
        <div className="max-w-5xl mx-auto px-6 mt-4">
          <div className="bg-emerald-900/50 border border-emerald-500 text-emerald-300 px-6 py-3 rounded-xl">{successMsg}</div>
        </div>
      )}
      {errorMsg && (
        <div className="max-w-5xl mx-auto px-6 mt-4">
          <div className="bg-red-900/50 border border-red-500 text-red-300 px-6 py-3 rounded-xl">❌ {errorMsg}</div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-1">{isNew ? '+ Add New Film' : `Editing: ${form.title}`}</h1>
        <p className="text-gray-500 text-sm mb-8">Everything about this film in one place — use the tabs to navigate.</p>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-800 pb-4">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${activeTab === tab.id ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ==================== TAB: DETAILS ==================== */}
        {activeTab === 'details' && (
          <div className="space-y-6">

            <div className={sectionClass}>
              <h2 className="text-lg font-semibold text-emerald-400">Basic Information</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelClass}>Film Title <span className="text-red-400">*</span></label>
                  <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                    placeholder="e.g. A Tribe Called Judah" className={inputClass} />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Tagline</label>
                  <input type="text" value={form.tagline} onChange={e => setForm({...form, tagline: e.target.value})}
                    placeholder="One-line description" className={inputClass} />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Synopsis</label>
                  <textarea value={form.synopsis} onChange={e => setForm({...form, synopsis: e.target.value})}
                    rows={4} placeholder="Full plot summary..." className={`${inputClass} resize-none`} />
                </div>
                <div>
                  <label className={labelClass}>Production Company</label>
                  <input type="text" value={form.production_company} onChange={e => setForm({...form, production_company: e.target.value})}
                    placeholder="e.g. Inkblot Productions" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Country</label>
                  <input type="text" value={form.country} onChange={e => setForm({...form, country: e.target.value})} className={inputClass} />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>YouTube Trailer URL</label>
                  <input type="text" value={form.trailer_url} onChange={e => setForm({...form, trailer_url: e.target.value})}
                    placeholder="https://youtube.com/watch?v=..." className={inputClass} />
                </div>
              </div>
            </div>

            {/* Content Type */}
            <div className={sectionClass}>
              <h2 className="text-lg font-semibold text-emerald-400">Content Type</h2>
              <div className="flex gap-3">
                {CONTENT_TYPES.map(type => (
                  <button key={type} type="button" onClick={() => setForm({...form, content_type: type})}
                    className={`px-6 py-3 rounded-xl text-sm font-semibold transition ${form.content_type === type ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                    {type === 'Movie' ? '🎬 Movie' : '📺 Series'}
                  </button>
                ))}
              </div>
            </div>

            {/* Genre */}
            <div className={sectionClass}>
              <h2 className="text-lg font-semibold text-emerald-400">Genre</h2>
              <div className="flex flex-wrap gap-2">
                {GENRES.map(g => (
                  <button key={g} type="button" onClick={() => toggle('genre', g)}
                    className={`${chipBase} ${form.genre.includes(g) ? chipOn : chipOff}`}>{g}</button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div className={sectionClass}>
              <h2 className="text-lg font-semibold text-emerald-400">Language</h2>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(l => (
                  <button key={l} type="button" onClick={() => toggle('language', l)}
                    className={`${chipBase} ${form.language.includes(l) ? chipOn : chipOff}`}>{l}</button>
                ))}
              </div>
            </div>

            <button onClick={saveDetails} disabled={saving}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:text-emerald-700 text-white font-bold py-4 rounded-2xl text-lg transition">
              {saving ? 'Saving...' : isNew ? '+ Create Film' : '💾 Save Details'}
            </button>
          </div>
        )}

        {/* ==================== TAB: POSTER ==================== */}
        {activeTab === 'poster' && (
          <div className="space-y-6">
            <div className={sectionClass}>
              <h2 className="text-lg font-semibold text-emerald-400">Film Poster</h2>
              <div className="flex gap-6 items-start">
                <div className="w-40 h-60 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0 relative border border-gray-700">
                  {posterPreview ? (
                    <img src={posterPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : existingPosterUrl ? (
                    <Image src={existingPosterUrl} alt={form.title} fill className="object-cover" sizes="160px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">No poster</div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-gray-400 text-sm mb-4">
                    {existingPosterUrl ? 'Upload a new poster to replace the current one.' : 'Upload a poster for this film.'}
                    <br /><span className="text-gray-600 text-xs">Stored on NMDb servers — never breaks.</span>
                  </p>
                  <label className="cursor-pointer inline-block bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-emerald-500 text-gray-300 px-6 py-3 rounded-xl transition text-sm">
                    📁 Choose Poster File
                    <input type="file" accept="image/*" onChange={handlePosterChange} className="hidden" />
                  </label>
                  {posterFile && <p className="text-emerald-400 text-xs mt-2">✅ {posterFile.name} selected</p>}
                  <p className="text-gray-600 text-xs mt-3">JPG or PNG, portrait (2:3 ratio), min 500×750px</p>
                </div>
              </div>
            </div>
            <button onClick={saveDetails} disabled={saving}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 text-white font-bold py-4 rounded-2xl text-lg transition">
              {saving ? 'Saving...' : '💾 Save Poster'}
            </button>
          </div>
        )}

        {/* ==================== TAB: RELEASE ==================== */}
        {activeTab === 'release' && (
          <div className="space-y-6">
            <div className={sectionClass}>
              <h2 className="text-lg font-semibold text-emerald-400">Release Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Release Date</label>
                  <input type="date" value={form.release_date} onChange={e => setForm({...form, release_date: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Original Release Type</label>
                  <select value={form.release_type} onChange={e => setForm({...form, release_type: e.target.value})} className={inputClass}>
                    <option value="">Select type</option>
                    {RELEASE_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Runtime (minutes)</label>
                  <input type="number" value={form.runtime} onChange={e => setForm({...form, runtime: e.target.value})} placeholder="e.g. 112" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>NMDb Meter (0–100)</label>
                  <input type="number" value={form.nmdb_meter} onChange={e => setForm({...form, nmdb_meter: e.target.value})} min="0" max="100" placeholder="e.g. 78" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className={inputClass}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>NFVCB Classification</label>
                  <select value={form.classification} onChange={e => setForm({...form, classification: e.target.value})} className={inputClass}>
                    <option value="">Select classification</option>
                    {CLASSIFICATIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.in_cinemas} onChange={e => setForm({...form, in_cinemas: e.target.checked})} className="w-4 h-4 accent-emerald-500" />
                  <span className="text-sm text-gray-300">🎬 Currently showing in cinemas</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.is_holiday_blockbuster} onChange={e => setForm({...form, is_holiday_blockbuster: e.target.checked})} className="w-4 h-4 accent-emerald-500" />
                  <span className="text-sm text-gray-300">🎄 Holiday Blockbuster (December release)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.is_youtube_release} onChange={e => setForm({...form, is_youtube_release: e.target.checked})} className="w-4 h-4 accent-emerald-500" />
                  <span className="text-sm text-gray-300">▶️ YouTube release</span>
                </label>
              </div>
            </div>

            {/* Streaming platforms */}
            <div className={sectionClass}>
              <h2 className="text-lg font-semibold text-emerald-400">Now Streaming On</h2>
              <p className="text-gray-500 text-sm">Select all platforms where this film is currently available.</p>
              <div className="flex flex-wrap gap-2">
                {STREAMING_PLATFORMS.map(p => (
                  <button key={p} type="button" onClick={() => toggle('streaming_platforms', p)}
                    className={`${chipBase} ${form.streaming_platforms.includes(p) ? chipOn : chipOff}`}>{p}</button>
                ))}
              </div>
            </div>

            <button onClick={saveDetails} disabled={saving}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 text-white font-bold py-4 rounded-2xl text-lg transition">
              {saving ? 'Saving...' : '💾 Save Release Details'}
            </button>
          </div>
        )}

        {/* ==================== TAB: CAST & CREW ==================== */}
        {activeTab === 'credits' && (
          <div className="space-y-6">

            {!movieId && (
              <div className="bg-yellow-900/30 border border-yellow-700 text-yellow-400 px-5 py-4 rounded-xl text-sm">
                ⚠️ Save film details first before adding cast & crew.
              </div>
            )}

            {/* Current credits */}
            {credits.length > 0 && (
              <div className={sectionClass}>
                <h2 className="text-lg font-semibold text-emerald-400">Current Credits ({credits.length})</h2>
                <div className="space-y-2">
                  {credits.map((credit: any) => (
                    <div key={credit.id} className="flex items-center justify-between bg-gray-800 px-4 py-3 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden flex-shrink-0 relative">
                          {credit.people?.photo_url ? (
                            <Image src={credit.people.photo_url} alt={credit.people.full_name} fill className="object-cover" sizes="32px" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">👤</div>
                          )}
                        </div>
                        <div>
                          <span className="text-white text-sm font-medium">{credit.people?.full_name}</span>
                          <span className="text-emerald-500 text-xs ml-3">{credit.role_type}</span>
                          {credit.character_name && (
                            <span className="text-gray-500 text-xs ml-2">as "{credit.character_name}"</span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => removeCredit(credit.id)} className="text-red-500 hover:text-red-400 text-xs transition">Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add credit form */}
            <div className={sectionClass}>
              <h2 className="text-lg font-semibold text-emerald-400">Add Cast or Crew Member</h2>

              {/* Person search */}
              {selectedPerson ? (
                <div className="flex items-center justify-between bg-emerald-900/40 border border-emerald-700 px-4 py-3 rounded-xl">
                  <span className="text-emerald-300 font-medium text-sm">✓ {selectedPerson.full_name}</span>
                  <button onClick={() => { setSelectedPerson(null); setPersonSearch('') }}
                    className="text-gray-500 hover:text-white text-xs transition">Change</button>
                </div>
              ) : (
                <div ref={dropdownRef} className="relative">
                  <input
                    type="text"
                    value={personSearch}
                    onChange={e => { setPersonSearch(e.target.value); setShowDropdown(true) }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Search by name..."
                    className={inputClass}
                  />
                  {showDropdown && personSearch.length > 1 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden z-10 shadow-xl max-h-64 overflow-y-auto">
                      {filteredPeople.length === 0 && (
                        <p className="text-gray-500 text-xs px-4 py-3">No match found in database</p>
                      )}
                      {filteredPeople.map(person => (
                        <button key={person.id} type="button"
                          onClick={() => { setSelectedPerson(person); setPersonSearch(person.full_name); setShowDropdown(false) }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-700 transition flex items-center justify-between">
                          <span className="text-white text-sm">{person.full_name}</span>
                          <span className="text-gray-500 text-xs">{person.primary_role}</span>
                        </button>
                      ))}
                      {showAddNew && (
                        <button
                          type="button"
                          onClick={createNewPerson}
                          disabled={saving}
                          className="w-full text-left px-4 py-3 hover:bg-emerald-900/40 transition flex items-center gap-2 border-t border-gray-700"
                        >
                          <span className="text-emerald-400 text-sm font-medium">+ Add "{personSearch}" as new person</span>
                          <span className="text-gray-500 text-xs ml-auto">Creates profile automatically</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Role selection */}
              <div>
                <label className={labelClass}>Role in this film</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_ROLES.map(role => (
                    <button key={role} type="button" onClick={() => setCreditRole(role)}
                      className={`${chipBase} ${creditRole === role ? chipOn : chipOff}`}>{role}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Character Name</label>
                  <input type="text" value={characterName} onChange={e => setCharacterName(e.target.value)}
                    placeholder="For actors only" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Billing Order</label>
                  <input type="number" value={billingOrder} onChange={e => setBillingOrder(e.target.value)}
                    min="1" className={inputClass} />
                </div>
              </div>

              <button onClick={addCredit} disabled={saving || !movieId}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:text-emerald-700 text-white font-bold py-4 rounded-2xl text-lg transition">
                {saving ? 'Saving...' : '+ Add to Cast & Crew'}
              </button>
            </div>
          </div>
        )}

        {/* ==================== TAB: BOX OFFICE ==================== */}
        {activeTab === 'boxoffice' && (
          <div className="space-y-6">

            {!movieId && (
              <div className="bg-yellow-900/30 border border-yellow-700 text-yellow-400 px-5 py-4 rounded-xl text-sm">
                ⚠️ Save film details first before adding box office data.
              </div>
            )}

            {/* Existing records */}
            {existingBoxOffice.length > 0 && (
              <div className={sectionClass}>
                <h2 className="text-lg font-semibold text-emerald-400">Saved Records</h2>
                <div className="space-y-3">
                  {existingBoxOffice.map((record: any) => (
                    <div key={record.id} className="bg-gray-800 px-4 py-3 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-xs">Week {record.week_number}</span>
                        {record.verified && <span className="text-emerald-400 text-xs">✓ Verified</span>}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        {record.opening_weekend && (
                          <div>
                            <span className="text-gray-500 text-xs">Opening Weekend</span>
                            <p className="text-white font-semibold">{formatNaira(record.opening_weekend)}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500 text-xs">Total Nigeria</span>
                          <p className="text-emerald-400 font-bold">{formatNaira(record.total_nigeria)}</p>
                        </div>
                        {record.total_worldwide && (
                          <div>
                            <span className="text-gray-500 text-xs">Worldwide</span>
                            <p className="text-white font-semibold">{formatNaira(record.total_worldwide)}</p>
                          </div>
                        )}
                      </div>
                      {record.source && <p className="text-gray-600 text-xs mt-2">Source: {record.source}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add new box office entry */}
            <div className={sectionClass}>
              <h2 className="text-lg font-semibold text-emerald-400">Add Box Office Data</h2>
              <p className="text-gray-500 text-sm">Enter amounts in full Naira — e.g. 500000000 for ₦500M</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Opening Weekend</label>
                  <input type="number" value={boForm.opening_weekend} onChange={e => setBoForm({...boForm, opening_weekend: e.target.value})}
                    placeholder="e.g. 150000000" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Total Nigeria Gross <span className="text-red-400">*</span></label>
                  <input type="number" value={boForm.total_nigeria} onChange={e => setBoForm({...boForm, total_nigeria: e.target.value})}
                    placeholder="e.g. 600000000" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Total Worldwide</label>
                  <input type="number" value={boForm.total_worldwide} onChange={e => setBoForm({...boForm, total_worldwide: e.target.value})}
                    placeholder="If available" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Week Number</label>
                  <input type="number" value={boForm.week_number} onChange={e => setBoForm({...boForm, week_number: e.target.value})}
                    min="1" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Weekly Gross</label>
                  <input type="number" value={boForm.weekly_gross} onChange={e => setBoForm({...boForm, weekly_gross: e.target.value})}
                    placeholder="This week's gross" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Source</label>
                  <input type="text" value={boForm.source} onChange={e => setBoForm({...boForm, source: e.target.value})}
                    placeholder="e.g. Cinema Exhibitors Association" className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Notes</label>
                <textarea value={boForm.notes} onChange={e => setBoForm({...boForm, notes: e.target.value})}
                  rows={2} placeholder="Any context or caveats..." className={`${inputClass} resize-none`} />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={boForm.verified} onChange={e => setBoForm({...boForm, verified: e.target.checked})}
                  className="w-4 h-4 accent-emerald-500" />
                <span className="text-sm text-gray-400">✓ Mark as verified — confirmed from official or multiple sources</span>
              </label>

              <button onClick={saveBoxOffice} disabled={saving || !movieId}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:text-emerald-700 text-white font-bold py-4 rounded-2xl text-lg transition">
                {saving ? 'Saving...' : '+ Save Box Office Data'}
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
