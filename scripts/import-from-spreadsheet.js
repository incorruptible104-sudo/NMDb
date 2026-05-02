// =============================================================
// NMDb — Nollywood Spreadsheet Import Script
// Reads all 7 xlsx files and imports movies, directors
// and box office data into your Supabase database.
//
// USAGE (run from inside your nmdb project folder):
//   node scripts/import-from-spreadsheet.js
// =============================================================

// ⚠️  FILL THESE IN BEFORE RUNNING
const CONFIG = {
  SUPABASE_URL: 'https://mzndtfxsqlfjbbmulocu.supabase.co',
  SUPABASE_SERVICE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16bmR0ZnhzcWxmamJibXVsb2N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY5NTYxNywiZXhwIjoyMDkyMjcxNjE3fQ.ytLAAYCUm_C8txG5ZVc2Nn-cWIqmkNZtDC9DgNWzXiU',
}
// ⚠️  SET THIS to the folder where you put the 7 xlsx files
// If you put them in your nmdb project folder in a folder called "data":
const SPREADSHEETS_FOLDER = './data/spreadsheets'

// =============================================================
// DO NOT EDIT BELOW THIS LINE
// =============================================================

const fs = require('fs')
const path = require('path')
const XLSX = require('xlsx')
const fetch = (...args) =>
  import('node-fetch').then(({ default: f }) => f(...args))

// The 7 files and what year they cover
const FILES = [
  { filename: '2019 Nollywood Box Office Data.xlsx',      year: 2019 },
  { filename: 'Nollywood Film Data 2020.xlsx',            year: 2020 },
  { filename: '2021 Nollywood Theatrical Dataset.xlsx',   year: 2021 },
  { filename: 'Nollywood 2022 Theatrical Data.xlsx',      year: 2022 },
  { filename: 'Nollywood Box Office Yearbook 2023.xlsx',  year: 2023 },
  { filename: 'Nollywood Box Office 2024.xlsx',           year: 2024 },
  { filename: '2025 Nollywood Box Office Data.xlsx',      year: 2025 },
]

// ── Utilities ─────────────────────────────────────────────────

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }
function log(emoji, msg) { console.log(`${emoji}  ${msg}`) }

// Clean box office values — handles "187,000,000 (2020 only)" and similar
function parseBoxOffice(raw) {
  if (!raw) return null
  const str = String(raw).replace(/[^0-9.]/g, '')
  const num = parseFloat(str)
  return isNaN(num) ? null : num
}

// Split "Funke Akindele, JJC Skillz" into ["Funke Akindele", "JJC Skillz"]
function parseDirectors(raw) {
  if (!raw) return []
  return String(raw)
    .split(/,|\/|&/)
    .map((d) => d.trim())
    .filter((d) => d.length > 1)
}

// ── Supabase calls ────────────────────────────────────────────

