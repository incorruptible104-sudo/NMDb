import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import { notFound } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: person } = await supabase
    .from('people')
    .select('*')
    .eq('id', id)
    .single()

  if (!person) return { title: 'Person Not Found — NMDb' }

  return {
    title: `${person.full_name} — NMDb | Nollywood Movie Database`,
    description: person.bio || `${person.full_name} on NMDb — ${person.primary_role} in Nollywood`,
    openGraph: {
      title: `${person.full_name} — NMDb`,
      description: person.bio || '',
      images: person.photo_url ? [person.photo_url] : [],
    },
  }
}

export default async function PersonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: person } = await supabase
    .from('people')
    .select('*')
    .eq('id', id)
    .single()

  if (!person) notFound()

  // Get all films this person has been credited in
  const { data: credits } = await supabase
    .from('movie_credits')
    .select('*, movies(id, title, release_date, poster_url, nmdb_meter, release_type)')
    .eq('person_id', id)
    .order('billing_order', { ascending: true })

  // JSON-LD for Google Rich Results
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.full_name,
    alternateName: person.stage_name || undefined,
    description: person.bio,
    image: person.photo_url,
    birthDate: person.date_of_birth,
    nationality: person.nationality,
    jobTitle: person.primary_role,
    sameAs: person.instagram_url ? [person.instagram_url] : [],
  }

  // Group credits by role type
  const directedFilms = credits?.filter((c: any) => c.role_type === 'Director') || []
  const producedFilms = credits?.filter((c: any) => c.role_type === 'Producer') || []
  const actedFilms = credits?.filter((c: any) => c.role_type === 'Actor') || []
  const wroteFilms = credits?.filter((c: any) => c.role_type === 'Writer') || []
  const otherFilms = credits?.filter((c: any) =>
    !['Director', 'Producer', 'Actor', 'Writer'].includes(c.role_type)
  ) || []

  const allRoles = [
    { label: 'Director', films: directedFilms },
    { label: 'Producer', films: producedFilms },
    { label: 'Actor', films: actedFilms },
    { label: 'Writer', films: wroteFilms },
    { label: 'Other Credits', films: otherFilms },
  ].filter((r) => r.films.length > 0)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-gray-950 text-white">

        {/* Navigation */}
        <nav className="border-b border-gray-800 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-8">
              <a href="/" className="text-2xl font-bold text-emerald-500">NMDb</a>
              <div className="hidden md:flex gap-6 text-sm text-gray-400">
                <a href="/movies" className="hover:text-white transition">Movies</a>
                <a href="/people" className="hover:text-white transition">People</a>
                <a href="/box-office" className="hover:text-white transition">Box Office</a>
              </div>
            </div>
            <a href="/people" className="text-sm text-gray-400 hover:text-white transition">
              ← Back to People
            </a>
          </div>
        </nav>

        {/* Profile Header */}
        <section className="px-6 py-12 border-b border-gray-800">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">

            {/* Photo */}
            <div className="flex-shrink-0">
              <div className="w-48 h-48 rounded-2xl overflow-hidden bg-gray-800 relative shadow-2xl">
                {person.photo_url ? (
                  <Image
                    src={person.photo_url}
                    alt={person.full_name}
                    fill
                    className="object-cover"
                    sizes="192px"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-6xl">
                    👤
                  </div>
                )}
              </div>
              <a
                href={`/admin/edit-person/${person.id}`}
                className="mt-3 block text-center text-xs text-gray-600 hover:text-emerald-400 transition"
              >
                ✏️ Edit profile
              </a>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold">{person.full_name}</h1>
              {person.stage_name && (
                <p className="text-gray-400 text-lg mt-1">"{person.stage_name}"</p>
              )}

              {/* Primary role badge */}
              {person.primary_role && (
                <span className="inline-block mt-3 bg-emerald-900/50 border border-emerald-700 text-emerald-400 text-sm px-4 py-1 rounded-full">
                  {person.primary_role}
                </span>
              )}

              {/* Secondary roles */}
              {person.secondary_roles && person.secondary_roles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {person.secondary_roles.map((role: string) => (
                    <span key={role} className="bg-gray-800 text-gray-400 text-xs px-3 py-1 rounded-full">
                      {role}
                    </span>
                  ))}
                </div>
              )}

              {/* Meta details */}
              <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
                {person.nationality && (
                  <div>
                    <span className="text-gray-500 text-xs uppercase tracking-wider">Nationality</span>
                    <p className="text-white mt-1">{person.nationality}</p>
                  </div>
                )}
                {person.date_of_birth && (
                  <div>
                    <span className="text-gray-500 text-xs uppercase tracking-wider">Born</span>
                    <p className="text-white mt-1">
                      {new Date(person.date_of_birth).toLocaleDateString('en-NG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
                {person.gender && (
                  <div>
                    <span className="text-gray-500 text-xs uppercase tracking-wider">Gender</span>
                    <p className="text-white mt-1">{person.gender}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-500 text-xs uppercase tracking-wider">Films</span>
                  <p className="text-white mt-1">{credits?.length || 0} credits on NMDb</p>
                </div>
              </div>

              {/* Bio */}
              {person.bio && (
                <div className="mt-6">
                  <p className="text-gray-300 leading-relaxed">{person.bio}</p>
                </div>
              )}

              {/* Instagram */}
              {person.instagram_url && (
                <a
                  href={person.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 text-sm text-gray-400 hover:text-white transition"
                >
                  📷 Instagram
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Filmography — grouped by role */}
        {allRoles.length > 0 ? (
          <section className="px-6 py-12">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold mb-8">Filmography</h2>

              <div className="space-y-12">
                {allRoles.map(({ label, films }) => (
                  <div key={label}>
                    <h3 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center gap-3">
                      {label}
                      <span className="text-gray-600 text-sm font-normal">{films.length} film{films.length !== 1 ? 's' : ''}</span>
                    </h3>

                    <div
                      className="grid gap-4"
                      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}
                    >
                      {films.map((credit: any) => (
                        <a
                          key={credit.id}
                          href={`/movies/${credit.movies?.id}`}
                          className="group"
                        >
                          {/* Poster */}
                          <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 relative mb-2">
                            {credit.movies?.poster_url ? (
                              <Image
                                src={credit.movies.poster_url}
                                alt={credit.movies.title}
                                fill
                                sizes="130px"
                                className="object-cover group-hover:scale-105 transition duration-300"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-600 text-2xl">
                                🎬
                              </div>
                            )}
                            {credit.movies?.nmdb_meter && (
                              <div className="absolute bottom-1 right-1 bg-black/80 text-emerald-400 text-xs font-bold px-1.5 py-0.5 rounded">
                                ⭐ {credit.movies.nmdb_meter}
                              </div>
                            )}
                          </div>

                          <h4 className="text-sm font-medium truncate group-hover:text-emerald-400 transition">
                            {credit.movies?.title}
                          </h4>
                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-gray-500 text-xs">
                              {credit.movies?.release_date?.slice(0, 4)}
                            </p>
                            {credit.character_name && (
                              <p className="text-gray-600 text-xs truncate ml-1">
                                as {credit.character_name}
                              </p>
                            )}
                          </div>
                          <p className="text-gray-600 text-xs mt-0.5">{credit.role_type}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section className="px-6 py-20 text-center">
            <div className="max-w-5xl mx-auto text-gray-500">
              <p className="text-lg">No film credits yet for {person.full_name}.</p>
              <p className="text-sm mt-2 text-gray-600">
                Credits are added when linking this person to a film via the movie admin.
              </p>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-gray-800 px-6 py-8 mt-12">
          <div className="max-w-5xl mx-auto flex items-center justify-between text-gray-500 text-sm">
            <span>© 2026 NMDb — Nollywood Movie Database</span>
            <span>Built for the industry. Powered by data.</span>
          </div>
        </footer>

      </main>
    </>
  )
}
