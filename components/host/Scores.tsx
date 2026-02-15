'use client'

import type { Player } from '@/lib/game-state'

interface HostScoresProps {
  players: Player[]
  onNextRound: () => void
}

export default function HostScores({ players, onNextRound }: HostScoresProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-kludd-blue/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-kludd-pink/10 rounded-full blur-3xl animate-float-delayed" />
      </div>

      <div className="relative z-10 w-full max-w-4xl text-center space-y-12">
        <h1 className="font-display text-6xl md:text-8xl font-bold bg-gradient-to-r from-kludd-blue via-kludd-lime to-kludd-blue bg-clip-text text-transparent animate-bounce-in">
          STÄLLNINGEN
        </h1>

        <div className="glass-card p-8 md:p-12 space-y-6">
          {sortedPlayers.map((player, i) => (
            <div 
              key={player.id}
              className="flex items-center gap-6 p-4 rounded-2xl bg-white/5 border border-white/10 animate-slide-up"
              style={{ animationDelay: `${i * 0.2}s`, animationFillMode: 'both' }}
            >
              <div className="w-12 h-12 rounded-full bg-kludd-purple flex items-center justify-center font-display font-bold text-2xl text-white/40">
                {i + 1}
              </div>
              
              <div className="flex-1 text-left">
                <p className="font-display text-2xl md:text-3xl font-bold">{player.name}</p>
              </div>

              <div className="text-right">
                <p className="font-display text-3xl md:text-4xl font-bold text-kludd-blue">{player.score}</p>
                <p className="text-xs text-white/20 uppercase tracking-widest font-display">Poäng</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-8">
          <button
            onClick={onNextRound}
            className="px-12 py-5 bg-gradient-to-r from-kludd-pink to-kludd-orange rounded-2xl font-display text-3xl font-bold shadow-lg shadow-kludd-pink/25 hover:shadow-kludd-pink/40 hover:scale-105 active:scale-95 transition-all duration-300 text-white"
          >
            NÄSTA RUNDA!
          </button>
        </div>
      </div>
    </div>
  )
}
