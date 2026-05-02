// =============================================================
// NMDb — Pull Current Cinema Films from TMDb
// Fetches specific films, imports them (or updates existing ones),
// marks them as in_cinemas = true, and pulls their cast/crew.
//
// Run with: node scripts/import-cinema-now.js
// =============================================================

// ⚠️  FILL THESE IN
const CONFIG = {
  TMDB_API_KEY: '4872c34ca25f19c6d1cd52294eb93f0b',
  SUPABASE_URL: 'https://mzndtfxsqlfjbbmulocu.supabase.co',
  SUPABASE_SERVICE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16bmR0ZnhzcWxmamJibXVsb2N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY5NTYxNywiZXhwIjoyMDkyMjcxNjE3fQ.ytLAAYCUm_C8txG5ZVc2Nn-cWIqmkNZtDC9DgNWzXiU',
}

// ⚠️  The 3 films currently in Nigerian cinemas
// Use tmdbId for precise matching, title as fallback search
const CINEMA_FILMS = [
  { title: 'The Other Side of the Bridge', tmdbId: null },
  { title: 'Aba Blues',                    tmdbId: null },
  { title: 'Evi',                          tmdbId: 1659486 },
]

// =============================================================
// DO NOT EDIT BELOW THIS LINE
// =============================================================

const fetch = (...args) =>
  import('node-fetch').then(({ default: f }) => f(...args))

const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w500'

const JOB_TO_ROLE = {
  'Director': 'Director', 'Co-Director': 'Co-Director',
  'Screenplay': 'Screenplay Writer', 'Writer': 'Writer',
  'Original Story': 'Story Developer', 'Story': 'Story Developer',
  'Producer': 'Producer', 'Executive Producer': 'Executive Producer',
  'Line Producer': 'Line Producer', 'Associate Producer': 'Associate Producer',
  'Director of Photography': 'Director of Photography',
  'Cinematographer': 'Cinematographer', 'Editor': 'Editor',
  'Original Music Composer': 'Composer', 'Sound Designer': 'Sound Designer',
  'Music Supervisor': 'Music Supervisor', 'Production Designer': 'Production Designer',
  'Art Direction': 'Art Director', 'Costume Design': 'Costume Designer',
  'Makeup Artist': 'Makeup Artist', 'Visual Effects Supervisor': 'VFX Artist',
  'Casting': 'Casting Director',
}

const GENRE_MAP = {
  28: 'Action', 35: 'Comedy', 18: 'Drama', 53: 'Thriller',
  10749: 'Romance', 27: 'Horror', 99: 'Documentary', 16: 'Animation',
  80: 'Crime', 10751: 'Family', 9648: 'Mystery', 36: 'Biography',
  10402: 'Musical', 878: 'Sci-Fi',
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }
function log(emoji, msg) { console.log(`${emoji}  ${msg}`) }

// ── TMDb ──────────────────────────────────────────────────────

async function tmdb(path) {
  const sep = path.includes('?') ? '&' : '?'
  const res = await fetch(`${TMDB_BASE}${path}${sep}api_key=${CONFIG.TMDB_API_KEY}`)
  if (!res.ok) throw new Error(`TMDb ${res.status}: ${path}`)
  return res.json()
}

async function searchFilm(title) {
  const data = await tmdb(`/search/movie?query=${encodeURIComponent(title)}&region=NG`)
  // Also try without region if no results
  if (!data.results?.length) {
    const data2 = await tmdb(`/search/movie?query=${encodeURIComponent(title)}`)
    return data2.results || []
  }
  return data.results || []
}

async function getFilmDetails(id) { return tmdb(`/movie/${id}`) }
async function getFilmCredits(id) { return tmdb(`/movie/${id}/credits`) }
async function getPersonDetails(id) { return tmdb(`/person/${id}`) }

// ── Supabase ──────────────────────────────────────────────────

async function sb(path, options = {}) {
  const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      apikey: CONFIG.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${CONFIG.SUPABASE_SERVICE_KEY}`,
      Prefer: options.prefer || 'return=representation',
      ...options.headers,
    },
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Supabase ${path}: ${text}`)
  return text ? JSON.parse(text) : null
}

