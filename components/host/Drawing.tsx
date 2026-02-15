'use client'

import type { Player } from '@/lib/game-state'

interface HostDrawingProps {
  players: Player[]
  submittedPlayerIds: string[]
}

export default function HostDrawing({ players, submittedPlayerIds }: HostDrawingProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-kludd-pink/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-kludd-blue/10 rounded-full blur-3xl animate-float-delayed" />
      </div>

      <div className="relative z-10 w-full max-w-5xl text-center space-y-12">
        <div className="space-y-4">
          <h1 className="font-display text-6xl md:text-8xl font-bold bg-gradient-to-r from-kludd-pink to-kludd-orange bg-clip-text text-transparent animate-pulse-glow">
            DAGS ATT RITA!
          </h1>
          <p className="text-2xl md:text-3xl text-white/60 font-display">
            Kolla din mobil för instruktioner...
          </p>
        </div>

        <div className="glass-card p-12 max-w-3xl mx-auto">
          <h2 className="font-display text-2xl text-white/40 mb-8 uppercase tracking-widest">
            Vem är klar?
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {players.map((player) => {
              const isDone = submittedPlayerIds.includes(player.id)
              return (
                <div key={player.id} className="space-y-3">
                  <div 
                    className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center transition-all duration-500 ${
                      isDone 
                        ? 'bg-kludd-lime text-kludd-bg scale-110 rotate-3 shadow-lg shadow-kludd-lime/20' 
                        : 'bg-white/5 text-white/20 grayscale'
                    }`}
                  >
                    {isDone ? (
                      <span className="text-4xl">✅</span>
                    ) : (
                      <span className="text-3xl font-display font-bold">
                        {player.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className={`font-display font-bold truncate ${isDone ? 'text-kludd-lime' : 'text-white/40'}`}>
                    {player.name}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="pt-8 flex items-center justify-center gap-4 text-white/20 font-display">
          <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <p className="text-xl italic">Väntar på att alla ska kladda klart...</p>
        </div>
      </div>
    </div>
  )
}
