import Image from 'next/image'

// Top Nollywood YouTube channels to pull from
const NOLLYWOOD_CHANNEL_IDS = [
  'UCl3EB_8g3oFkDpFwuXs9Z3g', // Uche Montana Tv
  'UCqXJPFMGHGXUeDxOVJhSz7Q', // Omoni Oboli Tv
  'UCaGnNfmHF5nMKpF69FrJLFQ', // Mercy Johnson
  'UCwGOsF7u3lRNPLSNFMW0RoA', // Nollywood Blockbusters
  'UCsQrGxhH8J7fj4RBKB5IQTQ', // Mark Angel Comedy
  'UC7-lBcGJcOdRApfmUWS7aEw', // Mount Zion Films
  'UCGXMbbz5nNi9SvEpUK7CKHQ', // Kunle Remi Tv
  'UCXJJf0HsKMxaJpuOOFAbZIg', // AY Makun
]

type YouTubeVideo = {
  id: string
  title: string
  channelTitle: string
  thumbnail: string
  viewCount: string
  publishedAt: string
  videoId: string
}

async function fetchTrendingNollywoodVideos(): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return []

  try {
    // Search for top Nollywood full movies published in the last 30 days
    const oneMonthAgo = new Date()
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30)
    const publishedAfter = oneMonthAgo.toISOString()

    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=nollywood+full+movie&type=video&videoDuration=long&order=viewCount&publishedAfter=${publishedAfter}&maxResults=8&regionCode=NG&relevanceLanguage=en&key=${apiKey}`,
      { next: { revalidate: 3600 } } // cache for 1 hour
    )

    if (!searchRes.ok) return []
    const searchData = await searchRes.json()

    const videoIds = searchData.items?.map((item: any) => item.id.videoId).join(',')
    if (!videoIds) return []

    // Get view counts for those videos
    const statsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${apiKey}`,
      { next: { revalidate: 3600 } }
    )

    if (!statsRes.ok) return []
    const statsData = await statsRes.json()

    return statsData.items
      ?.map((item: any) => ({
        id: item.id,
        videoId: item.id,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || '',
        viewCount: item.statistics.viewCount || '0',
        publishedAt: item.snippet.publishedAt,
      }))
      .sort((a: any, b: any) => parseInt(b.viewCount) - parseInt(a.viewCount))
      .slice(0, 7) || []

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

function timeAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

export default async function YouTubeTrending() {
  const videos = await fetchTrendingNollywoodVideos()

  return (
    <div className="w-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">▶️ Trending on YouTube</h2>
        <a href="/youtube-trending" className="text-emerald-400 text-sm hover:text-emerald-300 transition">View all →</a>
      </div>

      {videos.length > 0 ? (
        <>
          {/* Mobile: 2-col grid */}
          <div className="grid grid-cols-2 gap-3 md:hidden">
            {videos.slice(0, 4).map((video, index) => (
              <a
                key={video.videoId}
                href={`https://www.youtube.com/watch?v=${video.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-800 mb-2">
                  {video.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">▶️</div>
                  )}
                  <div className="absolute top-1 left-1">
                    <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${index === 0 ? 'bg-yellow-400 text-black' : index === 1 ? 'bg-gray-300 text-black' : index === 2 ? 'bg-amber-600 text-white' : 'bg-black/80 text-gray-300'}`}>
                      {index + 1}
                    </span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40">
                    <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </div>
                </div>
                <h4 className="text-xs font-semibold line-clamp-2 group-hover:text-emerald-400 transition leading-snug">{video.title}</h4>
                <p className="text-gray-500 text-xs mt-1 truncate">{video.channelTitle}</p>
                <span className="text-emerald-400 text-xs font-semibold">{formatViews(video.viewCount)}</span>
              </a>
            ))}
          </div>

          {/* Desktop: horizontal row, stretched full width */}
          <div className="hidden md:grid gap-4 md:grid-cols-7">
            {videos.slice(0, 7).map((video, index) => (
              <a
                key={video.videoId}
                href={`https://www.youtube.com/watch?v=${video.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-800 mb-2">
                  {video.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">▶️</div>
                  )}
                  <div className="absolute top-2 left-2">
                    <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${index === 0 ? 'bg-yellow-400 text-black' : index === 1 ? 'bg-gray-300 text-black' : index === 2 ? 'bg-amber-600 text-white' : 'bg-black/80 text-gray-300'}`}>
                      {index + 1}
                    </span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40">
                    <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </div>
                </div>
                <h4 className="text-xs font-semibold line-clamp-2 group-hover:text-emerald-400 transition leading-snug">{video.title}</h4>
                <p className="text-gray-500 text-xs mt-1 truncate">{video.channelTitle}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-emerald-400 text-xs font-semibold">{formatViews(video.viewCount)}</span>
                  <span className="text-gray-600 text-xs">· {timeAgo(video.publishedAt)}</span>
                </div>
              </a>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-gray-900 rounded-xl p-6 text-center text-gray-600 text-sm">
          <div className="text-3xl mb-2">▶️</div>
          <p>YouTube data unavailable</p>
        </div>
      )}
    </div>
  )
}
