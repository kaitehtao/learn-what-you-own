import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const projectRoot = process.cwd();
const archive = path.resolve(process.argv[2] || "dist/learn-what-you-own-sites.tgz");
const distRoot = path.join(projectRoot, "dist");
const hostingConfig = path.join(projectRoot, ".openai", "hosting.json");

for (const required of [path.join(distRoot, "server", "index.js"), hostingConfig]) {
  if (!existsSync(required)) throw new Error(`Missing required Sites artifact: ${required}`);
}

const stage = mkdtempSync(path.join(os.tmpdir(), "learnwhatyouown-sites-"));
try {
  const stagedDist = path.join(stage, "dist");
  cpSync(distRoot, stagedDist, { recursive: true });

  const stagedOpenAi = path.join(stagedDist, ".openai");
  mkdirSync(stagedOpenAi, { recursive: true });
  cpSync(hostingConfig, path.join(stagedOpenAi, "hosting.json"));

  const stagedDrizzle = path.join(stagedOpenAi, "drizzle");
  rmSync(stagedDrizzle, { recursive: true, force: true });

  const trackedDrizzleFiles = execFileSync("git", ["ls-files", "--", "drizzle"], {
    cwd: projectRoot,
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean);

  for (const relativeFile of trackedDrizzleFiles) {
    const destination = path.join(stagedOpenAi, relativeFile);
    mkdirSync(path.dirname(destination), { recursive: true });
    cpSync(path.join(projectRoot, relativeFile), destination);
  }

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
