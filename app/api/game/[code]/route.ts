import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params

    const { data: allGames } = await supabase
      .from('games')
      .select('id, status, created_at')
      .eq('code', code)
    
    console.log(`API [code]: All games with code ${code}:`, allGames)

    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('code', code)
      .neq('status', 'finished')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (gameError || !game) {
      console.log('Game not found for code:', code, gameError)
      return NextResponse.json({ error: 'Spelet hittades inte' }, { status: 404 })
    }

    console.log('API [code]: Found game', game.id, 'with status', game.status)

    const { data: players } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', game.id)
      .order('player_order')

    console.log('API [code]: Found players:', players?.length || 0)

    return NextResponse.json({ game, players: players || [] })
  } catch (e: any) {
    return NextResponse.json({ error: 'Serverfel' }, { status: 500 })
  }
}
