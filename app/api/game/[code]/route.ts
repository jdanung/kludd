import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params

    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('code', code)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (gameError || !game) {
      return NextResponse.json({ error: 'Spelet hittades inte' }, { status: 404 })
    }

    const { data: players } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', game.id)
      .order('player_order')

    return NextResponse.json({ game, players: players || [] })
  } catch (e: any) {
    return NextResponse.json({ error: 'Serverfel' }, { status: 500 })
  }
}
