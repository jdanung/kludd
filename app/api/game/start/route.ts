import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { pusherServer } from '@/lib/pusher-server'

export async function POST(req: NextRequest) {
  try {
    const { code, hostId } = await req.json()

    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('code', code)
      .eq('host_id', hostId)
      .eq('status', 'lobby')
      .single()

    if (gameError || !game) {
      return NextResponse.json(
        { error: 'Spelet hittades inte eller du är inte host' },
        { status: 403 }
      )
    }

    const { count } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', game.id)

    if (!count || count < 2) {
      return NextResponse.json({ error: 'Minst 2 spelare krävs' }, { status: 400 })
    }

    // Hämta alla prompts och slumpa en per spelare
    const { data: prompts } = await supabase.from('prompts').select('*')
    const { data: players } = await supabase.from('players').select('id').eq('game_id', game.id)

    if (!prompts || !players) throw new Error('Kunde inte hämta prompts eller spelare')

    const shuffledPrompts = [...prompts].sort(() => 0.5 - Math.random())
    
    // Uppdatera spelare med deras tilldelade prompts (vi sparar detta i en temporär tabell eller skickar via Pusher)
    // För enkelhetens skull skickar vi dem via Pusher till varje spelare i nästa steg
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

    if (updateError) throw updateError

    await pusherServer.trigger(`game-${code}`, 'phase-changed', {
      phase: 'drawing',
      prompts: playerPrompts
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('Start game error:', e)
    return NextResponse.json({ error: 'Kunde inte starta spelet' }, { status: 500 })
  }
}
