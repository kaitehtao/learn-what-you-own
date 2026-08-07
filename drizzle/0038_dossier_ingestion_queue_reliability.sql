CREATE TABLE IF NOT EXISTS dossier_ingestion_locks (
  lock_name TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT NOT NULL,
  lease_until TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS dossier_ingestion_lock_lease_idx
ON dossier_ingestion_locks(lease_until);
--> statement-breakpoint
UPDATE company_dossiers
SET status='queued',published_at=NULL,updated_at=CURRENT_TIMESTAMP
WHERE status='published'
  AND quality_tier IN ('starting_point','machine_enriched')
  AND (SELECT COUNT(*) FROM dossier_sources s WHERE s.ticker=company_dossiers.ticker)<5;
--> statement-breakpoint
UPDATE dossier_expansion_members
SET workflow_status=CASE
    WHEN source_count>0 THEN 'evidence_ingestion'
    ELSE 'research_backlog'
  END,
  updated_at=CURRENT_TIMESTAMP
WHERE ticker IN (
  SELECT d.ticker FROM company_dossiers d
  WHERE d.status='queued' AND d.quality_tier IN ('starting_point','machine_enriched')
);
