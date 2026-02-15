'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { getPusherClient } from '@/lib/pusher-client'
import { supabase } from '@/lib/supabase'
import type { Player, GamePhase, Drawing, Guess } from '@/lib/game-state'
import HostLobby from '@/components/host/Lobby'
import HostDrawing from '@/components/host/Drawing'
import HostGuessing from '@/components/host/Guessing'
import HostVoting from '@/components/host/Voting'
import HostReveal from '@/components/host/Reveal'
import HostScores from '@/components/host/Scores'

export default function HostGamePage() {
  const params = useParams()
  const code = params.code as string
  const [gameId, setGameId] = useState<string | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [phase, setPhase] = useState<GamePhase>('lobby')
  const [currentDrawing, setCurrentDrawing] = useState<Drawing | null>(null)
  const [guesses, setGuesses] = useState<Guess[]>([])
  const [results, setResults] = useState<any[]>([])
  const [submittedPlayerIds, setSubmittedPlayerIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const gameIdRef = useRef<string | null>(null)

  const fetchPlayers = useCallback(async (gId: string) => {
    const { data: playerData, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', gId)
      .order('player_order')

    console.log('Direct Supabase players query for game', gId, ':', playerData, playerError)
    if (playerData) {
      setPlayers(playerData)
    }
  }, [])

  const fetchGameData = useCallback(async () => {
    try {
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('code', code)
        .neq('status', 'finished')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (gameError || !game) {
        console.error('Game not found:', gameError)
        setError('Spelet hittades inte')
        return
      }

      console.log('Found game directly from Supabase:', game.id, game.status)
      setGameId(game.id)
      gameIdRef.current = game.id
      setPhase(game.status)

      await fetchPlayers(game.id)

      if (['guessing', 'voting', 'reveal'].includes(game.status)) {
        const { data: drawings } = await supabase
          .from('drawings')
          .select('*')
          .eq('game_id', game.id)
          .eq('round', game.current_round || 1)
          .limit(1)

        if (drawings && drawings.length > 0) {
          setCurrentDrawing(drawings[0])

          if (['voting', 'reveal'].includes(game.status)) {
            const { data: guessData } = await supabase
              .from('guesses')
              .select('*')
              .eq('drawing_id', drawings[0].id)

            setGuesses(guessData || [])

            if (game.status === 'reveal') {
              const revealRes = await fetch(`/api/game/reveal/${code}`).then(r => r.json())
              setResults(revealRes.results || [])
            }
          }
        }
      }
    } catch (e: any) {
      console.error('fetchGameData error:', e)
      setError(e.message)
    }
  }, [code, fetchPlayers])

  useEffect(() => {
    fetchGameData()
  }, [fetchGameData])

  useEffect(() => {
    const pusher = getPusherClient()
    const channel = pusher.subscribe(`game-${code}`)

    console.log('Subscribed to channel:', `game-${code}`)

    channel.bind('player-joined', (data: { player: { id: string; name: string } }) => {
      console.log('Pusher: player-joined event received', data)
      // Immediately add the player from the event data
      if (data?.player) {
        setPlayers((prev) => {
          if (prev.find(p => p.id === data.player.id)) return prev
          return [...prev, { ...data.player, score: 0 } as Player]
        })
      }
      // Also re-fetch from DB to get complete data
      if (gameIdRef.current) {
        fetchPlayers(gameIdRef.current)
      }
    })

    channel.bind('phase-changed', async (data: { phase: GamePhase }) => {
      console.log('Pusher: phase-changed event received', data)
      setPhase(data.phase)
      setSubmittedPlayerIds([])
      fetchGameData()
    })

    channel.bind('drawing-submitted', (data: { playerId: string }) => {
      setSubmittedPlayerIds((prev) => Array.from(new Set([...prev, data.playerId])))
    })

    channel.bind('guess-submitted', (data: { playerId: string }) => {
      setSubmittedPlayerIds((prev) => Array.from(new Set([...prev, data.playerId])))
    })

    channel.bind('vote-submitted', (data: { playerId: string }) => {
      setSubmittedPlayerIds((prev) => Array.from(new Set([...prev, data.playerId])))
    })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe(`game-${code}`)
    }
  }, [code, fetchGameData, fetchPlayers])

  const handleStartGame = useCallback(async () => {
    const sessionId = localStorage.getItem('kludd-host-session')
    await fetch('/api/game/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, hostId: sessionId }),
    })
  }, [code])

  const handleNextRound = useCallback(async () => {
    // API för att gå till nästa runda/teckning
    await fetch('/api/game/next', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
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

      {phase === 'voting' && currentDrawing && (
        <HostVoting
          players={players}
          currentDrawing={currentDrawing}
          guesses={guesses}
          submittedPlayerIds={submittedPlayerIds}
        />
      )}

      {phase === 'reveal' && currentDrawing && (
        <HostReveal
          players={players}
          currentDrawing={currentDrawing}
          results={results}
        />
      )}

      {phase === 'scores' && (
        <HostScores
          players={players}
          onNextRound={handleNextRound}
        />
      )}

      {!['lobby', 'drawing', 'guessing', 'voting', 'reveal', 'scores'].includes(phase) && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="glass-card p-12 text-center space-y-4">
            <p className="font-display text-5xl font-bold bg-gradient-to-r from-kludd-pink to-kludd-blue bg-clip-text text-transparent">
              {phase.toUpperCase()}
            </p>
            <p className="text-white/40 font-display text-xl">
              Spelt slut eller fasen byggs snart...
            </p>
          </div>
        </div>
      )}
    </main>
  )
}
