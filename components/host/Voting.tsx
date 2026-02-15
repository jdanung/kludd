'use client'

import type { Player, Drawing, Guess } from '@/lib/game-state'

interface HostVotingProps {
  players: Player[]
  currentDrawing: Drawing
  guesses: Guess[]
  submittedPlayerIds: string[]
}

export default function HostVoting({ players, currentDrawing, guesses, submittedPlayerIds }: HostVotingProps) {
  // Everyone except the artist votes
  const playersToVote = players.filter(p => p.id !== currentDrawing.player_id)
  
  // Shuffle guesses so the original isn't always first (in a real game)
  // For now, we just display them.
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-kludd-lime/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-kludd-blue/10 rounded-full blur-3xl animate-float-delayed" />
      </div>

      <div className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12">
        {/* Left: The Drawing */}
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <h1 className="font-display text-5xl md:text-6xl font-bold bg-gradient-to-r from-kludd-lime to-kludd-blue bg-clip-text text-transparent">
            VILKEN ÄR RÄTT?
          </h1>
          <div className="glass-card p-4 aspect-square max-w-lg mx-auto lg:mx-0 bg-white/5 border-2 border-white/10 shadow-2xl overflow-hidden">
             <img 
               src={currentDrawing.image_data} 
               alt="Rösta på rätt titel" 
               className="w-full h-full object-contain rounded-xl"
             />
          </div>
        </div>

        {/* Right: Guesses list and voting status */}
        <div className="w-full lg:w-[500px] space-y-8">
          <div className="glass-card p-8 bg-kludd-purple/20">
            <h2 className="font-display text-2xl text-white/60 mb-6 uppercase tracking-widest text-center">
              Alternativen
            </h2>
            
            <div className="space-y-3">
              {guesses.map((guess, i) => (
                <div key={guess.id} className="p-4 rounded-xl bg-white/10 border border-white/10 font-display text-xl font-bold text-center">
                  {guess.text}
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 bg-white/5">
            <h3 className="font-display text-lg text-white/40 mb-4 text-center uppercase tracking-wider">Vem har röstat?</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {playersToVote.map((player) => {
                const hasVoted = submittedPlayerIds.includes(player.id)
                return (
                  <div 
                    key={player.id}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                      hasVoted 
                        ? 'bg-kludd-lime text-kludd-bg scale-110 shadow-lg shadow-kludd-lime/20' 
                        : 'bg-white/5 text-white/10 border border-white/10'
                    }`}
                  >
                    {hasVoted ? (
                      <span className="text-xl">⭐</span>
                    ) : (
                      <span className="text-sm font-display font-bold">
                        {player.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 text-white/20 font-display text-sm">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <p>Väntar på rösterna...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
