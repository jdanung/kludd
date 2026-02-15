'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HostPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function createGame() {
      try {
        let sessionId = localStorage.getItem('kludd-host-session')
        if (!sessionId) {
          sessionId = crypto.randomUUID()
          localStorage.setItem('kludd-host-session', sessionId)
        }

        const res = await fetch('/api/game/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hostId: sessionId }),
        })

        if (!res.ok) throw new Error('Kunde inte skapa spel')

        const { code } = await res.json()
        router.replace(`/host/${code}`)
      } catch (e: any) {
        setError(e.message)
      }
    }

    createGame()
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <p className="text-kludd-pink text-xl font-display">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-white/60 hover:text-white font-display"
          >
            Försök igen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-kludd-pink border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-display text-2xl text-white/60">Skapar spel...</p>
      </div>
    </div>
  )
}
