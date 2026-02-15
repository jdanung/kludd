-- ============================================
-- KLUDD – Supabase Schema
-- Kör detta i Supabase SQL Editor
-- ============================================

-- Games
CREATE TABLE games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(4) NOT NULL,
  status VARCHAR(20) DEFAULT 'lobby' NOT NULL,
  current_round INT DEFAULT 0,
  current_player_index INT DEFAULT 0,
  host_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_games_code ON games(code);
CREATE INDEX idx_games_status ON games(status);

-- Players
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  name VARCHAR(30) NOT NULL,
  avatar_url TEXT,
  score INT DEFAULT 0,
  player_order INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_players_game ON players(game_id);
CREATE INDEX idx_players_session ON players(session_id);

-- Prompts (förfyllda roliga instruktioner)
CREATE TABLE prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL
);

-- Drawings
CREATE TABLE drawings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES prompts(id),
  prompt_text TEXT NOT NULL,
  image_data TEXT NOT NULL,
  round INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_drawings_game ON drawings(game_id);

-- Guesses (falska + riktiga titlar)
CREATE TABLE guesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  drawing_id UUID REFERENCES drawings(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_original BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_guesses_drawing ON guesses(drawing_id);

-- Votes
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guess_id UUID REFERENCES guesses(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guess_id, player_id)
);

CREATE INDEX idx_votes_guess ON votes(guess_id);

-- ============================================
-- Row Level Security (öppen för party game)
-- ============================================
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE guesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for games" ON games FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for players" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for prompts" ON prompts FOR SELECT USING (true);
CREATE POLICY "Allow all for drawings" ON drawings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for guesses" ON guesses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for votes" ON votes FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Functions
-- ============================================
CREATE OR REPLACE FUNCTION increment_score(p_player_id UUID, p_amount INT)
RETURNS void AS $$
BEGIN
  UPDATE players
  SET score = score + p_amount
  WHERE id = p_player_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Seed: Roliga rit-instruktioner
-- ============================================
INSERT INTO prompts (text) VALUES
  ('En katt som spelar piano'),
  ('Världens sämsta frisyr'),
  ('En astronaut som äter tacos'),
  ('En hund som kör bil'),
  ('En zombie på semester'),
  ('En ninja som handlar på ICA'),
  ('En robot som är kär'),
  ('En drake som är rädd för eld'),
  ('En enhörning på gymmet'),
  ('En arg mormor på skateboard'),
  ('En professor som inte kan räkna'),
  ('En clown på jobbintervju'),
  ('Världens farligaste smörgås'),
  ('En sjöjungfru i öknen'),
  ('En tomte med solbränna'),
  ('En pirat som hatar vatten'),
  ('En kock som bara kan bränna mat'),
  ('Ett spöke som är rädd för mörker'),
  ('En viking på yoga'),
  ('En alien på IKEA'),
  ('En superhälte med dålig stil'),
  ('En björn som dansar balett'),
  ('En orm med armar'),
  ('En apa som kodar'),
  ('En elefant i ett badkar'),
  ('En pingvin på stranden'),
  ('Världens konstigaste husdjur'),
  ('En fisk som klättrar i träd'),
  ('En riddare som är rädd för hästar'),
  ('En vampyr på bloddonation'),
  ('En häxa som inte kan trolla'),
  ('En dinosaurie i tunnelbanan'),
  ('En detektiv som tappar allt'),
  ('En snögubbe på sommaren'),
  ('En cowboy på IKEA'),
  ('En bläckfisk som stickar'),
  ('Världens jobbigaste granne'),
  ('En trollkarl på Systembolaget'),
  ('En get som sjunger opera'),
  ('En krokodil hos tandläkaren');
