import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'

export const metadata = {
  title: 'Privacy Policy',
  description: 'How NMDb collects, uses, and protects your information.',
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <article className="max-w-3xl mx-auto px-6 py-14">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-10">Last updated: September 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed text-[15px]">
          <section>
            <p>
              NMDb ("we," "our," or "us") operates nmdb.cc, the Nollywood Movie Database.
              This page explains what information we collect when you use the site, how we
              use it, and the choices you have. By using NMDb, you agree to the practices
              described here.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Information you give us</h2>
            <p className="mb-3">When you create an account, we collect:</p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-400">
              <li>Your email address, used to sign you in and, if you request it, to reset your password</li>
              <li>A securely hashed password, or your Google account identifier if you sign in with Google</li>
            </ul>
            <p className="mt-3">
              If you use features that require an account, we also store the content you create:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-400 mt-2">
              <li>Movies you add to your Watchlist</li>
              <li>Ratings and written reviews you submit on movie pages</li>
            </ul>
            <p className="mt-3">
              We do not ask for or store payment information, physical addresses, or phone numbers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Information collected automatically</h2>
            <p className="mb-3">
              Like most websites, NMDb automatically collects some technical information when you visit,
              through the following services:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-400">
              <li>
                <span className="text-gray-300 font-medium">Google Analytics</span> — page views, general
                location (country/city level), device and browser type, and how you navigate the site.
              </li>
              <li>
                <span className="text-gray-300 font-medium">Vercel Analytics</span> — basic performance and
                traffic data used to keep the site fast and reliable.
              </li>
            </ul>
            <p className="mt-3">
              This information is aggregated and is not used by us to personally identify you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Advertising</h2>
            <p>
              NMDb may display advertisements served by Google AdSense. Google and its partners may use
              cookies to serve ads based on your prior visits to this or other websites. You can opt out
              of personalized advertising by visiting{' '}
              <a
                href="https://adssettings.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 underline"
              >
                Google's Ad Settings
              </a>
              , or generally at{' '}
              <a
                href="https://optout.networkadvertising.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 underline"
              >
                optout.networkadvertising.org
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Embedded content</h2>
            <p>
              Trailers and trending clips on NMDb are embedded directly from YouTube. When you play an
              embedded video, YouTube (Google) may collect data about that interaction under its own
              privacy policy, independent of NMDb.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">How we use your information</h2>
            <ul className="list-disc list-inside space-y-1.5 text-gray-400">
              <li>To operate your account, watchlist, and reviews</li>
              <li>To keep the site secure and prevent abuse</li>
              <li>To understand overall traffic patterns and improve the site</li>
              <li>To serve advertising that helps keep NMDb free to use</li>
            </ul>
            <p className="mt-3">We do not sell your personal information to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Data storage</h2>
            <p>
              Account data, watchlists, and reviews are stored securely with Supabase, our database
              provider. Movie posters and cast/crew photos are hosted on our own storage rather than
              linked from external sites, so they remain available even if a third-party source changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Your choices</h2>
            <ul className="list-disc list-inside space-y-1.5 text-gray-400">
              <li>You can delete a review or remove a movie from your watchlist at any time from within the site</li>
              <li>You can request that we delete your account and associated data by contacting us (see below)</li>
              <li>You can opt out of personalized ads using the links above</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Children's privacy</h2>
            <p>
              NMDb is not directed at children under 13, and we do not knowingly collect personal
              information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Changes to this policy</h2>
            <p>
              We may update this policy from time to time as the site evolves. Material changes will be
              reflected by an updated "Last updated" date at the top of this page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Contact us</h2>
            <p>
              If you have questions about this policy or would like to exercise any of the choices above,
              contact us at{' '}
              <a href="mailto:hello@nmdb.cc" className="text-emerald-400 hover:text-emerald-300 underline">
                hello@nmdb.cc
              </a>
              .
            </p>
          </section>
        </div>
      </article>

      <Footer />
    </main>
  )
}
