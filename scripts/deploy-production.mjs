import { run } from "./command.mjs";

const commit = run("git", ["rev-parse", "HEAD"], { capture: true });
const status = run("git", ["status", "--porcelain", "--untracked-files=no"], { capture: true });
if (status) throw new Error("Commit tracked changes before deploying production.");
run("npx", ["wrangler", "deploy", "--config", "dist/server/wrangler.json", "--var", `RELEASE_COMMIT_SHA:${commit}`]);
for (let attempt = 1; attempt <= 6; attempt += 1) {
  try {
    run("node", ["scripts/verify-authority-parity.mjs", "--expected-commit", commit]);
    break;
  } catch (error) {
    if (attempt === 6) throw error;
    console.warn(`Public routes are still propagating; retrying authority verification (${attempt}/6).`);
    await new Promise((resolve) => setTimeout(resolve, 3_000));
  }
}
