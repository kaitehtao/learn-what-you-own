import { run } from "./command.mjs";

const commit = run("git", ["rev-parse", "HEAD"], { capture: true });
const status = run("git", ["status", "--porcelain", "--untracked-files=no"], { capture: true });
if (status) throw new Error("Commit tracked changes before deploying production.");
run("npx", ["wrangler", "deploy", "--config", "dist/server/wrangler.json", "--var", `RELEASE_COMMIT_SHA:${commit}`]);