async function loadExistingMovies() {
  const rows = await sb('/movies?select=id,title&limit=10000')
  const map = new Map()
  for (const r of rows) map.set(r.title.toLowerCase().trim(), r.id)
  return map
}

async function loadExistingPeople() {
  const rows = await sb('/people?select=id,full_name&limit=10000')
  const map = new Map()
  for (const r of rows) map.set(r.full_name.toLowerCase().trim(), r.id)
  return map
}

async function loadExistingCredits() {
  const rows = await sb('/movie_credits?select=movie_id,person_id,role_type&limit=50000')
  const set = new Set()
  for (const r of rows) set.add(`${r.movie_id}:${r.person_id}:${r.role_type}`)
  return set
}

async function createMovie(data) {
  const rows = await sb('/movies', { method: 'POST', body: JSON.stringify(data) })
  return Array.isArray(rows) ? rows[0].id : rows.id
}

async function markInCinemas(movieId) {
  await sb(`/movies?id=eq.${movieId}`, {
    method: 'PATCH',
    body: JSON.stringify({ in_cinemas: true, status: 'Released', release_type: 'Cinema' }),
    prefer: 'return=minimal',
  })
}

async function createPerson(data) {
  const rows = await sb('/people', { method: 'POST', body: JSON.stringify(data) })
  return Array.isArray(rows) ? rows[0].id : rows.id
}

async function createCredit(data) {
  await sb('/movie_credits', {
    method: 'POST',
    body: JSON.stringify(data),
    prefer: 'return=minimal',
  })
}

// ── Main ──────────────────────────────────────────────────────

