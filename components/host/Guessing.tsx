'use client'

import type { Player, Drawing } from '@/lib/game-state'

interface HostGuessingProps {
  players: Player[]
  currentDrawing: Drawing
  submittedPlayerIds: string[]
}

export default function HostGuessing({ players, currentDrawing, submittedPlayerIds }: HostGuessingProps) {
  // We exclude the artist from the "who is left" list
  const playersToGuess = players.filter(p => p.id !== currentDrawing.player_id)
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-kludd-blue/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-kludd-pink/10 rounded-full blur-3xl animate-float-delayed" />
      </div>

      <div className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12">
        {/* Left: The Drawing */}
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <h1 className="font-display text-5xl md:text-6xl font-bold bg-gradient-to-r from-kludd-blue to-kludd-blue bg-clip-text text-transparent">
            VAD ÄR DETTA?
          </h1>
          <div className="glass-card p-4 aspect-square max-w-lg mx-auto lg:mx-0 bg-white/5 border-2 border-white/10 shadow-2xl overflow-hidden">
             <img 
               src={currentDrawing.image_data} 
               alt="Gissa ritningen" 
               className="w-full h-full object-contain rounded-xl"
             />
          </div>
          <p className="text-xl text-white/40 font-display italic">
            Hitta på en titel som lurar de andra...
          </p>
        </div>

        {/* Right: Players status */}
        <div className="w-full lg:w-96 space-y-8">
          <div className="glass-card p-8 bg-kludd-purple/20">
            <h2 className="font-display text-2xl text-white/60 mb-6 uppercase tracking-widest text-center">
              Lögner inkomna
            </h2>
            
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
              {playersToGuess.map((player) => {
                const isDone = submittedPlayerIds.includes(player.id)
                return (
                  <div key={player.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 transition-all duration-500">
                    <div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                        isDone 
                          ? 'bg-kludd-blue text-kludd-bg scale-110 shadow-lg shadow-kludd-blue/20' 
                          : 'bg-white/5 text-white/10'
                      }`}
                    >
                      {isDone ? (
                        <span className="text-xl">✍️</span>
                      ) : (
                        <span className="text-lg font-display font-bold">
                          {player.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-display font-bold truncate ${isDone ? 'text-kludd-blue' : 'text-white/20'}`}>
                        {player.name}
                      </p>
                      <p className="text-xs text-white/20 uppercase tracking-tighter">
                        {isDone ? 'Har ljugit klart' : 'Tänker...'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 text-white/20 font-display text-sm">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <p>Väntar på lögnerna...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
