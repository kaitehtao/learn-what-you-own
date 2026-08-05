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
--> statement-breakpoint
INSERT INTO dossier_sources(ticker,source_type,title,url)
SELECT m.ticker,'sec','SEC EDGAR issuer filings',
  'https://www.sec.gov/edgar/browse/?CIK=' || printf('%010d',CAST(c.cik AS INTEGER)) || '&owner=exclude'
FROM dossier_expansion_members m JOIN companies c ON c.ticker=m.ticker
WHERE m.batch_id='russell-2000-market-cap-01' AND c.cik IS NOT NULL AND c.cik<>''
  AND NOT EXISTS(SELECT 1 FROM dossier_sources ds WHERE ds.ticker=m.ticker AND ds.url='https://www.sec.gov/edgar/browse/?CIK=' || printf('%010d',CAST(c.cik AS INTEGER)) || '&owner=exclude');
--> statement-breakpoint
INSERT INTO dossier_sources(ticker,source_type,title,url)
SELECT m.ticker,'sec','Annual reports (10-K)',
  'https://www.sec.gov/edgar/browse/?CIK=' || printf('%010d',CAST(c.cik AS INTEGER)) || '&owner=exclude&action=getcompany&type=10-K'
FROM dossier_expansion_members m JOIN companies c ON c.ticker=m.ticker
WHERE m.batch_id='russell-2000-market-cap-01' AND c.cik IS NOT NULL AND c.cik<>''
  AND NOT EXISTS(SELECT 1 FROM dossier_sources ds WHERE ds.ticker=m.ticker AND ds.url='https://www.sec.gov/edgar/browse/?CIK=' || printf('%010d',CAST(c.cik AS INTEGER)) || '&owner=exclude&action=getcompany&type=10-K');
--> statement-breakpoint
INSERT INTO dossier_sources(ticker,source_type,title,url)
SELECT m.ticker,'sec','Quarterly reports (10-Q)',
  'https://www.sec.gov/edgar/browse/?CIK=' || printf('%010d',CAST(c.cik AS INTEGER)) || '&owner=exclude&action=getcompany&type=10-Q'
FROM dossier_expansion_members m JOIN companies c ON c.ticker=m.ticker
WHERE m.batch_id='russell-2000-market-cap-01' AND c.cik IS NOT NULL AND c.cik<>''
  AND NOT EXISTS(SELECT 1 FROM dossier_sources ds WHERE ds.ticker=m.ticker AND ds.url='https://www.sec.gov/edgar/browse/?CIK=' || printf('%010d',CAST(c.cik AS INTEGER)) || '&owner=exclude&action=getcompany&type=10-Q');
--> statement-breakpoint
INSERT INTO dossier_sources(ticker,source_type,title,url)
SELECT m.ticker,'sec','Material current reports and earnings exhibits (8-K)',
  'https://www.sec.gov/edgar/browse/?CIK=' || printf('%010d',CAST(c.cik AS INTEGER)) || '&owner=exclude&action=getcompany&type=8-K'
FROM dossier_expansion_members m JOIN companies c ON c.ticker=m.ticker
WHERE m.batch_id='russell-2000-market-cap-01' AND c.cik IS NOT NULL AND c.cik<>''
  AND NOT EXISTS(SELECT 1 FROM dossier_sources ds WHERE ds.ticker=m.ticker AND ds.url='https://www.sec.gov/edgar/browse/?CIK=' || printf('%010d',CAST(c.cik AS INTEGER)) || '&owner=exclude&action=getcompany&type=8-K');
--> statement-breakpoint
INSERT INTO dossier_sources(ticker,source_type,title,url)
SELECT m.ticker,'sec','Proxy statements and beneficial ownership (DEF 14A)',
  'https://www.sec.gov/edgar/browse/?CIK=' || printf('%010d',CAST(c.cik AS INTEGER)) || '&owner=exclude&action=getcompany&type=DEF+14A'
FROM dossier_expansion_members m JOIN companies c ON c.ticker=m.ticker
WHERE m.batch_id='russell-2000-market-cap-01' AND c.cik IS NOT NULL AND c.cik<>''
  AND NOT EXISTS(SELECT 1 FROM dossier_sources ds WHERE ds.ticker=m.ticker AND ds.url='https://www.sec.gov/edgar/browse/?CIK=' || printf('%010d',CAST(c.cik AS INTEGER)) || '&owner=exclude&action=getcompany&type=DEF+14A');
--> statement-breakpoint
UPDATE dossier_expansion_members
SET workflow_status='machine_enriched',
    source_count=(SELECT COUNT(*) FROM dossier_sources ds WHERE ds.ticker=dossier_expansion_members.ticker),
    updated_at=CURRENT_TIMESTAMP
WHERE batch_id='russell-2000-market-cap-01';
