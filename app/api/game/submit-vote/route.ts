import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getPusherServer } from '@/lib/pusher-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { code, playerId, guessId } = await req.json()

    if (!code || !playerId || !guessId) {
      return NextResponse.json({ error: 'Data saknas' }, { status: 400 })
    }

    const { data: vote, error: voteError } = await supabase
      .from('votes')
      .insert({
        guess_id: guessId,
        player_id: playerId,
      })
      .select()

    if (voteError) {
      if (voteError.code === '23505') {
        return NextResponse.json({ error: 'Du har redan röstat' }, { status: 400 })
      }
      console.error('Submit vote: Insert error:', voteError)
      return NextResponse.json({ error: `Kunde inte spara röst: ${voteError.message}` }, { status: 500 })
    }

    // Notify host that a vote was submitted
    const pusherServer = getPusherServer()
    await pusherServer.trigger(`game-${code}`, 'vote-submitted', {
      playerId,
    })

    // Check if all players (except the artist of the current drawing) have voted
    const { data: guess, error: guessError } = await supabase
      .from('guesses')
      .select('drawing_id')
      .eq('id', guessId)
      .single()

    if (guessError || !guess) throw new Error('Gissning hittades inte')

    const { data: drawing, error: drawingError } = await supabase
      .from('drawings')
      .select('player_id, game_id')
      .eq('id', guess.drawing_id)
      .single()

    if (drawingError || !drawing) throw new Error('Teckning hittades inte')

    const { data: players } = await supabase
      .from('players')
      .select('id')
      .eq('game_id', drawing.game_id)

    const playerCount = players?.length || 0

    // Count votes for all guesses related to this drawing
    const { data: guessesForDrawing } = await supabase
      .from('guesses')
      .select('id')
      .eq('drawing_id', guess.drawing_id)

    const guessIds = guessesForDrawing?.map(g => g.id) || []
    
    const { count: totalVotes } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .in('guess_id', guessIds)

    console.log(`Submit vote: Progress for drawing ${guess.drawing_id}: ${totalVotes}/${playerCount - 1}`)

    // Everyone except the artist votes
    if (playerCount > 0 && totalVotes !== null && totalVotes >= (playerCount - 1)) {
      console.log('All votes submitted. Moving to reveal phase.')
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
    return NextResponse.json({ error: 'Kunde inte spara röst', details: e.message }, { status: 500 })
  }
}
