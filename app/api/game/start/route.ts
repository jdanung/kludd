import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getPusherServer } from '@/lib/pusher-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { code, hostId } = await req.json()
    console.log('Start game request:', { code, hostId })

    // Hämta spelet – matcha på kod, skippa host_id-check för robusthet
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('code', code)
      .neq('status', 'finished')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (gameError || !game) {
      console.error('Start: Game not found', { code, gameError })
      return NextResponse.json(
        { error: 'Spelet hittades inte' },
        { status: 404 }
      )
    }

    console.log('Start: Found game', game.id, 'status:', game.status)

    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id')
      .eq('game_id', game.id)

    console.log('Start: Players found:', players?.length, playersError)

    if (!players || players.length < 2) {
      return NextResponse.json({ error: 'Minst 2 spelare krävs' }, { status: 400 })
    }

    // Hämta alla prompts och slumpa en per spelare
    const { data: prompts, error: promptsError } = await supabase
      .from('prompts')
      .select('*')

    console.log('Start: Prompts found:', prompts?.length, promptsError)

    if (!prompts || prompts.length === 0) {
      return NextResponse.json({ 
        error: 'Inga prompts hittades i databasen. Kör SQL-schemat i Supabase.' 
      }, { status: 500 })
    }

    const shuffledPrompts = [...prompts].sort(() => 0.5 - Math.random())

    const playerPrompts = players.map((p, i) => ({
      playerId: p.id,
      prompt: shuffledPrompts[i % shuffledPrompts.length].text
    }))

    const { error: updateError } = await supabase
      .from('games')
      .update({
        status: 'drawing',
        current_round: 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', game.id)

    if (updateError) {
      console.error('Start: Game update error:', updateError)
      return NextResponse.json({ error: `DB-uppdatering misslyckades: ${updateError.message}` }, { status: 500 })
    }

    console.log('Start: Game updated to drawing phase, triggering Pusher...')

    try {
      const pusherServer = getPusherServer()
      await pusherServer.trigger(`game-${code}`, 'phase-changed', {
        phase: 'drawing',
        prompts: playerPrompts
      })
      console.log('Start: Pusher triggered successfully')
    } catch (pusherErr: any) {
      console.error('Start: Pusher trigger failed:', pusherErr)
      // Fortsätt ändå – spelet har uppdaterats i DB
    }

    return NextResponse.json({ success: true, prompts: playerPrompts })
  } catch (e: any) {
    console.error('Start game error:', e)
    return NextResponse.json({ 
      error: 'Kunde inte starta spelet',
      details: e.message || String(e)
    }, { status: 500 })
  }
}
