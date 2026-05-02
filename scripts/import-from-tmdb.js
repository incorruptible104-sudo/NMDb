// =============================================================
// NMDb — Full TMDb Import Script
// Imports Nigerian films, cast & crew into your Supabase database
// from scratch. No existing data required.
//
// USAGE:
// Bulk import all Nigerian films:
//   node scripts/import-from-tmdb.js
//
// Import one specific film + all its cast/crew:
//   node scripts/import-from-tmdb.js --movie="A Tribe Called Judah"
//
// Import one specific person + link their credits:
//   node scripts/import-from-tmdb.js --person="Funke Akindele"
// ============================================================

// ⚠️  FILL THESE IN BEFORE RUNNING
const CONFIG = {
  TMDB_API_KEY: '4872c34ca25f19c6d1cd52294eb93f0b',
  SUPABASE_URL: 'https://mzndtfxsqlfjbbmulocu.supabase.co',
  SUPABASE_SERVICE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16bmR0ZnhzcWxmamJibXVsb2N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY5NTYxNywiZXhwIjoyMDkyMjcxNjE3fQ.ytLAAYCUm_C8txG5ZVc2Nn-cWIqmkNZtDC9DgNWzXiU',
}

// How many pages of films to pull in bulk mode (1 page = 20 films)
// Start with 5 to test. Raise to 25 once you're happy.
const MAX_PAGES = 50

// =============================================================
// DO NOT EDIT BELOW THIS LINE
// =============================================================

const fetch = (...args) =>
  import('node-fetch').then(({ default: f }) => f(...args))

const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w500'

const JOB_TO_ROLE = {
  'Director': 'Director',
  'Co-Director': 'Co-Director',
  'Screenplay': 'Screenplay Writer',
  'Writer': 'Writer',
  'Original Story': 'Story Developer',
  'Story': 'Story Developer',
  'Producer': 'Producer',
  'Executive Producer': 'Executive Producer',
  'Line Producer': 'Line Producer',
  'Associate Producer': 'Associate Producer',
  'Director of Photography': 'Director of Photography',
  'Cinematographer': 'Cinematographer',
  'Editor': 'Editor',
  'Original Music Composer': 'Composer',
  'Sound Designer': 'Sound Designer',
  'Music Supervisor': 'Music Supervisor',
  'Production Designer': 'Production Designer',
  'Art Direction': 'Art Director',
  'Costume Design': 'Costume Designer',
  'Makeup Artist': 'Makeup Artist',
  'Visual Effects Supervisor': 'VFX Artist',
  'Casting': 'Casting Director',
}

const GENRE_MAP = {
  28: 'Action', 35: 'Comedy', 18: 'Drama', 53: 'Thriller',
  10749: 'Romance', 27: 'Horror', 99: 'Documentary', 16: 'Animation',
  80: 'Crime', 10751: 'Family', 9648: 'Mystery', 36: 'Biography',
  10402: 'Musical', 878: 'Sci-Fi',
}

// ── Utilities ─────────────────────────────────────────────────

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }
function log(emoji, msg) { console.log(`${emoji}  ${msg}`) }

// ── TMDb calls ────────────────────────────────────────────────

async function tmdb(path) {
  const sep = path.includes('?') ? '&' : '?'
  const res = await fetch(`${TMDB_BASE}${path}${sep}api_key=${CONFIG.TMDB_API_KEY}`)
  if (!res.ok) throw new Error(`TMDb ${res.status}: ${path}`)
  return res.json()
}

async function discoverNigerianFilms() {
  const films = []
  log('🌍', 'Discovering Nigerian films on TMDb...')
  for (let page = 1; page <= MAX_PAGES; page++) {
    const data = await tmdb(`/discover/movie?with_origin_country=NG&sort_by=popularity.desc&page=${page}`)
    films.push(...data.results)
    process.stdout.write(`   Page ${page}/${Math.min(MAX_PAGES, data.total_pages)} — ${films.length} films so far\r`)
    if (page >= data.total_pages) break
    await sleep(300)
  }
  console.log(`\n   ✅ ${films.length} films to process\n`)
  return films
}

async function searchFilm(title) {
  const data = await tmdb(`/search/movie?query=${encodeURIComponent(title)}`)
  return data.results || []
}

async function searchPerson(name) {
  const data = await tmdb(`/search/person?query=${encodeURIComponent(name)}`)
  return data.results || []
}

async function getFilmDetails(id) { return tmdb(`/movie/${id}`) }
async function getFilmCredits(id) { return tmdb(`/movie/${id}/credits`) }
async function getPersonDetails(id) { return tmdb(`/person/${id}`) }
async function getPersonFilmCredits(id) { return tmdb(`/person/${id}/movie_credits`) }

