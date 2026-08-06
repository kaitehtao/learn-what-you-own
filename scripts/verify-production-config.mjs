import { readFile } from "node:fs/promises";

const config = JSON.parse(await readFile("dist/server/wrangler.json", "utf8"));
const expectedRoutes = new Set(["learnwhatyouown.com/*", "www.learnwhatyouown.com/*"]);
if (config.name !== "learn-what-you-own") throw new Error(`Worker name must be learn-what-you-own, received ${config.name}.`);
const database = config.d1_databases?.find((binding) => binding.binding === "DB");
if (database?.database_id !== "8c2f7a1b-aa6e-45be-8e89-8c64bb0be557") throw new Error("D1 binding does not match the production database.");
if (!config.routes?.every((route) => expectedRoutes.has(route.pattern)) || config.routes.length !== expectedRoutes.size) throw new Error("Production routes are incomplete or unexpected.");
const crons = new Set(config.triggers?.crons ?? []);
for (const cron of ["2-59/5 * * * *", "*/15 * * * *", "0 0,6,12,18 * * *", "0 15,16 * * *"]) if (!crons.has(cron)) throw new Error(`Missing scheduled trigger: ${cron}`);
console.log("Production Worker configuration is canonical.");
