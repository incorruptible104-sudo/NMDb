'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleReset = async () => {
    if (!email) { setError('Please enter your email.'); return }
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full">

        <div className="text-center mb-8">
          <a href="/" className="text-3xl font-bold text-emerald-500">NMDb</a>
          <p className="text-gray-500 text-sm mt-1">Nollywood Movie Database</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          {sent ? (
            <div className="text-center">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="text-xl font-bold mb-2">Check your email</h2>
              <p className="text-gray-400 text-sm">
                We sent a password reset link to <span className="text-emerald-400">{email}</span>
              </p>
              <a href="/auth/signin" className="mt-6 inline-block text-emerald-400 hover:text-emerald-300 transition text-sm">
                ← Back to Sign In
              </a>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-1">Reset password</h1>
              <p className="text-gray-500 text-sm mb-6">
                Enter your email and we'll send you a reset link.
              </p>

              {error && (
                <div className="bg-red-900/40 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-xl mb-5">
                  {error}
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReset()}
                  placeholder="you@example.com"
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-600"
                />
              </div>

              <button
                onClick={handleReset}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:text-emerald-700 text-white font-bold py-3 rounded-xl transition"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <div className="text-center mt-4">
                <a href="/auth/signin" className="text-gray-500 hover:text-gray-400 transition text-sm">
                  ← Back to Sign In
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
