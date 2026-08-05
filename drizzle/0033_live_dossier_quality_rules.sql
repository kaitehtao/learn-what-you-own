CREATE TABLE IF NOT EXISTS dossier_quality_rules (
  id TEXT PRIMARY KEY NOT NULL,
  label TEXT NOT NULL,
  min_source_count INTEGER NOT NULL CHECK(min_source_count > 0),
  min_verified_claim_count INTEGER NOT NULL CHECK(min_verified_claim_count > 0),
  min_distinct_section_count INTEGER NOT NULL CHECK(min_distinct_section_count > 0),
  min_distinct_claim_type_count INTEGER NOT NULL CHECK(min_distinct_claim_type_count > 0),
  is_active INTEGER NOT NULL DEFAULT 0 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS dossier_quality_active_rule_idx
ON dossier_quality_rules(is_active) WHERE is_active=1;
--> statement-breakpoint
INSERT OR IGNORE INTO dossier_quality_rules
  (id,label,min_source_count,min_verified_claim_count,min_distinct_section_count,min_distinct_claim_type_count,is_active)
VALUES ('evidence-standard-v1','Evidence-led owner dossier standard',5,8,8,2,1);
--> statement-breakpoint
UPDATE dossier_quality_rules SET is_active=1,updated_at=CURRENT_TIMESTAMP
WHERE id='evidence-standard-v1'
  AND NOT EXISTS (SELECT 1 FROM dossier_quality_rules WHERE is_active=1);
--> statement-breakpoint
WITH evidence AS (
  SELECT d.ticker,d.status,
    COUNT(DISTINCT s.url) AS source_count,
    COUNT(DISTINCT CASE WHEN cl.status IN ('verified','published') THEN cl.id END) AS verified_claim_count,
    COUNT(DISTINCT CASE WHEN cl.status IN ('verified','published') THEN cl.section END) AS distinct_section_count,
    COUNT(DISTINCT CASE WHEN cl.status IN ('verified','published') THEN cl.claim_type END) AS distinct_claim_type_count
  FROM company_dossiers d
  LEFT JOIN dossier_sources s ON s.ticker=d.ticker AND s.url LIKE 'https://%'
  LEFT JOIN dossier_claims cl ON cl.ticker=d.ticker
  GROUP BY d.ticker,d.status
), active_rule AS (
  SELECT * FROM dossier_quality_rules WHERE is_active=1 ORDER BY updated_at DESC LIMIT 1
), classified AS (
  SELECT evidence.ticker,CASE
    WHEN evidence.status='published'
      AND evidence.source_count>=active_rule.min_source_count
      AND evidence.verified_claim_count>=active_rule.min_verified_claim_count
      AND evidence.distinct_section_count>=active_rule.min_distinct_section_count
      AND evidence.distinct_claim_type_count>=active_rule.min_distinct_claim_type_count
      THEN 'benchmark_complete'
    WHEN evidence.status='published' AND evidence.source_count>=active_rule.min_source_count AND evidence.verified_claim_count>0
      THEN 'editorial_review'
    WHEN evidence.status='published' THEN 'machine_enriched'
    ELSE 'starting_point'
  END AS quality_tier,(SELECT id FROM active_rule) AS rule_id
  FROM evidence,active_rule
)
UPDATE company_dossiers
SET quality_tier=(SELECT quality_tier FROM classified WHERE classified.ticker=company_dossiers.ticker),
  quality_run_id=(SELECT rule_id FROM classified WHERE classified.ticker=company_dossiers.ticker),
  quality_reviewed_at=CURRENT_TIMESTAMP
WHERE ticker IN (SELECT ticker FROM classified);
