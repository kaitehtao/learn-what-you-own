import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const projectRoot = process.cwd();
const archive = path.resolve(process.argv[2] || "dist/learn-what-you-own-sites.tgz");
const distRoot = path.join(projectRoot, "dist");
const hostingConfig = path.join(projectRoot, ".openai", "hosting.json");
const sitesHostingConfig = JSON.parse(readFileSync(hostingConfig, "utf8"));
// Cloudflare production needs DB, but the Sites artifact is a redirect-only
// mirror and must not provision or migrate an independent research database.
sitesHostingConfig.d1 = null;

for (const required of [path.join(distRoot, "server", "index.js"), hostingConfig]) {
  if (!existsSync(required)) throw new Error(`Missing required Sites artifact: ${required}`);
}

const stage = mkdtempSync(path.join(os.tmpdir(), "learnwhatyouown-sites-"));
try {
  const stagedDist = path.join(stage, "dist");
  cpSync(distRoot, stagedDist, { recursive: true });

  // The release archive is written inside dist by default. Exclude a prior
  // archive so repeated packaging never nests the previous tarball inside the
  // next one and changes the deployable payload.
  if (archive.startsWith(`${distRoot}${path.sep}`)) {
    rmSync(path.join(stagedDist, path.relative(distRoot, archive)), { force: true });
  }

  const stagedOpenAi = path.join(stagedDist, ".openai");
  mkdirSync(stagedOpenAi, { recursive: true });
  writeFileSync(
    path.join(stagedOpenAi, "hosting.json"),
    `${JSON.stringify(sitesHostingConfig, null, 2)}\n`,
  );

  const stagedDrizzle = path.join(stagedOpenAi, "drizzle");
  rmSync(stagedDrizzle, { recursive: true, force: true });


  mkdirSync(path.dirname(archive), { recursive: true });
  execFileSync("tar", ["-C", stage, "-czf", archive, "dist"]);
  execFileSync(process.execPath, [path.join(projectRoot, "scripts", "verify-sites-archive.mjs"), archive], {
    cwd: projectRoot,
    stdio: "inherit",
  });
  console.log(archive);
} finally {
  rmSync(stage, { recursive: true, force: true });
}
