// =============================================================
// NMDb — Patch Poster URLs for specific films
// Fetches poster from TMDb by ID and updates your database
// Run with: node scripts/patch-posters.js
// =============================================================

const CONFIG = {
  TMDB_API_KEY: '4872c34ca25f19c6d1cd52294eb93f0b',
  SUPABASE_URL: 'https://mzndtfxsqlfjbbmulocu.supabase.co',
  SUPABASE_SERVICE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16bmR0ZnhzcWxmamJibXVsb2N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY5NTYxNywiZXhwIjoyMDkyMjcxNjE3fQ.ytLAAYCUm_C8txG5ZVc2Nn-cWIqmkNZtDC9DgNWzXiU',
}

// Films to patch — title must match exactly what's in your database
const FILMS_TO_PATCH = [
  { title: 'Aba Blues',                    tmdbId: 1657629 },
  { title: 'The Other Side of the Bridge', tmdbId: 1679584 },
]

const fetch = (...args) =>
  import('node-fetch').then(({ default: f }) => f(...args))

const TMDB_BASE = 'https://api.themoviedb.org/3'

async function tmdb(path) {
  const sep = path.includes('?') ? '&' : '?'
  const res = await fetch(`${TMDB_BASE}${path}${sep}api_key=${CONFIG.TMDB_API_KEY}`)
  if (!res.ok) throw new Error(`TMDb ${res.status}: ${path}`)
  return res.json()
}

async function sb(path, options = {}) {
  const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      apikey: CONFIG.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${CONFIG.SUPABASE_SERVICE_KEY}`,
      Prefer: 'return=minimal',
      ...options.headers,
    },
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Supabase ${path}: ${text}`)
  return text ? JSON.parse(text) : null
}

async function run() {
  console.log('\n=== NMDb Poster Patch ===\n')

  for (const [key, val] of Object.entries(CONFIG)) {
    if (val.includes('paste')) {
      console.error(`❌ CONFIG.${key} not filled in.\n`)
      process.exit(1)
    }
  }

  for (const film of FILMS_TO_PATCH) {
    console.log(`🎬 Patching: ${film.title}`)

    // Get poster path from TMDb
    const details = await tmdb(`/movie/${film.tmdbId}`)
    if (!details.poster_path) {
      console.log(`⚠️  TMDb has no poster for "${film.title}" yet`)
      continue
    }

    const posterUrl = `https://image.tmdb.org/t/p/original${details.poster_path}`
    console.log(`   Poster URL: ${posterUrl}`)

    // Update in Supabase by title
    await sb(`/movies?title=eq.${encodeURIComponent(film.title)}`, {
      method: 'PATCH',
      body: JSON.stringify({ poster_url: posterUrl }),
    })

    console.log(`   ✅ Updated successfully\n`)
  }

  console.log('Done! Refresh your site to see the posters.')
}

run().catch((err) => {
  console.error('\n❌ Error:', err.message)
  process.exit(1)
})
