import { execFileSync } from "node:child_process";

const expectedCommitFlag = process.argv.indexOf("--expected-commit");
const expectedCommit = expectedCommitFlag >= 0
  ? process.argv[expectedCommitFlag + 1]
  : execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (!/^[0-9a-f]{40}$/.test(expectedCommit ?? "")) throw new Error("Expected a full 40-character Git commit SHA.");

const endpoints = {
  apex: "https://learnwhatyouown.com/api/site-stats",
  www: "https://www.learnwhatyouown.com/api/site-stats",
  worker: "https://learn-what-you-own.kaitehtao.workers.dev/api/site-stats",
};

const cacheBuster = Date.now();
const results = await Promise.all(Object.entries(endpoints).map(async ([name, endpoint]) => {
  const response = await fetch(`${endpoint}?authority-check=${cacheBuster}`, {
    headers: { accept: "application/json", "cache-control": "no-cache" },
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`${name} authority check failed with HTTP ${response.status}.`);
  const payload = await response.json();
  const { checkedAt: _checkedAt, ...stable } = payload;
  return { name, endpoint, finalUrl: response.url, payload, stable: JSON.stringify(stable) };
}));

const baseline = results[0];
for (const result of results) {
  if (result.stable !== baseline.stable) {
    throw new Error(`${result.name} does not match ${baseline.name}; production is reading more than one data authority.`);
  }
  if (result.payload.releaseCommit !== expectedCommit) {
    throw new Error(`${result.name} reports release ${result.payload.releaseCommit ?? "missing"}, expected ${expectedCommit}.`);
  }
}

const stats = baseline.payload;
if (!(stats.researchableSymbols > 0 && stats.publishedDossiers > 0 && stats.publishedClaims > 0)) {
  throw new Error("Authority check returned an implausibly empty production dataset.");
}

console.log(`Authority parity verified at ${expectedCommit}: ${stats.researchableSymbols} symbols, ${stats.publishedDossiers} dossiers, ${stats.publishedClaims} claims.`);
