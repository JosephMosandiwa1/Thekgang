-- ============================================================================
-- 014_search_vectors.sql
--
-- Full-text search via Postgres tsvector generated columns + GIN indexes.
-- Covers: posts · events · books · jobs · consultations · pages.
-- English configuration (no SA-specific dictionary available OOTB — still
-- vastly better than ilike pattern scans).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- POSTS (jsonb content → stringified for FTS)
-- ---------------------------------------------------------------------------
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(excerpt, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(category, '')), 'C') ||
      setweight(to_tsvector('english', coalesce(content::text, '')), 'D')
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_posts_search ON posts USING GIN(search_tsv);


-- ---------------------------------------------------------------------------
-- PAGES
-- ---------------------------------------------------------------------------
ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(meta_description, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(content::text, '')), 'D')
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_pages_search ON pages USING GIN(search_tsv);


-- ---------------------------------------------------------------------------
-- EVENTS
-- ---------------------------------------------------------------------------
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(venue, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(description, '')), 'C') ||
      setweight(to_tsvector('english', coalesce(notes, '')), 'D')
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_events_search ON events USING GIN(search_tsv);


-- ---------------------------------------------------------------------------
-- BOOKS
-- ---------------------------------------------------------------------------
ALTER TABLE books
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(subtitle, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(array_to_string(author_names, ' '), '')), 'A') ||
      setweight(to_tsvector('english', coalesce(array_to_string(illustrator_names, ' '), '')), 'B') ||
      setweight(to_tsvector('english', coalesce(array_to_string(translator_names, ' '), '')), 'B') ||
      setweight(to_tsvector('english', coalesce(publisher_name, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(genre, '')), 'C') ||
      setweight(to_tsvector('english', coalesce(category, '')), 'C') ||
      setweight(to_tsvector('english', coalesce(language, '')), 'C') ||
      setweight(to_tsvector('english', coalesce(description, '')), 'D')
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_books_search ON books USING GIN(search_tsv);


-- ---------------------------------------------------------------------------
-- JOBS
-- ---------------------------------------------------------------------------
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(employer_name, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(discipline, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(location, '')), 'C') ||
      setweight(to_tsvector('english', coalesce(description, '')), 'D') ||
      setweight(to_tsvector('english', coalesce(requirements, '')), 'D') ||
      setweight(to_tsvector('english', coalesce(benefits, '')), 'D')
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_jobs_search ON jobs USING GIN(search_tsv);


-- ---------------------------------------------------------------------------
-- CONSULTATIONS
-- ---------------------------------------------------------------------------
ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(subject, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(bill_reference, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(council_position, '')), 'C') ||
      setweight(to_tsvector('english', coalesce(body, '')), 'D')
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_consultations_search ON consultations USING GIN(search_tsv);


-- ---------------------------------------------------------------------------
-- RPC: unified_search
--
-- Returns a ranked union of matches across all content types.
-- Query string is processed with websearch_to_tsquery so users can write
-- natural queries like `hello "exact phrase" -excluded`.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION unified_search(q TEXT, lim INT DEFAULT 10)
RETURNS TABLE (
  kind TEXT,
  id INT,
  slug TEXT,
  title TEXT,
  snippet TEXT,
  extra JSONB,
  rank REAL
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  tsq tsquery;
BEGIN
  tsq := websearch_to_tsquery('english', q);

  RETURN QUERY
  (
    SELECT 'post'::TEXT,
           p.id,
           p.slug,
           p.title,
           COALESCE(p.excerpt, LEFT(p.meta_description, 180)) AS snippet,
           jsonb_build_object(
             'category', p.category,
             'published_at', p.published_at
           ) AS extra,
           ts_rank(p.search_tsv, tsq) AS rank
    FROM posts p
    WHERE p.status = 'published' AND p.search_tsv @@ tsq
    ORDER BY rank DESC
    LIMIT lim
  )
  UNION ALL
  (
    SELECT 'event'::TEXT,
           e.id,
           NULL::TEXT AS slug,
           e.title,
           LEFT(COALESCE(e.description, ''), 180) AS snippet,
           jsonb_build_object(
             'event_date', e.event_date,
             'venue', e.venue
           ) AS extra,
           ts_rank(e.search_tsv, tsq) AS rank
    FROM events e
    WHERE e.status <> 'draft' AND e.search_tsv @@ tsq
    ORDER BY rank DESC
    LIMIT lim
  )
  UNION ALL
  (
    SELECT 'book'::TEXT,
           b.id,
           NULL::TEXT AS slug,
           b.title,
           LEFT(COALESCE(b.description, ''), 180) AS snippet,
           jsonb_build_object(
             'authors', b.author_names,
             'language', b.language,
             'category', b.category,
             'cover', b.cover_image_url
           ) AS extra,
           ts_rank(b.search_tsv, tsq) AS rank
    FROM books b
    WHERE b.public = true AND b.search_tsv @@ tsq
    ORDER BY rank DESC
    LIMIT lim
  )
  UNION ALL
  (
    SELECT 'job'::TEXT,
           j.id,
           j.slug,
           j.title,
           LEFT(COALESCE(j.description, ''), 180) AS snippet,
           jsonb_build_object(
             'employer', j.employer_name,
             'location', j.location,
             'discipline', j.discipline,
             'closes_at', j.closes_at
           ) AS extra,
           ts_rank(j.search_tsv, tsq) AS rank
    FROM jobs j
    WHERE j.status = 'open' AND j.approved = true AND j.search_tsv @@ tsq
    ORDER BY rank DESC
    LIMIT lim
  )
  UNION ALL
  (
    SELECT 'consultation'::TEXT,
           c.id,
           c.slug,
           c.title,
           LEFT(COALESCE(c.body, c.subject, ''), 180) AS snippet,
           jsonb_build_object(
             'status', c.status,
             'closes_at', c.closes_at,
             'bill_reference', c.bill_reference
           ) AS extra,
           ts_rank(c.search_tsv, tsq) AS rank
    FROM consultations c
    WHERE c.status IN ('open', 'closed', 'responded') AND c.search_tsv @@ tsq
    ORDER BY rank DESC
    LIMIT lim
  )
  UNION ALL
  (
    SELECT 'page'::TEXT,
           pg.id,
           pg.slug,
           pg.title,
           LEFT(COALESCE(pg.meta_description, ''), 180) AS snippet,
           '{}'::JSONB AS extra,
           ts_rank(pg.search_tsv, tsq) AS rank
    FROM pages pg
    WHERE pg.status = 'published' AND pg.search_tsv @@ tsq
    ORDER BY rank DESC
    LIMIT lim
  )
  ORDER BY rank DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION unified_search(TEXT, INT) TO anon, authenticated;
