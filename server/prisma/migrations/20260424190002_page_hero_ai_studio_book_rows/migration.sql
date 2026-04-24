INSERT INTO "PageHeroMedia" ("id", "placement", "active", "sortOrder", "mediaType", "imageMediaId", "videoMediaId", "videoUrl", "updatedAt")
SELECT 'cminit_pagehero_aistudio', 'AI_STUDIO_HERO'::"PageHeroPlacement", false, 50, 'IMAGE', NULL, NULL, NULL, NOW()
WHERE NOT EXISTS (SELECT 1 FROM "PageHeroMedia" WHERE "placement" = 'AI_STUDIO_HERO');

INSERT INTO "PageHeroMedia" ("id", "placement", "active", "sortOrder", "mediaType", "imageMediaId", "videoMediaId", "videoUrl", "updatedAt")
SELECT 'cminit_pagehero_book', 'BOOK_HERO'::"PageHeroPlacement", false, 60, 'IMAGE', NULL, NULL, NULL, NOW()
WHERE NOT EXISTS (SELECT 1 FROM "PageHeroMedia" WHERE "placement" = 'BOOK_HERO');
