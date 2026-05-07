'use client'

import { useState } from 'react'
import SearchBar from '@/app/components/SearchBar'

const navLinks = [
  { href: '/movies', label: 'Movies' },
  { href: '/people', label: 'People' },
  { href: '/box-office', label: 'Box Office' },
  { href: '/blog', label: 'News' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="border-b border-gray-800 px-6 py-4 relative z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">

        {/* Left: Logo + desktop links */}
        <div className="flex items-center gap-8">
          <a href="/" className="text-2xl font-bold text-emerald-500">NMDb</a>
          <div className="hidden lg:flex gap-6 text-sm text-gray-400">
            {navLinks.map(link => (
              <a key={link.href} href={link.href} className="hover:text-white transition">{link.label}</a>
            ))}
          </div>
        </div>

        {/* Right: Search + Sign In + Hamburger */}
        <div className="flex items-center gap-3">
          <SearchBar />
          <a
            href="/sign-in"
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-4 py-2 rounded-lg transition whitespace-nowrap"
          >
            Sign In
          </a>
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen(prev => !prev)}
            className="lg:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5 rounded-lg hover:bg-gray-800 transition"
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-gray-950 border-b border-gray-800 px-6 py-4 flex flex-col gap-4">
          {navLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-gray-300 hover:text-white text-base font-medium transition py-1 border-b border-gray-800 last:border-0"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  )
}
