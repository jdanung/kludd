import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { pusherServer } from '@/lib/pusher-server'

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params

    // 1. Hämta spelet
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('code', code)
      .single()

    if (gameError || !game) {
      return NextResponse.json({ error: 'Spelet hittades inte' }, { status: 404 })
    }

    // 2. Hämta aktuell ritning för denna runda
    const { data: drawing, error: drawingError } = await supabase
      .from('drawings')
      .select('*')
      .eq('game_id', game.id)
      .eq('round', game.current_round || 1)
      .single()

    if (drawingError || !drawing) {
      return NextResponse.json({ error: 'Ritning hittades inte' }, { status: 404 })
    }

    // 3. Hämta alla gissningar för denna ritning (inklusive den rätta titeln)
    const { data: guesses, error: guessesError } = await supabase
      .from('guesses')
      .select('*, players(name)')
      .eq('drawing_id', drawing.id)

    // 4. Hämta alla röster för dessa gissningar
    const guessIds = guesses?.map(g => g.id) || []
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('*, players(name)')
      .in('guess_id', guessIds)

    // 5. Beräkna och spara poäng (enkel version likt Drawful)
    const results = guesses?.map(guess => {
      const guessVotes = votes?.filter(v => v.guess_id === guess.id) || []
      return {
        ...guess,
        votes: guessVotes,
        voteCount: guessVotes.length
      }
    }) || []

    // Uppdatera poäng i databasen
    for (const res of results) {
      if (res.is_original) {
        // Artist får poäng per person som gissat rätt
        if (res.voteCount > 0) {
          const artistPoints = res.voteCount * 1000
          await supabase.rpc('increment_score', { p_player_id: drawing.player_id, p_amount: artistPoints })
          
          // Spelare som gissat rätt får poäng
          for (const vote of res.votes) {
            await supabase.rpc('increment_score', { p_player_id: vote.player_id, p_amount: 500 })
          }
        }
      } else {
        // Spelare som lurat andra får poäng
        if (res.voteCount > 0) {
          const liarPoints = res.voteCount * 250
          await supabase.rpc('increment_score', { p_player_id: res.player_id, p_amount: liarPoints })
        }
      }
    }

    return NextResponse.json({
      game,
      drawing,
      results
    })
  } catch (e: any) {
    console.error('Reveal error:', e)
    return NextResponse.json({ error: 'Kunde inte hämta resultat' }, { status: 500 })
  }
}
