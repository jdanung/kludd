import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getPusherServer } from '@/lib/pusher-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { code, playerId, drawingId, text } = await req.json()

    if (!code || !playerId || !drawingId || !text) {
      return NextResponse.json({ error: 'Data saknas' }, { status: 400 })
    }

    const { data: guess, error } = await supabase
      .from('guesses')
      .insert({
        drawing_id: drawingId,
        player_id: playerId,
        text: text.trim(),
        is_original: false
      })
      .select()
      .single()

    if (error) throw error

    // Notify host that a guess was submitted
    const pusherServer = getPusherServer()
    await pusherServer.trigger(`game-${code}`, 'guess-submitted', {
      playerId,
    })

    // Check if all players (except the owner of the drawing) have submitted
    const { data: drawing } = await supabase
      .from('drawings')
      .select('player_id, game_id')
      .eq('id', drawingId)
      .single()

    if (!drawing) throw new Error('Teckning hittades inte')

    const { count: playerCount } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', drawing.game_id)

    const { count: guessCount } = await supabase
      .from('guesses')
      .select('*', { count: 'exact', head: true })
      .eq('drawing_id', drawingId)
      .eq('is_original', false)

    // In Drawful, everyone except the artist writes a fake title
    if (playerCount && guessCount && guessCount >= (playerCount - 1)) {
      // All guesses done! Move to voting phase
      await supabase
        .from('games')
        .update({ status: 'voting' })
        .eq('id', drawing.game_id)

      await pusherServer.trigger(`game-${code}`, 'phase-changed', {
        phase: 'voting',
      })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('Submit guess error:', e)
    return NextResponse.json({ error: 'Kunde inte spara gissning' }, { status: 500 })
  }
}