async function run() {
  console.log('\n' + '='.repeat(55))
  console.log('  NMDb — Import Current Cinema Films')
  console.log('='.repeat(55) + '\n')

  for (const [key, val] of Object.entries(CONFIG)) {
    if (val.includes('paste')) {
      console.error(`❌ CONFIG.${key} is not filled in.\n`)
      process.exit(1)
    }
  }

  log('📂', 'Loading existing NMDb data...')
  const [existingMovies, existingPeople, existingCredits] = await Promise.all([
    loadExistingMovies(),
    loadExistingPeople(),
    loadExistingCredits(),
  ])
  log('📂', `${existingMovies.size} movies · ${existingPeople.size} people already in NMDb\n`)

  const counters = { created: 0, updated: 0, peopleCreated: 0, creditsLinked: 0 }

  for (const film of CINEMA_FILMS) {
    console.log(`\n${'─'.repeat(55)}`)
    log('🎯', `Processing: "${film.title}"`)

    let tmdbFilm

    if (film.tmdbId) {
      // Fetch directly by ID — guaranteed correct film
      log('🎯', `Using direct TMDb ID: ${film.tmdbId}`)
      tmdbFilm = { id: film.tmdbId, title: film.title }
    } else {
      // Search by title
      const results = await searchFilm(film.title)
      if (!results.length) {
        log('⚠️ ', `Not found on TMDb: "${film.title}" — add it manually`)
        continue
      }
      tmdbFilm = results[0]
    }

    log('🎬', `Found: ${tmdbFilm.title || film.title}`)

    // Get full details
    const details = await getFilmDetails(tmdbFilm.id)
    await sleep(300)

    const genres = (details.genres || []).map((g) => GENRE_MAP[g.id]).filter(Boolean)
    const titleKey = details.title.toLowerCase().trim()

    let movieId = existingMovies.get(titleKey)

    if (!movieId) {
      // Create the film
      movieId = await createMovie({
        title: details.title,
        tagline: details.tagline || null,
        synopsis: details.overview || null,
        release_date: details.release_date || null,
        runtime: details.runtime || null,
        country: 'Nigeria',
        genre: genres.length > 0 ? genres : null,
        production_company: details.production_companies?.[0]?.name || null,
        poster_url: details.poster_path
              ? `https://image.tmdb.org/t/p/original${details.poster_path}`
              : null,
        release_type: 'Cinema',
        in_cinemas: true,
        status: 'Released',
        language: null,
        classification: null,
        nmdb_meter: null,
        trailer_url: null,
        is_holiday_blockbuster: false,
      })
      existingMovies.set(titleKey, movieId)
      log('✅', `Created: ${details.title}`)
      counters.created++
    } else {
      // Film already exists — just mark it as in cinemas
      await markInCinemas(movieId)
      log('✅', `Updated: ${details.title} → marked as In Cinemas`)
      counters.updated++
    }

    // Pull cast and crew
    log('👥', 'Importing cast and crew...')
    const credits = await getFilmCredits(tmdbFilm.id)
    await sleep(300)

    // Cast
    for (const actor of credits.cast || []) {
      if (!actor.name) continue
      const nameKey = actor.name.toLowerCase().trim()
      let personId = existingPeople.get(nameKey)

      if (!personId) {
        try {
          let details = actor
          if (actor.id) {
            try { details = await getPersonDetails(actor.id); await sleep(100) } catch (e) {}
          }
          personId = await createPerson({
            full_name: actor.name,
            primary_role: 'Actor',
            nationality: 'Nigerian',
            bio: details.biography || null,
            date_of_birth: details.birthday || null,
            photo_url: actor.profile_path ? `${TMDB_IMAGE}${actor.profile_path}` : null,
          })
          existingPeople.set(nameKey, personId)
          log('👤', `Imported: ${actor.name} → Actor`)
          counters.peopleCreated++
        } catch (e) {
          log('⚠️ ', `Skipped ${actor.name}: ${e.message}`)
          continue
        }
      }

      const key = `${movieId}:${personId}:Actor`
      if (!existingCredits.has(key)) {
        try {
          await createCredit({ movie_id: movieId, person_id: personId, role_type: 'Actor', character_name: actor.character || null })
          existingCredits.add(key)
          counters.creditsLinked++
        } catch (e) {}
      }
      await sleep(60)
    }

    // Crew
    for (const crew of credits.crew || []) {
      if (!crew.name) continue
      const role = JOB_TO_ROLE[crew.job]
      if (!role) continue

      const nameKey = crew.name.toLowerCase().trim()
      let personId = existingPeople.get(nameKey)

      if (!personId) {
        try {
          personId = await createPerson({
            full_name: crew.name,
            primary_role: role,
            nationality: 'Nigerian',
            bio: null,
            date_of_birth: null,
            photo_url: crew.profile_path ? `${TMDB_IMAGE}${crew.profile_path}` : null,
          })
          existingPeople.set(nameKey, personId)
          log('👤', `Imported: ${crew.name} → ${role}`)
          counters.peopleCreated++
        } catch (e) {
          log('⚠️ ', `Skipped ${crew.name}: ${e.message}`)
          continue
        }
      }

      const key = `${movieId}:${personId}:${role}`
      if (!existingCredits.has(key)) {
        try {
          await createCredit({ movie_id: movieId, person_id: personId, role_type: role, character_name: null })
          existingCredits.add(key)
          counters.creditsLinked++
        } catch (e) {}
      }
      await sleep(60)
    }

    await sleep(500)
  }

  console.log('\n' + '='.repeat(55))
  console.log('✅ Done!')
  console.log('='.repeat(55))
  console.log(`\n  🎬 Films created:   ${counters.created}`)
  console.log(`  🔄 Films updated:   ${counters.updated} (marked as In Cinemas)`)
  console.log(`  👤 People created:  ${counters.peopleCreated}`)
  console.log(`  🔗 Credits linked:  ${counters.creditsLinked}`)
  console.log('\n  These films will now appear in your "Now In Cinemas" section.')
  console.log('  Add trailers and exact release dates via your admin edit pages.\n')
}

run().catch((err) => {
  console.error('\n❌ Script crashed:', err.message)
  process.exit(1)
})

// This is already included in the main run() above.
// The original size poster URL fix ensures posters are fetched correctly.
