import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getPusherServer } from '@/lib/pusher-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { code, playerId, imageData, promptText, round } = await req.json()

    if (!code || !playerId || !imageData) {
      return NextResponse.json({ error: 'Data saknas' }, { status: 400 })
    }

    const { data: game } = await supabase
      .from('games')
      .select('id')
      .eq('code', code)
      .single()

    if (!game) {
      return NextResponse.json({ error: 'Spel hittades inte' }, { status: 404 })
    }

    const { data: drawing, error } = await supabase
      .from('drawings')
      .insert({
        game_id: game.id,
        player_id: playerId,
        prompt_text: promptText || 'En hemlig ritning',
        image_data: imageData,
        round: round || 1,
      })
      .select()
      .single()

    if (error) throw error

    // Lägg till den riktiga titeln som en "original"-gissning så man kan rösta på den
    await supabase
      .from('guesses')
      .insert({
        drawing_id: drawing.id,
        player_id: playerId,
        text: promptText || 'En hemlig ritning',
        is_original: true
      })

    // Notify host that a drawing was submitted
    const pusherServer = getPusherServer()
    await pusherServer.trigger(`game-${code}`, 'drawing-submitted', {
      playerId,
    })

    // Check if all players have submitted
    const { count: playerCount } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', game.id)

    const { count: drawingCount } = await supabase
      .from('drawings')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', game.id)
      .eq('round', round || 1)

    if (playerCount && drawingCount && drawingCount >= playerCount) {
      // All drawings done! Move to guessing phase
      await supabase
        .from('games')
        .update({ 
          status: 'guessing',
          current_player_index: 0 
        })
        .eq('id', game.id)

      await pusherServer.trigger(`game-${code}`, 'phase-changed', {
        phase: 'guessing',
      })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('Submit drawing error:', e)
    return NextResponse.json({ error: 'Kunde inte spara ritning' }, { status: 500 })
  }
}
