import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/auth/'],
      },
    ],
    sitemap: 'https://www.nmdb.cc/sitemap.xml',
  }
}
