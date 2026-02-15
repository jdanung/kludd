'use client'

import type { Player, Drawing, Guess } from '@/lib/game-state'

interface HostRevealProps {
  players: Player[]
  currentDrawing: Drawing
  results: any[] // Innehåller gissningar, röster och vem som skrev vad
}

export default function HostReveal({ players, currentDrawing, results }: HostRevealProps) {
  const correctGuess = results.find(r => r.is_original)
  const fakeGuesses = results.filter(r => !r.is_original)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-kludd-purple/20 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-6xl flex flex-col items-center gap-12">
        <h1 className="font-display text-5xl md:text-7xl font-bold text-center bg-gradient-to-r from-kludd-pink via-kludd-blue to-kludd-lime bg-clip-text text-transparent animate-bounce-in">
          SANNINGEN SKALL FRAM!
        </h1>

        <div className="flex flex-col lg:flex-row items-center gap-12 w-full">
          {/* Left: The Drawing */}
          <div className="flex-1 space-y-4">
            <div className="glass-card p-4 aspect-square max-w-md mx-auto bg-white/5 border-4 border-white/10 shadow-2xl relative">
              <img 
                src={currentDrawing.image_data} 
                alt="Resultat" 
                className="w-full h-full object-contain rounded-xl"
              />
              <div className="absolute -bottom-6 -right-6 bg-kludd-pink px-6 py-3 rounded-2xl shadow-xl rotate-3">
                <p className="font-display font-bold text-xl uppercase tracking-wider">Detta ritades!</p>
              </div>
            </div>
          </div>

          {/* Right: Results list */}
          <div className="flex-1 w-full space-y-6">
            <div className="space-y-4">
              {/* Fake Guesses first */}
              {fakeGuesses.map((res, i) => (
                <div 
                  key={res.id} 
                  className="animate-slide-up"
                  style={{ animationDelay: `${i * 0.5}s`, animationFillMode: 'both' }}
                >
                  <div className="glass-card p-6 border-l-8 border-kludd-pink bg-white/5 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <p className="font-display text-2xl font-bold">{res.text}</p>
                      <span className="text-sm text-kludd-pink font-display uppercase font-bold px-3 py-1 bg-kludd-pink/10 rounded-full">LÖGN</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <p className="text-white/40 text-sm italic font-display">Skriven av:</p>
                      <p className="font-display font-bold text-kludd-blue">{res.players?.name || 'Okänd'}</p>
                    </div>

                    {res.votes && res.votes.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                        <p className="text-white/40 text-xs w-full mb-1 uppercase tracking-widest font-display">Lurade dessa:</p>
                        {res.votes.map((v: any) => (
                          <div key={v.id} className="px-3 py-1 bg-kludd-pink/20 rounded-lg text-sm font-display font-bold">
                            {v.players?.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Correct Guess last for dramatic effect */}
              {correctGuess && (
                <div 
                  className="animate-slide-up"
                  style={{ animationDelay: `${fakeGuesses.length * 0.5 + 1}s`, animationFillMode: 'both' }}
                >
                  <div className="glass-card p-8 border-l-8 border-kludd-lime bg-kludd-lime/10 shadow-lg shadow-kludd-lime/10 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <p className="font-display text-3xl font-bold text-kludd-lime">{correctGuess.text}</p>
                      <span className="text-sm text-kludd-bg font-display uppercase font-bold px-4 py-1 bg-kludd-lime rounded-full shadow-lg shadow-kludd-lime/30">RÄTT SVAR</span>
                    </div>
                    
                    {correctGuess.votes && correctGuess.votes.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                        <p className="text-white/40 text-xs w-full mb-1 uppercase tracking-widest font-display">Dessa gissade rätt:</p>
                        {correctGuess.votes.map((v: any) => (
                          <div key={v.id} className="px-4 py-2 bg-kludd-lime text-kludd-bg rounded-xl text-md font-display font-bold">
                            {v.players?.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="animate-pulse-glow flex flex-col items-center gap-4">
            <p className="font-display text-xl text-white/40 italic">Gör er redo för nästa runda...</p>
        </div>
      </div>
    </div>
  )
}
