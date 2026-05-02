// =============================================================
// NMDb — Check & Import 2025 Cinema Films from TMDb
// Searches each film on TMDb, reports findings, imports matches
//
// Run with: node scripts/import-2025-cinema.js
// =============================================================

const CONFIG = {
  TMDB_API_KEY: '4872c34ca25f19c6d1cd52294eb93f0b',
  SUPABASE_URL: 'https://mzndtfxsqlfjbbmulocu.supabase.co',
  SUPABASE_SERVICE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16bmR0ZnhzcWxmamJibXVsb2N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY5NTYxNywiZXhwIjoyMDkyMjcxNjE3fQ.ytLAAYCUm_C8txG5ZVc2Nn-cWIqmkNZtDC9DgNWzXiU',
}
// The 11 films to check — with their known box office figures
const FILMS = [
  { title: 'The Return of Arinzo', releaseYear: 2025, boxOffice: 226000000 },
  { title: 'Onobiren',             releaseYear: 2025, boxOffice: 138000000 },
  { title: "Mother's Love",        releaseYear: 2026, boxOffice: 100000000 },
  { title: 'Trade By Bata',        releaseYear: 2026, boxOffice: 52800000  },
  { title: 'Aba Blues',            releaseYear: 2025, boxOffice: 48600000  },
  { title: 'The Other Side of the Bridge', releaseYear: 2023, boxOffice: 45000000 },
  { title: 'Evi',                  releaseYear: 2026, boxOffice: 30600000  },
  { title: 'Avante',               releaseYear: 2025, boxOffice: 28200000  },
  { title: "My Father's Shadow",   releaseYear: 2025, boxOffice: 15800000  },
  { title: '180',                  releaseYear: 2025, boxOffice: 11400000  },
  { title: 'A Spark in the Dark',  releaseYear: 2025, boxOffice: 8200000   },
]

// =============================================================
const fetch = (...args) =>
  import('node-fetch').then(({ default: f }) => f(...args))

const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMAGE = 'https://image.tmdb.org/t/p/original'

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

async function searchFilm(title, year) {
  // Try with year first for precision
  const withYear = await tmdb(`/search/movie?query=${encodeURIComponent(title)}&year=${year}`)
  if (withYear.results?.length) return withYear.results

  // Fall back to without year
  const withoutYear = await tmdb(`/search/movie?query=${encodeURIComponent(title)}`)
  return withoutYear.results || []
}

async function getFilmDetails(id) { return tmdb(`/movie/${id}`) }
async function getFilmCredits(id) { return tmdb(`/movie/${id}/credits`) }
async function getPersonDetails(id) { return tmdb(`/person/${id}`) }

// ── Supabase ──────────────────────────────────────────────────

async function sb(path, options = {}, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
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
    } catch (e) {
      if (attempt === retries) throw e
      await sleep(2000 * attempt)
    }
  }
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

async function loadExistingBoxOffice() {
  const rows = await sb('/box_office?select=movie_id&limit=10000')
  const set = new Set()
  for (const r of rows) set.add(r.movie_id)
  return set
}

async function createMovie(data) {
  const rows = await sb('/movies', { method: 'POST', body: JSON.stringify(data) })
  return Array.isArray(rows) ? rows[0].id : rows.id
}

