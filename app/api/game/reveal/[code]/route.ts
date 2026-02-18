import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getPusherServer } from '@/lib/pusher-server'
import { unstable_noStore as noStore } from 'next/cache'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    noStore()
    const { code } = params

    // 1. Hämta spelet
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('code', code)
      .neq('status', 'finished')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (gameError || !game) {
      console.error('Reveal API: Game not found', { code, gameError })
      return NextResponse.json({ error: 'Spelet hittades inte' }, { status: 404 })
    }

    // 2. Hämta aktuell ritning för denna runda baserat på current_player_index
    const { data: players } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', game.id)
      .order('player_order')

    if (!players || players.length === 0) {
      throw new Error('Inga spelare hittades')
    }

    const currentPlayer = players[game.current_player_index || 0]

    const { data: drawing, error: drawingError } = await supabase
      .from('drawings')
      .select('*')
      .eq('game_id', game.id)
      .eq('player_id', currentPlayer.id)
      .eq('round', game.current_round || 1)
      .single()

    if (drawingError || !drawing) {
      console.error('Reveal API: Drawing not found', { gameId: game.id, currentPlayerId: currentPlayer.id, drawingError })
      return NextResponse.json({ error: 'Ritning hittades inte' }, { status: 404 })
    }

    // 3. Hämta alla gissningar för denna ritning (inklusive den rätta titeln)
    // Vi inkluderar namnet på spelaren som skrivit gissningen
    const { data: guesses, error: guessesError } = await supabase
      .from('guesses')
      .select('*, players!guesses_player_id_fkey(name)')
      .eq('drawing_id', drawing.id)

    if (guessesError) {
      console.error('Reveal API: Guesses fetch error', guessesError)
      throw guessesError
    }

    // 4. Hämta alla röster för dessa gissningar
    const guessIds = guesses?.map(g => g.id) || []
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('*, players!votes_player_id_fkey(name)')
      .in('guess_id', guessIds)

    if (votesError) {
      console.error('Reveal API: Votes fetch error', votesError)
      throw votesError
    }

    // 5. Beräkna poäng
    const results = guesses?.map(guess => {
      const guessVotes = votes?.filter(v => v.guess_id === guess.id) || []
      return {
        ...guess,
        playerName: (guess as any).players?.name,
        votes: guessVotes.map(v => ({ ...v, playerName: (v as any).players?.name })),
        voteCount: guessVotes.length
      }
    }) || []

    // Poäng räknas bara en gång per teckning — kolla om drawing redan är scored
    const { data: alreadyScored } = await supabase
      .from('drawings')
      .select('scored')
      .eq('id', drawing.id)
      .single()

    if (!alreadyScored?.scored) {
      for (const res of results) {
        if (res.is_original) {
          if (res.voteCount > 0) {
            const artistPoints = res.voteCount * 1000
            await supabase.rpc('increment_score', { p_player_id: drawing.player_id, p_amount: artistPoints })
            for (const vote of res.votes) {
              await supabase.rpc('increment_score', { p_player_id: vote.player_id, p_amount: 500 })
            }
          }
        } else {
          if (res.voteCount > 0) {
            const liarPoints = res.voteCount * 250
            await supabase.rpc('increment_score', { p_player_id: res.player_id, p_amount: liarPoints })
          }
        }
      }
      // Markera teckningen som scored
      await supabase
        .from('drawings')
        .update({ scored: true })
        .eq('id', drawing.id)
    }

    return NextResponse.json(
      {
        game,
        drawing,
        results,
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  } catch (e: any) {
    console.error('Reveal error:', e)
    return NextResponse.json({ error: 'Kunde inte hämta resultat', details: e.message }, { status: 500 })
  }
}
