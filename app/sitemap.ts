import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const BASE_URL = 'https://www.nmdb.cc'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/movies`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/people`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/box-office`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/streaming`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE_URL}/blog`, changeFrequency: 'daily', priority: 0.7 },
  ]

  const [{ data: movies }, { data: people }, { data: posts }] = await Promise.all([
    supabase.from('movies').select('id').limit(5000),
    supabase.from('people').select('id').limit(5000),
    supabase.from('blog_posts').select('slug').eq('published', true).limit(5000),
  ])

  const movieRoutes: MetadataRoute.Sitemap = (movies || []).map((m) => ({
    url: `${BASE_URL}/movies/${m.id}`,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  const peopleRoutes: MetadataRoute.Sitemap = (people || []).map((p) => ({
    url: `${BASE_URL}/people/${p.id}`,
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  const blogRoutes: MetadataRoute.Sitemap = (posts || []).map((b) => ({
    url: `${BASE_URL}/blog/${b.slug}`,
    changeFrequency: 'monthly',
    priority: 0.5,
  }))

  return [...staticRoutes, ...movieRoutes, ...peopleRoutes, ...blogRoutes]
}
