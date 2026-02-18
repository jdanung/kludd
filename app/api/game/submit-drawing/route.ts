import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getPusherServer } from '@/lib/pusher-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { code, playerId, imageData, promptText, round } = await req.json()
    const currentRound = round || 1

    if (!code || !playerId || !imageData) {
      return NextResponse.json({ error: 'Data saknas' }, { status: 400 })
    }

    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('code', code)
      .neq('status', 'finished')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (gameError || !game) {
      console.error('Submit drawing: Game not found', { code, gameError })
      return NextResponse.json({ error: 'Spel hittades inte' }, { status: 404 })
    }

    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('id')
      .eq('id', playerId)
      .eq('game_id', game.id)
      .single()

    if (playerError || !player) {
      console.error('Submit drawing: Player does not belong to game', { playerId, gameId: game.id, playerError })
      return NextResponse.json({ error: 'Spelare matchar inte detta spel' }, { status: 400 })
    }

    const { data: existingDrawing } = await supabase
      .from('drawings')
      .select('*')
      .eq('game_id', game.id)
      .eq('player_id', playerId)
      .eq('round', currentRound)
      .maybeSingle()

    let drawing = existingDrawing

    if (!drawing) {
      const { data: newDrawing, error } = await supabase
        .from('drawings')
        .insert({
          game_id: game.id,
          player_id: playerId,
          prompt_text: promptText || 'En hemlig ritning',
          image_data: imageData,
          round: currentRound,
        })
        .select()
        .single()

      if (error) throw error
      drawing = newDrawing
    }

    const { data: existingOriginal } = await supabase
      .from('guesses')
      .select('id')
      .eq('drawing_id', drawing.id)
      .eq('is_original', true)
      .maybeSingle()

    // Lägg till den riktiga titeln som en "original"-gissning så man kan rösta på den
    if (!existingOriginal) {
      await supabase
        .from('guesses')
        .insert({
          drawing_id: drawing.id,
          player_id: playerId,
          text: promptText || 'En hemlig ritning',
          is_original: true,
        })
    }

    // Notify host that a drawing was submitted
    const pusherServer = getPusherServer()
    await pusherServer.trigger(`game-${code}`, 'drawing-submitted', {
      playerId,
    })

    // Check if all players have submitted
    const { data: playersForGame, error: playersForGameError } = await supabase
      .from('players')
      .select('id')
      .eq('game_id', game.id)

    if (playersForGameError) {
      console.error('Submit drawing: Failed to fetch players for game', playersForGameError)
      return NextResponse.json({ error: 'Kunde inte läsa spelare' }, { status: 500 })
    }

    const playerCount = playersForGame?.length || 0

    const { data: drawingsForRound } = await supabase
      .from('drawings')
      .select('player_id')
      .eq('game_id', game.id)
      .eq('round', currentRound)

    const submittedPlayerCount = new Set((drawingsForRound || []).map(d => d.player_id)).size

    console.log('Submit drawing progress', {
      code,
      gameId: game.id,
      playerId,
      playerCount,
      submittedPlayerCount,
      round: currentRound,
    })

    if (playerCount > 0 && submittedPlayerCount >= playerCount) {
      // All drawings done! Move to guessing phase
      const { error: updateError } = await supabase
        .from('games')
        .update({ 
          status: 'guessing',
          current_player_index: 0 
        })
        .eq('id', game.id)

      if (updateError) {
        console.error('Submit drawing: Failed to move phase to guessing', updateError)
        return NextResponse.json({ error: 'Kunde inte uppdatera spelstatus' }, { status: 500 })
      }

      await pusherServer.trigger(`game-${code}`, 'phase-changed', {
        phase: 'guessing',
      })

      return NextResponse.json({
        success: true,
        movedToGuessing: true,
        debug: {
          gameId: game.id,
          playerCount,
          submittedPlayerCount,
          round: currentRound,
        },
      })
    }

    return NextResponse.json({
      success: true,
      movedToGuessing: false,
      debug: {
        gameId: game.id,
        playerCount,
        submittedPlayerCount,
        round: currentRound,
      },
    })
  } catch (e: any) {
    console.error('Submit drawing error:', e)
    return NextResponse.json({ error: 'Kunde inte spara ritning' }, { status: 500 })
  }
}
