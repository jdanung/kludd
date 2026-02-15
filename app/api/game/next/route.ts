import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { pusherServer } from '@/lib/pusher-server'

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()

    if (!code) {
      return NextResponse.json({ error: 'Kod saknas' }, { status: 400 })
    }

    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('code', code)
      .single()

    if (gameError || !game) {
      return NextResponse.json({ error: 'Spelet hittades inte' }, { status: 404 })
    }

    const { data: players } = await supabase
      .from('players')
      .select('id')
      .eq('game_id', game.id)
      .order('player_order')

    if (!players) throw new Error('Inga spelare hittades')

    const nextPlayerIndex = game.current_player_index + 1

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
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('Next round error:', e)
    return NextResponse.json({ error: 'Kunde inte gå till nästa runda' }, { status: 500 })
  }
}
