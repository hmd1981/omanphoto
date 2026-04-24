-- Enum extension only (must commit before values are usable in the same migration run).
-- Inserts for these placements live in 20260424190002_page_hero_ai_studio_book_rows.
ALTER TYPE "PageHeroPlacement" ADD VALUE IF NOT EXISTS 'AI_STUDIO_HERO';
