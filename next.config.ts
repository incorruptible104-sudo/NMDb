import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // Disabled Vercel's image optimization pipeline. Uploading a large
    // batch of images in one go (the TMDB -> Supabase storage backfill)
    // very likely pushed the project over Vercel's monthly "source images"
    // quota for optimization -- which, once hit, stops ALL images from
    // being optimized site-wide (new and previously-working ones alike)
    // until the quota resets or the plan is upgraded.
    //
    // Our images are already reasonably sized (TMDB's w500 poster/photo
    // versions), so skipping Vercel's extra resize step costs very little
    // in practice, and removes this failure mode entirely.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
      },
    ],
  },
}

export default nextConfig
