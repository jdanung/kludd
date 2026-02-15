'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getPusherClient } from '@/lib/pusher-client'
import { supabase } from '@/lib/supabase'
import type { GamePhase, Drawing, Guess } from '@/lib/game-state'
import DrawingCanvas from '@/components/player/DrawingCanvas'

export default function PlayerGamePage() {
  const params = useParams()
  const code = params.code as string
  const [phase, setPhase] = useState<GamePhase>('lobby')
  const [playerName, setPlayerName] = useState<string>('')
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [prompt, setPrompt] = useState<string>('')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [currentDrawing, setCurrentDrawing] = useState<Drawing | null>(null)
  const [guessText, setGuessText] = useState('')

  const [guesses, setGuesses] = useState<Guess[]>([])

  useEffect(() => {
    const name = localStorage.getItem('kludd-player-name')
    const id = localStorage.getItem('kludd-player-id')
    if (name) setPlayerName(name)
    if (id) setPlayerId(id)
  }, [])

  useEffect(() => {
    const pusher = getPusherClient()
    const channel = pusher.subscribe(`game-${code}`)

    channel.bind('phase-changed', async (data: { phase: GamePhase; prompts?: { playerId: string; prompt: string }[] }) => {
      setPhase(data.phase)
      if (data.phase === 'drawing' && data.prompts) {
        const id = localStorage.getItem('kludd-player-id')
        const myPrompt = data.prompts.find(p => p.playerId === id)?.prompt
        if (myPrompt) setPrompt(myPrompt)
        setHasSubmitted(false)
      }

      if (data.phase === 'guessing') {
        setHasSubmitted(false)
        setGuessText('')
        
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
        setHasSubmitted(false)
        if (currentDrawing) {
          const { data: guessData } = await supabase
            .from('guesses')
            .select('*')
            .eq('drawing_id', currentDrawing.id)
          
          setGuesses(guessData || [])
        } else {
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
    })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe(`game-${code}`)
    }
  }, [code])

  const handleSaveDrawing = async (imageData: string) => {
    if (!playerId) return

    try {
      const res = await fetch('/api/game/submit-drawing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          playerId,
          imageData,
          promptText: prompt,
          round: 1, // Temporärt hårdkodat
        }),
      })

      if (res.ok) {
        setHasSubmitted(true)
      }
    } catch (e) {
      console.error('Save drawing error:', e)
    }
  }

  const handleSubmitGuess = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!playerId || !currentDrawing || !guessText.trim()) return

    try {
      const res = await fetch('/api/game/submit-guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          playerId,
          drawingId: currentDrawing.id,
          text: guessText.trim(),
        }),
      })

      if (res.ok) {
        setHasSubmitted(true)
      }
    } catch (e) {
      console.error('Submit guess error:', e)
    }
  }

  const handleVote = async (guessId: string) => {
    if (!playerId) return

    try {
      const res = await fetch('/api/game/submit-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          playerId,
          guessId,
        }),
      })

      if (res.ok) {
        setHasSubmitted(true)
      }
    } catch (e) {
      console.error('Submit vote error:', e)
    }
  }

  const isArtist = currentDrawing?.player_id === playerId

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm h-full flex flex-col">
        {phase === 'lobby' && (
          <div className="text-center space-y-6 animate-slide-up my-auto">
            {/* ... existing lobby content ... */}
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-kludd-blue to-kludd-lime flex items-center justify-center">
              <span className="text-4xl font-display font-bold text-kludd-bg">
                {playerName?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>

            <div>
              <h2 className="font-display text-3xl font-bold">{playerName}</h2>
              <p className="text-white/40 font-display mt-1">
                Du är med i spel{' '}
                <span className="text-kludd-blue">{code}</span>
              </p>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-3 justify-center">
                <div className="w-3 h-3 bg-kludd-lime rounded-full animate-pulse" />
                <p className="text-white/60 font-display">
                  Väntar på att hosten startar...
                </p>
              </div>
            </div>
          </div>
        )}

        {phase === 'drawing' && (
          <div className="flex-1 flex flex-col gap-6 animate-slide-up h-full">
            {!hasSubmitted ? (
              <>
                <div className="text-center">
                  <p className="text-white/40 font-display uppercase tracking-widest text-sm mb-1">Ditt uppdrag:</p>
                  <h2 className="text-2xl font-display font-bold text-kludd-pink leading-tight">
                    {prompt || 'Rita nåt kul!'}
                  </h2>
                </div>
                
                <div className="flex-1 min-h-[400px]">
                  <DrawingCanvas onSave={handleSaveDrawing} />
                </div>
              </>
            ) : (
              <div className="my-auto text-center space-y-6 animate-bounce-in">
                <div className="w-20 h-20 mx-auto bg-kludd-lime rounded-full flex items-center justify-center shadow-lg shadow-kludd-lime/20">
                  <span className="text-4xl">✅</span>
                </div>
                <div>
                  <h2 className="font-display text-3xl font-bold">Snyggt ritat!</h2>
                  <p className="text-white/40 font-display mt-2">
                    Väntar på att de andra ska kladda klart...
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {phase === 'guessing' && (
          <div className="flex-1 flex flex-col gap-6 animate-slide-up h-full my-auto">
            {isArtist ? (
              <div className="text-center space-y-6 animate-bounce-in">
                <div className="w-20 h-20 mx-auto bg-kludd-blue rounded-full flex items-center justify-center shadow-lg shadow-kludd-blue/20">
                  <span className="text-4xl">🎨</span>
                </div>
                <div>
                  <h2 className="font-display text-3xl font-bold">Din tur att vila!</h2>
                  <p className="text-white/40 font-display mt-2">
                    De andra försöker gissa vad du har ritat...
                  </p>
                </div>
              </div>
            ) : !hasSubmitted ? (
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-display font-bold text-kludd-blue">VAD ÄR DETTA?</h2>
                  <p className="text-white/40 font-display">Hitta på en titel som lurar de andra!</p>
                </div>

                <form onSubmit={handleSubmitGuess} className="space-y-4">
                  <input
                    type="text"
                    maxLength={50}
                    placeholder="Skriv ditt förslag..."
                    value={guessText}
                    onChange={(e) => setGuessText(e.target.value)}
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-center text-xl font-display placeholder:text-white/20 focus:outline-none focus:border-kludd-blue/50 focus:ring-2 focus:ring-kludd-blue/20 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!guessText.trim()}
                    className="w-full py-4 bg-kludd-blue rounded-2xl font-display text-xl font-bold shadow-lg shadow-kludd-blue/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 text-kludd-bg"
                  >
                    SKICKA LÖGNEN
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-center space-y-6 animate-bounce-in">
                <div className="w-20 h-20 mx-auto bg-kludd-lime rounded-full flex items-center justify-center shadow-lg shadow-kludd-lime/20">
                  <span className="text-4xl">🤐</span>
                </div>
                <div>
                  <h2 className="font-display text-3xl font-bold">Lögnen är skickad!</h2>
                  <p className="text-white/40 font-display mt-2">
                    Väntar på att de andra ska ljuga klart...
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {phase === 'voting' && (
          <div className="flex-1 flex flex-col gap-6 animate-slide-up h-full my-auto">
            {isArtist ? (
              <div className="text-center space-y-6 animate-bounce-in">
                <div className="w-20 h-20 mx-auto bg-kludd-blue rounded-full flex items-center justify-center shadow-lg shadow-kludd-blue/20">
                  <span className="text-4xl">🧐</span>
                </div>
                <div>
                  <h2 className="font-display text-3xl font-bold">Kolla på TV:n!</h2>
                  <p className="text-white/40 font-display mt-2">
                    De andra försöker hitta rätt bland alla lögner...
                  </p>
                </div>
              </div>
            ) : !hasSubmitted ? (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-display font-bold text-kludd-lime">RÖSTA!</h2>
                  <p className="text-white/40 font-display">Vilken är den riktiga titeln?</p>
                </div>

                <div className="space-y-3">
                  {guesses.map((guess) => (
                    <button
                      key={guess.id}
                      onClick={() => handleVote(guess.id)}
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-display text-lg font-bold hover:bg-white/10 hover:border-kludd-lime/50 transition-all text-center"
                    >
                      {guess.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center space-y-6 animate-bounce-in">
                <div className="w-20 h-20 mx-auto bg-kludd-lime rounded-full flex items-center justify-center shadow-lg shadow-kludd-lime/20">
                  <span className="text-4xl">🗳️</span>
                </div>
                <div>
                  <h2 className="font-display text-3xl font-bold">Rösten är lagd!</h2>
                  <p className="text-white/40 font-display mt-2">
                    Snart får vi se vem som blev lurad...
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {phase === 'reveal' && (
          <div className="flex-1 flex flex-col gap-6 animate-slide-up h-full my-auto text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-kludd-pink to-kludd-orange rounded-full flex items-center justify-center shadow-lg shadow-kludd-pink/20">
              <span className="text-5xl animate-bounce">👀</span>
            </div>
            <div>
              <h2 className="text-3xl font-display font-bold text-kludd-pink uppercase tracking-tight">Kolla TV:n!</h2>
              <p className="text-white/60 font-display mt-3 text-lg leading-relaxed">
                Vem blev lurad? Vem gissade rätt? <br/>
                Svaren avslöjas nu!
              </p>
            </div>
            <div className="glass-card p-6 border border-kludd-pink/20 bg-kludd-pink/5">
              <p className="text-sm font-display text-kludd-pink/60 uppercase tracking-widest">Nästa steg</p>
              <p className="text-white/40 mt-1">Gör dig redo för nästa runda...</p>
            </div>
          </div>
        )}

        {phase !== 'lobby' && phase !== 'drawing' && phase !== 'guessing' && phase !== 'voting' && phase !== 'reveal' && (
          <div className="text-center space-y-4 animate-bounce-in my-auto">
            <div className="glass-card p-8">
              <p className="font-display text-3xl font-bold bg-gradient-to-r from-kludd-pink to-kludd-blue bg-clip-text text-transparent">
                {phase.toUpperCase()}
              </p>
              <p className="text-white/40 mt-3 font-display">
                Denna fas byggs snart...
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
