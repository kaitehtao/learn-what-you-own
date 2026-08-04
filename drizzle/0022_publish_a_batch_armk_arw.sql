-- Portable publication marker for the ten dossiers already loaded into the
-- canonical production D1. Detailed field-level data is retained in
-- scripts/production-data/0022_publish_a_batch_armk_arw_expanded.sql.
--
-- Only columns shared by the original Sites JSON schema and the expanded
-- production schema are used here, allowing this release to replay safely in
-- either environment without destructive table conversion.
INSERT INTO company_dossiers (ticker, status, published_at, updated_at)
VALUES
('ARMK', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ARMP', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('AROC', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('AROW', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ARQT', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ARR', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ARRY', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ARTV', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ARVN', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ARW', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT(ticker) DO UPDATE SET
  status = excluded.status,
  published_at = COALESCE(company_dossiers.published_at, CURRENT_TIMESTAMP),
  updated_at = CURRENT_TIMESTAMP;
