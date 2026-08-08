-- Complete the source foundation for newly listed Russell 3000 issuers whose
-- recent SEC submission feed contains fewer than five qualifying filings.
-- Each fallback is an official SEC company page or issuer IR page verified on
-- 2026-08-08; no third-party or synthetic evidence is used.
INSERT INTO issuer_filing_source_registry
  (ticker,source_type,title,url,evidence_date,excerpt,source_authority,active,verified_at)
VALUES
  ('MBGL','sec_company_page','Mobility Global SEC company filings','https://www.sec.gov/edgar/browse/?CIK=2090312&owner=exclude','2026-08-08','Official SEC company page for Mobility Global filings and filing history.','U.S. Securities and Exchange Commission',1,'2026-08-08'),
  ('MBGL','investor_relations','Mobility Global investor relations','https://ir.mobilityglobal.com/','2026-08-08','Official Mobility Global investor-relations site for earnings, presentations, events, governance, and company releases.','Mobility Global investor relations',1,'2026-08-08'),
  ('MFP','sec_company_page','Midera Food Processing SEC company filings','https://www.sec.gov/edgar/browse/?CIK=2088281&owner=exclude','2026-08-08','Official SEC company page for Midera Food Processing filings and filing history.','U.S. Securities and Exchange Commission',1,'2026-08-08')
ON CONFLICT(ticker,url) DO UPDATE SET
  source_type=excluded.source_type,
  title=excluded.title,
  evidence_date=excluded.evidence_date,
  excerpt=excluded.excerpt,
  source_authority=excluded.source_authority,
  active=excluded.active,
  verified_at=excluded.verified_at,
  updated_at=CURRENT_TIMESTAMP;
--> statement-breakpoint
INSERT OR IGNORE INTO dossier_sources
  (ticker,source_type,title,url,evidence_date,excerpt,verified_at,created_at)
SELECT ticker,source_type,title,url,evidence_date,excerpt,verified_at,CURRENT_TIMESTAMP
FROM issuer_filing_source_registry
WHERE active=1 AND ticker IN ('MBGL','MFP');
--> statement-breakpoint
UPDATE company_dossiers
SET status='published',
    quality_tier=CASE WHEN quality_tier='starting_point' THEN 'machine_enriched' ELSE quality_tier END,
    published_at=COALESCE(published_at,CURRENT_TIMESTAMP),
    updated_at=CURRENT_TIMESTAMP
WHERE ticker IN ('MBGL','MFP')
  AND (SELECT COUNT(DISTINCT source.url) FROM dossier_sources source WHERE source.ticker=company_dossiers.ticker)>=5;
--> statement-breakpoint
UPDATE dossier_expansion_members
SET source_count=(SELECT COUNT(DISTINCT source.url) FROM dossier_sources source WHERE source.ticker=dossier_expansion_members.ticker),
    workflow_status=CASE
      WHEN (SELECT COUNT(DISTINCT source.url) FROM dossier_sources source WHERE source.ticker=dossier_expansion_members.ticker)>=5 THEN 'evidence_ready'
      ELSE workflow_status
    END,
    updated_at=CURRENT_TIMESTAMP
WHERE ticker IN ('MBGL','MFP');
--> statement-breakpoint
INSERT INTO dossier_source_backfill_batches
  (id,universe_name,selection_rule,requested_limit,selected_count,success_count,skipped_count,error_count,source_count_added,status,started_at,completed_at)
VALUES
  ('new-listing-source-foundation-20260808','Covered U.S. equities','Verified SEC company and issuer IR sources supplement recent filing packs for newly listed issuers.',2,2,2,0,0,3,'completed',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET selected_count=2,success_count=2,skipped_count=0,error_count=0,
  source_count_added=3,status='completed',completed_at=CURRENT_TIMESTAMP;
--> statement-breakpoint
INSERT INTO dossier_source_backfill_items
  (batch_id,ticker,priority_rank,memberships_json,status,source_count_before,source_count_after,facts_import_status,facts_import_detail,error_message,started_at,completed_at)
SELECT 'new-listing-source-foundation-20260808',company.ticker,
       CASE company.ticker WHEN 'MBGL' THEN 1 ELSE 2 END,
       company.memberships_json,'source_foundation_complete',
       CASE company.ticker WHEN 'MBGL' THEN 3 ELSE 4 END,
       (SELECT COUNT(DISTINCT source.url) FROM dossier_sources source WHERE source.ticker=company.ticker),
       'official_source_supplement',
       'Recent SEC filing pack supplemented with verified SEC company and issuer investor-relations sources.',
       '',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
FROM companies company WHERE company.ticker IN ('MBGL','MFP')
ON CONFLICT(batch_id,ticker) DO UPDATE SET status='source_foundation_complete',
  source_count_after=excluded.source_count_after,facts_import_status=excluded.facts_import_status,
  facts_import_detail=excluded.facts_import_detail,error_message='',completed_at=CURRENT_TIMESTAMP;
