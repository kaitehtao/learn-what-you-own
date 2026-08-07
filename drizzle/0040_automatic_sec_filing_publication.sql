-- Official SEC filings are primary evidence, not community or editorial prose.
-- Publish the existing filing-detection backlog automatically while preserving
-- its immutable accessions, source URLs, fact-refresh results, and audit dates.
UPDATE dossier_freshness_events
SET status='published',
    reviewed_by=COALESCE(reviewed_by,'system:sec-freshness-backfill'),
    reviewed_at=COALESCE(reviewed_at,detected_at,CURRENT_TIMESTAMP),
    published_at=COALESCE(published_at,detected_at,CURRENT_TIMESTAMP),
    updated_at=CURRENT_TIMESTAMP
WHERE status='editorial_review';

UPDATE company_dossiers
SET updated_at=CURRENT_TIMESTAMP
WHERE EXISTS (
  SELECT 1 FROM dossier_freshness_events e
  WHERE e.ticker=company_dossiers.ticker AND e.status='published'
);
