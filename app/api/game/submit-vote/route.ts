import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getPusherServer } from '@/lib/pusher-server'

export async function POST(req: NextRequest) {
  try {
    const { code, playerId, guessId } = await req.json()

    if (!code || !playerId || !guessId) {
      return NextResponse.json({ error: 'Data saknas' }, { status: 400 })
    }

    const { data: vote, error } = await supabase
      .from('votes')
      .insert({
        guess_id: guessId,
        player_id: playerId,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Du har redan röstat' }, { status: 400 })
      }
      throw error
    }

    // Notify host that a vote was submitted
    const pusherServer = getPusherServer()
    await pusherServer.trigger(`game-${code}`, 'vote-submitted', {
      playerId,
    })

    // Check if all players (except the artist of the current drawing) have voted
    const { data: guess } = await supabase
      .from('guesses')
      .select('drawing_id')
      .eq('id', guessId)
      .single()

    if (!guess) throw new Error('Gissning hittades inte')

    const { data: drawing } = await supabase
      .from('drawings')
      .select('player_id, game_id')
      .eq('id', guess.drawing_id)
      .single()

    if (!drawing) throw new Error('Teckning hittades inte')

    const { count: playerCount } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', drawing.game_id)

    const { count: voteCount } = await supabase
      .from('votes')
      .select('v.id', { count: 'exact', head: true })
      .filter('guess_id', 'in', 
        supabase
          .from('guesses')
          .select('id')
          .eq('drawing_id', guess.drawing_id)
      )

    // Actually we need to count votes for all guesses related to this drawing
    const { data: guessesForDrawing } = await supabase
      .from('guesses')
      .select('id')
      .eq('drawing_id', guess.drawing_id)

    const guessIds = guessesForDrawing?.map(g => g.id) || []
    
    const { count: totalVotes } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .in('guess_id', guessIds)

    // Everyone except the artist votes
    if (playerCount && totalVotes && totalVotes >= (playerCount - 1)) {
      // All votes done! Move to reveal phase
      await supabase
        .from('games')
        .update({ status: 'reveal' })
        .eq('id', drawing.game_id)

      await pusherServer.trigger(`game-${code}`, 'phase-changed', {
        phase: 'reveal',
      })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('Submit vote error:', e)
    return NextResponse.json({ error: 'Kunde inte spara röst' }, { status: 500 })
  }
}