async function updateMovie(id, data) {
  await sb(`/movies?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
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

async function upsertBoxOffice(movieId, total, existingBoxOffice) {
  if (existingBoxOffice.has(movieId)) {
    await sb(`/box_office?movie_id=eq.${movieId}`, {
      method: 'PATCH',
      body: JSON.stringify({ total_nigeria: total }),
      prefer: 'return=minimal',
    })
  } else {
    await sb('/box_office', {
      method: 'POST',
      body: JSON.stringify({ movie_id: movieId, total_nigeria: total }),
      prefer: 'return=minimal',
    })
    existingBoxOffice.add(movieId)
  }
}

// ── Main ──────────────────────────────────────────────────────

async function run() {
  console.log('\n' + '='.repeat(55))
  console.log('  NMDb — 2025 Cinema Films TMDb Check & Import')
  console.log('='.repeat(55) + '\n')

  for (const [key, val] of Object.entries(CONFIG)) {
    if (val.includes('paste')) {
      console.error(`❌ CONFIG.${key} not filled in.\n`)
      process.exit(1)
    }
  }

  log('📂', 'Loading existing NMDb data...')
  const [existingMovies, existingPeople, existingCredits, existingBoxOffice] = await Promise.all([
    loadExistingMovies(),
    loadExistingPeople(),
    loadExistingCredits(),
    loadExistingBoxOffice(),
  ])
  log('📂', `${existingMovies.size} movies · ${existingPeople.size} people already in NMDb\n`)

  const results = {
    foundOnTmdb: [],
    notOnTmdb: [],
    imported: 0,
    updated: 0,
    peopleCreated: 0,
    creditsLinked: 0,
  }

  for (const film of FILMS) {
    console.log(`\n${'─'.repeat(55)}`)
    log('🔍', `Searching TMDb: "${film.title}" (${film.releaseYear})`)

    let tmdbResults
    try {
      tmdbResults = await searchFilm(film.title, film.releaseYear)
      await sleep(300)
    } catch (e) {
      log('⚠️ ', `TMDb search failed: ${e.message}`)
      results.notOnTmdb.push({ title: film.title, reason: 'Search failed' })
      continue
    }

    if (!tmdbResults.length) {
      log('❌', `NOT FOUND on TMDb: "${film.title}"`)
      results.notOnTmdb.push({ title: film.title, reason: 'Not on TMDb' })

      // Still add to database with what we know
      const titleKey = film.title.toLowerCase().trim()
      let movieId = existingMovies.get(titleKey)
      if (!movieId) {
        try {
          movieId = await createMovie({
            title: film.title,
            release_date: `${film.releaseYear}-01-01`,
            country: 'Nigeria',
            release_type: 'Cinema',
            in_cinemas: true,
            status: 'Released',
            content_type: 'Movie',
            poster_url: null,
            synopsis: null,
            genre: null,
            language: null,
            classification: null,
            nmdb_meter: null,
            trailer_url: null,
            is_holiday_blockbuster: false,
          })
          existingMovies.set(titleKey, movieId)
          log('➕', `Added to NMDb without TMDb data`)
        } catch (e) {
          log('⚠️ ', `Failed to add: ${e.message}`)
          continue
        }
      }
      await upsertBoxOffice(movieId, film.boxOffice, existingBoxOffice)
      log('💰', `Box office set: ₦${film.boxOffice.toLocaleString()}`)
      continue
    }

    // Pick most relevant result — prefer Nigerian origin
    const best = tmdbResults.find(r => r.original_language === 'en' && r.release_date?.startsWith(String(film.releaseYear)))
      || tmdbResults[0]

    log('✅', `FOUND: "${best.title}" (${best.release_date?.slice(0, 4) || '?'}) — TMDb ID: ${best.id}`)
    results.foundOnTmdb.push({ title: film.title, tmdbTitle: best.title, tmdbId: best.id })

    // Get full details
    let details
    try {
      details = await getFilmDetails(best.id)
      await sleep(300)
    } catch (e) {
      log('⚠️ ', `Could not fetch details: ${e.message}`)
      continue
    }

    const genres = (details.genres || []).map(g => GENRE_MAP[g.id]).filter(Boolean)
    const titleKey = film.title.toLowerCase().trim()
    let movieId = existingMovies.get(titleKey)

    if (!movieId) {
      // Also check by TMDb title in case it's stored differently
      movieId = existingMovies.get(details.title.toLowerCase().trim())
    }

    if (!movieId) {
      // Create new film
      try {
        movieId = await createMovie({
          title: film.title, // use your title, not TMDb's
          tagline: details.tagline || null,
          synopsis: details.overview || null,
          release_date: details.release_date || `${film.releaseYear}-01-01`,
          runtime: details.runtime || null,
          country: 'Nigeria',
          genre: genres.length ? genres : null,
          production_company: details.production_companies?.[0]?.name || null,
          poster_url: details.poster_path ? `${TMDB_IMAGE}${details.poster_path}` : null,
          release_type: 'Cinema',
          in_cinemas: true,
          status: 'Released',
          content_type: 'Movie',
          language: null,
          classification: null,
          nmdb_meter: null,
          trailer_url: null,
          is_holiday_blockbuster: false,
        })
        existingMovies.set(titleKey, movieId)
        log('🎬', `Created: ${film.title}`)
        results.imported++
      } catch (e) {
        log('⚠️ ', `Failed to create: ${e.message}`)
        continue
      }
    } else {
      // Update existing with TMDb data
      try {
        await updateMovie(movieId, {
          synopsis: details.overview || null,
          runtime: details.runtime || null,
          genre: genres.length ? genres : null,
          poster_url: details.poster_path ? `${TMDB_IMAGE}${details.poster_path}` : null,
          in_cinemas: true,
          status: 'Released',
        })
        log('🔄', `Updated existing: ${film.title}`)
        results.updated++
      } catch (e) {
        log('⚠️ ', `Failed to update: ${e.message}`)
      }
    }

    // Set box office
    await upsertBoxOffice(movieId, film.boxOffice, existingBoxOffice)
    log('💰', `Box office: ₦${film.boxOffice.toLocaleString()}`)

    // Import cast and crew
    let credits
    try {
      credits = await getFilmCredits(best.id)
      await sleep(300)
    } catch (e) {
      log('⚠️ ', `Could not fetch credits`)
      continue
    }

    log('👥', `Importing ${credits.cast?.length || 0} cast + ${credits.crew?.length || 0} crew...`)

    for (const actor of credits.cast || []) {
      if (!actor.name) continue
      const nameKey = actor.name.toLowerCase().trim()
      let personId = existingPeople.get(nameKey)

      if (!personId) {
        try {
          let fullDetails = actor
          if (actor.id) {
            try { fullDetails = await getPersonDetails(actor.id); await sleep(100) } catch (e) {}
          }
          personId = await createPerson({
            full_name: actor.name,
            primary_role: 'Actor',
            nationality: 'Nigerian',
            bio: fullDetails.biography || null,
            date_of_birth: fullDetails.birthday || null,
            photo_url: actor.profile_path ? `${TMDB_IMAGE}${actor.profile_path}` : null,
          })
          existingPeople.set(nameKey, personId)
          results.peopleCreated++
        } catch (e) { continue }
      }

      const key = `${movieId}:${personId}:Actor`
      if (!existingCredits.has(key)) {
        try {
          await createCredit({ movie_id: movieId, person_id: personId, role_type: 'Actor', character_name: actor.character || null })
          existingCredits.add(key)
          results.creditsLinked++
        } catch (e) {}
      }
      await sleep(100)
    }

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
          results.peopleCreated++
        } catch (e) { continue }
      }

      const key = `${movieId}:${personId}:${role}`
      if (!existingCredits.has(key)) {
        try {
          await createCredit({ movie_id: movieId, person_id: personId, role_type: role, character_name: null })
          existingCredits.add(key)
          results.creditsLinked++
        } catch (e) {}
      }
      await sleep(100)
    }

    await sleep(500)
  }

  // Final report
  console.log('\n' + '='.repeat(55))
  console.log('✅ Done!')
  console.log('='.repeat(55))
  console.log(`\n  🎬 Films created:    ${results.imported}`)
  console.log(`  🔄 Films updated:    ${results.updated}`)
  console.log(`  👤 People created:   ${results.peopleCreated}`)
  console.log(`  🔗 Credits linked:   ${results.creditsLinked}`)

  console.log(`\n  ✅ Found on TMDb (${results.foundOnTmdb.length}):`)
  results.foundOnTmdb.forEach(f => console.log(`     ✓ ${f.title} → "${f.tmdbTitle}" (ID: ${f.tmdbId})`))

  console.log(`\n  ❌ Not on TMDb (${results.notOnTmdb.length}):`)
  results.notOnTmdb.forEach(f => console.log(`     - ${f.title}: ${f.reason}`))

  if (results.notOnTmdb.length) {
    console.log('\n  Films not on TMDb were still added to your database')
    console.log('  with box office data. Add posters manually via admin.')
  }

  console.log()
}

run().catch((err) => {
  console.error('\n❌ Crashed:', err.message)
  process.exit(1)
})
