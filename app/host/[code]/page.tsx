'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { getPusherClient } from '@/lib/pusher-client'
import { supabase } from '@/lib/supabase'
import type { Player, GamePhase, Drawing, Guess } from '@/lib/game-state'
import HostLobby from '@/components/host/Lobby'
import HostDrawing from '@/components/host/Drawing'
import HostGuessing from '@/components/host/Guessing'
import HostVoting from '@/components/host/Voting'
import HostReveal from '@/components/host/Reveal'

export default function HostGamePage() {
  const params = useParams()
  const code = params.code as string
  const [players, setPlayers] = useState<Player[]>([])
  const [phase, setPhase] = useState<GamePhase>('lobby')
  const [currentDrawing, setCurrentDrawing] = useState<Drawing | null>(null)
  const [guesses, setGuesses] = useState<Guess[]>([])
  const [results, setResults] = useState<any[]>([])
  const [submittedPlayerIds, setSubmittedPlayerIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchGame() {
      try {
        const res = await fetch(`/api/game/${code}`)
        if (!res.ok) throw new Error('Spelet hittades inte')
        const data = await res.json()
        setPlayers(data.players || [])
        setPhase(data.game.status)
        
        // Om vi redan är i en fas som kräver ritning/gissningar, hämta dem
        if (['guessing', 'voting', 'reveal'].includes(data.game.status)) {
          const { data: drawings } = await supabase
            .from('drawings')
            .select('*')
            .eq('game_id', data.game.id)
            .eq('round', data.game.current_round || 1)
            .limit(1)
          
          if (drawings && drawings.length > 0) {
            setCurrentDrawing(drawings[0])

            if (['voting', 'reveal'].includes(data.game.status)) {
              const { data: guessData } = await supabase
                .from('guesses')
                .select('*')
                .eq('drawing_id', drawings[0].id)
              
              setGuesses(guessData || [])

              if (data.game.status === 'reveal') {
                const revealRes = await fetch(`/api/game/reveal/${code}`).then(r => r.json())
                setResults(revealRes.results || [])
              }
            }
          }
        }
      } catch (e: any) {
        setError(e.message)
      }
    }
    fetchGame()
  }, [code])

  useEffect(() => {
    const pusher = getPusherClient()
    const channel = pusher.subscribe(`game-${code}`)

    channel.bind('player-joined', (data: { player: Player }) => {
      setPlayers((prev) => {
        if (prev.some((p) => p.id === data.player.id)) return prev
        return [...prev, data.player]
      })
    })

    channel.bind('phase-changed', async (data: { phase: GamePhase }) => {
      setPhase(data.phase)
      setSubmittedPlayerIds([])

      if (data.phase === 'guessing') {
        const { data: gameData } = await fetch(`/api/game/${code}`).then(r => r.json())
        const { data: drawings } = await supabase
          .from('drawings')
          .select('*')
          .eq('game_id', gameData.id)
          .eq('round', gameData.current_round || 1)
          .limit(1)
        
        if (drawings && drawings.length > 0) {
          setCurrentDrawing(drawings[0])
        }
      }

      if (data.phase === 'voting') {
        if (currentDrawing) {
          const { data: guessData } = await supabase
            .from('guesses')
            .select('*')
            .eq('drawing_id', currentDrawing.id)
          
          setGuesses(guessData || [])
        } else {
          // Fallback om currentDrawing saknas
          const { data: gameData } = await fetch(`/api/game/${code}`).then(r => r.json())
          const { data: drawings } = await supabase
            .from('drawings')
            .select('*')
            .eq('game_id', gameData.id)
            .eq('round', gameData.current_round || 1)
            .limit(1)
          
          if (drawings && drawings.length > 0) {
            setCurrentDrawing(drawings[0])
            const { data: guessData } = await supabase
              .from('guesses')
              .select('*')
              .eq('drawing_id', drawings[0].id)
            
            setGuesses(guessData || [])
          }
        }
      }

      if (data.phase === 'reveal') {
        const revealRes = await fetch(`/api/game/reveal/${code}`).then(r => r.json())
        setResults(revealRes.results || [])
      }
    })

    channel.bind('drawing-submitted', (data: { playerId: string }) => {
      setSubmittedPlayerIds((prev) => {
        if (prev.includes(data.playerId)) return prev
        return [...prev, data.playerId]
      })
    })

    channel.bind('guess-submitted', (data: { playerId: string }) => {
      setSubmittedPlayerIds((prev) => {
        if (prev.includes(data.playerId)) return prev
        return [...prev, data.playerId]
      })
    })

    channel.bind('vote-submitted', (data: { playerId: string }) => {
      setSubmittedPlayerIds((prev) => {
        if (prev.includes(data.playerId)) return prev
        return [...prev, data.playerId]
      })
    })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe(`game-${code}`)
    }
  }, [code, currentDrawing])

  const handleStartGame = useCallback(async () => {
    const sessionId = localStorage.getItem('kludd-host-session')
    await fetch('/api/game/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, hostId: sessionId }),
    })
  }, [code])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <p className="text-kludd-pink text-xl font-display">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen">
      {phase === 'lobby' && (
        <HostLobby
          code={code}
          players={players}
          onStartGame={handleStartGame}
        />
      )}

      {phase === 'drawing' && (
        <HostDrawing
          players={players}
          submittedPlayerIds={submittedPlayerIds}
        />
      )}

      {phase === 'guessing' && currentDrawing && (
        <HostGuessing
          players={players}
          currentDrawing={currentDrawing}
          submittedPlayerIds={submittedPlayerIds}
        />
      )}

      {phase !== 'lobby' && phase !== 'drawing' && phase !== 'guessing' && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="glass-card p-12 text-center space-y-4">
            <p className="font-display text-5xl font-bold bg-gradient-to-r from-kludd-pink to-kludd-blue bg-clip-text text-transparent">
              {phase.toUpperCase()}
            </p>
            <p className="text-white/40 font-display text-xl">
              Denna fas byggs snart...
            </p>
          </div>
        </div>
      )}
    </main>
  )
}
