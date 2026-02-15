'use client'

import { QRCodeSVG } from 'qrcode.react'
import type { Player } from '@/lib/game-state'

const PLAYER_COLORS = [
  'from-pink-500 to-rose-500',
  'from-blue-500 to-cyan-500',
  'from-green-400 to-emerald-500',
  'from-orange-500 to-amber-500',
  'from-purple-500 to-violet-500',
  'from-teal-400 to-cyan-400',
  'from-red-500 to-pink-500',
  'from-yellow-400 to-orange-400',
]

interface HostLobbyProps {
  code: string
  players: Player[]
  onStartGame: () => void
}

export default function HostLobby({ code, players, onStartGame }: HostLobbyProps) {
  const joinUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/play?code=${code}`
      : ''

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-20 w-96 h-96 bg-kludd-pink/15 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 right-20 w-80 h-80 bg-kludd-blue/15 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-kludd-lime/10 rounded-full blur-3xl animate-pulse-glow" />
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        {/* Title */}
        <h1 className="font-display text-5xl md:text-6xl font-bold text-center mb-10 bg-gradient-to-r from-kludd-pink via-kludd-blue to-kludd-lime bg-clip-text text-transparent">
          KLUDD
        </h1>

        <div className="flex flex-col lg:flex-row items-start justify-center gap-10">
          {/* Left: Code + QR */}
          <div className="flex-shrink-0 text-center space-y-6">
            <div>
              <p className="font-display text-lg text-white/40 uppercase tracking-widest">
                Spelkod
              </p>
              <p className="font-display text-7xl md:text-8xl font-bold tracking-[0.3em] bg-gradient-to-r from-kludd-pink to-kludd-orange bg-clip-text text-transparent">
                {code}
              </p>
            </div>

            <div className="glass-card p-5 inline-block">
              {joinUrl && (
                <QRCodeSVG
                  value={joinUrl}
                  size={180}
                  bgColor="transparent"
                  fgColor="#ffffff"
                  level="M"
                />
              )}
              <p className="text-xs text-white/30 mt-3 font-display">
                Skanna för att gå med
              </p>
            </div>

            <p className="text-white/20 text-sm max-w-[220px] mx-auto break-all">
              {joinUrl}
            </p>
          </div>

          {/* Right: Players */}
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-3xl font-bold text-white/80 mb-6">
              Spelare{' '}
              <span className="text-kludd-blue">({players.length})</span>
            </h2>

            {players.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <p className="text-6xl mb-4">👀</p>
                <p className="font-display text-xl text-white/40">
                  Väntar på spelare...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {players.map((player, i) => (
                  <div
                    key={player.id}
                    className="animate-bounce-in"
                    style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'both' }}
                  >
                    <div
                      className={`bg-gradient-to-br ${PLAYER_COLORS[i % PLAYER_COLORS.length]} rounded-2xl p-4 text-center shadow-lg`}
                    >
                      <div className="w-16 h-16 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-2">
                        <span className="text-2xl font-display font-bold">
                          {player.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <p className="font-display font-bold text-lg truncate">
                        {player.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {players.length >= 2 && (
              <div className="mt-8 text-center animate-slide-up">
                <button
                  onClick={onStartGame}
                  className="px-12 py-5 bg-gradient-to-r from-kludd-lime to-kludd-blue rounded-2xl font-display text-3xl font-bold shadow-lg shadow-kludd-lime/25 hover:shadow-kludd-lime/40 hover:scale-105 active:scale-95 transition-all duration-300 text-kludd-bg"
                >
                  STARTA SPELET!
                </button>
              </div>
            )}

            {players.length === 1 && (
              <p className="mt-6 text-center text-white/30 font-display">
                Minst 2 spelare behövs för att starta
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
