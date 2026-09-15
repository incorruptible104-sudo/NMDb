import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 px-6 py-8 mt-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between text-gray-500 text-sm flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Image src="/nmdb-logo.png" alt="NMDb" width={337} height={100} className="h-7 w-auto" />
          <span>© 2026 — Nollywood Movie Database</span>
        </div>
        <span>Built for the industry. Powered by data.</span>
      </div>
    </footer>
  )
}
