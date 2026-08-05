ALTER TABLE company_dossiers ADD COLUMN quality_tier TEXT NOT NULL DEFAULT 'starting_point';
--> statement-breakpoint
ALTER TABLE company_dossiers ADD COLUMN quality_reviewed_at TEXT;
--> statement-breakpoint
ALTER TABLE company_dossiers ADD COLUMN quality_run_id TEXT;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS company_dossier_quality_idx ON company_dossiers(quality_tier,status,updated_at);
--> statement-breakpoint
UPDATE company_dossiers SET quality_tier='machine_enriched' WHERE status='published';
--> statement-breakpoint
UPDATE company_dossiers SET quality_tier='benchmark_complete',quality_reviewed_at=CURRENT_TIMESTAMP,quality_run_id='2026-08-05-complete-benchmark' WHERE ticker IN (SELECT ticker FROM dossier_audit_members WHERE run_id='2026-08-05-complete-benchmark' AND completeness=100);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS dossier_expansion_batches (id TEXT PRIMARY KEY NOT NULL,universe_name TEXT NOT NULL,selection_rule TEXT NOT NULL,target_count INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'planned',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS dossier_expansion_members (batch_id TEXT NOT NULL REFERENCES dossier_expansion_batches(id) ON DELETE CASCADE,ticker TEXT NOT NULL REFERENCES companies(ticker) ON DELETE CASCADE,priority_rank INTEGER NOT NULL,workflow_status TEXT NOT NULL DEFAULT 'research_backlog',source_count INTEGER NOT NULL DEFAULT 0,added_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(batch_id,ticker));
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS dossier_expansion_rank_idx ON dossier_expansion_members(batch_id,priority_rank);
--> statement-breakpoint
INSERT INTO dossier_expansion_batches(id,universe_name,selection_rule,target_count,status) VALUES('russell-2000-market-cap-01','Russell 2000','Active constituents ranked by current stored market capitalization, excluding benchmark-complete dossiers',50,'active') ON CONFLICT(id) DO UPDATE SET selection_rule=excluded.selection_rule,target_count=excluded.target_count,status=excluded.status,updated_at=CURRENT_TIMESTAMP;
--> statement-breakpoint
DELETE FROM dossier_expansion_members WHERE batch_id='russell-2000-market-cap-01';
--> statement-breakpoint
INSERT INTO dossier_expansion_members(batch_id,ticker,priority_rank,workflow_status,source_count) SELECT 'russell-2000-market-cap-01',ranked.ticker,ranked.priority_rank,CASE WHEN ranked.quality_tier='machine_enriched' THEN 'evidence_audit' ELSE 'research_backlog' END,ranked.source_count FROM (SELECT c.ticker,COALESCE(d.quality_tier,'starting_point') AS quality_tier,(SELECT COUNT(*) FROM dossier_sources ds WHERE ds.ticker=c.ticker) AS source_count,ROW_NUMBER() OVER (ORDER BY c.market_cap DESC,c.ticker ASC) AS priority_rank FROM companies c LEFT JOIN company_dossiers d ON d.ticker=c.ticker WHERE c.is_active=1 AND c.listing_scope='listed' AND c.memberships_json LIKE '%Russell 2000%' AND COALESCE(d.quality_tier,'starting_point')<>'benchmark_complete' ORDER BY c.market_cap DESC,c.ticker ASC LIMIT 50) ranked;
--> statement-breakpoint
UPDATE companies SET memberships_json='["Russell 2000","Russell 3000"]',updated_at=CURRENT_TIMESTAMP WHERE ticker IN ('MOG-A','GEF-B','CRD-A','BH-A');
--> statement-breakpoint
UPDATE companies SET name='Better Home & Finance Holding Co',exchange='NASDAQ',cik='0001835856',listing_scope='listed',is_active=1,security_description='Better Home & Finance Holding Co Class A common stock',updated_at=CURRENT_TIMESTAMP WHERE ticker='BETR';
