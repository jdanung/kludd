'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-kludd-pink/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-kludd-blue/20 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-kludd-lime/10 rounded-full blur-3xl animate-pulse-glow" />
      </div>

      <div className="relative z-10 text-center space-y-8">
        <h1 className="font-display text-7xl md:text-9xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-kludd-pink via-kludd-blue to-kludd-lime bg-clip-text text-transparent">
            KLUDD
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-white/60 font-display">
          Rita. Gissa. Lura dina vänner.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link
            href="/host"
            className="group relative px-10 py-5 bg-gradient-to-r from-kludd-pink to-kludd-orange rounded-2xl font-display text-2xl font-bold shadow-lg shadow-kludd-pink/25 hover:shadow-kludd-pink/40 hover:scale-105 transition-all duration-300"
          >
            <span className="relative z-10">Starta spel</span>
            <div className="absolute inset-0 bg-gradient-to-r from-kludd-pink to-kludd-orange rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
          </Link>

          <Link
            href="/play"
            className="group relative px-10 py-5 bg-gradient-to-r from-kludd-blue to-kludd-lime rounded-2xl font-display text-2xl font-bold shadow-lg shadow-kludd-blue/25 hover:shadow-kludd-blue/40 hover:scale-105 transition-all duration-300"
          >
            <span className="relative z-10">Gå med</span>
            <div className="absolute inset-0 bg-gradient-to-r from-kludd-blue to-kludd-lime rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
          </Link>
        </div>
      </div>
    </main>
  )
}