// ── Supabase calls ────────────────────────────────────────────

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

// ── Builders — TMDb data → your schema ───────────────────────

function buildMovieRow(details) {
  const genres = (details.genres || []).map((g) => GENRE_MAP[g.id]).filter(Boolean)
  return {
    title: details.title,
    tagline: details.tagline || null,
    synopsis: details.overview || null,
    release_date: details.release_date || null,
    runtime: details.runtime || null,
    country: 'Nigeria',
    genre: genres.length > 0 ? genres : null,
    production_company: details.production_companies?.[0]?.name || null,
    poster_url: details.poster_path ? `${TMDB_IMAGE}${details.poster_path}` : null,
    // Fields you fill in manually via admin:
    release_type: null,
    language: null,
    classification: null,
    nmdb_meter: null,
    trailer_url: null,
    is_holiday_blockbuster: false,
    status: 'Released',
  }
}

function buildPersonRow(tmdbPerson, primaryRole) {
  return {
    full_name: tmdbPerson.name,
    primary_role: primaryRole,
    nationality: 'Nigerian',
    bio: tmdbPerson.biography || null,
    date_of_birth: tmdbPerson.birthday || null,
    photo_url: tmdbPerson.profile_path ? `${TMDB_IMAGE}${tmdbPerson.profile_path}` : null,
  }
}

function getRoleFromDepartment(dept) {
  const map = { Acting: 'Actor', Directing: 'Director', Writing: 'Writer', Production: 'Producer' }
  return map[dept] || 'Actor'
}

// ── Core processors ───────────────────────────────────────────

async function processPerson(tmdbBasic, roleType, movieId, characterName, existingPeople, existingCredits, counters) {
  if (!tmdbBasic.name) return
  const nameKey = tmdbBasic.name.toLowerCase().trim()

  // Create person if new
  let personId = existingPeople.get(nameKey)
  if (!personId) {
    try {
      let details = tmdbBasic
      if (tmdbBasic.id) {
        try { details = await getPersonDetails(tmdbBasic.id); await sleep(120) } catch (e) {}
      }
      personId = await createPerson(buildPersonRow(details, roleType))
      existingPeople.set(nameKey, personId)
      log('👤', `Imported: ${tmdbBasic.name} → ${roleType}`)
      counters.peopleCreated++
    } catch (e) {
      log('⚠️ ', `Skipped ${tmdbBasic.name}: ${e.message}`)
      return
    }
  } else {
    counters.peopleSkipped++
  }

  // Link credit if movieId provided and credit doesn't already exist
  if (movieId) {
    const key = `${movieId}:${personId}:${roleType}`
    if (!existingCredits.has(key)) {
      try {
        await createCredit({ movie_id: movieId, person_id: personId, role_type: roleType, character_name: characterName })
        existingCredits.add(key)
        counters.creditsCreated++
      } catch (e) {
        counters.creditsSkipped++
      }
    }
  }
}

async function processFilm(tmdbFilm, existingMovies, existingPeople, existingCredits, counters) {
  const titleKey = tmdbFilm.title.toLowerCase().trim()

  // Fetch full details
  let details
  try { details = await getFilmDetails(tmdbFilm.id) }
  catch (e) { log('⚠️ ', `No details for "${tmdbFilm.title}"`); return }

  // Create movie if new
  let movieId = existingMovies.get(titleKey)
  if (!movieId) {
    try {
      movieId = await createMovie(buildMovieRow(details))
      existingMovies.set(titleKey, movieId)
      log('🎬', `Created: ${details.title} (${details.release_date?.slice(0, 4) || '?'})`)
      counters.moviesCreated++
    } catch (e) {
      log('⚠️ ', `Failed to create "${tmdbFilm.title}": ${e.message}`)
      return
    }
  } else {
    log('⏭ ', `Exists: ${details.title}`)
    counters.moviesSkipped++
  }

  // Fetch and process credits
  let credits
  try { credits = await getFilmCredits(tmdbFilm.id) }
  catch (e) { log('⚠️ ', `No credits for "${tmdbFilm.title}"`); return }

  for (const actor of credits.cast || []) {
    await processPerson(actor, 'Actor', movieId, actor.character || null, existingPeople, existingCredits, counters)
    await sleep(50)
  }

  for (const crew of credits.crew || []) {
    const role = JOB_TO_ROLE[crew.job]
    if (!role) continue
    await processPerson(crew, role, movieId, null, existingPeople, existingCredits, counters)
    await sleep(50)
  }
}

// ── Main ──────────────────────────────────────────────────────

