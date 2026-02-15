'use client'

import { Suspense } from 'react'
import JoinForm from '@/components/player/JoinForm'

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-kludd-blue border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <JoinForm />
    </Suspense>
  )
}
