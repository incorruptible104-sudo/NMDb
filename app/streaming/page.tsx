import { createClient } from '@supabase/supabase-js'
import Navbar from '@/app/components/Navbar'
import StreamingGrid from '@/app/components/StreamingGrid'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const metadata = {
  title: 'Now Streaming — NMDb | Nollywood Movie Database',
  description: 'Nollywood movies currently streaming on Netflix, Prime Video, Showmax and more.',
}

export default async function StreamingPage() {

  const { data: streamingRecords } = await supabase
    .from('streaming_platforms')
    .select('platform, available_from, movies(id, title, poster_url, release_date, nmdb_meter, genre, content_type)')
    .order('available_from', { ascending: false })

  // Deduplicate — one entry per movie, keep most recent available_from
  const movieMap = new Map()
  streamingRecords?.forEach((record: any) => {
    if (!record.movies?.id) return
    const existing = movieMap.get(record.movies.id)
    if (!existing || (record.available_from || '') > (existing.available_from || '')) {
      movieMap.set(record.movies.id, record)
    }
  })
  const allStreaming = Array.from(movieMap.values())

  // Get unique platforms for filter tabs
  const platforms = [
    'All',
    ...Array.from(new Set(
      streamingRecords?.map((r: any) => r.platform).filter(Boolean)
    )) as string[]
  ]

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      <Navbar />

      {/* Header */}
      <section className="px-6 py-12 border-b border-gray-800">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Now Streaming</h1>
          <p className="text-gray-400">
            Nollywood films available to watch right now across all major platforms.
          </p>
          <div className="mt-6 flex gap-6 text-sm text-gray-500">
            <span><span className="text-white font-semibold">{allStreaming.length}</span> films streaming</span>
            <span><span className="text-white font-semibold">{platforms.length - 1}</span> platforms</span>
          </div>
        </div>
      </section>

      {/* Platform filter + grid */}
      <StreamingGrid records={allStreaming} platforms={platforms} />

      <footer className="border-t border-gray-800 px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-gray-500 text-sm">
          <span>© 2026 NMDb — Nollywood Movie Database</span>
          <span>Built for the industry. Powered by data.</span>
        </div>
      </footer>

    </main>
  )
}
