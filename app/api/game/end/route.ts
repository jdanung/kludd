import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getPusherServer } from '@/lib/pusher-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()

    if (!code) {
      return NextResponse.json({ error: 'Kod saknas' }, { status: 400 })
    }

    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id')
      .eq('code', code)
      .neq('status', 'finished')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (gameError || !game) {
      return NextResponse.json({ error: 'Spelet hittades inte' }, { status: 404 })
    }

    await supabase
      .from('games')
      .update({ status: 'finished' })
      .eq('id', game.id)

    const pusherServer = getPusherServer()
    await pusherServer.trigger(`game-${code}`, 'phase-changed', {
      phase: 'finished'
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('End game error:', e)
    return NextResponse.json({ error: 'Kunde inte avsluta spelet' }, { status: 500 })
  }
}
