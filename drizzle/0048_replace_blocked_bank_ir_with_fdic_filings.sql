-- Replace automation-blocking issuer pages for FDIC-reporting banks with the
-- exact public regulator documents. The FDIC attachment endpoints below were
-- verified to return the filed PDFs on 2026-08-15.
UPDATE issuer_filing_source_registry
SET active=0,updated_at=CURRENT_TIMESTAMP
WHERE ticker IN ('OZK','PFBC');
--> statement-breakpoint
INSERT INTO issuer_filing_source_registry
  (ticker,source_type,title,url,evidence_date,excerpt,source_authority,active,verified_at)
VALUES
  ('OZK','investor_relations','10-K filed 2026-02-25 (FDIC)','https://securitiesfilings.fdicconnect.fdic.gov/api/instflng/11868/attachment/1','2026-02-25','Official Bank OZK annual report on Form 10-K filed with the Federal Deposit Insurance Corporation.','FDIC Securities Exchange Act Filings',1,'2026-08-15'),
  ('OZK','investor_relations','DEF 14A filed 2026-03-26 (FDIC)','https://securitiesfilings.fdicconnect.fdic.gov/api/instflng/11897/attachment/1','2026-03-26','Official Bank OZK definitive proxy statement filed with the Federal Deposit Insurance Corporation.','FDIC Securities Exchange Act Filings',1,'2026-08-15'),
  ('OZK','investor_relations','10-Q filed 2026-08-05 (FDIC)','https://securitiesfilings.fdicconnect.fdic.gov/api/instflng/11981/attachment/1','2026-08-05','Official Bank OZK quarterly report on Form 10-Q filed with the Federal Deposit Insurance Corporation.','FDIC Securities Exchange Act Filings',1,'2026-08-15'),
  ('PFBC','investor_relations','10-K filed 2026-03-02 (FDIC)','https://securitiesfilings.fdicconnect.fdic.gov/api/instflng/11872/attachment/1','2026-03-02','Official Preferred Bank annual report on Form 10-K filed with the Federal Deposit Insurance Corporation.','FDIC Securities Exchange Act Filings',1,'2026-08-15'),
  ('PFBC','investor_relations','DEF 14A filed 2026-04-13 (FDIC)','https://securitiesfilings.fdicconnect.fdic.gov/api/instflng/11912/attachment/1','2026-04-13','Official Preferred Bank definitive proxy statement filed with the Federal Deposit Insurance Corporation.','FDIC Securities Exchange Act Filings',1,'2026-08-15'),
  ('PFBC','investor_relations','10-Q filed 2026-08-07 (FDIC)','https://securitiesfilings.fdicconnect.fdic.gov/api/instflng/11992/attachment/1','2026-08-07','Official Preferred Bank quarterly report on Form 10-Q filed with the Federal Deposit Insurance Corporation.','FDIC Securities Exchange Act Filings',1,'2026-08-15')
ON CONFLICT(ticker,url) DO UPDATE SET
  source_type=excluded.source_type,
  title=excluded.title,
  evidence_date=excluded.evidence_date,
  excerpt=excluded.excerpt,
  source_authority=excluded.source_authority,
  active=1,
  verified_at=excluded.verified_at,
  updated_at=CURRENT_TIMESTAMP;
--> statement-breakpoint
INSERT OR IGNORE INTO dossier_sources
  (ticker,source_type,title,url,evidence_date,excerpt,verified_at,created_at)
SELECT ticker,source_type,title,url,evidence_date,excerpt,verified_at,CURRENT_TIMESTAMP
FROM issuer_filing_source_registry
WHERE active=1 AND ticker IN ('OZK','PFBC');
--> statement-breakpoint
UPDATE dossier_source_backfill_items
SET status='source_foundation_complete',
    source_count_after=(SELECT COUNT(*) FROM dossier_sources source WHERE source.ticker=dossier_source_backfill_items.ticker),
    facts_import_status=CASE WHEN facts_import_status='error' THEN 'not_applicable_fdic_filer' ELSE facts_import_status END,
    facts_import_detail=CASE WHEN facts_import_status='error' THEN 'Exact FDIC periodic reports replace SEC Company Facts for this FDIC-reporting bank.' ELSE facts_import_detail END,
    error_message='',
    completed_at=COALESCE(completed_at,CURRENT_TIMESTAMP)
WHERE ticker IN ('OZK','PFBC') AND status='partial_evidence';
--> statement-breakpoint
UPDATE dossier_source_backfill_batches
SET success_count=(SELECT COUNT(*) FROM dossier_source_backfill_items item WHERE item.batch_id=dossier_source_backfill_batches.id AND item.status='source_foundation_complete'),
    skipped_count=(SELECT COUNT(*) FROM dossier_source_backfill_items item WHERE item.batch_id=dossier_source_backfill_batches.id AND item.status IN ('no_sec_match','no_supported_filings','partial_evidence')),
    error_count=(SELECT COUNT(*) FROM dossier_source_backfill_items item WHERE item.batch_id=dossier_source_backfill_batches.id AND item.status='error'),
    status=CASE WHEN EXISTS(SELECT 1 FROM dossier_source_backfill_items item WHERE item.batch_id=dossier_source_backfill_batches.id AND item.status IN ('error','no_sec_match','no_supported_filings','partial_evidence')) THEN 'partial' ELSE 'completed' END,
    completed_at=COALESCE(completed_at,CURRENT_TIMESTAMP)
WHERE EXISTS (SELECT 1 FROM dossier_source_backfill_items item WHERE item.batch_id=dossier_source_backfill_batches.id AND item.ticker IN ('OZK','PFBC'));
