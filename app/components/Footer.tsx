import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 px-6 py-8 mt-4">
      <div className="max-w-6xl mx-auto flex flex-col gap-4 text-gray-500 text-sm">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Image src="/nmdb-logo.png" alt="NMDb" width={337} height={100} className="h-7 w-auto" />
            <span>© 2026 — Nollywood Movie Database</span>
          </div>
          <span>Built for the industry. Powered by data.</span>
        </div>
        <div className="flex items-center gap-5 text-xs text-gray-500 flex-wrap">
          <a href="/about" className="hover:text-gray-300 transition">About</a>
          <a href="/privacy" className="hover:text-gray-300 transition">Privacy Policy</a>
          <a href="/terms" className="hover:text-gray-300 transition">Terms of Service</a>
          <a href="mailto:hello@nmdb.cc" className="hover:text-gray-300 transition">Contact</a>
        </div>
      </div>
    </footer>
  )
}
