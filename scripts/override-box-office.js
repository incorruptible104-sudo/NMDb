// =============================================================
// NMDb — Box Office Override Script
// Reads the master PDF data and updates/inserts box office
// figures for all 300 titles. Existing records are overwritten.
//
// Run with: node scripts/override-box-office.js
// =============================================================

const CONFIG = {
  SUPABASE_URL: 'https://mzndtfxsqlfjbbmulocu.supabase.co',
  SUPABASE_SERVICE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16bmR0ZnhzcWxmamJibXVsb2N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY5NTYxNywiZXhwIjoyMDkyMjcxNjE3fQ.ytLAAYCUm_C8txG5ZVc2Nn-cWIqmkNZtDC9DgNWzXiU',
}


// 300 unique titles from the master PDF (duplicates consolidated by summing)
const BOX_OFFICE_DATA = [
  { title: '4th Republic', total: 3200000 },
  { title: "A Father's Love", total: 310000 },
  { title: 'A Simple Lie', total: 27200000 },
  { title: 'A Tribe Called Judah', total: 1408277541 },
  { title: 'A Weekend to Forget', total: 26100000 },
  { title: 'Aba Blues', total: 134800000 },
  { title: 'Aburo', total: 4800000 },
  { title: 'Ada Omo Daddy', total: 218754222 },
  { title: 'Afamefuna', total: 28400000 },
  { title: 'Aki and Pawpaw', total: 113000000 },
  { title: 'Alakada Reloaded 2', total: 95600000 },
  { title: 'Alakada: Bad and Boujee', total: 500581650 },
  { title: 'Alter Date', total: 160000 },
  { title: 'Another Father\'s Day', total: 3500000 },
  { title: 'Aremu Olami', total: 9600000 },
  { title: 'Ayinla', total: 201500000 },
  { title: 'Ayinla 2', total: 110000 },
  { title: 'Bad Comments', total: 256900000 },
  { title: 'Bad Comments 2', total: 190000 },
  { title: 'Badamasi', total: 195000 },
  { title: 'Bank Alert', total: 750000 },
  { title: 'Battle on Buka Street', total: 670423056 },
  { title: 'Beast', total: 8900000 },
  { title: 'Behind The Scenes', total: 2759944506 },
  { title: 'Bigger than Dirt', total: 65000 },
  { title: 'Big Love', total: 41310000 },
  { title: 'Blind Spot', total: 880000 },
  { title: 'Blood & Oil', total: 190000 },
  { title: 'Breaded Life', total: 88000000 },
  { title: 'Breaded Life (Re-release)', total: 4300000 },
  { title: 'Breaded Life 2', total: 2900000 },
  { title: 'Broken Mask', total: 1170000 },
  { title: 'Broken Vows', total: 17200000 },
  { title: 'Brotherhood', total: 240320000 },
  { title: 'Chains', total: 260000 },
  { title: 'Choke', total: 8100000 },
  { title: 'Christmas in Miami', total: 265583000 },
  { title: 'Cold Feet', total: 7400000 },
  { title: 'Collision Course', total: 1700000 },
  { title: 'Collision Course 2', total: 1100000 },
  { title: 'Coming from Insanity', total: 31400000 },
  { title: 'Criminal', total: 1250000 },
  { title: 'Dark October', total: 2200000 },
  { title: 'Day of Destiny (DOD)', total: 32500000 },
  { title: 'Dear Affy', total: 39700000 },
  { title: 'Devil in Agbada', total: 90000 },
  { title: 'Devil in Agbada 2', total: 90000 },
  { title: 'Diamond in the Rough', total: 380000 },
  { title: 'Diamonds in the Sky', total: 8900000 },
  { title: 'Diiche', total: 5700000 },
  { title: 'Different Strokes', total: 44650350 },
  { title: 'Dinner at My Place', total: 50400000 },
  { title: "Don't Get Mad, Get Even", total: 6800000 },
  { title: 'Double Celebration', total: 8700000 },
  { title: 'Double Dekoi', total: 4200000 },
  { title: 'Double Trouble', total: 5900000 },
  { title: 'Dwindle', total: 303000000 },
  { title: 'Dwindle 2', total: 260000 },
  { title: 'Eagle Wings', total: 6800000 },
  { title: 'Echoes of Yesterday', total: 500000 },
  { title: 'Echoes of the Creek', total: 74500000 },
  { title: 'Egun', total: 160000 },
  { title: 'Elevator Baby', total: 45600000 },
  { title: 'Everybody Loves Jenifa', total: 1882553548 },
  { title: 'Eyimofe', total: 4100000 },
  { title: 'Eyimofe 2', total: 750000 },
  { title: 'Fate of Alakada', total: 113200000 },
  { title: 'Finding Home', total: 28200000 },
  { title: 'Finding Hubby 2', total: 15300000 },
  { title: 'Finding Messiah', total: 6100000 },
  { title: 'Fine Wine', total: 369400000 },
  { title: 'Fine Wine 2', total: 340000 },
  { title: 'Fix Us', total: 11400000 },
  { title: 'Flaws', total: 6800000 },
  { title: 'For Maria Ebun Pataki', total: 1100000 },
  { title: 'The Garden', total: 35000 },
  { title: 'Gingerrr', total: 522817952 },
  { title: 'Glamour Girls (Preview)', total: 19800000 },
  { title: 'God Calling', total: 580000 },
  { title: 'Gold Statue', total: 25400000 },
  { title: 'Gone', total: 980000 },
  { title: 'Gone 2', total: 160000 },
  { title: 'Hammer', total: 2500000 },
  { title: 'Head Over Bills', total: 3900000 },
  { title: 'Head Over Bills 2', total: 2500000 },
  { title: "Heaven's Hell", total: 510000 },
  { title: 'Hey You!', total: 25400000 },
  { title: 'Hidden Truth', total: 9600000 },
  { title: 'Hire a Woman', total: 50300000 },
  { title: 'Honey Money', total: 17600000 },
  { title: 'Hotel Labamba', total: 32800000 },
  { title: 'I Do Not Come To You By Chance', total: 1900000 },
  { title: "I'm in Love with My Best Friend", total: 2800000 },
  { title: 'Ijakumo', total: 15300000 },
  { title: 'Ijakumo (The Born Again Stripper)', total: 278496384 },
  { title: 'Ile Owo', total: 35600000 },
  { title: 'In Love Again', total: 1850000 },
  { title: 'Inside Life', total: 5735000 },
  { title: 'Inside Life 2', total: 3900000 },
  { title: 'Interstate', total: 2800000 },
  { title: 'Introducing the Kujus', total: 35200000 },
  { title: 'Iyalode', total: 306400000 },
  { title: 'Joba', total: 5100000 },
  { title: 'Jolly Roger', total: 2200000 },
  { title: 'Jolly Roger 2', total: 1400000 },
  { title: 'Kasanova', total: 35200000 },
  { title: 'Kesari', total: 78141600 },
  { title: 'Killing Jade', total: 1400000 },
  { title: 'King of Thieves (Agesinkole)', total: 224800000 },
  { title: 'Kizazi Moto', total: 40000 },
  { title: 'Kofa', total: 22100000 },
  { title: 'Knockout', total: 3900000 },
  { title: 'Kpali', total: 10800000 },
  { title: 'Kuvana', total: 220000 },
  { title: 'L.I.F.E', total: 5100000 },
  { title: 'La Femme Anjola', total: 484400000 },
  { title: 'La Femme Anjola 2', total: 420000 },
  { title: 'Labake Olododo', total: 155200000 },
  { title: 'Lagos Nights', total: 44200000 },
  { title: 'Lakatabu', total: 22800000 },
  { title: 'Lara and the Beat', total: 650000 },
  { title: 'Last Card', total: 1740000 },
  { title: 'Legend of Inikpi', total: 29800000 },
  { title: 'Let Karma', total: 390000 },
  { title: 'Levi', total: 1100000 },
  { title: 'Life and Dirt', total: 1150000 },
  { title: 'Light in the Dark', total: 950000 },
  { title: 'Living in Bondage: Breaking Free', total: 168770202 },
  { title: 'Locked', total: 4800000 },
  { title: 'Lockdown', total: 149600000 },
  { title: 'Lockdown 2', total: 130000 },
  { title: 'Looking for Baami', total: 880000 },
  { title: 'Love and Light', total: 405000 },
  { title: 'Love in Lagos', total: 12800000 },
  { title: 'Love in a Pandemic', total: 41523000 },
  { title: 'Love is War', total: 78500000 },
  { title: 'Loving Danielle', total: 300000 },
  { title: 'Made in Heaven', total: 1300000 },
  { title: 'Makate Must Sell', total: 15300000 },
  { title: 'Malaika', total: 303560325 },
  { title: 'Mamba\'s Diamond', total: 403800000 },
  { title: 'Market Square', total: 58100000 },
  { title: 'Meeting Funmi\'s Parents', total: 630000 },
  { title: 'Meeting My Ex', total: 6800000 },
  { title: 'Merry Men 2', total: 234505169 },
  { title: 'Merry Men 3: Nemesis', total: 118223738 },
  { title: 'Mimi', total: 2030000 },
  { title: 'Mio\'tan', total: 8060000 },
  { title: 'Mofe', total: 910000 },
  { title: 'Mokalik', total: 28900000 },
  { title: 'Money Miss Road', total: 6200000 },
  { title: 'Muri & Ko', total: 2200000 },
  { title: 'My Village People', total: 100530000 },
  { title: 'Namaste Wahala', total: 3800000 },
  { title: 'The New Patriots', total: 1610000 },
  { title: 'Nimbe', total: 19800000 },
  { title: "Nneka's Return", total: 630000 },
  { title: 'Nneka the Pretty Serpent', total: 804800000 },
  { title: 'Obara\'M', total: 32800000 },
  { title: 'Obey', total: 340000 },
  { title: 'Ogeere', total: 2260000 },
  { title: 'Oga Bolaji', total: 2800000 },
  { title: 'Office Hours', total: 7600000 },
  { title: 'Offshoot', total: 480000 },
  { title: 'Olola Agbe', total: 7200000 },
  { title: 'Omo Ghetto: The Saga', total: 826129120 },
  { title: 'Omo Ghetto: The Saga (Re-release)', total: 3500000 },
  { title: 'On Your Own', total: 17500000 },
  { title: 'One Lagos Night', total: 1030000 },
  { title: 'One Night in Vegas', total: 220000 },
  { title: 'Onyegwu', total: 330000 },
  { title: 'Ordinary Fellows', total: 6200000 },
  { title: 'Ori: The Rebirth', total: 419600000 },
  { title: 'Orisa', total: 127891150 },
  { title: 'Orunsewa', total: 35200000 },
  { title: 'Our President\'s Money', total: 1500000 },
  { title: 'Oversabi Aunty', total: 1170000000 },
  { title: 'Owambe Thieves', total: 205600000 },
  { title: 'Palava!', total: 46900000 },
  { title: 'Passport', total: 86400000 },
  { title: 'Ponzi', total: 17500000 },
  { title: 'Progressive Tailors', total: 740000 },
  { title: 'Progressive Tailors Club', total: 220000 },
  { title: 'Prophetess', total: 131220000 },
  { title: 'Quam\'s Legacy', total: 540000 },
  { title: "Quam's Money", total: 669200000 },
  { title: 'Queen Lateefah', total: 365517443 },
  { title: 'Ratnik', total: 690000 },
  { title: 'Ratnik 2', total: 580000 },
  { title: 'Rattle Snake: The Ahanna Story', total: 50400000 },
  { title: 'Red Circle', total: 480000 },
  { title: 'Royal Wedding', total: 36400000 },
  { title: 'Sanitation Day', total: 574800000 },
  { title: 'Sanitation Day 2', total: 500000 },
  { title: 'Saving Onome', total: 3500000 },
  { title: 'Selina', total: 44200000 },
  { title: 'Seven', total: 17500000 },
  { title: 'Shadow Parties', total: 3800000 },
  { title: 'Shadow Parties 2', total: 50000 },
  { title: 'Shadows of Lagos', total: 102300000 },
  { title: 'She Is', total: 14200000 },
  { title: 'Silent Murder', total: 20000 },
  { title: 'Silent Scream', total: 950000 },
  { title: 'Silent Scream 2', total: 4500000 },
  { title: 'Sisi Rose', total: 19400000 },
  { title: 'Sista', total: 11400000 },
  { title: 'Small Chops', total: 37600000 },
  { title: 'Something Like Gold', total: 14200000 },
  { title: 'Soole', total: 49000000 },
  { title: 'Still Falling', total: 7600000 },
  { title: 'Strain', total: 1300000 },
  { title: 'Strain 2', total: 880000 },
  { title: 'Street Kid', total: 50000 },
  { title: 'Sugar Rush', total: 287053270 },
  { title: 'Suga Suga', total: 8400000 },
  { title: 'Survival of Jelili', total: 1925000 },
  { title: 'T-Junction', total: 10200000 },
  { title: 'Tainted Canvas', total: 70000 },
  { title: 'Tainted Canvas 2', total: 70000 },
  { title: 'Tanwa Savage', total: 5100000 },
  { title: 'The Awakening', total: 5220000 },
  { title: 'The Awakening 2', total: 6800000 },
  { title: 'The Beads', total: 2500000 },
  { title: 'The Beginning', total: 30000 },
  { title: 'The Betrayal', total: 100000 },
  { title: 'The Betrayal 2', total: 39800000 },
  { title: 'The Black Book', total: 48150000 },
  { title: 'The Bling Lagosians', total: 120100000 },
  { title: 'The Blood Covenant', total: 52100000 },
  { title: 'The Bloom Boys', total: 38400000 },
  { title: "The CEO's Daughter", total: 66400000 },
  { title: 'The Chance', total: 1250000 },
  { title: 'The Cleanser', total: 4200000 },
  { title: 'The Delivery Boy', total: 12900000 },
  { title: 'The Enemy I Know', total: 1700000 },
  { title: 'The Ghost & House of Truth', total: 2500000 },
  { title: 'The Ghost and the Tout', total: 440000 },
  { title: 'The Ghost and the Tout Too', total: 139260000 },
  { title: "The Ghost's Secret", total: 3980000 },
  { title: "The Governor's Wife", total: 118500000 },
  { title: 'The Guest', total: 190000 },
  { title: 'The Guest List', total: 25100000 },
  { title: 'The Hammer', total: 1600000 },
  { title: 'The Heir Apparent', total: 52900000 },
  { title: 'The Herbert Macaulay Affair', total: 8100000 },
  { title: 'The Island', total: 4300000 },
  { title: 'The Kujus Again', total: 53539950 },
  { title: 'The Last Man Standing', total: 250000 },
  { title: 'The Last Party', total: 188790000 },
  { title: 'The Last Stand', total: 8400000 },
  { title: 'The Legend', total: 690000 },
  { title: 'The Legend of Inikpi', total: 880000 },
  { title: 'The Man Died', total: 60000 },
  { title: 'The Man For the Job', total: 10800000 },
  { title: 'The Millions', total: 22100000 },
  { title: 'The Mirror', total: 1050000 },
  { title: 'The Mirror 2', total: 19800000 },
  { title: 'The Miracle Centre', total: 5900000 },
  { title: 'The Other Side of the Bridge', total: 12800000 },
  { title: "The Pataki Legacy", total: 810000 },
  { title: "The Perfect Arrangement", total: 12900000 },
  { title: "The Planter's Plantation", total: 3200000 },
  { title: "The Planter's Secret", total: 2100000 },
  { title: "The President's Cash", total: 950000 },
  { title: 'The Prophetess', total: 157610000 },
  { title: 'The Prophetess 2', total: 140000 },
  { title: 'The Prophetess 3', total: 460000 },
  { title: 'The Razz Guy', total: 12100000 },
  { title: 'The Razz Guy 2', total: 300000 },
  { title: 'The Secretary', total: 9400000 },
  { title: 'The Secretary 2', total: 31500000 },
  { title: 'The Set Up', total: 42900000 },
  { title: 'The Set Up 2', total: 48200000 },
  { title: 'The Silent Witness', total: 88200000 },
  { title: 'The Therapist', total: 3100000 },
  { title: 'The Trade', total: 30500000 },
  { title: 'The Trade 2', total: 15300000 },
  { title: 'The Vengeance', total: 3900000 },
  { title: 'The Wait', total: 9800000 },
  { title: 'The Wildflower', total: 28900000 },
  { title: 'Thin Line', total: 1950000 },
  { title: 'Three Thieves', total: 9600000 },
  { title: 'Tiger\'s Tail', total: 14200000 },
  { title: 'Two Weeks Notice', total: 1180000 },
  { title: 'Two Weeks in Lagos', total: 1900000 },
  { title: 'Under the Carpet', total: 15200000 },
  { title: 'Unbroken Ties', total: 48600000 },
  { title: 'Unforgivable', total: 580000 },
  { title: 'Up North (Crossover)', total: 750000 },
  { title: 'Village People', total: 22400000 },
  { title: 'Walking with Shadows', total: 5700000 },
  { title: 'Weather for Two', total: 7400000 },
  { title: 'What No One Knows', total: 80000 },
  { title: "Who's The Boss", total: 38500000 },
  { title: 'Wife Material', total: 120000 },
  { title: 'Your Excellency', total: 186340948 },
]

