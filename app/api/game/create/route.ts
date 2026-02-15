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

    if (error) throw error

    return NextResponse.json({ code: game.code, gameId: game.id })
  } catch (e: any) {
    console.error('Create game error:', e)
    return NextResponse.json({ error: 'Kunde inte skapa spel' }, { status: 500 })
  }
}