async function sb(path_url, options = {}) {
  const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1${path_url}`, {
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
  if (!res.ok) throw new Error(`Supabase ${path_url}: ${text}`)
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

async function createBoxOffice(data) {
  await sb('/box_office', {
    method: 'POST',
    body: JSON.stringify(data),
    prefer: 'return=minimal',
  })
}

// ── Read spreadsheet ──────────────────────────────────────────

function readSpreadsheet(filepath) {
  const wb = XLSX.readFile(filepath)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { defval: null })
  return rows
}

// ── Main ──────────────────────────────────────────────────────

async function run() {
  console.log('\n' + '='.repeat(55))
  console.log('  NMDb — Nollywood Spreadsheet Import')
  console.log('='.repeat(55) + '\n')

  // Validate config
  for (const [key, val] of Object.entries(CONFIG)) {
    if (val.includes('paste')) {
      console.error(`❌ CONFIG.${key} is not filled in.\n`)
      process.exit(1)
    }
  }

  // Check spreadsheet folder exists
  if (!fs.existsSync(SPREADSHEETS_FOLDER)) {
    console.error(`❌ Spreadsheet folder not found: ${SPREADSHEETS_FOLDER}`)
    console.error('   Create the folder and put your 7 xlsx files inside it.\n')
    process.exit(1)
  }

  // Load existing data
  log('📂', 'Loading existing NMDb data...')
  const [existingMovies, existingPeople, existingCredits, existingBoxOffice] = await Promise.all([
    loadExistingMovies(),
    loadExistingPeople(),
    loadExistingCredits(),
    loadExistingBoxOffice(),
  ])
  log('📂', `${existingMovies.size} movies · ${existingPeople.size} people · ${existingCredits.size} credits already in NMDb\n`)

  const counters = {
    moviesCreated: 0,
    moviesSkipped: 0,
    peopleCreated: 0,
    peopleSkipped: 0,
    creditsCreated: 0,
    boxOfficeCreated: 0,
    errors: [],
  }

  // Process each file
  for (const { filename, year } of FILES) {
    const filepath = path.join(SPREADSHEETS_FOLDER, filename)

    if (!fs.existsSync(filepath)) {
      log('⚠️ ', `File not found, skipping: ${filename}`)
      continue
    }

    console.log(`\n${'─'.repeat(55)}`)
    log('📅', `Processing ${year} — ${filename}`)
    console.log('─'.repeat(55))

    let rows
    try {
      rows = readSpreadsheet(filepath)
    } catch (e) {
      log('❌', `Could not read ${filename}: ${e.message}`)
      continue
    }

    log('📊', `${rows.length} films found in this file\n`)

    for (const row of rows) {
      // Get values — handle slight column name variations across files
      const title = row['Movie Title'] || row['Title'] || row['MOVIE TITLE']
      const directorRaw = row['Director'] || row['Directors'] || row['DIRECTOR']
      const studio = row['Lead Studio'] || row['Studio'] || row['Production Company']
      const grossRaw = row['Domestic Gross (₦)'] || row['Total Cumulative Gross (₦)'] || row['Box Office']

      if (!title) continue

      const titleKey = title.toLowerCase().trim()
      const boxOfficeAmount = parseBoxOffice(grossRaw)
      const directors = parseDirectors(directorRaw)

      // ── Create movie if it doesn't exist ──
      let movieId = existingMovies.get(titleKey)

      if (!movieId) {
        try {
          movieId = await createMovie({
            title: title.trim(),
            release_date: `${year}-01-01`, // Jan 1 of that year — update via admin
            production_company: studio ? studio.trim() : null,
            country: 'Nigeria',
            release_type: 'Cinema', // all spreadsheet films are cinema releases
            status: 'Released',
            // Fields to fill in via admin:
            tagline: null,
            synopsis: null,
            runtime: null,
            genre: null,
            language: null,
            classification: null,
            nmdb_meter: null,
            trailer_url: null,
            poster_url: null,
            is_holiday_blockbuster: false,
          })
          existingMovies.set(titleKey, movieId)
          log('🎬', `Created: ${title} (${year})`)
          counters.moviesCreated++
        } catch (e) {
          log('⚠️ ', `Failed to create "${title}": ${e.message}`)
          counters.errors.push({ film: title, error: e.message })
          continue
        }
      } else {
        log('⏭ ', `Exists: ${title}`)
        counters.moviesSkipped++
      }

      // ── Create box office record ──
      if (boxOfficeAmount && !existingBoxOffice.has(movieId)) {
        try {
          await createBoxOffice({
            movie_id: movieId,
            total_nigeria: boxOfficeAmount,
            // Other box office fields filled in via admin
          })
          existingBoxOffice.add(movieId)
          counters.boxOfficeCreated++
        } catch (e) {
          log('⚠️ ', `Box office failed for "${title}": ${e.message}`)
        }
      }

      // ── Create directors + link credits ──
      for (const directorName of directors) {
        if (!directorName) continue
        const nameKey = directorName.toLowerCase().trim()

        // Create person if new
        let personId = existingPeople.get(nameKey)
        if (!personId) {
          try {
            personId = await createPerson({
              full_name: directorName,
              primary_role: 'Director',
              nationality: 'Nigerian',
              bio: null,
              date_of_birth: null,
              photo_url: null,
            })
            existingPeople.set(nameKey, personId)
            log('👤', `Imported director: ${directorName}`)
            counters.peopleCreated++
          } catch (e) {
            log('⚠️ ', `Failed to create "${directorName}": ${e.message}`)
            continue
          }
        } else {
          counters.peopleSkipped++
        }

        // Link director credit
        const creditKey = `${movieId}:${personId}:Director`
        if (!existingCredits.has(creditKey)) {
          try {
            await createCredit({
              movie_id: movieId,
              person_id: personId,
              role_type: 'Director',
              character_name: null,
            })
            existingCredits.add(creditKey)
            counters.creditsCreated++
          } catch (e) {
            log('⚠️ ', `Credit failed: ${directorName} → ${title}`)
          }
        }

        await sleep(80)
      }

      await sleep(150)
    }
  }

  // ── Summary ──
  console.log('\n' + '='.repeat(55))
  console.log('✅ Import Complete!')
  console.log('='.repeat(55))
  console.log(`\n  🎬 Films created:        ${counters.moviesCreated}`)
  console.log(`  ⏭  Films skipped:        ${counters.moviesSkipped}`)
  console.log(`  👤 Directors imported:   ${counters.peopleCreated}`)
  console.log(`  ⏭  Directors skipped:    ${counters.peopleSkipped}`)
  console.log(`  🔗 Credits linked:       ${counters.creditsCreated}`)
  console.log(`  💰 Box office records:   ${counters.boxOfficeCreated}`)

  if (counters.errors.length > 0) {
    console.log(`\n  ⚠️  ${counters.errors.length} errors:`)
    counters.errors.forEach((e) => console.log(`     - ${e.film}: ${e.error}`))
  }

  console.log('\n  Next steps in your NMDb admin:')
  console.log('  → Add posters (via edit movie page)')
  console.log('  → Set exact release dates (currently Jan 1 of each year)')
  console.log('  → Add synopses, trailers, genre, language, classification')
  console.log('  → Then run import-from-tmdb.js to add cast to these films\n')
}

run().catch((err) => {
  console.error('\n❌ Script crashed:', err.message)
  process.exit(1)
})