async function run() {
  console.log('\n' + '='.repeat(55))
  console.log('  NMDb × TMDb Full Import')
  console.log('='.repeat(55) + '\n')

  // Validate config
  for (const [key, val] of Object.entries(CONFIG)) {
    if (val.includes('paste')) {
      console.error(`❌ CONFIG.${key} is not filled in. Open this file and add your credentials.\n`)
      process.exit(1)
    }
  }

  const args = process.argv.slice(2)
  const movieFlag = args.find((a) => a.startsWith('--movie='))?.replace('--movie=', '')
  const personFlag = args.find((a) => a.startsWith('--person='))?.replace('--person=', '')

  // Load what's already in your database
  log('📂', 'Loading existing NMDb data...')
  const [existingMovies, existingPeople, existingCredits] = await Promise.all([
    loadExistingMovies(),
    loadExistingPeople(),
    loadExistingCredits(),
  ])
  log('📂', `${existingMovies.size} movies · ${existingPeople.size} people · ${existingCredits.size} credits already in NMDb\n`)

  const counters = { moviesCreated: 0, moviesSkipped: 0, peopleCreated: 0, peopleSkipped: 0, creditsCreated: 0, creditsSkipped: 0 }

  // ── MODE 1: One specific person ──
  if (personFlag) {
    log('🎯', `Searching for person: "${personFlag}"`)
    const results = await searchPerson(personFlag)
    if (!results.length) { console.error(`❌ "${personFlag}" not found on TMDb`); process.exit(1) }

    const tmdbPerson = results[0]
    const fullDetails = await getPersonDetails(tmdbPerson.id)
    const primaryRole = getRoleFromDepartment(fullDetails.known_for_department)

    log('👤', `Found: ${fullDetails.name} — known for ${fullDetails.known_for_department}`)
    await processPerson(fullDetails, primaryRole, null, null, existingPeople, existingCredits, counters)

    // Link to any of their films already in your database
    log('🔗', 'Linking their credits to existing NMDb films...')
    const filmCredits = await getPersonFilmCredits(tmdbPerson.id)
    const allFilmRoles = [
      ...(filmCredits.cast || []).map((f) => ({ ...f, derivedRole: 'Actor', character: f.character })),
      ...(filmCredits.crew || []).map((f) => ({ ...f, derivedRole: JOB_TO_ROLE[f.job] })),
    ]

    for (const film of allFilmRoles) {
      if (!film.title || !film.derivedRole) continue
      const movieId = existingMovies.get(film.title.toLowerCase().trim())
      if (!movieId) continue
      const personId = existingPeople.get(fullDetails.name.toLowerCase().trim())
      if (!personId) continue
      const key = `${movieId}:${personId}:${film.derivedRole}`
      if (!existingCredits.has(key)) {
        try {
          await createCredit({ movie_id: movieId, person_id: personId, role_type: film.derivedRole, character_name: film.character || null })
          existingCredits.add(key)
          counters.creditsCreated++
          log('🔗', `Linked → ${film.title} as ${film.derivedRole}`)
        } catch (e) { counters.creditsSkipped++ }
      }
      await sleep(100)
    }
  }

  // ── MODE 2: One specific film ──
  else if (movieFlag) {
    log('🎯', `Searching for film: "${movieFlag}"`)
    const results = await searchFilm(movieFlag)
    if (!results.length) { console.error(`❌ "${movieFlag}" not found on TMDb`); process.exit(1) }
    log('🎬', `Found: ${results[0].title}`)
    await processFilm(results[0], existingMovies, existingPeople, existingCredits, counters)
  }

  // ── MODE 3: Bulk — all Nigerian films ──
  else {
    const films = await discoverNigerianFilms()
    for (let i = 0; i < films.length; i++) {
      console.log(`\n[${i + 1}/${films.length}] ${films[i].title}`)
      await processFilm(films[i], existingMovies, existingPeople, existingCredits, counters)
      await sleep(500)
    }
  }

  // Summary
  console.log('\n' + '='.repeat(55))
  console.log('✅ Import Complete!')
  console.log('='.repeat(55))
  console.log(`\n  🎬 Films created:   ${counters.moviesCreated}`)
  console.log(`  ⏭  Films skipped:   ${counters.moviesSkipped}`)
  console.log(`  👤 People created:  ${counters.peopleCreated}`)
  console.log(`  ⏭  People skipped:  ${counters.peopleSkipped}`)
  console.log(`  🔗 Credits linked:  ${counters.creditsCreated}`)
  console.log(`  ⏭  Credits skipped: ${counters.creditsSkipped}`)
  console.log('\n  Go to Supabase → Table Editor to review imports.')
  console.log('  Fill in these fields via your admin edit pages:')
  console.log('  release_type · language · classification · trailer_url · nmdb_meter\n')
}

run().catch((err) => {
  console.error('\n❌ Script crashed:', err.message)
  process.exit(1)
})
