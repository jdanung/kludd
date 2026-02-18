-- Migration: Lägg till scored-kolumn på drawings-tabellen
-- Kör detta i Supabase SQL Editor om du redan har databasen uppsatt

ALTER TABLE drawings ADD COLUMN IF NOT EXISTS scored BOOLEAN DEFAULT FALSE;
