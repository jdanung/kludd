'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function JoinForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [code, setCode] = useState(searchParams.get('code') || '')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let sessionId = localStorage.getItem('kludd-player-session')
      if (!sessionId) {
        sessionId = crypto.randomUUID()
        localStorage.setItem('kludd-player-session', sessionId)
      }

      localStorage.setItem('kludd-player-name', name.trim())

      const res = await fetch('/api/game/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.toUpperCase(),
          name: name.trim(),
          sessionId,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Kunde inte gå med')
      }

      const data = await res.json()
      localStorage.setItem('kludd-player-id', data.player.id)

      router.push(`/play/${code.toUpperCase()}`)
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-kludd-blue/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-kludd-lime/15 rounded-full blur-3xl animate-float-delayed" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <h1 className="font-display text-5xl font-bold text-center mb-2 bg-gradient-to-r from-kludd-blue to-kludd-lime bg-clip-text text-transparent">
          GÅ MED
        </h1>
        <p className="text-center text-white/40 mb-8 font-display">
          Ange spelkod &amp; ditt namn
        </p>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              placeholder="SPELKOD"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, '').slice(0, 4))
              }
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-center text-3xl font-display tracking-[0.5em] placeholder:tracking-normal placeholder:text-lg placeholder:text-white/20 focus:outline-none focus:border-kludd-blue/50 focus:ring-2 focus:ring-kludd-blue/20 transition-all"
            />
          </div>

          <div>
            <input
              type="text"
              maxLength={20}
              placeholder="Ditt namn"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-center text-xl font-display placeholder:text-white/20 focus:outline-none focus:border-kludd-lime/50 focus:ring-2 focus:ring-kludd-lime/20 transition-all"
            />
          </div>

          {error && (
            <p className="text-kludd-pink text-center text-sm animate-bounce-in">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={code.length !== 4 || !name.trim() || loading}
            className="w-full py-4 bg-gradient-to-r from-kludd-blue to-kludd-lime rounded-2xl font-display text-xl font-bold shadow-lg shadow-kludd-blue/25 hover:shadow-kludd-blue/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-30 disabled:hover:scale-100 disabled:cursor-not-allowed text-kludd-bg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-kludd-bg border-t-transparent rounded-full animate-spin inline-block" />
                Ansluter...
              </span>
            ) : (
              'HÄNG PÅ!'
            )}
          </button>
        </form>
      </div>
    </main>
  )
}