// =============================================================
const fetch = (...args) =>
  import('node-fetch').then(({ default: f }) => f(...args))

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }

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
      console.log(`\n   ⟳ Connection reset, retrying (${attempt}/${retries})...`)
      await sleep(2000 * attempt) // wait longer each retry
    }
  }
}

async function run() {
  console.log('\n' + '='.repeat(55))
  console.log('  NMDb — Box Office Override from Master PDF')
  console.log('='.repeat(55) + '\n')

  for (const [key, val] of Object.entries(CONFIG)) {
    if (val.includes('paste')) {
      console.error(`❌ CONFIG.${key} not filled in.\n`)
      process.exit(1)
    }
  }

  // Load all movies from database
  console.log('📂 Loading movies from NMDb...')
  const movies = await sb('/movies?select=id,title&limit=10000')
  const movieMap = new Map()
  for (const m of movies) movieMap.set(m.title.toLowerCase().trim(), m.id)
  console.log(`   ${movies.length} movies loaded\n`)

  // Load existing box office records
  const existing = await sb('/box_office?select=movie_id&limit=10000')
  const existingSet = new Set(existing.map((r) => r.movie_id))

  const counters = { updated: 0, inserted: 0, notFound: 0 }
  const notFound = []

  for (const record of BOX_OFFICE_DATA) {
    const movieId = movieMap.get(record.title.toLowerCase().trim())

    if (!movieId) {
      counters.notFound++
      notFound.push(record.title)
      continue
    }

    if (existingSet.has(movieId)) {
      // Update existing record
      await sb(`/box_office?movie_id=eq.${movieId}`, {
        method: 'PATCH',
        body: JSON.stringify({ total_nigeria: record.total }),
        prefer: 'return=minimal',
      })
      counters.updated++
    } else {
      // Insert new record
      await sb('/box_office', {
        method: 'POST',
        body: JSON.stringify({ movie_id: movieId, total_nigeria: record.total }),
        prefer: 'return=minimal',
      })
      existingSet.add(movieId)
      counters.inserted++
    }

    process.stdout.write(`   ✓ ${record.title}\r`)
    await sleep(300)
  }

  console.log('\n\n' + '='.repeat(55))
  console.log('✅ Done!')
  console.log('='.repeat(55))
  console.log(`\n  🔄 Records updated:  ${counters.updated}`)
  console.log(`  ➕ Records inserted: ${counters.inserted}`)
  console.log(`  ⚠️  Not in NMDb:     ${counters.notFound}`)

  if (notFound.length) {
    console.log('\n  Films in PDF but not in your database:')
    notFound.forEach((t) => console.log(`     - ${t}`))
    console.log('\n  You can add these manually via your admin page.')
  }

  console.log()
}

run().catch((err) => {
  console.error('\n❌ Crashed:', err.message)
  process.exit(1)
})
