import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDirectoryRoster,
  companyFromDirectoryHit,
  extractAlgoliaOptions,
  validateDirectoryRoster,
} from "../scripts/lib/yc-directory.mjs";

const princeps = {
  name: "PRINCEPS",
  slug: "princeps",
  website: "https://princeps.dev",
  one_liner: "AI-native insurance company for the compute economy",
  long_description: "Purpose-built insurance for compute infrastructure.",
  industry: "Fintech",
  subindustry: "Fintech -> Insurance",
  all_locations: "London, England, United Kingdom",
  team_size: 3,
  status: "Active",
  batch: "Summer 2026",
  tags: ["Artificial Intelligence", "Machine Learning"],
  small_logo_thumb_url: "https://example.com/princeps.png",
};

test("extracts YC's public directory search configuration", () => {
  const options = extractAlgoliaOptions('<script>window.AlgoliaOpts = {"app":"APP","key":"KEY"};</script>');
  assert.deepEqual(options, { app: "APP", key: "KEY" });
});

test("creates a complete starter profile for a newly discovered class member", () => {
  const company = companyFromDirectoryHit(princeps);
  assert.equal(company.slug, "princeps");
  assert.equal(company.ycUrl, "https://www.ycombinator.com/companies/princeps");
  assert.equal(company.industry, "Fintech");
  assert.equal(company.teamSize, 3);
  assert.deepEqual(company.founders, []);
});

test("rebuilds the roster from official hits while retaining enriched profile fields", () => {
  const companies = buildDirectoryRoster([princeps], [{
    slug: "princeps",
    yearFounded: 2026,
    primaryPartner: "Vivian Midha Shen",
    founders: [{ name: "Anya Trofimova" }],
  }]);
  assert.equal(companies.length, 1);
  assert.equal(companies[0].primaryPartner, "Vivian Midha Shen");
  assert.equal(companies[0].founders[0].name, "Anya Trofimova");
});

test("rejects partial, cross-batch, and duplicate directory responses", () => {
  assert.throws(() => validateDirectoryRoster([princeps], { batch: "Summer 2026", previousCount: 174 }), /only 1 companies/);
  const enough = Array.from({ length: 121 }, (_, index) => ({ ...princeps, slug: `company-${index}` }));
  assert.throws(() => validateDirectoryRoster([{ ...enough[0], batch: "Winter 2026" }, ...enough.slice(1)], { batch: "Summer 2026", previousCount: 174 }), /outside Summer 2026/);
  assert.throws(() => validateDirectoryRoster([...enough, enough[0]], { batch: "Summer 2026", previousCount: 174 }), /duplicate slug/);
});
