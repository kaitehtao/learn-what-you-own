UPDATE dossier_expansion_batches
SET selection_rule='Active constituents ranked by the latest available Nasdaq market capitalization; null values sort last. Rank refreshes automatically and ticker breaks ties.',
    status='in_progress',updated_at=CURRENT_TIMESTAMP
WHERE id='russell-2000-market-cap-01';
--> statement-breakpoint
INSERT INTO company_dossiers(ticker,status,quality_tier,quality_run_id,published_at,updated_at)
SELECT m.ticker,'published','machine_enriched',m.batch_id,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
FROM dossier_expansion_members m
WHERE m.batch_id='russell-2000-market-cap-01'
ON CONFLICT(ticker) DO UPDATE SET
  status=CASE WHEN company_dossiers.status='published' THEN company_dossiers.status ELSE 'published' END,
  quality_tier=CASE
    WHEN company_dossiers.quality_tier IN ('benchmark_complete','editorial_review') THEN company_dossiers.quality_tier
    ELSE 'machine_enriched'
  END,
  quality_run_id=COALESCE(company_dossiers.quality_run_id,excluded.quality_run_id),
  published_at=COALESCE(company_dossiers.published_at,CURRENT_TIMESTAMP),
  updated_at=CURRENT_TIMESTAMP;
