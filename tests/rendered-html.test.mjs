import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("keeps filed facts, editorial claims, and company relationships as separate public records", async () => {
  const [schema, migration] = await Promise.all([
    source("db/schema.ts"),
    source("drizzle/0002_polite_betty_brant.sql"),
  ]);

  assert.match(schema, /export const filingFacts/);
  assert.match(schema, /export const dossierClaims/);
  assert.match(schema, /export const companyRelationships/);
  assert.match(schema, /"verified_fact", "company_statement", "editorial_analysis"/);
  assert.match(schema, /supplierTicker/);
  assert.match(schema, /customerTicker/);
  assert.match(migration, /CREATE TABLE `filing_facts`/);
  assert.match(migration, /CREATE TABLE `company_relationships`/);
  assert.match(migration, /company_relationship_contribution_idx/);
});

test("publishes only moderated relationship research to the D1 graph", async () => {
  const [publicResearchRoute, moderationRoute, contributionRoute, supabaseMigration] = await Promise.all([
    source("app/api/research/route.ts"),
    source("app/api/admin/contributions/route.ts"),
    source("app/api/contributions/route.ts"),
    source("supabase/migrations/20260731010000_relationship_contributions.sql"),
  ]);

  assert.match(publicResearchRoute, /companyRelationships/);
  assert.match(publicResearchRoute, /dossierClaims\.status, "published"/);
  assert.match(moderationRoute, /payload\.status === "approved"/);
  assert.match(moderationRoute, /publishRelationship/);
  assert.match(contributionRoute, /Supplier \/ customer relationship/);
  assert.match(supabaseMigration, /relationship_direction/);
  assert.match(supabaseMigration, /supplier_to_company/);
  assert.match(supabaseMigration, /company_to_customer/);
});

test("renders the research foundation on featured, starter, and ONDS dossier pages", async () => {
  const [panel, featured, starter, ondas] = await Promise.all([
    source("app/ResearchFoundationPanel.tsx"),
    source("app/FeaturedCompanyDossier.tsx"),
    source("app/company/[ticker]/page.tsx"),
    source("app/company/onds/page.tsx"),
  ]);

  assert.match(panel, /PUBLIC FILING FACTS/);
  assert.match(panel, /BUSINESS RELATIONSHIP GRAPH/);
  assert.match(panel, /relatedTicker[\s\S]*\/company\//);
  assert.match(featured, /<ResearchFoundationPanel/);
  assert.match(starter, /<ResearchFoundationPanel/);
  assert.match(ondas, /<ResearchFoundationPanel/);
});

test("locks the first A batch to ten alphabetical, SEC-sourced dossiers", async () => {
  const [claims, importRoute] = await Promise.all([
    source("app/data/curatedDossierClaims.ts"),
    source("app/api/admin/research/import/route.ts"),
  ]);

  assert.match(claims, /firstAlphabeticalABatch = \["A", "AA", "AAL", "AAMI", "AAOI", "AAON", "AAP", "AAPL", "AAT", "ABAT"\]/);
  assert.equal((claims.match(/sourceUrl: "https:\/\/www\.sec\.gov\/Archives\/edgar\/data\//g) ?? []).length, 10);
  assert.equal((claims.match(/\n    filingType: "10-K"/g) ?? []).length, 10);
  assert.equal((claims.match(/\{ section: "business_model"/g) ?? []).length, 10);
  assert.equal((claims.match(/\{ section: "segments"/g) ?? []).length, 10);
  assert.equal((claims.match(/\{ section: "revenue_drivers"/g) ?? []).length, 10);
  assert.equal((claims.match(/\{ section: "risk_factors"/g) ?? []).length, 10);
  assert.equal((claims.match(/\{ section: "owner_watchlist"/g) ?? []).length, 10);
  assert.equal((claims.match(/whyItMatters:/g) ?? []).length, 51);
  assert.equal((claims.match(/sourceExcerpt:/g) ?? []).length, 51);

  assert.match(importRoute, /sourceHostname !== "sec\.gov"/);
  assert.match(importRoute, /db\.insert\(companyDossiers\)/);
  assert.match(importRoute, /db\.insert\(dossierSources\)/);
  assert.match(importRoute, /db\.insert\(dossierClaims\)/);
  assert.match(importRoute, /dossierStatus: dossier \? "published" : "facts-only"/);
});
