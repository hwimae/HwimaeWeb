-- Drop heavy/legacy tables for the lightweight MVP.
-- Back up the database before applying this migration if any old imported content or dataset comments must be preserved.
DROP TABLE IF EXISTS "story_contents";
DROP TABLE IF EXISTS "external_reviews";
DROP TABLE IF EXISTS "reviews";
