import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { featuredDossiers } from "../app/data/featuredDossiers";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("long-form research remains private until an editor approves it", () => {
  const memberRoute = read("app/api/publications/route.ts");
  const adminRoute = read("app/api/admin/publications/route.ts");
  const migration = read("supabase/migrations/20260805010000_long_form_research_publishing.sql");
  assert.match(memberRoute, /status: "draft"/);
  assert.doesNotMatch(memberRoute, /status: publish \? "published"/);
  assert.match(adminRoute, /status: approved \? "published" : "draft"/);
  assert.match(memberRoute, /source_note_id: sourceNoteId/);
  assert.match(migration, /revoke all on public\.research_publications[\s\S]+from public, anon, authenticated/);
  assert.match(migration, /Editorial approval does not automatically promote claims into the D1 dossier registry/);
});

test("community safety records are server-only and enforced before messaging and following", () => {
  const migration = read("supabase/migrations/20260805011000_community_safety_records.sql");
  const messages = read("app/api/messages/route.ts");
  const follows = read("app/api/follows/route.ts");
  const safety = read("app/api/safety/route.ts");
  assert.match(migration, /revoke all on public\.member_blocks[\s\S]+from public, anon, authenticated/);
  assert.match(messages, /membersBlocked/);
  assert.match(messages, /enforceActionRateLimit/);
  assert.match(follows, /Following is unavailable between these accounts/);
  assert.match(safety, /member_follows/);
  assert.match(safety, /community_reports/);
});

test("member portability includes publications, safety records, and Markdown research", () => {
  const route = read("app/api/account/export/route.ts");
  const documentation = read("docs/PRODUCTION_BACKUP_AND_RECOVERY.md");
  for (const name of ["researchPublications", "researchPublicationRevisions", "researchBookmarks", "researchComments", "blocks", "mutes", "communityReports"]) assert.match(route, new RegExp(name));
  assert.match(route, /get\("format"\) === "markdown"/);
  assert.match(route, /Source URL:/);
  assert.match(documentation, /Recovery point objective/);
  assert.match(documentation, /disposable, non-production Supabase database/);
});

test("generated D1 registry migrations cover every completed ticker dossier exactly once", () => {
  const files = readdirSync(new URL("../drizzle", import.meta.url)).filter(name => /^002[5-9]_complete_dossier_registry_\d+\.sql$/.test(name)).sort();
  assert.equal(files.length, 5);
  const combined = files.map(name => read(`drizzle/${name}`)).join("\n");
  const tickers = [...combined.matchAll(/INSERT INTO dossier_audit_members/g)];
  assert.equal(tickers.length, Object.keys(featuredDossiers).length);
  assert.match(combined, /Complete evidence-led ownership dossier benchmark/);
  assert.doesNotMatch(combined, /INSERT INTO (?:company_dossiers|dossier_sources|dossier_claims|research_companies)/);
  assert.equal([...combined.matchAll(/INSERT INTO dossier_audit_members/g)].length, Object.keys(featuredDossiers).length);
  for (const ticker of Object.keys(featuredDossiers)) assert.equal((combined.match(new RegExp(`'2026-08-05-complete-benchmark','${ticker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}'`, "g")) ?? []).length, 1, `${ticker} should have one canonical audit record`);
});

test("live dossier completion is reconciled from database evidence instead of legacy tickers", () => {
  const quality = read("app/data/dossierQuality.ts");
  const migration = read("drizzle/0033_live_dossier_quality_rules.sql");
  const universe = read("app/api/universe/route.ts");
  assert.match(quality, /COUNT\(DISTINCT s\.url\)/);
  assert.match(quality, /COUNT\(DISTINCT CASE WHEN cl\.status IN \('verified','published'\)/);
  assert.match(quality, /activeDossierQualityRule/);
  assert.doesNotMatch(quality, /2026-08-05-complete-benchmark/);
  assert.doesNotMatch(quality, /WHERE ticker IN \('/);
  assert.match(migration, /dossier_quality_rules/);
  assert.doesNotMatch(migration, /ONDS|AAP|AAMI|AMC|FCEL|AAT|ABAT/);
  assert.match(universe, /qualityRule/);
});
