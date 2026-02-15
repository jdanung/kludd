import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kludd – Rita, Gissa & Lura!',
  description: 'Ett roligt multiplayer-ritspel för vänner',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sv">
      <body className="min-h-screen bg-kludd-bg text-white antialiased">
        {children}
      </body>
    </html>
  )
}
