'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createBrowserClient } from '@supabase/ssr'
import SearchBar from '@/app/components/SearchBar'

const navLinks = [
  { href: '/movies', label: 'Movies' },
  { href: '/people', label: 'People' },
  { href: '/box-office', label: 'Box Office' },
  { href: '/streaming', label: 'Streaming' },
  { href: '/blog', label: 'News' },
]

export default function Navbar() {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email ?? null)
      setCheckingAuth(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null)
      setCheckingAuth(false)
    })

    return () => listener.subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setAccountMenuOpen(false)
    setMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  const initial = userEmail ? userEmail.charAt(0).toUpperCase() : ''

  return (
    <nav className="border-b border-gray-800 px-6 py-4 relative z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">

        {/* Left: Logo + desktop links */}
        <div className="flex items-center gap-8">
          <a href="/" className="flex items-center">
            <Image
              src="/nmdb-logo.png"
              alt="NMDb"
              width={337}
              height={100}
              priority
              className="h-10 w-auto"
            />
          </a>
          <div className="hidden lg:flex gap-6 text-sm text-gray-400">
            {navLinks.map(link => (
              <a key={link.href} href={link.href} className="hover:text-white transition">{link.label}</a>
            ))}
          </div>
        </div>

        {/* Right: Search + Auth + Hamburger */}
        <div className="flex items-center gap-3">
          <SearchBar />

          {!checkingAuth && (
            userEmail ? (
              <div className="hidden sm:block relative" ref={accountMenuRef}>
                <button
                  onClick={() => setAccountMenuOpen(prev => !prev)}
                  className="w-9 h-9 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center justify-center transition"
                  aria-label="Account menu"
                >
                  {initial}
                </button>
                {accountMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-lg shadow-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-800">
                      <p className="text-xs text-gray-500">Signed in as</p>
                      <p className="text-sm text-white truncate">{userEmail}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <a
                  href="/auth/signup"
                  className="hidden sm:block border border-emerald-600 hover:bg-emerald-600/10 text-emerald-500 text-sm px-4 py-2 rounded-lg transition whitespace-nowrap"
                >
                  Sign Up
                </a>
                <a
                  href="/auth/signin"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-4 py-2 rounded-lg transition whitespace-nowrap"
                >
                  Sign In
                </a>
              </>
            )
          )}

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

          {!checkingAuth && (
            userEmail ? (
              <div className="pt-1">
                <p className="text-xs text-gray-500 mb-2 truncate">Signed in as {userEmail}</p>
                <button
                  onClick={handleSignOut}
                  className="w-full text-center border border-gray-700 text-gray-300 text-sm px-4 py-2 rounded-lg transition hover:bg-gray-800"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex gap-3 pt-1">
                <a
                  href="/auth/signup"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 text-center border border-emerald-600 text-emerald-500 text-sm px-4 py-2 rounded-lg transition"
                >
                  Sign Up
                </a>
                <a
                  href="/auth/signin"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 text-center bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-4 py-2 rounded-lg transition"
                >
                  Sign In
                </a>
              </div>
            )
          )}
        </div>
      )}
    </nav>
  )
}
