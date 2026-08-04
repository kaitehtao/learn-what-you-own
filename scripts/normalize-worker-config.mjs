import { readFile, writeFile } from "node:fs/promises";

const configPath = "dist/server/wrangler.json";
const config = JSON.parse(await readFile(configPath, "utf8"));

// Wrangler 4.114+ removed service environments and rejects the generated
// legacy_env field. vinext still emits it, so normalize only this retired
// setting while leaving routes, bindings, secrets, and scheduled jobs intact.
delete config.legacy_env;

await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
console.log("Normalized generated Worker configuration for current Wrangler.");
