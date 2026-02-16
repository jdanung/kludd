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

    // Hämta spelet - matcha på kod, skippa host_id-check för robusthet
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('code', code)
      .neq('status', 'finished')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (gameError || !game) {
      console.error('Next API: Game not found', { code, gameError })
      return NextResponse.json({ error: 'Spelet hittades inte' }, { status: 404 })
    }

    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id')
      .eq('game_id', game.id)
      .order('player_order')

    if (playersError || !players) {
      console.error('Next API: Players error', playersError)
      throw new Error('Inga spelare hittades')
    }

    const nextPlayerIndex = (game.current_player_index || 0) + 1
    const pusherServer = getPusherServer()

    console.log('Next API: Progressing to index', nextPlayerIndex, 'of', players.length)

    if (nextPlayerIndex < players.length) {
      // Det finns fler teckningar i denna runda
      await supabase
        .from('games')
        .update({
          current_player_index: nextPlayerIndex,
          status: 'guessing'
        })
        .eq('id', game.id)

      await pusherServer.trigger(`game-${code}`, 'phase-changed', {
        phase: 'guessing'
      })
      console.log('Next API: Triggered guessing phase for index', nextPlayerIndex)
    } else {
      // Alla har visat sina teckningar, gå till slutställning
      await supabase
        .from('games')
        .update({
          status: 'scores'
        })
        .eq('id', game.id)

      await pusherServer.trigger(`game-${code}`, 'phase-changed', {
        phase: 'scores'
      })
      console.log('Next API: Triggered scores phase')
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('Next round error:', e)
    return NextResponse.json({ error: 'Kunde inte gå till nästa runda', details: e.message }, { status: 500 })
  }
}
