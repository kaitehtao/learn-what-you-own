WITH new_sources(ticker,title,source_type,url,evidence_date,excerpt,verified_at) AS (VALUES
('ATO','Atmos Energy 2025 Form 10-K','sec_filing','https://www.sec.gov/Archives/edgar/data/731802/000073180225000056/ato-20250930.htm','2025-11-14','Atmos Energy direct annual filing provides issuer-specific utility, rate-base, capital, financial and risk evidence.','2026-08-05T09:09:00Z'),
('AVB','AvalonBay Communities 2025 Form 10-K','sec_filing','https://www.sec.gov/Archives/edgar/data/915912/000091591226000004/avb-20251231.htm','2026-02-27','AvalonBay direct annual filing provides issuer-specific apartment, development, operating, financial and risk evidence.','2026-08-05T09:09:00Z'),
('AVY','Avery Dennison 2025 Form 10-K','sec_filing','https://www.sec.gov/Archives/edgar/data/8818/000000881826000015/avy-20251231.htm','2026-02-25','Avery Dennison direct annual filing provides issuer-specific materials, solutions, segment, financial and risk evidence.','2026-08-05T09:09:00Z'),
('AWK','American Water Works 2025 Form 10-K','sec_filing','https://www.sec.gov/Archives/edgar/data/1410636/000141063626000034/awk-20251231.htm','2026-02-18','American Water Works direct annual filing provides issuer-specific regulated-water, rate-base, capital, financial and risk evidence.','2026-08-05T09:09:00Z'),
('AXON','Axon Enterprise 2025 Form 10-K','sec_filing','https://www.sec.gov/Archives/edgar/data/1069183/000162828026011360/axon-20251231.htm','2026-02-25','Axon direct annual filing provides issuer-specific devices, software, contracts, financial and risk evidence.','2026-08-05T09:09:00Z'),
('AZO','AutoZone 2025 Form 10-K','sec_filing','https://www.sec.gov/Archives/edgar/data/866787/000110465925102611/azo-20250830x10k.htm','2025-10-27','AutoZone direct annual filing provides issuer-specific stores, commercial sales, inventory, financial and risk evidence.','2026-08-05T09:09:00Z')
)
INSERT INTO dossier_sources (ticker,title,source_type,url,evidence_date,excerpt,verified_at)
SELECT n.ticker,n.title,n.source_type,n.url,n.evidence_date,n.excerpt,n.verified_at
FROM new_sources n
WHERE NOT EXISTS (SELECT 1 FROM dossier_sources d WHERE d.ticker=n.ticker AND d.url=n.url);
