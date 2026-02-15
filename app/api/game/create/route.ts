import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateGameCode } from '@/lib/game-state'

export async function POST(req: NextRequest) {
  try {
    const { hostId } = await req.json()

    if (!hostId) {
      return NextResponse.json({ error: 'hostId krävs' }, { status: 400 })
    }

    let code: string
    let exists = true
    do {
      code = generateGameCode()
      const { data } = await supabase
        .from('games')
        .select('id')
        .eq('code', code)
        .eq('status', 'lobby')
        .single()
      exists = !!data
    } while (exists)

    const { data: game, error } = await supabase
      .from('games')
      .insert({
        code,
        status: 'lobby',
        host_id: hostId,
        current_round: 0,
        current_player_index: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error inserting game:', error)
      return NextResponse.json({ error: `Supabase fel: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ code: game.code, gameId: game.id })
  } catch (e: any) {
    console.error('Create game error:', e)
    return NextResponse.json({ 
      error: 'Kunde inte skapa spel',
      details: e.message || String(e)
    }, { status: 500 })
  }
}
