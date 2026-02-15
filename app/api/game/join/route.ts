import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getPusherServer } from '@/lib/pusher-server'

export async function POST(req: NextRequest) {
  try {
    const { code, name, sessionId } = await req.json()

    if (!code || !name || !sessionId) {
      return NextResponse.json({ error: 'Kod, namn och sessionId krävs' }, { status: 400 })
    }

    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('code', code)
      .eq('status', 'lobby')
      .single()

    if (gameError || !game) {
      return NextResponse.json(
        { error: 'Spelet hittades inte eller har redan startat' },
        { status: 404 }
      )
    }

    const { data: existing } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', game.id)
      .eq('session_id', sessionId)
      .single()

    if (existing) {
      return NextResponse.json({ player: existing })
    }

    const { count } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', game.id)

    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({
        game_id: game.id,
        session_id: sessionId,
        name: name.trim(),
        score: 0,
        player_order: count || 0,
      })
      .select()
      .single()

    if (playerError) throw playerError

    const pusherServer = getPusherServer()
    await pusherServer.trigger(`game-${code}`, 'player-joined', {
      player: { id: player.id, name: player.name },
    })

    return NextResponse.json({ player })
  } catch (e: any) {
    console.error('Join game error:', e)
    return NextResponse.json({ error: 'Kunde inte gå med i spelet' }, { status: 500 })
  }
}
