import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'

export const metadata = {
  title: 'Terms of Service',
  description: 'The terms that govern your use of NMDb.',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <article className="max-w-3xl mx-auto px-6 py-14">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-10">Last updated: September 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed text-[15px]">
          <section>
            <p>
              These Terms of Service govern your use of nmdb.cc (the "Site"). By accessing or using the
              Site, you agree to these terms. If you don't agree with any part of them, please don't use
              the Site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">What NMDb is</h2>
            <p>
              NMDb is an independent, fan-built reference database for Nollywood (Nigerian) films — covering
              cast and crew, box office performance, streaming availability, trailers, and industry news.
              NMDb is not affiliated with, endorsed by, or officially connected to any film studio, streaming
              platform, or the individuals and productions listed on the Site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Accounts</h2>
            <ul className="list-disc list-inside space-y-1.5 text-gray-400">
              <li>You must provide accurate information when creating an account</li>
              <li>You're responsible for keeping your login credentials secure</li>
              <li>You're responsible for activity that happens under your account</li>
              <li>We may suspend or remove accounts that violate these terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Reviews and content you submit</h2>
            <p className="mb-3">
              When you post a rating or review, you agree that it is your own genuine opinion, that you
              won't post anything defamatory, harassing, hateful, sexually explicit, or otherwise unlawful,
              and that you won't impersonate someone else or post spam.
            </p>
            <p>
              You retain ownership of what you write, but by posting it you grant NMDb a non-exclusive,
              royalty-free license to display it on the Site. We reserve the right to remove any content
              that violates these terms, without notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Accuracy of information</h2>
            <p>
              We work to keep movie details, box office figures, and cast/crew information accurate and
              up to date, drawing on public sources and industry reporting. However, entertainment data
              changes constantly and sometimes conflicts between sources. We don't guarantee that every
              detail on the Site is complete or error-free, and information should not be relied on as
              the sole source for any commercial or legal purpose.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Intellectual property</h2>
            <p>
              Movie posters, images, and trailers displayed on NMDb belong to their respective studios,
              distributors, and rights holders, and are used for identification and informational purposes.
              The NMDb name, logo, and original written content (including our editorial articles and site
              design) belong to NMDb.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Third-party links and embeds</h2>
            <p>
              The Site links to and embeds content from third parties, including YouTube and streaming
              platforms. We aren't responsible for the content, availability, or practices of those
              third-party sites.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Advertising</h2>
            <p>
              NMDb may display advertising to help support the cost of running the Site. Ads are served by
              third-party providers such as Google AdSense, and their inclusion doesn't imply NMDb's
              endorsement of the advertised products or services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Disclaimer</h2>
            <p>
              The Site is provided "as is," without warranties of any kind. We don't guarantee the Site
              will be uninterrupted, secure, or error-free.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Changes to these terms</h2>
            <p>
              We may update these terms as the Site evolves. Continuing to use the Site after changes are
              posted means you accept the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Contact us</h2>
            <p>
              Questions about these terms? Reach us at{' '}
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
