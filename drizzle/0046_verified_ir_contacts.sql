-- First verified IR-contact batch. Corporate address and telephone come from
-- SEC submissions; IR emails and the AMD direct IR line come from the cited
-- official company investor-relations contact pages.
INSERT INTO company_contact_profiles
  (ticker,legal_name,street_1,street_2,city,state_or_country,postal_code,telephone,
   investor_relations_url,investor_relations_email,investor_relations_phone,
   sec_source_url,ir_source_url,verified_at)
VALUES
  ('AMC','AMC ENTERTAINMENT HOLDINGS, INC.','ONE AMC WAY','11500 ASH STREET','LEAWOOD','KS','66211','913-213-2000',
   'https://investor.amctheatres.com/','InvestorRelations@amctheatres.com','',
   'https://data.sec.gov/submissions/CIK0001411579.json','https://investor.amctheatres.com/company-information/contacts',CURRENT_TIMESTAMP),
  ('AMD','ADVANCED MICRO DEVICES INC','2485 AUGUSTINE DRIVE','','SANTA CLARA','CA','95054','(408) 749-4000',
   'https://ir.amd.com/','Investor.Relations@amd.com','(408) 749-3124',
   'https://data.sec.gov/submissions/CIK0000002488.json','https://ir.amd.com/contacts',CURRENT_TIMESTAMP),
  ('PLTR','Palantir Technologies Inc.','19505 BISCAYNE BOULEVARD','SUITE 2350','AVENTURA','FL','33180','720-358-3679',
   'https://investors.palantir.com/','investors@palantir.com','',
   'https://data.sec.gov/submissions/CIK0001321655.json','https://investors.palantir.com/resources/contact-ir',CURRENT_TIMESTAMP),
  ('TSLA','Tesla, Inc.','1 TESLA ROAD','','AUSTIN','TX','78725','512-516-8177',
   'https://ir.tesla.com/','ir@tesla.com','',
   'https://data.sec.gov/submissions/CIK0001318605.json','https://ir.tesla.com/contact-us',CURRENT_TIMESTAMP)
ON CONFLICT(ticker) DO UPDATE SET
  legal_name=excluded.legal_name,
  street_1=excluded.street_1,
  street_2=excluded.street_2,
  city=excluded.city,
  state_or_country=excluded.state_or_country,
  postal_code=excluded.postal_code,
  telephone=excluded.telephone,
  investor_relations_url=excluded.investor_relations_url,
  investor_relations_email=excluded.investor_relations_email,
  investor_relations_phone=excluded.investor_relations_phone,
  sec_source_url=excluded.sec_source_url,
  ir_source_url=excluded.ir_source_url,
  verified_at=excluded.verified_at,
  updated_at=CURRENT_TIMESTAMP;
