import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'

export const metadata = {
  title: 'About NMDb',
  description: 'Why we built NMDb, the Nollywood Movie Database.',
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <article className="max-w-3xl mx-auto px-6 py-14">
        <h1 className="text-3xl font-bold mb-8">About NMDb</h1>

        <div className="space-y-6 text-gray-300 leading-relaxed text-[15px]">
          <p>
            Nollywood is one of the largest film industries in the world by output, yet for years it has
            lacked a single, dedicated place to track it properly. Box office numbers are scattered across
            cinema chain reports and industry Twitter threads. Cast and crew credits live in press releases
            that disappear after a film's opening weekend. Streaming availability changes platform to
            platform with no central reference. NMDb exists to fix that.
          </p>

          <p>
            NMDb — short for the Nollywood Movie Database — is a home for the people, films, and numbers
            behind Nigerian cinema. Search a film and get its cast, crew, synopsis, and where it's
            streaming. Search an actor and see their full filmography in one place. Track how a film is
            performing at the box office week over week. Follow industry news as it happens.
          </p>

          <h2 className="text-xl font-semibold text-white mt-10 mb-3">What you'll find here</h2>
          <ul className="list-disc list-inside space-y-1.5 text-gray-400">
            <li>A growing database of Nollywood films, from box-office blockbusters to festival titles</li>
            <li>Cast and crew profiles connecting actors, directors, producers, and crew across their work</li>
            <li>Box office tracking for films currently in Nigerian cinemas</li>
            <li>Streaming availability across major platforms</li>
            <li>Trailers and trending clips</li>
            <li>Industry news and editorial coverage</li>
            <li>User ratings and reviews from people who've actually watched the films</li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-10 mb-3">A living, growing database</h2>
          <p>
            Nollywood releases hundreds of films a year, and its history stretches back decades before
            most databases started paying attention. We're building NMDb's catalog continuously — cross
            referencing multiple sources, filling in missing details, and adding new releases as they come
            out. If you notice a film that's missing, a credit that's wrong, or a detail we can improve,
            we want to hear about it — reach us at{' '}
            <a href="mailto:hello@nmdb.cc" className="text-emerald-400 hover:text-emerald-300 underline">
              hello@nmdb.cc
            </a>
            .
          </p>

          <h2 className="text-xl font-semibold text-white mt-10 mb-3">Data sources</h2>
          <p>
            NMDb's catalog draws on a combination of industry reporting, cinema box office data, and
            The Movie Database (TMDB). This product uses the TMDB API but is not endorsed or certified by
            TMDB.
          </p>

          <p className="pt-6 text-gray-400">
            NMDb is independently built and run. It isn't affiliated with any studio, streaming service, or
            production company — our only allegiance is to getting the record straight.
          </p>
        </div>
      </article>

      <Footer />
    </main>
  )
}
