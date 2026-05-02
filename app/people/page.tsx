import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import SearchBar from '@/app/components/SearchBar'



const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const metadata = {
  title: 'People — NMDb | Nollywood Movie Database',
  description: 'Browse directors, actors, producers and crew behind Nollywood films.',
}

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>
}) {
  const { role } = await searchParams
  const activeRole = role || 'All'

  // Build query — filter by role if one is selected
  let query = supabase
    .from('people')
    .select('id, full_name, stage_name, photo_url, primary_role, nationality')
    .order('photo_url', { ascending: false, nullsFirst: false })
    .order('full_name', { ascending: true })

  if (activeRole !== 'All') {
    query = query.eq('primary_role', activeRole)
  }

  const { data: people } = await query

  // Get total count separately for the header
  const { count: totalCount } = await supabase
    .from('people')
    .select('*', { count: 'exact', head: true })

  const roles = [
    'All', 'Actor', 'Director', 'Producer', 'Writer',
    'Cinematographer', 'Editor', 'Composer', 'Executive Producer'
  ]

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Navigation */}
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="/" className="text-2xl font-bold text-emerald-500">NMDb</a>
            <div className="hidden md:flex gap-6 text-sm text-gray-400">
              <a href="/movies" className="hover:text-white transition">Movies</a>
              <a href="/people" className="text-white transition">People</a>
              <a href="/box-office" className="hover:text-white transition">Box Office</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
           <SearchBar />
            <button className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-4 py-2 rounded-full transition">
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="px-6 py-12 border-b border-gray-800">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">People</h1>
          <p className="text-gray-400">
            {activeRole === 'All'
              ? `${totalCount || 0} industry professionals catalogued on NMDb`
              : `${people?.length || 0} ${activeRole}s in NMDb`}
          </p>

          {/* Role filters */}
          <div className="flex flex-wrap gap-3 mt-6">
            {roles.map((r) => (
              <a
                key={r}
                href={r === 'All' ? '/people' : `/people?role=${encodeURIComponent(r)}`}
                className={`px-4 py-2 rounded-full text-sm transition ${
                  activeRole === r
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white'
                }`}
              >
                {r}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* People Grid */}
      <section className="px-6 py-12">
        <div className="max-w-5xl mx-auto">
          {people && people.length > 0 ? (
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}
            >
              {people.map((person) => (
                <a
                  key={person.id}
                  href={`/people/${person.id}`}
                  className="group text-center"
                >
                  {/* Photo */}
                  <div className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-800 relative mb-3">
                    {person.photo_url ? (
                      <Image
                        src={person.photo_url}
                        alt={person.full_name}
                        fill
                        sizes="(max-width: 640px) 50vw, 140px"
                        className="object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 text-4xl">
                        👤
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <h3 className="font-semibold text-sm group-hover:text-emerald-400 transition truncate">
                    {person.stage_name || person.full_name}
                  </h3>
                  {person.primary_role && (
                    <p className="text-gray-500 text-xs mt-1">{person.primary_role}</p>
                  )}
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 text-gray-500">
              <div className="text-7xl mb-6">👤</div>
              <h2 className="text-2xl font-bold text-gray-400 mb-3">No people yet</h2>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                Start adding directors, actors and crew to NMDb.
              </p>
              <a
                href="/admin/add-person"
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-full text-sm font-semibold transition"
              >
                + Add First Person
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-8 mt-12">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-gray-500 text-sm">
          <span>© 2026 NMDb — Nollywood Movie Database</span>
          <span>Built for the industry. Powered by data.</span>
        </div>
      </footer>

    </main>
  )
}
