import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getPusherServer } from '@/lib/pusher-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()

    if (!code) {
      return NextResponse.json({ error: 'Kod saknas' }, { status: 400 })
    }

    // Hämta spelet - matcha på kod, skippa host_id-check för robusthet
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('code', code)
      .neq('status', 'finished')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (gameError || !game) {
      console.error('Next API: Game not found', { code, gameError })
      return NextResponse.json({ error: 'Spelet hittades inte' }, { status: 404 })
    }

    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id')
      .eq('game_id', game.id)
      .order('player_order')

    if (playersError || !players) {
      console.error('Next API: Players error', playersError)
      throw new Error('Inga spelare hittades')
    }

    const currentIndex = game.current_player_index || 0
    const nextPlayerIndex = currentIndex + 1
    const pusherServer = getPusherServer()

    console.log('Next API: Progressing to index', nextPlayerIndex, 'of', players.length)

    // Räkna poäng för den teckning vi precis visade (currentIndex)
    const currentPlayer = players[currentIndex]
    if (currentPlayer) {
      const { data: drawing } = await supabase
        .from('drawings')
        .select('id, player_id, scored')
        .eq('game_id', game.id)
        .eq('player_id', currentPlayer.id)
        .eq('round', game.current_round || 1)
        .maybeSingle()

      if (drawing && !drawing.scored) {
        const { data: guesses } = await supabase
          .from('guesses')
          .select('id, player_id, is_original')
          .eq('drawing_id', drawing.id)

        const guessIds = (guesses || []).map(g => g.id)
        const { data: votes } = await supabase
          .from('votes')
          .select('guess_id, player_id')
          .in('guess_id', guessIds)

        // Bygg upp en map: player_id -> poäng att lägga till
        const scoreMap: Record<string, number> = {}
        const addScore = (pid: string, pts: number) => {
          scoreMap[pid] = (scoreMap[pid] || 0) + pts
        }

        for (const guess of guesses || []) {
          const guessVotes = (votes || []).filter(v => v.guess_id === guess.id)
          if (guessVotes.length === 0) continue
          if (guess.is_original) {
            // Konstnären får 1000p per röst på rätt svar
            addScore(drawing.player_id, guessVotes.length * 1000)
            // De som röstade rätt får 500p
            for (const vote of guessVotes) {
              addScore(vote.player_id, 500)
            }
          } else {
            // Lögnaren får 250p per röst på sin lögn
            addScore(guess.player_id, guessVotes.length * 250)
          }
        }

        // Hämta nuvarande poäng och uppdatera med direkta UPDATE
        for (const [playerId, pts] of Object.entries(scoreMap)) {
          const { data: playerRow } = await supabase
            .from('players')
            .select('score')
            .eq('id', playerId)
            .single()
          const currentScore = playerRow?.score || 0
          const { error: scoreError } = await supabase
            .from('players')
            .update({ score: currentScore + pts })
            .eq('id', playerId)
          if (scoreError) {
            console.error('Next API: Failed to update score for', playerId, scoreError)
          } else {
            console.log(`Next API: +${pts}p to player ${playerId} (total: ${currentScore + pts})`)
          }
        }

        await supabase
          .from('drawings')
          .update({ scored: true })
          .eq('id', drawing.id)

        console.log('Next API: Scored drawing', drawing.id)
      }
    }

    if (nextPlayerIndex < players.length) {
      // Det finns fler teckningar i denna runda
      await supabase
        .from('games')
        .update({
          current_player_index: nextPlayerIndex,
          status: 'guessing'
        })
        .eq('id', game.id)

      await pusherServer.trigger(`game-${code}`, 'phase-changed', {
        phase: 'guessing'
      })
      console.log('Next API: Triggered guessing phase for index', nextPlayerIndex)
    } else {
      // Alla har visat sina teckningar, gå till slutställning
      await supabase
        .from('games')
        .update({
          status: 'scores'
        })
        .eq('id', game.id)

      await pusherServer.trigger(`game-${code}`, 'phase-changed', {
        phase: 'scores'
      })
      console.log('Next API: Triggered scores phase')
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('Next round error:', e)
    return NextResponse.json({ error: 'Kunde inte gå till nästa runda', details: e.message }, { status: 500 })
  }
}
