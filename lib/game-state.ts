export type GamePhase =
  | 'lobby'
  | 'drawing'
  | 'guessing'
  | 'voting'
  | 'reveal'
  | 'scores'
  | 'finished'

export interface Game {
  id: string
  code: string
  status: GamePhase
  current_round: number
  current_player_index: number
  host_id: string
  created_at: string
  updated_at: string
}

export interface Player {
  id: string
  game_id: string
  session_id: string
  name: string
  avatar_url: string | null
  score: number
  player_order: number | null
  created_at: string
}

export interface Drawing {
  id: string
  game_id: string
  player_id: string
  prompt_id: string | null
  prompt_text: string
  image_data: string
  round: number
  created_at: string
}

export interface Guess {
  id: string
  drawing_id: string
  player_id: string
  text: string
  is_original: boolean
  created_at: string
}

export interface Vote {
  id: string
  guess_id: string
  player_id: string
  created_at: string
}

export function generateGameCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export function generateSessionId(): string {
  return crypto.randomUUID()
}
