import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { unstable_noStore as noStore } from 'next/cache'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    noStore()
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
      .in('status', ['lobby', 'drawing', 'guessing', 'voting', 'reveal', 'scores'])
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

    return NextResponse.json(
      { game, players: players || [] },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  } catch (e: any) {
    return NextResponse.json({ error: 'Serverfel' }, { status: 500 })
  }
}
