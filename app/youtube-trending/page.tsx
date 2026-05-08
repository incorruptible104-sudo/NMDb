import Navbar from '@/app/components/Navbar'

export const metadata = {
  title: 'Trending on YouTube — NMDb | Nollywood Movie Database',
  description: 'Top performing Nollywood movies on YouTube this month ranked by views.',
}

type YouTubeVideo = {
  videoId: string
  title: string
  channelTitle: string
  thumbnail: string
  viewCount: string
  likeCount: string
  publishedAt: string
  description: string
}

async function fetchTrendingVideos(): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return []

  try {
    const oneMonthAgo = new Date()
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30)
    const publishedAfter = oneMonthAgo.toISOString()

    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=nollywood+full+movie&type=video&videoDuration=long&order=viewCount&publishedAfter=${publishedAfter}&maxResults=12&regionCode=NG&relevanceLanguage=en&key=${apiKey}`,
      { next: { revalidate: 3600 } }
    )
    if (!searchRes.ok) return []
    const searchData = await searchRes.json()

    const videoIds = searchData.items?.map((item: any) => item.id.videoId).join(',')
    if (!videoIds) return []

    const statsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${videoIds}&key=${apiKey}`,
      { next: { revalidate: 3600 } }
    )
    if (!statsRes.ok) return []
    const statsData = await statsRes.json()

    return statsData.items
      ?.map((item: any) => ({
        videoId: item.id,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails?.maxres?.url || item.snippet.thumbnails?.high?.url || '',
        viewCount: item.statistics.viewCount || '0',
        likeCount: item.statistics.likeCount || '0',
        publishedAt: item.snippet.publishedAt,
        description: item.snippet.description?.slice(0, 120) || '',
      }))
      .sort((a: any, b: any) => parseInt(b.viewCount) - parseInt(a.viewCount)) || []
  } catch (err) {
    console.error('YouTube API error:', err)
    return []
  }
}

function formatViews(count: string): string {
  const n = parseInt(count)
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K views`
  return `${n} views`
}

function formatLikes(count: string): string {
  const n = parseInt(count)
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return `${n}`
}

function timeAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return `${Math.floor(days / 30)} months ago`
}

export default async function YouTubeTrendingPage() {
  const videos = await fetchTrendingVideos()

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      {/* Header */}
      <section className="px-6 py-12 border-b border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">▶️</span>
            <h1 className="text-4xl font-bold">Trending on YouTube</h1>
          </div>
          <p className="text-gray-400">Top performing Nollywood movies on YouTube in the last 30 days, ranked by views.</p>
          {videos.length > 0 && (
            <p className="text-gray-600 text-sm mt-2">{videos.length} films tracked · Updated hourly</p>
          )}
        </div>
      </section>

      {/* Video Grid */}
      <section className="px-6 py-10">
        <div className="max-w-6xl mx-auto">
          {videos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video, index) => (
                <a
                  key={video.videoId}
                  href={`https://www.youtube.com/watch?v=${video.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-emerald-700 transition"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden bg-gray-800">
                    {video.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 text-4xl">▶️</div>
                    )}

                    {/* Rank badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${
                        index === 0 ? 'bg-yellow-400 text-black' :
                        index === 1 ? 'bg-gray-400 text-black' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-black/70 text-white'
                      }`}>
                        #{index + 1}
                      </span>
                    </div>

                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40">
                      <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-emerald-400 transition leading-snug mb-2">
                      {video.title}
                    </h3>
                    <p className="text-gray-500 text-xs mb-3 truncate">{video.channelTitle}</p>

                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 text-sm font-bold">{formatViews(video.viewCount)}</span>
                      <div className="flex items-center gap-3 text-gray-600 text-xs">
                        <span>👍 {formatLikes(video.likeCount)}</span>
                        <span>{timeAgo(video.publishedAt)}</span>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-32">
              <div className="text-7xl mb-6">▶️</div>
              <h2 className="text-2xl font-bold text-gray-400 mb-3">YouTube data unavailable</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Make sure your YOUTUBE_API_KEY is set in .env.local and the server has been restarted.
              </p>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-gray-800 px-6 py-8 mt-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-gray-500 text-sm">
          <span>© 2026 NMDb — Nollywood Movie Database</span>
          <span>Built for the industry. Powered by data.</span>
        </div>
      </footer>
    </main>
  )
}
