-- Extend the source-foundation worker to covered Nasdaq-100 issuers and add a
-- data-driven official-regulator fallback for listed banks whose Exchange Act
-- reports are filed outside EDGAR. URLs below were verified against the
-- issuers' official investor-relations archives on 2026-08-08.
CREATE TABLE IF NOT EXISTS issuer_filing_source_registry (
  ticker TEXT NOT NULL REFERENCES companies(ticker) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK(source_type IN ('sec_filing','sec_company_page','investor_relations')),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  evidence_date TEXT,
  excerpt TEXT NOT NULL DEFAULT '',
  source_authority TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  verified_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(ticker,url)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS issuer_filing_source_registry_active_idx
ON issuer_filing_source_registry(ticker,active,evidence_date);
--> statement-breakpoint
INSERT INTO issuer_filing_source_registry
  (ticker,source_type,title,url,evidence_date,excerpt,source_authority,active,verified_at)
VALUES
  ('OZK','investor_relations','Bank OZK 2025 Form 10-K','https://ir.ozk.com/Form_10K_2025','2026-02-25','Official Bank OZK annual report on Form 10-K filed with the Federal Deposit Insurance Corporation.','Bank OZK investor relations and FDIC',1,'2026-08-08'),
  ('OZK','investor_relations','Bank OZK 2025 Annual Report','https://ir.ozk.com/static-files/e0a9df34-ad64-4d55-9984-9a46e4a2f45f','2026-03-20','Official annual report describing Bank OZK, its financial statements, business, risks, and management discussion.','Bank OZK investor relations',1,'2026-08-08'),
  ('OZK','investor_relations','Bank OZK official filing documents','https://ir.ozk.com/filings/documents?mobile=1&page=6','2026-07-22','Official archive for Bank OZK 10-K, 10-Q, proxy, current reports, and earnings materials filed with the FDIC.','Bank OZK investor relations and FDIC',1,'2026-08-08'),
  ('OZK','investor_relations','Bank OZK second-quarter 2026 earnings','https://ir.ozk.com/news-releases/news-release-details/bank-ozk-announces-second-quarter-2026-earnings','2026-07-21','Official second-quarter 2026 earnings release with reported results and links to management comments and the financial supplement.','Bank OZK investor relations',1,'2026-08-08'),
  ('OZK','investor_relations','Bank OZK first-quarter 2026 earnings','https://ir.ozk.com/news-releases/news-release-details/bank-ozk-announces-first-quarter-2026-earnings','2026-04-21','Official first-quarter 2026 earnings release with reported results and links to management comments and the financial supplement.','Bank OZK investor relations',1,'2026-08-08'),
  ('OZK','investor_relations','Bank OZK 2026 stock-repurchase authorization','https://ir.ozk.com/news-releases/news-release-details/bank-ozk-announces-200-million-stock-repurchase-program','2026-06-29','Official disclosure of the board-authorized 2026 common-stock repurchase program.','Bank OZK investor relations',1,'2026-08-08'),
  ('PFBC','investor_relations','Preferred Bank official company filings','https://preferredbank.q4ir.com/company-filings/default.aspx','2026-05-14','Official archive identifying Preferred Bank annual and quarterly regulatory filings, current reports, earnings releases, and insider filings.','Preferred Bank investor relations and FDIC',1,'2026-08-08'),
  ('PFBC','investor_relations','Preferred Bank first-quarter 2026 results','https://preferredbank.q4ir.com/press-releases/news-details/2026/Preferred-Bank-Reports-First-Quarter-Results/default.aspx','2026-04-22','Official first-quarter 2026 results, including net income, margin, loan and deposit changes, asset quality, and capital actions.','Preferred Bank investor relations',1,'2026-08-08'),
  ('PFBC','investor_relations','Preferred Bank fourth-quarter and full-year 2025 results','https://preferredbank.q4ir.com/press-releases/news-details/2026/Preferred-Bank-Reports-Fourth-Quarter-Results/default.aspx','2026-01-22','Official fourth-quarter and full-year 2025 results with earnings, balance-sheet, asset-quality, and capital-allocation disclosures.','Preferred Bank investor relations',1,'2026-08-08'),
  ('PFBC','investor_relations','Preferred Bank large-loan relationship update','https://preferredbank.q4ir.com/press-releases/news-details/2026/Preferred-Bank-Provides-Update-on-Loan-Relationship/default.aspx','2026-02-23','Official update describing a material loan relationship, nonaccrual classification, and collateral information.','Preferred Bank investor relations',1,'2026-08-08'),
  ('PFBC','investor_relations','Preferred Bank 2026 quarterly dividend','https://preferredbank.q4ir.com/press-releases/news-details/2026/Preferred-Bank-Announces-Quarterly-Dividend-e9dbba124/default.aspx','2026-06-17','Official disclosure of Preferred Bank quarterly dividend and company operating profile.','Preferred Bank investor relations',1,'2026-08-08'),
  ('PFBC','investor_relations','Preferred Bank official press-release archive','https://preferredbank.q4ir.com/press-releases/default.aspx','2026-07-09','Official issuer archive for earnings releases, capital actions, credit updates, and other company announcements.','Preferred Bank investor relations',1,'2026-08-08')
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
WHERE active=1 AND ticker IN ('OZK','PFBC');
--> statement-breakpoint
UPDATE company_dossiers
SET status='published',
    quality_tier=CASE WHEN quality_tier='starting_point' THEN 'machine_enriched' ELSE quality_tier END,
    published_at=COALESCE(published_at,CURRENT_TIMESTAMP),
    updated_at=CURRENT_TIMESTAMP
WHERE ticker IN ('OZK','PFBC')
  AND (SELECT COUNT(DISTINCT source.url) FROM dossier_sources source WHERE source.ticker=company_dossiers.ticker)>=5;
--> statement-breakpoint
UPDATE dossier_expansion_members
SET source_count=(SELECT COUNT(DISTINCT source.url) FROM dossier_sources source WHERE source.ticker=dossier_expansion_members.ticker),
    workflow_status=CASE
      WHEN (SELECT COUNT(DISTINCT source.url) FROM dossier_sources source WHERE source.ticker=dossier_expansion_members.ticker)>=5 THEN 'evidence_ready'
      ELSE workflow_status
    END,
    updated_at=CURRENT_TIMESTAMP
WHERE ticker IN ('OZK','PFBC');
--> statement-breakpoint
INSERT INTO dossier_source_backfill_batches
  (id,universe_name,selection_rule,requested_limit,selected_count,success_count,skipped_count,error_count,source_count_added,status,started_at,completed_at)
VALUES
  ('official-regulator-foundation-20260808','Covered U.S. equities','Verified official issuer or banking-regulator filing sources for listed banks outside the EDGAR periodic-reporting feed.',2,2,2,0,0,12,'completed',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET selected_count=2,success_count=2,skipped_count=0,error_count=0,
  source_count_added=(SELECT COUNT(*) FROM dossier_sources WHERE ticker IN ('OZK','PFBC')),
  status='completed',completed_at=CURRENT_TIMESTAMP;
--> statement-breakpoint
INSERT INTO dossier_source_backfill_items
  (batch_id,ticker,priority_rank,memberships_json,status,source_count_before,source_count_after,facts_import_status,facts_import_detail,error_message,started_at,completed_at)
SELECT 'official-regulator-foundation-20260808',company.ticker,
       CASE company.ticker WHEN 'OZK' THEN 1 ELSE 2 END,
       company.memberships_json,'source_foundation_complete',0,
       (SELECT COUNT(DISTINCT source.url) FROM dossier_sources source WHERE source.ticker=company.ticker),
       'official_regulator_fallback',
       'Periodic reports are filed with the banking regulator and preserved through the verified official issuer archive.',
       '',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
FROM companies company WHERE company.ticker IN ('OZK','PFBC')
ON CONFLICT(batch_id,ticker) DO UPDATE SET status='source_foundation_complete',
  source_count_after=excluded.source_count_after,facts_import_status=excluded.facts_import_status,
  facts_import_detail=excluded.facts_import_detail,error_message='',completed_at=CURRENT_TIMESTAMP;
